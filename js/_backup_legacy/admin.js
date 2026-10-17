/**
 * ============================================================================
 * DỰ ÁN: WEBSITE BÁN ĐIỆN THOẠI THÔNG MINH & GAMING PHONE (SMARTSTORE)
 * TỆP: js/admin.js (LOGIC TRANG QUẢN TRỊ ADMIN DASHBOARD - CHUẨN ES6+ DỄ BẢO VỆ)
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * Sinh viên thực hiện: Lương Văn Dũng
 * 
 * 📑 MỤC LỤC KIẾN TRÚC & LUỒNG NGHIỆP VỤ QUẢN TRỊ (DEFENSE ROADMAP):
 * ----------------------------------------------------------------------------
 * PHẦN 1: CẤU HÌNH HẰNG SỐ & QUẢN LÝ STATE QUẢN TRỊ (CONFIG & STATE)
 * PHẦN 2: CÁC TIỆN ÍCH DÙNG CHUNG (UTILITIES & MODALS)
 * PHẦN 3: BẢO MẬT & PHÂN QUYỀN ĐĂNG NHẬP ADMIN (RBAC & AUTH GUARD)
 * PHẦN 4: KẾT NỐI API & BỘ TÍNH TOÁN 4 CHỈ SỐ KPI (ANALYTICS & KPI METRICS)
 * PHẦN 5: QUẢN LÝ SẢN PHẨM (PRODUCT CRUD & FILEREADER BASE64)
 * PHẦN 6: QUẢN LÝ KHÁCH HÀNG (CUSTOMER CRUD & AUTO +1 ID & ADMIN SHIELD)
 * PHẦN 7: XÓA DỮ LIỆU AN TOÀN 2 LỚP BẢO VỆ (CONFIRM DELETE & ADMIN PROTECTION)
 * PHẦN 8: QUẢN LÝ ĐƠN HÀNG (ORDERS DISPATCH & INLINE STATUS UPDATE)
 * PHẦN 9: GẮN SỰ KIỆN GIAO DIỆN & EXPORT MODULE (EVENT LISTENERS & INIT)
 * ============================================================================
 */

// ============================================================================
// PHẦN 1: CẤU HÌNH HẰNG SỐ & QUẢN LÝ STATE QUẢN TRỊ (CONFIG & STATE)
// ============================================================================

/**
 * 🎯 Cấu hình URL gốc API và số sản phẩm trên mỗi trang phân trang quản trị
 */
const API_URL = 'http://localhost:3000';
const SO_SP_MOI_TRANG = 8;

/**
 * 🎯 Quản lý trạng thái Dashboard lưu trong bộ nhớ
 */
let adminUser = JSON.parse(localStorage.getItem('smartstore_user')) || null; // Thông tin tài khoản admin đăng nhập
let dsSanPham = []; // Danh sách toàn bộ sản phẩm
let dsDanhMuc = []; // Danh mục 8 thương hiệu
let dsKhachHang = []; // Danh sách toàn bộ tài khoản users
let dsDonHang = []; // Danh sách toàn bộ đơn hàng

let tabHienTai = sessionStorage.getItem('smartstore_admin_tab') || 'products'; // Tab đang mở (products / customers / orders)
let trangSanPham = 1; // Trang hiện tại của bảng sản phẩm
let mucCanXoa = null; // Đối tượng tạm thời cần xóa: { loai: 'product'|'customer', id: '1', ten: '...' }
let donHangDangXem = null; // Đơn hàng đang được mở xem trong Modal chi tiết

// ============================================================================
// PHẦN 2: CÁC TIỆN ÍCH DÙNG CHUNG (UTILITIES & MODALS)
// ============================================================================

/**
 * 🎯 Mục đích: Định dạng tiền tệ VND chuẩn (Ví dụ: 25000000 -> 25.000.000 đ)
 * ⚙️ Hàm có sẵn: Number.prototype.toLocaleString('vi-VN')
 */
function dinhDangTien(soTien) {
  if (!soTien || isNaN(soTien)) return '0 đ';
  return Number(soTien).toLocaleString('vi-VN') + ' đ';
}

