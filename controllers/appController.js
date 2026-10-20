/**
 * ============================================================================
 * APP CONTROLLER (BỘ ĐIỀU PHỐI CLIENT TỔNG HỢP)
 * Gộp toàn bộ: AppController, ShopController, DetailController, CartController, AuthController & Bootstrap
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * ============================================================================
 */

/**
 * ============================================================================
 * CONTROLLER: AppController (Bộ Điều Phối Trung Tâm & Dual-Mode Router MPA/SPA)
 * Kiến trúc: Mô hình MVC Chuẩn - SmartStore
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * ============================================================================
 */

class AppController {
  constructor() {
    this.productModel = new window.ProductModel();
    this.cartModel = new window.CartModel();
    this.orderModel = new window.OrderModel();
    this.userModel = new window.UserModel();

    this.currentView = 'home';
  }

  /** Khởi tạo ứng dụng khi DOM đã sẵn sàng */
  async init() {
    // 1. Đồng bộ người dùng và số lượng giỏ hàng trên Navbar
    this.syncNavbar();

    // 2. Nạp dữ liệu danh mục & sản phẩm từ server
    await Promise.all([
      this.productModel.fetchCategories(),
      this.productModel.fetchAllProducts()
    ]);

    // 3. Khởi tạo router điều hướng dựa trên URL hiện tại hoặc thẻ view active
    this.handleRouteOnLoad();

    // 4. Lắng nghe sự kiện toàn cục (phím ESC, click ngoài modal)
    this.setupGlobalEvents();
  }

  /** Đồng bộ trạng thái Header & Navbar */
  syncNavbar() {
    const user = this.userModel.getCurrentUser();
    window.BaseView.renderNavUser(user);

    const cartCount = this.cartModel.getTotalCount();
    window.BaseView.updateCartBadge(cartCount);
  }

  /** 
   * 🎯 DUAL-MODE ROUTER: Điều hướng thông minh hỗ trợ cả SPA & Đa Trang (MPA)
   * - Nếu view có trong trang hiện tại: hiển thị panel và cập nhật dữ liệu.
   * - Nếu view nằm ở trang HTML khác: tự động chuyển hướng theo mô hình 5 view chuẩn.
   */
  goTo(viewName, params = {}) {
    const targetPanel = document.getElementById(`view-${viewName}`);

    if (targetPanel) {
      // 1. CHẾ ĐỘ NỘI TRANG (SPA MODE / Ở CHÍNH TRANG ĐÓ)
      document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
      targetPanel.classList.add('active');
      window.BaseView.highlightActiveNav(viewName);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.currentView = viewName;

      // Cập nhật trạng thái URL lịch sử mà không cần reload trang
      try {
        if (viewName === 'detail' && params.id) {
          history.replaceState(null, '', `?view=detail&id=${params.id}`);
        } else if (viewName === 'compare') {
          history.replaceState(null, '', `?view=compare`);
        } else if (viewName === 'checkout') {
          history.replaceState(null, '', `?view=checkout`);
        } else if (viewName === 'thankyou' && params.orderCode) {
          history.replaceState(null, '', `?view=thankyou&orderCode=${encodeURIComponent(params.orderCode)}`);
        } else if (viewName === 'profile') {
          history.replaceState(null, '', `?view=profile`);
        } else if (viewName === 'tracking') {
          history.replaceState(null, '', `?view=tracking`);
        } else if (viewName === 'contact') {
          history.replaceState(null, '', `?view=contact`);
        } else if (viewName === 'shop') {
          history.replaceState(null, '', `shop.html`);
        } else if (viewName === 'cart') {
          history.replaceState(null, '', `cart.html`);
        }
      } catch (err) {
        console.warn('History replaceState warning:', err);
      }

      // Kích hoạt render dữ liệu cho view tương ứng
      this.triggerViewRender(viewName, params);
    } else {
      // 2. CHẾ ĐỘ ĐA TRANG (MPA MODE): Chuyển hướng sang file HTML độc lập theo kiến trúc 5 View
      const inViews = window.location.pathname.toLowerCase().includes('/views/');
      const prefix = inViews ? '' : 'views/';

      let targetUrl = '';
      if (viewName === 'home') {
        targetUrl = inViews ? 'home.html' : 'views/home.html';
      } else if (viewName === 'shop') {
        targetUrl = `${prefix}shop.html`;
      } else if (viewName === 'detail') {
        targetUrl = `${prefix}shop.html?view=detail&id=${params.id || ''}`;
      } else if (viewName === 'compare') {
        targetUrl = `${prefix}shop.html?view=compare`;
      } else if (viewName === 'cart') {
        targetUrl = `${prefix}cart.html`;
      } else if (viewName === 'checkout') {
        targetUrl = `${prefix}cart.html?view=checkout`;
      } else if (viewName === 'thankyou') {
        targetUrl = `${prefix}cart.html?view=thankyou&orderCode=${encodeURIComponent(params.orderCode || '')}`;
      } else if (viewName === 'auth') {
        targetUrl = `${prefix}user.html?view=auth`;
      } else if (viewName === 'profile') {
        targetUrl = `${prefix}user.html?view=profile`;
      } else if (viewName === 'tracking') {
        targetUrl = `${prefix}user.html?view=tracking`;
      } else if (viewName === 'about' || viewName === 'contact') {
        targetUrl = `${prefix}user.html?view=contact`;
      } else if (viewName === 'admin') {
        targetUrl = `${prefix}admin.html`;
      } else {
        targetUrl = `${prefix}${viewName}.html`;
      }

      // Giữ lại các param bổ sung nếu có
      if (params && Object.keys(params).length > 0 && !targetUrl.includes('?')) {
        const queryStr = new URLSearchParams(params).toString();
        targetUrl += `?${queryStr}`;
      }

      window.location.href = targetUrl;
    }
  }

