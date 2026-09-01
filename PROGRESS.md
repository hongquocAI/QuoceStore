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
*(cập nhật lần cuối: 2026-09-02, phiên làm việc tự động qua đêm)*

### Đang làm / Việc tiếp theo ngay

**✅ Đợt 4 Nhóm G (Feature gap) — 4/8 việc ĐÃ LÀM, 4/8 việc TREO LẠI
(2026-09-02, làm tự động qua đêm).** G1 audit (2026-08-31) liệt kê 7 gap
thật; sau khảo sát code, tách "review sản phẩm" thành 2 phần → tổng 8 mục
đánh giá. Đã làm 4 việc rủi ro thấp, không cần quyết định kiến trúc lớn
(mirror pattern có sẵn trong dự án hoặc tận dụng API/component đã có):
- **Việc A — Category Admin CRUD**: backend module mới `categories/`
  (mirror 1:1 `brands/`/`sub-categories/`), `admin/products/page.tsx` có
  nút "+ Thêm mới" cho Danh mục chính (trước đây phải seed DB tay). Test
  PASS qua API thật (tạo → cache invalidate đúng → xóa → xác nhận đã xóa).
- **Việc B — Header mobile navigation**: hamburger menu, trước đây mobile
  mất hoàn toàn "Cửa hàng"/"Phụ kiện"/"Tra cứu đơn".
- **Việc C — Orders timeline trực quan**: stepper 4 bước trong modal chi
  tiết `/orders` + `/orders/lookup`, dùng data đã có sẵn.
- **Việc D — Sản phẩm liên quan**: trang chi tiết sản phẩm, tái dùng API
  phân trang + `ProductCard` có sẵn, xác nhận filter đúng qua request thật.

`tsc --noEmit` (backend + frontend) + `npm run build` (frontend) sạch sau
mỗi việc và tổng kết cuối. 4 commit riêng biệt, đã push.

**⚠️ Cần người dùng xác nhận — 4 việc treo lại, KHÔNG làm (đúng chỉ đạo
"cần quyết định kiến trúc lớn thì ghi lại, không tự làm"):**
1. **Cart chọn item riêng để checkout** + **Checkout progress-step UI** —
   về kỹ thuật khả thi không cần quyết định kiến trúc, NHƯNG cả 2 đụng
   trực tiếp `cart.tsx`/`checkout.tsx`/`CartContext` — đúng nhóm file vừa
   qua nhiều vòng sửa lỗi tiền/kho nghiêm trọng đêm nay (Hướng B, polling).
   **Quyết định thận trọng có chủ đích**: không tự ý sửa tiếp file thanh
   toán khi không có người theo dõi UI thật lúc code. Nếu muốn làm, nên
   làm có người dùng theo dõi trực tiếp, không phải qua đêm tự động.
2. **Review sản phẩm** — cần quyết định kiến trúc thật: thêm bảng `Review`
   (migration), chính sách kiểm duyệt (tự động hiện hay cần Admin duyệt?),
   ai được review (chỉ người đã mua hay bất kỳ user nào?), có tính rating
   trung bình lưu vào `Product` không?
3. **Profile — sổ địa chỉ nhiều địa chỉ** — cần bảng `Address` mới
   (migration), CRUD đầy đủ, và quyết định checkout chọn địa chỉ nào (mặc
   định? chọn lúc checkout?).

**🔍 Cần người dùng kiểm tra bằng mắt (Đợt 4, chưa test UI thật)**:
1. `/admin/products` → mở form Thêm sản phẩm → bấm "+ Thêm mới" cạnh
   "Danh mục chính" → tạo thử 1 danh mục → xác nhận xuất hiện ngay trong
   dropdown không cần F5.
2. Thu nhỏ trình duyệt (hoặc DevTools responsive) → xác nhận hamburger
   menu xuất hiện, mở/đóng đúng, các link hoạt động.
3. `/orders` (đăng nhập, có đơn) → "Xem chi tiết" → xác nhận stepper hiện
   đúng bước hiện tại; `/orders/lookup` tra cứu 1 đơn → xác nhận tương tự.
   Nếu tiện, đổi thử `shippingStatus` 1 đơn qua `/admin/orders` rồi quay
   lại `/orders` xem stepper cập nhật đúng.
4. Vào 1 trang chi tiết sản phẩm có sản phẩm khác cùng SubCategory → xác
   nhận section "Sản phẩm liên quan" hiện đúng, không hiện sản phẩm đang
   xem trong danh sách đó.

**✅ G2 — Dynamic list Highlights/Specs (Admin Products) ĐÃ ĐÓNG HOÀN TOÀN
(2026-09-02, làm tự động qua đêm).** Thay 2 textarea thô (`highlightsText`,
`specsText` JSON tay) bằng dynamic list `highlights: string[]` +
`specs: {key,value}[]`, đúng mô tả G2 đã ghi sẵn trong CLAUDE.md. Backend
KHÔNG cần đổi (đã tương thích). `tsc --noEmit` + `npm run build` sạch.
Chi tiết đầy đủ xem Nhật ký chi tiết.

**🔍 Cần người dùng kiểm tra bằng mắt (G2, chưa test UI thật)**: vào
`/admin/products`, mở Thêm/Sửa sản phẩm, xác nhận UI Highlights/Specs mới
hoạt động đúng (thêm/xóa hàng, giá trị cũ của sản phẩm đã có specs/
highlights hiển thị lại đúng khi mở Sửa), lưu thử 1 sản phẩm và xác nhận
trang chi tiết sản phẩm (`/product/[slug]`) vẫn hiển thị specs/highlights
đúng như trước (không đổi cách backend lưu/trả dữ liệu, chỉ đổi UI nhập).

**✅ Nhóm D — Pháp lý & Tuân thủ ĐÃ ĐÓNG HOÀN TOÀN (2026-09-02, làm tự động
qua đêm, chưa có người dùng test UI thật).** 3 trang mới `/privacy-policy`,
`/terms`, `/return-policy` — nội dung đầy đủ, nghiêm túc theo đúng khung
pháp lý (KHÔNG sơ sài kiểu portfolio, đúng yêu cầu chỉnh lại của người
dùng), tham chiếu Nghị định 13/2023/NĐ-CP, có disclaimer cuối mỗi trang.
Thêm `Footer.tsx` (mới, dự án chưa từng có) để 3 trang không bị orphan.
Toàn bộ chi tiết xem Nhật ký chi tiết `[2026-09-02]` mục "Nhóm D".

**🔍 Cần người dùng kiểm tra bằng mắt (chưa test UI thật)**:
1. Đọc lại nội dung 3 trang pháp lý — tôi tự viết theo hướng nghiêm túc/
   đầy đủ đúng yêu cầu, nhưng câu chữ cụ thể có thể cần góp ý thêm (đặc
   biệt mốc "7 ngày" ở Return Policy Mục 2 — tôi tự chọn con số tham khảo
   phổ biến, ghi rõ trong trang là "mức tham khảo", có thể cần đổi).
2. Xem `Footer` hiển thị đúng vị trí (luôn ở cuối trang) trên vài trang
   khác nhau — đã tự động hóa được `tsc --noEmit` + `npm run build` (cả 3
   route mới compile/pre-render OK), nhưng KHÔNG thể tự "nhìn" giao diện.
3. Xác nhận domain liên hệ `support@quoce.vn` dùng trong 3 trang có ổn
   không, hay muốn đổi (tôi chọn domain hư cấu `@quoce.vn` đã có sẵn trong
   code cho nhất quán, không bịa domain mới).

**Không có mục "Cần người dùng xác nhận" nào bị treo** — câu hỏi CCCD bắt
buộc/optional đã tự chốt được bằng cách audit code thật (xem Nhật ký chi
tiết), không phải suy đoán, nên không cần dừng lại chờ.

**✅ G4 — Cải thiện bố cục `/orders` + chi tiết đơn hàng đầy đủ ĐÃ ĐÓNG
HOÀN TOÀN (2026-09-02).** Ghi nhận từ 2026-09-01 trong `CLAUDE.md`, đã vào
Plan Mode audit kỹ trước khi code (số liệu cụ thể, không cảm tính):
- **Root cause tỷ lệ**: ảnh sản phẩm trong `orders/page.tsx` chỉ `w-12 h-12`
  (48px) — nhỏ hơn hẳn mọi nơi khác trong dự án hiển thị ảnh sản phẩm
  (`cart/page.tsx` dùng `w-20 h-20`); card mỗi đơn nằm trong `max-w-5xl`
  dùng `flex justify-between` nên trên màn rộng khoảng trắng giữa khối ảnh
  và khối giá chiếm phần lớn — đúng cảm giác "khung to, nội dung nhỏ".
- **Dữ liệu vốn đã đủ, chỉ thiếu render**: xác nhận
  `OrdersService.findByUser()`/`lookupGuestOrder()` đã `include` đầy đủ
  `product`/`variant`, có `shippingStatus`/`paymentMethod`/`address`/
  `discountCode`/`discountAmount`/`createdAt` — **toàn bộ G4 là việc
  Frontend thuần túy, không sửa backend, không thêm API**.
- Đã sửa: `orders/page.tsx` — ảnh `w-12→w-16`, text `xs→sm`, thêm màu biến
  thể, thêm `createdAt` + badge `shippingStatus` (cạnh badge `paymentStatus`
  có sẵn), thêm nút "Xem chi tiết" mở **modal chi tiết tại chỗ** (đọc data
  đã có sẵn trong state `orders`, KHÔNG gọi API thêm) hiển thị đầy đủ:
  2 badge trạng thái, phương thức thanh toán, địa chỉ, giảm giá (nếu có),
  từng item (ảnh/tên/màu/SL/đơn giá/thành tiền), tổng tiền.
  `orders/lookup/page.tsx` — sửa bug `shippingStatus` in RAW enum tiếng Anh
  (không qua `SHIPPING_STATUS_LABEL`), thêm ảnh sản phẩm vào item, thêm
  dòng phương thức thanh toán + giảm giá (nếu có).
  `frontend/src/lib/orderLabels.ts` — thêm `SHIPPING_STATUS_BADGE` (trích
  từ `admin/orders/page.tsx`, tránh chép đôi) và `PAYMENT_METHOD_LABEL`
  dùng chung.
- **Chủ động KHÔNG đụng**: `checkout.tsx`/`cart.tsx`/`profile.tsx`/
  `change-password.tsx` (đã audit, không có vấn đề tỷ lệ tương tự — xem
  Nhật ký chi tiết); không tạo trang `/orders/[id]` riêng (modal đủ, không
  cần route mới); không gộp modal chi tiết khách hàng với modal admin
  (2 ngữ cảnh khác nhau).

**✅ 2 việc UX sau "Hướng B" ĐÃ ĐÓNG HOÀN TOÀN (2026-09-02), người dùng test
PASS toàn bộ:**

- **Việc A — Checkout tự động cập nhật trạng thái thanh toán (polling).**
  Endpoint mới `GET /orders/:id/status` (PUBLIC có chủ đích, key bằng
  `Order.id` — UUID v4 không đoán/liệt kê được, khác `orderCode` là số
  nguyên tuần tự; response CHỈ `{ paymentStatus }`, dùng `select` ở Prisma
  nên không có nguy cơ lộ field khác kể cả khi Order thêm cột mới sau này).
  `checkout/page.tsx`: `useEffect` poll mỗi 4s khi VietQR còn PENDING, dừng
  khi đổi trạng thái / quá 10 phút (hiện gợi ý kiểm tra lại ở `/orders`) /
  unmount (cleanup `clearInterval`). Khi phát hiện `PAID`, UI tự chuyển
  sang khối "✓ Thanh toán thành công!" (tái dùng đúng style khối COD), ẩn
  QR. File: `backend/src/orders/orders.controller.ts`,
  `backend/src/orders/orders.service.ts` (method `getPaymentStatus`),
  `frontend/src/app/checkout/page.tsx`.
- **Việc B — `ConfirmModal` dùng chung thay `window.confirm()`.** Component
  mới `frontend/src/components/common/ConfirmModal.tsx` (props: `open`,
  `title`, `message`, `confirmLabel?`, `cancelLabel?`, `danger?`,
  `onConfirm`, `onCancel`; `z-[70]` cố định để luôn nổi trên mọi modal khác
  trong dự án), theo đúng pattern modal vuông vức đã có
  (`admin/products/page.tsx` mini-modal quick-add). `admin/orders/page.tsx`:
  tách `handleUpdateStatus` thành `requestUpdateStatus` (build message, mở
  modal) + `handleUpdateStatus` (chỉ còn phần gọi API) — thay đúng 1 chỗ
  gọi `window.confirm()` duy nhất trong file, không đổi logic nghiệp vụ.

**⏳ Việc tiếp theo**: chưa có việc mới nào được chốt — chờ người dùng.

