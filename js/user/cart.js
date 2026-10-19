/**
 * ============================================================================
 * DỰ ÁN: SMARTSTORE - THẾ GIỚI SMARTPHONE & GAMING PHONE
 * MODULE: js/user/cart.js (GIỎ HÀNG, THANH TOÁN, HARD BLOCK ADMIN & TRA CỨU ĐƠN HÀNG)
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * Sinh viên thực hiện: Lương Văn Dũng
 * ============================================================================
 */

// ============================================================================
// 1. NGHIỆP VỤ GIỎ HÀNG (SHOPPING CART ENGINE)
// ============================================================================

/**
 * 🎯 Biến trạng thái lưu trữ Voucher đang được áp dụng trong phiên thanh toán hiện tại
 */
var voucherDangApDung = null;

/**
 * 🎯 Mục đích: Render Thanh Tiến Trình Quà Tặng Độc Quyền (Gamification Progress Bar)
 * 🔄 Luồng chạy: Nhận tổng tiền giỏ hàng -> Xác định mốc thưởng (10 triệu: Sạc 67W, 20 triệu: Balo + Tai nghe Gaming)
 *              -> Tính toán % thanh tiến trình và thông điệp thúc đẩy giá trị giỏ hàng (AOV).
 */
function renderRewardBar(tongTien) {
  const rewardEl = document.getElementById('cart-reward-bar');
  if (!rewardEl) return;

  if (tongTien <= 0) {
    rewardEl.innerHTML = '';
    rewardEl.style.display = 'none';
    return;
  }
  rewardEl.style.display = 'block';

  const moc1 = 10000000; // Mốc 1: 10 triệu đồng
  const moc2 = 20000000; // Mốc 2: 20 triệu đồng

  let phanTram = 0;
  let thongDiep = '';
  let badgeText = '';

  if (tongTien < moc1) {
    phanTram = Math.min(100, Math.round((tongTien / moc1) * 50));
    const thieu = moc1 - tongTien;
    thongDiep = `Mua thêm <strong style="color:var(--accent); font-weight:800;">${dinhDangTien(thieu)}</strong> để nhận ngay <strong>Củ Sạc Nhanh 67W</strong> trị giá 350.000 đ!`;
    badgeText = 'Mốc Quà 1 (Đơn từ 10tr)';
  } else if (tongTien < moc2) {
    phanTram = 50 + Math.min(50, Math.round(((tongTien - moc1) / (moc2 - moc1)) * 50));
    const thieu = moc2 - tongTien;
    thongDiep = `🎉 Đã nhận Củ Sạc 67W! Mua thêm <strong style="color:var(--accent); font-weight:800;">${dinhDangTien(thieu)}</strong> để nhận <strong>Tai Nghe Gaming Type-C & Balo Độc Quyền</strong> trị giá 790.000 đ!`;
    badgeText = 'Mốc Quà 2 (Đơn từ 20tr)';
  } else {
    phanTram = 100;
    thongDiep = `🎉 <strong>CHÚC MỪNG BẠN!</strong> Đã mở khóa trọn bộ <strong>Combo Quà Tặng Gaming VIP</strong> (Củ sạc 120W + Tai nghe Type-C + Quạt tản nhiệt cơ học)!`;
    badgeText = 'ĐÃ MỞ KHÓA TOÀN BỘ QUÀ VIP';
  }

  rewardEl.innerHTML = `
    <div class="cart-reward-header">
      <div class="cart-reward-title">
        <div class="cart-reward-icon"><i class="fa-solid fa-gift"></i></div>
        <div>${thongDiep}</div>
      </div>
      <span class="cart-reward-badge">${badgeText}</span>
    </div>
    <div class="cart-reward-track">
      <div class="cart-reward-fill" style="width: ${phanTram}%;"></div>
    </div>
    <div class="cart-reward-milestones">
      <span class="cart-reward-milestone-point ${tongTien >= 0 ? 'achieved' : ''}">0 đ (Bắt đầu)</span>
      <span class="cart-reward-milestone-point ${tongTien >= moc1 ? 'achieved' : ''}">10 Triệu (Sạc 67W)</span>
      <span class="cart-reward-milestone-point ${tongTien >= moc2 ? 'achieved' : ''}">20 Triệu (Combo Gaming VIP)</span>
    </div>
  `;
}

/**
 * 🎯 Mục đích: Render bảng giỏ hàng kèm tổng tiền tạm tính và thành tiền
 */