  /** Xử lý kích hoạt render dữ liệu cho từng view */
  triggerViewRender(viewName, params = {}) {
    if (viewName === 'home') {
      if (window.shopCtrl) window.shopCtrl.renderHome();
    } else if (viewName === 'shop') {
      if (window.shopCtrl) window.shopCtrl.renderShop();
    } else if (viewName === 'detail') {
      const id = params.id || new URLSearchParams(window.location.search).get('id');
      if (id && window.detailCtrl) window.detailCtrl.loadDetail(id);
    } else if (viewName === 'cart') {
      if (window.cartCtrl) window.cartCtrl.renderCart();
    } else if (viewName === 'checkout') {
      if (window.cartCtrl) window.cartCtrl.renderCheckout();
    } else if (viewName === 'thankyou') {
      const orderCode = params.orderCode || new URLSearchParams(window.location.search).get('orderCode');
      if (orderCode && window.cartCtrl) window.cartCtrl.renderThankYou(orderCode);
    } else if (viewName === 'profile') {
      if (window.authCtrl) window.authCtrl.renderProfile();
    } else if (viewName === 'compare') {
      if (window.shopCtrl) window.shopCtrl.renderCompare();
    }
  }

  /** Xử lý Router khi tải trang (Đọc URL params) */
  handleRouteOnLoad() {
    const pathname = window.location.pathname.toLowerCase();
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');

    if (pathname.endsWith('shop.html')) {
      if (viewParam === 'detail' || urlParams.get('id')) {
        const id = urlParams.get('id');
        this.goTo('detail', { id });
      } else if (viewParam === 'compare') {
        this.goTo('compare');
      } else {
        const brand = urlParams.get('brand');
        if (brand && window.shopCtrl) {
          window.shopCtrl.filterBrand(brand);
        } else if (window.shopCtrl) {
          window.shopCtrl.renderShop();
        }
        window.BaseView.highlightActiveNav('shop');
      }
    } else if (pathname.endsWith('cart.html')) {
      if (viewParam === 'checkout') {
        this.goTo('checkout');
      } else if (viewParam === 'thankyou' || urlParams.get('orderCode')) {
        const code = urlParams.get('orderCode');
        this.goTo('thankyou', { orderCode: code });
      } else {
        this.goTo('cart');
      }
    } else if (pathname.endsWith('user.html')) {
      if (viewParam === 'profile') {
        this.goTo('profile');
      } else if (viewParam === 'tracking') {
        this.goTo('tracking');
      } else if (viewParam === 'contact' || viewParam === 'about') {
        this.goTo('contact');
      } else {
        const tab = urlParams.get('tab') || 'login';
        this.goTo('auth');
        if (window.UserView && window.UserView.switchAuthTab) {
          window.UserView.switchAuthTab(tab);
        }
      }
    } else if (pathname.endsWith('home.html') || pathname.endsWith('index.html') || pathname.endsWith('/')) {
      if (window.shopCtrl) window.shopCtrl.renderHome();
      window.BaseView.highlightActiveNav('home');
    }
  }

  /** Lọc theo hãng và chuyển sang shop */
  filterBrand(brandId) {
    const inViews = window.location.pathname.toLowerCase().includes('/views/');
    const shopUrl = `${inViews ? '' : 'views/'}shop.html?brand=${brandId}`;

    if (window.shopCtrl && document.getElementById('view-shop')) {
      window.shopCtrl.filterBrand(brandId);
    } else {
      window.location.href = shopUrl;
    }
  }

  /** Mở hộp thoại xem nhanh cấu hình sản phẩm */
  async quickView(id) {
    const sp = await this.productModel.fetchProductById(id);
    if (!sp) {
      window.BaseView.showToast('Không tìm thấy sản phẩm!', 'error');
      return;
    }
    const cat = this.productModel.categories.find(c => String(c.id) === String(sp.categoryId || sp.cate_id));
    const catName = cat ? cat.name : (sp.brand || '');
    window.ProductView.renderQuickViewModal('quick-view-body', sp, catName);
    window.BaseView.openModal('quick-view-modal');
  }

  /** Đóng modal */
  closeModal(modalId) {
    window.BaseView.closeModal(modalId);
  }

  /** Thiết lập lắng nghe sự kiện toàn cục */
  setupGlobalEvents() {
    // Đóng modal khi nhấn phím ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        window.BaseView.closeAllModals();
      }
    });

    // Đóng modal khi click ra lớp phủ mờ bên ngoài
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          window.BaseView.closeModal(overlay.id);
        }
      });
    });
  }
}

// Khởi tạo Singleton toàn cục trong namespace Controller
window.AppController = AppController;


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


/**
 * ============================================================================
 * CONTROLLER: DetailController (Điều phối Trang Chi Tiết Sản Phẩm & Mua Ngay)
 * Kiến trúc: Mô hình MVC Chuẩn - SmartStore
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * ============================================================================
 */

class DetailController {
  constructor(productModel, cartModel) {
    this.productModel = productModel || new window.ProductModel();
    this.cartModel = cartModel || new window.CartModel();
    this.currentProduct = null;
  }

