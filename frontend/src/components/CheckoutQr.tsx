'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { QrCode, CreditCard, CheckCircle2, Loader2 } from 'lucide-react';

export default function CheckoutQr() {
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState('100000');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  const handleCreateQr = async () => {
    if (!orderId) {
      alert('Vui lòng nhập Order ID từ Database');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/payments/create-qr', {
        orderId,
        amount: Number(amount),
        description: 'Thanh toan ApexStore',
      });
      setQrCodeUrl(res.data.data.qrCode);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Tạo mã QR thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-lg p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2 text-gray-900 border-b pb-3">
        <CreditCard className="w-6 h-6 text-emerald-600" />
        <h3 className="font-semibold text-lg">Thanh toán VietQR Dynamic</h3>
      </div>

      {!qrCodeUrl ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order ID (UUID từ DB)
            </label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Dán UUID của Order vào đây..."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền (VND)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={handleCreateQr}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
            Tạo Mã QR Thanh Toán
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 text-center">
          {isPaid ? (
            <div className="py-8 flex flex-col items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-16 h-16 animate-bounce" />
              <h4 className="font-bold text-xl">Thanh toán Thành Công!</h4>
              <p className="text-gray-500 text-sm">Đơn hàng của bạn đã được xác nhận qua Webhook.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600">Quét mã VietQR bằng app ngân hàng để thanh toán</p>
              <div className="p-3 border-2 border-emerald-500 rounded-xl bg-gray-50">
                <img src={qrCodeUrl} alt="VietQR PayOS" className="w-64 h-64 object-contain" />
              </div>
              <p className="text-xs text-gray-400">
                Webhook tự động cập nhật trạng thái đơn hàng khi nhận tiền.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}