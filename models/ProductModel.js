/**
 * ============================================================================
 * MODEL: ProductModel (Quản lý Dữ liệu Sản phẩm, Danh mục & So sánh)
 * Kiến trúc: Mô hình MVC Chuẩn - SmartStore
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * ============================================================================
 */

class ProductModel {
  constructor(apiUrl = 'http://localhost:3000') {
    this.apiUrl = apiUrl;
    this.products = [];
    this.categories = [];
    this.compareKey = 'smartstore_compare';
  }

  /** Lấy toàn bộ danh sách sản phẩm từ db.json qua json-server */
  async fetchAllProducts() {
    try {
      const res = await fetch(`${this.apiUrl}/products`);
      if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status}`);
      this.products = await res.json();
      return this.products;
    } catch (err) {
      console.error('[ProductModel] Lỗi nạp sản phẩm:', err);
      return [];
    }
  }

  /** Lấy danh mục 8 thương hiệu điện thoại */
  async fetchCategories() {
    try {
      const res = await fetch(`${this.apiUrl}/categories`);
      if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status}`);
      this.categories = await res.json();
      return this.categories;
    } catch (err) {
      console.error('[ProductModel] Lỗi nạp danh mục:', err);
      return [];
    }
  }

  /** Lấy chi tiết 1 sản phẩm theo ID */
  async fetchProductById(id) {
    try {
      const res = await fetch(`${this.apiUrl}/products/${id}`);
      if (!res.ok) throw new Error(`Không tìm thấy sản phẩm #${id}`);
      return await res.json();
    } catch (err) {
      console.error(`[ProductModel] Lỗi lấy sản phẩm #${id}:`, err);
      return null;
    }
  }

  /** Cập nhật tồn kho và số lượng đã bán sau khi đặt hàng hoặc hủy đơn */
  async updateStock(id, newStock, newSold) {
    try {
      const res = await fetch(`${this.apiUrl}/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stock: Number(newStock),
          quantity: Number(newStock),
          sold: Number(newSold)
        })
      });
      return await res.json();
    } catch (err) {
      console.error(`[ProductModel] Lỗi cập nhật kho #${id}:`, err);
      return null;
    }
  }

  /** Bộ lọc và tìm kiếm logic */
  filterProducts(items, { brandId = 'all', keyword = '', priceRange = 'all', sort = 'default' }) {
    let result = [...items];

    // Lọc theo thương hiệu
    if (brandId && brandId !== 'all') {
      result = result.filter(item => 
        String(item.categoryId) === String(brandId) || 
        String(item.cate_id) === String(brandId)
      );
    }

    // Tìm kiếm theo tên hoặc thông số
    if (keyword && keyword.trim() !== '') {
      const q = keyword.trim().toLowerCase();
      result = result.filter(item => 
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.brand && item.brand.toLowerCase().includes(q)) ||
        (item.detail && item.detail.toLowerCase().includes(q))
      );
    }

    // Lọc theo khoảng giá
    if (priceRange && priceRange !== 'all') {
      if (priceRange === 'under-10m') {
        result = result.filter(item => item.price < 10000000);
      } else if (priceRange === '10m-20m') {
        result = result.filter(item => item.price >= 10000000 && item.price <= 20000000);
      } else if (priceRange === '20m-30m') {
        result = result.filter(item => item.price > 20000000 && item.price <= 30000000);
      } else if (priceRange === 'over-30m') {
        result = result.filter(item => item.price > 30000000);
      }
    }

    // Sắp xếp
    if (sort === 'price-asc') {
      result.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sort === 'price-desc') {
      result.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sort === 'name-asc') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sort === 'best-seller') {
      result.sort((a, b) => (Number(b.sold) || 0) - (Number(a.sold) || 0));
    }

    return result;
  }

  /** Phân trang danh sách sản phẩm */
  paginate(items, page = 1, pageSize = 8) {
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const startIndex = (currentPage - 1) * pageSize;
    const pagedItems = items.slice(startIndex, startIndex + pageSize);

    return {
      items: pagedItems,
      currentPage,
      totalPages,
      totalItems
    };
  }

  // --- QUẢN LÝ DANH SÁCH SO SÁNH (COMPARE LIST) ---
  getCompareIds() {
    try {
      const data = localStorage.getItem(this.compareKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveCompareIds(ids) {
    localStorage.setItem(this.compareKey, JSON.stringify(ids));
  }

  addToCompare(id) {
    const ids = this.getCompareIds();
    const strId = String(id);
    if (ids.includes(strId)) {
      return { success: false, message: 'Sản phẩm này đã có trong danh sách so sánh!' };
    }
    if (ids.length >= 3) {
      return { success: false, message: 'Chỉ có thể so sánh tối đa 3 sản phẩm cùng lúc!' };
    }
    ids.push(strId);
    this.saveCompareIds(ids);
    return { success: true, count: ids.length };
  }

  removeFromCompare(id) {
    let ids = this.getCompareIds();
    ids = ids.filter(item => String(item) !== String(id));
    this.saveCompareIds(ids);
    return ids;
  }

  clearCompare() {
    localStorage.removeItem(this.compareKey);
  }
}

// Khởi tạo Singleton toàn cục trong namespace Model
window.ProductModel = ProductModel;
