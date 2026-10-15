/**
 * ============================================================================
 * JAVASCRIPT BẢNG QUẢN TRỊ ADMIN (ADMIN APP - admin.js) - BẢN TỐI ƯU HIỆN ĐẠI
 * ============================================================================
 * Dự án: Website Gaming Phone (SmartStore)
 * Môn học: Lập trình JavaScript Nâng Cao (WEB2064)
 * 
 * ĐẶC ĐIỂM KIẾN TRÚC & CÔNG NGHỆ ÁP DỤNG:
 * - Chuẩn cú pháp ECMAScript 2020+ (ES6+): Arrow Functions, Destructuring, Optional Chaining (?.), Nullish Coalescing (??).
 * - Các hàm có sẵn hiện đại: Intl.NumberFormat (tiền tệ chuẩn VNĐ), Promise.all (nạp dữ liệu song song), Array.prototype.reduce (thống kê KPI chuẩn).
 * - FileReader API: Chuyển đổi tệp ảnh máy tính sang Base64 có kiểm soát kích thước tối đa (1.5MB) tránh tràn bộ nhớ CSDL.
 * - Ràng buộc toàn vẹn dữ liệu quan hệ: Ngăn chặn xóa danh mục khi vẫn còn sản phẩm con trực thuộc.
 * - Bảo mật XSS: Mã hóa an toàn mọi chuỗi ký tự hiển thị trên các bảng quản trị.
 */

// ============================================================================
// 1. CẤU HÌNH HỆ THỐNG VÀ ĐƯỜNG DẪN API (REST ENDPOINTS)
// ============================================================================
/**
 * Địa chỉ gốc của máy chủ Mock API (JSON-Server chạy trên cổng 3000).
 */
const API_BASE = 'http://localhost:3000';
const API_PRODUCTS = `${API_BASE}/products`;
const API_CATEGORIES = `${API_BASE}/categories`;
const API_ORDERS = `${API_BASE}/orders`;
const API_USERS = `${API_BASE}/users`;

/**
 * Ảnh thumbnail đại diện mặc định cho bảng quản trị khi ảnh sản phẩm bị lỗi URL.
 */
const ANH_MAC_DINH_ADMIN = 'https://picsum.photos/40/40';

// ============================================================================
// 2. BIẾN TRẠNG THÁI QUẢN TRỊ (ADMIN STATE MANAGEMENT)
// ============================================================================
let danhSachSanPham = [];      // Danh sách sản phẩm quản trị
let danhSachDanhMuc = [];      // Danh sách thương hiệu điện thoại
let danhSachDonHang = [];      // Danh sách đơn hàng từ khách
let danhSachKhachHang = [];    // Danh sách tài khoản người dùng

let idSanPhamDangSua = null;   // ID sản phẩm đang trong chế độ chỉnh sửa (null nếu thêm mới)
let anhSanPhamBase64 = '';     // Chuỗi Base64 của ảnh sản phẩm tải lên từ máy tính
let toastTimeoutAdmin = null;  // Định danh bộ đếm thời gian thông báo Toast Admin

// ============================================================================
// 3. CÁC HÀM TIỆN ÍCH DÙNG CHUNG (UTILITY FUNCTIONS)
// ============================================================================

/**
 * DOM Selector Helper ($): Rút gọn cú pháp document.getElementById và document.querySelector.
 * @param {string} selector - ID hoặc CSS Selector
 * @returns {HTMLElement|null}
 */
