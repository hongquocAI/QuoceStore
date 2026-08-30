# PROGRESS.md — QuoceStore — Trạng thái & Nhật ký

> Xem `CLAUDE.md` để biết ngữ cảnh đầy đủ dự án (nguyên tắc, stack, roadmap
> chi tiết). File này gồm 2 phần tách biệt:
>
> **(1) 🎯 TRẠNG THÁI HIỆN TẠI** — LUÔN LUÔN GHI ĐÈ phần này mỗi khi cập nhật
> (không append thêm bản cũ bên dưới) — đây là nguồn duy nhất trả lời "đang ở
> đâu, tiếp theo làm gì NGAY BÂY GIỜ" mà không cần đọc hết lịch sử bên dưới.
>
> **(2) 📜 NHẬT KÝ CHI TIẾT** — CHỈ được append thêm vào cuối, KHÔNG sửa/xóax`
> entry cũ — đây là lịch sử để tra cứu "việc X đã làm chưa, làm bằng cách
> nào, gặp vấn đề gì" khi cần debug hoặc đối chiếu.

---

## 🎯 TRẠNG THÁI HIỆN TẠI
*(cập nhật lần cuối: 2026-08-30)*

### Đang làm / Việc tiếp theo ngay
**✅ Nhóm F (phần 1) — Discount thật vào `OrdersService.create()` ĐÃ XONG**
(code + verify bằng request thật, dữ liệu test đã dọn sạch).

**✅ Nhóm F (phần 2) — Trang quản lý đơn hàng Admin (`/admin/orders`) ĐÃ
ĐÓNG HOÀN TOÀN** — người dùng test UI thật PASS 6/6 bước (2026-08-29).

**✅ Nhóm F — AuditLog (ghi vết action nhạy cảm Admin) ĐÃ ĐÓNG HOÀN TOÀN
(2026-08-30, commit `c16eff3`).** Migration thêm `entityType`/`entityId`/
`metadata`/index `createdAt` vào bảng `AuditLog` (chỉ ADD COLUMN, an toàn).
`AuditLogInterceptor` (đăng ký qua `APP_INTERCEPTOR`) + decorator `@Audit()`
gắn vào đúng 8 route nhạy cảm: `CREATE/UPDATE/DELETE_PRODUCT`,
`UPDATE_ORDER_SHIPPING_STATUS`, `CREATE/DELETE_BRAND`,
`CREATE/DELETE_SUB_CATEGORY`, `CHANGE_PASSWORD`, `UPLOAD_IMAGE`. Ghi cả
action THẤT BẠI (qua `catchError`), redact mật khẩu/token trong `metadata`,
không chặn response nếu ghi log lỗi. Kèm theo: sửa bug thứ tự ưu tiên
`x-forwarded-for` (helper `getRequestMeta()` dùng chung, thay method private
trùng lặp trong `AuthController`), bật `app.set('trust proxy', 1)` trong
`main.ts` (cần thiết khi deploy sau proxy — ảnh hưởng cả IP ghi log lẫn
`ThrottlerGuard`). Verify bằng script Node tự ký JWT ADMIN + gọi API thật:
**5/5 ca PASS** (thành công có log đúng userId/entityType/entityId/metadata,
thất bại vẫn có log kèm `metadata.success=false`, tạo mới lấy đúng
`entityId` từ response, redact mật khẩu đúng, route không gắn decorator
không sinh log thừa). `tsc --noEmit` sạch, response format các route không
audit không đổi (đã kiểm tra regression). Dữ liệu test đã dọn sạch hoàn
toàn, `audit_logs` về lại rỗng đúng như trước khi bắt đầu.
⚠️ Phạm vi cố ý: CHỈ ghi log, CHƯA có API `GET /audit-logs` hay trang Admin
xem log — làm sau, là việc riêng.
⚠️ CLAUDE.md nhắc "xóa User" nhưng endpoint đó KHÔNG tồn tại;
`DiscountsController` cũng chưa có route create/update/delete nào (discount
đang seed tay) — hai mục này sẽ tự được gắn `@Audit()` khi nào endpoint
được viết, không phải bỏ sót.

**✅ ĐÃ THÊM 18 sản phẩm DEMO** để test trực quan Phân trang/Filter (Nhóm B),
2026-08-29. Script additive-only (`backend/prisma/seed-demo-products.ts`),
KHÔNG đụng dữ liệu thật (Order/Discount/sản phẩm Baseus nguyên vẹn — đã xác
nhận bằng đếm lại). Tổng DB hiện có **19 sản phẩm** (18 demo + 1 thật) →
`GET /products` giờ có **2 trang thật** với `limit=10`. Tất cả sản phẩm demo
có tiền tố `[DEMO] ` trong title. **Dọn sạch bất cứ lúc nào trước khi
go-live** bằng:
```ts
await prisma.product.deleteMany({ where: { title: { startsWith: '[DEMO] ' } } });
```

**✅ Nhóm F — Cảnh báo tồn kho thấp (Admin Products) ĐÃ ĐÓNG HOÀN TOÀN
(2026-08-30).** Frontend thuần túy, chỉ sửa
`frontend/src/app/admin/products/page.tsx` — không đổi schema/API/
`QueryProductDto`. Ngưỡng cố định `LOW_STOCK_THRESHOLD = 5` (không phải cột
DB, không có UI cấu hình — đã chốt tối giản với người dùng). Sản phẩm KHÔNG
variant → xét `Product.stock`; sản phẩm CÓ variant → xét từng
`ProductVariant.stock` (không dùng `Product.stock` vì không phản ánh kho
thật khi có variant — `OrdersService` trừ kho ở variant khi khách chọn
màu). Cột "Kho": hiện số + badge (`bg-red-100`="Hết hàng" khi stock=0,
`bg-amber-100`="Sắp hết: N" khi 0<stock<5); sản phẩm có variant hiện "Tổng
biến thể: N" + badge tổng hợp theo mức nghiêm trọng nhất (ưu tiên đỏ nếu có
màu hết hàng). Cột "Biến thể màu": thêm viền `ring-2` (đỏ/vàng) quanh chấm
màu bị thấp/hết, tooltip `title` giờ luôn kèm số tồn kho
(`"<màu> — còn <N>"`). Màu badge tái dùng đúng bảng màu đã có sẵn trong dự
án (không phát minh màu mới).
Verify: `tsc --noEmit` sạch (cả lúc mới sửa và sau khi khôi phục dữ liệu
test). Không có sẵn trình duyệt tự động trong phiên này (`claude-in-chrome`
người dùng từ chối cài) — người dùng tự test UI thật bằng cách tạm hạ stock
2 sản phẩm demo + 2 variant Baseus (giá trị gốc đã lưu trước khi sửa), xác
nhận **4/4 mục PASS**: badge vàng/đỏ đúng cho sản phẩm không variant, viền
+ tooltip + badge tổng hợp đúng cho sản phẩm có variant, sản phẩm stock
bình thường không có badge. 1 lần FAIL giả (tooltip tưởng thiếu số tồn kho)
hóa ra do trình duyệt cache tooltip cũ — hard refresh xác nhận lại code
đúng ngay từ đầu. Toàn bộ dữ liệu stock đã khôi phục đúng giá trị gốc, file
script test tạm đã xóa sạch.

Nhóm F giờ đã hoàn tất toàn bộ các mục trong CLAUDE.md "VIỆC CẦN LÀM TIẾP —
mục 2" (Discount, trang quản lý đơn hàng Admin, AuditLog, cảnh báo tồn kho
thấp). Còn lại: hàng đợi riêng "Cải thiện UX form Thêm/Sửa sản phẩm Admin"
(mục 2b CLAUDE.md, chưa code) — và các Nhóm D/E chưa bắt đầu.

**✅ Bug UX message lỗi áp mã giảm giá — ĐÃ ĐÓNG HOÀN TOÀN 2026-08-29.**
Người dùng test UI thật PASS cả 2 ca: mã `QUOCE10` (hết lượt) và `ABCXYZ`
(không tồn tại) hiện đúng 2 message khác nhau, đúng theo từng lý do trả về
từ backend.

**✅ Luồng checkout có mã giảm giá — ĐÃ ĐÓNG HOÀN TOÀN 2026-08-29.** Người
dùng test UI thật PASS: cart → checkout → đặt hàng, mã giảm giá được giữ
xuyên suốt, `totalAmount` cuối cùng đúng đã trừ giảm giá.

**✅ Nhóm B ĐÃ HOÀN TẤT** (backend verify bằng request thật, frontend pass
`tsc --noEmit`, người dùng đã test tay trang Admin).

**✅ Bug PATCH variants ĐÃ ĐÓNG** — người dùng test PASS cả 3 bước
2026-08-29 (xem Nhật ký chi tiết).

**Phạm vi đã được người dùng chốt (2026-08-29):**
- Backend: phân trang + lọc server-side đầy đủ (`page`, `limit`,
  `categoryId`, `subCategoryId`, `brandId`, `search`), trả về
  `{ items, total, page, limit, totalPages }`.
- **Admin panel** (`/admin/products`): chuyển sang phân trang **server-side
  thật** — UI phân trang sẵn có được nối vào `totalPages` từ server, ô search
  (có debounce) và các filter Category/SubCategory/Brand đều gọi API.
- **Storefront** (trang chủ `/` + `/accessories`): **GIỮ NGUYÊN** lọc
  client-side như hiện tại, chỉ sửa để đọc đúng field `items` từ response mới
  và gọi kèm `limit=100`. **Chưa** thêm UI phân trang ở storefront.

**Lý do hoãn phân trang storefront** (để phiên sau không tưởng là bỏ sót):
trang chủ đang lọc client-side theo Category **và khoảng giá**, `/accessories`
lọc theo `subCategory.slug`. Backend hiện chỉ có filter
`categoryId/subCategoryId/brandId/search` — **không có filter giá**. Nếu
phân trang thật ngay bây giờ, bộ lọc giá sẽ chỉ lọc trong trang hiện tại →
sai logic. Sẽ nâng cấp sau khi catalog lớn hơn, và khi đó phải bổ sung
`minPrice`/`maxPrice` server-side trước.

**Quyết định migration:** KHÔNG giữ tương thích ngược (không có chế độ "không
truyền `page` thì trả mảng thô như cũ") — đổi dứt điểm 1 lần + sửa hết
Frontend trong cùng commit, đúng khuyến nghị sẵn có trong CLAUDE.md. Đã rà
soát: chỉ có **3 call site** frontend bị ảnh hưởng (`app/page.tsx`,
`app/accessories/page.tsx`, `app/admin/products/page.tsx`).

### Đã hoàn thành (tóm tắt — xem CLAUDE.md phần "ĐÃ HOÀN THÀNH" để biết chi
tiết kỹ thuật từng mục)
- ✅ Phase 0 (bảo mật khẩn cấp) — 100%
- ✅ Phase 1 (MDM: Brand/SubCategory quan hệ thật) — 100%
- ✅ Rate-limiting, Guest Order Lookup, đồng bộ style — 100%
- ✅ Nhóm A (helmet, CORS, JWT cookie HttpOnly, ValidationPipe) — phần lõi 100%
- ✅ Nhóm C (Observability: logging, health check, graceful shutdown, Sentry) — 100%
- 🟡 Nhóm B (Sẵn sàng chịu tải): Redis cache ✅ xong, Phân trang ❌ chưa làm
- ✅ Git + GitHub đã setup (repo private, đã push 2 commit đầu)

### ⚠️ Vấn đề đang biết, CHƯA xử lý (Known Issues)
*(danh sách này để trống lúc bàn giao — agent thêm vào đây bất kỳ vấn đề nào
phát hiện ra nhưng CHƯA kịp sửa, để không bị quên giữa các phiên)*

- ✅ ~~Sản phẩm test sót trong DB~~ — **ĐÃ XỬ LÝ 2026-08-29**: xóa sạch 6 đơn
  test + 6 orderItem + sản phẩm test, có lưu vết đầy đủ trong Nhật ký chi tiết.
- ✅ ~~Sản phẩm thật bị ẩn / bug PATCH variants~~ — **ĐÃ ĐÓNG HOÀN TOÀN
  2026-08-29**, người dùng đã test tay PASS cả 3 bước. Xem entry trong Nhật ký
  chi tiết.
- **Storefront chưa phân trang server-side** — cố ý hoãn, lý do đầy đủ ghi ở
  mục "Đang làm" phía trên. Điều kiện tiên quyết: thêm `minPrice`/`maxPrice`
  vào `QueryProductDto`.
- **Thiếu index DB** trên `createdAt`, `isActive`, `price`, `title` của bảng
  `products`. `orderBy: createdAt desc` mặc định và `search` (Prisma
  `contains`) hiện đang quét tuần tự. Chưa ảnh hưởng ở quy mô hiện tại (DB
  đang có rất ít sản phẩm) nhưng sẽ thành vấn đề thật khi catalog lớn.

### 🔍 Cần người dùng kiểm tra (chưa tự verify được trong phiên này)

*(Bug PATCH variants: đã test PASS 2026-08-29, không còn nợ gì.)*

**✅ ĐÃ ĐÓNG — trang quản lý đơn hàng Admin `/admin/orders`** (Nhóm F, xây
2026-08-29, người dùng test UI thật PASS 6/6 bước cùng ngày): bảng hiện đúng
đơn #9, filter/search đúng, modal chi tiết đúng, đổi trạng thái chỉ hiện nút
hợp lệ theo state machine. Bước 6 (không hủy được đơn SHIPPED) là **kết quả
ĐÚNG** — xác nhận state machine chặn đúng, không phải bug. Nhánh "hủy đơn
PAID hiện cảnh báo PayOS" chưa có đơn PENDING/PROCESSING+PAID nào để thử qua
UI, nhưng backend đã verify kỹ phần này bằng JWT tự ký trong phiên trước —
người dùng chấp nhận mức độ verify này là đủ, không cần thêm.

*(ƯU TIÊN 1 và ƯU TIÊN 2 — cả 2 mục về Discount đã ĐÓNG HOÀN TOÀN 2026-08-29,
người dùng test UI thật PASS. Xem "🎯 TRẠNG THÁI HIỆN TẠI" phía trên và entry
tương ứng trong Nhật ký chi tiết.)*

**Các mục còn lại (từ Nhóm B):**
Backend đã được verify đầy đủ bằng request thật (xem nhật ký chi tiết). Phần
**chưa** tự kiểm tra được là tương tác UI của trang `/admin/products`, vì cần
đăng nhập tài khoản ADMIN (agent không có credential) và phiên này không có
sẵn công cụ điều khiển trình duyệt. Cần bấm tay xác nhận:
1. Bảng lên đúng 10 dòng/trang; bấm "Trang sau"/"Trang trước" **có gọi API
   thật** (mở tab Network, thấy request `/products/admin/all?page=...`).
2. Gõ vào ô tìm kiếm: chờ ~0.4s mới bắn 1 request (debounce), không bắn mỗi
   ký tự; kết quả đúng theo tên HOẶC mã SKU.
3. 3 dropdown lọc (Danh mục / Danh mục con / Thương hiệu) hoạt động; đổi Danh
   mục cha thì Danh mục con tự reset về "TẤT CẢ".
4. Tạo / sửa / xóa sản phẩm xong bảng tự refresh đúng trang hiện tại.
5. Xóa bản ghi cuối cùng của trang cuối → tự lùi về trang trước, KHÔNG để bảng
   trắng trơn.

### Quyết định đang chờ người dùng xác nhận
- CCCD có bắt buộc thu thập không, hay nên optional? (liên quan Nhóm D)
- Deploy ở VPS riêng hay PaaS (Vercel+Railway/Render)? (liên quan Nhóm E)

---

## 📏 QUY TẮC GIỮ FILE NÀY GỌN GÀNG (đọc nếu bạn là agent đang chuẩn bị ghi log)

- Phần "NHẬT KÝ CHI TIẾT" bên dưới nếu vượt quá khoảng 400-500 dòng, tạo file
  `PROGRESS_ARCHIVE.md` cùng thư mục, cắt các entry CŨ NHẤT (giữ lại 5-10 entry
  gần nhất trong PROGRESS.md) chuyển sang file archive đó, ghi 1 dòng ở đầu
  phần Nhật ký: "Các entry trước [ngày] đã chuyển sang PROGRESS_ARCHIVE.md".
  Việc này giữ file chính luôn gọn, đọc nhanh mỗi phiên.
- KHÔNG BAO GIỜ xóa hẳn thông tin — chỉ di chuyển sang file archive, không mất
  dữ liệu lịch sử.

---

## 📜 NHẬT KÝ CHI TIẾT
*(append-only, KHÔNG sửa/xóa entry cũ — entry mới nhất ở CUỐI file)*

### Các entry trước 2026-08-29 (Nhóm B) đã chuyển sang `PROGRESS_ARCHIVE.md`

### [2026-08-29] Đã hoàn thành: Nhóm B — Phân trang Product

- **File đã sửa/tạo**:
  - `backend/src/product/dto/query-product.dto.ts` (**MỚI**) — `QueryProductDto`:
    `page`/`limit` (`@Max(100)`), `categoryId`/`subCategoryId`/`brandId`
    (`@IsUUID('4')`), `search`. Đây là DTO query đầu tiên của backend → khuôn
    mẫu cho các endpoint danh sách sau này.
  - `backend/src/product/product.service.ts` — thêm 2 private method
    `buildProductWhere(query, publicOnly)` và `findPaginated(query, publicOnly)`;
    `findAll()`/`findAllForAdmin()` nay nhận `QueryProductDto`, dùng
    `$transaction([findMany, count])`, trả `{ items, total, page, limit, totalPages }`.
    `include` 4 quan hệ giữ nguyên. `search` khớp title HOẶC sku (giữ đúng
    hành vi ô tìm kiếm cũ của Admin).
  - `backend/src/product/product.controller.ts` — 2 route list nhận `@Query() query`.
  - `frontend/src/types/index.ts` — thêm `Paginated<T>`.
  - `frontend/src/app/page.tsx`, `frontend/src/app/accessories/page.tsx` — đọc
    `items`, gọi `limit=100`, GIỮ NGUYÊN lọc client-side.
  - `frontend/src/app/admin/products/page.tsx` — viết lại phần tải dữ liệu:
    tách `fetchInitialData` (master data, 1 lần) khỏi `fetchProducts`
    (`useCallback`, chạy lại theo page/filter/search); debounce ô tìm kiếm
    400ms; thêm 2 dropdown lọc SubCategory + Brand; xóa `filteredProducts` và
    `paginatedProducts`; phân trang dùng `totalPages`/`total` từ server; thêm
    state `productsLoading` riêng để đổi trang không nuốt cả UI vào màn hình
    loading toàn trang; xử lý ca biên `currentPage > totalPages` sau khi xóa.
  - `README.md` — bổ sung mô tả năng lực mới của Admin panel vào "Tính năng chính".
  - `CLAUDE.md` — Nhóm B đổi từ "ĐANG DỞ 50%" → "100% XONG" kèm mô tả chi tiết
    + các cảnh báo; mục "VIỆC CẦN LÀM TIẾP — 1" đánh dấu đã xong.

- **Đã test**:
  - `npx tsc --noEmit` cả backend và frontend → **0 lỗi**.
  - Backend chạy thật (`localhost:5000`), verify bằng `Invoke-RestMethod`:
    - `GET /products` → đúng 5 field `items/total/page/limit/totalPages`.
    - `page=1&limit=1` vs `page=2&limit=1` → trả **2 sản phẩm khác nhau**,
      `totalPages=2` đúng. Quan hệ category/subCategory/brand/variants còn
      nguyên trong mỗi item.
    - `page=99` (ngoài vùng) → `items=[]`, không lỗi.
    - Các ca **400 đúng như thiết kế**: `limit=999` (vượt `@Max`), `page=0`,
      `page=abc`, `foo=1` (param lạ, do `forbidNonWhitelisted`),
      `categoryId=ALL` (không phải UUID — chính là lý do Frontend phải bỏ hẳn
      param khi không lọc thay vì gửi sentinel).
    - `search=Test` → `total=1`; `search=<chuỗi rác>` → `total=0`,
      `totalPages=1` (không phải 0).
    - `categoryId=<uuid thật>` → lọc đúng.
    - `GET /products/admin/all` không kèm cookie → **401** (guard còn nguyên).
    - **Không hồi quy**: `GET /products/categories` vẫn trả mảng thô,
      `GET /products/:slug` vẫn trả object đơn lẻ — 2 route này không đổi.
  - Frontend chạy thật (`localhost:3000`): cả `/`, `/accessories`,
    `/admin/products` đều trả HTTP 200, không có lỗi biên dịch/module.
  - Đọc `AuthContext.tsx` để xác nhận `user` là state ổn định giữa các render
    → effect `[authLoading, user, fetchProducts]` KHÔNG gây vòng lặp refetch.

- **Lưu ý/vấn đề gặp phải**:
  - **CHƯA tự kiểm tra được tương tác UI trang Admin** (cần login ADMIN, agent
    không có credential; phiên này không có công cụ điều khiển trình duyệt).
    Danh sách 5 điểm cần bấm tay đã ghi ở mục "🔍 Cần người dùng kiểm tra"
    phần Trạng thái hiện tại.
  - Phát hiện **1 sản phẩm test sót lại trong DB thật** từ phiên trước
    (`"Test sản phẩm hợp lệ 001"`) — đã ghi vào Known Issues, chưa tự xóa vì
    cần người dùng xác nhận trước.
  - Phiên này **KHÔNG tạo thêm** bất kỳ bản ghi/file/code test tạm nào cần dọn
    (chỉ gọi các request GET đọc dữ liệu).

### [2026-08-29] Dọn dữ liệu test trong DB — BẢN LƯU VẾT TRƯỚC KHI XÓA

Người dùng đã xác nhận xóa vĩnh viễn toàn bộ dữ liệu test còn sót từ các phiên
trước. **Lưu lại đầy đủ nội dung ở đây để còn dấu vết tra cứu về sau** — sau
khi xóa, dữ liệu này KHÔNG khôi phục được từ đâu khác.

**Đếm trước khi xóa**: Order = 6, OrderItem = 6, PaymentTransaction = 0,
Product = 2.

Toàn bộ 6 đơn đều tạo ngày **2026-08-27**, đều là đơn thử nghiệm (tên khách
gõ bừa, SĐT lặp 0900900900, địa chỉ vô nghĩa):

| orderCode | Khách | SĐT | Email | Địa chỉ | Thanh toán | Tổng tiền | paymentStatus | shippingStatus | Tài khoản đặt | Mặt hàng |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Test User | 0912345678 | — | 123 Test Street, Q1, TP.HCM | COD | 858.000 | PAID | PENDING | guest@quoce.vn | Test sản phẩm hợp lệ 001 ×2 @429.000 |
| 2 | ádavasva | 0900900900 | abc@gmail.com | 2312 | COD | 429.000 | PENDING | PENDING | guest@quoce.vn | Test sản phẩm hợp lệ 001 ×1 @429.000 |
| 3 | sdasda | 0900900900 | a@gmail.com | 12313asdas | COD | 429.000 | PENDING | PENDING | guest@quoce.vn | Test sản phẩm hợp lệ 001 ×1 @429.000 |
| 4 | Test Customer | 0900900900 | customer-test@quoce.vn | 12312ASDZXD | BANK_TRANSFER | 429.000 | PENDING | PENDING | customer-test@quoce.vn | Pin sạc dự phòng Baseus Enerfill FC5 ×1 @429.000 |
| 5 | Test Customer | 0900900900 | customer-test@quoce.vn | 12341241 | BANK_TRANSFER | 1.000 | PENDING | PENDING | customer-test@quoce.vn | Test sản phẩm hợp lệ 001 ×1 @1.000 |
| 6 | Test Customer | 0900900900 | customer-test@quoce.vn | MNBNBNM | BANK_TRANSFER | 2.000 | PENDING | PENDING | customer-test@quoce.vn | Test sản phẩm hợp lệ 001 ×2 @1.000 |

**Sản phẩm test bị xóa kèm:**
- id `4124a26a-9609-4320-864c-02d3ddc72efd`, title `Test sản phẩm hợp lệ 001`,
  slug `test-hop-le-001`, sku `TEST-DUP-001`, isActive `true`, tạo
  2026-08-27T11:02:55Z, 0 biến thể, bị 5 orderItem tham chiếu.

**Sản phẩm GIỮ LẠI** (dữ liệu thật, không đụng tới): `Pin sạc dự phòng Baseus
Enerfill FC5` (danh mục "Sạc dự phòng", thương hiệu Baseus).

**Thứ tự xóa** (bắt buộc theo ràng buộc FK trong schema): xóa `Order` trước —
`OrderItem` và `PaymentTransaction` đều có `onDelete: Cascade` từ Order nên tự
biến mất; sau đó mới xóa được `Product` (`OrderItem.product` là
`onDelete: Restrict`, không xóa orderItem trước thì Postgres sẽ chặn).

⚠️ **Lưu ý cho phiên sau**: `Order.orderCode` là `Int @unique
@default(autoincrement())` — xóa hết bản ghi KHÔNG reset sequence, nên đơn
hàng thật đầu tiên sẽ mang orderCode **7**, không phải 1. Đây là hành vi bình
thường của Postgres, không phải lỗi.

**KẾT QUẢ SAU KHI XÓA (đã xác nhận bằng đếm lại trong DB):**
- Order: 6 → **0** ✅
- OrderItem: 6 → **0** ✅ (tự biến mất theo cascade, không cần xóa thủ công)
- PaymentTransaction: 0 → **0** ✅
- Product: 2 → **1** (chỉ còn `Pin sạc dự phòng Baseus Enerfill FC5` — dữ liệu
  thật, đúng như dự kiến; sản phẩm test đã biến mất) ✅
- Toàn bộ script tạm (`tmp-inspect.js`, `tmp-dump.js`, `tmp-cleanup.js`,
  `tmp-check.js`) đã xóa khỏi `backend/`, `git status` sạch.

⚠️ **PHÁT HIỆN NGOÀI DỰ KIẾN trong lúc xác minh** *(ghi lúc chưa tìm ra
nguyên nhân thật — xem entry ngay bên dưới để biết kết luận cuối cùng)*: sản
phẩm thật còn lại đang có `isActive = false`, nên `GET /products` trả
`total=0` và **storefront hiện không hiển thị sản phẩm nào**. Bằng chứng:
`updatedAt` của sản phẩm này là 2026-08-28T21:12:01Z, tức bị sửa ~10 phút
TRƯỚC thời điểm chạy script dọn dẹp — và script dọn dẹp chỉ `deleteMany` trên
Order + `delete` đúng 1 sản phẩm test theo id, KHÔNG hề ghi vào `isActive`
của sản phẩm này. Nguyên nhân nhiều khả năng nhất: có người bấm nút "Xóa"
trên sản phẩm này trong trang Admin — lúc đó nó vẫn còn 1 orderItem (thuộc
đơn số 4) nên `ProductService.remove()` đi vào nhánh **soft-delete**
(`isActive: false`) thay vì xóa cứng. Đây là hành vi ĐÚNG của service, không
phải bug. Đang chờ người dùng xác nhận có bật lại `isActive = true` hay
không.

### [2026-08-29] Đã sửa BUG: PATCH /products/:id trả 400 + variants không được lưu

**Triệu chứng**: sửa sản phẩm có biến thể màu qua Admin UI → 400
`variants.0.property id should not exist`. Đây chính là **nguyên nhân gốc**
khiến sản phẩm Baseus không lưu lại được `isActive = true`, dẫn tới
`GET /products` trả `total = 0` và storefront trắng trơn (trước đó đã phỏng
đoán nhầm là do bấm nút "Xóa" làm soft-delete — **phỏng đoán đó SAI**).

**Nguyên nhân (Frontend)**: `admin/products/page.tsx` — `handleOpenEdit` nạp
`variants: product.variants || []` **nguyên xi** từ `GET /products/:slug`,
object đó mang theo `id`/`productId`/`createdAt`/`updatedAt`; rồi
`handleSubmit` đưa thẳng vào payload PATCH. `ProductVariantDto` chỉ chấp nhận
**6 field** (`colorCode`, `colorName`, `hexCode`, `price`, `stock`, `images`)
và `forbidNonWhitelisted: true` chặn đúng field thừa. **Backend không sai —
không nới lỏng validate.**

**Bug thứ 2 phát hiện kèm (nghiêm trọng hơn)**: `ProductService.update()`
nhận `dto.variants`, validate nó, rồi **VỨT ĐI IM LẶNG** — object
`Prisma.ProductUpdateInput` không hề có key `variants`. Hệ quả: sửa màu
sắc/giá/tồn kho biến thể qua Admin UI **không bao giờ được lưu**, mà UI vẫn
báo "CẬP NHẬT THÀNH CÔNG" → mất dữ liệu âm thầm. (`create()` thì xử lý
variants đàng hoàng, chỉ `update()` bỏ sót.)

- **File đã sửa**:
  - `frontend/src/app/admin/products/page.tsx` — thêm `sanitizedVariants`,
    map **tường minh** đúng 6 field trước khi đưa vào `basePayload` (dùng cho
    cả POST lẫn PATCH). Cố ý KHÔNG dùng destructuring `({ id, ...rest })` để
    mai sau bảng `ProductVariant` thêm cột mới thì payload không tự rò field
    lạ lên API và vỡ lại đúng lỗi này.
  - `backend/src/product/product.service.ts` — `update()` nay xử lý variants
    theo **Phương án A (người dùng chọn)**: xóa sạch variant cũ
    (`deleteMany`) rồi tạo lại từ payload, TRONG CÙNG transaction. Phân biệt
    3 ca: `undefined` → không đụng tới; `[]` → xóa hết (thành hàng đơn lẻ);
    có phần tử → xóa rồi tạo lại. Giá biến thể bỏ trống thì lùi về
    `dto.price ?? product.price` (ở update, `dto.price` có thể không được gửi
    lên nên không dùng thẳng như `create()`). `include: { variants: true }`
    chạy SAU khi ghi nên response trả về đúng danh sách variant **MỚI**,
    Frontend hiển thị đúng ngay không cần F5.

- **Vì sao Phương án A an toàn** (lý do người dùng đưa ra, đã đối chiếu
  schema và xác nhận đúng): `OrderItem.variantId` là `onDelete: SetNull`, VÀ
  `OrderItem.variantColorName` đã lưu sẵn tên màu như một **snapshot** tại
  thời điểm mua. Nên variant bị đổi id không làm mất thông tin màu trong lịch
  sử đơn hàng cũ → không cần logic upsert so khớp từng variant cho phức tạp.

- **Đã test**: `npx tsc --noEmit` cả backend và frontend → **0 lỗi**.
  Cố ý **KHÔNG** tự bật `isActive = true` bằng lệnh ghi thẳng vào DB, vì làm
  vậy sẽ che mất chính phép thử cần chạy (lưu qua UI phải thành công).
- **✅ NGƯỜI DÙNG ĐÃ TEST TAY — PASS HOÀN TOÀN (2026-08-29), BUG ĐÓNG:**
  1. Sửa Baseus → tick "Đang bán" → Lưu: **thành công**, hết lỗi 400.
  2. `GET /products` → `total = 1`, Baseus hiện lại trên trang chủ.
  3. Sửa giá màu Đen 429.000 → 450.000 → Lưu → F5 → mở lại form Sửa: giá hiện
     đúng **450.000** (giá mới). Xác nhận bug "báo thành công giả" đã hết —
     tức nhánh xóa-rồi-tạo-lại variants trong `update()` chạy đúng thật.

---

### [2026-08-29] Đã hoàn thành: Nhóm F (phần 1) — Discount thật vào OrdersService.create()

Làm trên `/model opusplan` (yêu cầu người dùng, vì đây là logic tính tiền
server-side trong transaction). Đã vào Plan Mode trước khi code, dùng 2 agent
Explore song song khảo sát backend (Discount/Orders) và frontend (checkout)
trước khi thiết kế.

**Phát hiện quan trọng trước khi code**: trang giỏ hàng (`cart/page.tsx`) đã
có sẵn UI mã giảm giá hoàn chỉnh (ô nhập, gọi `GET /discounts/code/:code`,
hiển thị giảm giá), nhưng mã bị **RƠI MẤT hoàn toàn** trước khi tới
`POST /orders` — trang chỉ lưu `percentage` + `finalTotal` đã tính sẵn vào
`sessionStorage`, KHÔNG lưu mã code, và trang checkout không đọc lại bất kỳ
key nào. Đây là bug có từ trước, không phải do phiên này gây ra. Việc chính
là NỐI LẠI mạch có sẵn, không phải xây UI mới.

**Đã xác nhận trước khi code (theo yêu cầu người dùng)**: `Discount.percentage`
lưu dạng THẬP PHÂN (0.1 = 10%), qua 2 bằng chứng độc lập — dữ liệu thật
trong DB (`QUOCE10` → `0.1`) và cách `cart/page.tsx` dùng trực tiếp làm hệ số
nhân (`subtotal * discount`, không chia 100).

- **File đã sửa/tạo**:
  - `backend/prisma/schema.prisma` — thêm `Order.discountCode String?` và
    `Order.discountAmount Decimal @default(0)`. Migration
    `20260828221446_add_discount_to_order` — chỉ `ADD COLUMN`, không xóa gì,
    an toàn tuyệt đối.
  - `backend/src/discounts/discounts.service.ts` — `validateCode()` thêm
    tham số `client` tùy chọn (mặc định `this.prisma`) để tái dùng được
    trong transaction của `OrdersService` (truyền `tx` vào), tránh viết lại
    logic validate 2 nơi.
  - `backend/src/discounts/discounts.module.ts` — thêm
    `exports: [DiscountsService]` (trước đây không export gì, không
    inject được từ module khác).
  - `backend/src/orders/orders.module.ts` — import `DiscountsModule`.
  - `backend/src/orders/dto/create-order.dto.ts` — thêm `discountCode?`
    optional.
  - `backend/src/orders/orders.service.ts` — trong transaction `create()`,
    sau khi tính `computedTotalAmount` từ cart (không đổi logic loop cũ):
    validate mã (nếu có) → tăng `usedCount` CÓ ĐIỀU KIỆN bằng
    `tx.discount.updateMany({ where: { usedCount: { lt: maxUsage } } })` để
    chống race 2 đơn tranh nốt lượt cuối (nếu `count === 0` → từ chối rõ
    ràng) → `discountAmount = Math.round(computedTotalAmount * percentage)`
    → `totalAmount` cuối = tổng gốc trừ discountAmount.
    🛡️ **Bug phát hiện + sửa cùng lúc**: khối `catch` cuối `create()` trước
    đây chỉ re-throw `BadRequestException`, sẽ NUỐT MẤT `NotFoundException`
    mà `validateCode()` throw (dùng cho cả 3 ca mã sai/hết hạn/hết lượt) và
    thay bằng thông báo chung chung — khách không biết vì sao đơn thất bại.
    Đã đổi điều kiện sang `error instanceof HttpException`.
  - `frontend/src/app/cart/page.tsx` — nút "Tiến hành thanh toán" nay ghi
    `sessionStorage.setItem('discountCode', appliedCodeName)` thay vì chỉ
    ghi % và tổng tiền đã tính sẵn (2 key cũ không còn dùng để truyền dữ liệu
    sang checkout, đã bỏ).
  - `frontend/src/app/checkout/page.tsx` — đọc `discountCode` từ
    sessionStorage lúc mount, RE-VALIDATE qua `GET /discounts/code/:code`
    (không tin lại % cũ vì mã có thể hết hạn giữa 2 bước — nếu không còn hợp
    lệ thì xóa mã, báo nhẹ, KHÔNG chặn thanh toán với giá gốc); thêm dòng
    "Giảm giá" + "Tổng cộng" vào khối tóm tắt trước khi submit (trước đây chỉ
    có "Tạm tính"); payload `POST /orders` thêm `discountCode` (chỉ gửi mã,
    không gửi % hay số tiền); màn hình kết quả sau khi đặt hàng hiển thị
    `orderResult.discountAmount` từ SERVER (không dùng số preview client
    tính) cạnh `sessionStorage.removeItem('discountCode')` khi thành công.

- **Đã test**: `npx tsc --noEmit` cả backend và frontend → 0 lỗi. Backend
  chạy thật, verify bằng `Invoke-RestMethod` với sản phẩm thật (Baseus,
  429.000đ):
  - `POST /orders` kèm `discountCode: "quoce10"` (chữ thường, test luôn việc
    tự uppercase) → `totalAmount = 386100` (đúng 429.000 × 0.9),
    `discountAmount = 42900`, `discountCode = "QUOCE10"`. `usedCount` của mã
    tăng đúng từ 0 → 1.
  - `discountCode` rác/không tồn tại → **404** với message thật ("Mã giảm
    giá không tồn tại hoặc đã khóa") — xác nhận bug nuốt message ĐÃ ĐƯỢC SỬA;
    tồn kho **không bị trừ oan** (49 → vẫn 49, không tụt thêm) → transaction
    rollback đúng, không tạo đơn dở dang.
  - Hạ tạm `maxUsage=1` (mã đã dùng 1 lần) → gọi lại → **404** "Mã giảm giá
    đã hết lượt sử dụng", đơn không được tạo. Khôi phục `maxUsage=10` ngay
    sau đó.
  - `POST /orders` không kèm `discountCode` → `discountAmount = 0`,
    `totalAmount` đầy đủ — không hồi quy so với hành vi cũ.
  - Dọn sạch: xóa 2 đơn test tạo ra trong lúc verify, hoàn trả đúng 2 đơn vị
    tồn kho đã trừ, reset `usedCount` của `QUOCE10` về lại `0`. Đã xác nhận
    lại: `Order.count() = 0`, `stock = 50` (về đúng như trước khi test).

- **Lưu ý/vấn đề gặp phải**:
  - `npx prisma migrate dev` lần đầu báo lỗi `EPERM` khi generate Prisma
    Client (do backend `start:dev` đang giữ file `query_engine-windows.dll.node`).
    Migration DB đã áp dụng thành công trước khi lỗi này xảy ra (chỉ bước
    generate client bị lỗi); chạy lại riêng `npx prisma generate` là xong,
    không ảnh hưởng gì tới migration đã chạy.
  - **CHƯA tự bấm qua được luồng UI** (giỏ hàng áp mã → checkout → đặt hàng)
    — cần trình duyệt thật, phiên này không có công cụ điều khiển trình
    duyệt. Danh sách 5 điểm cần kiểm tra tay đã ghi ở mục "🔍 Cần người dùng
    kiểm tra" phần Trạng thái hiện tại.
  - Mã `QUOCE10` vẫn còn nguyên trong DB (không xóa) — đây là dữ liệu hữu ích
    để người dùng tự test UI, không phải rác cần dọn.

### [2026-08-29] Đã sửa BUG UX: message lỗi mã giảm giá bị gộp chung 1 câu

**Người dùng phát hiện qua `curl` trực tiếp**: gọi
`GET /discounts/code/QUOCE10` lúc `usedCount = maxUsage` (hết lượt), backend
trả đúng và rõ ràng:
```json
{"success":false,"statusCode":404,"error":"Not Found","message":"Mã giảm giá đã hết lượt sử dụng",...}
```
Backend hoàn toàn đúng — bug nằm ở Frontend: `cart/page.tsx`,
`handleApplyCoupon` có khối `catch` bỏ qua hẳn message thật trong response
lỗi, hiển thị **CỨNG 1 câu duy nhất** ("Mã giảm giá không tồn tại hoặc có lỗi
kết nối, vui lòng thử lại") cho **MỌI** loại lỗi — hết hạn, hết lượt, không
tồn tại đều hiện y hệt nhau, dù `DiscountsService.validateCode()` đã phân
biệt rõ 3 message khác nhau cho 3 trường hợp này từ trước.

- **File đã sửa**: `frontend/src/app/cart/page.tsx` — khối `catch` của
  `handleApplyCoupon` đổi từ hiển thị chuỗi cứng sang đọc
  `err.response?.data?.message`, chỉ fallback về câu chung chung khi thật sự
  không có message (lỗi mạng, server sập).
- **Đã xác nhận qua đối chiếu code** (KHÔNG tự bấm qua UI được — không có
  trình duyệt trong phiên này): `lib/api.ts` — interceptor response chỉ can
  thiệp vào lỗi 401 (refresh token), mọi lỗi khác được `Promise.reject(error)`
  nguyên trạng, nên `err.response.data.message` giữ đúng shape mà
  `GlobalExceptionFilter` trả về, khớp chính xác với dữ liệu `curl` người
  dùng đã kiểm tra.
- `npx tsc --noEmit` (frontend) → 0 lỗi.
- **CẦN NGƯỜI DÙNG XÁC NHẬN LẠI TRÊN UI THẬT** — xem mục "🔍 Cần người dùng
  kiểm tra → ƯU TIÊN 1" ở phần Trạng thái hiện tại: test cả 2 ca (hết lượt và
  không tồn tại) để chắc chắn message đổi đúng theo từng lý do, không phải
  vẫn hiện trùng 1 câu.

**Xác minh KHÔNG PHẢI làm lại việc đã xong** (người dùng hỏi lại để chắc chắn
đây là commit mới, không phải lặp lại 1 fix cũ): đã chạy
`git log --follow -- frontend/src/app/cart/page.tsx`, chỉ có 3 commit đụng
file này — `8a8831d` (Initial commit, khối `catch` với message cứng đã có
sẵn TỪ ĐẦU DỰ ÁN — `git show 8a8831d:...` xác nhận nguyên văn giống hệt bug
vừa sửa), `30661e8` (Nhóm F, chỉ sửa nút "Tiến hành thanh toán", không đụng
khối `catch`), và `003f3e1` (lần sửa ĐẦU TIÊN và duy nhất của khối `catch`
này). Kết luận: đây là bug có sẵn từ code gốc, chưa từng được sửa trước phiên
này — không trùng lặp với bất kỳ commit nào.
Về việc người dùng đã "test PASS" trước đó: đó là test `curl` thẳng vào
backend (`GET /discounts/code/:code`), xác nhận tầng backend luôn đúng —
`DiscountsService.validateCode()` có 3 message phân biệt từ code gốc, không
phải do phiên này viết. Test đó KHÔNG mâu thuẫn với việc bug tồn tại ở tầng
Frontend, vì đây là 2 tầng độc lập: `curl` không đi qua `cart/page.tsx`.

### [2026-08-29] Đã hoàn thành: Nhóm F (phần 2) — Trang quản lý đơn hàng Admin

Làm trên `/model opusplan`, vào Plan Mode trước khi code (theo yêu cầu người
dùng). Dùng 2 agent Explore song song khảo sát backend Orders và frontend
Admin patterns trước khi thiết kế. 3 quyết định thật đã được người dùng chốt
qua AskUserQuestion trước khi viết plan: (1) response `GET /orders/admin/all`
bọc `{success, data}` thay vì bare `{items,...}` — ưu tiên nhất quán
trong-module; (2) mở rộng thêm trạng thái CANCELLED (có hoàn kho) ngoài 4
trạng thái CLAUDE.md liệt kê ban đầu; (3) filter gồm cả search (mã đơn/SĐT/
tên khách), không chỉ lọc status. Người dùng duyệt plan kèm 1 yêu cầu bổ
sung: cảnh báo rõ trong `window.confirm` khi hủy đơn đã `PAID` rằng hệ thống
không tự động hoàn tiền.

- **File đã sửa/tạo**:
  - `backend/src/orders/dto/query-order.dto.ts` (MỚI) — theo khuôn mẫu
    `QueryProductDto`: `page`/`limit`, `shippingStatus` (`@IsEnum`), `search`.
  - `backend/src/orders/dto/update-shipping-status.dto.ts` (MỚI) —
    `shippingStatus: ShippingStatus`.
  - `backend/src/orders/orders.service.ts` — thêm
    `SHIPPING_STATUS_TRANSITIONS` (module-level const) + 2 method:
    `findAllForAdmin()` (phân trang/filter, coerce Decimal → Number — điểm
    mà `findByUser`/`findOneForUser` hiện tại KHÔNG làm, chỉ `create()` có)
    và `updateShippingStatus()` (validate state machine, hoàn kho khi
    CANCELLED bằng cách mirror chính xác logic trừ kho trong `create()`,
    toàn bộ trong 1 transaction).
  - `backend/src/orders/orders.controller.ts` — thêm `GET admin/all` và
    `PATCH :id/shipping-status`, đặt TRƯỚC `@Get(':id')` đúng lỗi thứ tự
    route đã tránh ở ProductController.
  - `frontend/src/types/index.ts` — thêm `Order`/`OrderItem` (chưa từng có
    type nào cho Order ở FE trước đây).
  - `frontend/src/app/admin/orders/page.tsx` (MỚI) — trang quản lý đơn hàng
    đầy đủ: guard, debounce search, filter status, phân trang server-side
    (sao chép đúng pattern `admin/products/page.tsx`), bảng + badge màu
    theo trạng thái, dictionary nhãn tiếng Việt (`SHIPPING_STATUS_LABEL`,
    chưa từng tồn tại ở đâu trong repo), nút hành động chỉ hiện lựa chọn hợp
    lệ theo state machine, modal chi tiết đơn hàng, cảnh báo hoàn tiền khi
    hủy đơn đã PAID.
  - `frontend/src/components/Header.tsx` — thêm link "📦 Quản lý đơn hàng"
    cạnh link Admin Product sẵn có.
  - `CLAUDE.md` — thêm mục "Nhóm F (phần 2)" vào "ĐÃ HOÀN THÀNH", đánh dấu
    xong ở "VIỆC CẦN LÀM TIẾP — mục 2".

- **Đã test**: `npx tsc --noEmit` cả backend và frontend → 0 lỗi.
  **Không có credential ADMIN thật để login UI** — tự ký JWT hợp lệ bằng
  đúng `JWT_SECRET` trong `.env`, dùng user ADMIN thật có sẵn trong DB
  (`admin@quoce.vn`), gắn vào cookie `accessToken` qua PowerShell
  `WebRequestSession` để gọi thẳng API như trình duyệt thật:
  - `GET /orders/admin/all` → trả đúng đơn #9 (đơn thật do người dùng tự
    tạo lúc test Discount trước đó), `totalAmount`/`discountAmount`/
    `priceAtPurchase` đều là number (không phải Decimal object).
  - Tạo 1 đơn test riêng (`orderCode 10`, KHÔNG đụng đơn #9 của người dùng)
    để test state machine: PENDING→DELIVERED (nhảy cóc) → 400 đúng;
    PENDING→PROCESSING → 200 đúng; PROCESSING→PENDING (lùi) → 400 đúng;
    CANCELLED→PROCESSING (từ trạng thái cuối) → 400 đúng.
  - Hủy đơn test (PENDING→CANCELLED, đơn không chọn variant nên trừ
    `product.stock`): `product.stock` 49 → 50 sau khi hủy — hoàn kho đúng.
  - Filter `shippingStatus=CANCELLED`, search theo SĐT, search theo mã đơn
    (số) đều lọc đúng; `shippingStatus=FOO` (enum rác) → 400.
  - Token ký với role CUSTOMER (dùng user thật `user@quoce.vn`) →
    `GET /orders/admin/all` và `PATCH .../shipping-status` đều 403; route
    cũ `GET /orders/my-orders` vẫn 200 (không hồi quy). Không có cookie →
    401.
  - Dọn sạch: xóa đơn test `orderCode 10`, xác nhận lại `product.stock` về
    đúng 50, chỉ còn đơn #9 thật của người dùng trong DB.

- **Lưu ý/vấn đề gặp phải**:
  - Lần đầu tự ký JWT dùng sai field payload (`id` thay vì `sub`) khiến
    MỌI route có Guard trả 500 — kể cả route cũ đã chạy tốt trước đó
    (`GET /products/admin/all`, `GET /orders/my-orders`). Đã điều tra bằng
    cách tái hiện trực tiếp qua Prisma Client (loại trừ bug ở query/transform
    logic), rồi đọc lại `jwt.strategy.ts` mới phát hiện `validate()` đọc
    `payload.sub` chứ không phải `payload.id`. Sửa lại payload, mọi thứ chạy
    đúng. Đã ghi cảnh báo này vào CLAUDE.md để phiên sau không lặp lại.
  - Trong lúc test, có 2 request bắn ra đúng khoảng thời gian `nest --watch`
    đang tự restart (do các file `tmp-*.js`/`tmp_*.txt` tạo thẳng trong
    `backend/` nằm trong phạm vi theo dõi của watcher) → tưởng nhầm backend
    đã crash. Xác minh lại bằng `Get-NetTCPConnection`: tiến trình gốc
    (PID cũ) vẫn còn sống, chỉ là gián đoạn ngắn giữa lúc restart. Tiến
    trình `start:dev` phụ tôi lỡ khởi động thêm để debug đã tự thoát với
    `EADDRINUSE` (vô hại, không ảnh hưởng tiến trình gốc).
  - Phát hiện dòng "tip: auth for agents [www.vestauth.com]" khi chạy lệnh
    có dùng `dotenv` — đã xác minh đây là tính năng "tips" chính thức của
    chính package `dotenv` v17.4.2 (ghi trong CHANGELOG.md của package,
    không phải mã độc hay gói bị xâm nhập). Không cần xử lý gì thêm.
  - **CHƯA tự bấm qua UI thật được** (không có credential ADMIN) — xem mục
    "🔍 Cần người dùng kiểm tra → ƯU TIÊN 0" ở phần Trạng thái hiện tại.
  - Toàn bộ script tạm (`tmp-sign-jwt.js`, `tmp-find-admin.js`,
    `tmp-debug-findall.js`, `tmp-cleanup3.js`, `tmp_token.txt`,
    `tmp_customer_token.txt`, `tmp_test_order_id.txt`) đã xóa khỏi
    `backend/`, `git status` sạch.

### [2026-08-29] Đã thêm 18 sản phẩm DEMO để test trực quan Phân trang/Filter

Người dùng yêu cầu thêm dữ liệu mẫu để thấy rõ hiệu ứng phân trang/filter đã
xây ở Nhóm B (trước đó DB chỉ có đúng 1 sản phẩm thật nên không thấy được
phân trang thật sự). Yêu cầu rõ: TUYỆT ĐỐI KHÔNG chạy `seed.ts` hay bất kỳ
`deleteMany()` nào (DB có dữ liệu thật: tài khoản Admin đang dùng, đơn hàng
#9, sản phẩm Baseus) — chỉ được viết script THUẦN THÊM.

- **File đã tạo**: `backend/prisma/seed-demo-products.ts` (MỚI, giữ lại
  trong repo — không phải file tạm, có thể chạy lại sau này nếu cần thêm dữ
  liệu demo). Đặc điểm:
  - Tra Category/Brand theo **slug** (`phu-kien`, `baseus`), KHÔNG hard code
    UUID — an toàn nếu id đổi về sau.
  - Rải 2 sản phẩm demo cho MỖI subCategory thật đã có trong DB (9
    subCategory × 2 = 18 sản phẩm), tra subCategory cũng theo slug.
  - Mọi title có tiền tố `[DEMO] ` để dễ nhận biết + dọn sạch sau này.
  - **Idempotent**: check `slug` (unique) trước khi tạo, chạy lại nhiều lần
    không tạo trùng — an toàn nếu lỡ chạy 2 lần.
  - Dùng lại đúng thuật toán `slugify` đã có ở `admin/products/page.tsx`
    (Frontend) để đồng bộ cách sinh slug trong dự án.
  - Chạy bằng `npx ts-node prisma/seed-demo-products.ts` (đúng cơ chế
    `ts-node` sẵn có, cùng cách chạy với `seed.ts`).

- **Đã test**:
  - `npx tsc --noEmit` → 0 lỗi.
  - Chạy script → `✅ Đã tạo mới: 18 sản phẩm demo. Bỏ qua: 0.`
  - `GET /products?limit=100` → `total = 19` (18 demo + 1 thật), sản phẩm
    Baseus thật vẫn còn nguyên trong danh sách.
  - `GET /products?page=1&limit=10` vs `page=2&limit=10` → **2 trang thật**,
    10 + 9 item, khác nhau — phân trang giờ có ý nghĩa để test trực quan.
  - Filter `subCategoryId` (sạc dự phòng) → `total = 3` (2 demo + 1 thật) —
    đúng.
  - **Xác nhận dữ liệu thật KHÔNG bị đụng**: đếm lại trực tiếp qua Prisma —
    `Order.count() = 1` (vẫn chỉ có đơn #9), `Discount.findUnique('QUOCE10')`
    vẫn nguyên vẹn (chỉ khác `usedCount` do người dùng tự test trước đó,
    KHÔNG liên quan gì tới script này — script không đụng bảng `Discount`
    hay `Order`, chỉ tạo `Product`), `Product.count() = 19` khớp đúng dự
    kiến.

- **Lưu ý/vấn đề gặp phải**:
  - Không có vấn đề. Script chạy đúng ngay lần đầu, đã verify kỹ trước khi
    báo hoàn thành.
  - **Nhắc cho phiên sau**: `backend/prisma/seed-demo-products.ts` là script
    ĐƯỢC GIỮ LẠI trong repo (không phải file tạm cần xóa) — có thể chạy lại
    an toàn (idempotent) nếu cần thêm dữ liệu demo sau này. TRƯỚC khi
    go-live thật (Nhóm E), phải dọn sạch 18 sản phẩm demo bằng
    `prisma.product.deleteMany({ where: { title: { startsWith: '[DEMO] ' } } })`.

### [2026-08-29] Đã đóng: Bug UX message lỗi discount + luồng checkout có mã giảm giá

- **File liên quan**: `frontend/src/app/cart/page.tsx` (sửa ở entry trước —
  đọc `err.response?.data?.message` thay vì chuỗi cứng), `frontend/src/app/checkout/page.tsx`.
- **Đã test**: Người dùng tự bấm qua UI thật, xác nhận PASS cả 2 mục còn nợ:
  1. Message lỗi mã giảm giá: `QUOCE10` (hết lượt) và `ABCXYZ` (không tồn
     tại) hiện đúng 2 message khác nhau theo đúng lý do trả về từ backend.
  2. Luồng checkout có mã giảm giá: cart → checkout → đặt hàng, mã giữ
     xuyên suốt, `totalAmount` cuối đúng đã trừ giảm giá.
- **Lưu ý/vấn đề gặp phải**: Không có. Cả 2 mục đóng dứt điểm, không còn nợ
  gì ở phần Discount/Nhóm F (phần 1).

### [2026-08-30] Đã hoàn thành: AuditLog — ghi vết action nhạy cảm Admin (Nhóm F)

- **File mới**:
  - `backend/src/common/decorators/audit.decorator.ts` — `@Audit(action, entityType?)`,
    cùng khuôn mẫu `SetMetadata` + `reflector.getAllAndOverride` như `@Roles()`.
  - `backend/src/common/interceptors/audit-log.interceptor.ts` — interceptor
    ĐẦU TIÊN của dự án. Bỏ qua ngay (`return next.handle()`) nếu route không
    có `@Audit()` — không đụng response, không bao trùm toàn cục (khác hẳn
    TransformInterceptor đã bị rút lại trước đây). Dùng `tap()` cho ca thành
    công (lấy `entityId` từ `req.params.id`, fallback từ `response.id`/
    `response.data.id`), `catchError()` cho ca thất bại (ghi
    `metadata.success=false` + `errorMessage`, rồi `throw` lại nguyên lỗi).
    Ghi log qua `void this.write(...)` không chặn response; lỗi ghi log tự
    nuốt + log qua nestjs-pino Logger. Redact `password`/`newPassword`/
    `oldPassword`/`currentPassword`/`confirmPassword`/`token`/`accessToken`/
    `refreshToken`/`cccd` trong `metadata.body` trước khi ghi DB.
  - `backend/src/common/utils/request-meta.ts` — `getRequestMeta(req)` dùng
    chung, sửa bug thứ tự ưu tiên IP (`x-forwarded-for` giờ ưu tiên trước
    `req.ip`, vì `req.ip` gần như luôn truthy nên nhánh sau nó trước đây
    không bao giờ chạy tới).
- **File sửa**:
  - `backend/prisma/schema.prisma` — model `AuditLog` thêm `entityType`,
    `entityId`, `metadata Json?`, index `createdAt`. Migration
    `20260829171737_add_audit_log_details` — chỉ ADD COLUMN + CREATE INDEX,
    không mất dữ liệu (bảng đang rỗng).
  - `backend/src/app.module.ts` — đăng ký `AuditLogInterceptor` qua
    `APP_INTERCEPTOR` (cạnh `APP_GUARD: ThrottlerGuard` sẵn có).
  - `backend/src/main.ts` — thêm `app.set('trust proxy', 1)`. Trước đó
    hoàn toàn chưa có — khi deploy sau proxy (Nhóm E), `req.ip` sẽ là IP của
    proxy chứ không phải client thật, ảnh hưởng cả audit log lẫn
    `ThrottlerGuard` (rate-limit theo IP sẽ gộp nhầm mọi client).
  - `backend/src/auth/auth.controller.ts` — xóa method private
    `getRequestMeta()` trùng lặp, chuyển dùng helper chung.
  - Gắn `@Audit()` vào đúng 8 route: `product.controller.ts` (create/update/
    remove), `orders.controller.ts` (updateShippingStatus),
    `brands.controller.ts` (create/remove), `sub-categories.controller.ts`
    (create/remove), `users.controller.ts` (changePassword),
    `cloudinary.controller.ts` (uploadFile).
- **Đã test**: `npx tsc --noEmit` sạch. Viết script Node tạm (tự ký JWT
  ADMIN bằng đúng `JWT_SECRET`, gọi API thật qua `fetch`, đọc trực tiếp bảng
  `audit_logs` qua Prisma) chạy 5 ca, cả 5 PASS:
  1. Ca thành công (`PATCH /orders/:id/shipping-status` hợp lệ) — có đúng 1
     bản ghi, `userId`/`entityType`/`entityId` khớp, `metadata.body` đúng.
  2. Ca thất bại (nhảy cóc trạng thái, bị state machine chặn 400) — VẪN có
     bản ghi, `metadata.success=false` + có `errorMessage`, response client
     vẫn đúng 400 như cũ (interceptor không làm méo lỗi).
  3. Ca tạo mới (`POST /brands`) — `entityId` lấy đúng từ response (không
     có `req.params.id`).
  4. Ca redact (`PATCH /users/:id/password` trên user test tự tạo) —
     `metadata.body.oldPassword`/`newPassword` đều là `"[REDACTED]"`, không
     lộ mật khẩu thật dưới bất kỳ dạng nào.
  5. Ca không log (`GET /products`) — xác nhận route không có `@Audit()`
     không sinh bản ghi nào.
  - Regression: `GET /products`, `GET /brands`, `GET /health` vẫn trả đúng
    format cũ, không bị interceptor đụng vào.
  - Dữ liệu test (1 đơn hàng, 1 brand, 1 user, và các bản ghi `audit_logs`
    phát sinh) đã dọn sạch hoàn toàn — `audit_logs` về lại rỗng đúng như
    trước khi bắt đầu, `Order`/`Brand` count về đúng baseline.
- **Lưu ý/vấn đề gặp phải**:
  - **Race condition trong CHÍNH SCRIPT TEST** (không phải bug thật của
    interceptor): `void this.write(...)` là fire-and-forget, nên query DB
    ngay sau khi HTTP response trả về đôi khi chưa thấy bản ghi kịp ghi
    xong. Sửa bằng cách thêm `wait(500ms)` sau mỗi lệnh mutate trước khi
    kiểm tra — sau đó cả 5 ca đều PASS ổn định. Cũng phát hiện thêm 1 bug
    tương tự trong logic dọn dẹp của chính script (xóa `user` trước khiến
    `onDelete: SetNull` xóa `userId` trên log trước khi filter cleanup theo
    `userId` kịp chạy, để sót 1 dòng — đã sửa cleanup lọc theo `entityId`
    thay vì `userId`, và dọn tay dòng sót lại).
  - **Port 5000 bị 1 process node khác chiếm** trong lúc chuẩn bị test
    (2 lần: PID `44008` rồi `2464`) — cả 2 lần đều được người dùng xác nhận
    an toàn để `taskkill` trước khi restart server với code mới.
  - **CHECKPOINT — hết usage đột ngột giữa phiên**: sau khi báo "5/5 ca
    PASS, cleanup xong, tsc sạch" nhưng CHƯA KỊP tự `git commit`, phiên bị
    ngắt do hết usage. Người dùng tự chạy tay
    `git add . && git commit && git push` dựa đúng trên báo cáo, tạo commit
    `c16eff3` (không có trailer `Co-Authored-By` vì không phải Claude tự
    commit). Phiên sau đã xác nhận lại: đọc nguyên văn 3 file mới + diff
    toàn bộ file đã sửa trong commit, khớp 100% với plan đã duyệt — commit
    hợp lệ, không phải bất thường.

### [2026-08-30] Đã hoàn thành: Cảnh báo tồn kho thấp — Admin Products (Nhóm F)

- **File đã sửa**: `frontend/src/app/admin/products/page.tsx` — CHỈ file
  này, không đụng backend/schema/API.
  - Thêm `LOW_STOCK_THRESHOLD = 5` (hằng số cố định, không phải cột DB)
    và helper `getStockBadge(stock)` trả `{ label, className }` hoặc `null`.
  - Cột "Kho": sản phẩm không variant → số + badge nếu thấp/hết; sản phẩm
    có variant → "Tổng biến thể: N" (tổng `variants.reduce`, KHÔNG dùng
    `Product.stock` vì không phản ánh kho thật khi có variant) + badge tổng
    hợp theo variant nghiêm trọng nhất (ưu tiên đỏ "N màu hết hàng" trước
    vàng "N màu sắp hết").
  - Cột "Biến thể màu": thêm `ring-2 ring-red-500`/`ring-2 ring-amber-500`
    quanh chấm màu bị thấp/hết (giữ `border border-gray-300` cho bình
    thường); `title` đổi từ chỉ tên màu sang `"<colorName> — còn <stock>"`.
  - `colSpan` các nhánh empty/loading giữ nguyên `10` — không thêm cột mới.
- **Đã test**: `npx tsc --noEmit` sạch (frontend). Không có trình duyệt tự
  động sẵn có trong phiên này (`claude-in-chrome` — người dùng từ chối cài,
  đã ghi nhận không hỏi lại trong phiên). Verify bằng cách:
  1. Query trực tiếp DB xác nhận không có sản phẩm/variant nào đang có
     stock thấp sẵn (thấp nhất là 12) → cần tạm hạ dữ liệu mới thấy được
     badge.
  2. Viết script Node tạm hạ stock 2 sản phẩm demo (`[DEMO] Webcam 4K...`
     → 3, `[DEMO] Loa Soundbar...` → 0) và 2 variant của
     `Pin sạc dự phòng Baseus Enerfill FC5` (Đen nhám → 2, Trắng sứ → 0),
     lưu giá trị gốc ra file JSON trước khi đổi.
  3. Người dùng tự bấm qua UI thật tại `/admin/products`, xác nhận
     **4/4 mục PASS**: badge vàng "Sắp hết: 3", badge đỏ "Hết hàng", viền
     ring đúng màu trên 2 chấm variant + badge tổng hợp đỏ "1 màu hết
     hàng" + "Tổng biến thể: 2", các sản phẩm stock bình thường không có
     badge nào.
  4. Có 1 lần FAIL giả ở bước tooltip (người dùng tưởng thiếu số tồn kho
     khi hover) — đọc lại code xác nhận đúng ngay từ đầu, hard refresh lại
     trình duyệt thì hiện đúng đầy đủ `"<màu> — còn <N>"` → xác nhận đây là
     trình duyệt cache tooltip cũ từ lần hover trước khi sửa code, không
     phải bug thật.
  5. Khôi phục đúng giá trị stock gốc cho cả 4 bản ghi (đã đối chiếu lại
     qua Prisma sau khi restore, khớp 100% với giá trị đã lưu ban đầu),
     xóa sạch toàn bộ file script test tạm.
- **Lưu ý/vấn đề gặp phải**: Không có vấn đề thật nào trong code — điểm
  "FAIL" duy nhất trong quá trình test hóa ra là do cache tooltip của trình
  duyệt, không phải lỗi code. Đây là bài học nhỏ: khi test UI qua người
  dùng bằng tooltip/hover, nên nhắc hard refresh trước nếu vừa sửa code
  ngay trước đó, tránh nhầm lẫn cache trình duyệt với bug thật.
