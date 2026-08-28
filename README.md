# QUOCÉ Store

Nền tảng thương mại điện tử & quản lý dữ liệu sản phẩm (PIM) cho phụ kiện công
nghệ, xây dựng theo kiến trúc enterprise: bảo mật theo chiều sâu (defense in
depth), khả năng mở rộng, và khả năng quan sát hệ thống (observability) đầy đủ.

## Tính năng chính

- **Storefront**: duyệt sản phẩm theo danh mục/thương hiệu, biến thể màu sắc,
  giỏ hàng, thanh toán COD hoặc chuyển khoản VietQR (PayOS)
- **Guest checkout**: đặt hàng không cần tài khoản, tra cứu lại đơn hàng bằng
  mã đơn + số điện thoại
- **Quản trị (Admin)**: CRUD sản phẩm với biến thể, quản lý danh mục/thương
  hiệu (Brand/SubCategory) qua dropdown động, upload ảnh theo cấu trúc phân
  tầng trên Cloudinary; danh sách sản phẩm phân trang phía server kèm tìm kiếm
  (tên/SKU) và lọc theo danh mục, danh mục con, thương hiệu
- **Trợ lý AI**: tư vấn mua sắm dựa trên catalog thật (Google Gemini)
- **Xác thực**: JWT qua cookie `HttpOnly`, Refresh Token rotation, rate
  limiting theo từng endpoint nhạy cảm

## Tech Stack

| Layer | Công nghệ |
|---|---|
| Backend | NestJS 11, TypeScript, Prisma ORM 6 |
| Database | PostgreSQL ([Neon](https://neon.tech) serverless) |
| Cache | Redis ([Upstash](https://upstash.com)) |
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS |
| Auth | JWT (cookie `HttpOnly`) + Refresh Token rotation |
| Thanh toán | [PayOS](https://payos.vn) (VietQR) |
| Lưu trữ ảnh | [Cloudinary](https://cloudinary.com) |
| AI | Google Gemini API |
| Logging | Pino (structured JSON logs) |
| Error tracking | [Sentry](https://sentry.io) |
| Rate limiting | `@nestjs/throttler` |

## Bảo mật

- Toàn bộ giá trị giao dịch (`totalAmount`, số tiền thanh toán) được **server
  tự tính lại từ database**, không tin bất kỳ giá trị nào client gửi lên
- Access token sống ngắn hạn (15 phút), Refresh Token lưu dạng hash trong DB,
  tự động rotate mỗi lần dùng
- Rate limiting theo từng endpoint nhạy cảm (đăng nhập, đăng ký, AI chat, tra
  cứu đơn hàng)
- Validate chặt input đầu vào (`whitelist` + `forbidNonWhitelisted`), chặn
  field lạ trong mọi request
- Phân quyền theo vai trò (RBAC: `ADMIN` / `VENDOR` / `CUSTOMER`) ở tầng
  Guard, kiểm tra quyền sở hữu (ownership) cho dữ liệu cá nhân

## Cấu trúc thư mục

```
quoce-store/
├── backend/          # NestJS API
│   ├── src/
│   │   ├── auth/          # Xác thực, JWT, Guard, Strategy
│   │   ├── product/        # Sản phẩm & biến thể
│   │   ├── brands/          # Thương hiệu (MDM)
│   │   ├── sub-categories/   # Danh mục con (MDM)
│   │   ├── orders/            # Đơn hàng
│   │   ├── payment/            # Tích hợp PayOS
│   │   ├── cloudinary/          # Upload ảnh
│   │   ├── ai/                   # Trợ lý AI
│   │   ├── health/                # Health check
│   │   └── common/                 # Filter, Interceptor dùng chung
│   └── prisma/
│       └── schema.prisma           # Data model
├── frontend/          # Next.js storefront + admin panel
│   └── src/
│       ├── app/            # Routes (App Router)
│       ├── components/      # UI components dùng chung
│       └── context/          # React Context (Auth, Cart)
└── README.md
```

## Bắt đầu

### Yêu cầu

- Node.js ≥ 20
- Tài khoản: [Neon](https://neon.tech) (Postgres), [Upstash](https://upstash.com)
  (Redis), [Cloudinary](https://cloudinary.com), [PayOS](https://payos.vn),
  [Google AI Studio](https://aistudio.google.com) (Gemini API key), tùy chọn:
  [Sentry](https://sentry.io)

### Cài đặt

```bash
git clone https://github.com/hongquoccoder/QuoceStore.git
cd QuoceStore

# Backend
cd backend
npm install
cp .env.example .env   # điền giá trị thật vào .env, xem danh sách bên dưới
npx prisma migrate dev
npx prisma db seed
npm run start:dev       # http://localhost:5000

# Frontend (terminal khác)
cd frontend
npm install
cp .env.example .env
npm run dev              # http://localhost:3000
```

### Biến môi trường (Backend — `backend/.env`)

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `DATABASE_URL` | ✅ | Connection string PostgreSQL (Neon) |
| `JWT_SECRET` | ✅ | Chuỗi bí mật ký JWT, tối thiểu 32 ký tự |
| `FRONTEND_URL` | ✅ | Domain frontend, dùng cho CORS + cookie |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | ✅ | Cloudinary |
| `PAYOS_CLIENT_ID` / `_API_KEY` / `_CHECKSUM_KEY` | ✅ | PayOS |
| `REDIS_URL` | ✅ | Connection string Redis, dạng `rediss://...` |
| `NODE_ENV` | tùy chọn | `development` \| `production` |
| `GOOGLE_CLIENT_ID` | tùy chọn | Chỉ cần nếu bật Google Login |
| `GEMINI_API_KEY` | tùy chọn | Chỉ cần nếu dùng Trợ lý AI |
| `SENTRY_DSN` | tùy chọn | Chỉ cần nếu bật Error Tracking |

### Biến môi trường (Frontend — `frontend/.env`)

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | URL backend, VD `http://localhost:5000` |

## Scripts

| Lệnh (chạy trong `backend/` hoặc `frontend/`) | Mô tả |
|---|---|
| `npm run start:dev` (backend) | Chạy backend, watch mode |
| `npm run dev` (frontend) | Chạy frontend, hot reload |
| `npm run build` | Build production |
| `npx prisma studio` (backend) | GUI xem/sửa dữ liệu database |
| `npx prisma migrate dev --name <mô_tả>` (backend) | Tạo migration mới |
| `npm run test` (backend) | Chạy unit test |

## Health Check

```
GET /health
```
Trả về trạng thái server + kết nối database, dùng cho hosting platform tự
động kiểm tra sức khỏe hệ thống.

## Lộ trình phát triển

Xem [`PROGRESS.md`](./PROGRESS.md) (mục "🎯 Trạng thái hiện tại") để biết
tiến độ mới nhất.

## Giấy phép

Private — mã nguồn nội bộ, không phân phối công khai.
