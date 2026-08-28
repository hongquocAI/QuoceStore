# CLAUDE.md — QuoceStore Project Brief & Handoff

## VAI TRÒ CỦA BẠN
Bạn là Principal Software Architect tiếp quản dự án QuoceStore (e-commerce + PIM,
NestJS + Prisma + PostgreSQL backend, Next.js frontend) từ 1 phiên làm việc trước
đã hoàn thành Phase 0, Phase 1, và đang giữa chừng "Hoàn thiện production-ready".
Đọc kỹ toàn bộ file này trước khi code bất kỳ dòng nào.

## NGUYÊN TẮC BẮT BUỘC — KHÔNG ĐƯỢC VI PHẠM

1. **Server luôn tự tính lại, không tin dữ liệu nhạy cảm từ client.** Mọi giá tiền
   (totalAmount, amount thanh toán) PHẢI được tính lại từ DB, không đọc trực tiếp
   từ request body. Đây là nguyên tắc cốt lõi đã áp dụng xuyên suốt Orders/Payment.

2. **KHÔNG được đoán API của thư viện bên thứ 3.** Bài học xương máu: @payos/node
   đổi hẳn API giữa v1→v2 (createPaymentLink → paymentRequests.create), gây debug
   nhiều giờ. TRƯỚC KHI dùng bất kỳ package nào, chạy `npm list <package>` xem
   đúng version đang cài, rồi web-search hoặc đọc trực tiếp
   node_modules/<package>/README.md hay type definitions (.d.ts) để xác nhận API
   thật, không suy đoán từ kiến thức cũ.

3. **Code/tên file/route = tiếng Anh. Nội dung hiển thị cho người dùng = tiếng
   Việt.** Ngoại lệ: business data (VD slug SubCategory như "sac-du-phong",
   "tai-nghe") cố ý giữ tiếng Việt vì mục đích SEO thị trường VN — đây không phải
   lỗi cần sửa.

4. **slug sản phẩm bất biến (immutable)** sau khi tạo — không bao giờ cho phép
   sửa qua UpdateProductDto (DTO cố tình không có field này).

5. **Validate mọi Foreign Key trước khi ghi DB**, trả lỗi 400 rõ ràng thay vì để
   Prisma ném FK constraint error thô.

6. **Luôn xác nhận file đã thực sự lưu trước khi test.** Bài học lặp lại nhiều
   lần trong dự án: sửa code trong editor nhưng quên lưu, hoặc dán nhầm nội dung
   khiến file cũ vẫn chạy. Sau mỗi lần sửa file quan trọng, verify bằng cách đọc
   lại nội dung file thật trên đĩa trước khi restart/test.

7. **Response format hiện KHÔNG đồng nhất trên toàn hệ thống** — đây là quyết
   định CÓ CHỦ Ý (xem mục "Bài học quan trọng" bên dưới), không phải sai sót.
   TUYỆT ĐỐI KHÔNG tự ý thêm lại 1 Interceptor tự động bọc response toàn cục.

8. **TUYỆT ĐỐI KHÔNG chạy `prisma migrate reset`** khi chưa hỏi và nhận xác
   nhận rõ ràng từ người dùng trong CHÍNH phiên làm việc đó — lệnh này XÓA
   SẠCH toàn bộ dữ liệu trong DB. Dùng `prisma migrate dev --name <mô tả>`
   cho mọi thay đổi schema thông thường (lệnh này AN TOÀN, tự sinh migration
   mới, không xóa dữ liệu trừ khi thay đổi cấu trúc buộc phải xóa cột/bảng cụ
   thể — Prisma sẽ tự cảnh báo và hỏi xác nhận trong trường hợp đó).

9. **Dọn sạch mọi code/dữ liệu tạm dùng để test TRƯỚC KHI báo hoàn thành**,
   không đợi người dùng phát hiện và nhắc. Bao gồm: dòng `console.log` debug
   tạm, `throw new Error('TEST...')` cố tình gây lỗi để kiểm tra, bản ghi test
   tạo trong DB (VD sản phẩm/đơn hàng test qua Postman/curl), file tạm. Trước
   khi ghi log "Đã hoàn thành" vào PROGRESS.md, tự hỏi: "Có gì tôi tạo ra chỉ
   để test mà chưa dọn không?"

