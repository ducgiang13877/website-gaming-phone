/**
 * ============================================================================
 * MODEL: UserModel (Quản lý Dữ liệu Người dùng, Xác thực & Phiên Đăng nhập)
 * Kiến trúc: Mô hình MVC Chuẩn - SmartStore
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * ============================================================================
 */

class UserModel {
  constructor(apiUrl = 'http://localhost:3000') {
    this.apiUrl = apiUrl;
    this.storageKey = 'smartstore_user';
  }

  /** Lấy thông tin tài khoản đang đăng nhập từ localStorage */
  getCurrentUser() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('[UserModel] Lỗi đọc user:', e);
      return null;
    }
  }

  /** Lưu phiên đăng nhập người dùng */
  saveUser(user) {
    localStorage.setItem(this.storageKey, JSON.stringify(user));
  }

  /** Đăng xuất xóa phiên */
  logout() {
    localStorage.removeItem(this.storageKey);
  }

  /** Đăng nhập hệ thống */
  async login(email, password) {
    try {
      const em = email.trim().toLowerCase();
      const res = await fetch(`${this.apiUrl}/users?email=${encodeURIComponent(em)}`);
      if (!res.ok) throw new Error('Lỗi máy chủ khi đăng nhập');
      const users = await res.json();

      if (!users || users.length === 0) {
        return { success: false, message: 'Email này chưa được đăng ký trong hệ thống!' };
      }

      const user = users[0];
      if (user.password !== password) {
        return { success: false, message: 'Mật khẩu đăng nhập không chính xác!' };
      }

      // Xóa mật khẩu khi lưu vào bộ nhớ client để bảo mật
      const safeUser = { ...user };
      delete safeUser.password;
      this.saveUser(safeUser);

      return { success: true, user: safeUser };
    } catch (e) {
      console.error('[UserModel] Lỗi login:', e);
      return { success: false, message: 'Không thể kết nối đến máy chủ xác thực!' };
    }
  }

  /** Đăng ký tài khoản mới */
  async register(name, email, password, phone = '', address = '') {
    try {
      const em = email.trim().toLowerCase();

      // Kiểm tra trùng email
      const checkRes = await fetch(`${this.apiUrl}/users?email=${encodeURIComponent(em)}`);
      const existing = await checkRes.json();
      if (existing && existing.length > 0) {
        return { success: false, message: 'Email này đã tồn tại trên hệ thống, vui lòng dùng email khác!' };
      }

      const newUser = {
        name: name.trim(),
        email: em,
        password: password,
        phone: phone.trim(),
        address: address.trim(),
        role: 'customer',
        createdAt: new Date().toISOString()
      };

      const res = await fetch(`${this.apiUrl}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      if (!res.ok) throw new Error('Lỗi máy chủ khi tạo tài khoản');
      const created = await res.json();
      const safeUser = { ...created };
      delete safeUser.password;
      this.saveUser(safeUser);

      return { success: true, user: safeUser };
    } catch (e) {
      console.error('[UserModel] Lỗi register:', e);
      return { success: false, message: 'Đăng ký tài khoản thất bại, vui lòng thử lại!' };
    }
  }

  /** Cập nhật thông tin hồ sơ cá nhân */
  async updateProfile(id, profileData) {
    try {
      const res = await fetch(`${this.apiUrl}/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      if (!res.ok) throw new Error('Không thể cập nhật hồ sơ');
      const updated = await res.json();
      const safeUser = { ...updated };
      delete safeUser.password;
      this.saveUser(safeUser);
      return { success: true, user: safeUser };
    } catch (e) {
      console.error('[UserModel] Lỗi updateProfile:', e);
      return { success: false, message: e.message };
    }
  }

  /** Kiểm tra danh tính khi gõ email vào form thanh toán (Smart Identity Resolution) */
  async checkIdentityByEmail(email) {
    try {
      const em = email.trim().toLowerCase();
      const res = await fetch(`${this.apiUrl}/users?email=${encodeURIComponent(em)}`);
      if (!res.ok) return null;
      const list = await res.json();
      return (list && list.length > 0) ? list[0] : null;
    } catch (e) {
      return null;
    }
  }
}

// Khởi tạo Singleton toàn cục trong namespace Model
window.UserModel = UserModel;
