"use client";
import Link from 'next/link';
import { Product } from '@/types';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isLiked, setIsLiked] = useState(false);

  const getImageUrl = (item: Product) => {
    const rawImg = item.thumbnail || (item.images && item.images[0]) || '';
    if (!rawImg) return '';
    return rawImg;
  };

  const imageSrc = getImageUrl(product);

  return (
    <div className="group flex flex-col relative bg-white cursor-pointer">
      
      {/* KHUNG ẢNH: Ôm sát ảnh hơn (p-3), vuông vức (rounded-none), hover chuyển sang nền đen */}
      <div className="w-full aspect-square bg-[#f4f4f4] group-hover:bg-black transition-colors duration-300 relative flex items-center justify-center p-3 overflow-hidden rounded-none border border-gray-200/80">
        
        {/* Nút Wishlist */}
        <button 
          onClick={(e) => { e.preventDefault(); setIsLiked(!isLiked); }}
          className="absolute top-3 right-3 z-10 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-none flex items-center justify-center text-gray-800 hover:bg-white transition-all shadow-sm border border-gray-200"
        >
          <span className={`text-sm ${isLiked ? 'text-red-500' : 'text-gray-700'}`}>
            {isLiked ? '♥' : '♡'}
          </span>
        </button>

        {/* Nhãn hết hàng */}
        {product.stock <= 0 && (
          <span className="absolute top-3 left-3 z-10 bg-black text-white text-[9px] font-black px-2.5 py-1 uppercase tracking-widest rounded-none">
            HẾT HÀNG
          </span>
        )}

        <Link href={`/product/${product.slug}`} className="w-full h-full flex items-center justify-center">
          {imageSrc ? (
            <img 
              src={imageSrc} 
              alt={product.title} 
              onError={(e: any) => { e.currentTarget.style.display = 'none'; }}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 ease-out" 
            />
          ) : (
            <span className="text-gray-400 text-xs tracking-[0.25em] uppercase font-black">QUOCÉ</span>
          )}
        </Link>
      </div>

      {/* THÔNG TIN: Khắc phục lỗi hiển thị font tiếng Việt có dấu khi viết hoa */}
      <div className="pt-3 pb-2 flex flex-col">
        <span className="text-sm text-black font-black tracking-tight mb-1">
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(product.price))}
        </span>
        
        <Link href={`/product/${product.slug}`}>
          <h3 className="text-xs md:text-sm text-[#111] font-bold uppercase tracking-wide mb-1 line-clamp-1 group-hover:underline leading-relaxed antialiased">
            {product.title}
          </h3>
        </Link>

        <span className="text-[10px] text-[#767677] uppercase tracking-[0.2em] font-black antialiased">
          {product.category?.name || "QUOCÉ PERFORMANCE"}
        </span>
      </div>

    </div>
  );
}