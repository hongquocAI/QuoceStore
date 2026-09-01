import Link from 'next/link';

export const metadata = {
  title: 'Chính sách đổi trả | QUOCÉ',
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

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-[#111] font-sans antialiased pb-28">
      <div className="max-w-3xl mx-auto px-6 pt-12 pb-8 border-b border-gray-200">
        <h1 className="text-2xl md:text-4xl font-black uppercase tracking-[0.2em] text-[#111]">
          Chính sách đổi trả & hoàn tiền
        </h1>
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mt-3">
          Cập nhật lần cuối: 02/09/2026
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-6 pt-10">
        <Section title="1. Điều kiện áp dụng đổi trả">
          <p>Yêu cầu đổi trả được xem xét chấp nhận khi thuộc một trong các trường hợp sau:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Sản phẩm nhận được bị lỗi kỹ thuật, hư hỏng không do quá trình vận chuyển gây ra bởi khách hàng.</li>
            <li>Sản phẩm giao sai (khác mẫu mã, màu sắc, số lượng so với đơn hàng đã đặt).</li>
            <li>Sản phẩm còn nguyên tem, nhãn, bao bì gốc, chưa có dấu hiệu đã qua sử dụng.</li>
          </ul>
        </Section>

        <Section title="2. Thời hạn yêu cầu đổi trả">
          <p>
            Yêu cầu đổi trả cần được gửi trong vòng <span className="font-bold text-gray-900">7 ngày</span>{' '}
            kể từ ngày nhận hàng (căn cứ theo trạng thái giao hàng &ldquo;Đã giao hàng&rdquo; ghi nhận trên hệ
            thống). Mốc thời gian này là mức tham khảo phổ biến trong thương mại điện tử; đơn vị vận
            hành thực tế có thể điều chỉnh tùy chính sách kinh doanh và quy định pháp luật áp dụng tại
            thời điểm đó.
          </p>
        </Section>

        <Section title="3. Quy trình yêu cầu đổi trả">
          <ol className="list-decimal pl-5 space-y-2">
            <li>Liên hệ qua kênh hỗ trợ (Mục 6) kèm mã đơn hàng và mô tả/hình ảnh vấn đề gặp phải.</li>
            <li>Yêu cầu được xem xét dựa trên điều kiện tại Mục 1 và Mục 2.</li>
            <li>Nếu được chấp nhận, khách hàng gửi lại sản phẩm theo hướng dẫn cụ thể sẽ được cung cấp qua kênh hỗ trợ.</li>
            <li>Sau khi nhận và kiểm tra sản phẩm hoàn trả, chúng tôi tiến hành đổi sản phẩm mới hoặc hoàn tiền theo Mục 5.</li>
          </ol>
        </Section>

        <Section title="4. Trường hợp không áp dụng đổi trả">
          <ul className="list-disc pl-5 space-y-2">
            <li>Sản phẩm đã qua sử dụng, hư hỏng do lỗi của khách hàng (rơi vỡ, vào nước không đúng khuyến cáo, tự ý sửa chữa...).</li>
            <li>Sản phẩm không còn nguyên tem, nhãn, bao bì gốc do khách hàng làm mất/hư hỏng.</li>
            <li>Yêu cầu gửi sau thời hạn quy định tại Mục 2 mà không có lý do chính đáng được chấp nhận.</li>
          </ul>
        </Section>

        <Section title="5. Chính sách hoàn tiền">
          <p>
            Đối với đơn hàng bị hủy hoặc được chấp nhận đổi trả, tồn kho sản phẩm liên quan được hệ
            thống <span className="font-bold text-gray-900">tự động hoàn lại</span> ngay khi trạng thái đơn
            chuyển sang &ldquo;Đã hủy&rdquo;.
          </p>
          <p>
            Về việc hoàn tiền cho khách hàng:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><span className="font-bold text-gray-900">Đơn thanh toán khi nhận hàng (COD) chưa thanh toán:</span> không phát sinh hoàn tiền vì chưa có giao dịch tiền tệ nào được thực hiện.</li>
            <li>
              <span className="font-bold text-gray-900">Đơn đã thanh toán qua chuyển khoản VietQR:</span>{' '}
              tại phiên bản hệ thống hiện tại, việc hoàn tiền{' '}
              <span className="font-bold">CHƯA được tự động hóa</span> — hệ thống chưa tích hợp chức năng
              hoàn tiền tự động qua cổng thanh toán. Với các đơn này, đội ngũ vận hành cần xử lý hoàn
              tiền thủ công qua nền tảng quản trị của cổng thanh toán trung gian sau khi xác nhận yêu
              cầu hợp lệ. Chúng tôi cam kết không giữ lại số tiền đã thanh toán của các đơn hàng được
              chấp nhận hủy/đổi trả hợp lệ, và sẽ xử lý hoàn tiền trong thời gian sớm nhất có thể sau
              khi xác nhận.
            </li>
          </ul>
        </Section>

        <Section title="6. Chi phí vận chuyển hoàn trả và liên hệ">
          <p>
            Chi phí vận chuyển khi gửi trả sản phẩm do lỗi từ phía chúng tôi (giao sai, sản phẩm lỗi)
            sẽ được chúng tôi chi trả hoặc hoàn lại. Trường hợp đổi trả theo nhu cầu cá nhân của khách
            hàng (không thuộc lỗi từ hệ thống), chi phí vận chuyển hai chiều do khách hàng chi trả, trừ
            khi có thỏa thuận khác.
          </p>
          <p>
            Mọi yêu cầu đổi trả, hoàn tiền vui lòng liên hệ:{' '}
            <span className="font-bold text-gray-900">support@quoce.vn</span>, hoặc tra cứu trạng thái
            đơn hàng tại{' '}
            <Link href="/orders/lookup" className="underline hover:text-black">Tra cứu đơn hàng</Link>.
          </p>
        </Section>

        <div className="border border-gray-200 rounded-none p-5 bg-[#fafafa] text-xs text-gray-500 leading-relaxed">
          Đây là bản soạn thảo tham khảo dựa trên khung pháp lý và thực tiễn phổ biến trong thương
          mại điện tử, được xây dựng để minh họa năng lực triển khai chính sách đổi trả cho một hệ
          thống thương mại điện tử. Khuyến nghị rà soát bởi chuyên gia pháp lý trước khi áp dụng cho
          hoạt động kinh doanh thật. Nội dung này <span className="font-bold">KHÔNG PHẢI</span> tư vấn
          pháp lý chính thức.
        </div>
      </div>
    </div>
  );
}
