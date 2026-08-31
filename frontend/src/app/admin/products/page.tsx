"use client";
import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import { Paginated } from '@/types';

interface Category {
  id: string;
  name: string;
  slug: string;
}

// ⚡ MỚI (Phase 1)
interface SubCategory {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
}

// ⚡ MỚI (Phase 1)
interface Brand {
  id: string;
  name: string;
  slug: string;
}

interface Variant {
  id?: string;
  colorCode: string; 
  colorName: string; 
  hexCode: string;   
  price: number;
  stock: number;
  images: string[];
}

interface Product {
  id: string;
  title: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  thumbnail: string;
  images: string[];
  isActive: boolean;
  categoryId: string;
  subCategoryId: string; // ⚡ FIX: thay subCategorySlug
  brandId: string;       // ⚡ FIX: thay brandSlug/brandName
  category?: Category;
  subCategory?: SubCategory;
  brand?: Brand;
  variants?: Variant[];
  highlights?: string[];
  specs?: Record<string, any>;
}

const STANDARD_COLORS = [
  { code: 'black', name: 'Đen nhám', hex: '#111111' },
  { code: 'white', name: 'Trắng sứ', hex: '#FFFFFF' },
  { code: 'silver', name: 'Bạc ánh kim', hex: '#E0E0E0' },
  { code: 'titanium', name: 'Titan Tự Nhiên', hex: '#8F8B82' },
  { code: 'blue', name: 'Xanh dương', hex: '#1D4ED8' },
  { code: 'purple', name: 'Tím đậm', hex: '#581C87' },
  { code: 'gold', name: 'Vàng đồng', hex: '#D97706' },
];

// ⚡ Cảnh báo tồn kho thấp (Nhóm F) — ngưỡng cố định, chỉ dùng để HIỂN THỊ ở
// bảng Admin, không đổi schema/API. Không dùng Product.stock cho sản phẩm CÓ
// variant vì đó không phải kho thật đang bán (OrdersService trừ kho ở
// ProductVariant.stock khi khách chọn màu) — xem PROGRESS.md.
const LOW_STOCK_THRESHOLD = 5;

function getStockBadge(stock: number): { label: string; className: string } | null {
  if (stock === 0) return { label: 'Hết hàng', className: 'bg-red-100 text-red-800' };
  if (stock < LOW_STOCK_THRESHOLD) return { label: `Sắp hết: ${stock}`, className: 'bg-amber-100 text-amber-800' };
  return null;
}