const $ = (selector) => {
  if (typeof selector !== 'string') return null;
  const isSimpleId = !selector.includes(' ') && !selector.includes('.') && !selector.includes('[');
  return isSimpleId ? document.getElementById(selector.replace(/^#/, '')) : document.querySelector(selector);
};

/**
 * DOM Selector All Helper ($$): Rút gọn cú pháp document.querySelectorAll.
 * @param {string} selector - CSS Selector
 * @returns {NodeListOf<HTMLElement>}
 */
const $$ = (selector) => document.querySelectorAll(selector);

/**
 * Hàm gọi API dùng chung (API Fetch Wrapper):
 * Đóng gói Fetch API, thiết lập Header JSON và xử lý lỗi mạng tập trung.
 * @param {string} url - Endpoint API
 * @param {string} [method='GET'] - Phương thức HTTP (GET, POST, PUT, DELETE)
 * @param {object|null} [data=null] - Payload dữ liệu
 * @returns {Promise<any>}
 */
const apiFetch = async (url, method = 'GET', data = null) => {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (data) options.body = JSON.stringify(data);

  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
  }
  return res.json();
};

/**
 * Phòng chống tấn công XSS bằng RegEx thay thế ký tự điều khiển thành HTML entities.
 * @param {any} str - Dữ liệu chuỗi đầu vào
 * @returns {string} Chuỗi an toàn
 */
const escapeHTML = (str) => {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Định dạng tiền tệ VNĐ chuẩn quốc tế sử dụng Intl.NumberFormat('vi-VN').
 * @param {number|string} soTien - Số tiền cần định dạng
 * @returns {string}
 */
const dinhDangTien = (soTien) => 
  new Intl.NumberFormat('vi-VN').format(Number(soTien) || 0) + ' đ';

/**
 * Hiển thị thông báo Toast góc màn hình có tự hủy hẹn giờ cũ (Debounce).
 * @param {string} noiDung - Nội dung thông báo
 * @param {boolean} [laLoi=false] - Cờ thông báo lỗi hay thành công
 */
const hienThongBao = (noiDung, laLoi = false) => {
  const toast = $('#toast');
  if (!toast) return;

  toast.textContent = noiDung;
  toast.className = `toast-notice show${laLoi ? ' error' : ''}`;

  if (toastTimeoutAdmin) clearTimeout(toastTimeoutAdmin);
  toastTimeoutAdmin = setTimeout(() => {
    toast.className = 'toast-notice';
  }, 3000);
};

// ============================================================================
// 4. MODULE XÁC THỰC & PHÂN QUYỀN ADMIN (ADMIN AUTHENTICATION)
// ============================================================================

/**
 * Kiểm tra phiên đăng nhập của Quản trị viên trong LocalStorage:
 * Nếu đã đăng nhập và có role === 'admin', mở thẳng bảng điều khiển Dashboard.
 */
const kiemTraDangNhapAdmin = () => {
  const savedAdmin = localStorage.getItem('smartstore_admin');
  const loginScreen = $('#admin-login-screen');
  const dashboardScreen = $('#admin-dashboard-screen');
  const loggedName = $('#admin-logged-name');

  if (savedAdmin) {
    try {
      const admin = JSON.parse(savedAdmin);
      if (admin?.role === 'admin') {
        if (loginScreen) loginScreen.style.display = 'none';
        if (dashboardScreen) dashboardScreen.style.display = 'block';
        if (loggedName) loggedName.textContent = admin.name;
        taiDuLieuAdmin();
        return;
      }
    } catch {
      localStorage.removeItem('smartstore_admin');
    }
  }

  if (loginScreen) loginScreen.style.display = 'flex';
  if (dashboardScreen) dashboardScreen.style.display = 'none';
};

/**
 * Xử lý biểu mẫu Đăng Nhập dành riêng cho Admin:
 * Kiểm tra tài khoản có role === 'admin' từ máy chủ.
 * @param {Event} event - Sự kiện submit form
 */
const xuLyDangNhapAdmin = async (event) => {
  event.preventDefault();
  const email = ($('#admin-email')?.value ?? '').trim().toLowerCase();
  const password = ($('#admin-password')?.value ?? '').trim();

  try {
    const users = await apiFetch(API_USERS);
    const adminUser = users.find(u => 
      u.email.toLowerCase() === email && 
      String(u.password) === password && 
      u.role === 'admin'
    );

    if (!adminUser) {
      hienThongBao('Tài khoản hoặc mật khẩu không chính xác hoặc bạn không có quyền Admin!', true);
      return;
    }

    localStorage.setItem('smartstore_admin', JSON.stringify(adminUser));
    hienThongBao('Đăng nhập Quản trị viên thành công!');
    kiemTraDangNhapAdmin();
  } catch (err) {
    console.error('Lỗi đăng nhập admin:', err);
    hienThongBao('Không thể kết nối đến máy chủ xác thực tài khoản!', true);
  }
};

/**
 * Đăng xuất tài khoản Quản trị viên.
 */
const dangXuatAdmin = () => {
  localStorage.removeItem('smartstore_admin');
  hienThongBao('Đã đăng xuất Quản trị viên.');
  kiemTraDangNhapAdmin();
};

// ============================================================================
// 5. TẢI DỮ LIỆU ĐỒNG THỜI & BÁO CÁO THỐNG KÊ (DATA & KPIS)
// ============================================================================

/**
 * Nạp đồng thời toàn bộ dữ liệu hệ thống sử dụng hàm Promise.all() hiện đại:
 * Giúp giảm tối đa thời gian chờ mạng so với việc gọi các hàm tuần tự (Sequential Await).
 */
const taiDuLieuAdmin = async () => {
  await Promise.all([
    taiDanhMucAdmin(),
    taiSanPhamAdmin(),
    taiDonHangAdmin(),
    taiKhachHangAdmin()
  ]);
  capNhatThongKe();
};

const taiDanhMucAdmin = async () => {
  try {
    danhSachDanhMuc = await apiFetch(API_CATEGORIES);
    const selectBox = $('#form-product-cate');
    if (selectBox) {
      selectBox.innerHTML = danhSachDanhMuc.map(({ id, name }) => 
        `<option value="${escapeHTML(id)}">${escapeHTML(name)}</option>`
      ).join('');
    }
    hienThiDanhMucAdmin();
  } catch (err) {
    console.error('Lỗi khi tải danh mục admin:', err);
  }
};

const taiSanPhamAdmin = async () => {
  try {
    danhSachSanPham = await apiFetch(API_PRODUCTS);
    hienThiSanPhamAdmin();
  } catch (err) {
    console.error('Lỗi khi tải sản phẩm admin:', err);
  }
};

const taiDonHangAdmin = async () => {
  try {
    danhSachDonHang = await apiFetch(API_ORDERS);
    hienThiDonHangAdmin();
  } catch (err) {
    console.error('Lỗi khi tải đơn hàng admin:', err);
  }
};

const taiKhachHangAdmin = async () => {
  try {
    danhSachKhachHang = await apiFetch(API_USERS);
    hienThiKhachHangAdmin();
  } catch (err) {
    console.error('Lỗi khi tải khách hàng admin:', err);
  }
};

/**
 * Cập nhật 4 thẻ KPI thống kê hệ thống theo thời gian thực:
 * 1. Tổng doanh thu: Tính tổng trường total_amount của tất cả đơn hàng.
 * 2. Tổng số sản phẩm đã bán: Tính tổng thực tế các món (items.quantity) hoặc items_count từ từng đơn hàng.
 * 3. Hàng tồn kho: Tính tổng trường quantity của toàn bộ các sản phẩm.
 * 4. Tổng đơn hàng: Độ dài mảng danh sách đơn hàng.
 */
const capNhatThongKe = () => {
  const tongDoanhThu = danhSachDonHang.reduce((sum, dh) => sum + (Number(dh.total_amount) || 0), 0);

  const tongDaBan = danhSachDonHang.reduce((sum, dh) => {
    if (dh.items && Array.isArray(dh.items) && dh.items.length > 0) {
      return sum + dh.items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
    }
    return sum + (Number(dh.items_count) || 0);
  }, 0);

  const tongTonKho = danhSachSanPham.reduce((sum, sp) => sum + (Number(sp.quantity) || 0), 0);
  const tongDonHang = danhSachDonHang.length;

  if ($('#stat-revenue')) $('#stat-revenue').textContent = dinhDangTien(tongDoanhThu);
  if ($('#stat-sold')) $('#stat-sold').textContent = tongDaBan;
  if ($('#stat-stock')) $('#stat-stock').textContent = tongTonKho;
  if ($('#stat-orders')) $('#stat-orders').textContent = tongDonHang;
};

// ============================================================================
// 6. MODULE HIỂN THỊ DỮ LIỆU BẢNG QUẢN TRỊ (TABLE RENDERING)
// ============================================================================

/**
 * Render bảng danh sách sản phẩm.
 */
const hienThiSanPhamAdmin = () => {
  const tbody = $('#admin-product-tbody');
  if (!tbody) return;

  tbody.innerHTML = danhSachSanPham.map((sp) => {
    const hang = danhSachDanhMuc.find(c => String(c.id) === String(sp.cate_id));
    const tenHang = hang?.name ?? 'Chưa phân loại';

    return `
      <tr>
        <td><strong>#${escapeHTML(sp.id)}</strong></td>
        <td>
          <img src="${escapeHTML(sp.image || ANH_MAC_DINH_ADMIN)}" 
               style="width: 40px; height: 40px; object-fit: contain; border-radius: 4px;" 
               alt="${escapeHTML(sp.name)}" 
               onerror="this.onerror=null;this.src='${ANH_MAC_DINH_ADMIN}';" />
        </td>
        <td><strong>${escapeHTML(sp.name)}</strong></td>
        <td><span style="background: #e2e8f0; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${escapeHTML(tenHang)}</span></td>
        <td style="color: var(--accent); font-weight: 700;">${dinhDangTien(sp.price)}</td>
        <td>${sp.quantity || 0}</td>
        <td>
          <button class="action-btn edit" onclick="moFormSuaSanPham('${escapeHTML(sp.id)}')">
            <i class="fas fa-pen"></i> Sửa
          </button>
          <button class="action-btn delete" onclick="xoaSanPham('${escapeHTML(sp.id)}')">
            <i class="fas fa-trash"></i> Xóa
          </button>
        </td>
      </tr>
    `;
  }).join('');
};

/**
 * Render bảng danh sách danh mục thương hiệu.
 */
const hienThiDanhMucAdmin = () => {
  const tbody = $('#admin-category-tbody');
  if (!tbody) return;

  tbody.innerHTML = danhSachDanhMuc.map(({ id, name, parent_id }) => `
    <tr>
      <td><strong>#${escapeHTML(id)}</strong></td>
      <td><strong>${escapeHTML(name)}</strong></td>
      <td>${escapeHTML(parent_id || '0 (Gốc)')}</td>
      <td>
        <button class="action-btn delete" onclick="xoaDanhMuc('${escapeHTML(id)}')">
          <i class="fas fa-trash"></i> Xóa
        </button>
      </td>
    </tr>
  `).join('');
};

/**
 * Render bảng danh sách đơn hàng đã tiếp nhận.
 */
const hienThiDonHangAdmin = () => {
  const tbody = $('#admin-order-tbody');
  if (!tbody) return;

  tbody.innerHTML = danhSachDonHang.map(({ id, customer_name, phone, total_amount, created_date, status }) => `
    <tr>
      <td><strong>#${escapeHTML(id)}</strong></td>
      <td><strong>${escapeHTML(customer_name)}</strong></td>
      <td>${escapeHTML(phone)}</td>
      <td style="color: var(--accent); font-weight: 700;">${dinhDangTien(total_amount)}</td>
      <td>${escapeHTML(created_date)}</td>
      <td><span style="background: #dcfce7; color: #15803d; padding: 3px 8px; border-radius: 4px; font-weight: 600;">${escapeHTML(status)}</span></td>
    </tr>
  `).join('');
};

/**
 * Render bảng danh sách tài khoản khách hàng.
 */
const hienThiKhachHangAdmin = () => {
  const tbody = $('#admin-user-tbody');
  if (!tbody) return;

  tbody.innerHTML = danhSachKhachHang.map(({ name, email, phone, role, address }, index) => `
    <tr>
      <td>${index + 1}</td>
      <td><strong>${escapeHTML(name)}</strong></td>
      <td>${escapeHTML(email)}</td>
      <td>${escapeHTML(phone)}</td>
      <td><span style="background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-weight: 600;">${escapeHTML(role)}</span></td>
      <td>${escapeHTML(address || '—')}</td>
    </tr>
  `).join('');
};

// ============================================================================
// 7. XỬ LÝ CHỌN ẢNH TỪ MÁY TÍNH (FILEREADER API)
// ============================================================================

/**
 * Đọc file ảnh từ máy tính chuyển đổi sang chuỗi Base64:
 * Sử dụng FileReader.readAsDataURL() và kiểm tra dung lượng tối đa 1.5MB để bảo vệ CSDL.
 * @param {Event} event - Sự kiện change của thẻ input file
 */
const xuLyChonAnhSanPham = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    hienThongBao('Vui lòng chọn một file hình ảnh hợp lệ!', true);
    event.target.value = '';
    return;
  }

  // Chặn tệp ảnh vượt quá 1.5MB để tránh lag ứng dụng
  if (file.size > 1.5 * 1024 * 1024) {
    hienThongBao('Ảnh quá lớn (>1.5MB)! Vui lòng chọn ảnh dung lượng nhẹ hơn.', true);
    event.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    anhSanPhamBase64 = e.target.result;
    const previewBox = $('#product-img-preview');
    const previewImg = $('#preview-product-thumb');
    if (previewBox && previewImg) {
      previewImg.src = anhSanPhamBase64;
      previewBox.style.display = 'flex';
    }
  };
  reader.readAsDataURL(file);
};

