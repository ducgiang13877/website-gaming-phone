/**
 * ============================================================================
 * DỰ ÁN: SMARTSTORE - THẾ GIỚI SMARTPHONE & GAMING PHONE
 * MODULE: js/admin/customers.js (QUẢN LÝ KHÁCH HÀNG & BẢO VỆ ĐẶC QUYỀN ADMIN)
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * Sinh viên thực hiện: Lương Văn Dũng
 * ============================================================================
 */

// ============================================================================
// 1. QUẢN LÝ KHÁCH HÀNG (CUSTOMERS CRUD & SECURITY LOCK)
// ============================================================================

/**
 * 🎯 Mục đích: Render bảng danh sách khách hàng và quản trị viên
 */
function renderBangKhachHang() {
  const tbody = document.getElementById('admin-customers-tbody');
  if (!tbody) return;

  const tuKhoa = (document.getElementById('admin-search-customer')?.value || '').toLowerCase().trim();

  let ketQua = [...dsKhachHang];
  if (tuKhoa !== '') {
    ketQua = ketQua.filter(c => 
      (c.fullName || c.name || '').toLowerCase().includes(tuKhoa) ||
      (c.email || '').toLowerCase().includes(tuKhoa) ||
      (c.phone || '').includes(tuKhoa)
    );
  }

  tbody.innerHTML = ketQua.map(c => {
    const laAdmin = c.role === 'admin';
    return `
      <tr>
        <td><strong>#${c.id}</strong></td>
        <td>
          <strong>${c.fullName || c.name || 'Chưa đặt tên'}</strong>
          ${laAdmin ? '<span class="badge" style="background:#fef3c7; color:#b45309; margin-left:6px;"><i class="fa-solid fa-shield-halved"></i> Admin</span>' : ''}
        </td>
        <td>${c.email}</td>
        <td>${c.phone || '-'}</td>
        <td>${c.address || '-'}</td>
        <td>
          <span class="badge" style="${laAdmin ? 'background:#fee2e2; color:#b91c1c;' : 'background:#dcfce7; color:#15803d;'}">
            ${laAdmin ? 'Quản Trị Viên' : 'Khách Hàng'}
          </span>
        </td>
        <td style="text-align: center;">
          <button class="btn-secondary btn-sm" onclick="moSuaKhachHang('${c.id}')" title="Chỉnh sửa thông tin"><i class="fa-solid fa-user-pen"></i></button>
          <button class="btn-danger btn-sm" onclick="xacNhanXoa('customer', '${c.id}', '${(c.fullName || c.name).replace(/'/g, "\\'")}')" 
            title="${laAdmin ? 'Không được phép xóa tài khoản Quản trị viên' : 'Xóa khách hàng'}" 
            ${laAdmin ? 'disabled style="opacity: 0.35; cursor: not-allowed;"' : ''}>
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function moThemKhachHang() {
  document.getElementById('customer-form').reset();
  document.getElementById('cust-id').value = '';
  document.getElementById('customer-modal-title').textContent = 'Thêm Khách Hàng Mới (+1 ID Tự Động)';

  const roleSelect = document.getElementById('cust-role');
  if (roleSelect) {
    roleSelect.disabled = false;
    roleSelect.value = 'user';
  }
  const hint = document.getElementById('cust-role-hint');
  if (hint) hint.style.display = 'none';

  moModal('customer-modal');
}

/**
 * 🎯 Mục đích: Mở modal sửa thông tin tài khoản kèm nguyên tắc bảo vệ quyền Quản trị viên
 */
function moSuaKhachHang(idUser) {
  const c = dsKhachHang.find(item => item.id == idUser);
  if (!c) return;

  document.getElementById('cust-id').value = c.id;
  document.getElementById('cust-name').value = c.fullName || c.name || '';
  document.getElementById('cust-email').value = c.email || '';
  document.getElementById('cust-phone').value = c.phone || '';
  document.getElementById('cust-address').value = c.address || '';
  document.getElementById('cust-password').value = '';
  document.getElementById('customer-modal-title').textContent = `Chỉnh Sửa Tài Khoản #${c.id}`;

  const roleSelect = document.getElementById('cust-role');
  const hint = document.getElementById('cust-role-hint');

  // NGUYÊN TẮC BẢO MẬT: Khóa trường chọn vai trò nếu tài khoản đang sửa là Admin
  if (c.role === 'admin') {
    if (roleSelect) {
      roleSelect.value = 'admin';
      roleSelect.disabled = true;
    }
    if (hint) hint.style.display = 'block';
  } else {
    if (roleSelect) {
      roleSelect.value = c.role || 'user';
      roleSelect.disabled = false;
    }
    if (hint) hint.style.display = 'none';
  }

  moModal('customer-modal');
}

/**
 * 🎯 Mục đích: Lưu khách hàng (Thêm mới ID tăng dần hoặc Cập nhật)
 */
async function luuKhachHang() {
  const id = document.getElementById('cust-id').value;
  const ten = document.getElementById('cust-name').value.trim();
  const email = document.getElementById('cust-email').value.trim();
  const sdt = document.getElementById('cust-phone').value.trim();
  const diaChi = document.getElementById('cust-address').value.trim();
  const vaiTroChon = document.getElementById('cust-role').value;
  const passMoi = document.getElementById('cust-password').value.trim();

  if (!ten || !email || !sdt) {
    hienThongBao('Vui lòng điền đủ Họ tên, Email và SĐT!', 'error');
    return;
  }

  try {
    if (id) {
      // 1. Cập nhật khách hàng
      const userCu = dsKhachHang.find(c => c.id == id);
      let vaiTroThucTe = vaiTroChon;

      // Bảo vệ vai trò Admin không bị thay đổi
      if (userCu && userCu.role === 'admin') {
        vaiTroThucTe = 'admin';
        if (vaiTroChon !== 'admin') {
          hienThongBao('Bảo mật: Không được phép thay đổi vai trò của tài khoản Quản trị viên!', 'warning');
        }
      }

      const payload = {
        fullName: ten,
        email: email,
        phone: sdt,
        address: diaChi,
        role: vaiTroThucTe
      };
      if (passMoi) payload.password = passMoi;

      const res = await fetch(`${API_URL}/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const userCapNhat = await res.json();
      const viTri = dsKhachHang.findIndex(c => c.id == id);
      if (viTri > -1) dsKhachHang[viTri] = userCapNhat;
      hienThongBao('Cập nhật tài khoản thành công!', 'success');
    } else {
      // 2. Thêm mới tài khoản (+1 ID tự động)
      const cacIdSo = dsKhachHang.map(c => Number(c.id)).filter(n => !isNaN(n) && n > 0);
      const maxId = cacIdSo.length > 0 ? Math.max(...cacIdSo) : 0;
      const idMoi = String(maxId + 1);

      const payload = {
        id: idMoi,
        fullName: ten,
        email: email,
        phone: sdt,
        address: diaChi,
        role: vaiTroChon || 'user',
        password: passMoi || '123456',
        createdAt: new Date().toISOString()
      };

      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const userMoi = await res.json();
      dsKhachHang.push(userMoi);
      hienThongBao(`Thêm khách hàng thành công (Mã #${userMoi.id})!`, 'success');
    }

    dongModal('customer-modal');
    tinhToanKPI();
    renderBangKhachHang();
  } catch (loi) {
    console.error(loi);
    hienThongBao('Lỗi khi lưu thông tin khách hàng!', 'error');
  }
}
