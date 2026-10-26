/**
 * ============================================================================
 * 📋 MỤC LỤC CÁC HÀM & TÁC DỤNG (TABLE OF CONTENTS):
 * ----------------------------------------------------------------------------
 * 1. Tiện ích Adapter Dùng Chung (Admin View Bridge):
 *    • dinhDangTien(so)                 : Định dạng số tiền sang định dạng VNĐ (12.345.000 đ)
 *    • hienThongBao(noiDung, loai)      : Hiển thị thông báo Toast góc màn hình (success, error, warning, info)
 *    • moModal(id) / dongModal(id)      : Mở hoặc đóng hộp thoại Modal quản trị
 *
 * 2. Bảo Mật & Phân Quyền Quản Trị (RBAC Auth Guard):
 *    • kiemTraDangNhapAdmin()           : Kiểm tra vai trò admin; hiển thị màn hình đăng nhập hoặc màn hình Dashboard
 *    • dangNhapAdmin(email, matKhau)    : Xác thực tài khoản quản trị viên và lưu phiên sessionStorage/localStorage
 *    • dangXuatAdmin()                  : Đăng xuất tài khoản quản trị và xóa phiên làm việc
 *
 * 3. Tải Dữ Liệu & Điều Phối Dashboard (KPI Analytics):
 *    • taiDuLieuAdmin()                 : [BƯỚC 1-6 TẢI DỮ LIỆU] Nạp song song Danh mục, Sản phẩm, Khách hàng, Đơn hàng qua Promise.all
 *    • dienDropdownDanhMuc()            : Điền danh sách danh mục thương hiệu vào các thẻ select
 *    • tinhToanKPI()                    : Tính toán 4 chỉ số tài chính (Doanh thu, Đã bán, Tồn kho, Số đơn, Máy sắp hết)
 *    • chuyenTabAdmin(tabId)            : Điều hướng giữa 3 tab nghiệp vụ (products, orders, customers)
 *
 * 4. Quản Lý Sản Phẩm (Products CRUD Controller):
 *    • renderBangSanPham()              : Lọc theo danh mục/từ khóa, phân trang (6 máy/trang) và render bảng sản phẩm
 *    • chuyenTrangSanPhamAdmin(p)       : Chuyển sang trang số p trong bảng sản phẩm
 *    • moThemSanPham()                  : Mở Modal form thêm mới điện thoại
 *    • moSuaSanPham(idSP)               : Mở Modal form sửa thông tin sản phẩm và đổ dữ liệu cũ
 *    • luuSanPham()                     : [BƯỚC 1-6 LƯU SẢN PHẨM] Đọc ảnh FileReader, validate giá/kho, gửi POST/PUT và cập nhật bảng
 *
 * 5. Xóa Dữ Liệu An Toàn 2 Lớp (Delete Protection Guard):
 *    • xacNhanXoa(loai, id, ten)        : Kiểm tra rào chắn an ninh (chặn xóa Admin, chặn xóa đơn đã giao) và mở modal xác nhận
 *    • thucHienXoa()                    : Gửi lệnh DELETE lên JSON-Server và đồng bộ lại danh sách
 *
 * 6. Quản Lý & Điều Phối Đơn Hàng (Orders Dispatch & FSM State Machine):
 *    • doiTrangThaiDonHangTrucTiep(...) : [FSM & HOÀN KHO TỰ ĐỘNG] Cập nhật trạng thái trực tiếp trên dropdown bảng đơn hàng,
 *                                         khóa đơn đã giao thành công và tự động hoàn trả tồn kho nếu hủy đơn
 *    • renderBangDonHang()              : Lọc đơn hàng theo trạng thái, tìm kiếm theo mã/SĐT/tên và render bảng
 *    • moXemDonHang(maDon)              : Mở Modal xem chi tiết đơn hàng, danh sách sản phẩm và người nhận
 *    • capNhatTrangThaiDon()            : Cập nhật trạng thái từ trong Modal chi tiết đơn hàng
 *    • inHoaDonAdmin()                  : Gọi lệnh in hóa đơn bán hàng cho khách trực tiếp từ modal
 *
 * 7. Quản Lý Khách Hàng (Customers CRUD Controller):
 *    • renderBangKhachHang()            : Lọc theo tên/email/SĐT và render bảng danh sách khách hàng
 *    • moThemKhachHang()                : Mở Modal form thêm tài khoản thành viên mới
 *    • moSuaKhachHang(idUser)           : Mở Modal form sửa thông tin tài khoản khách hàng
 *    • luuKhachHang()                   : [BƯỚC 1-6 LƯU KHÁCH HÀNG] Validate định dạng email/SĐT, chặn trùng email, lưu POST/PATCH
 *
 * 8. Giao Diện Toàn Cục & Lắng Nghe Sự Kiện (Export & DOM Listeners):
 *    • window.adminCtrl                 : Export API các hàm quản trị cho các thuộc tính onclick trong HTML
 *    • DOMContentLoaded                 : Đăng ký toàn bộ sự kiện submit form, tìm kiếm thời gian thực và preview ảnh
 * ============================================================================
 */

