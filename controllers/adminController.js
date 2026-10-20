/**
 * ============================================================================
 * ADMIN CONTROLLER (BỘ ĐIỀU PHỐI QUẢN TRỊ VIÊN TỔNG HỢP)
 * Gộp toàn bộ: State, Products CRUD, Orders, Customers, Main Dashboard
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * ============================================================================
 */

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


/**
 * ============================================================================
 * DỰ ÁN: SMARTSTORE - THẾ GIỚI SMARTPHONE & GAMING PHONE
 * MODULE: js/admin/products.js (QUẢN LÝ SẢN PHẨM & XÓA AN TOÀN 2 LỚP)
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * Sinh viên thực hiện: Lương Văn Dũng
 * ============================================================================
 */

// ============================================================================
// 1. QUẢN LÝ SẢN PHẨM (PRODUCTS CRUD ENGINE)
// ============================================================================

/**
 * 🎯 Mục đích: Render bảng danh sách sản phẩm có tìm kiếm, lọc danh mục và phân trang 6 món/trang
 */
function renderBangSanPham() {
  const tbody = document.getElementById('admin-products-tbody');
  if (!tbody) return;

  const tuKhoa = (document.getElementById('admin-search-product')?.value || '').toLowerCase().trim();
  const dmLoc = document.getElementById('admin-filter-category')?.value || 'all';

  let ketQua = [...dsSanPham];

  if (dmLoc !== 'all') {
    ketQua = ketQua.filter(sp => (sp.categoryId || sp.cate_id) == dmLoc);
  }
  if (tuKhoa !== '') {
    ketQua = ketQua.filter(sp => sp.name.toLowerCase().includes(tuKhoa));
  }

  const tongSoTrang = Math.ceil(ketQua.length / SO_SP_TRANG_ADMIN) || 1;
  if (trangHienTaiSP > tongSoTrang) trangHienTaiSP = 1;

  const batDau = (trangHienTaiSP - 1) * SO_SP_TRANG_ADMIN;
  const spTrang = ketQua.slice(batDau, batDau + SO_SP_TRANG_ADMIN);

  tbody.innerHTML = spTrang.map(sp => {
    const hang = dsDanhMuc.find(d => d.id == (sp.categoryId || sp.cate_id));
    const tenHang = hang ? hang.name : (sp.brand || '-');
    const tonKho = (sp.stock !== undefined && sp.stock !== null) ? Number(sp.stock) : (Number(sp.quantity) || 15);
    const hetHang = tonKho <= 0;

    return `
      <tr>
        <td><strong>#${sp.id}</strong></td>
        <td>
          <img src="${sp.image}" alt="${sp.name}" style="width: 50px; height: 50px; object-fit: contain; border-radius: 6px; border: 1px solid #e2e8f0;">
        </td>
        <td>
          <strong>${sp.name}</strong>
          <div style="font-size: 11px; color: #64748b;">${sp.specs?.chip || ''}</div>
        </td>
        <td><span class="badge" style="background: #e0f2fe; color: #0369a1;">${tenHang}</span></td>
        <td style="font-weight: 700; color: var(--accent);">${dinhDangTien(sp.price)}</td>
        <td>
          <span style="font-weight: 700; color: ${hetHang ? 'var(--accent)' : 'var(--success)'};">
            ${hetHang ? 'Hết hàng' : `${tonKho} máy`}
          </span>
        </td>
        <td>${sp.sold || 0}</td>
        <td style="text-align: center;">
          <button class="btn-secondary btn-sm" onclick="moSuaSanPham('${sp.id}')" title="Chỉnh sửa sản phẩm"><i class="fa-solid fa-pen-to-square"></i></button>
          <button class="btn-danger btn-sm" onclick="xacNhanXoa('product', '${sp.id}', '${sp.name.replace(/'/g, "\\'")}')" title="Xóa sản phẩm"><i class="fa-solid fa-trash-can"></i></button>
        </td>
      </tr>
    `;
  }).join('');

  // Render các nút chuyển trang
  const paginBox = document.getElementById('admin-products-pagination') || document.getElementById('admin-product-pagination');
  if (paginBox) {
    if (tongSoTrang <= 1) {
      paginBox.innerHTML = '';
    } else {
      let html = '';
      for (let i = 1; i <= tongSoTrang; i++) {
        html += `<button class="page-btn ${trangHienTaiSP === i ? 'active' : ''}" onclick="chuyenTrangSanPhamAdmin(${i})">${i}</button>`;
      }
      paginBox.innerHTML = html;
    }
  }
}

function chuyenTrangSanPhamAdmin(p) {
  trangHienTaiSP = p;
  renderBangSanPham();
}

function moThemSanPham() {
  document.getElementById('product-form').reset();
  document.getElementById('prod-id').value = '';
  const preview = document.getElementById('prod-image-preview');
  if (preview) preview.style.display = 'none';
  const modalTitle = document.getElementById('product-modal-title');
  if (modalTitle) modalTitle.textContent = 'Thêm Mới Điện Thoại Thông Minh';
  moModal('product-modal');
}

function moSuaSanPham(idSP) {
  const sp = dsSanPham.find(item => item.id == idSP);
  if (!sp) return;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined && val !== null ? val : '';
  };

  setVal('prod-id', sp.id);
  setVal('prod-name', sp.name);
  setVal('prod-category', sp.categoryId || sp.cate_id || '');
  setVal('prod-price', sp.price);
  setVal('prod-original-price', sp.originalPrice || '');
  const tonKho = (sp.stock !== undefined && sp.stock !== null) ? Number(sp.stock) : (Number(sp.quantity) || 15);
  setVal('prod-stock', tonKho);
  setVal('prod-sold', sp.sold || 0);
  setVal('prod-image-url', sp.image || '');

  // Điền mô tả
  setVal('prod-desc', sp.detail || sp.description || '');
  setVal('prod-detail', sp.detail || sp.description || '');

  // Điền 10 thông số kỹ thuật chuẩn
  const ts = sp.specs || {};
  setVal('spec-screen', ts.screen || '');
  setVal('spec-cpu', ts.cpu || ts.chip || '');
  setVal('spec-gpu', ts.gpu || '');
  setVal('spec-ram', ts.ram || '');
  setVal('spec-rom', ts.rom || '');
  setVal('spec-rear-cam', ts.rear_camera || ts.camSau || '');
  setVal('spec-front-cam', ts.front_camera || ts.camTruoc || '');
  setVal('spec-battery', ts.battery || ts.pin || '');
  setVal('spec-os', ts.os || '');
  setVal('spec-special', ts.special || '');

  // Hỗ trợ fallback IDs cũ nếu có
  setVal('prod-spec-screen', ts.screen || '');
  setVal('prod-spec-chip', ts.cpu || ts.chip || '');
  setVal('prod-spec-ram', ts.ram || '');
  setVal('prod-spec-rom', ts.rom || '');
  setVal('prod-spec-camsau', ts.rear_camera || ts.camSau || '');
  setVal('prod-spec-camtruoc', ts.front_camera || ts.camTruoc || '');
  setVal('prod-spec-pin', ts.battery || ts.pin || '');
  setVal('prod-spec-charge', ts.charge || '');
  setVal('prod-spec-os', ts.os || '');
  setVal('prod-spec-special', ts.special || '');

  const preview = document.getElementById('prod-image-preview');
  if (preview) {
    if (sp.image) {
      preview.src = sp.image;
      preview.style.display = 'block';
    } else {
      preview.style.display = 'none';
    }
  }

  const modalTitle = document.getElementById('product-modal-title');
  if (modalTitle) modalTitle.textContent = `Chỉnh Sửa Điện Thoại #${sp.id}`;
  moModal('product-modal');
}

