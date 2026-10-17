/**
 * ============================================================================
 * DỰ ÁN: SMARTSTORE - THẾ GIỚI SMARTPHONE & GAMING PHONE
 * MODULE: js/admin/orders.js (QUẢN LÝ ĐƠN HÀNG, HOÀN TỒN KHO TỰ ĐỘNG & FSM)
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * Sinh viên thực hiện: Lương Văn Dũng
 * ============================================================================
 */

// ============================================================================
// 1. QUẢN LÝ ĐƠN HÀNG (ORDERS DISPATCH & INLINE STATUS UPDATE)
// ============================================================================

/**
 * 🎯 Mục đích: Đổi trạng thái đơn hàng trực tiếp ngay trên từng dòng của bảng (Fast Inline Action)
 * 📦 Đồng bộ tồn kho: Tự động hoàn trả tồn kho khi chuyển sang "cancelled"
 * 🛡️ FSM Guard: Cảnh báo xác nhận nếu kích hoạt lại đơn đã hủy
 */
async function doiTrangThaiDonHangTrucTiep(idDon, trangThaiMoi, selectEl) {
  const donCu = dsDonHang.find(d => d.id == idDon);
  if (!donCu) return;
  const trangThaiCu = donCu.status;

  if (trangThaiCu === trangThaiMoi) return;

  // 🛡️ BẢO VỆ TRẠNG THÁI BẤT BIẾN (IMMUTABLE TERMINAL STATE CHUẨN TMĐT):
  // Khi đơn đã "delivered", tiền COD đã thu, hóa đơn tài chính đã chốt, hàng đã xuất kho.
  // Nghiêm cấm đổi ngược trạng thái để chống thất thoát tài chính và sai lệch tồn kho.
  if (trangThaiCu === 'delivered') {
    hienThongBao('An ninh: Đơn hàng đã GIAO THÀNH CÔNG và đóng sổ tài chính. Không thể thay đổi trạng thái!', 'error');
    if (selectEl) selectEl.value = 'delivered';
    return;
  }

  // 🛡️ FINITE STATE MACHINE (FSM): Cảnh báo nếu chuyển đổi từ trạng thái kết thúc (cancelled)
  if (trangThaiCu === 'cancelled' && !confirm('Đơn hàng này đã bị HỦY trước đó. Bạn có chắc chắn muốn kích hoạt lại đơn hàng và trừ lại tồn kho không?')) {
    if (selectEl) selectEl.value = trangThaiCu;
    return;
  }

  try {
    const res = await fetch(`${API_URL}/orders/${idDon}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: trangThaiMoi })
    });
    const donCapNhat = await res.json();

    const viTri = dsDonHang.findIndex(d => d.id == idDon);
    if (viTri > -1) dsDonHang[viTri] = donCapNhat;

    // 📦 ĐỒNG BỘ TỒN KHO THEO CHUẨN TMĐT:
    // Trường hợp 1: Chuyển sang "cancelled" -> Tự động hoàn trả tồn kho và giảm đã bán
    if (trangThaiCu !== 'cancelled' && trangThaiMoi === 'cancelled') {
      const restorePromises = (donCapNhat.items || []).map(async item => {
        const sp = dsSanPham.find(p => p.id == item.id);
        if (sp) {
          const khoMoi = (Number(sp.stock) || 0) + (Number(item.quantity) || 0);
          const daBanMoi = Math.max(0, (Number(sp.sold) || 0) - (Number(item.quantity) || 0));
          sp.stock = khoMoi;
          sp.quantity = khoMoi;
          sp.sold = daBanMoi;

          return fetch(`${API_URL}/products/${item.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stock: khoMoi, quantity: khoMoi, sold: daBanMoi })
          });
        }
      });
      await Promise.all(restorePromises);
      hienThongBao(`Đơn #${donCapNhat.orderCode} đã hủy: Tồn kho đã được hoàn trả tự động!`, 'info');
      renderBangSanPham();
    }
    // Trường hợp 2: Chuyển từ "cancelled" sang trạng thái khác -> Trừ lại kho
    else if (trangThaiCu === 'cancelled' && trangThaiMoi !== 'cancelled') {
      const deductPromises = (donCapNhat.items || []).map(async item => {
        const sp = dsSanPham.find(p => p.id == item.id);
        if (sp) {
          const khoMoi = Math.max(0, (Number(sp.stock) || 0) - (Number(item.quantity) || 0));
          const daBanMoi = (Number(sp.sold) || 0) + (Number(item.quantity) || 0);
          sp.stock = khoMoi;
          sp.quantity = khoMoi;
          sp.sold = daBanMoi;

          return fetch(`${API_URL}/products/${item.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stock: khoMoi, quantity: khoMoi, sold: daBanMoi })
          });
        }
      });
      await Promise.all(deductPromises);
      renderBangSanPham();
    }

    if (selectEl) {
      selectEl.className = `order-status-select status-${trangThaiMoi}`;
    }

    const tenTrangThaiMap = {
      processing: 'Chờ xử lý',
      shipping: 'Đang giao',
      delivered: 'Đã giao',
      cancelled: 'Đã hủy'
    };

    hienThongBao(`Đã đổi đơn #${donCapNhat.orderCode} sang "${tenTrangThaiMap[trangThaiMoi] || trangThaiMoi}"`, 'success');
    tinhToanKPI();
  } catch (loi) {
    console.error(loi);
    hienThongBao('Lỗi cập nhật trạng thái đơn hàng!', 'error');
  }
}

/**
 * 🎯 Mục đích: Render bảng đơn hàng kèm bộ lọc trạng thái và tìm kiếm mã đơn/SĐT
 */
function renderBangDonHang() {
  const tbody = document.getElementById('admin-orders-tbody');
  if (!tbody) return;

  const tuKhoa = (document.getElementById('admin-search-order')?.value || '').toLowerCase().trim();
  const trangThaiLoc = document.getElementById('admin-filter-order-status')?.value || 'all';

  let ketQua = [...dsDonHang];
  if (trangThaiLoc !== 'all') {
    ketQua = ketQua.filter(d => d.status === trangThaiLoc);
  }
  if (tuKhoa !== '') {
    ketQua = ketQua.filter(d => 
      (d.orderCode || '').toLowerCase().includes(tuKhoa) ||
      (d.customerPhone || '').includes(tuKhoa) ||
      (d.customerName || '').toLowerCase().includes(tuKhoa)
    );
  }

  // Sắp xếp đơn mới nhất lên đầu
  ketQua.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  tbody.innerHTML = ketQua.map(d => {
    return `
      <tr>
        <td><strong>${d.orderCode}</strong></td>
        <td>${d.customerName}</td>
        <td>${d.customerPhone}</td>
        <td>${new Date(d.createdAt).toLocaleDateString('vi-VN')}</td>
        <td style="font-weight:800; color:var(--accent);">${dinhDangTien(d.totalAmount)}</td>
        <td>${d.paymentMethod}</td>
        <td>
          ${d.status === 'delivered' ? `
            <span class="badge status-delivered" style="display:inline-flex; align-items:center; gap:6px; padding:6px 12px; font-weight:700; border-radius:20px; background:#dcfce7; color:#15803d; border:1px solid #86efac;" title="Đơn hàng đã giao thành công và đóng sổ (Bất biến theo chuẩn TMĐT)">
              <i class="fa-solid fa-circle-check"></i> Đã giao
            </span>
          ` : `
            <select class="order-status-select status-${d.status}" onchange="doiTrangThaiDonHangTrucTiep('${d.id}', this.value, this)" title="Bấm để đổi trực tiếp trạng thái đơn">
              <option value="processing" ${d.status === 'processing' ? 'selected' : ''}>Chờ xử lý</option>
              <option value="shipping" ${d.status === 'shipping' ? 'selected' : ''}>Đang giao</option>
              <option value="delivered">Đã giao</option>
              <option value="cancelled" ${d.status === 'cancelled' ? 'selected' : ''}>Đã hủy</option>
            </select>
          `}
        </td>
        <td style="text-align:center;">
          <button class="btn-primary btn-sm" onclick="moXemDonHang('${d.orderCode}')" title="Xem chi tiết đơn"><i class="fa-solid fa-eye"></i> Xem</button>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * 🎯 Mục đích: Mở modal xem chi tiết từng món hàng trong đơn và cập nhật trạng thái đơn
 */
function moXemDonHang(maDon) {
  const d = dsDonHang.find(item => item.orderCode === maDon);
  if (!d) return;

  donHangDangXem = d;
  document.getElementById('order-modal-title').textContent = `Chi Tiết Đơn Hàng ${d.orderCode}`;

  const body = document.getElementById('order-modal-body');
  if (body) {
    body.innerHTML = `
      <div style="background:#f8fafc; padding:12px; border-radius:8px; margin-bottom:14px; font-size:13px; line-height:1.7;">
        <div><strong>Khách hàng:</strong> ${d.customerName} - <strong>SĐT:</strong> ${d.customerPhone}</div>
        <div><strong>Địa chỉ:</strong> ${d.customerAddress}</div>
        <div><strong>Thanh toán:</strong> ${d.paymentMethod}</div>
        <div><strong>Tổng giá trị đơn:</strong> <strong style="color:var(--accent); font-size:15px;">${dinhDangTien(d.totalAmount)}</strong></div>
      </div>
      <table class="cart-table">
        <thead>
          <tr>
            <th>Món hàng</th>
            <th>Đơn giá</th>
            <th>Số lượng</th>
            <th>Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${(d.items || []).map(i => `
            <tr>
              <td>${i.name}</td>
              <td>${dinhDangTien(i.price)}</td>
              <td>${i.quantity}</td>
              <td><strong>${dinhDangTien(i.price * i.quantity)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  const selectStatus = document.getElementById('order-status-update-select');
  const btnSaveStatus = document.getElementById('btn-save-order-status');

  // Gỡ bỏ thông báo khóa bất biến cũ nếu có
  const oldNote = document.getElementById('order-delivered-immutable-note');
  if (oldNote) oldNote.remove();

  if (d.status === 'delivered') {
    if (selectStatus) {
      selectStatus.value = 'delivered';
      selectStatus.disabled = true;
      selectStatus.style.opacity = '0.65';
      selectStatus.style.cursor = 'not-allowed';
    }
    if (btnSaveStatus) {
      btnSaveStatus.disabled = true;
      btnSaveStatus.style.opacity = '0.5';
      btnSaveStatus.style.cursor = 'not-allowed';
      btnSaveStatus.title = 'Đơn hàng đã giao thành công và đóng sổ tài chính. Không thể sửa!';
    }
    if (body) {
      body.insertAdjacentHTML('beforeend', `
        <div id="order-delivered-immutable-note" style="margin-top:14px; padding:12px 14px; background:#f0fdf4; border:1px solid #bbf7d0; color:#166534; border-radius:8px; font-size:12px; font-weight:600; display:flex; align-items:center; gap:8px;">
          <i class="fa-solid fa-shield-halved" style="font-size:16px; color:#15803d;"></i>
          <span><strong>BẢO VỆ CHUẨN TMĐT:</strong> Đơn hàng đã giao nhận thành công và đóng sổ giao dịch. Trạng thái đã được <u>khóa bất biến</u> nhằm bảo toàn đối soát COD và tính toàn vẹn tồn kho!</span>
        </div>
      `);
    }
  } else {
    if (selectStatus) {
      selectStatus.value = d.status;
      selectStatus.disabled = false;
      selectStatus.style.opacity = '1';
      selectStatus.style.cursor = 'pointer';
    }
    if (btnSaveStatus) {
      btnSaveStatus.disabled = false;
      btnSaveStatus.style.opacity = '1';
      btnSaveStatus.style.cursor = 'pointer';
      btnSaveStatus.title = 'Lưu trạng thái mới';
    }
  }

  moModal('order-detail-modal');
}

/**
 * 🎯 Mục đích: Cập nhật trạng thái đơn hàng trong Modal và đồng bộ tồn kho
 */
async function capNhatTrangThaiDon() {
  if (!donHangDangXem) return;
  const selectStatus = document.getElementById('order-status-update-select');
  const trangThaiMoi = selectStatus.value;
  const trangThaiCu = donHangDangXem.status;

  if (trangThaiCu === trangThaiMoi) {
    dongModal('order-detail-modal');
    return;
  }

  // 🛡️ BẢO VỆ TRẠNG THÁI BẤT BIẾN (IMMUTABLE TERMINAL STATE CHUẨN TMĐT):
  if (trangThaiCu === 'delivered') {
    hienThongBao('An ninh: Đơn hàng đã GIAO THÀNH CÔNG và đóng sổ tài chính. Không thể thay đổi trạng thái!', 'error');
    dongModal('order-detail-modal');
    return;
  }

  // 🛡️ FINITE STATE MACHINE (FSM): Cảnh báo nếu chuyển đổi từ trạng thái kết thúc (cancelled)
  if (trangThaiCu === 'cancelled' && !confirm('Đơn hàng này đã bị HỦY trước đó. Bạn có chắc chắn muốn kích hoạt lại đơn hàng và trừ lại tồn kho không?')) {
    selectStatus.value = trangThaiCu;
    return;
  }

  try {
    const res = await fetch(`${API_URL}/orders/${donHangDangXem.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: trangThaiMoi })
    });
    const donCapNhat = await res.json();

    const viTri = dsDonHang.findIndex(d => d.id == donCapNhat.id);
    if (viTri > -1) dsDonHang[viTri] = donCapNhat;

    // 📦 ĐỒNG BỘ TỒN KHO THEO CHUẨN TMĐT:
    // Trường hợp 1: Chuyển sang "cancelled" -> Tự động hoàn trả tồn kho và giảm đã bán
    if (trangThaiCu !== 'cancelled' && trangThaiMoi === 'cancelled') {
      const restorePromises = (donCapNhat.items || []).map(async item => {
        const sp = dsSanPham.find(p => p.id == item.id);
        if (sp) {
          const khoMoi = (Number(sp.stock) || 0) + (Number(item.quantity) || 0);
          const daBanMoi = Math.max(0, (Number(sp.sold) || 0) - (Number(item.quantity) || 0));
          sp.stock = khoMoi;
          sp.quantity = khoMoi;
          sp.sold = daBanMoi;

          return fetch(`${API_URL}/products/${item.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stock: khoMoi, quantity: khoMoi, sold: daBanMoi })
          });
        }
      });
      await Promise.all(restorePromises);
      hienThongBao(`Đơn #${donCapNhat.orderCode} đã hủy: Tồn kho đã được hoàn trả tự động!`, 'info');
      renderBangSanPham();
    }
    // Trường hợp 2: Chuyển từ "cancelled" sang trạng thái khác -> Trừ lại kho
    else if (trangThaiCu === 'cancelled' && trangThaiMoi !== 'cancelled') {
      const deductPromises = (donCapNhat.items || []).map(async item => {
        const sp = dsSanPham.find(p => p.id == item.id);
        if (sp) {
          const khoMoi = Math.max(0, (Number(sp.stock) || 0) - (Number(item.quantity) || 0));
          const daBanMoi = (Number(sp.sold) || 0) + (Number(item.quantity) || 0);
          sp.stock = khoMoi;
          sp.quantity = khoMoi;
          sp.sold = daBanMoi;

          return fetch(`${API_URL}/products/${item.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stock: khoMoi, quantity: khoMoi, sold: daBanMoi })
          });
        }
      });
      await Promise.all(deductPromises);
      renderBangSanPham();
    }

    hienThongBao(`Đã đổi trạng thái đơn ${donCapNhat.orderCode}`, 'success');
    dongModal('order-detail-modal');
    tinhToanKPI();
    renderBangDonHang();
  } catch (loi) {
    console.error(loi);
    hienThongBao('Lỗi cập nhật trạng thái đơn!', 'error');
  }
}