// STATE & THỂ HIỆN MODEL CỦA ADMIN CONTROLLER
// ============================================================================
const API_URL = 'http://localhost:3000';
let productModel = typeof ProductModel !== 'undefined' ? new ProductModel(API_URL) : null;
let orderModel = typeof OrderModel !== 'undefined' ? new OrderModel(API_URL) : null;
let userModel = typeof UserModel !== 'undefined' ? new UserModel(API_URL) : null;

let adminUser = JSON.parse(localStorage.getItem('smartstore_user')) || JSON.parse(sessionStorage.getItem('smartstore_admin_logged')) || null;
let dsSanPham = [];
let dsDonHang = [];
let dsKhachHang = [];
let dsDanhMuc = [];
let trangHienTaiSP = 1;
let trangSanPham = 1;
const SO_SP_TRANG_ADMIN = 6;
const SO_SP_TRANG = 6;
let mucCanXoa = null;       // Đối tượng tạm thời khi bấm xóa: { loai, id, ten }
let donHangDangXem = null;  // Đơn hàng đang mở trong modal chi tiết

// ============================================================================
// TIỆN ÍCH DÙNG CHUNG (CẦU NỐI ADAPTER SANG ADMIN VIEW)
// ============================================================================
function dinhDangTien(so) {
  return window.AdminView ? window.AdminView.formatCurrency(so) : (Number(so).toLocaleString('vi-VN') + ' đ');
}

function hienThongBao(noiDung, loai = 'info') {
  window.AdminView?.showToast(noiDung, loai);
}

function moModal(id) {
  window.AdminView?.openModal(id);
}

function dongModal(id) {
  window.AdminView?.closeModal(id);
}

// ============================================================================
// BẢO MẬT & PHÂN QUYỀN ADMIN (RBAC AUTH GUARD)
// ============================================================================

/**
 * Kiểm tra phân quyền truy cập Quản trị viên (RBAC Auth Guard)
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
 * Xử lý đăng nhập tài khoản Quản trị viên
 * @param {string} email
 * @param {string} matKhau
 */
