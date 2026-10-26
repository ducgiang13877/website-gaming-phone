/**
 * ============================================================================
 * 📋 MỤC LỤC CÁC HÀM & TÁC DỤNG (TABLE OF CONTENTS):
 * ----------------------------------------------------------------------------
 * 1. Khởi Tạo & Điều Hướng Master Controller (createAppController):
 *    • init()                           : [BƯỚC 1-6 KHỞI TẠO] Đồng bộ Navbar, fetch song song danh mục & sản phẩm, khởi động router
 *    • syncNavbar()                     : Đồng bộ thông tin người dùng đang đăng nhập & badge số lượng giỏ hàng
 *    • goTo(viewName, params)           : [ROUTER DUAL-MODE] Điều hướng thông minh: chuyển panel SPA hoặc redirect MPA (.html)
 *    • triggerViewRender(view, params)  : Kích hoạt hàm render chuyên trách tương ứng (Shop, Detail, Cart, Checkout...)
 *    • handleRouteOnLoad()              : Phân tích đường dẫn tệp HTML và Query Parameters (?view=...) để kích hoạt view tương ứng
 *    • filterBrand(brandId)             : Lọc sản phẩm theo thương hiệu và chuyển hướng trang Shop nếu đang ở trang khác
 *    • quickView(id)                    : Mở hộp thoại Modal xem nhanh cấu hình sản phẩm (Quick View)
 *    • closeModal(modalId)              : Đóng hộp thoại Modal
 *    • setupGlobalEvents()              : Đăng ký lắng nghe sự kiện phím ESC và click ra ngoài backdrop để đóng modal
 *
 * 2. Cầu Nối Tương Thích Ngược Toàn Cục (Backward Compatibility IIFE Modules):
 *    • window.appNav                    : Giao diện điều hướng toàn cục (goTo, filterBrand, quickView, closeModal)
 *    • window.shopModule                : Cầu nối gọi các hàm lọc, tìm kiếm, phân trang và so sánh của ShopController
 *    • window.compareModule             : Cầu nối thêm/xóa/xóa sạch so sánh đối đầu
 *    • window.detailModule              : Cầu nối nạp thông số chi tiết, tăng giảm số lượng & mua ngay
 *    • window.cartModule                : Cầu nối thêm giỏ, thay đổi số lượng, voucher & xuất hóa đơn
 *    • window.authModule                : Cầu nối đăng nhập, đăng ký, đăng xuất, cập nhật hồ sơ & tra cứu đơn
 *
 * 3. Lắng Nghe Sự Kiện Toàn Cục (DOM Content Loaded Orchestrator):
 *    • Lắng nghe click Menu Header, Submit Form Tìm Kiếm, Change Lọc Giá/Sắp Xếp, Form Checkout, Form Auth & Tracking
 * ============================================================================
 */

