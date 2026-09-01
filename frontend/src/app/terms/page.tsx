import Link from 'next/link';

export const metadata = {
  title: 'Điều khoản dịch vụ | QUOCÉ',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-sm font-black uppercase tracking-wider text-gray-900 mb-3 pb-2 border-b border-gray-200">
        {title}
      </h2>
      <div className="text-sm text-gray-700 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-[#111] font-sans antialiased pb-28">
      <div className="max-w-3xl mx-auto px-6 pt-12 pb-8 border-b border-gray-200">
        <h1 className="text-2xl md:text-4xl font-black uppercase tracking-[0.2em] text-[#111]">
          Điều khoản dịch vụ
        </h1>
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mt-3">
          Cập nhật lần cuối: 02/09/2026
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-6 pt-10">
        <Section title="1. Định nghĩa và phạm vi áp dụng">
          <p>
            Điều khoản này quy định quyền và nghĩa vụ giữa QUOCÉ (&ldquo;chúng tôi&rdquo;) và người sử
            dụng website (&ldquo;khách hàng&rdquo;, &ldquo;bạn&rdquo;) khi truy cập, đăng ký tài khoản, hoặc đặt
            hàng qua hệ thống. Bằng việc sử dụng dịch vụ, bạn được xem là đã đọc và đồng ý với các
            điều khoản dưới đây.
          </p>
        </Section>

        <Section title="2. Điều kiện sử dụng và tài khoản">
          <ul className="list-disc pl-5 space-y-2">
            <li>Bạn cam kết cung cấp thông tin chính xác khi đăng ký tài khoản và đặt hàng (họ tên, số điện thoại, địa chỉ giao hàng).</li>
            <li>Bạn có trách nhiệm bảo mật thông tin đăng nhập của mình; mọi hoạt động thực hiện dưới tài khoản của bạn được xem là do bạn thực hiện, trừ trường hợp chứng minh được tài khoản bị truy cập trái phép.</li>
            <li>Chúng tôi có quyền tạm ngừng hoặc từ chối phục vụ tài khoản có dấu hiệu gian lận, lạm dụng hệ thống, hoặc vi phạm điều khoản này.</li>
            <li>Bạn có thể đặt hàng với vai trò khách vãng lai (không cần đăng ký tài khoản); một số quyền lợi (theo dõi lịch sử đơn hàng đầy đủ, tích điểm) chỉ áp dụng cho tài khoản đã đăng ký.</li>
          </ul>
        </Section>

        <Section title="3. Đặt hàng và giá bán">
          <p>
            Giá sản phẩm hiển thị trên website là giá cuối cùng do hệ thống xác định tại thời điểm bạn
            đặt hàng. Để bảo đảm tính minh bạch, tổng giá trị đơn hàng (bao gồm giảm giá nếu áp dụng
            mã hợp lệ) luôn được hệ thống tự tính toán lại từ dữ liệu gốc lưu trên máy chủ tại thời
            điểm xử lý đơn hàng — không dựa trên số liệu do trình duyệt của khách hàng gửi lên, nhằm
            ngăn ngừa sai lệch giá do lỗi kỹ thuật hoặc can thiệp trái phép.
          </p>
          <p>
            Đơn hàng được xác nhận là hợp lệ sau khi hệ thống kiểm tra đủ tồn kho cho từng sản phẩm
            trong đơn. Với đơn thanh toán khi nhận hàng (COD), tồn kho được giữ ngay khi đơn được tạo.
            Với đơn thanh toán chuyển khoản (VietQR), tồn kho chỉ chính thức được trừ khi hệ thống
            xác nhận đã nhận được thanh toán — nếu bạn không hoàn tất thanh toán, đơn sẽ không được
            xử lý tiếp và tồn kho sản phẩm không bị ảnh hưởng.
          </p>
        </Section>

        <Section title="4. Hủy đơn hàng">
          <p>Đơn hàng có thể được hủy trong các trường hợp và điều kiện sau:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Đơn đang ở trạng thái <span className="font-bold text-gray-900">Chờ xử lý</span> hoặc <span className="font-bold text-gray-900">Đang xử lý</span> có thể được hủy.</li>
            <li>Đơn đã chuyển sang trạng thái <span className="font-bold text-gray-900">Đã giao vận</span> hoặc <span className="font-bold text-gray-900">Đã giao hàng</span> không thể hủy qua hệ thống — trường hợp này, vui lòng liên hệ trực tiếp để được hỗ trợ theo quy trình đổi trả (xem{' '}
              <Link href="/return-policy" className="underline hover:text-black">Chính sách đổi trả</Link>).
            </li>
            <li>Khi một đơn đã thanh toán bị hủy, việc hoàn tiền được xử lý theo đúng quy định tại{' '}
              <Link href="/return-policy" className="underline hover:text-black">Chính sách đổi trả và hoàn tiền</Link>.
            </li>
          </ul>
        </Section>

        <Section title="5. Phương thức thanh toán">
          <ul className="list-disc pl-5 space-y-2">
            <li><span className="font-bold text-gray-900">Thanh toán khi nhận hàng (COD):</span> bạn thanh toán trực tiếp cho đơn vị vận chuyển khi nhận hàng.</li>
            <li><span className="font-bold text-gray-900">Chuyển khoản VietQR:</span> thanh toán qua cổng trung gian PayOS. Đơn hàng chỉ được xác nhận thanh toán thành công sau khi hệ thống nhận được xác thực giao dịch từ PayOS — quá trình này thường diễn ra trong vài giây sau khi bạn hoàn tất chuyển khoản.</li>
          </ul>
        </Section>

        <Section title="6. Vận chuyển">
          <p>
            Thời gian giao hàng có thể thay đổi tùy khu vực địa lý và đơn vị vận chuyển được sử dụng.
            Trạng thái giao hàng của từng đơn (Chờ xử lý / Đang xử lý / Đã giao vận / Đã giao hàng)
            được cập nhật và hiển thị minh bạch tại trang lịch sử đơn hàng của bạn.
          </p>
        </Section>

        <Section title="7. Quyền và nghĩa vụ của QUOCÉ">
          <ul className="list-disc pl-5 space-y-2">
            <li>Cung cấp thông tin sản phẩm trung thực, xử lý đơn hàng đúng theo trạng thái đã cam kết.</li>
            <li>Bảo vệ dữ liệu cá nhân của khách hàng theo đúng <Link href="/privacy-policy" className="underline hover:text-black">Chính sách bảo mật</Link>.</li>
            <li>Có quyền từ chối xử lý đơn hàng có dấu hiệu gian lận hoặc thông tin giao nhận không xác thực được.</li>
            <li>Có quyền thay đổi, cập nhật điều khoản này; phiên bản áp dụng là phiên bản được đăng công khai tại thời điểm bạn đặt hàng.</li>
          </ul>
        </Section>

        <Section title="8. Quyền và nghĩa vụ của khách hàng">
          <ul className="list-disc pl-5 space-y-2">
            <li>Cung cấp thông tin giao nhận chính xác; chịu trách nhiệm nếu đơn hàng không giao được do thông tin sai.</li>
            <li>Được quyền tra cứu trạng thái đơn hàng bất kỳ lúc nào qua tài khoản hoặc chức năng tra cứu dành cho khách vãng lai.</li>
            <li>Được quyền yêu cầu đổi trả/hoàn tiền theo đúng điều kiện tại Chính sách đổi trả.</li>
          </ul>
        </Section>

        <Section title="9. Giới hạn trách nhiệm">
          <p>
            Chúng tôi không chịu trách nhiệm đối với các thiệt hại phát sinh do nguyên nhân bất khả
            kháng (thiên tai, gián đoạn hạ tầng internet/bên thứ ba ngoài khả năng kiểm soát hợp lý),
            hoặc do khách hàng cung cấp thông tin giao nhận không chính xác. Trách nhiệm của chúng tôi
            đối với mỗi đơn hàng không vượt quá giá trị thực tế của đơn hàng đó.
          </p>
        </Section>

        <Section title="10. Sở hữu trí tuệ">
          <p>
            Toàn bộ nội dung, hình ảnh, thiết kế giao diện, và mã nguồn hiển thị trên website thuộc
            quyền sở hữu của QUOCÉ hoặc được cấp phép sử dụng hợp pháp, trừ khi có ghi chú khác. Nghiêm
            cấm sao chép, phân phối lại vì mục đích thương mại mà không có sự cho phép bằng văn bản.
          </p>
        </Section>

        <Section title="11. Giải quyết tranh chấp">
          <p>
            Mọi tranh chấp phát sinh trước tiên sẽ được giải quyết thông qua thương lượng, hòa giải
            trên cơ sở thiện chí giữa hai bên. Trường hợp không đạt được thỏa thuận, tranh chấp sẽ
            được giải quyết tại cơ quan có thẩm quyền theo quy định của pháp luật Việt Nam.
          </p>
        </Section>

        <Section title="12. Luật áp dụng và thay đổi điều khoản">
          <p>
            Điều khoản này được xây dựng và giải thích theo pháp luật Việt Nam. Chúng tôi có thể cập
            nhật điều khoản theo thời gian; phiên bản mới nhất luôn được đăng công khai tại trang này.
          </p>
          <p>
            Mọi thắc mắc liên quan tới điều khoản dịch vụ, vui lòng liên hệ:{' '}
            <span className="font-bold text-gray-900">support@quoce.vn</span>.
          </p>
        </Section>

        <div className="border border-gray-200 rounded-none p-5 bg-[#fafafa] text-xs text-gray-500 leading-relaxed">
          Đây là bản soạn thảo tham khảo dựa trên khung pháp lý hiện hành, được xây dựng để minh họa
          năng lực triển khai điều khoản dịch vụ cho một hệ thống thương mại điện tử. Khuyến nghị rà
          soát bởi chuyên gia pháp lý trước khi áp dụng cho hoạt động kinh doanh thật. Nội dung này{' '}
          <span className="font-bold">KHÔNG PHẢI</span> tư vấn pháp lý chính thức.
        </div>
      </div>
    </div>
  );
}
