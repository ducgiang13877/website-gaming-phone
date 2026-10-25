/**
 * ============================================================================
 * 📋 MỤC LỤC CÁC HÀM & TÁC DỤNG (TABLE OF CONTENTS):
 * ----------------------------------------------------------------------------
 * 1. Khởi tạo & Điều phối Dependencies:
 *    • createAuthController(...)        : Factory Function khởi tạo controller kết nối UserModel & OrderModel
 *    • AuthController(...)              : Constructor tương thích ngược trả về instance AuthController
 *
 * 2. Xác Thực Tài Khoản & Quản Lý Phiên (Authentication Actions):
 *    • switchTab(tab)                   : [ACTION] Chuyển đổi tab hiển thị giữa Đăng nhập và Đăng ký
 *    • login(e)                         : [BƯỚC 1-6 AUTH] Validate form, gọi uModel.login(), cập nhật Navbar & chuyển trang
 *    • register(e)                      : [BƯỚC 1-6 AUTH] Validate form đăng ký, chặn trùng email, tự động đăng nhập & chuyển trang
 *    • logout()                         : [ACTION] Hộp thoại xác nhận đăng xuất tài khoản, xóa phiên an toàn & quay về Home
 *
 * 3. Hồ Sơ Cá Nhân & Quản Trị Đơn Hàng Của Khách:
 *    • renderProfile()                  : [ACTION] Nạp thông tin hồ sơ và danh sách đơn hàng đã mua của tài khoản
 *    • updateProfile(e)                 : [ACTION] Validate và gửi yêu cầu cập nhật thông tin cá nhân
 *    • cancelOrder(orderId, orderCode)  : [HOÀN KHO TỰ ĐỘNG] Khách hủy đơn chờ duyệt, tự động hoàn trả 100% tồn kho
 *
 * 4. Tra Cứu Vận Đơn (Tracking Actions):
 *    • searchOrders(queryInput)         : [ACTION] Tra cứu đơn hàng theo Mã (#DH...) hoặc Số điện thoại & render tiến trình
 *
 * 5. Nhận Diện Khách Hàng Thân Thiết (Smart Identity Resolution):
 *    • checkRegisterEmail(email)        : [Smart Register UX] Kiểm tra email đã tồn tại để hiện card gợi ý đăng nhập
 *    • switchToLoginWithEmail()         : Chuyển sang form Đăng Nhập, giữ nguyên email vừa nhập và focus ô mật khẩu
 *    • checkCheckoutEmail(email)        : Tự động kiểm tra email khi khách gõ ở Checkout để hiển thị card nhận diện
 *    • confirmSmartIdentity()           : Khách hàng đồng ý nhận diện -> Tự động điền họ tên, SĐT, địa chỉ cũ
 *    • cancelSmartIdentity()            : Khách hàng từ chối nhận diện -> Đóng card và giữ thông tin nhập tay
 * ============================================================================
 */

