/**
 * ============================================================================
 * VIEW: OrderView (Render Màn hình Cảm ơn, Hóa Đơn Bán Lẻ, Hồ Sơ Đơn Hàng & Tra Cứu)
 * Kiến trúc: Mô hình MVC Chuẩn - SmartStore
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * ============================================================================
 */

class OrderView {
  /** Render Màn hình Đặt hàng Thành công (Thank You View) */
  static renderThankYouView(order) {
    if (!order) return;

    const formatCurrency = BaseView.formatCurrency;

    const codeEl = document.getElementById('thankyou-order-code');
    if (codeEl) codeEl.textContent = order.orderCode;

    const nameEl = document.getElementById('thankyou-customer-name');
    if (nameEl) nameEl.textContent = order.customerName;

    const phoneEl = document.getElementById('thankyou-customer-phone');
    if (phoneEl) phoneEl.textContent = order.customerPhone;

    const addrEl = document.getElementById('thankyou-customer-address');
    if (addrEl) addrEl.textContent = order.customerAddress;

    const totalEl = document.getElementById('thankyou-total-amount');
    if (totalEl) totalEl.textContent = formatCurrency(order.totalAmount);

    const methodEl = document.getElementById('thankyou-payment-method');
    if (methodEl) {
      methodEl.textContent = order.paymentMethod === 'COD' 
        ? 'Thanh toán tiền mặt khi nhận hàng (COD)' 
        : 'Chuyển khoản ngân hàng 24/7 (QR Code)';
    }

    // Render danh sách sản phẩm trong đơn
    const itemsEl = document.getElementById('thankyou-order-items');
    if (itemsEl && order.items) {
      itemsEl.innerHTML = order.items.map(item => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px dashed var(--border); font-size: 14px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="${item.image}" alt="${item.name}" style="width: 44px; height: 44px; object-fit: contain; border-radius: 6px; border: 1px solid var(--border);">
            <div>
              <strong style="color: var(--text);">${item.name}</strong>
              <div style="font-size: 12px; color: var(--text-muted);">Số lượng: x${item.quantity}</div>
            </div>
          </div>
          <div style="font-weight: 700; color: var(--accent);">${formatCurrency(item.price * item.quantity)}</div>
        </div>
      `).join('');
    }
  }

  /** Render Hộp thoại Xem Hóa Đơn Bán Lẻ Kiêm Phiếu Bảo Hành */
  static renderInvoiceModal(modalBodyId, order) {
    const body = document.getElementById(modalBodyId);
    if (!body || !order) return;

    const formatCurrency = BaseView.formatCurrency;
    const ngayTao = order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN');
    const tamTinh = order.subtotal || order.totalAmount;
    const giamGia = order.discountAmount || 0;
    const tongTien = order.totalAmount;

    body.innerHTML = `
      <div class="invoice-container printable-invoice" id="printable-invoice-content">
        <div class="invoice-header">
          <div class="invoice-company">
            <h2>SMARTSTORE VIỆT NAM</h2>
            <div>Hệ thống bán lẻ Smartphone & Gaming Phone chính hãng hàng đầu</div>
            <div>Địa chỉ: Tòa nhà FPT Polytechnic, Phố Trịnh Văn Bô, Nam Từ Liêm, Hà Nội</div>
            <div>Hotline: 1800.6936 - Hỗ trợ kỹ thuật: 1900.5301</div>
            <div>Mã số thuế: 0108923456 - Website: smartstore.vn</div>
          </div>
          <div class="invoice-meta">
            <div class="title">HÓA ĐƠN BÁN HÀNG</div>
            <div class="sub-title">KIÊM PHIẾU BẢO HÀNH CHÍNH HÃNG</div>
            <div class="badge">Mã đơn: ${order.orderCode}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 6px;">Thời gian: ${ngayTao}</div>
          </div>
        </div>

        <div class="invoice-details-grid">
          <div class="detail-col">
            <h4>THÔNG TIN KHÁCH HÀNG</h4>
            <div class="info-line"><strong>Họ và tên:</strong> ${order.customerName}</div>
            <div class="info-line"><strong>Số điện thoại:</strong> ${order.customerPhone}</div>
            <div class="info-line"><strong>Email liên hệ:</strong> ${order.customerEmail || 'Không cung cấp'}</div>
            <div class="info-line"><strong>Địa chỉ nhận máy:</strong> ${order.customerAddress}</div>
          </div>
          <div class="detail-col">
            <h4>THÔNG TIN ĐƠN HÀNG</h4>
            <div class="info-line"><strong>Mã tra cứu:</strong> <span style="color: var(--primary); font-weight:800;">${order.orderCode}</span></div>
            <div class="info-line"><strong>Phương thức TT:</strong> ${order.paymentMethod === 'COD' ? 'Tiền mặt khi giao hàng (COD)' : 'Chuyển khoản ngân hàng'}</div>
            <div class="info-line"><strong>Trạng thái:</strong> <span style="color: var(--warning); font-weight:700;">${order.status === 'processing' ? 'Đang chuẩn bị hàng' : order.status}</span></div>
            <div class="info-line"><strong>Ghi chú đơn:</strong> ${order.note || 'Giao hàng tiêu chuẩn'}</div>
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
            ${(order.items || []).map((item, idx) => `
              <tr>
                <td style="text-align: center; color: #64748b;">${idx + 1}</td>
                <td>
                  <strong style="color: #0f172a;">${item.name}</strong>
                  <div style="font-size: 11px; color: #64748b;">Bảo hành chính hãng 12 tháng tại SmartStore</div>
                </td>
                <td style="text-align: right;">${formatCurrency(item.price)}</td>
                <td style="text-align: center; font-weight: 700;">${item.quantity}</td>
                <td style="text-align: right; font-weight: 700;">${formatCurrency(item.price * item.quantity)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary-box">
          <div class="summary-row">
            <span>Tạm tính tổng sản phẩm:</span>
            <strong>${formatCurrency(tamTinh)}</strong>
          </div>
          ${order.voucherCode ? `
            <div class="summary-row" style="color: #ef4444;">
              <span>Giảm giá Voucher [${order.voucherCode}]:</span>
              <strong>-${formatCurrency(giamGia)}</strong>
            </div>
          ` : ''}
          <div class="summary-row">
            <span>Phí vận chuyển giao tận nhà:</span>
            <strong style="color: #10b981;">0 đ (Miễn Phí)</strong>
          </div>
          <div class="summary-row total">
            <span>TỔNG THANH TOÁN:</span>
            <span>${formatCurrency(tongTien)}</span>
          </div>
        </div>
        <div class="clear"></div>

        <div class="policy-box">
          <strong>CHÍNH SÁCH BẢO HÀNH & ĐỔI TRẢ SMARTSTORE VIỆT NAM:</strong><br>
          • Đổi mới 100% trong 30 ngày đầu tiên nếu máy phát sinh lỗi phần cứng từ nhà sản xuất.<br>
          • Bảo hành chính hãng 12 tháng toàn diện bao gồm cả Nguồn & Màn hình cảm ứng.<br>
          • Quý khách vui lòng giữ lại hóa đơn này hoặc tra cứu mã đơn <strong>${order.orderCode}</strong> trên website để được tiếp nhận bảo hành nhanh chóng.
        </div>

        <div class="signatures">
          <div class="sig-block">
            <div class="sig-title">KHÁCH HÀNG NHẬN HÀNG</div>
            <div class="sig-sub">(Ký & ghi rõ họ tên)</div>
            <div class="sig-name">${order.customerName}</div>
          </div>
          <div class="sig-block">
            <div class="sig-title">ĐẠI DIỆN SMARTSTORE</div>
            <div class="sig-sub">(Ký duyệt, đóng dấu & xuất kho)</div>
            <div class="sig-name">Bộ Phận Kho Vận & Tài Chính</div>
          </div>
        </div>
      </div>
    `;
  }

  /** Render Lịch sử đơn hàng trong trang Profile */
  static renderUserOrders(containerId, orders = []) {
    const tbody = document.getElementById(containerId);
    if (!tbody) return;

    if (!orders || orders.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 30px; color: var(--text-muted);">
            <i class="fa-solid fa-box-open" style="font-size: 30px; margin-bottom: 8px; display: block;"></i>
            Bạn chưa có đơn hàng nào tại SmartStore. Hãy khám phá và mua sắm ngay!
          </td>
        </tr>
      `;
      return;
    }

    const formatCurrency = BaseView.formatCurrency;

    tbody.innerHTML = orders.map(d => {
      const ngay = d.createdAt ? new Date(d.createdAt).toLocaleDateString('vi-VN') : 'Mới';
      let statusBadge = '<span class="badge badge-warning">Chờ xử lý</span>';
      let canCancel = false;

      if (d.status === 'processing' || d.status === 'pending') {
        statusBadge = '<span class="badge badge-warning">Chờ xử lý</span>';
        canCancel = true;
      } else if (d.status === 'shipping') {
        statusBadge = '<span class="badge badge-info">Đang giao</span>';
      } else if (d.status === 'completed') {
        statusBadge = '<span class="badge badge-success">Đã giao hàng</span>';
      } else if (d.status === 'cancelled') {
        statusBadge = '<span class="badge badge-danger">Đã hủy đơn</span>';
      }

      const itemsSummary = (d.items || []).map(i => `${i.name} (x${i.quantity})`).join(', ');

      return `
        <tr>
          <td><strong style="color: var(--primary);">${d.orderCode}</strong></td>
          <td>${ngay}</td>
          <td style="max-width: 250px; font-size: 13px;">${itemsSummary}</td>
          <td style="font-weight: 700; color: var(--accent);">${formatCurrency(d.totalAmount)}</td>
          <td>${statusBadge}</td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="btn-secondary btn-sm" onclick="window.cartModule.openCustomerInvoice('${d.orderCode}')" title="Xem hóa đơn chi tiết">
                <i class="fa-solid fa-file-invoice"></i> Hóa Đơn
              </button>
              ${canCancel ? `
                <button class="btn-danger btn-sm" onclick="window.authModule.cancelOrder('${d.id}', '${d.orderCode}')" title="Hủy đơn hàng này">
                  <i class="fa-solid fa-ban"></i> Hủy Đơn
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  /** Render Kết quả tra cứu đơn hàng (Tracking View) */
  static renderTrackingResult(containerId, orders = []) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!orders || orders.length === 0) {
      container.innerHTML = `
        <div style="padding: 30px; text-align: center; color: var(--danger); background: #fef2f2; border-radius: var(--radius-md); border: 1px dashed #fca5a5;">
          <i class="fa-solid fa-circle-xmark" style="font-size: 32px; margin-bottom: 8px; display: block;"></i>
          <strong>Không tìm thấy đơn hàng!</strong><br>
          Vui lòng kiểm tra lại chính xác Mã đơn hàng (ví dụ: #DH123456789) hoặc Số điện thoại đặt hàng.
        </div>
      `;
      return;
    }

    const formatCurrency = BaseView.formatCurrency;

    container.innerHTML = orders.map(d => {
      let step1 = 'completed', step2 = '', step3 = '', step4 = '';
      if (d.status === 'processing') step2 = 'active';
      else if (d.status === 'shipping') { step2 = 'completed'; step3 = 'active'; }
      else if (d.status === 'completed') { step2 = 'completed'; step3 = 'completed'; step4 = 'completed'; }
      else if (d.status === 'cancelled') { step2 = 'cancelled'; }

      return `
        <div class="checkout-card" style="margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 16px;">
            <div>
              <span style="font-size: 13px; color: var(--text-muted);">Mã đơn hàng:</span>
              <h3 style="font-size: 1.3rem; font-weight: 800; color: var(--primary); margin: 0;">${d.orderCode}</h3>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 13px; color: var(--text-muted);">Tổng thanh toán:</span>
              <div style="font-size: 1.25rem; font-weight: 800; color: var(--accent);">${formatCurrency(d.totalAmount)}</div>
            </div>
          </div>

          <!-- Stepper Tiến trình -->
          <div class="order-stepper" style="margin: 20px 0;">
            <div class="step-item ${step1}">
              <div class="step-icon"><i class="fa-solid fa-check"></i></div>
              <div class="step-label">Đã Đặt Hàng</div>
            </div>
            <div class="step-item ${step2}">
              <div class="step-icon"><i class="fa-solid fa-box-archive"></i></div>
              <div class="step-label">${d.status === 'cancelled' ? 'Đã Hủy Đơn' : 'Chuẩn Bị Hàng'}</div>
            </div>
            <div class="step-item ${step3}">
              <div class="step-icon"><i class="fa-solid fa-truck-fast"></i></div>
              <div class="step-label">Đang Giao Hàng</div>
            </div>
            <div class="step-item ${step4}">
              <div class="step-icon"><i class="fa-solid fa-handshake"></i></div>
              <div class="step-label">Đã Hoàn Tất</div>
            </div>
          </div>

          <!-- Chi tiết nhận hàng -->
          <div style="font-size: 13.5px; line-height: 1.8; color: #475569; background: #f8fafc; padding: 14px; border-radius: var(--radius-md); margin-top: 14px;">
            <div><strong>Người nhận:</strong> ${d.customerName} - <strong>SĐT:</strong> ${d.customerPhone}</div>
            <div><strong>Địa chỉ:</strong> ${d.customerAddress}</div>
            <div><strong>Phương thức thanh toán:</strong> ${d.paymentMethod === 'COD' ? 'Tiền mặt khi giao hàng' : 'Chuyển khoản trực tuyến'}</div>
          </div>

          <div style="margin-top: 16px; text-align: right;">
            <button class="btn-primary btn-sm" onclick="window.cartModule.openCustomerInvoice('${d.orderCode}')">
              <i class="fa-solid fa-file-invoice"></i> Xem Hóa Đơn Chi Tiết
            </button>
          </div>
        </div>
      `;
    }).join('');
  }
}

// Khởi tạo Singleton toàn cục trong namespace View
window.OrderView = OrderView;