async function dangNhapAdmin(email, matKhau) {
  try {
    const emailChuan = (email || '').trim().toLowerCase();
    const mkChuan = String(matKhau || '').trim();

    if (!userModel) userModel = new UserModel(API_URL);
    const users = await userModel.fetchAllUsers();

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

/**
 * Đăng xuất tài khoản Quản trị viên và tự động chuyển về trang chủ (index.html)
 */
function dangXuatAdmin() {
  adminUser = null;
  try {
    localStorage.removeItem('smartstore_user');
    sessionStorage.removeItem('smartstore_admin_logged');
  } catch (e) {}

  hienThongBao('Đã đăng xuất tài khoản quản trị. Đang chuyển về trang chủ...', 'info');

  const inViews = typeof window !== 'undefined' && window.location.pathname.toLowerCase().includes('/views/');
  const homeUrl = inViews ? '../index.html' : 'index.html';

  setTimeout(() => {
    window.location.href = homeUrl;
  }, 250);
}

// ============================================================================
// ĐIỀU PHỐI TẢI DỮ LIỆU TỪ TẦNG MODEL & ĐẨY SANG TẦNG VIEW
// ============================================================================

/**
 * [BƯỚC 1-6 TẢI DỮ LIỆU TOÀN DIỆN] Nạp song song toàn bộ dữ liệu từ CSDL
 */
async function taiDuLieuAdmin() {
  try {
    if (!productModel) productModel = new ProductModel(API_URL);
    if (!orderModel) orderModel = new OrderModel(API_URL);
    if (!userModel) userModel = new UserModel(API_URL);

    const [cats, dataSP, users, orders] = await Promise.all([
      productModel.fetchCategories(),
      productModel.fetchAllProducts(),
      userModel.fetchAllUsers(),
      orderModel.fetchAllOrders()
    ]);

    dsDanhMuc = cats || [];
    dsSanPham = (dataSP || []).map(sp => ({
      ...sp,
      id: String(sp.id),
      categoryId: sp.categoryId || sp.cate_id || '1',
      cate_id: sp.cate_id || sp.categoryId || '1',
      stock: (sp.stock !== undefined && sp.stock !== null) ? Number(sp.stock) : (Number(sp.quantity) || 15),
      quantity: (sp.quantity !== undefined && sp.quantity !== null) ? Number(sp.quantity) : (Number(sp.stock) || 15),
      sold: Number(sp.sold) || 0
    }));
    dsKhachHang = users || [];
    dsDonHang = orders || [];

    dienDropdownDanhMuc();
    tinhToanKPI();
    chuyenTabAdmin('products');
    renderBangDonHang();
    renderBangKhachHang();
  } catch (loi) {
    console.error('Lỗi tải dữ liệu admin:', loi);
    hienThongBao('Lỗi nạp dữ liệu từ máy chủ API!', 'error');
  }
}

function dienDropdownDanhMuc() {
  window.AdminView?.populateCategoryDropdowns(dsDanhMuc);
}

/**
 * Tính toán 4 chỉ số KPI thực tế và hiển thị lên Dashboard
 */
function tinhToanKPI() {
  const doanhThu = dsDonHang
    .filter(d => d.status !== 'cancelled')
    .reduce((tong, d) => tong + (Number(d.totalAmount) || 0), 0);

  const tongDaBan = dsSanPham.reduce((tong, sp) => tong + (sp.sold || 0), 0);
  const tongTonKho = dsSanPham.reduce((tong, sp) => tong + (sp.stock || 0), 0);
  const tongDon = dsDonHang.length;
  const soMaySapHet = dsSanPham.filter(sp => (sp.stock || 0) <= 5).length;

  window.AdminView?.renderKPIs({ doanhThu, tongDaBan, tongTonKho, tongDon, soMaySapHet });
}

/**
 * Điều hướng Tab Quản Trị
 * @param {string} tabId
 */
function chuyenTabAdmin(tabId) {
  if (!tabId) return;

  window.AdminView?.switchTabUI(tabId);

  if (tabId === 'products') {
    renderBangSanPham();
  } else if (tabId === 'customers') {
    renderBangKhachHang();
  } else if (tabId === 'orders') {
    renderBangDonHang();
  }
}

// ============================================================================
// ĐIỀU PHỐI QUẢN LÝ SẢN PHẨM (PRODUCTS CRUD CONTROLLER)
// ============================================================================

/**
 * Lọc và render bảng sản phẩm kèm phân trang
 */
function renderBangSanPham() {
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

  window.AdminView?.renderProductsTable(spTrang, dsDanhMuc, trangHienTaiSP, tongSoTrang);
}

function chuyenTrangSanPhamAdmin(p) {
  trangHienTaiSP = p;
  renderBangSanPham();
}

async function moThemSanPham() {
  if (!productModel) productModel = new ProductModel(API_URL);
  let nextId = 1;
  try {
    if (productModel.getNextProductId) {
      nextId = await productModel.getNextProductId();
    } else {
      const cacIdSo = dsSanPham.map(sp => Number(sp.id)).filter(n => !isNaN(n) && n > 0);
      nextId = cacIdSo.length > 0 ? Math.max(...cacIdSo) + 1 : 1;
    }
  } catch (_e) {
    const cacIdSo = dsSanPham.map(sp => Number(sp.id)).filter(n => !isNaN(n) && n > 0);
    nextId = cacIdSo.length > 0 ? Math.max(...cacIdSo) + 1 : 1;
  }
  window.AdminView?.renderProductModal(null, nextId);
}

function moSuaSanPham(idSP) {
  const sp = dsSanPham.find(item => item.id == idSP);
  if (!sp) return;
  window.AdminView?.renderProductModal(sp);
}

// Cờ an toàn chống kích hoạt đúp (Double-Submit Protection Guard)
let dangLuuSanPham = false;

/**
 * [BƯỚC 1-6 LƯU SẢN PHẨM (THÊM HOẶC CẬP NHẬT)]
 * B1: Admin nhấn Lưu trong Modal
 * B2: Đóng gói payload, đọc ảnh Base64 FileReader, validate giá & tồn kho
 * B3: Gọi ProductModel.createProduct hoặc updateProduct
 * B4 & B5: Gửi HTTP POST/PUT lên JSON-Server và ghi db.json
 * B6: Cập nhật lại mảng dsSanPham, tính lại KPI và render lại bảng
 */
async function luuSanPham() {
  if (dangLuuSanPham) return;
  dangLuuSanPham = true;
  const btnSave = document.getElementById('btn-save-product');
  const btnSaveText = btnSave ? btnSave.innerHTML : '';
  if (btnSave) {
    btnSave.disabled = true;
    btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
  }
  const resetBtnSave = () => {
    dangLuuSanPham = false;
    if (btnSave) {
      btnSave.disabled = false;
      btnSave.innerHTML = btnSaveText || '<i class="fa-solid fa-floppy-disk"></i> Lưu Sản Phẩm';
    }
  };

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
    const file = fileInput.files[0];
    // Chuẩn hóa đường dẫn tương đối lưu vào db.json: images/ten-file (không lưu Base64)
    anh = 'images/' + file.name;

    // Thử gửi multipart/form-data lên endpoint upload (nếu backend hỗ trợ) để lưu file vào thư mục images/
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('filename', file.name);
      await fetch('/api/upload', { method: 'POST', body: formData });
    } catch (_upErr) {
      // json-server thuần lưu đường dẫn images/ vẫn hợp lệ
    }
  }

  // Chặn hoàn toàn chuỗi Base64 lọt vào db.json
  if (anh && anh.startsWith('data:image')) {
    anh = fileInput && fileInput.files && fileInput.files[0] ? 'images/' + fileInput.files[0].name : 'images/default-phone.svg';
  }

  if (!ten || !dm || isNaN(gia) || gia <= 0) {
    hienThongBao('Vui lòng điền đủ Tên, Thương hiệu và Giá bán hợp lệ (lớn hơn 0đ)!', 'error');
    resetBtnSave();
    return;
  }

  if (isNaN(kho) || kho < 0) {
    hienThongBao('Số lượng tồn kho không được là số âm!', 'warning');
    resetBtnSave();
    return;
  }

  if (giaGoc && (isNaN(giaGoc) || giaGoc <= gia)) {
    hienThongBao('Giá gốc niêm yết (nếu có) phải lớn hơn giá bán khuyến mãi!', 'warning');
    resetBtnSave();
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
    image: anh || 'images/default-phone.svg',
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
    if (!productModel) productModel = new ProductModel(API_URL);

    if (id) {
      const res = await productModel.updateProduct(id, payload);
      if (!res.success) throw new Error(res.message);
      const viTri = dsSanPham.findIndex(item => String(item.id) === String(id));
      if (viTri > -1) dsSanPham[viTri] = res.data;
      hienThongBao('Cập nhật sản phẩm thành công!', 'success');
    } else {
      // 1. Quét ID thực tế và tự tăng +1 đảm bảo duy nhất
      let nextId = 1;
      try {
        if (productModel.getNextProductId) {
          nextId = await productModel.getNextProductId();
        } else {
          const cacIdSo = dsSanPham.map(sp => Number(sp.id)).filter(n => !isNaN(n) && n > 0);
          nextId = cacIdSo.length > 0 ? Math.max(...cacIdSo) + 1 : 1;
        }
      } catch (_e) {
        const cacIdSo = dsSanPham.map(sp => Number(sp.id)).filter(n => !isNaN(n) && n > 0);
        nextId = cacIdSo.length > 0 ? Math.max(...cacIdSo) + 1 : 1;
      }

      payload.id = String(nextId);

      const res = await productModel.createProduct(payload);
      if (!res.success) throw new Error(res.message);
      
      const daCo = dsSanPham.findIndex(sp => String(sp.id) === String(res.data.id));
      if (daCo > -1) {
        dsSanPham[daCo] = res.data;
      } else {
        dsSanPham.unshift(res.data);
      }
      hienThongBao(`Thêm mới điện thoại thành công với Mã #${res.data.id}!`, 'success');
    }

    dongModal('product-modal');
    tinhToanKPI();
    renderBangSanPham();
  } catch (loi) {
    console.error(loi);
    hienThongBao('Lỗi khi lưu sản phẩm vào cơ sở dữ liệu!', 'error');
  } finally {
    resetBtnSave();
  }
}

