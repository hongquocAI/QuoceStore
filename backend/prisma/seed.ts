import { PrismaClient, Role, Gender } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Đang dọn dẹp dữ liệu cũ trên database...');

  // Dọn dẹp theo thứ tự khóa ngoại để tránh vi phạm ràng buộc
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.subCategory.deleteMany(); // ⚡ MỚI
  await prisma.brand.deleteMany();       // ⚡ MỚI
  await prisma.category.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Đã dọn dẹp sạch sẽ.');

  // 1. Tạo tài khoản Admin mẫu
  const hashedPassword = await bcrypt.hash('123456', 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@quoce.vn', // ⚡ FIX: dọn branding "apexstore" cũ
      passwordHash: hashedPassword,
      fullName: 'System Administrator',
      role: Role.ADMIN,
      phone: '0901234567',
      gender: Gender.NAM, // ⚡ giờ là enum thật, không còn string tự do
    },
  });
  console.log('👤 Đã khởi tạo tài khoản Admin:', adminUser.email);

  // 2. Tạo Category mẫu
  const category = await prisma.category.create({
    data: {
      name: 'Phụ kiện công nghệ',
      slug: 'phu-kien',
      description: 'Hệ sinh thái phụ kiện hiệu suất cao tối giản.',
    },
  });
  console.log('📁 Đã khởi tạo Category:', category.name);

  // 3. ⚡ MỚI: Tạo SubCategory quan hệ thật (thay vì string tự do như trước)
  const subCategory = await prisma.subCategory.create({
    data: {
      name: 'Sạc dự phòng',
      slug: 'sac-du-phong',
      categoryId: category.id,
    },
  });
  console.log('📂 Đã khởi tạo SubCategory:', subCategory.name);

  // Thêm vài subcategory khác khớp với danh sách filter ở AccessoriesPage
  // (cap-sac, cu-sac, tai-nghe...) để trang đó hoạt động đúng sau khi
  // fix bug filter (trước đây so sai category.slug với subcategory).
  const otherSubCategories = await Promise.all(
    [
      { name: 'Cáp sạc', slug: 'cap-sac' },
      { name: 'Củ sạc', slug: 'cu-sac' },
      { name: 'Lót chuột', slug: 'lot-chuot' },
      { name: 'Giá đỡ', slug: 'gia-do' },
      { name: 'Tai nghe', slug: 'tai-nghe' },
      { name: 'Chuột', slug: 'chuot' },
      { name: 'Loa', slug: 'loa' },
      { name: 'Webcam', slug: 'webcam' },
    ].map((sc) => prisma.subCategory.create({ data: { ...sc, categoryId: category.id } })),
  );
  console.log(`📂 Đã khởi tạo thêm ${otherSubCategories.length} SubCategory khác.`);

  // 4. ⚡ MỚI: Tạo Brand quan hệ thật (thay vì brandSlug/brandName string tự do)
  const brand = await prisma.brand.create({
    data: {
      name: 'Baseus',
      slug: 'baseus',
    },
  });
  console.log('🏷️  Đã khởi tạo Brand:', brand.name);

  // 5. Chuẩn hóa đường dẫn Cloudinary theo cấu trúc phân tầng — giờ dùng
  // .slug từ các bảng quan hệ thật thay vì field string trên Product.
  const cloudBaseUrl = `https://res.cloudinary.com/xrihnkhg/image/upload/quoce-store/products/${category.slug}/${subCategory.slug}/${brand.slug}/baseus-enerfill-fc5`;

  const sampleProduct = await prisma.product.create({
    data: {
      title: 'Pin sạc dự phòng Baseus Enerfill FC5',
      slug: 'baseus-enerfill-fc5',
      sku: 'QUO-BASEUS-FC51',
      // ⚡ FIX: dùng FK thật thay vì string
      categoryId: category.id,
      subCategoryId: subCategory.id,
      brandId: brand.id,
      description:
        'Sạc dự phòng dung lượng cao, hỗ trợ sạc nhanh PD 65W thiết kế tối giản, vỏ nhôm cao cấp.',
      price: 429000,
      originalPrice: 590000,
      stock: 50,
      thumbnail: `${cloudBaseUrl}/thumbnail/main.jpg`,
      images: [`${cloudBaseUrl}/thumbnail/main.jpg`],
      highlights: [
        'Công nghệ sạc nhanh PD 65W',
        'Dung lượng thực tế 20000mAh',
        'Màn hình LED hiển thị % pin trực quan',
      ],
      specs: {
        material: 'Aluminum Alloy',
        input: 'Type-C 65W',
        output: 'Dual Type-C + USB-A',
        weight: '340g',
      },
      variants: {
        create: [
          {
            colorCode: 'black',
            colorName: 'Đen nhám',
            hexCode: '#111111',
            price: 429000,
            stock: 30,
            images: [`${cloudBaseUrl}/variants/black/black-01.jpg`],
          },
          {
            colorCode: 'white',
            colorName: 'Trắng sứ',
            hexCode: '#FFFFFF',
            price: 429000,
            stock: 20,
            images: [`${cloudBaseUrl}/variants/white/white-01.jpg`],
          },
        ],
      },
    },
  });

  console.log('📦 Đã khởi tạo Product mẫu với FK quan hệ thật:', sampleProduct.title);
  console.log('✨ Seed dữ liệu hoàn tất thành công!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi trong quá trình seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });