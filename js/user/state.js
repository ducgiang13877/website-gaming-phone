/**
 * ============================================================================
 * DỰ ÁN: SMARTSTORE - THẾ GIỚI SMARTPHONE & GAMING PHONE
 * MODULE: js/user/state.js (CẤU HÌNH, TRẠNG THÁI TOÀN CỤC & TIỆN ÍCH DÙNG CHUNG)
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * Sinh viên thực hiện: Lương Văn Dũng
 * ============================================================================
 */

// ============================================================================
// 1. CẤU HÌNH HẰNG SỐ & STATE QUẢN LÝ DỮ LIỆU TOÀN CỤC
// ============================================================================

/**
 * 🎯 Cấu hình URL gốc của máy chủ RESTful API (chạy qua json-server cổng 3000)
 * 🎯 Hằng số số lượng sản phẩm phân trang
 */
var API_URL = 'http://localhost:3000';
var SO_SP_MOI_TRANG = 8;

/**
 * 🎯 Quản lý trạng thái (State) ứng dụng lưu trong bộ nhớ RAM trình duyệt
 */
var dsSanPham = []; // Danh sách 40 sản phẩm điện thoại lấy từ API
var dsDanhMuc = []; // Danh sách 8 thương hiệu (Apple, Samsung, Xiaomi, ROG...)
var gioHang = JSON.parse(localStorage.getItem('smartstore_cart')) || []; // Giỏ hàng lưu LocalStorage
var nguoiDungHienTai = JSON.parse(localStorage.getItem('smartstore_user')) || null; // User đang đăng nhập
var dsSoSanh = JSON.parse(sessionStorage.getItem('smartstore_compare')) || []; // Danh sách so sánh (tối đa 3 máy)
var donHangVuaDat = null; // Lưu đơn hàng vừa tạo để hiển thị trang cảm ơn
var pendingSmartUser = null; // Tài khoản nhận diện tạm thời khi phát hiện trùng Email/SĐT

/**
 * 🎯 Quản lý trạng thái bộ lọc sản phẩm cửa hàng (Store Filter State)
 */
var boLoc = {
  hang: 'all',          // Mã danh mục hãng (1: Apple, 2: Samsung...) hoặc 'all'
  nhuCau: 'all',        // Nhu cầu (gaming, camera, pin, gia-re)
  tuKhoa: '',          // Từ khóa tìm kiếm ô search
  khoangGia: 'all',     // Mức giá (duoi-10tr, 10-20tr, 20-30tr, tren-30tr)
  sapXep: 'default',    // Kiểu sắp xếp (gia-tang, gia-giam, moi-nhat, ban-chay)
  trang: 1              // Trang hiện tại trong phân trang
};

// ============================================================================
// 2. CÁC TIỆN ÍCH DÙNG CHUNG (UTILITIES & MICRO-INTERACTIONS)
// ============================================================================

/**
 * 🎯 Mục đích: Định dạng số nguyên thành chuỗi tiền tệ Việt Nam (VNĐ)
 * ⚙️ Hàm có sẵn: Number.prototype.toLocaleString('vi-VN')
 * 🔄 Luồng chạy: Input (số tiền number) -> Kiểm tra tính hợp lệ -> Format kèm ký hiệu đ -> Output chuỗi
 */
function dinhDangTien(soTien) {
  if (soTien === undefined || soTien === null || isNaN(soTien)) return '0 đ';
  return Number(soTien).toLocaleString('vi-VN') + ' đ';
}

/**
 * 🎯 Mục đích: Hiển thị thông báo Toast nổi góc trên màn hình với animation mượt mà
 * ⚙️ Hàm có sẵn: document.createElement, setTimeout, Element.classList
 * 🔄 Luồng chạy: Tạo node div -> Gán class theo loại (success/error/warning/info) -> Chèn vào DOM -> Tự biến mất sau 3 giây
 */
