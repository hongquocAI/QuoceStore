const L = require('../lib');
const { Paragraph, PageBreak } = L;

function chapter5() {
  const testResultRows = [
    ['Phân trang sản phẩm (backend)', 'Invoke-RestMethod (PowerShell)', 'page/limit/filter đúng, 400 với tham số sai (limit=999, categoryId=ALL...)', 'PASS'],
    ['Mã giảm giá trong tạo đơn hàng', 'Invoke-RestMethod', 'totalAmount/discountAmount tính đúng server-side; mã hết lượt → 404 kèm rollback tồn kho', 'PASS'],
    ['Trang quản lý đơn hàng Admin (backend)', 'JWT ADMIN tự ký', 'State machine đúng ở mọi ca chuyển trạng thái hợp lệ/không hợp lệ; hoàn kho đúng khi huỷ', 'PASS'],
    ['Trang quản lý đơn hàng Admin (UI)', 'Kiểm thử thủ công', '6/6 bước (bảng, filter, search, modal, đổi trạng thái)', '6/6 PASS'],
    ['Nhật ký thao tác (AuditLog)', 'Script Node + JWT tự ký', 'Ghi đúng userId/action/entityId, redact mật khẩu, không ghi trên route không đánh dấu', '5/5 PASS'],
    ['Đăng nhập Google (chống chiếm tài khoản)', 'curl + kiểm thử thủ công UI', 'Thiếu token → 400; token giả → 401', '12/12 PASS (UI)'],
    ['Thanh toán VietQR thật qua ngrok', 'Thanh toán ngân hàng thật', 'Webhook xác nhận đúng, tồn kho trừ đúng lúc PAID, `/orders` cập nhật realtime', 'PASS'],
    ['Đánh giá sản phẩm (Reviews) — API', 'Script Node, JWT tự ký, 2 CUSTOMER + 1 ADMIN thật', '16 ca (tạo/sửa/xoá, 403 sai chủ, 409 trùng, không lộ email, ADMIN xoá được)', '16/16 PASS'],
    ['Đánh giá sản phẩm (Reviews) — UI', 'Kiểm thử thủ công', 'Gửi/sửa/xoá review, khách chưa đăng nhập thấy đúng lời mời đăng nhập', '6/6 PASS'],
    ['Chọn item giỏ hàng để thanh toán + Progress-step', 'Kiểm thử thủ công (người dùng theo dõi trực tiếp)', 'Chọn/bỏ chọn từng dòng, "Chọn tất cả", giỏ giữ đúng phần không chọn', '6/6 PASS'],
    ['Sổ địa chỉ — API', 'Script Node, JWT tự ký, 2 CUSTOMER thật', '16 ca (tạo tự động mặc định, đổi mặc định, 403 sai chủ, xoá tự đề bạt mặc định mới)', '16/16 PASS'],
    ['Sổ địa chỉ — UI', 'Chưa thực hiện', '7 bước đã liệt kê trong PROGRESS.md, CHƯA được kiểm thử bằng mắt', 'CHƯA TEST'],
    ['[Đợt này] Sửa lỗi hoàn kho sai khi huỷ đơn VietQR chưa thanh toán', 'Script Node, JWT ADMIN tự ký, backend thật', 'Đơn COD trừ/hoàn kho đúng; đơn VietQR PENDING không còn bị cộng sai khi huỷ', '4/4 PASS'],
    ['[Đợt này] Sửa lỗi tin userId từ body client trong POST /orders', 'Script Node, JWT tự ký bằng JWT_SECRET thật', 'Body có userId → 400; cookie hợp lệ → đúng userId; không cookie → guest; cookie giả → 401', '4/4 PASS'],
  ];

  const bugRows = [
    ['Trước 08-29', 'Guard đọc JWT bằng `jwt.decode()` không xác minh chữ ký', 'Ai cũng giả mạo được `sub` để đọc đơn hàng người khác', 'Chuyển sang `JwtAuthGuard`/`JwtStrategy` xác minh chữ ký chuẩn'],
    ['Trước 08-29', 'Giá tiền/tổng tiền đọc trực tiếp từ request client', 'Có thể đặt hàng với giá tự khai', 'Server luôn tự tính lại từ giá thật trong DB'],
    ['29/08/2026', 'Sửa sản phẩm có biến thể trả lỗi 400 "property id should not exist"', 'Không sửa được sản phẩm → không bật lại `isActive` → storefront trống', 'Map tường minh đúng 6 field DTO cho phép, không gửi nguyên object variant đọc từ GET'],
    ['29/08/2026', '`ProductService.update()` validate `variants` nhưng không lưu', 'UI báo thành công nhưng biến thể không đổi', 'Xử lý xoá sạch rồi tạo lại trong 1 transaction'],
    ['29/08/2026', 'Mã giảm giá bị rơi mất giữa giỏ hàng và trang thanh toán', 'Giảm giá không được áp dụng khi đặt hàng thật', 'Bridge `discountCode` qua sessionStorage, re-validate ở trang thanh toán'],
    ['29/08/2026', 'Race condition: 2 đơn cùng tranh lượt cuối của 1 mã giảm giá', 'Có thể vượt quá `maxUsage` đã đặt', 'Dùng `updateMany` có điều kiện `usedCount < maxUsage`'],
    ['29/08/2026', '`catch` trong tạo đơn chỉ re-throw `BadRequestException`', 'Lỗi mã giảm giá (404) bị nuốt thành thông báo chung chung', 'Đổi điều kiện sang `instanceof HttpException`'],
    ['30/08/2026', 'Stale closure khi upload 2 ảnh biến thể liên tiếp', 'Mất 1 ảnh vừa upload cho cùng 1 màu', 'Tính state từ `prev.variants` thay vì biến đóng cũ'],
    ['31/08/2026', 'GoogleLoginDto cho `token` optional, nhận `email`/`fullName` từ client', 'Bỏ qua `token` = bỏ qua toàn bộ xác minh chữ ký → chiếm đoạt tài khoản bất kỳ không cần mật khẩu', '`token` bắt buộc, xoá hẳn `email`/`fullName` khỏi DTO — chỉ lấy từ payload đã xác minh'],
    ['01/09/2026', 'Form Hồ sơ luôn báo lỗi 400 dù dữ liệu hợp lệ', 'Không sửa được hồ sơ cá nhân', 'Gửi field thừa `avatarUrl`; đồng thời phát hiện `@IsOptional()` không bỏ qua chuỗi rỗng `""`'],
    ['01/09/2026', 'Mã QR hiển thị lỗi (ảnh vỡ)', 'Khách không quét được mã thanh toán', '`qrCode` từ PayOS là chuỗi EMVCo thô, không phải URL ảnh — vẽ lại bằng `qrcode.react`'],
    ['02/09/2026', 'Webhook trả 404 khi `orderCode` không khớp đơn nào', '`payos.webhooks.confirm()` từ chối đăng ký URL webhook ở CẢ production', 'Trả 200 kèm log cảnh báo thay vì throw 404'],
    ['02/09/2026', '"Hết hàng ảo": đơn VietQR bị bỏ ngang vẫn giữ tồn kho đã trừ', 'Sản phẩm hiển thị hết hàng dù không ai mua thật', 'Chuyển thời điểm trừ kho VietQR sang lúc webhook xác nhận PAID (Hướng B)'],
    ['02/09/2026', '`/orders/lookup` hiển thị nguyên văn enum tiếng Anh', 'Trải nghiệm không nhất quán ngôn ngữ', 'Dùng bảng nhãn tiếng Việt `SHIPPING_STATUS_LABEL`'],
    ['26/09/2026 (đợt này)', 'Huỷ đơn VietQR chưa thanh toán vẫn cộng lại tồn kho', 'Tồn kho ảo cộng dồn theo từng đơn VietQR bị huỷ, có thể dẫn tới bán vượt tồn kho thật', 'Chỉ hoàn kho khi kho đã thực sự bị trừ trước đó'],
    ['26/09/2026 (đợt này)', '`POST /orders` tin `userId` do client tự khai trong body', 'Có thể chèn đơn hàng giả vào lịch sử của người dùng khác (userId lộ qua `GET /reviews` công khai)', 'Thêm `OptionalJwtAuthGuard`, lấy userId từ JWT đã xác minh, xoá field khỏi DTO'],
  ];

  return [
    new Paragraph({ children: [new PageBreak()] }),
    L.h1('CHƯƠNG 5 — KIỂM THỬ HỆ THỐNG'),

    L.h2('5.1 Kế hoạch kiểm thử'),
    L.p(
      'Do phạm vi đồ án không xây dựng bộ unit test tự động (các file `*.spec.ts` hiện tại là mã khung mặc ' +
      'định do NestJS CLI sinh ra, chưa được viết lại thành test nghiệp vụ thật — đây là hạn chế được nêu rõ ' +
      'ở Chương 6, không che giấu), việc kiểm thử được thực hiện bằng 4 phương pháp kết hợp:'
    ),
    L.bullet('Gọi API thật bằng công cụ dòng lệnh (`Invoke-RestMethod`/PowerShell, `curl`) để xác nhận response đúng định dạng và mã trạng thái HTTP mong đợi.'),
    L.bullet('Viết script Node.js tự ký JSON Web Token bằng đúng `JWT_SECRET` cấu hình thật, giả lập nhiều vai trò (ADMIN/CUSTOMER) để kiểm thử các route yêu cầu xác thực mà không cần thao tác đăng nhập thủ công lặp lại.'),
    L.bullet('Kiểm thử giao diện thủ công theo từng bước cụ thể đã liệt kê trước, đặc biệt với các luồng có trạng thái phức tạp (đăng nhập, thanh toán, quản trị đơn hàng).'),
    L.bullet('Kiểm thử thanh toán VietQR bằng giao dịch ngân hàng THẬT thông qua ngrok để xác nhận webhook PayOS hoạt động đúng trong điều kiện gần giống production.'),
    L.p('Sau mỗi lần kiểm thử tạo dữ liệu tạm (đơn hàng, sản phẩm thử), dữ liệu này đều được dọn sạch khỏi cơ sở dữ liệu và xác nhận lại bằng truy vấn đếm số bản ghi trước khi ghi nhận hoàn thành.'),

    L.h2('5.2 Kết quả kiểm thử'),
    L.tableCaption('Tổng hợp một số kết quả kiểm thử tiêu biểu (số liệu thật, trích từ nhật ký phát triển)'),
    L.dataTable(
      ['Chức năng', 'Phương pháp', 'Kết quả cụ thể', 'Kết luận'],
      testResultRows,
      [2300, 1900, 3550, 1600]
    ),

    L.p(
      'Bảng kết quả trên chỉ trích một phần tiêu biểu; chi tiết đầy đủ toàn bộ các lần kiểm thử trong suốt quá ' +
      'trình phát triển được ghi lại theo thời gian thực trong nhật ký phát triển của dự án (`PROGRESS.md`).'
    ),

    L.h3('5.2.1 Danh sách lỗi thật đã phát hiện và khắc phục'),
    L.p(
      'Bảng dưới đây là bằng chứng cụ thể cho năng lực gỡ lỗi thực tế trong quá trình phát triển — mỗi dòng là ' +
      'một lỗi THẬT đã xảy ra trên hệ thống đang chạy, không phải lỗi giả định.'
    ),
    L.tableCaption('Các lỗi thật đã phát hiện và khắc phục trong quá trình phát triển'),
    L.dataTable(
      ['Thời điểm', 'Triệu chứng / Nguyên nhân', 'Hậu quả nếu không sửa', 'Cách khắc phục'],
      bugRows,
      [1300, 3300, 2650, 2100]
    ),

    L.h2('5.3 Nhận xét về chất lượng kiểm thử'),
    L.p(
      'Điểm mạnh: các luồng nghiệp vụ quan trọng nhất (thanh toán, đơn hàng, xác thực) đều đã được kiểm thử ' +
      'bằng dữ liệu và điều kiện THẬT (bao gồm cả 1 giao dịch ngân hàng thật qua ngrok), không chỉ dừng ở mức ' +
      'giả định trên giấy.'
    ),
    L.p(
      'Điểm hạn chế cần nêu trung thực: hệ thống chưa có bộ unit test/e2e test tự động chạy được trong CI, nên ' +
      'mọi lần thay đổi code đều phụ thuộc vào việc kiểm thử thủ công lặp lại — đây là rủi ro thực sự khi hệ ' +
      'thống lớn dần. Ngoài ra, sổ địa chỉ (Address) mới chỉ được kiểm thử đầy đủ ở tầng API, phần giao diện ' +
      'vẫn đang chờ kiểm thử bằng mắt tại thời điểm hoàn thành báo cáo này.'
    ),
  ];
}

module.exports = { chapter5 };