/**
 * 🎯 Mục đích: Lưu sản phẩm (Thêm mới qua POST hoặc Cập nhật qua PUT/PATCH) kèm FileReader chuyển Base64
 * ⚙️ Hàm có sẵn: FileReader, fetch, Date.now
 */
async function luuSanPham() {
  const getVal = (id1, id2) => {
    const el = document.getElementById(id1) || (id2 ? document.getElementById(id2) : null);
    return el ? el.value.trim() : '';
  };

  const id = getVal('prod-id');
  const ten = getVal('prod-name');
  const dm = getVal('prod-category');
  const gia = Number(getVal('prod-price'));
  const giaGoc = Number(getVal('prod-original-price')) || null;
  const kho = Number(getVal('prod-stock')) || 0;
  const daBan = Number(getVal('prod-sold')) || 0;
  let anh = getVal('prod-image-url');

  const fileInput = document.getElementById('prod-image-file');
  if (fileInput && fileInput.files && fileInput.files[0]) {
    anh = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(fileInput.files[0]);
    });
  }

  if (!ten || !dm || !gia) {
    hienThongBao('Vui lòng điền đủ Tên, Thương hiệu và Giá bán!', 'error');
    return;
  }

  const moTa = getVal('prod-desc', 'prod-detail');
  const screenVal = getVal('spec-screen', 'prod-spec-screen');
  const cpuVal = getVal('spec-cpu', 'prod-spec-chip');
  const gpuVal = getVal('spec-gpu', 'prod-spec-gpu');
  const ramVal = getVal('spec-ram', 'prod-spec-ram');
  const romVal = getVal('spec-rom', 'prod-spec-rom');
  const rearCamVal = getVal('spec-rear-cam', 'prod-spec-camsau');
  const frontCamVal = getVal('spec-front-cam', 'prod-spec-camtruoc');
  const batteryVal = getVal('spec-battery', 'prod-spec-pin');
  const osVal = getVal('spec-os', 'prod-spec-os');
  const specialVal = getVal('spec-special', 'prod-spec-special');

  const payload = {
    name: ten,
    categoryId: Number(dm),
    cate_id: String(dm),
    price: gia,
    originalPrice: giaGoc,
    stock: kho,
    quantity: kho,
    sold: daBan,
    image: anh || 'https://picsum.photos/300/300',
    detail: moTa,
    description: moTa,
    specs: {
      screen: screenVal,
      cpu: cpuVal,
      chip: cpuVal,
      gpu: gpuVal,
      ram: ramVal,
      rom: romVal,
      rear_camera: rearCamVal,
      camSau: rearCamVal,
      front_camera: frontCamVal,
      camTruoc: frontCamVal,
      battery: batteryVal,
      pin: batteryVal,
      os: osVal,
      special: specialVal
    }
  };

  try {
    if (id) {
      // 1. Cập nhật sản phẩm
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const spCapNhat = await res.json();
      const viTri = dsSanPham.findIndex(item => item.id == id);
      if (viTri > -1) dsSanPham[viTri] = spCapNhat;
      hienThongBao('Cập nhật sản phẩm thành công!', 'success');
    } else {
      // 2. Thêm mới sản phẩm (+1 ID tự động)
      const cacIdSo = dsSanPham.map(sp => Number(sp.id)).filter(n => !isNaN(n) && n > 0);
      const maxId = cacIdSo.length > 0 ? Math.max(...cacIdSo) : 0;
      payload.id = maxId + 1;

      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const spMoi = await res.json();
      dsSanPham.push(spMoi);
      hienThongBao('Thêm mới điện thoại thành công!', 'success');
    }

    dongModal('product-modal');
    tinhToanKPI();
    renderBangSanPham();
  } catch (loi) {
    console.error(loi);
    hienThongBao('Lỗi khi lưu sản phẩm vào máy chủ API!', 'error');
  }
}

// ============================================================================
// 2. XÓA DỮ LIỆU AN TOÀN 2 LỚP BẢO VỆ
// ============================================================================

/**
 * 🎯 Mục đích: Mở modal xác nhận xóa an toàn và chặn xóa Quản trị viên / Đơn hàng đã giao
 */
function xacNhanXoa(loai, id, ten) {
  // Lớp phòng thủ số 1: Chặn xóa tài khoản Admin
  if (loai === 'customer') {
    const userCanXoa = dsKhachHang.find(u => u.id == id);
    if (userCanXoa && userCanXoa.role === 'admin') {
      hienThongBao('Bảo mật: Không được phép xóa bất kỳ tài khoản Quản trị viên (Admin) nào!', 'error');
      return;
    }
  }

  // Lớp phòng thủ số 1: Chặn xóa đơn hàng đã giao thành công
  if (loai === 'order') {
    const donCanXoa = dsDonHang.find(d => d.id == id);
    if (donCanXoa && donCanXoa.status === 'delivered') {
      hienThongBao('An ninh: Đơn hàng đã giao thành công và chốt sổ tài chính. Không thể xóa để bảo toàn đối soát!', 'error');
      return;
    }
  }

  mucCanXoa = { loai, id, ten };
  const msgEl = document.getElementById('confirm-modal-message');
  if (msgEl) {
    const loaiTenMap = { product: 'sản phẩm', customer: 'tài khoản khách hàng', order: 'đơn hàng' };
    const loaiTen = loaiTenMap[loai] || 'mục';
    msgEl.innerHTML = `Bạn có chắc chắn muốn xóa ${loaiTen} <strong>${ten}</strong> (#${id}) khỏi cơ sở dữ liệu không?<br><span style="color:var(--accent); font-size:12px; margin-top:6px; display:inline-block;">⚠️ Thao tác này hoàn toàn không thể hoàn tác!</span>`;
  }
  moModal('confirm-modal');
}

/**
 * 🎯 Mục đích: Thực hiện lệnh xóa dữ liệu qua HTTP DELETE (Lớp phòng thủ an ninh số 2)
 */