function createAuthController(userModel, orderModel) {
  const uModel = userModel || (typeof window !== 'undefined' && window.userModel ? window.userModel : (typeof UserModel !== 'undefined' ? new UserModel() : null));
  const oModel = orderModel || (typeof window !== 'undefined' && window.orderModel ? window.orderModel : (typeof OrderModel !== 'undefined' ? new OrderModel() : null));

  let matchedIdentityUser = null;

  /**
   * [HÀM ACTION] Chuyển đổi tab Đăng nhập / Đăng ký
   * @param {'login'|'register'} tab - Tên tab muốn chuyển
   */
  const switchTab = (tab) => {
    const uView = typeof window !== 'undefined' && (window.userView || window.UserView);
    uView?.switchAuthTab(tab);
  };

  /**
   * [BƯỚC 1-6 TRONG LUỒNG AUTH] Xử lý sự kiện Đăng Nhập
   * Luồng MVC:
   *   Bước 1: Người dùng submit form đăng nhập.
   *   Bước 2: Controller trích xuất email, password, validate rỗng.
   *   Bước 3: Controller gọi uModel.login(email, password) gửi REST API.
   *   Bước 4: Backend JSON-Server đối soát mật khẩu.
   *   Bước 5: Trả về thông tin an toàn (loại bỏ password).
   *   Bước 6: Cập nhật Navbar và điều hướng: Admin sang Dashboard, Khách sang Profile.
   * @param {Event} [e] - Sự kiện submit form
   */
  const login = async (e) => {
    if (e) e.preventDefault();

    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value.trim();

    if (!email || !password) {
      if (window.baseView) window.baseView.showToast('Vui lòng nhập đầy đủ Email và Mật khẩu!', 'warning');
      return;
    }

    if (!uModel) return;
    const res = await uModel.login(email, password);
    if (!res.success) {
      if (window.baseView) window.baseView.showToast(res.message, 'error');
      return;
    }

    const user = res.user;
    if (window.baseView) {
      window.baseView.renderNavUser(user);
      window.baseView.showToast(`Chào mừng ${user.name || user.fullName || user.email} quay trở lại!`, 'success');
    }

    setTimeout(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTarget = urlParams.get('redirect');

      if (user.role === 'admin') {
        if (window.appNav) {
          window.appNav.goTo('admin');
        } else {
          const inViews = window.location.pathname.toLowerCase().includes('/views/');
          window.location.href = `${inViews ? '' : 'views/'}admin.html`;
        }
      } else if (redirectTarget === 'checkout') {
        if (window.appNav) {
          window.appNav.goTo('checkout');
        } else {
          const inViews = window.location.pathname.toLowerCase().includes('/views/');
          window.location.href = `${inViews ? '' : 'views/'}cart.html?view=checkout`;
        }
      } else {
        if (window.appNav) window.appNav.goTo('profile');
      }
    }, 500);
  };

  /**
   * Helper che mờ một phần email theo chuẩn bảo mật (Email Masking)
   * Ví dụ: hung.nv@gmail.com -> hun****@gmail.com
   * @param {string} email
   * @returns {string}
   */
  const maskEmail = (email) => {
    if (!email || !email.includes('@')) return email || '';
    const [name, domain] = email.split('@');
    if (name.length <= 2) return `${name[0]}*@${domain}`;
    return `${name.slice(0, 3)}****@${domain}`;
  };

  /**
   * [SMART REGISTER UX] Kiểm tra email khi người dùng rời khỏi ô input đăng ký (#reg-email)
   * Nếu email đã tồn tại -> Hiển thị hộp thông báo gợi ý đăng nhập ngay
   * @param {string} [emailInput]
   */
  const checkRegisterEmail = async (emailInput) => {
    const email = (emailInput || document.getElementById('reg-email')?.value || '').trim().toLowerCase();
    const alertBox = document.getElementById('reg-exist-alert');
    const alertText = document.getElementById('reg-exist-alert-text');
    if (!alertBox || !alertText) return;

    if (!email || !email.includes('@') || !uModel) {
      alertBox.style.display = 'none';
      return;
    }

    const existing = await uModel.checkIdentityByEmail(email);
    if (existing) {
      const masked = maskEmail(email);
      alertText.innerHTML = `Tài khoản <strong>${masked}</strong> đã tồn tại, tiến hành đăng nhập?`;
      alertBox.style.display = 'block';
    } else {
      alertBox.style.display = 'none';
    }
  };

  /**
   * [SMART REGISTER UX] Chuyển đổi sang tab Đăng Nhập kèm giữ nguyên Email & Mật khẩu đã gõ ở Form Đăng Ký
   */
  const switchToLoginWithEmail = () => {
    const regEmail = document.getElementById('reg-email')?.value.trim() || '';
    const regPassword = document.getElementById('reg-password')?.value.trim() || '';
    switchTab('login');

    const loginEmailInput = document.getElementById('login-email');
    const loginPasswordInput = document.getElementById('login-password');
    if (loginEmailInput && regEmail) {
      loginEmailInput.value = regEmail;
    }
    if (loginPasswordInput && regPassword) {
      loginPasswordInput.value = regPassword;
    }
    if (loginPasswordInput) {
      setTimeout(() => loginPasswordInput.focus(), 120);
    }

    const alertBox = document.getElementById('reg-exist-alert');
    if (alertBox) alertBox.style.display = 'none';

    if (window.baseView) {
      window.baseView.showToast(`Đã chuyển sang đăng nhập với email ${regEmail}! Vui lòng nhập mật khẩu.`, 'info');
    }
  };

  /**
   * [BƯỚC 1-6 TRONG LUỒNG AUTH] Xử lý sự kiện Đăng Ký Thành Viên Mới
   * Hỗ trợ Auto-Login thông minh: Nếu tài khoản đã tồn tại và đúng mật khẩu -> Đăng nhập luôn!
   * @param {Event} [e] - Sự kiện submit form
   */
  const register = async (e) => {
    if (e) e.preventDefault();

    const name = document.getElementById('reg-name')?.value.trim();
    const email = document.getElementById('reg-email')?.value.trim();
    const password = document.getElementById('reg-password')?.value.trim();
    const phone = document.getElementById('reg-phone')?.value.trim() || '';
    const address = document.getElementById('reg-address')?.value.trim() || '';

    const toast = window.baseView ? window.baseView.showToast : alert;

    // 1. Xác thực cơ bản dữ liệu bắt buộc
    if (!email || !password) {
      toast('Vui lòng điền đầy đủ Email và Mật khẩu!', 'warning');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast('Địa chỉ email không đúng định dạng (ví dụ: user@example.com)!', 'warning');
      return;
    }

    if (!uModel) return;

    // 2. [SMART AUTO-LOGIN] KIỂM TRA TÀI KHOẢN ĐÃ TỒN TẠI TRƯỚC ĐÓ HAY CHƯA
    const cleanEmail = email.toLowerCase();
    const existingUser = await uModel.checkIdentityByEmail(cleanEmail);

    if (existingUser) {
      // Thử đăng nhập với mật khẩu vừa nhập trên form đăng ký
      const loginAttempt = await uModel.login(cleanEmail, password);

      if (loginAttempt.success) {
        // [TRƯỜNG HỢP 1]: Email đã tồn tại VÀ MẬT KHẨU ĐÚNG -> TỰ ĐỘNG ĐĂNG NHẬP NGAY!
        const safeUser = loginAttempt.user;
        const masked = maskEmail(cleanEmail);

        if (window.baseView) {
          window.baseView.renderNavUser(safeUser);
          window.baseView.showToast(`Tài khoản "${masked}" đã tồn tại và mật khẩu chính xác! Đang tự động đăng nhập...`, 'success');
        }

        setTimeout(() => {
          const urlParams = new URLSearchParams(window.location.search);
          const redirectTarget = urlParams.get('redirect');

          if (safeUser.role === 'admin') {
            if (window.appNav) window.appNav.goTo('admin');
            else {
              const inViews = window.location.pathname.toLowerCase().includes('/views/');
              window.location.href = `${inViews ? '' : 'views/'}admin.html`;
            }
          } else if (redirectTarget === 'checkout') {
            if (window.appNav) window.appNav.goTo('checkout');
            else {
              const inViews = window.location.pathname.toLowerCase().includes('/views/');
              window.location.href = `${inViews ? '' : 'views/'}cart.html?view=checkout`;
            }
          } else {
            if (window.appNav) window.appNav.goTo('profile');
          }
        }, 500);
        return;
      } else {
        // [TRƯỜNG HỢP 2]: Email đã tồn tại NHƯNG SAI MẬT KHẨU -> Cảnh báo và gợi ý chuyển sang đăng nhập
        const masked = maskEmail(cleanEmail);
        toast(`Tài khoản ${masked} đã tồn tại, tiến hành đăng nhập?`, 'warning');

        const alertBox = document.getElementById('reg-exist-alert');
        const alertText = document.getElementById('reg-exist-alert-text');
        if (alertBox && alertText) {
          alertText.innerHTML = `Tài khoản <strong>${masked}</strong> đã tồn tại, tiến hành đăng nhập?`;
          alertBox.style.display = 'block';
        }
        return;
      }
    }

    // 3. NẾU LÀ TÀI KHOẢN MỚI HOÀN TOÀN -> THỰC HIỆN ĐĂNG KÝ MỚI
    if (!name || name.length < 2) {
      toast('Họ và tên phải có ít nhất 2 ký tự!', 'warning');
      return;
    }
    const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
    if (phone && !phoneRegex.test(phone)) {
      toast('Số điện thoại không hợp lệ (ví dụ: 0912345678 hoặc +84912345678)!', 'warning');
      return;
    }
    if (password.length < 4) {
      toast('Mật khẩu phải có ít nhất 4 ký tự!', 'warning');
      return;
    }

    const res = await uModel.register(name, cleanEmail, password, phone, address);
    if (!res.success) {
      toast(res.message, 'error');
      return;
    }

    if (window.baseView) {
      window.baseView.renderNavUser(res.user);
      window.baseView.showToast('Đăng ký tài khoản thành công! Tự động đăng nhập...', 'success');
    }

    setTimeout(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTarget = urlParams.get('redirect');
      if (redirectTarget === 'checkout') {
        if (window.appNav) window.appNav.goTo('checkout');
        else {
          const inViews = window.location.pathname.toLowerCase().includes('/views/');
          window.location.href = `${inViews ? '' : 'views/'}cart.html?view=checkout`;
        }
      } else {
        if (window.appNav) window.appNav.goTo('profile');
      }
    }, 500);
  };

  /**
   * [HÀM ACTION] Đăng xuất tài khoản an toàn kèm hộp thoại xác nhận
   */
  const logout = () => {
    if (!confirm('Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này?')) return;

    if (uModel) uModel.logout();
    if (window.baseView) {
      window.baseView.renderNavUser(null);
      window.baseView.showToast('Đã đăng xuất tài khoản thành công', 'info');
    }

    // Làm sạch an toàn các ô nhập liệu nhạy cảm trên form để tránh browser autofill nhầm
    const loginPass = document.getElementById('login-password');
    if (loginPass) loginPass.value = '';
    const regPass = document.getElementById('reg-password');
    if (regPass) regPass.value = '';

    // Luôn điều hướng sạch về giao diện trang chủ ban đầu (index.html)
    const inViews = typeof window !== 'undefined' && window.location.pathname.toLowerCase().includes('/views/');
    const homeUrl = inViews ? '../index.html' : 'index.html';
    setTimeout(() => {
      window.location.href = homeUrl;
    }, 250);
  };

  /**
   * [HÀM ACTION] Render thông tin Hồ sơ cá nhân và Lịch sử đơn hàng của khách
   */
  const renderProfile = async () => {
    if (!uModel) return;
    const user = uModel.getCurrentUser();
    if (!user) {
      if (window.baseView) window.baseView.showToast('Vui lòng đăng nhập để xem thông tin hồ sơ!', 'warning');
      if (window.appNav) window.appNav.goTo('auth');
      return;
    }

    // 1. Điền thông tin vào form
    const uView = typeof window !== 'undefined' && (window.userView || window.UserView);
    uView?.renderProfileForm(user);

    // 2. Nạp danh sách đơn hàng đã mua từ database
    if (oModel) {
      let orders = await oModel.fetchOrdersByUserId(user.id, user.email);
      if ((!orders || orders.length === 0) && user.email) {
        orders = await oModel.fetchOrdersByUser(user.email);
      }
      const tbodyId = document.getElementById('user-orders-tbody') ? 'user-orders-tbody' : 'profile-orders-tbody';
      const oView = typeof window !== 'undefined' && (window.orderView || window.OrderView || window.cartView || window.CartView);
      if (oView && typeof oView.renderUserOrders === 'function') {
        oView.renderUserOrders(tbodyId, orders);
      }
    }
  };

  /**
   * [HÀM ACTION] Cập nhật thông tin hồ sơ cá nhân
   */
  const updateProfile = async (e) => {
    if (e) e.preventDefault();
    if (!uModel) return;

    const user = uModel.getCurrentUser();
    if (!user) return;

    const name = document.getElementById('profile-name')?.value.trim();
    const phone = document.getElementById('profile-phone')?.value.trim();
    const address = document.getElementById('profile-address')?.value.trim();

    const toast = window.baseView ? window.baseView.showToast : alert;

    if (!name || name.length < 2) {
      toast('Họ và tên phải có ít nhất 2 ký tự!', 'warning');
      return;
    }
    const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
    if (phone && !phoneRegex.test(phone)) {
      toast('Số điện thoại không hợp lệ (ví dụ: 0912345678 hoặc +84912345678)!', 'warning');
      return;
    }

    const res = await uModel.updateProfile(user.email, { name, fullName: name, phone, address });
    if (!res.success) {
      toast('Cập nhật hồ sơ thất bại: ' + res.message, 'error');
      return;
    }

    if (window.baseView) {
      window.baseView.renderNavUser(res.user);
      window.baseView.showToast('Cập nhật hồ sơ cá nhân thành công!', 'success');
    }
  };

  /**
   * [BƯỚC 1-2 TRONG LUỒNG HOÀN KHO] Khách hàng tự hủy đơn hàng đang chờ duyệt
   * @param {string|number} orderId - ID đơn hàng
   * @param {string} orderCode - Mã đơn hàng
   */
  const cancelOrder = async (orderId, orderCode) => {
    if (!confirm(`XÁC NHẬN HỦY ĐƠN HÀNG #${orderCode}:\n\nBạn có chắc chắn muốn hủy đơn hàng này không?\nToàn bộ sản phẩm sẽ được tự động hoàn trả về tồn kho của hệ thống.`)) {
      return;
    }

    if (!oModel) return;
    const res = await oModel.cancelOrder(orderId);
    if (!res.success) {
      if (window.baseView) window.baseView.showToast('Lỗi khi hủy đơn hàng: ' + (res.message || res.error), 'error');
      return;
    }

    if (window.baseView) window.baseView.showToast(`Đã hủy đơn hàng #${orderCode} thành công. Tồn kho đã được hoàn trả!`, 'info');
    renderProfile();
  };

  /**
   * [HÀM ACTION] Tra cứu tiến trình vận đơn bằng Mã đơn hoặc Số điện thoại
   */
  const searchOrders = async (queryInput) => {
    const q = (queryInput || document.getElementById('tracking-order-input')?.value || document.getElementById('tracking-input')?.value || '').trim();
    if (!q) {
      if (window.baseView) window.baseView.showToast('Vui lòng nhập Mã đơn hàng hoặc Số điện thoại!', 'warning');
      return;
    }

    if (!oModel) return;
    const orders = await oModel.searchOrders(q);
    const resultBox = document.getElementById('tracking-result-box') || document.getElementById('tracking-results-box');
    if (resultBox) {
      resultBox.style.display = 'block';
      const oView = typeof window !== 'undefined' && (window.orderView || window.OrderView);
      oView?.renderTrackingResult(resultBox.id, orders);
    }
  };

  // ==========================================================================
  // SMART IDENTITY RESOLUTION (NHẬN DIỆN KHÁCH HÀNG THÂN THIẾT)
  // ==========================================================================

  /**
   * Kiểm tra email nhập tại form thanh toán để kích hoạt nhận diện thông minh
   */
  const checkCheckoutEmail = async (email) => {
    if (!email || !email.includes('@') || !uModel) return;

    const matched = await uModel.checkIdentityByEmail(email);
    const currentUser = uModel.getCurrentUser();

    const uView = typeof window !== 'undefined' && (window.userView || window.UserView);

    if (matched && (!currentUser || String(currentUser.id) !== String(matched.id))) {
      matchedIdentityUser = matched;
      uView?.renderSmartIdentityCard('smart-identity-resolution-card', matched);
    } else {
      matchedIdentityUser = null;
      uView?.renderSmartIdentityCard('smart-identity-resolution-card', null);
    }
  };

  /**
   * Khách xác nhận tự động điền thông tin cũ
   */
  const confirmSmartIdentity = () => {
    if (!matchedIdentityUser) return;
    const u = matchedIdentityUser;

    const nameInput = document.getElementById('checkout-name');
    const phoneInput = document.getElementById('checkout-phone');
    const addrInput = document.getElementById('checkout-address');

    if (nameInput) nameInput.value = u.name || u.fullName || '';
    if (phoneInput) phoneInput.value = u.phone || '';
    if (addrInput) addrInput.value = u.address || '';

    if (window.baseView) window.baseView.showToast(`Đã tự động điền thông tin của ${u.name || u.fullName || u.email}!`, 'success');
    const uView = typeof window !== 'undefined' && (window.userView || window.UserView);
    uView?.renderSmartIdentityCard('smart-identity-resolution-card', null);
  };

  /**
   * Khách từ chối nhận diện
   */
  const cancelSmartIdentity = () => {
    matchedIdentityUser = null;
    const uView = typeof window !== 'undefined' && (window.userView || window.UserView);
    uView?.renderSmartIdentityCard('smart-identity-resolution-card', null);
  };

  return {
    get userModel() { return uModel; },
    get orderModel() { return oModel; },
    get matchedIdentityUser() { return matchedIdentityUser; },
    switchTab,
    login,
    register,
    logout,
    renderProfile,
    updateProfile,
    cancelOrder,
    searchOrders,
    checkRegisterEmail,
    switchToLoginWithEmail,
    maskEmail,
    checkCheckoutEmail,
    confirmSmartIdentity,
    cancelSmartIdentity
  };
}

// Khởi tạo Singleton toàn cục trong namespace Controller
const authController = createAuthController();

// Constructor tương thích ngược 100% với mã gọi new AuthController()
function AuthController(userModel, orderModel) {
  return createAuthController(userModel, orderModel);
}

if (typeof window !== 'undefined') {
  window.authController = authController;
  window.AuthController = AuthController;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthController;
}
