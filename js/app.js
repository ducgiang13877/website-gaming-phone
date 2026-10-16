/**
 * ============================================================================
 * TỆP JAVASCRIPT GIAO DIỆN NGƯỜI DÙNG (USER CLIENT - js/app.js)
 * ============================================================================
 * Dự án: Website Gaming Phone (SmartStore)
 * Môn học: Lập trình JavaScript Nâng Cao (WEB2064)
 * ============================================================================
 */

// ============================================================================
// PHẦN 1: CẤU HÌNH HỆ THỐNG VÀ ĐƯỜNG DẪN API (REST ENDPOINTS)
// ============================================================================

// Địa chỉ máy chủ Mock API JSON-Server (chạy cổng 3000)
const API_BASE = 'http://localhost:3000';

// Các đường dẫn API
const API_PRODUCTS = `${API_BASE}/products`;      // Danh sách điện thoại
const API_CATEGORIES = `${API_BASE}/categories`;  // Danh mục thương hiệu
const API_ORDERS = `${API_BASE}/orders`;          // Đơn hàng
const API_USERS = `${API_BASE}/users`;            // Tài khoản người dùng

// Ảnh thay thế dự phòng khi ảnh chính bị lỗi hoặc thiếu
const ANH_MAC_DINH = 'https://picsum.photos/300/300';

// Khóa lưu vào localStorage
const KEY_GIO_HANG = 'smartstore_cart';
const KEY_NGUOI_DUNG = 'smartstore_user';
const KEY_ADMIN_LOGGED = 'smartstore_admin_logged';

// Cấu hình phân trang sản phẩm
const SO_SAN_PHAM_MOI_TRANG = 8; // Tối đa 8 sản phẩm mỗi trang
let trangHienTai = 1;            // Trang hiện tại đang xem

// ============================================================================
// PHẦN 2: BIẾN QUẢN LÝ TRẠNG THÁI (APPLICATION STATE)
// ============================================================================

let danhSachSanPham = [];      // Mảng lưu danh sách sản phẩm lấy từ API
let danhSachDanhMuc = [];      // Mảng lưu danh mục thương hiệu
let gioHang = [];              // Mảng giỏ hàng hiện tại (đồng bộ với localStorage)
let nguoiDungHienTai = null;   // Thông tin tài khoản đang đăng nhập
let timerToast = null;         // Bộ đếm thời gian tự tắt thông báo Toast

// ============================================================================
// PHẦN 3: CÁC HÀM TIỆN ÍCH DÙNG CHUNG (UTILITIES)
// ============================================================================

/**
 * Hàm hỗ trợ lấy phần tử HTML nhanh theo ID hoặc CSS Selector ($)
 * @param {string} selector - ID hoặc bộ chọn CSS
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
 * @param {string} selector - Bộ chọn CSS
 * @returns {NodeListOf<HTMLElement>}
 */
const $$ = (selector) => document.querySelectorAll(selector);

/**
 * Hàm gọi API dùng chung (Fetch Wrapper)
 * Đóng gói phương thức gửi, thiết lập header JSON và kiểm tra lỗi mạng
 * @param {string} url - Đường dẫn API
 * @param {string} phuongThuc - 'GET', 'POST', 'PATCH', 'PUT', 'DELETE'
 * @param {object|null} duLieuGuiDi - Dữ liệu payload gửi lên
 * @returns {Promise<any>}
 */
const goiApi = async (url, phuongThuc = 'GET', duLieuGuiDi = null) => {
  const cauHinh = {
    method: phuongThuc,
    headers: { 'Content-Type': 'application/json' }
  };

  if (duLieuGuiDi !== null) {
    cauHinh.body = JSON.stringify(duLieuGuiDi);
  }

  const phanHoi = await fetch(url, cauHinh);
  if (!phanHoi.ok) {
    throw new Error(`Lỗi máy chủ (${phanHoi.status}): ${phanHoi.statusText}`);
  }
  return phanHoi.json();
};

/**
 * Hàm định dạng số tiền sang chuẩn Việt Nam Đồng (VNĐ)
 * @param {number|string} soTien - Giá trị số
 * @returns {string} Chuỗi tiền tệ ví dụ "29.990.000 đ"
 */
const dinhDangTien = (soTien) => {
  const giaTri = Number(soTien) || 0;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(giaTri);
};

/**
 * Hàm làm sạch HTML phòng chống tấn công XSS
 * @param {any} chuoiVanBan - Chuỗi nhập từ bên ngoài
 * @returns {string} Chuỗi an toàn
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
 * Hàm hiển thị thông báo Toast góc màn hình
 * @param {string} noiDung - Lời nhắn
 * @param {string} loai - 'success', 'error', 'warning', 'info'
 */
const hienThiThongBao = (noiDung, loai = 'info') => {
  const phanTuToast = $('toast');
  if (!phanTuToast) return;

  if (timerToast) clearTimeout(timerToast);

  const bieuTuong = {
    success: '<i class="fas fa-circle-check"></i>',
    error: '<i class="fas fa-circle-xmark"></i>',
    warning: '<i class="fas fa-triangle-exclamation"></i>',
    info: '<i class="fas fa-circle-info"></i>'
  }[loai] || '<i class="fas fa-circle-info"></i>';

  phanTuToast.innerHTML = `${bieuTuong} <span>${lamSachHtml(noiDung)}</span>`;
  phanTuToast.className = `toast-notice toast-${loai} show`;

  timerToast = setTimeout(() => {
    phanTuToast.classList.remove('show');
  }, 3000);
};

/**
 * Hàm sinh mã đơn hàng chuẩn 11 ký tự:
 * - Bắt đầu bằng dấu #
 * - Sau dấu # là 10 ký tự gồm chữ VIẾT HOA (A-Z) và SỐ (0-9) ngẫu nhiên
 * - Tổng độ dài chính xác là 11 ký tự, không ký tự đặc biệt
 * @returns {string} Mã đơn hàng hợp lệ dạng #XXXXXXXXXX
 */
const taoMaDonHang = () => {
  const chuoiKyTu = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let maDon = '#';
  for (let i = 0; i < 10; i++) {
    const viTri = Math.floor(Math.random() * chuoiKyTu.length);
    maDon += chuoiKyTu.charAt(viTri);
  }
  return maDon;
};

// ============================================================================
// PHẦN 4: ĐIỀU HƯỚNG GIAO DIỆN (VIEW SWITCHER - SPA)
// ============================================================================

/**
 * Hàm chuyển đổi giữa các màn hình trong ứng dụng
 * Hỗ trợ chuyển qua lại mượt mà giữa:
 * - 'view-shop': Trang Cửa hàng
 * - 'view-cart': Trang Giỏ hàng & Thanh toán
 * - 'view-thankyou': Trang Cảm ơn sau khi đặt hàng
 * - 'view-orders': Trang Lịch sử đơn hàng
 * - 'view-account': Trang Tài khoản (Đăng nhập / Đăng ký / Sửa thông tin)
 * 
 * @param {string} viewId - ID của view cần hiển thị
 */
