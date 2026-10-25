
// Biểu thức chính quy kiểm tra định dạng email và số điện thoại (Pure Validation Regex)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

/**
 * [HÀM 1] Chuyển đổi tab linh hoạt giữa Đăng Nhập và Đăng Ký
 * Tác dụng: Ẩn/Hiện form Đăng nhập và form Đăng ký khi người dùng bấm nút tab
 * @param {'login'|'register'} tab - Tên tab muốn kích hoạt ('login' hoặc 'register')
 */
function switchAuthTab(tab) {
  const tabLogin = document.getElementById('tab-btn-login') || document.getElementById('tab-login-btn');
  const tabRegister = document.getElementById('tab-btn-register') || document.getElementById('tab-register-btn');
  const formLogin = document.getElementById('form-login') || document.getElementById('auth-login-form');
  const formRegister = document.getElementById('form-register') || document.getElementById('auth-register-form');

  const isRegister = tab === 'register';

  tabLogin?.classList.toggle('active', !isRegister);
  tabRegister?.classList.toggle('active', isRegister);

  if (formLogin) formLogin.style.display = isRegister ? 'none' : 'block';
  if (formRegister) formRegister.style.display = isRegister ? 'block' : 'none';
}

/**
 * [HÀM 2] Render thông tin người dùng vào Form Hồ sơ cá nhân (Profile View)
 * Tác dụng: Điền họ tên, email, SĐT, địa chỉ đã lưu vào các ô input để khách hàng chỉnh sửa
 * @param {Object} user - Đối tượng người dùng lấy từ UserModel
 */
function renderProfileForm(user) {
  if (!user) return;

  const nameInput = document.getElementById('profile-name');
  const emailInput = document.getElementById('profile-email');
  const phoneInput = document.getElementById('profile-phone');
  const addrInput = document.getElementById('profile-address');
  const avatarEl = document.getElementById('profile-avatar-letter');
  const titleEl = document.getElementById('profile-display-name');

  if (nameInput) nameInput.value = user.name || user.fullName || '';
  if (emailInput) emailInput.value = user.email || '';
  if (phoneInput) phoneInput.value = user.phone || '';
  if (addrInput) addrInput.value = user.address || '';

  const displayName = user.name || user.fullName || (user.email ? user.email.split('@')[0] : 'Khách hàng');
  if (avatarEl) avatarEl.textContent = displayName.charAt(0).toUpperCase();
  if (titleEl) titleEl.textContent = displayName;
}

/**
 * [HÀM 3] Hiển thị thẻ nhận diện khách quen (Smart Identity Resolution) khi gõ email lúc checkout
 * Tác dụng: Khi khách gõ email, hệ thống nhận diện và hiện thanh gợi ý bấm 1 click để điền nhanh SĐT/Địa chỉ
 * @param {string} containerId - ID phần tử chứa thẻ thông báo
 * @param {Object|null} user - Đối tượng khách quen tìm thấy trong cơ sở dữ liệu
 */
function renderSmartIdentityCard(containerId, user) {
  const box = document.getElementById(containerId);
  if (!box) return;

  if (!user) {
    box.style.display = 'none';
    box.innerHTML = '';
    return;
  }

  const displayName = user.name || user.fullName || user.email;
  box.style.display = 'block';
  box.innerHTML = `
    <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1.5px solid #93c5fd; border-radius: var(--radius-md); padding: 14px; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; animation: fadeIn 0.3s ease;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700;">
          ${displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style="font-size: 13px; font-weight: 700; color: #1e3a8a;">
            Chào bạn, chúng tôi nhận diện tài khoản: <strong>${displayName}</strong>
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

/**
 * [HÀM 4] Bật / Tắt hiển thị mật khẩu (Show/Hide Password Toggle)
 * @param {string} inputId - ID của ô input password
 * @param {HTMLElement} [btnEl] - Phần tử nút bấm toggle
 */
function togglePasswordVisibility(inputId, btnEl) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';

  const icon = btnEl ? btnEl.querySelector('i') : null;
  if (icon) {
    icon.className = isPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
  }
}

// ============================================================================
// XUẤT BẢN MODULE THEO PHONG CÁCH DÙNG HÀM HIỆN ĐẠI
// ============================================================================
const userView = {
  EMAIL_REGEX,
  PHONE_REGEX,
  switchAuthTab,
  renderProfileForm,
  renderSmartIdentityCard,
  togglePasswordVisibility
};

function UserView() { return userView; }
Object.assign(UserView, userView);

if (typeof window !== 'undefined') {
  window.userView = userView;
  window.UserView = UserView;
  window.togglePasswordVisibility = togglePasswordVisibility;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = userView;
}
