"use client";
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ENV } from '@/config/env';
import { api, getApiErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Review, ReviewSummary, ReviewEligibility, Paginated } from '@/types';
import StarRating from '@/components/common/StarRating';
import ConfirmModal from '@/components/common/ConfirmModal';

interface ProductReviewsProps {
  productId: string;
}

const LIMIT = 10;

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const { user } = useAuth();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingList, setLoadingList] = useState(true);

  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);

  const [formRating, setFormRating] = useState(0);
  const [formComment, setFormComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchReviews = useCallback(async (targetPage: number) => {
    setLoadingList(true);
    try {
      const res = await fetch(`${ENV.apiUrl}/reviews?productId=${productId}&page=${targetPage}&limit=${LIMIT}`);
      const result = await res.json();
      const data: Paginated<Review> & { summary: ReviewSummary } = result?.data;
      setReviews(data?.items || []);
      setSummary(data?.summary || null);
      setTotalPages(data?.totalPages || 1);
      setPage(targetPage);
    } catch (err) {
      console.error('Lỗi tải đánh giá:', err);
    } finally {
      setLoadingList(false);
    }
  }, [productId]);

  const fetchEligibility = useCallback(async () => {
    if (!user) {
      setEligibility(null);
      return;
    }
    try {
      const res = await api.get(`/reviews/eligibility?productId=${productId}`);
      const data: ReviewEligibility = res.data.data;
      setEligibility(data);
      if (data.myReview) {
        setFormRating(data.myReview.rating);
        setFormComment(data.myReview.comment || '');
      }
    } catch (err) {
      // 401 âm thầm — token có thể đã hết hạn giữa chừng, không cần báo lỗi
      // vỡ UI, chỉ ẩn form review đi.
      setEligibility(null);
    }
  }, [productId, user]);

  useEffect(() => {
    fetchReviews(1);
  }, [fetchReviews]);

  useEffect(() => {
    fetchEligibility();
  }, [fetchEligibility]);

  const handleSubmit = async () => {
    if (formRating < 1) {
      setFormError('Vui lòng chọn số sao đánh giá.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      if (isEditing && eligibility?.myReview) {
        await api.patch(`/reviews/${eligibility.myReview.id}`, { rating: formRating, comment: formComment || undefined });
      } else {
        await api.post('/reviews', { productId, rating: formRating, comment: formComment || undefined });
      }
      setIsEditing(false);
      await Promise.all([fetchReviews(1), fetchEligibility()]);
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Không thể gửi đánh giá. Vui lòng thử lại.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!eligibility?.myReview) return;
    setDeleting(true);
    try {
      await api.delete(`/reviews/${eligibility.myReview.id}`);
      setConfirmDeleteOpen(false);
      setFormRating(0);
      setFormComment('');
      setIsEditing(false);
      await Promise.all([fetchReviews(1), fetchEligibility()]);
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Không thể xóa đánh giá.'));
      setConfirmDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const distribution = summary?.distribution;
  const totalForBars = summary?.count || 1;

  return (
    <div className="max-w-[1400px] mx-auto px-6 pt-16 pb-8 border-t border-gray-200 mt-16">
      <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider text-[#111] mb-8">
        Đánh giá sản phẩm
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* CỘT TRÁI: Tổng quan điểm số */}
        <div className="lg:col-span-4">
          <div className="border border-gray-200 p-6 rounded-none sticky top-6">
            <div className="text-4xl font-black text-black mb-2">
              {summary && summary.count > 0 ? summary.average.toFixed(1) : '—'}
              <span className="text-lg text-gray-400 font-bold"> / 5</span>
            </div>
            <StarRating value={summary?.average || 0} readOnly size={20} />
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mt-2">
              {summary?.count ? `${summary.count} đánh giá` : 'Chưa có đánh giá nào'}
            </p>

            {distribution && (
              <div className="flex flex-col gap-1.5 mt-5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = distribution[String(star) as '1' | '2' | '3' | '4' | '5'] || 0;
                  const pct = Math.round((count / totalForBars) * 100);
                  return (
                    <div key={star} className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
                      <span className="w-6">{star}★</span>
                      <div className="flex-1 h-1.5 bg-gray-100">
                        <div className="h-full bg-black" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-5 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Form gửi/sửa đánh giá */}
          <div className="border border-gray-200 p-6 rounded-none mt-6">
            {!user && (
              <p className="text-xs font-medium text-gray-600">
                <Link href="/login" className="text-black font-bold underline">Đăng nhập</Link> để đánh giá sản phẩm này.
              </p>
            )}

            {user && eligibility?.reason === 'NOT_PURCHASED' && (
              <p className="text-xs font-medium text-gray-600">
                Bạn cần mua và nhận sản phẩm này trước khi đánh giá.
              </p>
            )}

            {user && eligibility?.myReview && !isEditing && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-2">Đánh giá của bạn</p>
                <StarRating value={eligibility.myReview.rating} readOnly />
                {eligibility.myReview.comment && (
                  <p className="text-xs text-gray-700 font-medium mt-2">{eligibility.myReview.comment}</p>
                )}
                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="text-[11px] font-bold uppercase tracking-widest text-black underline"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteOpen(true)}
                    className="text-[11px] font-bold uppercase tracking-widest text-red-600 underline"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            )}

            {user && (eligibility?.canReview || (eligibility?.myReview && isEditing)) && (
              <div className="flex flex-col gap-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-700">
                  {isEditing ? 'Cập nhật đánh giá' : 'Viết đánh giá'}
                </p>
                <StarRating value={formRating} onChange={setFormRating} size={24} />
                <textarea
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  maxLength={1000}
                  rows={4}
                  placeholder="Chia sẻ cảm nhận của bạn về sản phẩm (không bắt buộc)..."
                  className="w-full bg-white border border-gray-300 text-black text-xs font-medium px-4 py-3.5 rounded-none focus:outline-none focus:border-black transition resize-none"
                />
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold uppercase tracking-wider whitespace-pre-line">
                    {formError}
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleSubmit}
                    className="flex-1 bg-black text-white text-xs font-bold uppercase tracking-[0.2em] py-3.5 rounded-none hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'ĐANG GỬI...' : isEditing ? 'CẬP NHẬT' : 'GỬI ĐÁNH GIÁ'}
                  </button>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setFormError('');
                        if (eligibility.myReview) {
                          setFormRating(eligibility.myReview.rating);
                          setFormComment(eligibility.myReview.comment || '');
                        }
                      }}
                      className="px-4 py-2 bg-gray-200 text-black text-xs font-bold uppercase tracking-widest rounded-none hover:bg-gray-300 transition"
                    >
                      Hủy
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: Danh sách đánh giá */}
        <div className="lg:col-span-8">
          {loadingList ? (
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Đang tải đánh giá...</p>
          ) : reviews.length === 0 ? (
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Chưa có đánh giá nào cho sản phẩm này.</p>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100">
              {reviews.map((review) => (
                <div key={review.id} className="py-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-black">
                      {review.user?.fullName || 'Khách hàng'}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <StarRating value={review.rating} readOnly size={14} />
                  {review.comment && (
                    <p className="text-xs text-gray-700 font-medium mt-2 leading-relaxed">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => fetchReviews(page - 1)}
                className="text-[11px] font-bold uppercase tracking-widest text-black disabled:text-gray-300 disabled:cursor-not-allowed"
              >
                ← Trước
              </button>
              <span className="text-[11px] font-bold text-gray-500">Trang {page} / {totalPages}</span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => fetchReviews(page + 1)}
                className="text-[11px] font-bold uppercase tracking-widest text-black disabled:text-gray-300 disabled:cursor-not-allowed"
              >
                Sau →
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmDeleteOpen}
        title="Xóa đánh giá"
        message="Bạn có chắc muốn xóa đánh giá này? Hành động này không thể hoàn tác."
        confirmLabel={deleting ? 'ĐANG XÓA...' : 'Xóa'}
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
