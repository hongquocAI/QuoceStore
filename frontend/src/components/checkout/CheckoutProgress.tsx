"use client";

interface CheckoutProgressProps {
  currentStep: 1 | 2 | 3;
}

const STEPS = ['Giỏ hàng', 'Thanh toán', 'Hoàn tất'];

// Thuần hiển thị — không có logic/state riêng, chỉ nhận currentStep từ
// checkout/page.tsx (đã có sẵn qua state orderResult). Tái dùng đúng design
// token của stepper SHIPPING_STATUS_ORDER đã có ở orders/page.tsx để đồng bộ
// toàn site, KHÔNG sửa orderLabels.ts (đây là 3 bước riêng, không liên quan
// ShippingStatus).
export default function CheckoutProgress({ currentStep }: CheckoutProgressProps) {
  return (
    <div className="flex items-center max-w-md mx-auto mb-10">
      {STEPS.map((label, idx) => {
        const stepNum = idx + 1;
        const isDone = stepNum <= currentStep;
        const isCurrent = stepNum === currentStep;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-6 h-6 flex items-center justify-center text-[10px] font-black border-2 rounded-none ${
                  isDone ? 'bg-black text-white border-black' : 'bg-white text-gray-300 border-gray-300'
                } ${isCurrent ? 'ring-2 ring-offset-2 ring-black' : ''}`}
              >
                {stepNum}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wide text-center whitespace-nowrap ${isDone ? 'text-gray-900' : 'text-gray-300'}`}>
                {label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 ${stepNum < currentStep ? 'bg-black' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