function createAppController() {
  const pModel = typeof window !== 'undefined' && window.productModel ? window.productModel : (typeof ProductModel !== 'undefined' ? new ProductModel() : null);
  const cModel = typeof window !== 'undefined' && window.cartModel ? window.cartModel : (typeof CartModel !== 'undefined' ? new CartModel() : null);
  const oModel = typeof window !== 'undefined' && window.orderModel ? window.orderModel : (typeof OrderModel !== 'undefined' ? new OrderModel() : null);
  const uModel = typeof window !== 'undefined' && window.userModel ? window.userModel : (typeof UserModel !== 'undefined' ? new UserModel() : null);

  let currentView = 'home';

  /**
   * [BƯỚC 1-6 KHỞI TẠO HỆ THỐNG]
   * B1: Sự kiện DOMContentLoaded kích hoạt.
   * B2: Đồng bộ thông tin Navbar (User & Giỏ hàng).
   * B3 & B4: Nạp song song danh mục & sản phẩm từ JSON-Server qua Promise.all.
   * B5: Lưu cache vào bộ nhớ Model.
   * B6: Phân tích URL và kích hoạt render màn hình tương ứng.
   */
  const init = async () => {
    // 1. Đồng bộ người dùng và số lượng giỏ hàng trên Header Navbar
    syncNavbar();

    // Tự động đồng bộ ngay thông tin người dùng mới nhất vào Form Checkout nếu có
    if (window.cartCtrl?.syncUserToCheckoutForm) {
      window.cartCtrl.syncUserToCheckoutForm(true);
    }

    // 2. Nạp dữ liệu danh mục & sản phẩm song song từ Backend
    if (pModel) {
      await Promise.all([
        pModel.fetchCategories(),
        pModel.fetchAllProducts()
      ]);
    }

    // 3. Khởi tạo router điều hướng dựa trên URL hiện tại hoặc thẻ view active
    handleRouteOnLoad();

    // 4. Lắng nghe sự kiện toàn cục (phím ESC, click ngoài modal)
    setupGlobalEvents();
  };

  /**
   * Đồng bộ trạng thái Header & Navbar (Tài khoản người dùng và Badge số lượng giỏ hàng)
   */
  const syncNavbar = () => {
    const user = uModel?.getCurrentUser ? uModel.getCurrentUser() : null;
    const bView = typeof window !== 'undefined' && (window.baseView || window.BaseView);
    bView?.renderNavUser(user);

    const cartCount = cModel?.getTotalCount ? cModel.getTotalCount() : 0;
    bView?.updateCartBadge(cartCount);
  };

  /**
   * ĐIỀU HƯỚNG MÀN HÌNH (ROUTER ĐƠN GIẢN CHUẨN MVC)
   * - Nếu panel view có sẵn trên trang hiện tại: Ẩn panel cũ, hiện panel mới (mượt mà, không giật trang).
   * - Nếu thuộc trang khác: Chuyển thẳng tới file HTML tương ứng (index.html, shop.html, cart.html...).
   * @param {string} viewName - Tên màn hình ('home', 'shop', 'detail', 'cart', 'checkout', 'profile', v.v.)
   * @param {Object} [params={}] - Tham số dữ liệu kèm theo (id sản phẩm, mã đơn...)
   */
  const goTo = (viewName, params = {}) => {
    // 0. BẢO VỆ PHÂN QUYỀN ĐẶT HÀNG: Khách chưa đăng nhập bấm đặt hàng -> Chuyển sang đăng nhập
    if (viewName === 'checkout') {
      const currentUser = JSON.parse(localStorage.getItem('smartstore_user') || 'null');
      if (!currentUser) {
        const bView = typeof window !== 'undefined' && (window.baseView || window.BaseView);
        if (bView) {
          bView.showToast('Vui lòng đăng nhập tài khoản để tiến hành đặt hàng!', 'warning');
        }
        goTo('auth', { redirect: 'checkout' });
        return;
      }
    }

    const targetPanel = document.getElementById(`view-${viewName}`) || (viewName === 'orders' ? document.getElementById('view-profile') : null);
    const bView = typeof window !== 'undefined' && (window.baseView || window.BaseView);

    if (targetPanel) {
      // 1. Nếu tìm thấy màn hình ngay tại trang này -> Chuyển đổi hiển thị (SPA Mode)
      document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
      targetPanel.classList.add('active');
      bView?.highlightActiveNav(viewName);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      currentView = viewName;

      // Cập nhật Hash trên URL để đồng bộ trạng thái router (không làm reload trang)
      try {
        const currentHash = window.location.hash.replace(/^#\/?/, '').split('?')[0];
        if (viewName !== 'home') {
          if (currentHash !== viewName) {
            history.replaceState(null, '', `#/${viewName}`);
          }
        } else if (currentHash) {
          history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      } catch (e) {}

      // Kích hoạt render dữ liệu tương ứng cho màn hình vừa mở
      triggerViewRender(viewName, params);
    } else {
      // 2. Nếu nằm ở file HTML khác -> Chuyển trực tiếp tới file HTML đích (MPA Mode)
      const inViews = window.location.pathname.toLowerCase().includes('/views/');
      const prefix = inViews ? '' : 'views/';
      const homePath = inViews ? '../index.html' : 'index.html';

      const VIEW_ROUTES = {
        home:     homePath,
        shop:     `${prefix}shop.html`,
        detail:   `${prefix}shop.html?view=detail&id=${params.id || ''}`,
        compare:  `${prefix}shop.html?view=compare`,
        cart:     `${prefix}cart.html`,
        checkout: `${prefix}cart.html?view=checkout`,
        thankyou: `${prefix}cart.html?view=thankyou&orderCode=${encodeURIComponent(params.orderCode || '')}`,
        auth:     `${prefix}user.html?view=auth${params.redirect ? `&redirect=${encodeURIComponent(params.redirect)}` : ''}`,
        profile:  `${prefix}user.html?view=profile`,
        orders:   `${prefix}user.html?view=orders`,
        tracking: `${prefix}user.html?view=tracking${params.code ? `&code=${encodeURIComponent(params.code)}` : ''}`,
        about:    `${prefix}user.html?view=about`,
        contact:  `${prefix}user.html?view=contact`,
        admin:    `${prefix}admin.html`
      };

      const targetUrl = VIEW_ROUTES[viewName] || `${prefix}${viewName}.html`;
      window.location.href = targetUrl;
    }
  };

  /**
   * Kích hoạt hàm render tương ứng của Controller chuyên trách
   * @param {string} viewName - Tên màn hình
   * @param {Object} [params={}] - Tham số dữ liệu
   */
  const triggerViewRender = (viewName, params = {}) => {
    const sCtrl = window.shopCtrl;
    const dCtrl = window.detailCtrl;
    const cCtrl = window.cartCtrl;
    const aCtrl = window.authCtrl;

    if (viewName === 'home') {
      sCtrl?.renderHome();
    } else if (viewName === 'shop') {
      sCtrl?.renderShop();
    } else if (viewName === 'detail') {
      const id = params.id || new URLSearchParams(window.location.search).get('id');
      if (id) dCtrl?.loadDetail(id);
    } else if (viewName === 'cart') {
      cCtrl?.renderCart();
    } else if (viewName === 'checkout') {
      cCtrl?.renderCheckout();
      cCtrl?.syncUserToCheckoutForm?.(true);
    } else if (viewName === 'thankyou') {
      const orderCode = params.orderCode || new URLSearchParams(window.location.search).get('orderCode');
      if (orderCode) cCtrl?.renderThankYou(orderCode);
    } else if (viewName === 'profile') {
      aCtrl?.renderProfile();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (viewName === 'orders') {
      aCtrl?.renderProfile();
      setTimeout(() => {
        const orderContainer = document.getElementById('user-orders-table-container');
        if (orderContainer) {
          orderContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
          orderContainer.style.transition = 'all 0.5s ease';
          orderContainer.style.boxShadow = '0 0 0 3px #0284c7, 0 8px 24px rgba(2, 132, 199, 0.25)';
          orderContainer.style.borderRadius = '8px';
          setTimeout(() => {
            orderContainer.style.boxShadow = '';
          }, 2200);
        }
      }, 300);
    } else if (viewName === 'compare') {
      sCtrl?.renderCompare();
    }
  };

  /**
   * Xử lý Router khi tải trang dựa trên tên tệp HTML và Query Parameters
   */
  const handleRouteOnLoad = () => {
    const pathname = window.location.pathname.toLowerCase();
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view') || urlParams.get('act');
    const bView = typeof window !== 'undefined' && (window.baseView || window.BaseView);

    if (pathname.endsWith('shop.html')) {
      if (viewParam === 'detail' || urlParams.get('id')) {
        const id = urlParams.get('id');
        goTo('detail', { id });
      } else if (viewParam === 'compare') {
        goTo('compare');
      } else {
        const brand = urlParams.get('brand');
        goTo('shop');
        if (brand && window.shopCtrl) {
          window.shopCtrl.filterBrand(brand);
        }
      }
    } else if (pathname.endsWith('cart.html')) {
      if (viewParam === 'checkout') {
        goTo('checkout');
      } else if (viewParam === 'thankyou' || urlParams.get('orderCode')) {
        const code = urlParams.get('orderCode');
        goTo('thankyou', { orderCode: code });
      } else {
        goTo('cart');
      }
    } else if (pathname.endsWith('user.html')) {
      if (viewParam === 'profile') {
        goTo('profile');
      } else if (viewParam === 'orders') {
        goTo('orders');
      } else if (viewParam === 'tracking') {
        goTo('tracking');
        const code = urlParams.get('code');
        if (code) {
          setTimeout(() => {
            const trackingInput = document.getElementById('tracking-order-input') || document.getElementById('tracking-input');
            if (trackingInput) {
              trackingInput.value = code;
              window.authCtrl?.searchOrders(code);
            }
          }, 300);
        }
      } else if (viewParam === 'about') {
        goTo('about');
      } else if (viewParam === 'contact') {
        goTo('contact');
      } else {
        const tab = urlParams.get('tab') || 'login';
        goTo('auth');
        const uView = typeof window !== 'undefined' && (window.userView || window.UserView);
        uView?.switchAuthTab?.(tab);

        // Hiển thị Banner Nhắc Nhở nếu chuyển từ checkout sang đăng nhập
        if (urlParams.get('redirect') === 'checkout') {
          const checkoutBanner = document.getElementById('auth-checkout-prompt-banner');
          if (checkoutBanner) checkoutBanner.style.display = 'flex';
        }
      }
    } else if (pathname.endsWith('index.html') || pathname.endsWith('/')) {
      const explicitAct = viewParam || window.location.hash.replace(/^#\/?/, '').split('?')[0];
      if (explicitAct && explicitAct !== 'home') {
        goTo(explicitAct, Object.fromEntries(urlParams.entries()));
      } else {
        window.shopCtrl?.renderHome();
        bView?.highlightActiveNav('home');
      }
    }
  };

  /**
   * Lọc theo hãng và chuyển hướng sang trang shop
   * @param {string} brandId - ID của hãng
   */
  const filterBrand = (brandId) => {
    const inViews = window.location.pathname.toLowerCase().includes('/views/');
    const shopUrl = `${inViews ? '' : 'views/'}shop.html?brand=${brandId}`;

    if (window.shopCtrl && document.getElementById('view-shop')) {
      window.shopCtrl.filterBrand(brandId);
    } else {
      window.location.href = shopUrl;
    }
  };

  /**
   * Mở hộp thoại xem nhanh cấu hình sản phẩm (Quick View Modal)
   * @param {string|number} id - ID sản phẩm
   */
  const quickView = async (id) => {
    if (!pModel) return;
    const sp = await pModel.fetchProductById(id);
    const bView = typeof window !== 'undefined' && (window.baseView || window.BaseView);
    const pView = typeof window !== 'undefined' && (window.productView || window.ProductView);

    if (!sp) {
      bView?.showToast('Không tìm thấy sản phẩm!', 'error');
      return;
    }
    const cat = pModel.categories.find(c => String(c.id) === String(sp.categoryId || sp.cate_id));
    const catName = cat ? cat.name : (sp.brand || '');
    pView?.renderQuickViewModal('quick-view-body', sp, catName);
    bView?.openModal('quick-view-modal');
  };

  /**
   * Đóng hộp thoại Modal
   * @param {string} modalId - ID hộp thoại
   */
  const closeModal = (modalId) => {
    const bView = typeof window !== 'undefined' && (window.baseView || window.BaseView);
    bView?.closeModal(modalId);
  };

  /**
   * Thiết lập lắng nghe sự kiện toàn cục: Phím ESC và Click Backdrop
   */
  const setupGlobalEvents = () => {
    const bView = typeof window !== 'undefined' && (window.baseView || window.BaseView);

    // Đóng modal khi nhấn phím ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        bView?.closeAllModals();
      }
    });

    // Đóng modal khi click ra lớp phủ mờ bên ngoài
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          bView?.closeModal(overlay.id);
        }
      });
    });

    // Lắng nghe thay đổi hồ sơ người dùng từ tab khác (Đồng bộ tức thời đa tab)
    window.addEventListener('storage', (e) => {
      if (e.key === 'smartstore_user') {
        syncNavbar();
        window.cartCtrl?.syncUserToCheckoutForm?.(true);
      }
    });
  };

  return {
    get productModel() { return pModel; },
    get cartModel() { return cModel; },
    get orderModel() { return oModel; },
    get userModel() { return uModel; },
    get currentView() { return currentView; },
    set currentView(val) { currentView = val; },
    init,
    syncNavbar,
    goTo,
    triggerViewRender,
    handleRouteOnLoad,
    filterBrand,
    quickView,
    closeModal,
    setupGlobalEvents
  };
}

