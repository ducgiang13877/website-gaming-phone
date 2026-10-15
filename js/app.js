/**
 * ============================================================================
 * TỆP JAVASCRIPT GIAO DIỆN NGƯỜI DÙNG (USER CLIENT - js/app.js)
 * ============================================================================
 * Dự án: Website Gaming Phone (SmartStore)
 * Môn học: Lập trình JavaScript Nâng Cao (WEB2064)
 * 
 * PHONG CÁCH VIẾT CODE DÀNH CHO SINH VIÊN:
 * 1. Tối ưu, hiện đại nhưng cực kỳ rõ ràng, mạch lạc, dễ đọc và dễ tiếp thu.
 * 2. Sử dụng các hàm và cú pháp ES6+ chuẩn mực:
 *    - const / let, Arrow functions, Template literals (`...`).
 *    - async / await kết hợp Fetch API để gọi dữ liệu không đồng bộ từ máy chủ Mock (JSON-Server).
 *    - Các hàm mảng có sẵn: filter, map, reduce, find, some, slice.
 *    - Các hàm xử lý toán học và chuỗi: Math.max, Math.ceil, Math.random, charAt.
 *    - Định dạng tiền tệ tự động với Intl.NumberFormat.
 *    - Lưu trữ trạng thái phiên làm việc với localStorage.
 * 3. Mỗi hàm, mỗi khối lệnh và từng bước logic đều có CHÚ THÍCH (COMMENT) chi tiết
 *    giải thích rõ tác dụng, ý nghĩa và luồng hoạt động từ đầu đến cuối.
 * ============================================================================
 */

// ============================================================================
// PHẦN 1: CẤU HÌNH HỆ THỐNG VÀ CÁC ĐƯỜNG DẪN API (REST ENDPOINTS)
// ============================================================================

// Địa chỉ máy chủ Mock API (chạy JSON-Server trên cổng 3000)
const API_BASE = 'http://localhost:3000';

// Đường dẫn API tương ứng với từng tài nguyên trong tệp db.json
const API_PRODUCTS = `${API_BASE}/products`;      // Danh sách sản phẩm điện thoại
const API_CATEGORIES = `${API_BASE}/categories`;  // Danh mục thương hiệu (Apple, Samsung, ...)
const API_ORDERS = `${API_BASE}/orders`;          // Danh sách đơn đặt hàng
const API_USERS = `${API_BASE}/users`;            // Danh sách tài khoản người dùng

// Ảnh thay thế mặc định khi đường dẫn ảnh của sản phẩm bị lỗi hoặc không tải được
const ANH_MAC_DINH = 'https://picsum.photos/300/300';

// Khóa (Key) dùng để lưu trữ dữ liệu vào bộ nhớ trình duyệt (localStorage)
const KEY_GIO_HANG = 'smartstore_cart';
const KEY_NGUOI_DUNG = 'smartstore_user';

// Cấu hình phân trang danh sách sản phẩm (Pagination)
const SO_SAN_PHAM_MOI_TRANG = 8; // Mỗi trang hiển thị tối đa 8 sản phẩm
let trangHienTai = 1;            // Trang hiện tại người dùng đang xem (mặc định là trang 1)

// ============================================================================
// PHẦN 2: CÁC BIẾN QUẢN LÝ TRẠNG THÁI TOÀN CỤC (APPLICATION STATE)
// ============================================================================

// Biến lưu trữ mảng danh sách sản phẩm tải về từ API
let danhSachSanPham = [];

// Biến lưu trữ mảng danh mục thương hiệu tải về từ API
let danhSachDanhMuc = [];

// Biến lưu trữ mảng các sản phẩm đang có trong giỏ hàng của người dùng
let gioHang = [];

// Biến lưu trữ thông tin của người dùng đang đăng nhập (null nếu chưa đăng nhập)
let nguoiDungHienTai = null;

// Biến lưu thông tin đơn hàng vừa được người dùng nhập trong form thanh toán
let donHangDangXacNhan = null;

// Biến lưu định danh bộ đếm thời gian cho thông báo Toast (để tự tắt sau 3 giây)
let timerToast = null;

// ============================================================================
// PHẦN 3: CÁC HÀM TIỆN ÍCH DÙNG CHUNG (UTILITY FUNCTIONS)
// ============================================================================

/**
 * Hàm hỗ trợ lấy phần tử HTML theo ID hoặc CSS selector (tương tự như jQuery $)
 * Tác dụng: Giúp code ngắn gọn hơn, thay thế cho document.getElementById hoặc document.querySelector
 * @param {string} selector - ID hoặc bộ chọn CSS của phần tử
 * @returns {HTMLElement|null} Phần tử HTML tìm được
 */
