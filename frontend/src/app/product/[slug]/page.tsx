"use client";
import { useEffect, useState, use } from 'react';
import { ENV } from '@/config/env';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import ProductCard from '@/components/common/ProductCard';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// ⚡ FIX: types/index.ts (Phase 1) đã có sẵn ProductVariant + Product.brand
// + Product.subCategory chuẩn — không cần tự định nghĩa lại `variants` hay
// `brandName` ở đây nữa. Việc khai báo lại `variants` với `id?: string`
// (optional) trước đây ĐÈ lên kiểu `ProductVariant[]` đã kế thừa từ Product
// (yêu cầu `id: string` bắt buộc) -> xung đột kiểu, TypeScript báo lỗi
// "incorrectly extends interface". Giờ chỉ cần Omit đúng 2 field optional
// hoá lại (highlights/specs vốn required ở Product) và giữ nguyên `sku`
// (đã optional sẵn ở Product qua `sku?: string | null`), không cần khai
// báo gì thêm.
interface DetailProduct extends Omit<Product, 'highlights' | 'specs'> {
  highlights?: string[];
  specs?: Record<string, any>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const { addToCart } = useCart();

  const [product, setProduct] = useState<DetailProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState(false);
  // ⚡ Đợt 4 Nhóm G: sản phẩm liên quan (cùng SubCategory) — dùng lại đúng
  // endpoint phân trang có sẵn từ Nhóm B, không cần API mới.
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  // Trạng thái đóng/mở các mục Accordion
  const [openSection, setOpenSection] = useState<string | null>('desc');

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        const res = await fetch(`${ENV.apiUrl}/products/${slug}`);
        const result = await res.json();
        const item = result.data || result;
        
