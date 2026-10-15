/**
 * ============================================================================
 * JAVASCRIPT GIAO DIỆN NGƯỜI DÙNG (USER APP - app.js) - BẢN TỐI ƯU HIỆN ĐẠI
 * ============================================================================
 * Dự án: Website Gaming Phone (SmartStore)
 * Môn học: Lập trình JavaScript Nâng Cao (WEB2064)
 * 
 * ĐẶC ĐIỂM KIẾN TRÚC & CÔNG NGHỆ ÁP DỤNG:
 * - Chuẩn cú pháp ECMAScript 2020+ (ES6+): Arrow Functions, Destructuring, Optional Chaining (?.), Nullish Coalescing (??).
 * - Các hàm có sẵn hiện đại: Intl.NumberFormat (quốc tế hóa tiền tệ), Array methods (reduce, filter, map, find, some).
 * - Tối ưu hóa DOM Manipulation: Helper selector gọn nhẹ, classList.toggle, dataset.
 * - Quản lý bất đồng bộ (Asynchronous): async/await kết hợp Fetch API có cấu trúc xử lý lỗi tập trung.
 * - Bảo mật & Toàn vẹn dữ liệu: XSS sanitization (escape HTML), kiểm soát tồn kho tức thời (Inventory Decoupling & Sync).
 */

// ============================================================================
// 1. CẤU HÌNH HỆ THỐNG VÀ ĐƯỜNG DẪN API (REST ENDPOINTS)
// ============================================================================
/**
 * Địa chỉ gốc của máy chủ Mock API (JSON-Server chạy trên cổng 3000).
 * Cấu hình tập trung giúp dễ dàng chuyển đổi môi trường (Development / Production).
 */
const API_BASE = 'http://localhost:3000';
const API_PRODUCTS = `${API_BASE}/products`;
const API_CATEGORIES = `${API_BASE}/categories`;
const API_ORDERS = `${API_BASE}/orders`;
const API_USERS = `${API_BASE}/users`;

/**
 * Ảnh đại diện dự phòng (Placeholder) khi URL ảnh chính từ CDN ngoài bị ngắt kết nối hoặc lỗi 404.
 */
const ANH_MAC_DINH = 'https://picsum.photos/300/300';

// ============================================================================
// 2. BIẾN TRẠNG THÁI TOÀN CỤC (APPLICATION STATE MANAGEMENT)
// ============================================================================
let danhSachSanPham = [];       // Bộ nhớ đệm danh sách sản phẩm lấy từ máy chủ
let danhSachDanhMuc = [];       // Bộ nhớ đệm danh mục thương hiệu điện thoại
let gioHang = [];               // Trạng thái giỏ hàng hiện tại (đồng bộ với localStorage)
let nguoiDungHienTai = null;    // Thông tin tài khoản khách hàng đang đăng nhập
let donHangDangXacNhan = null;  // Thông tin đơn hàng tạm thời chờ khách bấm "Xác nhận"
let toastTimer = null;          // Định danh bộ đếm thời gian cho thông báo Toast

// ============================================================================
// 3. CÁC HÀM TIỆN ÍCH DÙNG CHUNG (UTILITY FUNCTIONS)
// ============================================================================

/**
 * DOM Selector Helper ($): Rút gọn cú pháp document.getElementById và document.querySelector.
 * @param {string} selector - ID (ví dụ: 'toast', '#toast') hoặc chuỗi CSS Selector
 * @returns {HTMLElement|null} Phần tử DOM tìm được
 */
const $ = (selector) => {
  if (typeof selector !== 'string') return null;
  const isSimpleId = !selector.includes(' ') && !selector.includes('.') && !selector.includes('[');
  return isSimpleId ? document.getElementById(selector.replace(/^#/, '')) : document.querySelector(selector);
};

/**
 * DOM Selector All Helper ($$): Rút gọn cú pháp document.querySelectorAll.
 * @param {string} selector - Chuỗi CSS Selector
 * @returns {NodeListOf<HTMLElement>} Danh sách các phần tử DOM
 */
const $$ = (selector) => document.querySelectorAll(selector);

/**
 * Hàm gọi API dùng chung (API Fetch Wrapper):
 * - Tự động đính kèm Header Content-Type: application/json.
 * - Tự động chuỗi hóa dữ liệu JSON (JSON.stringify) khi có body gửi lên.
 * - Kiểm tra thuộc tính res.ok của Response object và parse dữ liệu JSON trả về.
 * @param {string} url - Đường dẫn Endpoint API
 * @param {string} [method='GET'] - Phương thức HTTP (GET, POST, PUT, PATCH, DELETE)
 * @param {object|null} [data=null] - Payload dữ liệu cần gửi
 * @returns {Promise<any>} Dữ liệu JSON từ máy chủ
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
 * Phòng chống tấn công XSS (Cross-Site Scripting):
 * Sử dụng hàm có sẵn String.prototype.replace() kết hợp Regular Expression (RegEx) 
 * để chuyển đổi các ký tự điều khiển HTML nguy hiểm (&, <, >, ", ') thành HTML Entities vô hại.
 * @param {any} str - Chuỗi văn bản nhập từ người dùng
 * @returns {string} Chuỗi văn bản an toàn
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
 * Định dạng số thành chuỗi tiền tệ Việt Nam (VNĐ):
 * Áp dụng API chuẩn quốc tế hóa hiện đại Intl.NumberFormat('vi-VN') của JavaScript.
 * @param {number|string} soTien - Giá trị số tiền cần định dạng
 * @returns {string} Chuỗi định dạng, ví dụ: 29990000 -> "29.990.000 đ"
 */
const dinhDangTien = (soTien) => 
  new Intl.NumberFormat('vi-VN').format(Number(soTien) || 0) + ' đ';

/**
 * Hiển thị thông báo Toast nhỏ ở góc dưới màn hình:
 * Sử dụng clearTimeout() để triệt tiêu bộ hẹn giờ cũ (Debounce pattern), ngăn chặn hiện tượng nhấp nháy
 * khi người dùng kích hoạt liên tục nhiều thông báo trong thời gian ngắn.
 * @param {string} noiDung - Nội dung thông báo hiển thị
 * @param {boolean} [laLoi=false] - Cờ đánh dấu thông báo thất bại (màu đỏ) hay thành công (màu xanh)
 */
const hienThongBao = (noiDung, laLoi = false) => {
  const toast = $('#toast');
  if (!toast) return;

  toast.textContent = noiDung;
  toast.className = `toast-notice show${laLoi ? ' error' : ''}`;

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.className = 'toast-notice';
  }, 3000);
};

