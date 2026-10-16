/**
 * ============================================================================
 * WEBSITE GAMING PHONE (SMARTSTORE) - GIAO DIỆN NGƯỜI DÙNG (js/app.js)
 * ============================================================================
 * Phong cách code: ES6+ Hiện đại, Ngắn gọn, Tối ưu và Dễ hiểu cho sinh viên.
 * Chức năng: SPA điều hướng, Giỏ hàng, Đặt hàng, Phân trang, Bộ lọc & Tài khoản.
 * ============================================================================
 */

// ================= 1. CẤU HÌNH VÀ BIẾN TOÀN CỤC =================
const API = 'http://localhost:3000';
const DEFAULT_IMG = 'https://picsum.photos/300/300';
const ITEMS_PER_PAGE = 8; // Hiển thị 8 sản phẩm mỗi trang

let products = [];     // Danh sách sản phẩm từ server
let categories = [];   // Danh mục thương hiệu
let cart = JSON.parse(localStorage.getItem('smartstore_cart') || '[]'); // Giỏ hàng
let currentUser = JSON.parse(localStorage.getItem('smartstore_user') || 'null'); // Người dùng
let currentPage = 1;   // Trang hiện tại

// ================= 2. HÀM TIỆN ÍCH DÙNG CHUNG =================
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

// Định dạng tiền tệ VNĐ (ví dụ: 29.990.000 đ)
const formatMoney = (amount) => (Number(amount) || 0).toLocaleString('vi-VN') + ' đ';

// Hàm gọi API ngắn gọn bằng Fetch kết hợp async/await
const api = async (endpoint, method = 'GET', body = null) => {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : null
  };
  const res = await fetch(`${API}/${endpoint}`, options);
  if (!res.ok) throw new Error(`Lỗi kết nối API: ${res.status}`);
  return res.json();
};

