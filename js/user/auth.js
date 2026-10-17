/**
 * ============================================================================
 * DỰ ÁN: SMARTSTORE - THẾ GIỚI SMARTPHONE & GAMING PHONE
 * MODULE: js/user/auth.js (XÁC THỰC THÔNG MINH, SMART IDENTITY RESOLUTION & HỒ SƠ)
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * Sinh viên thực hiện: Lương Văn Dũng
 * ============================================================================
 */

// ============================================================================
// 1. NGHIỆP VỤ ĐĂNG NHẬP, ĐĂNG KÝ & ĐIỀU HƯỚNG THÔNG MINH (AUTH & SMART REDIRECT)
// ============================================================================

/**
 * 🎯 Mục đích: Điều hướng thông minh sau khi đăng nhập hoặc đăng ký thành công
 * 🛒 Luồng TMĐT: Nếu trước đó khách đang tiến hành thanh toán giỏ hàng (Checkout) -> Chuyển thẳng về Checkout
 *               Ngược lại (đăng nhập thông thường) -> Chuyển về Trang Chủ.
 */
function dieuHuongSauXacThuc() {
  const redirectTarget = sessionStorage.getItem('smartstore_auth_redirect');
  sessionStorage.removeItem('smartstore_auth_redirect');

  if (redirectTarget === 'checkout' && gioHang.length > 0) {
    hienThongBao('Đang chuyển đến màn hình Thanh toán đơn hàng của bạn...', 'info');
    chuyenTrang('checkout');
  } else {
    chuyenTrang('home');
  }
}

/**
 * 🎯 Mục đích: Xử lý đăng nhập tài khoản người dùng
 * ⚙️ Hàm có sẵn: fetch, Array.prototype.find, localStorage.setItem
 * 🔄 Luồng chạy:
 *   1. Lấy toàn bộ danh sách users từ API CSDL.
 *   2. Tìm user khớp email (hoặc username) và so khớp mật khẩu bằng chuỗi JS (tránh lỗi ép kiểu json-server).
 *   3. Nếu đúng: Lưu vào LocalStorage, cập nhật Header, thông báo thành công và chuyển hướng thông minh.
 */
async function xuLyDangNhap(email, matKhau) {
  if (!email || !matKhau) {
    hienThongBao('Vui lòng nhập đầy đủ Email và Mật khẩu!', 'warning');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/users`);
    const allUsers = await res.json();

    const user = allUsers.find(u => {
      const emailKhop = (u.email && u.email.toLowerCase().trim() === email.toLowerCase().trim()) ||
                        (u.username && u.username.toLowerCase().trim() === email.toLowerCase().trim());
      const passKhop = String(u.password).trim() === String(matKhau).trim();
      return emailKhop && passKhop;
    });

    if (user) {
      nguoiDungHienTai = user;
      localStorage.setItem('smartstore_user', JSON.stringify(user));
      capNhatNguoiDungHeader();
      hienThongBao(`Chào mừng ${user.fullName || user.name || 'bạn'} đã đăng nhập!`, 'success');
      dieuHuongSauXacThuc();
    } else {
      hienThongBao('Sai Email hoặc Mật khẩu đăng nhập!', 'error');
    }
  } catch (loi) {
    console.error(loi);
    hienThongBao('Lỗi kết nối máy chủ khi đăng nhập!', 'error');
  }
}

/**
 * 🎯 Mục đích: Xử lý đăng ký tài khoản với cơ chế Nhận diện Thông minh (Smart Identity Resolution)
 * 🔄 Luồng chạy:
 *   1. Tra cứu xem email hoặc SĐT đã tồn tại trong CSDL chưa.
 *   2. NẾU ĐÃ TỒN TẠI:
 *      - Khớp mật khẩu -> Tự động đăng nhập luôn (Auto-login).
 *      - Sai mật khẩu -> Mở hộp thoại "#smart-identity-box": "Có phải bạn là [Tên] không? Nhập mật khẩu để đăng nhập."
 *   3. NẾU CHƯA TỒN TẠI: Tự động tính ID mới (+1 Max ID) -> Gửi POST tạo tài khoản mới -> Tự động đăng nhập.
 */
async function xuLyDangKy(ten, email, sdt, diaChi, matKhau) {
  if (!ten || !email || !sdt || !matKhau) {
    hienThongBao('Vui lòng điền đầy đủ các trường thông tin bắt buộc!', 'warning');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/users`);
    const allUsers = await res.json();

    // 1. Kiểm tra tài khoản đã tồn tại qua Email hoặc Số điện thoại
    const userDaCo = allUsers.find(u => 
      (u.email && u.email.toLowerCase().trim() === email.toLowerCase().trim()) ||
      (u.phone && u.phone.trim() === sdt.trim())
    );

    if (userDaCo) {
      // Trường hợp A: Đúng mật khẩu -> Tự động đăng nhập luôn
      if (String(userDaCo.password).trim() === String(matKhau).trim()) {
        nguoiDungHienTai = userDaCo;
        localStorage.setItem('smartstore_user', JSON.stringify(userDaCo));
        capNhatNguoiDungHeader();
        hienThongBao(`Tài khoản đã tồn tại - Tự động đăng nhập thành công cho ${userDaCo.fullName || userDaCo.name}!`, 'success');
        dieuHuongSauXacThuc();
        return;
      }

      // Trường hợp B: Sai mật khẩu -> Kích hoạt cơ chế Smart Identity Resolution
      pendingSmartUser = userDaCo;
      const box = document.getElementById('smart-identity-box');
      const nameEl = document.getElementById('smart-user-name') || document.getElementById('smart-identity-name');
      const passInput = document.getElementById('smart-login-password');

      if (box) {
        if (nameEl) nameEl.textContent = userDaCo.fullName || userDaCo.name || 'Quý khách';
        box.style.display = 'block';
        if (passInput) {
          passInput.value = '';
          passInput.focus();
        }
        hienThongBao('Email hoặc Số điện thoại này đã được đăng ký trước đó!', 'info');
      }
      return;
    }

    // 2. Nếu là tài khoản hoàn toàn mới: Tính ID tự động tăng dần liên tục (+1)
    const cacIdSo = allUsers.map(u => Number(u.id)).filter(id => !isNaN(id) && id > 0);
    const maxId = cacIdSo.length > 0 ? Math.max(...cacIdSo) : 0;
    const idMoi = String(maxId + 1);

    const userMoi = {
      id: idMoi,
      name: ten,
      fullName: ten,
      email: email,
      phone: sdt,
      address: diaChi || '',
      password: matKhau,
      role: 'khachhang',
      createdAt: new Date().toISOString()
    };

    const resTao = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userMoi)
    });
    const userDaLuu = await resTao.json();

    nguoiDungHienTai = userDaLuu;
    localStorage.setItem('smartstore_user', JSON.stringify(userDaLuu));
    capNhatNguoiDungHeader();
    hienThongBao('Đăng ký tài khoản mới thành công! Chào mừng bạn.', 'success');
    dieuHuongSauXacThuc();
  } catch (loi) {
    console.error(loi);
    hienThongBao('Lỗi khi đăng ký tài khoản!', 'error');
  }
}

