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

### ⚠️ BÀI HỌC: payload variants gửi lên POST/PATCH /products
Khi Frontend gửi mảng `variants`, PHẢI map TƯỜNG MINH đúng 6 field mà
`ProductVariantDto` chấp nhận: `colorCode`, `colorName`, `hexCode`, `price`,
`stock`, `images`. TUYỆT ĐỐI KHÔNG gửi lại nguyên object variant vừa đọc từ
`GET /products/:slug` — object đó có kèm `id`/`productId`/`createdAt`/
`updatedAt`, và `forbidNonWhitelisted: true` sẽ trả 400
`variants.0.property id should not exist`. Lỗi này từng làm Admin không sửa
được sản phẩm có biến thể màu, kéo theo không bật lại được `isActive` →
storefront trắng trơn, mất khá nhiều thời gian truy nguyên vì triệu chứng
nhìn không liên quan gì tới variants. Dùng map tường minh, KHÔNG dùng
destructuring `({ id, ...rest }) => rest` — cách đó sẽ lại rò field mới mỗi
khi bảng `ProductVariant` thêm cột.

`ProductService.update()` xử lý variants theo kiểu **xóa sạch rồi tạo lại**
(không upsert so khớp). An toàn vì `OrderItem.variantId` là
`onDelete: SetNull` và `OrderItem.variantColorName` đã snapshot sẵn tên màu
lúc mua. Quy ước 3 ca: `variants` không gửi → giữ nguyên; gửi `[]` → xóa hết;
gửi có phần tử → thay thế toàn bộ.

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

### Nhóm B — Sẵn sàng chịu tải (100% XONG)
- ✅ Redis cache (Upstash, qua @nestjs/cache-manager + @keyv/redis, dùng
  createKeyv(REDIS_URL)) — đã áp dụng cho:
  - BrandsService.findAll() (key: brands:all, TTL 1h)
  - SubCategoriesService.findAll() khi không filter (key: sub-categories:all)
  - ProductService.findAllCategories() (key: categories:all)
  - Invalidation đúng: mọi create/remove đều cache.del() ngay
  - Đã verify: Upstash Data Browser thấy đúng key, TTL, cache hit nhanh hơn
    cache miss rõ rệt (94ms → 82ms, môi trường dev local nên chênh lệch nhỏ,
    production sẽ rõ hơn do latency DB cao hơn)
- ✅ Phân trang cho GET /products và GET /products/admin/all
  - `QueryProductDto` (src/product/dto/query-product.dto.ts) — DTO query đầu
    tiên của dự án, là KHUÔN MẪU cho các endpoint danh sách sau này: `page`
    (default 1), `limit` (default 20, `@Max(100)`), filter `categoryId`/
    `subCategoryId`/`brandId` (`@IsUUID`) và `search`
  - Service dùng `$transaction([findMany, count])` để items và total đọc trên
    cùng 1 ảnh chụp dữ liệu; trả `{ items, total, page, limit, totalPages }`
    (`totalPages` tối thiểu là 1 kể cả khi rỗng). `search` khớp title HOẶC sku
  - ❗ Danh sách sản phẩm CỐ Ý KHÔNG cache — mỗi lời gọi mang tổ hợp
    page/limit/filter khác nhau nên số cache key là vô hạn, và Redis qua Keyv
    không cho xóa theo prefix/wildcard nên không thể invalidate đúng sau mỗi
    create/update/remove. Cùng lý do đã khiến SubCategoriesService bỏ qua cache
    khi có filter
  - BREAKING CHANGE đã xử lý dứt điểm (không giữ song song format cũ): 3 call
    site Frontend đã sửa cùng commit — `app/page.tsx` và
    `app/accessories/page.tsx` (đọc `items`, gọi `limit=100`, GIỮ NGUYÊN lọc
    client-side), `app/admin/products/page.tsx` (phân trang + search có
    debounce 400ms + 3 filter đều SERVER-SIDE, đã xóa `filteredProducts`/
    `paginatedProducts`)
  - ⚠️ Storefront (trang chủ + /accessories) CHƯA phân trang thật — CỐ Ý hoãn,
    không phải bỏ sót. Trang chủ lọc client theo Category + KHOẢNG GIÁ, mà
    backend chưa có filter giá; phân trang thật ngay sẽ khiến lọc giá chỉ áp
    dụng trong 1 trang → sai. Muốn làm tiếp: thêm `minPrice`/`maxPrice` vào
    QueryProductDto TRƯỚC, rồi mới viết lại UI storefront
  - ⚠️ Frontend TUYỆT ĐỐI không được gửi param sentinel kiểu `categoryId=ALL`
    — `forbidNonWhitelisted` + `@IsUUID` sẽ trả 400. Không lọc thì bỏ hẳn
    param đó ra khỏi request
  - ⚠️ DB chưa có index trên `createdAt`/`isActive`/`price`/`title` — sort mặc
    định và `search` hiện quét tuần tự. Chưa ảnh hưởng ở quy mô hiện tại,
    nhưng là việc cần làm khi catalog lớn