/**
 * Điều hướng giao diện Single Page Application (SPA):
 * - Áp dụng Element.classList.toggle() hiện đại để kích hoạt hoặc hủy lớp 'active' mà không cần if/else rườm rà.
 * - Áp dụng thuộc tính Dataset (data-view) để đối chiếu trực tiếp giữa nút bấm menu và thẻ section mục tiêu.
 * - Sử dụng window.scrollTo({ behavior: 'smooth' }) để tạo hiệu ứng cuộn mượt mà lên đầu trang.
 * @param {string} viewId - ID của section giao diện cần hiển thị ('view-shop', 'view-cart', ...)
 */
const chuyenTrang = (viewId) => {
  $$('.view-panel').forEach(panel => panel.classList.toggle('active', panel.id === viewId));
  $$('.nav-item').forEach(btn => btn.classList.toggle('active', btn.dataset.view === viewId));

  if (viewId === 'view-orders') {
    taiLichSuDonHang();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ============================================================================
// 4. MODULE SẢN PHẨM & BỘ LỌC TÌM KIẾM (PRODUCTS & MULTI-FILTER)
// ============================================================================

/**
 * Tải danh mục thương hiệu từ máy chủ và đổ dữ liệu vào thẻ select lọc sản phẩm.
 * Áp dụng Array.prototype.map() và Array.prototype.join() để tạo cấu trúc thẻ option nhanh chóng.
 */
const taiDanhMuc = async () => {
  try {
    danhSachDanhMuc = await apiFetch(API_CATEGORIES);
    const selectShop = $('#shop-filter-category');
    if (selectShop) {
      selectShop.innerHTML = '<option value="">Tất cả thương hiệu</option>' +
        danhSachDanhMuc.map(({ id, name }) => 
          `<option value="${escapeHTML(id)}">${escapeHTML(name)}</option>`
        ).join('');
    }
  } catch (err) {
    console.error('Lỗi khi tải danh mục thương hiệu:', err);
    hienThongBao('Không thể kết nối đến máy chủ danh mục!', true);
  }
};

/**
 * Tải toàn bộ danh sách sản phẩm từ máy chủ và kích hoạt hàm render giao diện.
 */
const taiSanPham = async () => {
  try {
    danhSachSanPham = await apiFetch(API_PRODUCTS);
    locVaHienThiSanPham();
  } catch (err) {
    console.error('Lỗi khi tải danh sách sản phẩm:', err);
    hienThongBao('Không thể kết nối đến máy chủ sản phẩm!', true);
  }
};

/**
 * Bộ lọc đa tiêu chí thời gian thực (Multi-Criteria Filter):
 * Kết hợp 3 điều kiện: Tìm kiếm theo từ khóa tên máy, Lọc theo hãng (cate_id), Lọc theo 3 phân khúc giá.
 * - Áp dụng Array.prototype.filter() để trích xuất danh sách sản phẩm thỏa mãn đồng thời cả 3 điều kiện.
 * - Áp dụng Optional Chaining (?.) và Nullish Coalescing (??) để truy xuất thuộc tính an toàn, chống crash runtime.
 * - Tích hợp cơ chế tự phục hồi hình ảnh qua sự kiện onerror inline.
 */
const locVaHienThiSanPham = () => {
  const container = $('#product-grid');
  if (!container) return;

  const tuKhoa = ($('#shop-search')?.value ?? '').trim().toLowerCase();
  const maDanhMuc = $('#shop-filter-category')?.value ?? '';
  const khoangGia = $('#shop-filter-price')?.value ?? '';

  // Lọc sản phẩm theo mảng
  const ketQua = danhSachSanPham.filter(({ name, cate_id, price }) => {
    const khopTen = String(name || '').toLowerCase().includes(tuKhoa);
    const khopDanhMuc = !maDanhMuc || String(cate_id) === String(maDanhMuc);

    const gia = Number(price) || 0;
    let khopGia = true;
    if (khoangGia === 'duoi-10tr') khopGia = gia < 10000000;
    else if (khoangGia === '10tr-25tr') khopGia = gia >= 10000000 && gia <= 25000000;
    else if (khoangGia === 'tren-25tr') khopGia = gia > 25000000;

    return khopTen && khopDanhMuc && khopGia;
  });

  // Xử lý khi không có kết quả phù hợp
  if (ketQua.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px; color: var(--text-muted);">
        <i class="fas fa-box-open" style="font-size: 40px; margin-bottom: 12px; display: block;"></i>
        <p>Không tìm thấy sản phẩm nào phù hợp với bộ lọc hiện tại.</p>
      </div>
    `;
    return;
  }

  // Render danh sách sản phẩm ra dạng lưới thẻ (Grid Cards)
  container.innerHTML = ketQua.map((sp) => {
    const hang = danhSachDanhMuc.find(c => String(c.id) === String(sp.cate_id));
    const tenHang = hang?.name ?? 'Điện thoại';
    const tonKho = Number(sp.quantity) || 0;
    const hetHang = tonKho <= 0;

    return `
      <div class="product-card">
        <div class="product-img-box" onclick="xemChiTietSanPham('${escapeHTML(sp.id)}')" title="Bấm để xem chi tiết">
          <span class="product-badge">${escapeHTML(tenHang)}</span>
          <img src="${escapeHTML(sp.image || ANH_MAC_DINH)}" 
               alt="${escapeHTML(sp.name)}" 
               loading="lazy" 
               onerror="this.onerror=null;this.src='${ANH_MAC_DINH}';" />
        </div>
        <div class="product-info">
          <h3 class="product-name" onclick="xemChiTietSanPham('${escapeHTML(sp.id)}')" title="Bấm để xem chi tiết">
            ${escapeHTML(sp.name)}
          </h3>
          <p class="product-desc">${escapeHTML(sp.detail || 'Bảo hành chính hãng 12 tháng, 1 đổi 1 trong 30 ngày.')}</p>
          <div class="product-price-box">
            <span class="product-price">${dinhDangTien(sp.price)}</span>
            <span class="product-stock" style="${hetHang ? 'color: var(--accent); font-weight: 700;' : ''}">
              ${hetHang ? 'Hết hàng' : `Kho: ${tonKho}`}
            </span>
          </div>
          <div class="product-actions-group">
            <button class="btn-add-cart" onclick="themVaoGioHang('${escapeHTML(sp.id)}', false)" ${hetHang ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
              <i class="fas fa-cart-plus"></i> Thêm giỏ
            </button>
            <button class="btn-buy-now" onclick="themVaoGioHang('${escapeHTML(sp.id)}', true)" ${hetHang ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
              <i class="fas fa-bolt"></i> Mua ngay
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
};

// ============================================================================
// 5. MODULE CHI TIẾT SẢN PHẨM (PRODUCT DETAIL MODAL)
// ============================================================================

/**
 * Hiển thị Modal chi tiết sản phẩm khi người dùng bấm vào ảnh hoặc tên điện thoại:
 * Sử dụng Array.prototype.find() để truy xuất thông tin chi tiết của máy từ mảng state.
 * @param {string|number} id - ID sản phẩm cần xem chi tiết
 */
const xemChiTietSanPham = (id) => {
  const sp = danhSachSanPham.find(item => String(item.id) === String(id));
  if (!sp) return;

  const hang = danhSachDanhMuc.find(c => String(c.id) === String(sp.cate_id));
  const tenHang = hang?.name ?? 'Điện thoại';
  const tonKho = Number(sp.quantity) || 0;

  $('#detail-brand-badge').textContent = tenHang;
  $('#detail-name').textContent = sp.name;

  const detailImg = $('#detail-img');
  if (detailImg) {
    detailImg.src = sp.image || ANH_MAC_DINH;
    detailImg.onerror = () => { detailImg.onerror = null; detailImg.src = ANH_MAC_DINH; };
  }

  $('#detail-price').textContent = dinhDangTien(sp.price);
  $('#detail-stock').textContent = tonKho > 0 ? `Tồn kho: ${tonKho} máy` : 'Đã hết hàng';
  $('#detail-desc').textContent = sp.detail || 'Sản phẩm mới 100% chính hãng, nguyên seal, đầy đủ phụ kiện theo hộp.';

  const btnAdd = $('#btn-detail-add-cart');
  const btnBuy = $('#btn-detail-buy-now');

  if (btnAdd) {
    btnAdd.disabled = tonKho <= 0;
    btnAdd.onclick = () => { themVaoGioHang(sp.id, false); dongModalChiTiet(); };
  }
  if (btnBuy) {
    btnBuy.disabled = tonKho <= 0;
    btnBuy.onclick = () => { themVaoGioHang(sp.id, true); dongModalChiTiet(); };
  }

  $('#product-detail-modal')?.classList.add('open');
};

/**
 * Đóng cửa sổ Modal chi tiết sản phẩm.
 */
const dongModalChiTiet = () => $('#product-detail-modal')?.classList.remove('open');

// ============================================================================
// 6. MODULE GIỎ HÀNG & QUẢN LÝ TỒN KHO (CART & STOCK CONTROL)
// ============================================================================

/**
 * Thêm sản phẩm vào giỏ hàng:
 * - Kiểm tra số lượng tồn kho thực tế của máy.
 * - Nếu sản phẩm đã có trong giỏ, tăng số lượng nhưng không vượt quá mức trần kho.
 * - Lưu trữ trạng thái vào LocalStorage (JSON.stringify) và cập nhật giao diện ngay lập tức.
 * @param {string|number} id - ID sản phẩm
 * @param {boolean} [laMuaNgay=false] - Nếu là true: tự động chuyển sang trang giỏ hàng để đặt ngay
 */
const themVaoGioHang = (id, laMuaNgay = false) => {
  const sanPham = danhSachSanPham.find(item => String(item.id) === String(id));
  if (!sanPham) return;

  const tonKho = Number(sanPham.quantity) || 0;
  if (tonKho <= 0) {
    hienThongBao(`Sản phẩm "${sanPham.name}" hiện đã hết hàng trong kho!`, true);
    return;
  }

  const monTrongGio = gioHang.find(item => String(item.id) === String(id));

  if (monTrongGio) {
    if (monTrongGio.quantity + 1 > tonKho) {
      hienThongBao(`Số lượng trong giỏ đã đạt mức tồn kho tối đa (${tonKho} máy)!`, true);
      return;
    }
    monTrongGio.quantity += 1;
  } else {
    gioHang.push({
      id: sanPham.id,
      name: sanPham.name,
      price: sanPham.price,
      image: sanPham.image || ANH_MAC_DINH,
      quantity: 1
    });
  }

  localStorage.setItem('smartstore_cart', JSON.stringify(gioHang));
  capNhatGiaoDienGioHang();

  if (laMuaNgay) {
    chuyenTrang('view-cart');
    hienThongBao(`Đang tiến hành đặt mua "${sanPham.name}"!`);
  } else {
    hienThongBao(`Đã thêm "${sanPham.name}" vào giỏ hàng!`);
  }
};

/**
 * Điều chỉnh số lượng (+ / -) của món hàng trong giỏ:
 * Kiểm soát mức trần số lượng so với số lượng tồn kho ban đầu.
 * @param {string|number} id - ID sản phẩm trong giỏ
 * @param {number} delta - Giá trị thay đổi (+1 hoặc -1)
 */
const doiSoLuongGioHang = (id, delta) => {
  const mon = gioHang.find(item => String(item.id) === String(id));
  if (!mon) return;

  if (delta > 0) {
    const spGoc = danhSachSanPham.find(p => String(p.id) === String(id));
    const tonKho = spGoc ? Number(spGoc.quantity) || 0 : 999;
    if (mon.quantity + delta > tonKho) {
      hienThongBao(`Kho chỉ còn ${tonKho} sản phẩm cho mặt hàng này!`, true);
      return;
    }
  }

  mon.quantity += delta;
  if (mon.quantity <= 0) {
    xoaKhoiGioHang(id);
    return;
  }

  localStorage.setItem('smartstore_cart', JSON.stringify(gioHang));
  capNhatGiaoDienGioHang();
};

/**
 * Xóa một món hàng khỏi giỏ bằng Array.prototype.filter().
 * @param {string|number} id - ID sản phẩm cần xóa
 */
const xoaKhoiGioHang = (id) => {
  gioHang = gioHang.filter(item => String(item.id) !== String(id));
  localStorage.setItem('smartstore_cart', JSON.stringify(gioHang));
  capNhatGiaoDienGioHang();
  hienThongBao('Đã xóa sản phẩm khỏi giỏ hàng.');
};

/**
 * Cập nhật hiển thị giao diện giỏ hàng:
 * Áp dụng Array.prototype.reduce() để tính toán tổng số lượng và tổng thành tiền một cách tối ưu trong 1 lượt lặp.
 */
const capNhatGiaoDienGioHang = () => {
  const badge = $('#cart-count');
  const tbody = $('#cart-tbody');
  const subtotalEl = $('#cart-subtotal');
  const totalEl = $('#cart-total');
  const warningBox = $('#cart-login-warning');

  // Tính tổng số lượng và tổng tiền bằng reduce
  const { tongSoLuong, tongTien } = gioHang.reduce(
    (acc, item) => {
      acc.tongSoLuong += item.quantity;
      acc.tongTien += item.price * item.quantity;
      return acc;
    },
    { tongSoLuong: 0, tongTien: 0 }
  );

  if (badge) badge.textContent = tongSoLuong;
  if (subtotalEl) subtotalEl.textContent = dinhDangTien(tongTien);
  if (totalEl) totalEl.textContent = dinhDangTien(tongTien);

  // Hiển thị/Ẩn cảnh báo đăng nhập và tự động điền form
  if (warningBox) {
    warningBox.style.display = nguoiDungHienTai ? 'none' : 'flex';
    if (nguoiDungHienTai) {
      if ($('#order-name') && !$('#order-name').value) $('#order-name').value = nguoiDungHienTai.name ?? '';
      if ($('#order-phone') && !$('#order-phone').value) $('#order-phone').value = nguoiDungHienTai.phone ?? '';
      if ($('#order-address') && !$('#order-address').value) $('#order-address').value = nguoiDungHienTai.address ?? '';
    }
  }

  if (!tbody) return;

  if (gioHang.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 30px; color: var(--text-muted);">
          Giỏ hàng đang trống. Hãy quay lại Cửa hàng để chọn sản phẩm!
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = gioHang.map((item) => `
    <tr>
      <td>
        <div class="cart-item-info">
          <img src="${escapeHTML(item.image || ANH_MAC_DINH)}" 
               class="cart-item-img" 
               alt="${escapeHTML(item.name)}" 
               onerror="this.onerror=null;this.src='${ANH_MAC_DINH}';" />
          <strong>${escapeHTML(item.name)}</strong>
        </div>
      </td>
      <td>${dinhDangTien(item.price)}</td>
      <td>
        <div class="qty-control">
          <button class="qty-btn" onclick="doiSoLuongGioHang('${escapeHTML(item.id)}', -1)">-</button>
          <span style="font-weight: 600; min-width: 20px; text-align: center;">${item.quantity}</span>
          <button class="qty-btn" onclick="doiSoLuongGioHang('${escapeHTML(item.id)}', 1)">+</button>
        </div>
      </td>
      <td><strong style="color: var(--accent);">${dinhDangTien(item.price * item.quantity)}</strong></td>
      <td>
        <button style="background: none; border: none; color: var(--accent); cursor: pointer;" onclick="xoaKhoiGioHang('${escapeHTML(item.id)}')">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
};

// ============================================================================
// 7. MODULE THANH TOÁN & TRỪ TỒN KHO NGUYÊN TỬ (CHECKOUT & INVENTORY)
// ============================================================================

/**
 * Xử lý khi khách hàng gửi biểu mẫu thanh toán (Submit Checkout Form):
 * 1. Kiểm tra giỏ hàng rỗng.
 * 2. Yêu cầu đăng nhập tài khoản.
 * 3. Kiểm tra tính sẵn sàng tồn kho của tất cả sản phẩm trong giỏ (tránh tình trạng kho bị mua hết trước đó).
 * 4. Mở Popup hộp thoại xác nhận đặt hàng.
 * @param {Event} event - Sự kiện submit form
 */
const xuLyDatHang = (event) => {
  event.preventDefault();

  if (gioHang.length === 0) {
    hienThongBao('Giỏ hàng của bạn đang trống!', true);
    return;
  }

  if (!nguoiDungHienTai) {
    hienThongBao('Vui lòng ĐĂNG NHẬP hoặc ĐĂNG KÝ tài khoản trước khi đặt hàng!', true);
    chuyenTrang('view-account');
    return;
  }

  const tenNguoiNhan = $('#order-name')?.value.trim();
  const soDienThoai = $('#order-phone')?.value.trim();
  const diaChi = $('#order-address')?.value.trim();

  if (!tenNguoiNhan || !soDienThoai || !diaChi) {
    hienThongBao('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ giao hàng!', true);
    return;
  }

  // Kiểm tra tồn kho thực tế từng sản phẩm
  for (const item of gioHang) {
    const spGoc = danhSachSanPham.find(p => String(p.id) === String(item.id));
    const tonKho = spGoc ? Number(spGoc.quantity) || 0 : 0;
    if (!spGoc || tonKho <= 0) {
      hienThongBao(`Sản phẩm "${item.name}" đã hết hàng! Vui lòng xóa khỏi giỏ để tiếp tục.`, true);
      return;
    }
    if (item.quantity > tonKho) {
      hienThongBao(`Sản phẩm "${item.name}" chỉ còn ${tonKho} máy trong kho (bạn đang chọn ${item.quantity}). Vui lòng điều chỉnh lại!`, true);
      return;
    }
  }

  const tongTien = gioHang.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tongSoLuong = gioHang.reduce((sum, item) => sum + item.quantity, 0);

  donHangDangXacNhan = {
    id: String(Date.now()),
    user_id: nguoiDungHienTai.id,
    customer_name: tenNguoiNhan,
    phone: soDienThoai,
    address: diaChi,
    total_amount: tongTien,
    items_count: tongSoLuong,
    items: gioHang.map(({ id, name, price, quantity, image }) => ({ id, name, price, quantity, image })),
    created_date: new Date().toISOString().split('T')[0],
    status: 'Đang xử lý'
  };

  if ($('#confirm-buyer-name')) $('#confirm-buyer-name').textContent = tenNguoiNhan;
  if ($('#confirm-buyer-phone')) $('#confirm-buyer-phone').textContent = soDienThoai;
  if ($('#confirm-buyer-address')) $('#confirm-buyer-address').textContent = diaChi;
  if ($('#confirm-order-total')) $('#confirm-order-total').textContent = dinhDangTien(tongTien);

  const confirmItemsList = $('#confirm-items-list');
  if (confirmItemsList) {
    confirmItemsList.innerHTML = gioHang.map(item => `
      <div class="confirm-item-mini">
        <span class="confirm-item-mini-name">${escapeHTML(item.name)}</span>
        <span class="confirm-item-mini-qty">x${item.quantity}</span>
        <span class="confirm-item-mini-price">${dinhDangTien(item.price * item.quantity)}</span>
      </div>
    `).join('');
  }

  $('#checkout-confirm-modal')?.classList.add('open', 'active');
};

/**
 * Đóng Popup xác nhận thanh toán.
 */
const dongModalXacNhanThanhToan = () => {
  $('#checkout-confirm-modal')?.classList.remove('open', 'active');
};

/**
 * Người dùng bấm "Hủy" trên popup xác nhận.
 */
const huyThanhToan = () => {
  dongModalXacNhanThanhToan();
  donHangDangXacNhan = null;
  hienThongBao('Bạn đã hủy thao tác đặt hàng!', true);
};

/**
 * Người dùng bấm "Xác nhận" trên popup:
 * 1. Gửi đơn hàng lên JSON-Server bằng POST /orders.
 * 2. Tự động trừ tồn kho (PATCH /products/:id) cho từng mặt hàng vừa mua.
 * 3. Xóa sạch giỏ hàng trong state và localStorage.
 * 4. Hiển thị màn hình Cảm ơn (Thank You View) kèm mã vận đơn.
 */
const thucHienXacNhanDatHang = async () => {
  if (!donHangDangXacNhan) {
    dongModalXacNhanThanhToan();
    return;
  }

  const donHang = donHangDangXacNhan;

  try {
    // 1. Tạo đơn hàng mới
    await apiFetch(API_ORDERS, 'POST', donHang);

    // 2. Trừ tồn kho đồng thời sử dụng Promise.all để tối ưu thời gian phản hồi mạng
    const updateStockPromises = donHang.items.map(async (item) => {
      const spGoc = danhSachSanPham.find(p => String(p.id) === String(item.id));
      if (spGoc) {
        const soLuongConLai = Math.max(0, (Number(spGoc.quantity) || 0) - Number(item.quantity));
        spGoc.quantity = soLuongConLai; // Đồng bộ state cục bộ
        return apiFetch(`${API_PRODUCTS}/${item.id}`, 'PATCH', { quantity: soLuongConLai });
      }
    });
    await Promise.allSettled(updateStockPromises);

    dongModalXacNhanThanhToan();
    hienThongBao('Đặt hàng thành công!');

    // 3. Đổ dữ liệu vào màn hình Cảm ơn
    if ($('#thankyou-order-info')) $('#thankyou-order-info').style.display = 'block';
    if ($('#placed-order-id')) $('#placed-order-id').textContent = `#${donHang.id}`;
    if ($('#placed-order-name')) $('#placed-order-name').textContent = donHang.customer_name;
    if ($('#placed-order-phone')) $('#placed-order-phone').textContent = donHang.phone;
    if ($('#placed-order-address')) $('#placed-order-address').textContent = donHang.address;
    if ($('#placed-order-total')) $('#placed-order-total').textContent = dinhDangTien(donHang.total_amount);

    const placedItemsList = $('#placed-items-list');
    if (placedItemsList && donHang.items) {
      placedItemsList.innerHTML = donHang.items.map(it => `
        <div class="placed-item-row">
          <div class="placed-item-info">
            <img src="${escapeHTML(it.image || ANH_MAC_DINH)}" 
                 alt="${escapeHTML(it.name)}" 
                 class="placed-item-img" 
                 onerror="this.onerror=null;this.src='${ANH_MAC_DINH}';" />
            <div>
              <strong>${escapeHTML(it.name)}</strong>
              <div style="color: var(--text-muted); font-size: 12px;">Số lượng: ${it.quantity}</div>
            </div>
          </div>
          <strong style="color: var(--primary);">${dinhDangTien(it.price * it.quantity)}</strong>
        </div>
      `).join('');
    }

    // 4. Xóa sạch giỏ hàng và reset form
    gioHang = [];
    localStorage.removeItem('smartstore_cart');
    capNhatGiaoDienGioHang();
    $('#checkout-form')?.reset();

    // 5. Cập nhật lại giao diện danh sách sản phẩm để phản ánh tồn kho mới
    locVaHienThiSanPham();

    // 6. Điều hướng đến màn hình cảm ơn
    chuyenTrang('view-thankyou');
    donHangDangXacNhan = null;
    taiLichSuDonHang();
  } catch (err) {
    console.error('Lỗi khi gửi đơn hàng:', err);
    hienThongBao('Xác nhận đặt hàng thất bại, vui lòng kiểm tra kết nối server!', true);
  }
};

// ============================================================================
// 8. MODULE LỊCH SỬ ĐƠN HÀNG (ORDER HISTORY)
// ============================================================================

/**
 * Tải và hiển thị danh sách đơn hàng đã mua của tài khoản hiện tại:
 * Lọc theo user_id và sử dụng Array.prototype.reverse() để đưa đơn hàng mới nhất lên đầu danh sách.
 */
const taiLichSuDonHang = async () => {
  const notLoggedBox = $('#orders-not-logged');
  const historyList = $('#orders-history-list');

  if (!historyList) return;

  if (!nguoiDungHienTai) {
    if (notLoggedBox) notLoggedBox.style.display = 'block';
    historyList.innerHTML = '';
    return;
  }

  if (notLoggedBox) notLoggedBox.style.display = 'none';
  historyList.innerHTML = '<p style="text-align: center; padding: 24px; color: var(--text-muted);">Đang tải lịch sử đơn hàng của bạn...</p>';

  try {
    const allOrders = await apiFetch(API_ORDERS);
    const userOrders = allOrders
      .filter(o => String(o.user_id) === String(nguoiDungHienTai.id))
      .reverse();

    if (userOrders.length === 0) {
      historyList.innerHTML = `
        <div class="orders-empty-card">
          <i class="fas fa-bag-shopping"></i>
          <h3>Bạn chưa có đơn hàng nào!</h3>
          <p>Hãy dạo quanh cửa hàng và chọn cho mình chiếc điện thoại ưng ý nhé.</p>
          <button class="btn-primary" onclick="chuyenTrang('view-shop')">
            <i class="fas fa-store"></i> Khám phá sản phẩm ngay
          </button>
        </div>
      `;
      return;
    }

    historyList.innerHTML = userOrders.map((order) => {
      let badgeClass = 'status-processing';
      if (order.status === 'Đang giao hàng') badgeClass = 'status-shipping';
      else if (order.status === 'Đã giao hàng') badgeClass = 'status-delivered';

      const itemsHtml = (order.items && order.items.length > 0)
        ? order.items.map(it => `
            <tr>
              <td>
                <div class="order-table-product">
                  <img src="${escapeHTML(it.image || ANH_MAC_DINH)}" 
                       alt="${escapeHTML(it.name)}" 
                       class="order-table-thumb" 
                       onerror="this.onerror=null;this.src='${ANH_MAC_DINH}';" />
                  <span>${escapeHTML(it.name)}</span>
                </div>
              </td>
              <td>x${it.quantity}</td>
              <td><strong>${dinhDangTien(it.price * it.quantity)}</strong></td>
            </tr>
          `).join('')
        : `<tr><td colspan="3" style="padding: 10px; color: var(--text-muted);">Đơn hàng gồm ${order.items_count || 1} sản phẩm</td></tr>`;

      return `
        <div class="order-card">
          <div class="order-card-header">
            <div>
              <span class="order-code">Đơn hàng #${escapeHTML(order.id)}</span>
              <span class="order-date"><i class="far fa-calendar-alt"></i> Ngày đặt: ${escapeHTML(order.created_date || '—')}</span>
            </div>
            <span class="order-status-badge ${badgeClass}">${escapeHTML(order.status || 'Đang xử lý')}</span>
          </div>

          <div class="order-card-customer-info">
            <div class="order-customer-field">
              <span>Người nhận:</span> <strong>${escapeHTML(order.customer_name || nguoiDungHienTai.name)}</strong>
            </div>
            <div class="order-customer-field">
              <span>SĐT:</span> <strong>${escapeHTML(order.phone || nguoiDungHienTai.phone || '—')}</strong>
            </div>
            <div class="order-customer-field">
              <span>Địa chỉ:</span> <strong>${escapeHTML(order.address || nguoiDungHienTai.address || '—')}</strong>
            </div>
          </div>

          <div class="order-card-items-box">
            <table class="order-items-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Số lượng</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <div class="order-card-footer">
            <span>Tổng thanh toán:</span>
            <span class="order-card-total-price">${dinhDangTien(order.total_amount)}</span>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Lỗi khi tải lịch sử đơn hàng:', err);
    historyList.innerHTML = '<p style="color: var(--accent); text-align: center; padding: 20px;">Không thể kết nối đến máy chủ lấy lịch sử đơn hàng!</p>';
  }
};

// ============================================================================
// 9. MODULE XÁC THỰC NGƯỜI DÙNG & TÀI KHOẢN (USER AUTHENTICATION)
// ============================================================================

/**
 * Phục hồi phiên đăng nhập từ LocalStorage khi người dùng mở trang web.
 */
const kiemTraDangNhap = () => {
  const savedUser = localStorage.getItem('smartstore_user');
  if (savedUser) {
    try {
      nguoiDungHienTai = JSON.parse(savedUser);
    } catch {
      nguoiDungHienTai = null;
    }
  }
  capNhatGiaoDienTaiKhoan();
};

/**
 * Cập nhật giao diện tab Tài khoản (Hồ sơ cá nhân / Đổi mật khẩu hoặc Form Đăng nhập).
 */
const capNhatGiaoDienTaiKhoan = () => {
  const loggedBox = $('#account-logged-box');
  const formsWrapper = $('#auth-forms-wrapper');
  const nameEl = $('#account-user-name');
  const emailEl = $('#account-user-email');
  const navText = $('#nav-account-text');

  if (nguoiDungHienTai) {
    if (loggedBox) loggedBox.style.display = 'block';
    if (formsWrapper) formsWrapper.style.display = 'none';
    if (nameEl) nameEl.textContent = nguoiDungHienTai.name;
    if (emailEl) emailEl.textContent = nguoiDungHienTai.email;
    if (navText) navText.textContent = nguoiDungHienTai.name.split(' ').pop();

    if ($('#profile-phone')) $('#profile-phone').textContent = nguoiDungHienTai.phone || 'Chưa cập nhật';
    if ($('#profile-address')) $('#profile-address').textContent = nguoiDungHienTai.address || 'Chưa cập nhật';
    if ($('#profile-role')) {
      $('#profile-role').textContent = nguoiDungHienTai.role === 'admin' ? 'Quản trị viên (Admin)' : 'Khách hàng thành viên';
    }

    if ($('#order-name') && !$('#order-name').value) $('#order-name').value = nguoiDungHienTai.name ?? '';
    if ($('#order-phone') && !$('#order-phone').value) $('#order-phone').value = nguoiDungHienTai.phone ?? '';
    if ($('#order-address') && !$('#order-address').value) $('#order-address').value = nguoiDungHienTai.address ?? '';
  } else {
    if (loggedBox) loggedBox.style.display = 'none';
    if (formsWrapper) formsWrapper.style.display = 'block';
    if (navText) navText.textContent = 'Tài khoản';
  }

  capNhatGiaoDienGioHang();
  taiLichSuDonHang();
};

/**
 * Xử lý Form Đăng Nhập:
 * Kiểm tra tài khoản khớp email và mật khẩu trong bảng users của JSON-Server.
 * @param {Event} event - Sự kiện submit form
 */
const xuLyDangNhap = async (event) => {
  event.preventDefault();
  const email = ($('#login-email')?.value ?? '').trim().toLowerCase();
  const password = ($('#login-password')?.value ?? '').trim();

  try {
    const users = await apiFetch(API_USERS);
    const user = users.find(u => u.email.toLowerCase() === email && String(u.password) === password);

    if (!user) {
      hienThongBao('Sai email hoặc mật khẩu, vui lòng kiểm tra lại!', true);
      return;
    }

    nguoiDungHienTai = user;
    localStorage.setItem('smartstore_user', JSON.stringify(user));
    capNhatGiaoDienTaiKhoan();
    hienThongBao(`Đăng nhập thành công! Chào mừng ${user.name}`);

    if (gioHang.length > 0) chuyenTrang('view-cart');
  } catch (err) {
    console.error('Lỗi đăng nhập:', err);
    hienThongBao('Không thể kết nối đến máy chủ xác thực tài khoản!', true);
  }
};

/**
 * Xử lý Form Đăng Ký Tài Khoản Mới:
 * Kiểm tra tính duy nhất của email bằng Array.prototype.some() trước khi POST dữ liệu.
 * @param {Event} event - Sự kiện submit form
 */
const xuLyDangKy = async (event) => {
  event.preventDefault();

  const name = $('#reg-name')?.value.trim();
  const email = ($('#reg-email')?.value ?? '').trim().toLowerCase();
  const phone = $('#reg-phone')?.value.trim();
  const password = $('#reg-password')?.value.trim();
  const address = $('#reg-address')?.value.trim();

  if (!name || !email || !phone || !password) {
    hienThongBao('Vui lòng điền đầy đủ các thông tin bắt buộc!', true);
    return;
  }

  if (password.length < 6) {
    hienThongBao('Mật khẩu đăng ký phải có tối thiểu 6 ký tự!', true);
    return;
  }

  try {
    const users = await apiFetch(API_USERS);
    if (users.some(u => u.email.toLowerCase() === email)) {
      hienThongBao(`Email "${email}" đã tồn tại trên hệ thống!`, true);
      return;
    }

    const userMoi = {
      id: String(Date.now()),
      name,
      email,
      phone,
      password,
      role: 'user',
      address
    };

    await apiFetch(API_USERS, 'POST', userMoi);

    nguoiDungHienTai = userMoi;
    localStorage.setItem('smartstore_user', JSON.stringify(userMoi));
    $('#register-form')?.reset();
    capNhatGiaoDienTaiKhoan();
    hienThongBao(`Đăng ký tài khoản thành công! Xin chào ${name}`);

    if (gioHang.length > 0) chuyenTrang('view-cart');
  } catch (err) {
    console.error('Lỗi đăng ký:', err);
    hienThongBao('Đăng ký tài khoản thất bại, vui lòng kiểm tra server!', true);
  }
};

/**
 * Đăng xuất tài khoản khách hàng và dọn dẹp LocalStorage.
 */
const dangXuat = () => {
  nguoiDungHienTai = null;
  localStorage.removeItem('smartstore_user');
  capNhatGiaoDienTaiKhoan();
  hienThongBao('Đã đăng xuất tài khoản thành công.');
};

/**
 * Xử lý Đổi Mật Khẩu tài khoản (Change Password):
 * Sử dụng phương thức PATCH /users/:id để cập nhật mật khẩu mới trong CSDL db.json.
 * @param {Event} event - Sự kiện submit form
 */
const xuLyDoiMatKhau = async (event) => {
  event.preventDefault();

  if (!nguoiDungHienTai) {
    hienThongBao('Vui lòng đăng nhập để đổi mật khẩu!', true);
    return;
  }

  const oldPass = $('#old-pass')?.value.trim();
  const newPass = $('#new-pass')?.value.trim();
  const confirmNewPass = $('#confirm-new-pass')?.value.trim();

  if (String(nguoiDungHienTai.password) !== oldPass) {
    hienThongBao('Mật khẩu hiện tại không chính xác!', true);
    return;
  }

  if (newPass.length < 6) {
    hienThongBao('Mật khẩu mới phải có ít nhất 6 ký tự!', true);
    return;
  }

  if (newPass === oldPass) {
    hienThongBao('Mật khẩu mới không được trùng với mật khẩu cũ!', true);
    return;
  }

  if (newPass !== confirmNewPass) {
    hienThongBao('Xác nhận mật khẩu mới không trùng khớp!', true);
    return;
  }

  try {
    await apiFetch(`${API_USERS}/${nguoiDungHienTai.id}`, 'PATCH', { password: newPass });

    nguoiDungHienTai.password = newPass;
    localStorage.setItem('smartstore_user', JSON.stringify(nguoiDungHienTai));
    $('#change-password-form')?.reset();
    hienThongBao('Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới.');
  } catch (err) {
    console.error('Lỗi khi đổi mật khẩu:', err);
    hienThongBao('Không thể cập nhật mật khẩu, vui lòng thử lại sau!', true);
  }
};

// ============================================================================
// 10. TIỆN ÍCH LỌC TỪ CHÂN TRANG (FOOTER) & XUẤT HÀM TOÀN CỤC
// ============================================================================

/**
 * Lọc nhanh sản phẩm theo thương hiệu khi người dùng nhấp vào liên kết ở Footer.
 * @param {string|number} cateId - ID của danh mục thương hiệu
 */
const locTheoThuongHieuFooter = (cateId) => {
  chuyenTrang('view-shop');
  const selectBox = $('#shop-filter-category');
  if (selectBox) {
    selectBox.value = cateId;
    locVaHienThiSanPham();
  }
};

// Gắn các hàm tương tác ra đối tượng Window để các thuộc tính HTML inline (onclick) hoạt động hoàn hảo
window.locTheoThuongHieuFooter = locTheoThuongHieuFooter;
window.xemChiTietSanPham = xemChiTietSanPham;
window.themVaoGioHang = themVaoGioHang;
window.doiSoLuongGioHang = doiSoLuongGioHang;
window.xoaKhoiGioHang = xoaKhoiGioHang;
window.chuyenTrang = chuyenTrang;

// ============================================================================
// 11. KHỞI TẠO VÀ GẮN SỰ KIỆN KHI MỞ TRANG (APPLICATION BOOTSTRAP)
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  // 1. Phục hồi giỏ hàng từ LocalStorage
  const savedCart = localStorage.getItem('smartstore_cart');
  if (savedCart) {
    try { gioHang = JSON.parse(savedCart); } catch { gioHang = []; }
  }
  capNhatGiaoDienGioHang();

  // 2. Khởi tạo phiên đăng nhập
  kiemTraDangNhap();

  // 3. Gắn sự kiện chuyển tab trên thanh điều hướng Header
  $$('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const viewId = btn.dataset.view;
      if (viewId) chuyenTrang(viewId);
    });
  });

  // 4. Các nút điều hướng nhanh
  $('#logo-home')?.addEventListener('click', () => chuyenTrang('view-shop'));
  $('#btn-back-to-shop')?.addEventListener('click', () => chuyenTrang('view-shop'));
  $('#btn-view-order-history')?.addEventListener('click', () => chuyenTrang('view-orders'));
  $('#btn-account-view-orders')?.addEventListener('click', () => chuyenTrang('view-orders'));
  $('#btn-orders-go-login')?.addEventListener('click', () => chuyenTrang('view-account'));

  // 5. Sự kiện Modal xem chi tiết sản phẩm
  $('#btn-close-detail-modal')?.addEventListener('click', dongModalChiTiet);
  $('#product-detail-modal')?.addEventListener('click', function (e) {
    if (e.target === this) dongModalChiTiet();
  });

  // 6. Sự kiện Modal xác nhận đặt hàng
  $('#btn-accept-checkout')?.addEventListener('click', thucHienXacNhanDatHang);
  $('#btn-cancel-checkout')?.addEventListener('click', huyThanhToan);
  $('#checkout-confirm-modal')?.addEventListener('click', function (e) {
    if (e.target === this) dongModalXacNhanThanhToan();
  });

  // 7. Sự kiện bộ lọc tìm kiếm và phân loại sản phẩm
  $('#shop-search')?.addEventListener('input', locVaHienThiSanPham);
  $('#shop-filter-category')?.addEventListener('change', locVaHienThiSanPham);
  $('#shop-filter-price')?.addEventListener('change', locVaHienThiSanPham);

  // 8. Sự kiện gửi biểu mẫu thanh toán
  $('#checkout-form')?.addEventListener('submit', xuLyDatHang);

  // 9. Chuyển đổi tab Đăng nhập / Đăng ký trong trang tài khoản
  const tabLogin = $('#tab-btn-login');
  const tabReg = $('#tab-btn-register');
  const formLogin = $('#login-form');
  const formReg = $('#register-form');

  tabLogin?.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabReg?.classList.remove('active');
    if (formLogin) formLogin.style.display = 'block';
    if (formReg) formReg.style.display = 'none';
  });

  tabReg?.addEventListener('click', () => {
    tabReg.classList.add('active');
    tabLogin?.classList.remove('active');
    if (formReg) formReg.style.display = 'block';
    if (formLogin) formLogin.style.display = 'none';
  });

  // 10. Sự kiện các biểu mẫu tài khoản
  formLogin?.addEventListener('submit', xuLyDangNhap);
  formReg?.addEventListener('submit', xuLyDangKy);
  $('#change-password-form')?.addEventListener('submit', xuLyDoiMatKhau);
  $('#btn-logout')?.addEventListener('click', dangXuat);

  // 11. Nạp dữ liệu ban đầu từ REST API
  taiDanhMuc();
  taiSanPham();
});