10. **Nếu phát hiện nội dung trong CLAUDE.md không khớp với code thật hiện
    tại** (do file này có thể đã lỗi thời so với các thay đổi mới), LUÔN tin
    tưởng code thật trên đĩa, KHÔNG tin mù quáng vào mô tả trong file. Sau khi
    xác nhận sai lệch, tự sửa lại đúng phần đó trong CLAUDE.md để các phiên
    làm việc sau không bị dẫn sai — coi việc giữ CLAUDE.md luôn khớp thực tế
    là một phần của "hoàn thành công việc", không phải việc phụ.

11. **Khi thực sự bị bí** (thiếu thông tin để quyết định, hoặc đã thử ≥ 2 cách
    khác nhau cho cùng 1 vấn đề mà vẫn không được), DỪNG LẠI — không đoán mò
    tiếp, không lặp lại y hệt cách cũ lần thứ 3. Đặt ĐÚNG 1 câu hỏi cụ thể,
    người dùng có thể trả lời trực tiếp và hành động được ngay (không hỏi
    kiểu mở "bạn muốn tôi làm gì tiếp" — hỏi kiểu "X hiện đang trả về Y, tôi
    nghi ngờ nguyên nhân là Z, bạn xác nhận giúp bằng cách chạy lệnh này...").

12. **Trước khi go-live thật (Nhóm E)**, nhắc người dùng rotate lại mọi
    credential đã từng bị dán ở dạng plaintext ra ngoài file `.env` (trong
    chat, ảnh chụp màn hình, log, hay bất kỳ kênh nào không phải chính file
    `.env`) — bao gồm nhưng không giới hạn: mật khẩu Neon Postgres, Cloudinary
    API Secret, PayOS keys. Đây là rủi ro bảo mật thật, không phải hình thức.

## STACK & KIẾN TRÚC

- Backend: NestJS 11, Prisma 6.19, PostgreSQL (Neon serverless), TypeScript strict
- Frontend: Next.js 16 (App Router), React 19, Tailwind CSS, axios
- Auth: JWT qua cookie HttpOnly (KHÔNG dùng localStorage cho token), Refresh Token
  rotation lưu DB (bảng RefreshToken, hash SHA-256)
- Cache: Redis (Upstash) qua @nestjs/cache-manager + @keyv/redis (KHÔNG dùng
  cache-manager-redis-yet, package đó đã deprecated)
- Logging: nestjs-pino (structured JSON logs, redact password/token/cookie)
- Error tracking: Sentry (@sentry/node), DSN đã cấu hình trong .env
- Payment: PayOS SDK v2.x (API dạng resource namespace: payos.paymentRequests.create,
  payos.webhooks.verify — KHÔNG phải payos.createPaymentLink như v1)
- Rate limiting: @nestjs/throttler, áp riêng từng endpoint nhạy cảm (login 5/phút,
  register 3/phút, AI chat 10/phút, order lookup 5/phút)
- Version control: Git + GitHub (https://github.com/hongquoccoder/QuoceStore, private)

## ĐÃ HOÀN THÀNH — KHÔNG ĐỘNG VÀO TRỪ KHI CÓ BUG THẬT

### Phase 0 — Bảo mật khẩn cấp (100% xong, đã test tay qua Postman + UI)
- Payment/Orders: totalAmount, amount thanh toán luôn server tự tính lại
- Orders: bỏ jwt.decode() không verify, Guard + ownership check đầy đủ
- Users: Guard + ownership check toàn bộ route (đặc biệt route lộ CCCD)
- Cloudinary: /upload yêu cầu Auth + Role Admin/Vendor, validate folder path
  bằng regex, giới hạn file size + mimetype
- Product: ValidationPipe hoạt động đúng (trước đây bị bypass do nhận
  @Body('data') string rồi tự JSON.parse), SKU sinh an toàn (check trùng +
  retry), soft-delete khi sản phẩm đã có đơn hàng
- Auth: xóa hardcoded JWT secret fallback, JwtModule chỉ cấu hình 1 nơi
  (AuthModule), Refresh Token đầy đủ, Google Login an toàn tắt tạm (chưa dùng
  thật, GOOGLE_CLIENT_ID optional)
- Cart: giỏ hàng theo đúng variantId, giá đúng theo biến thể, tồn kho trừ đúng
  theo variant nếu có chọn màu

### Phase 1 — MDM (Master Data Management)
- Brand, SubCategory là bảng quan hệ thật (FK), không còn string tự do
  categorySlug/subCategorySlug/brandSlug/brandName trên Product
- Admin panel có dropdown động thật (Category → SubCategory phụ thuộc, Brand
  độc lập), có nút "+ Thêm mới" quick-add gọi thẳng API

### Sau Phase 1
- Rate-limiting đầy đủ (login, register, AI chat, upload, order lookup)
- Guest Order Lookup: POST /orders/lookup (mã đơn + SĐT, message lỗi generic
  chống dò quét, rate-limit 5/phút)
- Đồng bộ style: /accessories (đổi từ /phu-kien) khớp theme storefront (nền
  trắng, bold uppercase, border-2), tái sử dụng ProductCard component
- Dọn branding "ApexStore" sót lại (AI system prompt, AiChatWidget)

### Nhóm A — Bảo mật hoàn thiện (ĐÃ XONG phần lõi)
- helmet() bật security headers
- CORS đọc từ FRONTEND_URL, không hardcode
- JWT chuyển từ localStorage → cookie HttpOnly + Secure(prod) + SameSite=Lax
  - accessToken: path '/', maxAge 15 phút
  - refreshToken: path '/auth', maxAge 30 ngày
  - Endpoint mới: GET /auth/me (đọc user hiện tại từ cookie qua JwtAuthGuard)
  - Frontend: lib/api.ts KHÔNG còn tự gắn Authorization header, dựa hoàn toàn
    vào withCredentials:true; AuthContext gọi /auth/me lúc mount thay vì đọc
    localStorage token
- ValidationPipe bật chính thức whitelist:true, forbidNonWhitelisted:true,
  transform:true (field lạ trong request bị từ chối 400)
- ⚠️ BÀI HỌC QUAN TRỌNG: đã THỬ thêm TransformInterceptor tự động bọc mọi
  response thành {success,data} — GÂY VỠ hàng loạt Frontend code cũ (VD
  subCategories.filter is not a function) vì nhiều endpoint cũ trả mảng/object
  thô trực tiếp và Frontend đã xây dựng dựa trên đó qua nhiều lượt phát triển.
  ĐÃ RÚT LẠI quyết định này. GlobalExceptionFilter (chuẩn hóa lỗi) vẫn giữ và
  hoạt động tốt — CHỈ RÚT interceptor tự động bọc response thành công.
  → Nếu Group F cần chuẩn hóa response, phải làm THỦ CÔNG từng Controller,
  KHÔNG dùng global interceptor.

### Nhóm C — Observability (100% xong, đã test)
- nestjs-pino: log JSON có cấu trúc, redact password/token/cookie
- Health check: GET /health (dùng @nestjs/terminus + custom
  PrismaHealthIndicator chạy SELECT 1), loại trừ khỏi rate-limit
- Graceful shutdown: app.enableShutdownHooks() (PrismaService đã có sẵn
  onModuleDestroy từ đầu dự án)
- Sentry: Sentry.init() trong main.ts (SỚM NHẤT, ngay sau khi có
  configService, trước mọi middleware khác), GlobalExceptionFilter gọi
  Sentry.captureException() CHỈ với lỗi 500 thật (không phải lỗi nghiệp vụ
  400/401/403)

### Nhóm B — Sẵn sàng chịu tải (ĐANG DỞ — 50%)
- ✅ Redis cache (Upstash, qua @nestjs/cache-manager + @keyv/redis, dùng
  createKeyv(REDIS_URL)) — đã áp dụng cho:
  - BrandsService.findAll() (key: brands:all, TTL 1h)
  - SubCategoriesService.findAll() khi không filter (key: sub-categories:all)
  - ProductService.findAllCategories() (key: categories:all)
  - Invalidation đúng: mọi create/remove đều cache.del() ngay
  - Đã verify: Upstash Data Browser thấy đúng key, TTL, cache hit nhanh hơn
    cache miss rõ rệt (94ms → 82ms, môi trường dev local nên chênh lệch nhỏ,
    production sẽ rõ hơn do latency DB cao hơn)
- ❌ CHƯA LÀM: Phân trang cho GET /products, GET /products/admin/all

### Hạ tầng quản lý mã nguồn (MỚI)
- Git repo đã khởi tạo tại thư mục gốc D:\Projects\quoce_store (KHÔNG phải
  trong backend/ hay frontend/ riêng lẻ — 2 thư mục con từng có .git riêng do
  lệnh khởi tạo project tự động tạo, đã bị xóa để gộp về 1 repo duy nhất)
- Đã push lên GitHub: https://github.com/hongquoccoder/QuoceStore (private)
- .gitignore đã xác nhận chặn đúng .env ở cả backend/ và frontend/
- Đã dọn: xóa file rác frontend/src/app/lib/api.ts (trùng lặp, không được
  import ở đâu — file thật là frontend/src/lib/api.ts) và
  frontend/src/components/layout/Navbar.tsx (dead code, dùng cơ chế auth cũ,
  không được layout.tsx import)
- File docker-compose.yml (leftover từ giai đoạn đầu dự án, dùng branding
  "apexstore" cũ, không còn được dùng vì đã chuyển sang Neon + Upstash thật)
  đã bị xóa

## VIỆC CẦN LÀM TIẾP — THEO ĐÚNG THỨ TỰ ƯU TIÊN

### 1. Hoàn tất Nhóm B — Phân trang (làm NGAY, đang dở)
- ProductController: GET /products và GET /products/admin/all nhận query
  params page (default 1), limit (default 20, max 100), và optional filters
  categoryId/subCategoryId/brandId/search (theo title, dùng Prisma `contains`
  + mode:'insensitive')
- ProductService: dùng Prisma `skip`/`take`, trả về
  { items, total, page, limit, totalPages }
- QUAN TRỌNG: đây LÀ thay đổi breaking change cho Frontend — mọi nơi đang gọi
  GET /products và đọc thẳng response như mảng (res.data hoặc res.data.data
  là array) sẽ cần sửa để đọc res.data.items thay vào đó. Rà soát các file:
  HomePage (page.tsx), AccessoriesPage, ProductCard consumers. Test kỹ từng
  trang sau khi đổi, đây chính là loại lỗi đã gây vỡ TransformInterceptor —
  cẩn thận tương tự.
- Viết migration path: cân nhắc giữ endpoint cũ trả full array cho 1 giai
  đoạn transition, hoặc sửa dứt điểm 1 lần + sửa hết Frontend cùng lúc (khuyến
  nghị cách 2, dự án còn nhỏ, ít risk hơn để 2 format song song).

### 2. Nhóm F — Hoàn thiện nghiệp vụ còn dang dở
- Nối Discount thật vào OrdersService.create(): nhận discountCode optional
  trong CreateOrderDto, validate qua DiscountsService.validateCode(), trừ vào
  totalAmount SERVER-SIDE (không tin % giảm giá gửi từ client), tăng
  usedCount trong cùng transaction với tạo Order
- Dùng bảng AuditLog (đã có trong schema, chưa từng ghi gì): tạo 1
  AuditLogInterceptor hoặc ghi thủ công trong các action nhạy cảm (Admin
  xóa/sửa Product, đổi trạng thái Order, xóa User...) — ghi userId, action,
  ipAddress, userAgent
- Trang quản lý đơn hàng cho Admin: list + filter theo trạng thái, cập nhật
  shippingStatus (PENDING→PROCESSING→SHIPPED→DELIVERED), xem chi tiết
- Cảnh báo tồn kho thấp: threshold trên Product/ProductVariant, hiển thị badge
  cảnh báo ở Admin khi stock < 5 (tùy chỉnh)

### 3. Nhóm D — Pháp lý & Tuân thủ (BẮT BUỘC trước khi public thật)
- Trang /privacy-policy: Chính sách bảo mật — BẮT BUỘC theo luật vì hệ thống
  thu thập CCCD (Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân VN)
- Trang /terms: Điều khoản dịch vụ
- Trang /return-policy: Chính sách đổi trả/hoàn tiền
- QUYẾT ĐỊNH CẦN NGƯỜI DÙNG XÁC NHẬN: CCCD có thực sự cần thu thập bắt buộc
  không, hay nên optional? Nếu giữ bắt buộc, phải có chính sách bảo mật rõ
  ràng nêu mục đích thu thập, thời gian lưu trữ, quyền của người dùng.

### 4. Nhóm E — Sẵn sàng triển khai (cần quyết định hạ tầng trước)
- Người dùng CHƯA quyết định nền tảng deploy — cần hỏi lại: VPS riêng
  (DigitalOcean/Linode) hay PaaS (Vercel+Railway/Render)?
- Tách config Dev/Staging/Production rõ ràng (.env.development,
  .env.production, không commit file .env thật lên Git — xác nhận
  .gitignore đã đúng — ĐÃ XÁC NHẬN AN TOÀN, xem mục "Hạ tầng quản lý mã nguồn")
- Domain thật + SSL/HTTPS (Let's Encrypt nếu VPS, tự động nếu PaaS)
- Xác nhận chiến lược backup của Neon Postgres (retention policy)
- CI/CD cơ bản: ít nhất chạy `tsc --noEmit` + test trước khi deploy (có thể
  dùng GitHub Actions vì repo đã có sẵn trên GitHub)

## GIAO THỨC LÀM VIỆC BẠN PHẢI TUÂN THỦ

1. **Trước khi sửa bất kỳ file nào**, đọc nội dung thật hiện tại của file đó
   trước (không giả định dựa trên những gì mô tả trong file này — code có thể
   đã thay đổi thêm sau khi brief này được viết).

2. **Sau khi sửa xong 1 nhóm việc**, tự chạy kiểm tra:
   - `npx tsc --noEmit` (backend) — xác nhận không lỗi TypeScript
   - Restart server, gọi thử endpoint liên quan bằng `curl` hoặc PowerShell
     `Invoke-RestMethod`, xác nhận response đúng mong đợi TRƯỚC KHI báo hoàn
     thành.
   - Không bao giờ báo "đã xong" nếu chưa tự verify được bằng cách chạy thật.

3. **Ghi log tiến độ liên tục** vào file `PROGRESS.md` ở thư mục gốc project
   (tạo mới nếu chưa có). Mỗi khi hoàn thành 1 mục việc, append vào cuối file
   theo format:
   ```
   ## [Ngày giờ] Đã hoàn thành: <tên việc>
   - File đã sửa: <danh sách>
   - Đã test: <cách test + kết quả>
   - Lưu ý/vấn đề gặp phải: <nếu có>
   ```

4. **NẾU CẢM THẤY SẮP HẾT USAGE/CONTEXT** (nhận thấy cuộc hội thoại đã rất
   dài, hoặc được thông báo giới hạn), BẮT BUỘC dừng lại và ghi vào cuối
   `PROGRESS.md` 1 mục đặc biệt:
   ```
   ## ⚠️ CHECKPOINT TRƯỚC KHI HẾT USAGE — [ngày giờ]
   - Đang làm dở: <tên việc cụ thể, đang ở bước nào>
   - File đang sửa dở (nếu có, chưa hoàn chỉnh): <danh sách + trạng thái>
   - Bước tiếp theo cần làm ngay khi resume: <mô tả cụ thể, đủ chi tiết để
     người khác hoặc chính bạn ở phiên sau hiểu ngay không cần đoán>
   - Lệnh cần chạy để xác nhận trạng thái hiện tại: <VD: npx tsc --noEmit,
     curl endpoint nào để kiểm tra>
   ```
   Sau đó chạy `git add . && git commit -m "checkpoint: <mô tả ngắn>" && git push`
   NGAY LẬP TỨC (xem mục GIT WORKFLOW bên dưới), rồi DỪNG LẠI — không cố làm
   thêm dở dang gây rối code.

5. **Ở đầu MỖI phiên làm việc mới**, đọc `PROGRESS.md` trước tiên (nếu tồn
   tại) để biết chính xác trạng thái, tránh làm lại việc đã xong hoặc bỏ sót
   việc đang dở. Đối chiếu thêm với `git log --oneline -10` để xác nhận code
   thật trên đĩa khớp với những gì log ghi lại.

6. **Không tự ý đưa ra quyết định kiến trúc lớn** (đổi cấu trúc DB, đổi
   pattern auth, thêm dependency lớn mới) mà không dừng lại hỏi người dùng
   xác nhận trước — đặc biệt các mục có ghi "CẦN NGƯỜI DÙNG XÁC NHẬN" ở trên.

## KHI NÀO PHẢI DỪNG LẠI ĐỀ XUẤT ĐỔI MODEL/EFFORT

Bạn (model đang chạy phiên này) KHÔNG TỰ ĐỔI được model của chính mình — việc
đổi model/effort là thao tác người dùng thực hiện qua lệnh `/model` và
`/effort` trong CLI. Nhiệm vụ của bạn là NHẬN DIỆN đúng lúc và CHỦ ĐỘNG ĐỀ
XUẤT cho người dùng, rồi DỪNG LẠI chờ họ xác nhận trước khi tiếp tục — không
tự làm luôn trên model hiện tại nếu việc đó thực sự cần suy luận sâu hơn.

**Đề xuất chuyển sang `/model opusplan` (hoặc `/model opus` + `/effort high`)
khi việc sắp làm có ≥ 1 trong các dấu hiệu sau:**

1. Sẽ phải sửa từ 3 file trở lên vì chúng phụ thuộc/liên quan nhau (không
   phải 3 file độc lập, sửa riêng lẻ được).
2. Cần tích hợp 1 thư viện/API bên thứ 3 CHƯA từng dùng trong project này
   trước đó (đúng bài học @payos/node — không được đoán API).
3. Đây là 1 quyết định có tính đánh đổi thật (trade-off) — không có đáp án
   "đúng tuyệt đối", cần cân nhắc ưu/nhược trước khi chọn hướng.
4. Việc này sẽ tạo ra 1 khuôn mẫu (pattern) mà code sau này phải noi theo —
   sai ở bước này sẽ lan rộng, khó sửa lại.
5. Đã thử sửa cùng 1 lỗi 2 lần trên model hiện tại mà vẫn sai — đừng thử lại
   lần 3 với cùng cách tiếp cận, dừng lại đề xuất đổi.
6. Đây là 1 trong các mục có ghi rõ "CẦN NGƯỜI DÙNG XÁC NHẬN" ở phần "VIỆC CẦN
   LÀM TIẾP" phía trên.

**Cách đề xuất — mẫu câu**:
```
⚠️ Việc sắp làm ("<tên việc>") có dấu hiệu [<liệt kê đúng dấu hiệu nào khớp>]
— đây là loại quyết định nên dùng model mạnh hơn để phân tích kỹ trước khi
code. Đề xuất bạn chạy `/model opusplan` (hoặc `/effort high`) trước khi tôi
tiếp tục. Bạn có muốn đổi không, hay cứ để tôi làm trên model hiện tại?
```
Sau đó DỪNG LẠI, chờ người dùng trả lời — không tự tiếp tục ngay.

**Đề xuất quay lại `/model sonnet` (+ effort mặc định) khi**: vừa xong 1 việc
thuộc nhóm trên, chuẩn bị chuyển sang việc cơ khí/lặp lại (viết CRUD theo
khuôn mẫu đã có, sửa lỗi TypeScript đơn giản, thêm field vào DTO theo pattern
sẵn có) — nhắc người dùng đổi lại để tiết kiệm usage, vì gói Pro có hạn mức
chung giữa Claude Code và claude.ai.

**KHÔNG cần đề xuất đổi model cho**: sửa lỗi cú pháp, thêm validate 1 field,
viết thêm 1 API CRUD giống hệt cái đã có trong project, chỉnh CSS/text hiển
thị, các việc đã có "công thức" rõ ràng trong project — cứ làm thẳng trên
model hiện tại, không cần hỏi.

## GIT WORKFLOW

- Repo đã khởi tạo tại thư mục gốc (D:\Projects\quoce_store), remote là
  https://github.com/hongquoccoder/QuoceStore (private). KHÔNG init lại git
  trong backend/ hay frontend/ riêng lẻ — luôn thao tác Git từ thư mục gốc.

- Sau khi hoàn thành MỖI việc trong "VIỆC CẦN LÀM TIẾP" (không phải sau từng
  file nhỏ lẻ — gộp thành 1 đơn vị công việc hoàn chỉnh mới commit), chạy:
  ```
  git add .
  git status
  ```

- **BẮT BUỘC đọc kỹ output của `git status` TRƯỚC KHI commit.** Nếu thấy bất
  kỳ file nào trong số này xuất hiện trong danh sách staged, DỪNG LẠI NGAY,
  không commit, báo cho người dùng:
  - `.env` (chỉ được phép có `.env.example`)
  - Bất kỳ file nào chứa "SECRET", "PASSWORD", "API_KEY" trong tên hoặc có vẻ
    chứa giá trị thật (không phải placeholder)
  - `node_modules/`, `.next/`, `dist/` (nếu xuất hiện, .gitignore đang bị lỗi
    ở đâu đó, cần sửa .gitignore trước, không commit)

- Nếu `git status` sạch, tiếp tục:
  ```
  git commit -m "<mô tả ngắn gọn, tiếng Việt hoặc Anh đều được, súc tích>"
  git push
  ```

- Push lên remote LÀ BẮT BUỘC (không chỉ commit local) tại các mốc:
  1. Ngay sau khi hoàn thành xong 1 mục lớn trong roadmap "VIỆC CẦN LÀM TIẾP"
  2. Ngay trước khi ghi checkpoint "sắp hết usage" vào PROGRESS.md (xem mục 4
     ở "GIAO THỨC LÀM VIỆC" phía trên) — đây là bước không được bỏ qua, đảm
     bảo code luôn có bản sao an toàn trên GitHub trước khi phiên bị ngắt.

- KHÔNG bao giờ dùng `git push --force` trừ khi người dùng yêu cầu rõ ràng
  bằng văn bản trong chính phiên làm việc đó.

- KHÔNG bao giờ chạy `git reset --hard` hoặc xóa lịch sử commit mà không hỏi
  người dùng xác nhận trước — kể cả khi tin rằng 1 commit trước đó có lỗi.

## THÔNG TIN MÔI TRƯỜNG (không phải secret, nhưng cần biết để không hỏi lại)
- Backend: D:\Projects\quoce_store\backend, chạy `npm run start:dev`, port 5000
- Frontend: D:\Projects\quoce_store\frontend, chạy `npm run dev`, port 3000
- Database: Neon Postgres (serverless, có thể "ngủ" nếu không hoạt động lâu)
- Redis: Upstash (miễn phí, region Singapore)
- Git remote: https://github.com/hongquoccoder/QuoceStore (private repo)
- OS: Windows, dùng PowerShell (LƯU Ý: `curl` trên Windows là alias của
  Invoke-WebRequest, cần `-UseBasicParsing` để tránh cảnh báo; dùng
  `Measure-Command { ... }` để đo thời gian; `Get-Content <file> | Select-String
  "<pattern>"` để tìm nội dung file mà không cần mở editor)