/**
 * 🎯 Mục đích: Hiển thị thông báo Toast góc trên bên phải màn hình
 * ⚙️ Hàm có sẵn: DOM classList.add/remove, setTimeout
 */
function hienThongBao(noiDung, loai = 'success') {
  const toast = document.getElementById('toast-container');
  const msg = document.getElementById('toast-message');
  if (!toast || !msg) return;

  toast.className = `toast-notice toast-${loai} show`;
  msg.textContent = noiDung;

  setTimeout(() => toast.classList.remove('show'), 3000);
}

/**
 * 🎯 Mục đích: Đóng/Mở các Modal form (Sản phẩm, Khách hàng, Đơn hàng, Xác nhận xóa)
 */
function moModal(idModal) {
  const modal = document.getElementById(idModal);
  if (modal) modal.classList.add('open');
}

function dongModal(idModal) {
  const modal = document.getElementById(idModal);
  if (modal) modal.classList.remove('open');
}

// ============================================================================
// PHẦN 3: BẢO MẬT & PHÂN QUYỀN ĐĂNG NHẬP ADMIN (RBAC & AUTH GUARD)
// ============================================================================

/**
 * 🎯 Mục đích: Kiểm tra phân quyền truy cập trang Admin (Auth Guard)
 * 🔄 Luồng chạy: Kiểm tra localStorage('smartstore_user') -> Nếu chưa đăng nhập hoặc role !== 'admin' thì chỉ hiện form đăng nhập, ẩn toàn bộ dashboard quản trị.
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
    taiDuLieuAdmin();
  }
}

/**
 * 🎯 Mục đích: Xử lý đăng nhập Quản trị viên an toàn
 * ⚙️ Hàm có sẵn: fetch, Array.prototype.find, localStorage.setItem
 * 🔄 Luồng chạy: Tải danh sách users -> Tìm user có email khớp, mật khẩu đúng và role === 'admin' -> Lưu localStorage -> Mở Dashboard.
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
  hienThongBao('Đã đăng xuất tài khoản quản trị', 'info');
  kiemTraDangNhapAdmin();
}

// ============================================================================
// PHẦN 4: KẾT NỐI API & BỘ TÍNH TOÁN 4 CHỈ SỐ KPI (ANALYTICS & KPI METRICS)
// ============================================================================

/**
 * 🎯 Mục đích: Tải toàn bộ 4 bảng dữ liệu (categories, products, users, orders) từ API bằng Promise.all
 * ⚙️ Hàm có sẵn: Promise.all, fetch, async/await
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
    chuyenTabAdmin(tabHienTai);
  } catch (loi) {
    console.error('Lỗi tải dữ liệu admin:', loi);
    hienThongBao('Chưa bật server API! Hãy chạy tệp chay_server.bat', 'error');
  }
}

function dienDropdownDanhMuc() {
  const filterCat = document.getElementById('admin-filter-category');
  if (filterCat) {
    filterCat.innerHTML = `
      <option value="all">Tất cả thương hiệu (8 Hãng)</option>
      ${dsDanhMuc.map(h => `<option value="${h.id}">${h.name}</option>`).join('')}
    `;
  }

  const modalCat = document.getElementById('prod-category');
  if (modalCat) {
    modalCat.innerHTML = dsDanhMuc.map(h => `<option value="${h.id}">${h.name}</option>`).join('');
  }
}

/**
 * 🎯 Mục đích: Engine tính toán tự động 4 chỉ số KPI kinh doanh & cảnh báo tồn kho thấp
 * ⚙️ Hàm có sẵn: Array.prototype.reduce, Array.prototype.filter
 * 🔄 Luồng chạy:
 *   1. Doanh thu = Tổng totalAmount của các đơn không bị hủy (status !== 'cancelled')
 *   2. Tổng máy đã bán = Tổng trường sold của toàn bộ sản phẩm
 *   3. Tổng máy tồn kho = Tổng trường stock của toàn bộ sản phẩm
 *   4. Tổng đơn hàng = Độ dài danh sách dsDonHang.length
 *   5. Cảnh báo các mẫu máy có tồn kho <= 5 máy.
 */
