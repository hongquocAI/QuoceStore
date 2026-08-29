/**
 * Script CHỈ THÊM (additive-only) — tạo thêm sản phẩm DEMO để test trực quan
 * Phân trang/Filter (Nhóm B) trên trang Admin và storefront.
 *
 * 🛡️ AN TOÀN TUYỆT ĐỐI: script này KHÔNG BAO GIỜ gọi deleteMany() hay xóa
 * bất kỳ dữ liệu nào. Khác hẳn `prisma/seed.ts` (dọn sạch toàn bộ DB trước
 * khi tạo lại) — TUYỆT ĐỐI KHÔNG chạy `seed.ts` hay `npx prisma migrate
 * reset` trên DB đang có dữ liệu thật (tài khoản Admin đang dùng, đơn hàng
 * #9, sản phẩm Baseus thật).
 *
 * Dùng đúng FK thật đã có sẵn trong DB (tra theo SLUG ổn định, không hard
 * code UUID — an toàn nếu DB có thay đổi id về sau). Mọi sản phẩm demo đều
 * có tiền tố "[DEMO] " trong title để dễ nhận biết và dọn sạch sau này bằng:
 *
 *   npx prisma studio  (hoặc script) rồi:
 *   await prisma.product.deleteMany({ where: { title: { startsWith: '[DEMO] ' } } });
 *
 * Idempotent: chạy lại nhiều lần không tạo trùng — check theo `slug` (unique)
 * trước khi tạo, sản phẩm đã tồn tại thì bỏ qua.
 *
 * Chạy: npx ts-node prisma/seed-demo-products.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_PREFIX = '[DEMO] ';

// Category duy nhất hiện có trong DB — tra theo slug, KHÔNG hard code id.
const CATEGORY_SLUG = 'phu-kien';
// Brand duy nhất hiện có trong DB.
const BRAND_SLUG = 'baseus';

// Mỗi subCategory THẬT đã có trong DB (tra theo slug) được gán 2 sản phẩm
// demo, đủ đa dạng để thấy rõ hiệu ứng filter theo subCategory + phân trang
// (9 subCategory x 2 = 18 sản phẩm demo, cộng 1 sản phẩm thật có sẵn = 19
// tổng, đủ cho 2 trang với limit mặc định 20... nên set limit=10 khi test
// trên Admin để thấy rõ >1 trang).
const DEMO_BY_SUBCATEGORY_SLUG: Record<string, Array<{ title: string; price: number; stock: number }>> = {
  'sac-du-phong': [
    { title: 'Sạc dự phòng 10.000mAh Mini bỏ túi', price: 259000, stock: 40 },
    { title: 'Sạc dự phòng 20.000mAh Sạc nhanh 65W', price: 459000, stock: 25 },
  ],
  'cap-sac': [
    { title: 'Cáp sạc Type-C to Type-C 100W bện dù', price: 99000, stock: 80 },
    { title: 'Cáp sạc Lightning to USB-A 1.2m', price: 89000, stock: 60 },
  ],
  loa: [
    { title: 'Loa Bluetooth Mini chống nước IPX7', price: 349000, stock: 30 },
    { title: 'Loa Soundbar để bàn công suất lớn', price: 599000, stock: 15 },
  ],
  'tai-nghe': [
    { title: 'Tai nghe Bluetooth True Wireless', price: 399000, stock: 35 },
    { title: 'Tai nghe chụp tai chống ồn chủ động', price: 799000, stock: 20 },
  ],
  webcam: [
    { title: 'Webcam Full HD 1080p tích hợp mic', price: 449000, stock: 22 },
    { title: 'Webcam 4K tự động lấy nét', price: 990000, stock: 12 },
  ],
  'lot-chuot': [
    { title: 'Lót chuột Gaming cỡ lớn full desk', price: 129000, stock: 50 },
    { title: 'Lót chuột da PU cao cấp chống trượt', price: 179000, stock: 40 },
  ],
  'cu-sac': [
    { title: 'Củ sạc nhanh PD 20W siêu nhỏ gọn', price: 149000, stock: 70 },
    { title: 'Củ sạc GaN 65W 3 cổng đa năng', price: 399000, stock: 30 },
  ],
  'gia-do': [
    { title: 'Giá đỡ điện thoại để bàn gập gọn', price: 79000, stock: 90 },
    { title: 'Giá đỡ laptop tản nhiệt điều chỉnh góc', price: 299000, stock: 25 },
  ],
  chuot: [
    { title: 'Chuột không dây Silent Click 2.4G', price: 199000, stock: 45 },
    { title: 'Chuột Gaming RGB 6 nút lập trình', price: 349000, stock: 28 },
  ],
};

// Cùng thuật toán slugify đã dùng ở admin/products/page.tsx (Frontend).
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

async function main() {
  const category = await prisma.category.findUnique({ where: { slug: CATEGORY_SLUG } });
  const brand = await prisma.brand.findUnique({ where: { slug: BRAND_SLUG } });

  if (!category) throw new Error(`Không tìm thấy Category với slug "${CATEGORY_SLUG}" — kiểm tra lại DB.`);
  if (!brand) throw new Error(`Không tìm thấy Brand với slug "${BRAND_SLUG}" — kiểm tra lại DB.`);

  let created = 0;
  let skipped = 0;

  for (const [subSlug, items] of Object.entries(DEMO_BY_SUBCATEGORY_SLUG)) {
    const subCategory = await prisma.subCategory.findUnique({ where: { slug: subSlug } });
    if (!subCategory) {
      console.warn(`⚠️  Bỏ qua — không tìm thấy subCategory với slug "${subSlug}"`);
      continue;
    }

    for (const item of items) {
      const fullTitle = `${DEMO_PREFIX}${item.title}`;
      const slug = slugify(fullTitle);

      const existing = await prisma.product.findUnique({ where: { slug } });
      if (existing) {
        skipped++;
        continue;
      }

      const sku = `DEMO-${slugify(item.title).toUpperCase().replace(/-/g, '').slice(0, 12)}-${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`;

      await prisma.product.create({
        data: {
          title: fullTitle,
          slug,
          sku,
          description:
            'Đây là sản phẩm DEMO được tạo để kiểm tra trực quan chức năng phân trang/lọc — KHÔNG PHẢI hàng thật, có thể xóa bất cứ lúc nào.',
          price: item.price,
          stock: item.stock,
          images: [],
          isActive: true,
          categoryId: category.id,
          subCategoryId: subCategory.id,
          brandId: brand.id,
        },
      });
      created++;
    }
  }

  console.log(`✅ Đã tạo mới: ${created} sản phẩm demo. Bỏ qua (đã tồn tại từ lần chạy trước): ${skipped}.`);
}

main()
  .catch((err) => {
    console.error('❌ Lỗi khi tạo dữ liệu demo:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
