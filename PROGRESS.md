# PROGRESS.md — QuoceStore — Trạng thái & Nhật ký

> Xem `CLAUDE.md` để biết ngữ cảnh đầy đủ dự án (nguyên tắc, stack, roadmap
> chi tiết). File này gồm 2 phần tách biệt:
>
> **(1) 🎯 TRẠNG THÁI HIỆN TẠI** — LUÔN LUÔN GHI ĐÈ phần này mỗi khi cập nhật
> (không append thêm bản cũ bên dưới) — đây là nguồn duy nhất trả lời "đang ở
> đâu, tiếp theo làm gì NGAY BÂY GIỜ" mà không cần đọc hết lịch sử bên dưới.
>
> **(2) 📜 NHẬT KÝ CHI TIẾT** — CHỈ được append thêm vào cuối, KHÔNG sửa/xóa
> entry cũ — đây là lịch sử để tra cứu "việc X đã làm chưa, làm bằng cách
> nào, gặp vấn đề gì" khi cần debug hoặc đối chiếu.

---

## 🎯 TRẠNG THÁI HIỆN TẠI
*(cập nhật lần cuối: 2026-08-29)*

### Đang làm / Việc tiếp theo ngay
**➡️ ĐANG BẮT ĐẦU: Nhóm F — nối Discount thật vào `OrdersService.create()`**
(CLAUDE.md mục "VIỆC CẦN LÀM TIẾP — mục 2"). Đây là logic tính tiền
server-side trong transaction → làm trên `/model opusplan`.

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

### [Khởi tạo] Trạng thái bàn giao ban đầu

Dự án được bàn giao ở trạng thái: Phase 0 ✅, Phase 1 ✅, Nhóm A ✅ (phần lõi),
Nhóm C ✅, Nhóm B đang dở (Cache Redis ✅, Phân trang ❌).

### [Sau khởi tạo] Đã hoàn thành: Thiết lập Git + GitHub