function tinhToanKPI() {
  const doanhThu = dsDonHang
    .filter(d => d.status !== 'cancelled')
    .reduce((tong, d) => tong + (d.totalAmount || 0), 0);

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

  document.getElementById('stat-revenue').textContent = dinhDangTien(doanhThu);
  document.getElementById('stat-sold-count').textContent = `${tongDaBan} máy`;
  document.getElementById('stat-stock-count').textContent = `${tongTonKho} máy`;
  document.getElementById('stat-order-count').textContent = `${tongDon} đơn`;
}

/**
 * 🎯 Mục đích: Chuyển đổi giữa 3 tab quản lý (products, customers, orders)
 */
function chuyenTabAdmin(tenTab) {
  tabHienTai = tenTab;
  sessionStorage.setItem('smartstore_admin_tab', tenTab);

  document.querySelectorAll('.admin-tab-content').forEach(p => p.style.display = 'none');
  const target = document.getElementById(`admin-panel-${tenTab}`);
  if (target) target.style.display = 'block';

  document.querySelectorAll('.main-nav button[data-admin-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-admin-tab') === tenTab);
  });

  if (tenTab === 'products') renderBangSanPham();
  else if (tenTab === 'customers') renderBangKhachHang();
  else if (tenTab === 'orders') renderBangDonHang();
}

// ============================================================================
// PHẦN 5: QUẢN LÝ SẢN PHẨM (PRODUCT CRUD & FILEREADER BASE64)
// ============================================================================

/**
 * 🎯 Mục đích: Render bảng danh sách sản phẩm với phân trang 8 sản phẩm và bộ lọc thương hiệu/tìm kiếm
 * ⚙️ Hàm có sẵn: Array.prototype.filter, Array.prototype.slice, Math.ceil
 */
function renderBangSanPham() {
  const tbody = document.getElementById('admin-products-tbody');
  const paginBox = document.getElementById('admin-products-pagination');
  if (!tbody) return;

  const tuKhoa = (document.getElementById('admin-search-product')?.value || '').toLowerCase().trim();
  const hangDaChon = document.getElementById('admin-filter-category')?.value || 'all';

  let ketQua = [...dsSanPham];
  if (hangDaChon !== 'all') {
    ketQua = ketQua.filter(sp => sp.categoryId == hangDaChon);
  }
  if (tuKhoa !== '') {
    ketQua = ketQua.filter(sp => sp.name.toLowerCase().includes(tuKhoa));
  }

  const tongTrang = Math.ceil(ketQua.length / SO_SP_MOI_TRANG) || 1;
  if (trangSanPham > tongTrang) trangSanPham = 1;
  const batDau = (trangSanPham - 1) * SO_SP_MOI_TRANG;
  const spTrang = ketQua.slice(batDau, batDau + SO_SP_MOI_TRANG);

  if (spTrang.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:#64748b;">Không tìm thấy sản phẩm nào!</td></tr>`;
    if (paginBox) paginBox.innerHTML = '';
    return;
  }

  tbody.innerHTML = spTrang.map(sp => {
    const hang = dsDanhMuc.find(h => h.id == sp.categoryId);
    const tenHang = hang ? hang.name : 'Khác';

    return `
      <tr>
        <td><strong>#${sp.id}</strong></td>
        <td>
          <div class="admin-prod-thumb-wrapper" title="Di chuột để phóng to ảnh">
            <img src="${sp.image}" alt="${sp.name}" onerror="this.onerror=null; this.src='https://picsum.photos/300/300';">
            <div class="admin-thumb-zoom">
              <img src="${sp.image}" alt="${sp.name}" onerror="this.onerror=null; this.src='https://picsum.photos/300/300';">
            </div>
          </div>
        </td>
        <td>
          <strong>${sp.name}</strong>
          <div style="font-size:12px; color:#64748b;">${sp.specs?.cpu || ''}</div>
        </td>
        <td><span class="badge" style="background:#e0f2fe; color:#0369a1;">${tenHang}</span></td>
        <td style="font-weight:800; color:var(--accent);">${dinhDangTien(sp.price)}</td>
        <td><strong style="color:${sp.stock <= 5 ? 'var(--accent)' : 'var(--success)'};">${sp.stock}</strong></td>
        <td>${sp.sold || 0}</td>
        <td style="text-align:center;">
          <button class="btn-secondary btn-sm" onclick="moSuaSanPham('${sp.id}')" title="Chỉnh sửa"><i class="fa-solid fa-pen-to-square"></i></button>
          <button class="btn-danger btn-sm" onclick="xacNhanXoa('product', '${sp.id}', '${sp.name.replace(/'/g, "\\'")}')" title="Xóa"><i class="fa-solid fa-trash-can"></i></button>
        </td>
      </tr>
    `;
  }).join('');

  if (paginBox) {
    if (tongTrang <= 1) {
      paginBox.innerHTML = '';
    } else {
      let html = '';
      for (let i = 1; i <= tongTrang; i++) {
        html += `<button class="page-btn ${trangSanPham === i ? 'active' : ''}" onclick="chuyenTrangSanPhamAdmin(${i})">${i}</button>`;
      }
      paginBox.innerHTML = html;
    }
  }
}