/**
 * 🎯 Mục đích: Xử lý xác nhận mật khẩu trong hộp thoại Smart Identity
 */
function xuLySmartLoginSubmit() {
  if (!pendingSmartUser) return;
  const pass = document.getElementById('smart-login-password').value.trim();

  if (!pass) {
    hienThongBao('Vui lòng nhập mật khẩu tài khoản!', 'warning');
    return;
  }

  if (String(pendingSmartUser.password).trim() === String(pass).trim()) {
    nguoiDungHienTai = pendingSmartUser;
    localStorage.setItem('smartstore_user', JSON.stringify(pendingSmartUser));
    capNhatNguoiDungHeader();
    hienThongBao(`Đăng nhập thành công! Chào mừng ${pendingSmartUser.fullName || pendingSmartUser.name}.`, 'success');
    huySmartLogin();
    dieuHuongSauXacThuc();
  } else {
    hienThongBao('Mật khẩu không chính xác, vui lòng thử lại!', 'error');
  }
}

function huySmartLogin() {
  pendingSmartUser = null;
  const box = document.getElementById('smart-identity-box');
  if (box) box.style.display = 'none';
}

function dangXuat() {
  nguoiDungHienTai = null;
  localStorage.removeItem('smartstore_user');
  capNhatNguoiDungHeader();
  hienThongBao('Đã đăng xuất tài khoản thành công', 'info');
  chuyenTrang('home');
}

// ============================================================================
// 2. QUẢN LÝ HỒ SƠ CÁ NHÂN & ĐƠN HÀNG ĐÃ MUA
// ============================================================================

/**
 * 🎯 Mục đích: Hiển thị thông tin cá nhân và lịch sử các đơn hàng đã đặt
 */