// ============================================================================
// 8. CRUD SẢN PHẨM & QUẢN LÝ MODAL (PRODUCT MANAGEMENT)
// ============================================================================

const moFormThemSanPham = () => {
  idSanPhamDangSua = null;
  anhSanPhamBase64 = '';
  $('#product-form')?.reset();
  if ($('#form-product-id')) $('#form-product-id').value = '';
  $('#product-modal-title').textContent = 'Thêm Sản Phẩm Mới';
  if ($('#product-img-preview')) $('#product-img-preview').style.display = 'none';
  $('#product-modal')?.classList.add('open');
};

const moFormSuaSanPham = (id) => {
  const sp = danhSachSanPham.find(item => String(item.id) === String(id));
  if (!sp) return;

  idSanPhamDangSua = String(sp.id);
  anhSanPhamBase64 = sp.image || '';

  $('#product-modal-title').textContent = `Sửa Sản Phẩm #${sp.id}`;
  $('#form-product-id').value = sp.id;
  $('#form-product-name').value = sp.name;
  $('#form-product-cate').value = sp.cate_id;
  $('#form-product-price').value = sp.price;
  $('#form-product-qty').value = sp.quantity || 10;
  $('#form-product-detail').value = sp.detail || '';

  const previewBox = $('#product-img-preview');
  const previewImg = $('#preview-product-thumb');
  if (previewBox && previewImg) {
    if (anhSanPhamBase64) {
      previewImg.src = anhSanPhamBase64;
      previewBox.style.display = 'flex';
    } else {
      previewBox.style.display = 'none';
    }
  }

  $('#product-modal')?.classList.add('open');
};

