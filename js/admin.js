/**
 * ============================================================================
 * JAVASCRIPT BẢNG QUẢN TRỊ ADMIN (ADMIN APP - admin.js)
 * ============================================================================
 * 
 * CÁC CHỨC NĂNG CHÍNH:
 * 1. Đăng nhập bảo mật riêng cho Admin (kiểm tra role === 'admin' từ db.json).
 * 2. Lưu phiên đăng nhập của Admin (session trong localStorage).
 * 3. Quản lý Sản Phẩm (Thêm, Sửa, Xóa) có chọn ảnh từ máy tính (Choose File Base64).
 * 4. Quản lý Danh Mục điện thoại (Thêm, Xóa).
 * 5. Quản lý Đơn Hàng và Khách Hàng.
 * 6. Tự động tính toán các thẻ thống kê: Doanh thu, Đã bán, Tồn kho, Đơn hàng.
 */

// ============================================================================
// 1. CẤU HÌNH API
// ============================================================================
const API_BASE = 'http://localhost:3000';
const API_PRODUCTS = `${API_BASE}/products`;
const API_CATEGORIES = `${API_BASE}/categories`;
const API_ORDERS = `${API_BASE}/orders`;
const API_USERS = `${API_BASE}/users`;

// ============================================================================
// 2. BIẾN TOÀN CỤC QUẢN LÝ DỮ LIỆU ADMIN (STATE)
// ============================================================================
let danhSachSanPham = [];
let danhSachDanhMuc = [];
let danhSachDonHang = [];
let danhSachKhachHang = [];

let idSanPhamDangSua = null;
let anhSanPhamBase64 = '';

// ============================================================================
// 3. HÀM TIỆN ÍCH DÙNG CHUNG
// ============================================================================

function dinhDangTien(soTien) {
  return Number(soTien || 0).toLocaleString('vi-VN') + ' đ';
}

function hienThongBao(noiDung, laLoi = false) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = noiDung;
  toast.className = 'toast-notice show' + (laLoi ? ' error' : '');

  setTimeout(function () {
    toast.className = 'toast-notice';
  }, 3000);
}

// ============================================================================
// 4. KIỂM TRA ĐĂNG NHẬP VÀ PHÂN QUYỀN ADMIN
// ============================================================================

/**
 * Kiểm tra xem người dùng đã đăng nhập tài khoản Admin chưa.
 * Nếu chưa đăng nhập: Hiển thị form đăng nhập Admin.
 * Nếu đã đăng nhập: Hiển thị bảng điều khiển Dashboard.
 */
function kiemTraDangNhapAdmin() {
  const savedAdmin = localStorage.getItem('smartstore_admin');
  const loginScreen = document.getElementById('admin-login-screen');
  const dashboardScreen = document.getElementById('admin-dashboard-screen');
  const loggedName = document.getElementById('admin-logged-name');

  if (savedAdmin) {
    try {
      const admin = JSON.parse(savedAdmin);
      if (admin && admin.role === 'admin') {
        // ĐÃ ĐĂNG NHẬP ADMIN THÀNH CÔNG
        loginScreen.style.display = 'none';
        dashboardScreen.style.display = 'block';
        if (loggedName) loggedName.textContent = admin.name;
        // Tải dữ liệu các bảng quản trị
        taiDuLieuAdmin();
        return;
      }
    } catch (e) {
      localStorage.removeItem('smartstore_admin');
    }
  }

  // CHƯA ĐĂNG NHẬP: Hiển thị màn hình Login Admin
  loginScreen.style.display = 'flex';
  dashboardScreen.style.display = 'none';
}

/**
 * Xử lý Form Đăng Nhập dành riêng cho Admin.
 */
async function xuLyDangNhapAdmin(event) {
  event.preventDefault();
  const email = document.getElementById('admin-email').value.trim().toLowerCase();
  const password = document.getElementById('admin-password').value.trim();

  try {
    const res = await fetch(API_USERS);
    const users = await res.json();

    // Tìm tài khoản có role === 'admin' khớp email và password
    const adminUser = users.find(function (u) {
      return u.email.toLowerCase() === email && String(u.password) === password && u.role === 'admin';
    });

    if (!adminUser) {
      hienThongBao('Tài khoản hoặc mật khẩu không chính xác hoặc bạn không có quyền Admin!', true);
      return;
    }

    // Lưu phiên đăng nhập Admin
    localStorage.setItem('smartstore_admin', JSON.stringify(adminUser));
    hienThongBao('Đăng nhập Quản trị viên thành công!');
    kiemTraDangNhapAdmin();
  } catch (err) {
    console.error('Lỗi đăng nhập admin:', err);
    hienThongBao('Không thể kết nối đến máy chủ xác thực!', true);
  }
}

/**
 * Đăng xuất khỏi bảng Quản trị.
 */
