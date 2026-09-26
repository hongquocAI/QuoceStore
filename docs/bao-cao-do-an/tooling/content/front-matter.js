const L = require('../lib');
const { Paragraph, TextRun, AlignmentType, PageBreak, TableOfContents, HeadingLevel } = L;

function coverPage() {
  return [
    new Paragraph({ spacing: { before: 400 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [new TextRun({ text: '[ TÊN TRƯỜNG — TÊN KHOA ]', font: L.FONT, size: 26 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [new TextRun({ text: '[ Logo trường ]', font: L.FONT, size: 22, italics: true, color: '999999' })],
    }),
    new Paragraph({ spacing: { after: 300 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: 'BÁO CÁO ĐỒ ÁN TỐT NGHIỆP', font: L.FONT, size: 32, bold: true })],
    }),
    new Paragraph({ spacing: { after: 500 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: 'QUOCÉ', font: L.FONT, size: 56, bold: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [new TextRun({
        text: 'HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ & QUẢN LÝ DỮ LIỆU SẢN PHẨM (PIM) ENTERPRISE',
        font: L.FONT, size: 30, bold: true,
      })],
    }),
    new Paragraph({ spacing: { after: 800 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: 'Giảng viên hướng dẫn: [ ......................................... ]', font: L.FONT, size: 26 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: 'Sinh viên thực hiện: [ ......................................... ]', font: L.FONT, size: 26 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: 'MSSV: [ ......................... ]      Lớp: [ ......................... ]', font: L.FONT, size: 26 })],
    }),
    new Paragraph({ spacing: { before: 800 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: '[ Thành phố ], 2026', font: L.FONT, size: 26 })],
    }),
  ];
}

function acknowledgement() {
  return [
    new Paragraph({ children: [new PageBreak()] }),
    L.h1('LỜI CẢM ƠN'),
    L.p('[ Khung mẫu — người thực hiện tự viết lời cảm ơn tại đây. Gợi ý các ý nên có: ]'),
    L.bullet('Lời cảm ơn Nhà trường, Khoa và quý Thầy/Cô đã truyền đạt kiến thức trong suốt quá trình học tập.'),
    L.bullet('Lời cảm ơn Giảng viên hướng dẫn — nêu cụ thể sự hỗ trợ, góp ý đã nhận được trong quá trình làm đồ án.'),
    L.bullet('Lời cảm ơn gia đình, bạn bè đã đồng hành, hỗ trợ trong thời gian thực hiện đồ án.'),
    L.bullet('Lời cam đoan ngắn gọn về tính trung thực của báo cáo (nếu trường yêu cầu).'),
  ];
}

function tocPages() {
  return [
    new Paragraph({ children: [new PageBreak()] }),
    L.h1('MỤC LỤC'),
    new TableOfContents('Mục lục', { hyperlink: true, headingStyleRange: '1-3' }),

    new Paragraph({ children: [new PageBreak()] }),
    L.h1('DANH MỤC HÌNH ẢNH'),
    new TableOfContents('Danh mục hình ảnh', { captionLabel: 'Hinh' }),

    new Paragraph({ children: [new PageBreak()] }),
    L.h1('DANH MỤC BẢNG'),
    new TableOfContents('Danh mục bảng', { captionLabel: 'Bang' }),
  ];
}

function abbreviations() {
  const rows = [
    ['API', 'Application Programming Interface — giao diện lập trình ứng dụng'],
    ['CRUD', 'Create, Read, Update, Delete — 4 thao tác cơ bản trên dữ liệu'],
    ['DTO', 'Data Transfer Object — đối tượng dùng để validate/truyền dữ liệu request'],
    ['ERD', 'Entity Relationship Diagram — sơ đồ thực thể quan hệ'],
    ['FK', 'Foreign Key — khoá ngoại'],
    ['HMAC', 'Hash-based Message Authentication Code — mã xác thực dựa trên hàm băm'],
    ['JWT', 'JSON Web Token — chuẩn token dùng cho xác thực'],
    ['MDM', 'Master Data Management — quản lý dữ liệu chủ (danh mục, thương hiệu...)'],
    ['ORM', 'Object-Relational Mapping — ánh xạ đối tượng - quan hệ (Prisma)'],
    ['PIM', 'Product Information Management — quản lý thông tin sản phẩm'],
    ['RBAC', 'Role-Based Access Control — kiểm soát truy cập theo vai trò'],
    ['SDK', 'Software Development Kit — bộ công cụ phát triển phần mềm'],
    ['SEO', 'Search Engine Optimization — tối ưu hoá công cụ tìm kiếm'],
    ['SKU', 'Stock Keeping Unit — mã quản lý kho của 1 mặt hàng'],
    ['TTL', 'Time To Live — thời gian sống của 1 bản ghi cache'],
    ['UUID', 'Universally Unique Identifier — định danh duy nhất toàn cục'],
    ['VietQR', 'Chuẩn mã QR thanh toán liên ngân hàng tại Việt Nam'],
  ];
  return [
    new Paragraph({ children: [new PageBreak()] }),
    L.h1('DANH MỤC TỪ VIẾT TẮT'),
    L.dataTable(['Từ viết tắt', 'Giải thích'], rows, [1800, 7550]),
  ];
}

module.exports = { coverPage, acknowledgement, tocPages, abbreviations };
