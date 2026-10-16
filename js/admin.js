// ============================================================================
// PHẦN 1: CẤU HÌNH HỆ THỐNG VÀ ĐƯỜNG DẪN API (REST ENDPOINTS)
// ============================================================================

// Địa chỉ gốc của máy chủ Mock API JSON-Server (chạy cổng 3000)
const API_BASE = 'http://localhost:3000';

// Các đường dẫn API quản trị tương ứng
const API_PRODUCTS = `${API_BASE}/products`;      // Quản lý sản phẩm
const API_CATEGORIES = `${API_BASE}/categories`;  // Quản lý thương hiệu
const API_ORDERS = `${API_BASE}/orders`;          // Quản lý đơn hàng
const API_USERS = `${API_BASE}/users`;            // Quản lý người dùng

// Ảnh thay thế mặc định khi sản phẩm chưa có ảnh hoặc lỗi URL
const ANH_MAC_DINH_ADMIN = 'https://picsum.photos/50/50';

// Khóa lưu trạng thái đăng nhập của Admin vào localStorage
const KEY_ADMIN_LOGGED = 'smartstore_admin_logged';

// ============================================================================
// PHẦN 2: CÁC BIẾN QUẢN LÝ TRẠNG THÁI (ADMIN STATE MANAGEMENT)
// ============================================================================

let danhSachSanPham = [];    // Mảng lưu danh sách sản phẩm lấy từ server
let danhSachDanhMuc = [];    // Mảng lưu danh mục thương hiệu
let danhSachDonHang = [];    // Mảng lưu toàn bộ đơn đặt hàng của khách
let danhSachKhachHang = [];  // Mảng lưu danh sách tài khoản người dùng

let idSanPhamDangSua = null; // ID của sản phẩm đang được sửa (null nếu là thêm mới)
let idDanhMucDangSua = null; // ID của danh mục đang được sửa (null nếu thêm mới)
let anhSanPhamBase64 = '';   // Chuỗi ảnh dạng Base64 khi admin chọn tải ảnh từ máy tính
let timerToastAdmin = null;  // Bộ đếm thời gian cho thông báo Toast

// ============================================================================
// PHẦN 3: CÁC HÀM TIỆN ÍCH DÙNG CHUNG (UTILITIES)
// ============================================================================

/**
 * Hàm hỗ trợ lấy phần tử HTML nhanh theo ID hoặc CSS Selector ($)
 * @param {string} selector - ID hoặc chuỗi selector CSS
 * @returns {HTMLElement|null}
 */