function dangXuatAdmin() {
  localStorage.removeItem('smartstore_admin');
  hienThongBao('Đã đăng xuất Quản trị viên.');
  kiemTraDangNhapAdmin();
}

// ============================================================================
// 5. TẢI TOÀN BỘ DỮ LIỆU QUẢN TRỊ & THỐNG KÊ
// ============================================================================

async function taiDuLieuAdmin() {
  await Promise.all([
    taiDanhMucAdmin(),
    taiSanPhamAdmin(),
    taiDonHangAdmin(),
    taiKhachHangAdmin()
  ]);
  capNhatThongKe();
}

async function taiDanhMucAdmin() {
  try {
    const res = await fetch(API_CATEGORIES);
    danhSachDanhMuc = await res.json();

    // Đổ vào select box trong form thêm sản phẩm
    const selectBox = document.getElementById('form-product-cate');
    if (selectBox) {
      selectBox.innerHTML = danhSachDanhMuc.map(function (c) {
        return `<option value="${c.id}">${c.name}</option>`;
      }).join('');
    }

    // Render danh mục ra bảng
    hienThiDanhMucAdmin();
  } catch (err) {
    console.error('Lỗi tải danh mục admin:', err);
  }
}

async function taiSanPhamAdmin() {
  try {
    const res = await fetch(API_PRODUCTS);
    danhSachSanPham = await res.json();
    hienThiSanPhamAdmin();
  } catch (err) {
    console.error('Lỗi tải sản phẩm admin:', err);
  }
}

async function taiDonHangAdmin() {
  try {
    const res = await fetch(API_ORDERS);
    danhSachDonHang = await res.json();
    hienThiDonHangAdmin();
  } catch (err) {
    console.error('Lỗi tải đơn hàng admin:', err);
  }
}

async function taiKhachHangAdmin() {
  try {
    const res = await fetch(API_USERS);
    danhSachKhachHang = await res.json();
    hienThiKhachHangAdmin();
  } catch (err) {
    console.error('Lỗi tải khách hàng admin:', err);
  }
}

/**
 * Cập nhật 4 thẻ thống kê: Doanh thu, Số sản phẩm đã bán, Tồn kho, Số đơn hàng.
 */
function capNhatThongKe() {
  let tongDoanhThu = 0;
  danhSachDonHang.forEach(function (dh) {
    tongDoanhThu += Number(dh.total_amount || 0);
  });

  let tongTonKho = 0;
  danhSachSanPham.forEach(function (sp) {
    tongTonKho += Number(sp.quantity || 0);
  });

  const revEl = document.getElementById('stat-revenue');
  const soldEl = document.getElementById('stat-sold');
  const stockEl = document.getElementById('stat-stock');
  const ordEl = document.getElementById('stat-orders');

  if (revEl) revEl.textContent = dinhDangTien(tongDoanhThu);
  if (soldEl) soldEl.textContent = danhSachDonHang.length;
  if (stockEl) stockEl.textContent = tongTonKho;
  if (ordEl) ordEl.textContent = danhSachDonHang.length;
}

// ============================================================================
// 6. RENDER DỮ LIỆU RA CÁC BẢNG QUẢN TRỊ
// ============================================================================