### Nhóm F (phần 1) — Discount thật trong OrdersService.create() (100% XONG)
- Schema: thêm `Order.discountCode String?` (snapshot mã) và
  `Order.discountAmount Decimal @default(0)` — migration
  `add_discount_to_order`, chỉ THÊM cột, an toàn
- `DiscountsService.validateCode(code, client?)` nay nhận thêm tham số
  `client` tùy chọn (mặc định `this.prisma`) để `OrdersService.create()` gọi
  lại đúng hàm này TRONG transaction tạo đơn (truyền `tx` vào) — không viết
  lại logic validate ở nơi khác. `DiscountsModule` đã `exports:
  [DiscountsService]`, `OrdersModule` đã import `DiscountsModule`
- `CreateOrderDto.discountCode?` optional. Trong transaction: validate mã →
  tăng `usedCount` CÓ ĐIỀU KIỆN bằng `updateMany({ where: { usedCount: {
  lt: maxUsage } } })` để chống race 2 đơn cùng tranh lượt cuối (nếu
  `count === 0` thì từ chối rõ ràng) → tính `discountAmount = round(
  computedTotalAmount * discount.percentage)` → `totalAmount` cuối = tổng
  gốc trừ discountAmount. Toàn bộ nằm trong transaction hiện có, rollback
  cùng nhau nếu bất kỳ bước nào lỗi (đã verify: mã sai → 404, tồn kho KHÔNG
  bị trừ oan)
  - ⚠️ **`Discount.percentage` lưu dạng THẬP PHÂN** (0.1 = 10%, KHÔNG phải
    10) — đã xác nhận qua dữ liệu thật trong DB (`QUOCE10` → `0.1`) và cách
    `cart/page.tsx` dùng trực tiếp làm hệ số nhân. Nếu sau này thêm màn
    Admin tạo Discount, PHẢI giữ đúng quy ước này (nhập "10%" → lưu `0.1`),
    không đổi lại thành số nguyên
- 🛡️ BUG đã sửa cùng lúc: khối `catch` cuối `OrdersService.create()` trước
  đây chỉ re-throw `BadRequestException`, nuốt mất `NotFoundException` mà
  `validateCode()` throw (mã hết hạn/hết lượt/không tồn tại) và thay bằng
  thông báo chung chung. Đã đổi điều kiện sang `error instanceof
  HttpException` để bao hết mọi lỗi HTTP có chủ đích
- Frontend: mã giảm giá bị RƠI MẤT trước khi tới server (bug có từ trước —
  `cart/page.tsx` chỉ lưu % và tổng tiền đã tính sẵn vào sessionStorage,
  KHÔNG lưu mã code, và `checkout/page.tsx` không đọc lại gì cả). Đã nối lại:
  cart lưu `discountCode` vào sessionStorage → checkout đọc lại, RE-VALIDATE
  qua `GET /discounts/code/:code` (không tin % cũ vì mã có thể hết hạn giữa
  2 bước), hiển thị preview "Giảm giá" + "Tổng cộng", gửi `discountCode` (chỉ
  mã, không gửi % hay số tiền) trong `POST /orders`. Server luôn là nguồn sự
  thật cuối cùng — màn hình kết quả sau khi đặt hàng dùng
  `orderResult.discountAmount` từ response, không dùng số preview client tính
- 🛡️ BUG UX đã sửa (phát hiện qua `curl`): `cart/page.tsx` từng hiển thị
  CỨNG 1 câu lỗi chung cho mọi ca áp mã thất bại, bỏ qua message rõ ràng theo
  từng lý do (hết hạn/hết lượt/không tồn tại) mà `validateCode()` đã trả sẵn.
  Đã sửa đọc `err.response?.data?.message` thay vì chuỗi cứng.