const dongModalSanPham = () => {
  $('#product-modal')?.classList.remove('open');
  $('#product-form')?.reset();
  idSanPhamDangSua = null;
  anhSanPhamBase64 = '';
};

/**
 * Lưu sản phẩm (Thêm mới qua POST hoặc Cập nhật qua PUT).
 * @param {Event} event - Sự kiện submit form
 */
const xuLyLuuSanPham = async (event) => {
  event.preventDefault();

  const name = $('#form-product-name')?.value.trim();
  const cate_id = $('#form-product-cate')?.value;
  const price = Number($('#form-product-price')?.value) || 0;
  const quantity = Number($('#form-product-qty')?.value) || 0;
  const detail = $('#form-product-detail')?.value.trim();
  const image = anhSanPhamBase64 || ANH_MAC_DINH_ADMIN;

  if (!name || price <= 0) {
    hienThongBao('Vui lòng nhập tên và giá bán hợp lệ lớn hơn 0!', true);
    return;
  }

  const payload = { name, cate_id, price, quantity, detail, image };

  try {
    if (idSanPhamDangSua) {
      payload.id = idSanPhamDangSua;
      await apiFetch(`${API_PRODUCTS}/${idSanPhamDangSua}`, 'PUT', payload);
      hienThongBao(`Đã cập nhật sản phẩm "${name}"!`);
    } else {
      payload.id = String(Date.now());
      await apiFetch(API_PRODUCTS, 'POST', payload);
      hienThongBao(`Đã thêm mới sản phẩm "${name}"!`);
    }

    dongModalSanPham();
    await taiSanPhamAdmin();
    capNhatThongKe();
  } catch (err) {
    console.error('Lỗi lưu sản phẩm:', err);
    hienThongBao('Không thể lưu sản phẩm, vui lòng kiểm tra server!', true);
  }
};