// ============================================================================
// XÓA DỮ LIỆU AN TOÀN 2 LỚP BẢO VỆ
// ============================================================================

/**
 * Hiển thị xác nhận xóa và kiểm tra rào chắn bảo mật
 * @param {'product'|'customer'|'order'} loai
 * @param {string|number} id
 * @param {string} ten
 */
function xacNhanXoa(loai, id, ten) {
  if (loai === 'customer') {
    const userCanXoa = dsKhachHang.find(u => u.id == id);
    if (userCanXoa && userCanXoa.role === 'admin') {
      hienThongBao('Bảo mật: Không được phép xóa bất kỳ tài khoản Quản trị viên (Admin) nào!', 'error');
      return;
    }
  }

  if (loai === 'order') {
    const donCanXoa = dsDonHang.find(d => d.id == id);
    if (donCanXoa && (donCanXoa.status === 'delivered' || donCanXoa.status === 'completed')) {
      hienThongBao('An ninh: Đơn hàng đã giao thành công và chốt sổ tài chính. Không thể xóa để bảo toàn đối soát!', 'error');
      return;
    }
  }

  mucCanXoa = { loai, id, ten };
  window.AdminView?.renderDeleteModal(loai, id, ten);
}

/**
 * Thực thi lệnh xóa sau khi xác nhận ở modal
 */