  /** Nạp và hiển thị chi tiết sản phẩm */
  async loadDetail(productId) {
    let sp = this.productModel.products.find(p => String(p.id) === String(productId));
    if (!sp) {
      sp = await this.productModel.fetchProductById(productId);
    }

    if (!sp) {
      window.BaseView.showToast('Không tìm thấy sản phẩm yêu cầu!', 'error');
      if (window.appNav) window.appNav.goTo('shop');
      return;
    }

    this.currentProduct = sp;

    // Breadcrumb
    const breadcrumb = document.getElementById('detail-breadcrumb-name');
    if (breadcrumb) breadcrumb.textContent = sp.name;

    // Lấy tên hãng
    const cat = this.productModel.categories.find(c => String(c.id) === String(sp.categoryId || sp.cate_id));
    const catName = cat ? cat.name : (sp.brand || '');
    const isComparing = this.productModel.getCompareIds().includes(String(sp.id));

    // Render thông tin chi tiết & Bảng 10 thông số chuẩn CellphoneS
    window.ProductView.renderProductDetail('product-detail-container', sp, catName, isComparing);
  }

  /** Tăng giảm số lượng chọn mua trên trang chi tiết */
  changeQty(delta) {
    const input = document.getElementById('detail-qty-input');
    if (!input || !this.currentProduct) return;

    let val = parseInt(input.value) || 1;
    const maxStock = (this.currentProduct.stock !== undefined && this.currentProduct.stock !== null) 
      ? Number(this.currentProduct.stock) 
      : (Number(this.currentProduct.quantity) || 10);

    val += delta;
    if (val < 1) val = 1;
    if (val > maxStock) {
      val = maxStock;
      window.BaseView.showToast(`Rất tiếc, kho chỉ còn sẵn tối đa ${maxStock} máy!`, 'warning');
    }

    input.value = val;
  }

  /** Lấy số lượng hiện tại */
  getQty() {
    const input = document.getElementById('detail-qty-input');
    return input ? (parseInt(input.value) || 1) : 1;
  }

  /** Mua ngay: Thêm vào giỏ hàng và chuyển hướng ngay tới Thanh Toán */
  buyNow(productId) {
    const qty = this.getQty();
    let sp = this.currentProduct;
    if (!sp || String(sp.id) !== String(productId)) {
      sp = this.productModel.products.find(p => String(p.id) === String(productId));
    }

    if (!sp) {
      window.BaseView.showToast('Không tìm thấy thông tin sản phẩm!', 'error');
      return;
    }

    const res = this.cartModel.addItem(sp, qty);
    if (!res.success) {
      window.BaseView.showToast(res.message, 'warning');
      return;
    }

    // Cập nhật badge giỏ hàng
    window.BaseView.updateCartBadge(this.cartModel.getTotalCount());

    window.BaseView.showToast(`Đã thêm ${sp.name} vào giỏ. Đang chuyển tới thanh toán...`, 'success');
    setTimeout(() => {
      if (window.appNav) window.appNav.goTo('checkout');
    }, 400);
  }
}

// Khởi tạo Singleton toàn cục trong namespace Controller
window.DetailController = DetailController;


/**
 * ============================================================================
 * CONTROLLER: CartController (Điều phối Giỏ Hàng, Voucher, Thanh Toán & Hóa Đơn)
 * Kiến trúc: Mô hình MVC Chuẩn - SmartStore
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * ============================================================================
 */

class CartController {
  constructor(cartModel, productModel, orderModel, userModel) {
    this.cartModel = cartModel || new window.CartModel();
    this.productModel = productModel || new window.ProductModel();
    this.orderModel = orderModel || new window.OrderModel();
    this.userModel = userModel || new window.UserModel();
  }

  /** Thêm sản phẩm vào giỏ hàng */
  async add(productId, quantity = 1) {
    let sp = this.productModel.products.find(p => String(p.id) === String(productId));
    if (!sp) {
      sp = await this.productModel.fetchProductById(productId);
    }

    if (!sp) {
      window.BaseView.showToast('Không tìm thấy sản phẩm!', 'error');
      return;
    }

    const res = this.cartModel.addItem(sp, quantity);
    if (!res.success) {
      window.BaseView.showToast(res.message, 'warning');
      return;
    }

    // Cập nhật số lượng trên Header
    window.BaseView.updateCartBadge(this.cartModel.getTotalCount());
    window.BaseView.showToast(`Đã thêm ${quantity} máy "${sp.name}" vào giỏ hàng!`, 'success');

    // Nếu đang ở màn hình giỏ hàng, cập nhật lại bảng
    if (document.getElementById('view-cart')?.classList.contains('active')) {
      this.renderCart();
    }
  }

  /** Thay đổi số lượng sản phẩm trong giỏ */
  changeQty(productId, delta) {
    const res = this.cartModel.changeQuantity(productId, delta);
    if (!res.success) {
      if (res.requireDelete) {
        this.remove(productId);
        return;
      }
      if (res.message) window.BaseView.showToast(res.message, 'warning');
      return;
    }

    window.BaseView.updateCartBadge(this.cartModel.getTotalCount());
    this.renderCart();
  }

  /** Xóa sản phẩm khỏi giỏ */
  remove(productId) {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?')) {
      return;
    }

