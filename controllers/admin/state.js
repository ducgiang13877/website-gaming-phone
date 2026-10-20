/**
 * ============================================================================
 * DỰ ÁN: SMARTSTORE - THẾ GIỚI SMARTPHONE & GAMING PHONE
 * MODULE: js/admin/state.js (CẤU HÌNH, QUẢN LÝ STATE ADMIN, BẢO MẬT & KPI DASHBOARD)
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * Sinh viên thực hiện: Lương Văn Dũng
 * ============================================================================
 */

// ============================================================================
// 1. CẤU HÌNH HẰNG SỐ & QUẢN LÝ STATE QUẢN TRỊ
// ============================================================================

var API_URL = 'http://localhost:3000';
var adminUser = JSON.parse(localStorage.getItem('smartstore_user')) || JSON.parse(sessionStorage.getItem('smartstore_admin_logged')) || null;
var dsSanPham = [];
var dsDonHang = [];
var dsKhachHang = [];
var dsDanhMuc = [];
var trangHienTaiSP = 1;
var trangSanPham = 1;
var SO_SP_TRANG_ADMIN = 6;
var SO_SP_TRANG = 6;
var mucCanXoa = null;       // Lưu đối tượng tạm thời khi bấm xóa: { loai, id, ten }
var donHangDangXem = null;  // Lưu đơn hàng đang mở trong modal chi tiết

// ============================================================================
// 2. TIỆN ÍCH DÙNG CHUNG (UTILITIES & ADMIN TOAST)
// ============================================================================

function dinhDangTien(so) {
  if (so === undefined || so === null || isNaN(so)) return '0 đ';
  return Number(so).toLocaleString('vi-VN') + ' đ';
}

