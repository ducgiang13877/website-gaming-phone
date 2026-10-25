
/**
 * [HÀM 1] Định dạng tiền tệ theo tiêu chuẩn Việt Nam Đồng (VND)
 * Tác dụng: Nhận số nguyên (vd: 25000000) -> trả về chuỗi tiền đẹp (vd: "25.000.000 ₫")
 * @param {number} amount - Số tiền cần định dạng
 * @returns {string} Chuỗi tiền tệ có dấu phân cách hàng nghìn và ký hiệu đ
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
}

/**
 * [HÀM 2] Hiển thị Toast thông báo trạng thái nổi góc dưới màn hình
 * Tác dụng: Thông báo kết quả thao tác (Thêm giỏ thành công, Đặt hàng, Lỗi...) tự biến mất sau 3.5s
 * @param {string} message - Nội dung thông báo
 * @param {'success'|'error'|'warning'|'info'} [type='success'] - Phân loại màu sắc & icon
 */
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast-container');
  const toastMsg = document.getElementById('toast-message');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;
  toast.className = 'toast-notice show';

  const iconMap = {
    error: { color: 'var(--danger)', icon: 'fa-solid fa-triangle-exclamation' },
    warning: { color: 'var(--warning)', icon: 'fa-solid fa-circle-exclamation' },
    info: { color: 'var(--primary)', icon: 'fa-solid fa-circle-info' },
    success: { color: 'var(--success)', icon: 'fa-solid fa-circle-check' }
  };

  const config = iconMap[type] ?? iconMap.success;
  toast.style.borderLeftColor = config.color;

  const iconEl = toast.querySelector('i');
  if (iconEl) {
    iconEl.className = config.icon;
    iconEl.style.color = config.color;
  }

  clearTimeout(window.__toastTimeout);
  window.__toastTimeout = setTimeout(() => {
    toast.className = 'toast-notice';
  }, 3500);
}

/**
 * [HÀM 3] Mở Hộp thoại (Modal Overlay) và khóa cuộn trang
 * Tác dụng: Bật popup xem nhanh, modal so sánh, modal hóa đơn...
 * @param {string} modalId - ID phần tử modal trong HTML
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

/**
 * [HÀM 4] Đóng Hộp thoại (Modal Overlay) và mở lại thanh cuộn
 * Tác dụng: Tắt popup modal và cho phép cuộn trang bình thường
 * @param {string} modalId - ID phần tử modal
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/**
 * [HÀM 5] Đóng toàn bộ các modal đang hiển thị trên màn hình
 */
function closeAllModals() {
  document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
  document.body.style.overflow = '';
}

/**
 * [HÀM 6] Cập nhật số lượng hiển thị trên Badge giỏ hàng kèm hiệu ứng nảy
 * Tác dụng: Khi bấm thêm sản phẩm, số đếm trên Header tăng lên và nảy nhẹ thu hút sự chú ý
 * @param {number} count - Tổng số lượng sản phẩm trong giỏ
 */
function updateCartBadge(count) {
  const badge = document.getElementById('cart-badge-count');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
    badge.classList.remove('badge-bounce');
    void badge.offsetWidth; // Buộc trình duyệt reflow để kích hoạt lại CSS animation
    badge.classList.add('badge-bounce');
  }
}

/**
 * [HÀM 7] Cập nhật khối tài khoản trên thanh điều hướng Navbar
 * Tác dụng: Nếu đã đăng nhập thì hiện Avatar chữ cái đầu + Tên + Menu dropdown; Chưa thì hiện nút Đăng Nhập
 * @param {Object|null} user - Thông tin tài khoản đăng nhập hiện tại
 */