    this.cartModel.removeItem(productId);
    window.BaseView.updateCartBadge(this.cartModel.getTotalCount());
    window.BaseView.showToast('Đã xóa sản phẩm khỏi giỏ hàng', 'info');
    this.renderCart();
  }

  /** Xóa sạch giỏ hàng */
  clear() {
    if (this.cartModel.getItems().length === 0) return;
    if (!confirm('Bạn có chắc chắn muốn làm trống toàn bộ giỏ hàng?')) return;

    this.cartModel.clearCart();
    window.BaseView.updateCartBadge(0);
    window.BaseView.showToast('Đã xóa sạch giỏ hàng', 'info');
    this.renderCart();
  }

  /** Render giao diện Trang Giỏ Hàng */
  renderCart() {
    const items = this.cartModel.getItems();
    const subtotal = this.cartModel.getSubtotal();
    window.CartView.renderCartTable(items, subtotal);
  }

  /** Render giao diện Trang Thanh Toán (Checkout) */
  async renderCheckout() {
    const items = this.cartModel.getItems();
    if (!items || items.length === 0) {
      window.BaseView.showToast('Giỏ hàng của bạn đang trống! Hãy chọn mua sản phẩm trước.', 'warning');
      if (window.appNav) window.appNav.goTo('shop');
      return;
    }

    const subtotal = this.cartModel.getSubtotal();
    const appliedVoucher = this.cartModel.getAppliedVoucher();
    const discount = this.cartModel.calculateDiscount(subtotal);
    const total = this.cartModel.getFinalTotal();

    // 1. Render tóm tắt đơn hàng
    window.CartView.renderCheckoutSummary(items, subtotal, discount, total, appliedVoucher);

    // 2. Nạp danh sách mã giảm giá gợi ý
    const vouchers = await this.cartModel.fetchVouchers();
    window.CartView.renderVoucherChips(vouchers, appliedVoucher, subtotal);

    // 3. Tự động điền thông tin nếu khách hàng đã đăng nhập
    const user = this.userModel.getCurrentUser();
    if (user) {
      const nameInput = document.getElementById('checkout-name');
      const emailInput = document.getElementById('checkout-email');
      const phoneInput = document.getElementById('checkout-phone');
      const addrInput = document.getElementById('checkout-address');

      if (nameInput && !nameInput.value) nameInput.value = user.name || '';
      if (emailInput && !emailInput.value) emailInput.value = user.email || '';
      if (phoneInput && !phoneInput.value) phoneInput.value = user.phone || '';
      if (addrInput && !addrInput.value) addrInput.value = user.address || '';
    }
  }

  /** Áp dụng mã giảm giá Voucher */
  async applyVoucher(inputCode) {
    const code = (inputCode || document.getElementById('input-voucher-code')?.value || document.getElementById('checkout-voucher-input')?.value || '').trim().toUpperCase();
    if (!code) {
      window.BaseView.showToast('Vui lòng nhập mã giảm giá!', 'warning');
      return;
    }

    const subtotal = this.cartModel.getSubtotal();
    const vouchers = await this.cartModel.fetchVouchers();
    const voucher = vouchers.find(v => v.code.toUpperCase() === code);

    if (!voucher) {
      window.BaseView.showToast(`Mã giảm giá "${code}" không hợp lệ hoặc đã hết hạn!`, 'error');
      return;
    }

    if (voucher.minOrder && subtotal < voucher.minOrder) {
      const formatCurrency = BaseView.formatCurrency;
      window.BaseView.showToast(`Mã "${code}" chỉ áp dụng cho đơn hàng từ ${formatCurrency(voucher.minOrder)}!`, 'warning');
      return;
    }

    this.cartModel.setAppliedVoucher(voucher);
    const discount = this.cartModel.calculateDiscount(subtotal);
    window.BaseView.showToast(`Áp dụng thành công mã "${code}"! Giảm ${BaseView.formatCurrency(discount)}.`, 'success');

    this.renderCheckout();
  }

  /** Chọn nhanh voucher từ chip */
  selectVoucherChip(code) {
    const input = document.getElementById('input-voucher-code') || document.getElementById('checkout-voucher-input');
    if (input) input.value = code;
    this.applyVoucher(code);
  }

  /** Hủy bỏ mã giảm giá đang dùng */
  cancelVoucher() {
    this.cartModel.clearVoucher();
    const input = document.getElementById('input-voucher-code') || document.getElementById('checkout-voucher-input');
    if (input) input.value = '';

    window.BaseView.showToast('Đã gỡ bỏ mã giảm giá', 'info');
    this.renderCheckout();
  }

  /** Xử lý Đặt hàng (Thanh toán đơn hàng) */
  async processOrder(e) {
    if (e) e.preventDefault();

    // 1. Kiểm tra Hard-Block: Chặn tài khoản Quản trị viên (Admin) đặt hàng
    const currentUser = this.userModel.getCurrentUser();
    if (currentUser && currentUser.role === 'admin') {
      alert('⚠️ QUYỀN TRUY CẬP BỊ TỪ CHỐI!\n\nTài khoản Quản trị viên (Admin) không được phép thực hiện chức năng mua sắm hoặc đặt đơn hàng của khách hàng.\n\nVui lòng đăng xuất hoặc sử dụng tài khoản Khách hàng để trải nghiệm mua sắm!');
      return;
    }

    // 2. Lấy dữ liệu biểu mẫu thanh toán
    const name = document.getElementById('checkout-name')?.value.trim();
    const phone = document.getElementById('checkout-phone')?.value.trim();
    const email = document.getElementById('checkout-email')?.value.trim() || '';
    const address = document.getElementById('checkout-address')?.value.trim();
    const note = document.getElementById('checkout-note')?.value.trim() || '';
    const paymentMethodEl = document.querySelector('input[name="payment_method"]:checked');
    const paymentMethod = paymentMethodEl ? paymentMethodEl.value : 'COD';

    if (!name || !phone || !address) {
      window.BaseView.showToast('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ nhận máy!', 'warning');
      return;
    }

    const items = this.cartModel.getItems();
    if (items.length === 0) {
      window.BaseView.showToast('Giỏ hàng trống!', 'error');
      return;
    }

    const subtotal = this.cartModel.getSubtotal();
    const appliedVoucher = this.cartModel.getAppliedVoucher();
    const discount = this.cartModel.calculateDiscount(subtotal);
    const totalAmount = this.cartModel.getFinalTotal();

    // Sinh mã đơn hàng ngẫu nhiên chuyên nghiệp
    const randomSuffix = Math.floor(100000000 + Math.random() * 900000000);
    const orderCode = `#DH${randomSuffix}`;

    const newOrder = {
      orderCode,
      userId: currentUser ? String(currentUser.id) : null,
      customerName: name,
      customerPhone: phone,
      customerEmail: email,
      customerAddress: address,
      note,
      paymentMethod,
      items: [...items],
      subtotal,
      voucherCode: appliedVoucher ? appliedVoucher.code : null,
      discountAmount: discount,
      totalAmount,
      status: 'processing',
      createdAt: new Date().toISOString()
    };

    // 3. Gửi đơn hàng lên server
    const createdOrder = await this.orderModel.createOrder(newOrder);
    if (!createdOrder) {
      window.BaseView.showToast('Lỗi máy chủ khi tạo đơn hàng, vui lòng thử lại!', 'error');
      return;
    }

    // 4. Trừ tồn kho và tăng số lượng đã bán trên db.json
    const stockUpdates = items.map(async item => {
      const sp = await this.productModel.fetchProductById(item.id);
      if (sp) {
        const khoMoi = Math.max(0, (Number(sp.stock) || Number(sp.quantity) || 0) - item.quantity);
        const daBanMoi = (Number(sp.sold) || 0) + item.quantity;
        return this.productModel.updateStock(item.id, khoMoi, daBanMoi);
      }
    });
    await Promise.all(stockUpdates);

    // 5. Làm sạch giỏ hàng & voucher
    this.cartModel.clearCart();
    window.BaseView.updateCartBadge(0);

    window.BaseView.showToast('Đặt hàng thành công! Đang chuyển đến biên nhận đơn...', 'success');

    // 6. Chuyển sang màn hình cảm ơn
    setTimeout(() => {
      if (window.appNav) {
        window.appNav.goTo('thankyou', { orderCode });
      }
    }, 500);
  }

  /** Render Màn hình Cảm ơn (Thank You View) */
  async renderThankYou(orderCode) {
    let order = null;
    if (orderCode) {
      order = await this.orderModel.fetchOrderByCode(orderCode);
    }
    if (!order) {
      order = this.orderModel.getRecentOrder();
    }

    if (!order) {
      window.BaseView.showToast('Không tìm thấy thông tin đơn hàng vừa đặt!', 'warning');
      return;
    }

    window.OrderView.renderThankYouView(order);
  }

  /** Mở Hộp thoại Xem Chi Tiết Hóa Đơn Bán Lẻ Kiêm Phiếu Bảo Hành */
  async openCustomerInvoice(orderCode) {
    let order = null;
    if (orderCode) {
      order = await this.orderModel.fetchOrderByCode(orderCode);
    }
    if (!order) {
      order = this.orderModel.getRecentOrder();
    }

    if (!order) {
      window.BaseView.showToast('Không tìm thấy hóa đơn của đơn hàng này!', 'error');
      return;
    }

    window.OrderView.renderInvoiceModal('customer-invoice-body', order);
    window.BaseView.openModal('customer-invoice-modal');
  }

  /** In hóa đơn trực tiếp */
  printInvoice() {
    window.print();
  }

  /**
   * 🎯 NÚT "XEM ĐƠN HÀNG CỦA TÔI":
   * Phân luồng điều hướng thông minh theo phiên làm việc:
   * - Nếu đã đăng nhập tài khoản: Chuyển thẳng về Hồ Sơ Cá Nhân (profile) -> Tab Lịch Sử Đơn Hàng.
   * - Nếu chưa đăng nhập: Chuyển sang Tra Cứu Đơn Hàng (tracking) và tự động điền sẵn mã đơn vừa đặt!
   */
  xemDonHangCuaToi() {
    const currentUser = this.userModel.getCurrentUser();
    const recentOrder = this.orderModel.getRecentOrder();
    const orderCodeEl = document.getElementById('thankyou-order-code');
    const orderCode = (orderCodeEl ? orderCodeEl.textContent.trim() : '') || (recentOrder ? recentOrder.orderCode : '');

    if (currentUser) {
      window.BaseView.showToast(`Đang mở danh sách đơn hàng của bạn (${currentUser.name || currentUser.email})...`, 'info');
      if (window.appNav) window.appNav.goTo('profile');
    } else {
      window.BaseView.showToast('Đang chuyển tới trang Tra Cứu Vận Đơn...', 'info');
      if (window.appNav) window.appNav.goTo('tracking');

      setTimeout(() => {
        const trackingInput = document.getElementById('tracking-order-input') || document.getElementById('tracking-input');
        if (trackingInput && orderCode) {
          trackingInput.value = orderCode;
          if (window.authCtrl) window.authCtrl.searchOrders(orderCode);
        }
      }, 300);
    }
  }
}