**✅ "Hướng B" — Tách trừ kho VietQR khỏi lúc tạo đơn, chuyển sang lúc
webhook xác nhận PAID ĐÃ ĐÓNG HOÀN TOÀN (2026-09-02), người dùng test PASS
đầu-cuối thật qua ngrok.** Lỗ hổng nghiệp vụ đã sửa: trước đây
`OrdersService.create()` trừ tồn kho ngay khi tạo đơn cho CẢ COD lẫn
VietQR — nếu khách tạo đơn VietQR rồi bỏ ngang không quét mã, tồn kho bị
khóa vĩnh viễn cho 1 đơn không bao giờ thanh toán ("hết hàng ảo"). Thiết kế
mới: COD giữ nguyên hoàn toàn (đặt đơn = cam kết, trừ kho ngay như cũ).
VietQR — `OrdersService.create()` vẫn validate tồn kho (throw nếu không đủ)
nhưng KHÔNG ghi giảm; `PaymentService.handleWebhook()` mới là nơi trừ kho
thật, đúng lúc xác nhận `PAID` (trong cùng transaction với đổi
`paymentStatus`), có chốt an toàn `order.paymentStatus !== PAID` chống trừ
2 lần. Ca hết hàng phát sinh giữa lúc đặt và lúc thanh toán (hiếm) vẫn ghi
`PAID` (tiền không thể phủ nhận), trừ kho clamp về 0 (không âm), ghi
`AuditLog` (`action: 'PAYMENT_STOCK_CONFLICT'`) cho Admin xử lý thủ công —
KHÔNG tự động hoàn tiền/hủy đơn. UI: `checkout/page.tsx` VietQR hiện "Đơn
hàng đã được ghi nhận — vui lòng quét mã để hoàn tất thanh toán" (icon ⏳),
không dùng chữ "thành công" cho tới khi PAID thật; `orders/page.tsx` +
`orders/lookup/page.tsx` hiện rõ "Đang chờ thanh toán" (badge amber) cho
VietQR PENDING, tách biệt khỏi "Chưa thanh toán" của COD PENDING (bình
thường, không phải vấn đề). File đã sửa: `backend/src/orders/
orders.service.ts`, `backend/src/payment/payment.service.ts`,
`frontend/src/app/checkout/page.tsx`, `frontend/src/app/orders/page.tsx`,
`frontend/src/app/orders/lookup/page.tsx`, `frontend/src/lib/
orderLabels.ts` (thêm `getPaymentStatusDisplay()` dùng chung).

**✅ Nhóm G — ĐẢO NGƯỢC thiết kế + 2 bug ĐÃ ĐÓNG HOÀN TOÀN (2026-09-01).**
Người dùng xem trực tiếp kết quả Đợt 3 cũ (bo góc mềm, nền `#fafafc`,
`font-serif`) và KHÔNG hài lòng — **bỏ hẳn định hướng "2 gia đình style"**
(Storefront vs Account) đã chốt ngày 2026-08-31, thay bằng **1 style duy
nhất cho toàn site: vuông vức, mạnh mẽ, tương phản đen-trắng** (theo chuẩn
`login/page.tsx` + `ProductCard.tsx`). Đã cập nhật `CLAUDE.md` mục Nhóm G
ghi rõ quyết định đảo ngược + bảng style token chuẩn dùng cho mọi trang sau
này. Làm theo 3 đợt nhỏ, mỗi đợt `tsc --noEmit` sạch + người dùng test tay +
commit/push riêng:

- **Đợt A** (commit `837c9b3`): 2 bug độc lập với style.
  - **Bug 1** (chặn hoàn toàn tính năng lưu hồ sơ, mọi lần Lưu đều 400): root
    cause có **3 nguyên nhân cộng dồn**, không chỉ 1 như nghi ngờ ban đầu —
    (1) `profile/page.tsx` gửi thừa `avatarUrl` trong payload `PATCH
    /users/:id`, field này không có trong `UpdateProfileDto`
    (`forbidNonWhitelisted` chặn); (2) **`@IsOptional()` của class-validator
    chỉ bỏ qua `null`/`undefined`, KHÔNG bỏ qua chuỗi rỗng `''`** — field để
    trống vẫn bị `@Matches`/`@IsEnum` từ chối, đây là nguyên nhân THẬT của
    các lỗi CCCD/SĐT tưởng không liên quan; (3) `message` lỗi từ
    `ValidationPipe` là mảng string, Frontend đổ thẳng vào JSX gây dính chữ
    liền nhau khó đọc. Sửa: build payload PATCH tường minh (chỉ 6 field DTO
    chấp nhận, bỏ field rỗng), thêm helper `getApiErrorMessage()`
    (`frontend/src/lib/api.ts`) chuẩn hóa lỗi mảng thành nhiều dòng. Backend
    giữ nguyên — avatar đã có endpoint riêng `PATCH /users/:id/avatar`.
  - **Bug 2** (thiếu điều hướng): `Header.tsx` thêm "Tra cứu đơn hàng" +
    "Đổi mật khẩu" vào dropdown tài khoản (đã đăng nhập), thêm "Tra cứu đơn"
    vào nav chính (chỉ hiện khi CHƯA đăng nhập — đúng nhóm khách cần nhất).
  - Người dùng test PASS 8/10 (2 mục còn lại là câu hỏi xác nhận thiết kế,
    không phải bug — xem "⚠️ Known Issue" dưới đây).
- **Đợt B** (commit `90c2254`): viết lại JSX/className của `profile/
  page.tsx`, `orders/lookup/page.tsx`, `change-password/page.tsx` sang style
  vuông vức. Chỉ đổi style, giữ nguyên 100% logic (kể cả fix Bug 1 ở Đợt A và
  các fix logic đã có từ Đợt 3 cũ, VD `change-password` dùng `api.patch`
  thay `fetch()` thô).
- **Đợt C**: viết lại `cart/page.tsx`, `checkout/page.tsx`, `orders/
  page.tsx` (lịch sử đơn) sang cùng style — lần đầu các trang này được đụng
  tới cho mục đích style. Trích `PAYMENT_STATUS_LABEL`/`SHIPPING_STATUS_LABEL`
  ra `frontend/src/lib/orderLabels.ts` (dùng chung giữa `admin/orders/
  page.tsx` và `orders/page.tsx`, tránh chép đôi dictionary nhãn tiếng Việt).
  Giữ nguyên 100% logic nghiệp vụ (áp mã giảm giá, tạo QR PayOS, redirect
  401 → `/login`).

⚠️ **Known Issue mới phát sinh, CHƯA xử lý (không phải bug, là giới hạn UX
đã cân nhắc và tạm chấp nhận)**: Profile không có cách xóa trắng 1 field
optional (CCCD/SĐT/giới tính) sau khi đã từng lưu — để trống rồi bấm Lưu chỉ
bị bỏ qua (không gửi lên server), giữ nguyên giá trị cũ trong DB. Đây là hệ
quả ĐÚNG của thiết kế "field rỗng = không đổi" (tránh vô tình xóa dữ liệu
khi chỉ muốn sửa field khác). Muốn hỗ trợ xóa hẳn cần thêm cơ chế tường minh
(nút X riêng từng field, hoặc gửi `null` thay vì bỏ field) — cần sửa cả DTO
backend, ngoài phạm vi Frontend-only đã chốt cho đợt sửa này. Làm sau nếu
người dùng thấy cần.

**✅ 2 vấn đề nghiêm trọng VietQR (phát hiện qua test thật sau Đợt C) ĐÃ XỬ LÝ
(2026-09-01):**

- **Vấn đề 1 (ảnh QR vỡ trên checkout) — ĐÃ SỬA.** Xác nhận KHÔNG phải
  regression Đợt C (đối chiếu `git diff` — Đợt C chỉ đổi className, dòng
  `<img src={qrData.qrCode}>` có nguyên từ commit đầu tiên `8a8831d`). Root
  cause: `qrCode` từ `@payos/node` là **chuỗi dữ liệu VietQR thô** (xem
  `payment-requests.d.ts:93`, `qrCode: string`), không phải URL ảnh — gán
  thẳng vào `<img src>` luôn vỡ. Đã thêm `qrcode.react@4.2.0` (lần đầu dùng
  trong project, đã đọc `.d.ts` xác nhận API `QRCodeSVG({ value, size, level
  })` trước khi dùng, không đoán), sửa `checkout/page.tsx` render đúng ảnh QR
  từ chuỗi đó.
- **Vấn đề 2 (paymentStatus không tự cập nhật sau khi quét QR thật) —
  BAN ĐẦU nghi giới hạn hạ tầng, sau test bằng ngrok phát hiện thêm 1 BUG
  THẬT, đã sửa. Xem đầy đủ ở entry Nhật ký `[2026-09-02]` bên dưới** (test
  `confirm()` qua ngrok lộ ra: webhook 404 khi PayOS gửi request test với
  `orderCode` giả lúc đăng ký — sẽ chặn `confirm()` ở CẢ production, không
  chỉ dev). Đã sửa `payment.service.ts`, `confirm()` đăng ký thành công.
- **Lưu ý phụ (không thuộc phạm vi 2 vấn đề trên, không cần hành động ngay)**:
  trong lúc chạy script test, `dotenv@17.4.2` (bản đang cài) in ra 1 dòng tip
  ngẫu nhiên nhắc tới domain `www.vestauth.com` ("⌁ auth for agents"). Đã xác
  nhận dòng này nằm CỨNG trong mảng `TIPS` của chính `node_modules/dotenv/lib/
  main.js` (không phải log lỗi hay bị chèn từ đâu khác) — không thực thi gì,
  chỉ là 1 chuỗi quảng cáo random khi `dotenv.config()` chạy trong TTY. Không
  phải bug của dự án, nhưng nếu thấy domain lạ trong log sau này, đây là lý
  do (dotenv chính thức có in tip quảng cáo `dotenvx`/đối tác từ bản 16.x+).

**⏳ Việc tiếp theo**: G3 (polish chi tiết) và G4 (feature gap — review sản
phẩm, timeline đơn hàng, chọn item giỏ hàng riêng lẻ, sổ địa chỉ) theo đúng
roadmap 4 đợt gốc trong `CLAUDE.md`, chưa bắt đầu.

⚠️ **G4 MỚI ghi nhận (2026-09-01, chưa làm, chờ Plan riêng)**: `/orders` có
vấn đề tỷ lệ bố cục (khung to, nội dung sản phẩm/số tiền hiện quá nhỏ) — chi
tiết đầy đủ + phạm vi audit đã ghi trong `CLAUDE.md` mục Nhóm G, phần G4.

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
thấp).

**✅ Mục 2b CLAUDE.md — UX form Thêm/Sửa sản phẩm Admin ĐÃ ĐÓNG HOÀN TOÀN
(2026-08-30).** Làm đủ cả 6 việc liệt kê trong CLAUDE.md (mục 7 — chia
tab/section — chủ động KHÔNG làm, đúng ghi chú "để sau khi catalog lớn").
Chỉ sửa `frontend/src/app/admin/products/page.tsx`:
1. Thay `window.prompt()` bằng mini-modal quick-add đàng hoàng (lồng
   `z-[60]` trên modal chính `z-50`), Brand quick-add có thêm `logoUrl`.
2. `handleCloseModal()` — `window.confirm` nếu `formData` đổi so với
   snapshot lúc mở (so sánh `JSON.stringify`).
3. Nút Submit khóa + hiện "ĐANG XỬ LÝ..." khi `submitting`, đúng pattern
   `uploadingThumbnail` đã có.
4. Ô SKU `readOnly` + nút "↻ Sinh lại mã khác" (sửa luôn bug: đổi Brand sau
   khi gõ Title không cập nhật lại prefix SKU — trích `generateSku(title,
   brandId)` thành hàm thuần dùng chung).
5. Tooltip + placeholder ở cột "Giá (VNĐ)" biến thể giải thích quy ước
   fallback.
6. `specsError` (`useMemo`) validate JSON specsText ngay khi gõ, viền đỏ +
   dòng lỗi inline dưới textarea.

**🛡️ 2 bug thật phát hiện qua test tay, đã sửa cùng đợt:**
- **Bug mất ảnh variant khi upload nhanh liên tiếp**: `handleVariantImageUpload`
  và `handleRemoveVariantImage` tính mảng `images` mới từ `formData.variants`
  đọc ở closure ngoài thay vì `prev.variants` trong functional updater — nếu
  2 lượt upload ảnh cho CÙNG 1 variant chồng lấn thời gian (upload sau
  resolve trong khi state của upload trước chưa kịp render lại), lượt sau
  đọc lại mảng CŨ rồi set đè, mất ảnh vừa thêm dù Cloudinary đã lưu đủ (thấy
  đủ ảnh trong folder, chỉ UI thiếu). Đã sửa cả 2 hàm tính trên `prev`.
- **Wording tooltip/placeholder giá biến thể gây hiểu nhầm**: chữ "giá gốc"
  trùng tên với field "Giá gốc/Original Price" riêng biệt trên form, trong
  khi hành vi thật (backend) là fallback về "Giá bán" (`price`), không phải
  "Giá gốc" (`originalPrice`). Đổi thành "Để trống hoặc 0 sẽ dùng đúng Giá
  bán của sản phẩm chính".

**🔍 Đã điều tra kỹ 1 nghi vấn bug KHÔNG PHẢI bug thật**: người dùng báo
folder Cloudinary của ảnh variant lệch với thumbnail (thiếu Brand, rơi về
"general"). Trace toán học thuật toán `getDynamicFolder` cho cả 5 tổ hợp
thiếu/đủ Category+SubCategory+Brand xác nhận: không có nhánh logic riêng
cho `type='variant'` — cùng 1 biểu thức tra cat/subCat/brand dùng chung cho
cả 3 loại ảnh, luôn cho cùng thư mục cha nếu đọc tại CÙNG 1 thời điểm. Người
dùng tự test lại có kiểm soát thứ tự (chọn đủ 3 dropdown TRƯỚC khi upload)
→ khớp nhau hoàn toàn. Xác nhận nguyên nhân là **thứ tự thao tác** (upload
ảnh trước khi hoàn tất dropdown, rồi đổi dropdown sau — ảnh cũ không tự cập
nhật lại thư mục), không phải bug code. Xem known-issue mở rộng bên dưới.

