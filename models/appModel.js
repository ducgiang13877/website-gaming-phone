/**
 * ============================================================================
 * APP MODEL (MÔ HÌNH DỮ LIỆU TỔNG HỢP)
 * Gộp toàn bộ: ProductModel, CartModel, OrderModel, UserModel
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * ============================================================================
 */


class ProductModel {
  constructor(apiUrl = 'http://localhost:3000') {
    this.apiUrl = apiUrl;
    this.products = [];
    this.categories = [];
    this.compareKey = 'smartstore_compare';
  }

  /** Lấy toàn bộ danh sách sản phẩm từ db.json qua json-server */
  async fetchAllProducts() {
    try {
      const res = await fetch(`${this.apiUrl}/products`);
      if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status}`);
      this.products = await res.json();
      return this.products;
    } catch (err) {
      console.error('[ProductModel] Lỗi nạp sản phẩm:', err);
      return [];
    }
  }

  /** Lấy danh mục 8 thương hiệu điện thoại */
  async fetchCategories() {
    try {
      const res = await fetch(`${this.apiUrl}/categories`);
      if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status}`);
      this.categories = await res.json();
      return this.categories;
    } catch (err) {
      console.error('[ProductModel] Lỗi nạp danh mục:', err);
      return [];
    }
  }

  /** Lấy chi tiết 1 sản phẩm theo ID */
  async fetchProductById(id) {
    try {
      const res = await fetch(`${this.apiUrl}/products/${id}`);
      if (!res.ok) throw new Error(`Không tìm thấy sản phẩm #${id}`);
      return await res.json();
    } catch (err) {
      console.error(`[ProductModel] Lỗi lấy sản phẩm #${id}:`, err);
      return null;
    }
  }

  /** Cập nhật tồn kho và số lượng đã bán sau khi đặt hàng hoặc hủy đơn */
  async updateStock(id, newStock, newSold) {
    try {
      const res = await fetch(`${this.apiUrl}/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stock: Number(newStock),
          quantity: Number(newStock),
          sold: Number(newSold)
        })
      });
      return await res.json();
    } catch (err) {
      console.error(`[ProductModel] Lỗi cập nhật kho #${id}:`, err);
      return null;
    }
  }

  /** Bộ lọc và tìm kiếm logic */
  filterProducts(items, { brandId = 'all', keyword = '', priceRange = 'all', sort = 'default' }) {
    let result = [...items];

    // Lọc theo thương hiệu
    if (brandId && brandId !== 'all') {
      result = result.filter(item => 
        String(item.categoryId) === String(brandId) || 
        String(item.cate_id) === String(brandId)
      );
    }

    // Tìm kiếm theo tên hoặc thông số
    if (keyword && keyword.trim() !== '') {
      const q = keyword.trim().toLowerCase();
      result = result.filter(item => 
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.brand && item.brand.toLowerCase().includes(q)) ||
        (item.detail && item.detail.toLowerCase().includes(q))
      );
    }

    // Lọc theo khoảng giá
    if (priceRange && priceRange !== 'all') {
      if (priceRange === 'under-10m') {
        result = result.filter(item => item.price < 10000000);
      } else if (priceRange === '10m-20m') {
        result = result.filter(item => item.price >= 10000000 && item.price <= 20000000);
      } else if (priceRange === '20m-30m') {
        result = result.filter(item => item.price > 20000000 && item.price <= 30000000);
      } else if (priceRange === 'over-30m') {
        result = result.filter(item => item.price > 30000000);
      }
    }

    // Sắp xếp
    if (sort === 'price-asc') {
      result.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sort === 'price-desc') {
      result.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sort === 'name-asc') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sort === 'best-seller') {
      result.sort((a, b) => (Number(b.sold) || 0) - (Number(a.sold) || 0));
    }

    return result;
  }

  /** Phân trang danh sách sản phẩm */
  paginate(items, page = 1, pageSize = 8) {
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const startIndex = (currentPage - 1) * pageSize;
    const pagedItems = items.slice(startIndex, startIndex + pageSize);

    return {
      items: pagedItems,
      currentPage,
      totalPages,
      totalItems
    };
  }

  // --- QUẢN LÝ DANH SÁCH SO SÁNH (COMPARE LIST) ---
  getCompareIds() {
    try {
      const data = localStorage.getItem(this.compareKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveCompareIds(ids) {
    localStorage.setItem(this.compareKey, JSON.stringify(ids));
  }

  addToCompare(id) {
    const ids = this.getCompareIds();
    const strId = String(id);
    if (ids.includes(strId)) {
      return { success: false, message: 'Sản phẩm này đã có trong danh sách so sánh!' };
    }
    if (ids.length >= 3) {
      return { success: false, message: 'Chỉ có thể so sánh tối đa 3 sản phẩm cùng lúc!' };
    }
    ids.push(strId);
    this.saveCompareIds(ids);
    return { success: true, count: ids.length };
  }

  removeFromCompare(id) {
    let ids = this.getCompareIds();
    ids = ids.filter(item => String(item) !== String(id));
    this.saveCompareIds(ids);
    return ids;
  }

  clearCompare() {
    localStorage.removeItem(this.compareKey);
  }
}

// Khởi tạo Singleton toàn cục trong namespace Model
window.ProductModel = ProductModel;



class CartModel {
  constructor(apiUrl = 'http://localhost:3000') {
    this.apiUrl = apiUrl;
    this.storageKey = 'smartstore_cart';
    this.voucherKey = 'smartstore_voucher';
  }

  /** Lấy danh sách sản phẩm trong giỏ từ localStorage */
  getItems() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('[CartModel] Lỗi đọc giỏ hàng:', e);
      return [];
    }
  }

  /** Lưu giỏ hàng vào localStorage */
  saveItems(items) {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  /** Thêm sản phẩm vào giỏ hàng (Kiểm tra nghiêm ngặt tồn kho) */
  addItem(product, quantity = 1) {
    const items = this.getItems();
    const existingIndex = items.findIndex(i => String(i.id) === String(product.id));
    const stockAvailable = Number(product.stock) || Number(product.quantity) || 99;

    if (existingIndex > -1) {
      const currentQty = Number(items[existingIndex].quantity) || 0;
      if (currentQty + quantity > stockAvailable) {
        return {
          success: false,
          message: `Kho chỉ còn ${stockAvailable} sản phẩm! Bạn đã có ${currentQty} trong giỏ.`
        };
      }
      items[existingIndex].quantity = currentQty + quantity;
    } else {
      if (quantity > stockAvailable) {
        return {
          success: false,
          message: `Số lượng yêu cầu (${quantity}) vượt quá tồn kho (${stockAvailable})!`
        };
      }
      items.push({
        id: String(product.id),
        name: product.name,
        price: Number(product.price) || 0,
        image: product.image,
        quantity: quantity,
        stock: stockAvailable
      });
    }

    this.saveItems(items);
    return { success: true, count: this.getTotalCount() };
  }

  /** Thay đổi số lượng của sản phẩm trong giỏ */
  changeQuantity(productId, delta) {
    const items = this.getItems();
    const item = items.find(i => String(i.id) === String(productId));
    if (!item) return { success: false };

    const newQty = (Number(item.quantity) || 1) + delta;
    if (newQty < 1) {
      return { success: false, requireDelete: true };
    }
    if (item.stock && newQty > item.stock) {
      return {
        success: false,
        message: `Rất tiếc, kho chỉ còn tối đa ${item.stock} máy!`
      };
    }

    item.quantity = newQty;
    this.saveItems(items);
    return { success: true, newQty };
  }

  /** Xóa 1 sản phẩm khỏi giỏ */
  removeItem(productId) {
    let items = this.getItems();
    items = items.filter(i => String(i.id) !== String(productId));
    this.saveItems(items);
    return items;
  }

  /** Xóa sạch toàn bộ giỏ hàng */
  clearCart() {
    localStorage.removeItem(this.storageKey);
    this.clearVoucher();
  }

  /** Tổng số lượng sản phẩm trong giỏ (cho Badge hiển thị) */
  getTotalCount() {
    return this.getItems().reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }

  /** Tạm tính tiền hàng (Subtotal) */
  getSubtotal() {
    return this.getItems().reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 0)), 0);
  }

  // --- QUẢN LÝ VOUCHER & KHUYẾN MÃI ---
  async fetchVouchers() {
    try {
      const res = await fetch(`${this.apiUrl}/vouchers`);
      if (!res.ok) throw new Error('Không lấy được vouchers');
      return await res.json();
    } catch (e) {
      // Fallback danh sách voucher mặc định chuẩn dự án
      return [
        { code: 'GAMING500K', discountAmount: 500000, discountPercent: null, minOrder: 10000000, maxDiscount: 500000, desc: 'Giảm 500.000đ cho đơn từ 10 triệu' },
        { code: 'VIPGAMER1TR', discountAmount: 1000000, discountPercent: null, minOrder: 20000000, maxDiscount: 1000000, desc: 'Giảm 1.000.000đ cho đơn từ 20 triệu' },
        { code: 'SMART10', discountAmount: null, discountPercent: 10, minOrder: 15000000, maxDiscount: 1500000, desc: 'Giảm 10% (tối đa 1.5 triệu) cho đơn từ 15 triệu' },
        { code: 'FREESHIP', discountAmount: 50000, discountPercent: null, minOrder: 0, maxDiscount: 50000, desc: 'Miễn phí vận chuyển toàn quốc' }
      ];
    }
  }

  getAppliedVoucher() {
    try {
      const data = sessionStorage.getItem(this.voucherKey);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  setAppliedVoucher(voucherObj) {
    sessionStorage.setItem(this.voucherKey, JSON.stringify(voucherObj));
  }

  clearVoucher() {
    sessionStorage.removeItem(this.voucherKey);
  }

  /** Tính toán số tiền được giảm theo voucher */
  calculateDiscount(subtotal) {
    const voucher = this.getAppliedVoucher();
    if (!voucher) return 0;

    // Kiểm tra điều kiện đơn hàng tối thiểu
    if (voucher.minOrder && subtotal < voucher.minOrder) {
      return 0;
    }

    let discount = 0;
    if (voucher.discountAmount) {
      discount = Number(voucher.discountAmount);
    } else if (voucher.discountPercent) {
      discount = Math.round((subtotal * voucher.discountPercent) / 100);
      if (voucher.maxDiscount && discount > voucher.maxDiscount) {
        discount = voucher.maxDiscount;
      }
    }
    return Math.min(discount, subtotal);
  }

  /** Tổng tiền thanh toán cuối cùng */
  getFinalTotal() {
    const subtotal = this.getSubtotal();
    const discount = this.calculateDiscount(subtotal);
    return Math.max(0, subtotal - discount);
  }

  /** Tính toán tiến trình quà tặng (Gamification Reward Bar) */
  calculateRewardProgress(subtotal) {
    const milestones = [
      { amount: 15000000, gift: 'Cáp sạc nhanh 100W Gaming', reached: subtotal >= 15000000 },
      { amount: 30000000, gift: 'Tai nghe Gaming Type-C Hi-Res', reached: subtotal >= 30000000 },
      { amount: 50000000, gift: 'Quạt tản nhiệt bán dẫn RGB Pro', reached: subtotal >= 50000000 }
    ];

    let nextMilestone = milestones.find(m => !m.reached);
    let percent = 100;
    let message = 'Chúc mừng! Bạn đã mở khóa toàn bộ QUÀ TẶNG GAMING độc quyền!';

    if (nextMilestone) {
      percent = Math.min(100, Math.round((subtotal / nextMilestone.amount) * 100));
      const remaining = nextMilestone.amount - subtotal;
      message = `Mua thêm <strong>${new Intl.NumberFormat('vi-VN').format(remaining)}đ</strong> để nhận ngay: <strong>${nextMilestone.gift}</strong>!`;
    }

    return { percent, message, milestones };
  }
}

// Khởi tạo Singleton toàn cục trong namespace Model
window.CartModel = CartModel;



class OrderModel {
  constructor(apiUrl = 'http://localhost:3000') {
    this.apiUrl = apiUrl;
    this.recentOrderKey = 'smartstore_recent_order';
  }

  /** Lưu đơn hàng vừa tạo xong vào localStorage để tiện xem ngay */
  saveRecentOrder(order) {
    localStorage.setItem(this.recentOrderKey, JSON.stringify(order));
  }

  getRecentOrder() {
    try {
      const data = localStorage.getItem(this.recentOrderKey);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  /** Tạo đơn hàng mới lên db.json */
  async createOrder(orderData) {
    try {
      const res = await fetch(`${this.apiUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (!res.ok) throw new Error(`Lỗi tạo đơn: ${res.status}`);
      const createdOrder = await res.json();
      this.saveRecentOrder(createdOrder);
      return createdOrder;
    } catch (err) {
      console.error('[OrderModel] Lỗi tạo đơn hàng:', err);
      return null;
    }
  }

  /** Lấy chi tiết đơn hàng theo mã đơn (#DH...) hoặc ID */
  async fetchOrderByCode(orderCode) {
    try {
      const code = orderCode.trim();
      const res = await fetch(`${this.apiUrl}/orders?orderCode=${encodeURIComponent(code)}`);
      if (res.ok) {
        const orders = await res.json();
        if (orders.length > 0) return orders[0];
      }
      // Thử tìm theo ID
      const resId = await fetch(`${this.apiUrl}/orders/${encodeURIComponent(code)}`);
      if (resId.ok) return await resId.json();
      return null;
    } catch (e) {
      console.error('[OrderModel] Lỗi tìm đơn hàng:', e);
      return null;
    }
  }

  /** Lấy tất cả đơn hàng của 1 người dùng theo userId */
  async fetchOrdersByUserId(userId) {
    try {
      const res = await fetch(`${this.apiUrl}/orders?userId=${userId}&_sort=createdAt&_order=desc`);
      if (!res.ok) throw new Error('Lỗi lấy danh sách đơn');
      return await res.json();
    } catch (e) {
      console.error('[OrderModel] Lỗi nạp đơn hàng cá nhân:', e);
      return [];
    }
  }

  /** Tra cứu đơn hàng theo Mã đơn hoặc Số điện thoại */
  async searchOrders(query) {
    try {
      const q = query.trim();
      let res = await fetch(`${this.apiUrl}/orders?orderCode=${encodeURIComponent(q)}`);
      let list = await res.json();

      if (!list || list.length === 0) {
        // Tìm theo số điện thoại
        res = await fetch(`${this.apiUrl}/orders?customerPhone=${encodeURIComponent(q)}`);
        list = await res.json();
      }
      return list || [];
    } catch (e) {
      console.error('[OrderModel] Lỗi tra cứu đơn:', e);
      return [];
    }
  }

  /** Khách hủy đơn hàng ở trạng thái Chờ xử lý & hoàn trả kho */
  async cancelOrder(orderId) {
    try {
      // 1. Cập nhật trạng thái đơn thành cancelled
      const res = await fetch(`${this.apiUrl}/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });
      if (!res.ok) throw new Error('Không thể cập nhật trạng thái đơn hàng');
      const updatedOrder = await res.json();

      // 2. Hoàn trả lại số lượng tồn kho cho các sản phẩm trong đơn
      if (updatedOrder.items && updatedOrder.items.length > 0) {
        const restorePromises = updatedOrder.items.map(async item => {
          const resSp = await fetch(`${this.apiUrl}/products/${item.id}`);
          if (resSp.ok) {
            const sp = await resSp.json();
            const khoMoi = (Number(sp.stock) || 0) + (Number(item.quantity) || 0);
            const daBanMoi = Math.max(0, (Number(sp.sold) || 0) - (Number(item.quantity) || 0));
            return fetch(`${this.apiUrl}/products/${item.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ stock: khoMoi, quantity: khoMoi, sold: daBanMoi })
            });
          }
        });
        await Promise.all(restorePromises);
      }

      return { success: true, order: updatedOrder };
    } catch (e) {
      console.error('[OrderModel] Lỗi hủy đơn:', e);
      return { success: false, error: e.message };
    }
  }
}

// Khởi tạo Singleton toàn cục trong namespace Model
window.OrderModel = OrderModel;



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


