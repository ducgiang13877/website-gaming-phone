/**
 * ============================================================================
 * CONTROLLER: ShopController (Điều phối Trang Chủ, Cửa Hàng, Lọc & So Sánh)
 * Kiến trúc: Mô hình MVC Chuẩn - SmartStore
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * ============================================================================
 */

class ShopController {
  constructor(productModel) {
    this.model = productModel || new window.ProductModel();
    this.filters = {
      brandId: 'all',
      keyword: '',
      priceRange: 'all',
      sort: 'default',
      page: 1,
      pageSize: 8
    };
  }

  /** Render dữ liệu hiển thị trên Trang Chủ */
  renderHome() {
    const categories = this.model.categories;
    const products = this.model.products;
    const compareIds = this.model.getCompareIds();

    // 1. Dải 8 thương hiệu (Brand Pills)
    const homePills = document.getElementById('home-category-pills');
    if (homePills && categories.length > 0) {
      homePills.innerHTML = categories.map(c => `
        <button class="brand-pill-btn" onclick="window.shopModule.filterBrand('${c.id}')" title="Xem sản phẩm ${c.name}">
          <i class="${c.icon || 'fa-solid fa-mobile-screen'}"></i>
          <span>${c.name}</span>
        </button>
      `).join('');
    }

    // 2. Top 4 Siêu Phẩm Gaming Phone (ROG & RedMagic)
    const gamingGrid = document.getElementById('home-gaming-products');
    if (gamingGrid && products.length > 0) {
      const gamingList = products.filter(sp => 
        sp.categoryId == '7' || sp.categoryId == '8' || 
        sp.cate_id == '7' || sp.cate_id == '8' || 
        (sp.brand && (sp.brand.includes('ROG') || sp.brand.includes('RedMagic')))
      ).slice(0, 4);

      window.ProductView.renderProductGrid('home-gaming-products', gamingList, compareIds, categories);
    }

    // 3. Top 8 Bán Chạy / Nổi Bật
    const featuredGrid = document.getElementById('home-featured-products') || document.getElementById('home-latest-grid');
    if (featuredGrid && products.length > 0) {
      const topList = products.slice(0, 8);
      window.ProductView.renderProductGrid(featuredGrid.id, topList, compareIds, categories);
    }

    // 4. Đồng hồ đếm ngược Flash Sale
    this.initFlashSaleCountdown();

    // 5. Cập nhật Dock So Sánh nếu có sản phẩm đang chọn
    this.updateCompareDock();
  }

  /** Render dữ liệu hiển thị trên Trang Cửa Hàng (Shop) */
  renderShop() {
    const categories = this.model.categories;
    const products = this.model.products;
    const compareIds = this.model.getCompareIds();

    // 1. Render dải chọn thương hiệu trong Shop
    const shopPills = document.getElementById('shop-brand-pills');
    if (shopPills && categories.length > 0 && shopPills.children.length <= 1) {
      let pillsHtml = `
        <button class="brand-pill-btn ${this.filters.brandId === 'all' ? 'active' : ''}" onclick="window.shopModule.filterBrand('all')">
          <i class="fa-solid fa-border-all"></i>
          <span>Tất Cả</span>
        </button>
      `;
      pillsHtml += categories.map(c => `
        <button class="brand-pill-btn ${String(this.filters.brandId) === String(c.id) ? 'active' : ''}" 
                onclick="window.shopModule.filterBrand('${c.id}')">
          <i class="${c.icon || 'fa-solid fa-mobile-screen'}"></i>
          <span>${c.name}</span>
        </button>
      `).join('');
      shopPills.innerHTML = pillsHtml;
    }

    // 2. Lọc và phân trang
    const filtered = this.model.filterProducts(products, this.filters);
    const paged = this.model.paginate(filtered, this.filters.page, this.filters.pageSize);

    // Cập nhật số lượng đếm
    const countEl = document.getElementById('shop-product-count');
    if (countEl) countEl.textContent = filtered.length;

    // Render lưới sản phẩm
    window.ProductView.renderProductGrid('shop-product-grid', paged.items, compareIds, categories);

    // Render phân trang
    window.ProductView.renderPagination('shop-pagination', paged.totalPages, paged.currentPage);

    // Cập nhật dock so sánh
    this.updateCompareDock();
  }

  /** Lọc theo hãng */
  filterBrand(brandId) {
    this.filters.brandId = brandId;
    this.filters.page = 1;

    // Cập nhật class active cho các pills
    const pills = document.querySelectorAll('#shop-brand-pills .brand-pill-btn');
    pills.forEach(btn => {
      const isAct = (brandId === 'all' && btn.textContent.includes('Tất Cả')) || 
                    (btn.getAttribute('onclick')?.includes(`'${brandId}'`));
      btn.classList.toggle('active', !!isAct);
    });

    if (window.appNav) window.appNav.goTo('shop');
    this.renderShop();
  }