/**
 * Xóa một sản phẩm thông qua phương thức DELETE.
 * @param {string|number} id - ID sản phẩm
 */
const xoaSanPham = async (id) => {
  if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm #${id}?`)) return;

  try {
    await apiFetch(`${API_PRODUCTS}/${id}`, 'DELETE');
    hienThongBao(`Đã xóa sản phẩm #${id}!`);
    await taiSanPhamAdmin();
    capNhatThongKe();
  } catch (err) {
    console.error('Lỗi xóa sản phẩm:', err);
    hienThongBao('Xóa sản phẩm thất bại!', true);
  }
};

// ============================================================================
// 9. CRUD DANH MỤC THƯƠNG HIỆU (CATEGORY MANAGEMENT & INTEGRITY CHECK)
// ============================================================================

const moFormThemDanhMuc = () => {
  $('#category-form')?.reset();
  $('#category-modal')?.classList.add('open');
};

const dongModalDanhMuc = () => $('#category-modal')?.classList.remove('open');

/**
 * Thêm danh mục thương hiệu mới qua POST /categories.
 * @param {Event} event - Sự kiện submit form
 */
const xuLyLuuDanhMuc = async (event) => {
  event.preventDefault();
  const name = $('#form-category-name')?.value.trim();
  if (!name) return;

  const payload = {
    id: String(Date.now()),
    name,
    parent_id: "0"
  };

  try {
    await apiFetch(API_CATEGORIES, 'POST', payload);
    dongModalDanhMuc();
    await taiDanhMucAdmin();
    hienThongBao(`Đã thêm thương hiệu "${name}"!`);
  } catch (err) {
    console.error('Lỗi lưu danh mục:', err);
    hienThongBao('Không thể thêm danh mục!', true);
  }
};