function hienThiSanPhamAdmin() {
  const tbody = document.getElementById('admin-product-tbody');
  if (!tbody) return;

  tbody.innerHTML = danhSachSanPham.map(function (sp) {
    const hang = danhSachDanhMuc.find(function (c) { return String(c.id) === String(sp.cate_id); });
    const tenHang = hang ? hang.name : 'Chưa phân loại';

    return `
      <tr>
        <td><strong>#${sp.id}</strong></td>
        <td>
          <img src="${sp.image || 'https://picsum.photos/40/40'}" style="width: 40px; height: 40px; object-fit: contain; border-radius: 4px;" alt="${sp.name}" />
        </td>
        <td><strong>${sp.name}</strong></td>
        <td><span style="background: #e2e8f0; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${tenHang}</span></td>
        <td style="color: var(--accent); font-weight: 700;">${dinhDangTien(sp.price)}</td>
        <td>${sp.quantity || 0}</td>
        <td>
          <button class="action-btn edit" onclick="moFormSuaSanPham('${sp.id}')">
            <i class="fas fa-pen"></i> Sửa
          </button>
          <button class="action-btn delete" onclick="xoaSanPham('${sp.id}')">
            <i class="fas fa-trash"></i> Xóa
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function hienThiDanhMucAdmin() {
  const tbody = document.getElementById('admin-category-tbody');
  if (!tbody) return;

  tbody.innerHTML = danhSachDanhMuc.map(function (cat) {
    return `
      <tr>
        <td><strong>#${cat.id}</strong></td>
        <td><strong>${cat.name}</strong></td>
        <td>${cat.parent_id || '0 (Gốc)'}</td>
        <td>
          <button class="action-btn delete" onclick="xoaDanhMuc('${cat.id}')">
            <i class="fas fa-trash"></i> Xóa
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function hienThiDonHangAdmin() {
  const tbody = document.getElementById('admin-order-tbody');
  if (!tbody) return;

  tbody.innerHTML = danhSachDonHang.map(function (dh) {
    return `
      <tr>
        <td><strong>#${dh.id}</strong></td>
        <td><strong>${dh.customer_name}</strong></td>
        <td>${dh.phone}</td>
        <td style="color: var(--accent); font-weight: 700;">${dinhDangTien(dh.total_amount)}</td>
        <td>${dh.created_date}</td>
        <td><span style="background: #dcfce7; color: #15803d; padding: 3px 8px; border-radius: 4px; font-weight: 600;">${dh.status}</span></td>
      </tr>
    `;
  }).join('');
}

function hienThiKhachHangAdmin() {
  const tbody = document.getElementById('admin-user-tbody');
  if (!tbody) return;

  tbody.innerHTML = danhSachKhachHang.map(function (u, index) {
    return `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td>${u.phone}</td>
        <td><span style="background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-weight: 600;">${u.role}</span></td>
        <td>${u.address || '—'}</td>
      </tr>
    `;
  }).join('');
}

// ============================================================================
// 7. XỬ LÝ CHỌN ẢNH TỪ MÁY TÍNH BẰNG CHOOSE FILE (FILEREADER)
// ============================================================================
function xuLyChonAnhSanPham(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    hienThongBao('Vui lòng chọn một file hình ảnh hợp lệ!', true);
    event.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    anhSanPhamBase64 = e.target.result;
    const previewBox = document.getElementById('product-img-preview');
    const previewImg = document.getElementById('preview-product-thumb');
    if (previewBox && previewImg) {
      previewImg.src = anhSanPhamBase64;
      previewBox.style.display = 'flex';
    }
  };
  reader.readAsDataURL(file);
}

// ============================================================================
// 8. CÁC HÀM THAO TÁC MODAL THÊM / SỬA / XÓA SẢN PHẨM & DANH MỤC
// ============================================================================

function moFormThemSanPham() {
  idSanPhamDangSua = null;
  anhSanPhamBase64 = '';
  document.getElementById('product-form').reset();
  document.getElementById('form-product-id').value = '';
  document.getElementById('product-modal-title').textContent = 'Thêm Sản Phẩm Mới';
  document.getElementById('product-img-preview').style.display = 'none';
  document.getElementById('product-modal').classList.add('open');
}

function moFormSuaSanPham(id) {
  const sp = danhSachSanPham.find(function (item) { return String(item.id) === String(id); });
  if (!sp) return;

  idSanPhamDangSua = String(sp.id);
  anhSanPhamBase64 = sp.image || '';

  document.getElementById('product-modal-title').textContent = 'Sửa Sản Phẩm #' + sp.id;
  document.getElementById('form-product-id').value = sp.id;
  document.getElementById('form-product-name').value = sp.name;
  document.getElementById('form-product-cate').value = sp.cate_id;
  document.getElementById('form-product-price').value = sp.price;
  document.getElementById('form-product-qty').value = sp.quantity || 10;
  document.getElementById('form-product-detail').value = sp.detail || '';

  const previewBox = document.getElementById('product-img-preview');
  const previewImg = document.getElementById('preview-product-thumb');
  if (previewBox && previewImg) {
    if (anhSanPhamBase64) {
      previewImg.src = anhSanPhamBase64;
      previewBox.style.display = 'flex';
    } else {
      previewBox.style.display = 'none';
    }
  }

  document.getElementById('product-modal').classList.add('open');
}

function dongModalSanPham() {
  document.getElementById('product-modal').classList.remove('open');
  document.getElementById('product-form').reset();
  idSanPhamDangSua = null;
  anhSanPhamBase64 = '';
}

async function xuLyLuuSanPham(event) {
  event.preventDefault();

  const name = document.getElementById('form-product-name').value.trim();
  const cate_id = document.getElementById('form-product-cate').value;
  const price = Number(document.getElementById('form-product-price').value);
  const quantity = Number(document.getElementById('form-product-qty').value);
  const detail = document.getElementById('form-product-detail').value.trim();
  const image = anhSanPhamBase64 || 'https://picsum.photos/300/300';

  if (!name || price <= 0) {
    hienThongBao('Vui lòng nhập tên và giá bán lớn hơn 0!', true);
    return;
  }

  const payload = {
    name: name,
    cate_id: cate_id,
    price: price,
    quantity: quantity,
    detail: detail,
    image: image
  };

  try {
    if (idSanPhamDangSua) {
      // SỬA SẢN PHẨM (PUT)
      payload.id = idSanPhamDangSua;
      await fetch(`${API_PRODUCTS}/${idSanPhamDangSua}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      hienThongBao(`Đã cập nhật sản phẩm "${name}"!`);
    } else {
      // THÊM MỚI (POST)
      payload.id = String(Date.now());
      await fetch(API_PRODUCTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      hienThongBao(`Đã thêm mới sản phẩm "${name}"!`);
    }

    dongModalSanPham();
    taiSanPhamAdmin();
    capNhatThongKe();
  } catch (err) {
    console.error('Lỗi lưu sản phẩm:', err);
    hienThongBao('Không thể lưu sản phẩm!', true);
  }
}

async function xoaSanPham(id) {
  if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm #${id}?`)) return;

  try {
    await fetch(`${API_PRODUCTS}/${id}`, { method: 'DELETE' });
    hienThongBao(`Đã xóa sản phẩm #${id}!`);
    taiSanPhamAdmin();
    capNhatThongKe();
  } catch (err) {
    console.error('Lỗi xóa sản phẩm:', err);
    hienThongBao('Xóa sản phẩm thất bại!', true);
  }
}

// Thao tác Danh mục
function moFormThemDanhMuc() {
  document.getElementById('category-form').reset();
  document.getElementById('category-modal').classList.add('open');
}

function dongModalDanhMuc() {
  document.getElementById('category-modal').classList.remove('open');
}

async function xuLyLuuDanhMuc(event) {
  event.preventDefault();
  const name = document.getElementById('form-category-name').value.trim();
  if (!name) return;

  const payload = {
    id: String(Date.now()),
    name: name,
    parent_id: "0"
  };

  try {
    await fetch(API_CATEGORIES, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    dongModalDanhMuc();
    taiDanhMucAdmin();
    hienThongBao(`Đã thêm thương hiệu "${name}"!`);
  } catch (err) {
    console.error('Lỗi lưu danh mục:', err);
    hienThongBao('Không thể thêm danh mục!', true);
  }
}

async function xoaDanhMuc(id) {
  if (!confirm(`Bạn có chắc muốn xóa thương hiệu #${id}?`)) return;
  try {
    await fetch(`${API_CATEGORIES}/${id}`, { method: 'DELETE' });
    hienThongBao(`Đã xóa thương hiệu #${id}!`);
    taiDanhMucAdmin();
  } catch (err) {
    console.error('Lỗi xóa danh mục:', err);
  }
}

// ============================================================================
// 9. KHỞI TẠO VÀ GẮN SỰ KIỆN KHI MỞ TRANG ADMIN (INIT)
// ============================================================================
document.addEventListener('DOMContentLoaded', function () {
  // 1. Kiểm tra trạng thái đăng nhập
  kiemTraDangNhapAdmin();

  // 2. Sự kiện đăng nhập & đăng xuất
  document.getElementById('admin-login-form')?.addEventListener('submit', xuLyDangNhapAdmin);
  document.getElementById('btn-admin-logout')?.addEventListener('click', dangXuatAdmin);

  // 3. Chuyển đổi tab con trong Admin (Sản phẩm, Danh mục, Đơn hàng, Khách hàng)
  const adminTabBtns = document.querySelectorAll('.admin-tab-btn');
  const adminSubPanels = document.querySelectorAll('.admin-subpanel');
  adminTabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      adminTabBtns.forEach(function (b) { b.classList.remove('active'); });
      adminSubPanels.forEach(function (p) { p.style.display = 'none'; });

      btn.classList.add('active');
      const subtabId = btn.getAttribute('data-subtab');
      const targetSubpanel = document.getElementById(subtabId);
      if (targetSubpanel) targetSubpanel.style.display = 'block';
    });
  });

  // 4. Sự kiện Modal Sản Phẩm & Danh Mục
  document.getElementById('btn-admin-add-product')?.addEventListener('click', moFormThemSanPham);
  document.getElementById('btn-admin-add-category')?.addEventListener('click', moFormThemDanhMuc);

  document.getElementById('btn-close-product-modal')?.addEventListener('click', dongModalSanPham);
  document.getElementById('btn-cancel-product-modal')?.addEventListener('click', dongModalSanPham);
  document.getElementById('product-form')?.addEventListener('submit', xuLyLuuSanPham);

  document.getElementById('btn-close-category-modal')?.addEventListener('click', dongModalDanhMuc);
  document.getElementById('btn-cancel-category-modal')?.addEventListener('click', dongModalDanhMuc);
  document.getElementById('category-form')?.addEventListener('submit', xuLyLuuDanhMuc);

  // Chọn ảnh sản phẩm từ máy tính (Choose File)
  document.getElementById('form-product-file')?.addEventListener('change', xuLyChonAnhSanPham);
});