const $ = (selector) => {
  if (typeof selector !== 'string') return null;
  const laIdDonGian = !selector.includes(' ') && !selector.includes('.') && !selector.includes('[');
  return laIdDonGian 
    ? document.getElementById(selector.replace(/^#/, '')) 
    : document.querySelector(selector);
};

/**
 * Hàm hỗ trợ lấy danh sách nhiều phần tử HTML ($$)
 * @param {string} selector - Chuỗi CSS Selector
 * @returns {NodeListOf<HTMLElement>}
 */
const $$ = (selector) => document.querySelectorAll(selector);

/**
 * Hàm gọi dữ liệu API chung (Fetch Wrapper)
 * Tác dụng: Tự động thiết lập method, header JSON, stringify dữ liệu và kiểm tra lỗi HTTP
 * @param {string} url - Đường dẫn API
 * @param {string} phuongThuc - 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'
 * @param {object|null} duLieu - Dữ liệu payload gửi lên server
 * @returns {Promise<any>}
 */
const goiApi = async (url, phuongThuc = 'GET', duLieu = null) => {
  const cauHinh = {
    method: phuongThuc,
    headers: { 'Content-Type': 'application/json' }
  };

  if (duLieu !== null) {
    cauHinh.body = JSON.stringify(duLieu);
  }

  const res = await fetch(url, cauHinh);
  if (!res.ok) {
    throw new Error(`Lỗi API (${res.status}): ${res.statusText}`);
  }
  return res.json();
};

/**
 * Hàm định dạng số tiền sang chuẩn Việt Nam Đồng (VNĐ)
 * @param {number|string} soTien - Giá trị số tiền
 * @returns {string} Chuỗi tiền đã định dạng
 */
const dinhDangTien = (soTien) => {
  const giaTri = Number(soTien) || 0;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(giaTri);
};

/**
 * Hàm làm sạch chuỗi HTML phòng chống tấn công XSS
 * @param {any} str - Chuỗi nhập từ bên ngoài
 * @returns {string}
 */
const lamSachHtml = (str) => {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Hàm hiển thị thông báo Toast góc màn hình Admin
 * @param {string} noiDung - Lời nhắn
 * @param {string} loai - 'success', 'error', 'warning', 'info'
 */
const hienThiThongBaoAdmin = (noiDung, loai = 'info') => {
  const toast = $('toast');
  if (!toast) return;

  if (timerToastAdmin) clearTimeout(timerToastAdmin);

  const bieuTuong = {
    success: '<i class="fas fa-circle-check"></i>',
    error: '<i class="fas fa-circle-xmark"></i>',
    warning: '<i class="fas fa-triangle-exclamation"></i>',
    info: '<i class="fas fa-circle-info"></i>'
  }[loai] || '<i class="fas fa-circle-info"></i>';

  toast.innerHTML = `${bieuTuong} <span>${lamSachHtml(noiDung)}</span>`;
  toast.className = `toast-notice toast-${loai} show`;

  timerToastAdmin = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
};

// ============================================================================
// PHẦN 4: THUẬT TOÁN TỰ ĐỘNG TĂNG ID SẢN PHẨM (+1) (AUTO-INCREMENT ID)
// ============================================================================

/**
 * Hàm tự động tính toán ID cho sản phẩm mới theo quy tắc TỰ ĐỘNG TĂNG +1:
 * Luồng hoạt động:
 * 1. Duyệt qua mảng danhSachSanPham hiện tại bằng hàm .map().
 * 2. Chuyển đổi thuộc tính sp.id sang số nguyên bằng parseInt(sp.id, 10).
 * 3. Lọc bỏ các giá trị không phải số (NaN) bằng hàm .filter().
 * 4. Tìm số ID lớn nhất trong mảng bằng toán tử Spread (...): Math.max(...danhSachIdSo).
 * 5. Nếu chưa có sản phẩm nào (mảng rỗng) thì ID lớn nhất là 0.
 * 6. ID mới = ID lớn nhất + 1.
 * 7. Trả về ID mới dưới dạng chuỗi (String) để chuẩn hóa theo chuẩn REST API của JSON-Server.
 * 
 * Ví dụ: Các ID hiện tại là ["1", "2", "3", "5"] -> max là 5 -> ID mới sẽ là "6".
 * 
 * @returns {string} Chuỗi ID tự động tăng mới
 */
const taoIdSanPhamMoi = () => {
  // Lấy danh sách các ID số hợp lệ
  const danhSachIdSo = danhSachSanPham
    .map(sp => parseInt(sp.id, 10))
    .filter(id => !isNaN(id) && id > 0);

  // Tìm ID lớn nhất hiện tại
  const idLonNhat = danhSachIdSo.length > 0 ? Math.max(...danhSachIdSo) : 0;

  // Cộng thêm 1 để ra ID sản phẩm tiếp theo
  const idMoi = idLonNhat + 1;

  // Trả về dạng chuỗi
  return String(idMoi);
};

// ============================================================================
// PHẦN 5: KIỂM TRA ĐĂNG NHẬP VÀ KHỞI TẠO DỮ LIỆU ADMIN DASHBOARD
// ============================================================================

/**
 * Kiểm tra xem người dùng đã đăng nhập tài khoản quản trị Admin hay chưa
 * Đồng thời tự động đồng bộ phiên từ giao diện User (smartstore_user)
 */
const kiemTraDangNhapAdmin = () => {
  // 1. Đồng bộ phiên đăng nhập từ giao diện User:
  // Nếu localStorage đã có smartstore_user với role === 'admin' hoặc email là admin@smartstore.vn,
  // hệ thống sẽ tự động xác nhận quyền Admin mà không bắt đăng nhập lại thủ công.
  try {
    const userDaLuu = localStorage.getItem('smartstore_user');
    if (userDaLuu) {
      const user = JSON.parse(userDaLuu);
      if (user && (user.role === 'admin' || user.email === 'admin@smartstore.vn')) {
        localStorage.setItem(KEY_ADMIN_LOGGED, 'true');
      }
    }
  } catch (e) {
    console.error('Lỗi đọc smartstore_user:', e);
  }

  const adminDaDangNhap = localStorage.getItem(KEY_ADMIN_LOGGED);
  const manHinhDangNhap = $('admin-login-screen');
  const manHinhDashboard = $('admin-dashboard-screen');

  if (adminDaDangNhap === 'true') {
    if (manHinhDangNhap) manHinhDangNhap.style.display = 'none';
    if (manHinhDashboard) manHinhDashboard.style.display = 'block';

    // Hiển thị tên Admin trên thanh Header
    try {
      const user = JSON.parse(localStorage.getItem('smartstore_user') || '{}');
      if ($('admin-logged-name')) {
        $('admin-logged-name').textContent = user.name ? `${user.name} (Admin)` : 'Quản Trị Viên (Admin)';
      }
    } catch (e) {}

    taiToanBoDuLieuAdmin();
  } else {
    if (manHinhDangNhap) manHinhDangNhap.style.display = 'flex';
    if (manHinhDashboard) manHinhDashboard.style.display = 'none';
  }
};

/**
 * Tải toàn bộ dữ liệu quản trị từ máy chủ (Sản phẩm, Danh mục, Đơn hàng, Khách hàng)
 * Sử dụng Promise.all để gọi đồng thời 4 API, giúp trang tải nhanh nhất có thể.
 */
const taiToanBoDuLieuAdmin = async () => {
  try {
    const [duLieuSP, duLieuDM, duLieuDH, duLieuKH] = await Promise.all([
      goiApi(API_PRODUCTS),
      goiApi(API_CATEGORIES),
      goiApi(API_ORDERS),
      goiApi(API_USERS)
    ]);

    danhSachSanPham = Array.isArray(duLieuSP) ? duLieuSP : [];
    danhSachDanhMuc = Array.isArray(duLieuDM) ? duLieuDM : [];
    danhSachDonHang = Array.isArray(duLieuDH) ? duLieuDH : [];
    danhSachKhachHang = Array.isArray(duLieuKH) ? duLieuKH : [];

    // Cập nhật các bảng và các chỉ số thống kê
    capNhatThongKeKPI();
    napDanhMucVaoSelectForm();
    hienThiBangSanPhamAdmin();
    hienThiBangDanhMucAdmin();
    hienThiBangDonHangAdmin();
    hienThiBangKhachHangAdmin();

  } catch (loi) {
    console.error('Lỗi khi tải dữ liệu Admin:', loi);
    hienThiThongBaoAdmin('Không thể tải dữ liệu từ JSON-Server! Vui lòng kiểm tra cổng 3000.', 'error');
  }
};

/**
 * Hàm tính toán và hiển thị các số liệu thống kê KPI (Báo cáo doanh thu, sản phẩm)
 * Luồng hoạt động:
 * 1. Tổng doanh thu: Tính tổng tiền từ các đơn hàng (loại trừ đơn hàng 'Đã hủy').
 * 2. Sản phẩm đã bán: Đếm tổng số lượng món hàng từ các đơn hàng hợp lệ.
 * 3. Hàng tồn kho: Tính tổng trường quantity của tất cả sản phẩm.
 * 4. Tổng đơn hàng: Đếm tổng số lượng đơn hàng trong hệ thống.
 */
const capNhatThongKeKPI = () => {
  // Lọc ra các đơn hàng hợp lệ (không bị hủy)
  const donHangHopLe = danhSachDonHang.filter(don => don.status !== 'Đã hủy');

  // 1. Tính tổng doanh thu bằng hàm .reduce()
  const tongDoanhThu = donHangHopLe.reduce((tong, don) => {
    const gia = Number(don.total_price != null ? don.total_price : don.total_amount) || 0;
    return tong + gia;
  }, 0);

  // 2. Tính tổng số sản phẩm đã bán ra
  const tongDaBan = donHangHopLe.reduce((tong, don) => {
    if (Array.isArray(don.items) && don.items.length > 0) {
      return tong + don.items.reduce((sub, item) => sub + (Number(item.quantity) || 0), 0);
    }
    return tong + (Number(don.items_count) || 1);
  }, 0);

  // 3. Tính tổng lượng hàng tồn kho hiện có
  const tongTonKho = danhSachSanPham.reduce((tong, sp) => tong + (Number(sp.quantity) || 0), 0);

  // 4. Tổng số đơn hàng
  const tongDonHang = danhSachDonHang.length;

  // Cập nhật lên các thẻ HTML
  if ($('stat-revenue')) $('stat-revenue').textContent = dinhDangTien(tongDoanhThu);
  if ($('stat-sold')) $('stat-sold').textContent = tongDaBan.toLocaleString('vi-VN');
  if ($('stat-stock')) $('stat-stock').textContent = tongTonKho.toLocaleString('vi-VN');
  if ($('stat-orders')) $('stat-orders').textContent = tongDonHang.toLocaleString('vi-VN');
};

/**
 * Đổ danh mục thương hiệu vào các ô select trên form sản phẩm và bộ lọc
 */
const napDanhMucVaoSelectForm = () => {
  const selectCateForm = $('form-product-cate');
  const selectFilterCate = $('admin-filter-category');

  let optForm = '<option value="">-- Chọn thương hiệu --</option>';
  let optFilter = '<option value="">Tất cả thương hiệu</option>';

  danhSachDanhMuc.forEach(dm => {
    optForm += `<option value="${lamSachHtml(dm.id)}">${lamSachHtml(dm.name)}</option>`;
    optFilter += `<option value="${lamSachHtml(dm.id)}">${lamSachHtml(dm.name)}</option>`;
  });

  if (selectCateForm) selectCateForm.innerHTML = optForm;
  if (selectFilterCate) selectFilterCate.innerHTML = optFilter;
};

// ============================================================================
// PHẦN 6: QUẢN LÝ SẢN PHẨM (CRUD SẢN PHẨM - CREATE, READ, UPDATE, DELETE)
// ============================================================================

/**
 * READ: Hàm hiển thị bảng danh sách sản phẩm quản trị (kèm tìm kiếm & lọc hãng)
 */
const hienThiBangSanPhamAdmin = () => {
  const tbody = $('admin-product-tbody');
  if (!tbody) return;

  // Lấy từ khóa tìm kiếm và hãng đang lọc
  const tuKhoa = ($('admin-search-product')?.value || '').trim().toLowerCase();
  const maDanhMuc = $('admin-filter-category')?.value || '';

  // Lọc sản phẩm
  const sanPhamDaLoc = danhSachSanPham.filter(sp => {
    const ten = (sp.name || '').toLowerCase();
    const thoaManTen = tuKhoa === '' || ten.includes(tuKhoa);
    const maDanhMucSP = sp.cate_id || sp.category_id || '';
    const thoaManHang = maDanhMuc === '' || String(maDanhMucSP) === String(maDanhMuc);
    return thoaManTen && thoaManHang;
  });

  if (sanPhamDaLoc.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 30px; color: #64748b;">
          Không tìm thấy sản phẩm nào phù hợp!
        </td>
      </tr>
    `;
    return;
  }

  // Render các dòng của bảng bằng .map()
  const chuoiHtml = sanPhamDaLoc.map(sp => {
    const maDanhMucSP = sp.cate_id || sp.category_id || '';
    const danhMuc = danhSachDanhMuc.find(dm => String(dm.id) === String(maDanhMucSP));
    const tenHang = danhMuc ? danhMuc.name : 'Chưa phân loại';
    const tonKho = Number(sp.quantity) || 0;

    return `
      <tr>
        <td style="font-weight: 700; color: #2563eb;">#${lamSachHtml(sp.id)}</td>
        <td>
          <img 
            src="${lamSachHtml(sp.image || ANH_MAC_DINH_ADMIN)}" 
            alt="${lamSachHtml(sp.name)}" 
            style="width: 45px; height: 45px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0;"
            onerror="this.onerror=null; this.src='${ANH_MAC_DINH_ADMIN}';"
          />
        </td>
        <td style="font-weight: 600; color: #1e293b;">${lamSachHtml(sp.name)}</td>
        <td><span class="badge" style="background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${lamSachHtml(tenHang)}</span></td>
        <td style="font-weight: 600; color: #0f172a;">${dinhDangTien(sp.price)}</td>
        <td>
          <span style="font-weight: 700; color: ${tonKho > 0 ? '#16a34a' : '#dc2626'};">
            ${tonKho} máy
          </span>
        </td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button 
              type="button" 
              class="btn-primary" 
              style="padding: 5px 10px; font-size: 12px;" 
              onclick="suaSanPham('${sp.id}')"
              title="Chỉnh sửa sản phẩm"
            >
              <i class="fas fa-pen-to-square"></i> Sửa
            </button>
            <button 
              type="button" 
              class="btn-secondary" 
              style="padding: 5px 10px; font-size: 12px; background: #fee2e2; color: #b91c1c; border-color: #fecaca;" 
              onclick="xoaSanPham('${sp.id}')"
              title="Xóa sản phẩm"
            >
              <i class="fas fa-trash"></i> Xóa
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tbody.innerHTML = chuoiHtml;
};

/**
 * CREATE: Hàm mở modal thêm sản phẩm mới
 * Đặt idSanPhamDangSua = null và reset trắng form
 */
const moModalThemSanPham = () => {
  idSanPhamDangSua = null;
  anhSanPhamBase64 = '';

  const modal = $('product-modal');
  const title = $('product-modal-title');
  const form = $('product-form');
  const preview = $('product-img-preview');

  if (title) title.textContent = 'Thêm Sản Phẩm Mới (ID Tự Động Tăng)';
  if (form) form.reset();
  if (preview) preview.style.display = 'none';

  if (modal) modal.classList.add('open');
};

/**
 * UPDATE: Hàm mở modal chỉnh sửa sản phẩm
 * Điền sẵn dữ liệu cũ của sản phẩm vào form để admin chỉnh sửa
 * @param {string|number} sanPhamId - ID sản phẩm cần sửa
 */
const suaSanPham = (sanPhamId) => {
  const sp = danhSachSanPham.find(item => String(item.id) === String(sanPhamId));
  if (!sp) {
    hienThiThongBaoAdmin('Không tìm thấy thông tin sản phẩm!', 'error');
    return;
  }

  idSanPhamDangSua = sp.id;
  anhSanPhamBase64 = sp.image || '';

  const modal = $('product-modal');
  const title = $('product-modal-title');

  if (title) title.textContent = `Chỉnh Sửa Sản Phẩm (#${sp.id})`;

  // Điền dữ liệu vào form
  if ($('form-product-name')) $('form-product-name').value = sp.name || '';
  if ($('form-product-cate')) $('form-product-cate').value = sp.cate_id || sp.category_id || '';
  if ($('form-product-price')) $('form-product-price').value = sp.price || '';
  if ($('form-product-qty')) $('form-product-qty').value = sp.quantity || 0;
  if ($('form-product-detail')) $('form-product-detail').value = sp.detail || '';

  // Hiển thị ảnh xem trước
  const previewBox = $('product-img-preview');
  const thumbImg = $('preview-product-thumb');
  if (previewBox && thumbImg) {
    if (sp.image) {
      thumbImg.src = sp.image;
      previewBox.style.display = 'flex';
    } else {
      previewBox.style.display = 'none';
    }
  }

  if (modal) modal.classList.add('open');
};
window.suaSanPham = suaSanPham;

/**
 * DELETE: Hàm xóa sản phẩm
 * Xác nhận với người dùng trước khi gửi yêu cầu DELETE lên máy chủ
 * @param {string|number} sanPhamId - ID sản phẩm cần xóa
 */
const xoaSanPham = async (sanPhamId) => {
  const sp = danhSachSanPham.find(item => String(item.id) === String(sanPhamId));
  const tenSP = sp ? sp.name : `ID #${sanPhamId}`;

  const xacNhan = confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${tenSP}" không?\nHành động này không thể hoàn tác!`);
  if (!xacNhan) return;

  try {
    // Gửi yêu cầu DELETE lên máy chủ
    await goiApi(`${API_PRODUCTS}/${sanPhamId}`, 'DELETE');

    // Cập nhật lại mảng dữ liệu local bằng hàm .filter()
    danhSachSanPham = danhSachSanPham.filter(item => String(item.id) !== String(sanPhamId));

    // Làm mới bảng và thống kê
    hienThiBangSanPhamAdmin();
    capNhatThongKeKPI();

    hienThiThongBaoAdmin(`Đã xóa sản phẩm "${tenSP}" thành công!`, 'success');

  } catch (loi) {
    console.error('Lỗi khi xóa sản phẩm:', loi);
    hienThiThongBaoAdmin('Không thể xóa sản phẩm. Vui lòng thử lại!', 'error');
  }
};
window.xoaSanPham = xoaSanPham;

/**
 * CREATE & UPDATE: Hàm xử lý nộp form sản phẩm (#product-form)
 * Luồng hoạt động:
 * - Nếu idSanPhamDangSua === null: Thêm mới sản phẩm với ID TỰ TĂNG (+1) bằng hàm taoIdSanPhamMoi().
 * - Nếu idSanPhamDangSua !== null: Cập nhật sản phẩm cũ bằng phương thức PUT/PATCH.
 */
const xuLyLuuSanPham = async (suKien) => {
  suKien.preventDefault();

  const name = ($('form-product-name')?.value || '').trim();
  const category_id = ($('form-product-cate')?.value || '').trim();
  const price = Number($('form-product-price')?.value) || 0;
  const quantity = Number($('form-product-qty')?.value) || 0;
  const detail = ($('form-product-detail')?.value || '').trim();

  if (!name || !category_id || price <= 0) {
    hienThiThongBaoAdmin('Vui lòng nhập đầy đủ tên, hãng và giá sản phẩm hợp lệ!', 'warning');
    return;
  }

  const nutLuu = $('btn-submit-product');
  if (nutLuu) {
    nutLuu.disabled = true;
    nutLuu.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';
  }

  try {
    if (idSanPhamDangSua === null) {
      // ===== 1. CHẾ ĐỘ THÊM MỚI (CREATE): TỰ ĐỘNG TĂNG ID (+1) =====
      const idMoi = taoIdSanPhamMoi();

      const sanPhamMoi = {
        id: idMoi,
        name,
        cate_id: category_id,
        category_id,
        price,
        quantity,
        detail,
        image: anhSanPhamBase64 || ANH_MAC_DINH_ADMIN
      };

      // Gửi POST lên server
      const spDaTao = await goiApi(API_PRODUCTS, 'POST', sanPhamMoi);
      danhSachSanPham.push(spDaTao);

      hienThiThongBaoAdmin(`Đã thêm sản phẩm "${name}" thành công với ID #${idMoi}!`, 'success');

    } else {
      // ===== 2. CHẾ ĐỘ CẬP NHẬT (UPDATE): SỬA SẢN PHẨM CŨ =====
      const sanPhamCapNhat = {
        name,
        cate_id: category_id,
        category_id,
        price,
        quantity,
        detail,
        image: anhSanPhamBase64 || ANH_MAC_DINH_ADMIN
      };

      // Gửi PATCH lên server
      const spDaSua = await goiApi(`${API_PRODUCTS}/${idSanPhamDangSua}`, 'PATCH', sanPhamCapNhat);

      // Cập nhật lại trong mảng local
      const viTri = danhSachSanPham.findIndex(item => String(item.id) === String(idSanPhamDangSua));
      if (viTri !== -1) {
        danhSachSanPham[viTri] = { ...danhSachSanPham[viTri], ...spDaSua };
      }

      hienThiThongBaoAdmin(`Đã cập nhật sản phẩm "${name}" thành công!`, 'success');
    }

    // Đóng modal và làm mới giao diện
    $('product-modal')?.classList.remove('open');
    hienThiBangSanPhamAdmin();
    capNhatThongKeKPI();

  } catch (loi) {
    console.error('Lỗi khi lưu sản phẩm:', loi);
    hienThiThongBaoAdmin('Có lỗi xảy ra khi lưu sản phẩm!', 'error');
  } finally {
    if (nutLuu) {
      nutLuu.disabled = false;
      nutLuu.innerHTML = 'Lưu sản phẩm';
    }
  }
};

/**
 * Hàm đọc tệp ảnh máy tính được chọn từ thẻ <input type="file"> và chuyển sang Base64
 * Sử dụng FileReader API có sẵn của trình duyệt
 */
const xuLyChonAnhTuMay = (suKien) => {
  const tep = suKien.target.files?.[0];
  if (!tep) return;

  // Kiểm tra kích thước tệp ảnh (giới hạn tối đa 1.5MB tránh làm phình db.json)
  if (tep.size > 1.5 * 1024 * 1024) {
    hienThiThongBaoAdmin('Kích thước ảnh quá lớn (vượt quá 1.5MB)! Vui lòng chọn ảnh nhẹ hơn.', 'warning');
    suKien.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    anhSanPhamBase64 = e.target.result; // Chuỗi Base64 data:image/...
    const previewBox = $('product-img-preview');
    const thumbImg = $('preview-product-thumb');
    if (previewBox && thumbImg) {
      thumbImg.src = anhSanPhamBase64;
      previewBox.style.display = 'flex';
    }
  };
  reader.readAsDataURL(tep);
};

// ============================================================================
// PHẦN 7: QUẢN LÝ ĐƠN HÀNG (ORDER MANAGEMENT & STATUSES & DETAIL MODAL)
// ============================================================================

/**
 * Hàm hiển thị bảng quản lý đơn hàng của Admin (#admin-tab-orders)
 * Luồng hoạt động:
 * 1. Duyệt qua mảng danhSachDonHang (sắp xếp mới nhất lên đầu).
 * 2. Cột Trạng thái: Render một ô chọn <select class="order-status-select"> gồm các lựa chọn:
 *    - "Đang xử lý"
 *    - "Đang giao hàng"
 *    - "Đã giao hàng"
 *    - "Đã hủy"
 * 3. Khi Admin đổi lựa chọn, tự động gọi hàm doiTrangThaiDonHang() để cập nhật ngay vào db.json.
 * 4. Cột Hành động: Có nút xem Chi tiết đơn hàng và nút Xóa đơn hàng.
 */
const hienThiBangDonHangAdmin = () => {
  const tbody = $('admin-order-tbody');
  if (!tbody) return;

  if (danhSachDonHang.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 30px; color: #64748b;">
          Hiện tại chưa có đơn đặt hàng nào trong hệ thống!
        </td>
      </tr>
    `;
    return;
  }

  // Đảo ngược mảng để đơn hàng mới nhất hiển thị trên cùng
  const danhSachDaoNguoc = [...danhSachDonHang].reverse();

  const chuoiHtml = danhSachDaoNguoc.map(don => {
    const maDon = don.order_code || don.id || '#SMARTSTORE';
    const ngayTao = don.created_at || don.created_date;
    const thoiGian = ngayTao ? new Date(ngayTao).toLocaleString('vi-VN') : '—';
    const sdt = don.customer_phone || don.phone || '—';
    const tongTien = Number(don.total_price != null ? don.total_price : don.total_amount) || 0;
    const trangThaiHienTai = don.status || 'Đang xử lý';

    // Tạo các tùy chọn cho thẻ select trạng thái
    const cacTrangThai = ['Đang xử lý', 'Đang giao hàng', 'Đã giao hàng', 'Đã hủy'];
    const optTrangThai = cacTrangThai.map(tt => `
      <option value="${tt}" ${tt === trangThaiHienTai ? 'selected' : ''}>${tt}</option>
    `).join('');

    return `
      <tr>
        <td style="font-weight: 700; color: #2563eb; letter-spacing: 0.5px;">${lamSachHtml(maDon)}</td>
        <td style="font-weight: 600; color: #1e293b;">${lamSachHtml(don.customer_name || 'Khách vãng lai')}</td>
        <td>${lamSachHtml(sdt)}</td>
        <td style="font-weight: 700; color: #ef4444;">${dinhDangTien(tongTien)}</td>
        <td style="font-size: 13px; color: #64748b;">${thoiGian}</td>
        <td>
          <select 
            class="order-status-select" 
            onchange="doiTrangThaiDonHang('${don.id}', this.value)"
            title="Nhấn để đổi trạng thái đơn hàng"
          >
            ${optTrangThai}
          </select>
        </td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button 
              type="button" 
              class="btn-primary" 
              style="padding: 5px 10px; font-size: 12px;" 
              onclick="xemChiTietDonHangAdmin('${don.id}')"
              title="Xem các món hàng đã mua"
            >
              <i class="fas fa-eye"></i> Chi tiết
            </button>
            <button 
              type="button" 
              class="btn-secondary" 
              style="padding: 5px 10px; font-size: 12px; background: #fee2e2; color: #b91c1c; border-color: #fecaca;" 
              onclick="xoaDonHangAdmin('${don.id}')"
              title="Xóa đơn hàng"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tbody.innerHTML = chuoiHtml;
};

/**
 * Hàm cập nhật trạng thái đơn hàng trực tiếp bằng HTTP PATCH lên máy chủ
 * Luồng hoạt động:
 * 1. Nhận ID đơn hàng và trạng thái mới được chọn từ ô select ('Đang xử lý', 'Đang giao hàng', 'Đã giao hàng', 'Đã hủy').
 * 2. Gửi PATCH lên API_ORDERS/${donHangId} với { status: trangThaiMoi }.
 * 3. Cập nhật lại thuộc tính status trong mảng danhSachDonHang.
 * 4. Cập nhật lại các số liệu thống kê KPI doanh thu.
 * 5. Hiển thị thông báo Toast xanh báo thành công.
 * 
 * @param {string|number} donHangId - ID của đơn hàng
 * @param {string} trangThaiMoi - Trạng thái mới
 */
const doiTrangThaiDonHang = async (donHangId, trangThaiMoi) => {
  const donHang = danhSachDonHang.find(don => String(don.id) === String(donHangId));
  if (!donHang) return;

  const maDon = donHang.order_code || donHang.id;

  try {
    // Gửi yêu cầu PATCH cập nhật trạng thái lên server
    await goiApi(`${API_ORDERS}/${donHangId}`, 'PATCH', { status: trangThaiMoi });

    // Cập nhật lại dữ liệu local
    donHang.status = trangThaiMoi;

    // Cập nhật lại KPI
    capNhatThongKeKPI();

    hienThiThongBaoAdmin(`Đã cập nhật trạng thái đơn ${maDon} thành "${trangThaiMoi}"!`, 'success');

  } catch (loi) {
    console.error('Lỗi khi cập nhật trạng thái đơn hàng:', loi);
    hienThiThongBaoAdmin('Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại!', 'error');
    // Làm mới lại bảng để quay về trạng thái cũ
    hienThiBangDonHangAdmin();
  }
};
window.doiTrangThaiDonHang = doiTrangThaiDonHang;

/**
 * Hàm xem chi tiết các món hàng và địa chỉ giao hàng của đơn hàng trong Modal
 * @param {string|number} donHangId - ID đơn hàng cần xem
 */
const xemChiTietDonHangAdmin = (donHangId) => {
  const donHang = danhSachDonHang.find(don => String(don.id) === String(donHangId));
  if (!donHang) {
    hienThiThongBaoAdmin('Không tìm thấy thông tin đơn hàng!', 'error');
    return;
  }

  const modal = $('admin-order-modal');
  const title = $('admin-order-modal-title');
  const content = $('admin-order-detail-content');

  const maDon = donHang.order_code || donHang.id || '#SMARTSTORE';
  const ngayTao = donHang.created_at || donHang.created_date;
  const thoiGian = ngayTao ? new Date(ngayTao).toLocaleString('vi-VN') : '—';
  const sdt = donHang.customer_phone || donHang.phone || '—';
  const diaChi = donHang.shipping_address || donHang.address || '—';
  const tongTien = Number(donHang.total_price != null ? donHang.total_price : donHang.total_amount) || 0;

  if (title) title.textContent = `Chi Tiết Đơn Hàng ${maDon}`;

  // Tạo danh sách các món hàng
  let chuoiCacMon = '';
  if (Array.isArray(donHang.items) && donHang.items.length > 0) {
    chuoiCacMon = donHang.items.map(item => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px dashed #e2e8f0;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <img 
            src="${lamSachHtml(item.image || ANH_MAC_DINH_ADMIN)}" 
            alt="${lamSachHtml(item.product_name || item.name || 'Điện thoại')}" 
            style="width: 45px; height: 45px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0;"
            onerror="this.onerror=null; this.src='${ANH_MAC_DINH_ADMIN}';"
          />
          <div>
            <strong style="color: #1e293b; font-size: 0.95rem;">${lamSachHtml(item.product_name || item.name || 'Điện thoại')}</strong>
            <div style="font-size: 0.85rem; color: #64748b;">Số lượng: x${item.quantity} • Đơn giá: ${dinhDangTien(item.price)}</div>
          </div>
        </div>
        <strong style="color: #0f172a; font-size: 1rem;">${dinhDangTien(item.price * item.quantity)}</strong>
      </div>
    `).join('');
  } else {
    chuoiCacMon = '<p style="color: #64748b; font-style: italic;">Không có thông tin chi tiết sản phẩm.</p>';
  }

  if (content) {
    content.innerHTML = `
      <div style="background: #f8fafc; padding: 14px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #e2e8f0; font-size: 0.9rem;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px;">
          <div><strong>Khách hàng:</strong> ${lamSachHtml(donHang.customer_name || '—')}</div>
          <div><strong>Số điện thoại:</strong> ${lamSachHtml(sdt)}</div>
          <div><strong>Email:</strong> ${lamSachHtml(donHang.customer_email || '—')}</div>
          <div><strong>Ngày đặt:</strong> ${thoiGian}</div>
        </div>
        <div style="margin-top: 6px;"><strong>Địa chỉ giao hàng:</strong> ${lamSachHtml(diaChi)}</div>
        <div style="margin-top: 6px;"><strong>Trạng thái hiện tại:</strong> <span class="badge" style="background: #dbeafe; color: #1d4ed8; padding: 2px 8px; border-radius: 4px;">${lamSachHtml(donHang.status || 'Đang xử lý')}</span></div>
      </div>

      <h4 style="font-size: 1rem; color: #1e293b; margin-bottom: 10px;"><i class="fas fa-boxes-stacked"></i> Danh Sách Sản Phẩm Đã Mua:</h4>
      <div style="max-height: 250px; overflow-y: auto; padding-right: 6px;">
        ${chuoiCacMon}
      </div>

      <div style="display: flex; justify-content: flex-end; align-items: center; gap: 10px; margin-top: 16px; padding-top: 12px; border-top: 2px solid #e2e8f0;">
        <span style="font-size: 1rem; color: #64748b;">Tổng cộng thanh toán:</span>
        <strong style="font-size: 1.3rem; color: #ef4444;">${dinhDangTien(tongTien)}</strong>
      </div>
    `;
  }

  if (modal) modal.classList.add('open');
};
window.xemChiTietDonHangAdmin = xemChiTietDonHangAdmin;

/**
 * Hàm xóa đơn hàng
 * @param {string|number} donHangId - ID đơn hàng cần xóa
 */
const xoaDonHangAdmin = async (donHangId) => {
  const don = danhSachDonHang.find(item => String(item.id) === String(donHangId));
  const maDon = don ? (don.order_code || don.id) : `#${donHangId}`;

  const xacNhan = confirm(`Bạn có chắc chắn muốn xóa đơn hàng ${maDon} không?`);
  if (!xacNhan) return;

  try {
    await goiApi(`${API_ORDERS}/${donHangId}`, 'DELETE');
    danhSachDonHang = danhSachDonHang.filter(item => String(item.id) !== String(donHangId));

    hienThiBangDonHangAdmin();
    capNhatThongKeKPI();

    hienThiThongBaoAdmin(`Đã xóa đơn hàng ${maDon} thành công!`, 'success');

  } catch (loi) {
    console.error('Lỗi khi xóa đơn hàng:', loi);
    hienThiThongBaoAdmin('Không thể xóa đơn hàng lúc này!', 'error');
  }
};
window.xoaDonHangAdmin = xoaDonHangAdmin;

// ============================================================================
// PHẦN 8: QUẢN LÝ DANH MỤC THƯƠNG HIỆU (CATEGORY MANAGEMENT)
// ============================================================================

/**
 * Hiển thị bảng danh mục thương hiệu (#admin-tab-categories)
 */
const hienThiBangDanhMucAdmin = () => {
  const tbody = $('admin-category-tbody');
  if (!tbody) return;

  if (danhSachDanhMuc.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px;">Chưa có danh mục nào!</td></tr>`;
    return;
  }

  tbody.innerHTML = danhSachDanhMuc.map(dm => `
    <tr>
      <td style="font-weight: 700; color: #2563eb;">#${lamSachHtml(dm.id)}</td>
      <td style="font-weight: 600;">${lamSachHtml(dm.name)}</td>
      <td style="color: #64748b;">${lamSachHtml(dm.parent_id || '0 (Gốc)')}</td>
      <td>
        <div style="display: flex; gap: 6px;">
          <button 
            type="button" 
            class="btn-primary" 
            style="padding: 5px 10px; font-size: 12px;" 
            onclick="suaDanhMuc('${dm.id}')"
          >
            <i class="fas fa-pen-to-square"></i> Sửa
          </button>
          <button 
            type="button" 
            class="btn-secondary" 
            style="padding: 5px 10px; font-size: 12px; background: #fee2e2; color: #b91c1c; border-color: #fecaca;" 
            onclick="xoaDanhMuc('${dm.id}')"
          >
            <i class="fas fa-trash"></i> Xóa
          </button>
        </div>
      </td>
    </tr>
  `).join('');
};

/**
 * Mở modal thêm danh mục
 */
const moModalThemDanhMuc = () => {
  idDanhMucDangSua = null;
  const modal = $('category-modal');
  const title = $('category-modal-title');
  const form = $('category-form');

  if (title) title.textContent = 'Thêm Danh Mục Mới';
  if (form) form.reset();
  if (modal) modal.classList.add('open');
};

/**
 * Mở modal sửa danh mục
 */
const suaDanhMuc = (danhMucId) => {
  const dm = danhSachDanhMuc.find(item => String(item.id) === String(danhMucId));
  if (!dm) return;

  idDanhMucDangSua = dm.id;
  const modal = $('category-modal');
  const title = $('category-modal-title');

  if (title) title.textContent = `Sửa Danh Mục (#${dm.id})`;
  if ($('form-category-name')) $('form-category-name').value = dm.name || '';
  if (modal) modal.classList.add('open');
};
window.suaDanhMuc = suaDanhMuc;

/**
 * Xóa danh mục (Có kiểm tra ràng buộc toàn vẹn dữ liệu)
 */
const xoaDanhMuc = async (danhMucId) => {
  // Kiểm tra xem có sản phẩm nào đang thuộc danh mục này không
  const sanPhamThuocDanhMuc = danhSachSanPham.filter(sp => String(sp.category_id) === String(danhMucId));
  if (sanPhamThuocDanhMuc.length > 0) {
    hienThiThongBaoAdmin(`Không thể xóa! Đang có ${sanPhamThuocDanhMuc.length} sản phẩm thuộc thương hiệu này.`, 'warning');
    return;
  }

  const dm = danhSachDanhMuc.find(item => String(item.id) === String(danhMucId));
  const tenDM = dm ? dm.name : `#${danhMucId}`;

  const xacNhan = confirm(`Bạn có chắc chắn muốn xóa danh mục "${tenDM}" không?`);
  if (!xacNhan) return;

  try {
    await goiApi(`${API_CATEGORIES}/${danhMucId}`, 'DELETE');
    danhSachDanhMuc = danhSachDanhMuc.filter(item => String(item.id) !== String(danhMucId));

    hienThiBangDanhMucAdmin();
    napDanhMucVaoSelectForm();

    hienThiThongBaoAdmin(`Đã xóa danh mục "${tenDM}" thành công!`, 'success');

  } catch (loi) {
    console.error('Lỗi khi xóa danh mục:', loi);
    hienThiThongBaoAdmin('Không thể xóa danh mục!', 'error');
  }
};
window.xoaDanhMuc = xoaDanhMuc;

/**
 * Xử lý lưu form danh mục
 */
const xuLyLuuDanhMuc = async (suKien) => {
  suKien.preventDefault();
  const name = ($('form-category-name')?.value || '').trim();
  if (!name) return;

  try {
    if (idDanhMucDangSua === null) {
      // Thêm mới
      const danhMucMoi = { name, parent_id: 0 };
      const dmDaTao = await goiApi(API_CATEGORIES, 'POST', danhMucMoi);
      danhSachDanhMuc.push(dmDaTao);
      hienThiThongBaoAdmin(`Đã thêm danh mục "${name}"!`, 'success');
    } else {
      // Cập nhật
      const dmDaSua = await goiApi(`${API_CATEGORIES}/${idDanhMucDangSua}`, 'PATCH', { name });
      const viTri = danhSachDanhMuc.findIndex(item => String(item.id) === String(idDanhMucDangSua));
      if (viTri !== -1) danhSachDanhMuc[viTri] = { ...danhSachDanhMuc[viTri], ...dmDaSua };
      hienThiThongBaoAdmin(`Đã sửa danh mục thành "${name}"!`, 'success');
    }

    $('category-modal')?.classList.remove('open');
    hienThiBangDanhMucAdmin();
    napDanhMucVaoSelectForm();

  } catch (loi) {
    console.error('Lỗi khi lưu danh mục:', loi);
    hienThiThongBaoAdmin('Không thể lưu danh mục!', 'error');
  }
};

// ============================================================================
// PHẦN 9: QUẢN LÝ KHÁCH HÀNG (USER MANAGEMENT - LAB 7.2)
// ============================================================================

/**
 * Hiển thị bảng danh sách tài khoản khách hàng (#admin-tab-users)
 */
const hienThiBangKhachHangAdmin = () => {
  const tbody = $('admin-user-tbody');
  if (!tbody) return;

  if (danhSachKhachHang.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px;">Chưa có tài khoản nào!</td></tr>`;
    return;
  }

  tbody.innerHTML = danhSachKhachHang.map((kh, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td style="font-weight: 600; color: #1e293b;">${lamSachHtml(kh.name || '—')}</td>
      <td>${lamSachHtml(kh.email || '—')}</td>
      <td>${lamSachHtml(kh.phone || '—')}</td>
      <td>
        <span class="badge" style="background: ${kh.role === 'admin' ? '#fef3c7' : '#e0f2fe'}; color: ${kh.role === 'admin' ? '#b45309' : '#0369a1'}; padding: 3px 8px; border-radius: 4px; font-size: 12px;">
          ${kh.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}
        </span>
      </td>
      <td style="font-size: 13px; color: #64748b;">${lamSachHtml(kh.address || '—')}</td>
    </tr>
  `).join('');
};

// ============================================================================
// PHẦN 10: ĐĂNG NHẬP / ĐĂNG XUẤT ADMIN & ĐĂNG KÝ SỰ KIỆN KHỞI CHẠY
// ============================================================================



/**
 * Xử lý đăng nhập tài khoản quản trị trực tiếp trên trang admin.html
 */
const xuLyDangNhapAdmin = (suKien) => {
  suKien.preventDefault();
  const email = ($('admin-email')?.value || '').trim();
  const password = ($('admin-password')?.value || '').trim();

  // Kiểm tra tài khoản admin trong database hoặc tài khoản admin mặc định
  const taiKhoanAdmin = danhSachKhachHang.find(u => u.email === email && u.password === password && u.role === 'admin');
  const laAdminMacDinh = email === 'admin@smartstore.vn' && password === 'admin';

  if (laAdminMacDinh || taiKhoanAdmin) {
    localStorage.setItem(KEY_ADMIN_LOGGED, 'true');

    // Đồng bộ sang smartstore_user để khi Admin bấm "Xem Cửa Hàng (Shop)" sẽ duy trì được tài khoản
    const thongTinLuu = taiKhoanAdmin || {
      id: '1',
      name: 'Quản Trị Viên (Admin)',
      email: 'admin@smartstore.vn',
      phone: '0988888888',
      role: 'admin',
      address: 'Hà Nội'
    };
    localStorage.setItem('smartstore_user', JSON.stringify(thongTinLuu));

    hienThiThongBaoAdmin('Đăng nhập Quản trị viên thành công!', 'success');
    kiemTraDangNhapAdmin();
  } else {
    hienThiThongBaoAdmin('Email hoặc mật khẩu Admin không đúng! (Gợi ý: admin@smartstore.vn / admin)', 'error');
  }
};

/**
 * Xử lý đăng xuất tài khoản quản trị
 */
const xuLyDangXuatAdmin = () => {
  const xacNhan = confirm('Bạn có chắc chắn muốn đăng xuất khỏi trang Quản trị không?');
  if (!xacNhan) return;

  localStorage.removeItem(KEY_ADMIN_LOGGED);
  localStorage.removeItem('smartstore_user');
  kiemTraDangNhapAdmin();
  hienThiThongBaoAdmin('Đã đăng xuất trang Quản trị.', 'info');
};

/**
 * Chuyển đổi giữa các tab quản trị con và lưu trạng thái vào sessionStorage
 * Tác dụng: Giúp giữ nguyên tab mà Admin đang thao tác (không bị tự động nhảy về tab đầu tiên)
 * @param {string} targetSubtab - ID của tab cần hiển thị ('admin-tab-products', 'admin-tab-categories', 'admin-tab-orders', 'admin-tab-users')
 */
const chuyenTabAdmin = (targetSubtab) => {
  if (!targetSubtab) return;

  // 1. Cập nhật giao diện nút tab active
  $$('.admin-tab-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-subtab') === targetSubtab);
  });

  // 2. Ẩn/hiện nội dung subpanel tương ứng
  $$('.admin-subpanel').forEach(p => {
    p.style.display = p.id === targetSubtab ? 'block' : 'none';
  });

  // 3. Ghi nhớ tab hiện tại vào sessionStorage
  sessionStorage.setItem('smartstore_admin_active_tab', targetSubtab);
};

document.addEventListener('DOMContentLoaded', () => {
  // 1. Kiểm tra trạng thái đăng nhập
  kiemTraDangNhapAdmin();

  // 2. Chuyển đổi giữa các tab quản trị con (hỗ trợ lưu trạng thái vào sessionStorage)
  $$('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetSubtab = btn.getAttribute('data-subtab');
      chuyenTabAdmin(targetSubtab);
    });
  });

  // Khôi phục tab quản trị đang làm việc gần nhất (mặc định: admin-tab-products)
  const tabDaLuu = sessionStorage.getItem('smartstore_admin_active_tab') || 'admin-tab-products';
  chuyenTabAdmin(tabDaLuu);

  // 3. Sự kiện mở modal thêm sản phẩm và thêm danh mục
  $('btn-admin-add-product')?.addEventListener('click', moModalThemSanPham);
  $('btn-admin-add-category')?.addEventListener('click', moModalThemDanhMuc);

  // 4. Sự kiện đóng modal
  $('btn-close-product-modal')?.addEventListener('click', () => $('product-modal')?.classList.remove('open'));
  $('btn-cancel-product-modal')?.addEventListener('click', () => $('product-modal')?.classList.remove('open'));

  $('btn-close-category-modal')?.addEventListener('click', () => $('category-modal')?.classList.remove('open'));
  $('btn-cancel-category-modal')?.addEventListener('click', () => $('category-modal')?.classList.remove('open'));

  $('btn-close-order-modal')?.addEventListener('click', () => $('admin-order-modal')?.classList.remove('open'));
  $('btn-close-order-detail')?.addEventListener('click', () => $('admin-order-modal')?.classList.remove('open'));

  // 5. Sự kiện nộp form sản phẩm và danh mục
  $('product-form')?.addEventListener('submit', xuLyLuuSanPham);
  $('category-form')?.addEventListener('submit', xuLyLuuDanhMuc);

  // 6. Sự kiện chọn ảnh từ máy tính (FileReader)
  $('form-product-file')?.addEventListener('change', xuLyChonAnhTuMay);

  // 7. Sự kiện tìm kiếm & lọc trên bảng sản phẩm
  $('admin-search-product')?.addEventListener('input', hienThiBangSanPhamAdmin);
  $('admin-filter-category')?.addEventListener('change', hienThiBangSanPhamAdmin);

  // 8. Sự kiện đăng nhập / đăng xuất admin
  $('admin-login-form')?.addEventListener('submit', xuLyDangNhapAdmin);
  $('btn-admin-logout')?.addEventListener('click', xuLyDangXuatAdmin);
});
