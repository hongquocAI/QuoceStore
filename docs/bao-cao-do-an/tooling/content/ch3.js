const L = require('../lib');
const { Paragraph, PageBreak } = L;
const D = L.DIAGRAMS;

function chapter3() {
  const entityRows = [
    ['User', 'Tài khoản người dùng (ADMIN/VENDOR/CUSTOMER). `cccd` và `dateOfBirth` là optional — không bắt buộc thu thập khi đăng ký.'],
    ['RefreshToken', 'Token làm mới, lưu bản băm SHA-256 (không lưu token gốc), có thể `revoked` khi xoay vòng hoặc đăng xuất.'],
    ['Category / SubCategory / Brand', 'Dữ liệu chủ (MDM) dạng bảng quan hệ thật, có FK, thay cho chuỗi tự do ở phiên bản đầu.'],
    ['Product / ProductVariant', 'Sản phẩm và biến thể màu sắc; `slug` bất biến sau khi tạo; `specs` lưu dạng JSON linh hoạt.'],
    ['Order / OrderItem', 'Đơn hàng snapshot toàn bộ thông tin tại thời điểm mua (địa chỉ, tên màu biến thể, giá) — không phụ thuộc dữ liệu gốc bị thay đổi sau này.'],
    ['PaymentTransaction', 'Lưu lại từng lần webhook thanh toán xử lý, dùng để chống xử lý trùng (idempotency) theo `transactionId`.'],
    ['Discount', 'Mã giảm giá, `percentage` lưu dạng thập phân (0.1 = 10%), không có quan hệ khoá ngoại tới Order (chỉ lưu snapshot mã).'],
    ['Review', 'Đánh giá sản phẩm, ràng buộc `@@unique([userId, productId])` — 1 người chỉ đánh giá 1 sản phẩm 1 lần.'],
    ['Address', 'Sổ địa chỉ giao hàng cá nhân, không liên kết khoá ngoại tới Order (Order tự snapshot địa chỉ riêng).'],
    ['AuditLog', 'Nhật ký thao tác nhạy cảm, `userId` nullable với `onDelete: SetNull` — vẫn giữ log nếu tài khoản bị xoá.'],
  ];

  return [
    new Paragraph({ children: [new PageBreak()] }),
    L.h1('CHƯƠNG 3 — PHÂN TÍCH & THIẾT KẾ HỆ THỐNG'),

    L.h2('3.1 Yêu cầu chức năng và phi chức năng'),
    L.h3('3.1.1 Yêu cầu chức năng'),
    L.bullet('Quản lý sản phẩm theo cấu trúc phân cấp Category → SubCategory, gắn Brand, hỗ trợ nhiều biến thể màu với giá/tồn kho/ảnh riêng.'),
    L.bullet('Giỏ hàng phía client, cho phép chọn từng dòng để thanh toán một phần, áp dụng mã giảm giá.'),
    L.bullet('Đặt hàng theo 2 phương thức: COD (thanh toán khi nhận hàng) và VietQR (qua PayOS), hỗ trợ cả khách vãng lai lẫn khách đã đăng nhập.'),
    L.bullet('Quản lý vòng đời đơn hàng theo trạng thái vận chuyển (PENDING → PROCESSING → SHIPPED → DELIVERED, có nhánh CANCELLED).'),
    L.bullet('Đánh giá sản phẩm (chỉ khách đã mua và đã nhận hàng), sổ địa chỉ, tra cứu đơn hàng cho khách vãng lai.'),
    L.bullet('Trang quản trị cho phép quản lý sản phẩm/đơn hàng, xem cảnh báo tồn kho thấp, ghi nhật ký thao tác nhạy cảm.'),

    L.h3('3.1.2 Yêu cầu phi chức năng'),
    L.bullet('Bảo mật: xác thực JWT qua cookie HttpOnly, phân quyền RBAC, giới hạn tần suất request, validate nghiêm ngặt đầu vào, không tin bất kỳ giá trị nhạy cảm nào (giá tiền, quyền sở hữu) do client tự khai.'),
    L.bullet('Toàn vẹn dữ liệu: mọi thao tác nhiều bước ảnh hưởng tồn kho/tiền đều chạy trong 1 transaction cơ sở dữ liệu.'),
    L.bullet('Khả năng quan sát (observability): log có cấu trúc, health-check, theo dõi lỗi tập trung.'),
    L.bullet('Hiệu năng: cache cho dữ liệu ít thay đổi, phân trang cho danh sách lớn.'),

    L.h2('3.2 Sơ đồ Use Case'),
    L.p('Hệ thống phân chia rõ chức năng theo 3 vai trò: Khách (vãng lai/đã đăng nhập), Quản trị viên và Đối tác bán hàng.'),
    ...L.figure(D, '03-use-case.png', 'Sơ đồ Use Case theo vai trò', { maxH: 760 }),

    L.h2('3.3 Thiết kế cơ sở dữ liệu'),
    L.p('Cơ sở dữ liệu gồm 14 bảng, được thiết kế lại hoàn toàn thành các bảng quan hệ chuẩn hoá ở giai đoạn MDM (thay vì lưu chuỗi tự do cho danh mục/thương hiệu như phiên bản khởi tạo ban đầu).'),
    ...L.figure(D, '02-erd.png', 'Sơ đồ thực thể quan hệ (ERD)', { maxH: 820 }),
    L.tableCaption('Mô tả các thực thể chính trong cơ sở dữ liệu'),
    L.dataTable(['Thực thể', 'Mô tả'], entityRows, [2400, 6950]),

    L.h2('3.4 Kiến trúc hệ thống'),
    L.p(
      'Hệ thống theo kiến trúc client-server tách biệt hoàn toàn: frontend Next.js chỉ giao tiếp với backend ' +
      'qua REST API (axios, gửi kèm cookie), backend NestJS đóng vai trò trung gian duy nhất giữa client và mọi ' +
      'dịch vụ dữ liệu/bên thứ ba — không có dịch vụ bên ngoài nào được gọi trực tiếp từ trình duyệt.'
    ),
    ...L.figure(D, '01-kien-truc-tong-quan.png', 'Kiến trúc hệ thống tổng quan', { maxH: 840 }),

    L.h2('3.5 Các luồng nghiệp vụ quan trọng'),

    L.h3('3.5.1 Đăng ký / Đăng nhập và cơ chế Access — Refresh Token'),
    L.p(
      'Hệ thống hỗ trợ song song 2 luồng đăng nhập: bằng email/mật khẩu và bằng tài khoản Google. Điểm thiết ' +
      'kế quan trọng là accessToken có vòng đời ngắn (15 phút) nhằm giảm thiệt hại nếu bị đánh cắp, trong khi ' +
      'trải nghiệm người dùng vẫn liên tục nhờ cơ chế refresh tự động chạy ngầm ở axios interceptor — người ' +
      'dùng không hề nhận ra token vừa được xoay vòng.'
    ),
    ...L.figure(D, '04-sequence-auth.png', 'Luồng đăng ký/đăng nhập và cơ chế Access/Refresh Token', { maxH: 900 }),

    L.h3('3.5.2 Đặt hàng và thanh toán VietQR — điểm nhấn kỹ thuật của đồ án'),
    L.p(
      'Đây là luồng nghiệp vụ phức tạp nhất và có giá trị kỹ thuật cao nhất trong đồ án, vì phải xử lý đúng một ' +
      'giao dịch BẤT ĐỒNG BỘ: thời điểm khách bấm "Đặt hàng" và thời điểm PayOS xác nhận tiền đã về là 2 thời ' +
      'điểm hoàn toàn tách rời nhau, có thể cách nhau vài giây tới không bao giờ xảy ra (khách bỏ ngang không ' +
      'quét mã).'
    ),
    L.p(
      ['Câu hỏi thiết kế cốt lõi: nên trừ tồn kho vào lúc nào? '].map((t) => L.run(t, { bold: true }))
        .concat([L.run('Phương án ban đầu (trừ kho ngay lúc tạo đơn, giống hệt COD) gây ra hệ quả thực tế: mỗi ' +
          'đơn VietQR bị bỏ ngang không thanh toán sẽ giữ tồn kho "chết" vô thời hạn — nhiều khách hàng đặt thử ' +
          'rồi bỏ ngang có thể khiến sản phẩm hiển thị hết hàng dù không ai thực sự mua. Hệ thống áp dụng quyết ' +
          'định thiết kế: đơn COD trừ kho ngay (đặt đơn COD được xem là cam kết mua), còn đơn VietQR CHỈ trừ ' +
          'kho tại đúng thời điểm webhook xác nhận thanh toán thành công thật — chấp nhận đánh đổi là tồn kho ' +
          'không được "giữ chỗ" trong lúc khách đang thao tác quét mã, đổi lại tránh được vấn đề tồn kho ảo ' +
          'nghiêm trọng hơn nhiều về lâu dài.')])
    ),
    ...L.figure(D, '05-sequence-order-payment.png', 'Luồng đặt hàng và thanh toán VietQR qua PayOS', { maxH: 900 }),
    L.p(
      'Ba nguyên tắc bảo mật/toàn vẹn dữ liệu được áp dụng xuyên suốt luồng này: (1) server luôn tự tính lại ' +
      'toàn bộ số tiền từ giá thật trong cơ sở dữ liệu, không bao giờ tin số tiền do client gửi lên; (2) chữ ký ' +
      'webhook được xác minh bằng `payos.webhooks.verify()` trước khi xử lý bất kỳ dữ liệu nào bên trong; ' +
      '(3) toàn bộ thao tác trừ kho, cập nhật trạng thái thanh toán và ghi nhận giao dịch nằm trong đúng 1 ' +
      'transaction cơ sở dữ liệu duy nhất — không thể xảy ra trạng thái nửa vời (VD: đã đánh dấu PAID nhưng ' +
      'chưa trừ kho).'
    ),

    L.h3('3.5.3 Vòng đời trạng thái đơn hàng'),
    L.p(
      'Trạng thái vận chuyển của đơn hàng (`shippingStatus`) được kiểm soát chặt bằng một state machine tường ' +
      'minh ở tầng service, không cho phép chuyển trạng thái tuỳ ý — ví dụ không thể chuyển thẳng từ PENDING ' +
      'sang DELIVERED, hay tác động lên một đơn đã ở trạng thái cuối (DELIVERED/CANCELLED).'
    ),
    ...L.figure(D, '06-state-machine-order.png', 'Sơ đồ trạng thái vòng đời đơn hàng', { maxH: 900 }),

    L.h3('3.5.4 Luồng bảo mật nhiều lớp'),
    L.p(
      'Mọi request tới các route nhạy cảm đều phải đi qua nhiều lớp kiểm tra độc lập trước khi chạm tới logic ' +
      'nghiệp vụ thật — nếu bất kỳ lớp nào từ chối, request dừng lại ngay, không lãng phí tài nguyên xử lý ' +
      'thêm.'
    ),
    ...L.figure(D, '07-bao-mat-nhieu-lop.png', 'Luồng bảo mật nhiều lớp minh hoạ qua PATCH /products/:id', { maxH: 900 }),

    L.h3('3.5.5 Cấu trúc thư mục lưu trữ ảnh trên Cloudinary'),
    L.p(
      'Ảnh sản phẩm được tổ chức theo cây thư mục phân tầng phản ánh đúng cấu trúc dữ liệu (danh mục → danh ' +
      'mục con → thương hiệu → sản phẩm), giúp dễ tra cứu/dọn dẹp thủ công trên Cloudinary Dashboard khi cần, ' +
      'đồng thời được validate bằng regex ở tầng backend để chống Path Traversal khi client tự truyền tên thư ' +
      'mục.'
    ),
    ...L.figure(D, '08-cloudinary-folder.png', 'Cấu trúc thư mục lưu ảnh trên Cloudinary', { maxH: 500 }),
  ];
}

module.exports = { chapter3 };
