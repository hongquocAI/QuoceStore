"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

interface CartItem {
  id: string; // productId
  variantId?: string; // ⚡ MỚI: id của ProductVariant nếu khách chọn màu cụ thể
  variantColorName?: string; // ⚡ MỚI: tên màu hiển thị, để show trong giỏ hàng/đơn hàng
  title: string;
  price: number; // ⚡ giờ LUÔN là giá đúng của variant đã chọn (nếu có), không còn luôn là giá gốc sản phẩm
  quantity: number;
  image?: string;
}

interface AddToCartProduct {
  id: string;
  title: string;
  price: number;
  image?: string;
  images?: string[];
  // ⚡ MỚI: cho phép truyền variant đã chọn khi thêm vào giỏ
  selectedVariant?: {
    id?: string;
    colorCode: string;
    colorName: string;
    price?: number;
    images?: string[];
  } | null;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: AddToCartProduct, quantity?: number) => void;
  updateQuantity: (cartLineId: string, quantity: number) => void;
  removeFromCart: (cartLineId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// ⚡ Định danh 1 dòng giỏ hàng phải là (productId + variantId), KHÔNG chỉ
// productId — trước đây chỉ dùng product.id làm key nên nếu khách thêm 2
// màu khác nhau của CÙNG 1 sản phẩm vào giỏ, chúng sẽ bị GỘP LÀM 1 dòng
// sai lệch (cộng dồn số lượng nhưng lẫn lộn giá/màu).
// ⚡ EXPORT ra ngoài để cart/page.tsx dùng chung — tránh 2 nơi tự viết
// logic ghép ID khác nhau rồi lệch nhau.
export function getCartLineId(productId: string, variantId?: string) {
  return variantId ? `${productId}::${variantId}` : productId;
}

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Lỗi đọc giỏ hàng', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: AddToCartProduct, quantity: number = 1) => {
    const variant = product.selectedVariant;

    // 🛡️ FIX QUAN TRỌNG NHẤT: giá lấy theo ĐÚNG variant đã chọn (nếu có
    // và variant có giá riêng > 0), fallback về giá sản phẩm gốc nếu
    // không có variant hoặc variant không có giá riêng. Trước đây LUÔN
    // dùng `product.price` bất kể khách đã chọn màu nào.
    const unitPrice = variant?.price && variant.price > 0 ? Number(variant.price) : Number(product.price);

    const lineImage = variant?.images?.[0] || product.image || product.images?.[0] || '';
    const lineId = getCartLineId(product.id, variant?.id);

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => getCartLineId(item.id, item.variantId) === lineId,
      );

      if (existingIndex > -1) {
        return prevCart.map((item, index) =>
          index === existingIndex ? { ...item, quantity: item.quantity + Number(quantity) } : item,
        );
      }

      return [
        ...prevCart,
        {
          id: product.id,
          variantId: variant?.id,
          variantColorName: variant?.colorName,
          title: product.title,
          price: unitPrice,
          quantity: Number(quantity),
          image: lineImage,
        },
      ];
    });
  };

  const updateQuantity = (cartLineId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartLineId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        getCartLineId(item.id, item.variantId) === cartLineId ? { ...item, quantity } : item,
      ),
    );
  };

  const removeFromCart = (cartLineId: string) => {
    setCart((prevCart) => prevCart.filter((item) => getCartLineId(item.id, item.variantId) !== cartLineId));
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart phải được sử dụng bên trong CartProvider');
  return context;
};