function renderNavUser(user) {
  const container = document.getElementById('user-nav-status');
  if (!container) return;

  if (user) {
    const displayName = user.name || user.fullName || user.email.split('@')[0];
    const roleBadge = user.role === 'admin'
      ? '<span style="background:var(--accent); color:#fff; font-size:10px; padding:2px 6px; border-radius:4px; margin-left:4px; font-weight:800;">ADMIN</span>'
      : '';

    container.innerHTML = `
      <div class="user-profile-menu" style="position: relative;">
        <button class="btn-secondary btn-sm" id="user-menu-btn" style="display: flex; align-items: center; gap: 8px; border-radius: var(--radius-full);">
          <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700;">
            ${displayName.charAt(0).toUpperCase()}
          </div>
          <span style="font-weight: 700; max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${displayName}
          </span>
          ${roleBadge}
          <i class="fa-solid fa-chevron-down" style="font-size: 11px;"></i>
        </button>

        <div class="user-dropdown-card" id="user-dropdown">
          <div style="padding: 12px 16px; border-bottom: 1px solid var(--border);">
            <div style="font-weight: 700; color: var(--text); font-size: 14px;">${displayName}</div>
            <div style="font-size: 12px; color: var(--text-muted);">${user.email}</div>
          </div>
          <ul style="list-style: none; padding: 6px 0; margin: 0;">
            <li>
              <a href="javascript:void(0)" onclick="window.appNav.goTo('profile')" class="dropdown-link">
                <i class="fa-solid fa-id-card"></i> Hồ sơ của tôi
              </a>
            </li>
            <li>
              <a href="javascript:void(0)" onclick="window.appNav.goTo('orders')" class="dropdown-link">
                <i class="fa-solid fa-box-archive"></i> Đơn hàng đã mua
              </a>
            </li>
            ${user.role === 'admin' ? `
            <li>
              <a href="javascript:void(0)" onclick="window.appNav.goTo('admin')" class="dropdown-link" style="color: var(--accent); font-weight: 700;">
                <i class="fa-solid fa-screwdriver-wrench"></i> Quản trị Admin
              </a>
            </li>` : ''}
            <li style="border-top: 1px solid var(--border); margin-top: 4px; padding-top: 4px;">
              <a href="javascript:void(0)" onclick="window.authModule.logout()" class="dropdown-link text-danger">
                <i class="fa-solid fa-right-from-bracket"></i> Đăng xuất
              </a>
            </li>
          </ul>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <button class="btn-primary btn-sm" onclick="window.appNav.goTo('auth')">
        <i class="fa-solid fa-user"></i> Đăng Nhập
      </button>
    `;
  }
}

/**
 * [HÀM 8] Đánh dấu tab menu đang được chọn trên Header Navbar
 * Tác dụng: Thêm class 'active' cho nút nav tương ứng với trang đang xem
 * @param {string} viewName - Tên màn hình view hiện tại ('home', 'shop', 'cart'...)
 */
function highlightActiveNav(viewName) {
  document.querySelectorAll('.main-nav .nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-view') === viewName);
  });
}

/**
 * [HÀM 9] Chuẩn hóa đường dẫn hình ảnh cho mọi trang (SPA root lẫn MPA subfolders)
 * Tác dụng: Chuyển 'images/...' thành '/images/...' để không bao giờ bị lỗi 404 khi truy cập từ views/
 * @param {string} imagePath
 * @returns {string} Đường dẫn ảnh hợp lệ tuyệt đối từ web root
 */
function formatImageUrl(imagePath) {
  if (!imagePath) return 'https://picsum.photos/300/300';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:') || imagePath.startsWith('blob:')) {
    return imagePath;
  }
  const clean = imagePath.replace(/^\.\//, '').replace(/^\//, '');
  return '/' + clean;
}

// ============================================================================
// XUẤT BẢN MODULE THEO PHONG CÁCH DÙNG HÀM HIỆN ĐẠI
// ============================================================================
const baseView = {
  formatCurrency,
  formatImageUrl,
  showToast,
  openModal,
  closeModal,
  closeAllModals,
  updateCartBadge,
  renderNavUser,
  highlightActiveNav
};

// Cung cấp wrapper tương thích ngược 100% với mã cũ gọi BaseView.formatCurrency() hoặc new BaseView()
function BaseView() { return baseView; }
Object.assign(BaseView, baseView);

if (typeof window !== 'undefined') {
  window.baseView = baseView;
  window.BaseView = BaseView;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = baseView;
}
