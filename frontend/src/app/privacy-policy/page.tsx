import Link from 'next/link';

export const metadata = {
  title: 'Chính sách bảo mật | QUOCÉ',
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

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-[#111] font-sans antialiased pb-28">
      <div className="max-w-3xl mx-auto px-6 pt-12 pb-8 border-b border-gray-200">
        <h1 className="text-2xl md:text-4xl font-black uppercase tracking-[0.2em] text-[#111]">
          Chính sách bảo mật
        </h1>
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mt-3">
          Cập nhật lần cuối: 02/09/2026
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-6 pt-10">
        <Section title="1. Phạm vi áp dụng và đơn vị xử lý dữ liệu">
          <p>
            Chính sách này áp dụng cho toàn bộ dữ liệu cá nhân mà website QUOCÉ (sau đây gọi là
            &ldquo;chúng tôi&rdquo;) thu thập, xử lý khi khách hàng (&ldquo;bạn&rdquo;) sử dụng dịch vụ mua sắm
            trực tuyến tại đây, bao gồm cả khách vãng lai (không đăng nhập) và khách có tài khoản.
          </p>
          <p>
            QUOCÉ hiện là dự án phát triển phần mềm mang tính minh họa/portfolio, chưa phải pháp
            nhân kinh doanh đã đăng ký hoạt động thương mại. Chính sách này được soạn thảo theo
            đúng khung pháp lý Việt Nam hiện hành để làm chuẩn tham chiếu khi vận hành thật, không
            phải để hợp thức hóa một pháp nhân chưa tồn tại.
          </p>
        </Section>

        <Section title="2. Loại dữ liệu cá nhân thu thập">
          <p>Chúng tôi thu thập các nhóm dữ liệu sau, tùy theo tính năng bạn sử dụng:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><span className="font-bold text-gray-900">Dữ liệu định danh tài khoản:</span> họ và tên, địa chỉ email, mật khẩu (được băm bằng thuật toán bcrypt, hệ thống không lưu và không có khả năng đọc lại mật khẩu gốc dưới bất kỳ hình thức nào).</li>
            <li><span className="font-bold text-gray-900">Dữ liệu liên hệ và giao nhận:</span> số điện thoại, địa chỉ giao hàng.</li>
            <li><span className="font-bold text-gray-900">Dữ liệu hồ sơ tùy chọn:</span> ngày sinh, giới tính, ảnh đại diện.</li>
            <li>
              <span className="font-bold text-gray-900">Số Căn cước công dân/CMND (CCCD):</span> đây là trường{' '}
              <span className="font-bold">HOÀN TOÀN TỰ NGUYỆN</span>. Hệ thống không yêu cầu và không thu thập
              CCCD trong quá trình đăng ký tài khoản hay đặt hàng — bạn chỉ có thể tự nguyện khai báo
              thông tin này sau khi đăng nhập, tại trang hồ sơ cá nhân, nếu muốn. Việc không cung cấp
              CCCD không ảnh hưởng đến khả năng sử dụng bất kỳ tính năng nào của dịch vụ.
            </li>
            <li><span className="font-bold text-gray-900">Dữ liệu giao dịch:</span> lịch sử đơn hàng, sản phẩm đã mua, phương thức thanh toán, trạng thái thanh toán/giao hàng, mã giảm giá đã sử dụng.</li>
            <li><span className="font-bold text-gray-900">Dữ liệu kỹ thuật:</span> cookie phiên đăng nhập (lưu ở dạng HttpOnly, trình duyệt/JavaScript phía máy khách không đọc được), địa chỉ IP và thông tin thiết bị phục vụ mục đích bảo mật (chống tấn công dò mật khẩu, giới hạn tần suất truy cập).</li>
          </ul>
        </Section>

        <Section title="3. Mục đích thu thập theo từng loại dữ liệu">
          <p>Chúng tôi KHÔNG thu thập dữ liệu cho một mục đích chung chung, mơ hồ. Mỗi loại dữ liệu được dùng đúng cho mục đích cụ thể sau:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><span className="font-bold text-gray-900">Họ tên, email, mật khẩu:</span> tạo và xác thực tài khoản, bảo vệ quyền truy cập vào dữ liệu của riêng bạn.</li>
            <li><span className="font-bold text-gray-900">Số điện thoại, địa chỉ:</span> liên hệ xác nhận đơn hàng và thực hiện giao hàng.</li>
            <li><span className="font-bold text-gray-900">Thông tin đơn hàng, phương thức thanh toán:</span> xử lý giao dịch mua bán, đối soát thanh toán qua cổng thanh toán trung gian.</li>
            <li><span className="font-bold text-gray-900">CCCD/CMND (nếu bạn tự nguyện cung cấp):</span> chỉ dùng để xác minh danh tính trong trường hợp cần đối chiếu khi có tranh chấp giao dịch giá trị lớn hoặc xác thực quyền lợi chương trình khách hàng thân thiết — không dùng cho mục đích nào khác.</li>
            <li><span className="font-bold text-gray-900">Ảnh đại diện:</span> cá nhân hóa hiển thị tài khoản của bạn trên giao diện.</li>
            <li><span className="font-bold text-gray-900">Cookie phiên/địa chỉ IP:</span> duy trì trạng thái đăng nhập, phát hiện và ngăn chặn hành vi truy cập bất thường.</li>
          </ul>
        </Section>

        <Section title="4. Thời gian lưu trữ dữ liệu">
          <p>
            Dữ liệu tài khoản (họ tên, email, thông tin hồ sơ) được lưu trữ trong suốt thời gian tài
            khoản của bạn còn tồn tại trên hệ thống, cho tới khi bạn yêu cầu xóa hoặc đóng tài khoản
            theo Mục 6 bên dưới.
          </p>
          <p>
            Dữ liệu giao dịch (đơn hàng, hóa đơn) có thể cần được lưu trữ lâu hơn để phục vụ đối soát,
            xử lý khiếu nại, và tuân thủ nghĩa vụ kế toán/thuế theo quy định pháp luật hiện hành —
            thời hạn cụ thể tùy theo quy định áp dụng tại thời điểm vận hành thật và không được chốt
            cứng trong tài liệu tham khảo này.
          </p>
        </Section>

        <Section title="5. Chia sẻ dữ liệu cho bên thứ ba">
          <p>
            Chúng tôi <span className="font-bold text-gray-900">KHÔNG bán, cho thuê, hay trao đổi dữ liệu cá nhân của bạn cho bất kỳ bên thứ ba nào vì mục đích quảng cáo, tiếp thị.</span>{' '}
            Dữ liệu chỉ được chia sẻ với các đơn vị xử lý kỹ thuật (data processor) sau, giới hạn đúng
            phạm vi cần thiết để vận hành dịch vụ:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><span className="font-bold text-gray-900">PayOS</span> — cổng thanh toán trung gian xử lý giao dịch chuyển khoản VietQR. Chúng tôi chuyển mã đơn hàng, số tiền, và nội dung giao dịch tới PayOS để tạo yêu cầu thanh toán; PayOS phản hồi kết quả xác nhận thanh toán về hệ thống qua webhook.</li>
            <li><span className="font-bold text-gray-900">Cloudinary</span> — dịch vụ lưu trữ và xử lý ảnh (ảnh sản phẩm, ảnh đại diện người dùng).</li>
            <li><span className="font-bold text-gray-900">Đơn vị hạ tầng lưu trữ dữ liệu</span> (cơ sở dữ liệu và bộ nhớ đệm) — lưu trữ dữ liệu vận hành của hệ thống, không truy cập dữ liệu vì mục đích riêng của họ.</li>
          </ul>
          <p>
            Chúng tôi chỉ chia sẻ dữ liệu cần thiết tối thiểu để các bên nêu trên thực hiện đúng chức
            năng kỹ thuật của họ, và yêu cầu các bên này tuân thủ nghĩa vụ bảo mật dữ liệu tương ứng.
          </p>
        </Section>

        <Section title="6. Quyền của bạn đối với dữ liệu cá nhân">
          <p>Theo tinh thần bảo vệ dữ liệu cá nhân hiện hành tại Việt Nam, bạn có các quyền sau:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><span className="font-bold text-gray-900">Quyền được biết</span> về việc dữ liệu của mình được xử lý (thể hiện qua chính chính sách này).</li>
            <li><span className="font-bold text-gray-900">Quyền đồng ý và rút lại sự đồng ý</span> đối với việc xử lý dữ liệu, đặc biệt với các trường tự nguyện như CCCD hay ảnh đại diện.</li>
            <li><span className="font-bold text-gray-900">Quyền truy cập</span> dữ liệu cá nhân của mình — thực hiện trực tiếp tại trang{' '}
              <Link href="/profile" className="underline hover:text-black">Hồ sơ cá nhân</Link>.
            </li>
            <li><span className="font-bold text-gray-900">Quyền chỉnh sửa</span> dữ liệu chưa chính xác — thực hiện trực tiếp tại trang Hồ sơ cá nhân.</li>
            <li>
              <span className="font-bold text-gray-900">Quyền xóa dữ liệu/đóng tài khoản</span> — hệ thống hiện chưa có chức năng tự xóa tài khoản trực tiếp trên giao diện; bạn có thể gửi yêu cầu qua kênh liên hệ ở Mục 8 để được hỗ trợ xử lý thủ công.
            </li>
            <li><span className="font-bold text-gray-900">Quyền yêu cầu ngừng xử lý dữ liệu</span> và quyền phản đối việc xử lý dữ liệu trong các trường hợp pháp luật cho phép.</li>
            <li><span className="font-bold text-gray-900">Quyền khiếu nại</span> tới cơ quan nhà nước có thẩm quyền về bảo vệ dữ liệu cá nhân nếu cho rằng quyền lợi của mình bị vi phạm.</li>
          </ul>
        </Section>

        <Section title="7. Biện pháp bảo mật kỹ thuật">
          <p>Hệ thống áp dụng các biện pháp kỹ thuật sau để bảo vệ dữ liệu của bạn:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Mật khẩu được băm (hash) bằng bcrypt trước khi lưu trữ, không lưu dạng văn bản thô.</li>
            <li>Phiên đăng nhập dùng JWT lưu trong cookie HttpOnly (JavaScript phía trình duyệt không đọc được), kèm cờ Secure khi vận hành trên môi trường production và SameSite để giảm rủi ro tấn công giả mạo yêu cầu.</li>
            <li>Giới hạn tần suất truy cập (rate-limiting) trên các endpoint nhạy cảm như đăng nhập, đăng ký, tra cứu đơn hàng.</li>
            <li>Kiểm tra định dạng, kích thước tệp khi tải ảnh lên hệ thống.</li>
          </ul>
        </Section>

        <Section title="8. Thay đổi chính sách và cách liên hệ">
          <p>
            Chính sách này có thể được cập nhật theo thời gian để phản ánh đúng thực tế vận hành hoặc
            thay đổi quy định pháp luật. Phiên bản cập nhật gần nhất luôn được đăng tại trang này.
          </p>
          <p>
            Nếu bạn có câu hỏi về cách dữ liệu cá nhân của mình được xử lý, hoặc muốn thực hiện bất kỳ
            quyền nào ở Mục 6, vui lòng liên hệ: <span className="font-bold text-gray-900">support@quoce.vn</span>.
          </p>
        </Section>

        <Section title="9. Căn cứ pháp lý tham chiếu">
          <p>
            Chính sách này được soạn thảo có tham chiếu tinh thần của{' '}
            <span className="font-bold text-gray-900">Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân</span>{' '}
            do Chính phủ Việt Nam ban hành.
          </p>
        </Section>

        <div className="border border-gray-200 rounded-none p-5 bg-[#fafafa] text-xs text-gray-500 leading-relaxed">
          Đây là bản soạn thảo tham khảo dựa trên khung pháp lý hiện hành, được xây dựng để minh họa
          năng lực triển khai một hệ thống tuân thủ bảo vệ dữ liệu cá nhân. Khuyến nghị rà soát bởi
          chuyên gia pháp lý trước khi áp dụng cho hoạt động kinh doanh thật. Nội dung này{' '}
          <span className="font-bold">KHÔNG PHẢI</span> tư vấn pháp lý chính thức.
        </div>
      </div>
    </div>
  );
}
