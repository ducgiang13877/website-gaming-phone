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

  const tenTrangThaiMap = {
    processing: 'Chờ xử lý',
    shipping: 'Đang giao hàng',
    delivered: 'Đã giao thành công (Chốt sổ tài chính & Bất biến)',
    cancelled: 'Đã hủy đơn (Tự động hoàn trả tồn kho)'
  };

  // 🔔 THÔNG BÁO XÁC NHẬN BẮT BUỘC TRƯỚC KHI ĐỔI TRẠNG THÁI ĐƠN HÀNG
  let xacNhanMsg = `XÁC NHẬN THAY ĐỔI TRẠNG THÁI ĐƠN HÀNG #${donCu.orderCode}:\n\n` +
    `Bạn có chắc chắn muốn chuyển từ "${tenTrangThaiMap[trangThaiCu] || trangThaiCu}" sang "${tenTrangThaiMap[trangThaiMoi] || trangThaiMoi}" không?`;

  if (trangThaiMoi === 'delivered') {
    xacNhanMsg += `\n\n⚠️ LƯU Ý BẢO VỆ CHUẨN TMĐT: Sau khi chuyển sang "Đã giao thành công", đơn hàng sẽ bị KHÓA BẤT BIẾN nhằm bảo toàn đối soát tài chính COD và số liệu tồn kho. Bạn sẽ KHÔNG THỂ thay đổi lại trạng thái sau này!`;
  } else if (trangThaiMoi === 'cancelled') {
    xacNhanMsg += `\n\n📦 ĐỒNG BỘ KHO: Hệ thống sẽ tự động hoàn trả toàn bộ số lượng sản phẩm trong đơn hàng về lại kho hàng.`;
  } else if (trangThaiCu === 'cancelled' && trangThaiMoi !== 'cancelled') {
    xacNhanMsg += `\n\n📦 ĐỒNG BỘ KHO: Đơn này đã hủy trước đó. Việc kích hoạt lại sẽ trừ lại số lượng tồn kho tương ứng.`;
  }

  if (!confirm(xacNhanMsg)) {
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

    const tenNganMap = {
      processing: 'Chờ xử lý',
      shipping: 'Đang giao',
      delivered: 'Đã giao',
      cancelled: 'Đã hủy'
    };

    hienThongBao(`Đã đổi đơn #${donCapNhat.orderCode} sang "${tenNganMap[trangThaiMoi] || trangThaiMoi}"`, 'success');
    tinhToanKPI();
    renderBangDonHang();
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
          <div style="display: flex; gap: 6px; justify-content: center; align-items: center;">
            <button class="btn-primary btn-sm" onclick="moXemDonHang('${d.orderCode}')" title="Xem chi tiết đơn"><i class="fa-solid fa-eye"></i> Xem</button>
            ${d.status !== 'delivered' ? `
              <button class="btn-danger btn-sm" onclick="xacNhanXoa('order', '${d.id}', '${d.orderCode}')" title="Xóa đơn hàng"><i class="fa-solid fa-trash-can"></i></button>
            ` : ''}
          </div>
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

  const tenTrangThaiMap = {
    processing: 'Chờ xử lý',
    shipping: 'Đang giao hàng',
    delivered: 'Đã giao thành công (Chốt sổ tài chính & Bất biến)',
    cancelled: 'Đã hủy đơn (Tự động hoàn trả tồn kho)'
  };

  // 🔔 THÔNG BÁO XÁC NHẬN BẮT BUỘC TRƯỚC KHI ĐỔI TRẠNG THÁI ĐƠN HÀNG
  let xacNhanMsg = `XÁC NHẬN THAY ĐỔI TRẠNG THÁI ĐƠN HÀNG #${donHangDangXem.orderCode}:\n\n` +
    `Bạn có chắc chắn muốn cập nhật trạng thái từ "${tenTrangThaiMap[trangThaiCu] || trangThaiCu}" sang "${tenTrangThaiMap[trangThaiMoi] || trangThaiMoi}" không?`;

  if (trangThaiMoi === 'delivered') {
    xacNhanMsg += `\n\n⚠️ LƯU Ý BẢO VỆ CHUẨN TMĐT: Sau khi chuyển sang "Đã giao thành công", đơn hàng sẽ bị KHÓA BẤT BIẾN nhằm bảo toàn đối soát tài chính COD và số liệu tồn kho. Bạn sẽ KHÔNG THỂ thay đổi lại trạng thái sau này!`;
  } else if (trangThaiMoi === 'cancelled') {
    xacNhanMsg += `\n\n📦 ĐỒNG BỘ KHO: Hệ thống sẽ tự động hoàn trả toàn bộ số lượng sản phẩm trong đơn hàng về lại kho hàng.`;
  } else if (trangThaiCu === 'cancelled' && trangThaiMoi !== 'cancelled') {
    xacNhanMsg += `\n\n📦 ĐỒNG BỘ KHO: Đơn này đã hủy trước đó. Việc kích hoạt lại sẽ trừ lại số lượng tồn kho tương ứng.`;
  }

  if (!confirm(xacNhanMsg)) {
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

/**
 * 🎯 Mục đích: In hóa đơn bán hàng cho đơn hàng đang được xem trong Modal Quản trị (Admin)
 * 🔄 Luồng bảo vệ đồ án ASM (6 BƯỚC CHUẨN MỰC TỪ FRONTEND ĐẾN BACKEND):
 *   1. Trigger UI: Quản trị viên bấm nút "In Hóa Đơn" trong Modal Chi Tiết Đơn Hàng.
 *   2. Bắt sự kiện: window.adminCtrl.printInvoice() gọi hàm inHoaDonAdmin().
 *   3. Kiểm tra dữ liệu: Lấy đơn hàng hiện tại trong biến state `donHangDangXem`.
 *   4. Render Template Hóa Đơn Chuẩn Bán Lẻ A4/A5: Tạo popup window chứa cấu trúc Hóa đơn kèm CSS chuyên dụng cho máy in nhiệt / máy in A4/A5.
 *   5. Nạp nội dung & kích hoạt lệnh in: Ghi mã HTML vào popup và gọi window.print().
 *   6. Phản hồi: Thông báo Toast cho Quản trị viên.
 */
function inHoaDonAdmin() {
  if (!donHangDangXem) {
    hienThongBao('Vui lòng mở một đơn hàng để in hóa đơn!', 'warning');
    return;
  }

  const d = donHangDangXem;
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