// Khởi tạo Singleton toàn cục trong namespace Controller
window.CartController = CartController;


/**
 * ============================================================================
 * CONTROLLER: AuthController (Điều phối Đăng Nhập, Đăng Ký, Hồ Sơ & Tra Cứu)
 * Kiến trúc: Mô hình MVC Chuẩn - SmartStore
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * ============================================================================
 */

class AuthController {
  constructor(userModel, orderModel) {
    this.userModel = userModel || new window.UserModel();
    this.orderModel = orderModel || new window.OrderModel();
    this.matchedIdentityUser = null;
  }

  /** Chuyển tab Đăng nhập / Đăng ký */
  switchTab(tab) {
    window.UserView.switchAuthTab(tab);
  }

  /** Xử lý Đăng Nhập */
  async login(e) {
    if (e) e.preventDefault();

    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value.trim();

    if (!email || !password) {
      window.BaseView.showToast('Vui lòng nhập đầy đủ Email và Mật khẩu!', 'warning');
      return;
    }

    const res = await this.userModel.login(email, password);
    if (!res.success) {
      window.BaseView.showToast(res.message, 'error');
      return;
    }

    const user = res.user;
    window.BaseView.renderNavUser(user);
    window.BaseView.showToast(`Chào mừng ${user.name || user.email} quay trở lại!`, 'success');

    if (user.role === 'admin') {
      setTimeout(() => {
        if (window.appNav) {
          window.appNav.goTo('admin');
        } else {
          const inViews = window.location.pathname.toLowerCase().includes('/views/');
          window.location.href = `${inViews ? '' : 'views/'}admin.html`;
        }
      }, 600);
    } else {
      setTimeout(() => {
        if (window.appNav) window.appNav.goTo('profile');
      }, 500);
    }
  }

