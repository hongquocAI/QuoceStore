const L = require('../lib');
const { Paragraph, PageBreak } = L;

function references() {
  return [
    new Paragraph({ children: [new PageBreak()] }),
    L.h1('TÀI LIỆU THAM KHẢO'),
    L.numbered('NestJS Documentation. https://docs.nestjs.com'),
    L.numbered('Prisma Documentation. https://www.prisma.io/docs'),
    L.numbered('Next.js Documentation (App Router). https://nextjs.org/docs'),
    L.numbered('PayOS Developer Documentation. https://payos.vn/docs'),
    L.numbered('Cloudinary Documentation. https://cloudinary.com/documentation'),
    L.numbered('Upstash Redis Documentation. https://upstash.com/docs/redis'),
    L.numbered('Neon (Serverless Postgres) Documentation. https://neon.tech/docs'),
    L.numbered('Google Identity Services — Sign In With Google. https://developers.google.com/identity'),
    L.numbered('OWASP Top 10. https://owasp.org/www-project-top-ten/'),
    L.numbered('JSON Web Token (RFC 7519). https://datatracker.ietf.org/doc/html/rfc7519'),
  ];
}

function appendixA() {
  const rows = [
    ['1', 'POST', '/auth/register', '—', 'Đăng ký tài khoản (3/phút)'],
    ['2', 'POST', '/auth/login', '—', 'Đăng nhập email/mật khẩu (5/phút)'],
    ['3', 'POST', '/auth/google', '—', 'Đăng nhập bằng Google (5/phút)'],
    ['4', 'POST', '/auth/refresh', '—', 'Xoay vòng cặp token (10/phút)'],
    ['5', 'POST', '/auth/logout', '—', 'Thu hồi refresh token'],
    ['6', 'GET', '/auth/me', 'JWT', 'Thông tin người dùng hiện tại'],
    ['7', 'POST', '/orders', 'JWT tuỳ chọn *', 'Tạo đơn hàng (khách vãng lai hoặc đã đăng nhập)'],
    ['8', 'GET', '/orders/my-orders', 'JWT', 'Đơn hàng của chính mình'],
    ['9', 'GET', '/orders/user/:userId', 'JWT + ADMIN', 'Đơn hàng của 1 người dùng bất kỳ'],
    ['10', 'POST', '/orders/lookup', '—', 'Tra cứu đơn hàng bằng mã đơn + SĐT (5/phút)'],
    ['11', 'GET', '/orders/admin/all', 'JWT + ADMIN', 'Danh sách đơn hàng có phân trang/lọc'],
    ['12', 'PATCH', '/orders/:id/shipping-status', 'JWT + ADMIN', 'Đổi trạng thái vận chuyển (state machine)'],
    ['13', 'GET', '/orders/:id/status', '—', 'Chỉ trả paymentStatus (dùng cho polling)'],
    ['14', 'GET', '/orders/:id', 'JWT (chủ đơn/ADMIN)', 'Chi tiết 1 đơn hàng'],
    ['15', 'POST', '/payments/create-qr', '—', 'Tạo link/QR thanh toán PayOS'],
    ['16', 'POST', '/payments/payos-webhook', '— (xác minh chữ ký)', 'Webhook PayOS xác nhận thanh toán'],
    ['17', 'GET', '/products', '—', 'Danh sách sản phẩm công khai (phân trang)'],
    ['18', 'GET', '/products/categories', '—', 'Danh sách danh mục (có cache)'],
    ['19', 'GET', '/products/admin/all', 'JWT + ADMIN', 'Danh sách sản phẩm cho Admin (gồm cả ẩn)'],
    ['20', 'GET', '/products/:slug', '—', 'Chi tiết sản phẩm theo slug'],
    ['21', 'POST', '/products', 'JWT + ADMIN', 'Tạo sản phẩm mới'],
    ['22', 'PATCH', '/products/:id', 'JWT + ADMIN', 'Cập nhật sản phẩm'],
    ['23', 'DELETE', '/products/:id', 'JWT + ADMIN', 'Xoá (mềm/cứng tuỳ điều kiện) sản phẩm'],
    ['24', 'POST', '/upload', 'JWT + ADMIN/VENDOR', 'Upload ảnh lên Cloudinary (20/phút)'],
    ['25', 'POST', '/ai/chat', '—', 'Trợ lý AI tư vấn sản phẩm (10/phút)'],
    ['26', 'GET', '/reviews', '—', 'Danh sách đánh giá + điểm trung bình theo sản phẩm'],
    ['27', 'GET', '/reviews/eligibility', 'JWT', 'Kiểm tra điều kiện được phép đánh giá'],
    ['28', 'POST', '/reviews', 'JWT', 'Gửi đánh giá (5/phút)'],
    ['29', 'PATCH', '/reviews/:id', 'JWT (chủ đánh giá)', 'Sửa đánh giá của chính mình'],
    ['30', 'DELETE', '/reviews/:id', 'JWT (chủ hoặc ADMIN)', 'Xoá đánh giá'],
    ['31', 'GET', '/addresses', 'JWT', 'Danh sách địa chỉ của chính mình'],
    ['32', 'POST', '/addresses', 'JWT', 'Thêm địa chỉ mới'],
    ['33', 'PATCH', '/addresses/:id', 'JWT (chủ sở hữu)', 'Sửa địa chỉ'],
    ['34', 'PATCH', '/addresses/:id/set-default', 'JWT (chủ sở hữu)', 'Đặt làm địa chỉ mặc định'],
    ['35', 'DELETE', '/addresses/:id', 'JWT (chủ sở hữu)', 'Xoá địa chỉ'],
    ['36', 'GET', '/discounts/code/:code', '—', 'Kiểm tra hiệu lực mã giảm giá'],
    ['37', 'GET', '/brands', '—', 'Danh sách thương hiệu (có cache)'],
    ['38', 'POST', '/brands', 'JWT + ADMIN', 'Tạo thương hiệu'],
    ['39', 'DELETE', '/brands/:id', 'JWT + ADMIN', 'Xoá thương hiệu (nếu không còn sản phẩm)'],
    ['40', 'GET', '/sub-categories', '—', 'Danh sách danh mục con'],
    ['41', 'POST', '/sub-categories', 'JWT + ADMIN', 'Tạo danh mục con'],
    ['42', 'DELETE', '/sub-categories/:id', 'JWT + ADMIN', 'Xoá danh mục con (nếu không còn sản phẩm)'],
    ['43', 'POST', '/categories', 'JWT + ADMIN', 'Tạo danh mục chính'],
    ['44', 'DELETE', '/categories/:id', 'JWT + ADMIN', 'Xoá danh mục chính (nếu không còn sản phẩm)'],
    ['45', 'GET', '/users/:id', 'JWT (chủ hoặc ADMIN)', 'Hồ sơ người dùng (không kèm mật khẩu)'],
    ['46', 'PATCH', '/users/:id', 'JWT (chủ hoặc ADMIN)', 'Cập nhật hồ sơ'],
    ['47', 'PATCH', '/users/:id/password', 'JWT (chủ hoặc ADMIN)', 'Đổi mật khẩu'],
    ['48', 'PATCH', '/users/:id/avatar', 'JWT (chủ hoặc ADMIN)', 'Cập nhật ảnh đại diện (tối đa 5MB)'],
    ['49', 'GET', '/health', '—', 'Kiểm tra sức khoẻ hệ thống (loại trừ khỏi rate-limit)'],
  ];

  return [
    new Paragraph({ children: [new PageBreak()] }),
    L.h1('PHỤ LỤC A — DANH SÁCH ĐẦY ĐỦ API ENDPOINT'),
    L.p(
      '* Route `POST /orders` áp dụng `OptionalJwtAuthGuard`: nếu request có cookie đăng nhập hợp lệ, hệ thống ' +
      'tự gắn đơn hàng cho đúng người dùng đó; nếu không có cookie, xử lý như khách vãng lai. Đây là kết quả ' +
      'sau khi khắc phục lỗ hổng tin `userId` từ body client, được trình bày chi tiết ở Chương 5.'
    ),
    L.dataTable(
      ['#', 'Method', 'Endpoint', 'Guard / Quyền', 'Mô tả'],
      rows,
      [500, 900, 3000, 2400, 2550]
    ),
    L.p(
      'Ngoài các endpoint API trên, hệ thống còn phục vụ file tĩnh qua `GET /data/*` (dữ liệu mẫu sản phẩm dùng ' +
      'nội bộ cho quá trình phát triển).', { after: 200 }
    ),
  ];
}

module.exports = { references, appendixA };
