/**
 * ============================================================================
 * 📋 MỤC LỤC CÁC HÀM & TÁC DỤNG (TABLE OF CONTENTS):
 * ----------------------------------------------------------------------------
 * 1. Khởi tạo & Trạng thái Module (Closure State):
 *    • createUserModel(apiUrl)          : Factory Function khởi tạo module & lưu mảng users trong Closure
 *    • UserModel(apiUrl)                : Constructor tương thích ngược trả về instance UserModel
 *    • _http(endpoint, options)         : Helper gửi HTTP request fetch bất đồng bộ an toàn
 *
 * 2. Quản lý Phiên Người Dùng (Session & LocalStorage):
 *    • getCurrentUser()                 : Lấy thông tin tài khoản đang đăng nhập từ LocalStorage
 *    • saveUser(user)                   : Lưu thông tin tài khoản an toàn (đã bóc tách password) vào LocalStorage
 *    • logout()                         : Xóa phiên đăng nhập người dùng & quản trị viên
 *
 * 3. Giao tiếp RESTful API & Xác thực Tài khoản (Authentication & Authorization):
 *    • login(email, password)           : [BƯỚC 3-5 TRONG AUTH] Đối soát thông tin, loại bỏ password và lưu phiên
 *    • register(name, email, pass...)   : [BƯỚC 3-5 TRONG AUTH] Đăng ký tài khoản thành viên mới (chặn trùng email)
 *    • checkIdentityByEmail(email)      : [Smart Identity Resolution] Nhận diện khách hàng thân thiết khi checkout
 *    • updateProfile(email, data)       : Cập nhật thông tin cá nhân (họ tên, SĐT, địa chỉ)
 *    • fetchAllUsers()                  : Nạp toàn bộ danh sách khách hàng cho Quản trị viên Admin Dashboard
 * ============================================================================
 */

