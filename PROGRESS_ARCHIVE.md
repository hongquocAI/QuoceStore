# PROGRESS_ARCHIVE.md — QuoceStore — Nhật ký cũ đã lưu trữ

> File này chứa các entry NHẬT KÝ CHI TIẾT cũ nhất, đã được cắt khỏi
> `PROGRESS.md` để giữ file chính gọn gàng (theo đúng quy tắc ghi sẵn trong
> chính `PROGRESS.md`). Đây thuần là lưu trữ — không xóa, chỉ di chuyển.
> Đọc file này khi cần tra cứu lịch sử xa hơn phần còn lại trong
> `PROGRESS.md`.

---

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