### Nhóm F (phần 2) — Trang quản lý đơn hàng Admin `/admin/orders` (100% XONG)
- Backend: `QueryOrderDto` + `UpdateShippingStatusDto` (mới), theo đúng
  khuôn mẫu `QueryProductDto`. `OrdersService.findAllForAdmin()` — phân
  trang + filter `shippingStatus`/`search` (mã đơn khớp chính xác nếu là
  số, HOẶC customerPhone/customerName contains). Response bọc trong
  `{ success, data: { items, total, page, limit, totalPages } }` — CỐ Ý
  khác convention bare của `ProductService` để nhất quán với 4 method khác
  sẵn có trong chính OrdersService (create/findByUser/findOneForUser/
  lookupGuestOrder đều dùng `{success, data}`)
- `OrdersService.updateShippingStatus()` — state machine
  `SHIPPING_STATUS_TRANSITIONS`: PENDING→{PROCESSING,CANCELLED},
  PROCESSING→{SHIPPED,CANCELLED}, SHIPPED→{DELIVERED}, DELIVERED/CANCELLED
  là trạng thái CUỐI. Khi CANCELLED: hoàn kho đúng theo nhánh
  variant/product (mirror chính xác logic trừ kho trong `create()`), toàn
  bộ trong 1 transaction
  - ⚠️ **GIỚI HẠN CỐ Ý**: hủy đơn CHỈ hoàn kho, TUYỆT ĐỐI KHÔNG tự động
    hoàn tiền qua PayOS dù đơn đã `paymentStatus = PAID`. Admin phải tự
    hoàn tiền thủ công qua PayOS Dashboard. Frontend cảnh báo rõ điều này
    trong `window.confirm` khi hủy 1 đơn đã PAID. Tích hợp PayOS refund
    API là việc RIÊNG, chưa làm
- GET `admin/all` và PATCH `:id/shipping-status` đặt TRƯỚC `@Get(':id')`
  trong `OrdersController` — đúng lỗi thứ tự route đã tránh ở
  ProductController
- Frontend: trang mới `admin/orders/page.tsx` — sao chép đúng pattern
  guard/debounce/phân trang của `admin/products/page.tsx`; dictionary nhãn
  tiếng Việt cho `ShippingStatus`/`PaymentStatus` (chưa từng tồn tại ở đâu
  trong repo trước đây); nút hành động chỉ hiện lựa chọn HỢP LỆ theo state
  machine (copy sang FE chỉ để ẩn/hiện, server vẫn validate thật); thêm
  `Order`/`OrderItem` type vào `types/index.ts`; thêm link điều hướng
  trong `Header.tsx`
  - ⚠️ Response `GET /orders/admin/all` bọc thêm 1 tầng `data` so với
    `/products/admin/all` — Frontend đọc `res.data.data.items`, KHÔNG phải
    `res.data.items`
- Đã verify bằng JWT tự ký (không có credential ADMIN thật để login UI —
  ký `{ sub, email, role }` bằng đúng `JWT_SECRET` trong `.env`, dùng user
  ADMIN/CUSTOMER thật có sẵn trong DB): state machine đúng ở mọi ca (nhảy
  cóc, lùi, từ trạng thái cuối đều 400), hoàn kho đúng số lượng khi hủy,
  filter/search đúng, 403 cho CUSTOMER, 401 khi không có cookie
- ✅ **Người dùng đã test UI thật PASS 6/6 bước (2026-08-29)** — bảng, filter,
  search, modal chi tiết, đổi trạng thái đều đúng. Không hủy được đơn SHIPPED
  là kết quả ĐÚNG (state machine chặn đúng). Nhánh cảnh báo PayOS khi hủy đơn
  PAID chưa test qua UI (không có đơn PENDING/PROCESSING+PAID để thử), chấp
  nhận mức verify JWT tự ký ở trên là đủ
  - ⚠️ Lưu ý cho phiên sau nếu cần tự ký JWT test: payload PHẢI dùng field
    `sub` (không phải `id`) — `JwtStrategy.validate()` đọc `payload.sub`.
    Dùng field sai sẽ khiến MỌI route có Guard trả 500 (Prisma
    `findUnique({ where: { id: undefined } })` ném lỗi, bị
    GlobalExceptionFilter nuốt thành lỗi chung chung) — từng làm tưởng
    nhầm là bug thật trong code Orders mới, hóa ra chỉ do token tự ký sai.

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

### 1. ✅ ĐÃ XONG — Hoàn tất Nhóm B (Phân trang)
Xem chi tiết đầy đủ ở mục "ĐÃ HOÀN THÀNH → Nhóm B" phía trên. Việc còn nợ lại
có chủ ý (KHÔNG phải bỏ sót): phân trang server-side cho storefront, chỉ làm
sau khi đã thêm `minPrice`/`maxPrice` vào `QueryProductDto`.

