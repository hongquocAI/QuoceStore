const L = require('../lib');
const { Paragraph, PageBreak } = L;
const S = L.SCREENSHOTS;

function chapter4() {
  return [
    new Paragraph({ children: [new PageBreak()] }),
    L.h1('CHƯƠNG 4 — XÂY DỰNG & TRIỂN KHAI'),

    L.h2('4.1 Môi trường phát triển'),
    L.bullet('Hệ điều hành: Windows, PowerShell làm shell chính.'),
    L.bullet('Backend: Node.js, NestJS 11, Prisma 6, chạy dev bằng `npm run start:dev` (cổng 5000).'),
    L.bullet('Frontend: Next.js 16, React 19, chạy dev bằng `npm run dev` (cổng 3000).'),
    L.bullet('Cơ sở dữ liệu: PostgreSQL qua Neon (serverless, tự "ngủ" khi không hoạt động).'),
    L.bullet('Cache: Redis qua Upstash (region Singapore).'),
    L.bullet('Quản lý mã nguồn: Git, repository riêng trên GitHub.'),
    L.bullet('Kiểm thử thanh toán thật: ngrok để expose backend cục bộ ra Internet, phục vụ đăng ký webhook thật với PayOS trong quá trình phát triển.'),

    L.h2('4.2 Chi tiết các module đã xây dựng'),
    L.h3('4.2.1 Auth'),
    L.p('Đăng ký/đăng nhập bằng email (bcrypt băm mật khẩu) và Google OAuth2, cấp cặp accessToken/refreshToken qua cookie HttpOnly, xoay vòng refreshToken khi hết hạn accessToken.'),
    L.h3('4.2.2 Users'),
    L.p('Quản lý hồ sơ cá nhân (họ tên, SĐT, CCCD tự nguyện, giới tính, ngày sinh, avatar), đổi mật khẩu — toàn bộ route đều kiểm tra chủ sở hữu (ownership) ngoài việc bắt buộc đăng nhập.'),
    L.h3('4.2.3 Product / MDM (Categories, SubCategories, Brands)'),
    L.p('Quản lý sản phẩm với biến thể màu, thông số kỹ thuật (specs) và điểm nổi bật (highlights) dạng danh sách động; danh mục/danh mục con/thương hiệu là bảng quan hệ thật có validate khoá ngoại và chặn xoá khi còn sản phẩm tham chiếu.'),
    L.h3('4.2.4 Orders / Payment'),
    L.p('Xử lý đặt hàng, xác thực tồn kho, tích hợp thanh toán VietQR qua PayOS — chi tiết luồng đã trình bày ở mục 3.5.2.'),
    L.h3('4.2.5 Discounts'),
    L.p('Mã giảm giá được validate và tính toán hoàn toàn ở server, chống race condition khi nhiều đơn cùng tranh lượt sử dụng cuối cùng của một mã.'),
    L.h3('4.2.6 AuditLog'),
    L.p('Một interceptor toàn cục tự động ghi lại các thao tác nhạy cảm (được đánh dấu bằng decorator `@Audit`) — bao gồm người thực hiện, hành động, đối tượng bị tác động, địa chỉ IP và User-Agent, có ẩn (redact) các trường nhạy cảm trong dữ liệu ghi log.'),
    L.h3('4.2.7 Reviews'),
    L.p('Chỉ khách hàng có đơn hàng ở trạng thái DELIVERED cho đúng sản phẩm mới được đánh giá; điểm trung bình được tính động (on-the-fly) tại thời điểm truy vấn, không lưu trường tổng hợp trên bảng Product.'),
    L.h3('4.2.8 Addresses'),
    L.p('Sổ địa chỉ cá nhân, tự động đề bạt địa chỉ khác làm mặc định khi địa chỉ mặc định bị xoá.'),
    L.h3('4.2.9 Cloudinary / AI'),
    L.p('Upload ảnh yêu cầu xác thực và giới hạn định dạng/dung lượng; module AI dùng Gemini để tư vấn sản phẩm dựa trên danh sách sản phẩm đang bán, giới hạn 10 request/phút để kiểm soát chi phí gọi API.'),
    L.h3('4.2.10 Health'),
    L.p('Endpoint kiểm tra sức khoẻ hệ thống bằng cách thực thi trực tiếp một truy vấn `SELECT 1` tới cơ sở dữ liệu, loại trừ khỏi cơ chế giới hạn tần suất request.'),

    L.h2('4.3 Một số đoạn code tiêu biểu'),
    L.p('Phần này trích nguyên văn 5 đoạn code có giá trị kỹ thuật cao nhất trong hệ thống, kèm giải thích ngắn gọn.'),

    L.h3('4.3.1 Đọc JWT từ Cookie HttpOnly (JwtStrategy)'),
    L.p('Điểm mấu chốt: token được đọc trực tiếp từ cookie thay vì header Authorization, phù hợp với quyết định thiết kế không lưu token ở localStorage.'),
    L.codeBlock(
`// backend/src/auth/strategies/jwt.strategy.ts
super({
  jwtFromRequest: (req: Request) => {
    return req?.cookies?.accessToken || null;
  },
  ignoreExpiration: false,
  secretOrKey: config.get<string>('JWT_SECRET')!,
});

async validate(payload: { sub: string; email: string; role: string }) {
  const user = await this.prisma.user.findUnique({
    where: { id: payload.sub },
  });
  if (!user || !user.isActive) {
    throw new UnauthorizedException(
      'Tài khoản không tồn tại hoặc đã bị vô hiệu hóa.'
    );
  }
  return { id: user.id, email: user.email, role: user.role };
}`
    ),
    L.codeCaption('Nguồn: backend/src/auth/strategies/jwt.strategy.ts'),

    L.h3('4.3.2 Chống race condition khi áp dụng mã giảm giá'),
    L.p(
      'Giữa lúc kiểm tra mã còn lượt dùng và lúc thực sự tăng bộ đếm, có thể có một đơn hàng khác cùng dùng ' +
      'mã này chen vào. `updateMany` với điều kiện `usedCount < maxUsage` ngay trong câu lệnh UPDATE đảm bảo ' +
      'chỉ một trong các giao dịch song song có thể thành công — nếu `count === 0` nghĩa là mã vừa hết lượt.'
    ),
    L.codeBlock(
`// backend/src/orders/orders.service.ts
const inc = await tx.discount.updateMany({
  where: {
    id: discount.id,
    ...(discount.maxUsage !== null && {
      usedCount: { lt: discount.maxUsage },
    }),
  },
  data: { usedCount: { increment: 1 } },
});
if (inc.count === 0) {
  throw new BadRequestException(
    'Mã giảm giá vừa hết lượt sử dụng, vui lòng bỏ mã và thử lại.'
  );
}`
    ),
    L.codeCaption('Nguồn: backend/src/orders/orders.service.ts'),

    L.h3('4.3.3 Xử lý Webhook thanh toán PayOS'),
    L.p(
      'Webhook được xác minh chữ ký trước khi xử lý bất kỳ dữ liệu nào; một trường hợp đặc biệt cần xử lý đúng ' +
      'là request kiểm tra tự động của PayOS khi đăng ký webhook (`webhooks.confirm()`) gửi kèm `orderCode` ' +
      'giả không tồn tại trong hệ thống — phải trả về HTTP 200 (không phải 404) để PayOS chấp nhận đăng ký URL.'
    ),
    L.codeBlock(
`// backend/src/payment/payment.service.ts
verifiedData = await this.payos.webhooks.verify(webhookBody);
...
const existingTransaction = await this.prisma.paymentTransaction
  .findUnique({ where: { transactionId } });
if (existingTransaction) {
  return { success: true, message: 'Giao dịch đã được xử lý trước đó' };
}

const order = await this.prisma.order.findUnique({ where: { orderCode } });
if (!order) {
  // PayOS tự gửi 1 request test (orderCode giả) khi confirm() webhook -
  // PHẢI trả 200, không phải 404, nếu không PayOS từ chối đăng ký URL.
  this.logger.warn(\`Webhook orderCode \${orderCode} không khớp đơn nào\`);
  return { success: true, message: 'Đã nhận webhook, không khớp đơn hàng.' };
}

const shouldDeductStock =
  isSuccess &&
  order.paymentMethod === 'BANK_TRANSFER' &&
  order.paymentStatus !== PaymentStatus.PAID;

await this.prisma.$transaction(async (tx) => {
  // trừ kho (clamp về 0 nếu thiếu) + cập nhật paymentStatus +
  // tạo PaymentTransaction — TẤT CẢ trong cùng 1 transaction
});`
    ),
    L.codeCaption('Nguồn: backend/src/payment/payment.service.ts (rút gọn, giữ nguyên phần lõi)'),

    L.h3('4.3.4 Cập nhật biến thể sản phẩm: xoá sạch rồi tạo lại'),
    L.p(
      'Khi cập nhật sản phẩm có gửi kèm `variants`, hệ thống xoá toàn bộ biến thể cũ rồi tạo lại theo danh ' +
      'sách mới, thay vì so khớp từng bản ghi để cập nhật (upsert). Cách này an toàn vì `OrderItem.variantId` ' +
      'có `onDelete: SetNull` và tên màu đã được snapshot sẵn lúc mua hàng, nên đơn hàng cũ không bị ảnh hưởng ' +
      'dù ID biến thể thay đổi.'
    ),
    L.codeBlock(
`// backend/src/product/product.service.ts
if (dto.variants !== undefined) {
  await tx.productVariant.deleteMany({ where: { productId: id } });
}
const fallbackPrice = dto.price ?? product.price;

return await tx.product.update({
  where: { id },
  data: {
    ...data,
    ...(dto.variants !== undefined &&
      dto.variants.length > 0 && {
        variants: {
          create: dto.variants.map((v) => ({
            colorCode: v.colorCode,
            colorName: v.colorName,
            hexCode: v.hexCode,
            price: v.price && v.price > 0 ? v.price : fallbackPrice,
            stock: v.stock ?? 0,
            images: v.images ?? [],
          })),
        },
      }),
  },
});`
    ),
    L.codeCaption('Nguồn: backend/src/product/product.service.ts'),

    L.h3('4.3.5 Chỉ hoàn kho khi kho đã thực sự bị trừ (fix ngày 26/09/2026)'),
    L.p(
      'Đây là một sửa lỗi thật được phát hiện trong quá trình rà soát phục vụ báo cáo này (xem chi tiết ở ' +
      'Chương 5). Hàm cập nhật trạng thái vận chuyển trước đây hoàn kho vô điều kiện khi đơn bị huỷ, không ' +
      'phân biệt phương thức thanh toán — trong khi đơn VietQR chưa thanh toán chưa từng bị trừ kho, dẫn tới ' +
      'tồn kho ảo cộng dồn sai mỗi khi huỷ một đơn VietQR còn đang chờ thanh toán.'
    ),
    L.codeBlock(
`// backend/src/orders/orders.service.ts
const stockWasDeducted =
  order.paymentMethod !== 'BANK_TRANSFER' ||
  order.paymentStatus === 'PAID';

if (dto.shippingStatus === 'CANCELLED' && stockWasDeducted) {
  for (const item of order.orderItems) {
    if (item.variantId) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      });
    } else {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
  }
}`
    ),
    L.codeCaption('Nguồn: backend/src/orders/orders.service.ts'),

    L.h2('4.4 Giao diện chương trình'),
    L.p('Các ảnh chụp dưới đây lấy trực tiếp từ hệ thống đang chạy thật trên môi trường phát triển (không phải ảnh dựng/minh hoạ), sử dụng tài khoản và dữ liệu có thật trong cơ sở dữ liệu tại thời điểm chụp.'),

    L.h3('4.4.1 Storefront — Khách hàng'),
    ...L.figure(S, '01-trang-chu.png', 'Trang chủ storefront', { maxH: 820 }),
    ...L.figure(S, '02-chi-tiet-san-pham.png', 'Trang chi tiết sản phẩm (chọn biến thể màu, đánh giá)', { maxH: 820 }),
    ...L.figure(S, '03-dang-nhap.png', 'Trang đăng nhập (email và Google OAuth2)', { maxH: 700 }),
    ...L.figure(S, '04-gio-hang.png', 'Giỏ hàng — chọn từng dòng để thanh toán một phần'),
    ...L.figure(S, '05-checkout.png', 'Trang thanh toán — chọn phương thức COD/VietQR, progress-step'),
    ...L.figure(S, '06-tra-cuu-don-hang.png', 'Tra cứu đơn hàng dành cho khách vãng lai', { maxH: 700 }),
    ...L.figure(S, '07-dieu-khoan.png', 'Trang Điều khoản dịch vụ', { maxH: 820 }),
    L.p(
      '[ CẦN NGƯỜI DÙNG TỰ CHÈN ẢNH CHỤP MÀN HÌNH: màn hình mã QR VietQR sau khi đặt hàng và màn hình xác ' +
      'nhận "Thanh toán thành công" — không chụp tự động vì bước này cần tạo 1 đơn hàng thật và quét mã bằng ' +
      'ứng dụng ngân hàng thật ]',
      { bold: true, italics: true }
    ),

    L.h3('4.4.2 Tài khoản khách hàng'),
    ...L.figure(S, '08-lich-su-don-hang.png', 'Lịch sử đơn hàng cá nhân', { maxH: 700 }),
    ...L.figure(S, '09-so-dia-chi.png', 'Sổ địa chỉ giao hàng'),

    L.h3('4.4.3 Trang quản trị (Admin)'),
    ...L.figure(S, '10-admin-san-pham.png', 'Trang quản lý sản phẩm — phân trang, tìm kiếm, lọc theo danh mục/thương hiệu', { maxH: 800 }),
    ...L.figure(S, '11-admin-modal-them-san-pham.png', 'Form thêm sản phẩm mới — SKU tự sinh, danh mục/thương hiệu chọn nhanh', { maxH: 800 }),
    ...L.figure(S, '12-admin-don-hang.png', 'Trang quản lý đơn hàng — trạng thái theo state machine', { maxH: 800 }),
    ...L.figure(S, '13-admin-modal-chi-tiet-don.png', 'Modal chi tiết đơn hàng và các nút chuyển trạng thái hợp lệ', { maxH: 800 }),
  ];
}

module.exports = { chapter4 };