const $ = (selector) => {
  // Nếu tham số truyền vào không phải là chuỗi thì trả về null
  if (typeof selector !== 'string') return null;

  // Nếu là chuỗi đơn giản không chứa khoảng trắng hay dấu chấm thì ưu tiên getElementById (chạy rất nhanh)
  const laIdDonGian = !selector.includes(' ') && !selector.includes('.') && !selector.includes('[');
  return laIdDonGian 
    ? document.getElementById(selector.replace(/^#/, '')) 
    : document.querySelector(selector);
};

/**
 * Hàm hỗ trợ lấy tất cả các phần tử HTML khớp với CSS selector
 * @param {string} selector - Bộ chọn CSS
 * @returns {NodeListOf<HTMLElement>} Danh sách các phần tử tìm được
 */
const $$ = (selector) => document.querySelectorAll(selector);

/**
 * Hàm gọi dữ liệu từ API máy chủ (Hàm bọc Fetch API chung)
 * Tác dụng:
 * - Đóng gói các thiết lập như phương thức gửi (GET, POST, PATCH, PUT, DELETE).
 * - Tự động thiết lập Header: Content-Type: application/json.
 * - Tự động chuyển đổi dữ liệu JavaScript sang chuỗi JSON (JSON.stringify) khi gửi đi.
 * - Kiểm tra lỗi mạng và tự động phân tích kết quả trả về dưới dạng JSON (res.json()).
 * 
 * @param {string} url - Đường dẫn API cần gọi
 * @param {string} phuongThuc - Phương thức HTTP (mặc định là 'GET')
 * @param {object|null} duLieuGuiDi - Dữ liệu cần gửi lên máy chủ (nếu có)
 * @returns {Promise<any>} Dữ liệu trả về từ máy chủ sau khi giải mã JSON
 */
const goiApi = async (url, phuongThuc = 'GET', duLieuGuiDi = null) => {
  // Cấu hình các tùy chọn cho hàm fetch
  const cauHinh = {
    method: phuongThuc,
    headers: {
      'Content-Type': 'application/json' // Báo cho server biết dữ liệu gửi lên là JSON
    }
  };

  // Nếu có dữ liệu gửi đi (POST, PATCH, PUT) thì đóng gói vào trường body
  if (duLieuGuiDi !== null) {
    cauHinh.body = JSON.stringify(duLieuGuiDi);
  }

  // Thực hiện cuộc gọi mạng bất đồng bộ bằng fetch
  const phanHoi = await fetch(url, cauHinh);

  // Kiểm tra xem phản hồi từ server có thành công hay không (mã trạng thái 200 - 299)
  if (!phanHoi.ok) {
    throw new Error(`Lỗi kết nối máy chủ (${phanHoi.status}): ${phanHoi.statusText}`);
  }

  // Chuyển đổi dữ liệu JSON trả về từ server thành đối tượng JavaScript
  return phanHoi.json();
};

/**
 * Hàm định dạng số tiền thành chuỗi tiền tệ Việt Nam (VNĐ)
 * Tác dụng: Sử dụng đối tượng có sẵn Intl.NumberFormat để chuyển số 29990000 thành "29.990.000 đ"
 * Giúp giao diện hiển thị giá bán chuyên nghiệp và chuẩn mực.
 * 
 * @param {number|string} soTien - Giá trị số cần định dạng
 * @returns {string} Chuỗi tiền tệ đã định dạng, ví dụ "15.500.000 đ"
 */
const dinhDangTien = (soTien) => {
  // Ép kiểu sang số nguyên, nếu không hợp lệ thì mặc định là 0
  const giaTri = Number(soTien) || 0;

  // Sử dụng thư viện quốc tế hóa có sẵn của JavaScript
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(giaTri);
};

/**
 * Hàm chống tấn công XSS (Cross-Site Scripting)
 * Tác dụng: Chuyển đổi các ký tự đặc biệt nguy hiểm trong HTML (&, <, >, ", ') 
 * thành các mã HTML an toàn (HTML entities) trước khi chèn vào giao diện.
 * 
 * @param {any} chuoiVanBan - Chuỗi văn bản nhập từ người dùng
 * @returns {string} Chuỗi văn bản đã được làm sạch an toàn
 */
const lamSachHtml = (chuoiVanBan) => {
  if (chuoiVanBan == null) return '';
  return String(chuoiVanBan)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Hàm hiển thị thông báo nổi góc màn hình (Toast Notification)
 * Luồng hoạt động:
 * 1. Nhận thông điệp và loại thông báo (success, error, warning, info).
 * 2. Cập nhật nội dung và thêm class 'show' để CSS kích hoạt hiệu ứng trượt vào.
 * 3. Đặt bộ đếm thời gian (setTimeout) 3 giây để tự động ẩn thông báo.
 * 
 * @param {string} noiDung - Lời nhắn muốn hiển thị cho người dùng
 * @param {string} loai - Loại thông báo: 'success' (thành công), 'error' (lỗi), 'warning' (cảnh báo)
 */
const hienThiThongBao = (noiDung, loai = 'info') => {
  const phanTuToast = $('toast');
  if (!phanTuToast) return;

  // Nếu đang có bộ đếm thời gian từ thông báo trước thì xóa đi để không bị tắt sớm
  if (timerToast) clearTimeout(timerToast);

  // Chọn biểu tượng FontAwesome tương ứng với loại thông báo
  const bieuTuong = {
    success: '<i class="fas fa-circle-check"></i>',
    error: '<i class="fas fa-circle-xmark"></i>',
    warning: '<i class="fas fa-triangle-exclamation"></i>',
    info: '<i class="fas fa-circle-info"></i>'
  }[loai] || '<i class="fas fa-circle-info"></i>';

  // Gán nội dung HTML cho thẻ toast
  phanTuToast.innerHTML = `${bieuTuong} <span>${lamSachHtml(noiDung)}</span>`;

  // Cập nhật class để CSS tô màu đúng loại (toast-success, toast-error, toast-warning)
  phanTuToast.className = `toast-notice toast-${loai} show`;

  // Tự động gỡ bỏ class 'show' sau 3 giây để ẩn thông báo
  timerToast = setTimeout(() => {
    phanTuToast.classList.remove('show');
  }, 3000);
};

/**
 * Hàm sinh mã đơn hàng ngẫu nhiên theo đúng tiêu chuẩn yêu cầu:
 * - Luôn luôn bắt đầu bằng dấu thăng (#).
 * - Sau dấu # là chữ VIẾT HOA và SỐ ngẫu nhiên kết hợp từ bảng chữ cái A-Z và các số 0-9.
 * - Tổng độ dài là chính xác 11 ký tự (tính cả dấu # ở đầu).
 * - Không chứa bất kỳ ký tự đặc biệt nào.
 * 
 * Luồng hoạt động:
 * 1. Khai báo danh sách các ký tự hợp lệ: 26 chữ cái hoa và 10 chữ số (36 ký tự).
 * 2. Khởi tạo mã đơn hàng với ký tự đầu tiên là '#'.
 * 3. Chạy vòng lặp 10 lần: mỗi lần dùng Math.random() để bốc ngẫu nhiên 1 ký tự ghép vào.
 * 4. Trả về chuỗi kết quả có độ dài 1 + 10 = 11 ký tự.
 * 
 * @returns {string} Mã đơn hàng hợp lệ dạng #XXXXXXXXXX (ví dụ: #A8K9Z2P3M1)
 */
const taoMaDonHang = () => {
  // Tập hợp các ký tự cho phép: chữ cái in hoa A-Z và chữ số 0-9
  const chuoiKyTuChoPhep = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  // Ký tự đầu tiên bắt buộc luôn là dấu thăng #
  let maDonHang = '#';

  // Vòng lặp lấy thêm 10 ký tự ngẫu nhiên tiếp theo
  for (let i = 0; i < 10; i++) {
    // Math.random() sinh số thực ngẫu nhiên từ [0; 1)
    // Nhân với độ dài chuỗi và dùng Math.floor để lấy chỉ số index nguyên
    const viTriNgauNhien = Math.floor(Math.random() * chuoiKyTuChoPhep.length);

    // Dùng charAt để trích xuất ký tự tại vị trí vừa tính được
    maDonHang += chuoiKyTuChoPhep.charAt(viTriNgauNhien);
  }

  // Kết quả cuối cùng là 11 ký tự
  return maDonHang;
};

// ============================================================================
// PHẦN 4: QUẢN LÝ ĐIỀU HƯỚNG GIAO DIỆN (CHUYỂN ĐỔI GIỮA CÁC TRANG/VIEW)
// ============================================================================

/**
 * Hàm chuyển đổi giữa các màn hình (Single Page Application - SPA View Switcher)
 * Luồng hoạt động:
 * 1. Tìm tất cả các phần tử có class 'view-panel' trên trang.
 * 2. Gỡ bỏ class 'active' khỏi toàn bộ các view để ẩn chúng đi.
 * 3. Tìm view mục tiêu theo viewId và thêm class 'active' để hiển thị.
 * 4. Đổi trạng thái active cho các nút điều hướng trên thanh Menu Header.
 * 5. Cuộn mượt mà lên đầu trang để người dùng có trải nghiệm tốt nhất.
 * 
 * @param {string} viewId - ID của màn hình cần mở: 'view-shop', 'view-cart', 'view-thankyou', 'view-orders', 'view-account'
 */
const chuyenTrangView = (viewId) => {
  // Lấy tất cả các view có trên trang
  const tatCaView = $$('.view-panel');

  // Lặp qua từng view và xóa class 'active' (ẩn đi)
  tatCaView.forEach(view => view.classList.remove('active'));

  // Tìm view mục tiêu cần hiển thị
  const viewMucTieu = $(viewId);
  if (viewMucTieu) {
    // Thêm class 'active' để hiển thị view này lên (kèm hiệu ứng fade-in từ CSS)
    viewMucTieu.classList.add('active');
  }

  // Cập nhật trạng thái active cho các nút trên thanh Header Menu
  $$('.nav-item').forEach(nut => nut.classList.remove('active'));
  
  if (viewId === 'view-shop') $('nav-shop')?.classList.add('active');
  if (viewId === 'view-cart') $('nav-cart')?.classList.add('active');
  if (viewId === 'view-orders') $('nav-orders')?.classList.add('active');
  if (viewId === 'view-account') $('nav-account')?.classList.add('active');

  // Nếu chuyển sang trang lịch sử đơn hàng thì gọi hàm làm mới dữ liệu đơn hàng
  if (viewId === 'view-orders') {
    hienThiLichSuDonHang();
  }

  // Nếu chuyển sang trang tài khoản thì kiểm tra và cập nhật giao diện tài khoản
  if (viewId === 'view-account') {
    capNhatGiaoDienTaiKhoan();
  }

  // Cuộn mượt mà lên đầu trang
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Gắn hàm chuyenTrangView vào đối tượng window để các thẻ HTML gọi được qua thuộc tính onclick
window.chuyenTrangView = chuyenTrangView;

// ============================================================================
// PHẦN 5: TẢI DỮ LIỆU BAN ĐẦU VÀ HIỂN THỊ SẢN PHẨM (SHOP & FILTER & PAGINATION)
// ============================================================================

/**
 * Hàm khởi tạo và tải toàn bộ dữ liệu cần thiết khi mở trang
 * Luồng hoạt động:
 * 1. Đọc giỏ hàng và thông tin người dùng từ bộ nhớ trình duyệt (localStorage).
 * 2. Gọi đồng thời (Promise.all) 2 API lấy danh sách sản phẩm và danh mục từ server.
 * 3. Đổ danh mục vào thanh chọn tìm kiếm.
 * 4. Hiển thị danh sách sản phẩm kèm phân trang.
 * 5. Cập nhật số lượng hiển thị trên icon giỏ hàng ở thanh Menu.
 */
const khoiTaoUngDung = async () => {
  try {
    // 1. Phục hồi dữ liệu giỏ hàng từ localStorage (nếu trước đó đã lưu)
    const gioHangDaLuu = localStorage.getItem(KEY_GIO_HANG);
    if (gioHangDaLuu) {
      try {
        gioHang = JSON.parse(gioHangDaLuu);
      } catch (e) {
        gioHang = [];
      }
    }

    // 2. Phục hồi dữ liệu tài khoản đang đăng nhập từ localStorage
    const userDaLuu = localStorage.getItem(KEY_NGUOI_DUNG);
    if (userDaLuu) {
      try {
        nguoiDungHienTai = JSON.parse(userDaLuu);
      } catch (e) {
        nguoiDungHienTai = null;
      }
    }

    // Cập nhật số lượng huy hiệu (badge) trên icon giỏ hàng
    capNhatSoLuongGioHangTrenHeader();

    // 3. Tải song song danh sách sản phẩm và danh mục bằng Promise.all (tiết kiệm thời gian)
    const [duLieuSanPham, duLieuDanhMuc] = await Promise.all([
      goiApi(API_PRODUCTS),
      goiApi(API_CATEGORIES)
    ]);

    // Lưu dữ liệu vào biến toàn cục để dùng xuyên suốt ứng dụng
    danhSachSanPham = Array.isArray(duLieuSanPham) ? duLieuSanPham : [];
    danhSachDanhMuc = Array.isArray(duLieuDanhMuc) ? duLieuDanhMuc : [];

    // 4. Đổ danh mục vào thẻ <select> trên thanh bộ lọc
    napDanhMucVaoBoLoc();

    // 5. Hiển thị danh sách sản phẩm ra màn hình
    hienThiDanhSachSanPham();

  } catch (loi) {
    console.error('Lỗi khi tải dữ liệu từ máy chủ:', loi);
    hienThiThongBao('Không thể kết nối đến máy chủ JSON-Server! Vui lòng kiểm tra cổng 3000.', 'error');
  }
};

/**
 * Hàm đổ danh mục thương hiệu vào thẻ select chọn hãng
 * Luồng hoạt động:
 * - Lặp qua mảng danhSachDanhMuc bằng hàm .map().
 * - Tạo chuỗi các thẻ <option value="cate_id">Tên hãng</option>.
 * - Gán vào innerHTML của ô chọn.
 */
const napDanhMucVaoBoLoc = () => {
  const oChonDanhMuc = $('shop-filter-category');
  if (!oChonDanhMuc) return;

  // Giữ lại option mặc định là "Tất cả thương hiệu"
  let chuoiHtml = '<option value="">Tất cả thương hiệu</option>';

  // Dùng vòng lặp forEach duyệt qua từng danh mục để tạo option
  danhSachDanhMuc.forEach(danhMuc => {
    chuoiHtml += `<option value="${lamSachHtml(danhMuc.id)}">${lamSachHtml(danhMuc.name)}</option>`;
  });

  oChonDanhMuc.innerHTML = chuoiHtml;
};

/**
 * Hàm lọc danh sách sản phẩm theo 3 tiêu chí:
 * 1. Từ khóa tìm kiếm theo tên (ô input #shop-search).
 * 2. Thương hiệu được chọn (ô select #shop-filter-category).
 * 3. Mức giá được chọn (ô select #shop-filter-price: dưới 10tr, 10-25tr, trên 25tr).
 * 
 * Sử dụng hàm có sẵn của mảng là .filter() kết hợp so khớp chuỗi .toLowerCase() và .includes()
 * @returns {Array} Danh sách sản phẩm sau khi đã lọc thỏa mãn tất cả tiêu chí
 */
const layDanhSachSanPhamDaLoc = () => {
  // Lấy từ khóa tìm kiếm (chuyển về chữ thường và xóa khoảng trắng thừa ở 2 đầu)
  const tuKhoa = ($('shop-search')?.value || '').trim().toLowerCase();

  // Lấy mã danh mục đang chọn
  const maDanhMuc = $('shop-filter-category')?.value || '';

  // Lấy khoảng giá đang chọn
  const mucGia = $('shop-filter-price')?.value || '';

  // Sử dụng hàm filter() để chọn lọc các phần tử thỏa mãn tất cả điều kiện
  return danhSachSanPham.filter(sanPham => {
    // Điều kiện 1: Tên sản phẩm phải chứa từ khóa tìm kiếm (hoặc từ khóa trống)
    const tenSanPham = (sanPham.name || '').toLowerCase();
    const thoaManTuKhoa = tuKhoa === '' || tenSanPham.includes(tuKhoa);

    // Điều kiện 2: Trùng mã danh mục (hoặc người dùng chọn Tất cả)
    const thoaManDanhMuc = maDanhMuc === '' || String(sanPham.category_id) === String(maDanhMuc);

    // Điều kiện 3: Giá bán nằm trong khoảng người dùng đã chọn
    const giaBan = Number(sanPham.price) || 0;
    let thoaManGia = true;
    if (mucGia === 'duoi-10tr') {
      thoaManGia = giaBan < 10000000;
    } else if (mucGia === '10tr-25tr') {
      thoaManGia = giaBan >= 10000000 && giaBan <= 25000000;
    } else if (mucGia === 'tren-25tr') {
      thoaManGia = giaBan > 25000000;
    }

    // Sản phẩm phải thỏa mãn cả 3 điều kiện cùng lúc (phép VÀ &&)
    return thoaManTuKhoa && thoaManDanhMuc && thoaManGia;
  });
};

/**
 * Hàm hiển thị danh sách sản phẩm ra lưới (Product Grid) có PHÂN TRANG (Pagination)
 * Luồng hoạt động:
 * 1. Lấy danh sách sản phẩm đã được lọc theo từ khóa, danh mục và khoảng giá.
 * 2. Tính toán tổng số trang bằng Math.ceil(tongSoLuong / soLuongMoiTrang).
 * 3. Kiểm tra nếu trang hiện tại lớn hơn tổng số trang thì lùi về trang cuối.
 * 4. Dùng hàm .slice(batDau, ketThuc) để cắt ra đúng 8 sản phẩm của trang hiện tại.
 * 5. Lặp qua danh sách đã cắt bằng .map() để tạo HTML thẻ sản phẩm và render vào #product-grid.
 * 6. Gọi hàm taoThanhPhanTrang() để vẽ các nút bấm chuyển trang (1, 2, 3, Trước, Sau).
 */
const hienThiDanhSachSanPham = () => {
  const luoiSanPham = $('product-grid');
  if (!luoiSanPham) return;

  // 1. Lấy danh sách sau khi lọc
  const sanPhamDaLoc = layDanhSachSanPhamDaLoc();

  // Nếu không có sản phẩm nào khớp với điều kiện tìm kiếm
  if (sanPhamDaLoc.length === 0) {
    luoiSanPham.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 40px 20px; text-align: center;">
        <i class="fas fa-box-open" style="font-size: 3rem; color: #94a3b8; margin-bottom: 15px;"></i>
        <h3 style="font-size: 1.2rem; color: #475569;">Không tìm thấy sản phẩm phù hợp!</h3>
        <p style="color: #64748b; font-size: 0.9rem;">Hãy thử tìm kiếm bằng từ khóa khác hoặc điều chỉnh lại bộ lọc.</p>
      </div>
    `;
    // Xóa thanh phân trang nếu không có sản phẩm
    const thanhPhanTrang = $('shop-pagination');
    if (thanhPhanTrang) thanhPhanTrang.innerHTML = '';
    return;
  }

  // 2. Tính tổng số trang (Math.ceil làm tròn lên)
  const tongSoTrang = Math.ceil(sanPhamDaLoc.length / SO_SAN_PHAM_MOI_TRANG);

  // Đảm bảo trang hiện tại luôn nằm trong khoảng hợp lệ từ 1 đến tongSoTrang
  if (trangHienTai > tongSoTrang) trangHienTai = tongSoTrang;
  if (trangHienTai < 1) trangHienTai = 1;

  // 3. Cắt mảng lấy danh sách sản phẩm thuộc trang hiện tại bằng hàm .slice()
  const viTriBatDau = (trangHienTai - 1) * SO_SAN_PHAM_MOI_TRANG;
  const viTriKetThuc = viTriBatDau + SO_SAN_PHAM_MOI_TRANG;
  const sanPhamTrangNay = sanPhamDaLoc.slice(viTriBatDau, viTriKetThuc);

  // 4. Chuyển đổi từng sản phẩm thành một chuỗi HTML thẻ sản phẩm
  const chuoiHtmlSanPham = sanPhamTrangNay.map(sanPham => {
    // Tìm tên thương hiệu tương ứng từ mã category_id bằng hàm .find()
    const danhMuc = danhSachDanhMuc.find(dm => String(dm.id) === String(sanPham.category_id));
    const tenHang = danhMuc ? danhMuc.name : 'Gaming Phone';

    // Xử lý ảnh: nếu có ảnh hợp lệ thì dùng, nếu rỗng thì dùng ảnh mặc định dự phòng
    const duongDanAnh = sanPham.image || ANH_MAC_DINH;

    // Kiểm tra tình trạng tồn kho
    const tonKho = Number(sanPham.quantity) || 0;
    const conHang = tonKho > 0;

    return `
      <div class="product-card">
        <div class="product-thumb-wrapper">
          <img 
            src="${lamSachHtml(duongDanAnh)}" 
            alt="${lamSachHtml(sanPham.name)}" 
            class="product-thumb" 
            onerror="this.onerror=null; this.src='${ANH_MAC_DINH}';"
          />
          <span class="product-badge">${lamSachHtml(tenHang)}</span>
        </div>

        <div class="product-info">
          <h3 class="product-name" title="${lamSachHtml(sanPham.name)}">${lamSachHtml(sanPham.name)}</h3>
          
          <div class="product-price-row">
            <span class="product-price">${dinhDangTien(sanPham.price)}</span>
            <span class="product-stock ${conHang ? 'in-stock' : 'out-of-stock'}">
              ${conHang ? `Còn lại: ${tonKho}` : 'Hết hàng'}
            </span>
          </div>

          <p class="product-detail" title="${lamSachHtml(sanPham.detail || '')}">
            ${lamSachHtml(sanPham.detail || 'Chưa có mô tả chi tiết cho sản phẩm này.')}
          </p>

          <div class="product-actions">
            <button 
              type="button" 
              class="btn-add-cart" 
              onclick="themVaoGioHang('${sanPham.id}')"
              ${!conHang ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}
              title="Thêm vào giỏ hàng"
            >
              <i class="fas fa-cart-plus"></i> Thêm giỏ
            </button>

            <button 
              type="button" 
              class="btn-buy-now" 
              onclick="muaNgay('${sanPham.id}')"
              ${!conHang ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}
              title="Mua ngay lập tức"
            >
              <i class="fas fa-bolt"></i> Mua ngay
            </button>
          </div>
        </div>
      </div>
    `;
  }).join(''); // Nối tất cả các chuỗi HTML thành một chuỗi duy nhất

  // Đổ toàn bộ mã HTML vào lưới sản phẩm
  luoiSanPham.innerHTML = chuoiHtmlSanPham;

  // 5. Tạo thanh phân trang ở phía dưới danh sách sản phẩm
  taoThanhPhanTrang(tongSoTrang, sanPhamDaLoc.length);
};

/**
 * Hàm tạo các nút phân trang (Pagination Bar)
 * Luồng hoạt động:
 * - Nếu chỉ có 1 trang (<= 8 sản phẩm) thì ẩn thanh phân trang để giao diện gọn gàng.
 * - Tạo nút 'Trước' (Previous), các nút số trang từ 1 đến N, và nút 'Sau' (Next).
 * - Đánh dấu trang hiện tại bằng class 'active'.
 * - Khi bấm vào nút trang nào thì cập nhật trangHienTai và gọi lại hienThiDanhSachSanPham().
 * 
 * @param {number} tongSoTrang - Tổng số trang đã tính toán
 * @param {number} tongSoSanPham - Tổng số lượng sản phẩm sau khi lọc
 */
const taoThanhPhanTrang = (tongSoTrang, tongSoSanPham) => {
  const thanhPhanTrang = $('shop-pagination');
  if (!thanhPhanTrang) return;

  // Nếu chỉ có 1 trang thì không cần hiện phân trang
  if (tongSoTrang <= 1) {
    thanhPhanTrang.innerHTML = '';
    return;
  }

  let chuoiHtml = '';

  // Nút 'Trang trước'
  const coTrangTruoc = trangHienTai > 1;
  chuoiHtml += `
    <button 
      type="button" 
      class="page-btn ${!coTrangTruoc ? 'disabled' : ''}" 
      onclick="chuyenTrangSanPham(${trangHienTai - 1})"
      ${!coTrangTruoc ? 'disabled' : ''}
      title="Trang trước"
    >
      <i class="fas fa-chevron-left"></i> Trước
    </button>
  `;

  // Tạo các nút số trang từ 1 đến tongSoTrang
  for (let i = 1; i <= tongSoTrang; i++) {
    const dangChon = i === trangHienTai;
    chuoiHtml += `
      <button 
        type="button" 
        class="page-btn ${dangChon ? 'active' : ''}" 
        onclick="chuyenTrangSanPham(${i})"
      >
        ${i}
      </button>
    `;
  }

  // Nút 'Trang sau'
  const coTrangSau = trangHienTai < tongSoTrang;
  chuoiHtml += `
    <button 
      type="button" 
      class="page-btn ${!coTrangSau ? 'disabled' : ''}" 
      onclick="chuyenTrangSanPham(${trangHienTai + 1})"
      ${!coTrangSau ? 'disabled' : ''}
      title="Trang sau"
    >
      Sau <i class="fas fa-chevron-right"></i>
    </button>
  `;

  // Thêm thông tin hiển thị (Ví dụ: Hiển thị 8/12 sản phẩm)
  chuoiHtml += `
    <span class="pagination-info" style="margin-left: 10px; font-size: 0.85rem; color: #64748b;">
      (Trang ${trangHienTai}/${tongSoTrang} • Tổng ${tongSoSanPham} máy)
    </span>
  `;

  thanhPhanTrang.innerHTML = chuoiHtml;
};

/**
 * Hàm nhảy đến trang chỉ định khi bấm nút phân trang
 * @param {number} soTrang - Số trang muốn chuyển đến
 */
const chuyenTrangSanPham = (soTrang) => {
  trangHienTai = soTrang;
  hienThiDanhSachSanPham();

  // Cuộn nhẹ lên đầu danh sách sản phẩm để tiện xem
  $('product-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};
window.chuyenTrangSanPham = chuyenTrangSanPham;

// ============================================================================
// PHẦN 6: QUẢN LÝ GIỎ HÀNG (SHOPPING CART & LOCAL STORAGE)
// ============================================================================

/**
 * Hàm lưu giỏ hàng hiện tại vào bộ nhớ trình duyệt (localStorage)
 * Tác dụng: Giữ nguyên dữ liệu giỏ hàng ngay cả khi người dùng F5 hoặc tắt trình duyệt
 */
const luuGioHangVaoStorage = () => {
  localStorage.setItem(KEY_GIO_HANG, JSON.stringify(gioHang));
  capNhatSoLuongGioHangTrenHeader();
};

/**
 * Hàm đếm tổng số lượng món hàng trong giỏ và hiển thị lên huy hiệu (badge) trên Menu Header
 * Sử dụng hàm .reduce() để tính tổng số lượng của tất cả các sản phẩm
 */
const capNhatSoLuongGioHangTrenHeader = () => {
  const huyHieuSoLuong = $('cart-badge-count');
  if (!huyHieuSoLuong) return;

  // Tính tổng số lượng hàng trong giỏ bằng hàm reduce
  const tongSoLuong = gioHang.reduce((tong, sanPham) => tong + (sanPham.quantity || 0), 0);

  huyHieuSoLuong.textContent = tongSoLuong;

  // Nếu giỏ hàng có đồ thì thêm class có hoạt ảnh nảy nhẹ
  huyHieuSoLuong.style.display = tongSoLuong > 0 ? 'inline-flex' : 'none';
};

/**
 * Hàm thêm một sản phẩm vào giỏ hàng
 * Luồng hoạt động:
 * 1. Tìm thông tin sản phẩm trong mảng danhSachSanPham theo id.
 * 2. Kiểm tra tồn kho của sản phẩm: nếu = 0 thì báo lỗi hết hàng.
 * 3. Kiểm tra xem sản phẩm đã có sẵn trong giỏ hàng chưa (dùng .find()).
 *    - Nếu đã có: tăng số lượng lên 1 (không vượt quá số lượng tồn kho).
 *    - Nếu chưa có: tạo một đối tượng mới với quantity = 1 và push vào giỏ.
 * 4. Lưu lại vào localStorage và hiển thị Toast thông báo thành công.
 * 
 * @param {string|number} sanPhamId - ID của sản phẩm cần thêm
 */
const themVaoGioHang = (sanPhamId) => {
  // Tìm sản phẩm trong danh sách bằng hàm .find()
  const sanPham = danhSachSanPham.find(sp => String(sp.id) === String(sanPhamId));
  if (!sanPham) {
    hienThiThongBao('Không tìm thấy thông tin sản phẩm!', 'error');
    return;
  }

  const tonKho = Number(sanPham.quantity) || 0;
  if (tonKho <= 0) {
    hienThiThongBao('Sản phẩm này hiện tại đã hết hàng!', 'warning');
    return;
  }

  // Kiểm tra xem sản phẩm này đã từng có trong giỏ chưa
  const sanPhamTrongGio = gioHang.find(sp => String(sp.id) === String(sanPhamId));

  if (sanPhamTrongGio) {
    // Nếu số lượng trong giỏ đã đạt tới mức tối đa trong kho thì không cho thêm nữa
    if (sanPhamTrongGio.quantity >= tonKho) {
      hienThiThongBao(`Kho chỉ còn ${tonKho} sản phẩm, không thể thêm tiếp!`, 'warning');
      return;
    }
    // Tăng số lượng lên 1
    sanPhamTrongGio.quantity += 1;
  } else {
    // Nếu là sản phẩm mới, thêm vào mảng giỏ hàng với số lượng ban đầu là 1
    gioHang.push({
      id: sanPham.id,
      name: sanPham.name,
      price: Number(sanPham.price) || 0,
      image: sanPham.image || ANH_MAC_DINH,
      quantity: 1,
      maxQuantity: tonKho
    });
  }

  // Lưu giỏ hàng mới vào localStorage
  luuGioHangVaoStorage();

  // Hiển thị thông báo Toast xanh
  hienThiThongBao(`Đã thêm "${sanPham.name}" vào giỏ hàng thành công!`, 'success');
};
window.themVaoGioHang = themVaoGioHang;

/**
 * Hàm mua ngay lập tức (Buy Now)
 * Luồng hoạt động:
 * 1. Gọi hàm thêm vào giỏ hàng.
 * 2. Tự động chuyển màn hình sang giỏ hàng và thanh toán (#view-cart).
 * 
 * @param {string|number} sanPhamId - ID của sản phẩm muốn mua ngay
 */
const muaNgay = (sanPhamId) => {
  themVaoGioHang(sanPhamId);
  chuyenTrangView('view-cart');
  hienThiBangGioHang();
};
window.muaNgay = muaNgay;

/**
 * Hàm cập nhật số lượng của một món hàng trực tiếp trong bảng giỏ hàng
 * @param {string|number} sanPhamId - ID của món hàng
 * @param {number} soLuongMoi - Số lượng mới người dùng vừa chỉnh
 */
const capNhatSoLuong = (sanPhamId, soLuongMoi) => {
  const monHang = gioHang.find(sp => String(sp.id) === String(sanPhamId));
  if (!monHang) return;

  const soLuong = parseInt(soLuongMoi, 10);

  // Nếu số lượng <= 0 thì hỏi người dùng có muốn xóa không
  if (isNaN(soLuong) || soLuong <= 0) {
    xoaKhoiGioHang(sanPhamId);
    return;
  }

  // Kiểm tra tồn kho thực tế từ danh sách sản phẩm
  const sanPhamGoc = danhSachSanPham.find(sp => String(sp.id) === String(sanPhamId));
  const tonKho = sanPhamGoc ? (Number(sanPhamGoc.quantity) || 0) : 999;

  if (soLuong > tonKho) {
    hienThiThongBao(`Rất tiếc! Số lượng tồn kho chỉ còn ${tonKho} máy.`, 'warning');
    monHang.quantity = tonKho;
  } else {
    monHang.quantity = soLuong;
  }

  luuGioHangVaoStorage();
  hienThiBangGioHang();
};
window.capNhatSoLuong = capNhatSoLuong;

/**
 * Hàm xóa một sản phẩm ra khỏi giỏ hàng
 * Dùng hàm .filter() để loại bỏ phần tử có ID trùng khớp
 * @param {string|number} sanPhamId - ID của món hàng cần xóa
 */
const xoaKhoiGioHang = (sanPhamId) => {
  const monHang = gioHang.find(sp => String(sp.id) === String(sanPhamId));
  const tenMon = monHang ? monHang.name : 'sản phẩm';

  // Xác nhận trước khi xóa
  const xacNhan = confirm(`Bạn có chắc chắn muốn xóa "${tenMon}" khỏi giỏ hàng?`);
  if (!xacNhan) return;

  // Lọc giữ lại các sản phẩm có ID khác với ID cần xóa
  gioHang = gioHang.filter(sp => String(sp.id) !== String(sanPhamId));

  luuGioHangVaoStorage();
  hienThiBangGioHang();
  hienThiThongBao(`Đã xóa "${tenMon}" khỏi giỏ hàng.`, 'info');
};
window.xoaKhoiGioHang = xoaKhoiGioHang;

/**
 * Hàm hiển thị toàn bộ nội dung giỏ hàng ra bảng trong màn hình #view-cart
 * Luồng hoạt động:
 * 1. Nếu giỏ hàng rỗng: hiển thị giao diện báo giỏ hàng trống kèm nút tiếp tục mua sắm.
 * 2. Nếu có sản phẩm: duyệt mảng bằng .map() để tạo từng dòng <tr> trong bảng.
 * 3. Tính tổng tiền bằng .reduce() và hiển thị vào ô tạm tính và tổng cộng.
 * 4. Điền sẵn thông tin khách hàng vào form thanh toán (nếu đã đăng nhập).
 */
const hienThiBangGioHang = () => {
  const tbodyGioHang = $('cart-tbody');
  const oTamTinh = $('cart-subtotal');
  const oTongCong = $('cart-total');
  const hopCanhBaoDangNhap = $('checkout-auth-alert');
  const nutDatHang = $('btn-submit-order');

  if (!tbodyGioHang) return;

  // Trường hợp giỏ hàng rỗng
  if (gioHang.length === 0) {
    tbodyGioHang.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 40px 20px;">
          <i class="fas fa-cart-shopping" style="font-size: 2.5rem; color: #cbd5e1; margin-bottom: 12px; display: block;"></i>
          <p style="font-size: 1rem; color: #64748b; margin-bottom: 15px;">Giỏ hàng của bạn đang trống!</p>
          <button type="button" class="btn-primary" onclick="chuyenTrangView('view-shop')">
            <i class="fas fa-store"></i> Khám phá sản phẩm ngay
          </button>
        </td>
      </tr>
    `;
    if (oTamTinh) oTamTinh.textContent = '0 đ';
    if (oTongCong) oTongCong.textContent = '0 đ';
    if (nutDatHang) nutDatHang.disabled = true;
    return;
  }

  // Trường hợp có sản phẩm trong giỏ: duyệt mảng để tạo các hàng bảng
  let tongTien = 0;

  const chuoiHtmlCacHang = gioHang.map((monHang, viTri) => {
    const gia = Number(monHang.price) || 0;
    const soLuong = Number(monHang.quantity) || 1;
    const thanhTien = gia * soLuong;
    tongTien += thanhTien; // Cộng dồn vào tổng tiền

    return `
      <tr>
        <td>
          <div class="cart-item-cell" style="display: flex; align-items: center; gap: 12px;">
            <img 
              src="${lamSachHtml(monHang.image || ANH_MAC_DINH)}" 
              alt="${lamSachHtml(monHang.name)}" 
              class="cart-item-thumb" 
              style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0;"
              onerror="this.onerror=null; this.src='${ANH_MAC_DINH}';"
            />
            <div>
              <strong style="display: block; font-size: 0.95rem; color: #1e293b;">${lamSachHtml(monHang.name)}</strong>
              <small style="color: #64748b;">Mã SP: #${monHang.id}</small>
            </div>
          </div>
        </td>
        <td style="font-weight: 600; color: #334155;">${dinhDangTien(gia)}</td>
        <td>
          <div class="qty-control-box" style="display: flex; align-items: center; gap: 6px;">
            <button 
              type="button" 
              class="btn-qty-mini" 
              onclick="capNhatSoLuong('${monHang.id}', ${soLuong - 1})"
              style="width: 28px; height: 28px; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 4px; cursor: pointer;"
            >-</button>
            
            <input 
              type="number" 
              class="qty-input" 
              value="${soLuong}" 
              min="1" 
              max="${monHang.maxQuantity || 99}" 
              onchange="capNhatSoLuong('${monHang.id}', this.value)"
              style="width: 45px; height: 28px; text-align: center; border: 1px solid #cbd5e1; border-radius: 4px;"
            />

            <button 
              type="button" 
              class="btn-qty-mini" 
              onclick="capNhatSoLuong('${monHang.id}', ${soLuong + 1})"
              style="width: 28px; height: 28px; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 4px; cursor: pointer;"
            >+</button>
          </div>
        </td>
        <td style="font-weight: 700; color: #ef4444;">${dinhDangTien(thanhTien)}</td>
        <td>
          <button 
            type="button" 
            class="btn-remove-item" 
            onclick="xoaKhoiGioHang('${monHang.id}')"
            title="Xóa món này"
            style="background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 1.1rem; padding: 4px 8px;"
          >
            <i class="fas fa-trash-can hover-red"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  tbodyGioHang.innerHTML = chuoiHtmlCacHang;

  // Cập nhật các ô tổng tiền
  if (oTamTinh) oTamTinh.textContent = dinhDangTien(tongTien);
  if (oTongCong) oTongCong.textContent = dinhDangTien(tongTien);

  // Kiểm tra trạng thái đăng nhập để bật/tắt cảnh báo
  if (nguoiDungHienTai) {
    if (hopCanhBaoDangNhap) hopCanhBaoDangNhap.classList.add('hidden');
    if (nutDatHang) nutDatHang.disabled = false;

    // Tự động điền thông tin người dùng vào form thanh toán nếu người dùng chưa tự nhập
    const oTen = $('order-name');
    const oSdt = $('order-phone');
    const oDiaChi = $('order-address');

    if (oTen && !oTen.value) oTen.value = nguoiDungHienTai.name || '';
    if (oSdt && !oSdt.value) oSdt.value = nguoiDungHienTai.phone || '';
    if (oDiaChi && !oDiaChi.value) oDiaChi.value = nguoiDungHienTai.address || '';
  } else {
    // Nếu chưa đăng nhập, nhắc người dùng đăng nhập trước khi thanh toán
    if (hopCanhBaoDangNhap) hopCanhBaoDangNhap.classList.remove('hidden');
    if (nutDatHang) nutDatHang.disabled = true;
  }
};

// ============================================================================
// PHẦN 7: XỬ LÝ ĐẶT HÀNG & MÀN HÌNH CẢM ƠN (CHECKOUT & THANK YOU VIEW)
// ============================================================================

/**
 * Hàm xử lý khi người dùng nhấn nút "Đặt Hàng Ngay" (#checkout-form)
 * Luồng hoạt động:
 * 1. Ngăn chặn hành vi nộp form mặc định của trình duyệt (event.preventDefault).
 * 2. Kiểm tra bắt buộc phải đăng nhập.
 * 3. Kiểm tra giỏ hàng không được để trống.
 * 4. Thu thập thông tin người nhận (Họ tên, SĐT, Địa chỉ).
 * 5. Tính tổng giá trị đơn hàng.
 * 6. Sinh mã đơn hàng ngẫu nhiên 11 ký tự bắt đầu bằng # thông qua hàm taoMaDonHang().
 * 7. Gửi yêu cầu HTTP POST lên máy chủ API_ORDERS để lưu vào CSDL (db.json).
 * 8. Cập nhật trừ số lượng tồn kho của các sản phẩm tương ứng bằng HTTP PATCH lên API_PRODUCTS.
 * 9. Xóa giỏ hàng, chuyển sang màn hình Cảm Ơn (#view-thankyou) và đổ chi tiết đơn hàng vừa đặt.
 */
const xuLyDatHang = async (suKien) => {
  suKien.preventDefault(); // Ngăn chặn tải lại trang

  // 1. Kiểm tra đăng nhập
  if (!nguoiDungHienTai) {
    hienThiThongBao('Vui lòng đăng nhập tài khoản trước khi đặt hàng!', 'warning');
    chuyenTrangView('view-account');
    return;
  }

  // 2. Kiểm tra giỏ hàng
  if (gioHang.length === 0) {
    hienThiThongBao('Giỏ hàng đang trống! Vui lòng chọn sản phẩm.', 'warning');
    return;
  }

  // 3. Lấy thông tin từ form
  const hoTenNguoiNhan = ($('order-name')?.value || '').trim();
  const soDienThoai = ($('order-phone')?.value || '').trim();
  const diaChiNhanHang = ($('order-address')?.value || '').trim();

  if (!hoTenNguoiNhan || !soDienThoai || !diaChiNhanHang) {
    hienThiThongBao('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng!', 'warning');
    return;
  }

  const nutNop = $('btn-submit-order');
  if (nutNop) {
    nutNop.disabled = true;
    nutNop.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý đơn hàng...';
  }

  try {
    // 4. Tính tổng tiền đơn hàng bằng hàm reduce
    const tongTien = gioHang.reduce((tong, sp) => tong + (sp.price * sp.quantity), 0);

    // 5. Sinh mã đơn hàng ngẫu nhiên 11 ký tự (Chuẩn: #XXXXXXXXXX)
    const maDonHangMoi = taoMaDonHang();

    // 6. Tạo đối tượng đơn hàng đầy đủ cấu trúc
    const doiTuongDonHang = {
      order_code: maDonHangMoi,
      user_id: nguoiDungHienTai.id,
      customer_name: hoTenNguoiNhan,
      customer_email: nguoiDungHienTai.email || '',
      customer_phone: soDienThoai,
      shipping_address: diaChiNhanHang,
      items: gioHang.map(sp => ({
        product_id: sp.id,
        product_name: sp.name,
        price: sp.price,
        quantity: sp.quantity,
        image: sp.image || ANH_MAC_DINH
      })),
      total_price: tongTien,
      status: 'Đang xử lý', // Trạng thái ban đầu mặc định của đơn hàng
      created_at: new Date().toISOString() // Lưu ngày giờ đặt hàng theo chuẩn ISO
    };

    // 7. Gửi đơn hàng lên máy chủ JSON-Server qua phương thức POST
    const donHangDaTao = await goiApi(API_ORDERS, 'POST', doiTuongDonHang);

    // 8. Cập nhật trừ số lượng tồn kho (quantity) của từng sản phẩm đã mua trên máy chủ
    for (const monHang of gioHang) {
      const sanPhamTrongKho = danhSachSanPham.find(sp => String(sp.id) === String(monHang.id));
      if (sanPhamTrongKho) {
        const soLuongConLai = Math.max(0, (Number(sanPhamTrongKho.quantity) || 0) - monHang.quantity);
        // Gửi PATCH để chỉ cập nhật riêng trường quantity
        await goiApi(`${API_PRODUCTS}/${monHang.id}`, 'PATCH', { quantity: soLuongConLai });
        sanPhamTrongKho.quantity = soLuongConLai; // Cập nhật lại bộ nhớ đệm
      }
    }

    // 9. Xóa trắng giỏ hàng sau khi đặt thành công
    gioHang = [];
    luuGioHangVaoStorage();

    // Reset lại form đặt hàng
    $('checkout-form')?.reset();

    // 10. Chuyển sang màn hình Cảm Ơn và hiển thị thông tin đơn hàng vừa đặt
    hienThiManHinhCamOn(donHangDaTao);

    hienThiThongBao('Chúc mừng bạn đã đặt hàng thành công!', 'success');

  } catch (loi) {
    console.error('Lỗi khi gửi đơn hàng:', loi);
    hienThiThongBao('Có lỗi xảy ra khi lưu đơn hàng. Vui lòng thử lại!', 'error');
  } finally {
    if (nutNop) {
      nutNop.disabled = false;
      nutNop.innerHTML = '<i class="fas fa-check-circle"></i> Đặt Hàng Ngay';
    }
  }
};

/**
 * Hàm hiển thị màn hình Cảm Ơn (#view-thankyou) với chi tiết đơn hàng vừa mua
 * @param {object} donHang - Đối tượng đơn hàng vừa được máy chủ trả về
 */
const hienThiManHinhCamOn = (donHang) => {
  chuyenTrangView('view-thankyou');

  // Đổ mã đơn hàng chuẩn 11 ký tự
  const oMaDon = $('placed-order-id');
  if (oMaDon) oMaDon.textContent = donHang.order_code || donHang.id || '#SMARTSTORE';

  // Đổ thông tin người nhận
  const oTen = $('placed-order-name');
  if (oTen) oTen.textContent = donHang.customer_name || '—';

  const oSdt = $('placed-order-phone');
  if (oSdt) oSdt.textContent = donHang.customer_phone || '—';

  const oDiaChi = $('placed-order-address');
  if (oDiaChi) oDiaChi.textContent = donHang.shipping_address || '—';

  // Đổ tổng tiền thanh toán
  const oTongTien = $('placed-order-total');
  if (oTongTien) oTongTien.textContent = dinhDangTien(donHang.total_price);

  // Đổ danh sách các sản phẩm đã mua
  const khungDanhSachMon = $('placed-items-list');
  if (khungDanhSachMon && Array.isArray(donHang.items)) {
    khungDanhSachMon.innerHTML = donHang.items.map(sp => `
      <div class="placed-item-row" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px dashed #e2e8f0;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <img 
            src="${lamSachHtml(sp.image || ANH_MAC_DINH)}" 
            alt="${lamSachHtml(sp.product_name)}" 
            style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px; border: 1px solid #e2e8f0;"
            onerror="this.onerror=null; this.src='${ANH_MAC_DINH}';"
          />
          <div>
            <div style="font-weight: 600; font-size: 0.9rem; color: #1e293b;">${lamSachHtml(sp.product_name)}</div>
            <div style="font-size: 0.8rem; color: #64748b;">Số lượng: x${sp.quantity}</div>
          </div>
        </div>
        <div style="font-weight: 700; color: #0f172a; font-size: 0.95rem;">
          ${dinhDangTien(sp.price * sp.quantity)}
        </div>
      </div>
    `).join('');
  }
};

// ============================================================================
// PHẦN 8: XEM LỊCH SỬ ĐƠN HÀNG CỦA KHÁCH HÀNG (ORDER HISTORY VIEW)
// ============================================================================

/**
 * Hàm lấy và hiển thị danh sách tất cả các đơn hàng mà tài khoản này đã từng mua (#view-orders)
 * Luồng hoạt động:
 * 1. Kiểm tra xem người dùng đã đăng nhập chưa:
 *    - Nếu chưa: hiện thẻ thông báo yêu cầu đăng nhập.
 *    - Nếu đã đăng nhập: gọi API_ORDERS kèm query user_id để lấy đúng các đơn của người đó.
 * 2. Lặp qua các đơn hàng để hiển thị mã đơn hàng, ngày đặt, trạng thái, danh sách món và tổng tiền.
 */
const hienThiLichSuDonHang = async () => {
  const hopCanhBaoChuaDangNhap = $('orders-not-logged');
  const danhSachDonHangContainer = $('orders-history-list');

  if (!danhSachDonHangContainer) return;

  // Nếu chưa đăng nhập thì hiện khối nhắc nhở
  if (!nguoiDungHienTai) {
    if (hopCanhBaoChuaDangNhap) hopCanhBaoChuaDangNhap.classList.remove('hidden');
    danhSachDonHangContainer.innerHTML = '';
    return;
  }

  // Đã đăng nhập: ẩn khối nhắc nhở
  if (hopCanhBaoChuaDangNhap) hopCanhBaoChuaDangNhap.classList.add('hidden');

  danhSachDonHangContainer.innerHTML = `
    <div style="text-align: center; padding: 40px;">
      <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #3b82f6;"></i>
      <p style="margin-top: 10px; color: #64748b;">Đang tải lịch sử mua hàng của bạn...</p>
    </div>
  `;

  try {
    // Gọi API lấy danh sách đơn hàng của người dùng hiện tại
    const tatCaDonHang = await goiApi(`${API_ORDERS}?user_id=${nguoiDungHienTai.id}`);

    // Sắp xếp đơn hàng mới nhất lên đầu bằng hàm .sort() đảo ngược theo thời gian
    const danhSachDon = (Array.isArray(tatCaDonHang) ? tatCaDonHang : []).reverse();

    if (danhSachDon.length === 0) {
      danhSachDonHangContainer.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 50px 20px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
          <i class="fas fa-receipt" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 15px;"></i>
          <h3 style="font-size: 1.2rem; color: #334155;">Bạn chưa có đơn đặt hàng nào!</h3>
          <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 20px;">Hãy dạo qua cửa hàng và chọn cho mình một chiếc gaming phone ưng ý nhé.</p>
          <button type="button" class="btn-primary" onclick="chuyenTrangView('view-shop')">
            <i class="fas fa-bag-shopping"></i> Mua sắm ngay bây giờ
          </button>
        </div>
      `;
      return;
    }

    // Chuyển đổi từng đơn hàng thành một thẻ HTML đẹp mắt
    const chuoiHtmlDonHang = danhSachDon.map(don => {
      // Xác định class màu sắc cho huy hiệu trạng thái
      let classTrangThai = 'status-processing';
      if (don.status === 'Đang giao hàng') classTrangThai = 'status-shipping';
      if (don.status === 'Đã giao hàng') classTrangThai = 'status-delivered';
      if (don.status === 'Đã hủy') classTrangThai = 'status-cancelled';

      // Định dạng ngày giờ mua hàng dễ đọc
      const thoiGian = don.created_at ? new Date(don.created_at).toLocaleString('vi-VN') : 'Vừa xong';

      // Mã đơn hàng hiển thị (chuẩn 11 ký tự bắt đầu bằng #)
      const maHienThi = don.order_code || don.id || '#SMARTSTORE';

      // Danh sách các món hàng bên trong
      const chuoiCacMon = Array.isArray(don.items) ? don.items.map(item => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 0.9rem;">
          <span style="color: #334155;">
            <i class="fas fa-mobile-screen" style="color: #94a3b8; margin-right: 6px;"></i>
            ${lamSachHtml(item.product_name)} 
            <strong style="color: #64748b;">(x${item.quantity})</strong>
          </span>
          <span style="font-weight: 600; color: #0f172a;">${dinhDangTien(item.price * item.quantity)}</span>
        </div>
      `).join('') : '<p style="color: #94a3b8; font-style: italic;">Không có thông tin chi tiết sản phẩm.</p>';

      return `
        <div class="order-history-card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
            <div>
              <span style="font-size: 0.85rem; color: #64748b;">Mã đơn hàng:</span>
              <strong style="font-size: 1.05rem; color: #2563eb; margin-left: 6px; letter-spacing: 0.5px;">${lamSachHtml(maHienThi)}</strong>
              <span style="font-size: 0.8rem; color: #94a3b8; margin-left: 12px;">(${thoiGian})</span>
            </div>
            <div>
              <span class="status-badge ${classTrangThai}">${lamSachHtml(don.status || 'Đang xử lý')}</span>
            </div>
          </div>

          <div style="margin-bottom: 12px; background: #f8fafc; padding: 12px; border-radius: 6px;">
            <div style="font-size: 0.85rem; color: #475569; margin-bottom: 4px;">
              <strong>Địa chỉ nhận:</strong> ${lamSachHtml(don.shipping_address || '—')} 
              <span style="margin: 0 6px;">•</span> 
              <strong>SĐT:</strong> ${lamSachHtml(don.customer_phone || '—')}
            </div>
          </div>

          <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 12px;">
            ${chuoiCacMon}
          </div>

          <div style="display: flex; justify-content: flex-end; align-items: center; gap: 8px;">
            <span style="font-size: 0.9rem; color: #64748b;">Tổng tiền thanh toán:</span>
            <strong style="font-size: 1.2rem; color: #ef4444;">${dinhDangTien(don.total_price)}</strong>
          </div>
        </div>
      `;
    }).join('');

    danhSachDonHangContainer.innerHTML = chuoiHtmlDonHang;

  } catch (loi) {
    console.error('Lỗi khi tải lịch sử đơn hàng:', loi);
    danhSachDonHangContainer.innerHTML = `
      <div style="text-align: center; padding: 30px; color: #ef4444;">
        <i class="fas fa-triangle-exclamation" style="font-size: 2rem;"></i>
        <p style="margin-top: 10px;">Không thể tải lịch sử đơn hàng từ máy chủ!</p>
      </div>
    `;
  }
};

// ============================================================================
// PHẦN 9: QUẢN LÝ TÀI KHOẢN & NGƯỜI DÙNG TỰ SỬA THÔNG TIN CÁ NHÂN (USER PROFILE)
// ============================================================================

/**
 * Hàm cập nhật hiển thị giao diện của trang Tài khoản (#view-account)
 * Luồng hoạt động:
 * - Nếu người dùng đã đăng nhập: ẩn form đăng nhập/đăng ký, hiển thị thông tin cá nhân và form đổi mật khẩu.
 * - Nếu chưa đăng nhập: ẩn khung thông tin cá nhân, hiển thị form Đăng nhập/Đăng ký.
 */
const capNhatGiaoDienTaiKhoan = () => {
  const hopDaDangNhap = $('account-logged-box');
  const hopFormChuaDangNhap = $('auth-forms-wrapper');

  if (!hopDaDangNhap || !hopFormChuaDangNhap) return;

  if (nguoiDungHienTai) {
    // Đã đăng nhập: ẩn form auth, hiện thông tin cá nhân
    hopDaDangNhap.classList.remove('hidden');
    hopFormChuaDangNhap.classList.add('hidden');

    // Đổ dữ liệu vào các thẻ hiển thị
    if ($('account-user-name')) $('account-user-name').textContent = nguoiDungHienTai.name || 'Người dùng';
    if ($('account-user-email')) $('account-user-email').textContent = nguoiDungHienTai.email || '';
    if ($('profile-name-val')) $('profile-name-val').textContent = nguoiDungHienTai.name || '—';
    if ($('profile-phone')) $('profile-phone').textContent = nguoiDungHienTai.phone || '—';
    if ($('profile-address')) $('profile-address').textContent = nguoiDungHienTai.address || '—';
    if ($('profile-role')) $('profile-role').textContent = nguoiDungHienTai.role === 'admin' ? 'Quản trị viên (Admin)' : 'Khách hàng';

    // Đổ sẵn dữ liệu vào form chỉnh sửa thông tin cá nhân
    if ($('edit-profile-name')) $('edit-profile-name').value = nguoiDungHienTai.name || '';
    if ($('edit-profile-phone')) $('edit-profile-phone').value = nguoiDungHienTai.phone || '';
    if ($('edit-profile-address')) $('edit-profile-address').value = nguoiDungHienTai.address || '';

  } else {
    // Chưa đăng nhập: hiện form auth, ẩn khung thông tin cá nhân
    hopDaDangNhap.classList.add('hidden');
    hopFormChuaDangNhap.classList.remove('hidden');
  }
};

/**
 * Hàm ẩn/hiện khung chỉnh sửa thông tin cá nhân (Toggle Edit Profile Form)
 */
const batTatKhungSuaThongTin = () => {
  const khungSua = $('edit-profile-card');
  if (!khungSua) return;
  khungSua.classList.toggle('hidden');

  // Nếu mở khung sửa ra thì tự động focus vào ô họ tên
  if (!khungSua.classList.contains('hidden')) {
    $('edit-profile-name')?.focus();
  }
};

/**
 * Hàm xử lý khi người dùng nộp form tự sửa thông tin cá nhân của chính mình (#edit-profile-form)
 * Luồng hoạt động:
 * 1. Thu thập dữ liệu mới từ các ô input: Họ tên, Số điện thoại, Địa chỉ nhận hàng.
 * 2. Kiểm tra tính hợp lệ (không được để trống).
 * 3. Gửi yêu cầu HTTP PATCH lên API_USERS/${nguoiDungHienTai.id} để cập nhật vào db.json.
 * 4. Cập nhật lại đối tượng nguoiDungHienTai và ghi đè vào localStorage.
 * 5. Cập nhật lại giao diện ngay tức thì và hiện Toast thông báo thành công.
 * 
 * @param {Event} suKien - Sự kiện submit form
 */
const xuLyCapNhatThongTinNguoiDung = async (suKien) => {
  suKien.preventDefault(); // Ngăn nộp lại trang

  if (!nguoiDungHienTai) {
    hienThiThongBao('Bạn chưa đăng nhập!', 'warning');
    return;
  }

  // Lấy giá trị mới từ form
  const hoTenMoi = ($('edit-profile-name')?.value || '').trim();
  const sdtMoi = ($('edit-profile-phone')?.value || '').trim();
  const diaChiMoi = ($('edit-profile-address')?.value || '').trim();

  // Kiểm tra rỗng
  if (!hoTenMoi || !sdtMoi || !diaChiMoi) {
    hienThiThongBao('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ!', 'warning');
    return;
  }

  try {
    // Gửi yêu cầu PATCH lên server JSON-Server để cập nhật thông tin người dùng
    const nguoiDungCapNhat = await goiApi(`${API_USERS}/${nguoiDungHienTai.id}`, 'PATCH', {
      name: hoTenMoi,
      phone: sdtMoi,
      address: diaChiMoi
    });

    // Cập nhật lại thông tin trong biến toàn cục và localStorage
    nguoiDungHienTai = { ...nguoiDungHienTai, ...nguoiDungCapNhat };
    localStorage.setItem(KEY_NGUOI_DUNG, JSON.stringify(nguoiDungHienTai));

    // Làm mới giao diện tài khoản
    capNhatGiaoDienTaiKhoan();

    // Ẩn khung form sửa lại
    $('edit-profile-card')?.classList.add('hidden');

    hienThiThongBao('Cập nhật thông tin cá nhân thành công!', 'success');

  } catch (loi) {
    console.error('Lỗi khi cập nhật thông tin người dùng:', loi);
    hienThiThongBao('Không thể cập nhật thông tin cá nhân. Vui lòng thử lại!', 'error');
  }
};

/**
 * Hàm xử lý đăng nhập tài khoản (#login-form)
 * @param {Event} suKien - Sự kiện nộp form đăng nhập
 */
const xuLyDangNhap = async (suKien) => {
  suKien.preventDefault();

  const email = ($('login-email')?.value || '').trim();
  const password = ($('login-password')?.value || '').trim();

  if (!email || !password) {
    hienThiThongBao('Vui lòng nhập đầy đủ Email và Mật khẩu!', 'warning');
    return;
  }

  try {
    // Tìm tài khoản trên server có email và password khớp
    const danhSachNguoiDung = await goiApi(`${API_USERS}?email=${encodeURIComponent(email)}`);

    const taiKhoan = Array.isArray(danhSachNguoiDung) ? danhSachNguoiDung[0] : null;

    if (!taiKhoan || taiKhoan.password !== password) {
      hienThiThongBao('Email hoặc mật khẩu không chính xác!', 'error');
      return;
    }

    // Đăng nhập thành công: lưu vào bộ nhớ
    nguoiDungHienTai = taiKhoan;
    localStorage.setItem(KEY_NGUOI_DUNG, JSON.stringify(nguoiDungHienTai));

    // Reset form đăng nhập
    $('login-form')?.reset();

    // Cập nhật giao diện
    capNhatGiaoDienTaiKhoan();

    hienThiThongBao(`Chào mừng ${taiKhoan.name || 'bạn'} đã đăng nhập thành công!`, 'success');

  } catch (loi) {
    console.error('Lỗi khi đăng nhập:', loi);
    hienThiThongBao('Lỗi kết nối máy chủ khi đăng nhập!', 'error');
  }
};

/**
 * Hàm xử lý đăng ký tài khoản mới (#register-form)
 * @param {Event} suKien - Sự kiện nộp form đăng ký
 */
const xuLyDangKy = async (suKien) => {
  suKien.preventDefault();

  const name = ($('reg-name')?.value || '').trim();
  const email = ($('reg-email')?.value || '').trim();
  const phone = ($('reg-phone')?.value || '').trim();
  const password = ($('reg-password')?.value || '').trim();
  const address = ($('reg-address')?.value || '').trim();

  if (!name || !email || !phone || !password) {
    hienThiThongBao('Vui lòng điền đầy đủ các thông tin bắt buộc (*)!', 'warning');
    return;
  }

  if (password.length < 6) {
    hienThiThongBao('Mật khẩu phải có tối thiểu 6 ký tự!', 'warning');
    return;
  }

  try {
    // 1. Kiểm tra xem email này đã từng được đăng ký chưa
    const kiemTraEmail = await goiApi(`${API_USERS}?email=${encodeURIComponent(email)}`);
    if (Array.isArray(kiemTraEmail) && kiemTraEmail.length > 0) {
      hienThiThongBao('Email này đã được sử dụng bởi một tài khoản khác!', 'warning');
      return;
    }

    // 2. Tạo đối tượng người dùng mới
    const taiKhoanMoi = {
      name,
      email,
      phone,
      password,
      address,
      role: 'customer' // Mặc định là tài khoản khách hàng
    };

    // 3. Gửi POST lên server để lưu vào db.json
    const taiKhoanDaTao = await goiApi(API_USERS, 'POST', taiKhoanMoi);

    // 4. Tự động đăng nhập luôn tài khoản vừa tạo
    nguoiDungHienTai = taiKhoanDaTao;
    localStorage.setItem(KEY_NGUOI_DUNG, JSON.stringify(nguoiDungHienTai));

    // Reset form đăng ký
    $('register-form')?.reset();

    // Cập nhật giao diện
    capNhatGiaoDienTaiKhoan();

    hienThiThongBao('Đăng ký tài khoản mới thành công!', 'success');

  } catch (loi) {
    console.error('Lỗi khi đăng ký:', loi);
    hienThiThongBao('Không thể đăng ký tài khoản lúc này!', 'error');
  }
};

/**
 * Hàm xử lý đổi mật khẩu (#change-password-form)
 * @param {Event} suKien - Sự kiện nộp form đổi mật khẩu
 */
const xuLyDoiMatKhau = async (suKien) => {
  suKien.preventDefault();

  if (!nguoiDungHienTai) {
    hienThiThongBao('Bạn chưa đăng nhập!', 'warning');
    return;
  }

  const matKhauCu = ($('old-pass')?.value || '').trim();
  const matKhauMoi = ($('new-pass')?.value || '').trim();
  const xacNhanMatKhau = ($('confirm-new-pass')?.value || '').trim();

  // Kiểm tra mật khẩu cũ
  if (matKhauCu !== nguoiDungHienTai.password) {
    hienThiThongBao('Mật khẩu hiện tại không đúng!', 'error');
    return;
  }

  if (matKhauMoi.length < 6) {
    hienThiThongBao('Mật khẩu mới phải có tối thiểu 6 ký tự!', 'warning');
    return;
  }

  if (matKhauMoi !== xacNhanMatKhau) {
    hienThiThongBao('Xác nhận mật khẩu mới không trùng khớp!', 'warning');
    return;
  }

  try {
    // Gửi PATCH cập nhật mật khẩu mới lên server
    await goiApi(`${API_USERS}/${nguoiDungHienTai.id}`, 'PATCH', {
      password: matKhauMoi
    });

    // Cập nhật lại thông tin trong bộ nhớ
    nguoiDungHienTai.password = matKhauMoi;
    localStorage.setItem(KEY_NGUOI_DUNG, JSON.stringify(nguoiDungHienTai));

    // Xóa trắng form đổi mật khẩu
    $('change-password-form')?.reset();

    hienThiThongBao('Đổi mật khẩu tài khoản thành công!', 'success');

  } catch (loi) {
    console.error('Lỗi khi đổi mật khẩu:', loi);
    hienThiThongBao('Không thể cập nhật mật khẩu mới lúc này!', 'error');
  }
};

/**
 * Hàm đăng xuất tài khoản
 */
const xuLyDangXuat = () => {
  const xacNhan = confirm('Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?');
  if (!xacNhan) return;

  // Xóa thông tin người dùng khỏi bộ nhớ
  nguoiDungHienTai = null;
  localStorage.removeItem(KEY_NGUOI_DUNG);

  // Cập nhật lại giao diện tài khoản
  capNhatGiaoDienTaiKhoan();

  hienThiThongBao('Đã đăng xuất tài khoản thành công.', 'info');
};

// ============================================================================
// PHẦN 10: ĐĂNG KÝ SỰ KIỆN KHỞI CHẠY (EVENT LISTENERS INITIALIZATION)
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Tải dữ liệu ban đầu
  khoiTaoUngDung();

  // 2. Bắt sự kiện chuyển view từ các nút trên Header
  $('nav-shop')?.addEventListener('click', (e) => {
    e.preventDefault();
    chuyenTrangView('view-shop');
  });

  $('nav-cart')?.addEventListener('click', (e) => {
    e.preventDefault();
    chuyenTrangView('view-cart');
    hienThiBangGioHang();
  });

  $('nav-orders')?.addEventListener('click', (e) => {
    e.preventDefault();
    chuyenTrangView('view-orders');
  });

  $('nav-account')?.addEventListener('click', (e) => {
    e.preventDefault();
    chuyenTrangView('view-account');
  });

  // Nút trên logo trang chủ
  $('brand-home-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    chuyenTrangView('view-shop');
  });

  // Nút trên banner quảng cáo
  $('btn-banner-shop')?.addEventListener('click', () => {
    chuyenTrangView('view-shop');
  });

  // 3. Bắt sự kiện lọc và tìm kiếm sản phẩm
  // Mỗi khi người dùng gõ từ khóa hoặc đổi danh mục/giá thì reset về trang 1
  $('shop-search')?.addEventListener('input', () => {
    trangHienTai = 1;
    hienThiDanhSachSanPham();
  });

  $('shop-filter-category')?.addEventListener('change', () => {
    trangHienTai = 1;
    hienThiDanhSachSanPham();
  });

  $('shop-filter-price')?.addEventListener('change', () => {
    trangHienTai = 1;
    hienThiDanhSachSanPham();
  });

  // 4. Bắt sự kiện form đặt hàng
  $('checkout-form')?.addEventListener('submit', xuLyDatHang);

  // 5. Các nút điều hướng trong màn hình Cảm Ơn
  $('btn-view-order-history')?.addEventListener('click', () => {
    chuyenTrangView('view-orders');
  });

  $('btn-back-to-shop')?.addEventListener('click', () => {
    chuyenTrangView('view-shop');
  });

  // 6. Nút điều hướng đăng nhập từ màn hình Lịch sử đơn hàng
  $('btn-orders-go-login')?.addEventListener('click', () => {
    chuyenTrangView('view-account');
  });

  // 7. Nút xem nhanh đơn hàng từ màn hình tài khoản
  $('btn-account-view-orders')?.addEventListener('click', () => {
    chuyenTrangView('view-orders');
  });

  // 8. Chức năng User tự sửa thông tin cá nhân
  $('btn-toggle-edit-profile')?.addEventListener('click', batTatKhungSuaThongTin);
  $('btn-cancel-edit-profile')?.addEventListener('click', batTatKhungSuaThongTin);
  $('edit-profile-form')?.addEventListener('submit', xuLyCapNhatThongTinNguoiDung);

  // 9. Bắt sự kiện tab chuyển đổi giữa Đăng Nhập và Đăng Ký
  $('tab-btn-login')?.addEventListener('click', () => {
    $('tab-btn-login')?.classList.add('active');
    $('tab-btn-register')?.classList.remove('active');
    $('login-form')?.classList.remove('hidden');
    $('register-form')?.classList.add('hidden');
  });

  $('tab-btn-register')?.addEventListener('click', () => {
    $('tab-btn-register')?.classList.add('active');
    $('tab-btn-login')?.classList.remove('active');
    $('register-form')?.classList.remove('hidden');
    $('login-form')?.classList.add('hidden');
  });

  // 10. Bắt sự kiện form Đăng nhập, Đăng ký, Đổi mật khẩu, Đăng xuất
  $('login-form')?.addEventListener('submit', xuLyDangNhap);
  $('register-form')?.addEventListener('submit', xuLyDangKy);
  $('change-password-form')?.addEventListener('submit', xuLyDoiMatKhau);
  $('btn-logout')?.addEventListener('click', xuLyDangXuat);
});
