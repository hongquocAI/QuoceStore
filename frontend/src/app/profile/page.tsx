"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api, getApiErrorMessage } from '@/lib/api';

export default function ProfilePage() {
  // ⚡ Lấy thêm hàm updateUser từ AuthContext để đồng bộ state thời gian thực
  const { user, loading: authLoading, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    cccd: '',
    gender: '',
    dateOfBirth: '',
    avatarUrl: '',
  });

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const getFullImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
      return url;
    }
    const backendBase = 'http://localhost:5000';
    return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  useEffect(() => {
    const loadUserData = async () => {
      let targetId = user?.id;
      if (!targetId) {
        const localUserStr = localStorage.getItem('user');
        if (localUserStr) {
          try { targetId = JSON.parse(localUserStr).id; } catch (e) {}
        }
      }

      if (targetId) {
        try {
          const res = await api.get(`/users/${targetId}`);
          const freshUser = res.data.data || res.data.user || res.data;

          let formattedDob = '';
          if (freshUser.dateOfBirth) {
            formattedDob = freshUser.dateOfBirth.split('T')[0];
          }

          setFormData({
            fullName: freshUser.fullName || '',
            phone: freshUser.phone || '',
            address: freshUser.address || '',
            cccd: freshUser.cccd || '',
            gender: freshUser.gender || '',
            dateOfBirth: formattedDob,
            avatarUrl: freshUser.avatarUrl || '',
          });
        } catch (err) {
          console.error("Lỗi tải thông tin hồ sơ từ database:", err);
        }
      }
    };

    loadUserData();
  }, [user?.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      let targetId = user?.id;
      if (!targetId) {
        const localUserStr = localStorage.getItem('user');
        if (localUserStr) {
          try { targetId = JSON.parse(localUserStr).id; } catch (e) {}
        }
      }
      if (!targetId) return;

      setUploadingImage(true);
      setMessage({ type: '', text: '' });

      const uploadData = new FormData();
      uploadData.append('file', file);

      try {
        const res = await api.patch(`/users/${targetId}/avatar`, uploadData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const updatedUserResponse = res.data.data || res.data;
        const imageUrl = updatedUserResponse.avatarUrl || res.data.url;

        setFormData(prev => ({ ...prev, avatarUrl: imageUrl }));
        setMessage({ type: 'success', text: 'Tải ảnh đại diện thành công!' });

        // ⚡ Gọi updateUser để cập nhật ngay lập tức vào AuthContext và Header
        updateUser({ avatarUrl: imageUrl });
      } catch (err: any) {
        setMessage({ type: 'error', text: getApiErrorMessage(err, 'Không thể tải ảnh lên server.') });
      } finally {
        setUploadingImage(false);
      }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    let targetId = user?.id;
    if (!targetId) {
      const localUserStr = localStorage.getItem('user');
      if (localUserStr) {
        try { targetId = JSON.parse(localUserStr).id; } catch (e) {}
      }
    }
    if (!targetId) return;

    if (formData.phone && !/^0\d{9}$/.test(formData.phone)) {
      setMessage({ type: 'error', text: 'Số điện thoại phải đúng định dạng di động Việt Nam (10 số, bắt đầu bằng 0).' });
      return;
    }
    if (formData.cccd && !/^(\d{9}|\d{12})$/.test(formData.cccd)) {
      setMessage({ type: 'error', text: 'CCCD/CMND phải gồm đúng 9 hoặc 12 chữ số.' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    // 🛡️ FIX (Bug lưu hồ sơ luôn 400): build payload TƯỜNG MINH chỉ đúng 6
    // field UpdateProfileDto chấp nhận — trước đây gửi nguyên formData, dính
    // avatarUrl (không có trong DTO, forbidNonWhitelisted chặn) VÀ mọi field
    // để trống dạng '' (class-validator @IsOptional() chỉ bỏ qua null/
    // undefined, KHÔNG bỏ qua chuỗi rỗng — '' vẫn bị @Matches/@IsEnum từ chối).
    // Không dùng destructuring loại avatarUrl ra vì sẽ rò field mới nếu
    // formData thêm khóa sau này — map tường minh đúng bài học CLAUDE.md.
    const payload: Record<string, string> = {};
    if (formData.fullName) payload.fullName = formData.fullName;
    if (formData.phone) payload.phone = formData.phone;
    if (formData.address) payload.address = formData.address;
    if (formData.cccd) payload.cccd = formData.cccd;
    if (formData.gender) payload.gender = formData.gender;
    if (formData.dateOfBirth) payload.dateOfBirth = formData.dateOfBirth;

    try {
      const res = await api.patch(`/users/${targetId}`, payload);

      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });

      const updatedUser = res.data.data || res.data.user || res.data;

      // ⚡ Đồng bộ thông tin profile mới vào AuthContext
      updateUser(updatedUser);
    } catch (err: any) {
      setMessage({ type: 'error', text: getApiErrorMessage(err, 'Đã có lỗi xảy ra.') });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-[70vh] bg-white text-[#111]">
        <span className="tracking-[0.3em] text-xs uppercase font-bold antialiased animate-pulse">ĐANG TẢI THÔNG TIN...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#111] font-sans antialiased pb-28">

      <div className="max-w-4xl mx-auto px-6 pt-12 pb-8 border-b border-gray-200">
        <h1 className="text-2xl md:text-4xl font-black uppercase tracking-[0.2em] text-[#111]">
          Thông tin tài khoản
        </h1>
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-8">

        {message.text && (
          <div className={`mb-8 p-3 text-[11px] font-bold uppercase tracking-wider text-center whitespace-pre-line rounded-none border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="flex flex-col gap-8">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white border border-gray-200 rounded-none p-6">

            <div className="flex flex-col gap-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Ảnh đại diện</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-black text-white rounded-none flex items-center justify-center font-black text-lg overflow-hidden flex-shrink-0 border border-black">
                  {formData.avatarUrl ? (
                    <img
                      src={getFullImageUrl(formData.avatarUrl)}
                      alt="Avatar"
                      className="w-full h-full object-cover rounded-none"
                    />
                  ) : (
                    <span>{formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 'U'}</span>
                  )}
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <label className="cursor-pointer bg-black text-white text-[11px] uppercase tracking-widest font-bold px-4 py-3 rounded-none text-center hover:bg-gray-800 transition">
                    {uploadingImage ? 'ĐANG XỬ LÝ...' : 'CHỌN ẢNH TỪ MÁY'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Hỗ trợ JPG, PNG</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Điểm thành viên QUOCÉ Club</label>
              <div className="border border-gray-200 rounded-none px-4 py-3.5 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-gray-900">Hạng thành viên</span>
                <span className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-3 py-1.5 rounded-none">
                  {user?.loyaltyPoints || 0} ĐIỂM
                </span>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-gray-200 rounded-none p-6">

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Email đăng nhập</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full bg-gray-100 border border-gray-200 text-gray-500 text-xs font-medium px-4 py-3.5 rounded-none cursor-not-allowed"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Họ và tên</label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="w-full bg-white border border-gray-300 text-black text-xs font-medium px-4 py-3.5 rounded-none focus:outline-none focus:border-black transition"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Số điện thoại</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="VD: 0912345678"
                className="w-full bg-white border border-gray-300 text-black text-xs font-medium px-4 py-3.5 rounded-none focus:outline-none focus:border-black transition"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Căn cước công dân (CCCD)</label>
              <input
                type="text"
                name="cccd"
                value={formData.cccd}
                onChange={handleChange}
                placeholder="Số CCCD / CMND"
                className="w-full bg-white border border-gray-300 text-black text-xs font-medium px-4 py-3.5 rounded-none focus:outline-none focus:border-black transition"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Giới tính</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full bg-white border border-gray-300 text-black text-xs font-medium px-4 py-3.5 rounded-none focus:outline-none focus:border-black transition cursor-pointer"
              >
                <option value="">Chọn giới tính</option>
                <option value="NAM">Nam</option>
                <option value="NU">Nữ</option>
                <option value="KHAC">Khác</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Ngày sinh</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full bg-white border border-gray-300 text-black text-xs font-medium px-4 py-3.5 rounded-none focus:outline-none focus:border-black transition"
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Địa chỉ giao hàng</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="VD: 123 Nguyễn Văn Bảo, Phường 4, Gò Vấp, TP.HCM"
                className="w-full bg-white border border-gray-300 text-black text-xs font-medium px-4 py-3.5 rounded-none focus:outline-none focus:border-black transition"
              />
            </div>

          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full md:w-auto px-10 py-4 rounded-none text-xs font-bold uppercase tracking-[0.2em] transition bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'ĐANG LƯU...' : 'LƯU THÔNG TIN'}
            </button>
          </div>

        </form>

      </div>

    </div>
  );
}
