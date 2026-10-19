/**
 * ============================================================================
 * VIEW: BaseView (Các Tiện ích Giao diện, Toasts, Modals, Navbar Chung)
 * Kiến trúc: Mô hình MVC Chuẩn - SmartStore
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * ============================================================================
 */

class BaseView {
  /** Định dạng tiền Việt Nam Đồng chuẩn */
  static formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  }

  /** Hiển thị Toast thông báo trạng thái nổi góc dưới */
  static showToast(message, type = 'success') {
    const toast = document.getElementById('toast-container');
    const toastMsg = document.getElementById('toast-message');
    if (!toast || !toastMsg) return;

    toastMsg.textContent = message;
    toast.className = 'toast-notice show';

    if (type === 'error') {
      toast.style.borderLeftColor = 'var(--danger)';
      toast.querySelector('i').className = 'fa-solid fa-triangle-exclamation';
      toast.querySelector('i').style.color = 'var(--danger)';
    } else if (type === 'warning') {
      toast.style.borderLeftColor = 'var(--warning)';
      toast.querySelector('i').className = 'fa-solid fa-circle-exclamation';
      toast.querySelector('i').style.color = 'var(--warning)';
    } else if (type === 'info') {
      toast.style.borderLeftColor = 'var(--primary)';
      toast.querySelector('i').className = 'fa-solid fa-circle-info';
      toast.querySelector('i').style.color = 'var(--primary)';
    } else {
      toast.style.borderLeftColor = 'var(--success)';
      toast.querySelector('i').className = 'fa-solid fa-circle-check';
      toast.querySelector('i').style.color = 'var(--success)';
    }

    clearTimeout(window.__toastTimeout);
    window.__toastTimeout = setTimeout(() => {
      toast.className = 'toast-notice';
    }, 3500);
  }

  /** Mở Modal Hộp thoại */
  static openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  /** Đóng Modal */
  static closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  /** Đóng tất cả Modal đang mở */
  static closeAllModals() {
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
  }

  /** Cập nhật số lượng huy hiệu giỏ hàng trên Header */
  static updateCartBadge(count) {
    const badge = document.getElementById('cart-badge-count');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
      badge.classList.remove('badge-bounce');
      void badge.offsetWidth; // trigger reflow
      badge.classList.add('badge-bounce');
    }
  }

  /** Cập nhật khu vực tài khoản trên Navbar */
  static renderNavUser(user) {
    const container = document.getElementById('user-nav-status');
    if (!container) return;

    if (user) {
      const displayName = user.name || user.email.split('@')[0];
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
                <a href="javascript:void(0)" onclick="window.appNav.goTo('profile')" class="dropdown-link">
                  <i class="fa-solid fa-box-archive"></i> Đơn hàng đã mua
                </a>
              </li>
              ${user.role === 'admin' ? `
              <li>
                <a href="admin.html" class="dropdown-link" style="color: var(--accent); font-weight: 700;">
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

  /** Đánh dấu tab menu active trên header */
  static highlightActiveNav(viewName) {
    document.querySelectorAll('.main-nav .nav-item').forEach(btn => {
      if (btn.getAttribute('data-view') === viewName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
}

// Khởi tạo Singleton toàn cục trong namespace View
window.BaseView = BaseView;