// Hiển thị thông báo Toast góc màn hình (tự biến mất sau 3 giây)
let toastTimer = null;
const showToast = (message, type = 'info') => {
  const toast = $('toast');
  if (!toast) return;
  const icons = {
    success: 'fa-circle-check',
    error: 'fa-circle-xmark',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info'
  };
  toast.innerHTML = `<i class="fas ${icons[type] || 'fa-info'}"></i> <span>${message}</span>`;
  toast.className = `toast-notice toast-${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
};

// Sinh mã đơn hàng chuẩn 11 ký tự dạng: # + 10 ký tự chữ hoa và số ngẫu nhiên
const generateOrderCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '#';
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// ================= 3. ĐIỀU HƯỚNG GIAO DIỆN (SPA VIEW SWITCHER) =================
const switchView = (viewId) => {
  // Ẩn tất cả view và chỉ hiển thị view mục tiêu
  $$('.view-panel').forEach(panel => panel.classList.toggle('active', panel.id === viewId));
  
  // Cập nhật trạng thái active trên nút header
  $$('.nav-item').forEach(btn => btn.classList.toggle('active', btn.dataset.view === viewId));
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Tự động tải lại nội dung tương ứng khi chuyển view
  if (viewId === 'view-cart') renderCartTable();
  if (viewId === 'view-orders') renderOrderHistory();
  if (viewId === 'view-account') renderAccountView();
};

// ================= 4. HIỂN THỊ SẢN PHẨM, TÌM KIẾM & PHÂN TRANG =================

// Lọc danh sách sản phẩm theo từ khóa, thương hiệu và khoảng giá
const getFilteredProducts = () => {
  const keyword = ($('shop-search')?.value || '').trim().toLowerCase();
  const categoryId = $('shop-filter-category')?.value || '';
  const priceRange = $('shop-filter-price')?.value || '';

  return products.filter(sp => {
    const matchName = !keyword || (sp.name || '').toLowerCase().includes(keyword);
    const spCate = String(sp.cate_id || sp.category_id || '');
    const matchCate = !categoryId || spCate === categoryId;
    
    const price = Number(sp.price) || 0;
    const matchPrice = !priceRange
      || (priceRange === 'duoi-10tr' && price < 10000000)
      || (priceRange === '10tr-25tr' && price >= 10000000 && price <= 25000000)
      || (priceRange === 'tren-25tr' && price > 25000000);

    return matchName && matchCate && matchPrice;
  });
};

// Hiển thị danh sách sản phẩm dạng thẻ lưới kèm phân trang
const renderProducts = () => {
  const grid = $('product-grid');
  const filtered = getFilteredProducts();
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  
  if (currentPage > totalPages) currentPage = totalPages;

  // Cắt mảng sản phẩm cho trang hiện tại (8 sản phẩm)
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filtered.slice(start, start + ITEMS_PER_PAGE);

  if (!currentItems.length) {
    grid.innerHTML = `<div class="empty-list-box"><i class="fas fa-box-open"></i><p>Không tìm thấy điện thoại nào phù hợp!</p></div>`;
    renderPagination(0);
    return;
  }

  // Render danh sách sản phẩm
  grid.innerHTML = currentItems.map(sp => {
    const cate = categories.find(c => String(c.id) === String(sp.cate_id || sp.category_id));
    const stock = Number(sp.quantity) || 0;
    return `
      <div class="product-card">
        <div class="product-badge">${cate?.name || 'Gaming'}</div>
        <div class="product-thumb" onclick="openProductDetail('${sp.id}')">
          <img src="${sp.image || DEFAULT_IMG}" alt="${sp.name}" onerror="this.src='${DEFAULT_IMG}'" />
        </div>
        <div class="product-info">
          <h3 class="product-title" onclick="openProductDetail('${sp.id}')">${sp.name}</h3>
          <div class="product-price">${formatMoney(sp.price)}</div>
          <div class="product-stock ${stock > 0 ? 'in-stock' : 'out-stock'}">
            ${stock > 0 ? `Còn hàng: ${stock} máy` : 'Tạm hết hàng'}
          </div>
          <div class="product-actions">
            <button class="btn-card-add" onclick="addToCart('${sp.id}')" ${stock <= 0 ? 'disabled' : ''}>
              <i class="fas fa-cart-plus"></i> Thêm giỏ
            </button>
            <button class="btn-card-buy" onclick="buyNow('${sp.id}')" ${stock <= 0 ? 'disabled' : ''}>
              Mua ngay
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  renderPagination(totalPages);
};

// Render thanh phân trang
const renderPagination = (totalPages) => {
  const wrapper = $('shop-pagination');
  if (!wrapper || totalPages <= 1) {
    if (wrapper) wrapper.innerHTML = '';
    return;
  }
  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
  }
  wrapper.innerHTML = html;
};

const changePage = (page) => {
  currentPage = page;
  renderProducts();
  window.scrollTo({ top: 350, behavior: 'smooth' });
};

// Modal xem chi tiết sản phẩm
const openProductDetail = (productId) => {
  const sp = products.find(p => String(p.id) === String(productId));
  if (!sp) return;
  const cate = categories.find(c => String(c.id) === String(sp.cate_id || sp.category_id));
  
  $('detail-brand-badge').textContent = cate?.name || 'Gaming Phone';
  $('detail-img').src = sp.image || DEFAULT_IMG;
  $('detail-name').textContent = sp.name;
  $('detail-price').textContent = formatMoney(sp.price);
  $('detail-stock').textContent = sp.quantity > 0 ? `Còn lại trong kho: ${sp.quantity} máy` : 'Hết hàng';
  $('detail-desc').textContent = sp.detail || 'Cấu hình gaming phone cực mạnh, màn hình siêu mượt.';

  $('btn-detail-add-cart').onclick = () => { addToCart(sp.id); closeDetailModal(); };
  $('btn-detail-buy-now').onclick = () => { closeDetailModal(); buyNow(sp.id); };

  $('product-detail-modal')?.classList.add('open');
};

const closeDetailModal = () => $('product-detail-modal')?.classList.remove('open');

