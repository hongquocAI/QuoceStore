const L = require('../lib');
const { Paragraph, PageBreak } = L;

function tech(name, desc, why) {
  return [
    L.h3(name),
    L.p(desc),
    L.p(['Lý do lựa chọn: '].map((t) => L.run(t, { bold: true })).concat([L.run(why)])),
  ];
}

function chapter2() {
  return [
    new Paragraph({ children: [new PageBreak()] }),
    L.h1('CHƯƠNG 2 — CƠ SỞ LÝ THUYẾT'),
    L.p(
      'Chương này giới thiệu các công nghệ THẬT SỰ được sử dụng trong hệ thống (đối chiếu trực tiếp với ' +
      '`package.json` của cả 2 phía backend/frontend), kèm lý do lựa chọn dựa trên trải nghiệm thực tế trong ' +
      'quá trình xây dựng, không liệt kê công nghệ chưa được dùng.'
    ),

    L.h2('2.1 Backend'),
    ...tech(
      'NestJS 11',
      'Framework Node.js theo kiến trúc module hoá (Controller — Service — Module), hỗ trợ Dependency ' +
      'Injection và Decorator, xây dựng trên nền Express.',
      'Cấu trúc module rõ ràng giúp tách biệt từng nghiệp vụ (Auth, Product, Orders, Payment...) thành các ' +
      'module độc lập, dễ áp dụng Guard/Interceptor/Pipe dùng chung (ValidationPipe, AuditLogInterceptor, ' +
      'GlobalExceptionFilter) cho toàn bộ ứng dụng mà không phải lặp lại code ở từng route.'
    ),
    ...tech(
      'Prisma ORM 6 + PostgreSQL (Neon Serverless)',
      'Prisma là ORM thế hệ mới cho TypeScript, sinh Prisma Client type-safe từ file `schema.prisma`. Neon là ' +
      'dịch vụ PostgreSQL serverless (tự "ngủ" khi không hoạt động, giúp tiết kiệm chi phí ở quy mô đồ án).',
      'Prisma Client tự sinh type TypeScript khớp 100% với schema, giảm hẳn lỗi runtime do sai tên cột/kiểu dữ ' +
      'liệu. `$transaction` của Prisma được dùng xuyên suốt cho các nghiệp vụ đòi hỏi tính nguyên tử (tạo đơn ' +
      'hàng, xử lý webhook thanh toán) — chi tiết ở Chương 3.'
    ),
    ...tech(
      'Redis (Upstash) qua @nestjs/cache-manager + @keyv/redis',
      'Redis là cơ sở dữ liệu key-value trong bộ nhớ, dùng làm tầng cache. Upstash cung cấp Redis serverless ' +
      'miễn phí phù hợp quy mô đồ án.',
      'Package `cache-manager-redis-yet` (thường gặp trong hướng dẫn cũ) đã ngừng phát triển; `@keyv/redis` là ' +
      'driver được `@nestjs/cache-manager` v12 khuyến nghị hiện tại. Cache được áp dụng có chọn lọc cho danh ' +
      'mục/thương hiệu (dữ liệu ít thay đổi, TTL 1 giờ), KHÔNG áp dụng cho danh sách sản phẩm phân trang vì số ' +
      'tổ hợp tham số lọc là vô hạn và Redis qua Keyv không hỗ trợ xoá theo prefix để invalidate đúng.'
    ),
    ...tech(
      'JWT + Cookie HttpOnly + Refresh Token Rotation',
      'JSON Web Token dùng để xác thực không trạng thái (stateless); cookie HttpOnly là cookie mà JavaScript ' +
      'phía trình duyệt không đọc được, chỉ trình duyệt tự gửi kèm request.',
      'Lưu accessToken trong `localStorage` (cách làm phổ biến trong nhiều hướng dẫn) dễ bị đánh cắp qua tấn ' +
      'công XSS. Chuyển sang cookie HttpOnly loại bỏ hẳn nguy cơ này. accessToken có vòng đời ngắn (15 phút) ' +
      'để giảm thiệt hại nếu bị lộ; refreshToken (30 ngày) được xoay vòng (rotation) và chỉ lưu bản băm ' +
      'SHA-256 trong DB — theo đúng khuyến nghị không lưu token dạng plaintext.'
    ),
    ...tech(
      'PayOS SDK v2 (@payos/node)',
      'PayOS là cổng thanh toán VietQR (chuyển khoản ngân hàng qua mã QR) phổ biến tại Việt Nam, cung cấp SDK ' +
      'Node.js chính thức.',
      'PayOS được chọn vì hỗ trợ VietQR — phương thức thanh toán phổ biến, không cần tài khoản merchant quốc ' +
      'tế phức tạp như Stripe/PayPal. Bài học thực tế quan trọng: API của package đổi hoàn toàn giữa v1 và v2 ' +
      '(`createPaymentLink` → `paymentRequests.create`, `verifyPaymentWebhookData` → `webhooks.verify`) — quá ' +
      'trình xây dựng đã phải xác nhận lại đúng API thật đang cài (qua `npm list` và đọc trực tiếp type ' +
      'definition trong `node_modules`) thay vì suy đoán từ kiến thức đã biết, tránh lặp lại nhiều giờ debug ' +
      'từng gặp phải.'
    ),
    ...tech(
      'Cloudinary',
      'Dịch vụ lưu trữ và xử lý ảnh trên đám mây, hỗ trợ transformation (resize, tối ưu định dạng) ngay khi ' +
      'upload.',
      'Miễn phí ở quy mô nhỏ, API upload đơn giản qua stream, hỗ trợ transformation `quality:auto, ' +
      'fetch_format:auto` giúp tối ưu dung lượng ảnh sản phẩm tự động mà không cần xử lý ảnh thủ công.'
    ),
    ...tech(
      'Google OAuth2 (google-auth-library)',
      'Thư viện chính thức của Google để xác thực ID Token nhận được từ luồng đăng nhập Google phía client.',
      'Cho phép người dùng đăng nhập nhanh không cần tạo mật khẩu riêng. Điểm mấu chốt về bảo mật: ID Token ' +
      'PHẢI được xác minh chữ ký bằng `OAuth2Client.verifyIdToken()` ở phía server — không bao giờ tin trực ' +
      'tiếp email/tên do client tự gửi kèm (bài học từ 1 lỗ hổng thật đã phát hiện và sửa, xem Chương 5).'
    ),
    ...tech(
      'Sentry (@sentry/node) + nestjs-pino',
      'Sentry là dịch vụ theo dõi lỗi (error tracking) tập trung; nestjs-pino tích hợp Pino — thư viện ghi log ' +
      'JSON hiệu năng cao — vào vòng đời request của NestJS.',
      'Pino ghi log có cấu trúc (structured JSON) giúp dễ tra cứu và tự động ẩn (redact) các trường nhạy cảm ' +
      'như mật khẩu, token, cookie khỏi log. Sentry được khởi tạo nhằm mục tiêu gom lỗi 500 thật về một nơi ' +
      'theo dõi tập trung — mức độ tích hợp thực tế hiện tại được nêu rõ ở Chương 5/6 (đã khởi tạo nhưng CHƯA ' +
      'nối vào bộ lọc lỗi toàn cục để thực sự gửi lỗi đi, ghi nhận trung thực đây là hạn chế còn tồn đọng).'
    ),
    ...tech(
      '@nestjs/throttler + class-validator',
      'Throttler giới hạn số lượng request trong một khoảng thời gian theo IP; class-validator cho phép khai ' +
      'báo ràng buộc validate ngay trên class DTO bằng decorator.',
      'Áp dụng giới hạn riêng cho từng endpoint nhạy cảm (đăng nhập, đăng ký, tra cứu đơn, chat AI) để giảm ' +
      'nguy cơ dò mật khẩu/quét dữ liệu. `ValidationPipe` toàn cục với `whitelist` và `forbidNonWhitelisted` ' +
      'từ chối thẳng mọi field lạ trong request thay vì âm thầm bỏ qua, giúp phát hiện sớm client gửi sai ' +
      'định dạng.'
    ),

    L.h2('2.2 Frontend'),
    ...tech(
      'Next.js 16 (App Router) + React 19',
      'Next.js là framework React hỗ trợ định tuyến theo cấu trúc thư mục (App Router) và nhiều chế độ render.',
      'App Router là kiến trúc định tuyến hiện hành của Next.js, phù hợp xây dựng cả trang công khai (storefront) ' +
      'lẫn khu vực quản trị trong cùng 1 dự án. Phần lớn trang trong hệ thống dùng Client Component vì cần ' +
      'tương tác nhiều (giỏ hàng, form, polling trạng thái thanh toán); 3 trang chính sách pháp lý dùng Server ' +
      'Component vì nội dung tĩnh.'
    ),
    ...tech(
      'Tailwind CSS',
      'Framework CSS tiện ích (utility-first), styling trực tiếp qua class trong JSX.',
      'Tốc độ triển khai giao diện nhanh, dễ đảm bảo tính nhất quán khi đã thống nhất 1 bộ token thiết kế ' +
      '(bo góc vuông, chữ hoa đậm, tương phản đen trắng) áp dụng xuyên suốt toàn site.'
    ),
    ...tech(
      'axios',
      'Thư viện HTTP client cho JavaScript, hỗ trợ interceptor xử lý request/response tập trung.',
      'Cấu hình `withCredentials: true` để trình duyệt tự gửi kèm cookie HttpOnly sang backend (khác origin do ' +
      'khác cổng). Request interceptor tự động phát hiện lỗi 401, gọi `/auth/refresh` để xoay vòng token và ' +
      'phát lại request gốc — người dùng không bị đăng xuất đột ngột giữa phiên làm việc.'
    ),
    ...tech(
      'qrcode.react',
      'Thư viện React vẽ mã QR từ một chuỗi dữ liệu bất kỳ.',
      'PayOS trả về chuỗi VietQR theo chuẩn EMVCo (chuỗi text, không phải URL ảnh) — cần tự vẽ mã QR ở phía ' +
      'client bằng `<QRCodeSVG value={qrCode}>` thay vì hiển thị trực tiếp như một ảnh.'
    ),
    ...tech(
      '@react-oauth/google',
      'Thư viện React bọc sẵn nút đăng nhập Google và trả về ID Token sau khi người dùng xác thực thành công.',
      'Giảm khối lượng code cần tự triển khai luồng OAuth2 phía client, chỉ cần gửi `credential` (ID Token) ' +
      'nhận được lên backend để xác minh.'
    ),

    L.h2('2.3 Nhận xét chung'),
    L.p(
      'Bộ công nghệ được lựa chọn đều là các công cụ phổ biến, có tài liệu chính thức đầy đủ và phù hợp quy mô ' +
      'một hệ thống thương mại điện tử vừa và nhỏ. Điểm chung xuyên suốt là ưu tiên các cơ chế AN TOÀN MẶC ĐỊNH ' +
      '(cookie HttpOnly thay vì localStorage, ORM type-safe thay vì viết SQL tay, xác minh chữ ký thay vì tin ' +
      'dữ liệu client) — đây cũng là kim chỉ nam xuyên suốt các quyết định thiết kế trình bày ở Chương 3.'
    ),
  ];
}

module.exports = { chapter2 };
