/**
 * ============================================================================
 * DỰ ÁN: WEBSITE BÁN ĐIỆN THOẠI & GAMING PHONE (SMARTSTORE)
 * TỆP: js/admin.js (LOGIC QUẢN TRỊ ADMIN DỄ HIỂU - CHUẨN ES6 DÀNH CHO SINH VIÊN)
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * ============================================================================
 */

// ============================================================================
// PHẦN 1: CẤU HÌNH API & BIẾN DỮ LIỆU BẢNG QUẢN TRỊ
// ============================================================================
const API_URL = 'http://localhost:3000';
const SO_SP_MOI_TRANG = 8;

let adminUser = JSON.parse(localStorage.getItem('smartstore_user')) || null;
let dsSanPham = [];
let dsDanhMuc = [];
let dsKhachHang = [];
let dsDonHang = [];

let tabHienTai = sessionStorage.getItem('smartstore_admin_tab') || 'products';
let trangSanPham = 1;
let mucCanXoa = null;     // { loai: 'product'|'customer', id: 1, ten: '...' }
let donHangDangXem = null; // Đơn hàng đang mở xem trong modal

// ============================================================================
// PHẦN 2: CÁC HÀM TIỆN ÍCH DỄ DÙNG
// ============================================================================

function dinhDangTien(soTien) {
  if (!soTien || isNaN(soTien)) return '0 đ';
  return Number(soTien).toLocaleString('vi-VN') + ' đ';
}

function hienThongBao(noiDung, loai = 'success') {
  const toast = document.getElementById('toast-container');
  const msg = document.getElementById('toast-message');
  if (!toast || !msg) return;

  toast.className = `toast-notice toast-${loai} show`;
  msg.textContent = noiDung;

  setTimeout(() => toast.classList.remove('show'), 3000);
}

function dongModal(idModal) {
  const modal = document.getElementById(idModal);
  if (modal) modal.classList.remove('open');
}

function moModal(idModal) {
  const modal = document.getElementById(idModal);
  if (modal) modal.classList.add('open');
}

// ============================================================================
// PHẦN 3: KIỂM TRA PHÂN QUYỀN ĐĂNG NHẬP ADMIN
// ============================================================================

function kiemTraDangNhapAdmin() {
  const manHinhLogin = document.getElementById('admin-login-screen');
  const manHinhDash = document.getElementById('admin-dashboard-screen');

  if (!adminUser || adminUser.role !== 'admin') {
    // Nếu chưa đăng nhập hoặc không phải admin -> Hiện form đăng nhập
    if (manHinhLogin) manHinhLogin.style.display = 'flex';
    if (manHinhDash) manHinhDash.style.display = 'none';
  } else {
    // Đã đăng nhập admin -> Mở trang dashboard
    if (manHinhLogin) manHinhLogin.style.display = 'none';
    if (manHinhDash) manHinhDash.style.display = 'block';
    taiDuLieuAdmin();
  }
}

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
    hienThongBao('Lỗi kết nối json-server!', 'error');
  }
}

function dangXuatAdmin() {
  adminUser = null;
  localStorage.removeItem('smartstore_user');
  hienThongBao('Đã đăng xuất tài khoản quản trị', 'info');
  kiemTraDangNhapAdmin();
}

// ============================================================================
// PHẦN 4: TẢI DỮ LIỆU TỪ MÁY CHỦ & TÍNH TOÁN 4 CHỈ SỐ KPI
// ============================================================================

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
      categoryId: sp.categoryId || sp.cate_id || '1',
      cate_id: sp.cate_id || sp.categoryId || '1',
      stock: (sp.stock !== undefined && sp.stock !== null) ? Number(sp.stock) : (Number(sp.quantity) || 15),
      quantity: (sp.quantity !== undefined && sp.quantity !== null) ? Number(sp.quantity) : (Number(sp.stock) || 15),
      sold: Number(sp.sold) || 0
    }));
    dsKhachHang = await resUsers.json();
    dsDonHang = await resDon.json();

    // Điền danh mục vào dropdown
    dienDropdownDanhMuc();

    // Tính toán 4 chỉ số KPI tự động
    tinhToanKPI();

    // Mở tab đang lưu
    chuyenTabAdmin(tabHienTai);
  } catch (loi) {
    console.error('Lỗi tải dữ liệu admin:', loi);
    hienThongBao('Chưa bật server API! Hãy chạy tệp chay_server.bat', 'error');
  }
}

