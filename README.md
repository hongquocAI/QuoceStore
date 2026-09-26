# QUOCÉ Store

Nền tảng thương mại điện tử & quản lý dữ liệu sản phẩm (PIM) cho phụ kiện công
nghệ, xây dựng theo kiến trúc enterprise: bảo mật theo chiều sâu (defense in
depth), khả năng mở rộng, và khả năng quan sát hệ thống (observability) đầy đủ.

## Tính năng chính

### Storefront & khách hàng
- Duyệt sản phẩm theo danh mục/danh mục con/thương hiệu, xem chi tiết với
  biến thể màu sắc (giá & tồn kho riêng theo từng màu), và gợi ý **sản phẩm
  liên quan** cùng danh mục con
- Giỏ hàng cho phép **chọn riêng từng sản phẩm để thanh toán** (tick chọn,
  có "Chọn tất cả") — sản phẩm không chọn vẫn giữ lại trong giỏ; áp mã giảm
  giá (server tự validate + tự tính lại số tiền giảm, không tin số liệu từ
  client); trang thanh toán có **thanh tiến trình** (Giỏ hàng → Thanh toán →
  Hoàn tất)
- Đặt hàng có tài khoản hoặc **Guest checkout** (không cần đăng ký) — khách
  vãng lai tra cứu lại đơn hàng bằng mã đơn + số điện thoại
  (`/orders/lookup`), có rate-limit chống dò quét
- Theo dõi đơn hàng với **timeline trực quan** (Chờ xử lý → Đang xử lý → Đã
  giao vận → Đã giao hàng), phân biệt rõ trạng thái thanh toán và trạng thái
  giao hàng
- **Đánh giá sản phẩm**: chỉ khách hàng đã mua và nhận hàng thành công mới
  được đánh giá (sao 1-5 + bình luận), hiển thị ngay không qua kiểm duyệt,
  điểm trung bình + biểu đồ phân bố sao tính theo thời gian thực; khách có
  thể sửa/xóa đánh giá của chính mình
- **Sổ địa chỉ** nhiều địa chỉ giao hàng, đánh dấu 1 địa chỉ mặc định — tự
  điền sẵn thông tin ở trang thanh toán
- Đăng nhập bằng email/mật khẩu hoặc **Google Sign-In**
- Trang pháp lý: Chính sách bảo mật, Điều khoản dịch vụ, Chính sách đổi trả
  (`/privacy-policy`, `/terms`, `/return-policy`), có Footer điều hướng toàn
  site và menu mobile (hamburger) cho nav chính
- **Trợ lý AI**: tư vấn mua sắm dựa trên catalog thật (Google Gemini)

### Thanh toán
- **COD** (thanh toán khi nhận hàng): tồn kho được giữ ngay khi tạo đơn
- **Chuyển khoản VietQR** (qua PayOS): sinh mã QR động, xác nhận thanh toán
  qua webhook có kiểm tra chữ ký + đối chiếu đúng số tiền; trang checkout tự
  động polling trạng thái và chuyển sang "Thanh toán thành công" ngay khi
  webhook xác nhận, không cần tải lại trang. Tồn kho **chỉ bị trừ đúng lúc
  webhook xác nhận thanh toán thành công** (không trừ ngay lúc tạo đơn như
  COD) — tránh tình trạng "hết hàng ảo" nếu khách bỏ ngang không thanh toán.
  Trường hợp hàng vừa hết đúng lúc thanh toán về (hiếm), hệ thống vẫn ghi
  nhận giao dịch và gắn cờ cảnh báo cho Admin xử lý thủ công, không tự động
  hoàn tiền

### Quản trị (Admin)
- CRUD sản phẩm đầy đủ với biến thể màu sắc (ảnh/giá/tồn kho riêng từng
  màu), upload ảnh theo cấu trúc thư mục phân tầng trên Cloudinary
- Thông số kỹ thuật & điểm nhấn sản phẩm nhập qua trình xây dựng key-value
  động (không cần biết cú pháp JSON)
- Quản lý **Danh mục chính / Danh mục con / Thương hiệu** ngay trong form
  sản phẩm qua dropdown động + modal "Thêm mới nhanh" (không cần thao tác
  database thủ công)
- Danh sách sản phẩm phân trang phía server, tìm kiếm theo tên/SKU, lọc theo
  danh mục/danh mục con/thương hiệu; **cảnh báo tồn kho thấp** trực quan trên
  bảng (badge theo từng biến thể màu)