  /** Xử lý Đăng Ký Tài Khoản Mới */
  async register(e) {
    if (e) e.preventDefault();

    const name = document.getElementById('reg-name')?.value.trim();
    const email = document.getElementById('reg-email')?.value.trim();
    const password = document.getElementById('reg-password')?.value.trim();
    const confirmInput = document.getElementById('reg-confirm-password');
    const phone = document.getElementById('reg-phone')?.value.trim() || '';
    const address = document.getElementById('reg-address')?.value.trim() || '';

    if (!name || !email || !password) {
      window.BaseView.showToast('Vui lòng điền đủ Họ tên, Email và Mật khẩu!', 'warning');
      return;
    }

    if (password.length < 4) {
      window.BaseView.showToast('Mật khẩu phải có ít nhất 4 ký tự!', 'warning');
      return;
    }

    if (confirmInput && password !== confirmInput.value.trim()) {
      window.BaseView.showToast('Mật khẩu xác nhận không trùng khớp!', 'error');
      return;
    }

    const res = await this.userModel.register(name, email, password, phone, address);
    if (!res.success) {
      window.BaseView.showToast(res.message, 'error');
      return;
    }

    const user = res.user;
    window.BaseView.renderNavUser(user);
    window.BaseView.showToast('Đăng ký tài khoản thành công! Tự động đăng nhập...', 'success');

    setTimeout(() => {
      if (window.appNav) window.appNav.goTo('profile');
    }, 500);
  }

  /** Đăng xuất tài khoản */
  logout() {
    if (!confirm('Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này?')) return;

    this.userModel.logout();
    window.BaseView.renderNavUser(null);
    window.BaseView.showToast('Đã đăng xuất tài khoản thành công', 'info');

    if (window.appNav) window.appNav.goTo('home');
  }

  /** Render thông tin Hồ sơ cá nhân và Lịch sử đơn hàng */
  async renderProfile() {
    const user = this.userModel.getCurrentUser();
    if (!user) {
      window.BaseView.showToast('Vui lòng đăng nhập để xem thông tin hồ sơ!', 'warning');
      if (window.appNav) window.appNav.goTo('auth');
      return;
    }

    // 1. Điền thông tin vào form
    window.UserView.renderProfileForm(user);

    // 2. Nạp danh sách đơn hàng đã mua từ database
    const orders = await this.orderModel.fetchOrdersByUserId(user.id);
    const tbodyId = document.getElementById('user-orders-tbody') ? 'user-orders-tbody' : 'profile-orders-tbody';
    window.OrderView.renderUserOrders(tbodyId, orders);
  }

  /** Cập nhật thông tin hồ sơ */
  async updateProfile(e) {
    if (e) e.preventDefault();

    const user = this.userModel.getCurrentUser();
    if (!user) return;

    const name = document.getElementById('profile-name')?.value.trim();
    const phone = document.getElementById('profile-phone')?.value.trim();
    const address = document.getElementById('profile-address')?.value.trim();

    if (!name) {
      window.BaseView.showToast('Họ và tên không được để trống!', 'warning');
      return;
    }

    const res = await this.userModel.updateProfile(user.id, { name, phone, address });
    if (!res.success) {
      window.BaseView.showToast('Cập nhật hồ sơ thất bại: ' + res.message, 'error');
      return;
    }

    window.BaseView.renderNavUser(res.user);
    window.BaseView.showToast('Cập nhật hồ sơ cá nhân thành công!', 'success');
  }