async function thucHienXoa() {
  if (!mucCanXoa) return;
  const { loai, id } = mucCanXoa;

  // Lớp phòng thủ số 2: Kiểm tra lại trước khi gọi DELETE
  if (loai === 'customer') {
    const userCanXoa = dsKhachHang.find(u => u.id == id);
    if (userCanXoa && userCanXoa.role === 'admin') {
      hienThongBao('Bảo mật: Nghiêm cấm xóa tài khoản Quản trị viên (Admin)!', 'error');
      dongModal('confirm-modal');
      return;
    }
  }

  if (loai === 'order') {
    const donCanXoa = dsDonHang.find(d => d.id == id);
    if (donCanXoa && donCanXoa.status === 'delivered') {
      hienThongBao('An ninh: Nghiêm cấm xóa đơn hàng đã giao thành công!', 'error');
      dongModal('confirm-modal');
      return;
    }
  }

  try {
    const endpoint = loai === 'product' ? 'products' : (loai === 'order' ? 'orders' : 'users');
    await fetch(`${API_URL}/${endpoint}/${id}`, { method: 'DELETE' });

    if (loai === 'product') {
      dsSanPham = dsSanPham.filter(p => p.id != id);
      hienThongBao('Đã xóa sản phẩm khỏi cơ sở dữ liệu', 'info');
      tinhToanKPI();
      renderBangSanPham();
    } else if (loai === 'customer') {
      dsKhachHang = dsKhachHang.filter(c => c.id != id);
      hienThongBao('Đã xóa tài khoản khách hàng thành công', 'info');
      renderBangKhachHang();
    } else if (loai === 'order') {
      dsDonHang = dsDonHang.filter(d => d.id != id);
      hienThongBao('Đã xóa đơn hàng thành công khỏi hệ thống', 'info');
      tinhToanKPI();
      renderBangDonHang();
    }

    dongModal('confirm-modal');
  } catch (loi) {
    console.error(loi);
    hienThongBao('Lỗi khi xóa dữ liệu!', 'error');
  }
}


/**
 * ============================================================================
 * DỰ ÁN: SMARTSTORE - THẾ GIỚI SMARTPHONE & GAMING PHONE
 * MODULE: js/admin/orders.js (QUẢN LÝ ĐƠN HÀNG, HOÀN TỒN KHO TỰ ĐỘNG & FSM)
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * Sinh viên thực hiện: Lương Văn Dũng
 * ============================================================================
 */

// ============================================================================
// 1. QUẢN LÝ ĐƠN HÀNG (ORDERS DISPATCH & INLINE STATUS UPDATE)
// ============================================================================

/**
 * 🎯 Mục đích: Đổi trạng thái đơn hàng trực tiếp ngay trên từng dòng của bảng (Fast Inline Action)
 * 📦 Đồng bộ tồn kho: Tự động hoàn trả tồn kho khi chuyển sang "cancelled"
 * 🛡️ FSM Guard: Cảnh báo xác nhận nếu kích hoạt lại đơn đã hủy
 */