function dienDropdownDanhMuc() {
  // Dropdown lọc hãng tại toolbar
  const filterCat = document.getElementById('admin-filter-category');
  if (filterCat) {
    filterCat.innerHTML = `
      <option value="all">Tất cả thương hiệu (8 Hãng)</option>
      ${dsDanhMuc.map(h => `<option value="${h.id}">${h.name}</option>`).join('')}
    `;
  }

  // Dropdown chọn hãng trong modal sản phẩm
  const modalCat = document.getElementById('prod-category');
  if (modalCat) {
    modalCat.innerHTML = dsDanhMuc.map(h => `<option value="${h.id}">${h.name}</option>`).join('');
  }
}

function tinhToanKPI() {
  // 1. Doanh thu: tính tổng tiền các đơn không bị hủy
  const doanhThu = dsDonHang
    .filter(d => d.status !== 'cancelled')
    .reduce((tong, d) => tong + (d.totalAmount || 0), 0);

  // 2. Tổng số máy đã bán
  const tongDaBan = dsSanPham.reduce((tong, sp) => tong + (sp.sold || 0), 0);

  // 3. Tổng số máy còn tồn kho
  const tongTonKho = dsSanPham.reduce((tong, sp) => tong + (sp.stock || 0), 0);

  // 4. Tổng số đơn hàng
  const tongDon = dsDonHang.length;

  // Cảnh báo tồn kho thấp (các máy stock <= 5)
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

function chuyenTabAdmin(tenTab) {
  tabHienTai = tenTab;
  sessionStorage.setItem('smartstore_admin_tab', tenTab);

  // Ẩn tất cả các tab
  document.querySelectorAll('.admin-tab-content').forEach(p => p.style.display = 'none');
  // Hiện tab mục tiêu
  const target = document.getElementById(`admin-panel-${tenTab}`);
  if (target) target.style.display = 'block';

  // Active nút menu
  document.querySelectorAll('.main-nav button[data-admin-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-admin-tab') === tenTab);
  });

  // Render dữ liệu tab
  if (tenTab === 'products') renderBangSanPham();
  else if (tenTab === 'customers') renderBangKhachHang();
  else if (tenTab === 'orders') renderBangDonHang();
}

// ============================================================================
// PHẦN 5: QUẢN LÝ SẢN PHẨM (CRUD + 1 ID + FILEREADER ĐỌC ẢNH)
// ============================================================================

function renderBangSanPham() {
  const tbody = document.getElementById('admin-products-tbody');
  const paginBox = document.getElementById('admin-products-pagination');
  if (!tbody) return;

  const tuKhoa = (document.getElementById('admin-search-product')?.value || '').toLowerCase().trim();
  const hangDaChon = document.getElementById('admin-filter-category')?.value || 'all';

  // Lọc sản phẩm
  let ketQua = [...dsSanPham];
  if (hangDaChon !== 'all') {
    ketQua = ketQua.filter(sp => sp.categoryId == hangDaChon);
  }
  if (tuKhoa !== '') {
    ketQua = ketQua.filter(sp => sp.name.toLowerCase().includes(tuKhoa));
  }

  // Phân trang 8 sản phẩm
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

  // Nút số trang
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

  // 10 thông số kỹ thuật
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
// PHẦN 6: QUẢN LÝ KHÁCH HÀNG (CRUD USERS)
// ============================================================================

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
  document.getElementById('customer-modal-title').textContent = 'Thêm Khách Hàng Mới';

  // Mở khóa chọn vai trò cho tài khoản mới
  const roleSelect = document.getElementById('cust-role');
  if (roleSelect) {
    roleSelect.disabled = false;
    roleSelect.value = 'user';
  }
  const hint = document.getElementById('cust-role-hint');
  if (hint) hint.style.display = 'none';

  moModal('customer-modal');
}

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

  // NGUYÊN TẮC BẢO MẬT: Nếu tài khoản đang sửa là Admin (dù là chính mình hay Admin khác)
  // thì KHÔNG được phép thay đổi vai trò (khóa trường chọn vai trò)
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

      // NGUYÊN TẮC BẢO MẬT: Tài khoản vốn dĩ là Admin thì bắt buộc giữ nguyên vai trò Admin
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

      // Nếu đang sửa chính tài khoản Admin hiện tại, cập nhật lại thông tin trong LocalStorage
      if (adminUser && adminUser.id == id) {
        adminUser = userCapNhat;
        localStorage.setItem('smartstore_user', JSON.stringify(adminUser));
      }

      hienThongBao('Cập nhật thông tin tài khoản thành công!', 'success');
    } else {
      // 2. Thêm khách hàng mới
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

      hienThongBao('Đã thêm khách hàng mới thành công!', 'success');
    }

    dongModal('customer-modal');
    renderBangKhachHang();
  } catch (loi) {
    console.error(loi);
    hienThongBao('Lỗi khi lưu khách hàng!', 'error');
  }
}