// ================= 5. QUẢN LÝ GIỎ HÀNG (SHOPPING CART) =================
const saveCart = () => {
  localStorage.setItem('smartstore_cart', JSON.stringify(cart));
  updateCartBadge();
};

const updateCartBadge = () => {
  const totalQty = cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const badge = $('cart-count');
  if (badge) {
    badge.textContent = totalQty;
    badge.style.display = totalQty > 0 ? 'inline-flex' : 'none';
  }
};

const addToCart = (productId) => {
  const sp = products.find(p => String(p.id) === String(productId));
  if (!sp) return;
  const stock = Number(sp.quantity) || 0;
  if (stock <= 0) return showToast('Sản phẩm đã hết hàng!', 'warning');

  const inCart = cart.find(item => String(item.id) === String(productId));
  if (inCart) {
    if (inCart.quantity >= stock) return showToast(`Kho chỉ còn ${stock} máy!`, 'warning');
    inCart.quantity += 1;
  } else {
    cart.push({ id: sp.id, name: sp.name, price: Number(sp.price), image: sp.image || DEFAULT_IMG, quantity: 1, maxStock: stock });
  }
  saveCart();
  showToast(`Đã thêm "${sp.name}" vào giỏ hàng!`, 'success');
};

const buyNow = (productId) => {
  addToCart(productId);
  switchView('view-cart');
};

const updateCartQty = (productId, newQty) => {
  const item = cart.find(i => String(i.id) === String(productId));
  if (!item) return;
  const qty = parseInt(newQty, 10);
  if (isNaN(qty) || qty <= 0) return removeFromCart(productId);

  const sp = products.find(p => String(p.id) === String(productId));
  const maxStock = sp ? Number(sp.quantity) : 99;
  if (qty > maxStock) {
    showToast(`Kho chỉ còn tối đa ${maxStock} máy!`, 'warning');
    item.quantity = maxStock;
  } else {
    item.quantity = qty;
  }
  saveCart();
  renderCartTable();
};

const removeFromCart = (productId) => {
  const item = cart.find(i => String(i.id) === String(productId));
  if (!item || !confirm(`Xóa "${item.name}" khỏi giỏ hàng?`)) return;
  cart = cart.filter(i => String(i.id) !== String(productId));
  saveCart();
  renderCartTable();
  showToast('Đã xóa món hàng khỏi giỏ.', 'info');
};