function chuyenTrangSanPhamAdmin(trang) {
  trangSanPham = trang;
  renderBangSanPham();
}

function moThemSanPham() {
  document.getElementById('product-form').reset();
  document.getElementById('prod-id').value = '';
  document.getElementById('product-modal-title').textContent = 'Thêm Sản Phẩm Mới (+1 ID Tự Động)';
  document.getElementById('prod-image-preview').src = 'https://picsum.photos/300/300';
  moModal('product-modal');
}

function moSuaSanPham(idSP) {
  const sp = dsSanPham.find(item => item.id == idSP);
  if (!sp) return;

  document.getElementById('prod-id').value = sp.id;
  document.getElementById('prod-name').value = sp.name;
  document.getElementById('prod-category').value = sp.categoryId;
  document.getElementById('prod-price').value = sp.price;
  document.getElementById('prod-stock').value = sp.stock;
  document.getElementById('prod-sold').value = sp.sold || 0;
  document.getElementById('prod-image-url').value = sp.image;
  document.getElementById('prod-desc').value = sp.description || '';

  const ts = sp.specs || {};
  document.getElementById('spec-screen').value = ts.screen || '';
  document.getElementById('spec-cpu').value = ts.cpu || '';
  document.getElementById('spec-gpu').value = ts.gpu || '';
  document.getElementById('spec-ram').value = ts.ram || '';
  document.getElementById('spec-rom').value = ts.rom || '';
  document.getElementById('spec-rear-cam').value = ts.rear_camera || '';
  document.getElementById('spec-front-cam').value = ts.front_camera || '';
  document.getElementById('spec-battery').value = ts.battery || '';
  document.getElementById('spec-os').value = ts.os || '';
  document.getElementById('spec-special').value = ts.special || '';

  document.getElementById('prod-image-preview').src = sp.image || 'https://picsum.photos/300/300';
  document.getElementById('product-modal-title').textContent = `Chỉnh Sửa Sản Phẩm #${sp.id}`;
  moModal('product-modal');
}

/**
 * 🎯 Mục đích: Lưu sản phẩm (Thêm mới với POST + ID tăng dần hoặc Cập nhật với PATCH)
 * ⚙️ Hàm có sẵn: fetch (POST, PATCH), Array.prototype.reduce, Math.max
 */