  /** 
   * 🎯 Khách hàng tự hủy đơn hàng
   * - Bắt buộc có thông báo xác nhận bảo đảm an toàn.
   * - Hoàn trả tồn kho cho tất cả sản phẩm trong đơn.
   */
  async cancelOrder(orderId, orderCode) {
    if (!confirm(`XÁC NHẬN HỦY ĐƠN HÀNG #${orderCode}:\n\nBạn có chắc chắn muốn hủy đơn hàng này không?\nToàn bộ sản phẩm sẽ được tự động hoàn trả về tồn kho của hệ thống.`)) {
      return;
    }

    const res = await this.orderModel.cancelOrder(orderId);
    if (!res.success) {
      window.BaseView.showToast('Lỗi khi hủy đơn hàng: ' + res.error, 'error');
      return;
    }

    window.BaseView.showToast(`Đã hủy đơn hàng #${orderCode} thành công. Tồn kho đã được hoàn trả!`, 'info');

    // Nạp lại danh sách đơn hàng trong Profile
    this.renderProfile();
  }

  /** Tra cứu tiến trình đơn hàng bằng Mã đơn hoặc Số điện thoại */
  async searchOrders(queryInput) {
    const q = (queryInput || document.getElementById('tracking-order-input')?.value || document.getElementById('tracking-input')?.value || '').trim();
    if (!q) {
      window.BaseView.showToast('Vui lòng nhập Mã đơn hàng hoặc Số điện thoại!', 'warning');
      return;
    }

    const orders = await this.orderModel.searchOrders(q);
    const resultBox = document.getElementById('tracking-result-box') || document.getElementById('tracking-results-box');
    if (resultBox) {
      resultBox.style.display = 'block';
      window.OrderView.renderTrackingResult(resultBox.id, orders);
    }
  }

  // --- SMART IDENTITY RESOLUTION (NHẬN DIỆN DANH TÍNH THÔNG MINH) ---
  async checkCheckoutEmail(email) {
    if (!email || !email.includes('@')) return;

    const matched = await this.userModel.checkIdentityByEmail(email);
    const currentUser = this.userModel.getCurrentUser();

    // Chỉ gợi ý nếu khách chưa đăng nhập hoặc đang điền email của tài khoản khác
    if (matched && (!currentUser || String(currentUser.id) !== String(matched.id))) {
      this.matchedIdentityUser = matched;
      window.UserView.renderSmartIdentityCard('smart-identity-resolution-card', matched);
    } else {
      this.matchedIdentityUser = null;
      window.UserView.renderSmartIdentityCard('smart-identity-resolution-card', null);
    }
  }

  confirmSmartIdentity() {
    if (!this.matchedIdentityUser) return;
    const u = this.matchedIdentityUser;

    const nameInput = document.getElementById('checkout-name');
    const phoneInput = document.getElementById('checkout-phone');
    const addrInput = document.getElementById('checkout-address');

    if (nameInput) nameInput.value = u.name || '';
    if (phoneInput) phoneInput.value = u.phone || '';
    if (addrInput) addrInput.value = u.address || '';

    window.BaseView.showToast(`Đã tự động điền thông tin của ${u.name || u.email}!`, 'success');
    window.UserView.renderSmartIdentityCard('smart-identity-resolution-card', null);
  }

  cancelSmartIdentity() {
    this.matchedIdentityUser = null;
    window.UserView.renderSmartIdentityCard('smart-identity-resolution-card', null);
  }
}

// Khởi tạo Singleton toàn cục trong namespace Controller
window.AuthController = AuthController;


/**
 * ============================================================================
 * MVC BOOTSTRAP & BACKWARD COMPATIBILITY ADAPTER
 * SmartStore - Thế Giới Smartphone & Gaming Phone
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * ============================================================================
 */

