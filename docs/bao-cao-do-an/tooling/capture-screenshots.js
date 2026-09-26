// Script noi bo (KHONG phai code san pham) de tu dong chup anh giao dien
// that phuc vu bao cao do an. Dung Chrome co san tren may qua puppeteer-core.
// KHONG tao/sua/xoa du lieu that trong DB - chi doc va dieu huong trinh duyet.
require('dotenv').config({ path: 'D:/Projects/quoce_store/backend/.env' });
const path = require('path');
const puppeteer = require('puppeteer-core');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require(path.join('D:/Projects/quoce_store/backend/node_modules/@prisma/client'));

const prisma = new PrismaClient();
const FE = 'http://localhost:3000';
const OUT = path.join(__dirname, '..', 'screenshots');

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
}

// AuthContext.login()/setItem luu dung format nay vao localStorage['user']
// (chi cache ho so hien thi, KHONG chua token that). orders/page.tsx doc
// truc tiep key nay de quyet dinh redirect (khong qua AuthContext) - phai
// seed dung field de trang khong tuong nham la chua dang nhap.
function localStorageUserPayload(u) {
  return JSON.stringify({ id: u.id, email: u.email, fullName: u.fullName, role: u.role });
}

async function newPersonaPage(browser, token, user) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setCacheEnabled(false);
  await page.setViewport({ width: 1440, height: 900 });
  page.setDefaultNavigationTimeout(30000);
  if (token) {
    await ctx.setCookie({ name: 'accessToken', value: token, domain: 'localhost', path: '/', httpOnly: true });
    // Seed truoc khi vao trang can auth, tranh quirk orders/page.tsx doc
    // localStorage['user'] truc tiep thay vi qua AuthContext/cookie.
    await page.goto(`${FE}/`, { waitUntil: 'networkidle0' });
    if (user) {
      await page.evaluate((val) => localStorage.setItem('user', val), localStorageUserPayload(user));
    }
  }
  return { ctx, page };
}

async function clickByText(page, tag, text) {
  return page.evaluate((tag, text) => {
    const els = [...document.querySelectorAll(tag)];
    const el = els.find((e) => e.textContent && e.textContent.includes(text));
    if (el) { el.click(); return true; }
    return false;
  }, tag, text);
}

async function shot(page, filename, opts = {}) {
  await page.screenshot({ path: path.join(OUT, filename), fullPage: opts.fullPage ?? true });
  console.log('  ->', filename);
}

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const customer = await prisma.user.findFirst({ where: { role: 'CUSTOMER', isActive: true, email: { not: 'guest@quoce.vn' } } });
  const product = await prisma.product.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' } });
  if (!admin || !customer || !product) throw new Error('Thieu du lieu that can thiet (admin/customer/product) de chup anh');
  console.log('admin:', admin.email, '| customer:', customer.email, '| product slug:', product.slug);

  const adminToken = signToken(admin);
  const customerToken = signToken(customer);

  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
  });

  try {
    // ================= GUEST (khong cookie) =================
    const { ctx: guestCtx, page: gp } = await newPersonaPage(browser, null, null);

    await gp.goto(`${FE}/`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 800));
    await shot(gp, '01-trang-chu.png');

    await gp.goto(`${FE}/product/${product.slug}`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 800));
    await shot(gp, '02-chi-tiet-san-pham.png');

    await gp.goto(`${FE}/login`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 500));
    await shot(gp, '03-dang-nhap.png', { fullPage: false });

    await gp.evaluate((p) => {
      const item = { id: p.id, title: p.title, price: Number(p.price), thumbnail: p.thumbnail || '', quantity: 2 };
      localStorage.setItem('cart', JSON.stringify([item]));
    }, product);
    await gp.goto(`${FE}/cart`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 800));
    await shot(gp, '04-gio-hang.png');

    await gp.goto(`${FE}/checkout`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 800));
    await shot(gp, '05-checkout.png');

    await gp.goto(`${FE}/orders/lookup`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 500));
    await shot(gp, '06-tra-cuu-don-hang.png', { fullPage: false });

    await gp.goto(`${FE}/terms`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 500));
    await shot(gp, '07-dieu-khoan.png');

    await guestCtx.close();

    // ================= CUSTOMER =================
    // Tai khoan customer-test chua co don hang/dia chi thuc nao (DB that,
    // khong bia du lieu) -> chi dung cho anh "So dia chi" (trang thai rong
    // trung thuc). Anh "Lich su don hang" dung tai khoan ADMIN vi tai khoan
    // nay co san don hang THAT tu qua trinh kiem thu truoc do (xem
    // PROGRESS.md) - van la du lieu that, khong tao moi.
    const { ctx: custCtx, page: cp } = await newPersonaPage(browser, customerToken, customer);

    await cp.goto(`${FE}/addresses`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 900));
    await shot(cp, '09-so-dia-chi.png');

    await custCtx.close();

    // ================= ADMIN =================
    const { ctx: adminCtx, page: ap } = await newPersonaPage(browser, adminToken, admin);

    await ap.goto(`${FE}/orders`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 900));
    await shot(ap, '08-lich-su-don-hang.png', { fullPage: false });

    await ap.goto(`${FE}/admin/products`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1200));
    await shot(ap, '10-admin-san-pham.png');

    const openedCreate = await clickByText(ap, 'button', 'THÊM SẢN PHẨM MỚI');
    if (openedCreate) {
      await new Promise((r) => setTimeout(r, 700));
      await shot(ap, '11-admin-modal-them-san-pham.png');
    } else {
      console.log('  !! Khong tim thay nut "Them san pham", bo qua anh 11');
    }

    await ap.goto(`${FE}/admin/orders`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1200));
    await shot(ap, '12-admin-don-hang.png');

    const openedDetail = await clickByText(ap, 'button', 'Chi tiết');
    if (openedDetail) {
      await new Promise((r) => setTimeout(r, 700));
      await shot(ap, '13-admin-modal-chi-tiet-don.png');
    } else {
      console.log('  !! Khong tim thay nut "Chi tiet" (co the chua co don nao), bo qua anh 13');
    }

    await adminCtx.close();

    console.log('\nHoan tat chup anh. Khong tao/sua/xoa du lieu DB nao trong qua trinh nay.');
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