// ⚡ UX form Admin (mục 2b) — trích ra dùng chung cho modal quick-add
// SubCategory/Brand, thay vì lặp lại 2 lần như code cũ.
function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function AdminProductsPage() {
  // ⚡ Nhóm G Đợt 1: guard role ADMIN + redirect đã dồn về
  // app/admin/layout.tsx (AdminGuard) — component này chỉ mount khi chắc
  // chắn đã xác thực ADMIN, không cần tự check lại `user`/`authLoading`.
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]); // ⚡ MỚI
  const [brands, setBrands] = useState<Brand[]>([]); // ⚡ MỚI
  const [loading, setLoading] = useState(true);
  // Tách riêng trạng thái tải BẢNG sản phẩm khỏi `loading` (tải master data
  // lần đầu) — nếu dùng chung, mỗi lần đổi trang/gõ tìm kiếm sẽ nuốt cả giao
  // diện vào màn hình "ĐANG TẢI..." toàn trang, mất luôn ô tìm kiếm đang gõ.
  const [productsLoading, setProductsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // ⚡ Nhóm B — PHÂN TRANG SERVER-SIDE:
  // Trước đây trang này tải TOÀN BỘ sản phẩm rồi lọc + cắt trang ở client.
  // Nay mọi thứ (search, 3 filter, phân trang) đều do backend làm; state dưới
  // đây chỉ còn là tham số gửi lên API.
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedSubCategoryFilter, setSelectedSubCategoryFilter] = useState('ALL');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const itemsPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  // ⚡ UX form Admin (mục 2b): khóa nút Submit trong lúc lưu, tránh double-submit
  const [submitting, setSubmitting] = useState(false);
  // ⚡ UX form Admin (mục 2b): mini-modal quick-add SubCategory/Brand, thay
  // window.prompt() thô. `submitting` riêng cho mini-modal này.
  const [quickAddModal, setQuickAddModal] = useState<{
    type: 'subCategory' | 'brand';
    name: string;
    logoUrl: string;
    submitting: boolean;
  } | null>(null);
  // ⚡ UX form Admin (mục 2b): snapshot formData lúc mở modal, để cảnh báo
  // mất dữ liệu nếu đóng modal mà có thay đổi chưa lưu.
  const [initialFormDataSnapshot, setInitialFormDataSnapshot] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    sku: '',
    categoryId: '',
    subCategoryId: '', // ⚡ FIX: thay subCategorySlug
    brandId: '',        // ⚡ FIX: thay brandSlug/brandName
    description: '',
    price: '',
    originalPrice: '',
    stock: '50',
    thumbnail: '',
    images: [] as string[],
    isActive: true,
    variants: [] as Variant[],
    highlightsText: '',
    specsText: '{\n  "material": "Aluminum Alloy",\n  "input": "Type-C 65W",\n  "output": "Dual Type-C + USB-A"\n}',
  });

  // ⚡ MỚI: SubCategory hiển thị trong dropdown phải lọc theo Category đang
  // chọn — đây chính là "dropdown phụ thuộc" đúng tinh thần MDM.
  const filteredSubCategories = subCategories.filter((sc) => sc.categoryId === formData.categoryId);

  // ⚡ UX form Admin (mục 2b): validate JSON specsText NGAY KHI GÕ, không đợi
  // tới lúc Submit mới báo lỗi. handleSubmit vẫn giữ nguyên try/catch JSON.parse
  // làm lớp chặn cuối cùng (phòng khi giá trị này chưa kịp cập nhật).
  const specsError = useMemo(() => {
    try {
      JSON.parse(formData.specsText || '{}');
      return null;
    } catch (e: any) {
      return e.message as string;
    }
  }, [formData.specsText]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // ⚡ Nhóm B: tách làm 2 — dữ liệu dropdown (Category/SubCategory/Brand) chỉ
  // cần nạp MỘT LẦN, còn danh sách sản phẩm phải nạp lại mỗi khi đổi
  // trang/filter/search. Gộp chung như trước sẽ tải lại 3 bảng master data
  // vô ích ở mỗi lần bấm "Trang sau".
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [catRes, subCatRes, brandRes] = await Promise.all([
        api.get('/products/categories'),
        api.get('/sub-categories'),
        api.get('/brands'),
      ]);
      setCategories(catRes.data);
      setSubCategories(subCatRes.data);
      setBrands(brandRes.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setMessage({ type: 'error', text: 'BẠN KHÔNG CÓ QUYỀN TRUY CẬP DỮ LIỆU NÀY.' });
      } else {
        setMessage({ type: 'error', text: 'Không thể tải dữ liệu quản trị sản phẩm.' });
      }
    } finally {
      setLoading(false);
    }
  };

  // ⚡ Nhóm B: chống dội request — mỗi ký tự gõ vào ô tìm kiếm KHÔNG bắn ngay
  // 1 request lên server nữa (trước đây lọc ở client nên không thành vấn đề).
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // đổi từ khóa thì luôn quay về trang 1
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ⚡ Nhóm B: nạp danh sách sản phẩm theo trang + filter, hoàn toàn server-side.
  const fetchProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      // ❗ ValidationPipe backend bật forbidNonWhitelisted: gửi param không
      // khai báo trong QueryProductDto sẽ ăn 400. Vì vậy CHỈ đính kèm param
      // khi thực sự có lọc — tuyệt đối không gửi sentinel 'ALL' lên server.
      const params: Record<string, string | number> = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (selectedCategoryFilter !== 'ALL') params.categoryId = selectedCategoryFilter;
      if (selectedSubCategoryFilter !== 'ALL') params.subCategoryId = selectedSubCategoryFilter;
      if (selectedBrandFilter !== 'ALL') params.brandId = selectedBrandFilter;

      const res = await api.get<Paginated<Product>>('/products/admin/all', { params });
      setProducts(Array.isArray(res.data?.items) ? res.data.items : []);
      setTotalPages(res.data?.totalPages ?? 1);
      setTotalProducts(res.data?.total ?? 0);

      // Ca biên: xóa bản ghi cuối cùng của trang cuối làm currentPage vượt quá
      // số trang còn lại -> bảng sẽ trắng trơn. Lùi về trang cuối hợp lệ,
      // effect bên dưới sẽ tự nạp lại.
      if (res.data?.totalPages && currentPage > res.data.totalPages) {
        setCurrentPage(res.data.totalPages);
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setMessage({ type: 'error', text: 'BẠN KHÔNG CÓ QUYỀN TRUY CẬP DỮ LIỆU NÀY.' });
      } else {
        setMessage({ type: 'error', text: 'Không thể tải danh sách sản phẩm.' });
      }
    } finally {
      setProductsLoading(false);
    }
  }, [
    currentPage,
    debouncedSearch,
    selectedCategoryFilter,
    selectedSubCategoryFilter,
    selectedBrandFilter,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ⚡ UX form Admin (mục 2b) — trích SKU-gen ra hàm thuần, dùng chung cho
  // handleTitleChange (tự động khi gõ Tên) VÀ nút "Sinh lại mã khác" (khi
  // đổi Brand sau khi đã gõ Tên — bug cũ: SKU không cập nhật lại prefix).
  const generateSku = (title: string, brandId: string): string => {
    const slugForSku = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/([^0-9a-z-\s])/g, '')
      .replace(/(\s+)/g, '-');
    const shortSlugPart = slugForSku.split('-').slice(0, 3).join('-').slice(0, 12).toUpperCase();
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const selectedBrand = brands.find((b) => b.id === brandId);
    const brandPrefix = (selectedBrand?.slug || 'GEN').toUpperCase();
    return `QUO-${brandPrefix}-${shortSlugPart}-${randomSuffix}`;
  };

  // ⚡ Thuật toán sinh Slug an toàn, chống tràn khi tên quá dài. SKU giờ tách
  // riêng qua generateSku() ở trên (ô SKU đã readOnly, không còn gõ tay được).
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const generatedSlug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/([^0-9a-z-\s])/g, '')
      .replace(/(\s+)/g, '-');

    setFormData(prev => ({
      ...prev,
      title,
      slug: generatedSlug,
      sku: generateSku(title, prev.brandId),
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // ⚡ Chọn Danh mục chính từ Database Categories động
  const handleCategorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const catId = e.target.value;
    setFormData(prev => ({
      ...prev,
      categoryId: catId,
      subCategoryId: '', // ⚡ FIX: reset lựa chọn cũ vì list SubCategory đã đổi theo Category mới
    }));
  };

  // ⚡ UX form Admin (mục 2b) — thay window.prompt() thô bằng modal quick-add
  // đàng hoàng (state quickAddModal, JSX render ở cuối file). Nút "+ Thêm
  // mới" chỉ mở/đóng mini-modal lồng bên trong, hàm dưới đây submit thật.
  const handleQuickAddSubmit = async () => {
    if (!quickAddModal) return;
    const name = quickAddModal.name.trim();
    if (!name) return;
    const slug = generateSlugFromName(name);
    setQuickAddModal(prev => (prev ? { ...prev, submitting: true } : prev));

    try {
      if (quickAddModal.type === 'subCategory') {
        const res = await api.post('/sub-categories', { name, slug, categoryId: formData.categoryId });
        setSubCategories(prev => [...prev, res.data]);
        setFormData(prev => ({ ...prev, subCategoryId: res.data.id }));
        setMessage({ type: 'success', text: `Đã tạo danh mục con "${name}" thành công!` });
      } else {
        const payload: { name: string; slug: string; logoUrl?: string } = { name, slug };
        if (quickAddModal.logoUrl.trim()) payload.logoUrl = quickAddModal.logoUrl.trim();
        const res = await api.post('/brands', payload);
        setBrands(prev => [...prev, res.data]);
        setFormData(prev => ({ ...prev, brandId: res.data.id }));
        setMessage({ type: 'success', text: `Đã tạo thương hiệu "${name}" thành công!` });
      }
      setQuickAddModal(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Không thể tạo mới.' });
      setQuickAddModal(prev => (prev ? { ...prev, submitting: false } : prev));
    }
  };

  const getDynamicFolder = (type: 'thumbnail' | 'gallery' | 'variant', colorCode?: string) => {
    // ⚡ FIX: tra slug thật từ danh sách đã load (category/subCategory/brand
    // giờ là quan hệ, không còn field string trực tiếp trên formData)
    const cat = categories.find(c => c.id === formData.categoryId)?.slug || 'phu-kien';
    const subCat = subCategories.find(sc => sc.id === formData.subCategoryId)?.slug || 'general';
    const brand = brands.find(b => b.id === formData.brandId)?.slug || 'general';
    const prodSlug = formData.slug || 'general-product';

    const base = `quoce-store/products/${cat}/${subCat}/${brand}/${prodSlug}`;
    if (type === 'variant' && colorCode) {
      return `${base}/variants/${colorCode}`;
    }
    return `${base}/thumbnail`;
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!formData.slug) {
      alert('Vui lòng nhập Tên sản phẩm để tạo Slug trước khi tải ảnh!');
      return;
    }

    setUploadingThumbnail(true);
    const folderPath = getDynamicFolder('thumbnail');
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const res = await api.post('/upload', uploadData, {
        params: { folder: folderPath },
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data.url;
      setFormData(prev => ({ ...prev, thumbnail: url }));
      setMessage({ type: 'success', text: 'TẢI THUMBNAIL VÀO ĐÚNG THƯ MỤC CLOUDINARY THÀNH CÔNG!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Không thể tải ảnh lên đám mây.' });
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!formData.slug) {
      alert('Vui lòng nhập Tên sản phẩm để tạo Slug trước khi tải ảnh phụ!');
      return;
    }

    const folderPath = getDynamicFolder('gallery');
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const res = await api.post(`/upload`, uploadData, {
        params: { folder: folderPath },
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data.url;
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, url]
      }));
      setMessage({ type: 'success', text: 'ĐÃ THÊM ẢNH PHỤ VÀO THƯ MỤC ENTERPRISE THÀNH CÔNG!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Không thể tải ảnh phụ lên đám mây.' });
    }
  };

  const handleRemoveGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleVariantImageUpload = async (variantIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!formData.slug) {
      alert('Vui lòng nhập Tên sản phẩm để tạo Slug trước khi tải ảnh biến thể!');
      return;
    }

    const currentVariant = formData.variants[variantIndex];
    const colorCode = currentVariant?.colorCode || 'default';
    const folderPath = getDynamicFolder('variant', colorCode);

    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const res = await api.post(`/upload`, uploadData, {
        params: { folder: folderPath },
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data.url;

      // 🛡️ FIX BUG (mục 2b, phát hiện qua test tay): tính updatedVariants từ
      // `formData.variants` (đọc từ closure ngoài) thay vì `prev.variants`
      // trong functional updater khiến ảnh thứ 2 trở đi cho CÙNG 1 variant bị
      // GHI ĐÈ thay vì append — nếu 2 lượt upload cùng variant chồng lấn thời
      // gian (upload sau resolve trong khi state của upload trước chưa kịp
      // render lại), lượt sau đọc lại đúng mảng images CŨ (chưa có ảnh 1) rồi
      // set đè, mất luôn ảnh vừa thêm dù Cloudinary đã lưu cả 2 (thấy đủ 2
      // ảnh trong folder, chỉ UI hiển thị thiếu). Luôn tính trên `prev` —
      // React đảm bảo các functional updater áp dụng tuần tự trên state mới
      // nhất, không bao giờ mất update dù có đua race.
      setFormData(prev => {
        const updatedVariants = [...prev.variants];
        updatedVariants[variantIndex] = {
          ...updatedVariants[variantIndex],
          images: [...(updatedVariants[variantIndex].images || []), url],
        };
        return { ...prev, variants: updatedVariants };
      });
      setMessage({ type: 'success', text: `TẢI ẢNH CHO BIẾN THỂ [${colorCode.toUpperCase()}] THÀNH CÔNG!` });
    } catch (err) {
      setMessage({ type: 'error', text: 'Không thể tải ảnh biến thể màu.' });
    }
  };

  const handleRemoveVariantImage = (variantIndex: number, imgIndex: number) => {
    // Cùng nguyên tắc fix ở trên — tính trên `prev.variants`, không đọc
    // `formData.variants` từ closure ngoài.
    setFormData(prev => {
      const updatedVariants = [...prev.variants];
      updatedVariants[variantIndex] = {
        ...updatedVariants[variantIndex],
        images: updatedVariants[variantIndex].images.filter((_, i) => i !== imgIndex),
      };
      return { ...prev, variants: updatedVariants };
    });
  };

  const handleAddVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          colorCode: STANDARD_COLORS[0].code,
          colorName: STANDARD_COLORS[0].name,
          hexCode: STANDARD_COLORS[0].hex,
          price: parseFloat(prev.price) || 0,
          stock: 10,
          images: [],
        }
      ]
    }));
  };

  const handleVariantChange = (index: number, field: keyof Variant, value: any) => {
    const updatedVariants = [...formData.variants];
    if (field === 'colorCode') {
      const selectedColorObj = STANDARD_COLORS.find(c => c.code === value);
      if (selectedColorObj) {
        updatedVariants[index] = {
          ...updatedVariants[index],
          colorCode: selectedColorObj.code,
          colorName: selectedColorObj.name,
          hexCode: selectedColorObj.hex,
        };
      }
    } else {
      updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    }
    setFormData(prev => ({ ...prev, variants: updatedVariants }));
  };

  const handleRemoveVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setCurrentId(null);
    const initial = {
      title: '',
      slug: '',
      sku: '',
      categoryId: categories[0]?.id || '',
      subCategoryId: '',
      brandId: brands[0]?.id || '',
      description: '',
      price: '',
      originalPrice: '',
      stock: '50',
      thumbnail: '',
      images: [] as string[],
      isActive: true,
      variants: [
        { colorCode: 'black', colorName: 'Đen nhám', hexCode: '#111111', price: 0, stock: 25, images: [] },
        { colorCode: 'white', colorName: 'Trắng sứ', hexCode: '#FFFFFF', price: 0, stock: 25, images: [] }
      ] as Variant[],
      highlightsText: '• Công nghệ sạc nhanh PD 65W\n• Dung lượng thực tế 20000mAh\n• Màn hình LED hiển thị % pin',
      specsText: '{\n  "material": "Aluminum Alloy",\n  "input": "Type-C 65W",\n  "output": "Dual Type-C + USB-A"\n}',
    };
    setFormData(initial);
    setInitialFormDataSnapshot(JSON.stringify(initial)); // ⚡ UX (mục 2b): snapshot cho cảnh báo đóng modal chưa lưu
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setIsEditing(true);
    setCurrentId(product.id);
    const initial = {
      title: product.title,
      slug: product.slug,
      sku: product.sku || '',
      categoryId: product.categoryId,
      subCategoryId: product.subCategoryId, // ⚡ FIX: dùng trực tiếp FK, product đã include quan hệ đầy đủ từ backend
      brandId: product.brandId,
      description: product.description,
      price: product.price.toString(),
      originalPrice: product.originalPrice ? product.originalPrice.toString() : '',
      stock: product.stock.toString(),
      thumbnail: product.thumbnail || '',
      images: product.images || [],
      isActive: product.isActive,
      variants: product.variants || [],
      highlightsText: Array.isArray(product.highlights) ? product.highlights.join('\n') : '',
      specsText: product.specs ? JSON.stringify(product.specs, null, 2) : '{}',
    };
    setFormData(initial);
    setInitialFormDataSnapshot(JSON.stringify(initial)); // ⚡ UX (mục 2b): snapshot cho cảnh báo đóng modal chưa lưu
    setIsModalOpen(true);
  };

  // ⚡ UX form Admin (mục 2b): đóng modal có xác nhận nếu formData đã đổi so
  // với lúc mở — tránh Admin lỡ tay mất dữ liệu đã gõ. So sánh bằng
  // JSON.stringify vì formData không chứa function/Date, đủ tin cậy ở đây.
  const handleCloseModal = () => {
    if (JSON.stringify(formData) !== initialFormDataSnapshot) {
      if (!window.confirm('Bạn có thay đổi chưa lưu. Đóng mà không lưu?')) return;
    }
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setSubmitting(true); // ⚡ UX (mục 2b): khóa nút Submit, tránh double-submit

    try {
      // Parse highlights từ textarea (mỗi dòng là một phần tử mảng)
      const highlightsArray = formData.highlightsText
        ? formData.highlightsText.split('\n').map(item => item.trim()).filter(Boolean)
        : [];

      // Parse specs từ chuỗi JSON an toàn
      let parsedSpecs = {};
      try {
        parsedSpecs = formData.specsText ? JSON.parse(formData.specsText) : {};
      } catch (err) {
        throw new Error('Định dạng JSON trong thông số kỹ thuật (Specs) không hợp lệ.');
      }

      // 🛡️ FIX BUG 400 "variants.0.property id should not exist":
      // handleOpenEdit nạp nguyên object variant đọc từ GET /products/:slug,
      // kèm theo id/productId/createdAt/updatedAt. ProductVariantDto ở backend
      // CHỈ chấp nhận đúng 6 field dưới đây, và ValidationPipe đang bật
      // forbidNonWhitelisted nên mọi field thừa đều làm request bị từ chối.
      //
      // Map TƯỜNG MINH thay vì destructuring kiểu ({ id, ...rest }) => rest —
      // để sau này bảng ProductVariant có thêm cột mới thì payload không tự
      // động rò field lạ lên API và vỡ lại đúng lỗi này.
      const sanitizedVariants = formData.variants.map((v) => ({
        colorCode: v.colorCode,
        colorName: v.colorName,
        hexCode: v.hexCode,
        price: Number(v.price) || 0,
        stock: Number(v.stock) || 0,
        images: v.images ?? [],
      }));

    const basePayload = {
      title: formData.title,
      sku: formData.sku,
      categoryId: formData.categoryId,     // ⚡ FIX: FK thật
      subCategoryId: formData.subCategoryId, // ⚡ FIX: FK thật
      brandId: formData.brandId,           // ⚡ FIX: FK thật
      description: formData.description,
      price: parseFloat(formData.price),
      originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
      stock: parseInt(formData.stock, 10),
      thumbnail: formData.thumbnail || formData.images[0] || '',
      images: formData.images.length > 0 ? formData.images : (formData.thumbnail ? [formData.thumbnail] : []),
      isActive: formData.isActive,
      variants: sanitizedVariants,
      highlights: highlightsArray,
      specs: parsedSpecs,
    };

    if (isEditing && currentId) {
      // ⚡ Không gửi `slug` khi update — bất biến, backend cũng không nhận field này.
      await api.patch(`/products/${currentId}`, basePayload);
      setMessage({ type: 'success', text: 'CẬP NHẬT SẢN PHẨM ENTERPRISE THÀNH CÔNG!' });
    } else {
      // ⚡ Chỉ khi TẠO MỚI mới gửi kèm slug (bắt buộc trong CreateProductDto).
      await api.post('/products', { ...basePayload, slug: formData.slug });
      setMessage({ type: 'success', text: 'TẠO SẢN PHẨM MỚI THÀNH CÔNG!' });
    }

      setIsModalOpen(false);
      // ⚡ Nhóm B: chỉ nạp lại DANH SÁCH sản phẩm (trang hiện tại), không cần
      // tải lại master data cho dropdown.
      fetchProducts();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Đã có lỗi hệ thống xảy ra.' });
    } finally {
      setSubmitting(false); // ⚡ UX (mục 2b)
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('BẠN CÓ CHẮC CHẮN MUỐN XÓA SẢN PHẨM NÀY KHỎI HỆ THỐNG?')) return;

    try {
      await api.delete(`/products/${id}`);
      setMessage({ type: 'success', text: 'ĐÃ XÓA SẢN PHẨM KHỎI HỆ THỐNG!' });
      fetchProducts();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Không thể xóa sản phẩm.' });
    }
  };

  // ⚡ Nhóm B: đã XÓA `filteredProducts` và `paginatedProducts` (lọc + cắt
  // trang ở client trên toàn bộ dữ liệu). `products` giờ CHÍNH LÀ đúng 1
  // trang kết quả đã được server lọc sẵn, render thẳng ra bảng.

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh] bg-white text-[#111]">
        <span className="tracking-[0.3em] text-xs uppercase font-bold animate-pulse">ĐANG TẢI HỆ THỐNG PIM ENTERPRISE...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#111] font-sans antialiased pb-28">
      
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-8 border-b border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">QUOCÉ WORLD-CLASS ENTERPRISE PIM</span>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-[#111] mt-1">
            QUẢN LÝ SẢN PHẨM & BIẾN THỂ
          </h1>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-black text-white text-xs font-bold uppercase tracking-widest px-6 py-3.5 rounded-none hover:bg-gray-800 transition shadow-sm"
        >
          + THÊM SẢN PHẨM MỚI
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8">
        
        {message.text && (
          <div className={`mb-8 p-4 text-xs font-bold uppercase tracking-wider text-center rounded-none border ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            {message.text}
          </div>
        )}

        {/* ⚡ Nhóm B: toàn bộ ô tìm kiếm + 3 dropdown dưới đây gửi thẳng lên
            server (có debounce 400ms cho ô tìm kiếm), không còn lọc ở client. */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center">
          <input
            type="text"
            placeholder="TÌM KIẾM THEO TÊN SẢN PHẨM HOẶC MÃ SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-96 bg-white border border-gray-300 text-xs font-medium px-4 py-3 rounded-none focus:outline-none focus:border-black uppercase"
          />
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => {
                setSelectedCategoryFilter(e.target.value);
                // Đổi danh mục cha thì bỏ luôn lọc danh mục con đang chọn —
                // nếu không, 2 filter dễ chọi nhau và ra 0 kết quả khó hiểu.
                setSelectedSubCategoryFilter('ALL');
                setCurrentPage(1);
              }}
              className="bg-white border border-gray-300 text-xs font-bold uppercase px-4 py-3 rounded-none cursor-pointer"
            >
              <option value="ALL">TẤT CẢ DANH MỤC</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <select
              value={selectedSubCategoryFilter}
              onChange={(e) => { setSelectedSubCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="bg-white border border-gray-300 text-xs font-bold uppercase px-4 py-3 rounded-none cursor-pointer"
            >
              <option value="ALL">TẤT CẢ DANH MỤC CON</option>
              {subCategories
                .filter(sc => selectedCategoryFilter === 'ALL' || sc.categoryId === selectedCategoryFilter)
                .map(sc => (
                  <option key={sc.id} value={sc.id}>{sc.name}</option>
                ))}
            </select>

            <select
              value={selectedBrandFilter}
              onChange={(e) => { setSelectedBrandFilter(e.target.value); setCurrentPage(1); }}
              className="bg-white border border-gray-300 text-xs font-bold uppercase px-4 py-3 rounded-none cursor-pointer"
            >
              <option value="ALL">TẤT CẢ THƯƠNG HIỆU</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="border border-gray-200 overflow-x-auto rounded-none">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8f8f8] border-b border-gray-200 text-[11px] font-black uppercase tracking-widest text-gray-700">
                <th className="p-4">Hình ảnh</th>
                <th className="p-4">Mã SKU</th>
                <th className="p-4">Tên sản phẩm</th>
                <th className="p-4">Danh mục</th>
                <th className="p-4">Thương hiệu</th>
                <th className="p-4">Giá bán</th>
                <th className="p-4">Biến thể màu</th>
                <th className="p-4">Kho</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-xs font-medium">
              {productsLoading ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-gray-400 uppercase tracking-wider animate-pulse">
                    Đang tải danh sách sản phẩm...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-gray-400 uppercase tracking-wider">
                    Không tìm thấy sản phẩm phù hợp trong cơ sở dữ liệu.
                  </td>
                </tr>
              ) : (
                products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-gray-50 transition">
                    <td className="p-4">
                      <div className="w-12 h-12 bg-gray-100 border border-gray-300 rounded-none overflow-hidden">
                        {prod.thumbnail ? (
                          <img src={prod.thumbnail} alt={prod.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">NO IMG</div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-gray-500">{prod.sku || 'N/A'}</td>
                    <td className="p-4 font-bold uppercase tracking-wide max-w-[200px] truncate">{prod.title}</td>
                    <td className="p-4 uppercase text-gray-600">{prod.category?.name || '—'}</td>
                    <td className="p-4 uppercase text-gray-900 font-bold">{prod.brand?.name || '—'}</td>
                    <td className="p-4 font-bold">{Number(prod.price).toLocaleString('vi-VN')} đ</td>
                    <td className="p-4">
                      <div className="flex gap-1 items-center">
                        {prod.variants && prod.variants.length > 0 ? (
                          prod.variants.map((v, i) => {
                            const variantBadge = getStockBadge(v.stock);
                            const ringClass = variantBadge
                              ? v.stock === 0 ? 'ring-2 ring-red-500' : 'ring-2 ring-amber-500'
                              : 'border border-gray-300';
                            return (
                              <span
                                key={i}
                                className={`w-4 h-4 rounded-full block ${ringClass}`}
                                style={{ backgroundColor: v.hexCode || '#000' }}
                                title={`${v.colorName} — còn ${v.stock}`}
                              />
                            );
                          })
                        ) : (
                          <span className="text-gray-400 text-[10px]">Đơn lẻ</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-bold">
                      {prod.variants && prod.variants.length > 0 ? (
                        (() => {
                          const totalVariantStock = prod.variants.reduce((sum, v) => sum + v.stock, 0);
                          const outOfStockCount = prod.variants.filter(v => v.stock === 0).length;
                          const lowStockCount = prod.variants.filter(v => v.stock > 0 && v.stock < LOW_STOCK_THRESHOLD).length;
                          const summaryBadge = outOfStockCount > 0
                            ? { label: `${outOfStockCount} màu hết hàng`, className: 'bg-red-100 text-red-800' }
                            : lowStockCount > 0
                            ? { label: `${lowStockCount} màu sắp hết`, className: 'bg-amber-100 text-amber-800' }
                            : null;
                          return (
                            <div className="flex flex-col gap-1 items-start">
                              <span className="text-[11px] text-gray-500 font-normal">Tổng biến thể: {totalVariantStock}</span>
                              {summaryBadge && (
                                <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider ${summaryBadge.className}`}>
                                  {summaryBadge.label}
                                </span>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        <div className="flex flex-col gap-1 items-start">
                          <span>{prod.stock}</span>
                          {getStockBadge(prod.stock) && (
                            <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider ${getStockBadge(prod.stock)!.className}`}>
                              {getStockBadge(prod.stock)!.label}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider ${
                        prod.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {prod.isActive ? 'Đang bán' : 'Ẩn'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(prod)}
                        className="bg-gray-200 text-black text-[10px] font-bold uppercase px-3 py-1.5 rounded-none hover:bg-black hover:text-white transition"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(prod.id)}
                        className="bg-red-50 text-red-600 text-[10px] font-bold uppercase px-3 py-1.5 rounded-none hover:bg-red-600 hover:text-white transition border border-red-200"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ⚡ Nhóm B: `totalPages` và `totalProducts` nay đến TỪ SERVER, không
            còn tính từ độ dài mảng đã tải về. Luôn hiển thị (kể cả 1 trang) để
            Admin thấy được tổng số sản phẩm khớp bộ lọc hiện tại. */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 text-xs font-bold uppercase">
          <span className="text-gray-500">
            Trang {currentPage} / {totalPages} — Tổng {totalProducts} sản phẩm
          </span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1 || productsLoading}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-4 py-2 bg-gray-100 disabled:opacity-40 hover:bg-black hover:text-white transition"
            >
              Trang trước
            </button>
            <button
              disabled={currentPage >= totalPages || productsLoading}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="px-4 py-2 bg-gray-100 disabled:opacity-40 hover:bg-black hover:text-white transition"
            >
              Trang sau
            </button>
          </div>
        </div>

      </div>

      {/* MODAL THÊM / SỬA SẢN PHẨM ENTERPRISE PIM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto px-4 py-10">
          <div className="flex min-h-full items-center justify-center">
            <div className="bg-white border border-gray-300 w-full max-w-4xl p-8 rounded-none shadow-2xl">
              
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-6">
                <h2 className="text-sm font-black uppercase tracking-widest text-black">
                  {isEditing ? 'CHỈNH SỬA SẢN PHẨM ENTERPRISE' : 'THÊM SẢN PHẨM MỚI (PIM)'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-xs font-bold uppercase px-3 py-1 bg-gray-100 hover:bg-black hover:text-white transition"
                >
                  ✕ Đóng
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Tên sản phẩm</label>
                    <input
                      type="text"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleTitleChange}
                      placeholder="VD: Sạc dự phòng Baseus..."
                      className="bg-white border border-gray-300 text-black text-xs font-medium px-4 py-3 rounded-none uppercase"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Mã SKU tự động</label>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, sku: generateSku(prev.title, prev.brandId) }))}
                        disabled={!formData.title}
                        className="text-[10px] font-bold text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                      >
                        ↻ Sinh lại mã khác
                      </button>
                    </div>
                    {/* ⚡ UX (mục 2b): readOnly hẳn (không còn sửa tay được) — trước đây
                        style trông như read-only nhưng vẫn gõ được, gây nhầm lẫn. */}
                    <input
                      type="text"
                      name="sku"
                      required
                      readOnly
                      value={formData.sku}
                      placeholder="Sẽ tự sinh khi nhập Tên sản phẩm"
                      className="bg-gray-100 border border-gray-300 text-gray-700 font-mono text-xs px-4 py-3 rounded-none cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">
                      Định danh URL (Slug) {isEditing && <span className="text-gray-400 font-normal">(Bất biến)</span>}
                    </label>
                    {/* ⚡ Khóa cứng Slug ở chế độ chỉnh sửa (Immutable) chống ghi đè SEO */}
                    <input
                      type="text"
                      name="slug"
                      required
                      readOnly={isEditing}
                      value={formData.slug}
                      onChange={handleChange}
                      className={`border border-gray-300 text-xs font-medium px-4 py-3 rounded-none ${
                        isEditing ? 'bg-gray-100 text-gray-500 cursor-not-allowed font-mono' : 'bg-gray-50 text-gray-600'
                      }`}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Danh mục chính</label>
                    <select
                      name="categoryId"
                      required
                      value={formData.categoryId}
                      onChange={handleCategorySelect}
                      className="bg-white border border-gray-300 text-black text-xs font-bold uppercase px-4 py-3 rounded-none cursor-pointer"
                    >
                      <option value="">CHỌN DANH MỤC</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* ⚡ FIX (Phase 1): Dropdown động thật sự — dữ liệu lấy từ
                    Database qua API /sub-categories và /brands, KHÔNG còn
                    cho gõ tay tự do. Đúng nguyên tắc MDM đặt ra từ đầu dự án. */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-4 border border-gray-200">

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase text-gray-600">Danh mục con (SubCategory)</label>
                      <button
                        type="button"
                        onClick={() => setQuickAddModal({ type: 'subCategory', name: '', logoUrl: '', submitting: false })}
                        disabled={!formData.categoryId}
                        title={!formData.categoryId ? 'Chọn Danh mục chính trước' : undefined}
                        className="text-[10px] font-bold text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                      >
                        + Thêm mới
                      </button>
                    </div>
                    <select
                      name="subCategoryId"
                      required
                      value={formData.subCategoryId}
                      onChange={handleChange}
                      disabled={!formData.categoryId}
                      className="bg-white border border-gray-300 text-xs font-bold uppercase px-3 py-2.5 cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {formData.categoryId ? 'CHỌN DANH MỤC CON' : 'CHỌN DANH MỤC CHÍNH TRƯỚC'}
                      </option>
                      {filteredSubCategories.map(sc => (
                        <option key={sc.id} value={sc.id}>{sc.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase text-gray-600">Thương hiệu (Brand)</label>
                      <button
                        type="button"
                        onClick={() => setQuickAddModal({ type: 'brand', name: '', logoUrl: '', submitting: false })}
                        className="text-[10px] font-bold text-blue-600 hover:underline"
                      >
                        + Thêm mới
                      </button>
                    </div>
                    <select
                      name="brandId"
                      required
                      value={formData.brandId}
                      onChange={handleChange}
                      className="bg-white border border-gray-300 text-xs font-bold uppercase px-3 py-2.5 cursor-pointer"
                    >
                      <option value="">CHỌN THƯƠNG HIỆU</option>
                      {brands.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Giá bán (VND)</label>
                    <input
                      type="number"
                      name="price"
                      required
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="429000"
                      className="bg-white border border-gray-300 text-black text-xs font-medium px-4 py-3 rounded-none"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Giá gốc (Original Price)</label>
                    <input
                      type="number"
                      name="originalPrice"
                      value={formData.originalPrice}
                      onChange={handleChange}
                      placeholder="590000"
                      className="bg-white border border-gray-300 text-black text-xs font-medium px-4 py-3 rounded-none"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Tổng tồn kho</label>
                    <input
                      type="number"
                      name="stock"
                      required
                      value={formData.stock}
                      onChange={handleChange}
                      className="bg-white border border-gray-300 text-black text-xs font-medium px-4 py-3 rounded-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Ảnh đại diện chính (Thumbnail / Cloudinary Upload)</label>
                  <div className="flex gap-4 items-center">
                    <input
                      type="text"
                      name="thumbnail"
                      value={formData.thumbnail}
                      onChange={handleChange}
                      placeholder="Dán link ảnh hoặc chọn tệp từ máy..."
                      className="flex-1 bg-white border border-gray-300 text-black text-xs font-medium px-4 py-3 rounded-none"
                    />
                    <label className="cursor-pointer bg-black text-white text-[11px] font-bold uppercase px-5 py-3 hover:bg-gray-800 transition">
                      {uploadingThumbnail ? 'ĐANG TẢI...' : 'TẢI ẢNH LÊN'}
                      <input type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-gray-200 pt-4">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">
                    Bộ sưu tập ảnh phụ sản phẩm (Gallery Images)
                  </label>
                  <div className="flex flex-wrap gap-3 items-center">
                    {formData.images.map((imgUrl, imgIdx) => (
                      <div key={imgIdx} className="relative w-16 h-16 border border-gray-300 group">
                        <img src={imgUrl} alt="Gallery" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryImage(imgIdx)}
                          className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-bold opacity-0 group-hover:opacity-100 transition"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <label className="cursor-pointer border border-dashed border-gray-400 bg-gray-50 hover:bg-gray-100 w-16 h-16 flex flex-col items-center justify-center text-[10px] font-bold text-gray-600 transition">
                      <span>+ Thêm</span>
                      <input type="file" accept="image/*" onChange={handleGalleryUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Mô tả chi tiết (Rich Content)</label>
                  <textarea
                    name="description"
                    rows={4}
                    required
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Nhập nội dung bài viết mô tả sản phẩm..."
                    className="bg-white border border-gray-300 text-black text-xs font-medium px-4 py-3 rounded-none focus:outline-none focus:border-black font-sans"
                  />
                </div>

                {/* ⚡ Bổ sung trường cấu hình Highlights & Specs để không bị trống trang chi tiết */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-200 pt-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Điểm nhấn sản phẩm (Highlights - Mỗi dòng 1 ý)</label>
                    <textarea
                      name="highlightsText"
                      rows={4}
                      value={formData.highlightsText}
                      onChange={handleChange}
                      placeholder="• Công nghệ sạc nhanh PD 65W&#10;• Dung lượng 20000mAh"
                      className="bg-white border border-gray-300 text-black text-xs font-medium px-4 py-3 rounded-none focus:outline-none focus:border-black font-sans"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Thông số kỹ thuật (Specs - JSON Format)</label>
                    <textarea
                      name="specsText"
                      rows={4}
                      value={formData.specsText}
                      onChange={handleChange}
                      placeholder='{"material": "Aluminum", "weight": "340g"}'
                      aria-invalid={!!specsError}
                      className={`bg-white border text-black font-mono text-xs px-4 py-3 rounded-none focus:outline-none ${
                        specsError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-black'
                      }`}
                    />
                    {specsError && (
                      <p className="text-red-600 text-[10px] font-bold">⚠ JSON không hợp lệ: {specsError}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black uppercase tracking-widest text-black">
                      QUẢN LÝ BIẾN THỂ MÀU SẮC & ẢNH RIÊNG (DYNAMIC COLOR VARIANTS)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddVariant}
                      className="bg-black text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 hover:bg-gray-800 transition"
                    >
                      + Thêm biến thể màu
                    </button>
                  </div>

                  {formData.variants.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Sản phẩm này hiện không có biến thể màu sắc độc lập.</p>
                  ) : (
                    <div className="border border-gray-200 overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-700 border-b">
                            <th className="p-3">Mã màu</th>
                            <th className="p-3">Tên hiển thị</th>
                            <th className="p-3">Mã HEX</th>
                            {/* ⚡ FIX wording (mục 2b, phát hiện qua test tay): "giá gốc" trùng tên
                                với field "Giá gốc / Original Price" riêng biệt trên form, gây hiểu
                                nhầm nghiêm trọng. Hành vi thật (product.service.ts backend) là fallback
                                về field "Giá bán" (price), KHÔNG PHẢI "Giá gốc" (originalPrice). */}
                            <th className="p-3" title="Để trống hoặc 0 sẽ dùng đúng Giá bán của sản phẩm chính">Giá (VNĐ)</th>
                            <th className="p-3">Kho</th>
                            <th className="p-3">Ảnh biến thể</th>
                            <th className="p-3 text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-xs">
                          {formData.variants.map((variant, index) => (
                            <tr key={index}>
                              <td className="p-3">
                                <select
                                  value={variant.colorCode}
                                  onChange={(e) => handleVariantChange(index, 'colorCode', e.target.value)}
                                  className="bg-white border border-gray-300 text-xs font-bold uppercase px-2 py-2"
                                >
                                  {STANDARD_COLORS.map(c => (
                                    <option key={c.code} value={c.code}>{c.code.toUpperCase()}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={variant.colorName}
                                  onChange={(e) => handleVariantChange(index, 'colorName', e.target.value)}
                                  className="bg-white border border-gray-300 text-xs px-3 py-2 w-full"
                                />
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded border block" style={{ backgroundColor: variant.hexCode }} />
                                  <input
                                    type="text"
                                    value={variant.hexCode}
                                    onChange={(e) => handleVariantChange(index, 'hexCode', e.target.value)}
                                    className="bg-white border border-gray-300 text-xs font-mono px-2 py-2 w-20"
                                  />
                                </div>
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  value={variant.price}
                                  onChange={(e) => handleVariantChange(index, 'price', parseFloat(e.target.value) || 0)}
                                  placeholder="0 = dùng Giá bán chính"
                                  className="bg-white border border-gray-300 text-xs px-3 py-2 w-24"
                                />
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  value={variant.stock}
                                  onChange={(e) => handleVariantChange(index, 'stock', parseInt(e.target.value) || 0)}
                                  className="bg-white border border-gray-300 text-xs px-3 py-2 w-16"
                                />
                              </td>
                              <td className="p-3">
                                <div className="flex flex-wrap gap-1 items-center">
                                  {variant.images?.map((vImg, vImgIdx) => (
                                    <div key={vImgIdx} className="relative w-8 h-8 border group">
                                      <img src={vImg} alt="Var" className="w-full h-full object-cover" />
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveVariantImage(index, vImgIdx)}
                                        className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                  <label className="cursor-pointer border border-dashed border-gray-400 w-8 h-8 flex items-center justify-center text-[10px] hover:bg-gray-100" title="Tải ảnh cho biến thể này">
                                    +
                                    <input type="file" accept="image/*" onChange={(e) => handleVariantImageUpload(index, e)} className="hidden" />
                                  </label>
                                </div>
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVariant(index)}
                                  className="text-red-600 font-bold text-[10px] uppercase px-2 py-1 bg-red-50 border border-red-200 hover:bg-red-600 hover:text-white transition"
                                >
                                  Xóa
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                  <label htmlFor="isActive" className="text-xs font-bold uppercase tracking-wider cursor-pointer">
                    Kích hoạt sản phẩm hiển thị công khai trên cửa hàng
                  </label>
                </div>

                <div className="pt-4 flex items-center justify-end gap-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={submitting}
                    className="px-6 py-3 bg-gray-200 text-black text-xs font-bold uppercase tracking-widest rounded-none hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-none hover:bg-gray-800 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'ĐANG XỬ LÝ...' : (isEditing ? 'LƯU THAY ĐỔI' : 'TẠO SẢN PHẨM ENTERPRISE')}
                  </button>
                </div>

              </form>

            </div>
          </div>
        </div>
      )}

      {/* ⚡ UX form Admin (mục 2b): mini-modal quick-add SubCategory/Brand,
          thay window.prompt() thô. Lồng trên modal Sản phẩm (z-[60] > z-50). */}
      {quickAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] overflow-y-auto px-4 py-10 flex items-center justify-center">
          <div className="bg-white border border-gray-300 w-full max-w-md p-6 rounded-none shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-black">
                {quickAddModal.type === 'subCategory' ? 'Thêm danh mục con mới' : 'Thêm thương hiệu mới'}
              </h3>
              <button
                type="button"
                onClick={() => setQuickAddModal(null)}
                className="text-xs font-bold uppercase px-3 py-1 bg-gray-100 hover:bg-black hover:text-white transition"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">
                  {quickAddModal.type === 'subCategory' ? 'Tên danh mục con' : 'Tên thương hiệu'}
                </label>
                <input
                  type="text"
                  autoFocus
                  value={quickAddModal.name}
                  onChange={(e) => setQuickAddModal(prev => (prev ? { ...prev, name: e.target.value } : prev))}
                  placeholder={quickAddModal.type === 'subCategory' ? 'VD: Tai nghe' : 'VD: Anker'}
                  className="bg-white border border-gray-300 text-black text-xs font-medium px-4 py-3 rounded-none"
                />
              </div>
              {quickAddModal.type === 'brand' && (
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Logo URL (tùy chọn)</label>
                  <input
                    type="text"
                    value={quickAddModal.logoUrl}
                    onChange={(e) => setQuickAddModal(prev => (prev ? { ...prev, logoUrl: e.target.value } : prev))}
                    placeholder="https://..."
                    className="bg-white border border-gray-300 text-black text-xs font-medium px-4 py-3 rounded-none"
                  />
                </div>
              )}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickAddModal(null)}
                  disabled={quickAddModal.submitting}
                  className="px-4 py-2 bg-gray-200 text-black text-xs font-bold uppercase tracking-widest rounded-none hover:bg-gray-300 transition disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleQuickAddSubmit}
                  disabled={quickAddModal.submitting || !quickAddModal.name.trim()}
                  className="px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-none hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {quickAddModal.submitting ? 'ĐANG TẠO...' : 'Tạo mới'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}