/**
 * ============================================================================
 * 📋 MỤC LỤC CÁC HÀM & TÁC DỤNG (TABLE OF CONTENTS):
 * ----------------------------------------------------------------------------
 * 1. Khởi tạo & Dữ liệu Cấu hình:
 *    • DEMAND_MATCHERS                  : Bảng ánh xạ bộ lọc theo nhu cầu (gaming, camera, pin, gập)
 *    • PRICE_RANGE_MAP                  : Bảng ánh xạ 4 khoảng giá (<10tr, 10-20tr, 20-30tr, >30tr)
 *    • SORT_COMPARATORS                 : Bảng thuật toán sắp xếp (giá tăng/giảm, tên, bán chạy)
 *    • createProductModel(apiUrl)       : Factory Function khởi tạo module & lưu trữ state trong Closure
 *
 * 2. Giao tiếp RESTful API & Backend (JSON-Server cổng 3000):
 *    • _http(endpoint, options)         : Gửi HTTP Request fetch an toàn với try/catch
 *    • fetchAllProducts()               : [BƯỚC 3] Lấy toàn bộ 40 sản phẩm từ db.json
 *    • fetchCategories()                : [BƯỚC 3] Lấy danh mục 8 thương hiệu smartphone
 *    • fetchProductById(id)             : [BƯỚC 3] Lấy thông số chi tiết của 1 sản phẩm theo ID
 *    • updateProductStock(id, s, sold)  : Cập nhật tồn kho và đã bán khi hoàn tất/hủy đơn
 *
 * 3. Quản trị Sản phẩm (Admin CRUD Operations):
 *    • createProduct(productData)       : Thêm mới 1 sản phẩm vào db.json (POST)
 *    • updateProduct(id, productData)   : Cập nhật thông tin chi tiết sản phẩm (PATCH)
 *    • deleteProduct(id)                : Xóa sản phẩm khỏi hệ thống (DELETE)
 *
 * 4. Thuật toán Nghiệp vụ Lọc & Phân trang (Pure Functions):
 *    • filterProducts(items, criteria)  : Lọc kết hợp đa điều kiện (Hãng, Giá, Nhu cầu, Tìm kiếm, Sắp xếp)
 *    • paginate(items, page, pageSize)  : Phân trang danh sách sản phẩm chuẩn xác (8 máy/trang)
 *
 * 5. Quản lý So sánh Đối đầu (Compare List - LocalStorage):
 *    • getCompareIds() / saveCompareIds : Đọc/Ghi mảng ID các máy đang chọn so sánh
 *    • addToCompare(productId)          : Thêm máy vào danh sách so sánh (Khống chế tối đa 3 máy)
 *    • removeFromCompare(productId)     : Xóa 1 máy khỏi danh sách so sánh
 *    • clearCompare()                   : Xóa sạch toàn bộ danh sách so sánh
 *    • getCompareProducts()             : Trích xuất danh sách đối tượng máy đang được so sánh
 * ============================================================================
 */

// Bảng ánh xạ bộ lọc theo nhu cầu sử dụng (Demand Matching Map)
const DEMAND_MATCHERS = {
  gaming: item => {
    const cId = String(item.categoryId ?? item.cate_id ?? '');
    const text = `${item.name ?? ''} ${item.brand ?? ''} ${JSON.stringify(item.specs ?? {})}`.toLowerCase();
    return ['7', '8'].includes(cId) || ['rog', 'redmagic', 'gaming', 'gt', '144hz', '165hz', '185hz', 'tản nhiệt', 'trigger'].some(k => text.includes(k));
  },
  camera: item => {
    const text = `${item.name ?? ''} ${JSON.stringify(item.specs ?? {})}`.toLowerCase();
    return ['ultra', 'pro max', 'pro', 'leica', 'zeiss', 'hasselblad', '200mp', '108mp', 'periscope', 'zoom quang'].some(k => text.includes(k));
  },
  battery: item => {
    const text = JSON.stringify(item.specs ?? {}).toLowerCase();
    return ['5500', '6000', '6500', '80w', '100w', '120w', '150w', 'sạc'].some(k => text.includes(k));
  },
  foldable: item => {
    const text = `${item.name ?? ''} ${JSON.stringify(item.specs ?? {})}`.toLowerCase();
    return ['fold', 'flip', 'gập'].some(k => text.includes(k));
  }
};