async function doiTrangThaiDonHangTrucTiep(idDon, trangThaiMoi, selectEl) {
  const donCu = dsDonHang.find(d => d.id == idDon);
  if (!donCu) return;
  const trangThaiCu = donCu.status;

  if (trangThaiCu === trangThaiMoi) return;

  // 🛡️ BẢO VỆ TRẠNG THÁI BẤT BIẾN (IMMUTABLE TERMINAL STATE CHUẨN TMĐT):
  // Khi đơn đã "delivered", tiền COD đã thu, hóa đơn tài chính đã chốt, hàng đã xuất kho.
  // Nghiêm cấm đổi ngược trạng thái để chống thất thoát tài chính và sai lệch tồn kho.
  if (trangThaiCu === 'delivered') {
    hienThongBao('An ninh: Đơn hàng đã GIAO THÀNH CÔNG và đóng sổ tài chính. Không thể thay đổi trạng thái!', 'error');
    if (selectEl) selectEl.value = 'delivered';
    return;
  }

  const tenTrangThaiMap = {
    processing: 'Chờ xử lý',
    shipping: 'Đang giao hàng',
    delivered: 'Đã giao thành công (Chốt sổ tài chính & Bất biến)',
    cancelled: 'Đã hủy đơn (Tự động hoàn trả tồn kho)'
  };

  // 🔔 THÔNG BÁO XÁC NHẬN BẮT BUỘC TRƯỚC KHI ĐỔI TRẠNG THÁI ĐƠN HÀNG
  let xacNhanMsg = `XÁC NHẬN THAY ĐỔI TRẠNG THÁI ĐƠN HÀNG #${donCu.orderCode}:\n\n` +
    `Bạn có chắc chắn muốn chuyển từ "${tenTrangThaiMap[trangThaiCu] || trangThaiCu}" sang "${tenTrangThaiMap[trangThaiMoi] || trangThaiMoi}" không?`;

  if (trangThaiMoi === 'delivered') {
    xacNhanMsg += `\n\n⚠️ LƯU Ý BẢO VỆ CHUẨN TMĐT: Sau khi chuyển sang "Đã giao thành công", đơn hàng sẽ bị KHÓA BẤT BIẾN nhằm bảo toàn đối soát tài chính COD và số liệu tồn kho. Bạn sẽ KHÔNG THỂ thay đổi lại trạng thái sau này!`;
  } else if (trangThaiMoi === 'cancelled') {
    xacNhanMsg += `\n\n📦 ĐỒNG BỘ KHO: Hệ thống sẽ tự động hoàn trả toàn bộ số lượng sản phẩm trong đơn hàng về lại kho hàng.`;
  } else if (trangThaiCu === 'cancelled' && trangThaiMoi !== 'cancelled') {
    xacNhanMsg += `\n\n📦 ĐỒNG BỘ KHO: Đơn này đã hủy trước đó. Việc kích hoạt lại sẽ trừ lại số lượng tồn kho tương ứng.`;
  }

  if (!confirm(xacNhanMsg)) {
    if (selectEl) selectEl.value = trangThaiCu;
    return;
  }

  try {
    const res = await fetch(`${API_URL}/orders/${idDon}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: trangThaiMoi })
    });
    const donCapNhat = await res.json();

    const viTri = dsDonHang.findIndex(d => d.id == idDon);
    if (viTri > -1) dsDonHang[viTri] = donCapNhat;

    // 📦 ĐỒNG BỘ TỒN KHO THEO CHUẨN TMĐT:
    // Trường hợp 1: Chuyển sang "cancelled" -> Tự động hoàn trả tồn kho và giảm đã bán
    if (trangThaiCu !== 'cancelled' && trangThaiMoi === 'cancelled') {
      const restorePromises = (donCapNhat.items || []).map(async item => {
        const sp = dsSanPham.find(p => p.id == item.id);
        if (sp) {
          const khoMoi = (Number(sp.stock) || 0) + (Number(item.quantity) || 0);
          const daBanMoi = Math.max(0, (Number(sp.sold) || 0) - (Number(item.quantity) || 0));
          sp.stock = khoMoi;
          sp.quantity = khoMoi;
          sp.sold = daBanMoi;

          return fetch(`${API_URL}/products/${item.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stock: khoMoi, quantity: khoMoi, sold: daBanMoi })
          });
        }
      });
      await Promise.all(restorePromises);
      hienThongBao(`Đơn #${donCapNhat.orderCode} đã hủy: Tồn kho đã được hoàn trả tự động!`, 'info');
      renderBangSanPham();
    }
    // Trường hợp 2: Chuyển từ "cancelled" sang trạng thái khác -> Trừ lại kho
    else if (trangThaiCu === 'cancelled' && trangThaiMoi !== 'cancelled') {
      const deductPromises = (donCapNhat.items || []).map(async item => {
        const sp = dsSanPham.find(p => p.id == item.id);
        if (sp) {
          const khoMoi = Math.max(0, (Number(sp.stock) || 0) - (Number(item.quantity) || 0));
          const daBanMoi = (Number(sp.sold) || 0) + (Number(item.quantity) || 0);
          sp.stock = khoMoi;
          sp.quantity = khoMoi;
          sp.sold = daBanMoi;

          return fetch(`${API_URL}/products/${item.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stock: khoMoi, quantity: khoMoi, sold: daBanMoi })
          });
        }
      });
      await Promise.all(deductPromises);
      renderBangSanPham();
    }

    if (selectEl) {
      selectEl.className = `order-status-select status-${trangThaiMoi}`;
    }

    const tenNganMap = {
      processing: 'Chờ xử lý',
      shipping: 'Đang giao',
      delivered: 'Đã giao',
      cancelled: 'Đã hủy'
    };

    hienThongBao(`Đã đổi đơn #${donCapNhat.orderCode} sang "${tenNganMap[trangThaiMoi] || trangThaiMoi}"`, 'success');
    tinhToanKPI();
    renderBangDonHang();
  } catch (loi) {
    console.error(loi);
    hienThongBao('Lỗi cập nhật trạng thái đơn hàng!', 'error');
  }
}

/**
 * 🎯 Mục đích: Render bảng đơn hàng kèm bộ lọc trạng thái và tìm kiếm mã đơn/SĐT
 */
function renderBangDonHang() {
  const tbody = document.getElementById('admin-orders-tbody');
  if (!tbody) return;

  const tuKhoa = (document.getElementById('admin-search-order')?.value || '').toLowerCase().trim();
  const trangThaiLoc = document.getElementById('admin-filter-order-status')?.value || 'all';

  let ketQua = [...dsDonHang];
  if (trangThaiLoc !== 'all') {
    ketQua = ketQua.filter(d => d.status === trangThaiLoc);
  }
  if (tuKhoa !== '') {
    ketQua = ketQua.filter(d => 
      (d.orderCode || '').toLowerCase().includes(tuKhoa) ||
      (d.customerPhone || '').includes(tuKhoa) ||
      (d.customerName || '').toLowerCase().includes(tuKhoa)
    );
  }

  // Sắp xếp đơn mới nhất lên đầu
  ketQua.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  tbody.innerHTML = ketQua.map(d => {
    return `
      <tr>
        <td><strong>${d.orderCode}</strong></td>
        <td>${d.customerName}</td>
        <td>${d.customerPhone}</td>
        <td>${new Date(d.createdAt).toLocaleDateString('vi-VN')}</td>
        <td style="font-weight:800; color:var(--accent);">${dinhDangTien(d.totalAmount)}</td>
        <td>${d.paymentMethod}</td>
        <td>
          ${d.status === 'delivered' ? `
            <span class="badge status-delivered" style="display:inline-flex; align-items:center; gap:6px; padding:6px 12px; font-weight:700; border-radius:20px; background:#dcfce7; color:#15803d; border:1px solid #86efac;" title="Đơn hàng đã giao thành công và đóng sổ (Bất biến theo chuẩn TMĐT)">
              <i class="fa-solid fa-circle-check"></i> Đã giao
            </span>
          ` : `
            <select class="order-status-select status-${d.status}" onchange="doiTrangThaiDonHangTrucTiep('${d.id}', this.value, this)" title="Bấm để đổi trực tiếp trạng thái đơn">
              <option value="processing" ${d.status === 'processing' ? 'selected' : ''}>Chờ xử lý</option>
              <option value="shipping" ${d.status === 'shipping' ? 'selected' : ''}>Đang giao</option>
              <option value="delivered">Đã giao</option>
              <option value="cancelled" ${d.status === 'cancelled' ? 'selected' : ''}>Đã hủy</option>
            </select>
          `}
        </td>
        <td style="text-align:center;">
          <div style="display: flex; gap: 6px; justify-content: center; align-items: center;">
            <button class="btn-primary btn-sm" onclick="moXemDonHang('${d.orderCode}')" title="Xem chi tiết đơn"><i class="fa-solid fa-eye"></i> Xem</button>
            ${d.status !== 'delivered' ? `
              <button class="btn-danger btn-sm" onclick="xacNhanXoa('order', '${d.id}', '${d.orderCode}')" title="Xóa đơn hàng"><i class="fa-solid fa-trash-can"></i></button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * 🎯 Mục đích: Mở modal xem chi tiết từng món hàng trong đơn và cập nhật trạng thái đơn
 */
function moXemDonHang(maDon) {
  const d = dsDonHang.find(item => item.orderCode === maDon);
  if (!d) return;

  donHangDangXem = d;
  document.getElementById('order-modal-title').textContent = `Chi Tiết Đơn Hàng ${d.orderCode}`;

  const body = document.getElementById('order-modal-body');
  if (body) {
    body.innerHTML = `
      <div style="background:#f8fafc; padding:12px; border-radius:8px; margin-bottom:14px; font-size:13px; line-height:1.7;">
        <div><strong>Khách hàng:</strong> ${d.customerName} - <strong>SĐT:</strong> ${d.customerPhone}</div>
        <div><strong>Địa chỉ:</strong> ${d.customerAddress}</div>
        <div><strong>Thanh toán:</strong> ${d.paymentMethod}</div>
        <div><strong>Tổng giá trị đơn:</strong> <strong style="color:var(--accent); font-size:15px;">${dinhDangTien(d.totalAmount)}</strong></div>
      </div>
      <table class="cart-table">
        <thead>
          <tr>
            <th>Món hàng</th>
            <th>Đơn giá</th>
            <th>Số lượng</th>
            <th>Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${(d.items || []).map(i => `
            <tr>
              <td>${i.name}</td>
              <td>${dinhDangTien(i.price)}</td>
              <td>${i.quantity}</td>
              <td><strong>${dinhDangTien(i.price * i.quantity)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  const selectStatus = document.getElementById('order-status-update-select');
  const btnSaveStatus = document.getElementById('btn-save-order-status');

  // Gỡ bỏ thông báo khóa bất biến cũ nếu có
  const oldNote = document.getElementById('order-delivered-immutable-note');
  if (oldNote) oldNote.remove();

  if (d.status === 'delivered') {
    if (selectStatus) {
      selectStatus.value = 'delivered';
      selectStatus.disabled = true;
      selectStatus.style.opacity = '0.65';
      selectStatus.style.cursor = 'not-allowed';
    }
    if (btnSaveStatus) {
      btnSaveStatus.disabled = true;
      btnSaveStatus.style.opacity = '0.5';
      btnSaveStatus.style.cursor = 'not-allowed';
      btnSaveStatus.title = 'Đơn hàng đã giao thành công và đóng sổ tài chính. Không thể sửa!';
    }
    if (body) {
      body.insertAdjacentHTML('beforeend', `
        <div id="order-delivered-immutable-note" style="margin-top:14px; padding:12px 14px; background:#f0fdf4; border:1px solid #bbf7d0; color:#166534; border-radius:8px; font-size:12px; font-weight:600; display:flex; align-items:center; gap:8px;">
          <i class="fa-solid fa-shield-halved" style="font-size:16px; color:#15803d;"></i>
          <span><strong>BẢO VỆ CHUẨN TMĐT:</strong> Đơn hàng đã giao nhận thành công và đóng sổ giao dịch. Trạng thái đã được <u>khóa bất biến</u> nhằm bảo toàn đối soát COD và tính toàn vẹn tồn kho!</span>
        </div>
      `);
    }
  } else {
    if (selectStatus) {
      selectStatus.value = d.status;
      selectStatus.disabled = false;
      selectStatus.style.opacity = '1';
      selectStatus.style.cursor = 'pointer';
    }
    if (btnSaveStatus) {
      btnSaveStatus.disabled = false;
      btnSaveStatus.style.opacity = '1';
      btnSaveStatus.style.cursor = 'pointer';
      btnSaveStatus.title = 'Lưu trạng thái mới';
    }
  }

  moModal('order-detail-modal');
}

/**
 * 🎯 Mục đích: Cập nhật trạng thái đơn hàng trong Modal và đồng bộ tồn kho
 */
async function capNhatTrangThaiDon() {
  if (!donHangDangXem) return;
  const selectStatus = document.getElementById('order-status-update-select');
  const trangThaiMoi = selectStatus.value;
  const trangThaiCu = donHangDangXem.status;

  if (trangThaiCu === trangThaiMoi) {
    dongModal('order-detail-modal');
    return;
  }

  // 🛡️ BẢO VỆ TRẠNG THÁI BẤT BIẾN (IMMUTABLE TERMINAL STATE CHUẨN TMĐT):
  if (trangThaiCu === 'delivered') {
    hienThongBao('An ninh: Đơn hàng đã GIAO THÀNH CÔNG và đóng sổ tài chính. Không thể thay đổi trạng thái!', 'error');
    dongModal('order-detail-modal');
    return;
  }

  const tenTrangThaiMap = {
    processing: 'Chờ xử lý',
    shipping: 'Đang giao hàng',
    delivered: 'Đã giao thành công (Chốt sổ tài chính & Bất biến)',
    cancelled: 'Đã hủy đơn (Tự động hoàn trả tồn kho)'
  };

  // 🔔 THÔNG BÁO XÁC NHẬN BẮT BUỘC TRƯỚC KHI ĐỔI TRẠNG THÁI ĐƠN HÀNG
  let xacNhanMsg = `XÁC NHẬN THAY ĐỔI TRẠNG THÁI ĐƠN HÀNG #${donHangDangXem.orderCode}:\n\n` +
    `Bạn có chắc chắn muốn cập nhật trạng thái từ "${tenTrangThaiMap[trangThaiCu] || trangThaiCu}" sang "${tenTrangThaiMap[trangThaiMoi] || trangThaiMoi}" không?`;

  if (trangThaiMoi === 'delivered') {
    xacNhanMsg += `\n\n⚠️ LƯU Ý BẢO VỆ CHUẨN TMĐT: Sau khi chuyển sang "Đã giao thành công", đơn hàng sẽ bị KHÓA BẤT BIẾN nhằm bảo toàn đối soát tài chính COD và số liệu tồn kho. Bạn sẽ KHÔNG THỂ thay đổi lại trạng thái sau này!`;
  } else if (trangThaiMoi === 'cancelled') {
    xacNhanMsg += `\n\n📦 ĐỒNG BỘ KHO: Hệ thống sẽ tự động hoàn trả toàn bộ số lượng sản phẩm trong đơn hàng về lại kho hàng.`;
  } else if (trangThaiCu === 'cancelled' && trangThaiMoi !== 'cancelled') {
    xacNhanMsg += `\n\n📦 ĐỒNG BỘ KHO: Đơn này đã hủy trước đó. Việc kích hoạt lại sẽ trừ lại số lượng tồn kho tương ứng.`;
  }

  if (!confirm(xacNhanMsg)) {
    selectStatus.value = trangThaiCu;
    return;
  }

  try {
    const res = await fetch(`${API_URL}/orders/${donHangDangXem.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: trangThaiMoi })
    });
    const donCapNhat = await res.json();

    const viTri = dsDonHang.findIndex(d => d.id == donCapNhat.id);
    if (viTri > -1) dsDonHang[viTri] = donCapNhat;

    // 📦 ĐỒNG BỘ TỒN KHO THEO CHUẨN TMĐT:
    // Trường hợp 1: Chuyển sang "cancelled" -> Tự động hoàn trả tồn kho và giảm đã bán
    if (trangThaiCu !== 'cancelled' && trangThaiMoi === 'cancelled') {
      const restorePromises = (donCapNhat.items || []).map(async item => {
        const sp = dsSanPham.find(p => p.id == item.id);
        if (sp) {
          const khoMoi = (Number(sp.stock) || 0) + (Number(item.quantity) || 0);
          const daBanMoi = Math.max(0, (Number(sp.sold) || 0) - (Number(item.quantity) || 0));
          sp.stock = khoMoi;
          sp.quantity = khoMoi;
          sp.sold = daBanMoi;

          return fetch(`${API_URL}/products/${item.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stock: khoMoi, quantity: khoMoi, sold: daBanMoi })
          });
        }
      });
      await Promise.all(restorePromises);
      hienThongBao(`Đơn #${donCapNhat.orderCode} đã hủy: Tồn kho đã được hoàn trả tự động!`, 'info');
      renderBangSanPham();
    }
    // Trường hợp 2: Chuyển từ "cancelled" sang trạng thái khác -> Trừ lại kho
    else if (trangThaiCu === 'cancelled' && trangThaiMoi !== 'cancelled') {
      const deductPromises = (donCapNhat.items || []).map(async item => {
        const sp = dsSanPham.find(p => p.id == item.id);
        if (sp) {
          const khoMoi = Math.max(0, (Number(sp.stock) || 0) - (Number(item.quantity) || 0));
          const daBanMoi = (Number(sp.sold) || 0) + (Number(item.quantity) || 0);
          sp.stock = khoMoi;
          sp.quantity = khoMoi;
          sp.sold = daBanMoi;

          return fetch(`${API_URL}/products/${item.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stock: khoMoi, quantity: khoMoi, sold: daBanMoi })
          });
        }
      });
      await Promise.all(deductPromises);
      renderBangSanPham();
    }

    hienThongBao(`Đã đổi trạng thái đơn ${donCapNhat.orderCode}`, 'success');
    dongModal('order-detail-modal');
    tinhToanKPI();
    renderBangDonHang();
  } catch (loi) {
    console.error(loi);
    hienThongBao('Lỗi cập nhật trạng thái đơn!', 'error');
  }
}

/**
 * 🎯 Mục đích: In hóa đơn bán hàng cho đơn hàng đang được xem trong Modal Quản trị (Admin)
 * 🔄 Luồng bảo vệ đồ án ASM (6 BƯỚC CHUẨN MỰC TỪ FRONTEND ĐẾN BACKEND):
 *   1. Trigger UI: Quản trị viên bấm nút "In Hóa Đơn" trong Modal Chi Tiết Đơn Hàng.
 *   2. Bắt sự kiện: window.adminCtrl.printInvoice() gọi hàm inHoaDonAdmin().
 *   3. Kiểm tra dữ liệu: Lấy đơn hàng hiện tại trong biến state `donHangDangXem`.
 *   4. Render Template Hóa Đơn Chuẩn Bán Lẻ A4/A5: Tạo popup window chứa cấu trúc Hóa đơn kèm CSS chuyên dụng cho máy in nhiệt / máy in A4/A5.
 *   5. Nạp nội dung & kích hoạt lệnh in: Ghi mã HTML vào popup và gọi window.print().
 *   6. Phản hồi: Thông báo Toast cho Quản trị viên.
 */
function inHoaDonAdmin() {
  if (!donHangDangXem) {
    hienThongBao('Vui lòng mở một đơn hàng để in hóa đơn!', 'warning');
    return;
  }

  const d = donHangDangXem;
  const ngayDat = new Date(d.createdAt || Date.now()).toLocaleString('vi-VN');
  const giamGia = Number(d.discountAmount) || 0;
  const tamTinh = d.subtotal || ((d.items || []).reduce((s, i) => s + (i.price * i.quantity), 0)) || d.totalAmount;
  const tongTien = d.totalAmount || tamTinh;

  const popup = window.open('', '_blank', 'width=850,height=900,menubar=no,toolbar=no,location=no,status=no');
  if (!popup) {
    hienThongBao('Trình duyệt đã chặn cửa sổ bật lên (Popup)! Vui lòng cho phép popup để in hóa đơn.', 'error');
    return;
  }

  const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Hóa Đơn Bán Hàng - SmartStore ${d.orderCode}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      padding: 30px;
      color: #1e293b;
      background: #ffffff;
      font-size: 13px;
      line-height: 1.5;
    }
    .invoice-container {
      max-width: 780px;
      margin: 0 auto;
      border: 1px solid #e2e8f0;
      padding: 30px;
      border-radius: 8px;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .brand-sub {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
    }
    .invoice-title {
      text-align: center;
      margin: 20px 0;
    }
    .invoice-title h1 {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.5px;
    }
    .invoice-title p {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      background: #f8fafc;
      padding: 14px 18px;
      border-radius: 6px;
      margin-bottom: 20px;
      border: 1px solid #e2e8f0;
    }
    .info-line { margin-bottom: 4px; }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .items-table th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      padding: 10px;
      text-align: left;
      border-bottom: 2px solid #cbd5e1;
      font-size: 12px;
    }
    .items-table td {
      padding: 10px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 13px;
    }
    .summary-box {
      float: right;
      width: 340px;
      margin-bottom: 25px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
    }
    .summary-row.total {
      border-top: 2px solid #2563eb;
      padding-top: 10px;
      font-size: 16px;
      font-weight: 800;
      color: #ef4444;
    }
    .clear { clear: both; }
    .policy-box {
      background: #eff6ff;
      border: 1px dashed #3b82f6;
      border-radius: 6px;
      padding: 12px;
      font-size: 11.5px;
      color: #1e40af;
      margin-bottom: 30px;
      line-height: 1.6;
    }
    .signatures {
      display: flex;
      justify-content: space-between;
      text-align: center;
      margin-top: 20px;
      padding: 0 40px;
    }
    .sig-block {
      width: 220px;
    }
    .sig-title {
      font-weight: 700;
      font-size: 13px;
      margin-bottom: 4px;
    }
    .sig-sub {
      font-size: 11px;
      color: #64748b;
      margin-bottom: 60px;
    }
    .sig-name {
      font-weight: 600;
      font-size: 12px;
      border-top: 1px dotted #94a3b8;
      padding-top: 6px;
    }
    @media print {
      body { padding: 0; }
      .invoice-container { border: none; padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align: center; margin-bottom: 16px; display: flex; justify-content: center; gap: 10px;">
    <button onclick="window.print()" style="padding: 10px 24px; background: #2563eb; color: #fff; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 14px;">
      🖨️ IN HÓA ĐƠN NGAY
    </button>
    <button onclick="window.close()" style="padding: 10px 20px; background: #e2e8f0; color: #334155; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 14px;">
      Đóng Cửa Sổ
    </button>
  </div>

  <div class="invoice-container">
    <table class="header-table">
      <tr>
        <td style="vertical-align: top;">
          <div class="brand-title">⚡ SMARTSTORE</div>
          <div class="brand-sub">Hệ Thống Bán Lẻ Smartphone & Gaming Phone Chính Hãng Hàng Đầu</div>
          <div class="brand-sub">📍 Địa chỉ: Trịnh Văn Bô, Nam Từ Liêm, Hà Nội (FPT Polytechnic)</div>
          <div class="brand-sub">📞 Hotline: 1800.2026 (Miễn phí) - Website: smartstore.vn</div>
        </td>
        <td style="vertical-align: top; text-align: right;">
          <div style="font-size: 14px; font-weight: 700; color: #2563eb;">MÃ ĐƠN HÀNG:</div>
          <div style="font-size: 18px; font-weight: 800; color: #0f172a;">${d.orderCode}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Ngày lập: ${ngayDat}</div>
          <div style="font-size: 12px; color: #10b981; font-weight: 700; margin-top: 4px;">✓ Đã xác thực bảo hành</div>
        </td>
      </tr>
    </table>

    <div class="invoice-title">
      <h1>HÓA ĐƠN BÁN HÀNG KIÊM PHIẾU BẢO HÀNH ĐIỆN TỬ</h1>
      <p>(Bản in lưu trữ đối soát khách hàng & bảo hành chính hãng SmartStore)</p>
    </div>

    <div class="info-grid">
      <div>
        <div class="info-line"><strong>Khách hàng:</strong> ${d.customerName}</div>
        <div class="info-line"><strong>Điện thoại:</strong> ${d.customerPhone}</div>
        <div class="info-line"><strong>Email:</strong> ${d.customerEmail || 'Chưa cung cấp'}</div>
      </div>
      <div>
        <div class="info-line"><strong>Địa chỉ nhận:</strong> ${d.customerAddress}</div>
        <div class="info-line"><strong>Phương thức TT:</strong> ${d.paymentMethod === 'COD' ? 'Tiền mặt khi nhận hàng (COD)' : (d.paymentMethod === 'BANK' ? 'Chuyển khoản VietQR' : 'VNPAY / Thẻ tín dụng')}</div>
        <div class="info-line"><strong>Ghi chú đơn:</strong> ${d.note || 'Giao hàng tiêu chuẩn'}</div>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 40px; text-align: center;">STT</th>
          <th>Tên Sản Phẩm / Thiết Bị</th>
          <th style="width: 110px; text-align: right;">Đơn Giá</th>
          <th style="width: 70px; text-align: center;">SL</th>
          <th style="width: 130px; text-align: right;">Thành Tiền</th>
        </tr>
      </thead>
      <tbody>
        ${(d.items || []).map((item, idx) => `
          <tr>
            <td style="text-align: center; color: #64748b;">${idx + 1}</td>
            <td>
              <strong style="color: #0f172a;">${item.name}</strong>
              <div style="font-size: 11px; color: #64748b;">Bảo hành chính hãng 12 tháng tại SmartStore</div>
            </td>
            <td style="text-align: right;">${Number(item.price).toLocaleString('vi-VN')} đ</td>
            <td style="text-align: center; font-weight: 700;">${item.quantity}</td>
            <td style="text-align: right; font-weight: 700;">${(item.price * item.quantity).toLocaleString('vi-VN')} đ</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="summary-box">
      <div class="summary-row">
        <span>Tạm tính tổng sản phẩm:</span>
        <strong>${Number(tamTinh).toLocaleString('vi-VN')} đ</strong>
      </div>
      ${d.voucherCode ? `
        <div class="summary-row" style="color: #ef4444;">
          <span>Giảm giá Voucher [${d.voucherCode}]:</span>
          <strong>-${Number(giamGia).toLocaleString('vi-VN')} đ</strong>
        </div>
      ` : ''}
      <div class="summary-row">
        <span>Phí vận chuyển giao tận nhà:</span>
        <strong style="color: #10b981;">0 đ (Miễn Phí)</strong>
      </div>
      <div class="summary-row total">
        <span>TỔNG THANH TOÁN:</span>
        <span>${Number(tongTien).toLocaleString('vi-VN')} đ</span>
      </div>
    </div>
    <div class="clear"></div>

    <div class="policy-box">
      <strong>CHÍNH SÁCH BẢO HÀNH & ĐỔI TRẢ SMARTSTORE VIỆT NAM:</strong><br>
      • Đổi mới 100% trong 30 ngày đầu tiên nếu máy phát sinh lỗi phần cứng từ nhà sản xuất.<br>
      • Bảo hành chính hãng 12 tháng toàn diện bao gồm cả Nguồn & Màn hình cảm ứng.<br>
      • Quý khách vui lòng giữ lại hóa đơn này hoặc tra cứu mã đơn <strong>${d.orderCode}</strong> trên website để được tiếp nhận bảo hành nhanh chóng.
    </div>

    <div class="signatures">
      <div class="sig-block">
        <div class="sig-title">KHÁCH HÀNG NHẬN HÀNG</div>
        <div class="sig-sub">(Ký & ghi rõ họ tên)</div>
        <div class="sig-name">${d.customerName}</div>
      </div>
      <div class="sig-block">
        <div class="sig-title">ĐẠI DIỆN SMARTSTORE</div>
        <div class="sig-sub">(Ký duyệt, đóng dấu & xuất kho)</div>
        <div class="sig-name">Bộ Phận Kho Vận & Tài Chính</div>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 300);
    };
  <\/script>
</body>
</html>
  `;

  popup.document.open();
  popup.document.write(html);
  popup.document.close();
}


/**
 * ============================================================================
 * DỰ ÁN: SMARTSTORE - THẾ GIỚI SMARTPHONE & GAMING PHONE
 * MODULE: js/admin/customers.js (QUẢN LÝ KHÁCH HÀNG & BẢO VỆ ĐẶC QUYỀN ADMIN)
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * Sinh viên thực hiện: Lương Văn Dũng
 * ============================================================================
 */

// ============================================================================
// 1. QUẢN LÝ KHÁCH HÀNG (CUSTOMERS CRUD & SECURITY LOCK)
// ============================================================================

/**
 * 🎯 Mục đích: Render bảng danh sách khách hàng và quản trị viên
 */
function renderBangKhachHang() {
  const tbody = document.getElementById('admin-customers-tbody');
  if (!tbody) return;

  const tuKhoa = (document.getElementById('admin-search-customer')?.value || '').toLowerCase().trim();

  let ketQua = [...dsKhachHang];
  if (tuKhoa !== '') {
    ketQua = ketQua.filter(c => 
      (c.fullName || c.name || '').toLowerCase().includes(tuKhoa) ||
      (c.email || '').toLowerCase().includes(tuKhoa) ||
      (c.phone || '').includes(tuKhoa)
    );
  }

  tbody.innerHTML = ketQua.map(c => {
    const laAdmin = c.role === 'admin';
    return `
      <tr>
        <td><strong>#${c.id}</strong></td>
        <td>
          <strong>${c.fullName || c.name || 'Chưa đặt tên'}</strong>
          ${laAdmin ? '<span class="badge" style="background:#fef3c7; color:#b45309; margin-left:6px;"><i class="fa-solid fa-shield-halved"></i> Admin</span>' : ''}
        </td>
        <td>${c.email}</td>
        <td>${c.phone || '-'}</td>
        <td>${c.address || '-'}</td>
        <td>
          <span class="badge" style="${laAdmin ? 'background:#fee2e2; color:#b91c1c;' : 'background:#dcfce7; color:#15803d;'}">
            ${laAdmin ? 'Quản Trị Viên' : 'Khách Hàng'}
          </span>
        </td>
        <td style="text-align: center;">
          <button class="btn-secondary btn-sm" onclick="moSuaKhachHang('${c.id}')" title="Chỉnh sửa thông tin"><i class="fa-solid fa-user-pen"></i></button>
          <button class="btn-danger btn-sm" onclick="xacNhanXoa('customer', '${c.id}', '${(c.fullName || c.name).replace(/'/g, "\\'")}')" 
            title="${laAdmin ? 'Không được phép xóa tài khoản Quản trị viên' : 'Xóa khách hàng'}" 
            ${laAdmin ? 'disabled style="opacity: 0.35; cursor: not-allowed;"' : ''}>
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function moThemKhachHang() {
  document.getElementById('customer-form').reset();
  document.getElementById('cust-id').value = '';
  document.getElementById('customer-modal-title').textContent = 'Thêm Khách Hàng Mới (+1 ID Tự Động)';

  const roleSelect = document.getElementById('cust-role');
  if (roleSelect) {
    roleSelect.disabled = false;
    roleSelect.value = 'user';
  }
  const hint = document.getElementById('cust-role-hint');
  if (hint) hint.style.display = 'none';

  moModal('customer-modal');
}

/**
 * 🎯 Mục đích: Mở modal sửa thông tin tài khoản kèm nguyên tắc bảo vệ quyền Quản trị viên
 */
function moSuaKhachHang(idUser) {
  const c = dsKhachHang.find(item => item.id == idUser);
  if (!c) return;

  document.getElementById('cust-id').value = c.id;
  document.getElementById('cust-name').value = c.fullName || c.name || '';
  document.getElementById('cust-email').value = c.email || '';
  document.getElementById('cust-phone').value = c.phone || '';
  document.getElementById('cust-address').value = c.address || '';
  document.getElementById('cust-password').value = '';
  document.getElementById('customer-modal-title').textContent = `Chỉnh Sửa Tài Khoản #${c.id}`;

  const roleSelect = document.getElementById('cust-role');
  const hint = document.getElementById('cust-role-hint');

  // NGUYÊN TẮC BẢO MẬT: Khóa trường chọn vai trò nếu tài khoản đang sửa là Admin
  if (c.role === 'admin') {
    if (roleSelect) {
      roleSelect.value = 'admin';
      roleSelect.disabled = true;
    }
    if (hint) hint.style.display = 'block';
  } else {
    if (roleSelect) {
      roleSelect.value = c.role || 'user';
      roleSelect.disabled = false;
    }
    if (hint) hint.style.display = 'none';
  }

  moModal('customer-modal');
}

/**
 * 🎯 Mục đích: Lưu khách hàng (Thêm mới ID tăng dần hoặc Cập nhật)
 */
async function luuKhachHang() {
  const id = document.getElementById('cust-id').value;
  const ten = document.getElementById('cust-name').value.trim();
  const email = document.getElementById('cust-email').value.trim();
  const sdt = document.getElementById('cust-phone').value.trim();
  const diaChi = document.getElementById('cust-address').value.trim();
  const vaiTroChon = document.getElementById('cust-role').value;
  const passMoi = document.getElementById('cust-password').value.trim();

  if (!ten || !email || !sdt) {
    hienThongBao('Vui lòng điền đủ Họ tên, Email và SĐT!', 'error');
    return;
  }

  try {
    if (id) {
      // 1. Cập nhật khách hàng
      const userCu = dsKhachHang.find(c => c.id == id);
      let vaiTroThucTe = vaiTroChon;

      // Bảo vệ vai trò Admin không bị thay đổi
      if (userCu && userCu.role === 'admin') {
        vaiTroThucTe = 'admin';
        if (vaiTroChon !== 'admin') {
          hienThongBao('Bảo mật: Không được phép thay đổi vai trò của tài khoản Quản trị viên!', 'warning');
        }
      }

      const payload = {
        fullName: ten,
        email: email,
        phone: sdt,
        address: diaChi,
        role: vaiTroThucTe
      };
      if (passMoi) payload.password = passMoi;

      const res = await fetch(`${API_URL}/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const userCapNhat = await res.json();
      const viTri = dsKhachHang.findIndex(c => c.id == id);
      if (viTri > -1) dsKhachHang[viTri] = userCapNhat;
      hienThongBao('Cập nhật tài khoản thành công!', 'success');
    } else {
      // 2. Thêm mới tài khoản (+1 ID tự động)
      const cacIdSo = dsKhachHang.map(c => Number(c.id)).filter(n => !isNaN(n) && n > 0);
      const maxId = cacIdSo.length > 0 ? Math.max(...cacIdSo) : 0;
      const idMoi = String(maxId + 1);

      const payload = {
        id: idMoi,
        fullName: ten,
        email: email,
        phone: sdt,
        address: diaChi,
        role: vaiTroChon || 'user',
        password: passMoi || '123456',
        createdAt: new Date().toISOString()
      };

      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const userMoi = await res.json();
      dsKhachHang.push(userMoi);
      hienThongBao(`Thêm khách hàng thành công (Mã #${userMoi.id})!`, 'success');
    }

    dongModal('customer-modal');
    tinhToanKPI();
    renderBangKhachHang();
  } catch (loi) {
    console.error(loi);
    hienThongBao('Lỗi khi lưu thông tin khách hàng!', 'error');
  }
}


/**
 * ============================================================================
 * DỰ ÁN: SMARTSTORE - THẾ GIỚI SMARTPHONE & GAMING PHONE
 * MODULE: js/admin/main.js (GẮN SỰ KIỆN GIAO DIỆN & EXPORT CONTROLLER PHÍA ADMIN)
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * Sinh viên thực hiện: Lương Văn Dũng
 * ============================================================================
 */

// ============================================================================
// 1. EXPORT CONTROLLER RA WINDOW.ADMINCTRL ĐỂ HTML ONCLICK GỌI AN TOÀN
// ============================================================================

window.adminCtrl = {
  closeModal: dongModal,
  switchTab: chuyenTabAdmin,
  chuyenTab: chuyenTabAdmin,
  setProductPage: chuyenTrangSanPhamAdmin,
  openAddProduct: moThemSanPham,
  openEditProduct: moSuaSanPham,
  saveProduct: luuSanPham,
  openAddCustomer: moThemKhachHang,
  openEditCustomer: moSuaKhachHang,
  saveCustomer: luuKhachHang,
  askDelete: xacNhanXoa,
  executeDelete: thucHienXoa,
  openOrderDetail: moXemDonHang,
  updateOrderStatus: capNhatTrangThaiDon,
  inlineUpdateOrderStatus: doiTrangThaiDonHangTrucTiep,
  printInvoice: inHoaDonAdmin
};

// ============================================================================
// 2. KHỞI CHẠY KHI DOM SẴN SÀNG (DOM CONTENT LOADED)
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Kiểm tra trạng thái đăng nhập Admin
  kiemTraDangNhapAdmin();

  // 2. Form Đăng nhập Admin
  document.getElementById('admin-login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-login-email').value.trim();
    const pass = document.getElementById('admin-login-password').value.trim();
    dangNhapAdmin(email, pass);
  });

  // 3. Nút Đăng xuất Admin
  document.getElementById('btn-admin-logout')?.addEventListener('click', dangXuatAdmin);
  document.getElementById('admin-logout-btn')?.addEventListener('click', dangXuatAdmin);

  // 4. Chuyển đổi Tab điều hướng Dashboard (Products, Orders, Customers)
  document.querySelectorAll('.main-nav button[data-admin-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-admin-tab');
      chuyenTabAdmin(tabId);
    });
  });
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      chuyenTabAdmin(tabId);
    });
  });

  // 5. Tìm kiếm & Lọc Sản phẩm
  document.getElementById('admin-search-product')?.addEventListener('input', () => {
    trangHienTaiSP = 1;
    trangSanPham = 1;
    renderBangSanPham();
  });
  document.getElementById('admin-filter-category')?.addEventListener('change', () => {
    trangHienTaiSP = 1;
    trangSanPham = 1;
    renderBangSanPham();
  });
  document.getElementById('btn-open-add-product')?.addEventListener('click', moThemSanPham);

  // 6. Xử lý tải ảnh sản phẩm Base64 qua FileReader
  document.getElementById('prod-image-file')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        document.getElementById('prod-image-url').value = evt.target.result;
        const preview = document.getElementById('prod-image-preview');
        if (preview) {
          preview.src = evt.target.result;
          preview.style.display = 'block';
        }
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('prod-image-url')?.addEventListener('input', (e) => {
    const preview = document.getElementById('prod-image-preview');
    if (preview) {
      preview.src = e.target.value || 'https://picsum.photos/300/300';
      preview.style.display = 'block';
    }
  });

  // 7. Form Lưu Sản phẩm
  document.getElementById('product-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    luuSanPham();
  });

  // 8. Quản lý Khách hàng
  document.getElementById('admin-search-customer')?.addEventListener('input', renderBangKhachHang);
  document.getElementById('btn-open-add-customer')?.addEventListener('click', moThemKhachHang);
  document.getElementById('customer-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    luuKhachHang();
  });

  // 9. Quản lý Đơn hàng
  document.getElementById('admin-search-order')?.addEventListener('input', renderBangDonHang);
  document.getElementById('admin-filter-order-status')?.addEventListener('change', renderBangDonHang);
  document.getElementById('btn-save-order-status')?.addEventListener('click', capNhatTrangThaiDon);

  // 10. Xác nhận Xóa dữ liệu an toàn
  document.getElementById('btn-confirm-delete-action')?.addEventListener('click', thucHienXoa);
  document.getElementById('btn-confirm-delete')?.addEventListener('click', thucHienXoa);
});


