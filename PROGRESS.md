# PROGRESS.md — QuoceStore — Nhật ký tiến độ

> File này được AI agent tự động cập nhật sau mỗi việc hoàn thành, và bắt buộc
> đọc lại đầu mỗi phiên làm việc mới. Xem quy tắc ghi log trong CLAUDE.md.

---

## [Khởi tạo] Trạng thái bàn giao ban đầu

Dự án được bàn giao ở trạng thái: Phase 0 ✅, Phase 1 ✅, Nhóm A ✅ (phần lõi),
Nhóm C ✅, Nhóm B đang dở (Cache Redis ✅, Phân trang ❌).

Việc tiếp theo cần làm ngay: **Hoàn tất Phân trang cho GET /products và
GET /products/admin/all** — xem chi tiết đầy đủ trong CLAUDE.md mục
"VIỆC CẦN LÀM TIẾP — mục 1".

---

## [Sau khởi tạo] Đã hoàn thành: Thiết lập Git + GitHub

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

(Các mục log tiếp theo sẽ được agent tự thêm vào bên dưới dòng này, bắt đầu
từ việc "Hoàn tất Nhóm B — Phân trang".)