const chuyenTrangView = (viewId) => {
  // 1. Ẩn tất cả các view bằng cách gỡ class 'active'
  $$('.view-panel').forEach(view => view.classList.remove('active'));

  // 2. Kích hoạt view mục tiêu
  const viewMucTieu = $(viewId);
  if (viewMucTieu) {
    viewMucTieu.classList.add('active');
  }

  // 3. Đổi trạng thái 'active' trên thanh menu Header
  $$('.nav-item').forEach(btn => {
    const mucTieu = btn.getAttribute('data-view');
    if (mucTieu === viewId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // 4. Nếu vào trang Giỏ hàng thì làm mới bảng giỏ hàng
  if (viewId === 'view-cart') {
    hienThiBangGioHang();
  }

  // 5. Nếu vào trang Lịch sử đơn hàng thì gọi API tải danh sách đơn
  if (viewId === 'view-orders') {
    hienThiLichSuDonHang();
  }

  // 6. Nếu vào trang Tài khoản thì cập nhật giao diện người dùng
  if (viewId === 'view-account') {
    capNhatGiaoDienTaiKhoan();
  }

  // Cuộn nhẹ lên đầu trang
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
window.chuyenTrangView = chuyenTrangView;

// ============================================================================
// PHẦN 5: TẢI VÀ HIỂN THỊ SẢN PHẨM (SHOP & FILTER & PAGINATION)
// ============================================================================

/**
 * Hàm khởi tạo và tải toàn bộ dữ liệu ban đầu từ REST API
 */
const khoiTaoUngDung = async () => {
  try {
    // 1. Phục hồi giỏ hàng từ localStorage
    const gioHangDaLuu = localStorage.getItem(KEY_GIO_HANG);
    if (gioHangDaLuu) {
      try { gioHang = JSON.parse(gioHangDaLuu); } catch { gioHang = []; }
    }

    // 2. Phục hồi thông tin người dùng từ localStorage
    const userDaLuu = localStorage.getItem(KEY_NGUOI_DUNG);
    if (userDaLuu) {
      try { nguoiDungHienTai = JSON.parse(userDaLuu); } catch { nguoiDungHienTai = null; }
    }

    // Cập nhật số lượng giỏ hàng, tên người dùng và các nút quyền hạn trên Header
    capNhatSoLuongGioHangTrenHeader();
    capNhatTenTaiKhoanTrenHeader();
    capNhatGiaoDienTaiKhoan();

    // 3. Tải song song danh sách sản phẩm và danh mục
    const [duLieuSP, duLieuDM] = await Promise.all([
      goiApi(API_PRODUCTS),
      goiApi(API_CATEGORIES)
    ]);

    danhSachSanPham = Array.isArray(duLieuSP) ? duLieuSP : [];
    danhSachDanhMuc = Array.isArray(duLieuDM) ? duLieuDM : [];

    // 4. Đổ danh mục vào thẻ select lọc
    napDanhMucVaoBoLoc();

    // 5. Hiển thị danh sách sản phẩm ra lưới (kèm phân trang)
    hienThiDanhSachSanPham();

  } catch (loi) {
    console.error('Lỗi khi tải dữ liệu từ máy chủ:', loi);
    hienThiThongBao('Không thể kết nối đến máy chủ JSON-Server cổng 3000!', 'error');
  }
};

/**
 * Đổ danh mục vào ô chọn lọc thương hiệu
 */
const napDanhMucVaoBoLoc = () => {
  const oChon = $('shop-filter-category');
  if (!oChon) return;

  let html = '<option value="">Tất cả thương hiệu</option>';
  danhSachDanhMuc.forEach(dm => {
    html += `<option value="${lamSachHtml(dm.id)}">${lamSachHtml(dm.name)}</option>`;
  });
  oChon.innerHTML = html;
};

/**
 * Lọc danh sách sản phẩm theo từ khóa tìm kiếm, danh mục và khoảng giá
 * Tương thích linh hoạt cả 2 trường 'cate_id' và 'category_id' trong db.json
 * @returns {Array} Danh sách sản phẩm thỏa mãn
 */
const layDanhSachSanPhamDaLoc = () => {
  const tuKhoa = ($('shop-search')?.value || '').trim().toLowerCase();
  const maDanhMuc = $('shop-filter-category')?.value || '';
  const mucGia = $('shop-filter-price')?.value || '';

  return danhSachSanPham.filter(sanPham => {
    // 1. Khớp từ khóa tìm kiếm
    const ten = (sanPham.name || '').toLowerCase();
    const thoaManTuKhoa = tuKhoa === '' || ten.includes(tuKhoa);

    // 2. Khớp mã danh mục (tương thích cả cate_id lẫn category_id)
    const idDanhMucCuaSP = sanPham.cate_id || sanPham.category_id || '';
    const thoaManDanhMuc = maDanhMuc === '' || String(idDanhMucCuaSP) === String(maDanhMuc);

    // 3. Khớp khoảng giá
    const gia = Number(sanPham.price) || 0;
    let thoaManGia = true;
    if (mucGia === 'duoi-10tr') thoaManGia = gia < 10000000;
    else if (mucGia === '10tr-25tr') thoaManGia = gia >= 10000000 && gia <= 25000000;
    else if (mucGia === 'tren-25tr') thoaManGia = gia > 25000000;

    return thoaManTuKhoa && thoaManDanhMuc && thoaManGia;
  });
};

/**
 * Hiển thị danh sách sản phẩm ra giao diện có phân trang (8 sản phẩm/trang)
 * ĐẶC BIỆT: Định dạng thẻ sản phẩm THU NHỎ, GỌN GÀNG, VỪA VẶN, ĐẸP MẮT
 */
const hienThiDanhSachSanPham = () => {
  const luoiSanPham = $('product-grid');
  if (!luoiSanPham) return;

  const sanPhamDaLoc = layDanhSachSanPhamDaLoc();

  // Không có sản phẩm nào khớp
  if (sanPhamDaLoc.length === 0) {
    luoiSanPham.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0;">
        <i class="fas fa-box-open" style="font-size: 2.5rem; color: #94a3b8; margin-bottom: 12px; display: block;"></i>
        <h3 style="font-size: 1.1rem; color: #475569; margin-bottom: 6px;">Không tìm thấy điện thoại nào phù hợp!</h3>
        <p style="color: #64748b; font-size: 0.85rem;">Hãy thử tìm kiếm với từ khóa khác hoặc điều chỉnh lại bộ lọc.</p>
      </div>
    `;
    const thanhPhanTrang = $('shop-pagination');
    if (thanhPhanTrang) thanhPhanTrang.innerHTML = '';
    return;
  }

  // Tính tổng số trang (mỗi trang 8 sản phẩm)
  const tongSoTrang = Math.ceil(sanPhamDaLoc.length / SO_SAN_PHAM_MOI_TRANG);
  if (trangHienTai > tongSoTrang) trangHienTai = tongSoTrang;
  if (trangHienTai < 1) trangHienTai = 1;

  // Cắt mảng lấy 8 sản phẩm của trang này bằng hàm .slice()
  const batDau = (trangHienTai - 1) * SO_SAN_PHAM_MOI_TRANG;
  const ketThuc = batDau + SO_SAN_PHAM_MOI_TRANG;
  const sanPhamTrangNay = sanPhamDaLoc.slice(batDau, ketThuc);

  // Tạo HTML thẻ sản phẩm nhỏ gọn
  const chuoiHtml = sanPhamTrangNay.map(sanPham => {
    const maDanhMucSP = sanPham.cate_id || sanPham.category_id;
    const danhMuc = danhSachDanhMuc.find(dm => String(dm.id) === String(maDanhMucSP));
    const tenHang = danhMuc ? danhMuc.name : 'Chính hãng';
    const anh = sanPham.image || ANH_MAC_DINH;
    const tonKho = Number(sanPham.quantity) || 0;
    const conHang = tonKho > 0;

    return `
      <div class="product-card">
        <!-- Khung ảnh nhỏ gọn, bấm vào xem chi tiết sản phẩm -->
        <div class="product-img-box" onclick="xemChiTietSanPham('${sanPham.id}')" title="Bấm để xem chi tiết ${lamSachHtml(sanPham.name)}">
          <span class="product-badge">${lamSachHtml(tenHang)}</span>
          <img 
            src="${lamSachHtml(anh)}" 
            alt="${lamSachHtml(sanPham.name)}" 
            onerror="this.onerror=null; this.src='${ANH_MAC_DINH}';"
          />
        </div>

        <!-- Thông tin sản phẩm -->
        <div class="product-info">
          <h3 class="product-name" onclick="xemChiTietSanPham('${sanPham.id}')" title="${lamSachHtml(sanPham.name)}">
            ${lamSachHtml(sanPham.name)}
          </h3>
          
          <p class="product-desc" title="${lamSachHtml(sanPham.detail || '')}">
            ${lamSachHtml(sanPham.detail || 'Gaming phone cấu hình mạnh mẽ, màn hình tần số quét cao.')}
          </p>

          <div class="product-price-box">
            <span class="product-price">${dinhDangTien(sanPham.price)}</span>
            <span class="product-stock" style="color: ${conHang ? '#16a34a' : '#dc2626'}; font-weight: 600;">
              ${conHang ? `Còn: ${tonKho}` : 'Hết hàng'}
            </span>
          </div>

          <!-- 2 nút thao tác nhỏ gọn -->
          <div class="product-actions-group">
            <button 
              type="button" 
              class="btn-add-cart" 
              onclick="themVaoGioHang('${sanPham.id}')"
              ${!conHang ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}
              title="Thêm vào giỏ"
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
  }).join('');

  luoiSanPham.innerHTML = chuoiHtml;

  // Tạo thanh nút bấm phân trang
  taoThanhPhanTrang(tongSoTrang, sanPhamDaLoc.length);
};

/**
 * Tạo thanh nút bấm phân trang ở dưới danh sách sản phẩm
 * @param {number} tongSoTrang - Tổng số trang
 * @param {number} tongSoSP - Tổng số sản phẩm sau khi lọc
 */
const taoThanhPhanTrang = (tongSoTrang, tongSoSP) => {
  const thanhPhanTrang = $('shop-pagination');
  if (!thanhPhanTrang) return;

  if (tongSoTrang <= 1) {
    thanhPhanTrang.innerHTML = '';
    return;
  }

  let html = '';

  // Nút Trước
  const coTruoc = trangHienTai > 1;
  html += `
    <button 
      type="button" 
      class="page-btn ${!coTruoc ? 'disabled' : ''}" 
      onclick="chuyenTrangSanPham(${trangHienTai - 1})"
      ${!coTruoc ? 'disabled' : ''}
    >
      <i class="fas fa-chevron-left"></i> Trước
    </button>
  `;

  // Các nút số trang
  for (let i = 1; i <= tongSoTrang; i++) {
    html += `
      <button 
        type="button" 
        class="page-btn ${i === trangHienTai ? 'active' : ''}" 
        onclick="chuyenTrangSanPham(${i})"
      >
        ${i}
      </button>
    `;
  }

  // Nút Sau
  const coSau = trangHienTai < tongSoTrang;
  html += `
    <button 
      type="button" 
      class="page-btn ${!coSau ? 'disabled' : ''}" 
      onclick="chuyenTrangSanPham(${trangHienTai + 1})"
      ${!coSau ? 'disabled' : ''}
    >
      Sau <i class="fas fa-chevron-right"></i>
    </button>
  `;

  html += `
    <span style="font-size: 0.85rem; color: #64748b; margin-left: 10px;">
      (Trang ${trangHienTai}/${tongSoTrang} • Tổng ${tongSoSP} máy)
    </span>
  `;

  thanhPhanTrang.innerHTML = html;
};

/**
 * Nhảy tới trang sản phẩm chỉ định
 */
const chuyenTrangSanPham = (soTrang) => {
  trangHienTai = soTrang;
  hienThiDanhSachSanPham();
  $('product-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};
window.chuyenTrangSanPham = chuyenTrangSanPham;

/**
 * Mở modal xem chi tiết sản phẩm (#product-detail-modal)
 * @param {string|number} sanPhamId - ID sản phẩm
 */
const xemChiTietSanPham = (sanPhamId) => {
  const sp = danhSachSanPham.find(item => String(item.id) === String(sanPhamId));
  if (!sp) return;

  const modal = $('product-detail-modal');
  if (!modal) return;

  const maDanhMucSP = sp.cate_id || sp.category_id;
  const danhMuc = danhSachDanhMuc.find(dm => String(dm.id) === String(maDanhMucSP));
  const tenHang = danhMuc ? danhMuc.name : 'Gaming Phone';
  const tonKho = Number(sp.quantity) || 0;

  if ($('detail-brand-badge')) $('detail-brand-badge').textContent = tenHang;
  if ($('detail-img')) $('detail-img').src = sp.image || ANH_MAC_DINH;
  if ($('detail-name')) $('detail-name').textContent = sp.name;
  if ($('detail-price')) $('detail-price').textContent = dinhDangTien(sp.price);
  if ($('detail-stock')) $('detail-stock').textContent = tonKho > 0 ? `Còn hàng trong kho: ${tonKho} máy` : 'Tạm thời hết hàng';
  if ($('detail-desc')) $('detail-desc').textContent = sp.detail || 'Cấu hình gaming phone mạnh mẽ, màn hình sắc nét, pin siêu trâu.';

  // Gán sự kiện cho 2 nút trong modal
  const btnAdd = $('btn-detail-add-cart');
  const btnBuy = $('btn-detail-buy-now');

  if (btnAdd) {
    btnAdd.onclick = () => {
      themVaoGioHang(sp.id);
      dongModalChiTiet();
    };
  }

  if (btnBuy) {
    btnBuy.onclick = () => {
      dongModalChiTiet();
      muaNgay(sp.id);
    };
  }

  modal.classList.add('open');
};
window.xemChiTietSanPham = xemChiTietSanPham;

/**
 * Đóng modal xem chi tiết sản phẩm
 */
const dongModalChiTiet = () => {
  $('product-detail-modal')?.classList.remove('open');
};
window.dongModalChiTiet = dongModalChiTiet;

/**
 * Lọc nhanh theo thương hiệu khi người dùng nhấp vào liên kết ở Footer
 * @param {string|number} cateId - ID thương hiệu
 */
const locTheoThuongHieuFooter = (cateId) => {
  chuyenTrangView('view-shop');
  const selectBox = $('shop-filter-category');
  if (selectBox) {
    selectBox.value = cateId;
    trangHienTai = 1;
    hienThiDanhSachSanPham();
  }
};
window.locTheoThuongHieuFooter = locTheoThuongHieuFooter;

// ============================================================================
// PHẦN 6: QUẢN LÝ GIỎ HÀNG (SHOPPING CART & LOCAL STORAGE)
// ============================================================================

/**
 * Lưu giỏ hàng vào localStorage và cập nhật số lượng trên icon Header
 */
const luuGioHangVaoStorage = () => {
  localStorage.setItem(KEY_GIO_HANG, JSON.stringify(gioHang));
  capNhatSoLuongGioHangTrenHeader();
};

/**
 * Cập nhật số lượng hiển thị trên icon giỏ hàng ở thanh Header
 * Hỗ trợ đồng thời cả 2 ID: 'cart-count' và 'cart-badge-count'
 */
const capNhatSoLuongGioHangTrenHeader = () => {
  const tongSoLuong = gioHang.reduce((tong, sp) => tong + (Number(sp.quantity) || 0), 0);

  const huyHieu1 = $('cart-count');
  const huyHieu2 = $('cart-badge-count');

  if (huyHieu1) {
    huyHieu1.textContent = tongSoLuong;
    huyHieu1.style.display = tongSoLuong > 0 ? 'inline-flex' : 'none';
  }
  if (huyHieu2) {
    huyHieu2.textContent = tongSoLuong;
    huyHieu2.style.display = tongSoLuong > 0 ? 'inline-flex' : 'none';
  }
};

/**
 * Cập nhật tên tài khoản hiển thị trên nút Header
 */
const capNhatTenTaiKhoanTrenHeader = () => {
  const textTaiKhoan = $('nav-account-text');
  if (!textTaiKhoan) return;

  if (nguoiDungHienTai) {
    // Lấy từ đầu tiên hoặc họ tên đầy đủ
    const tenRutGon = (nguoiDungHienTai.name || 'Bạn').split(' ').slice(-1)[0];
    textTaiKhoan.textContent = tenRutGon;
  } else {
    textTaiKhoan.textContent = 'Tài khoản';
  }
};

/**
 * Thêm sản phẩm vào giỏ hàng
 * @param {string|number} sanPhamId - ID sản phẩm
 */
const themVaoGioHang = (sanPhamId) => {
  const sp = danhSachSanPham.find(item => String(item.id) === String(sanPhamId));
  if (!sp) {
    hienThiThongBao('Không tìm thấy sản phẩm!', 'error');
    return;
  }

  const tonKho = Number(sp.quantity) || 0;
  if (tonKho <= 0) {
    hienThiThongBao('Sản phẩm này tạm thời đã hết hàng!', 'warning');
    return;
  }

  const monTrongGio = gioHang.find(item => String(item.id) === String(sanPhamId));

  if (monTrongGio) {
    if (monTrongGio.quantity >= tonKho) {
      hienThiThongBao(`Kho chỉ còn ${tonKho} máy, không thể thêm thêm!`, 'warning');
      return;
    }
    monTrongGio.quantity += 1;
  } else {
    gioHang.push({
      id: sp.id,
      name: sp.name,
      price: Number(sp.price) || 0,
      image: sp.image || ANH_MAC_DINH,
      quantity: 1,
      maxQuantity: tonKho
    });
  }

  luuGioHangVaoStorage();
  hienThiThongBao(`Đã thêm "${sp.name}" vào giỏ hàng!`, 'success');
};
window.themVaoGioHang = themVaoGioHang;

/**
 * Mua ngay: Thêm vào giỏ và chuyển màn hình sang thanh toán
 * @param {string|number} sanPhamId - ID sản phẩm
 */
const muaNgay = (sanPhamId) => {
  themVaoGioHang(sanPhamId);
  chuyenTrangView('view-cart');
};
window.muaNgay = muaNgay;

/**
 * Cập nhật số lượng món hàng trong bảng giỏ hàng
 */
const capNhatSoLuong = (sanPhamId, soLuongMoi) => {
  const mon = gioHang.find(item => String(item.id) === String(sanPhamId));
  if (!mon) return;

  const soLuong = parseInt(soLuongMoi, 10);
  if (isNaN(soLuong) || soLuong <= 0) {
    xoaKhoiGioHang(sanPhamId);
    return;
  }

  const spGoc = danhSachSanPham.find(item => String(item.id) === String(sanPhamId));
  const tonKho = spGoc ? (Number(spGoc.quantity) || 0) : 999;

  if (soLuong > tonKho) {
    hienThiThongBao(`Kho chỉ còn tối đa ${tonKho} sản phẩm!`, 'warning');
    mon.quantity = tonKho;
  } else {
    mon.quantity = soLuong;
  }

  luuGioHangVaoStorage();
  hienThiBangGioHang();
};
window.capNhatSoLuong = capNhatSoLuong;

/**
 * Xóa một món hàng khỏi giỏ hàng
 */
const xoaKhoiGioHang = (sanPhamId) => {
  const mon = gioHang.find(item => String(item.id) === String(sanPhamId));
  const tenMon = mon ? mon.name : 'sản phẩm';

  const xacNhan = confirm(`Bạn có chắc muốn xóa "${tenMon}" khỏi giỏ hàng?`);
  if (!xacNhan) return;

  gioHang = gioHang.filter(item => String(item.id) !== String(sanPhamId));
  luuGioHangVaoStorage();
  hienThiBangGioHang();
  hienThiThongBao(`Đã xóa "${tenMon}" khỏi giỏ hàng.`, 'info');
};
window.xoaKhoiGioHang = xoaKhoiGioHang;

/**
 * Hiển thị bảng giỏ hàng trong #view-cart
 */
const hienThiBangGioHang = () => {
  const tbody = $('cart-tbody');
  const oTamTinh = $('cart-subtotal');
  const oTongCong = $('cart-total');
  const canhBao1 = $('cart-login-warning');
  const canhBao2 = $('checkout-auth-alert');
  const nutDatHang = $('btn-submit-order');

  if (!tbody) return;

  if (gioHang.length === 0) {
    tbody.innerHTML = `
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

  let tongTien = 0;
  const chuoiHtml = gioHang.map(mon => {
    const gia = Number(mon.price) || 0;
    const soLuong = Number(mon.quantity) || 1;
    const thanhTien = gia * soLuong;
    tongTien += thanhTien;

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <img 
              src="${lamSachHtml(mon.image || ANH_MAC_DINH)}" 
              alt="${lamSachHtml(mon.name)}" 
              style="width: 45px; height: 45px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0;"
              onerror="this.onerror=null; this.src='${ANH_MAC_DINH}';"
            />
            <div>
              <strong style="display: block; font-size: 0.9rem; color: #1e293b;">${lamSachHtml(mon.name)}</strong>
              <small style="color: #64748b;">Mã SP: #${mon.id}</small>
            </div>
          </div>
        </td>
        <td style="font-weight: 600; color: #334155;">${dinhDangTien(gia)}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 4px;">
            <button 
              type="button" 
              onclick="capNhatSoLuong('${mon.id}', ${soLuong - 1})"
              style="width: 26px; height: 26px; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 4px; cursor: pointer;"
            >-</button>
            
            <input 
              type="number" 
              value="${soLuong}" 
              min="1" 
              max="${mon.maxQuantity || 99}" 
              onchange="capNhatSoLuong('${mon.id}', this.value)"
              style="width: 42px; height: 26px; text-align: center; border: 1px solid #cbd5e1; border-radius: 4px;"
            />

            <button 
              type="button" 
              onclick="capNhatSoLuong('${mon.id}', ${soLuong + 1})"
              style="width: 26px; height: 26px; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 4px; cursor: pointer;"
            >+</button>
          </div>
        </td>
        <td style="font-weight: 700; color: #ef4444;">${dinhDangTien(thanhTien)}</td>
        <td>
          <button 
            type="button" 
            onclick="xoaKhoiGioHang('${mon.id}')"
            title="Xóa món này"
            style="background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 1rem; padding: 4px;"
          >
            <i class="fas fa-trash-can hover-red"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  tbody.innerHTML = chuoiHtml;

  if (oTamTinh) oTamTinh.textContent = dinhDangTien(tongTien);
  if (oTongCong) oTongCong.textContent = dinhDangTien(tongTien);

  // Kiểm tra đăng nhập
  if (nguoiDungHienTai) {
    if (canhBao1) canhBao1.classList.add('hidden');
    if (canhBao2) canhBao2.classList.add('hidden');
    if (nutDatHang) nutDatHang.disabled = false;

    // Điền sẵn thông tin người nhận
    const oTen = $('order-name');
    const oSdt = $('order-phone');
    const oDiaChi = $('order-address');

    if (oTen && !oTen.value) oTen.value = nguoiDungHienTai.name || '';
    if (oSdt && !oSdt.value) oSdt.value = nguoiDungHienTai.phone || '';
    if (oDiaChi && !oDiaChi.value) oDiaChi.value = nguoiDungHienTai.address || '';
  } else {
    if (canhBao1) canhBao1.classList.remove('hidden');
    if (canhBao2) canhBao2.classList.remove('hidden');
    if (nutDatHang) nutDatHang.disabled = true;
  }
};

// ============================================================================
// PHẦN 7: XỬ LÝ ĐẶT HÀNG & MÀN HÌNH CẢM ƠN (CHECKOUT & THANK YOU)
// ============================================================================

/**
 * Xử lý đặt hàng (#checkout-form)
 * Sinh mã đơn hàng ngẫu nhiên 11 ký tự dạng #XXXXXXXXXX
 */
const xuLyDatHang = async (suKien) => {
  suKien.preventDefault();

  if (!nguoiDungHienTai) {
    hienThiThongBao('Vui lòng đăng nhập trước khi đặt hàng!', 'warning');
    chuyenTrangView('view-account');
    return;
  }

  if (gioHang.length === 0) {
    hienThiThongBao('Giỏ hàng đang trống!', 'warning');
    return;
  }

  const name = ($('order-name')?.value || '').trim();
  const phone = ($('order-phone')?.value || '').trim();
  const address = ($('order-address')?.value || '').trim();

  if (!name || !phone || !address) {
    hienThiThongBao('Vui lòng điền đầy đủ tên, số điện thoại và địa chỉ nhận hàng!', 'warning');
    return;
  }

  const nutNop = $('btn-submit-order');
  if (nutNop) {
    nutNop.disabled = true;
    nutNop.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
  }

  try {
    const tongTien = gioHang.reduce((tong, sp) => tong + (sp.price * sp.quantity), 0);
    const maDon = taoMaDonHang();

    const donHangMoi = {
      order_code: maDon,
      user_id: nguoiDungHienTai.id,
      customer_name: name,
      customer_email: nguoiDungHienTai.email || '',
      customer_phone: phone,
      shipping_address: address,
      items: gioHang.map(sp => ({
        product_id: sp.id,
        product_name: sp.name,
        price: sp.price,
        quantity: sp.quantity,
        image: sp.image || ANH_MAC_DINH
      })),
      total_price: tongTien,
      status: 'Đang xử lý',
      created_at: new Date().toISOString()
    };

    // 1. Gửi đơn hàng lên server
    const donDaTao = await goiApi(API_ORDERS, 'POST', donHangMoi);

    // 2. Trừ số lượng tồn kho trên server
    for (const mon of gioHang) {
      const spTrongKho = danhSachSanPham.find(item => String(item.id) === String(mon.id));
      if (spTrongKho) {
        const tonConLai = Math.max(0, (Number(spTrongKho.quantity) || 0) - mon.quantity);
        await goiApi(`${API_PRODUCTS}/${mon.id}`, 'PATCH', { quantity: tonConLai });
        spTrongKho.quantity = tonConLai;
      }
    }

    // 3. Xóa giỏ hàng
    gioHang = [];
    luuGioHangVaoStorage();
    $('checkout-form')?.reset();

    // 4. Chuyển sang màn hình Cảm Ơn
    hienThiManHinhCamOn(donDaTao);
    hienThiThongBao('Đặt hàng thành công!', 'success');

  } catch (loi) {
    console.error('Lỗi khi đặt hàng:', loi);
    hienThiThongBao('Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại!', 'error');
  } finally {
    if (nutNop) {
      nutNop.disabled = false;
      nutNop.innerHTML = '<i class="fas fa-check-circle"></i> Đặt Hàng Ngay';
    }
  }
};

/**
 * Hiển thị thông tin đơn hàng vừa đặt tại màn hình #view-thankyou
 */
const hienThiManHinhCamOn = (donHang) => {
  chuyenTrangView('view-thankyou');

  if ($('placed-order-id')) $('placed-order-id').textContent = donHang.order_code || donHang.id || '#SMARTSTORE';
  if ($('placed-order-name')) $('placed-order-name').textContent = donHang.customer_name || '—';
  if ($('placed-order-phone')) $('placed-order-phone').textContent = donHang.customer_phone || '—';
  if ($('placed-order-address')) $('placed-order-address').textContent = donHang.shipping_address || '—';
  if ($('placed-order-total')) $('placed-order-total').textContent = dinhDangTien(donHang.total_price);

  const danhSachMon = $('placed-items-list');
  if (danhSachMon && Array.isArray(donHang.items)) {
    danhSachMon.innerHTML = donHang.items.map(sp => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; font-size: 0.9rem;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <img 
            src="${lamSachHtml(sp.image || ANH_MAC_DINH)}" 
            alt="${lamSachHtml(sp.product_name)}" 
            style="width: 36px; height: 36px; object-fit: cover; border-radius: 4px; border: 1px solid #e2e8f0;"
            onerror="this.onerror=null; this.src='${ANH_MAC_DINH}';"
          />
          <div>
            <strong>${lamSachHtml(sp.product_name)}</strong>
            <div style="font-size: 0.8rem; color: #64748b;">x${sp.quantity}</div>
          </div>
        </div>
        <strong>${dinhDangTien(sp.price * sp.quantity)}</strong>
      </div>
    `).join('');
  }
};

// ============================================================================
// PHẦN 8: XEM LỊCH SỬ ĐƠN HÀNG (ORDER HISTORY)
// ============================================================================

/**
 * Hiển thị danh sách các đơn hàng đã mua (#view-orders)
 */
const hienThiLichSuDonHang = async () => {
  const canhBao = $('orders-not-logged');
  const danhSachBox = $('orders-history-list');
  if (!danhSachBox) return;

  if (!nguoiDungHienTai) {
    if (canhBao) canhBao.classList.remove('hidden');
    danhSachBox.innerHTML = '';
    return;
  }

  if (canhBao) canhBao.classList.add('hidden');

  danhSachBox.innerHTML = `
    <div style="text-align: center; padding: 30px; color: #64748b;">
      <i class="fas fa-spinner fa-spin" style="font-size: 1.8rem; color: #3b82f6;"></i>
      <p style="margin-top: 8px;">Đang tải danh sách đơn hàng...</p>
    </div>
  `;

  try {
    const tatCaDon = await goiApi(`${API_ORDERS}?user_id=${nguoiDungHienTai.id}`);
    const danhSachDon = (Array.isArray(tatCaDon) ? tatCaDon : []).reverse();

    if (danhSachDon.length === 0) {
      danhSachBox.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0;">
          <i class="fas fa-receipt" style="font-size: 2.5rem; color: #cbd5e1; margin-bottom: 12px; display: block;"></i>
          <h3 style="font-size: 1.1rem; color: #334155; margin-bottom: 6px;">Bạn chưa có đơn đặt hàng nào!</h3>
          <p style="color: #64748b; font-size: 0.85rem; margin-bottom: 16px;">Hãy lựa chọn cho mình chiếc gaming phone ưng ý nhé.</p>
          <button type="button" class="btn-primary" onclick="chuyenTrangView('view-shop')">
            <i class="fas fa-bag-shopping"></i> Mua sắm ngay
          </button>
        </div>
      `;
      return;
    }

    const html = danhSachDon.map(don => {
      let badgeClass = 'status-processing';
      if (don.status === 'Đang giao hàng') badgeClass = 'status-shipping';
      if (don.status === 'Đã giao hàng') badgeClass = 'status-delivered';
      if (don.status === 'Đã hủy') badgeClass = 'status-cancelled';

      const ngayTao = don.created_at || don.created_date;
      const thoiGian = ngayTao ? new Date(ngayTao).toLocaleString('vi-VN') : 'Vừa xong';
      const maDon = don.order_code || don.id || '#SMARTSTORE';
      const sdt = don.customer_phone || don.phone || '—';
      const diaChi = don.shipping_address || don.address || '—';
      const tongTien = Number(don.total_price != null ? don.total_price : don.total_amount) || 0;

      const monItems = Array.isArray(don.items) ? don.items.map(item => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 0.88rem;">
          <span style="color: #334155;">
            <i class="fas fa-mobile-screen" style="color: #94a3b8; margin-right: 6px;"></i>
            ${lamSachHtml(item.product_name || item.name || 'Điện thoại')} <strong>(x${item.quantity})</strong>
          </span>
          <span style="font-weight: 600;">${dinhDangTien(item.price * item.quantity)}</span>
        </div>
      `).join('') : '<p style="color: #94a3b8;">Không có chi tiết sản phẩm.</p>';

      return `
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
            <div>
              <span style="font-size: 0.85rem; color: #64748b;">Mã đơn:</span>
              <strong style="color: #2563eb; font-size: 1rem; margin-left: 4px;">${lamSachHtml(maDon)}</strong>
              <small style="color: #94a3b8; margin-left: 8px;">(${thoiGian})</small>
            </div>
            <span class="status-badge ${badgeClass}">${lamSachHtml(don.status || 'Đang xử lý')}</span>
          </div>

          <div style="background: #f8fafc; padding: 8px 12px; border-radius: 6px; font-size: 0.85rem; color: #475569; margin-bottom: 10px;">
            <strong>Địa chỉ:</strong> ${lamSachHtml(diaChi)} • <strong>SĐT:</strong> ${lamSachHtml(sdt)}
          </div>

          <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 10px;">
            ${monItems}
          </div>

          <div style="display: flex; justify-content: flex-end; align-items: center; gap: 8px;">
            <span style="font-size: 0.85rem; color: #64748b;">Tổng tiền:</span>
            <strong style="font-size: 1.15rem; color: #ef4444;">${dinhDangTien(tongTien)}</strong>
          </div>
        </div>
      `;
    }).join('');

    danhSachBox.innerHTML = html;

  } catch (loi) {
    console.error('Lỗi khi tải lịch sử đơn:', loi);
    danhSachBox.innerHTML = `<p style="text-align: center; color: #ef4444; padding: 20px;">Không thể tải lịch sử đơn hàng!</p>`;
  }
};

// ============================================================================
// PHẦN 9: QUẢN LÝ TÀI KHOẢN & TỰ SỬA THÔNG TIN CÁ NHÂN (PROFILE SELF-EDIT)
// ============================================================================

/**
 * Cập nhật giao diện trang tài khoản (#view-account)
 */
const capNhatGiaoDienTaiKhoan = () => {
  const hopDaDangNhap = $('account-logged-box');
  const hopChuaDangNhap = $('auth-forms-wrapper');
  const nutAdminHeader = $('nav-btn-admin');
  const theShortcutAdmin = $('admin-shortcut-card');
  if (!hopDaDangNhap || !hopChuaDangNhap) return;

  if (nguoiDungHienTai) {
    hopDaDangNhap.classList.remove('hidden');
    hopChuaDangNhap.classList.add('hidden');

    const laAdmin = nguoiDungHienTai.role === 'admin' || nguoiDungHienTai.email === 'admin@smartstore.vn';

    if ($('account-user-name')) $('account-user-name').textContent = nguoiDungHienTai.name || 'Người dùng';
    if ($('account-user-email')) $('account-user-email').textContent = nguoiDungHienTai.email || '';
    if ($('profile-name-val')) $('profile-name-val').textContent = nguoiDungHienTai.name || '—';
    if ($('profile-phone')) $('profile-phone').textContent = nguoiDungHienTai.phone || '—';
    if ($('profile-address')) $('profile-address').textContent = nguoiDungHienTai.address || '—';
    if ($('profile-role')) $('profile-role').textContent = laAdmin ? 'Quản trị viên (Admin)' : 'Khách hàng';

    // Điền vào form sửa
    if ($('edit-profile-name')) $('edit-profile-name').value = nguoiDungHienTai.name || '';
    if ($('edit-profile-phone')) $('edit-profile-phone').value = nguoiDungHienTai.phone || '';
    if ($('edit-profile-address')) $('edit-profile-address').value = nguoiDungHienTai.address || '';

    // Kiểm tra và hiển thị lối tắt trang Quản trị dành cho Admin
    if (laAdmin) {
      localStorage.setItem(KEY_ADMIN_LOGGED, 'true');
      if (nutAdminHeader) nutAdminHeader.classList.remove('hidden');
      if (theShortcutAdmin) theShortcutAdmin.classList.remove('hidden');
    } else {
      if (nutAdminHeader) nutAdminHeader.classList.add('hidden');
      if (theShortcutAdmin) theShortcutAdmin.classList.add('hidden');
    }
  } else {
    hopDaDangNhap.classList.add('hidden');
    hopChuaDangNhap.classList.remove('hidden');
    if (nutAdminHeader) nutAdminHeader.classList.add('hidden');
    if (theShortcutAdmin) theShortcutAdmin.classList.add('hidden');
  }

  capNhatTenTaiKhoanTrenHeader();
};

/**
 * Ẩn/hiện khung form chỉnh sửa thông tin cá nhân
 */
const batTatKhungSuaThongTin = () => {
  const khung = $('edit-profile-card');
  if (!khung) return;
  khung.classList.toggle('hidden');
  if (!khung.classList.contains('hidden')) {
    $('edit-profile-name')?.focus();
  }
};

/**
 * Xử lý khi User lưu thông tin cá nhân mới (#edit-profile-form)
 */
const xuLyCapNhatThongTinNguoiDung = async (suKien) => {
  suKien.preventDefault();

  if (!nguoiDungHienTai) {
    hienThiThongBao('Bạn chưa đăng nhập!', 'warning');
    return;
  }

  const name = ($('edit-profile-name')?.value || '').trim();
  const phone = ($('edit-profile-phone')?.value || '').trim();
  const address = ($('edit-profile-address')?.value || '').trim();

  if (!name || !phone || !address) {
    hienThiThongBao('Vui lòng điền đầy đủ họ tên, SĐT và địa chỉ!', 'warning');
    return;
  }

  try {
    const daCapNhat = await goiApi(`${API_USERS}/${nguoiDungHienTai.id}`, 'PATCH', {
      name,
      phone,
      address
    });

    nguoiDungHienTai = { ...nguoiDungHienTai, ...daCapNhat };
    localStorage.setItem(KEY_NGUOI_DUNG, JSON.stringify(nguoiDungHienTai));

    capNhatGiaoDienTaiKhoan();
    $('edit-profile-card')?.classList.add('hidden');
    hienThiThongBao('Cập nhật thông tin cá nhân thành công!', 'success');

  } catch (loi) {
    console.error('Lỗi khi cập nhật thông tin:', loi);
    hienThiThongBao('Không thể cập nhật thông tin cá nhân lúc này!', 'error');
  }
};

/**
 * Xử lý Đăng nhập tài khoản (#login-form)
 */
const xuLyDangNhap = async (suKien) => {
  suKien.preventDefault();

  const email = ($('login-email')?.value || '').trim();
  const password = ($('login-password')?.value || '').trim();

  if (!email || !password) {
    hienThiThongBao('Vui lòng nhập Email và Mật khẩu!', 'warning');
    return;
  }

  try {
    const timKiem = await goiApi(`${API_USERS}?email=${encodeURIComponent(email)}`);
    const taiKhoan = Array.isArray(timKiem) ? timKiem[0] : null;

    if (!taiKhoan || taiKhoan.password !== password) {
      hienThiThongBao('Email hoặc mật khẩu không chính xác!', 'error');
      return;
    }

    nguoiDungHienTai = taiKhoan;
    localStorage.setItem(KEY_NGUOI_DUNG, JSON.stringify(nguoiDungHienTai));

    // Kiểm tra xem tài khoản đăng nhập có quyền Quản Trị Viên (Admin) không
    const laAdmin = taiKhoan.role === 'admin' || taiKhoan.email === 'admin@smartstore.vn';

    if (laAdmin) {
      // 1. Lưu cờ phiên đăng nhập Quản trị viên vào localStorage để admin.html tự động mở dashboard
      localStorage.setItem(KEY_ADMIN_LOGGED, 'true');

      // 2. Cập nhật giao diện tài khoản
      capNhatGiaoDienTaiKhoan();

      // 3. Thông báo Toast nổi bật cho Admin biết hệ thống đang tự động điều hướng
      hienThiThongBao('Đăng nhập Quản trị viên thành công! Đang chuyển sang Bảng Quản Trị...', 'success');

      // 4. Tự động chuyển hướng sang trang admin.html sau 700ms
      setTimeout(() => {
        window.location.href = 'admin.html';
      }, 700);
      return;
    }

    $('login-form')?.reset();
    capNhatGiaoDienTaiKhoan();
    hienThiThongBao(`Chào mừng ${taiKhoan.name || 'bạn'} đã đăng nhập!`, 'success');

  } catch (loi) {
    console.error('Lỗi đăng nhập:', loi);
    hienThiThongBao('Không thể đăng nhập. Kiểm tra cổng server!', 'error');
  }
};

/**
 * Xử lý Đăng ký tài khoản mới (#register-form)
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
    hienThiThongBao('Mật khẩu cần tối thiểu 6 ký tự!', 'warning');
    return;
  }

  try {
    const kiemTra = await goiApi(`${API_USERS}?email=${encodeURIComponent(email)}`);
    if (Array.isArray(kiemTra) && kiemTra.length > 0) {
      hienThiThongBao('Email này đã được đăng ký trước đó!', 'warning');
      return;
    }

    const userMoi = {
      name,
      email,
      phone,
      password,
      address,
      role: 'customer'
    };

    const userDaTao = await goiApi(API_USERS, 'POST', userMoi);
    nguoiDungHienTai = userDaTao;
    localStorage.setItem(KEY_NGUOI_DUNG, JSON.stringify(nguoiDungHienTai));

    $('register-form')?.reset();
    capNhatGiaoDienTaiKhoan();
    hienThiThongBao('Đăng ký tài khoản mới thành công!', 'success');

  } catch (loi) {
    console.error('Lỗi đăng ký:', loi);
    hienThiThongBao('Có lỗi xảy ra khi đăng ký tài khoản!', 'error');
  }
};

/**
 * Xử lý đổi mật khẩu (#change-password-form)
 */
const xuLyDoiMatKhau = async (suKien) => {
  suKien.preventDefault();

  if (!nguoiDungHienTai) return;

  const passCu = ($('old-pass')?.value || '').trim();
  const passMoi = ($('new-pass')?.value || '').trim();
  const xacNhan = ($('confirm-new-pass')?.value || '').trim();

  if (passCu !== nguoiDungHienTai.password) {
    hienThiThongBao('Mật khẩu hiện tại không đúng!', 'error');
    return;
  }

  if (passMoi.length < 6) {
    hienThiThongBao('Mật khẩu mới phải có ít nhất 6 ký tự!', 'warning');
    return;
  }

  if (passMoi !== xacNhan) {
    hienThiThongBao('Xác nhận mật khẩu mới không khớp!', 'warning');
    return;
  }

  try {
    await goiApi(`${API_USERS}/${nguoiDungHienTai.id}`, 'PATCH', { password: passMoi });
    nguoiDungHienTai.password = passMoi;
    localStorage.setItem(KEY_NGUOI_DUNG, JSON.stringify(nguoiDungHienTai));

    $('change-password-form')?.reset();
    hienThiThongBao('Đổi mật khẩu thành công!', 'success');

  } catch (loi) {
    console.error('Lỗi đổi mật khẩu:', loi);
    hienThiThongBao('Không thể đổi mật khẩu lúc này!', 'error');
  }
};

/**
 * Xử lý đăng xuất
 */
const xuLyDangXuat = () => {
  const xacNhan = confirm('Bạn có chắc muốn đăng xuất không?');
  if (!xacNhan) return;

  nguoiDungHienTai = null;
  localStorage.removeItem(KEY_NGUOI_DUNG);
  localStorage.removeItem(KEY_ADMIN_LOGGED); // Xóa đồng thời cờ phiên quản trị
  capNhatGiaoDienTaiKhoan();
  hienThiThongBao('Đã đăng xuất tài khoản.', 'info');
};

// ============================================================================
// PHẦN 10: GẮN SỰ KIỆN KHỞI CHẠY (EVENT LISTENERS - PHÒNG THỦ KÉP)
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Tải ứng dụng ban đầu
  khoiTaoUngDung();

  // 2. BẮT SỰ KIỆN CHUYỂN TAB TRÊN HEADER (HỖ TRỢ CẢ DATA-VIEW LẪN ID)
  // Duyệt qua tất cả các nút nav-item và gắn sự kiện click dựa trên data-view
  $$('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const viewMucTieu = btn.getAttribute('data-view');
      // Chỉ ngăn chặn hành vi mặc định khi là nút chuyển tab SPA nội bộ (có data-view)
      if (viewMucTieu) {
        e.preventDefault();
        chuyenTrangView(viewMucTieu);
      }
    });
  });

  // Gắn sự kiện theo ID bổ trợ để bảo đảm 100% không bao giờ trượt
  $('nav-btn-shop')?.addEventListener('click', () => chuyenTrangView('view-shop'));
  $('nav-btn-cart')?.addEventListener('click', () => chuyenTrangView('view-cart'));
  $('nav-btn-orders')?.addEventListener('click', () => chuyenTrangView('view-orders'));
  $('nav-btn-account')?.addEventListener('click', () => chuyenTrangView('view-account'));

  // Bấm vào Logo hoặc tên thương hiệu để quay về Cửa hàng
  $('logo-home')?.addEventListener('click', () => chuyenTrangView('view-shop'));
  $('.brand-logo')?.addEventListener('click', () => chuyenTrangView('view-shop'));

  // 3. Các nút điều hướng nhanh khác
  $('btn-back-to-shop')?.addEventListener('click', () => chuyenTrangView('view-shop'));
  $('btn-view-order-history')?.addEventListener('click', () => chuyenTrangView('view-orders'));
  $('btn-account-view-orders')?.addEventListener('click', () => chuyenTrangView('view-orders'));
  $('btn-orders-go-login')?.addEventListener('click', () => chuyenTrangView('view-account'));

  // 4. Modal xem chi tiết sản phẩm
  $('btn-close-detail-modal')?.addEventListener('click', dongModalChiTiet);
  $('product-detail-modal')?.addEventListener('click', function (e) {
    if (e.target === this) dongModalChiTiet();
  });

  // 5. Bộ lọc sản phẩm
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

  // 6. Form đặt hàng
  $('checkout-form')?.addEventListener('submit', xuLyDatHang);

  // 7. Chuyển đổi tab Đăng nhập / Đăng ký
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

  // 8. Chức năng User tự sửa thông tin cá nhân
  $('btn-toggle-edit-profile')?.addEventListener('click', batTatKhungSuaThongTin);
  $('btn-cancel-edit-profile')?.addEventListener('click', batTatKhungSuaThongTin);
  $('edit-profile-form')?.addEventListener('submit', xuLyCapNhatThongTinNguoiDung);

  // 9. Form Đăng nhập, Đăng ký, Đổi mật khẩu, Đăng xuất
  $('login-form')?.addEventListener('submit', xuLyDangNhap);
  $('register-form')?.addEventListener('submit', xuLyDangKy);
  $('change-password-form')?.addEventListener('submit', xuLyDoiMatKhau);
  $('btn-logout')?.addEventListener('click', xuLyDangXuat);
});
