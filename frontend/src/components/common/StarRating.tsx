"use client";
import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readOnly?: boolean;
}

// Dùng chung cho hiển thị (readOnly) và chọn sao (form gửi review).
// Không rounded — theo style vuông vức đã chốt (bản thân icon Star không có
// border nên không cần rounded-none, chỉ áp dụng cho khối chứa nếu có).
export default function StarRating({ value, onChange, size = 18, readOnly = false }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue ?? value;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readOnly && setHoverValue(star)}
          onMouseLeave={() => !readOnly && setHoverValue(null)}
          className={readOnly ? 'cursor-default' : 'cursor-pointer'}
          aria-label={`${star} sao`}
        >
          <Star
            size={size}
            className={star <= displayValue ? 'fill-black text-black' : 'fill-none text-gray-300'}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}