### 2. Nhóm F — Hoàn thiện nghiệp vụ còn dang dở
- ✅ ĐÃ XONG — Nối Discount thật vào OrdersService.create(). Xem mô tả chi
  tiết ở mục "ĐÃ HOÀN THÀNH" phía trên (sẽ thêm ngay dưới đây).
- Dùng bảng AuditLog (đã có trong schema, chưa từng ghi gì): tạo 1
  AuditLogInterceptor hoặc ghi thủ công trong các action nhạy cảm (Admin
  xóa/sửa Product, đổi trạng thái Order, xóa User...) — ghi userId, action,
  ipAddress, userAgent
- ✅ ĐÃ XONG — Trang quản lý đơn hàng Admin (`/admin/orders`). Xem mô tả chi
  tiết ở mục "ĐÃ HOÀN THÀNH → Nhóm F (phần 2)" phía trên.

### 2b. ✅ ĐÃ XONG — Cải thiện UX form Thêm/Sửa sản phẩm Admin (2026-08-30)

Làm đủ cả 6 việc ưu tiên cao/trung bình đã liệt kê trước đó (mini-modal
quick-add thay `window.prompt()`, xác nhận đóng modal chưa lưu, khóa nút
Submit, SKU readOnly + nút sinh lại, ghi chú fallback giá biến thể, validate
JSON specs inline). Việc 7 (chia tab/section) CHỦ ĐỘNG chưa làm — để sau khi
catalog lớn, đúng quyết định ban đầu. Chi tiết kỹ thuật đầy đủ xem
PROGRESS.md phần "Nhật ký chi tiết" (entry `[2026-08-30]`).

Qua test tay phát hiện thêm 2 bug thật, đã sửa cùng đợt: (1) mất ảnh variant
khi upload 2 ảnh nhanh liên tiếp cho cùng 1 màu (stale closure trong
`handleVariantImageUpload`/`handleRemoveVariantImage`, đã sửa dùng
`prev.variants`); (2) wording tooltip giá biến thể nhầm "giá gốc" (trùng tên
field Original Price) trong khi hành vi thật fallback về "Giá bán".

✅ **Cảnh báo tồn kho thấp** (threshold `< 5`, badge ở bảng Admin Products)
— ĐÃ XONG 2026-08-30, xem PROGRESS.md.

**Hàng đợi mới phát sinh từ đợt này (chưa code):**
- Ô "Thông số kỹ thuật (Specs - JSON Format)" nên thay bằng trình xây dựng
  key-value động (hàng Tên thuộc tính/Giá trị + nút Thêm, tự ghép JSON) —
  JSON thô là rào cản UX thật với Admin không biết lập trình. Phạm vi lớn
  hơn 1 lần sửa nhỏ, cần thiết kế riêng.
- Cloudinary orphaned files — xem mục Nhóm E bên dưới.

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
- **Cloudinary garbage collection** (phát hiện 2026-08-30): ảnh
  (thumbnail/gallery/variant) upload lên Cloudinary NGAY khi Admin chọn
  file, trước cả khi bấm Lưu sản phẩm — nếu Admin xóa ảnh khỏi form (đã lưu
  hay chưa lưu sản phẩm), file vẫn còn trên Cloudinary, không tự dọn. Trước
  go-live: viết script quét toàn bộ `quoce-store/products/...`, đối chiếu
  URL đang thực sự được `Product.thumbnail`/`images`/`ProductVariant.images`
  tham chiếu trong DB, xóa file không khớp. Chưa cần làm ngay (catalog nhỏ,
  free tier đủ dung lượng).

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

3. **Ghi log tiến độ vào `PROGRESS.md` — file này có 2 phần riêng biệt, PHẢI
   cập nhật ĐÚNG cả 2 mỗi lần:**
   - **Phần "🎯 TRẠNG THÁI HIỆN TẠI"** (đầu file): GHI ĐÈ (không append) —
     cập nhật lại mục "Đang làm / Việc tiếp theo ngay" và "Đã hoàn thành" cho
     khớp thực tế mới nhất. Đây là phần người dùng/agent đọc ĐẦU TIÊN mỗi
     phiên, phải luôn phản ánh đúng NGAY BÂY GIỜ.
   - **Phần "📜 NHẬT KÝ CHI TIẾT"** (cuối file): APPEND thêm vào CUỐI, không
     sửa/xóa entry cũ, theo format:
     ```
     ### [Ngày giờ] Đã hoàn thành: <tên việc>
     - File đã sửa: <danh sách>
     - Đã test: <cách test + kết quả>
     - Lưu ý/vấn đề gặp phải: <nếu có>
     ```
   - Nếu phát hiện vấn đề nhưng CHƯA kịp sửa trong phiên này, ghi vào mục
     "⚠️ Vấn đề đang biết, CHƯA xử lý" ở phần Trạng thái hiện tại — để không
     bị quên giữa các phiên.
   - Nếu phần Nhật ký chi tiết vượt quá ~400-500 dòng, làm theo hướng dẫn cắt
     bớt (archive) đã ghi sẵn trong chính PROGRESS.md.