/**
 * Xóa danh mục thương hiệu:
 * Bắt buộc kiểm tra tính toàn vẹn quan hệ (Data Integrity Constraint):
 * Nếu vẫn còn sản phẩm mang cate_id của danh mục này, hệ thống sẽ ngăn chặn việc xóa.
 * @param {string|number} id - ID danh mục
 */
const xoaDanhMuc = async (id) => {
  const sanPhamThuocDanhMuc = danhSachSanPham.filter(sp => String(sp.cate_id) === String(id));
  if (sanPhamThuocDanhMuc.length > 0) {
    hienThongBao(`Không thể xóa! Có ${sanPhamThuocDanhMuc.length} sản phẩm đang thuộc thương hiệu này. Vui lòng chuyển hoặc xóa các sản phẩm đó trước!`, true);
    return;
  }

  if (!confirm(`Bạn có chắc muốn xóa thương hiệu #${id}?`)) return;

  try {
    await apiFetch(`${API_CATEGORIES}/${id}`, 'DELETE');
    hienThongBao(`Đã xóa thương hiệu #${id}!`);
    await taiDanhMucAdmin();
  } catch (err) {
    console.error('Lỗi xóa danh mục:', err);
    hienThongBao('Không thể xóa danh mục!', true);
  }
};

// Gắn các hàm tương tác ra đối tượng Window để các nút HTML inline (onclick) gọi được
window.moFormSuaSanPham = moFormSuaSanPham;
window.xoaSanPham = xoaSanPham;
window.xoaDanhMuc = xoaDanhMuc;

// ============================================================================
// 10. KHỞI TẠO VÀ GẮN SỰ KIỆN KHI MỞ TRANG ADMIN (APPLICATION BOOTSTRAP)
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  // 1. Kiểm tra quyền hạn và trạng thái đăng nhập Admin
  kiemTraDangNhapAdmin();

  // 2. Gắn sự kiện biểu mẫu đăng nhập & đăng xuất
  $('#admin-login-form')?.addEventListener('submit', xuLyDangNhapAdmin);
  $('#btn-admin-logout')?.addEventListener('click', dangXuatAdmin);

  // 3. Chuyển đổi các tab bảng con trong Dashboard (Sản phẩm, Danh mục, Đơn hàng, Khách hàng)
  $$('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.admin-tab-btn').forEach(b => b.classList.remove('active'));
      $$('.admin-subpanel').forEach(p => p.style.display = 'none');

      btn.classList.add('active');
      const targetSubpanel = $(`#${btn.dataset.subtab}`);
      if (targetSubpanel) targetSubpanel.style.display = 'block';
    });
  });

  // 4. Sự kiện Modal Sản phẩm & Danh mục
  $('#btn-admin-add-product')?.addEventListener('click', moFormThemSanPham);
  $('#btn-admin-add-category')?.addEventListener('click', moFormThemDanhMuc);

  $('#btn-close-product-modal')?.addEventListener('click', dongModalSanPham);
  $('#btn-cancel-product-modal')?.addEventListener('click', dongModalSanPham);
  $('#product-form')?.addEventListener('submit', xuLyLuuSanPham);

  $('#btn-close-category-modal')?.addEventListener('click', dongModalDanhMuc);
  $('#btn-cancel-category-modal')?.addEventListener('click', dongModalDanhMuc);
  $('#category-form')?.addEventListener('submit', xuLyLuuDanhMuc);

  // 5. Sự kiện tải ảnh từ máy tính (FileReader)
  $('#form-product-file')?.addEventListener('change', xuLyChonAnhSanPham);
});
