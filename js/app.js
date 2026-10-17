/**
 * ============================================================================
 * DỰ ÁN: WEBSITE BÁN ĐIỆN THOẠI & GAMING PHONE (SMARTSTORE)
 * TỆP: js/app.js (LOGIC CLIENT DỄ HIỂU - CHUẨN ES6 DÀNH CHO SINH VIÊN)
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * ============================================================================
 */

// ============================================================================
// PHẦN 1: CẤU HÌNH API & BIẾN TOÀN CỤC (GLOBAL VARIABLES)
// ============================================================================
const API_URL = 'http://localhost:3000'; // Đường dẫn máy chủ json-server
const SO_SP_MOI_TRANG = 8;              // Phân trang 8 sản phẩm mỗi trang

// Dữ liệu ứng dụng
let dsSanPham = [];      // Danh sách 40 sản phẩm tải từ server
let dsDanhMuc = [];      // Danh sách 8 thương hiệu tải từ server
// Làm sạch dữ liệu giỏ hàng từ LocalStorage (chống lỗi NaN hoặc null)
let gioHang = [];
try {
  const luuTruGio = JSON.parse(localStorage.getItem('smartstore_cart'));
  if (Array.isArray(luuTruGio)) {
    gioHang = luuTruGio
      .filter(item => item && item.id)
      .map(item => ({
        ...item,
        price: Number(item.price) || 0,
        quantity: (!item.quantity || isNaN(item.quantity) || Number(item.quantity) <= 0) ? 1 : Number(item.quantity)
      }));
  }
} catch (e) {
  gioHang = [];
}
let nguoiDungHienTai = JSON.parse(localStorage.getItem('smartstore_user')) || null; // Người dùng đã đăng nhập
let dsSoSanh = JSON.parse(sessionStorage.getItem('smartstore_compare')) || []; // Danh sách máy đang so sánh (tối đa 3 máy)
let donHangVuaDat = null; // Lưu đơn hàng vừa tạo thành công

// Trạng thái bộ lọc cửa hàng
let boLoc = {
  hang: 'all',          // Mã hãng cần lọc ('all' hoặc '1', '2'...)
  nhuCau: 'all',        // Lọc theo nhu cầu ('all', 'gaming', 'camera', 'battery', 'foldable')
  tuKhoa: '',           // Từ khóa tìm kiếm
  khoangGia: 'all',     // Mức giá ('under-10', '10-20', '20-30', 'over-30')
  sapXep: 'default',    // Sắp xếp theo giá hoặc tên
  trang: 1              // Trang hiện tại
};

// ============================================================================
// PHẦN 2: CÁC HÀM TIỆN ÍCH DỄ DÙNG (UTILITIES)
// ============================================================================

/**
 * Định dạng số thành tiền Việt Nam (Ví dụ: 34990000 -> 34.990.000 đ)
 */
function dinhDangTien(soTien) {
  if (!soTien || isNaN(soTien)) return '0 đ';
  return Number(soTien).toLocaleString('vi-VN') + ' đ';
}

/**
 * Hiển thị thông báo Toast ở góc màn hình
 * @param {string} noiDung - Nội dung cần thông báo
 * @param {'success'|'error'|'warning'|'info'} loai - Kiểu thông báo
 */
