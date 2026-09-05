"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, getApiErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Address } from '@/types';
import ConfirmModal from '@/components/common/ConfirmModal';

interface AddressFormState {
  recipientName: string;
  phone: string;
  address: string;
  isDefault: boolean;
}

const EMPTY_FORM: AddressFormState = { recipientName: '', phone: '', address: '', isDefault: false };

export default function AddressesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/addresses');
      setAddresses(res.data.data || []);
    } catch (err) {
      console.error('Lỗi tải sổ địa chỉ:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchAddresses();
  }, [user]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (addr: Address) => {
    setEditingId(addr.id);
    setForm({ recipientName: addr.recipientName, phone: addr.phone, address: addr.address, isDefault: addr.isDefault });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmitForm = async () => {
    if (!form.recipientName.trim() || !form.phone.trim() || !form.address.trim()) {
      setFormError('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      if (editingId) {
        await api.patch(`/addresses/${editingId}`, {
          recipientName: form.recipientName,
          phone: form.phone,
          address: form.address,
        });
      } else {
        await api.post('/addresses', {
          recipientName: form.recipientName,
          phone: form.phone,
          address: form.address,
          isDefault: form.isDefault,
        });
      }
      setModalOpen(false);
      await fetchAddresses();
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Không thể lưu địa chỉ. Vui lòng thử lại.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.patch(`/addresses/${id}/set-default`);
      await fetchAddresses();
    } catch (err) {
      console.error('Lỗi đặt địa chỉ mặc định:', err);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/addresses/${deleteTarget.id}`);
      setDeleteTarget(null);
      await fetchAddresses();
    } catch (err) {
      console.error('Lỗi xóa địa chỉ:', err);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading || !user) {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <div className="min-h-screen bg-white text-[#111] font-sans antialiased pb-28">
      <div className="max-w-4xl mx-auto px-6 pt-12 pb-8 border-b border-gray-200 flex items-center justify-between">
        <h1 className="text-2xl md:text-4xl font-black uppercase tracking-[0.2em] text-[#111]">Sổ địa chỉ</h1>
        <button
          type="button"
          onClick={openCreateModal}
          className="bg-black text-white text-xs font-bold uppercase tracking-[0.2em] px-6 py-3.5 rounded-none hover:bg-gray-800 transition"
        >
          + Thêm địa chỉ
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-8">
        {loading ? (
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Đang tải...</p>
        ) : addresses.length === 0 ? (
          <div className="border border-gray-200 rounded-none p-10 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
              Bạn chưa lưu địa chỉ nào.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="bg-black text-white text-xs font-bold uppercase tracking-[0.2em] px-6 py-3.5 rounded-none hover:bg-gray-800 transition"
            >
              + Thêm địa chỉ đầu tiên
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {addresses.map((addr) => (
              <div key={addr.id} className="border border-gray-200 rounded-none p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-xs font-black uppercase tracking-wide text-black">{addr.recipientName}</span>
                    {addr.isDefault && (
                      <span className="bg-black text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-none">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 font-medium">{addr.phone}</p>
                  <p className="text-xs text-gray-600 font-medium">{addr.address}</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  {!addr.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-[11px] font-bold uppercase tracking-widest text-black underline"
                    >
                      Đặt mặc định
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openEditModal(addr)}
                    className="text-[11px] font-bold uppercase tracking-widest text-black underline"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(addr)}
                    className="text-[11px] font-bold uppercase tracking-widest text-red-600 underline"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Link href="/profile" className="inline-block mt-8 text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:text-black transition">
          ← Quay lại hồ sơ cá nhân
        </Link>
      </div>

      {/* Modal thêm/sửa địa chỉ */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] overflow-y-auto px-4 py-10 flex items-center justify-center">
          <div className="bg-white border border-gray-300 w-full max-w-md p-6 rounded-none shadow-2xl">
            <div className="pb-4 border-b border-gray-200 mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-black">
                {editingId ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
              </h3>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Tên người nhận</label>
                <input
                  type="text"
                  value={form.recipientName}
                  onChange={(e) => setForm((f) => ({ ...f, recipientName: e.target.value }))}
                  placeholder="Nguyễn Văn A"
                  className="w-full bg-white border border-gray-300 px-4 py-3 text-xs font-medium rounded-none focus:outline-none focus:border-black transition"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Số điện thoại</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="0912345678"
                  className="w-full bg-white border border-gray-300 px-4 py-3 text-xs font-medium rounded-none focus:outline-none focus:border-black transition"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Địa chỉ</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="123 Nguyễn Văn Bảo, Phường 4, Gò Vấp, TP.HCM"
                  className="w-full bg-white border border-gray-300 px-4 py-3 text-xs font-medium rounded-none focus:outline-none focus:border-black transition"
                />
              </div>

              {/* isDefault chỉ chỉnh được lúc TẠO MỚI — sửa isDefault đi qua nút
                  "Đặt mặc định" riêng ở danh sách (mirror thiết kế backend). */}
              {!editingId && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Đặt làm địa chỉ mặc định</span>
                </label>
              )}

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold uppercase tracking-wider whitespace-pre-line">
                  {formError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-black text-xs font-bold uppercase tracking-widest rounded-none hover:bg-gray-300 transition"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitForm}
                className="px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-none hover:bg-gray-800 transition disabled:opacity-50"
              >
                {submitting ? 'ĐANG LƯU...' : 'LƯU'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Xóa địa chỉ"
        message={`Bạn có chắc muốn xóa địa chỉ của "${deleteTarget?.recipientName}"? Hành động này không thể hoàn tác.`}
        confirmLabel={deleting ? 'ĐANG XÓA...' : 'Xóa'}
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
