"use client";
import { useEffect, useState } from 'react';
import { ENV } from '@/config/env';
import ProductCard from '@/components/common/ProductCard';
import { Product, Paginated } from '@/types';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ⚡ Nhóm B: GET /products nay TRẢ VỀ DẠNG PHÂN TRANG
        // { items, total, page, limit, totalPages } thay vì mảng thô.
        // Trang chủ tạm thời vẫn lọc client-side (theo Category + khoảng giá)
        // nên xin thẳng limit=100 (mức trần backend cho phép) để thấy đủ
        // catalog hiện tại. Khi catalog vượt 100 sản phẩm, PHẢI chuyển trang
        // này sang phân trang server-side thật — và khi đó cần bổ sung filter
        // giá (minPrice/maxPrice) ở backend trước, vì lọc giá client sẽ chỉ
        // còn lọc trong 1 trang. Xem PROGRESS.md để biết lý do hoãn.
        const [prodRes, catRes] = await Promise.all([
          fetch(`${ENV.apiUrl}/products?limit=100`),
          fetch(`${ENV.apiUrl}/products/categories`)
        ]);

        const prodResult: Paginated<Product> = await prodRes.json();
        const catResult = await catRes.json();

        setProducts(Array.isArray(prodResult?.items) ? prodResult.items : []);

        if (catResult) {
          const cats = Array.isArray(catResult) ? catResult : catResult.data || [];
          setCategories(cats);
        }
      } catch (err) {
        console.error("Lỗi tải dữ liệu trang chủ:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProducts = products.filter((item) => {
    const matchCategory = selectedCategory === 'all' || item.categoryId === selectedCategory || item.category?.id === selectedCategory;
    
    let matchPrice = true;
    const price = Number(item.price);
    if (priceRange === 'under-1m') {
      matchPrice = price < 1000000;
    } else if (priceRange === '1m-3m') {
      matchPrice = price >= 1000000 && price <= 3000000;
    } else if (priceRange === 'over-3m') {
      matchPrice = price > 3000000;
    }

    return matchCategory && matchPrice;
  });

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-white text-[#111]">
      <span className="tracking-widest text-xs uppercase font-bold antialiased animate-pulse">QUOCÉ PERFORMANCE...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-[#111] font-sans antialiased pb-32">
      
      {/* DẢI THÔNG BÁO ĐẶC QUYỀN */}
      <div className="bg-black text-white text-[11px] font-bold uppercase tracking-wider py-3 text-center px-4 antialiased">
        GIAO HÀNG HỎA TỐC & ĐẶC QUYỀN BẢO HÀNH CHO THÀNH VIÊN QUOCÉ CLUB ⚡
      </div>

      {/* HERO TITLE */}
      <div className="pt-16 pb-10 text-center px-6 max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold tracking-wide uppercase mb-4 text-[#111] antialiased">
          QUOCÉ OFFICIAL STORE
        </h1>
        <p className="text-xs md:text-sm text-gray-600 font-bold uppercase tracking-wider max-w-xl mx-auto antialiased">
          Hệ sinh thái phụ kiện công nghệ hiệu suất cao tối giản.
        </p>
      </div>

      {/* THANH DANH MỤC NGANG */}
      <div className="w-full max-w-[1440px] mx-auto px-6 pb-8 border-b border-gray-200">
        <div className="flex items-center justify-between overflow-x-auto scrollbar-none gap-4">
          <div className="flex items-center gap-3 flex-nowrap">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-6 py-3 text-xs font-bold uppercase tracking-wider rounded-none transition-all whitespace-nowrap border-2 antialiased ${
                selectedCategory === 'all'
                  ? 'bg-black text-white border-black'
                  : 'bg-[#f4f4f4] text-[#111] border-transparent hover:border-black'
              }`}
            >
              🔥 TẤT CẢ SẢN PHẨM
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-6 py-3 text-xs font-bold uppercase tracking-wider rounded-none transition-all whitespace-nowrap border-2 antialiased ${
                  selectedCategory === cat.id
                    ? 'bg-black text-white border-black'
                    : 'bg-[#f4f4f4] text-[#111] border-transparent hover:border-black'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* BỘ LỌC GIÁ */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="bg-[#f4f4f4] border-2 border-transparent text-[#111] text-xs font-bold uppercase tracking-wider px-5 py-3 focus:outline-none focus:border-black cursor-pointer rounded-none antialiased"
            >
              <option value="all">MỨC GIÁ: TẤT CẢ</option>
              <option value="under-1m">DƯỚI 1.000.000 Đ</option>
              <option value="1m-3m">1.000.000 Đ - 3.000.000 Đ</option>
              <option value="over-3m">TRÊN 3.000.000 Đ</option>
            </select>
          </div>
        </div>
      </div>

      {/* LƯỚI SẢN PHẨM */}
      <div className="w-full max-w-[1440px] mx-auto px-6 pt-10">
        <div className="mb-8 flex justify-between items-center border-b border-gray-200 pb-4">
          <h2 className="text-xl font-bold uppercase tracking-wider text-[#111] antialiased">
            KHÁM PHÁ ({filteredProducts.length} SẢN PHẨM)
          </h2>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-32 bg-[#f4f4f4] rounded-none border border-gray-200">
            <p className="text-gray-600 text-xs font-bold uppercase tracking-wider mb-6 antialiased">Không tìm thấy sản phẩm phù hợp.</p>
            <button 
              onClick={() => { setSelectedCategory('all'); setPriceRange('all'); }}
              className="bg-black text-white text-xs uppercase tracking-wider px-8 py-3.5 rounded-none font-bold hover:bg-gray-800 transition antialiased"
            >
              XÓA BỘ LỌC
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