function hienThongBao(noiDung, loai = 'info') {
  let hopChua = document.getElementById('toast-container');
  if (!hopChua) {
    hopChua = document.createElement('div');
    hopChua.id = 'toast-container';
    hopChua.className = 'toast-notice';
    document.body.appendChild(hopChua);
  }

  const toast = document.createElement('div');
  toast.className = `toast-notice show toast-${loai}`;

  let icon = 'fa-circle-info';
  if (loai === 'success') icon = 'fa-circle-check';
  if (loai === 'error') icon = 'fa-triangle-exclamation';
  if (loai === 'warning') icon = 'fa-circle-exclamation';

  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${noiDung}</span>
  `;

  hopChua.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function moModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('show');
}

function dongModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('show');
}

// ============================================================================
// 3. BẢO MẬT & PHÂN QUYỀN ADMIN (RBAC AUTH GUARD)
// ============================================================================

/**
 * 🎯 Mục đích: Kiểm tra quyền quản trị trước khi hiển thị Dashboard
 * 🛡️ Bảo vệ: Chặn khách hàng thông thường không được vào trang quản trị
 */
function kiemTraDangNhapAdmin() {
  const manHinhLogin = document.getElementById('admin-login-screen');
  const manHinhDash = document.getElementById('admin-dashboard-screen');

  if (!adminUser || adminUser.role !== 'admin') {
    if (manHinhLogin) manHinhLogin.style.display = 'flex';
    if (manHinhDash) manHinhDash.style.display = 'none';
  } else {
    if (manHinhLogin) manHinhLogin.style.display = 'none';
    if (manHinhDash) manHinhDash.style.display = 'block';

    const tenEl = document.getElementById('admin-display-name');
    if (tenEl) tenEl.textContent = adminUser.fullName || adminUser.name || 'Quản Trị Viên';

    taiDuLieuAdmin();
  }
}

/**
 * 🎯 Mục đích: Xử lý đăng nhập Quản trị viên an toàn
 */
async function dangNhapAdmin(email, matKhau) {
  try {
    const emailChuan = (email || '').trim().toLowerCase();
    const mkChuan = String(matKhau || '').trim();

    const res = await fetch(`${API_URL}/users`);
    const users = await res.json();

    const admin = users.find(u => 
      u.email && u.email.trim().toLowerCase() === emailChuan &&
      String(u.password).trim() === mkChuan &&
      u.role === 'admin'
    );

    if (!admin) {
      hienThongBao('Tài khoản hoặc mật khẩu Quản trị viên không đúng!', 'error');
      return;
    }

    adminUser = admin;
    localStorage.setItem('smartstore_user', JSON.stringify(adminUser));
    sessionStorage.setItem('smartstore_admin_logged', JSON.stringify(adminUser));
    hienThongBao(`Chào mừng Quản trị viên ${adminUser.fullName || adminUser.name}!`, 'success');
    kiemTraDangNhapAdmin();
  } catch (loi) {
    console.error(loi);
    hienThongBao('Lỗi kết nối máy chủ json-server!', 'error');
  }
}

function dangXuatAdmin() {
  adminUser = null;
  localStorage.removeItem('smartstore_user');
  sessionStorage.removeItem('smartstore_admin_logged');
  hienThongBao('Đã đăng xuất tài khoản quản trị', 'info');
  kiemTraDangNhapAdmin();
}

// ============================================================================
// 4. KẾT NỐI API & TÍNH TOÁN 4 CHỈ SỐ KPI THỐNG KÊ (KPIs ENGINE)
// ============================================================================

/**
 * 🎯 Mục đích: Tải toàn bộ 4 bảng dữ liệu (categories, products, users, orders) từ API bằng Promise.all
 */
async function taiDuLieuAdmin() {
  try {
    const [resHang, resSP, resUsers, resDon] = await Promise.all([
      fetch(`${API_URL}/categories`),
      fetch(`${API_URL}/products`),
      fetch(`${API_URL}/users`),
      fetch(`${API_URL}/orders`)
    ]);

    dsDanhMuc = await resHang.json();
    const dataSP = await resSP.json();
    dsSanPham = dataSP.map(sp => ({
      ...sp,
      id: String(sp.id),
      categoryId: sp.categoryId || sp.cate_id || '1',
      cate_id: sp.cate_id || sp.categoryId || '1',
      stock: (sp.stock !== undefined && sp.stock !== null) ? Number(sp.stock) : (Number(sp.quantity) || 15),
      quantity: (sp.quantity !== undefined && sp.quantity !== null) ? Number(sp.quantity) : (Number(sp.stock) || 15),
      sold: Number(sp.sold) || 0
    }));
    dsKhachHang = await resUsers.json();
    dsDonHang = await resDon.json();

    dienDropdownDanhMuc();
    tinhToanKPI();
    renderBangSanPham();
    renderBangDonHang();
    renderBangKhachHang();
  } catch (loi) {
    console.error('Lỗi tải dữ liệu admin:', loi);
    hienThongBao('Lỗi nạp dữ liệu từ máy chủ API!', 'error');
  }
}

function dienDropdownDanhMuc() {
  const optLoc = document.getElementById('admin-filter-category');
  const optForm = document.getElementById('prod-category');

  const optionsHTML = dsDanhMuc.map(dm => `<option value="${dm.id}">${dm.name}</option>`).join('');

  if (optLoc) {
    optLoc.innerHTML = '<option value="all">Tất cả thương hiệu</option>' + optionsHTML;
  }
  if (optForm) {
    optForm.innerHTML = '<option value="">-- Chọn thương hiệu --</option>' + optionsHTML;
  }
}

/**
 * 🎯 Mục đích: Tính toán 4 chỉ số KPI quan trọng nhất hiển thị trên Dashboard
 * ⚙️ Hàm có sẵn: Array.prototype.reduce, Array.prototype.filter
 */
function tinhToanKPI() {
  const doanhThu = dsDonHang
    .filter(d => d.status !== 'cancelled')
    .reduce((tong, d) => tong + (Number(d.totalAmount) || 0), 0);

  const tongDaBan = dsSanPham.reduce((tong, sp) => tong + (sp.sold || 0), 0);
  const tongTonKho = dsSanPham.reduce((tong, sp) => tong + (sp.stock || 0), 0);
  const tongDon = dsDonHang.length;

  const soMaySapHet = dsSanPham.filter(sp => (sp.stock || 0) <= 5).length;
  const alertStockEl = document.getElementById('stat-stock-alert');
  if (alertStockEl) {
    if (soMaySapHet > 0) {
      alertStockEl.className = 'stat-card-trend down';
      alertStockEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${soMaySapHet} máy sắp hết hàng`;
    } else {
      alertStockEl.className = 'stat-card-trend up';
      alertStockEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> Kho hàng dồi dào`;
    }
  }

  const statRev = document.getElementById('stat-revenue');
  const statSold = document.getElementById('stat-sold-count');
  const statStock = document.getElementById('stat-stock-count');
  const statOrder = document.getElementById('stat-order-count');

  if (statRev) statRev.textContent = dinhDangTien(doanhThu);
  if (statSold) statSold.textContent = `${tongDaBan} máy`;
  if (statStock) statStock.textContent = `${tongTonKho} máy`;
  if (statOrder) statOrder.textContent = `${tongDon} đơn`;
}

function chuyenTabAdmin(tabId) {
  if (!tabId) return;

  // 1. Cập nhật trạng thái active trên các nút điều hướng tab
  document.querySelectorAll('.main-nav button[data-admin-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-admin-tab') === tabId);
  });
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });

  // 2. Ẩn tất cả các panel tab và chỉ hiển thị panel được chọn
  document.querySelectorAll('.admin-tab-content, .admin-tab-panel').forEach(panel => {
    panel.style.display = 'none';
    panel.classList.remove('active');
  });

  const targetPanel = document.getElementById(`admin-panel-${tabId}`) || document.getElementById(`tab-${tabId}`);
  if (targetPanel) {
    targetPanel.style.display = 'block';
    targetPanel.classList.add('active');
  }

  // 3. Kích hoạt render lại dữ liệu mới nhất tương ứng với tab được chọn
  if (tabId === 'products') {
    if (typeof renderBangSanPham === 'function') renderBangSanPham();
  } else if (tabId === 'customers') {
    if (typeof renderBangKhachHang === 'function') renderBangKhachHang();
  } else if (tabId === 'orders') {
    if (typeof renderBangDonHang === 'function') renderBangDonHang();
  }
}
