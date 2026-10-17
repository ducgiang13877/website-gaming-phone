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
  gioHang = gioHang.filter(item => item.id != idSP);
  luuGioHang();
  hienThiGioHang();
  hienThongBao('Đã xóa sản phẩm khỏi giỏ hàng', 'info');
}

/**
 * 🎯 Mục đích: Làm trống toàn bộ giỏ hàng
 */
function xoaSachGioHang() {
  if (gioHang.length === 0) return;
  if (confirm('Bạn có chắc chắn muốn xóa hết sản phẩm trong giỏ hàng không?')) {
    gioHang = [];
    luuGioHang();
    hienThiGioHang();
    hienThongBao('Giỏ hàng đã được làm trống', 'info');
  }
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
            <div class="qty-btn-group" style="width: 100px;">
              <button onclick="doiSoLuongGioHang('${item.id}', -1)">-</button>
              <input type="number" value="${item.quantity}" readonly>
              <button onclick="doiSoLuongGioHang('${item.id}', 1)">+</button>
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
}

// ============================================================================
// 2. NGHIỆP VỤ THANH TOÁN (CHECKOUT) & HARD BLOCK ADMIN GUARD
// ============================================================================

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
  // Khách vãng lai thoải mái thêm giỏ, nhưng BẮT BUỘC đăng nhập/đăng ký khi tiến hành thanh toán
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

  document.getElementById('checkout-subtotal').textContent = dinhDangTien(tongTien);
  document.getElementById('checkout-grand-total').textContent = dinhDangTien(tongTien);

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
 * 🎯 Mục đích: Xử lý đặt hàng, lưu đơn vào API và tự động trừ kho sản phẩm
 * 🛡️ Bảo vệ nghiệp vụ: Chặn tuyệt đối tài khoản Quản trị viên (Admin)
 * ⚙️ Hàm có sẵn: fetch (POST, PATCH), Promise.all, Array.prototype.reduce, Date.now
 * 🔄 Luồng chạy:
 *   1. Kiểm tra quyền Admin -> Chặn và thông báo nếu là Admin
 *   2. Validate thông tin người nhận (Họ tên, SĐT, Địa chỉ)
 *   3. Tính tổng tiền và sinh mã đơn hàng chuẩn (#DH + 9 số ngẫu nhiên)
 *   4. Gửi POST /orders lưu đơn hàng mới
 *   5. Gọi song song PATCH /products/:id trừ tồn kho (stock) và tăng đã bán (sold)
 *   6. Làm trống giỏ hàng và chuyển sang trang Cảm Ơn.
 */
async function xuLyDatHang() {
  // 🛡️ CHẶN XÁC THỰC BƯỚC THANH TOÁN (CHECKOUT AUTH GUARD CHUẨN TMĐT):
  if (!nguoiDungHienTai) {
    sessionStorage.setItem('smartstore_auth_redirect', 'checkout');
    hienThongBao('Quý khách cần Đăng Nhập hoặc Đăng Ký tài khoản để hoàn tất đặt hàng!', 'warning');
    chuyenTrang('auth');
    return;
  }

  // 🎯 BẢO VỆ NGHIỆP VỤ (HARD BLOCK ADMIN): Chặn hoàn toàn nếu tài khoản đang đăng nhập là Admin
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
    totalAmount: tongTien,
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
    await Promise.all(updateKhoPromises);

    // 3. Xóa sạch giỏ hàng & chuyển sang trang Cảm Ơn
    gioHang = [];
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
      <div><strong>Phương thức:</strong> ${donHangVuaDat.paymentMethod}</div>
      <div><strong>Tổng tiền:</strong> <strong style="color: var(--accent); font-size: 15px;">${dinhDangTien(donHangVuaDat.totalAmount)}</strong></div>
      <div style="margin-top: 8px;"><strong>Sản phẩm (${donHangVuaDat.items.length}):</strong></div>
      <ul style="margin: 4px 0 0 16px; padding: 0;">
        ${donHangVuaDat.items.map(i => `<li>${i.name} (x${i.quantity}) - ${dinhDangTien(i.price * i.quantity)}</li>`).join('')}
      </ul>
    `;
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
