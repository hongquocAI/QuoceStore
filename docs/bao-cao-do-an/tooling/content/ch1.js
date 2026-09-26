const L = require('../lib');
const { Paragraph, PageBreak } = L;

function chapter1() {
  return [
    new Paragraph({ children: [new PageBreak()] }),
    L.h1('CHƯƠNG 1 — TỔNG QUAN'),

    L.h2('1.1 Lý do chọn đề tài'),
    L.p(
      'Thương mại điện tử tại Việt Nam tiếp tục tăng trưởng mạnh trong những năm gần đây, kéo theo nhu cầu ' +
      'thực tế về các hệ thống bán hàng trực tuyến vừa đủ đầy đủ nghiệp vụ (giỏ hàng, thanh toán, vận đơn, ' +
      'khuyến mãi) vừa phải xử lý tốt bài toán quản lý dữ liệu sản phẩm (Product Information Management — ' +
      'PIM) khi danh mục hàng hoá có nhiều danh mục, thương hiệu và biến thể màu sắc khác nhau. Phần lớn đồ án ' +
      'sinh viên ở dạng CRUD đơn giản, chưa chạm tới các vấn đề kỹ thuật thật sự phát sinh khi vận hành một hệ ' +
      'thống thương mại điện tử: tính toàn vẹn dữ liệu khi thanh toán bất đồng bộ qua webhook, chống trừ kho ' +
      'sai lệch khi có nhiều luồng xử lý đồng thời, hay việc chuẩn hoá quyền truy cập theo nhiều vai trò khác ' +
      'nhau.'
    ),
    L.p(
      'Đề tài QUOCÉ được thực hiện nhằm xây dựng một hệ thống thương mại điện tử kết hợp PIM ở mức độ tiệm cận ' +
      'thực tế doanh nghiệp vừa và nhỏ, đồng thời lấy đó làm cơ sở để tìm hiểu và áp dụng các nguyên tắc bảo ' +
      'mật, thiết kế API và xử lý giao dịch thanh toán đúng chuẩn — thay vì chỉ dừng lại ở mức minh hoạ giao ' +
      'diện.'
    ),

    L.h2('1.2 Mục tiêu đề tài'),
    L.bullet('Xây dựng backend RESTful API bằng NestJS + Prisma + PostgreSQL, áp dụng đầy đủ các lớp bảo mật: xác thực JWT qua cookie HttpOnly, phân quyền theo vai trò (RBAC), giới hạn tần suất request, validate dữ liệu đầu vào nghiêm ngặt.'),
    L.bullet('Xây dựng module PIM thực sự có quan hệ dữ liệu chuẩn hoá (Category — SubCategory — Brand — Product — ProductVariant) thay vì lưu chuỗi tự do.'),
    L.bullet('Tích hợp thanh toán VietQR thật qua PayOS, xử lý đúng vòng đời một giao dịch bất đồng bộ (tạo đơn → hiển thị QR → xác nhận qua webhook → cập nhật kho và trạng thái).'),
    L.bullet('Xây dựng frontend Next.js hoàn chỉnh cho cả 2 nhóm người dùng: khách hàng (storefront) và quản trị viên (trang quản trị sản phẩm, đơn hàng).'),
    L.bullet('Ghi nhận trung thực toàn bộ quá trình kiểm thử, các lỗi thật đã phát hiện và cách khắc phục — coi đây là một phần giá trị học thuật của đồ án, không chỉ là bản liệt kê tính năng.'),

    L.h2('1.3 Đối tượng và phạm vi'),
    L.p('Hệ thống phục vụ 3 nhóm đối tượng sử dụng chính (chi tiết xem sơ đồ Use Case ở Chương 3):'),
    L.bullet('Khách vãng lai / Khách hàng: duyệt sản phẩm, đặt hàng (COD hoặc VietQR) không bắt buộc đăng nhập, tra cứu đơn hàng bằng số điện thoại, và khi đã đăng nhập có thêm chức năng xem lịch sử đơn hàng, đánh giá sản phẩm đã mua, quản lý sổ địa chỉ.'),
    L.bullet('Quản trị viên (ADMIN): quản lý sản phẩm/biến thể, danh mục, thương hiệu, đơn hàng theo quy trình trạng thái (state machine), xem cảnh báo tồn kho thấp.'),
    L.bullet('Đối tác bán hàng (VENDOR): vai trò tồn tại trong hệ thống phân quyền nhưng phạm vi hiện tại CHỈ có quyền upload ảnh — hệ thống chưa xây dựng luồng nghiệp vụ riêng cho VENDOR (được ghi rõ trong phần Hạn chế ở Chương 6, không che giấu).'),
    L.p(
      'Phạm vi đồ án dừng lại ở môi trường phát triển (development) đã được kiểm thử kỹ qua công cụ dòng lệnh, ' +
      'script kiểm thử tự viết và kiểm thử giao diện thủ công; hệ thống CHƯA được triển khai lên môi trường ' +
      'production thật với tên miền và SSL riêng — đây là hạn chế được nêu rõ, không phải điểm bị bỏ sót.'
    ),

    L.h2('1.4 Phương pháp thực hiện'),
    L.p(
      'Đồ án được thực hiện theo phương pháp lặp (iterative) chia theo từng nhóm chức năng độc lập thay vì mô ' +
      'hình thác nước một lần: bắt đầu từ nhóm vá lỗi bảo mật khẩn cấp trên phần khung có sẵn (Phase 0), sau đó ' +
      'triển khai từng nhóm — chuẩn hoá dữ liệu chủ (MDM), quan sát hệ thống (logging/health-check/Sentry), sẵn ' +
      'sàng chịu tải (cache, phân trang), hoàn thiện nghiệp vụ (mã giảm giá, nhật ký thao tác), rồi mới tới hoàn ' +
      'thiện giao diện. Mỗi nhóm việc đều được tự kiểm thử bằng script gọi API thật hoặc kiểm thử giao diện thủ ' +
      'công trước khi chuyển sang nhóm tiếp theo, và toàn bộ quá trình — kể cả các lỗi phát sinh và cách sửa — ' +
      'được ghi log chi tiết theo thời gian thực trong suốt quá trình phát triển.'
    ),
    L.p(
      'Một điểm cần nêu trung thực về phương pháp: quá trình phát triển có sử dụng trợ lý AI lập trình cặp ' +
      '(AI pair-programming) làm công cụ hỗ trợ viết code và tra cứu tài liệu kỹ thuật dưới sự giám sát, kiểm ' +
      'tra và quyết định của người thực hiện ở mọi bước quan trọng (thiết kế schema, quyết định nghiệp vụ, xác ' +
      'nhận kết quả kiểm thử thật trước khi chuyển bước tiếp theo). Toàn bộ quyết định kiến trúc, việc xác nhận ' +
      'kiểm thử qua các công cụ thật (Postman, curl, PowerShell, ngrok cho webhook thật) đều do người thực hiện ' +
      'trực tiếp chạy và xác nhận kết quả trước khi ghi nhận là hoàn thành.'
    ),

    L.h2('1.5 Bố cục báo cáo'),
    L.bullet('Chương 1 — Tổng quan: giới thiệu đề tài, mục tiêu, phạm vi, phương pháp thực hiện.'),
    L.bullet('Chương 2 — Cơ sở lý thuyết: giới thiệu các công nghệ thật sự được sử dụng và lý do lựa chọn.'),
    L.bullet('Chương 3 — Phân tích & thiết kế hệ thống: yêu cầu, sơ đồ Use Case, ERD, kiến trúc, các luồng nghiệp vụ quan trọng kèm lý giải quyết định thiết kế.'),
    L.bullet('Chương 4 — Xây dựng & triển khai: chi tiết từng module, các đoạn code tiêu biểu, giao diện chương trình thật.'),
    L.bullet('Chương 5 — Kiểm thử hệ thống: kế hoạch và kết quả kiểm thử thật, danh sách lỗi đã phát hiện và khắc phục.'),
    L.bullet('Chương 6 — Kết luận & hướng phát triển: kết quả đạt được, hạn chế trung thực, hướng phát triển tiếp theo.'),
  ];
}

module.exports = { chapter1 };
