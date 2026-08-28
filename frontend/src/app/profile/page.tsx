"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api'; 
import Link from 'next/link';

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
        setMessage({ type: 'success', text: 'TẢI ẢNH ĐẠI DIỆN LÊN CLOUDINARY THÀNH CÔNG!' });
        
        // ⚡ Gọi updateUser để cập nhật ngay lập tức vào AuthContext và Header
        updateUser({ avatarUrl: imageUrl });
      } catch (err: any) {
        setMessage({ type: 'error', text: err.response?.data?.message || 'Không thể tải ảnh lên server.' });
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
    
    if (formData.phone && !/^\d+$/.test(formData.phone)) {
      setMessage({ type: 'error', text: 'LỖI: SỐ ĐIỆN THOẠI CHỈ ĐƯỢC NHẬP CÁC CHỮ SỐ!' });
      return;
    }
    if (formData.cccd && !/^\d+$/.test(formData.cccd)) {
      setMessage({ type: 'error', text: 'LỖI: CCCD CHỈ ĐƯỢC NHẬP CÁC CHỮ SỐ!' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await api.patch(`/users/${targetId}`, formData);

      setMessage({ type: 'success', text: 'CẬP NHẬT THÔNG TIN THÀNH CÔNG!' });
      
      const updatedUser = res.data.data || res.data.user || res.data;
      
      // ⚡ Đồng bộ thông tin profile mới vào AuthContext
      updateUser(updatedUser);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Đã có lỗi xảy ra.' });
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
        <h1 className="text-2xl md:text-4xl font-bold uppercase tracking-wider text-[#111]">
          THÔNG TIN TÀI KHOẢN
        </h1>
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-10">
        
        {message.text && (
          <div className={`mb-8 p-4 text-xs font-bold uppercase tracking-wider text-center rounded-none border ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="flex flex-col gap-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#f8f8f8] border border-gray-200 p-6 rounded-none">
            
            <div className="flex flex-col gap-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Ảnh đại diện</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-black text-white rounded-none flex items-center justify-center font-black text-lg overflow-hidden border border-gray-300 flex-shrink-0">
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
                  <label className="cursor-pointer bg-black text-white text-[11px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-none text-center hover:bg-gray-800 transition shadow-sm">
                    {uploadingImage ? 'ĐANG XỬ LÝ...' : 'CHỌN ẢNH TỪ MÁY'}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden" 
                    />
                  </label>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">Hỗ trợ định dạng JPG, PNG</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Điểm thành viên QUOCÉ CLUB</label>
              <div className="bg-white border border-gray-300 px-4 py-3.5 rounded-none flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-black">HẠNG THÀNH VIÊN</span>
                <span className="text-xs font-black uppercase tracking-widest bg-black text-white px-3 py-1 rounded-none">
                  {user?.loyaltyPoints || 0} ĐIỂM ⚡
                </span>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Email đăng nhập</label>
              <input 
                type="email" 
                disabled
                value={user?.email || ''}
                className="w-full bg-gray-100 border border-gray-300 text-gray-500 text-xs font-medium px-4 py-3.5 rounded-none cursor-not-allowed"
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
                className="w-full bg-white border border-gray-300 text-black text-xs font-medium px-4 py-3.5 rounded-none focus:outline-none focus:border-black transition uppercase"
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
                className="w-full bg-white border border-gray-300 text-black text-xs font-bold uppercase tracking-wider px-4 py-3.5 rounded-none focus:outline-none focus:border-black transition cursor-pointer"
              >
                <option value="">CHỌN GIỚI TÍNH</option>
                <option value="NAM">NAM</option>
                <option value="NU">NỮ</option>
                <option value="KHAC">KHÁC</option>
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

          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Địa chỉ giao hàng</label>
            <input 
              type="text" 
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="VD: 123 Nguyễn Văn Bảo, Phường 4, Gò Vấp, TP.HCM"
              className="w-full bg-white border border-gray-300 text-black text-xs font-medium px-4 py-3.5 rounded-none focus:outline-none focus:border-black transition uppercase"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              className={`w-full md:w-auto px-10 py-4 rounded-none text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-md ${
                saving 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-black text-white hover:bg-gray-900'
              }`}
            >
              {saving ? 'ĐANG LƯU THAY ĐỔI...' : 'LƯU THÔNG TIN TÀI KHOẢN'}
            </button>
          </div>

        </form>

      </div>

    </div>
  );
}
