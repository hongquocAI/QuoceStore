'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { Bot, Send, User, Loader2, X } from 'lucide-react';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

export default function AiChatWidget() {
  // ⚡ Nhóm G Đợt 1: ẩn hẳn khỏi /admin/* — widget "tư vấn mua hàng" vô lý
  // khi nổi trên trang quản trị. Không thể ẩn từ app/admin/layout.tsx vì
  // widget được app/layout.tsx (layout CHA) mount ở ngoài {children} của
  // layout con — layout con không gỡ được phần tử của layout cha. Cách khả
  // thi duy nhất: tự kiểm tra pathname ngay trong chính widget (đã là
  // Client Component sẵn).
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: 'Xin chào! Tôi là Trợ lý AI QUOCÉ. Bạn cần tìm sản phẩm hoặc tư vấn gì hôm nay?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: userText });
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: res.data.data.reply },
      ]);
    } catch (error: any) {
      // 🛡️ Nhóm G Đợt 1: phân biệt rate-limit thật (10 req/phút,
      // backend/src/ai/ai.controller.ts) với lỗi khác. KHÔNG đổ thẳng
      // err.response.data.message ra UI cho lỗi 500 — AiService có thể lộ
      // chi tiết lỗi Gemini nội bộ trong message đó.
      const status = error?.response?.status;
      const text =
        status === 429
          ? error?.response?.data?.message || 'Bạn gửi hơi nhanh, vui lòng thử lại sau ít phút.'
          : status === 400
          ? error?.response?.data?.message || 'Nội dung không hợp lệ, vui lòng thử lại.'
          : 'Rất tiếc, đã có lỗi kết nối tới Server AI.';
      setMessages((prev) => [...prev, { sender: 'ai', text }]);
    } finally {
      setLoading(false);
    }
  };

  if (pathname?.startsWith('/admin')) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Nút bong bóng chat nổi ở góc màn hình */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-black hover:bg-gray-800 text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 group"
          aria-label="Mở chat AI"
        >
          <Bot className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Khung cửa sổ chat */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col h-[520px] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">

          {/* Header khung chat */}
          <div className="bg-black text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bot className="w-5 h-5 text-white" />
              <div>
                <h3 className="font-semibold text-sm">QUOCÉ AI Assistant</h3>
                <p className="text-[10px] text-gray-400">Trợ lý thông minh 24/7</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Vùng hiển thị tin nhắn */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#fafafc]">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-start gap-2 ${
                  msg.sender === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`p-1.5 rounded-full flex-shrink-0 ${
                    msg.sender === 'user' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>
                <div
                  className={`p-3 rounded-2xl text-xs sm:text-sm max-w-[80%] whitespace-pre-line leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-black text-white rounded-tr-none'
                      : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-gray-400 text-xs pl-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> AI đang suy nghĩ...
              </div>
            )}
          </div>

          {/* Ô nhập nội dung tin nhắn */}
          <div className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Nhập câu hỏi về sản phẩm..."
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-black bg-[#fafafc]"
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="bg-black hover:bg-gray-800 text-white p-2.5 rounded-xl transition flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}
    </div>
  );
}