  /** Tìm kiếm theo từ khóa */
  search(keyword) {
    this.filters.keyword = keyword;
    this.filters.page = 1;
    this.renderShop();
  }

  /** Lọc theo khoảng giá */
  filterPrice(priceRange) {
    this.filters.priceRange = priceRange;
    this.filters.page = 1;
    this.renderShop();
  }

  /** Sắp xếp sản phẩm */
  sort(sortBy) {
    this.filters.sort = sortBy;
    this.filters.page = 1;
    this.renderShop();
  }

  /** Chuyển số trang */
  changePage(page) {
    this.filters.page = page;
    this.renderShop();
    const grid = document.getElementById('shop-product-grid');
    if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /** Đặt lại bộ lọc về mặc định */
  resetFilters() {
    this.filters = { brandId: 'all', keyword: '', priceRange: 'all', sort: 'default', page: 1, pageSize: 8 };
    const sInput = document.getElementById('shop-search-input');
    const pFilter = document.getElementById('filter-price-range');
    const sFilter = document.getElementById('filter-sort-by');
    if (sInput) sInput.value = '';
    if (pFilter) pFilter.value = 'all';
    if (sFilter) sFilter.value = 'default';

    this.renderShop();
    window.BaseView.showToast('Đã đặt lại tất cả bộ lọc', 'info');
  }

  // --- XỬ LÝ SO SÁNH SẢN PHẨM (COMPARISON LOGIC) ---
  toggleCompare(id) {
    const compareIds = this.model.getCompareIds();
    const strId = String(id);

    if (compareIds.includes(strId)) {
      this.model.removeFromCompare(strId);
      window.BaseView.showToast('Đã bỏ sản phẩm khỏi danh sách so sánh', 'info');
    } else {
      const res = this.model.addToCompare(strId);
      if (!res.success) {
        window.BaseView.showToast(res.message, 'warning');
        return;
      }
      window.BaseView.showToast(`Đã thêm vào so sánh (${res.count}/3 máy)`, 'success');
    }

    this.updateCompareButtons();
    this.updateCompareDock();
    if (document.getElementById('view-compare')?.classList.contains('active')) {
      this.renderCompare();
    }
  }

  removeCompare(id) {
    this.model.removeFromCompare(id);
    window.BaseView.showToast('Đã xóa khỏi danh sách so sánh', 'info');
    this.updateCompareButtons();
    this.updateCompareDock();
    this.renderCompare();
  }

  clearCompare() {
    this.model.clearCompare();
    window.BaseView.showToast('Đã xóa sạch danh sách so sánh', 'info');
    this.updateCompareButtons();
    this.updateCompareDock();
    this.renderCompare();
  }

  updateCompareButtons() {
    const compareIds = this.model.getCompareIds();
    document.querySelectorAll('.btn-compare-card').forEach(btn => {
      const id = btn.id?.replace('btn-compare-card-', '');
      const isAct = compareIds.includes(String(id));
      btn.classList.toggle('active', isAct);
      btn.innerHTML = `<i class="fa-solid ${isAct ? 'fa-check' : 'fa-code-compare'}"></i> <span>${isAct ? 'Đã chọn' : 'So sánh'}</span>`;
    });
  }

  updateCompareDock() {
    const compareIds = this.model.getCompareIds();
    const comparingProducts = this.model.products.filter(p => compareIds.includes(String(p.id)));
    window.ProductView.renderStickyCompareDock('sticky-compare-dock', comparingProducts);
  }

  renderCompare() {
    const compareIds = this.model.getCompareIds();
    const comparingProducts = this.model.products.filter(p => compareIds.includes(String(p.id)));
    window.ProductView.renderComparisonTable('compare-table-container', comparingProducts, this.model.categories);
  }

  scrollToCompare() {
    if (window.appNav) window.appNav.goTo('compare');
    this.renderCompare();
    const table = document.getElementById('compare-table-container');
    if (table) table.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /** Đồng hồ Flash Sale */
  initFlashSaleCountdown() {
    const boxGio = document.getElementById('flash-timer-hours') || document.getElementById('flash-sale-hours');
    const boxPhut = document.getElementById('flash-timer-minutes') || document.getElementById('flash-sale-minutes');
    const boxGiay = document.getElementById('flash-timer-seconds') || document.getElementById('flash-sale-seconds');
    if (!boxGio || !boxPhut || !boxGiay) return;

    let totalSec = 5 * 3600 + 42 * 60 + 18;
    if (window.__flashTimer) clearInterval(window.__flashTimer);

    window.__flashTimer = setInterval(() => {
      if (totalSec <= 0) totalSec = 12 * 3600;
      totalSec--;

      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;

      boxGio.textContent = String(h).padStart(2, '0');
      boxPhut.textContent = String(m).padStart(2, '0');
      boxGiay.textContent = String(s).padStart(2, '0');
    }, 1000);
  }
}

// Khởi tạo Singleton toàn cục trong namespace Controller
window.ShopController = ShopController;