        if (item) {
          setProduct(item);
          const variantsList = item.variants || [];
          if (variantsList.length > 0) {
            setSelectedVariant(variantsList[0]);
            const defaultImg = variantsList[0].images?.[0] || item.thumbnail || item.images?.[0] || '';
            setSelectedImage(defaultImg ?? '');
          } else {
            const defaultImg = item.thumbnail || (item.images && item.images[0]) || '';
            setSelectedImage(defaultImg ?? '');
          }
        }
      } catch (err) {
        console.error("Lỗi tải chi tiết sản phẩm:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetail();
  }, [slug]);

  // ⚡ Đợt 4 Nhóm G: tải sản phẩm liên quan SAU khi có product (cần biết
  // subCategoryId). Lọc bỏ chính sản phẩm đang xem, giữ tối đa 4. Nếu
  // không có kết quả, KHÔNG fallback sang categoryId — ẩn hẳn section
  // thay vì hiện khối trống (giữ đơn giản, đúng phạm vi đã chốt).
  useEffect(() => {
    if (!product?.subCategoryId) {
      setRelatedProducts([]);
      return;
    }
    const fetchRelated = async () => {
      try {
        const res = await fetch(`${ENV.apiUrl}/products?subCategoryId=${product.subCategoryId}&limit=5`);
        const result = await res.json();
        const items: Product[] = Array.isArray(result?.items) ? result.items : [];
        setRelatedProducts(items.filter((p) => p.id !== product.id).slice(0, 4));
      } catch (err) {
        console.error('Lỗi tải sản phẩm liên quan:', err);
        setRelatedProducts([]);
      }
    };
    fetchRelated();
  }, [product?.subCategoryId, product?.id]);

  const handleVariantChange = (variant: any) => {
    setSelectedVariant(variant);
    const firstImg = variant.images?.[0] || product?.thumbnail || '';
    setSelectedImage(firstImg);
  };

  const handleAddToCart = () => {
    if (!product) return;

    addToCart(
      {
        id: product.id,
        title: product.title,
        price: Number(product.price),
        images: product.images,
        // ⚡ Truyền đúng biến thể (màu) đang được chọn trên UI — nếu sản
        // phẩm không có variants, selectedVariant sẽ là null, CartContext
        // tự fallback về giá/ảnh sản phẩm gốc.
        selectedVariant: selectedVariant
          ? {
              id: selectedVariant.id,
              colorCode: selectedVariant.colorCode,
              colorName: selectedVariant.colorName,
              price: selectedVariant.price,
              images: selectedVariant.images,
            }
          : null,
      },
      quantity,
    );

    setAddedMessage(true);
    setTimeout(() => setAddedMessage(false), 3000);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white text-[#111]">
        <span className="tracking-[0.3em] text-xs uppercase font-extrabold animate-pulse">ĐANG TẢI SẢN PHẨM...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-white text-center px-6">
        <h1 className="text-2xl font-black uppercase tracking-wider mb-4">Không tìm thấy sản phẩm</h1>
        <p className="text-gray-500 text-sm mb-6 font-medium">Sản phẩm bạn đang tìm kiếm có thể đã hết hàng hoặc không tồn tại.</p>
        <Link href="/" className="bg-black text-white text-xs uppercase font-extrabold tracking-widest px-8 py-4 rounded-none hover:bg-gray-800 transition">
          Quay về trang chủ
        </Link>
      </div>
    );
  }

  const activeImagesSource = selectedVariant?.images && selectedVariant.images.length > 0
    ? selectedVariant.images
    : (product.images && product.images.length > 0 ? product.images : [product.thumbnail]);

  const imagesList: string[] = activeImagesSource.filter((img: string): img is string => Boolean(img));
  const variantsList = product.variants || [];

  // Lọc thông số kỹ thuật thương mại
  const customerAttributes: { label: string; value: string }[] = [
    { label: 'Mã SKU', value: String(product.sku || 'N/A') },
    { label: 'Thương hiệu', value: String(product.brand?.name || 'QUOCÉ') },
    { label: 'Tình trạng', value: product.stock > 0 ? `Còn hàng (${product.stock} sản phẩm)` : 'Tạm hết hàng' },
    { label: 'Danh mục', value: String(product.category?.name || 'Phụ kiện công nghệ') },
  ];

  if (product.specs && typeof product.specs === 'object') {
    Object.entries(product.specs).forEach(([key, value]) => {
      const formattedKey = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase());
      
      customerAttributes.push({
        label: formattedKey,
        value: String(value ?? '')
      });
    });
  }

  const highlightsList = product.highlights || [];

  return (
    <div className="min-h-screen bg-white text-[#111] font-sans antialiased pb-28">
      
      <div className="bg-black text-white text-[11px] font-black uppercase tracking-[0.25em] py-3 text-center px-4">
        GIAO HÀNG HỎA TỐC & ĐẶC QUYỀN BẢO HÀNH CHO THÀNH VIÊN QUOCÉ CLUB ⚡
      </div>

      <div className="max-w-[1400px] mx-auto px-6 pt-6 pb-4">
        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2">
          <Link href="/" className="hover:text-black transition">Trang chủ</Link>
          <span>/</span>
          <span className="text-gray-600">{product.category?.name || "Phụ kiện"}</span>
          <span>/</span>
          <span className="text-black font-black truncate max-w-[250px]">{product.title}</span>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 pt-4">
        
        {/* CỘT TRÁI: Gallery hình ảnh */}
        <div className="lg:col-span-6 flex flex-col gap-6 sticky top-6 self-start">
          <div className="w-full aspect-square bg-[#f4f4f4] rounded-none flex items-center justify-center p-12 overflow-hidden relative border border-gray-200">
            {product.stock <= 0 && (
              <span className="absolute top-6 left-6 z-10 bg-black text-white text-[10px] font-black px-4 py-1.5 uppercase tracking-widest rounded-none">
                Hết hàng
              </span>
            )}
              {selectedImage ? (
                <img 
                  src={selectedImage} 
                  alt={product.title} 
                  className="w-full h-full object-contain transition-transform duration-500 hover:scale-105"
                />
              ) : (
                <span className="text-gray-400 text-xs uppercase tracking-widest">Chưa có ảnh</span>
              )}
          </div>

          {imagesList.length > 1 && (
            <div className="flex items-center gap-4 overflow-x-auto py-2 px-1 scrollbar-none">
              {imagesList.map((imgUrl, index) => {
                const safeImgUrl = imgUrl || '';
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(safeImgUrl)}
                    className={`w-20 h-20 rounded-none bg-[#f4f4f4] flex items-center justify-center p-2.5 border-2 transition-all flex-shrink-0 ${
                      selectedImage === safeImgUrl ? 'border-black bg-white shadow-md scale-105' : 'border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={safeImgUrl} alt="" className="w-full h-full object-contain" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* CỘT PHẢI: Thông tin sản phẩm */}
        <div className="lg:col-span-6 flex flex-col justify-start">
          <span className="text-xs text-[#767677] uppercase tracking-[0.3em] font-black mb-3">
            {product.brand?.name || product.category?.name || "QUOCÉ PERFORMANCE"}
          </span>

          <h1 className="text-2xl md:text-4xl font-black text-[#111] uppercase tracking-wide mb-4 leading-tight">
            {product.title}
          </h1>

          <div className="text-2xl md:text-3xl font-black text-black tracking-tight mb-6 pb-6 border-b border-gray-200 flex items-baseline gap-4">
            <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(selectedVariant?.price || product.price))}</span>
            {product.originalPrice && (
              <span className="text-base font-bold text-gray-400 line-through">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(product.originalPrice))}
              </span>
            )}
          </div>

          <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-6 font-medium">
            {product.description || "Sản phẩm chính hãng chất lượng cao từ QUOCÉ Studio, thiết kế tối giản, hiệu suất vượt trội."}
          </p>

          {/* CHỌN MÀU SẮC */}
          {variantsList.length > 0 && (
            <div className="mb-6">
              <span className="text-xs font-black uppercase tracking-widest text-[#111] block mb-3">
                Màu sắc: <span className="font-bold text-gray-700">{selectedVariant?.colorName}</span>
              </span>
              <div className="flex items-center gap-3.5 flex-wrap">
                {variantsList.map((variant: any, idx: number) => {
                  const isSelected = selectedVariant?.colorCode === variant.colorCode;
                  return (
                    <button
                      key={variant.id || idx}
                      onClick={() => handleVariantChange(variant)}
                      className={`flex items-center gap-3 px-5 py-3 rounded-none border-2 transition-all ${
                        isSelected 
                          ? 'border-black bg-black text-white font-black' 
                          : 'border-gray-300 hover:border-black bg-white text-black font-bold'
                      }`}
                    >
                      <span 
                        className="w-4 h-4 rounded-none border border-white/40 flex-shrink-0" 
                        style={{ backgroundColor: variant.hexCode || '#000' }}
                      />
                      <span className="text-xs uppercase tracking-wider">{variant.colorName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Chọn số lượng */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-xs font-black uppercase tracking-widest text-[#111]">Số lượng:</span>
            <div className="flex items-center border-2 border-black rounded-none px-4 py-2 bg-[#f4f4f4]">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-lg font-black px-2.5 hover:text-gray-600 transition">-</button>
              <span className="mx-4 text-sm font-black">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="text-lg font-black px-2.5 hover:text-gray-600 transition">+</button>
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {product.stock > 0 ? `Còn lại ${product.stock} sản phẩm` : 'Tạm hết hàng'}
            </span>
          </div>

          <div className="flex flex-col gap-3 mb-8">
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className={`w-full py-4 rounded-none text-xs font-black uppercase tracking-[0.25em] transition-all shadow-md ${
                product.stock > 0 ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {product.stock > 0 ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
            </button>

            {addedMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-none text-center">
                ✓ Đã thêm sản phẩm vào giỏ hàng thành công!
              </div>
            )}
          </div>

          {/* ACCORDION SECTIONS */}
          <div className="border-t border-gray-200 mt-4">
            <div className="border-b border-gray-200">
              <button onClick={() => toggleSection('desc')} className="w-full py-5 flex justify-between items-center text-left font-black uppercase tracking-wider text-sm hover:text-gray-600 transition">
                <span>Mô tả sản phẩm</span>
                <span>{openSection === 'desc' ? '▲' : '▼'}</span>
              </button>
              {openSection === 'desc' && (
                <div className="pb-5 text-xs text-gray-700 leading-relaxed font-medium">
                  <p className="mb-3">{product.description}</p>
                  {highlightsList.length > 0 && (
                    <ul className="list-disc list-inside space-y-1.5 mt-2">
                      {highlightsList.map((hl: string, idx: number) => (
                        <li key={idx}>{hl}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="border-b border-gray-200">
              <button onClick={() => toggleSection('specs')} className="w-full py-5 flex justify-between items-center text-left font-black uppercase tracking-wider text-sm hover:text-gray-600 transition">
                <span>Thông tin chi tiết & Thông số</span>
                <span>{openSection === 'specs' ? '▲' : '▼'}</span>
              </button>
              {openSection === 'specs' && (
                <div className="pb-5 grid grid-cols-1 gap-2 text-xs">
                  {customerAttributes.map((attr, index) => (
                    <div key={index} className="flex justify-between py-2 border-b border-gray-100 items-center">
                      <span className="text-gray-500 font-extrabold uppercase tracking-widest text-[10px]">{attr.label}</span>
                      <span className="font-bold text-black text-right max-w-[60%]" suppressHydrationWarning>{attr.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ⚡ Đợt 4 Nhóm G: sản phẩm liên quan (cùng SubCategory) — ẩn hẳn
          section nếu không có kết quả, không hiện khối trống. */}
      {relatedProducts.length > 0 && (
        <div className="max-w-[1400px] mx-auto px-6 pt-16 pb-8 border-t border-gray-200 mt-16">
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider text-[#111] mb-8">
            Sản phẩm liên quan
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}