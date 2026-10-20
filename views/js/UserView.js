/**
 * ============================================================================
 * VIEW: UserView (Render Form Đăng nhập, Đăng ký, Hồ sơ & Smart Identity)
 * Kiến trúc: Mô hình MVC Chuẩn - SmartStore
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * ============================================================================
 */

class UserView {
  /** Chuyển tab giữa Đăng Nhập và Đăng Ký */
  static switchAuthTab(tab) {
    const tabLogin = document.getElementById('tab-login-btn');
    const tabRegister = document.getElementById('tab-register-btn');
    const formLogin = document.getElementById('auth-login-form');
    const formRegister = document.getElementById('auth-register-form');

    if (tab === 'register') {
      if (tabLogin) tabLogin.classList.remove('active');
      if (tabRegister) tabRegister.classList.add('active');
      if (formLogin) formLogin.style.display = 'none';
      if (formRegister) formRegister.style.display = 'block';
    } else {
      if (tabLogin) tabLogin.classList.add('active');
      if (tabRegister) tabRegister.classList.remove('active');
      if (formLogin) formLogin.style.display = 'block';
      if (formRegister) formRegister.style.display = 'none';
    }
  }

  /** Render thông tin vào form Hồ sơ cá nhân */
  static renderProfileForm(user) {
    if (!user) return;

    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    const phoneInput = document.getElementById('profile-phone');
    const addrInput = document.getElementById('profile-address');
    const avatarEl = document.getElementById('profile-avatar-letter');
    const titleEl = document.getElementById('profile-display-name');

    if (nameInput) nameInput.value = user.name || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.phone || '';
    if (addrInput) addrInput.value = user.address || '';

    const displayName = user.name || user.email.split('@')[0];
    if (avatarEl) avatarEl.textContent = displayName.charAt(0).toUpperCase();
    if (titleEl) titleEl.textContent = displayName;
  }

  /** Hiển thị thẻ nhận diện thông minh (Smart Identity Card) khi gõ email lúc thanh toán */
  static renderSmartIdentityCard(containerId, user) {
    const box = document.getElementById(containerId);
    if (!box) return;

    if (!user) {
      box.style.display = 'none';
      box.innerHTML = '';
      return;
    }

    box.style.display = 'block';
    box.innerHTML = `
      <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1.5px solid #93c5fd; border-radius: var(--radius-md); padding: 14px; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; animation: fadeIn 0.3s ease;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700;">
            ${(user.name || user.email).charAt(0).toUpperCase()}
          </div>
          <div>
            <div style="font-size: 13px; font-weight: 700; color: #1e3a8a;">
              Chào bạn, chúng tôi nhận diện tài khoản: <strong>${user.name || user.email}</strong>
            </div>
            <div style="font-size: 12px; color: #3b82f6;">
              Bấm xác nhận để tự động điền SĐT & Địa chỉ nhận hàng của bạn!
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 6px;">
          <button type="button" class="btn-primary btn-sm" id="btn-smart-confirm" onclick="window.authModule.confirmSmartIdentity()">
            <i class="fa-solid fa-check"></i> Điền Nhanh
          </button>
          <button type="button" class="btn-secondary btn-sm" id="btn-smart-cancel" onclick="window.authModule.cancelSmartIdentity()">
            Bỏ qua
          </button>
        </div>
      </div>
    `;
  }
}

// Khởi tạo Singleton toàn cục trong namespace View
window.UserView = UserView;