// ============================================================================
// PHẦN 7: XÓA DỮ LIỆU AN TOÀN (CONFIRM DELETE & ADMIN PROTECTION)
// ============================================================================

function xacNhanXoa(loai, id, ten) {
  // NGUYÊN TẮC BẢO MẬT: Chặn tuyệt đối xóa tài khoản Quản trị viên
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
// PHẦN 8: QUẢN LÝ ĐƠN HÀNG (ORDERS & STATUS UPDATE)
// ============================================================================

/**
 * Đổi trạng thái đơn hàng trực tiếp ngay trên từng dòng của bảng (Fast Inline Action)
 */
async function doiTrangThaiDonHangTrucTiep(idDon, trangThaiMoi, selectEl) {
  try {
    const res = await fetch(`${API_URL}/orders/${idDon}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: trangThaiMoi })
    });
    const donCapNhat = await res.json();

    // Cập nhật mảng dsDonHang trong bộ nhớ
    const viTri = dsDonHang.findIndex(d => d.id == idDon);
    if (viTri > -1) dsDonHang[viTri] = donCapNhat;

    // Cập nhật class màu sắc cho thẻ select ngay lập tức
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

  // Đơn mới nhất lên đầu
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

function moXemDonHang(maDon) {
  const d = dsDonHang.find(item => item.orderCode === maDon);
  if (!d) return;

  donHangDangXem = d;
  document.getElementById('order-modal-title').textContent = `Chi Tiết Đơn Hàng ${d.orderCode}`;

  const body = document.getElementById('order-modal-body');
  if (body) {
    body.innerHTML = `
      <div style="background:#f8fafc; padding:12px; border-radius:8px; margin-bottom:14px; font-size:13px; line-height:1.7;">
        <div><strong>Khách hàng:</strong> ${d.customerName} (${d.customerPhone})</div>
        <div><strong>Địa chỉ:</strong> ${d.customerAddress}</div>
        <div><strong>Phương thức:</strong> ${d.paymentMethod}</div>
        ${d.note ? `<div><strong>Ghi chú:</strong> ${d.note}</div>` : ''}
      </div>
      <h4 style="font-size:13px; margin-bottom:8px;">Các món đặt mua:</h4>
      <div style="max-height:180px; overflow-y:auto;">
        ${d.items.map(i => `
          <div style="display:flex; justify-content:space-between; font-size:13px; border-bottom:1px dashed #e2e8f0; padding:6px 0;">
            <span>${i.name} (x${i.quantity})</span>
            <strong>${dinhDangTien(i.price * i.quantity)}</strong>
          </div>
        `).join('')}
      </div>
      <div style="display:flex; justify-content:space-between; margin-top:12px; font-size:15px; font-weight:800; border-top:1px solid #e2e8f0; padding-top:8px;">
        <span>Tổng thanh toán:</span>
        <span style="color:var(--accent);">${dinhDangTien(d.totalAmount)}</span>
      </div>
    `;
  }

  document.getElementById('order-status-update-select').value = d.status || 'processing';
  moModal('order-detail-modal');
}

async function capNhatTrangThaiDon() {
  if (!donHangDangXem) return;
  const trangThaiMoi = document.getElementById('order-status-update-select').value;

  try {
    const res = await fetch(`${API_URL}/orders/${donHangDangXem.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: trangThaiMoi })
    });
    const donCapNhat = await res.json();

    const viTri = dsDonHang.findIndex(d => d.id == donCapNhat.id);
    if (viTri > -1) dsDonHang[viTri] = donCapNhat;

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
// PHẦN 9: GẮN SỰ KIỆN GIAO DIỆN & EXPORT GLOBAL
// ============================================================================

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

  // Đọc file ảnh từ máy sang Base64 bằng FileReader
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
