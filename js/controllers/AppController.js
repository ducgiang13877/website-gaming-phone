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
   * - Nếu view nằm ở trang HTML riêng: chuyển trang qua window.location.href!
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

      // Kích hoạt render dữ liệu cho view tương ứng
      this.triggerViewRender(viewName, params);
    } else {
      // 2. CHẾ ĐỘ ĐA TRANG (MPA MODE): Chuyển hướng sang file HTML độc lập
      let targetUrl = '';
      if (viewName === 'home') targetUrl = 'index.html';
      else if (viewName === 'shop') targetUrl = 'shop.html';
      else if (viewName === 'detail') targetUrl = `detail.html?id=${params.id || ''}`;
      else if (viewName === 'cart') targetUrl = 'cart.html';
      else if (viewName === 'checkout') targetUrl = 'checkout.html';
      else if (viewName === 'thankyou') targetUrl = `thankyou.html?orderCode=${encodeURIComponent(params.orderCode || '')}`;
      else if (viewName === 'auth') targetUrl = 'auth.html';
      else if (viewName === 'profile') targetUrl = 'profile.html';
      else if (viewName === 'tracking') targetUrl = 'tracking.html';
      else if (viewName === 'about' || viewName === 'contact') targetUrl = 'contact.html';
      else targetUrl = `${viewName}.html`;

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

    if (pathname.endsWith('shop.html') || document.getElementById('view-shop')?.classList.contains('active')) {
      const brand = urlParams.get('brand');
      if (brand && window.shopCtrl) {
        window.shopCtrl.filterBrand(brand);
      } else if (window.shopCtrl) {
        window.shopCtrl.renderShop();
      }
      window.BaseView.highlightActiveNav('shop');
    } else if (pathname.endsWith('detail.html') || document.getElementById('view-detail')?.classList.contains('active')) {
      const id = urlParams.get('id');
      if (id && window.detailCtrl) window.detailCtrl.loadDetail(id);
    } else if (pathname.endsWith('cart.html') || document.getElementById('view-cart')?.classList.contains('active')) {
      if (window.cartCtrl) window.cartCtrl.renderCart();
    } else if (pathname.endsWith('checkout.html') || document.getElementById('view-checkout')?.classList.contains('active')) {
      if (window.cartCtrl) window.cartCtrl.renderCheckout();
    } else if (pathname.endsWith('thankyou.html') || document.getElementById('view-thankyou')?.classList.contains('active')) {
      const code = urlParams.get('orderCode');
      if (window.cartCtrl) window.cartCtrl.renderThankYou(code);
    } else if (pathname.endsWith('profile.html') || document.getElementById('view-profile')?.classList.contains('active')) {
      if (window.authCtrl) window.authCtrl.renderProfile();
    } else if (pathname.endsWith('auth.html') || document.getElementById('view-auth')?.classList.contains('active')) {
      const tab = urlParams.get('tab') || 'login';
      window.UserView.switchAuthTab(tab);
    } else {
      // Trang chủ mặc định
      if (window.shopCtrl) window.shopCtrl.renderHome();
      window.BaseView.highlightActiveNav('home');
    }
  }

  /** Lọc theo hãng và chuyển sang shop */
  filterBrand(brandId) {
    if (window.shopCtrl) {
      window.shopCtrl.filterBrand(brandId);
    } else {
      window.location.href = `shop.html?brand=${brandId}`;
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