Việc còn lại: các Nhóm D/E chưa bắt đầu.

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
- **Upload ảnh (thumbnail/gallery/variant) tính thư mục Cloudinary NGAY lúc
  chọn file, không tự cập nhật lại nếu Admin đổi Category/SubCategory/Brand
  SAU KHI đã upload** (mở rộng từ ghi chú cũ chỉ nhắc SubCategory —
  2026-08-30 xác nhận qua điều tra thực tế: cùng bản chất áp dụng cho CẢ 3
  dropdown, không riêng SubCategory). Đã xác nhận bằng trace toán học +
  người dùng tự test lại có kiểm soát thứ tự: `getDynamicFolder`
  (`admin/products/page.tsx`) hoàn toàn nhất quán giữa thumbnail/gallery/
  variant nếu đọc `formData` tại CÙNG 1 thời điểm — không phải bug logic.
  Chấp nhận được ở quy mô hiện tại (Admin đơn lẻ, catalog nhỏ); nếu muốn
  sửa triệt để phải đổi kiến trúc (hoãn upload thật tới lúc Submit, hoặc
  chặn UI không cho upload cho tới khi đủ 3 dropdown).
- **[HÀNG ĐỢI — Nhóm E, trước go-live] Cloudinary orphaned files**: ảnh bị
  xóa khỏi form (đã lưu sản phẩm hay chưa) vẫn còn tồn trên Cloudinary,
  không tự dọn — tích tụ file rác theo thời gian vì upload xảy ra ngay khi
  chọn file, độc lập với việc sản phẩm có được lưu hay không. Cần viết
  script garbage collection: quét toàn bộ ảnh trong
  `quoce-store/products/...`, đối chiếu với URL thực sự đang được
  `Product.thumbnail`/`images`/`ProductVariant.images` tham chiếu trong DB,
  xóa ảnh không khớp. Chạy tay hoặc lên lịch định kỳ. Chưa cần làm ngay —
  catalog còn nhỏ, Cloudinary free tier đủ dung lượng, rủi ro thấp ở giai
  đoạn hiện tại.
- **[HÀNG ĐỢI — không rõ mức ưu tiên]** Sửa Brand ở chế độ Edit mà không
  bấm "↻ Sinh lại mã khác" → SKU giữ nguyên prefix cũ, không tự đồng bộ.
  Chấp nhận được (đúng thiết kế "chủ động" — Admin có nút để tự sinh lại
  khi cần), nhưng nên cân nhắc thêm cảnh báo nhỏ khi phát hiện SKU hiện tại
  không khớp prefix Brand đang chọn.
- **[HÀNG ĐỢI]** Ô `logoUrl` trong mini-modal quick-add Brand chưa validate
  định dạng URL — nhập chuỗi bất kỳ vẫn submit được (backend
  `CreateBrandDto.logoUrl` chỉ có `@IsOptional() @IsString()`, không
  `@IsUrl()`).
- **[HÀNG ĐỢI, phạm vi lớn — không code ngay]** Ô "Thông số kỹ thuật
  (Specs - JSON Format)" đang bắt Admin gõ JSON thô — rào cản UX thật với
  người không biết lập trình. Ý tưởng: thay bằng trình xây dựng key-value
  động (danh sách hàng Tên thuộc tính/Giá trị + nút "+ Thêm dòng", tự ghép
  thành JSON ở tầng submit, không đổi format lưu DB). Cần thiết kế riêng
  (UI cho việc thêm/xóa/sắp xếp hàng, xử lý giá trị lồng nhau nếu có) —
  không thuộc phạm vi đợt sửa UX vừa xong.

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

### [2026-08-30] Đã hoàn thành: UX form Thêm/Sửa sản phẩm Admin (CLAUDE.md mục 2b)

- **File đã sửa**: CHỈ `frontend/src/app/admin/products/page.tsx` (đúng
  phạm vi UX Frontend thuần túy đã chốt, không đụng backend/schema/API).
  Làm đủ cả 6 việc CLAUDE.md liệt kê (mục 7 — chia tab/section — chủ động
  không làm, đúng quyết định "để sau khi catalog lớn").
  1. Mini-modal quick-add (`quickAddModal` state) thay `window.prompt()` ở
     `handleQuickAddSubCategory`/`handleQuickAddBrand` cũ — gộp thành 1 hàm
     `handleQuickAddSubmit` dùng chung, tái dùng helper `generateSlugFromName()`
     trích ra (trước đó lặp lại y hệt 2 lần). Nút "+ Thêm mới" SubCategory
     thêm `disabled={!formData.categoryId}` (thay `alert()` chặn cứng cũ).
     Brand quick-add có thêm field `logoUrl` optional (xác nhận đúng field
     name qua `CreateBrandDto`).
  2. `initialFormDataSnapshot` (chụp lúc `handleOpenCreate`/`handleOpenEdit`)
     + `handleCloseModal()` — `window.confirm` nếu `JSON.stringify(formData)`
     khác snapshot. Áp cho nút "✕ Đóng" và "Hủy bỏ"; KHÔNG áp cho nhánh đóng
     sau khi lưu thành công trong `handleSubmit` (bypass thẳng, dữ liệu đã
     lưu rồi không cần hỏi).
  3. State `submitting` — `setSubmitting(true)` đầu `handleSubmit`, thêm
     `finally { setSubmitting(false) }` (trước đây chỉ có `catch`, không có
     `finally`). Nút Submit + "Hủy bỏ" đều `disabled={submitting}`, label
     đổi "ĐANG XỬ LÝ..." khi đang chạy.
  4. Trích `generateSku(title, brandId)` thành hàm thuần (dùng closure
     `brands`), gọi lại từ `handleTitleChange` VÀ nút mới "↻ Sinh lại mã
     khác" — sửa bug thật: trước đây đổi Brand sau khi đã gõ Title không hề
     cập nhật lại prefix SKU vì SKU chỉ tái sinh trong `handleTitleChange`.
     Input SKU thêm `readOnly` (bỏ hẳn `onChange`), placeholder khi rỗng.
  5. Tooltip header + `placeholder` cột "Giá (VNĐ)" biến thể giải thích quy
     ước fallback (khớp `product.service.ts` dòng ~83: `v.price > 0 ?
     v.price : dto.price`).
  6. `specsError` (`useMemo` phụ thuộc `formData.specsText`) — viền đỏ +
     dòng `⚠ JSON không hợp lệ: {message}` dưới textarea ngay khi gõ.
     `handleSubmit` GIỮ NGUYÊN khối `try/catch JSON.parse` cũ làm lớp chặn
     cuối, không xóa.