async function thucHienXoa() {
  if (!mucCanXoa) return;
  const { loai, id } = mucCanXoa;

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
    if (donCanXoa && (donCanXoa.status === 'delivered' || donCanXoa.status === 'completed')) {
      hienThongBao('An ninh: Nghiêm cấm xóa đơn hàng đã giao thành công!', 'error');
      dongModal('confirm-modal');
      return;
    }
  }

  try {
    if (loai === 'product') {
      if (!productModel) productModel = new ProductModel(API_URL);
      await productModel.deleteProduct(id);
      dsSanPham = dsSanPham.filter(p => p.id != id);
      hienThongBao('Đã xóa sản phẩm khỏi cơ sở dữ liệu', 'info');
      tinhToanKPI();
      renderBangSanPham();
    } else if (loai === 'customer') {
      if (!userModel) userModel = new UserModel(API_URL);
      await userModel.deleteUser(id);
      dsKhachHang = dsKhachHang.filter(c => c.id != id);
      hienThongBao('Đã xóa tài khoản khách hàng thành công', 'info');
      renderBangKhachHang();
    } else if (loai === 'order') {
      await fetch(`${API_URL}/orders/${id}`, { method: 'DELETE' });
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

// ============================================================================
// ĐIỀU PHỐI QUẢN LÝ ĐƠN HÀNG (ORDERS DISPATCH & FSM)
// ============================================================================

/**
 * [BƯỚC 1-6 CỐT LÕI ĐƠN HÀNG: FSM STATE MACHINE & HOÀN KHO TỰ ĐỘNG]
 * B1: Admin chọn trạng thái mới trong dropdown bảng đơn hàng
 * B2: Xác thực quy tắc TMĐT (khóa bất biến nếu đã delivered, cảnh báo hoàn kho)
 * B3: Gọi orderModel.updateOrderStatus
 * B4 & B5: Gửi PATCH /orders/:id và cập nhật tồn kho PATCH /products/:id
 * B6: Cập nhật DOM, giao diện bảng, tính lại KPI
 */
async function doiTrangThaiDonHangTrucTiep(idDon, trangThaiMoi, selectEl) {
  const donCu = dsDonHang.find(d => d.id == idDon);
  if (!donCu) return;
  const trangThaiCu = donCu.status;

  if (trangThaiCu === trangThaiMoi) return;

  if (trangThaiCu === 'delivered' || trangThaiCu === 'completed') {
    hienThongBao('An ninh: Đơn hàng đã GIAO THÀNH CÔNG và đóng sổ tài chính. Không thể thay đổi trạng thái!', 'error');
    if (selectEl) selectEl.value = trangThaiCu;
    return;
  }

  const tenTrangThaiMap = {
    processing: 'Chờ xử lý',
    shipping: 'Đang giao hàng',
    delivered: 'Đã giao thành công (Chốt sổ tài chính & Bất biến)',
    cancelled: 'Đã hủy đơn (Tự động hoàn trả tồn kho)'
  };

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
    if (!orderModel) orderModel = new OrderModel(API_URL);
    if (!productModel) productModel = new ProductModel(API_URL);

    const res = await orderModel.updateOrderStatus(idDon, trangThaiMoi);
    if (!res.success) throw new Error(res.error || 'Lỗi cập nhật trạng thái đơn');
    const donCapNhat = res.order;

    const viTri = dsDonHang.findIndex(d => d.id == idDon);
    if (viTri > -1) dsDonHang[viTri] = donCapNhat;

    // Đồng bộ tồn kho: Nếu chuyển từ cancelled sang trạng thái khác -> Trừ lại kho
    if (trangThaiCu === 'cancelled' && trangThaiMoi !== 'cancelled') {
      const deductPromises = (donCapNhat.items || []).map(async item => {
        const sp = dsSanPham.find(p => p.id == item.id);
        if (sp) {
          const khoMoi = Math.max(0, (Number(sp.stock) || 0) - (Number(item.quantity) || 0));
          const daBanMoi = (Number(sp.sold) || 0) + (Number(item.quantity) || 0);
          sp.stock = khoMoi;
          sp.quantity = khoMoi;
          sp.sold = daBanMoi;
          return productModel.updateStock(item.id, khoMoi, daBanMoi);
        }
      });
      await Promise.all(deductPromises);
      renderBangSanPham();
    } else if (trangThaiCu !== 'cancelled' && trangThaiMoi === 'cancelled') {
      // Đã được OrderModel.cancelOrder tự động hoàn kho
      (donCapNhat.items || []).forEach(item => {
        const sp = dsSanPham.find(p => p.id == item.id);
        if (sp) {
          sp.stock = (Number(sp.stock) || 0) + (Number(item.quantity) || 0);
          sp.quantity = sp.stock;
          sp.sold = Math.max(0, (Number(sp.sold) || 0) - (Number(item.quantity) || 0));
        }
      });
      hienThongBao(`Đơn #${donCapNhat.orderCode} đã hủy: Tồn kho đã được hoàn trả tự động!`, 'info');
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
 * Lọc và render danh sách đơn hàng
 */
function renderBangDonHang() {
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

  ketQua.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  window.AdminView?.renderOrdersTable(ketQua);
}

function moXemDonHang(maDon) {
  const d = dsDonHang.find(item => item.orderCode === maDon || String(item.id) === String(maDon));
  if (!d) return;

  donHangDangXem = d;
  window.AdminView?.renderOrderDetailModal(d);
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

  if (trangThaiCu === 'delivered' || trangThaiCu === 'completed') {
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
    if (!orderModel) orderModel = new OrderModel(API_URL);
    if (!productModel) productModel = new ProductModel(API_URL);

    const res = await orderModel.updateOrderStatus(donHangDangXem.id, trangThaiMoi);
    if (!res.success) throw new Error(res.error || 'Lỗi cập nhật trạng thái đơn');
    const donCapNhat = res.order;

    const viTri = dsDonHang.findIndex(d => d.id == donCapNhat.id);
    if (viTri > -1) dsDonHang[viTri] = donCapNhat;

    if (trangThaiCu === 'cancelled' && trangThaiMoi !== 'cancelled') {
      const deductPromises = (donCapNhat.items || []).map(async item => {
        const sp = dsSanPham.find(p => p.id == item.id);
        if (sp) {
          const khoMoi = Math.max(0, (Number(sp.stock) || 0) - (Number(item.quantity) || 0));
          const daBanMoi = (Number(sp.sold) || 0) + (Number(item.quantity) || 0);
          sp.stock = khoMoi;
          sp.quantity = khoMoi;
          sp.sold = daBanMoi;
          return productModel.updateStock(item.id, khoMoi, daBanMoi);
        }
      });
      await Promise.all(deductPromises);
      renderBangSanPham();
    } else if (trangThaiCu !== 'cancelled' && trangThaiMoi === 'cancelled') {
      (donCapNhat.items || []).forEach(item => {
        const sp = dsSanPham.find(p => p.id == item.id);
        if (sp) {
          sp.stock = (Number(sp.stock) || 0) + (Number(item.quantity) || 0);
          sp.quantity = sp.stock;
          sp.sold = Math.max(0, (Number(sp.sold) || 0) - (Number(item.quantity) || 0));
        }
      });
      hienThongBao(`Đơn #${donCapNhat.orderCode} đã hủy: Tồn kho đã được hoàn trả tự động!`, 'info');
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

function inHoaDonAdmin(idDon) {
  let donIn = donHangDangXem;
  if (idDon) {
    donIn = dsDonHang.find(d => String(d.id) === String(idDon) || d.orderCode === idDon) || donHangDangXem;
  }
  window.AdminView?.printInvoice(donIn);
}

// ============================================================================
// ĐIỀU PHỐI QUẢN LÝ KHÁCH HÀNG (CUSTOMERS CRUD CONTROLLER)
// ============================================================================

/**
 * Lọc và hiển thị danh sách khách hàng
 */
function renderBangKhachHang() {
  const tuKhoa = (document.getElementById('admin-search-customer')?.value || '').toLowerCase().trim();

  let ketQua = [...dsKhachHang];
  if (tuKhoa !== '') {
    ketQua = ketQua.filter(c =>
      (c.fullName || c.name || '').toLowerCase().includes(tuKhoa) ||
      (c.email || '').toLowerCase().includes(tuKhoa) ||
      (c.phone || '').includes(tuKhoa)
    );
  }

  window.AdminView?.renderCustomersTable(ketQua);
}

function moThemKhachHang() {
  window.AdminView?.renderCustomerModal(null);
}

function moSuaKhachHang(idUser) {
  const c = dsKhachHang.find(item => item.id == idUser);
  if (!c) return;
  window.AdminView?.renderCustomerModal(c);
}

/**
 * [BƯỚC 1-6 LƯU KHÁCH HÀNG]
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

  if (ten.length < 2) {
    hienThongBao('Họ tên khách hàng phải có ít nhất 2 ký tự!', 'warning');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    hienThongBao('Địa chỉ email không đúng định dạng (ví dụ: user@example.com)!', 'warning');
    return;
  }

  const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
  if (!phoneRegex.test(sdt)) {
    hienThongBao('Số điện thoại không hợp lệ (ví dụ: 0912345678 hoặc +84912345678)!', 'warning');
    return;
  }

  if (!id) {
    const isDup = dsKhachHang.some(c => c.email && c.email.toLowerCase() === email.toLowerCase());
    if (isDup) {
      hienThongBao('Email này đã tồn tại trên hệ thống, vui lòng dùng email khác!', 'error');
      return;
    }
  }

  try {
    if (!userModel) userModel = new UserModel(API_URL);

    if (id) {
      const userCu = dsKhachHang.find(c => c.id == id);
      let vaiTroThucTe = vaiTroChon;

      if (userCu && userCu.role === 'admin') {
        vaiTroThucTe = 'admin';
        if (vaiTroChon !== 'admin') {
          hienThongBao('Bảo mật: Không được phép thay đổi vai trò của tài khoản Quản trị viên!', 'warning');
        }
      }

      const payload = {
        name: ten,
        fullName: ten,
        email: email,
        phone: sdt,
        address: diaChi,
        role: vaiTroThucTe
      };
      if (passMoi) payload.password = passMoi;

      const res = await userModel.updateUser(id, payload);
      if (!res.success) throw new Error(res.message);
      const viTri = dsKhachHang.findIndex(c => c.id == id);
      if (viTri > -1) dsKhachHang[viTri] = res.user;
      hienThongBao('Cập nhật tài khoản thành công!', 'success');
    } else {
      const cacIdSo = dsKhachHang.map(c => Number(c.id)).filter(n => !isNaN(n) && n > 0);
      const maxId = cacIdSo.length > 0 ? Math.max(...cacIdSo) : 0;
      const idMoi = String(maxId + 1);

      const payload = {
        id: idMoi,
        name: ten,
        fullName: ten,
        email: email,
        phone: sdt,
        address: diaChi,
        role: vaiTroChon || 'user',
        password: passMoi || '123456',
        createdAt: new Date().toISOString()
      };

      const res = await userModel.createUser(payload);
      if (!res.success) throw new Error(res.message);
      dsKhachHang.push(res.user);
      hienThongBao(`Thêm khách hàng thành công (Mã #${res.user.id})!`, 'success');
    }

    dongModal('customer-modal');
    tinhToanKPI();
    renderBangKhachHang();
  } catch (loi) {
    console.error(loi);
    hienThongBao('Lỗi khi lưu thông tin khách hàng!', 'error');
  }
}

// ============================================================================
// EXPORT CONTROLLER RA WINDOW.ADMINCTRL ĐỂ HTML ONCLICK GỌI AN TOÀN
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
  printInvoice: inHoaDonAdmin,
  logout: dangXuatAdmin,
  dangXuat: dangXuatAdmin
};

// ============================================================================
// KHỞI CHẠY KHI DOM SẴN SÀNG (DOM CONTENT LOADED)
// ============================================================================
// KHỞI CHẠY & LẮNG NGHE SỰ KIỆN GIAO DIỆN ADMIN (DOM READY ORCHESTRATOR)
// ============================================================================
const onReadyAdmin = (fn) => {
  if (typeof document === 'undefined') return;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
};

onReadyAdmin(() => {
  kiemTraDangNhapAdmin();

  // Form Đăng nhập Admin
  document.getElementById('admin-login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-login-email').value.trim();
    const pass = document.getElementById('admin-login-password').value.trim();
    dangNhapAdmin(email, pass);
  });

  // Nút Đăng xuất Admin
  document.getElementById('btn-admin-logout')?.addEventListener('click', dangXuatAdmin);
  document.getElementById('admin-logout-btn')?.addEventListener('click', dangXuatAdmin);

  // Chuyển đổi Tab điều hướng Dashboard (Products, Orders, Customers)
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

  // Tìm kiếm & Lọc Sản phẩm
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

  // Tìm kiếm & Lọc Đơn hàng
  document.getElementById('admin-search-order')?.addEventListener('input', renderBangDonHang);
  document.getElementById('admin-filter-order-status')?.addEventListener('change', renderBangDonHang);

  // Tìm kiếm Khách hàng
  document.getElementById('admin-search-customer')?.addEventListener('input', renderBangKhachHang);

  // Nút Lưu trong các Modal (Bắt cả sự kiện submit form và click nút bấm)
  document.getElementById('product-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    luuSanPham();
  });
  document.getElementById('btn-save-product')?.addEventListener('click', (e) => {
    e.preventDefault();
    luuSanPham();
  });

  document.getElementById('customer-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    luuKhachHang();
  });
  document.getElementById('btn-save-customer')?.addEventListener('click', (e) => {
    e.preventDefault();
    luuKhachHang();
  });

  document.getElementById('btn-save-order-status')?.addEventListener('click', capNhatTrangThaiDon);
  document.getElementById('btn-confirm-delete-action')?.addEventListener('click', thucHienXoa);

  // Nút Thêm Mới
  document.getElementById('btn-open-add-product')?.addEventListener('click', moThemSanPham);
  document.getElementById('btn-open-add-customer')?.addEventListener('click', moThemKhachHang);

  // Preview ảnh sản phẩm khi gõ đường dẫn hoặc chọn file
  document.getElementById('prod-image-url')?.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    const preview = document.getElementById('prod-image-preview');
    if (preview) {
      if (val) {
        preview.src = (window.baseView?.formatImageUrl ? window.baseView.formatImageUrl(val) : val);
        preview.style.display = 'block';
      } else {
        preview.src = '/images/default-phone.svg';
      }
    }
  });

  document.getElementById('prod-image-file')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      // 1. Tự động điền đường dẫn tương đối vào ô nhập URL (lưu vào db.json)
      const urlInput = document.getElementById('prod-image-url');
      if (urlInput) {
        urlInput.value = 'images/' + file.name;
      }
      // 2. Hiển thị xem trước ảnh ngay lập tức bằng Object URL
      const preview = document.getElementById('prod-image-preview');
      if (preview) {
        preview.src = URL.createObjectURL(file);
        preview.style.display = 'block';
      }
      hienThongBao(`Đã chọn ảnh: ${file.name} (Đường dẫn: images/${file.name})`, 'info');
    }
  });
});