async function luuSanPham() {
  const id = document.getElementById('prod-id').value;
  const ten = document.getElementById('prod-name').value.trim();
  const hang = Number(document.getElementById('prod-category').value);
  const gia = Number(document.getElementById('prod-price').value);
  const kho = Number(document.getElementById('prod-stock').value);
  const daBan = Number(document.getElementById('prod-sold').value) || 0;
  const anh = document.getElementById('prod-image-url').value.trim() || 'https://picsum.photos/300/300';
  const moTa = document.getElementById('prod-desc').value.trim();

  if (!ten || isNaN(gia) || isNaN(kho)) {
    hienThongBao('Vui lòng điền đủ Tên, Giá và Tồn kho!', 'error');
    return;
  }

  const thongSo10 = {
    screen: document.getElementById('spec-screen').value.trim(),
    cpu: document.getElementById('spec-cpu').value.trim(),
    gpu: document.getElementById('spec-gpu').value.trim(),
    ram: document.getElementById('spec-ram').value.trim(),
    rom: document.getElementById('spec-rom').value.trim(),
    rear_camera: document.getElementById('spec-rear-cam').value.trim(),
    front_camera: document.getElementById('spec-front-cam').value.trim(),
    battery: document.getElementById('spec-battery').value.trim(),
    os: document.getElementById('spec-os').value.trim(),
    special: document.getElementById('spec-special').value.trim()
  };

  try {
    if (id) {
      // 1. CẬP NHẬT SẢN PHẨM (PATCH)
      const payload = {
        name: ten,
        categoryId: hang,
        cate_id: String(hang),
        price: gia,
        stock: kho,
        quantity: kho,
        sold: daBan,
        image: anh,
        description: moTa,
        specs: thongSo10
      };

      const res = await fetch(`${API_URL}/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const spDaCapNhat = await res.json();

      const viTri = dsSanPham.findIndex(p => p.id == id);
      if (viTri > -1) dsSanPham[viTri] = spDaCapNhat;

      hienThongBao(`Đã cập nhật sản phẩm #${id} thành công!`, 'success');
    } else {
      // 2. THÊM SẢN PHẨM MỚI (POST + 1 ID TỰ ĐỘNG)
      const maxId = dsSanPham.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0);
      const idMoi = String(maxId + 1);

      const spMoi = {
        id: idMoi,
        name: ten,
        categoryId: hang,
        cate_id: String(hang),
        price: gia,
        stock: kho,
        quantity: kho,
        sold: daBan,
        image: anh,
        description: moTa,
        specs: thongSo10,
        createdAt: new Date().toISOString()
      };

      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(spMoi)
      });
      const spDaTao = await res.json();
      dsSanPham.unshift(spDaTao);

      hienThongBao(`Đã thêm sản phẩm mới #${spDaTao.id} thành công!`, 'success');
    }

    dongModal('product-modal');
    tinhToanKPI();
    renderBangSanPham();
  } catch (loi) {
    console.error(loi);
    hienThongBao('Lỗi khi lưu sản phẩm vào CSDL!', 'error');
  }
}

// ============================================================================
// PHẦN 6: QUẢN LÝ KHÁCH HÀNG (CUSTOMER CRUD & AUTO +1 ID & ADMIN SHIELD)
// ============================================================================

/**
 * 🎯 Mục đích: Hiển thị bảng khách hàng kèm Badge vai trò và kiểm soát nút Xóa Admin
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
    const roleBadge = laAdmin 
      ? '<span class="badge" style="background:#fee2e2; color:#b91c1c;"><i class="fa-solid fa-user-shield"></i> Admin</span>' 
      : '<span class="badge" style="background:#e0f2fe; color:#0369a1;">Khách hàng</span>';

    return `
      <tr>
        <td><strong>#${c.id}</strong></td>
        <td><strong>${c.fullName || c.name}</strong></td>
        <td>${c.email}</td>
        <td>${c.phone || '-'}</td>
        <td>${c.address || '-'}</td>
        <td>${roleBadge}</td>
        <td style="text-align:center;">
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

      if (adminUser && adminUser.id == id) {
        adminUser = userCapNhat;
        localStorage.setItem('smartstore_user', JSON.stringify(adminUser));
      }

      hienThongBao('Cập nhật thông tin tài khoản thành công!', 'success');
    } else {
      // 2. Thêm khách hàng mới với ID tự động tăng (+1 ID)
      const maxId = dsKhachHang.reduce((max, c) => Math.max(max, Number(c.id) || 0), 0);
      const userMoi = {
        id: String(maxId + 1),
        fullName: ten,
        email: email,
        phone: sdt,
        address: diaChi,
        role: vaiTroChon,
        password: passMoi || '123456',
        createdAt: new Date().toISOString()
      };

      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userMoi)
      });
      const userDaTao = await res.json();
      dsKhachHang.push(userDaTao);

      hienThongBao(`Đã thêm khách hàng mới #${userDaTao.id} thành công!`, 'success');
    }

    dongModal('customer-modal');
    renderBangKhachHang();
  } catch (loi) {
    console.error(loi);
    hienThongBao('Lỗi khi lưu khách hàng!', 'error');
  }
}

// ============================================================================
// PHẦN 7: XÓA DỮ LIỆU AN TOÀN 2 LỚP BẢO VỆ (CONFIRM DELETE & ADMIN PROTECTION)
// ============================================================================

/**
 * 🎯 Mục đích: Mở modal xác nhận xóa (Lớp phòng thủ an ninh số 1)
 */