- **Sự cố kỹ thuật trong lúc code (không liên quan logic nghiệp vụ)**: viết
  đoạn có chứa `\u0300-\u036f` (regex bỏ dấu tiếng Việt, cần trích từ code
  cũ) trực tiếp qua Edit tool bị chính tầng xử lý chuỗi của tool "ăn mất"
  escape — biến `\u0300` thành ký tự combining diacritic thật thay vì giữ
  nguyên 2 ký tự `\` + `u0300` trong source code, làm hỏng regex 2 lần liên
  tiếp (kể cả `sed -i` qua Bash cũng dính lỗi tương tự). Khắc phục bằng
  cách ghi file qua **Node.js script** (`String.fromCharCode(92)` dựng thủ
  công ký tự backslash), né hoàn toàn tầng escape của Edit tool/shell. Bài
  học cho phiên sau: **bất kỳ đoạn code nào chứa chuỗi `\uXXXX`, `\n`,
  `\s`... cần giữ nguyên literal (không phải xuống dòng/khoảng trắng thật)
  PHẢI ghi qua Node script**, không dùng Edit tool trực tiếp.
- **Đã test**: `npx tsc --noEmit` sạch (chạy nhiều lần trong lúc code, sau
  mỗi bước). Người dùng tự bấm qua UI thật (không có `claude-in-chrome`
  trong phiên này), kết quả tổng hợp:
  - **6/8 mục PASS ngay lần đầu** (mini-modal quick-add cả 2 loại, confirm
    đóng modal, khóa nút Submit, SKU readOnly + sinh lại, tooltip/JSON
    inline).
  - **1 bug thật phát hiện qua test (mục 5 — ảnh biến thể)**: thêm 2 ảnh
    liên tiếp cho CÙNG 1 variant, Cloudinary lưu đủ 2 (xác nhận qua tên
    folder) nhưng UI chỉ hiện lại 1 ảnh. Nguyên nhân xác nhận qua đọc code:
    `handleVariantImageUpload`/`handleRemoveVariantImage` tính
    `updatedVariants` từ `formData.variants` đọc ở closure ngoài thay vì
    `prev.variants` trong functional updater của `setFormData` — nếu 2 lượt
    upload cùng variant chồng lấn thời gian, lượt sau đọc lại mảng CŨ (chưa
    có ảnh 1) rồi set đè. Đã sửa cả 2 hàm chuyển hẳn sang tính trên `prev`
    (React đảm bảo functional updater áp dụng tuần tự trên state mới nhất,
    không mất update dù có race). Test lại: PASS.
  - **1 wording gây hiểu nhầm (mục 7)**: tooltip/placeholder "giá sản phẩm
    gốc" trùng tên với field "Giá gốc/Original Price" riêng biệt trên form,
    trong khi hành vi thật là fallback về "Giá bán" (`price`). Đổi thành
    "Để trống hoặc 0 sẽ dùng đúng Giá bán của sản phẩm chính" /
    placeholder "0 = dùng Giá bán chính". Test lại: PASS.
  - **1 nghi vấn bug ĐIỀU TRA KỸ, KẾT LUẬN KHÔNG PHẢI BUG**: người dùng báo
    folder Cloudinary ảnh variant thiếu Brand ("general" thay vì "anker")
    trong khi thumbnail đúng. Viết script Node mô phỏng đúng thuật toán
    `getDynamicFolder` cho cả 5 tổ hợp thiếu/đủ Category+SubCategory+Brand
    — xác nhận toán học: không có nhánh logic riêng cho `type='variant'`,
    cùng 1 biểu thức tra cat/subCat/brand dùng chung cho cả 3 loại ảnh, thư
    mục cha LUÔN nhất quán nếu đọc `formData` tại cùng 1 thời điểm. Người
    dùng tự test lại có kiểm soát thứ tự (chọn đủ 3 dropdown TRƯỚC khi
    upload) → khớp hoàn toàn. Kết luận: nguyên nhân là **thứ tự thao tác**
    (upload ảnh trước khi hoàn tất dropdown, đổi dropdown sau không cập
    nhật lại folder ảnh cũ), không phải bug code — đã ghi vào Known Issues
    (mở rộng từ ghi chú cũ chỉ nhắc SubCategory sang cả Category/Brand).
- **Lưu ý/vấn đề gặp phải**: Đã dọn sạch mọi dữ liệu/file test tạm trong
  quá trình điều tra (không tạo bản ghi DB nào cần dọn — toàn bộ test dùng
  script Node mô phỏng thuần túy, không gọi API thật). CLAUDE.md mục 2b và
  mục "Cảnh báo tồn kho thấp" (đã xong từ việc trước nhưng CLAUDE.md quên
  cập nhật) đều đã sửa lại khớp thực tế, đúng nguyên tắc #10.

### [2026-08-31] Đã hoàn thành: G1 — Audit toàn diện Frontend (Nhóm G)

- **Phạm vi**: đọc-only, không sửa gì. 3 agent Explore chạy song song, mỗi
  agent phụ trách 1 nhóm file dự đoán (Storefront 7 file, Account 7 file,
  Admin+layout+misc 5 file) — đủ 19 file trong `frontend/src/app` và
  `frontend/src/components`.
- **Phát hiện chính** (đã trình bày bảng đầy đủ cho người dùng trong chat):
  1. "Gia đình Account" KHÔNG đồng nhất thật — chỉ `cart`/`checkout`/
     `orders` đúng chuẩn (`bg-[#fafafc]`, `rounded-2xl/3xl`, `font-serif`).
     `profile/page.tsx` và `orders/lookup/page.tsx` đang mang nhầm style
     Storefront (`bg-white`, `rounded-none`, uppercase-bold) dù nằm trong
     route Account; `change-password/page.tsx` pha trộn không thuộc hẳn
     bên nào.
  2. `register/page.tsx` lệch nặng nhất toàn dự án — `font-serif` (đáng lẽ
     Storefront phải uppercase-bold), `bg-gray-900` thay vì `bg-black`,
     không card bọc, không brand mark, khác hẳn `login/page.tsx` liền kề.
  3. `AiChatWidget.tsx` tự tạo "gia đình thứ 4" — pha trộn bo góc Account +
     tông đen-xám Storefront + màu `blue-400`/`emerald-500` ngoài cả 2
     palette đã chốt.
  4. 2 file dead code: `CheckoutQr.tsx` (không ai import, UI test lộ
     UUID picker + `alert()`) và `AdminGuard.tsx` (2 trang Admin tự viết
     lặp lại logic guard, không dùng file này — chính comment trong code
     cũ cũng tự thừa nhận).
  5. Feature gap thật (không chỉ polish): giỏ hàng không chọn item riêng
     để thanh toán, checkout không progress-step, sản phẩm không review/
     liên quan, orders không timeline trực quan, profile không quản lý
     nhiều địa chỉ, Category Admin phải seed DB tay (không tạo được qua
     UI), Header mobile mất hoàn toàn navigation.
- **Quyết định của người dùng sau khi xem audit**: chốt thứ tự 4 đợt sửa —
  Đợt 1 (dọn rác + AiChatWidget + font) → Đợt 2 (kéo trang lạc về đúng
  chuẩn, gồm cả `register.tsx`) → Đợt 3 (polish chi tiết) → Đợt 4 (feature
  gap). Yêu cầu tường minh: khi tới `register.tsx` phải trình bày bản
  thiết kế mô tả TRƯỚC để duyệt, không code ngay dù đã biết rõ vấn đề.

### [2026-08-31] Đã hoàn thành: Nhóm G Đợt 1 — Dọn rác + AdminGuard + AiChatWidget + Font

- **File đã sửa/xóa/tạo**:
  - **Xóa** `frontend/src/components/CheckoutQr.tsx` — xác nhận qua grep
    không ai import trước khi xóa.
  - **Tạo mới** `frontend/src/app/admin/layout.tsx` — layout lồng Next.js
    App Router bọc `<AdminGuard>{children}</AdminGuard>`, tự động áp dụng
    cho MỌI route `/admin/*` hiện tại lẫn tương lai.
  - **Sửa** `frontend/src/components/AdminGuard.tsx` — cải thiện style màn
    hình loading (khớp convention `font-sans uppercase` sẵn có của 2 trang
    Admin) vì giờ nó là màn hình loading DUY NHẤT thay cho 2 bản trước đây.
  - **Sửa** `frontend/src/app/admin/orders/page.tsx` và
    `admin/products/page.tsx` — xóa hẳn khối `useEffect` check
    `user.role !== 'ADMIN'` + `setTimeout` redirect trùng lặp 1:1 giữa 2
    trang (AdminGuard đảm nhiệm); xóa import `useAuth`/`useRouter` không
    còn dùng; đơn giản hóa effect fetch dữ liệu (bỏ điều kiện
    `authLoading`/`user?.role` vì con chỉ mount khi chắc chắn ADMIN); bỏ
    nhánh early-return `authLoading` trong màn hình loading (chỉ giữ
    `loading` của data fetch riêng từng trang).
  - **Sửa** `frontend/src/components/AiChatWidget.tsx`:
    - Thêm `usePathname()` (từ `next/navigation`, lần đầu dùng trong repo)
      → `if (pathname?.startsWith('/admin')) return null;` — cách khả thi
      DUY NHẤT để ẩn widget khỏi `/admin/*`, vì widget được `app/layout.tsx`
      (layout CHA, Server Component) mount NGOÀI `{children}` của
      `app/admin/layout.tsx` — layout con không thể gỡ phần tử của layout
      cha, chỉ có thể tự ẩn từ bên trong chính widget.
    - Chọn **Account** làm gia đình style chuẩn cho widget (không phải
      Storefront) — widget vốn đã ~90% theo ngôn ngữ Account
      (`rounded-2xl`, `bg-[#fafafc]`), và ngữ nghĩa "trợ lý AI hỗ trợ" khớp
      tinh thần ấm áp của Account hơn Storefront (marketing, tương phản
      mạnh).
    - Xóa `text-blue-400` (2 chỗ) → `text-white`; xóa hẳn chấm "online"
      giả (`bg-emerald-500 animate-pulse`, không gắn trạng thái thật nào);
      đổi `bg-gray-900` → `bg-black` (khớp tông đen thuần CTA chính của
      Account); xóa import `MessageSquare` từ `lucide-react` (dead import).
    - Sửa xử lý lỗi API: phân biệt `429` (rate-limit thật, 10 req/phút —
      hiện đúng message backend trả) và `400` (validate) với lỗi khác;
      KHÔNG đổ thẳng `err.response.data.message` ra UI cho lỗi 500 (
      `AiService` có thể lộ chi tiết lỗi Gemini nội bộ trong message).
  - **Sửa** `frontend/src/app/layout.tsx` — xóa import `Inter` từ
    `next/font/google` và bỏ `inter.className` khỏi `<body>`.
- **Phát hiện quan trọng trong lúc điều tra font** (không phải suy đoán —
  xác nhận bằng CSS specificity + grep thật): 3 font đang CÙNG LÚC render ở
  3 vùng khác nhau của site trước khi sửa:
  1. SF Pro (8 trang Storefront + 2 trang Admin, qua class `font-sans`
     tường minh — Tailwind `tailwind.config.js` đã override
     `theme.extend.fontFamily.sans` thành stack SF Pro).
  2. Serif mặc định Tailwind (Georgia/Times, KHÔNG phải font brand nào —
     `fontFamily.serif` không hề bị override) — chỉ riêng heading Account
     qua `font-serif`.
  3. Inter — toàn bộ phần còn lại của trang Account (thân bài/input/nút,
     không có class font nào nên kế thừa thẳng từ `<body>`).
  `globals.css` đã khai báo sẵn đúng ý định (SF Pro trên `body`) từ đầu
  nhưng bị `inter.className` (class-selector trên `<body>`) che mất hoàn
  toàn — class-selector luôn thắng element-selector bất kể `@layer`. SF Pro
  được khai báo tường minh ở 3 nơi độc lập (tailwind.config, globals.css,
  8 trang) trong khi không trang nào chủ động muốn Inter — kết luận Inter
  chỉ là boilerplate `create-next-app` sót lại, chưa từng có chủ đích. Bỏ
  Inter → `globals.css` tự thắng, dồn về đúng 1 nguồn font thân bài nhất
  quán toàn site, `font-serif` heading Account vẫn giữ nguyên làm điểm nhấn
  có chủ đích (không tính là "nguồn xung đột").
- **Đã test**: `npx tsc --noEmit` sạch sau mỗi bước. Không có trình duyệt
  tự động trong phiên này — người dùng tự test UI thật, xác nhận **5/5 mục
  PASS**:
  1. Vào `/admin/*` khi không phải ADMIN → đá về `/` NGAY, không còn thấy
     UI admin thoáng qua 1.5s trước khi redirect.
  2. `AiChatWidget` ẩn hoàn toàn trên mọi route `/admin/*`.
  3. Widget hết 2 màu lạc tông + chấm online giả trên các trang khác.
  4. Gọi chat AI vượt rate-limit → hiện đúng message rate-limit thay vì
     "lỗi kết nối" chung chung.
  5. Font thân bài nhất quán giữa Storefront và Account khi quan sát trực
     quan (không còn cảm giác lệch font giữa 2 khu vực).
  Không có dữ liệu DB nào tạo ra trong quá trình test (thay đổi thuần UI/
  code) — không cần dọn dẹp gì thêm.
- **Lưu ý/vấn đề gặp phải**: Trong lúc khởi động lại kiểm tra, `GET /health`
  báo `database.status: down` 1 lần — xác nhận đây là đặc tính đã biết của
  Neon Postgres serverless (tự "ngủ" khi rảnh lâu, xem CLAUDE.md mục "THÔNG
  TIN MÔI TRƯỜNG"), retry sau 5s thấy `up` bình thường, không liên quan gì
  tới thay đổi trong đợt này.

### [2026-08-31] Đã hoàn thành: Nhóm G Đợt 2 — Đồng bộ Login/Register + Bật Google Login thật

- **Phạm vi thay đổi so với dự kiến ban đầu**: người dùng mở rộng Đợt 2 từ
  "kéo `profile`/`orders-lookup`/`change-password` về chuẩn Account" (dự
  kiến gốc) sang "đồng bộ Login/Register + bật Google Login thật" — 3 trang
  kia dời sang đợt riêng sau (gọi là "Đợt 3" trong Trạng thái hiện tại).
- **🛡️ Lỗ hổng bảo mật NGHIÊM TRỌNG phát hiện qua khảo sát, đã sửa trước
  khi bật Google Login thật**: `GoogleLoginDto` (gốc từ Phase 0) cho
  `token` optional và còn nhận `email`/`fullName` trực tiếp từ client.
  `AuthService.googleLogin()` chỉ verify chữ ký Google trong nhánh
  `if (dto.token)` — bỏ qua `token` là bỏ qua toàn bộ verify, tin thẳng
  `email` client tự khai để tìm-hoặc-tạo tài khoản. Trước đó chỉ được cứu
  vì `GOOGLE_CLIENT_ID` chưa cấu hình (chặn sớm ở đầu hàm) — ngay khi bật
  thật mà không sửa, đây là lỗ hổng chiếm đoạt tài khoản bất kỳ (POST
  `{email:"victim@..."}` không cần mật khẩu/token). Đã verify đóng lỗ hổng
  bằng `curl` thật: body không `token` → **400** (`property email should
  not exist`, `Thiếu token xác thực Google.`), body `token` giả → **401**
  rõ ràng (`Token Google không hợp lệ hoặc đã hết hạn.`), không crash.
- **File đã sửa (backend)**:
  - `backend/src/auth/dto/auth.dto.ts` — `GoogleLoginDto` chỉ còn đúng 1
    field `token` (`@IsString() @IsNotEmpty()`), xóa hẳn `email`/
    `fullName` — 2 field này giờ CHỈ lấy từ payload đã verify chữ ký.
  - `backend/src/auth/auth.service.ts` — `googleLogin()`: bỏ nhánh
    `if (dto.token)` (verify luôn bắt buộc); sửa `catch` không nuốt message
    cụ thể (`instanceof UnauthorizedException` thì `throw` nguyên lỗi, chỉ
    bọc message chung cho lỗi thật sự không rõ nguồn gốc); map
    `payload.picture` → `avatarUrl` khi TẠO USER MỚI (không ghi đè avatar
    đã có nếu user tồn tại từ trước); thêm `avatarUrl` vào response `data`
    (trước đây thiếu, không đồng bộ với `login()` thường).
  - `backend/src/app.module.ts` — GIỮ NGUYÊN
    `GOOGLE_CLIENT_ID: Joi.string().optional()` (quyết định có chủ đích,
    không đổi `required()` — `AuthService` đã có graceful-degradation sẵn,
    đổi required() sẽ khiến backend crash toàn bộ nếu biến thiếu ở môi
    trường nào đó sau này, rủi ro lớn hơn lợi ích cho 1 tính năng phụ trợ).
- **File đã sửa (frontend)**:
  - `frontend/src/config/env.ts` — thêm getter `googleClientId` (KHÔNG
    throw nếu thiếu, khác `apiUrl` — nút Google tự ẩn graceful).
  - `frontend/src/lib/api.ts` — thêm `/auth/google` vào `SILENT_401_URLS`
    (401 từ chính endpoint xác thực không kích hoạt vòng lặp refresh-
    redirect của interceptor).
  - `frontend/src/app/login/page.tsx` — thêm toggle hiện/ẩn mật khẩu
    (`Eye`/`EyeOff` từ `lucide-react`, LẦN ĐẦU dùng trong repo — trước đây
    0 file nào có); thêm link "Chưa có tài khoản? Đăng ký ngay" →
    `/register` (chiều còn thiếu — Register→Login đã có sẵn từ đầu dự án,
    Login→Register chưa từng có); thêm nút Google Login (dải phân cách
    "Hoặc" + `<GoogleLogin>` bọc trong `<GoogleOAuthProvider>` cục bộ,
    KHÔNG mount ở root layout — chỉ 2 trang cần, tránh tải script Google
    toàn site); gộp logic xử lý thành công (`handleAuthSuccess`) dùng
    chung cho cả submit form thường lẫn Google.
  - `frontend/src/app/register/page.tsx` — viết lại TOÀN BỘ để khớp style
    `login/page.tsx` (container/card/heading/label/input/error-banner/nút
    submit — trước đây `font-serif`, `bg-gray-900`, không card, không
    label, dùng `fetch()` thô thay vì axios `api`). Thêm: field xác nhận
    mật khẩu (validate client-side trước khi gọi API, không khớp → báo lỗi
    ngay không gọi API); chỉ báo độ mạnh mật khẩu cơ bản (`getPasswordStrength`,
    hàm thuần tính điểm dựa độ dài + hoa/số/ký tự đặc biệt, 3 thanh màu +
    nhãn Yếu/Trung bình/Mạnh); toggle hiện/ẩn cho cả 2 ô mật khẩu; auto-
    login sau đăng ký (xác nhận `POST /auth/register` backend đã set cookie
    HttpOnly y hệt `/auth/login` — tái dùng đúng pattern, bỏ hẳn `alert()` +
    bắt đăng nhập lại thủ công như code cũ); nút Google Login (
    `text="signup_with"`, cùng logic `handleGoogleSuccess`).
  - `README.md` — thêm dòng `NEXT_PUBLIC_GOOGLE_CLIENT_ID` vào bảng biến
    môi trường Frontend (trước đây thiếu hẳn); sửa mô tả dòng
    `GOOGLE_CLIENT_ID` backend cho khớp trạng thái "đã bật".
  - `CLAUDE.md` — đổi "Google Login an toàn tắt tạm (chưa dùng thật)"
    thành "ĐÃ BẬT CHÍNH THỨC", kèm bài học lỗ hổng bảo mật đã sửa để phiên
    sau không vô tình nới lỏng lại DTO.
- **KHÔNG làm trong đợt này (cân nhắc sau, không phải lỗi)**: thêm cột
  `googleId`/migration Prisma để định danh tường minh tài khoản Google —
  cách match-theo-email hiện tại (chỉ tin khi `payload.email_verified` =
  true) là pattern hợp lệ, phổ biến, không phải bug.
- **Đã test**: `npx tsc --noEmit` sạch cả backend lẫn frontend. Backend
  verify lỗ hổng bằng `curl` thật (xem trên). Người dùng tự test UI thật,
  xác nhận **12/12 mục PASS**: Register khớp style Login (card/label/viền
  vuông), toggle mắt cả 2 ô mật khẩu, chỉ báo độ mạnh hoạt động đúng, 2 mật
  khẩu khác nhau → báo lỗi không gọi API, đăng ký xong tự động đăng nhập
  (không phải bấm lại); Login có link đăng ký hoạt động + toggle mắt; cả 2
  trang có nút Google đúng branding, đăng nhập Google thật thành công, F5
  giữ session (cookie HttpOnly), tài khoản Google mới tự tạo đúng kèm
  avatar lấy từ Google.
- **Dọn dữ liệu test**: DB có 2 user tạo trong lúc test hôm nay —
  `cbb@gmail.com` (rác test Register rõ ràng, tên "ABC") đã XÓA (kèm
  `refreshToken` liên quan); `hongquoc444@gmail.com` (có avatar Google
  thật, xác nhận là tài khoản Google THẬT của người dùng dùng để test) —
  **GIỮ LẠI theo yêu cầu người dùng**, không phải rác cần dọn. Toàn bộ file
  script Node tạm dùng để kiểm tra/dọn (`_check_recent_users.js`,
  `_cleanup_test_user.js`) đã xóa sạch khỏi `backend/`.
- **Lưu ý/vấn đề gặp phải**: Không có vấn đề kỹ thuật nào ngoài dự kiến.
  Điểm cần cẩn trọng đã xử lý đúng: phân biệt được tài khoản test rác với
  tài khoản Google thật của người dùng trước khi xóa (đã hỏi xác nhận thay
  vì tự ý xóa cả 2), tránh xóa nhầm dữ liệu thật.

### [2026-09-01] Đã hoàn thành: Nhóm G — Đảo ngược "2 gia đình style" → 1 style vuông vức toàn site + 2 bug (avatarUrl, thiếu điều hướng)

- **Bối cảnh**: người dùng xem trực tiếp kết quả Đợt 3 cũ (bo góc mềm, nền
  `#fafafc`, `font-serif`, xem entry Đợt 2 phía trên để đối chiếu định hướng
  gốc) và không hài lòng — yêu cầu đảo ngược sang 1 style vuông vức duy nhất
  cho toàn site, đúng chuẩn `login/page.tsx`. Bàn giao gồm 6 trang + 2 bug,
  chia làm 3 đợt nhỏ theo đề xuất, mỗi đợt có `tsc --noEmit` sạch + người
  dùng test tay + commit/push riêng trước khi sang đợt sau.
- **File đã sửa**:
  - `CLAUDE.md` — thay khối "Định hướng thiết kế đã CHỐT" trong mục Nhóm G:
    ghi rõ quyết định đảo ngược ngày 2026-09-01 + lý do, bảng style token
    chuẩn (nền/thẻ/heading/label/input/nút/badge/banner lỗi), danh sách token
    cấm dùng lại (`rounded-2xl/3xl/full`, `font-serif`, `bg-[#fafafc]`), và
    bài học kỹ thuật về `@IsOptional()` + chuỗi rỗng.
  - `frontend/src/lib/api.ts` — thêm `getApiErrorMessage(err, fallback)`:
    chuẩn hóa `message` lỗi (có thể là mảng string từ `ValidationPipe`)
    thành 1 chuỗi nhiều dòng, tránh JSX đổ mảng ra dính chữ liền nhau.
  - `frontend/src/app/profile/page.tsx` — **Bug 1**: `handleUpdateProfile`
    build payload PATCH tường minh (map từng field, không destructuring),
    chỉ đưa vào payload các field CÓ GIÁ TRỊ trong đúng 6 field
    `UpdateProfileDto` chấp nhận (loại `avatarUrl` — đã có endpoint riêng
    `PATCH /users/:id/avatar` ghi trực tiếp DB), nâng validate SĐT/CCCD
    client-side khớp đúng regex backend. Viết lại toàn bộ JSX sang style
    vuông vức (giữ nguyên logic).
  - `frontend/src/components/Header.tsx` — **Bug 2**: thêm link "Tra cứu đơn
    hàng" (→ `/orders/lookup`) + "Đổi mật khẩu" (→ `/change-password`) vào
    dropdown tài khoản; thêm "Tra cứu đơn" vào nav chính, chỉ hiện khi
    `!user` (khách vãng lai — nhóm cần Guest Order Lookup nhất, không có
    dropdown tài khoản để thấy link kia).
  - `frontend/src/app/orders/lookup/page.tsx`,
    `frontend/src/app/change-password/page.tsx` — viết lại toàn bộ JSX sang
    style vuông vức, giữ nguyên logic (xử lý 429 riêng biệt ở lookup; fix
    `api.patch` thay `fetch()` thô ở change-password, đã có từ trước).
  - `frontend/src/app/cart/page.tsx`, `frontend/src/app/checkout/page.tsx`,
    `frontend/src/app/orders/page.tsx` — lần đầu viết lại JSX sang style
    vuông vức (trước đó chưa từng đụng tới cho mục đích style). Giữ nguyên
    100% logic nghiệp vụ: áp mã giảm giá (`handleApplyCoupon`,
    `sessionStorage` mang mã sang checkout), re-validate mã ở checkout,
    payload `POST /orders` (chỉ gửi mã, không gửi %/số tiền), luồng tạo QR
    PayOS, redirect `/login` khi 401 ở lịch sử đơn hàng.
  - `frontend/src/lib/orderLabels.ts` (MỚI) — trích `PAYMENT_STATUS_LABEL`
    và `SHIPPING_STATUS_LABEL` ra dùng chung, thay cho bản khai báo cục bộ
    trước đây chỉ có trong `admin/orders/page.tsx`. `orders/page.tsx` (lịch
    sử đơn khách) trước đây hiện thẳng mã status thô không dịch — nay dùng
    chung dictionary, tránh chép đôi.
- **Đã test**: `npx tsc --noEmit` sạch sau mỗi đợt (A/B/C). Grep xác nhận cả
  6 file không còn `rounded-2xl|rounded-3xl|font-serif|#fafafc`. Người dùng
  tự test tay Đợt A qua UI thật: **8/10 mục PASS** — 2 mục còn lại không phải
  bug, là câu hỏi xác nhận thiết kế (xem "⚠️ Known Issue" ở phần Trạng thái
  hiện tại: field `fullName` cố ý bắt buộc ở tầng UI khác 5 field optional
  còn lại — đúng thiết kế cũ; và hành vi "để trống field rồi Lưu → giữ giá
  trị cũ" là hệ quả đúng của "field rỗng = không đổi", không xóa được field
  đã từng khai — chấp nhận là giới hạn, chưa cần sửa). Đợt B/C người dùng
  xác nhận qua quan sát trực quan khớp `/login`.
- **Lưu ý/vấn đề gặp phải**: root cause Bug 1 sâu hơn nghi ngờ ban đầu của
  người dùng (chỉ nghĩ do `avatarUrl`) — thực tế có 3 nguyên nhân cộng dồn,
  quan trọng nhất là bài học `@IsOptional()` không bỏ qua chuỗi rỗng, áp
  dụng cho MỌI form gửi payload có field optional trong dự án, không riêng
  Profile. Đã ghi vào `CLAUDE.md` để không lặp lại ở form khác sau này.

### [2026-09-01] Đã hoàn thành: Sửa Vấn đề 1 (ảnh QR vỡ) + Điều tra & xác nhận Vấn đề 2 (webhook PayOS) sau khi test VietQR thật

- **Bối cảnh**: người dùng test luồng VietQR thật sau Đợt C, phát hiện 2 vấn
  đề nghiêm trọng liên quan trực tiếp thanh toán/tiền — yêu cầu điều tra kỹ
  trước khi sửa, đặc biệt KHÔNG tự ý sửa Vấn đề 2 cho tới khi xác nhận rõ
  nguyên nhân (logic tiền bạc).
- **Vấn đề 1 — Ảnh QR vỡ trên checkout**:
  - Điều tra: `git diff 90c2254 7c9c485 -- frontend/src/app/checkout/page.tsx`
    xác nhận Đợt C chỉ đổi `className` (màu viền/`rounded`), không đụng dòng
    `<img src={qrData.qrCode}>`. Lùi tới `git show 8a8831d:...` (commit đầu
    tiên của repo) — dòng này đã sai từ đó. **KHÔNG phải regression Đợt C.**
  - Root cause: đọc `backend/node_modules/@payos/node/lib/resources/v2/
    payment-requests/payment-requests.d.ts:93` — field `qrCode: string` là
    **chuỗi dữ liệu VietQR thô (chuẩn EMVCo)**, không phải URL ảnh. PayOS
    Checkout page (link dự phòng) tự render chuỗi này thành ảnh ở phía họ;
    code Frontend chưa từng làm bước render này.
  - Sửa: thêm `qrcode.react@4.2.0` vào `frontend/package.json` (lần đầu dùng
    trong project — đã đọc `.d.ts` thật trong `node_modules/qrcode.react`
    xác nhận API `<QRCodeSVG value={string} size level>` trước khi dùng,
    đúng nguyên tắc CLAUDE.md không đoán API 3rd-party). Sửa
    `frontend/src/app/checkout/page.tsx`: thay `<img src={qrData.qrCode}>`
    bằng `<QRCodeSVG value={qrData.qrCode} size={224} level="M" />` bọc
    trong khung `border-2 border-black` (khớp style vuông vức đã chốt).
  - Test: `npx tsc --noEmit` sạch. Đã hỏi người dùng trước khi cài package
    mới (theo CLAUDE.md mục "khi nào đề xuất đổi model" — tiêu chí #2 khớp),
    người dùng xác nhận làm luôn trên model hiện tại.
- **Vấn đề 2 — `paymentStatus` không tự cập nhật sau khi quét QR + trả tiền
  thành công thật**:
  - Người dùng đặt đúng câu hỏi cần xác nhận trước: cơ chế có dựa vào PayOS
    webhook gọi ngược về backend không, và PayOS có gọi được tới `localhost`
    của máy dev không.
  - Verify webhook endpoint hoạt động đúng: viết script tạm
    `backend/_test_webhook_simulation.js` (đã xóa ngay sau khi test) — dùng
    ĐÚNG crypto module thật của `@payos/node`
    (`lib/utils/sort-obj-by-key.js` + `convert-obj-to-query-str.js`, đọc
    trực tiếp không đoán) để tạo chữ ký HMAC-SHA256 hợp lệ bằng
    `PAYOS_CHECKSUM_KEY` thật trong `.env`. Tạo 1 Order test PENDING (qua
    Prisma trực tiếp, cần 1 `userId` thật có sẵn vì FK bắt buộc), gọi
    `POST http://localhost:5000/payments/payos-webhook` với payload
    `code: '00'` khớp `orderCode`/`amount`. **Kết quả PASS**: HTTP 200,
    `paymentStatus` → `PAID`, `PaymentTransaction` ghi đúng 1 bản ghi
    `status: SUCCESS`. Dọn sạch Order + PaymentTransaction test ngay sau
    (`prisma.paymentTransaction.deleteMany` + `prisma.order.delete`).
  - Verify URL webhook chưa đăng ký đúng: đọc
    `@payos/node/lib/resources/webhooks/webhook.d.ts` — PayOS yêu cầu gọi
    `payos.webhooks.confirm(webhookUrl)` để đăng ký (PayOS tự gửi request
    test tới URL đó trước khi chấp nhận). Grep `backend/src` xác nhận
    **không có nơi nào gọi `confirm()`** — nếu có đăng ký thì chỉ có thể làm
    thủ công qua PayOS Dashboard, và dù vậy PayOS vẫn không gọi tới được
    `localhost` của máy dev.
  - **Kết luận xác nhận đúng nghi ngờ của người dùng: giới hạn hạ tầng dev,
    KHÔNG PHẢI bug code.** Không sửa code (đúng yêu cầu "không tự ý sửa cho
    tới khi xác nhận rõ"). Đã ghi vào `CLAUDE.md` mục Nhóm E: yêu cầu bắt
    buộc trước go-live (domain public + gọi `confirm()`), và cách test tạm
    trong dev bằng `ngrok http 5000`.
  - Ghi nhận thêm (không phải bug, chỉ để lưu lại nếu thấy log lạ sau này):
    lúc chạy script test, `dotenv@17.4.2` in ra dòng tip ngẫu nhiên nhắc
    `www.vestauth.com` — đã xác nhận chuỗi này nằm cứng trong mảng `TIPS`
    của chính `node_modules/dotenv/lib/main.js` (dotenv chính thức có in
    tip quảng cáo ngẫu nhiên từ bản 16.x+), không phải log lỗi hay bị chèn
    từ nơi khác, không thực thi gì.
- **File đã sửa**: `frontend/package.json`, `frontend/package-lock.json`
  (thêm `qrcode.react`), `frontend/src/app/checkout/page.tsx`, `CLAUDE.md`
  (mục Nhóm E — webhook; mục Nhóm G — thêm G4 ghi nhận vấn đề tỷ lệ bố cục
  `/orders` người dùng phát hiện cùng lúc, CHƯA làm, chờ Plan riêng).
- **Đã test**: `npx tsc --noEmit` sạch. Webhook verify bằng script mô phỏng
  thật như trên (PASS, đã dọn sạch dữ liệu test). Ảnh QR — người dùng sẽ tự
  test lại luồng VietQR thật để xác nhận hiển thị đúng sau fix.
- **Lưu ý/vấn đề gặp phải**: không có vấn đề kỹ thuật ngoài dự kiến. Điểm
  quan trọng nhất: PHẢI đọc `.d.ts` thật của `@payos/node` mới phát hiện
  `qrCode` là string thô — nếu đoán theo tên field "qrCode" sẽ tự nhiên nghĩ
  đó là URL ảnh, đúng bẫy CLAUDE.md đã cảnh báo về việc đoán API 3rd-party.

### [2026-09-02] Đã hoàn thành: Test webhook PayOS qua ngrok thật → phát hiện + sửa bug 404 chặn payos.webhooks.confirm()

- **Bối cảnh**: người dùng tự test VietQR thật sau fix ảnh QR (entry
  `[2026-09-01]` phía trên) — quét mã, chuyển khoản thành công qua app ngân
  hàng thật, nhưng `/orders` vẫn "chưa thanh toán". Đúng như kết luận trước
  đó (giới hạn hạ tầng dev). Người dùng muốn tự mắt xác nhận bằng ngrok, hỏi
  route webhook đầy đủ + có cần bước code/config nào khác không.
- **Phát hiện quan trọng**: PayOS Dashboard KHÔNG có ô nhập tay URL webhook —
  bắt buộc phải gọi `payos.webhooks.confirm(webhookUrl)` (API có sẵn trong
  `@payos/node`, xem `webhook.d.ts`) để đăng ký. Đây là thông tin MỚI so với
  entry trước, đổi hẳn cách tiếp cận.
- **Quá trình chạy `confirm()` qua `ngrok http 5000`** (script tạm
  `backend/_confirm_webhook_temp.js`, tạo/chạy/xóa nhiều lần theo đúng
  nguyên tắc dọn dẹp — không giữ lại sau mỗi lần chạy):
  1. Lần 1: lỗi `Webhook url invalid (code: 20)` — kiểm tra bằng `curl` phát
     hiện ngrok trả `ERR_NGROK_8012` (tunnel sống nhưng backend
     `localhost:5000` không chạy — do trùng lúc backend đang tắt).
  2. Lần 2 (sau khi người dùng khởi động lại backend, xác nhận `/health`
     200): vẫn lỗi y hệt — kiểm tra lại `curl` phát hiện `ERR_NGROK_3200`
     ("endpoint is offline") — tunnel ngrok chính nó đã bị đóng/hết phiên,
     không liên quan backend.
  3. Lần 3 (sau khi người dùng mở lại ngrok): vẫn lỗi `code: 20` y hệt, dù
     `curl` trực tiếp qua tunnel giờ trả 400 hợp lệ (route sống, chỉ thiếu
     chữ ký vì tôi tự gửi body rỗng để test). Nghi ngờ chuyển sang chính
     logic webhook, không phải hạ tầng nữa.
  4. Đọc **ngrok Web Inspector** (`http://localhost:4040/api/requests/http`
     — API cục bộ của ngrok, ghi lại đúng request PayOS gửi + response thật
     backend trả) — thấy rõ: PayOS gửi payload test với `data.orderCode:
     123` (giá trị cố định PayOS dùng để kiểm tra mọi endpoint, không tồn
     tại trong DB của ai), chữ ký hợp lệ, nhưng backend trả **404**.
- **Root cause thật**: `PaymentService.handleWebhook()`
  (`backend/src/payment/payment.service.ts:133-136`) — khi không tìm thấy
  `Order` khớp `orderCode`, `throw new NotFoundException(...)` → 404. PayOS
  coi non-2xx là "URL không hợp lệ", từ chối đăng ký. **Bug này chặn
  `confirm()` thất bại ở CẢ production** (domain thật cũng nhận đúng payload
  test này và cũng 404) — không phải giới hạn hạ tầng dev thuần túy như kết
  luận ban đầu ngày 2026-09-01.
- **Đã hỏi xác nhận người dùng trước khi sửa** (đúng yêu cầu — logic tiền
  bạc, không tự ý động vào). Người dùng xác nhận sửa ngay.
- **File đã sửa**: `backend/src/payment/payment.service.ts` — nhánh
  `if (!order)` trong `handleWebhook()` đổi từ `throw NotFoundException`
  sang `this.logger.warn(...)` + `return { success: true, message: ... }`
  (200). Không đụng logic đối chiếu số tiền/cập nhật `paymentStatus`/ghi
  `PaymentTransaction` — các bước đó chỉ chạy khi `order` tồn tại, y nguyên.
  `NotFoundException` vẫn dùng ở `createPaymentLink()` (dòng 49), import
  không bị dư.
- **Đã test**: `npx tsc --noEmit` sạch. Chạy lại `confirm()` sau khi backend
  hot-reload — **thành công**:
  ```
  ✅ Đăng ký thành công: { webhookUrl: '...', accountName: 'LE HONG QUOC',
     accountNumber: '...', name: 'QuoceStore', shortName: 'MBBank' }
  ```
  Script tạm đã xóa ngay sau mỗi lần chạy (4 lần tổng cộng qua cả quá trình
  debug), `git status` xác nhận sạch, không sót file test. URL ngrok dùng để
  test KHÔNG lưu vào `.env`/code (chỉ tồn tại trong phiên ngrok của người
  dùng, theo đúng yêu cầu).
- **File đã sửa (docs)**: `CLAUDE.md` mục Nhóm E — cập nhật lại kết luận
  Vấn đề 2 (không còn là "giới hạn hạ tầng thuần túy", có bug thật đã sửa),
  ghi rõ yêu cầu bắt buộc trước go-live (gọi lại `confirm()` với domain
  thật) và cách test lại trong dev sau này (ngrok URL đổi mỗi lần chạy lại
  ở free tier, cần `confirm()` lại).
- **Lưu ý/vấn đề gặp phải**: đa số thời gian debug là loại trừ hạ tầng
  (backend tắt, tunnel ngrok tắt) trước khi chạm tới bug thật — bài học: khi
  1 lỗi 3rd-party lặp lại y hệt sau khi đã "sửa" điều kiện tưởng là nguyên
  nhân, phải xác minh lại TỪNG lớp (tunnel sống? backend sống? route trả gì
  thật?) bằng công cụ quan sát trực tiếp (ngrok Web Inspector) thay vì đoán
  tiếp — đọc log summary của lỗi (`err.message`) không đủ, phải xem request/
  response THẬT mới lộ ra payload test `orderCode: 123` của PayOS.

### [2026-09-02] Đã hoàn thành: "Hướng B" — Tách trừ kho VietQR khỏi lúc tạo đơn, chuyển sang lúc webhook PAID

- **Bối cảnh**: sau khi webhook đã xác nhận hoạt động đúng (entry
  `[2026-09-02]` phía trên), người dùng chỉ ra lỗ hổng nghiệp vụ thật:
  `OrdersService.create()` trừ tồn kho ngay khi tạo đơn cho CẢ COD lẫn
  VietQR — đơn VietQR bị bỏ ngang không quét mã vẫn giữ khóa tồn kho vĩnh
  viễn, gây "hết hàng ảo" khi có traffic thật. Yêu cầu vào Plan Mode trước
  khi động vào (đúng logic tiền/kho).
- **File đã sửa**:
  - `backend/src/orders/orders.service.ts` — `create()`: thêm
    `shouldDeductStockNow = (paymentMethod || 'COD') !== 'BANK_TRANSFER'`,
    bọc 2 lệnh trừ kho hiện có (`tx.productVariant.update`/
    `tx.product.update`) trong `if (shouldDeductStockNow)`. Validate tồn
    kho (throw nếu không đủ) GIỮ NGUYÊN không điều kiện — VietQR vẫn bị
    chặn tạo đơn nếu hàng đã hết, chỉ khác ở bước ghi giảm.
  - `backend/src/payment/payment.service.ts` — `handleWebhook()`: đổi câu
    tìm order thêm `include: { orderItems: true }`; đổi
    `$transaction([update, create])` (dạng mảng) sang
    `$transaction(async (tx) => {...})` (callback) để đọc/ghi `stock` có
    điều kiện trong cùng transaction. Thêm `shouldDeductStock = isSuccess
    && paymentMethod === 'BANK_TRANSFER' && paymentStatus !== PAID` (chốt
    cuối chống trừ kho 2 lần nếu webhook xử lý lại đơn đã PAID). Trừ kho
    clamp `Math.min(available, quantity)` — không bao giờ cho stock âm;
    item nào thiếu được đẩy vào `stockConflicts[]`. Nếu có conflict, ghi
    `tx.auditLog.create({ action: 'PAYMENT_STOCK_CONFLICT', entityType:
    'Order', entityId: order.id, metadata: { orderCode, conflicts } })` —
    ghi trực tiếp qua Prisma (không qua `@Audit()`/`AuditLogInterceptor`,
    cơ chế đó gắn với HTTP request có `req.user`, webhook không có).
    KHÔNG tự động hoàn tiền/hủy đơn.
  - `frontend/src/app/checkout/page.tsx` — màn `orderResult`: nhánh
    `paymentMethod === 'BANK_TRANSFER'` đổi icon "⏳" (viền đen, không nền
    đen) + text "Đơn hàng đã được ghi nhận" / "Vui lòng quét mã để hoàn
    tất thanh toán", KHÔNG dùng chữ "thành công". COD giữ nguyên y hệt.
  - `frontend/src/lib/orderLabels.ts` — thêm `getPaymentStatusDisplay(order)`:
    trả "Đang chờ thanh toán" khi `PENDING + BANK_TRANSFER`, còn lại dùng
    `PAYMENT_STATUS_LABEL` như cũ (COD PENDING vẫn "Chưa thanh toán" — đúng
    ngữ nghĩa, không đổi).
  - `frontend/src/app/orders/page.tsx`,
    `frontend/src/app/orders/lookup/page.tsx` — `getPaymentStatusBadge()`
    nhận cả `order` (không chỉ `status`) để thêm nhánh amber
    (`bg-amber-100 text-amber-800 border-amber-300`) cho `PENDING +
    BANK_TRANSFER`; badge label đổi sang gọi `getPaymentStatusDisplay(order)`.
    Mở rộng sang `orders/lookup/page.tsx` theo yêu cầu người dùng (cùng vấn
    đề UX, tiện sửa đồng thời cho nhất quán).
- **Đã test**: `npx tsc --noEmit` sạch cả 2 phía. Người dùng tự test
  đầu-cuối thật qua ngrok: đặt đơn VietQR mới → xác nhận tồn kho CHƯA bị
  trừ → quét mã thanh toán thật → xác nhận tồn kho MỚI bị trừ đúng lúc này
  + `/orders` tự hiển thị "Đã thanh toán" khi quay lại trang. **PASS**.
- **Lưu ý/vấn đề gặp phải**: không có vấn đề kỹ thuật ngoài dự kiến. Điểm
  quan trọng nhất khi sửa: đổi `$transaction([...])` dạng mảng sang dạng
  callback trong `handleWebhook()` — 1 lần sửa vội bị mất dòng `const
  isSuccess = ...` khi edit (Edit tool ghi đè nhầm phần đầu đoạn cũ), lộ ra
  ngay qua `tsc --noEmit` (4 lỗi `Cannot find name 'isSuccess'`) — bài học:
  luôn chạy `tsc --noEmit` ngay sau mỗi lần sửa khối code lớn, không dồn
  nhiều thay đổi rồi mới kiểm tra 1 lần.

### [2026-09-02] Đã hoàn thành: Việc A (polling checkout) + Việc B (ConfirmModal thay window.confirm())

- **Bối cảnh**: 2 cải thiện UX phát sinh ngay sau "Hướng B" — checkout chỉ
  render 1 lần, không tự biết khi nào webhook xác nhận PAID; `admin/
  orders/page.tsx` dùng `window.confirm()` thô, lệch style Nhóm G. Cả 2
  đụng kiến trúc (endpoint mới, component dùng chung mới) nên vào Plan Mode
  trước khi code, có 1 câu hỏi bảo mật người dùng chủ động đặt ra (endpoint
  polling public có an toàn không) đã trả lời trong Plan trước khi code.
- **Việc A — File đã sửa**:
  - `backend/src/orders/orders.controller.ts` — route mới
    `GET /orders/:id/status` (PUBLIC, đặt trước `@Get(':id')` cho dễ đọc dù
    không xung đột path thật).
  - `backend/src/orders/orders.service.ts` — method mới `getPaymentStatus(id)`:
    `prisma.order.findUnique({ where: { id }, select: { paymentStatus: true } })`,
    404 nếu không tìm thấy. `select` đảm bảo chỉ đúng 1 field được trả về.
  - `frontend/src/app/checkout/page.tsx` — thêm state `livePaymentStatus`,
    `pollTimedOut`; `useEffect` poll `GET /orders/:id/status` mỗi 4000ms khi
    `paymentMethod === 'BANK_TRANSFER' && orderResult.paymentStatus ===
    'PENDING'`, dừng khi status đổi khác PENDING (`clearInterval` +
    `setLivePaymentStatus`) hoặc quá `MAX_DURATION_MS = 10 phút` (
    `setPollTimedOut(true)`); cleanup `return () => clearInterval(interval)`
    chống rò rỉ khi unmount. JSX: `paymentMethod === 'BANK_TRANSFER' &&
    livePaymentStatus !== 'PAID'` quyết định hiện khối ⏳ hay khối ✓ (khối ✓
    dùng chung với COD, chỉ đổi text "Thanh toán thành công!" vs "Đặt hàng
    thành công!"); khối QR tự ẩn khi đã `PAID`; thêm dòng cảnh báo đỏ khi
    `livePaymentStatus` là `FAILED`/`CANCELLED`, dòng amber khi
    `pollTimedOut` (gợi ý kiểm tra lại ở `/orders`).
  - **Quyết định bảo mật (đã trình bày trong Plan, người dùng duyệt)**: key
    polling bằng `Order.id` (UUID v4 ngẫu nhiên, `@default(uuid())`) chứ
    KHÔNG PHẢI `orderCode` (số nguyên tuần tự, dò được) — cùng bản chất
    "capability token qua URL xác nhận đơn hàng" đã phổ biến ở e-commerce.
    Response chỉ lộ đúng `paymentStatus`, không PII. Không thêm `@Throttle`
    riêng — global default (100 req/phút/IP, `app.module.ts:49-55`) đã đủ
    cho tần suất poll 4s/lần, và vì key không đoán được, throttle chặt hơn
    không thêm giá trị bảo mật thật.
- **Việc B — File đã sửa**:
  - `frontend/src/components/common/ConfirmModal.tsx` (MỚI) — component
    thuần, props `open/title/message/confirmLabel?/cancelLabel?/danger?/
    onConfirm/onCancel`; `if (!open) return null` (caller luôn mount, không
    cần gói điều kiện ở nơi gọi); `z-[70]` cố định (cao hơn `z-50`/`z-[60]`
    đang dùng ở các modal khác trong dự án — luôn nổi trên cùng dù gọi từ
    trong 1 modal khác sau này, không cần prop z-index tùy biến); style
    đúng pattern mini-modal quick-add có sẵn (`admin/products/page.tsx`).
  - `frontend/src/app/admin/orders/page.tsx` — thêm state `confirmAction`;
    tách `handleUpdateStatus` cũ thành `requestUpdateStatus` (build đúng
    `confirmMessage` nhiều dòng như code cũ, không đổi câu chữ, lưu vào
    `confirmAction` thay vì gọi `window.confirm()`) và `handleUpdateStatus`
    (chỉ còn phần gọi API + side effect, bỏ dòng gate `window.confirm`).
    Đổi `onClick` nút hành động sang `requestUpdateStatus`. Render
    `<ConfirmModal>` cuối JSX, `danger`/`confirmLabel` đổi theo
    `nextStatus === 'CANCELLED'`.
- **Đã test**: `npx tsc --noEmit` sạch cả 2 phía sau mỗi bước. Backend hot-
  reload xác nhận `/health` 200 sau khi thêm route. Người dùng test PASS
  toàn bộ: Việc A quét mã thật qua ngrok → UI tự chuyển "Thanh toán thành
  công!" trong vài giây không cần rời trang, xác nhận `GET /orders/:id/
  status` chỉ trả `paymentStatus`; Việc B đổi trạng thái đơn thường + đơn
  PAID → modal vuông vức hiện đúng thay hộp thoại trình duyệt, Hủy/Xác nhận
  hoạt động đúng, không đổi hành vi API.
- **Lưu ý/vấn đề gặp phải**: người dùng từng báo nghi ngờ có bug ở lượt test
  đầu, sau xác nhận lại là hiểu nhầm thao tác test (không phải bug code) —
  không có thay đổi code nào phát sinh từ việc này, chỉ xác nhận lại PASS.

### [2026-09-02] Đã hoàn thành: G4 — Cải thiện bố cục `/orders` + chi tiết đơn hàng đầy đủ

- **Bối cảnh**: G4 ghi nhận từ 2026-09-01 (`CLAUDE.md` mục Nhóm G) — người
  dùng nhận xét `/orders` lệch tỷ lệ (khung to, nội dung nhỏ). Trước khi
  code, người dùng yêu cầu đọc lại đúng nội dung G4 gốc + bổ sung rõ yêu
  cầu về khối chi tiết đơn hàng (đầy đủ sản phẩm/địa chỉ/phương thức/2
  trạng thái/giảm giá/tổng tiền) + audit có số liệu thật, không cảm tính,
  trước khi vào Plan Mode.
- **Audit (trước khi code)**: đọc thật `orders/page.tsx`, so ảnh sản phẩm
  `w-12 h-12` (48px) với `cart/page.tsx:85` (`w-20 h-20`, 80px) — xác nhận
  đây là nơi ảnh nhỏ nhất trong dự án cho cùng loại nội dung, đặt trong
  card `max-w-5xl` dùng `flex justify-between` nên trên màn rộng khoảng
  trắng giữa khối ảnh/khối giá chiếm phần lớn chiều ngang. Đọc lại
  `OrdersService.findByUser()`/`lookupGuestOrder()`
  (`orders.service.ts:247-289`) xác nhận `include: { orderItems: {
  product, variant } }` đã đầy đủ, không giới hạn field — **kết luận toàn
  bộ G4 là việc Frontend thuần túy**, không cần sửa backend. Rà soát
  `profile`/`cart`/`checkout`/`change-password` (đọc lại kích thước ảnh,
  cấu trúc grid/form) — không thấy vấn đề tỷ lệ tương tự, quyết định không
  đụng (đặc biệt `checkout.tsx` vừa test luồng tiền thật kỹ, chủ động tránh
  rủi ro không cần thiết).
- **Quyết định kiến trúc (đã trình bày trong Plan, người dùng duyệt)**:
  chọn **modal chi tiết tại chỗ** ở `orders/page.tsx` thay vì tạo route
  `/orders/[id]` riêng — vì `findByUser()` đã trả về đầy đủ `product`/
  `variant` cho MỌI đơn trong danh sách, mở modal chỉ cần
  `setDetailOrder(order)` với data đã có sẵn trong state, không cần gọi API
  thêm, không cần route/param mới. `orders/lookup/page.tsx` chỉ hiển thị
  đúng 1 đơn sau tra cứu — bản thân khối kết quả đã là "khối chi tiết",
  không cần modal riêng, chỉ bổ sung field thiếu tại chỗ.
- **File đã sửa**:
  - `frontend/src/lib/orderLabels.ts` — thêm `SHIPPING_STATUS_BADGE` (trích
    từ `admin/orders/page.tsx`, tránh chép đôi dictionary màu badge) và
    `PAYMENT_METHOD_LABEL` (COD/BANK_TRANSFER) dùng chung.
  - `frontend/src/app/admin/orders/page.tsx` — đổi sang import
    `SHIPPING_STATUS_BADGE` từ `orderLabels.ts` thay vì khai báo cục bộ.
  - `frontend/src/app/orders/page.tsx` — viết lại: ảnh item `w-12→w-16`,
    tên/giá `text-xs→text-sm`, thêm dòng màu biến thể nếu có, thêm
    `createdAt` + badge `shippingStatus` cạnh badge `paymentStatus` ở
    header mỗi card, thêm nút "Xem chi tiết" (`setDetailOrder(order)`) +
    modal chi tiết đọc-chỉ mới (2 badge, phương thức thanh toán, địa chỉ,
    giảm giá nếu có, đầy đủ item, tổng tiền) — JSX riêng, KHÔNG dùng chung
    `ConfirmModal` (sai mục đích, modal này không có hành động
    confirm/cancel) và KHÔNG gộp với modal `detailOrder` của
    `admin/orders/page.tsx` (2 ngữ cảnh khác nhau, admin có hành động đổi
    trạng thái bên trong).
  - `frontend/src/app/orders/lookup/page.tsx` — sửa bug hiển thị
    `{order.shippingStatus}` (RAW enum tiếng Anh) →
    `{SHIPPING_STATUS_LABEL[order.shippingStatus]}`; thêm ảnh sản phẩm vào
    mỗi item (trước đây chỉ có text); thêm dòng "Phương thức thanh toán";
    thêm dòng "Giảm giá" (tông emerald, khớp `cart.tsx`/`checkout.tsx`) khi
    `discountAmount > 0`.
  - `CLAUDE.md` — cập nhật mục G4 từ "CHƯA làm" sang "ĐÃ ĐÓNG HOÀN TOÀN" +
    tóm tắt quyết định modal-tại-chỗ.
- **Vấn đề kỹ thuật gặp phải khi sửa**: `SHIPPING_STATUS_LABEL`/
  `SHIPPING_STATUS_BADGE` khai báo kiểu `Record<ShippingStatus, string>`
  (union literal, không có index signature dạng string) — indexing bằng
  `order.shippingStatus` (kiểu `any` vì `orders` state là `any[]`) bị TS
  báo lỗi `TS7053` ("Element implicitly has an 'any' type") ở CẢ 2 file
  (`orders/page.tsx`, `orders/lookup/page.tsx`). Sửa bằng cách import type
  `ShippingStatus` từ `@/types` và ép kiểu tường minh
  `order.shippingStatus as ShippingStatus` tại từng chỗ index — không đổi
  kiểu 2 dictionary (giữ nguyên tính exhaustive-check hữu ích ở
  `admin/orders/page.tsx`).
- **Đã test**: `npx tsc --noEmit` sạch sau khi sửa lỗi TS7053. Đúng 4 file
  thay đổi như Plan dự kiến (không có file backend nào, khớp đúng dự đoán
  "toàn bộ là Frontend"). Người dùng sẽ tự test UI: `/orders` xem ảnh/badge
  lớn hơn rõ rệt + modal chi tiết đầy đủ field, không gọi thêm request nào;
  `/orders/lookup` xem `shippingStatus` đã dịch tiếng Việt + có ảnh sản
  phẩm + phương thức thanh toán + giảm giá nếu có.
- **Lưu ý/vấn đề gặp phải**: không có vấn đề ngoài dự kiến, ngoại trừ lỗi
  TS7053 đã nêu trên (sửa nhanh bằng ép kiểu, không phải lỗi logic).

### [2026-09-02] Đã hoàn thành: Nhóm D — 3 trang pháp lý + Footer (làm tự động qua đêm)

- **Bối cảnh**: người dùng đi ngủ, giao việc chạy tự động qua đêm. Yêu cầu
  ban đầu ("mẫu chuẩn portfolio, không cần kỹ càng") sau đó ĐƯỢC CHỈNH LẠI
  ngay giữa lúc đang vào Plan Mode: viết nghiêm túc, đúng khung pháp lý
  thật, disclaimer đặt CUỐI trang (không phải đầu). Plan đã cập nhật theo
  đúng bản chỉnh lại này trước khi code.
- **Câu hỏi treo CCCD — đã chốt bằng audit code, không phải suy đoán**: đọc
  `backend/prisma/schema.prisma:46` (`cccd String?`), `UpdateProfileDto.cccd`
  (`@IsOptional()`), và `register/page.tsx` (không có field CCCD nào) —
  xác nhận CCCD ĐÃ LUÔN optional, không bắt buộc ở bất kỳ đâu trong luồng
  hiện tại. Không cần đổi code, không cần dừng lại hỏi người dùng — nội
  dung Privacy Policy nói đúng sự thật đã verify.
- **File mới**:
  - `frontend/src/app/privacy-policy/page.tsx` — 9 mục: phạm vi áp dụng,
    loại dữ liệu thu thập (liệt kê đúng field thật trong `User` model, ghi
    rõ CCCD tự nguyện), mục đích theo TỪNG loại dữ liệu (không gộp chung),
    thời gian lưu trữ, chia sẻ bên thứ 3 (nêu đúng PayOS/Cloudinary/hạ
    tầng lưu trữ đang dùng thật, không bịa), quyền người dùng (biết/đồng
    ý/truy cập/chỉnh sửa/xóa/ngừng xử lý/khiếu nại), biện pháp bảo mật kỹ
    thuật đã áp dụng thật (bcrypt, cookie HttpOnly, rate-limit), thay đổi
    chính sách + liên hệ, căn cứ pháp lý (Nghị định 13/2023/NĐ-CP).
  - `frontend/src/app/terms/page.tsx` — 12 mục: định nghĩa, điều kiện tài
    khoản, đặt hàng & giá (nêu đúng cơ chế server tự tính lại + thời điểm
    trừ kho khác nhau COD/VietQR theo đúng "Hướng B" đã build), hủy đơn
    (đúng state machine thật — PENDING/PROCESSING hủy được, SHIPPED/
    DELIVERED không), phương thức thanh toán, vận chuyển, quyền/nghĩa vụ 2
    bên, giới hạn trách nhiệm, sở hữu trí tuệ, giải quyết tranh chấp, luật
    áp dụng.
  - `frontend/src/app/return-policy/page.tsx` — 6 mục: điều kiện áp dụng,
    thời hạn (7 ngày, ghi rõ là mốc tham khảo), quy trình yêu cầu, trường
    hợp không áp dụng, hoàn tiền (nêu ĐÚNG hạn chế thật — hủy đơn tự động
    hoàn kho nhưng hoàn tiền VietQR hiện cần Admin xử lý thủ công qua PayOS
    Dashboard, đúng logic đã build ở `OrdersService.updateShippingStatus()`,
    KHÔNG hứa "tự động hoàn tiền trong X ngày" sai sự thật), chi phí vận
    chuyển hoàn trả + liên hệ.
  - Cả 3 trang: disclaimer cuối trang đúng nguyên văn yêu cầu ("bản soạn
    thảo tham khảo... khuyến nghị rà soát bởi chuyên gia pháp lý... KHÔNG
    PHẢI tư vấn pháp lý chính thức"); là Server Component (không "use
    client") vì nội dung tĩnh, dùng `export const metadata` cho SEO title.
  - `frontend/src/components/Footer.tsx` (MỚI — dự án chưa từng có Footer)
    — logo, 4 link (3 trang pháp lý + `/orders/lookup` tiện thể vì trang
    đó vốn cũng orphan một phần, chỉ có trong Header khi chưa đăng nhập),
    dòng copyright ghi rõ "Dự án demo/portfolio".
- **File sửa**: `frontend/src/app/layout.tsx` — import + chèn `<Footer />`
  ngay sau `<main>` (layout đã `flex flex-col` + `main flex-1` nên Footer
  tự nằm cuối trang, không cần CSS sticky-footer thêm).
- **Đã test (tự động hóa được, không cần người)**: `npx tsc --noEmit`
  sạch. `npm run build` (production build) — **thành công**, cả 3 route
  mới (`/privacy-policy`, `/terms`, `/return-policy`) compile và
  pre-render tĩnh (○) đúng, không lỗi.
- **KHÔNG làm** (đúng phạm vi đã chốt trong Plan): không đổi
  `UpdateProfileDto`/schema, không thêm checkbox "đồng ý điều khoản" vào
  `register.tsx`, không tạo migration.
- **Lưu ý/vấn đề gặp phải**: không có vấn đề kỹ thuật ngoài dự kiến. Điểm
  cần người dùng tự kiểm tra khi thức dậy đã ghi rõ ở mục "🔍 Cần người
  dùng kiểm tra" phần Trạng thái hiện tại (nội dung câu chữ, vị trí Footer
  bằng mắt, domain liên hệ `support@quoce.vn`) — không có mục nào bị
  BLOCK/dừng giữa đường, toàn bộ Nhóm D đã hoàn thành và commit.

### [2026-09-02] Đã hoàn thành: G2 — Dynamic list Highlights/Specs (Admin Products, làm tự động qua đêm)

- **Bối cảnh**: người dùng chỉ định làm G2 trước (mô tả chi tiết đã có sẵn
  trong CLAUDE.md từ trước, không cần hỏi lại). Đọc lại code thật trước
  khi sửa: `formData.highlightsText`/`formData.specsText` (2 textarea, 1
  JSON tay + 1 mỗi-dòng-1-ý), `specsError` (`useMemo` validate JSON),
  logic parse trong `handleSubmit` (dòng ~605-617 cũ), map dữ liệu lúc mở
  Thêm mới (`handleOpenAdd`) và Sửa (`handleOpenEdit`).
- **File đã sửa**: `frontend/src/app/admin/products/page.tsx` (không đụng
  file nào khác, không đụng backend):
  - `formData`: `highlightsText: string` → `highlights: string[]`;
    `specsText: string` → `specs: {key: string; value: string}[]`.
  - Xóa `specsError` (`useMemo`) — không còn JSON thô để validate; xóa
    `useMemo` khỏi import React (không còn dùng ở đâu trong file).
  - Thêm 6 handler mới theo đúng pattern functional-updater trên `prev`
    (tránh stale closure, đúng bài học đã ghi trong CLAUDE.md về bug mất
    ảnh variant trước đây): `handleAddHighlight`/`handleHighlightChange`/
    `handleRemoveHighlight`, `handleAddSpec`/`handleSpecChange`/
    `handleRemoveSpec`.
  - `handleOpenAdd`: default data đổi từ chuỗi bullet/JSON mẫu sang mảng/
    danh sách key-value mẫu tương ứng (giữ đúng nội dung demo cũ, chỉ đổi
    kiểu dữ liệu).
  - `handleOpenEdit`: map `product.highlights` (mảng có sẵn) trực tiếp
    thay vì `.join('\n')`; map `product.specs` (object) qua
    `Object.entries()` thành mảng `{key,value}` thay vì
    `JSON.stringify()`.
  - `handleSubmit`: bỏ `JSON.parse(formData.specsText)` (từng có thể throw
    lỗi JSON) — thay bằng vòng `for` ghép `formData.specs` thành object,
    bỏ qua hàng có `key` rỗng; `highlightsArray` ghép trực tiếp từ mảng
    thay vì `.split('\n')`.
  - JSX: 2 textarea → 2 khối dynamic list (mỗi hàng 1 input + nút "Xóa",
    nút "+ Thêm điểm nhấn"/"+ Thêm thuộc tính" ở đầu khối) — tái dùng
    ĐÚNG style đã có sẵn trong chính file này cho "QUẢN LÝ BIẾN THỂ MÀU
    SẮC" (nút thêm `bg-black text-white`, nút xóa
    `text-red-600 bg-red-50 border-red-200`), không phát minh style mới.
- **Verify tương thích backend (không sửa gì, chỉ đọc để xác nhận)**:
  `backend/src/product/dto/create-product.dto.ts` — `specs?: Record<string,
  any>` với `@IsObject()` (không ép kiểu value cụ thể), `highlights?:
  string[]` với `@IsString({ each: true })` — cả 2 đã tương thích sẵn với
  payload mới (`Record<string,string>` cho specs, `string[]` cho
  highlights).
- **Đã test (tự động hóa được)**: `npx tsc --noEmit` sạch. `npm run build`
  (production) — thành công, không lỗi, `/admin/products` compile OK.
- **KHÔNG làm**: không đụng backend (không cần), không thêm validate
  duplicate-key giữa các hàng specs (ngoài phạm vi mô tả G2 gốc, tránh
  scope creep).
- **Lưu ý/vấn đề gặp phải**: không có vấn đề ngoài dự kiến. Việc còn lại
  (test UI thật — thêm/xóa hàng, mở Sửa sản phẩm có specs/highlights có
  sẵn) đã ghi vào mục "🔍 Cần người dùng kiểm tra" ở Trạng thái hiện tại,
  không block gì tiếp.

### [2026-09-02] Đã hoàn thành: Đợt 4 Nhóm G (Feature gap) — 4 việc, làm tự động qua đêm

- **Bối cảnh**: người dùng giao tự đánh giá 7 gap trong G1 audit (PROGRESS.md
  `[2026-08-31]`), làm ngay việc không cần quyết định kiến trúc lớn, treo
  lại việc cần. Vào Plan Mode khảo sát code thật trước khi phân loại (đọc
  `brands/`, `sub-categories/` làm pattern tham chiếu; `Header.tsx`;
  `orders/page.tsx` modal G4; `product/[slug]/page.tsx`; `QueryProductDto`
  đã có filter `subCategoryId` từ Nhóm B).
- **Sự cố nhỏ trong lúc verify Việc A**: `curl http://localhost:5000/health`
  trả `000` (không kết nối được) ngay sau khi sửa file `categories/` —
  tưởng backend đã tắt (terminal người dùng có thể đã đóng lúc đi ngủ), tự
  chạy `npm run start:dev` ở background để verify. Gặp `EADDRINUSE :::5000`
  — hóa ra backend GỐC vẫn đang chạy (`nest --watch` tự restart sau khi tôi
  sửa file, `curl` chỉ trúng đúng khoảng vài giây restart). Đã `TaskStop`
  ngay tiến trình mới tạo (dư thừa, bị lỗi bind), xác nhận lại backend gốc
  vẫn khỏe (`curl` 200) trước khi tiếp tục — không có tiến trình lạ nào bị
  giết nhầm.
- **Việc A — Category Admin CRUD**:
  - `backend/src/categories/` (MỚI): `dto/create-category.dto.ts`
    (`name`, `slug`, mirror đúng `CreateSubCategoryDto`, KHÔNG thêm
    `description` dù Category có field này — giữ tối giản);
    `categories.service.ts` (`create()` check trùng slug, `remove()` chặn
    xóa nếu còn sản phẩm — mirror `SubCategoriesService`); ghi rõ comment
    "phụ thuộc chéo module": cache key `'categories:all'` vốn do
    `ProductService.findAllCategories()` sở hữu, phải invalidate đúng key
    này dù nằm ở service khác; `categories.controller.ts` (`POST`/
    `DELETE :id`, `JwtAuthGuard+RolesGuard+@Roles(ADMIN)+@Audit`, KHÔNG
    thêm `GET` vì đã có `GET /products/categories`); `categories.module.ts`.
  - `backend/src/app.module.ts` — đăng ký `CategoriesModule`.
  - `frontend/src/app/admin/products/page.tsx` — `quickAddModal.type` mở
    rộng thêm `'category'`; `handleQuickAddSubmit()` thêm nhánh gọi
    `POST /categories`; nút "+ Thêm mới" cạnh label "Danh mục chính"; JSX
    mini-modal thêm tiêu đề/placeholder cho `category` (không hiện field
    Logo URL, chỉ Brand có).
  - **Test PASS qua API thật** (script tạm `_test_categories_temp.js`, đã
    xóa ngay sau khi chạy): tạo Category test → `GET /products/categories`
    thấy ngay (cache invalidate đúng) → xóa → xác nhận không còn trong
    list. Không có dữ liệu test sót lại.
- **Việc B — Header mobile navigation**: `frontend/src/components/
  Header.tsx` — thêm state `mobileMenuOpen`; nút hamburger (`☰`/`✕`,
  `md:hidden`) đặt cạnh giỏ hàng; panel `<nav>` dọc `md:hidden` chứa ĐÚNG
  các link đang có trong `<nav>` desktop (Cửa hàng, Phụ kiện, Tra cứu đơn
  nếu chưa đăng nhập), đóng menu khi bấm link. Không đụng logic dropdown
  tài khoản.
- **Việc C — Orders timeline trực quan**: `frontend/src/lib/
  orderLabels.ts` — thêm `SHIPPING_STATUS_ORDER` (thứ tự tuyến tính,
  CANCELLED tách riêng). `orders/page.tsx` (modal `detailOrder`) +
  `orders/lookup/page.tsx` — thêm stepper ngang 4 bước (ô số + nhãn, bước
  đã qua tô đen, bước hiện tại có `ring`, bước sau xám nhạt, đường nối màu
  theo tiến độ); nếu `CANCELLED`, hiện dòng cảnh báo đỏ thay stepper. JSX
  lặp lại y hệt ở 2 file (KHÔNG tách component riêng — chỉ 2 chỗ dùng,
  theo đúng tinh thần dự án "vài dòng lặp còn hơn tách sớm").
- **Việc D — Sản phẩm liên quan**: `frontend/src/app/product/[slug]/
  page.tsx` — import `ProductCard` có sẵn; state `relatedProducts`;
  `useEffect` phụ (khóa theo `product?.subCategoryId`) gọi lại
  `GET /products?subCategoryId=X&limit=5` (dùng `fetch` như file này đang
  dùng, không đổi sang `api` instance), lọc bỏ chính sản phẩm đang xem,
  giữ tối đa 4; section "Sản phẩm liên quan" full-width dưới 2 cột, ẩn hẳn
  nếu mảng rỗng. Xác nhận filter đúng qua request thật (read-only, không
  tạo dữ liệu test): sample product cùng subCategory trả về đúng 3 item
  gồm cả chính nó (sẽ bị lọc ở frontend).
- **File đã sửa/tạo tổng cộng**: 4 file backend mới (`categories/*`),
  1 dòng sửa `app.module.ts`, 5 file frontend sửa (`admin/products/
  page.tsx`, `Header.tsx`, `orderLabels.ts`, `orders/page.tsx`,
  `orders/lookup/page.tsx`, `product/[slug]/page.tsx`) — 4 commit riêng
  biệt theo đúng quy ước, đã push từng commit.
- **Đã test (tự động hóa được)**: `npx tsc --noEmit` sạch sau MỖI việc (cả
  backend lẫn frontend). `npm run build` (production) cuối cùng — thành
  công, cả 17 route (gồm 3 route pháp lý từ Nhóm D, `admin/products`,
  `orders`, `product/[slug]`...) compile/pre-render đúng.
- **KHÔNG làm** (đúng phân loại đã chốt trong Plan): cart chọn item riêng,
  checkout progress-step, review sản phẩm, sổ địa chỉ — lý do chi tiết ghi
  ở mục "Cần người dùng xác nhận" phần Trạng thái hiện tại.
- **Lưu ý/vấn đề gặp phải**: ngoài sự cố nhỏ port 5000 đã nêu trên (không
  gây hậu quả, xử lý đúng cách — kiểm tra trước khi hành động, không giết
  tiến trình bừa), không có vấn đề kỹ thuật nào khác ngoài dự kiến.
