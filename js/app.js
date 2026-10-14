/**
 * ============================================================================
 * JAVASCRIPT GIAO DIỆN NGƯỜI DÙNG (USER APP - app.js)
 * ============================================================================
 * 
 * CÁC CHỨC NĂNG CHÍNH:
 * 1. Hiển thị danh sách điện thoại theo hãng (mỗi hãng >= 5 sản phẩm).
 * 2. Bộ lọc: Tìm kiếm theo tên, lọc theo thương hiệu, lọc theo khoảng giá.
 * 3. Nút "Thêm vào giỏ" và Nút "Mua ngay" (chuyển thẳng tới giỏ hàng).
 * 4. Kiểm tra trạng thái đăng nhập khi thanh toán:
 *    - Nếu CHƯA đăng nhập: Yêu cầu đăng nhập hoặc đăng ký tài khoản mới.
 *    - Nếu ĐÃ đăng nhập: Cho phép bấm đặt hàng và hiển thị màn hình cảm ơn.
 * 5. Tích hợp đầy đủ Form Đăng Nhập & Form Đăng Ký tài khoản mới (POST /users).
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
// 2. BIẾN TOÀN CỤC QUẢN LÝ TRẠNG THÁI (STATE)
// ============================================================================
let danhSachSanPham = [];
let danhSachDanhMuc = [];
let gioHang = [];

// Biến lưu thông tin người dùng đang đăng nhập (lưu vào localStorage)
let nguoiDungHienTai = null;

// ============================================================================
// 3. HÀM TIỆN ÍCH DÙNG CHUNG
// ============================================================================

/**
 * Định dạng số thành chuỗi tiền tệ VNĐ (ví dụ: 29990000 -> "29.990.000 đ")
 */
function dinhDangTien(soTien) {
  return Number(soTien || 0).toLocaleString('vi-VN') + ' đ';
}

/**
 * Hiển thị thông báo Toast nhỏ ở góc dưới màn hình.
 */
function hienThongBao(noiDung, laLoi = false) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = noiDung;
  toast.className = 'toast-notice show' + (laLoi ? ' error' : '');

  setTimeout(function () {
    toast.className = 'toast-notice';
  }, 3000);
}

/**
 * Chuyển đổi giữa các màn hình (view-shop, view-cart, view-thankyou, view-account).
 */
