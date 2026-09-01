"use client";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// ⚡ Nhóm G: modal xác nhận dùng chung, thay window.confirm() thô — theo
// đúng pattern modal đã có trong dự án (admin/products/page.tsx, mini-modal
// quick-add: backdrop mờ + card vuông viền xám + nút Hủy/Xác nhận).
// z-[70] cố định (cao hơn z-50/z-[60] đang dùng ở các modal khác trong dự
// án) để luôn nổi trên cùng dù được mở từ trong 1 modal khác sau này —
// tránh phải thêm prop z-index tùy biến.
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] overflow-y-auto px-4 py-10 flex items-center justify-center">
      <div className="bg-white border border-gray-300 w-full max-w-md p-6 rounded-none shadow-2xl">
        <div className="pb-4 border-b border-gray-200 mb-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-black">{title}</h3>
        </div>
        <p className="text-xs font-medium text-gray-700 whitespace-pre-line mb-6">{message}</p>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-black text-xs font-bold uppercase tracking-widest rounded-none hover:bg-gray-300 transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-none transition ${
              danger ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