// Bảng ánh xạ bộ lọc theo khoảng giá (Price Range Map) - Hỗ trợ cả 2 dạng key under-10 và under-10m
const PRICE_RANGE_MAP = {
  'under-10':  item => Number(item.price ?? 0) < 10_000_000,
  'under-10m': item => Number(item.price ?? 0) < 10_000_000,
  '10-20':     item => Number(item.price ?? 0) >= 10_000_000 && Number(item.price ?? 0) <= 20_000_000,
  '10m-20m':   item => Number(item.price ?? 0) >= 10_000_000 && Number(item.price ?? 0) <= 20_000_000,
  '20-30':     item => Number(item.price ?? 0) > 20_000_000 && Number(item.price ?? 0) <= 30_000_000,
  '20m-30m':   item => Number(item.price ?? 0) > 20_000_000 && Number(item.price ?? 0) <= 30_000_000,
  'over-30':   item => Number(item.price ?? 0) > 30_000_000,
  'over-30m':  item => Number(item.price ?? 0) > 30_000_000
};

// Bảng ánh xạ thuật toán sắp xếp (Sorting Comparators Map)
const SORT_COMPARATORS = {
  'price-asc':   (a, b) => (Number(a.price) || 0) - (Number(b.price) || 0),
  'price-desc':  (a, b) => (Number(b.price) || 0) - (Number(a.price) || 0),
  'name-asc':    (a, b) => (a.name ?? '').localeCompare(b.name ?? ''),
  'best-seller': (a, b) => (Number(b.sold) || 0) - (Number(a.sold) || 0)
};

/**
 * Hàm khởi tạo Module ProductModel theo phong cách Hàm Hiện Đại
 * @param {string} [apiUrl='http://localhost:3000'] - Địa chỉ Backend JSON-Server
 */