function createUserModel(apiUrl = 'http://localhost:3000') {
  const storageKey = 'smartstore_user';
  let users = [];

  const _http = async (endpoint, options = {}) => {
    try {
      const res = await fetch(`${apiUrl}${endpoint}`, {
        headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
        ...options
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error(`[UserModel._http] Lỗi kết nối ${endpoint}:`, err.message);
      return null;
    }
  };

  const getCurrentUser = () => {
    try {
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  };

  const saveUser = (user) => {
    if (user) {
      try { localStorage.setItem(storageKey, JSON.stringify(user)); } catch (e) {}
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem(storageKey);
      sessionStorage.removeItem('smartstore_admin_logged');
    } catch (e) {}
    return { success: true, message: 'Đã đăng xuất tài khoản!' };
  };

  /**
   * [BƯỚC 3-5 TRONG LUỒNG AUTH] Đăng nhập hệ thống
   */
  const login = async (email = '', password = '') => {
    const em = (email || '').trim().toLowerCase();
    const pw = String(password ?? '').trim();

    if (!em || !pw) {
      return { success: false, message: 'Vui lòng nhập đầy đủ Email và Mật khẩu!' };
    }

    // 1. Tìm kiếm trực tiếp qua endpoint /users?email=...
    let userList = await _http(`/users?email=${encodeURIComponent(em)}`);

    // 2. Nếu không tìm thấy qua query (do phân biệt hoa thường hoặc database), nạp toàn bộ users
    if (!userList || !userList.length) {
      const allUsers = await _http('/users');
      if (Array.isArray(allUsers) && allUsers.length > 0) {
        users = allUsers;
        userList = allUsers.filter(u =>
          (u.email && u.email.trim().toLowerCase() === em) ||
          (u.phone && u.phone.trim() === em)
        );
      }
    }

    // 3. Fallback tìm trong cache RAM
    if (!userList || !userList.length) {
      if (users && users.length) {
        userList = users.filter(u =>
          (u.email && u.email.trim().toLowerCase() === em) ||
          (u.phone && u.phone.trim() === em)
        );
      }
    }

    if (!userList || !userList.length) {
      return { success: false, message: 'Email này chưa được đăng ký trong hệ thống!' };
    }

    // 4. Nếu có nhiều tài khoản (trùng SĐT), ưu tiên tìm tài khoản khớp đúng mật khẩu
    const user = userList.find(u => String(u.password ?? '').trim() === pw) || userList[0];
    const userPass = String(user.password ?? '').trim();
    if (userPass !== pw) {
      return { success: false, message: 'Mật khẩu đăng nhập không chính xác!' };
    }

    // 4. Đồng bộ cache RAM
    const existIdx = users.findIndex(u => String(u.id) === String(user.id));
    if (existIdx === -1) {
      users.push(user);
    } else {
      users[existIdx] = user;
    }

    // Bảo mật: Loại bỏ trường password trước khi lưu phiên
    const { password: _pw, ...safeUser } = user;
    saveUser(safeUser);
    return { success: true, user: safeUser, message: 'Đăng nhập thành công!' };
  };

  /**
   * [BƯỚC 3-5 TRONG LUỒNG AUTH] Đăng ký tài khoản thành viên mới
   * Hỗ trợ gọi register(name, email, pass, phone, addr) hoặc register(userDataObject)
   */
  const register = async (nameOrData, email, password, phone = '', address = '') => {
    let name = '';
    let em = '';
    let pw = '';
    let ph = '';
    let addr = '';

    if (typeof nameOrData === 'object' && nameOrData !== null) {
      name = nameOrData.fullName || nameOrData.name || '';
      em = nameOrData.email || '';
      pw = nameOrData.password || '';
      ph = nameOrData.phone || '';
      addr = nameOrData.address || '';
    } else {
      name = nameOrData || '';
      em = email || '';
      pw = password || '';
      ph = phone || '';
      addr = address || '';
    }

    if (!em || !pw) {
      return { success: false, message: 'Vui lòng điền đầy đủ Email và Mật khẩu!' };
    }

    const cleanEmail = em.trim().toLowerCase();
    const cleanPass = String(pw).trim();

    // Kiểm tra xem email đã được đăng ký chưa
    let existing = await _http(`/users?email=${encodeURIComponent(cleanEmail)}`);
    if (!existing || !existing.length) {
      const allUsers = await _http('/users');
      if (Array.isArray(allUsers) && allUsers.length > 0) {
        users = allUsers;
        existing = allUsers.filter(u => u.email && u.email.trim().toLowerCase() === cleanEmail);
      }
    }

    if (existing && existing.length > 0) {
      return { success: false, message: 'Email này đã tồn tại trên hệ thống, vui lòng đăng nhập!' };
    }

    const newUser = {
      name: name.trim() || 'Khách hàng',
      fullName: name.trim() || 'Khách hàng',
      email: cleanEmail,
      password: cleanPass,
      phone: ph.trim(),
      address: addr.trim(),
      role: 'user',
      createdAt: new Date().toISOString()
    };

    const saved = await _http('/users', {
      method: 'POST',
      body: JSON.stringify(newUser)
    });

    if (saved) {
      // Cập nhật ngay vào cache RAM users
      users.push(saved);
      const { password: _pw, ...safeUser } = saved;
      saveUser(safeUser);
      return { success: true, user: safeUser, message: 'Đăng ký tài khoản thành công!' };
    }

    return { success: false, message: 'Lỗi máy chủ khi đăng ký tài khoản!' };
  };

  /**
   * Smart Identity Resolution: Nhận diện khách hàng qua email khi checkout
   */
  const checkIdentityByEmail = async (email) => {
    if (!email) return null;
    const em = email.trim().toLowerCase();
    let list = await _http(`/users?email=${encodeURIComponent(em)}`);

    if (!list || !list.length) {
      if (users && users.length) {
        list = users.filter(u => u.email && u.email.trim().toLowerCase() === em);
      }
    }

    if (list && list.length > 0) {
      const { password: _pw, ...safeUser } = list[0];
      return safeUser;
    }

    return null;
  };

  /**
   * Cập nhật thông tin cá nhân
   */
  const updateProfile = async (email, profileData) => {
    if (!email) return { success: false, message: 'Thiếu email!' };
    const em = email.trim().toLowerCase();
    const list = await _http(`/users?email=${encodeURIComponent(em)}`);
    if (!list || !list.length) return { success: false, message: 'Không tìm thấy tài khoản!' };

    const userId = list[0].id;
    const updated = await _http(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(profileData)
    });

    if (updated) {
      const { password: _pw, ...safeUser } = updated;
      saveUser(safeUser);
      return { success: true, user: safeUser };
    }

    return { success: false, message: 'Lỗi cập nhật hồ sơ!' };
  };

  const fetchAllUsers = async () => {
    const list = await _http('/users');
    users = Array.isArray(list) ? list : [];
    return users;
  };

  /**
   * Thêm người dùng / khách hàng mới (Admin CRUD)
   * @param {Object} userData
   */
  const createUser = async (userData) => {
    const saved = await _http('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    if (!saved) return { success: false, message: 'Không thể thêm người dùng vào cơ sở dữ liệu' };
    users.push(saved);
    return { success: true, user: saved };
  };

  /**
   * Cập nhật thông tin người dùng theo ID (Admin CRUD)
   * @param {string|number} id
   * @param {Object} userData
   */
  const updateUser = async (id, userData) => {
    const updated = await _http(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(userData)
    });
    if (!updated) return { success: false, message: 'Không thể cập nhật thông tin người dùng' };
    const idx = users.findIndex(u => String(u.id) === String(id));
    if (idx !== -1) users[idx] = { ...users[idx], ...updated };
    return { success: true, user: updated };
  };

  /**
   * Xóa tài khoản người dùng theo ID (Admin CRUD)
   * @param {string|number} id
   */
  const deleteUser = async (id) => {
    const res = await _http(`/users/${id}`, { method: 'DELETE' });
    if (res === null) return { success: false, message: 'Không thể xóa người dùng khỏi hệ thống' };
    users = users.filter(u => String(u.id) !== String(id));
    return { success: true };
  };

  const modelInstance = {
    apiUrl,
    get users() { return users; },
    set users(val) { users = Array.isArray(val) ? val : []; },
    _http,
    getCurrentUser,
    saveUser,
    logout,
    login,
    register,
    checkIdentityByEmail,
    findUserByEmail: checkIdentityByEmail,
    updateProfile,
    fetchAllUsers,
    createUser,
    updateUser,
    deleteUser
  };

  return modelInstance;
}

const userModel = createUserModel();

function UserModel(apiUrl) {
  return apiUrl ? createUserModel(apiUrl) : userModel;
}

if (typeof window !== 'undefined') {
  window.UserModel = UserModel;
  window.userModel = userModel;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UserModel;
}
