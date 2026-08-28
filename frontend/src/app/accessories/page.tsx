"use client";
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import ProductCard from '@/components/common/ProductCard';
import { Product } from '@/types';

export default function AccessoriesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubCategory, setSelectedSubCategory] = useState('all');

  useEffect(() => {
    api
      .get('/products')
      .then((res) => {
        const data = res.data;
        const items = Array.isArray(data) ? data : data.data || [];
        setProducts(items);
      })
      .catch((err) => console.error('Lỗi tải sản phẩm phụ kiện:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = products.filter((item) => {
    if (selectedSubCategory === 'all') return true;
    return item.subCategory?.slug === selectedSubCategory;
  });

  const subCategoryFilters = [
    { id: 'all', label: 'Tất cả phụ kiện' },
    { id: 'cap-sac', label: 'Cáp sạc' },
    { id: 'cu-sac', label: 'Củ sạc' },
    { id: 'lot-chuot', label: 'Lót chuột' },
    { id: 'gia-do', label: 'Giá đỡ' },
    { id: 'tai-nghe', label: 'Tai nghe' },
    { id: 'chuot', label: 'Chuột' },
    { id: 'loa', label: 'Loa' },
    { id: 'webcam', label: 'Webcam' },
  ];

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-white text-[#111]">
      <span className="tracking-widest text-xs uppercase font-bold antialiased animate-pulse">ĐANG TẢI PHỤ KIỆN...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-[#111] font-sans antialiased pb-32">

      {/* DẢI THÔNG BÁO - khớp đồng bộ với HomePage */}
      <div className="bg-black text-white text-[11px] font-bold uppercase tracking-wider py-3 text-center px-4 antialiased">
        GIAO HÀNG HỎA TỐC & ĐẶC QUYỀN BẢO HÀNH CHO THÀNH VIÊN QUOCÉ CLUB ⚡
      </div>

      {/* HERO TITLE - cùng cấu trúc với HomePage, chỉ đổi nội dung */}
      <div className="pt-16 pb-10 text-center px-6 max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold tracking-wide uppercase mb-4 text-[#111] antialiased">
          Phụ Kiện & Thiết Bị Ngoại Vi
        </h1>
        <p className="text-xs md:text-sm text-gray-600 font-bold uppercase tracking-wider max-w-xl mx-auto antialiased">
          Bộ sưu tập phụ kiện thông minh tối ưu hóa không gian làm việc tối giản của bạn.
        </p>
      </div>

      {/* THANH DANH MỤC NGANG - cùng style border-2 vuông với HomePage,
          thay vì rounded-full/backdrop-blur tối màu trước đây */}
      <div className="w-full max-w-[1440px] mx-auto px-6 pb-8 border-b border-gray-200">
        <div className="flex items-center overflow-x-auto scrollbar-none gap-3">
          {subCategoryFilters.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubCategory(sub.id)}
              className={`px-6 py-3 text-xs font-bold uppercase tracking-wider rounded-none transition-all whitespace-nowrap border-2 antialiased ${
                selectedSubCategory === sub.id
                  ? 'bg-black text-white border-black'
                  : 'bg-[#f4f4f4] text-[#111] border-transparent hover:border-black'
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      </div>

      {/* LƯỚI SẢN PHẨM - tái sử dụng ProductCard giống hệt HomePage,
          đảm bảo đồng bộ 100% về hình ảnh, không tự vẽ card riêng nữa */}
      <div className="w-full max-w-[1440px] mx-auto px-6 pt-10">
        <div className="mb-8 flex justify-between items-center border-b border-gray-200 pb-4">
          <h2 className="text-xl font-bold uppercase tracking-wider text-[#111] antialiased">
            PHỤ KIỆN ({filteredProducts.length} SẢN PHẨM)
          </h2>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-32 bg-[#f4f4f4] rounded-none border border-gray-200">
            <p className="text-gray-600 text-xs font-bold uppercase tracking-wider mb-6 antialiased">
              Chưa có sản phẩm trong danh mục này.
            </p>
            <button
              onClick={() => setSelectedSubCategory('all')}
              className="bg-black text-white text-xs uppercase tracking-wider px-8 py-3.5 rounded-none font-bold hover:bg-gray-800 transition antialiased"
            >
              XEM TẤT CẢ PHỤ KIỆN
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}