async function hienThiThongTinCaNhan() {
  if (!nguoiDungHienTai) {
    chuyenTrang('auth');
    return;
  }

  const u = nguoiDungHienTai;
  const displayName = document.getElementById('profile-display-name');
  if (displayName) displayName.textContent = u.fullName || u.name || 'Khách Hàng';

  const nameInput = document.getElementById('profile-name');
  if (nameInput) nameInput.value = u.fullName || u.name || '';

  const emailInput = document.getElementById('profile-email');
  if (emailInput) emailInput.value = u.email || '';

  const phoneInput = document.getElementById('profile-phone');
  if (phoneInput) phoneInput.value = u.phone || '';

  const addrInput = document.getElementById('profile-address');
  if (addrInput) addrInput.value = u.address || '';

  const passInput = document.getElementById('profile-password');
  if (passInput) passInput.value = '';

  // Tải danh sách đơn hàng của riêng người dùng này
  const tbody = document.getElementById('user-orders-tbody') || document.getElementById('profile-orders-tbody');
  if (!tbody) return;

  try {
    const res = await fetch(`${API_URL}/orders`);
    const allOrders = await res.json();

    const donCuaToi = allOrders.filter(d => 
      (d.userId && String(d.userId) === String(u.id)) ||
      (d.customerPhone && d.customerPhone === u.phone) ||
      (d.customerEmail && d.customerEmail === u.email)
    );

    if (donCuaToi.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:#94a3b8;">Bạn chưa có đơn hàng nào tại SmartStore.</td></tr>`;
      return;
    }

    tbody.innerHTML = donCuaToi.reverse().map(d => `
      <tr>
        <td><strong>${d.orderCode}</strong></td>
        <td>${new Date(d.createdAt).toLocaleDateString('vi-VN')}</td>
        <td style="font-weight:700; color:var(--accent);">${dinhDangTien(d.totalAmount)}</td>
        <td>${d.paymentMethod || 'COD'}</td>
        <td>
          <span class="badge status-${d.status}">
            ${d.status === 'processing' ? 'Chờ xử lý' : (d.status === 'shipping' ? 'Đang giao' : (d.status === 'delivered' ? 'Đã giao' : 'Đã hủy'))}
          </span>
        </td>
        <td style="text-align:center;">
          <div style="display: flex; gap: 6px; justify-content: center; align-items: center;">
            <button class="btn-primary btn-sm" onclick="traCuuTheoMa('${d.orderCode}')" title="Tra cứu tiến độ">
              <i class="fa-solid fa-truck-fast"></i> Xem
            </button>
            ${d.status === 'processing' ? `
              <button class="btn-danger btn-sm" onclick="huyDonHangKhach('${d.id}', '${d.orderCode}')" title="Hủy đơn hàng này">
                <i class="fa-solid fa-ban"></i> Hủy
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  } catch (loi) {
    console.error('Lỗi tải đơn hàng cá nhân:', loi);
  }
}

async function luuSuaThongTinCaNhan() {
  if (!nguoiDungHienTai) return;

  const nameEl = document.getElementById('profile-name') || document.getElementById('edit-profile-name');
  const phoneEl = document.getElementById('profile-phone') || document.getElementById('edit-profile-phone');
  const addrEl = document.getElementById('profile-address') || document.getElementById('edit-profile-address');
  const passEl = document.getElementById('profile-password');

  const tenMoi = nameEl ? nameEl.value.trim() : '';
  const sdtMoi = phoneEl ? phoneEl.value.trim() : '';
  const diaChiMoi = addrEl ? addrEl.value.trim() : '';
  const passMoi = passEl ? passEl.value.trim() : '';

  if (!tenMoi || !sdtMoi) {
    hienThongBao('Vui lòng điền Họ tên và SĐT!', 'warning');
    return;
  }

  try {
    const payload = {
      fullName: tenMoi,
      name: tenMoi,
      phone: sdtMoi,
      address: diaChiMoi
    };
    if (passMoi) payload.password = passMoi;

    const res = await fetch(`${API_URL}/users/${nguoiDungHienTai.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const userCapNhat = await res.json();

    nguoiDungHienTai = userCapNhat;
    localStorage.setItem('smartstore_user', JSON.stringify(userCapNhat));
    capNhatNguoiDungHeader();
    hienThongBao('Đã cập nhật thông tin cá nhân thành công!', 'success');
    hienThiThongTinCaNhan();
  } catch (loi) {
    console.error(loi);
    hienThongBao('Lỗi cập nhật hồ sơ!', 'error');
  }
}

/**
 * 🎯 Mục đích: Khách hàng tự hủy đơn hàng khi đơn còn ở trạng thái "Chờ xử lý" (processing)
 * 📦 Đồng bộ tồn kho: Hoàn trả số lượng máy về kho và tăng tính chủ động cho người mua
 * 🔔 Xác nhận: Bắt buộc có thông báo xác nhận trước khi hủy
 */
async function huyDonHangKhach(idDon, maDon) {
  if (!confirm(`XÁC NHẬN HỦY ĐƠN HÀNG #${maDon}:\n\nBạn có chắc chắn muốn hủy đơn hàng này không?\nToàn bộ sản phẩm sẽ được hoàn trả về tồn kho của hệ thống.`)) {
    return;
  }

  try {
    const res = await fetch(`${API_URL}/orders/${idDon}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' })
    });
    const donCapNhat = await res.json();

    // Hoàn trả tồn kho cho các sản phẩm trong đơn
    if (donCapNhat.items && donCapNhat.items.length > 0) {
      const restorePromises = donCapNhat.items.map(async item => {
        const resSp = await fetch(`${API_URL}/products/${item.id}`);
        if (resSp.ok) {
          const sp = await resSp.json();
          const khoMoi = (Number(sp.stock) || 0) + (Number(item.quantity) || 0);
          const daBanMoi = Math.max(0, (Number(sp.sold) || 0) - (Number(item.quantity) || 0));
          return fetch(`${API_URL}/products/${item.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stock: khoMoi, quantity: khoMoi, sold: daBanMoi })
          });
        }
      });
      await Promise.all(restorePromises);
    }

    hienThongBao(`Đã hủy đơn hàng #${maDon} thành công. Tồn kho đã được hoàn trả!`, 'info');
    hienThiThongTinCaNhan();
    taiDuLieu();
  } catch (loi) {
    console.error(loi);
    hienThongBao('Lỗi khi hủy đơn hàng!', 'error');
  }
}