function hienThiGioHang() {
  const emptyBox = document.getElementById('cart-empty-state');
  const contentBox = document.getElementById('cart-content-wrapper');
  const tbody = document.getElementById('cart-table-tbody');
  const subtotalEl = document.getElementById('cart-subtotal');
  const totalEl = document.getElementById('cart-grand-total');
  const rewardEl = document.getElementById('cart-reward-bar');

  if (gioHang.length === 0) {
    if (emptyBox) emptyBox.style.display = 'block';
    if (contentBox) contentBox.style.display = 'none';
    if (rewardEl) {
      rewardEl.innerHTML = '';
      rewardEl.style.display = 'none';
    }
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
            <div style="display: flex; align-items: center; gap: 12px;">
              <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: contain; border-radius: 8px; border: 1px solid var(--border);">
              <div>
                <strong style="font-size: 14px; color: var(--text);">${item.name}</strong>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Còn sẵn ${item.stock} máy</div>
              </div>
            </div>
          </td>
          <td style="font-weight: 700;">${dinhDangTien(item.price)}</td>
          <td>
            <div class="qty-btn-group">
              <button type="button" onclick="doiSoLuongGioHang('${item.id}', -1)" title="Giảm số lượng">-</button>
              <input type="number" value="${item.quantity}" readonly>
              <button type="button" onclick="doiSoLuongGioHang('${item.id}', 1)" title="Tăng số lượng">+</button>
            </div>
          </td>
          <td style="font-weight: 800; color: var(--accent);">${dinhDangTien(thanhTien)}</td>
          <td style="text-align: center;">
            <button class="btn-danger btn-sm" onclick="xoaKhoiGio('${item.id}')" title="Xóa món này">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  if (subtotalEl) subtotalEl.textContent = dinhDangTien(tongTien);
  if (totalEl) totalEl.textContent = dinhDangTien(tongTien);

  // Kích hoạt cập nhật Thanh Tiến Trình Quà Tặng theo tổng tiền giỏ hàng
  renderRewardBar(tongTien);
}

/**
 * 🎯 Mục đích: Thêm một sản phẩm vào giỏ hàng và kiểm tra giới hạn tồn kho
 * ⚙️ Hàm có sẵn: Array.prototype.find, Array.prototype.push, Math.max, Math.min
 * 🔄 Luồng chạy: Tìm sản phẩm trong dsSanPham -> Kiểm tra tồn kho -> Nếu đã có trong giỏ thì tăng quantity (không vượt stock), nếu chưa có thì push -> Ghi LocalStorage.
 */
function themVaoGio(idSP, soLuong = 1) {
  const sp = dsSanPham.find(item => item.id == idSP);
  if (!sp) return;

  const soLuongThem = Math.max(1, Number(soLuong) || 1);
  const tonKho = (sp.stock !== undefined && sp.stock !== null) ? Number(sp.stock) : (Number(sp.quantity) || 15);

  if (tonKho <= 0) {
    hienThongBao('Sản phẩm đã hết hàng!', 'error');
    return;
  }

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
      id: String(sp.id),
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

/**
 * 🎯 Mục đích: Tăng/giảm số lượng từng món ngay trong giỏ hàng
 */
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

/**
 * 🎯 Mục đích: Xóa một món hàng khỏi giỏ
 * ⚙️ Hàm có sẵn: Array.prototype.filter
 */
function xoaKhoiGio(idSP) {
  const mon = gioHang.find(item => item.id == idSP);
  const tenMon = mon ? mon.name : 'sản phẩm này';
  if (!confirm(`XÁC NHẬN XÓA SẢN PHẨM:\nBạn có chắc chắn muốn xóa "${tenMon}" khỏi giỏ hàng không?`)) {
    return;
  }
  gioHang = gioHang.filter(item => item.id != idSP);
  luuGioHang();
  hienThiGioHang();
  hienThongBao(`Đã xóa "${tenMon}" khỏi giỏ hàng`, 'info');
}

/**
 * 🎯 Mục đích: Làm trống toàn bộ giỏ hàng
 */
function xoaSachGioHang() {
  if (gioHang.length === 0) return;
  if (confirm('XÁC NHẬN LÀM TRỐNG GIỎ HÀNG:\nBạn có chắc chắn muốn xóa toàn bộ sản phẩm trong giỏ hàng không?')) {
    gioHang = [];
    luuGioHang();
    hienThiGioHang();
    hienThongBao('Giỏ hàng đã được làm trống', 'info');
  }
}

// ============================================================================
// 2. HỆ THỐNG MÃ GIẢM GIÁ (VOUCHER ENGINE) & THANH TOÁN (CHECKOUT)
// ============================================================================

/**
 * 🎯 Mục đích: Render danh sách các chip mã giảm giá HOT gợi ý cho khách hàng bấm chọn nhanh
 * 🔄 Luồng chạy: Nạp danh sách mã ưu đãi -> Sinh HTML các chip -> Gắn sự kiện click gọi apDungVoucher(code)
 */
function renderQuickVoucherChips() {
  const container = document.getElementById('quick-voucher-chips');
  if (!container) return;

  const hotVouchers = [
    { code: 'GAMING2026', title: 'Game Thủ -500k', icon: 'fa-gamepad' },
    { code: 'FLAGSHIP10', title: 'Flagship -10%', icon: 'fa-crown' },
    { code: 'FPTSTUDENT', title: 'SV FPT -300k', icon: 'fa-graduation-cap' },
    { code: 'FREESHIP', title: 'Freeship -150k', icon: 'fa-truck-fast' }
  ];

  container.innerHTML = hotVouchers.map(v => `
    <span class="voucher-chip-item" onclick="window.cartModule.applyVoucher('${v.code}')" title="Bấm để áp dụng ngay mã ${v.code}">
      <i class="fa-solid ${v.icon}"></i>
      <span>${v.code} (${v.title})</span>
    </span>
  `).join('');
}

/**
 * 🎯 Mục đích: Kiểm tra và áp dụng Mã Giảm Giá (Voucher) vào đơn hàng
 * 🔄 Luồng bảo vệ đồ án ASM (6 BƯỚC CHUẨN MỰC TỪ FRONTEND ĐẾN BACKEND):
 *   1. Trigger UI: Khách bấm nút "Áp Dụng" hoặc chạm vào Chip Voucher gợi ý.
 *   2. Bắt sự kiện: Event listener bắt mã voucher từ input hoặc tham số hàm.
 *   3. Gửi HTTP Request: Gọi GET /vouchers lên máy chủ API để tra cứu mã.
 *   4. Điều hướng Controller & Kiểm tra Nghiệp vụ (Business Rules):
 *      - Kiểm tra mã có tồn tại không.
 *      - Kiểm tra số lượt còn lại (usageLeft > 0).
 *      - Kiểm tra giá trị đơn hàng tối thiểu (subtotal >= minOrder).
 *   5. Tính toán chiết khấu (Fixed hoặc Percent với giới hạn maxDiscount) và lưu vào State.
 *   6. Cập nhật UI & Phản hồi: Hiển thị dòng Giảm giá Voucher, tính lại Tổng thanh toán và thông báo Toast.
 */
async function apDungVoucher(maNhap) {
  const inputEl = document.getElementById('input-voucher-code');
  const code = (maNhap || (inputEl ? inputEl.value : '')).trim().toUpperCase();

  if (!code) {
    hienThongBao('Vui lòng nhập mã giảm giá trước khi áp dụng!', 'warning');
    return;
  }

  if (inputEl) inputEl.value = code;

  const tongTien = gioHang.reduce((s, item) => s + (item.price * item.quantity), 0);
  if (tongTien <= 0) {
    hienThongBao('Giỏ hàng trống! Hãy thêm sản phẩm trước khi áp dụng voucher.', 'warning');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/vouchers`);
    if (!res.ok) throw new Error('Không thể kết nối đến máy chủ khuyến mãi');
    const vouchers = await res.json();

    const voucher = vouchers.find(v => (v.code || '').toUpperCase() === code);

    if (!voucher) {
      hienThongBao(`Mã giảm giá "${code}" không hợp lệ hoặc đã kết thúc!`, 'error');
      return;
    }

    if ((Number(voucher.usageLeft) || 0) <= 0) {
      hienThongBao(`Mã ưu đãi "${code}" đã hết lượt sử dụng!`, 'error');
      return;
    }

    const minOrder = Number(voucher.minOrder) || 0;
    if (tongTien < minOrder) {
      hienThongBao(`Đơn hàng cần tối thiểu ${dinhDangTien(minOrder)} để sử dụng mã "${code}"!`, 'warning');
      return;
    }

    // Tính toán số tiền chiết khấu hợp lệ
    let discountAmount = 0;
    if (voucher.type === 'percent') {
      const phanTram = Number(voucher.discount) || 0;
      const tienGiamTinh = Math.round((tongTien * phanTram) / 100);
      discountAmount = voucher.maxDiscount ? Math.min(tienGiamTinh, Number(voucher.maxDiscount)) : tienGiamTinh;
    } else {
      discountAmount = Math.min(Number(voucher.discount) || 0, tongTien);
    }

    voucherDangApDung = {
      ...voucher,
      calculatedDiscount: discountAmount
    };

    capNhatGiaCheckout(tongTien);
    hienThongBao(`Áp dụng voucher "${voucher.code}" thành công! Tiết kiệm ${dinhDangTien(discountAmount)}`, 'success');
  } catch (err) {
    console.error('Lỗi kiểm tra voucher:', err);
    hienThongBao('Lỗi khi kiểm tra mã giảm giá với máy chủ!', 'error');
  }
}

/**
 * 🎯 Mục đích: Hủy bỏ voucher đang áp dụng và khôi phục giá trị đơn hàng ban đầu
 */
function huyVoucher() {
  if (!voucherDangApDung) return;
  const maCu = voucherDangApDung.code;
  voucherDangApDung = null;

  const inputEl = document.getElementById('input-voucher-code');
  if (inputEl) inputEl.value = '';

  capNhatGiaCheckout();
  hienThongBao(`Đã gỡ bỏ mã giảm giá "${maCu}"`, 'info');
}

/**
 * 🎯 Mục đích: Cập nhật giao diện tiền tệ tại bước Checkout (Tạm tính, Giảm giá, Tổng thanh toán)
 */
function capNhatGiaCheckout(tongTien) {
  if (tongTien === undefined) {
    tongTien = gioHang.reduce((s, item) => s + (item.price * item.quantity), 0);
  }

  const subtotalEl = document.getElementById('checkout-subtotal');
  const discountRow = document.getElementById('checkout-discount-row');
  const discountAmountEl = document.getElementById('checkout-discount-amount');
  const grandTotalEl = document.getElementById('checkout-grand-total');
  const appliedAlert = document.getElementById('applied-voucher-alert');

  if (subtotalEl) subtotalEl.textContent = dinhDangTien(tongTien);

  if (voucherDangApDung) {
    // Kiểm tra tính hợp lệ liên tục nếu số lượng món thay đổi
    if (tongTien < (voucherDangApDung.minOrder || 0)) {
      hienThongBao(`Đơn hàng không còn đủ điều kiện tối thiểu của mã ${voucherDangApDung.code}!`, 'warning');
      voucherDangApDung = null;
      if (discountRow) discountRow.style.display = 'none';
      if (appliedAlert) appliedAlert.style.display = 'none';
      if (grandTotalEl) grandTotalEl.textContent = dinhDangTien(tongTien);
      return;
    }

    let discountAmount = 0;
    if (voucherDangApDung.type === 'percent') {
      const phanTram = Number(voucherDangApDung.discount) || 0;
      const tienGiamTinh = Math.round((tongTien * phanTram) / 100);
      discountAmount = voucherDangApDung.maxDiscount ? Math.min(tienGiamTinh, Number(voucherDangApDung.maxDiscount)) : tienGiamTinh;
    } else {
      discountAmount = Math.min(Number(voucherDangApDung.discount) || 0, tongTien);
    }
    voucherDangApDung.calculatedDiscount = discountAmount;

    if (discountRow) discountRow.style.display = 'flex';
    if (discountAmountEl) discountAmountEl.textContent = `-${dinhDangTien(discountAmount)}`;
    if (grandTotalEl) grandTotalEl.textContent = dinhDangTien(Math.max(0, tongTien - discountAmount));

    if (appliedAlert) {
      appliedAlert.style.display = 'flex';
      appliedAlert.innerHTML = `
        <div>
          <i class="fa-solid fa-circle-check" style="color: #10b981; margin-right: 6px;"></i>
          <strong>${voucherDangApDung.code}</strong>: Đã giảm ${dinhDangTien(discountAmount)}
        </div>
        <button type="button" class="btn-remove-voucher" onclick="window.cartModule.cancelVoucher()">Gỡ bỏ</button>
      `;
    }
  } else {
    if (discountRow) discountRow.style.display = 'none';
    if (appliedAlert) appliedAlert.style.display = 'none';
    if (grandTotalEl) grandTotalEl.textContent = dinhDangTien(tongTien);
  }
}

/**
 * 🎯 Mục đích: Hiển thị màn hình Thanh Toán (Checkout) và tự động điền thông tin nếu đã đăng nhập
 * 🛡️ Bảo vệ nghiệp vụ: Kiểm tra quyền Admin -> Nếu là Admin thì hiển thị cảnh báo đỏ và khóa nút đặt hàng
 */
function hienThiThanhToan() {
  if (gioHang.length === 0) {
    hienThongBao('Giỏ hàng trống! Hãy chọn ít nhất 1 sản phẩm.', 'warning');
    chuyenTrang('shop');
    return;
  }

  // 🛡️ CHẶN XÁC THỰC BƯỚC THANH TOÁN (CHECKOUT AUTH GUARD CHUẨN TMĐT):
  if (!nguoiDungHienTai) {
    sessionStorage.setItem('smartstore_auth_redirect', 'checkout');
    hienThongBao('Quý khách vui lòng Đăng Nhập hoặc Đăng Ký để tiếp tục thanh toán đơn hàng!', 'warning');
    chuyenTrang('auth');
    return;
  }

  if (nguoiDungHienTai) {
    document.getElementById('checkout-name').value = nguoiDungHienTai.fullName || nguoiDungHienTai.name || '';
    document.getElementById('checkout-phone').value = nguoiDungHienTai.phone || '';
    document.getElementById('checkout-email').value = nguoiDungHienTai.email || '';
    document.getElementById('checkout-address').value = nguoiDungHienTai.address || '';
  }

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

  // Render các mã voucher gợi ý và cập nhật bảng tính tiền
  renderQuickVoucherChips();
  capNhatGiaCheckout(tongTien);

  // 🛡️ BẢO VỆ NGHIỆP VỤ (HARD BLOCK ADMIN): Kiểm tra và xử lý trạng thái đặt hàng của tài khoản Quản trị viên
  const warningBox = document.getElementById('admin-checkout-warning-box');
  const btnSubmit = document.getElementById('btn-submit-order');
  const laAdmin = nguoiDungHienTai && nguoiDungHienTai.role === 'admin';

  if (laAdmin) {
    if (!warningBox) {
      const box = document.createElement('div');
      box.id = 'admin-checkout-warning-box';
      box.style.cssText = 'background: #fff1f2; border: 1.5px solid #f43f5e; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px; display: flex; align-items: flex-start; gap: 12px; color: #9f1239; box-shadow: 0 4px 12px rgba(244,63,94,0.12);';
      box.innerHTML = `
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 22px; color: #e11d48; margin-top: 2px;"></i>
        <div>
          <strong style="font-size: 14px; display: block; margin-bottom: 4px; color: #e11d48; font-weight: 800;">
            ⚠️ HẠN CHẾ QUYỀN HẠN QUẢN TRỊ VIÊN (ADMIN)
          </strong>
          <span style="font-size: 13px; line-height: 1.5; font-weight: 500;">
            Tài khoản Quản trị viên không được phép đặt hàng thương mại. Vui lòng đăng xuất để dùng tài khoản Khách hàng!
          </span>
        </div>
      `;
      const form = document.getElementById('checkout-form');
      if (form) form.prepend(box);
    } else {
      warningBox.style.display = 'flex';
    }

    if (btnSubmit) {
      btnSubmit.classList.add('btn-disabled');
      btnSubmit.style.opacity = '0.6';
      btnSubmit.style.cursor = 'not-allowed';
      btnSubmit.style.background = '#94a3b8';
      btnSubmit.style.borderColor = '#94a3b8';
      btnSubmit.innerHTML = '<i class="fa-solid fa-ban"></i> Đặt Hàng Bị Khóa (Tài Khoản Admin)';
      btnSubmit.title = 'Tài khoản Quản trị viên không được phép đặt hàng thương mại. Vui lòng đăng xuất để dùng tài khoản Khách hàng!';
    }
  } else {
    if (warningBox) warningBox.style.display = 'none';
    if (btnSubmit) {
      btnSubmit.classList.remove('btn-disabled');
      btnSubmit.style.opacity = '1';
      btnSubmit.style.cursor = 'pointer';
      btnSubmit.style.background = '';
      btnSubmit.style.borderColor = '';
      btnSubmit.innerHTML = '<i class="fa-solid fa-lock"></i> Xác Nhận Đặt Hàng Ngay';
      btnSubmit.title = '';
    }
  }
}

/**
 * 🎯 Mục đích: Xử lý đặt hàng, trừ tồn kho, trừ lượt voucher và xuất hóa đơn
 * 🛡️ Bảo vệ nghiệp vụ: Chặn tuyệt đối tài khoản Quản trị viên (Admin)
 * ⚙️ Hàm có sẵn: fetch (POST, PATCH), Promise.all, Array.prototype.reduce, Date.now
 * 🔄 Luồng bảo vệ đồ án ASM (6 BƯỚC CHUẨN MỰC TỪ FRONTEND ĐẾN BACKEND):
 *   1. Trigger UI: Khách nhấn nút "Xác Nhận Đặt Hàng Ngay" tại view-checkout.
 *   2. Bắt sự kiện: Event Listener ngăn reload form, trích xuất dữ liệu người nhận.
 *   3. Gửi HTTP Request: Gửi POST /orders tạo mới đơn hàng với thông tin chiết khấu voucher.
 *   4. Xử lý tồn kho & Voucher đồng thời:
 *      - Gọi song song Promise.all(PATCH /products/:id) để trừ stock và tăng sold.
 *      - Gọi PATCH /vouchers/:id để giảm usageLeft của mã giảm giá đã dùng.
 *   5. Database cập nhật: JSON-server ghi nhận bản ghi mới vào db.json.
 *   6. Phản hồi UI: Lưu donHangVuaDat, làm trống giỏ hàng, thông báo Toast và điều hướng sang trang Cảm Ơn.
 */
async function xuLyDatHang() {
  if (!nguoiDungHienTai) {
    sessionStorage.setItem('smartstore_auth_redirect', 'checkout');
    hienThongBao('Quý khách cần Đăng Nhập hoặc Đăng Ký tài khoản để hoàn tất đặt hàng!', 'warning');
    chuyenTrang('auth');
    return;
  }

  if (nguoiDungHienTai && nguoiDungHienTai.role === 'admin') {
    hienThongBao('Tài khoản Quản trị viên không được phép đặt hàng thương mại. Vui lòng đăng xuất để dùng tài khoản Khách hàng!', 'error');
    return;
  }

  const ten = document.getElementById('checkout-name').value.trim();
  const sdt = document.getElementById('checkout-phone').value.trim();
  const email = document.getElementById('checkout-email').value.trim();
  const diaChi = document.getElementById('checkout-address').value.trim();
  const ghiChu = document.getElementById('checkout-note').value.trim();
  const phuongThuc = document.querySelector('input[name="payment_method"]:checked')?.value || 'COD';

  if (!ten || !sdt || !diaChi) {
    hienThongBao('Vui lòng nhập đầy đủ Họ tên, Số điện thoại và Địa chỉ nhận hàng!', 'error');
    return;
  }

  const tongTien = gioHang.reduce((tong, item) => tong + (item.price * item.quantity), 0);
  const giamGia = voucherDangApDung ? (voucherDangApDung.calculatedDiscount || 0) : 0;
  const tongThanhToan = Math.max(0, tongTien - giamGia);
  const maDon = '#DH' + Date.now().toString().slice(-9);

  const donHangMoi = {
    orderCode: maDon,
    userId: nguoiDungHienTai ? String(nguoiDungHienTai.id) : null,
    customerName: ten,
    customerPhone: sdt,
    customerEmail: email,
    customerAddress: diaChi,
    note: ghiChu,
    paymentMethod: phuongThuc,
    items: [...gioHang],
    subtotal: tongTien,
    voucherCode: voucherDangApDung ? voucherDangApDung.code : null,
    discountAmount: giamGia,
    totalAmount: tongThanhToan,
    status: 'processing',
    createdAt: new Date().toISOString()
  };

  try {
    // 1. Lưu đơn hàng vào API
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donHangMoi)
    });
    donHangVuaDat = await res.json();

    // 2. Trừ tồn kho và tăng số lượng đã bán qua API PATCH
    const updateKhoPromises = gioHang.map(item => {
      const sp = dsSanPham.find(p => p.id == item.id);
      if (sp) {
        const khoMoi = Math.max(0, sp.stock - item.quantity);
        const daBanMoi = (sp.sold || 0) + item.quantity;
        sp.stock = khoMoi;
        sp.quantity = khoMoi;
        sp.sold = daBanMoi;

        return fetch(`${API_URL}/products/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stock: khoMoi, quantity: khoMoi, sold: daBanMoi })
        });
      }
      return Promise.resolve();
    });

    // 3. Giảm lượt sử dụng của Voucher nếu có áp dụng
    if (voucherDangApDung && voucherDangApDung.id) {
      try {
        const vConLai = Math.max(0, (Number(voucherDangApDung.usageLeft) || 1) - 1);
        updateKhoPromises.push(
          fetch(`${API_URL}/vouchers/${voucherDangApDung.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usageLeft: vConLai })
          })
        );
      } catch (vErr) {
        console.warn('Lỗi khi trừ lượt voucher:', vErr);
      }
    }

    await Promise.all(updateKhoPromises);

    // 4. Xóa sạch giỏ hàng & reset voucher
    gioHang = [];
    voucherDangApDung = null;
    luuGioHang();
    hienThongBao(`Đặt hàng thành công! Mã đơn của bạn: ${maDon}`, 'success');
    chuyenTrang('thankyou');
  } catch (loi) {
    console.error(loi);
    hienThongBao('Lỗi khi gửi đơn hàng lên máy chủ!', 'error');
  }
}

/**
 * 🎯 Mục đích: Hiển thị trang Cảm Ơn sau khi đặt hàng thành công
 */
function hienThiCamOn() {
  if (!donHangVuaDat) {
    chuyenTrang('home');
    return;
  }

  const codeEl = document.getElementById('thankyou-order-code');
  if (codeEl) codeEl.textContent = donHangVuaDat.orderCode;

  const summaryEl = document.getElementById('thankyou-order-summary');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div><strong>Khách hàng:</strong> ${donHangVuaDat.customerName} - ${donHangVuaDat.customerPhone}</div>
      <div><strong>Địa chỉ:</strong> ${donHangVuaDat.customerAddress}</div>
      <div><strong>Phương thức:</strong> ${donHangVuaDat.paymentMethod === 'COD' ? 'Tiền mặt khi nhận hàng (COD)' : (donHangVuaDat.paymentMethod === 'BANK' ? 'Chuyển khoản VietQR' : 'Ví VNPAY')}</div>
      ${donHangVuaDat.voucherCode ? `
        <div style="margin-top: 4px;">
          <strong>Voucher áp dụng:</strong> 
          <span style="display:inline-block; padding: 2px 8px; background: #eff6ff; color: #2563eb; border: 1px dashed #3b82f6; border-radius: 4px; font-weight: 700; font-size: 12px;">
            ${donHangVuaDat.voucherCode} (-${dinhDangTien(donHangVuaDat.discountAmount)})
          </span>
        </div>
      ` : ''}
      <div style="margin-top: 4px;"><strong>Tổng thanh toán:</strong> <strong style="color: var(--accent); font-size: 15px;">${dinhDangTien(donHangVuaDat.totalAmount)}</strong></div>
      <div style="margin-top: 8px;"><strong>Sản phẩm (${(donHangVuaDat.items || []).length}):</strong></div>
      <ul style="margin: 4px 0 0 16px; padding: 0;">
        ${(donHangVuaDat.items || []).map(i => `<li>${i.name} (x${i.quantity}) - ${dinhDangTien(i.price * i.quantity)}</li>`).join('')}
      </ul>
    `;
  }
}

/**
 * 🎯 Mục đích: In hóa đơn bán hàng kiêm phiếu bảo hành điện tử chuẩn CellphoneS / Thế Giới Di Động
 * ⚙️ Hàm có sẵn: window.open, document.write, document.close, window.print
 * 🔄 Luồng bảo vệ đồ án ASM (6 BƯỚC CHUẨN MỰC TỪ FRONTEND ĐẾN BACKEND):
 *   1. Trigger UI: Người dùng bấm nút "In Hóa Đơn Bán Lẻ" (User) hoặc Admin bấm "In Hóa Đơn" (Admin Modal).
 *   2. Event Listener: window.cartModule.printInvoice() hoặc window.adminCtrl.printInvoice() bắt sự kiện.
 *   3. Kiểm tra dữ liệu: Trích xuất đối tượng đơn hàng (donHangVuaDat hoặc donHangDangXem).
 *   4. Render Template Hóa Đơn Bán Lẻ A4/A5: Tạo trang HTML độc lập với đầy đủ CSS Print, Thông tin SmartStore (Trịnh Văn Bô), Hotline, Bảng món, Giảm giá voucher, Chữ ký.
 *   5. Mở Popup & Nạp DOM: Gọi window.open(), document.write(html), document.close().
 *   6. Lệnh In Trình Duyệt: popup.focus(); popup.print() mở hộp thoại in của hệ điều hành.
 */
function inHoaDonDonHang(donHang) {
  const d = donHang || donHangVuaDat;
  if (!d) {
    hienThongBao('Không có dữ liệu đơn hàng để in hóa đơn!', 'warning');
    return;
  }

  const ngayDat = new Date(d.createdAt || Date.now()).toLocaleString('vi-VN');
  const giamGia = Number(d.discountAmount) || 0;
  const tamTinh = d.subtotal || ((d.items || []).reduce((s, i) => s + (i.price * i.quantity), 0)) || d.totalAmount;
  const tongTien = d.totalAmount || tamTinh;

  const popup = window.open('', '_blank', 'width=850,height=900,menubar=no,toolbar=no,location=no,status=no');
  if (!popup) {
    hienThongBao('Trình duyệt đã chặn cửa sổ bật lên (Popup)! Vui lòng cho phép popup để in hóa đơn.', 'error');
    return;
  }

  const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Hóa Đơn Bán Hàng - SmartStore ${d.orderCode}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      padding: 30px;
      color: #1e293b;
      background: #ffffff;
      font-size: 13px;
      line-height: 1.5;
    }
    .invoice-container {
      max-width: 780px;
      margin: 0 auto;
      border: 1px solid #e2e8f0;
      padding: 30px;
      border-radius: 8px;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .brand-sub {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
    }
    .invoice-title {
      text-align: center;
      margin: 20px 0;
    }
    .invoice-title h1 {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.5px;
    }
    .invoice-title p {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      background: #f8fafc;
      padding: 14px 18px;
      border-radius: 6px;
      margin-bottom: 20px;
      border: 1px solid #e2e8f0;
    }
    .info-line { margin-bottom: 4px; }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .items-table th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      padding: 10px;
      text-align: left;
      border-bottom: 2px solid #cbd5e1;
      font-size: 12px;
    }
    .items-table td {
      padding: 10px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 13px;
    }
    .summary-box {
      float: right;
      width: 340px;
      margin-bottom: 25px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
    }
    .summary-row.total {
      border-top: 2px solid #2563eb;
      padding-top: 10px;
      font-size: 16px;
      font-weight: 800;
      color: #ef4444;
    }
    .clear { clear: both; }
    .policy-box {
      background: #eff6ff;
      border: 1px dashed #3b82f6;
      border-radius: 6px;
      padding: 12px;
      font-size: 11.5px;
      color: #1e40af;
      margin-bottom: 30px;
      line-height: 1.6;
    }
    .signatures {
      display: flex;
      justify-content: space-between;
      text-align: center;
      margin-top: 20px;
      padding: 0 40px;
    }
    .sig-block {
      width: 220px;
    }
    .sig-title {
      font-weight: 700;
      font-size: 13px;
      margin-bottom: 4px;
    }
    .sig-sub {
      font-size: 11px;
      color: #64748b;
      margin-bottom: 60px;
    }
    .sig-name {
      font-weight: 600;
      font-size: 12px;
      border-top: 1px dotted #94a3b8;
      padding-top: 6px;
    }
    @media print {
      body { padding: 0; }
      .invoice-container { border: none; padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align: center; margin-bottom: 16px; display: flex; justify-content: center; gap: 10px;">
    <button onclick="window.print()" style="padding: 10px 24px; background: #2563eb; color: #fff; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 14px;">
      🖨️ IN HÓA ĐƠN NGAY
    </button>
    <button onclick="window.close()" style="padding: 10px 20px; background: #e2e8f0; color: #334155; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 14px;">
      Đóng Cửa Sổ
    </button>
  </div>

  <div class="invoice-container">
    <table class="header-table">
      <tr>
        <td style="vertical-align: top;">
          <div class="brand-title">⚡ SMARTSTORE</div>
          <div class="brand-sub">Hệ Thống Bán Lẻ Smartphone & Gaming Phone Chính Hãng Hàng Đầu</div>
          <div class="brand-sub">📍 Địa chỉ: Trịnh Văn Bô, Nam Từ Liêm, Hà Nội (FPT Polytechnic)</div>
          <div class="brand-sub">📞 Hotline: 1800.2026 (Miễn phí) - Website: smartstore.vn</div>
        </td>
        <td style="vertical-align: top; text-align: right;">
          <div style="font-size: 14px; font-weight: 700; color: #2563eb;">MÃ ĐƠN HÀNG:</div>
          <div style="font-size: 18px; font-weight: 800; color: #0f172a;">${d.orderCode}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Ngày lập: ${ngayDat}</div>
          <div style="font-size: 12px; color: #10b981; font-weight: 700; margin-top: 4px;">✓ Đã xác thực bảo hành</div>
        </td>
      </tr>
    </table>

    <div class="invoice-title">
      <h1>HÓA ĐƠN BÁN HÀNG KIÊM PHIẾU BẢO HÀNH ĐIỆN TỬ</h1>
      <p>(Bản in lưu trữ đối soát khách hàng & bảo hành chính hãng SmartStore)</p>
    </div>

    <div class="info-grid">
      <div>
        <div class="info-line"><strong>Khách hàng:</strong> ${d.customerName}</div>
        <div class="info-line"><strong>Điện thoại:</strong> ${d.customerPhone}</div>
        <div class="info-line"><strong>Email:</strong> ${d.customerEmail || 'Chưa cung cấp'}</div>
      </div>
      <div>
        <div class="info-line"><strong>Địa chỉ nhận:</strong> ${d.customerAddress}</div>
        <div class="info-line"><strong>Phương thức TT:</strong> ${d.paymentMethod === 'COD' ? 'Tiền mặt khi nhận hàng (COD)' : (d.paymentMethod === 'BANK' ? 'Chuyển khoản VietQR' : 'VNPAY / Thẻ tín dụng')}</div>
        <div class="info-line"><strong>Ghi chú đơn:</strong> ${d.note || 'Giao hàng tiêu chuẩn'}</div>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 40px; text-align: center;">STT</th>
          <th>Tên Sản Phẩm / Thiết Bị</th>
          <th style="width: 110px; text-align: right;">Đơn Giá</th>
          <th style="width: 70px; text-align: center;">SL</th>
          <th style="width: 130px; text-align: right;">Thành Tiền</th>
        </tr>
      </thead>
      <tbody>
        ${(d.items || []).map((item, idx) => `
          <tr>
            <td style="text-align: center; color: #64748b;">${idx + 1}</td>
            <td>
              <strong style="color: #0f172a;">${item.name}</strong>
              <div style="font-size: 11px; color: #64748b;">Bảo hành chính hãng 12 tháng tại SmartStore</div>
            </td>
            <td style="text-align: right;">${Number(item.price).toLocaleString('vi-VN')} đ</td>
            <td style="text-align: center; font-weight: 700;">${item.quantity}</td>
            <td style="text-align: right; font-weight: 700;">${(item.price * item.quantity).toLocaleString('vi-VN')} đ</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="summary-box">
      <div class="summary-row">
        <span>Tạm tính tổng sản phẩm:</span>
        <strong>${Number(tamTinh).toLocaleString('vi-VN')} đ</strong>
      </div>
      ${d.voucherCode ? `
        <div class="summary-row" style="color: #ef4444;">
          <span>Giảm giá Voucher [${d.voucherCode}]:</span>
          <strong>-${Number(giamGia).toLocaleString('vi-VN')} đ</strong>
        </div>
      ` : ''}
      <div class="summary-row">
        <span>Phí vận chuyển giao tận nhà:</span>
        <strong style="color: #10b981;">0 đ (Miễn Phí)</strong>
      </div>
      <div class="summary-row total">
        <span>TỔNG THANH TOÁN:</span>
        <span>${Number(tongTien).toLocaleString('vi-VN')} đ</span>
      </div>
    </div>
    <div class="clear"></div>

    <div class="policy-box">
      <strong>CHÍNH SÁCH BẢO HÀNH & ĐỔI TRẢ SMARTSTORE VIỆT NAM:</strong><br>
      • Đổi mới 100% trong 30 ngày đầu tiên nếu máy phát sinh lỗi phần cứng từ nhà sản xuất.<br>
      • Bảo hành chính hãng 12 tháng toàn diện bao gồm cả Nguồn & Màn hình cảm ứng.<br>
      • Quý khách vui lòng giữ lại hóa đơn này hoặc tra cứu mã đơn <strong>${d.orderCode}</strong> trên website để được tiếp nhận bảo hành nhanh chóng.
    </div>

    <div class="signatures">
      <div class="sig-block">
        <div class="sig-title">KHÁCH HÀNG NHẬN HÀNG</div>
        <div class="sig-sub">(Ký & ghi rõ họ tên)</div>
        <div class="sig-name">${d.customerName}</div>
      </div>
      <div class="sig-block">
        <div class="sig-title">ĐẠI DIỆN SMARTSTORE</div>
        <div class="sig-sub">(Ký duyệt, đóng dấu & xuất kho)</div>
        <div class="sig-name">Bộ Phận Kho Vận & Tài Chính</div>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 300);
    };
  <\/script>
</body>
</html>
  `;

  popup.document.open();
  popup.document.write(html);
  popup.document.close();
}

/**
 * 🎯 Mục đích: Mở modal xem trước toàn bộ chi tiết Hóa Đơn Bán Hàng trên giao diện trước khi in
 * 🔄 Luồng bảo vệ đồ án ASM (6 BƯỚC CHUẨN MỰC TỪ FRONTEND ĐẾN BACKEND):
 *   1. Trigger UI: Khách hàng nhấn nút "Xem Hóa Đơn" tại màn hình cảm ơn (#view-thankyou).
 *   2. Bắt sự kiện: window.cartModule.viewInvoice() được gọi.
 *   3. Trích xuất dữ liệu: Lấy đối tượng đơn hàng trong state `donHangVuaDat`.
 *   4. Render Giao Diện Hóa Đơn On-screen: Sinh cấu trúc HTML trực quan gồm Header SmartStore, Mã đơn, Khách hàng, Bảng món, Chiết khấu Voucher, Tổng thanh toán, Chính sách bảo hành.
 *   5. Kích hoạt Modal: moModal('customer-invoice-modal') hiển thị khung xem trước.
 *   6. Phân luồng In Ấn: Người dùng xem kỹ toàn bộ thông tin trên màn hình, sau đó có thể nhấn nút "In Hóa Đơn Này" trong modal để gọi lệnh in.
 */
function xemHoaDon(donHang) {
  const d = donHang || donHangVuaDat;
  if (!d) {
    hienThongBao('Không có thông tin đơn hàng vừa đặt để xem hóa đơn!', 'warning');
    return;
  }

  const bodyEl = document.getElementById('customer-invoice-body');
  if (!bodyEl) return;

  const ngayDat = new Date(d.createdAt || Date.now()).toLocaleString('vi-VN');
  const giamGia = Number(d.discountAmount) || 0;
  const tamTinh = d.subtotal || ((d.items || []).reduce((s, i) => s + (i.price * i.quantity), 0)) || d.totalAmount;
  const tongTien = d.totalAmount || tamTinh;

  bodyEl.innerHTML = `
    <div style="background: #ffffff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 24px; font-size: 13px; line-height: 1.6; color: var(--text);">
      <!-- Header Hóa Đơn -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid var(--primary); padding-bottom: 16px; margin-bottom: 18px; flex-wrap: wrap; gap: 14px;">
        <div>
          <div style="font-size: 22px; font-weight: 800; color: var(--primary); letter-spacing: 0.5px;">⚡ SMARTSTORE</div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Hệ Thống Bán Lẻ Smartphone & Gaming Phone Chính Hãng</div>
          <div style="font-size: 12px; color: var(--text-muted);">📍 Địa chỉ: Trịnh Văn Bô, Nam Từ Liêm, Hà Nội (FPT Polytechnic)</div>
          <div style="font-size: 12px; color: var(--text-muted);">📞 Hotline: 1800.2026 (Miễn phí) - smartstore.vn</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 12px; font-weight: 700; color: var(--text-muted);">MÃ ĐƠN HÀNG:</div>
          <div style="font-size: 18px; font-weight: 800; color: var(--primary);">${d.orderCode}</div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Ngày lập: ${ngayDat}</div>
          <span class="badge" style="background: #dcfce7; color: #15803d; border: 1px solid #86efac; font-weight: 700; font-size: 11px; margin-top: 4px; display: inline-block;">
            ✓ Đã xác thực bảo hành điện tử
          </span>
        </div>
      </div>

      <!-- Tiêu đề chứng từ -->
      <div style="text-align: center; margin-bottom: 18px;">
        <h2 style="font-size: 18px; font-weight: 800; color: var(--text); text-transform: uppercase; margin-bottom: 4px;">
          HÓA ĐƠN BÁN HÀNG KIÊM PHIẾU BẢO HÀNH ĐIỆN TỬ
        </h2>
        <p style="font-size: 12px; color: var(--text-muted);">(Bản lưu đối soát khách hàng & bảo hành chính hãng SmartStore)</p>
      </div>

      <!-- Khung thông tin khách hàng -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: #f8fafc; padding: 14px 16px; border-radius: var(--radius-md); margin-bottom: 18px; border: 1px solid var(--border);">
        <div>
          <div><strong>Khách hàng:</strong> ${d.customerName}</div>
          <div><strong>Số điện thoại:</strong> ${d.customerPhone}</div>
          <div><strong>Email:</strong> ${d.customerEmail || 'Chưa cung cấp'}</div>
        </div>
        <div>
          <div><strong>Địa chỉ nhận hàng:</strong> ${d.customerAddress}</div>
          <div><strong>Phương thức thanh toán:</strong> ${d.paymentMethod === 'COD' ? 'Tiền mặt khi nhận hàng (COD)' : (d.paymentMethod === 'BANK' ? 'Chuyển khoản VietQR' : 'Ví VNPAY')}</div>
          <div><strong>Ghi chú đơn:</strong> ${d.note || 'Giao hàng tiêu chuẩn'}</div>
        </div>
      </div>

      <!-- Bảng chi tiết sản phẩm -->
      <table class="cart-table" style="margin-bottom: 18px; width: 100%;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="width: 40px; text-align: center;">STT</th>
            <th>Tên Sản Phẩm / Thiết Bị</th>
            <th style="text-align: right; width: 120px;">Đơn Giá</th>
            <th style="text-align: center; width: 70px;">SL</th>
            <th style="text-align: right; width: 140px;">Thành Tiền</th>
          </tr>
        </thead>
        <tbody>
          ${(d.items || []).map((item, idx) => `
            <tr>
              <td style="text-align: center; color: var(--text-muted);">${idx + 1}</td>
              <td>
                <strong>${item.name}</strong>
                <div style="font-size: 11px; color: var(--text-muted);">Bảo hành chính hãng 12 tháng tại SmartStore</div>
              </td>
              <td style="text-align: right;">${dinhDangTien(item.price)}</td>
              <td style="text-align: center; font-weight: 700;">${item.quantity}</td>
              <td style="text-align: right; font-weight: 700; color: var(--text);">${dinhDangTien(item.price * item.quantity)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Bảng tóm tắt tài chính -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
        <div style="width: 320px;">
          <div style="display: flex; justify-content: space-between; padding: 4px 0;">
            <span>Tạm tính tổng sản phẩm:</span>
            <strong>${dinhDangTien(tamTinh)}</strong>
          </div>
          ${d.voucherCode ? `
            <div style="display: flex; justify-content: space-between; padding: 4px 0; color: var(--accent);">
              <span>Giảm giá Voucher [${d.voucherCode}]:</span>
              <strong>-${dinhDangTien(giamGia)}</strong>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; padding: 4px 0;">
            <span>Phí vận chuyển:</span>
            <strong style="color: var(--success);">0 đ (Miễn Phí)</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 10px 0 0; border-top: 2px solid var(--primary); margin-top: 6px; font-size: 15px;">
            <strong style="color: var(--text);">TỔNG THANH TOÁN:</strong>
            <strong style="color: var(--accent); font-size: 17px;">${dinhDangTien(tongTien)}</strong>
          </div>
        </div>
      </div>

      <!-- Chính sách bảo hành -->
      <div style="background: #eff6ff; border: 1px dashed #3b82f6; border-radius: var(--radius-md); padding: 12px 14px; font-size: 12px; color: #1e40af; margin-bottom: 24px; line-height: 1.6;">
        <strong>CHÍNH SÁCH BẢO HÀNH & ĐỔI TRẢ SMARTSTORE VIỆT NAM:</strong><br>
        • Đổi mới 100% trong 30 ngày đầu tiên nếu máy phát sinh lỗi phần cứng từ nhà sản xuất.<br>
        • Bảo hành chính hãng 12 tháng toàn diện bao gồm cả Nguồn & Màn hình cảm ứng.<br>
        • Mã đơn <strong>${d.orderCode}</strong> đã được lưu trên hệ thống điện tử. Quý khách có thể tra cứu trạng thái đơn bất cứ lúc nào.
      </div>

      <!-- Chữ ký điện tử -->
      <div style="display: flex; justify-content: space-between; text-align: center; padding: 0 30px;">
        <div style="width: 200px;">
          <div style="font-weight: 700; margin-bottom: 2px;">KHÁCH HÀNG NHẬN HÀNG</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 50px;">(Ký & ghi rõ họ tên)</div>
          <div style="font-weight: 600; border-top: 1px dotted #94a3b8; padding-top: 6px;">${d.customerName}</div>
        </div>
        <div style="width: 200px;">
          <div style="font-weight: 700; margin-bottom: 2px;">ĐẠI DIỆN SMARTSTORE</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 50px;">(Ký duyệt & xuất kho)</div>
          <div style="font-weight: 600; border-top: 1px dotted #94a3b8; padding-top: 6px;">Bộ Phận Kho Vận & Kế Toán</div>
        </div>
      </div>
    </div>
  `;

  moModal('customer-invoice-modal');
}

/**
 * 🎯 Mục đích: Điều hướng người dùng xem danh sách đơn hàng đã mua
 * 🔄 Luồng phân luồng thông minh:
 *   - Nếu khách ĐÃ ĐĂNG NHẬP: Chuyển sang trang Profile (#view-profile) chứa đầy đủ lịch sử đơn hàng.
 *   - Nếu khách là VÃNG LAI (chưa đăng nhập): Tự động điền mã đơn vừa đặt vào ô tra cứu và chuyển sang trang Tra Cứu (#view-tracking).
 */
function xemDonHangCuaToi() {
  if (nguoiDungHienTai) {
    chuyenTrang('profile');
  } else if (donHangVuaDat && donHangVuaDat.orderCode) {
    traCuuTheoMa(donHangVuaDat.orderCode);
  } else {
    chuyenTrang('tracking');
  }
}

// ============================================================================
// 3. TRA CỨU ĐƠN HÀNG (ORDER TRACKING)
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
  const input = document.getElementById('tracking-input').value.trim();
  if (!input) {
    hienThongBao('Vui lòng nhập Mã đơn hàng hoặc Số điện thoại!', 'warning');
    return;
  }

  const resultBox = document.getElementById('tracking-result-box');
  if (!resultBox) return;

  try {
    const res = await fetch(`${API_URL}/orders`);
    const allOrders = await res.json();

    const don = allOrders.find(d => 
      (d.orderCode && d.orderCode.toLowerCase() === input.toLowerCase()) ||
      (d.customerPhone && d.customerPhone === input)
    );

    if (!don) {
      resultBox.style.display = 'block';
      resultBox.innerHTML = `
        <div style="background: #fff; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center;">
          <i class="fa-solid fa-file-circle-xmark" style="font-size: 40px; color: #ef4444; margin-bottom: 12px;"></i>
          <h3>Không tìm thấy đơn hàng nào!</h3>
          <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Vui lòng kiểm tra lại mã đơn hàng hoặc số điện thoại.</p>
        </div>
      `;
      return;
    }

    resultBox.style.display = 'block';
    resultBox.innerHTML = `
      <div style="background: #fff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
          <div>
            <div style="font-size: 12px; color: #64748b;">MÃ ĐƠN HÀNG:</div>
            <h3 style="color: var(--primary);">${don.orderCode}</h3>
          </div>
          <div>
            <span class="badge status-${don.status}">${don.status === 'processing' ? 'Chờ xử lý' : (don.status === 'shipping' ? 'Đang giao' : (don.status === 'delivered' ? 'Đã giao' : 'Đã hủy'))}</span>
          </div>
        </div>
        <div style="font-size: 13px; line-height: 1.7; margin-bottom: 14px;">
          <div><strong>Người nhận:</strong> ${don.customerName} (${don.customerPhone})</div>
          <div><strong>Địa chỉ:</strong> ${don.customerAddress}</div>
          <div><strong>Tổng tiền:</strong> <strong style="color: var(--accent); font-size: 15px;">${dinhDangTien(don.totalAmount)}</strong></div>
        </div>
        <h4 style="font-size: 13px; margin-bottom: 8px;">Sản phẩm:</h4>
        ${don.items.map(i => `
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 4px;">
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
