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
    printInvoice: () => cartCtrl.printInvoice(),
    xemDonHangCuaToi: () => cartCtrl.xemDonHangCuaToi()
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
    document.getElementById('auth-login-form')?.addEventListener('submit', (e) => {
      authCtrl.login(e);
    });
    document.getElementById('auth-register-form')?.addEventListener('submit', (e) => {
      authCtrl.register(e);
    });

    // Form cập nhật hồ sơ cá nhân
    document.getElementById('profile-form')?.addEventListener('submit', (e) => {
      authCtrl.updateProfile(e);
    });

    // Form tra cứu đơn hàng
    document.getElementById('tracking-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      authCtrl.searchOrders();
    });

    // Form gửi liên hệ
    document.getElementById('contact-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      window.BaseView.showToast('Cảm ơn bạn đã gửi tin nhắn! SmartStore sẽ liên hệ phản hồi trong 30 phút.', 'success');
      e.target.reset();
    });
  });
})();
