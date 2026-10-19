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
        window.location.href = 'admin.html';
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
    const confirmPassword = document.getElementById('reg-confirm-password')?.value.trim();
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

    if (password !== confirmPassword) {
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
    window.OrderView.renderUserOrders('profile-orders-tbody', orders);
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
    window.OrderView.renderTrackingResult('tracking-results-box', orders);
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