function xacNhanXoa(loai, id, ten) {
  if (loai === 'customer') {
    const userCanXoa = dsKhachHang.find(u => u.id == id);
    if (userCanXoa && userCanXoa.role === 'admin') {
      hienThongBao('Bảo mật: Không được phép xóa bất kỳ tài khoản Quản trị viên (Admin) nào!', 'error');
      return;
    }
  }

  mucCanXoa = { loai, id, ten };
  const msgEl = document.getElementById('confirm-modal-message');
  if (msgEl) {
    msgEl.innerHTML = `Bạn có chắc muốn xóa <strong>${ten}</strong> (#${id})? Thao tác này không thể hoàn tác!`;
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

  try {
    const endpoint = loai === 'product' ? 'products' : 'users';
    await fetch(`${API_URL}/${endpoint}/${id}`, { method: 'DELETE' });

    if (loai === 'product') {
      dsSanPham = dsSanPham.filter(p => p.id != id);
      hienThongBao('Đã xóa sản phẩm thành công', 'info');
      tinhToanKPI();
      renderBangSanPham();
    } else {
      dsKhachHang = dsKhachHang.filter(c => c.id != id);
      hienThongBao('Đã xóa khách hàng thành công', 'info');
      renderBangKhachHang();
    }

    dongModal('confirm-modal');
  } catch (loi) {
    console.error(loi);
    hienThongBao('Lỗi khi xóa dữ liệu!', 'error');
  }
}

// ============================================================================
// PHẦN 8: QUẢN LÝ ĐƠN HÀNG (ORDERS DISPATCH & INLINE STATUS UPDATE)
// ============================================================================

/**
 * 🎯 Mục đích: Đổi trạng thái đơn hàng trực tiếp ngay trên từng dòng của bảng (Fast Inline Action)
 * ⚙️ Hàm có sẵn: fetch (PATCH), Array.prototype.findIndex
 */
async function doiTrangThaiDonHangTrucTiep(idDon, trangThaiMoi, selectEl) {
  const donCu = dsDonHang.find(d => d.id == idDon);
  if (!donCu) return;
  const trangThaiCu = donCu.status;

  if (trangThaiCu === trangThaiMoi) return;

  // 🛡️ FINITE STATE MACHINE (FSM): Cảnh báo nếu chuyển đổi từ trạng thái kết thúc (cancelled)
  if (trangThaiCu === 'cancelled' && !confirm('Đơn hàng này đã bị HỦY trước đó. Bạn có chắc chắn muốn kích hoạt lại đơn hàng và trừ lại tồn kho không?')) {
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

    const tenTrangThaiMap = {
      processing: 'Chờ xử lý',
      shipping: 'Đang giao',
      delivered: 'Đã giao',
      cancelled: 'Đã hủy'
    };

    hienThongBao(`Đã đổi đơn #${donCapNhat.orderCode} sang "${tenTrangThaiMap[trangThaiMoi] || trangThaiMoi}"`, 'success');
    tinhToanKPI();
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
          <select class="order-status-select status-${d.status}" onchange="doiTrangThaiDonHangTrucTiep('${d.id}', this.value, this)" title="Bấm để đổi trực tiếp trạng thái đơn">
            <option value="processing" ${d.status === 'processing' ? 'selected' : ''}>Chờ xử lý</option>
            <option value="shipping" ${d.status === 'shipping' ? 'selected' : ''}>Đang giao</option>
            <option value="delivered" ${d.status === 'delivered' ? 'selected' : ''}>Đã giao</option>
            <option value="cancelled" ${d.status === 'cancelled' ? 'selected' : ''}>Đã hủy</option>
          </select>
        </td>
        <td style="text-align:center;">
          <button class="btn-primary btn-sm" onclick="moXemDonHang('${d.orderCode}')" title="Xem chi tiết đơn"><i class="fa-solid fa-eye"></i> Xem</button>
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
  if (selectStatus) selectStatus.value = d.status;

  moModal('order-detail-modal');
}

async function capNhatTrangThaiDon() {
  if (!donHangDangXem) return;
  const selectStatus = document.getElementById('order-status-update-select');
  const trangThaiMoi = selectStatus.value;
  const trangThaiCu = donHangDangXem.status;

  if (trangThaiCu === trangThaiMoi) {
    dongModal('order-detail-modal');
    return;
  }

  // 🛡️ FINITE STATE MACHINE (FSM): Cảnh báo nếu chuyển đổi từ trạng thái kết thúc (cancelled)
  if (trangThaiCu === 'cancelled' && !confirm('Đơn hàng này đã bị HỦY trước đó. Bạn có chắc chắn muốn kích hoạt lại đơn hàng và trừ lại tồn kho không?')) {
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

// ============================================================================
// PHẦN 9: GẮN SỰ KIỆN GIAO DIỆN & EXPORT MODULE (EVENT LISTENERS & INIT)
// ============================================================================

/**
 * 🎯 Export các hàm điều khiển bảng quản trị ra window.adminCtrl để HTML onclick gọi an toàn
 */
window.adminCtrl = {
  closeModal: dongModal,
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
  inlineUpdateOrderStatus: doiTrangThaiDonHangTrucTiep
};

/**
 * 🎯 Gắn sự kiện khi DOM tải xong
 */
document.addEventListener('DOMContentLoaded', () => {
  kiemTraDangNhapAdmin();

  // Đăng nhập / Đăng xuất Admin
  document.getElementById('admin-login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-login-email').value.trim();
    const pass = document.getElementById('admin-login-password').value.trim();
    dangNhapAdmin(email, pass);
  });
  document.getElementById('btn-admin-logout')?.addEventListener('click', dangXuatAdmin);

  // Chuyển tab Admin
  document.querySelectorAll('.main-nav button[data-admin-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      chuyenTabAdmin(btn.getAttribute('data-admin-tab'));
    });
  });

  // Tìm kiếm & Lọc sản phẩm
  document.getElementById('admin-search-product')?.addEventListener('input', () => {
    trangSanPham = 1;
    renderBangSanPham();
  });
  document.getElementById('admin-filter-category')?.addEventListener('change', () => {
    trangSanPham = 1;
    renderBangSanPham();
  });
  document.getElementById('btn-open-add-product')?.addEventListener('click', moThemSanPham);

  // Đọc file ảnh từ máy sang chuỗi Base64 bằng FileReader
  document.getElementById('prod-image-file')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        document.getElementById('prod-image-url').value = evt.target.result;
        document.getElementById('prod-image-preview').src = evt.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('prod-image-url')?.addEventListener('input', (e) => {
    document.getElementById('prod-image-preview').src = e.target.value || 'https://picsum.photos/300/300';
  });

  document.getElementById('product-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    luuSanPham();
  });

  // Tìm kiếm & Lưu khách hàng
  document.getElementById('admin-search-customer')?.addEventListener('input', renderBangKhachHang);
  document.getElementById('btn-open-add-customer')?.addEventListener('click', moThemKhachHang);
  document.getElementById('customer-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    luuKhachHang();
  });

  // Tìm kiếm & Lọc đơn hàng
  document.getElementById('admin-search-order')?.addEventListener('input', renderBangDonHang);
  document.getElementById('admin-filter-order-status')?.addEventListener('change', renderBangDonHang);
  document.getElementById('btn-save-order-status')?.addEventListener('click', capNhatTrangThaiDon);

  // Xác nhận xóa
  document.getElementById('btn-confirm-delete-action')?.addEventListener('click', thucHienXoa);
});