- **Quản lý đơn hàng**: bảng phân trang + filter/tìm kiếm, xem chi tiết,
  cập nhật trạng thái giao hàng theo đúng quy trình hợp lệ (state machine —
  không cho nhảy cóc trạng thái), tự động hoàn tồn kho khi hủy đơn
- **Nhật ký hoạt động (Audit Log)**: ghi lại các thao tác nhạy cảm (tạo/sửa/
  xóa sản phẩm, đổi trạng thái đơn hàng, đổi mật khẩu, tải ảnh lên...) kèm
  người thực hiện, thời gian, địa chỉ IP

## Tech Stack

| Layer | Công nghệ |
|---|---|
| Backend | NestJS 11, TypeScript, Prisma ORM 6 |
| Database | PostgreSQL ([Neon](https://neon.tech) serverless) |
| Cache | Redis ([Upstash](https://upstash.com)) |
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS |
| Auth | JWT (cookie `HttpOnly`) + Refresh Token rotation, Google Sign-In (`@react-oauth/google` + `google-auth-library`) |
| Thanh toán | [PayOS](https://payos.vn) (VietQR), mã QR render phía client bằng `qrcode.react` |
| Lưu trữ ảnh | [Cloudinary](https://cloudinary.com) |
| AI | Google Gemini API (`@google/genai`) |
| Logging | Pino (structured JSON logs) |
| Error tracking | [Sentry](https://sentry.io) |
| Rate limiting | `@nestjs/throttler` |

## Bảo mật

- Toàn bộ giá trị giao dịch (`totalAmount`, số tiền thanh toán) được **server
  tự tính lại từ database**, không tin bất kỳ giá trị nào client gửi lên
- Webhook thanh toán được xác thực bằng chữ ký (HMAC) trước khi xử lý, đối
  chiếu số tiền nhận được với số tiền thật của đơn hàng trước khi đánh dấu
  đã thanh toán
- Access token sống ngắn hạn (15 phút), Refresh Token lưu dạng hash trong DB,
  tự động rotate mỗi lần dùng
- Rate limiting theo từng endpoint nhạy cảm (đăng nhập, đăng ký, AI chat, tra
  cứu đơn hàng)
- Validate chặt input đầu vào (`whitelist` + `forbidNonWhitelisted`), chặn
  field lạ trong mọi request
- Phân quyền theo vai trò (RBAC: `ADMIN` / `VENDOR` / `CUSTOMER`) ở tầng
  Guard, kiểm tra quyền sở hữu (ownership) cho dữ liệu cá nhân
- Ghi nhật ký hoạt động (Audit Log) cho các thao tác quản trị nhạy cảm

## Cấu trúc thư mục

```
quoce-store/
├── backend/                # NestJS API
│   ├── src/
│   │   ├── auth/              # Xác thực (JWT, Google), Guard, Strategy
│   │   ├── users/               # Hồ sơ người dùng
│   │   ├── product/               # Sản phẩm & biến thể
│   │   ├── categories/              # Danh mục chính (MDM)
│   │   ├── sub-categories/            # Danh mục con (MDM)
│   │   ├── brands/                      # Thương hiệu (MDM)
│   │   ├── orders/                        # Đơn hàng & trạng thái giao hàng
│   │   ├── discounts/                       # Mã giảm giá
│   │   ├── payment/                           # Tích hợp PayOS (QR, webhook)
│   │   ├── reviews/                             # Đánh giá sản phẩm
│   │   ├── addresses/                             # Sổ địa chỉ giao hàng
│   │   ├── cloudinary/                              # Upload ảnh
│   │   ├── ai/                                        # Trợ lý AI (Gemini)
│   │   ├── health/                                      # Health check
│   │   └── common/                                    # Filter, Interceptor,
│   │                                                     Audit Log dùng chung
│   └── prisma/
│       ├── schema.prisma       # Data model
│       └── seed.ts               # Dữ liệu mẫu (tài khoản Admin, danh mục...)
├── frontend/                # Next.js storefront + admin panel
│   └── src/
│       ├── app/                # Routes (App Router) — storefront, tài
│       │                         khoản, `/admin/*`, trang pháp lý
│       ├── components/           # Header, Footer, ConfirmModal, ProductCard...
│       ├── context/                # React Context (Auth, Cart)
│       └── lib/                      # API client, nhãn hiển thị dùng chung
└── README.md
```

## Bắt đầu

### Yêu cầu

- Node.js ≥ 20
- Tài khoản ở các dịch vụ ngoài liệt kê bên dưới (đều có gói miễn phí đủ
  dùng cho môi trường phát triển)

Dự án phụ thuộc vào 4 dịch vụ **bắt buộc** (Database, Cache, Lưu ảnh, Thanh
toán) và 3 dịch vụ **tùy chọn** (Google Sign-In, Trợ lý AI, Error tracking —
thiếu thì tính năng tương ứng tự tắt graceful, không crash toàn hệ thống).

#### 1. Neon (PostgreSQL) — bắt buộc

1. Vào [neon.tech](https://neon.tech), đăng ký/đăng nhập, tạo **New Project**.
2. Sau khi project được tạo, vào tab **Connection Details**, sao chép
   **Connection string** (dạng `postgresql://user:password@host/dbname?sslmode=require`).
3. Dán giá trị này vào `DATABASE_URL` trong `backend/.env`.

#### 2. Upstash (Redis) — bắt buộc

1. Vào [upstash.com](https://upstash.com), đăng ký/đăng nhập, tạo
   **Create Database** (chọn vùng gần server backend nhất để giảm độ trễ).
2. Trong trang chi tiết database, tìm mục **Redis Connect** → sao chép URL
   dạng **`rediss://...`** (chú ý **2 chữ `s`** — bản mã hóa TLS, không dùng
   nhầm bản `redis://` một chữ `s`).
3. Dán vào `REDIS_URL` trong `backend/.env`.

#### 3. Cloudinary — bắt buộc

1. Vào [cloudinary.com](https://cloudinary.com), đăng ký/đăng nhập.
2. Ở trang **Dashboard** mặc định sau khi đăng nhập, lấy 3 giá trị hiển thị
   sẵn: **Cloud Name**, **API Key**, **API Secret**.
3. Điền vào `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
   `CLOUDINARY_API_SECRET` trong `backend/.env`.

#### 4. PayOS — bắt buộc

1. Đăng ký tài khoản tại [PayOS](https://payos.vn) và tạo 1 kênh thanh toán
   (payment channel).
2. Trong trang quản trị kênh thanh toán, lấy **Client ID**, **API Key**,
   **Checksum Key** → điền vào `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`,
   `PAYOS_CHECKSUM_KEY` trong `backend/.env`.
3. **Đăng ký Webhook** — đây là bước dễ bị bỏ sót: PayOS Dashboard **không
   có ô nhập tay** cho URL webhook, việc đăng ký phải thực hiện qua API
   `payos.webhooks.confirm(webhookUrl)` của SDK. Sau khi backend đã chạy và
   có URL truy cập được từ internet (domain thật khi deploy, hoặc tunnel như
   `ngrok http 5000` khi phát triển cục bộ), chạy 1 lần đoạn script sau
   (thay `<URL_CONG_KHAI>` bằng URL thật của bạn):

   ```js
   // scripts/confirm-webhook.js — chạy 1 lần: node scripts/confirm-webhook.js
   require('dotenv').config();
   const { PayOS } = require('@payos/node');

   const payos = new PayOS({
     clientId: process.env.PAYOS_CLIENT_ID,
     apiKey: process.env.PAYOS_API_KEY,
     checksumKey: process.env.PAYOS_CHECKSUM_KEY,
   });

   payos.webhooks
     .confirm('<URL_CONG_KHAI>/payments/payos-webhook')
     .then((res) => console.log('Đăng ký webhook thành công:', res))
     .catch((err) => console.error('Đăng ký thất bại:', err));
   ```

   Chạy trong thư mục `backend/` (script cần `@payos/node` và biến môi
   trường đã cấu hình sẵn). Chỉ cần làm lại khi URL backend thay đổi (VD đổi
   domain production, hoặc URL tunnel dev mới).

#### 5. Google Cloud Console — tùy chọn (bật nút "Đăng nhập với Google")

1. Vào [Google Cloud Console](https://console.cloud.google.com), tạo project
   mới hoặc chọn project có sẵn.
2. Vào **APIs & Services → OAuth consent screen**, cấu hình thông tin ứng
   dụng cơ bản (tên, email hỗ trợ) — chọn loại **External** nếu chưa có
   Google Workspace tổ chức riêng.
3. Vào **APIs & Services → Credentials → Create Credentials → OAuth client
   ID**, chọn **Application type: Web application**.
4. Ở mục **Authorized JavaScript origins**, thêm URL frontend (VD
   `http://localhost:3000` khi phát triển, và domain thật khi deploy).
   Không cần khai báo Authorized redirect URI (thư viện `@react-oauth/google`
   dùng popup, không cần redirect).
5. Sau khi tạo xong, sao chép **Client ID** — dùng **CÙNG 1 giá trị** này
   cho cả `GOOGLE_CLIENT_ID` (`backend/.env`) và
   `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (`frontend/.env`).

#### 6. Google AI Studio — tùy chọn (bật Trợ lý AI)

1. Vào [Google AI Studio](https://aistudio.google.com), đăng nhập bằng tài
   khoản Google.
2. Vào mục **Get API key**, tạo key mới.
3. Điền vào `GEMINI_API_KEY` trong `backend/.env`.

#### 7. Sentry — tùy chọn (Error tracking)

1. Vào [sentry.io](https://sentry.io), tạo project mới, chọn platform
   **Node.js/NestJS**.
2. Sao chép **DSN** hiển thị trong bước cài đặt (hoặc **Settings → Client
   Keys (DSN)**).
3. Điền vào `SENTRY_DSN` trong `backend/.env`.

### Cài đặt

```bash
git clone https://github.com/hongquoccoder/QuoceStore.git
cd QuoceStore
```

**8. Cài đặt Backend**

```bash
cd backend
npm install
cp .env.example .env   # điền các giá trị đã lấy được ở các bước trên
```

**9. Khởi tạo database**

```bash
npx prisma migrate dev    # tạo toàn bộ bảng theo schema
npx prisma db seed        # tạo dữ liệu mẫu: 1 tài khoản Admin + danh mục mẫu
```

> Sau khi seed, có thể đăng nhập trang quản trị bằng tài khoản mẫu
> `admin@quoce.vn` / `123456` (chỉ dùng cho môi trường phát triển — đổi mật
> khẩu hoặc tạo tài khoản Admin khác trước khi triển khai thật).

**10. Chạy Backend & Frontend**

```bash
# Vẫn trong thư mục backend/
npm run start:dev       # http://localhost:5000

# Terminal khác, thư mục frontend/
cd frontend
npm install
cp .env.example .env    # nếu chưa có .env.example, tạo file .env với 2 biến ở bảng bên dưới
npm run dev              # http://localhost:3000
```

**11. (Tùy chọn) Xem/sửa dữ liệu trực quan**

```bash
cd backend
npx prisma studio        # mở giao diện GUI quản lý database tại http://localhost:5555
```

### Biến môi trường (Backend — `backend/.env`)

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `PORT` | tùy chọn | Cổng chạy server, mặc định `5000` |
| `DATABASE_URL` | ✅ | Connection string PostgreSQL (Neon) |
| `JWT_SECRET` | ✅ | Chuỗi bí mật ký JWT, tối thiểu 32 ký tự |
| `FRONTEND_URL` | ✅ | Domain frontend, dùng cho CORS + redirect URL của PayOS |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary — Cloud Name |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary — API Key |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary — API Secret |
| `PAYOS_CLIENT_ID` | ✅ | PayOS — Client ID |
| `PAYOS_API_KEY` | ✅ | PayOS — API Key |
| `PAYOS_CHECKSUM_KEY` | ✅ | PayOS — Checksum Key (dùng để xác thực chữ ký webhook) |
| `REDIS_URL` | ✅ | Connection string Redis (Upstash), dạng `rediss://...` |
| `GOOGLE_CLIENT_ID` | tùy chọn | Bật Google Sign-In — thiếu thì tính năng tự tắt graceful |
| `GEMINI_API_KEY` | tùy chọn | Bật Trợ lý AI — thiếu thì tính năng tự tắt |
| `SENTRY_DSN` | tùy chọn | Bật Error Tracking |
| `NODE_ENV` | tùy chọn | `development` \| `production` |

### Biến môi trường (Frontend — `frontend/.env`)

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | URL backend, VD `http://localhost:5000` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | tùy chọn | Bật nút "Đăng nhập với Google" trên `/login` và `/register` — thiếu thì nút tự ẩn |

## Scripts

| Lệnh (chạy trong `backend/` hoặc `frontend/`) | Mô tả |
|---|---|
| `npm run start:dev` (backend) | Chạy backend, watch mode |
| `npm run dev` (frontend) | Chạy frontend, hot reload |
| `npm run build` | Build production |
| `npx prisma studio` (backend) | GUI xem/sửa dữ liệu database |
| `npx prisma migrate dev --name <mô_tả>` (backend) | Tạo migration mới |
| `npx prisma db seed` (backend) | Tạo lại dữ liệu mẫu (Admin + danh mục) |
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