function hienThongBao(noiDung, loai = 'info') {
  let hopChua = document.getElementById('toast-container');
  if (!hopChua) {
    hopChua = document.createElement('div');
    hopChua.id = 'toast-container';
    hopChua.className = 'toast-container';
    document.body.appendChild(hopChua);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${loai}`;

  let iconClass = 'fa-circle-info';
  if (loai === 'success') iconClass = 'fa-circle-check';
  if (loai === 'error') iconClass = 'fa-circle-exclamation';
  if (loai === 'warning') iconClass = 'fa-triangle-exclamation';

  toast.innerHTML = `
    <i class="fa-solid ${iconClass}"></i>
    <div class="toast-message">${noiDung}</div>
  `;

  hopChua.appendChild(toast);

  // Kích hoạt animation hiện ra
  setTimeout(() => toast.classList.add('show'), 10);

  // Tự động mờ dần và gỡ bỏ khỏi DOM sau 3200ms
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

/**
 * 🎯 Mục đích: Mở một hộp thoại Modal theo ID
 */
function moModal(idModal) {
  const modal = document.getElementById(idModal);
  if (modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden'; // Ngăn cuộn trang phía sau
  }
}

/**
 * 🎯 Mục đích: Đóng hộp thoại Modal theo ID
 */
function dongModal(idModal) {
  const modal = document.getElementById(idModal);
  if (modal) {
    modal.classList.remove('show');
    document.body.style.overflow = ''; // Phục hồi cuộn trang
  }
}

/**
 * 🎯 Mục đích: Đồng bộ giỏ hàng vào LocalStorage và cập nhật Badge số lượng trên Header
 * ⚙️ Hàm có sẵn: JSON.stringify, localStorage.setItem
 */
function luuGioHang() {
  localStorage.setItem('smartstore_cart', JSON.stringify(gioHang));
  capNhatBadge();
}

/**
 * 🎯 Mục đích: Tính tổng số lượng máy trong giỏ và cập nhật Dấu Chấm Đỏ (#cart-badge-count)
 * ⚙️ Hàm có sẵn: Array.prototype.reduce, Element.classList.remove, void offsetWidth, Element.classList.add
 * 🔄 Luồng chạy:
 *   1. Dùng reduce tính tổng (item.quantity) của toàn bộ các sản phẩm trong giỏ.
 *   2. Cập nhật số vào badge giỏ hàng trên Header.
 *   3. Nếu số lượng > 0 thì hiện badge kèm animation nảy số (Bouncing reflow). Nếu = 0 thì ẩn đi.
 *   4. Đồng bộ số lượng máy đang so sánh vào badge So Sánh.
 */
function capNhatBadge() {
  const badgeCart = document.getElementById('cart-badge-count');
  if (badgeCart) {
    const tongSoLuong = gioHang.reduce((tong, item) => tong + (Number(item.quantity) || 0), 0);
    badgeCart.textContent = tongSoLuong;

    if (tongSoLuong > 0) {
      badgeCart.style.display = 'flex';
      // Kỹ thuật ép trình duyệt Render lại (Force Reflow) để chạy lại animation nảy số mượt mà
      badgeCart.classList.remove('bump');
      void badgeCart.offsetWidth;
      badgeCart.classList.add('bump');
    } else {
      badgeCart.style.display = 'none';
    }
  }

  // Cập nhật số lượng máy so sánh
  const slSoSanh = dsSoSanh.length;
  const badgeSoSanh = document.getElementById('compare-badge-count');
  if (badgeSoSanh) {
    badgeSoSanh.textContent = slSoSanh;
    badgeSoSanh.style.display = slSoSanh > 0 ? 'inline-block' : 'none';
  }
  const dockCount = document.getElementById('dock-compare-count');
  if (dockCount) dockCount.textContent = slSoSanh;
}

// ============================================================================
// 3. KẾT NỐI API & TẢI DỮ LIỆU BẤT ĐỒNG BỘ (ASYNC DATA LAYER - FETCH API)
// ============================================================================

/**
 * 🎯 Mục đích: Tải toàn bộ Danh mục và Sản phẩm từ máy chủ API song song
 * ⚙️ Hàm có sẵn: Promise.all, fetch, Response.json, async/await
 * 🔄 Luồng chạy:
 *   1. Gọi song song 2 request GET /categories và GET /products bằng Promise.all.
 *   2. Nhận kết quả giải mã JSON gán vào 2 biến State toàn cục (dsDanhMuc, dsSanPham).
 *   3. Khởi tạo giao diện trang chủ, cập nhật dropdown hãng, cập nhật Badge và Menu Header.
 */
async function taiDuLieu() {
  try {
    const [resDM, resSP] = await Promise.all([
      fetch(`${API_URL}/categories`),
      fetch(`${API_URL}/products`)
    ]);

    if (!resDM.ok || !resSP.ok) {
      throw new Error('Không thể kết nối đến máy chủ CSDL json-server!');
    }

    dsDanhMuc = await resDM.json();
    dsSanPham = await resSP.json();

    // Điền danh mục vào dropdown bộ lọc trang Cửa Hàng
    const selectHang = document.getElementById('filter-brand-select');
    if (selectHang) {
      selectHang.innerHTML = '<option value="all">Tất cả thương hiệu</option>' +
        dsDanhMuc.map(dm => `<option value="${dm.id}">${dm.name}</option>`).join('');
    }

    // Cập nhật trạng thái hiển thị ban đầu
    capNhatBadge();
    capNhatNguoiDungHeader();

    // Hiển thị dữ liệu trang chủ mặc định
    hienThiTrangChu();
    khoiTaoDemNguocFlashSale();
  } catch (loi) {
    console.error('Lỗi khởi tạo ứng dụng:', loi);
    hienThongBao('Không thể kết nối đến API CSDL. Hãy bật json-server cổng 3000!', 'error');
  }
}

// ============================================================================
// 4. ĐIỀU HƯỚNG SPA 12 TRANG (SINGLE PAGE APPLICATION ROUTER)
// ============================================================================

/**
 * 🎯 Mục đích: Điều hướng giữa 12 phân vùng giao diện mà không tải lại trang (Zero Reload)
 * ⚙️ Hàm có sẵn: document.querySelectorAll, Element.classList.remove, Element.classList.add, window.scrollTo
 * 🔄 Luồng chạy:
 *   1. Ẩn tất cả các `<section class="view-panel">` bằng cách xóa class `active`.
 *   2. Tìm trang mục tiêu `#view-${tenTrang}` và thêm class `active` để hiển thị mượt mà.
 *   3. Cập nhật class `active` trên thanh Menu điều hướng Header.
 *   4. Cuộn màn hình lên vị trí đầu trang `window.scrollTo({ top: 0, behavior: 'smooth' })`.
 *   5. Gọi hàm render dữ liệu tương ứng của trang mục tiêu.
 */
function chuyenTrang(tenTrang, thamSo = {}) {
  // 1. Ẩn toàn bộ 12 phân vùng view-panel
  const cacTrang = document.querySelectorAll('.view-panel');
  cacTrang.forEach(trang => trang.classList.remove('active'));

  // 2. Kích hoạt phân vùng mục tiêu
  const trangCanMo = document.getElementById(`view-${tenTrang}`);
  if (trangCanMo) {
    trangCanMo.classList.add('active');
  }

  // 3. Đổi trạng thái active trên Menu điều hướng & Nút Giỏ Hàng
  const cacNutMenu = document.querySelectorAll('.main-nav .nav-item');
  cacNutMenu.forEach(nut => {
    nut.classList.toggle('active', nut.getAttribute('data-view') === tenTrang);
  });

  const nutGioHang = document.getElementById('nav-cart-btn');
  if (nutGioHang) {
    nutGioHang.classList.toggle('active', tenTrang === 'cart');
  }

  // 4. Cuộn màn hình lên đầu trang
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // 5. Gọi hàm hiển thị dữ liệu theo từng phân vùng nghiệp vụ
  if (tenTrang === 'home') hienThiTrangChu();
  else if (tenTrang === 'shop') hienThiCuaHang();
  else if (tenTrang === 'detail') hienThiChiTiet(thamSo.id);
  else if (tenTrang === 'cart') hienThiGioHang();
  else if (tenTrang === 'checkout') hienThiThanhToan();
  else if (tenTrang === 'thankyou') hienThiCamOn();
  else if (tenTrang === 'profile') {
    if (!nguoiDungHienTai) {
      hienThongBao('Vui lòng đăng nhập để xem thông tin cá nhân!', 'warning');
      chuyenTrang('auth');
    } else {
      hienThiThongTinCaNhan();
    }
  }
  else if (tenTrang === 'tracking') hienThiTraCuu();
  else if (tenTrang === 'compare') {
    chuyenTrang('shop');
    cuonDenBangSoSanh();
  }
}

/**
 * 🎯 Mục đích: Cập nhật cụm nút Tài Khoản góc phải Header với menu Dropdown khi Hover
 * 🔄 Luồng chạy:
 *   - Nếu ĐÃ ĐĂNG NHẬP: Hiển thị Avatar + Tên; Hover hiện "Thông Tin Tài Khoản", "Đơn Hàng", "Đăng Xuất" (hoặc link Admin nếu là admin).
 *   - Nếu CHƯA ĐĂNG NHẬP: Hiển thị nút "Tài Khoản"; Hover hiện 2 mục "Đăng Nhập" và "Đăng Ký".
 */
function capNhatNguoiDungHeader() {
  const container = document.getElementById('user-nav-status');
  if (!container) return;

  if (nguoiDungHienTai) {
    const laAdmin = nguoiDungHienTai.role === 'admin';
    const ten = nguoiDungHienTai.fullName || nguoiDungHienTai.name;

    container.innerHTML = `
      <div class="user-dropdown-wrapper">
        <button class="user-dropdown-btn">
          <i class="fa-solid fa-circle-user" style="color: var(--primary);"></i>
          <span>${ten}</span>
          <i class="fa-solid fa-chevron-down" style="font-size: 10px; color: var(--text-muted);"></i>
        </button>
        <div class="user-dropdown-menu">
          <button class="user-dropdown-item" onclick="chuyenTrang('profile')">
            <i class="fa-solid fa-id-card" style="color: var(--primary);"></i>
            <span>Thông Tin Tài Khoản</span>
          </button>
          <button class="user-dropdown-item" onclick="chuyenTrang('profile')">
            <i class="fa-solid fa-box-archive" style="color: #0284c7;"></i>
            <span>Đơn Hàng Của Tôi</span>
          </button>
          ${laAdmin ? `
            <a href="admin.html" class="user-dropdown-item" style="text-decoration:none;">
              <i class="fa-solid fa-gear" style="color: #7e22ce;"></i>
              <span>Trang Quản Trị (Admin)</span>
            </a>
          ` : ''}
          <div style="border-top: 1px solid var(--border); margin: 4px 0;"></div>
          <button class="user-dropdown-item danger-item" onclick="dangXuat()">
            <i class="fa-solid fa-power-off" style="color: var(--accent);"></i>
            <span>Đăng Xuất</span>
          </button>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="user-dropdown-wrapper">
        <button class="user-dropdown-btn">
          <i class="fa-solid fa-user" style="color: var(--primary);"></i>
          <span>Tài Khoản</span>
          <i class="fa-solid fa-chevron-down" style="font-size: 10px; color: var(--text-muted);"></i>
        </button>
        <div class="user-dropdown-menu">
          <button class="user-dropdown-item" onclick="chuyenTrang('auth'); window.authModule.switchTab('login')">
            <i class="fa-solid fa-right-to-bracket" style="color: var(--primary);"></i>
            <span>Đăng Nhập</span>
          </button>
          <button class="user-dropdown-item" onclick="chuyenTrang('auth'); window.authModule.switchTab('register')">
            <i class="fa-solid fa-user-plus" style="color: var(--success);"></i>
            <span>Đăng Ký</span>
          </button>
        </div>
      </div>
    `;
  }
}
