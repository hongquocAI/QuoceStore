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
**✅ Nhóm B ĐÃ HOÀN TẤT** (code xong, backend đã verify bằng request thật,
frontend đã pass `tsc --noEmit` + biên dịch sạch cả 3 trang).

⏳ **CÒN CHỜ NGƯỜI DÙNG KIỂM TRA TAY 1 lượt trang `/admin/products`** trước khi
coi là đóng hoàn toàn — xem mục "Cần người dùng kiểm tra" bên dưới.

**Việc tiếp theo sau đó**: Nhóm F — nối Discount thật vào
`OrdersService.create()` (CLAUDE.md mục "VIỆC CẦN LÀM TIẾP — mục 2").

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

- **Có 1 sản phẩm test còn sót trong DB thật**: `"Test sản phẩm hợp lệ 001"`
  (phát hiện khi gọi `GET /products` lúc verify phân trang, 2026-08-29). Bản
  ghi này được tạo từ **phiên làm việc TRƯỚC**, không phải phiên này. Chưa xóa
  vì xóa dữ liệu trong DB thật là thao tác không hoàn tác được — **cần người
  dùng xác nhận** rồi mới xóa (nguyên tắc số 9 về dọn dữ liệu test).
- **Storefront chưa phân trang server-side** — cố ý hoãn, lý do đầy đủ ghi ở
  mục "Đang làm" phía trên. Điều kiện tiên quyết: thêm `minPrice`/`maxPrice`
  vào `QueryProductDto`.
- **Thiếu index DB** trên `createdAt`, `isActive`, `price`, `title` của bảng
  `products`. `orderBy: createdAt desc` mặc định và `search` (Prisma
  `contains`) hiện đang quét tuần tự. Chưa ảnh hưởng ở quy mô hiện tại (DB
  đang có rất ít sản phẩm) nhưng sẽ thành vấn đề thật khi catalog lớn.

### 🔍 Cần người dùng kiểm tra (chưa tự verify được trong phiên này)
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