// Khởi tạo Singleton toàn cục trong namespace Controller
const appController = createAppController();

function AppController() {
  return appController;
}

if (typeof window !== 'undefined') {
  window.appController = appController;
  window.AppController = AppController;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AppController;
}

/**
 * ============================================================================
 * MVC BOOTSTRAP & BACKWARD COMPATIBILITY ADAPTER
 * ============================================================================
 */
(function() {
  'use strict';

  // 1. Khởi tạo đối tượng Controllers trung tâm
  const appCtrl = window.appController || createAppController();
  const shopCtrl = window.shopController || (typeof window.ShopController !== 'undefined' ? new window.ShopController(appCtrl.productModel) : null);
  const detailCtrl = window.detailController || (typeof window.DetailController !== 'undefined' ? new window.DetailController(appCtrl.productModel, appCtrl.cartModel) : null);
  const cartCtrl = window.cartController || (typeof window.CartController !== 'undefined' ? new window.CartController(appCtrl.cartModel, appCtrl.productModel, appCtrl.orderModel, appCtrl.userModel) : null);
  const authCtrl = window.authController || (typeof window.AuthController !== 'undefined' ? new window.AuthController(appCtrl.userModel, appCtrl.orderModel) : null);

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
    filterBrand: (b) => shopCtrl?.filterBrand(b),
    search: (q) => shopCtrl?.search(q),
    filterPrice: (p) => shopCtrl?.filterPrice(p),
    sort: (s) => shopCtrl?.sort(s),
    changePage: (p) => shopCtrl?.changePage(p),
    setDemand: (d) => shopCtrl?.setDemand(d),
    resetFilters: () => shopCtrl?.resetFilters(),
    scrollToCompare: () => shopCtrl?.scrollToCompare()
  };

  window.compareModule = {
    toggle: (id) => shopCtrl?.toggleCompare(id),
    add: (id) => shopCtrl?.toggleCompare(id),
    remove: (id) => shopCtrl?.removeCompare(id),
    clear: () => shopCtrl?.clearCompare()
  };

  window.detailModule = {
    loadDetail: (id) => detailCtrl?.loadDetail(id),
    changeQty: (delta) => detailCtrl?.changeQty(delta),
    getQty: () => detailCtrl?.getQty(),
    buyNow: (id) => detailCtrl?.buyNow(id)
  };

  window.cartModule = {
    add: (id, qty) => cartCtrl?.add(id, qty),
    addToCart: (id, qty) => cartCtrl?.add(id, qty),
    changeQty: (id, delta) => cartCtrl?.changeQty(id, delta),
    remove: (id) => cartCtrl?.remove(id),
    clear: () => cartCtrl?.clear(),
    applyVoucher: (code) => cartCtrl?.applyVoucher(code),
    selectVoucherChip: (code) => cartCtrl?.selectVoucherChip(code),
    cancelVoucher: () => cartCtrl?.cancelVoucher(),
    openCustomerInvoice: (orderCode) => cartCtrl?.openCustomerInvoice(orderCode),
    viewInvoice: (orderCode) => cartCtrl?.openCustomerInvoice(orderCode),
    printInvoice: () => cartCtrl?.printInvoice(),
    xemDonHangCuaToi: () => cartCtrl?.xemDonHangCuaToi(),
    viewMyOrders: () => cartCtrl?.xemDonHangCuaToi(),
    resetAddressToDefault: () => cartCtrl?.resetAddressToDefault(),
    syncUserToCheckoutForm: (force) => cartCtrl?.syncUserToCheckoutForm(force)
  };

  window.authModule = {
    switchTab: (tab) => authCtrl?.switchTab(tab),
    login: (e) => authCtrl?.login(e),
    register: (e) => authCtrl?.register(e),
    checkRegisterEmail: (email) => authCtrl?.checkRegisterEmail(email),
    switchToLoginWithEmail: () => authCtrl?.switchToLoginWithEmail(),
    logout: () => authCtrl?.logout(),
    updateProfile: (e) => authCtrl?.updateProfile(e),
    cancelOrder: (id, code) => authCtrl?.cancelOrder(id, code),
    searchOrders: (q) => authCtrl?.searchOrders(q),
    confirmSmartIdentity: () => authCtrl?.confirmSmartIdentity(),
    cancelSmartIdentity: () => authCtrl?.cancelSmartIdentity()
  };

  // 3. Khởi tạo khi DOM sẵn sàng (hỗ trợ cả chuẩn ES6 Module defer)
  const onReady = (fn) => {
    if (typeof document === 'undefined') return;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  };

  onReady(async () => {
    await appCtrl.init();

    // 0. Điều hướng Menu Header chính
    document.querySelectorAll('.main-nav .nav-item').forEach(nut => {
      nut.addEventListener('click', () => {
        const view = nut.getAttribute('data-view');
        if (view) appCtrl.goTo(view);
      });
    });

    // Form tìm kiếm Shop
    const searchForm = document.getElementById('shop-search-form');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const kw = document.getElementById('shop-search-input')?.value || '';
        shopCtrl?.search(kw);
      });
    }

    // Input tìm kiếm thời gian thực
    const searchInput = document.getElementById('shop-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        shopCtrl?.search(e.target.value);
      });
    }

    // Lọc giá & sắp xếp
    document.getElementById('filter-price-range')?.addEventListener('change', (e) => {
      shopCtrl?.filterPrice(e.target.value);
    });
    document.getElementById('filter-sort-by')?.addEventListener('change', (e) => {
      shopCtrl?.sort(e.target.value);
    });

    // Nút áp dụng mã giảm giá
    document.getElementById('btn-apply-voucher')?.addEventListener('click', () => {
      cartCtrl?.applyVoucher();
    });

    // Nút xóa hết giỏ hàng
    document.getElementById('btn-clear-cart')?.addEventListener('click', () => {
      cartCtrl?.clear();
    });

    // Nút đặt lại bộ lọc
    document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
      shopCtrl?.resetFilters();
    });

    // Nút xóa sạch danh sách so sánh (ở cả trang compare và cửa hàng)
    document.getElementById('btn-clear-compare')?.addEventListener('click', () => {
      shopCtrl?.clearCompare();
    });
    document.getElementById('btn-shop-clear-compare')?.addEventListener('click', () => {
      shopCtrl?.clearCompare();
    });

    // Form thanh toán (Checkout)
    document.getElementById('checkout-form')?.addEventListener('submit', (e) => {
      cartCtrl?.processOrder(e);
    });

    // Smart Identity Resolution: Lắng nghe gõ email tại checkout
    const checkoutEmailInput = document.getElementById('checkout-email');
    if (checkoutEmailInput) {
      checkoutEmailInput.addEventListener('blur', (e) => {
        authCtrl?.checkCheckoutEmail(e.target.value);
      });
    }

    // Form đăng nhập & đăng ký
    const loginForm = document.getElementById('auth-login-form') || document.getElementById('form-login');
    loginForm?.addEventListener('submit', (e) => {
      authCtrl?.login(e);
    });

    const registerForm = document.getElementById('auth-register-form') || document.getElementById('form-register');
    registerForm?.addEventListener('submit', (e) => {
      authCtrl?.register(e);
    });

    // Smart Register UX: Lắng nghe kiểm tra email đã tồn tại & chuyển tab đăng nhập
    const regEmailInput = document.getElementById('reg-email');
    if (regEmailInput) {
      regEmailInput.addEventListener('blur', (e) => {
        authCtrl?.checkRegisterEmail(e.target.value);
      });
      regEmailInput.addEventListener('input', () => {
        const alertBox = document.getElementById('reg-exist-alert');
        if (alertBox && alertBox.style.display !== 'none') {
          alertBox.style.display = 'none';
        }
      });
    }
    document.getElementById('btn-reg-switch-login')?.addEventListener('click', () => {
      authCtrl?.switchToLoginWithEmail();
    });

    // Form cập nhật hồ sơ cá nhân
    const profileForm = document.getElementById('profile-form') || document.getElementById('profile-edit-form');
    profileForm?.addEventListener('submit', (e) => {
      authCtrl?.updateProfile(e);
    });

    // Form tra cứu đơn hàng & nút kiểm tra
    document.getElementById('tracking-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      authCtrl?.searchOrders();
    });
    document.getElementById('btn-tracking-search')?.addEventListener('click', () => {
      authCtrl?.searchOrders();
    });
    document.getElementById('tracking-input')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        authCtrl?.searchOrders();
      }
    });

    // Nút đăng nhập trong thẻ nhận diện thông minh (Smart Identity Resolution)
    document.getElementById('btn-smart-login-submit')?.addEventListener('click', () => {
      authCtrl?.confirmSmartIdentity();
    });
    document.getElementById('btn-smart-cancel')?.addEventListener('click', () => {
      authCtrl?.cancelSmartIdentity();
    });

    // Form gửi liên hệ
    document.getElementById('contact-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (window.baseView) window.baseView.showToast('Cảm ơn bạn đã gửi tin nhắn! SmartStore sẽ liên hệ phản hồi trong 30 phút.', 'success');
      e.target.reset();
    });
  });
})();
