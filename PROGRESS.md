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
*(cập nhật lần cuối: [Khởi tạo] — 2026-08-29)*

### Đang làm / Việc tiếp theo ngay
**Chưa bắt đầu** — việc đầu tiên cần làm: **Hoàn tất Phân trang cho
GET /products và GET /products/admin/all** (chi tiết đầy đủ trong CLAUDE.md
mục "VIỆC CẦN LÀM TIẾP — mục 1").

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

- *(chưa có mục nào)*

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