- **File đã sửa/tạo**:
  - Khởi tạo Git repo tại thư mục gốc `D:\Projects\quoce_store`
  - Xóa `.git` con bị lỡ tạo bên trong `backend/` (do lệnh khởi tạo project
    NestJS tự động init git riêng — gây lỗi "does not have a commit checked
    out" khi add từ thư mục gốc, đã fix bằng cách xóa `.git` con)
  - Xóa file rác `frontend/src/app/lib/api.ts` (trùng lặp, không được import
    ở đâu — file thật đang dùng là `frontend/src/lib/api.ts`)
  - Xóa file dead code `frontend/src/components/layout/Navbar.tsx` (dùng cơ
    chế auth cũ qua localStorage, không được `layout.tsx` import — component
    thật đang dùng là `Header.tsx`)
  - Xóa `docker-compose.yml` ở thư mục gốc (leftover từ giai đoạn đầu dự án,
    branding "apexstore" cũ, không còn dùng vì đã chuyển sang Neon Postgres +
    Upstash Redis thật)

- **Đã test**:
  - Xác nhận `.gitignore` ở cả `backend/` và `frontend/` đều chặn đúng `.env`
    trước khi commit lần đầu (soát thủ công `git status` output)
  - Xác nhận không có `node_modules/`, `.next/`, `dist/` nào lọt vào staged
    files
  - Push thành công lên `https://github.com/hongquoccoder/QuoceStore` (private
    repo), branch `main`

- **Commit history**:
  - `8a8831d` — Initial commit: QuoceStore sau Phase 0, Phase 1, Nhom A/B/C
    (204 files, 39991 insertions)
  - `4ee3bb2` — Don dep: xoa file rac api.ts trung lap va Navbar.tsx khong
    con dung (2 files, 204 deletions)

- **Lưu ý/vấn đề gặp phải**:
  - `backend/.claude/skills/` và `backend/.windsurf/skills/` chứa symlink
    hỏng (trỏ tới thư mục không tồn tại) — Git tự động bỏ qua khi add, in ra
    warning vô hại, không ảnh hưởng gì tới việc commit/push. Không cần xử lý.

---

*(Entry tiếp theo sẽ được agent tự thêm vào NGAY DƯỚI dòng này, bắt đầu từ
việc "Hoàn tất Nhóm B — Phân trang". Nhớ: mỗi entry mới PHẢI đi kèm cập nhật
lại phần "🎯 TRẠNG THÁI HIỆN TẠI" ở đầu file.)*

### [2026-08-29] Quyết định phạm vi: Phân trang Product (ghi TRƯỚC khi code)

Người dùng đã chốt phạm vi trước khi bắt đầu implement, ghi lại đây để các
phiên sau hiểu đúng vì sao storefront chưa có phân trang:

- **Backend**: làm đầy đủ — `page`/`limit` (default 1/20, max 100) + filter
  `categoryId`/`subCategoryId`/`brandId`/`search`, trả
  `{ items, total, page, limit, totalPages }` cho cả `GET /products` và
  `GET /products/admin/all`.
- **Admin panel**: phân trang server-side thật. Chọn Admin trước vì trang này
  **đã có sẵn** UI phân trang (prev/next + "Trang X / Y", 10 dòng/trang), ô
  search và filter Category — nhưng tất cả đang chạy client-side trên toàn bộ
  dữ liệu. Nối vào server là thuận nhất, rủi ro thấp nhất, giá trị cao nhất.
- **Storefront (trang chủ + /accessories)**: CHỈ sửa cách đọc response
  (`res.data.items`) + gọi `limit=100`. Giữ nguyên lọc client-side.
  - **Lý do hoãn**: trang chủ lọc client theo Category **và khoảng giá**
    (`under-1m`/`1m-3m`/`over-3m`); `/accessories` lọc theo
    `subCategory.slug`. Backend không có filter giá → nếu phân trang thật
    ngay, lọc giá sẽ chỉ áp dụng trong trang hiện tại → kết quả sai. Muốn làm
    tiếp phải bổ sung `minPrice`/`maxPrice` server-side trước, rồi mới viết
    lại UI storefront. Không gộp việc đó vào cùng lần đổi breaking này.
- **Không giữ tương thích ngược**: đổi shape dứt điểm 1 lần, sửa hết Frontend
  cùng commit (đúng khuyến nghị CLAUDE.md, dự án còn nhỏ, chỉ 3 call site).

**Rủi ro đã nhận diện trước**: đây đúng loại breaking change đã từng làm vỡ
Frontend khi thử TransformInterceptor (`subCategories.filter is not a
function`). Chỗ vỡ CỨNG là `admin/products/page.tsx` —
`setProducts(prodRes.data)` sẽ nhét cả object envelope vào `Product[]`. Hai
chỗ vỡ MỀM (danh sách thành rỗng, không crash) là trang chủ và
`/accessories`. Cả 3 đều nằm trong phạm vi sửa của phiên này.

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

⚠️ **PHÁT HIỆN NGOÀI DỰ KIẾN trong lúc xác minh** *(ghi lúc chưa tìm ra
nguyên nhân thật — xem entry ngay bên trên để biết kết luận cuối cùng)*:
sản phẩm thật còn lại đang
có `isActive = false`, nên `GET /products` trả `total=0` và **storefront hiện
không hiển thị sản phẩm nào**. Bằng chứng: `updatedAt` của sản phẩm này là
2026-08-28T21:12:01Z, tức bị sửa ~10 phút TRƯỚC thời điểm chạy script dọn dẹp
— và script dọn dẹp chỉ `deleteMany` trên Order + `delete` đúng 1 sản phẩm
test theo id, KHÔNG hề ghi vào `isActive` của sản phẩm này. Nguyên nhân nhiều
khả năng nhất: có người bấm nút "Xóa" trên sản phẩm này trong trang Admin —
lúc đó nó vẫn còn 1 orderItem (thuộc đơn số 4) nên `ProductService.remove()`
đi vào nhánh **soft-delete** (`isActive: false`) thay vì xóa cứng. Đây là
hành vi ĐÚNG của service, không phải bug. Đang chờ người dùng xác nhận có bật
lại `isActive = true` hay không.