function hienThongBao(noiDung, loai = 'success') {
  const toast = document.getElementById('toast-container');
  const msg = document.getElementById('toast-message');
  if (!toast || !msg) return;

  toast.className = `toast-notice toast-${loai} show`;
  msg.textContent = noiDung;

  // Tự động tắt sau 3 giây
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

/**
 * Lưu giỏ hàng vào bộ nhớ trình duyệt và cập nhật số lượng trên icon
 */
function luuGioHang() {
  localStorage.setItem('smartstore_cart', JSON.stringify(gioHang));
  capNhatBadge();
}

/**
 * Cập nhật số lượng trên icon Giỏ hàng và Menu So sánh
 */
function capNhatBadge() {
  // Cập nhật giỏ hàng: Luôn hiển thị dấu chấm tròn đỏ kèm số lượng chính xác ở mọi góc nhìn
  const badgeCart = document.getElementById('cart-badge-count');
  if (badgeCart) {
    const tongSoLuong = gioHang.reduce((tong, item) => {
      const sl = Number(item.quantity);
      return tong + (isNaN(sl) ? 0 : sl);
    }, 0);

    badgeCart.textContent = tongSoLuong;
    badgeCart.style.display = 'inline-flex';
    badgeCart.setAttribute('title', `Giỏ hàng: ${tongSoLuong} sản phẩm`);

    // Hiệu ứng Pop nảy nhẹ khi số lượng thay đổi
    badgeCart.classList.remove('badge-pop');
    void badgeCart.offsetWidth; // Buộc trình duyệt reflow để chạy lại animation
    badgeCart.classList.add('badge-pop');
  }

  // Cập nhật so sánh
  const badgeCompare = document.getElementById('compare-nav-badge');
  if (badgeCompare) {
    badgeCompare.textContent = dsSoSanh.length;
    badgeCompare.style.display = dsSoSanh.length > 0 ? 'inline-block' : 'none';
  }
}

// ============================================================================
// PHẦN 3: TẢI DỮ LIỆU TỪ MÁY CHỦ (FETCH API)
// ============================================================================

async function taiDuLieu() {
  try {
    // Gọi song song cả 2 bảng dữ liệu từ json-server
    const [resHang, resSP] = await Promise.all([
      fetch(`${API_URL}/categories`),
      fetch(`${API_URL}/products`)
    ]);

    dsDanhMuc = await resHang.json();
    const dataSP = await resSP.json();

    // Chuẩn hóa 100% dữ liệu: đồng bộ categoryId & cate_id, stock & quantity
    dsSanPham = dataSP.map(sp => ({
      ...sp,
      categoryId: sp.categoryId || sp.cate_id || '1',
      cate_id: sp.cate_id || sp.categoryId || '1',
      stock: (sp.stock !== undefined && sp.stock !== null) ? Number(sp.stock) : (Number(sp.quantity) || 15),
      quantity: (sp.quantity !== undefined && sp.quantity !== null) ? Number(sp.quantity) : (Number(sp.stock) || 15),
      sold: Number(sp.sold) || 0
    }));

    // Hiển thị giao diện ban đầu
    capNhatNguoiDungHeader();
    capNhatBadge();
    hienThiTrangChu();
    hienThiSoSanh();
  } catch (loi) {
    console.error('Lỗi kết nối máy chủ:', loi);
    hienThongBao('Chưa bật máy chủ json-server! Hãy mở file chay_server.bat', 'error');
  }
}

/**
 * Cập nhật góc phải Header hiển thị nút Tài Khoản với Dropdown khi Hover
 */
function capNhatNguoiDungHeader() {
  const container = document.getElementById('user-nav-status');
  if (!container) return;

  if (nguoiDungHienTai) {
    // 1. Khi người dùng ĐÃ ĐĂNG NHẬP: Hover hiện "Thông Tin Tài Khoản" và "Đơn Hàng"
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
            <span>Đơn Hàng</span>
          </button>
          ${laAdmin ? `
            <a href="admin.html" class="user-dropdown-item" style="text-decoration:none;">
              <i class="fa-solid fa-gear" style="color: #7e22ce;"></i>
              <span>Trang Quản Trị</span>
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
    // 2. Khi người dùng CHƯA ĐĂNG NHẬP: Nút có tên "Tài Khoản", hover hiện "Đăng Nhập" và "Đăng Ký"
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

// ============================================================================
// PHẦN 4: ĐIỀU HƯỚNG SPA 12 TRANG (CHUYỂN TRANG KHÔNG RELOAD)
// ============================================================================

function chuyenTrang(tenTrang, thamSo = {}) {
  // 1. Ẩn tất cả các trang
  const cacTrang = document.querySelectorAll('.view-panel');
  cacTrang.forEach(trang => trang.classList.remove('active'));

  // 2. Hiện trang mục tiêu
  const trangCanMo = document.getElementById(`view-${tenTrang}`);
  if (trangCanMo) {
    trangCanMo.classList.add('active');
  }

  // 3. Đổi trạng thái active trên Menu điều hướng & Nút Giỏ Hàng
  const cacNutMenu = document.querySelectorAll('.main-nav .nav-item');
  cacNutMenu.forEach(nut => {
    if (nut.getAttribute('data-view') === tenTrang) {
      nut.classList.add('active');
    } else {
      nut.classList.remove('active');
    }
  });

  const nutGioHang = document.getElementById('nav-cart-btn');
  if (nutGioHang) {
    nutGioHang.classList.toggle('active', tenTrang === 'cart');
  }

  // 4. Cuộn màn hình lên đầu trang
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // 5. Gọi hàm hiển thị dữ liệu cho từng trang
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

// ============================================================================
// PHẦN 5: HIỂN THỊ CÁC MÀN HÌNH CHÍNH (RENDER VIEWS)
// ============================================================================

// Biến quản lý đếm ngược Flash Sale
let flashSaleInterval = null;

/**
 * Khởi động đồng hồ đếm ngược Flash Sale giờ vàng (chu kỳ 3 tiếng)
 */
function khoiTaoDemNguocFlashSale() {
  if (flashSaleInterval) clearInterval(flashSaleInterval);

  function capNhatDongHo() {
    const bayGio = new Date();
    // Đếm ngược đến hết khung giờ vàng 3 tiếng
    const tongGiayConLai = 3 * 3600 - ((bayGio.getHours() % 3) * 3600 + bayGio.getMinutes() * 60 + bayGio.getSeconds());
    const gio = Math.floor(tongGiayConLai / 3600);
    const phut = Math.floor((tongGiayConLai % 3600) / 60);
    const giay = tongGiayConLai % 60;

    const elH = document.getElementById('flash-timer-hours');
    const elM = document.getElementById('flash-timer-minutes');
    const elS = document.getElementById('flash-timer-seconds');

    if (elH) elH.textContent = String(gio).padStart(2, '0');
    if (elM) elM.textContent = String(phut).padStart(2, '0');
    if (elS) elS.textContent = String(giay).padStart(2, '0');
  }

  capNhatDongHo();
  flashSaleInterval = setInterval(capNhatDongHo, 1000);
}

/**
 * Hiển thị 4 sản phẩm Flash Sale Giờ Vàng với thanh tiến trình số lượng
 */
function hienThiFlashSale() {
  const container = document.getElementById('home-flash-sale-products');
  if (!container || dsSanPham.length === 0) return;

  // Chọn 4 siêu phẩm đại diện các phân khúc (Gaming & Flagship)
  const idFlashList = [31, 36, 1, 6];
  let listFlash = dsSanPham.filter(sp => idFlashList.includes(Number(sp.id)));
  if (listFlash.length < 4) {
    listFlash = dsSanPham.slice(0, 4);
  }

  container.innerHTML = listFlash.map(sp => {
    const giaGoc = sp.price * 1.15; // Giả lập giảm 15%
    const tonKho = (sp.stock !== undefined && sp.stock !== null) ? Number(sp.stock) : (Number(sp.quantity) || 15);
    const hetHang = tonKho <= 0;
    const hang = dsDanhMuc.find(h => h.id == (sp.categoryId || sp.cate_id));
    const tenHang = hang ? hang.name : (sp.brand || 'Chính Hãng');
    const thongSo = sp.specs || {};
    const daBanDeal = (sp.sold || 12) % 18 + 2; // Giả lập số suất đã bán trong khung giờ
    const tongSuatDeal = 20;
    const phanTramBan = Math.min(100, Math.round((daBanDeal / tongSuatDeal) * 100));
    const dangSoSanh = dsSoSanh.some(id => String(id) === String(sp.id));

    return `
      <div class="product-card" style="background: rgba(255,255,255,0.95);">
        <span class="card-badge-tag hot"><i class="fa-solid fa-gift"></i> TIẾT KIỆM 15%</span>
        <div class="product-thumb-box" onclick="chuyenTrang('detail', { id: '${sp.id}' })">
          <img src="${sp.image}" alt="${sp.name}" onerror="this.onerror=null; this.src='https://picsum.photos/300/300';">
          <button type="button" class="btn-quick-preview" onclick="event.stopPropagation(); moXemNhanh('${sp.id}')" title="Xem nhanh cấu hình">
            <i class="fa-solid fa-eye"></i> Xem nhanh
          </button>
        </div>
        <div class="product-brand-title">${tenHang}</div>
        <h3 class="product-name" onclick="chuyenTrang('detail', { id: '${sp.id}' })" title="${sp.name}">
          ${sp.name}
        </h3>
        <div class="product-quick-specs">
          <span class="spec-chip"><i class="fa-solid fa-microchip"></i> ${thongSo.cpu ? thongSo.cpu.split(' ').slice(0,2).join(' ') : 'Chip 8 nhân'}</span>
          <span class="spec-chip"><i class="fa-solid fa-bolt"></i> ${thongSo.battery ? (thongSo.battery.match(/\d{4}\s*mAh/)?.[0] || '5000mAh') : '5000mAh'}</span>
        </div>
        <div style="font-size: 11px; text-decoration: line-through; color: var(--text-muted); margin-top: 4px;">
          ${dinhDangTien(giaGoc)}
        </div>
        <div class="product-price-row" style="padding-top: 2px;">
          <div class="price-main">${dinhDangTien(sp.price)}</div>
        </div>

        <!-- Thanh Tiến Trình Suất Ưu Đãi Giờ Vàng -->
        <div class="flash-progress-wrap">
          <div class="flash-progress-bar" style="width: ${phanTramBan}%;"></div>
          <div class="flash-progress-text">🔥 Đã nhận ${daBanDeal}/${tongSuatDeal} suất ưu đãi</div>
        </div>

        <div class="card-actions-row">
          <button class="btn-primary btn-sm" onclick="themVaoGio('${sp.id}', 1)" ${hetHang ? 'disabled' : ''} style="flex:1;">
            <i class="fa-solid fa-bag-shopping"></i> Nhận Ưu Đãi
          </button>
          <button class="btn-secondary btn-sm ${dangSoSanh ? 'is-comparing' : ''}" data-compare-id="${sp.id}" onclick="batTatSoSanh('${sp.id}')" title="${dangSoSanh ? 'Bỏ khỏi so sánh' : 'So sánh cấu hình'}">
            <i class="fa-solid ${dangSoSanh ? 'fa-check' : 'fa-code-compare'}"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// --- 1. TRANG CHỦ ---
function hienThiTrangChu() {
  // 1. Kích hoạt Flash Sale giờ vàng & đồng hồ đếm ngược
  khoiTaoDemNguocFlashSale();
  hienThiFlashSale();

  // 2. Dải 8 thương hiệu dạng nút tròn
  const pillsBox = document.getElementById('home-category-pills');
  if (pillsBox) {
    pillsBox.innerHTML = dsDanhMuc.map(hang => `
      <button class="brand-pill-btn" onclick="locTheoHang('${hang.id}')">
        <i class="${hang.icon}"></i> ${hang.name}
      </button>
    `).join('');
  }

  // 3. 4 máy Gaming tiêu biểu (Hãng 7 là ROG Phone, Hãng 8 là RedMagic)
  const gamingBox = document.getElementById('home-gaming-products');
  if (gamingBox) {
    const listGaming = dsSanPham.filter(sp => sp.categoryId == 7 || sp.categoryId == 8).slice(0, 4);
    gamingBox.innerHTML = listGaming.map(sp => taoTheSanPhamHTML(sp)).join('');
  }

  // 4. 8 máy Bán chạy nhất
  const featuredBox = document.getElementById('home-featured-products');
  if (featuredBox) {
    const listHot = dsSanPham.slice(0, 8);
    featuredBox.innerHTML = listHot.map(sp => taoTheSanPhamHTML(sp)).join('');
  }
}

/**
 * Mở modal Xem Nhanh cấu hình sản phẩm (Quick View Modal)
 */
function moXemNhanh(idSP) {
  const sp = dsSanPham.find(item => item.id == idSP);
  if (!sp) return;

  const modal = document.getElementById('quick-view-modal');
  const titleEl = document.getElementById('quick-view-title');
  const bodyEl = document.getElementById('quick-view-body');
  const btnAdd = document.getElementById('btn-quick-view-add-cart');
  if (!modal || !bodyEl) return;

  const hang = dsDanhMuc.find(h => h.id == (sp.categoryId || sp.cate_id));
  const tenHang = hang ? hang.name : (sp.brand || 'Chính Hãng');
  const thongSo = sp.specs || {};
  const tonKho = (sp.stock !== undefined && sp.stock !== null) ? Number(sp.stock) : (Number(sp.quantity) || 15);
  const hetHang = tonKho <= 0;

  if (titleEl) titleEl.textContent = `Xem Nhanh: ${sp.name}`;

  bodyEl.innerHTML = `
    <div class="quick-view-grid">
      <div class="quick-view-img-box">
        <img src="${sp.image}" alt="${sp.name}" onerror="this.onerror=null; this.src='https://picsum.photos/300/300';">
      </div>
      <div class="quick-view-info">
        <div style="font-size: 11px; font-weight: 800; color: var(--primary); text-transform: uppercase; margin-bottom: 4px;">
          Thương hiệu: ${tenHang}
        </div>
        <h3>${sp.name}</h3>
        <div class="quick-view-price">${dinhDangTien(sp.price)}</div>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 14px;">
          ${sp.description || 'Sản phẩm điện thoại thông minh chính hãng được bảo hành 12 tháng tại hệ thống SmartStore toàn quốc.'}
        </p>

        <!-- Lưới 10 thông số kỹ thuật tóm tắt -->
        <div class="quick-view-specs-list">
          <div class="quick-view-spec-item">
            <strong>Màn hình:</strong>
            <span>${thongSo.screen || 'AMOLED 120Hz'}</span>
          </div>
          <div class="quick-view-spec-item">
            <strong>Vi xử lý:</strong>
            <span>${thongSo.cpu || '8 Nhân'}</span>
          </div>
          <div class="quick-view-spec-item">
            <strong>RAM / ROM:</strong>
            <span>${thongSo.ram || '8GB'} / ${thongSo.rom || '256GB'}</span>
          </div>
          <div class="quick-view-spec-item">
            <strong>Camera sau:</strong>
            <span>${thongSo.rear_camera || '50MP OIS'}</span>
          </div>
          <div class="quick-view-spec-item">
            <strong>Pin & Sạc:</strong>
            <span>${thongSo.battery || '5000 mAh'}</span>
          </div>
          <div class="quick-view-spec-item">
            <strong>Hệ điều hành:</strong>
            <span>${thongSo.os || 'Android / iOS'}</span>
          </div>
        </div>

        <div style="display: flex; gap: 10px; align-items: center; margin-top: 10px;">
          <span style="font-size: 12px; font-weight: 700; color: ${hetHang ? 'var(--accent)' : 'var(--success)'};">
            ${hetHang ? '<i class="fa-solid fa-ban"></i> Tạm hết hàng' : `<i class="fa-solid fa-check"></i> Sẵn hàng (${tonKho} máy)`}
          </span>
          <button class="btn-secondary btn-sm" onclick="window.appNav.closeModal('quick-view-modal'); chuyenTrang('detail', { id: ${sp.id} });">
            <i class="fa-solid fa-circle-info"></i> Xem Chi Tiết Đầy Đủ
          </button>
        </div>
      </div>
    </div>
  `;

  if (btnAdd) {
    btnAdd.disabled = hetHang;
    btnAdd.onclick = () => {
      themVaoGio(sp.id, 1);
      window.appNav.closeModal('quick-view-modal');
    };
  }

  modal.classList.add('open');
}

/**
 * Hàm chung tạo thẻ sản phẩm (Product Card) hiển thị ở Trang chủ & Cửa hàng
 */
function taoTheSanPhamHTML(sp) {
  const tonKho = (sp.stock !== undefined && sp.stock !== null) ? Number(sp.stock) : (Number(sp.quantity) || 15);
  const hetHang = tonKho <= 0;
  const hang = dsDanhMuc.find(h => h.id == (sp.categoryId || sp.cate_id));
  const tenHang = hang ? hang.name : (sp.brand || 'Chính Hãng');
  const thongSo = sp.specs || {};

  // Phân loại Ribbon Badge góc thẻ
  let ribbonBadge = '';
  if (sp.categoryId == 7 || sp.categoryId == 8) {
    ribbonBadge = '<span class="card-badge-tag gaming"><i class="fa-solid fa-gamepad"></i> GAMING</span>';
  } else if (sp.price >= 30000000) {
    ribbonBadge = '<span class="card-badge-tag flagship"><i class="fa-solid fa-crown"></i> FLAGSHIP</span>';
  } else if (sp.sold >= 10) {
    ribbonBadge = '<span class="card-badge-tag hot"><i class="fa-solid fa-fire"></i> BÁN CHẠY</span>';
  } else {
    ribbonBadge = '<span class="card-badge-tag new"><i class="fa-solid fa-shield-halved"></i> CHÍNH HÃNG</span>';
  }

  // Lọc thông số vắn tắt nổi bật
  const screenHz = thongSo.screen ? (thongSo.screen.match(/\d+Hz/)?.[0] || '120Hz') : '120Hz';
  const cpuShort = thongSo.cpu ? thongSo.cpu.split(' ').slice(0, 2).join(' ') : 'Chip 8 nhân';
  const pinShort = thongSo.battery ? (thongSo.battery.match(/\d{4}\s*mAh/)?.[0] || '5000mAh') : '5000mAh';
  const dangSoSanh = dsSoSanh.some(id => String(id) === String(sp.id));

  return `
    <div class="product-card">
      ${ribbonBadge}
      <div class="product-thumb-box" onclick="chuyenTrang('detail', { id: '${sp.id}' })">
        <img src="${sp.image}" alt="${sp.name}" onerror="this.onerror=null; this.src='https://picsum.photos/300/300';">
        <button type="button" class="btn-quick-preview" onclick="event.stopPropagation(); moXemNhanh('${sp.id}')" title="Xem nhanh cấu hình">
          <i class="fa-solid fa-eye"></i> Xem nhanh
        </button>
      </div>
      <div class="product-brand-title">${tenHang}</div>
      <h3 class="product-name" onclick="chuyenTrang('detail', { id: '${sp.id}' })" title="${sp.name}">
        ${sp.name}
      </h3>
      <div class="product-quick-specs">
        <span class="spec-chip" title="Tần số quét màn hình"><i class="fa-solid fa-display"></i> ${screenHz}</span>
        <span class="spec-chip" title="Vi xử lý"><i class="fa-solid fa-microchip"></i> ${cpuShort}</span>
        <span class="spec-chip" title="Dung lượng RAM"><i class="fa-solid fa-memory"></i> ${thongSo.ram || '8GB'}</span>
        <span class="spec-chip" title="Dung lượng Pin"><i class="fa-solid fa-bolt"></i> ${pinShort}</span>
      </div>
      <div class="product-price-row">
        <div class="price-main">${dinhDangTien(sp.price)}</div>
        <div class="stock-status ${hetHang ? 'out' : ''}">
          ${hetHang ? '<i class="fa-solid fa-ban"></i> Hết hàng' : `<i class="fa-solid fa-check"></i> Còn ${tonKho} máy`}
        </div>
      </div>
      <div class="card-actions-row">
        <button class="btn-primary btn-sm" onclick="themVaoGio('${sp.id}', 1)" ${hetHang ? 'disabled' : ''}>
          <i class="fa-solid fa-cart-plus"></i> Chọn Mua
        </button>
        <button class="btn-secondary btn-sm ${dangSoSanh ? 'is-comparing' : ''}" data-compare-id="${sp.id}" onclick="batTatSoSanh('${sp.id}')" title="${dangSoSanh ? 'Bỏ khỏi so sánh' : 'Thêm vào bảng so sánh'}">
          <i class="fa-solid ${dangSoSanh ? 'fa-check' : 'fa-code-compare'}"></i> <span class="compare-btn-text">${dangSoSanh ? 'Đang so sánh' : 'So Sánh'}</span>
        </button>
      </div>
    </div>
  `;
}

// --- 2. CỬA HÀNG (SHOP VIEW & BỘ LỌC) ---
function hienThiCuaHang() {
  // Render dải chọn 8 thương hiệu
  const pillsBox = document.getElementById('shop-brand-pills');
  if (pillsBox) {
    pillsBox.innerHTML = `
      <button class="brand-pill-btn ${boLoc.hang === 'all' ? 'active' : ''}" onclick="locTheoHang('all')">
        Tất Cả Hãng (40 Máy)
      </button>
      ${dsDanhMuc.map(hang => `
        <button class="brand-pill-btn ${boLoc.hang == hang.id ? 'active' : ''}" onclick="locTheoHang('${hang.id}')">
          <i class="${hang.icon}"></i> ${hang.name}
        </button>
      `).join('')}
    `;
  }

  // Lọc sản phẩm
  let ketQua = [...dsSanPham];

  // 1. Lọc theo hãng
  if (boLoc.hang !== 'all') {
    ketQua = ketQua.filter(sp => sp.categoryId == boLoc.hang);
  }

  // 1.1. Lọc theo nhu cầu người dùng (Gaming, Chụp ảnh, Pin trâu, Màn hình gập)
  if (boLoc.nhuCau === 'gaming') {
    ketQua = ketQua.filter(sp => 
      sp.categoryId == 7 || sp.categoryId == 8 || 
      (sp.specs?.screen && (sp.specs.screen.includes('144Hz') || sp.specs.screen.includes('165Hz'))) ||
      sp.name.toLowerCase().includes('rog') || 
      sp.name.toLowerCase().includes('redmagic')
    );
  } else if (boLoc.nhuCau === 'camera') {
    ketQua = ketQua.filter(sp => 
      sp.categoryId == 1 || sp.categoryId == 5 ||
      (sp.specs?.rear_camera && (sp.specs.rear_camera.includes('200MP') || sp.specs.rear_camera.includes('50MP') || sp.specs.rear_camera.includes('ZEISS') || sp.specs.rear_camera.includes('zoom 5x'))) ||
      sp.name.includes('Pro Max') || sp.name.includes('Ultra')
    );
  } else if (boLoc.nhuCau === 'battery') {
    ketQua = ketQua.filter(sp => {
      const pin = parseInt(sp.specs?.battery?.match(/\d{4}/)?.[0] || '0');
      const sac = (sp.specs?.battery || '').toLowerCase();
      return pin >= 5500 || sac.includes('80w') || sac.includes('120w') || sac.includes('65w') || sac.includes('67w');
    });
  } else if (boLoc.nhuCau === 'foldable') {
    ketQua = ketQua.filter(sp => 
      sp.name.toLowerCase().includes('fold') || sp.name.toLowerCase().includes('flip')
    );
  }

  // 2. Tìm kiếm theo tên hoặc vi xử lý
  if (boLoc.tuKhoa.trim() !== '') {
    const tuKhoaThuong = boLoc.tuKhoa.toLowerCase().trim();
    ketQua = ketQua.filter(sp => {
      const tenKhop = sp.name.toLowerCase().includes(tuKhoaThuong);
      const chipKhop = sp.specs && sp.specs.cpu && sp.specs.cpu.toLowerCase().includes(tuKhoaThuong);
      return tenKhop || chipKhop;
    });
  }

  // 3. Lọc theo giá
  if (boLoc.khoangGia === 'under-10') ketQua = ketQua.filter(sp => sp.price < 10000000);
  else if (boLoc.khoangGia === '10-20') ketQua = ketQua.filter(sp => sp.price >= 10000000 && sp.price <= 20000000);
  else if (boLoc.khoangGia === '20-30') ketQua = ketQua.filter(sp => sp.price > 20000000 && sp.price <= 30000000);
  else if (boLoc.khoangGia === 'over-30') ketQua = ketQua.filter(sp => sp.price > 30000000);

  // 4. Sắp xếp
  if (boLoc.sapXep === 'price-asc') ketQua.sort((a, b) => a.price - b.price);
  else if (boLoc.sapXep === 'price-desc') ketQua.sort((a, b) => b.price - a.price);
  else if (boLoc.sapXep === 'name-asc') ketQua.sort((a, b) => a.name.localeCompare(b.name));

  // Cập nhật số lượng
  const countEl = document.getElementById('shop-result-count');
  if (countEl) countEl.innerHTML = `Tìm thấy <strong>${ketQua.length}</strong> sản phẩm`;

  // 5. Phân trang 8 sản phẩm / trang
  const tongSoTrang = Math.ceil(ketQua.length / SO_SP_MOI_TRANG) || 1;
  if (boLoc.trang > tongSoTrang) boLoc.trang = 1;

  const batDau = (boLoc.trang - 1) * SO_SP_MOI_TRANG;
  const spTrangHienTai = ketQua.slice(batDau, batDau + SO_SP_MOI_TRANG);

  // Render lưới sản phẩm
  const grid = document.getElementById('shop-product-grid');
  if (grid) {
    if (spTrangHienTai.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0;">
          <i class="fa-solid fa-magnifying-glass" style="font-size: 36px; color: #94a3b8; margin-bottom: 10px;"></i>
          <h3>Không tìm thấy sản phẩm phù hợp!</h3>
        </div>
      `;
    } else {
      grid.innerHTML = spTrangHienTai.map(sp => taoTheSanPhamHTML(sp)).join('');
    }
  }

  // Render các nút số trang
  const paginBox = document.getElementById('shop-pagination');
  if (paginBox) {
    if (tongSoTrang <= 1) {
      paginBox.innerHTML = '';
    } else {
      let html = '';
      for (let i = 1; i <= tongSoTrang; i++) {
        html += `
          <button class="page-btn ${boLoc.trang === i ? 'active' : ''}" onclick="chuyenTrangCuaHang(${i})">
            ${i}
          </button>
        `;
      }
      paginBox.innerHTML = html;
    }
  }

  // Cập nhật bảng so sánh tích hợp trong Cửa Hàng
  hienThiSoSanh();
}

function locTheoHang(maHang) {
  boLoc.hang = maHang;
  boLoc.trang = 1;
  chuyenTrang('shop');
}

function locTheoNhuCau(nhuCau) {
  boLoc.nhuCau = nhuCau;
  boLoc.trang = 1;

  // Cập nhật trạng thái nút nhu cầu
  const chipBtns = document.querySelectorAll('#shop-demand-filter-chips .filter-chip-btn');
  chipBtns.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-demand') === nhuCau);
  });

  hienThiCuaHang();
}

function chuyenTrangCuaHang(trangMoi) {
  boLoc.trang = trangMoi;
  hienThiCuaHang();
  window.scrollTo({ top: 100, behavior: 'smooth' });
}

function datLaiBoLoc() {
  boLoc = { hang: 'all', nhuCau: 'all', tuKhoa: '', khoangGia: 'all', sapXep: 'default', trang: 1 };
  const sInput = document.getElementById('shop-search-input');
  const pFilter = document.getElementById('filter-price-range');
  const sFilter = document.getElementById('filter-sort-by');
  if (sInput) sInput.value = '';
  if (pFilter) pFilter.value = 'all';
  if (sFilter) sFilter.value = 'default';

  // Đặt lại các nút nhu cầu
  const chipBtns = document.querySelectorAll('#shop-demand-filter-chips .filter-chip-btn');
  chipBtns.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-demand') === 'all');
  });

  hienThiCuaHang();
  hienThongBao('Đã xóa tất cả bộ lọc', 'info');
}

// --- 3. XEM CHI TIẾT SẢN PHẨM & 10 THÔNG SỐ ---
function hienThiChiTiet(idSP) {
  const sp = dsSanPham.find(item => item.id == idSP);
  if (!sp) {
    hienThongBao('Không tìm thấy sản phẩm!', 'error');
    chuyenTrang('shop');
    return;
  }

  // Breadcrumb
  const breadcrumb = document.getElementById('detail-breadcrumb-name');
  if (breadcrumb) breadcrumb.textContent = sp.name;

  const hang = dsDanhMuc.find(h => h.id == (sp.categoryId || sp.cate_id));
  const tenHang = hang ? hang.name : (sp.brand || 'Chính Hãng');
  const ts = sp.specs || {};
  const tonKho = (sp.stock !== undefined && sp.stock !== null) ? Number(sp.stock) : (Number(sp.quantity) || 15);
  const hetHang = tonKho <= 0;

  const container = document.getElementById('product-detail-container');
  if (container) {
    container.innerHTML = `
      <div class="detail-gallery-box">
        <img src="${sp.image}" alt="${sp.name}" onerror="this.onerror=null; this.src='https://picsum.photos/300/300';">
      </div>
      <div class="detail-info-col">
        <div style="font-size: 13px; font-weight: 700; color: var(--primary); text-transform: uppercase;">
          Thương hiệu: ${tenHang}
        </div>
        <h1>${sp.name}</h1>
        <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">
          <span>Đã bán: <strong>${sp.sold || 0} máy</strong></span> • 
          <span style="color: ${hetHang ? 'var(--accent)' : 'var(--success)'}; font-weight: 700;">
            ${hetHang ? 'Hết hàng' : `Còn sẵn ${tonKho} máy tại kho`}
          </span>
        </div>
        <div class="detail-price-box">
          <div class="detail-price-current">${dinhDangTien(sp.price)}</div>
        </div>
        <p style="font-size: 14px; margin-bottom: 20px;">${sp.description || 'Sản phẩm chính hãng bảo hành 12 tháng tại SmartStore.'}</p>

        <!-- Thao tác mua hàng -->
        <div style="display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap;">
          <div class="qty-control">
            <button class="qty-btn" onclick="tangGiamSoLuongChiTiet(-1)"><i class="fa-solid fa-minus"></i></button>
            <input type="text" id="detail-qty-input" class="qty-val" value="1" readonly>
            <button class="qty-btn" onclick="tangGiamSoLuongChiTiet(1, ${tonKho})"><i class="fa-solid fa-plus"></i></button>
          </div>
          <button class="btn-primary" onclick="themVaoGio('${sp.id}', laySoLuongChiTiet())" ${hetHang ? 'disabled' : ''}>
            <i class="fa-solid fa-cart-plus"></i> Thêm Vào Giỏ
          </button>
          <button class="btn-secondary" style="background: #0f172a; color: #38bdf8;" onclick="muaNgay('${sp.id}')" ${hetHang ? 'disabled' : ''}>
            <i class="fa-solid fa-bolt"></i> Mua Ngay
          </button>
          <button class="btn-secondary" onclick="batTatSoSanh('${sp.id}')">
            <i class="fa-solid fa-code-compare"></i> So Sánh
          </button>
        </div>

        <!-- BẢNG 10 THÔNG SỐ KỸ THUẬT -->
        <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 10px;">
          <i class="fa-solid fa-list-check" style="color: var(--primary);"></i> Thông Số Kỹ Thuật Chi Tiết
        </h3>
        <table class="specs-table">
          <tbody>
            <tr><td class="spec-name">1. Màn hình</td><td class="spec-val">${ts.screen || '-'}</td></tr>
            <tr><td class="spec-name">2. Vi xử lý (CPU)</td><td class="spec-val">${ts.cpu || '-'}</td></tr>
            <tr><td class="spec-name">3. Đồ họa (GPU)</td><td class="spec-val">${ts.gpu || '-'}</td></tr>
            <tr><td class="spec-name">4. Dung lượng RAM</td><td class="spec-val">${ts.ram || '-'}</td></tr>
            <tr><td class="spec-name">5. Bộ nhớ trong (ROM)</td><td class="spec-val">${ts.rom || '-'}</td></tr>
            <tr><td class="spec-name">6. Camera sau</td><td class="spec-val">${ts.rear_camera || '-'}</td></tr>
            <tr><td class="spec-name">7. Camera trước</td><td class="spec-val">${ts.front_camera || '-'}</td></tr>
            <tr><td class="spec-name">8. Pin & Sạc</td><td class="spec-val">${ts.battery || '-'}</td></tr>
            <tr><td class="spec-name">9. Hệ điều hành</td><td class="spec-val">${ts.os || '-'}</td></tr>
            <tr><td class="spec-name">10. Tính năng đặc biệt</td><td class="spec-val">${ts.special || '-'}</td></tr>
          </tbody>
        </table>
      </div>
    `;
  }

  // 4 sản phẩm cùng hãng
  const relatedBox = document.getElementById('detail-related-products');
  if (relatedBox) {
    const listCungHang = dsSanPham.filter(p => p.categoryId == sp.categoryId && p.id != sp.id).slice(0, 4);
    relatedBox.innerHTML = listCungHang.map(p => taoTheSanPhamHTML(p)).join('');
  }
}

function laySoLuongChiTiet() {
  const input = document.getElementById('detail-qty-input');
  return input ? parseInt(input.value) || 1 : 1;
}

function tangGiamSoLuongChiTiet(soThayDoi, tonKhoToiDa = 999) {
  const input = document.getElementById('detail-qty-input');
  if (!input) return;
  let hienTai = parseInt(input.value) || 1;
  let moi = hienTai + soThayDoi;
  if (moi >= 1 && moi <= tonKhoToiDa) {
    input.value = moi;
  } else if (moi > tonKhoToiDa) {
    hienThongBao(`Kho chỉ còn tối đa ${tonKhoToiDa} máy!`, 'warning');
  }
}

function muaNgay(idSP) {
  themVaoGio(idSP, laySoLuongChiTiet());
  chuyenTrang('checkout');
}

// ============================================================================
// PHẦN 6: QUẢN LÝ GIỎ HÀNG & ĐẶT HÀNG (CART & ORDER)
// ============================================================================

function themVaoGio(idSP, soLuong = 1) {
  const sp = dsSanPham.find(item => item.id == idSP);
  if (!sp) return;

  const soLuongThem = Math.max(1, Number(soLuong) || 1);
  const tonKho = (sp.stock !== undefined && sp.stock !== null) ? Number(sp.stock) : (Number(sp.quantity) || 15);

  if (tonKho <= 0) {
    hienThongBao('Sản phẩm đã hết hàng!', 'error');
    return;
  }

  // Kiểm tra sản phẩm đã có trong giỏ chưa
  const daCo = gioHang.find(item => item.id == idSP);
  if (daCo) {
    const soLuongMoi = (Number(daCo.quantity) || 0) + soLuongThem;
    if (soLuongMoi > tonKho) {
      hienThongBao(`Kho chỉ còn ${tonKho} máy!`, 'warning');
      daCo.quantity = tonKho;
    } else {
      daCo.quantity = soLuongMoi;
      hienThongBao(`Đã tăng số lượng ${sp.name}`, 'success');
    }
  } else {
    gioHang.push({
      id: sp.id,
      name: sp.name,
      price: Number(sp.price) || 0,
      image: sp.image,
      quantity: Math.min(soLuongThem, tonKho),
      stock: tonKho
    });
    hienThongBao(`Đã thêm ${sp.name} vào giỏ hàng`, 'success');
  }

  luuGioHang();
}

function doiSoLuongGioHang(idSP, soThayDoi) {
  const mon = gioHang.find(item => item.id == idSP);
  if (!mon) return;

  const moi = (Number(mon.quantity) || 1) + soThayDoi;
  const tonKho = Number(mon.stock) || 99;
  if (moi <= 0) {
    xoaKhoiGio(idSP);
  } else if (moi > tonKho) {
    hienThongBao(`Kho chỉ còn ${tonKho} máy!`, 'warning');
  } else {
    mon.quantity = moi;
    luuGioHang();
    hienThiGioHang();
  }
}

function xoaKhoiGio(idSP) {
  gioHang = gioHang.filter(item => item.id != idSP);
  luuGioHang();
  hienThiGioHang();
  hienThongBao('Đã xóa sản phẩm khỏi giỏ hàng', 'info');
}

function xoaSachGioHang() {
  if (gioHang.length === 0) return;
  if (confirm('Bạn có chắc chắn muốn xóa hết sản phẩm trong giỏ hàng không?')) {
    gioHang = [];
    luuGioHang();
    hienThiGioHang();
    hienThongBao('Giỏ hàng đã được làm trống', 'info');
  }
}

function hienThiGioHang() {
  const emptyBox = document.getElementById('cart-empty-state');
  const contentBox = document.getElementById('cart-content-wrapper');
  const tbody = document.getElementById('cart-table-tbody');
  const subtotalEl = document.getElementById('cart-subtotal');
  const totalEl = document.getElementById('cart-grand-total');

  if (gioHang.length === 0) {
    if (emptyBox) emptyBox.style.display = 'block';
    if (contentBox) contentBox.style.display = 'none';
    return;
  }

  if (emptyBox) emptyBox.style.display = 'none';
  if (contentBox) contentBox.style.display = 'grid';

  let tongTien = 0;
  if (tbody) {
    tbody.innerHTML = gioHang.map(item => {
      const thanhTien = item.price * item.quantity;
      tongTien += thanhTien;

      return `
        <tr>
          <td>
            <div class="cart-item-info">
              <img src="${item.image}" alt="${item.name}" class="cart-item-thumb" onerror="this.onerror=null; this.src='https://picsum.photos/300/300';">
              <div>
                <div style="font-weight: 700;">${item.name}</div>
                <div style="font-size: 12px; color: #64748b;">Mã: #${item.id}</div>
              </div>
            </div>
          </td>
          <td style="font-weight: 600;">${dinhDangTien(item.price)}</td>
          <td style="text-align: center;">
            <div class="qty-control">
              <button class="qty-btn" onclick="doiSoLuongGioHang(${item.id}, -1)"><i class="fa-solid fa-minus"></i></button>
              <span class="qty-val">${item.quantity}</span>
              <button class="qty-btn" onclick="doiSoLuongGioHang(${item.id}, 1)"><i class="fa-solid fa-plus"></i></button>
            </div>
          </td>
          <td style="text-align: right; font-weight: 800; color: var(--accent);">${dinhDangTien(thanhTien)}</td>
          <td style="text-align: center;">
            <button class="btn-danger btn-sm" onclick="xoaKhoiGio(${item.id})">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  if (subtotalEl) subtotalEl.textContent = dinhDangTien(tongTien);
  if (totalEl) totalEl.textContent = dinhDangTien(tongTien);
}

// --- 5. THANH TOÁN (CHECKOUT) ---
function hienThiThanhToan() {
  if (gioHang.length === 0) {
    hienThongBao('Giỏ hàng trống! Hãy chọn ít nhất 1 sản phẩm.', 'warning');
    chuyenTrang('shop');
    return;
  }

  // Tự động điền nếu đã đăng nhập
  if (nguoiDungHienTai) {
    document.getElementById('checkout-name').value = nguoiDungHienTai.fullName || nguoiDungHienTai.name || '';
    document.getElementById('checkout-phone').value = nguoiDungHienTai.phone || '';
    document.getElementById('checkout-email').value = nguoiDungHienTai.email || '';
    document.getElementById('checkout-address').value = nguoiDungHienTai.address || '';
  }

  // Tóm tắt các món hàng
  const itemsBox = document.getElementById('checkout-items-list');
  let tongTien = 0;
  if (itemsBox) {
    itemsBox.innerHTML = gioHang.map(item => {
      const thanhTien = item.price * item.quantity;
      tongTien += thanhTien;
      return `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
          <div>${item.name} <strong>x${item.quantity}</strong></div>
          <strong>${dinhDangTien(thanhTien)}</strong>
        </div>
      `;
    }).join('');
  }

  document.getElementById('checkout-subtotal').textContent = dinhDangTien(tongTien);
  document.getElementById('checkout-grand-total').textContent = dinhDangTien(tongTien);
}

async function xuLyDatHang() {
  const ten = document.getElementById('checkout-name').value.trim();
  const sdt = document.getElementById('checkout-phone').value.trim();
  const email = document.getElementById('checkout-email').value.trim();
  const diaChi = document.getElementById('checkout-address').value.trim();
  const ghiChu = document.getElementById('checkout-note').value.trim();
  const phuongThuc = document.querySelector('input[name="payment_method"]:checked')?.value || 'COD';

  if (!ten || !sdt || !diaChi) {
    hienThongBao('Vui lòng nhập đầy đủ Họ tên, Số điện thoại và Địa chỉ!', 'error');
    return;
  }

  const tongTien = gioHang.reduce((tong, item) => tong + (item.price * item.quantity), 0);
  
  // Sinh mã đơn hàng chuẩn 11 ký tự dạng: #DH + 9 số ngẫu nhiên
  const maDon = '#DH' + Date.now().toString().slice(-9);

  const donHangMoi = {
    orderCode: maDon,
    userId: nguoiDungHienTai ? nguoiDungHienTai.id : null,
    customerName: ten,
    customerPhone: sdt,
    customerEmail: email,
    customerAddress: diaChi,
    note: ghiChu,
    paymentMethod: phuongThuc,
    items: [...gioHang],
    totalAmount: tongTien,
    status: 'processing', // Chờ xử lý
    createdAt: new Date().toISOString()
  };

  try {
    // 1. Lưu đơn hàng vào db.json
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donHangMoi)
    });
    donHangVuaDat = await res.json();

    // 2. Trừ số lượng tồn kho (stock) và tăng số lượng đã bán (sold) qua phương thức PATCH
    for (const item of gioHang) {
      const sp = dsSanPham.find(p => p.id == item.id);
      if (sp) {
        const khoMoi = Math.max(0, sp.stock - item.quantity);
        const daBanMoi = (sp.sold || 0) + item.quantity;
        sp.stock = khoMoi;
        sp.sold = daBanMoi;

        fetch(`${API_URL}/products/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stock: khoMoi, sold: daBanMoi })
        }).catch(err => console.error('Lỗi trừ kho:', err));
      }
    }

    // 3. Xóa sạch giỏ hàng & chuyển sang trang Cảm Ơn
    gioHang = [];
    luuGioHang();
    hienThongBao(`Đặt hàng thành công! Mã đơn: ${maDon}`, 'success');
    chuyenTrang('thankyou');
  } catch (loi) {
    console.error(loi);
    hienThongBao('Lỗi khi gửi đơn hàng!', 'error');
  }
}

// --- 6. MÀN HÌNH CẢM ƠN (THANK YOU VIEW) ---
function hienThiCamOn() {
  const codeEl = document.getElementById('thankyou-order-code');
  const summaryEl = document.getElementById('thankyou-order-summary');
  const btnXemDon = document.getElementById('btn-view-my-orders-thankyou');

  if (donHangVuaDat) {
    if (codeEl) codeEl.textContent = donHangVuaDat.orderCode;
    if (summaryEl) {
      summaryEl.innerHTML = `
        <div><strong>Người nhận:</strong> ${donHangVuaDat.customerName} (${donHangVuaDat.customerPhone})</div>
        <div><strong>Địa chỉ:</strong> ${donHangVuaDat.customerAddress}</div>
        <div><strong>Hình thức:</strong> ${donHangVuaDat.paymentMethod}</div>
        <div><strong>Tổng thanh toán:</strong> <strong style="color:var(--accent);">${dinhDangTien(donHangVuaDat.totalAmount)}</strong></div>
      `;
    }
  }

  if (btnXemDon) {
    btnXemDon.onclick = () => {
      if (nguoiDungHienTai) chuyenTrang('profile');
      else {
        document.getElementById('tracking-input').value = donHangVuaDat ? donHangVuaDat.orderCode : '';
        chuyenTrang('tracking');
      }
    };
  }
}

// ============================================================================
// PHẦN 7: ĐĂNG NHẬP, ĐĂNG KÝ & THÔNG TIN CÁ NHÂN (AUTH & PROFILE)
// ============================================================================

let pendingSmartUser = null; // Tài khoản nhận diện tạm thời khi trùng Email/SĐT

async function xuLyDangNhap(taiKhoan, matKhau) {
  try {
    const tk = (taiKhoan || '').trim().toLowerCase();
    const mk = String(matKhau || '').trim();

    if (!tk || !mk) {
      hienThongBao('Vui lòng điền tài khoản (Email hoặc SĐT) và Mật khẩu!', 'warning');
      return;
    }

    const res = await fetch(`${API_URL}/users`);
    const allUsers = await res.json();

    // Tìm tài khoản khớp Email hoặc Số điện thoại
    const user = allUsers.find(u => 
      (u.email && u.email.trim().toLowerCase() === tk) ||
      (u.phone && u.phone.trim() === tk)
    );

    if (!user) {
      hienThongBao('Tài khoản (Email hoặc SĐT) không tồn tại trên hệ thống!', 'error');
      return;
    }

    // So sánh mật khẩu bằng JavaScript (tránh bug ép kiểu số của json-server)
    if (String(user.password).trim() !== mk) {
      hienThongBao('Mật khẩu không chính xác! Vui lòng thử lại.', 'error');
      return;
    }

    nguoiDungHienTai = user;
    localStorage.setItem('smartstore_user', JSON.stringify(user));
    capNhatNguoiDungHeader();

    if (user.role === 'admin') {
      hienThongBao('Đăng nhập Quản trị viên thành công!', 'success');
      setTimeout(() => window.location.href = 'admin.html', 800);
    } else {
      hienThongBao(`Xin chào ${user.fullName || user.name}! Chúc bạn mua sắm vui vẻ.`, 'success');
      chuyenTrang('home');
    }
  } catch (loi) {
    console.error(loi);
    hienThongBao('Lỗi kết nối máy chủ!', 'error');
  }
}

/**
 * Đăng ký tài khoản với Chuẩn UX Smart Identity Resolution:
 * 1. Nếu Email hoặc SĐT đã tồn tại + Đúng mật khẩu -> Tự động đăng nhập luôn (Auto-login)
 * 2. Nếu Email hoặc SĐT đã tồn tại + Sai mật khẩu -> Mở hộp nhận diện "Có phải bạn là [Name] không?"
 * 3. Nếu tài khoản chưa tồn tại -> Tự động sinh ID nối tiếp (+1 ID) và đăng ký thành công
 */
async function xuLyDangKy(hoTen, email, sdt, diaChi, matKhau) {
  try {
    const emailChuan = (email || '').trim().toLowerCase();
    const sdtChuan = (sdt || '').trim();
    const mkChuan = String(matKhau || '').trim();

    if (!hoTen || !emailChuan || !sdtChuan || !mkChuan) {
      hienThongBao('Vui lòng điền đầy đủ các thông tin bắt buộc!', 'warning');
      return;
    }

    const res = await fetch(`${API_URL}/users`);
    const allUsers = await res.json();

    // Kiểm tra trùng Email hoặc Số điện thoại
    const userTonTai = allUsers.find(u => 
      (u.email && u.email.trim().toLowerCase() === emailChuan) ||
      (u.phone && u.phone.trim() === sdtChuan)
    );

    if (userTonTai) {
      // TRƯỜNG HỢP 1: ĐÚNG MẬT KHẨU -> TỰ ĐỘNG ĐĂNG NHẬP NGAY
      if (String(userTonTai.password).trim() === mkChuan) {
        nguoiDungHienTai = userTonTai;
        localStorage.setItem('smartstore_user', JSON.stringify(userTonTai));
        capNhatNguoiDungHeader();
        hienThongBao(`Chào mừng ${userTonTai.fullName || userTonTai.name}! Hệ thống nhận diện tài khoản sẵn có và đã tự động đăng nhập.`, 'success');
        chuyenTrang('home');
        return;
      }

      // TRƯỜNG HỢP 2: SAI MẬT KHẨU -> HIỂN THỊ HỘP "CÓ PHẢI BẠN LÀ [NAME] KHÔNG?"
      pendingSmartUser = userTonTai;
      const smartBox = document.getElementById('smart-identity-box');
      const formRegister = document.getElementById('form-register');
      const smartUserName = document.getElementById('smart-user-name');
      const smartPassInput = document.getElementById('smart-login-password');

      if (smartBox && formRegister) {
        formRegister.style.display = 'none';
        smartBox.style.display = 'block';
        if (smartUserName) {
          smartUserName.textContent = userTonTai.fullName || userTonTai.name || 'bạn';
        }
        if (smartPassInput) {
          smartPassInput.value = '';
          smartPassInput.focus();
        }
        hienThongBao(`Tài khoản đã tồn tại. Có phải bạn là ${userTonTai.fullName || userTonTai.name}? Vui lòng nhập mật khẩu để đăng nhập.`, 'info');
      }
      return;
    }

    // TRƯỜNG HỢP 3: TẠO TÀI KHOẢN MỚI AUTO +1 ID
    const maxId = allUsers.reduce((max, u) => Math.max(max, Number(u.id) || 0), 0);
    const idMoi = String(maxId + 1);

    const nguoiMoi = {
      id: idMoi,
      fullName: hoTen.trim(),
      email: emailChuan,
      phone: sdtChuan,
      address: diaChi.trim(),
      password: mkChuan,
      role: 'user',
      createdAt: new Date().toISOString()
    };

    const resTao = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nguoiMoi)
    });
    const userDaTao = await resTao.json();

    nguoiDungHienTai = userDaTao;
    localStorage.setItem('smartstore_user', JSON.stringify(userDaTao));
    capNhatNguoiDungHeader();
    hienThongBao(`Đăng ký tài khoản #${userDaTao.id} thành công! Chào mừng bạn gia nhập SmartStore.`, 'success');
    chuyenTrang('home');
  } catch (loi) {
    console.error(loi);
    hienThongBao('Lỗi trong quá trình đăng ký tài khoản!', 'error');
  }
}

function xuLySmartLoginSubmit() {
  if (!pendingSmartUser) return;
  const passInput = document.getElementById('smart-login-password');
  const enteredPass = (passInput?.value || '').trim();

  if (!enteredPass) {
    hienThongBao('Vui lòng nhập mật khẩu để đăng nhập!', 'warning');
    return;
  }

  if (String(pendingSmartUser.password).trim() !== enteredPass) {
    hienThongBao('Mật khẩu không chính xác! Vui lòng thử lại.', 'error');
    return;
  }

  // Đăng nhập thành công
  nguoiDungHienTai = pendingSmartUser;
  localStorage.setItem('smartstore_user', JSON.stringify(pendingSmartUser));
  capNhatNguoiDungHeader();

  // Đóng smart box và mở lại form đăng ký
  const smartBox = document.getElementById('smart-identity-box');
  const formRegister = document.getElementById('form-register');
  if (smartBox) smartBox.style.display = 'none';
  if (formRegister) formRegister.style.display = 'block';
  pendingSmartUser = null;

  if (nguoiDungHienTai.role === 'admin') {
    hienThongBao('Đăng nhập Quản trị viên thành công!', 'success');
    setTimeout(() => window.location.href = 'admin.html', 800);
  } else {
    hienThongBao(`Xin chào ${nguoiDungHienTai.fullName || nguoiDungHienTai.name}!`, 'success');
    chuyenTrang('home');
  }
}

function huySmartLogin() {
  pendingSmartUser = null;
  const smartBox = document.getElementById('smart-identity-box');
  const formRegister = document.getElementById('form-register');
  if (smartBox) smartBox.style.display = 'none';
  if (formRegister) formRegister.style.display = 'block';
}

function dangXuat() {
  nguoiDungHienTai = null;
  localStorage.removeItem('smartstore_user');
  capNhatNguoiDungHeader();
  hienThongBao('Đã đăng xuất tài khoản', 'info');
  chuyenTrang('home');
}

// --- THÔNG TIN CÁ NHÂN & TỰ SỬA THÔNG TIN ---
async function hienThiThongTinCaNhan() {
  if (!nguoiDungHienTai) return;
  const u = nguoiDungHienTai;

  document.getElementById('profile-display-name').textContent = u.fullName || u.name;
  document.getElementById('profile-name').value = u.fullName || u.name || '';
  document.getElementById('profile-email').value = u.email || '';
  document.getElementById('profile-phone').value = u.phone || '';
  document.getElementById('profile-address').value = u.address || '';
  document.getElementById('profile-password').value = '';

  // Tải danh sách đơn hàng đã mua của người này
  try {
    const res = await fetch(`${API_URL}/orders?userId=${u.id}`);
    const dsDon = await res.json();
    const tbody = document.getElementById('user-orders-tbody');

    if (tbody) {
      if (dsDon.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#64748b;">Bạn chưa có đơn hàng nào.</td></tr>`;
      } else {
        tbody.innerHTML = dsDon.reverse().map(d => `
          <tr>
            <td><strong>${d.orderCode}</strong></td>
            <td>${new Date(d.createdAt).toLocaleDateString('vi-VN')}</td>
            <td style="font-weight:700; color:var(--accent);">${dinhDangTien(d.totalAmount)}</td>
            <td>${d.paymentMethod}</td>
            <td><span class="badge status-${d.status}">${d.status === 'processing' ? 'Chờ xử lý' : (d.status === 'shipping' ? 'Đang giao' : 'Hoàn tất')}</span></td>
            <td style="text-align:center;">
              <button class="btn-secondary btn-sm" onclick="traCuuTheoMa('${d.orderCode}')"><i class="fa-solid fa-eye"></i></button>
            </td>
          </tr>
        `).join('');
      }
    }
  } catch (loi) {
    console.error(loi);
  }
}

async function luuSuaThongTinCaNhan() {
  if (!nguoiDungHienTai) return;

  const hoTen = document.getElementById('profile-name').value.trim();
  const sdt = document.getElementById('profile-phone').value.trim();
  const diaChi = document.getElementById('profile-address').value.trim();
  const passMoi = document.getElementById('profile-password').value.trim();

  if (!hoTen || !sdt) {
    hienThongBao('Họ tên và Số điện thoại không được để trống!', 'error');
    return;
  }

  const payload = { fullName: hoTen, phone: sdt, address: diaChi };
  if (passMoi) payload.password = passMoi;

  try {
    const res = await fetch(`${API_URL}/users/${nguoiDungHienTai.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    nguoiDungHienTai = await res.json();
    localStorage.setItem('smartstore_user', JSON.stringify(nguoiDungHienTai));
    capNhatNguoiDungHeader();
    hienThiThongTinCaNhan();
    hienThongBao('Cập nhật thông tin thành công!', 'success');
  } catch (loi) {
    console.error(loi);
    hienThongBao('Lỗi khi lưu thông tin!', 'error');
  }
}

// ============================================================================
// PHẦN 8: TRA CỨU ĐƠN HÀNG & SO SÁNH ĐIỆN THOẠI (TRACKING & COMPARE)
// ============================================================================

function hienThiTraCuu() {
  const resultBox = document.getElementById('tracking-result-box');
  if (resultBox) resultBox.style.display = 'none';
}

function traCuuTheoMa(ma) {
  document.getElementById('tracking-input').value = ma;
  chuyenTrang('tracking');
  xuLyTraCuu();
}

async function xuLyTraCuu() {
  const input = document.getElementById('tracking-input');
  const resultBox = document.getElementById('tracking-result-box');
  if (!input || !resultBox) return;

  const tuKhoa = input.value.trim().toLowerCase();
  if (!tuKhoa) {
    hienThongBao('Vui lòng nhập Mã đơn hàng hoặc Số điện thoại!', 'warning');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/orders`);
    const tatCaDon = await res.json();
    const don = tatCaDon.find(d => 
      (d.orderCode && d.orderCode.toLowerCase().includes(tuKhoa)) || 
      (d.customerPhone && d.customerPhone.includes(tuKhoa))
    );

    if (!don) {
      resultBox.style.display = 'block';
      resultBox.innerHTML = `
        <div style="background:#fff; padding:24px; border-radius:12px; text-align:center; border:1px solid #e2e8f0;">
          <i class="fa-solid fa-circle-question" style="font-size:36px; color:#94a3b8; margin-bottom:8px;"></i>
          <h3>Không tìm thấy đơn hàng nào!</h3>
        </div>
      `;
      return;
    }

    resultBox.style.display = 'block';
    resultBox.innerHTML = `
      <div style="background:#fff; padding:24px; border-radius:12px; border:1px solid #e2e8f0;">
        <div style="display:flex; justify-content:space-between; margin-bottom:14px; border-bottom:1px solid #e2e8f0; padding-bottom:10px;">
          <div>
            <div style="font-size:12px; color:#64748b;">MÃ ĐƠN HÀNG:</div>
            <h3 style="color:var(--primary);">${don.orderCode}</h3>
          </div>
          <div>
            <span class="badge status-${don.status}">${don.status === 'processing' ? 'Chờ xử lý' : (don.status === 'shipping' ? 'Đang giao' : 'Đã giao')}</span>
          </div>
        </div>
        <div style="font-size:13px; line-height:1.7; margin-bottom:14px;">
          <div><strong>Người nhận:</strong> ${don.customerName} (${don.customerPhone})</div>
          <div><strong>Địa chỉ:</strong> ${don.customerAddress}</div>
          <div><strong>Tổng tiền:</strong> <strong style="color:var(--accent); font-size:15px;">${dinhDangTien(don.totalAmount)}</strong></div>
        </div>
        <h4 style="font-size:13px; margin-bottom:8px;">Sản phẩm:</h4>
        ${don.items.map(i => `
          <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:4px; border-bottom:1px dashed #e2e8f0; padding-bottom:4px;">
            <span>${i.name} (x${i.quantity})</span>
            <strong>${dinhDangTien(i.price * i.quantity)}</strong>
          </div>
        `).join('')}
      </div>
    `;
  } catch (loi) {
    console.error(loi);
  }
}

// --- SO SÁNH TỐI ĐA 3 MÁY (TÍCH HỢP TRỰC TIẾP TRANG CỬA HÀNG) ---
// --- SO SÁNH TỐI ĐA 3 MÁY (TÍCH HỢP TRỰC TIẾP TRANG CỬA HÀNG) ---
function batTatSoSanh(idSP) {
  const idStr = String(idSP);
  const index = dsSoSanh.findIndex(id => String(id) === idStr);

  if (index > -1) {
    dsSoSanh.splice(index, 1);
    hienThongBao('Đã bỏ so sánh sản phẩm', 'info');
  } else {
    if (dsSoSanh.length >= 3) {
      hienThongBao('Chỉ có thể so sánh tối đa 3 máy cùng lúc!', 'warning');
      return;
    }
    dsSoSanh.push(idStr);
    hienThongBao('Đã thêm vào danh sách so sánh trong Cửa Hàng', 'success');
  }

  sessionStorage.setItem('smartstore_compare', JSON.stringify(dsSoSanh));
  capNhatBadge();
  hienThiSoSanh();
  capNhatNutSoSanhCard();
}

function capNhatNutSoSanhCard() {
  document.querySelectorAll('[data-compare-id]').forEach(btn => {
    const id = btn.getAttribute('data-compare-id');
    const isComparing = dsSoSanh.some(sid => String(sid) === String(id));
    btn.classList.toggle('is-comparing', isComparing);
    const icon = btn.querySelector('i');
    if (icon) {
      icon.className = `fa-solid ${isComparing ? 'fa-check' : 'fa-code-compare'}`;
    }
    const textSpan = btn.querySelector('.compare-btn-text');
    if (textSpan) {
      textSpan.textContent = isComparing ? 'Đang so sánh' : 'So Sánh';
    }
    btn.setAttribute('title', isComparing ? 'Bỏ khỏi so sánh' : 'Thêm vào so sánh');
  });
}

function hienThiSoSanh() {
  const shopWrapper = document.getElementById('shop-compare-table-wrapper');
  const oldWrapper = document.getElementById('compare-table-wrapper');
  const dock = document.getElementById('sticky-compare-dock');
  const dockCount = document.getElementById('dock-compare-count');
  const dockThumbs = document.getElementById('dock-compare-thumbs');

  // Lọc các máy đang được chọn so sánh (so sánh chuỗi ID)
  const dsMay = dsSanPham.filter(p => dsSoSanh.some(id => String(id) === String(p.id)));

  // 1. Cập nhật thanh ghim so sánh nổi (Sticky Dock) dưới đáy màn hình
  if (dock) {
    if (dsSoSanh.length > 0) {
      dock.style.display = 'block';
      if (dockCount) dockCount.textContent = dsSoSanh.length;
      if (dockThumbs) {
        dockThumbs.innerHTML = dsMay.map(p => `
          <div class="dock-thumb-item" title="${p.name}">
            <img src="${p.image}" class="dock-thumb-img" alt="${p.name}" onerror="this.onerror=null; this.src='https://picsum.photos/300/300';">
            <button type="button" class="dock-thumb-remove" onclick="batTatSoSanh('${p.id}')" title="Bỏ máy này"><i class="fa-solid fa-xmark"></i></button>
          </div>
        `).join('');
      }
    } else {
      dock.style.display = 'none';
    }
  }

  // 2. Nội dung bảng so sánh 10 thông số chuẩn
  let html = '';
  if (dsMay.length === 0) {
    html = `
      <div style="text-align: center; padding: 36px 20px; color: #64748b;">
        <i class="fa-solid fa-code-compare" style="font-size: 36px; color: #94a3b8; margin-bottom: 10px; display: block;"></i>
        <h4 style="font-size: 15px; font-weight: 700; color: var(--text);">Chưa có sản phẩm nào trong bảng so sánh!</h4>
        <p style="font-size: 13px; margin-top: 4px;">Hãy bấm nút <strong>"So Sánh"</strong> trên các thẻ điện thoại phía trên để đối chiếu 10 thông số kỹ thuật.</p>
      </div>
    `;
  } else {
    html = `
      <table class="compare-table">
        <thead>
          <tr>
            <th style="width: 20%;">Tiêu chí cấu hình</th>
            ${dsMay.map(sp => `
              <th style="text-align:center;">
                <img src="${sp.image}" style="height:100px; object-fit:contain; margin-bottom:8px;" onerror="this.onerror=null; this.src='https://picsum.photos/300/300';">
                <div style="font-size:14px; font-weight:700;">${sp.name}</div>
                <div style="color:var(--accent); font-weight:800; margin:4px 0;">${dinhDangTien(sp.price)}</div>
                <div style="display:flex; gap:6px; justify-content:center; margin-top:8px;">
                  <button class="btn-primary btn-sm" onclick="themVaoGio('${sp.id}', 1)"><i class="fa-solid fa-cart-plus"></i> Thêm Giỏ</button>
                  <button class="btn-danger btn-sm" onclick="batTatSoSanh('${sp.id}')" title="Bỏ so sánh máy này"><i class="fa-solid fa-xmark"></i></button>
                </div>
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          <tr><td><strong>1. Màn hình</strong></td>${dsMay.map(p => `<td>${p.specs?.screen || '-'}</td>`).join('')}</tr>
          <tr><td><strong>2. Vi xử lý (CPU)</strong></td>${dsMay.map(p => `<td><strong style="color:var(--primary);">${p.specs?.cpu || '-'}</strong></td>`).join('')}</tr>
          <tr><td><strong>3. Đồ họa (GPU)</strong></td>${dsMay.map(p => `<td>${p.specs?.gpu || '-'}</td>`).join('')}</tr>
          <tr><td><strong>4. RAM</strong></td>${dsMay.map(p => `<td>${p.specs?.ram || '-'}</td>`).join('')}</tr>
          <tr><td><strong>5. Bộ nhớ (ROM)</strong></td>${dsMay.map(p => `<td>${p.specs?.rom || '-'}</td>`).join('')}</tr>
          <tr><td><strong>6. Camera sau</strong></td>${dsMay.map(p => `<td>${p.specs?.rear_camera || '-'}</td>`).join('')}</tr>
          <tr><td><strong>7. Camera trước</strong></td>${dsMay.map(p => `<td>${p.specs?.front_camera || '-'}</td>`).join('')}</tr>
          <tr><td><strong>8. Pin & Sạc</strong></td>${dsMay.map(p => `<td>${p.specs?.battery || '-'}</td>`).join('')}</tr>
          <tr><td><strong>9. Hệ điều hành</strong></td>${dsMay.map(p => `<td>${p.specs?.os || '-'}</td>`).join('')}</tr>
          <tr><td><strong>10. Tính năng đặc biệt</strong></td>${dsMay.map(p => `<td>${p.specs?.special || '-'}</td>`).join('')}</tr>
        </tbody>
      </table>
    `;
  }

  if (shopWrapper) shopWrapper.innerHTML = html;
  if (oldWrapper) oldWrapper.innerHTML = html;
}

function cuonDenBangSoSanh() {
  const shopView = document.getElementById('view-shop');
  if (!shopView.classList.contains('active')) {
    chuyenTrang('shop');
  }
  setTimeout(() => {
    document.getElementById('shop-compare-section')?.scrollIntoView({ behavior: 'smooth' });
  }, 100);
}

function xoaSachSoSanh() {
  dsSoSanh = [];
  sessionStorage.removeItem('smartstore_compare');
  capNhatBadge();
  hienThiSoSanh();
  capNhatNutSoSanhCard();
  hienThongBao('Đã xóa toàn bộ sản phẩm khỏi bảng so sánh', 'info');
}

// ============================================================================
// PHẦN 9: KHỞI TẠO & GẮN SỰ KIỆN GIAO DIỆN (EVENT LISTENERS)
// ============================================================================

// Khai báo sẵn các hàm trên window để các thẻ HTML onclick gọi mượt mà không lỗi
window.appNav = {
  goTo: chuyenTrang,
  filterBrand: locTheoHang,
  closeModal: (id) => document.getElementById(id)?.classList.remove('open')
};
window.cartModule = {
  add: themVaoGio,
  updateQty: doiSoLuongGioHang,
  remove: xoaKhoiGio,
  clear: xoaSachGioHang
};
window.detailModule = {
  increaseQty: (tonKho) => tangGiamSoLuongChiTiet(1, tonKho),
  decreaseQty: () => tangGiamSoLuongChiTiet(-1),
  addToCart: (id) => themVaoGio(id, laySoLuongChiTiet()),
  buyNow: muaNgay
};
window.authModule = {
  switchTab: (tab) => {
    document.getElementById('tab-btn-login').className = `auth-tab-btn ${tab === 'login' ? 'active' : ''}`;
    document.getElementById('tab-btn-register').className = `auth-tab-btn ${tab === 'register' ? 'active' : ''}`;
    document.getElementById('form-login').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('form-register').style.display = tab === 'register' ? 'block' : 'none';
    const smartBox = document.getElementById('smart-identity-box');
    if (smartBox) smartBox.style.display = 'none';
  },
  logout: dangXuat
};
window.compareModule = {
  toggle: batTatSoSanh,
  clear: xoaSachSoSanh
};
window.shopModule = {
  setBrand: locTheoHang,
  setDemand: locTheoNhuCau,
  setPage: chuyenTrangCuaHang,
  resetFilters: datLaiBoLoc,
  scrollToCompare: cuonDenBangSoSanh,
  openQuickView: moXemNhanh
};

// Gắn sự kiện khi trang đã tải xong HTML
document.addEventListener('DOMContentLoaded', () => {
  // Cập nhật Header và Badge giỏ hàng ngay lập tức từ LocalStorage không chờ mạng
  capNhatNguoiDungHeader();
  capNhatBadge();

  taiDuLieu();

  // Menu Header SPA
  document.querySelectorAll('.main-nav .nav-item').forEach(nut => {
    nut.addEventListener('click', () => {
      const ten = nut.getAttribute('data-view');
      if (ten) chuyenTrang(ten);
    });
  });

  // Tìm kiếm sản phẩm
  const searchInput = document.getElementById('shop-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      boLoc.tuKhoa = e.target.value;
      boLoc.trang = 1;
      hienThiCuaHang();
    });
  }

  // Lọc giá & Sắp xếp
  document.getElementById('filter-price-range')?.addEventListener('change', (e) => {
    boLoc.khoangGia = e.target.value;
    boLoc.trang = 1;
    hienThiCuaHang();
  });
  document.getElementById('filter-sort-by')?.addEventListener('change', (e) => {
    boLoc.sapXep = e.target.value;
    hienThiCuaHang();
  });
  document.getElementById('btn-reset-filters')?.addEventListener('click', datLaiBoLoc);

  // Xóa giỏ hàng
  document.getElementById('btn-clear-cart')?.addEventListener('click', xoaSachGioHang);

  // Form Đặt hàng
  document.getElementById('checkout-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    xuLyDatHang();
  });

  // Form Đăng nhập
  document.getElementById('form-login')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-password').value.trim();
    xuLyDangNhap(email, pass);
  });

  // Form Đăng ký
  document.getElementById('form-register')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const ten = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const sdt = document.getElementById('reg-phone').value.trim();
    const diaChi = document.getElementById('reg-address').value.trim();
    const pass = document.getElementById('reg-password').value.trim();
    xuLyDangKy(ten, email, sdt, diaChi, pass);
  });

  // Smart Identity Resolution: Submit mật khẩu hoặc Hủy
  document.getElementById('btn-smart-login-submit')?.addEventListener('click', xuLySmartLoginSubmit);
  document.getElementById('btn-smart-cancel')?.addEventListener('click', huySmartLogin);
  document.getElementById('smart-login-password')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') xuLySmartLoginSubmit();
  });

  // Nút xóa bảng so sánh
  document.getElementById('btn-shop-clear-compare')?.addEventListener('click', xoaSachSoSanh);
  document.getElementById('btn-clear-compare')?.addEventListener('click', xoaSachSoSanh);

  // Sửa hồ sơ cá nhân
  document.getElementById('profile-edit-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    luuSuaThongTinCaNhan();
  });

  // Tra cứu đơn hàng
  document.getElementById('btn-tracking-search')?.addEventListener('click', xuLyTraCuu);
  document.getElementById('tracking-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') xuLyTraCuu();
  });

  // Form liên hệ
  document.getElementById('contact-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    hienThongBao('Cảm ơn bạn đã gửi tin nhắn! SmartStore sẽ liên hệ lại sớm.', 'success');
    e.target.reset();
  });
});