function createProductModel(apiUrl = 'http://localhost:3000') {
  let products = [];
  let categories = [];
  let compareList = [];
  const compareKey = 'smartstore_compare';

  // Khôi phục danh sách so sánh từ bộ nhớ LocalStorage
  const getCompareIds = () => {
    try {
      const saved = localStorage.getItem(compareKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  };

  const saveCompareIds = (ids = []) => {
    try {
      localStorage.setItem(compareKey, JSON.stringify(ids));
    } catch (e) {}
  };

  /**
   * Helper gửi request HTTP an toàn tới Backend
   */
  const _http = async (endpoint, options = {}) => {
    try {
      const res = await fetch(`${apiUrl}${endpoint}`, {
        headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
        ...options
      });
      if (!res.ok) throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
      return await res.json();
    } catch (err) {
      console.error(`[ProductModel._http] Lỗi kết nối ${endpoint}:`, err.message);
      return null;
    }
  };

  /**
   * [BƯỚC 3] Lấy toàn bộ 40 sản phẩm từ db.json cổng 3000
   * @returns {Promise<Array>} Mảng dữ liệu sản phẩm
   */
  const fetchAllProducts = async () => {
    const data = await _http('/products');
    products = Array.isArray(data) ? data : [];
    return products;
  };

  /**
   * [BƯỚC 3] Lấy danh mục 8 thương hiệu điện thoại
   */
  const fetchCategories = async () => {
    const data = await _http('/categories');
    categories = Array.isArray(data) ? data : [];
    return categories;
  };

  /**
   * [BƯỚC 3] Lấy thông số chi tiết 1 sản phẩm theo ID
   */
  const fetchProductById = async (id) => {
    return await _http(`/products/${id}`);
  };

  /**
   * Cập nhật tồn kho sản phẩm khi đặt hàng hoặc hủy đơn
   */
  const updateProductStock = async (id, newStock, newSold) => {
    const payload = {};
    if (newStock !== undefined) payload.stock = Math.max(0, Number(newStock) || 0);
    if (newSold !== undefined) payload.sold = Math.max(0, Number(newSold) || 0);

    const updated = await _http(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });

    if (updated) {
      const idx = products.findIndex(p => String(p.id) === String(id));
      if (idx !== -1) Object.assign(products[idx], updated);
    }
    return updated;
  };

  /**
   * Thêm sản phẩm mới (Admin CRUD)
   */
  const createProduct = async (productData) => {
    const saved = await _http('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
    if (!saved) return { success: false, message: 'Không thể thêm sản phẩm vào hệ thống' };
    products.unshift(saved);
    return { success: true, data: saved };
  };

  /**
   * Cập nhật sản phẩm (Admin CRUD)
   */
  const updateProduct = async (id, productData) => {
    const updated = await _http(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(productData)
    });
    if (!updated) return { success: false, message: 'Không thể cập nhật sản phẩm' };
    const idx = products.findIndex(p => String(p.id) === String(id));
    if (idx !== -1) products[idx] = { ...products[idx], ...updated };
    return { success: true, data: updated };
  };

  /**
   * Xóa sản phẩm (Admin CRUD)
   */
  const deleteProduct = async (id) => {
    const res = await _http(`/products/${id}`, { method: 'DELETE' });
    if (res === null) return { success: false, message: 'Không thể xóa sản phẩm' };
    products = products.filter(p => String(p.id) !== String(id));
    return { success: true };
  };

  /**
   * Bộ lọc đa năng thuần túy (Pure Function)
   * Hỗ trợ 2 kiểu gọi: filterProducts(items, criteria) hoặc filterProducts(criteria)
   */
  const filterProducts = (itemsOrCriteria = [], criteria = {}) => {
    let items = [];
    let filterCriteria = {};

    if (Array.isArray(itemsOrCriteria)) {
      items = itemsOrCriteria;
      filterCriteria = criteria || {};
    } else {
      items = products;
      filterCriteria = itemsOrCriteria || {};
    }

    let result = [...items];
    const { brandId = 'all', keyword = '', priceRange = 'all', sort = 'default', demand = 'all' } = filterCriteria;

    // 1. Lọc theo thương hiệu (Brand)
    if (brandId && brandId !== 'all') {
      result = result.filter(item => String(item.categoryId ?? item.cate_id) === String(brandId));
    }

    // 2. Lọc theo nhu cầu người dùng (Demand: gaming, camera, battery, foldable)
    if (demand && demand !== 'all' && DEMAND_MATCHERS[demand]) {
      result = result.filter(DEMAND_MATCHERS[demand]);
    }

    // 3. Tìm kiếm theo từ khóa (Keyword: tên, thương hiệu, chi tiết cấu hình)
    if (keyword && keyword.trim()) {
      const q = keyword.trim().toLowerCase();
      result = result.filter(item =>
        [item.name, item.brand, item.detail].some(field => field && field.toLowerCase().includes(q))
      );
    }

    // 4. Lọc theo khoảng giá (Price Range)
    if (priceRange && priceRange !== 'all' && PRICE_RANGE_MAP[priceRange]) {
      result = result.filter(PRICE_RANGE_MAP[priceRange]);
    }

    // 5. Sắp xếp danh sách (Sort)
    if (sort && sort !== 'default' && SORT_COMPARATORS[sort]) {
      result.sort(SORT_COMPARATORS[sort]);
    }

    return result;
  };

  /**
   * Phân trang danh sách sản phẩm (Pagination)
   */
  const paginate = (items = [], page = 1, pageSize = 8) => {
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const startIndex = (currentPage - 1) * pageSize;

    return {
      items: items.slice(startIndex, startIndex + pageSize),
      currentPage,
      totalPages,
      totalItems,
      pageSize
    };
  };

  /**
   * Quản lý so sánh đối đầu tối đa 3 máy (Compare Management)
   */
  const addToCompare = (productId) => {
    const ids = getCompareIds();
    const strId = String(productId);
    if (ids.includes(strId)) return { success: false, message: 'Máy này đã có trong danh sách so sánh!' };
    if (ids.length >= 3) return { success: false, message: 'Chỉ có thể so sánh tối đa 3 máy cùng lúc!' };
    ids.push(strId);
    saveCompareIds(ids);
    return { success: true, count: ids.length };
  };

  const removeFromCompare = (productId) => {
    const ids = getCompareIds().filter(id => String(id) !== String(productId));
    saveCompareIds(ids);
    return ids;
  };

  const clearCompare = () => {
    try { localStorage.removeItem(compareKey); } catch (e) {}
    return { success: true };
  };

  // Đối tượng giao diện trả về của Module (Model Instance)
  const modelInstance = {
    apiUrl,
    get products() { return products; },
    set products(val) { products = Array.isArray(val) ? val : []; },
    get categories() { return categories; },
    set categories(val) { categories = Array.isArray(val) ? val : []; },
    getCompareIds,
    saveCompareIds,
    addToCompare,
    addCompare: addToCompare,
    removeFromCompare,
    removeCompare: removeFromCompare,
    clearCompare,
    clearCompareList: clearCompare,
    _http,
    fetchAllProducts,
    fetchCategories,
    fetchProductById,
    updateProductStock,
    createProduct,
    updateProduct,
    deleteProduct,
    filterProducts,
    paginate,
    getCompareProducts: () => {
      const ids = getCompareIds();
      return products.filter(p => ids.includes(String(p.id)));
    }
  };

  return modelInstance;
}

// Khởi tạo Singleton toàn cục trong namespace Model
const productModel = createProductModel();

// Constructor tương thích ngược 100% với mã gọi new ProductModel()
function ProductModel(apiUrl) {
  return apiUrl ? createProductModel(apiUrl) : productModel;
}

if (typeof window !== 'undefined') {
  window.ProductModel = ProductModel;
  window.productModel = productModel;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProductModel;
}