4. **NẾU CẢM THẤY SẮP HẾT USAGE/CONTEXT** (nhận thấy cuộc hội thoại đã rất
   dài, hoặc được thông báo giới hạn), BẮT BUỘC dừng lại và:
   - Ghi vào phần **"🎯 TRẠNG THÁI HIỆN TẠI"** (ghi đè mục "Đang làm") nội
     dung checkpoint:
     ```
     ⚠️ CHECKPOINT TRƯỚC KHI HẾT USAGE — [ngày giờ]
     Đang làm dở: <tên việc cụ thể, đang ở bước nào>
     File đang sửa dở (nếu có, chưa hoàn chỉnh): <danh sách + trạng thái>
     Bước tiếp theo cần làm ngay khi resume: <mô tả cụ thể, đủ chi tiết để
       người khác hoặc chính bạn ở phiên sau hiểu ngay không cần đoán>
     Lệnh cần chạy để xác nhận trạng thái hiện tại: <VD: npx tsc --noEmit,
       curl endpoint nào để kiểm tra>
     ```
   - Đồng thời append 1 entry tương ứng vào phần "📜 NHẬT KÝ CHI TIẾT" để lưu
     lại mốc này trong lịch sử.
   - Sau đó chạy `git add . && git commit -m "checkpoint: <mô tả ngắn>" &&
     git push` NGAY LẬP TỨC (xem mục GIT WORKFLOW bên dưới), rồi DỪNG LẠI —
     không cố làm thêm dở dang gây rối code.

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

## QUẢN LÝ README.md — TÀI LIỆU HƯỚNG RA NGOÀI (khác hẳn CLAUDE.md/PROGRESS.md)

**Phân biệt rõ 2 loại tài liệu, KHÔNG được lẫn lộn giọng văn:**

| | CLAUDE.md / PROGRESS.md | README.md |
|---|---|---|
| Đối tượng đọc | Chính bạn (AI agent) ở các phiên sau | Con người: dev khác, nhà tuyển dụng, chính người dùng 6 tháng sau |
| Giọng văn | Kỹ thuật, chi tiết, kể cả bài học/lỗi đã sửa | Chuyên nghiệp, súc tích, như 1 sản phẩm hoàn chỉnh |
| Nội dung | Lịch sử debug, quyết định kiến trúc, checkpoint | Cách cài đặt, tính năng, tech stack, cách chạy |
| KHÔNG được xuất hiện trong README | — | Tên cũ "ApexStore", chi tiết bug đã sửa, nội dung nhắc tới "AI agent"/"Claude Code" đã xây dựng phần này |

**Khi nào PHẢI cập nhật README.md** (trong CÙNG commit với thay đổi code liên
quan, không tách riêng):
- Thêm 1 biến môi trường mới bắt buộc (`.env`) → cập nhật bảng biến môi
  trường trong README
- Thêm 1 script npm mới quan trọng (VD lệnh seed mới, lệnh test mới) → cập
  nhật bảng Scripts
- Thêm 1 tính năng lớn hoàn chỉnh (VD trang quản lý đơn hàng Admin, tính
  năng Discount thật) → cập nhật mục "Tính năng chính"
- Đổi cấu trúc thư mục đáng kể (thêm module mới ở backend, thêm route lớn ở
  frontend) → cập nhật sơ đồ cây thư mục

**KHÔNG cần cập nhật README cho**: sửa bug nhỏ, refactor nội bộ không đổi
hành vi bên ngoài, thay đổi chỉ ảnh hưởng nội bộ code không ảnh hưởng cách
người dùng/dev khác tương tác với hệ thống.

**Không bao giờ đặt secret/giá trị thật vào README** — chỉ liệt kê TÊN biến
môi trường cần có, không bao giờ giá trị, kể cả giá trị mẫu trông giống thật.

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

- Trước khi commit, tự hỏi: "Việc vừa làm có cần cập nhật README.md không?"
  (xem tiêu chí ở mục "QUẢN LÝ README.md" phía trên). Nếu có, cập nhật
  README.md và đưa vào CHUNG commit này, không tách commit riêng.

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