(function() {
  'use strict';

  // 1. Khởi tạo đối tượng Controllers trung tâm
  const appCtrl = new window.AppController();
  const shopCtrl = new window.ShopController(appCtrl.productModel);
  const detailCtrl = new window.DetailController(appCtrl.productModel, appCtrl.cartModel);
  const cartCtrl = new window.CartController(appCtrl.cartModel, appCtrl.productModel, appCtrl.orderModel, appCtrl.userModel);
  const authCtrl = new window.AuthController(appCtrl.userModel, appCtrl.orderModel);

  window.appCtrl = appCtrl;
  window.shopCtrl = shopCtrl;
  window.detailCtrl = detailCtrl;
  window.cartCtrl = cartCtrl;
  window.authCtrl = authCtrl;

  // 2. Gán 100% Backward Compatibility Interfaces cho HTML và các hàm toàn cục
  window.appNav = {
    goTo: (view, params) => appCtrl.goTo(view, params),
    filterBrand: (brandId) => appCtrl.filterBrand(brandId),
    quickView: (id) => appCtrl.quickView(id),
    closeModal: (id) => appCtrl.closeModal(id)
  };

  window.shopModule = {
    filterBrand: (b) => shopCtrl.filterBrand(b),
    search: (q) => shopCtrl.search(q),
    filterPrice: (p) => shopCtrl.filterPrice(p),
    sort: (s) => shopCtrl.sort(s),
    changePage: (p) => shopCtrl.changePage(p),
    resetFilters: () => shopCtrl.resetFilters(),
    scrollToCompare: () => shopCtrl.scrollToCompare()
  };

  window.compareModule = {
    toggle: (id) => shopCtrl.toggleCompare(id),
    add: (id) => shopCtrl.toggleCompare(id),
    remove: (id) => shopCtrl.removeCompare(id),
    clear: () => shopCtrl.clearCompare()
  };

  window.detailModule = {
    loadDetail: (id) => detailCtrl.loadDetail(id),
    changeQty: (delta) => detailCtrl.changeQty(delta),
    getQty: () => detailCtrl.getQty(),
    buyNow: (id) => detailCtrl.buyNow(id)
  };

  window.cartModule = {
    add: (id, qty) => cartCtrl.add(id, qty),
    changeQty: (id, delta) => cartCtrl.changeQty(id, delta),
    remove: (id) => cartCtrl.remove(id),
    clear: () => cartCtrl.clear(),
    applyVoucher: (code) => cartCtrl.applyVoucher(code),
    selectVoucherChip: (code) => cartCtrl.selectVoucherChip(code),
    cancelVoucher: () => cartCtrl.cancelVoucher(),
    openCustomerInvoice: (orderCode) => cartCtrl.openCustomerInvoice(orderCode),
    viewInvoice: (orderCode) => cartCtrl.openCustomerInvoice(orderCode),
    printInvoice: () => cartCtrl.printInvoice(),
    xemDonHangCuaToi: () => cartCtrl.xemDonHangCuaToi(),
    viewMyOrders: () => cartCtrl.xemDonHangCuaToi()
  };

  window.authModule = {
    switchTab: (tab) => authCtrl.switchTab(tab),
    login: (e) => authCtrl.login(e),
    register: (e) => authCtrl.register(e),
    logout: () => authCtrl.logout(),
    updateProfile: (e) => authCtrl.updateProfile(e),
    cancelOrder: (id, code) => authCtrl.cancelOrder(id, code),
    searchOrders: (q) => authCtrl.searchOrders(q),
    confirmSmartIdentity: () => authCtrl.confirmSmartIdentity(),
    cancelSmartIdentity: () => authCtrl.cancelSmartIdentity()
  };

  // 3. Khởi tạo khi DOM sẵn sàng
  document.addEventListener('DOMContentLoaded', async () => {
    await appCtrl.init();

    // 0. Điều hướng Menu Header chính
    document.querySelectorAll('.main-nav .nav-item').forEach(nut => {
      nut.addEventListener('click', () => {
        const view = nut.getAttribute('data-view');
        if (view) appCtrl.goTo(view);
      });
    });

    // Gắn sự kiện submit cho các biểu mẫu (Forms)
    // Form tìm kiếm Shop
    const searchForm = document.getElementById('shop-search-form');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const kw = document.getElementById('shop-search-input')?.value || '';
        shopCtrl.search(kw);
      });
    }

    // Input tìm kiếm thời gian thực
    const searchInput = document.getElementById('shop-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        shopCtrl.search(e.target.value);
      });
    }

    // Lọc giá & sắp xếp
    document.getElementById('filter-price-range')?.addEventListener('change', (e) => {
      shopCtrl.filterPrice(e.target.value);
    });
    document.getElementById('filter-sort-by')?.addEventListener('change', (e) => {
      shopCtrl.sort(e.target.value);
    });

    // Nút áp dụng mã giảm giá
    document.getElementById('btn-apply-voucher')?.addEventListener('click', () => {
      cartCtrl.applyVoucher();
    });

    // Nút xóa hết giỏ hàng
    document.getElementById('btn-clear-cart')?.addEventListener('click', () => {
      cartCtrl.clear();
    });

    // Nút đặt lại bộ lọc
    document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
      shopCtrl.resetFilters();
    });

    // Form thanh toán (Checkout)
    document.getElementById('checkout-form')?.addEventListener('submit', (e) => {
      cartCtrl.processOrder(e);
    });

    // Smart Identity Resolution: Lắng nghe gõ email tại checkout
    const checkoutEmailInput = document.getElementById('checkout-email');
    if (checkoutEmailInput) {
      checkoutEmailInput.addEventListener('blur', (e) => {
        authCtrl.checkCheckoutEmail(e.target.value);
      });
    }

    // Form đăng nhập & đăng ký
    const loginForm = document.getElementById('auth-login-form') || document.getElementById('form-login');
    loginForm?.addEventListener('submit', (e) => {
      authCtrl.login(e);
    });

    const registerForm = document.getElementById('auth-register-form') || document.getElementById('form-register');
    registerForm?.addEventListener('submit', (e) => {
      authCtrl.register(e);
    });

    // Form cập nhật hồ sơ cá nhân
    const profileForm = document.getElementById('profile-form') || document.getElementById('profile-edit-form');
    profileForm?.addEventListener('submit', (e) => {
      authCtrl.updateProfile(e);
    });

    // Form tra cứu đơn hàng & nút kiểm tra
    document.getElementById('tracking-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      authCtrl.searchOrders();
    });
    document.getElementById('btn-tracking-search')?.addEventListener('click', () => {
      authCtrl.searchOrders();
    });
    document.getElementById('tracking-input')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        authCtrl.searchOrders();
      }
    });

    // Nút đăng nhập trong thẻ nhận diện thông minh (Smart Identity Resolution)
    document.getElementById('btn-smart-login-submit')?.addEventListener('click', () => {
      authCtrl.confirmSmartIdentity();
    });
    document.getElementById('btn-smart-cancel')?.addEventListener('click', () => {
      authCtrl.cancelSmartIdentity();
    });

    // Form gửi liên hệ
    document.getElementById('contact-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      window.BaseView.showToast('Cảm ơn bạn đã gửi tin nhắn! SmartStore sẽ liên hệ phản hồi trong 30 phút.', 'success');
      e.target.reset();
    });
  });
})();