// Hiển thị bảng giỏ hàng và tính tiền
const renderCartTable = () => {
  const tbody = $('cart-tbody');
  const btnSubmit = $('btn-submit-order');
  if (!tbody) return;

  if (!cart.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="cart-empty-text"><i class="fas fa-cart-shopping"></i> Giỏ hàng trống!</td></tr>`;
    $('cart-subtotal').textContent = '0 đ';
    $('cart-total').textContent = '0 đ';
    if (btnSubmit) btnSubmit.disabled = true;
    return;
  }

  let total = 0;
  tbody.innerHTML = cart.map(item => {
    const subtotal = item.price * item.quantity;
    total += subtotal;
    return `
      <tr>
        <td>
          <div class="cart-item-info">
            <img src="${item.image}" alt="${item.name}" />
            <strong>${item.name}</strong>
          </div>
        </td>
        <td>${formatMoney(item.price)}</td>
        <td>
          <input type="number" min="1" max="99" value="${item.quantity}" class="cart-qty-input" 
            onchange="updateCartQty('${item.id}', this.value)" />
        </td>
        <td><strong>${formatMoney(subtotal)}</strong></td>
        <td>
          <button class="btn-del-cart" onclick="removeFromCart('${item.id}')"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `;
  }).join('');

  $('cart-subtotal').textContent = formatMoney(total);
  $('cart-total').textContent = formatMoney(total);
  if (btnSubmit) btnSubmit.disabled = false;

  // Tự động điền thông tin người dùng nếu đã đăng nhập
  if (currentUser) {
    if ($('checkout-name')) $('checkout-name').value = currentUser.name || '';
    if ($('checkout-phone')) $('checkout-phone').value = currentUser.phone || '';
    if ($('checkout-address')) $('checkout-address').value = currentUser.address || '';
    $('cart-login-warning')?.classList.add('hidden');
    $('checkout-auth-alert')?.classList.add('hidden');
  } else {
    $('cart-login-warning')?.classList.remove('hidden');
    $('checkout-auth-alert')?.classList.remove('hidden');
  }
};

// ================= 6. XỬ LÝ ĐẶT HÀNG & TRỪ TỒN KHO =================
const handleCheckout = async (e) => {
  e.preventDefault();
  if (!cart.length) return showToast('Giỏ hàng đang trống!', 'warning');

  const customer_name = $('checkout-name')?.value.trim();
  const customer_phone = $('checkout-phone')?.value.trim();
  const shipping_address = $('checkout-address')?.value.trim();
  const note = $('checkout-note')?.value.trim() || '';

  if (!customer_name || !customer_phone || !shipping_address) {
    return showToast('Vui lòng điền đầy đủ thông tin giao hàng!', 'warning');
  }

  const submitBtn = $('btn-submit-order');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...'; }

  try {
    const total_price = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const newOrder = {
      order_code: generateOrderCode(),
      user_id: currentUser ? String(currentUser.id) : null,
      customer_name,
      customer_phone,
      shipping_address,
      note,
      items: [...cart],
      total_price,
      status: 'Đang xử lý',
      created_at: new Date().toISOString()
    };

    // 1. Tạo đơn hàng mới trên API
    const createdOrder = await api('orders', 'POST', newOrder);

    // 2. Tự động trừ số lượng tồn kho của từng sản phẩm trên server
    await Promise.all(cart.map(async (item) => {
      const sp = products.find(p => String(p.id) === String(item.id));
      if (sp) {
        const remainingStock = Math.max(0, (Number(sp.quantity) || 0) - item.quantity);
        sp.quantity = remainingStock;
        await api(`products/${sp.id}`, 'PATCH', { quantity: remainingStock });
      }
    }));

    // 3. Xóa giỏ hàng & chuyển sang trang cảm ơn
    cart = [];
    saveCart();
    $('checkout-form')?.reset();
    showThankYouView(createdOrder);
    showToast('Đặt hàng thành công!', 'success');

  } catch (err) {
    console.error('Lỗi đặt hàng:', err);
    showToast('Không thể tạo đơn hàng. Vui lòng thử lại!', 'error');
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Đặt Hàng Ngay'; }
  }
};

const showThankYouView = (order) => {
  switchView('view-thankyou');
  $('placed-order-id').textContent = order.order_code || order.id;
  $('placed-order-name').textContent = order.customer_name;
  $('placed-order-phone').textContent = order.customer_phone;
  $('placed-order-address').textContent = order.shipping_address;
  $('placed-order-total').textContent = formatMoney(order.total_price);

  $('placed-items-list').innerHTML = (order.items || []).map(item => `
    <div class="placed-item-row">
      <span>${item.name} <b>x${item.quantity}</b></span>
      <strong>${formatMoney(item.price * item.quantity)}</strong>
    </div>
  `).join('');
};

// ================= 7. XEM LỊCH SỬ ĐƠN HÀNG CỦA USER =================
const renderOrderHistory = async () => {
  const container = $('orders-history-list');
  const alertNotLogged = $('orders-not-logged');
  if (!container) return;

  if (!currentUser) {
    alertNotLogged?.classList.remove('hidden');
    container.innerHTML = '';
    return;
  }
  alertNotLogged?.classList.add('hidden');
  container.innerHTML = `<div class="loading-box"><i class="fas fa-spinner fa-spin"></i> Đang tải đơn hàng...</div>`;

  try {
    const list = await api(`orders?user_id=${currentUser.id}`);
    const userOrders = (Array.isArray(list) ? list : []).reverse();

    if (!userOrders.length) {
      container.innerHTML = `<div class="empty-list-box"><p>Bạn chưa có đơn đặt hàng nào!</p></div>`;
      return;
    }

    const badgeMap = {
      'Đang xử lý': 'status-processing',
      'Đang giao hàng': 'status-shipping',
      'Đã giao hàng': 'status-delivered',
      'Đã hủy': 'status-cancelled'
    };

    container.innerHTML = userOrders.map(order => `
      <div class="order-card">
        <div class="order-card-header">
          <div>
            <span>Mã đơn:</span> <b class="order-code-text">${order.order_code || order.id}</b>
            <small>(${new Date(order.created_at || order.created_date).toLocaleString('vi-VN')})</small>
          </div>
          <span class="status-badge ${badgeMap[order.status] || 'status-processing'}">${order.status || 'Đang xử lý'}</span>
        </div>
        <div class="order-card-body">
          ${(order.items || []).map(i => `<div>${i.name || i.product_name} (x${i.quantity}) - <b>${formatMoney((i.price || 0) * i.quantity)}</b></div>`).join('')}
        </div>
        <div class="order-card-footer">
          Tổng tiền: <strong class="order-total-price">${formatMoney(order.total_price || order.total_amount)}</strong>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p class="error-text">Lỗi khi tải lịch sử đơn hàng!</p>`;
  }
};

// ================= 8. QUẢN LÝ TÀI KHOẢN & TỰ SỬA THÔNG TIN =================
const renderAccountView = () => {
  const loggedBox = $('account-logged-box');
  const authWrapper = $('auth-forms-wrapper');
  const navAdminBtn = $('nav-btn-admin');
  const adminShortcut = $('admin-shortcut-card');

  if (currentUser) {
    loggedBox?.classList.remove('hidden');
    authWrapper?.classList.add('hidden');

    const isAdmin = currentUser.role === 'admin' || currentUser.email === 'admin@smartstore.vn';
    $('account-user-name').textContent = currentUser.name || 'Người dùng';
    $('account-user-email').textContent = currentUser.email || '';
    $('profile-name-val').textContent = currentUser.name || '—';
    $('profile-phone').textContent = currentUser.phone || '—';
    $('profile-address').textContent = currentUser.address || '—';
    $('profile-role').textContent = isAdmin ? 'Quản trị viên (Admin)' : 'Khách hàng';

    // Điền sẵn form chỉnh sửa
    if ($('edit-profile-name')) $('edit-profile-name').value = currentUser.name || '';
    if ($('edit-profile-phone')) $('edit-profile-phone').value = currentUser.phone || '';
    if ($('edit-profile-address')) $('edit-profile-address').value = currentUser.address || '';

    // Hiển thị nút vào trang Admin nếu có quyền
    if (isAdmin) {
      localStorage.setItem('smartstore_admin_logged', 'true');
      navAdminBtn?.classList.remove('hidden');
      adminShortcut?.classList.remove('hidden');
    } else {
      navAdminBtn?.classList.add('hidden');
      adminShortcut?.classList.add('hidden');
    }
  } else {
    loggedBox?.classList.add('hidden');
    authWrapper?.classList.remove('hidden');
    navAdminBtn?.classList.add('hidden');
    adminShortcut?.classList.add('hidden');
  }

  // Cập nhật tên hiển thị trên thanh Header
  const navText = $('nav-account-text');
  if (navText) navText.textContent = currentUser ? (currentUser.name || 'Bạn').split(' ').slice(-1)[0] : 'Tài khoản';
};

// Xử lý khi User lưu thông tin cá nhân mới
const handleUpdateProfile = async (e) => {
  e.preventDefault();
  if (!currentUser) return;
  const name = $('edit-profile-name')?.value.trim();
  const phone = $('edit-profile-phone')?.value.trim();
  const address = $('edit-profile-address')?.value.trim();

  if (!name || !phone || !address) return showToast('Vui lòng điền đủ thông tin!', 'warning');

  try {
    const updated = await api(`users/${currentUser.id}`, 'PATCH', { name, phone, address });
    currentUser = { ...currentUser, ...updated };
    localStorage.setItem('smartstore_user', JSON.stringify(currentUser));
    renderAccountView();
    $('edit-profile-card')?.classList.add('hidden');
    showToast('Cập nhật thông tin cá nhân thành công!', 'success');
  } catch (err) {
    showToast('Lỗi cập nhật thông tin cá nhân!', 'error');
  }
};

// Đăng nhập tài khoản
const handleLogin = async (e) => {
  e.preventDefault();
  const email = $('login-email')?.value.trim();
  const password = $('login-password')?.value.trim();

  try {
    const users = await api(`users?email=${encodeURIComponent(email)}`);
    const user = users?.[0];

    if (!user || user.password !== password) {
      return showToast('Sai email hoặc mật khẩu!', 'error');
    }

    currentUser = user;
    localStorage.setItem('smartstore_user', JSON.stringify(user));

    // NẾU LÀ ADMIN -> TỰ ĐỘNG CHUYỂN HƯỚNG SANG TRANG ADMIN.HTML
    if (user.role === 'admin' || user.email === 'admin@smartstore.vn') {
      localStorage.setItem('smartstore_admin_logged', 'true');
      showToast('Đăng nhập Quản trị viên! Đang mở Admin Panel...', 'success');
      setTimeout(() => window.location.href = 'admin.html', 700);
      return;
    }

    $('login-form')?.reset();
    renderAccountView();
    showToast(`Chào mừng ${user.name} đã đăng nhập!`, 'success');
  } catch (err) {
    showToast('Lỗi đăng nhập. Vui lòng kiểm tra server cổng 3000!', 'error');
  }
};

// Đăng ký tài khoản
const handleRegister = async (e) => {
  e.preventDefault();
  const name = $('reg-name')?.value.trim();
  const email = $('reg-email')?.value.trim();
  const phone = $('reg-phone')?.value.trim();
  const password = $('reg-password')?.value.trim();
  const address = $('reg-address')?.value.trim();

  if (password.length < 6) return showToast('Mật khẩu tối thiểu 6 ký tự!', 'warning');

  try {
    const existing = await api(`users?email=${encodeURIComponent(email)}`);
    if (existing?.length) return showToast('Email này đã được đăng ký!', 'warning');

    const newUser = await api('users', 'POST', { name, email, phone, password, address, role: 'customer' });
    currentUser = newUser;
    localStorage.setItem('smartstore_user', JSON.stringify(newUser));
    $('register-form')?.reset();
    renderAccountView();
    showToast('Đăng ký tài khoản thành công!', 'success');
  } catch (err) {
    showToast('Lỗi khi đăng ký tài khoản!', 'error');
  }
};

// Đổi mật khẩu
const handleChangePassword = async (e) => {
  e.preventDefault();
  if (!currentUser) return;
  const oldPass = $('old-pass')?.value.trim();
  const newPass = $('new-pass')?.value.trim();
  const confirmPass = $('confirm-new-pass')?.value.trim();

  if (oldPass !== currentUser.password) return showToast('Mật khẩu hiện tại không đúng!', 'error');
  if (newPass.length < 6) return showToast('Mật khẩu mới tối thiểu 6 ký tự!', 'warning');
  if (newPass !== confirmPass) return showToast('Xác nhận mật khẩu không khớp!', 'warning');

  try {
    await api(`users/${currentUser.id}`, 'PATCH', { password: newPass });
    currentUser.password = newPass;
    localStorage.setItem('smartstore_user', JSON.stringify(currentUser));
    $('change-password-form')?.reset();
    showToast('Đổi mật khẩu thành công!', 'success');
  } catch (err) {
    showToast('Không thể đổi mật khẩu!', 'error');
  }
};

// Đăng xuất
const handleLogout = () => {
  if (!confirm('Bạn có chắc muốn đăng xuất?')) return;
  currentUser = null;
  localStorage.removeItem('smartstore_user');
  localStorage.removeItem('smartstore_admin_logged');
  renderAccountView();
  showToast('Đã đăng xuất tài khoản.', 'info');
};

// ================= 9. KHỞI TẠO VÀ GẮN SỰ KIỆN (INITIALIZATION) =================
const initApp = async () => {
  updateCartBadge();
  renderAccountView();

  try {
    const [fetchedProducts, fetchedCategories] = await Promise.all([
      api('products'),
      api('categories')
    ]);
    products = fetchedProducts || [];
    categories = fetchedCategories || [];

    // Nạp danh mục vào bộ lọc
    const filterCate = $('shop-filter-category');
    if (filterCate) {
      filterCate.innerHTML = '<option value="">Tất cả thương hiệu</option>' +
        categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }

    renderProducts();
  } catch (err) {
    console.error('Lỗi tải dữ liệu:', err);
    showToast('Không thể kết nối máy chủ cổng 3000!', 'error');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initApp();

  // Bắt sự kiện chuyển tab trên Header
  $$('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetView = btn.dataset.view;
      if (targetView) {
        e.preventDefault();
        switchView(targetView);
      }
    });
  });

  // Logo và nút quay về cửa hàng
  $('logo-home')?.addEventListener('click', () => switchView('view-shop'));
  $('btn-back-to-shop')?.addEventListener('click', () => switchView('view-shop'));
  $('btn-view-order-history')?.addEventListener('click', () => switchView('view-orders'));
  $('btn-account-view-orders')?.addEventListener('click', () => switchView('view-orders'));
  $('btn-orders-go-login')?.addEventListener('click', () => switchView('view-account'));

  // Bộ lọc sản phẩm
  $('shop-search')?.addEventListener('input', () => { currentPage = 1; renderProducts(); });
  $('shop-filter-category')?.addEventListener('change', () => { currentPage = 1; renderProducts(); });
  $('shop-filter-price')?.addEventListener('change', () => { currentPage = 1; renderProducts(); });

  // Modal chi tiết sản phẩm
  $('btn-close-detail-modal')?.addEventListener('click', closeDetailModal);
  $('product-detail-modal')?.addEventListener('click', (e) => { if (e.target.id === 'product-detail-modal') closeDetailModal(); });

  // Form đặt hàng
  $('checkout-form')?.addEventListener('submit', handleCheckout);

  // Tab Đăng nhập / Đăng ký
  $('tab-btn-login')?.addEventListener('click', () => {
    $('tab-btn-login').classList.add('active');
    $('tab-btn-register').classList.remove('active');
    $('login-form').classList.remove('hidden');
    $('register-form').classList.add('hidden');
  });
  $('tab-btn-register')?.addEventListener('click', () => {
    $('tab-btn-register').classList.add('active');
    $('tab-btn-login').classList.remove('active');
    $('register-form').classList.remove('hidden');
    $('login-form').classList.add('hidden');
  });

  // Các form tài khoản
  $('login-form')?.addEventListener('submit', handleLogin);
  $('register-form')?.addEventListener('submit', handleRegister);
  $('change-password-form')?.addEventListener('submit', handleChangePassword);
  $('btn-logout')?.addEventListener('click', handleLogout);

  // Chỉnh sửa thông tin cá nhân
  const toggleEdit = () => $('edit-profile-card')?.classList.toggle('hidden');
  $('btn-toggle-edit-profile')?.addEventListener('click', toggleEdit);
  $('btn-cancel-edit-profile')?.addEventListener('click', toggleEdit);
  $('edit-profile-form')?.addEventListener('submit', handleUpdateProfile);
});

// Cho phép gọi trực tiếp từ HTML onclick
window.openProductDetail = openProductDetail;
window.addToCart = addToCart;
window.buyNow = buyNow;
window.updateCartQty = updateCartQty;
window.removeFromCart = removeFromCart;
window.changePage = changePage;
window.switchView = switchView;
