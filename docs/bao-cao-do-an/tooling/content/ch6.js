const L = require('../lib');
const { Paragraph, PageBreak } = L;

function chapter6() {
  return [
    new Paragraph({ children: [new PageBreak()] }),
    L.h1('CHƯƠNG 6 — KẾT LUẬN & HƯỚNG PHÁT TRIỂN'),

    L.h2('6.1 Kết quả đạt được'),
    L.p('Sau quá trình thực hiện, đồ án đã hoàn thành các mục tiêu đề ra ở Chương 1:'),
    L.bullet('Xây dựng hoàn chỉnh backend RESTful API với 49 endpoint trên 17 module, áp dụng đầy đủ các lớp bảo mật: xác thực JWT qua cookie HttpOnly, phân quyền RBAC, giới hạn tần suất request theo từng endpoint nhạy cảm, validate đầu vào nghiêm ngặt bằng ValidationPipe.'),
    L.bullet('Module PIM với dữ liệu chủ (danh mục, danh mục con, thương hiệu) đã được chuẩn hoá hoàn toàn thành bảng quan hệ có khoá ngoại, thay cho chuỗi tự do ở phiên bản khởi tạo ban đầu.'),
    L.bullet('Tích hợp thanh toán VietQR thật qua PayOS, đã kiểm thử thành công với giao dịch ngân hàng thật, xử lý đúng bài toán trừ tồn kho trong giao dịch bất đồng bộ.'),
    L.bullet('Xây dựng hoàn chỉnh giao diện storefront và trang quản trị, thống nhất 1 hệ thống thiết kế xuyên suốt toàn site.'),
    L.bullet('Phát hiện và khắc phục 16 lỗi thật trong quá trình phát triển (Chương 5), bao gồm 2 lỗi vừa được phát hiện và sửa ngay trong quá trình biên soạn báo cáo này — minh chứng cho việc rà soát code được thực hiện nghiêm túc tới thời điểm cuối cùng, không dừng lại khi "đủ dùng".'),

    L.h2('6.2 Hạn chế'),
    L.p('Các hạn chế dưới đây được ghi nhận trung thực theo đúng tình trạng thật của hệ thống tại thời điểm hoàn thành báo cáo, không né tránh:'),
    L.bullet('Chưa triển khai lên môi trường production thật: chưa có tên miền và SSL riêng, chưa chọn nền tảng triển khai (VPS hay PaaS), webhook PayOS mới được đăng ký thử nghiệm qua ngrok (tạm thời, không lưu vào cấu hình chính thức).'),
    L.bullet('Chưa có cơ chế dọn dẹp ảnh mồ côi trên Cloudinary: ảnh được upload ngay khi Admin chọn file, nếu sau đó bị xoá khỏi form thì file vẫn còn tồn trên Cloudinary, chưa có script quét dọn định kỳ.'),
    L.bullet('Trang chủ và trang danh mục phụ kiện chưa phân trang phía server thật — đang tải tối đa 100 sản phẩm rồi lọc ở trình duyệt, sẽ không còn phù hợp khi catalog vượt quá con số này.'),
    L.bullet('Chưa có index cơ sở dữ liệu trên các cột thường dùng để sắp xếp/tìm kiếm (`createdAt`, `isActive`, `price`, `title`) — chưa ảnh hưởng ở quy mô dữ liệu hiện tại nhưng sẽ cần bổ sung khi catalog lớn.'),
    L.bullet('Sentry đã được khởi tạo (`Sentry.init()`) nhưng CHƯA được nối vào bộ lọc lỗi toàn cục — lỗi 500 thật hiện tại chưa thực sự được gửi về Sentry để theo dõi tập trung.'),
    L.bullet('Chưa có tích hợp hoàn tiền tự động qua PayOS: huỷ một đơn đã thanh toán chỉ hiển thị cảnh báo, Admin phải tự hoàn tiền thủ công qua PayOS Dashboard.'),
    L.bullet('Còn tồn tại race condition ở bước trừ tồn kho cho đơn COD (đọc giá trị rồi ghi đè, chưa dùng cập nhật có điều kiện như cơ chế đã áp dụng cho mã giảm giá) — rủi ro thấp ở quy mô hiện tại nhưng cần khắc phục trước khi vận hành thật với lượng đơn đồng thời cao.'),
    L.bullet('AuditLog hiện chỉ ghi mà chưa có API hay giao diện để Admin xem lại nhật ký đã ghi.'),
    L.bullet('Chưa xây dựng bộ unit test/e2e test tự động; toàn bộ kiểm thử hiện dựa vào script gọi API thủ công và kiểm thử giao diện bằng tay.'),
    L.bullet('Vai trò VENDOR mới dừng ở mức được cấp quyền upload ảnh, chưa có luồng nghiệp vụ riêng (quản lý sản phẩm/đơn hàng của chính đối tác đó).'),
    L.bullet('Sổ địa chỉ (Address) đã kiểm thử đầy đủ ở tầng API nhưng phần giao diện chưa được kiểm thử bằng mắt tại thời điểm hoàn thành báo cáo.'),

    L.h2('6.3 Hướng phát triển'),
    L.bullet('Triển khai chính thức lên môi trường production: chọn nền tảng hạ tầng, cấu hình tên miền/SSL, đăng ký webhook PayOS với URL thật, tách biệt cấu hình development/production.'),
    L.bullet('Bổ sung `minPrice`/`maxPrice` vào bộ lọc sản phẩm để có thể chuyển trang chủ/danh mục sang phân trang phía server hoàn chỉnh.'),
    L.bullet('Viết script/cron job dọn ảnh Cloudinary mồ côi, định kỳ đối chiếu ảnh đang lưu với URL thực tế được tham chiếu trong cơ sở dữ liệu.'),
    L.bullet('Bổ sung index cơ sở dữ liệu cho các cột dùng để sắp xếp/tìm kiếm khi catalog mở rộng.'),
    L.bullet('Hoàn thiện tích hợp Sentry (nối vào bộ lọc lỗi toàn cục) và cân nhắc tích hợp hoàn tiền tự động qua API của PayOS.'),
    L.bullet('Đổi cơ chế trừ tồn kho cho đơn COD sang cập nhật có điều kiện (theo đúng mẫu đã áp dụng cho mã giảm giá) để loại bỏ hoàn toàn race condition.'),
    L.bullet('Xây dựng giao diện xem AuditLog cho Admin, và bổ sung cơ chế phát hiện tái sử dụng refresh token đã bị thu hồi (reuse detection) để tăng cường phát hiện token bị đánh cắp.'),
    L.bullet('Xây dựng bộ test tự động (unit test cho service nghiệp vụ, e2e test cho các luồng quan trọng) tích hợp vào quy trình CI/CD.'),
    L.bullet('Phát triển đầy đủ luồng nghiệp vụ cho vai trò VENDOR — cho phép đối tác tự quản lý sản phẩm và đơn hàng của mình trong phạm vi được cấp phép.'),
  ];
}

module.exports = { chapter6 };