function chuyenTrang(viewId) {
  const panels = document.querySelectorAll('.view-panel');
  panels.forEach(function (panel) {
    panel.classList.remove('active');
  });

  const target = document.getElementById(viewId);
  if (target) target.classList.add('active');

  // Cập nhật trạng thái active cho thanh điều hướng
  const navBtns = document.querySelectorAll('.nav-item');
  navBtns.forEach(function (btn) {
    if (btn.getAttribute('data-view') === viewId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Tự động tải lịch sử đơn hàng khi chuyển sang tab đơn hàng
  if (viewId === 'view-orders') {
    taiLichSuDonHang();
  }

  // Cuộn lên đầu trang mượt mà
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================================
// 4. TẢI DỮ LIỆU SẢN PHẨM & BỘ LỌC
// ============================================================================

/**
 * Lấy danh sách thương hiệu điện thoại từ máy chủ và đổ vào select box.
 */
async function taiDanhMuc() {
  try {
    const res = await fetch(API_CATEGORIES);
    danhSachDanhMuc = await res.json();

    const selectShop = document.getElementById('shop-filter-category');
    if (selectShop) {
      selectShop.innerHTML = '<option value="">Tất cả thương hiệu</option>' +
        danhSachDanhMuc.map(function (c) {
          return `<option value="${c.id}">${c.name}</option>`;
        }).join('');
    }
  } catch (err) {
    console.error('Lỗi tải danh mục:', err);
  }
}

/**
 * Lấy danh sách điện thoại từ JSON Server và hiển thị ra giao diện.
 */
async function taiSanPham() {
  try {
    const res = await fetch(API_PRODUCTS);
    danhSachSanPham = await res.json();
    locVaHienThiSanPham();
  } catch (err) {
    console.error('Lỗi tải sản phẩm:', err);
  }
}

/**
 * Lọc và hiển thị sản phẩm theo tên, hãng và khoảng giá.
 */
function locVaHienThiSanPham() {
  const container = document.getElementById('product-grid');
  if (!container) return;

  const tuKhoa = (document.getElementById('shop-search')?.value || '').trim().toLowerCase();
  const maDanhMuc = document.getElementById('shop-filter-category')?.value || '';
  const khoangGia = document.getElementById('shop-filter-price')?.value || '';

  const ketQua = danhSachSanPham.filter(function (sp) {
    const khopTen = sp.name.toLowerCase().includes(tuKhoa);
    const khopDanhMuc = (maDanhMuc === '' || String(sp.cate_id) === String(maDanhMuc));

    let khopGia = true;
    const gia = Number(sp.price);
    if (khoangGia === 'duoi-10tr') {
      khopGia = (gia < 10000000);
    } else if (khoangGia === '10tr-25tr') {
      khopGia = (gia >= 10000000 && gia <= 25000000);
    } else if (khoangGia === 'tren-25tr') {
      khopGia = (gia > 25000000);
    }

    return khopTen && khopDanhMuc && khopGia;
  });

  if (ketQua.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px; color: var(--text-muted);">
        <i class="fas fa-box-open" style="font-size: 40px; margin-bottom: 12px; display: block;"></i>
        <p>Không tìm thấy sản phẩm nào phù hợp với bộ lọc.</p>
      </div>
    `;
    return;
  }

  // Render sản phẩm: có cả 2 nút "Thêm vào giỏ" và "Mua ngay"
  container.innerHTML = ketQua.map(function (sp) {
    const hang = danhSachDanhMuc.find(function (c) { return String(c.id) === String(sp.cate_id); });
    const tenHang = hang ? hang.name : 'Điện thoại';

    return `
      <div class="product-card">
        <!-- Bấm vào ảnh hoặc tên sản phẩm để xem chi tiết -->
        <div class="product-img-box" onclick="xemChiTietSanPham('${sp.id}')" title="Bấm để xem chi tiết">
          <span class="product-badge">${tenHang}</span>
          <img src="${sp.image || 'https://picsum.photos/300/300'}" alt="${sp.name}" loading="lazy" />
        </div>
        <div class="product-info">
          <h3 class="product-name" onclick="xemChiTietSanPham('${sp.id}')" title="Bấm để xem chi tiết">${sp.name}</h3>
          <p class="product-desc">${sp.detail || 'Bảo hành chính hãng 12 tháng, 1 đổi 1 trong 30 ngày.'}</p>
          <div class="product-price-box">
            <span class="product-price">${dinhDangTien(sp.price)}</span>
            <span class="product-stock">Kho: ${sp.quantity || 0}</span>
          </div>
          <!-- Nhóm 2 nút hành động: Thêm vào giỏ và Mua ngay -->
          <div class="product-actions-group">
            <button class="btn-add-cart" onclick="themVaoGioHang('${sp.id}', false)">
              <i class="fas fa-cart-plus"></i> Thêm giỏ
            </button>
            <button class="btn-buy-now" onclick="themVaoGioHang('${sp.id}', true)">
              <i class="fas fa-bolt"></i> Mua ngay
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================================
// 4.1. CHỨC NĂNG XEM CHI TIẾT SẢN PHẨM (PRODUCT DETAIL MODAL)
// ============================================================================
/**
 * Tác dụng: Khi người dùng bấm vào ảnh hoặc tên sản phẩm:
 * Tìm thông tin sản phẩm và hiển thị lên cửa sổ Modal chi tiết.
 */
function xemChiTietSanPham(id) {
  const sp = danhSachSanPham.find(function (item) { return String(item.id) === String(id); });
  if (!sp) return;

  const hang = danhSachDanhMuc.find(function (c) { return String(c.id) === String(sp.cate_id); });
  const tenHang = hang ? hang.name : 'Điện thoại';

  // Đổ dữ liệu vào Modal
  document.getElementById('detail-brand-badge').textContent = tenHang;
  document.getElementById('detail-name').textContent = sp.name;
  document.getElementById('detail-img').src = sp.image || 'https://picsum.photos/300/300';
  document.getElementById('detail-price').textContent = dinhDangTien(sp.price);
  document.getElementById('detail-stock').textContent = 'Tồn kho: ' + (sp.quantity || 0) + ' máy';
  document.getElementById('detail-desc').textContent = sp.detail || 'Sản phẩm mới 100% chính hãng, nguyên seal, đầy đủ phụ kiện theo hộp.';

  // Gán sự kiện cho 2 nút trong modal chi tiết
  const btnAdd = document.getElementById('btn-detail-add-cart');
  const btnBuy = document.getElementById('btn-detail-buy-now');

  if (btnAdd) {
    btnAdd.onclick = function () {
      themVaoGioHang(sp.id, false);
      dongModalChiTiet();
    };
  }

  if (btnBuy) {
    btnBuy.onclick = function () {
      themVaoGioHang(sp.id, true);
      dongModalChiTiet();
    };
  }

  // Mở modal
  const modal = document.getElementById('product-detail-modal');
  if (modal) modal.classList.add('open');
}

/**
 * Đóng cửa sổ modal xem chi tiết.
 */
function dongModalChiTiet() {
  const modal = document.getElementById('product-detail-modal');
  if (modal) modal.classList.remove('open');
}

// ============================================================================
// 5. GIỎ HÀNG & CHỨC NĂNG "MUA NGAY"
// ============================================================================

/**
 * Thêm sản phẩm vào giỏ hàng.
 * @param {string} id - ID sản phẩm
 * @param {boolean} laMuaNgay - Nếu là true: tự động chuyển ngay sang trang Giỏ hàng để thanh toán
 */
function themVaoGioHang(id, laMuaNgay = false) {
  const sanPham = danhSachSanPham.find(function (item) { return String(item.id) === String(id); });
  if (!sanPham) return;

  const monTrongGio = gioHang.find(function (item) { return String(item.id) === String(id); });

  if (monTrongGio) {
    monTrongGio.quantity += 1;
  } else {
    gioHang.push({
      id: sanPham.id,
      name: sanPham.name,
      price: sanPham.price,
      image: sanPham.image,
      quantity: 1
    });
  }

  // Lưu vào localStorage
  localStorage.setItem('smartstore_cart', JSON.stringify(gioHang));
  capNhatGiaoDienGioHang();

  if (laMuaNgay) {
    // Nếu bấm "Mua ngay": chuyển thẳng sang trang giỏ hàng để đặt hàng
    chuyenTrang('view-cart');
    hienThongBao(`Đang tiến hành đặt mua "${sanPham.name}"!`);
  } else {
    hienThongBao(`Đã thêm "${sanPham.name}" vào giỏ hàng!`);
  }
}

/**
 * Tăng hoặc giảm số lượng món trong giỏ hàng.
 */
function doiSoLuongGioHang(id, delta) {
  const mon = gioHang.find(function (item) { return String(item.id) === String(id); });
  if (!mon) return;

  mon.quantity += delta;
  if (mon.quantity <= 0) {
    xoaKhoiGioHang(id);
    return;
  }

  localStorage.setItem('smartstore_cart', JSON.stringify(gioHang));
  capNhatGiaoDienGioHang();
}

/**
 * Xóa một món ra khỏi giỏ hàng.
 */
function xoaKhoiGioHang(id) {
  gioHang = gioHang.filter(function (item) { return String(item.id) !== String(id); });
  localStorage.setItem('smartstore_cart', JSON.stringify(gioHang));
  capNhatGiaoDienGioHang();
  hienThongBao('Đã xóa sản phẩm khỏi giỏ hàng.');
}

/**
 * Cập nhật hiển thị bảng giỏ hàng, tổng tiền và trạng thái đăng nhập khi thanh toán.
 */
function capNhatGiaoDienGioHang() {
  const badge = document.getElementById('cart-count');
  const tbody = document.getElementById('cart-tbody');
  const subtotalEl = document.getElementById('cart-subtotal');
  const totalEl = document.getElementById('cart-total');
  const warningBox = document.getElementById('cart-login-warning');

  let tongSoLuong = 0;
  let tongTien = 0;

  gioHang.forEach(function (item) {
    tongSoLuong += item.quantity;
    tongTien += (item.price * item.quantity);
  });

  if (badge) badge.textContent = tongSoLuong;
  if (subtotalEl) subtotalEl.textContent = dinhDangTien(tongTien);
  if (totalEl) totalEl.textContent = dinhDangTien(tongTien);

  // Hiển thị cảnh báo nếu người dùng chưa đăng nhập
  if (warningBox) {
    if (!nguoiDungHienTai) {
      warningBox.style.display = 'flex';
    } else {
      warningBox.style.display = 'none';
      // Tự động điền thông tin người dùng vào form thanh toán cho tiện
      const nameInput = document.getElementById('order-name');
      const phoneInput = document.getElementById('order-phone');
      const addressInput = document.getElementById('order-address');
      if (nameInput && !nameInput.value) nameInput.value = nguoiDungHienTai.name || '';
      if (phoneInput && !phoneInput.value) phoneInput.value = nguoiDungHienTai.phone || '';
      if (addressInput && !addressInput.value) addressInput.value = nguoiDungHienTai.address || '';
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

  tbody.innerHTML = gioHang.map(function (item) {
    const thanhTien = item.price * item.quantity;
    return `
      <tr>
        <td>
          <div class="cart-item-info">
            <img src="${item.image || 'https://picsum.photos/50/50'}" class="cart-item-img" alt="${item.name}" />
            <strong>${item.name}</strong>
          </div>
        </td>
        <td>${dinhDangTien(item.price)}</td>
        <td>
          <div class="qty-control">
            <button class="qty-btn" onclick="doiSoLuongGioHang('${item.id}', -1)">-</button>
            <span style="font-weight: 600; min-width: 20px; text-align: center;">${item.quantity}</span>
            <button class="qty-btn" onclick="doiSoLuongGioHang('${item.id}', 1)">+</button>
          </div>
        </td>
        <td><strong style="color: var(--accent);">${dinhDangTien(thanhTien)}</strong></td>
        <td>
          <button style="background: none; border: none; color: var(--accent); cursor: pointer;" onclick="xoaKhoiGioHang('${item.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Biến lưu trữ đơn hàng đang chờ xác nhận thanh toán
let donHangDangXacNhan = null;

/**
 * Xử lý sự kiện bấm nút Đặt Hàng Ngay (Checkout form submit).
 * YÊU CẦU:
 * 1. Nếu chưa đăng nhập -> chuyển sang trang Tài khoản để đăng nhập/đăng ký.
 * 2. Khi hợp lệ -> Mở hộp thoại popup hỏi: "Bạn có muốn đặt hàng hay không?".
 */
function xuLyDatHang(event) {
  event.preventDefault();

  // 1. Kiểm tra giỏ hàng có rỗng không
  if (gioHang.length === 0) {
    hienThongBao('Giỏ hàng của bạn đang trống!', true);
    return;
  }

  // 2. KIỂM TRA ĐĂNG NHẬP
  if (!nguoiDungHienTai) {
    hienThongBao('Vui lòng ĐĂNG NHẬP hoặc ĐĂNG KÝ tài khoản trước khi đặt hàng!', true);
    chuyenTrang('view-account');
    return;
  }

  // 3. Thu thập thông tin người nhận hàng
  const tenNguoiNhan = document.getElementById('order-name')?.value.trim();
  const soDienThoai = document.getElementById('order-phone')?.value.trim();
  const diaChi = document.getElementById('order-address')?.value.trim();

  if (!tenNguoiNhan || !soDienThoai || !diaChi) {
    hienThongBao('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ giao hàng!', true);
    return;
  }

  // Tính tổng tiền và tổng số lượng
  let tongTien = 0;
  let tongSoLuong = 0;
  gioHang.forEach(function (item) {
    tongTien += (item.price * item.quantity);
    tongSoLuong += item.quantity;
  });

  // Lưu thông tin đơn hàng vào biến tạm để chờ người dùng bấm Xác nhận
  donHangDangXacNhan = {
    id: String(Date.now()),
    user_id: nguoiDungHienTai.id,
    customer_name: tenNguoiNhan,
    phone: soDienThoai,
    address: diaChi,
    total_amount: tongTien,
    items_count: tongSoLuong,
    items: gioHang.map(function (it) {
      return {
        id: it.id,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        image: it.image
      };
    }),
    created_date: new Date().toISOString().split('T')[0],
    status: 'Đang xử lý'
  };

  // 4. Đổ dữ liệu vào Modal xác nhận đặt hàng
  const modalEl = document.getElementById('checkout-confirm-modal');
  const confirmName = document.getElementById('confirm-buyer-name');
  const confirmPhone = document.getElementById('confirm-buyer-phone');
  const confirmAddress = document.getElementById('confirm-buyer-address');
  const confirmItemsList = document.getElementById('confirm-items-list');
  const confirmTotal = document.getElementById('confirm-order-total');

  if (confirmName) confirmName.textContent = tenNguoiNhan;
  if (confirmPhone) confirmPhone.textContent = soDienThoai;
  if (confirmAddress) confirmAddress.textContent = diaChi;
  if (confirmTotal) confirmTotal.textContent = dinhDangTien(tongTien);

  // Hiển thị danh sách các món hàng trong hộp thoại xác nhận
  if (confirmItemsList) {
    confirmItemsList.innerHTML = gioHang.map(function (item) {
      return `
        <div class="confirm-item-mini">
          <span class="confirm-item-mini-name">${item.name}</span>
          <span class="confirm-item-mini-qty">x${item.quantity}</span>
          <span class="confirm-item-mini-price">${dinhDangTien(item.price * item.quantity)}</span>
        </div>
      `;
    }).join('');
  }

  // Mở popup xác nhận đặt hàng lên màn hình
  if (modalEl) {
    modalEl.classList.add('open');
    modalEl.classList.add('active');
  }
}

/**
 * Đóng Modal xác nhận thanh toán
 */
function dongModalXacNhanThanhToan() {
  const modalEl = document.getElementById('checkout-confirm-modal');
  if (modalEl) {
    modalEl.classList.remove('open');
    modalEl.classList.remove('active');
  }
}

/**
 * Người dùng bấm "Hủy" trên hộp thoại (Không đồng ý đặt hàng):
 * Đóng modal và in ra thông báo hủy đặt hàng theo đúng yêu cầu.
 */
function huyThanhToan() {
  dongModalXacNhanThanhToan();
  donHangDangXacNhan = null;
  hienThongBao('Bạn đã hủy đặt hàng!', true);
}

/**
 * Người dùng bấm "Xác nhận" trên hộp thoại (Đồng ý đặt hàng):
 * - Gửi dữ liệu đơn hàng lên json-server (POST /orders)
 * - In ra thông báo: Đặt hàng thành công!
 * - Hiển thị thông tin đơn hàng vừa mua
 * - Xóa sạch giỏ hàng
 * - Chuyển sang màn hình cảm ơn & xem lại đơn hàng
 */
async function thucHienXacNhanDatHang() {
  if (!donHangDangXacNhan) {
    dongModalXacNhanThanhToan();
    return;
  }

  const donHang = donHangDangXacNhan;

  try {
    const res = await fetch(API_ORDERS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donHang)
    });

    if (!res.ok) {
      throw new Error(`Lỗi server: ${res.status}`);
    }

    // Đóng hộp thoại xác nhận
    dongModalXacNhanThanhToan();

    // 1. In ra thông báo đặt hàng thành công
    hienThongBao('Đặt hàng thành công!');

    // 2. Đổ thông tin đơn hàng vừa mua vào màn hình Cảm ơn
    const thankyouInfoCard = document.getElementById('thankyou-order-info');
    const placedOrderId = document.getElementById('placed-order-id');
    const placedOrderName = document.getElementById('placed-order-name');
    const placedOrderPhone = document.getElementById('placed-order-phone');
    const placedOrderAddress = document.getElementById('placed-order-address');
    const placedOrderTotal = document.getElementById('placed-order-total');
    const placedItemsList = document.getElementById('placed-items-list');

    if (thankyouInfoCard) thankyouInfoCard.style.display = 'block';
    if (placedOrderId) placedOrderId.textContent = `#${donHang.id}`;
    if (placedOrderName) placedOrderName.textContent = donHang.customer_name;
    if (placedOrderPhone) placedOrderPhone.textContent = donHang.phone;
    if (placedOrderAddress) placedOrderAddress.textContent = donHang.address;
    if (placedOrderTotal) placedOrderTotal.textContent = dinhDangTien(donHang.total_amount);

    if (placedItemsList && donHang.items) {
      placedItemsList.innerHTML = donHang.items.map(function (it) {
        return `
          <div class="placed-item-row">
            <div class="placed-item-info">
              <img src="${it.image || ''}" alt="${it.name}" class="placed-item-img" />
              <div>
                <strong>${it.name}</strong>
                <div style="color: var(--text-muted); font-size: 12px;">Số lượng: ${it.quantity}</div>
              </div>
            </div>
            <strong style="color: var(--primary);">${dinhDangTien(it.price * it.quantity)}</strong>
          </div>
        `;
      }).join('');
    }

    // 3. Xóa giỏ hàng sau khi đặt thành công
    gioHang = [];
    localStorage.removeItem('smartstore_cart');
    capNhatGiaoDienGioHang();
    document.getElementById('checkout-form')?.reset();

    // 4. Chuyển sang màn hình xem đơn hàng vừa đặt
    chuyenTrang('view-thankyou');
    donHangDangXacNhan = null;

    // Tải lại lịch sử đơn hàng
    taiLichSuDonHang();
  } catch (err) {
    console.error('Lỗi khi gửi đơn hàng:', err);
    hienThongBao('Xác nhận đặt hàng thất bại, vui lòng thử lại sau!', true);
  }
}

/**
 * Tải và hiển thị danh sách đơn hàng đã mua của người dùng hiện tại (Lịch sử đơn hàng).
 */
async function taiLichSuDonHang() {
  const notLoggedBox = document.getElementById('orders-not-logged');
  const historyList = document.getElementById('orders-history-list');

  if (!historyList) return;

  // 1. Nếu người dùng chưa đăng nhập
  if (!nguoiDungHienTai) {
    if (notLoggedBox) notLoggedBox.style.display = 'block';
    historyList.innerHTML = '';
    return;
  }

  if (notLoggedBox) notLoggedBox.style.display = 'none';
  historyList.innerHTML = '<p style="text-align: center; padding: 24px; color: var(--text-muted);">Đang tải lịch sử đơn hàng của bạn...</p>';

  try {
    const res = await fetch(API_ORDERS);
    const allOrders = await res.json();

    // Lọc các đơn hàng thuộc về tài khoản này và đảo ngược để đơn mới nhất lên đầu
    const userOrders = allOrders
      .filter(function (o) { return String(o.user_id) === String(nguoiDungHienTai.id); })
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

    // Hiển thị danh sách các đơn hàng đã mua
    historyList.innerHTML = userOrders.map(function (order) {
      let badgeClass = 'status-processing';
      if (order.status === 'Đang giao hàng') badgeClass = 'status-shipping';
      else if (order.status === 'Đã giao hàng') badgeClass = 'status-delivered';

      // Tạo bảng danh sách sản phẩm trong đơn
      let itemsHtml = '';
      if (order.items && order.items.length > 0) {
        itemsHtml = order.items.map(function (it) {
          return `
            <tr>
              <td>
                <div class="order-table-product">
                  <img src="${it.image || ''}" alt="${it.name}" class="order-table-thumb" />
                  <span>${it.name}</span>
                </div>
              </td>
              <td>x${it.quantity}</td>
              <td><strong>${dinhDangTien(it.price * it.quantity)}</strong></td>
            </tr>
          `;
        }).join('');
      } else {
        itemsHtml = `<tr><td colspan="3" style="padding: 10px; color: var(--text-muted);">Đơn hàng gồm ${order.items_count || 1} sản phẩm</td></tr>`;
      }

      return `
        <div class="order-card">
          <div class="order-card-header">
            <div>
              <span class="order-code">Đơn hàng #${order.id}</span>
              <span class="order-date"><i class="far fa-calendar-alt"></i> Ngày đặt: ${order.created_date || '—'}</span>
            </div>
            <span class="order-status-badge ${badgeClass}">${order.status || 'Đang xử lý'}</span>
          </div>

          <div class="order-card-customer-info">
            <div class="order-customer-field">
              <span>Người nhận:</span> <strong>${order.customer_name || nguoiDungHienTai.name}</strong>
            </div>
            <div class="order-customer-field">
              <span>SĐT:</span> <strong>${order.phone || nguoiDungHienTai.phone || '—'}</strong>
            </div>
            <div class="order-customer-field">
              <span>Địa chỉ:</span> <strong>${order.address || nguoiDungHienTai.address || '—'}</strong>
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
    console.error('Lỗi tải lịch sử đơn hàng:', err);
    historyList.innerHTML = '<p style="color: var(--accent); text-align: center; padding: 20px;">Không thể kết nối đến máy chủ để lấy lịch sử đơn hàng!</p>';
  }
}


// ============================================================================
// 6. XỬ LÝ ĐĂNG KÝ & ĐĂNG NHẬP TÀI KHOẢN (USER AUTH)
// ============================================================================

/**
 * Kiểm tra tài khoản đã lưu trong localStorage khi vừa mở trang.
 */
function kiemTraDangNhap() {
  const savedUser = localStorage.getItem('smartstore_user');
  if (savedUser) {
    try {
      nguoiDungHienTai = JSON.parse(savedUser);
    } catch (e) {
      nguoiDungHienTai = null;
    }
  }
  capNhatGiaoDienTaiKhoan();
}

/**
 * Cập nhật giao diện của phần Tài khoản tuỳ theo đã đăng nhập hay chưa.
 */
function capNhatGiaoDienTaiKhoan() {
  const loggedBox = document.getElementById('account-logged-box');
  const formsWrapper = document.getElementById('auth-forms-wrapper');
  const nameEl = document.getElementById('account-user-name');
  const emailEl = document.getElementById('account-user-email');
  const navText = document.getElementById('nav-account-text');

  // Các trường xem thông tin tài khoản
  const profilePhoneEl = document.getElementById('profile-phone');
  const profileAddressEl = document.getElementById('profile-address');
  const profileRoleEl = document.getElementById('profile-role');

  if (nguoiDungHienTai) {
    // ĐÃ ĐĂNG NHẬP: Hiển thị box thông tin cá nhân và đổi mật khẩu
    if (loggedBox) loggedBox.style.display = 'block';
    if (formsWrapper) formsWrapper.style.display = 'none';
    if (nameEl) nameEl.textContent = nguoiDungHienTai.name;
    if (emailEl) emailEl.textContent = nguoiDungHienTai.email;
    if (navText) navText.textContent = nguoiDungHienTai.name.split(' ').pop(); // Tên ngắn gọn trên thanh menu

    // Đổ dữ liệu chi tiết vào bảng thông tin tài khoản
    if (profilePhoneEl) profilePhoneEl.textContent = nguoiDungHienTai.phone || 'Chưa cập nhật';
    if (profileAddressEl) profileAddressEl.textContent = nguoiDungHienTai.address || 'Chưa cập nhật';
    if (profileRoleEl) {
      profileRoleEl.textContent = nguoiDungHienTai.role === 'admin' ? 'Quản trị viên (Admin)' : 'Khách hàng thành viên';
    }

    // Tự động điền thông tin người dùng vào Form Đặt hàng để khách hàng không phải gõ lại
    const orderNameEl = document.getElementById('order-name');
    const orderPhoneEl = document.getElementById('order-phone');
    const orderAddressEl = document.getElementById('order-address');
    if (orderNameEl && !orderNameEl.value) orderNameEl.value = nguoiDungHienTai.name || '';
    if (orderPhoneEl && !orderPhoneEl.value) orderPhoneEl.value = nguoiDungHienTai.phone || '';
    if (orderAddressEl && !orderAddressEl.value) orderAddressEl.value = nguoiDungHienTai.address || '';
  } else {
    // CHƯA ĐĂNG NHẬP: Hiển thị tab Đăng nhập & Đăng ký
    if (loggedBox) loggedBox.style.display = 'none';
    if (formsWrapper) formsWrapper.style.display = 'block';
    if (navText) navText.textContent = 'Tài khoản';
  }

  // Cập nhật lại trạng thái giỏ hàng
  capNhatGiaoDienGioHang();

  // Cập nhật lại danh sách lịch sử đơn hàng
  taiLichSuDonHang();
}

/**
 * Xử lý Form Đăng Nhập User.
 */
async function xuLyDangNhap(event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value.trim();

  try {
    const res = await fetch(API_USERS);
    const users = await res.json();

    // Tìm kiếm tài khoản khớp email và password
    const user = users.find(function (u) {
      return u.email.toLowerCase() === email && String(u.password) === password;
    });

    if (!user) {
      hienThongBao('Sai email hoặc mật khẩu, vui lòng kiểm tra lại!', true);
      return;
    }

    // Lưu phiên đăng nhập
    nguoiDungHienTai = user;
    localStorage.setItem('smartstore_user', JSON.stringify(user));
    capNhatGiaoDienTaiKhoan();
    hienThongBao(`Đăng nhập thành công! Chào mừng ${user.name}`);

    // Nếu trước đó đang có hàng trong giỏ, tự động chuyển về giỏ hàng để tiếp tục thanh toán
    if (gioHang.length > 0) {
      chuyenTrang('view-cart');
    }
  } catch (err) {
    console.error('Lỗi đăng nhập:', err);
    hienThongBao('Không thể kết nối đến máy chủ đăng nhập!', true);
  }
}

/**
 * Xử lý Form Đăng Ký Tài Khoản Mới (Yêu cầu thêm tài khoản mới vào db.json).
 */
async function xuLyDangKy(event) {
  event.preventDefault();

  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const phone = document.getElementById('reg-phone').value.trim();
  const password = document.getElementById('reg-password').value.trim();
  const address = document.getElementById('reg-address').value.trim();

  if (!name || !email || !phone || !password) {
    hienThongBao('Vui lòng điền đầy đủ các thông tin bắt buộc!', true);
    return;
  }

  try {
    // 1. Kiểm tra email đã tồn tại trong danh sách chưa
    const resCheck = await fetch(API_USERS);
    const users = await resCheck.json();
    const daTonTai = users.some(function (u) { return u.email.toLowerCase() === email; });

    if (daTonTai) {
      hienThongBao(`Email "${email}" đã được đăng ký tài khoản khác!`, true);
      return;
    }

    // 2. Thêm người dùng mới qua phương thức POST /users
    const userMoi = {
      id: String(Date.now()),
      name: name,
      email: email,
      phone: phone,
      password: password,
      role: 'user',
      address: address
    };

    await fetch(API_USERS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userMoi)
    });

    // 3. Tự động đăng nhập luôn sau khi đăng ký
    nguoiDungHienTai = userMoi;
    localStorage.setItem('smartstore_user', JSON.stringify(userMoi));
    document.getElementById('register-form').reset();
    capNhatGiaoDienTaiKhoan();
    hienThongBao(`Đăng ký tài khoản thành công! Xin chào ${name}`);

    // Nếu đang có hàng trong giỏ thì đưa về trang giỏ hàng ngay
    if (gioHang.length > 0) {
      chuyenTrang('view-cart');
    }
  } catch (err) {
    console.error('Lỗi đăng ký:', err);
    hienThongBao('Đăng ký tài khoản thất bại!', true);
  }
}

/**
 * Đăng xuất tài khoản người dùng hiện tại.
 */
function dangXuat() {
  nguoiDungHienTai = null;
  localStorage.removeItem('smartstore_user');
  capNhatGiaoDienTaiKhoan();
  hienThongBao('Đã đăng xuất tài khoản thành công.');
}

/**
 * Xử lý sự kiện Đổi Mật Khẩu tài khoản (Change Password).
 * - Kiểm tra mật khẩu hiện tại có đúng với mật khẩu tài khoản đang đăng nhập hay không.
 * - Kiểm tra mật khẩu mới hợp lệ (tối thiểu 6 ký tự, khác mật khẩu cũ).
 * - Kiểm tra xác nhận mật khẩu mới khớp 100%.
 * - Gửi yêu cầu PATCH lên API_USERS để cập nhật trong db.json.
 * - Cập nhật lại localStorage để duy trì trạng thái đăng nhập mới.
 */
async function xuLyDoiMatKhau(event) {
  event.preventDefault();

  if (!nguoiDungHienTai) {
    hienThongBao('Vui lòng đăng nhập để đổi mật khẩu!', true);
    return;
  }

  const oldPass = document.getElementById('old-pass').value.trim();
  const newPass = document.getElementById('new-pass').value.trim();
  const confirmNewPass = document.getElementById('confirm-new-pass').value.trim();

  // 1. Kiểm tra mật khẩu hiện tại
  if (String(nguoiDungHienTai.password) !== oldPass) {
    hienThongBao('Mật khẩu hiện tại không chính xác!', true);
    return;
  }

  // 2. Kiểm tra độ dài mật khẩu mới
  if (newPass.length < 6) {
    hienThongBao('Mật khẩu mới phải có ít nhất 6 ký tự!', true);
    return;
  }

  // 3. Kiểm tra mật khẩu mới không được trùng mật khẩu cũ
  if (newPass === oldPass) {
    hienThongBao('Mật khẩu mới không được trùng với mật khẩu đang dùng!', true);
    return;
  }

  // 4. Kiểm tra xác nhận mật khẩu mới
  if (newPass !== confirmNewPass) {
    hienThongBao('Xác nhận mật khẩu mới không trùng khớp!', true);
    return;
  }

  try {
    // 5. Gửi request PATCH lên json-server để cập nhật mật khẩu mới
    const res = await fetch(`${API_USERS}/${nguoiDungHienTai.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPass })
    });

    if (!res.ok) {
      throw new Error(`Lỗi cập nhật mật khẩu: ${res.status}`);
    }

    // 6. Cập nhật đối tượng người dùng hiện tại và lưu vào localStorage
    nguoiDungHienTai.password = newPass;
    localStorage.setItem('smartstore_user', JSON.stringify(nguoiDungHienTai));

    // Reset các trường nhập trong form
    document.getElementById('change-password-form')?.reset();

    hienThongBao('Đổi mật khẩu thành công! Vui lòng ghi nhớ mật khẩu mới của bạn.');
  } catch (err) {
    console.error('Lỗi khi đổi mật khẩu:', err);
    hienThongBao('Không thể cập nhật mật khẩu, vui lòng thử lại sau!', true);
  }
}

// ============================================================================
// 8. TIỆN ÍCH LỌC TỪ CHÂN TRANG (FOOTER)
// ============================================================================
/**
 * Khi người dùng bấm vào một thương hiệu dưới Footer (vd: Apple iPhone, Samsung Galaxy):
 * Tự động chuyển về trang Shop và chọn danh mục tương ứng.
 */
function locTheoThuongHieuFooter(cateId) {
  chuyenTrang('view-shop');
  const selectBox = document.getElementById('shop-filter-category');
  if (selectBox) {
    selectBox.value = cateId;
    locVaHienThiSanPham();
  }
}

// ============================================================================
// 9. KHỞI TẠO VÀ GẮN SỰ KIỆN KHI MỞ TRANG (INIT)
// ============================================================================
document.addEventListener('DOMContentLoaded', function () {
  // 1. Phục hồi giỏ hàng từ localStorage
  const savedCart = localStorage.getItem('smartstore_cart');
  if (savedCart) {
    try { gioHang = JSON.parse(savedCart); } catch (e) { gioHang = []; }
  }
  capNhatGiaoDienGioHang();

  // 2. Kiểm tra tài khoản đã đăng nhập
  kiemTraDangNhap();

  // 3. Chuyển đổi tab chính trên Header
  const navBtns = document.querySelectorAll('.nav-item');
  navBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const viewId = btn.getAttribute('data-view');
      if (viewId) chuyenTrang(viewId);
    });
  });

  // Bấm vào logo để về trang chủ Shop
  document.getElementById('logo-home')?.addEventListener('click', function () {
    chuyenTrang('view-shop');
  });

  // Bấm nút tiếp tục mua sắm ở trang Cảm ơn
  document.getElementById('btn-back-to-shop')?.addEventListener('click', function () {
    chuyenTrang('view-shop');
  });

  // Bấm nút xem lịch sử đơn hàng ở trang Cảm ơn
  document.getElementById('btn-view-order-history')?.addEventListener('click', function () {
    chuyenTrang('view-orders');
  });

  // Bấm nút xem lịch sử đơn hàng từ mục Tài khoản
  document.getElementById('btn-account-view-orders')?.addEventListener('click', function () {
    chuyenTrang('view-orders');
  });

  // Bấm nút chuyển đến đăng nhập từ trang Đơn hàng
  document.getElementById('btn-orders-go-login')?.addEventListener('click', function () {
    chuyenTrang('view-account');
  });

  // Sự kiện modal xem chi tiết sản phẩm
  document.getElementById('btn-close-detail-modal')?.addEventListener('click', dongModalChiTiet);
  document.getElementById('product-detail-modal')?.addEventListener('click', function (e) {
    if (e.target === this) dongModalChiTiet();
  });

  // Sự kiện modal xác nhận thanh toán đơn hàng (Xác nhận hoặc Hủy)
  document.getElementById('btn-accept-checkout')?.addEventListener('click', thucHienXacNhanDatHang);
  document.getElementById('btn-cancel-checkout')?.addEventListener('click', huyThanhToan);
  document.getElementById('checkout-confirm-modal')?.addEventListener('click', function (e) {
    if (e.target === this) dongModalXacNhanThanhToan();
  });

  // 4. Sự kiện bộ lọc sản phẩm
  document.getElementById('shop-search')?.addEventListener('input', locVaHienThiSanPham);
  document.getElementById('shop-filter-category')?.addEventListener('change', locVaHienThiSanPham);
  document.getElementById('shop-filter-price')?.addEventListener('change', locVaHienThiSanPham);

  // 5. Sự kiện đặt hàng
  document.getElementById('checkout-form')?.addEventListener('submit', xuLyDatHang);

  // 6. Chuyển đổi giữa 2 tab Đăng Nhập và Đăng Ký trong trang Tài khoản
  const tabLogin = document.getElementById('tab-btn-login');
  const tabReg = document.getElementById('tab-btn-register');
  const formLogin = document.getElementById('login-form');
  const formReg = document.getElementById('register-form');

  tabLogin?.addEventListener('click', function () {
    tabLogin.classList.add('active');
    tabReg.classList.remove('active');
    formLogin.style.display = 'block';
    formReg.style.display = 'none';
  });

  tabReg?.addEventListener('click', function () {
    tabReg.classList.add('active');
    tabLogin.classList.remove('active');
    formReg.style.display = 'block';
    formLogin.style.display = 'none';
  });

  // 7. Sự kiện Form Đăng nhập & Đăng ký & Đổi mật khẩu
  formLogin?.addEventListener('submit', xuLyDangNhap);
  formReg?.addEventListener('submit', xuLyDangKy);
  document.getElementById('change-password-form')?.addEventListener('submit', xuLyDoiMatKhau);
  document.getElementById('btn-logout')?.addEventListener('click', dangXuat);

  // 8. Tải dữ liệu ban đầu
  taiDanhMuc();
  taiSanPham();
});
