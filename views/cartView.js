
const getImg = (src) => {
  if (typeof window !== 'undefined' && window.baseView?.formatImageUrl) {
    return window.baseView.formatImageUrl(src);
  }
  if (!src) return '/images/default-phone.svg';
  if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('blob:')) return src;
  return '/' + src.replace(/^\.\//, '').replace(/^\//, '');
};

// Bảng ánh xạ nhãn và class CSS cho trạng thái đơn hàng (Lookup Map)
const ORDER_STATUS_MAP = {
  pending:    { label: 'Chờ xử lý', color: 'var(--warning)', badgeClass: 'badge-warning', step: 2 },
  processing: { label: 'Đang chuẩn bị hàng', color: 'var(--warning)', badgeClass: 'badge-warning', step: 2 },
  shipping:   { label: 'Đang giao hàng', color: 'var(--info)', badgeClass: 'badge-info', step: 3 },
  delivered:  { label: 'Đã giao hàng thành công', color: 'var(--success)', badgeClass: 'badge-success', step: 4 },
  completed:  { label: 'Đã giao hàng thành công', color: 'var(--success)', badgeClass: 'badge-success', step: 4 },
  cancelled:  { label: 'Đã hủy đơn', color: 'var(--danger)', badgeClass: 'badge-danger', step: 'cancelled' }
};

// ============================================================================
// PHẦN 1: CÁC HÀM RENDER GIỎ HÀNG & CHECKOUT (CART VIEW FUNCTIONS)
// ============================================================================

/**
 * [HÀM 1] Render bảng danh sách sản phẩm trong giỏ hàng
 * Tác dụng: Nhận mảng items từ CartModel -> Vẽ ra các hàng <tr> kèm ảnh, đơn giá, nút tăng giảm SL (+/-)
 * @param {Array<Object>} items - Danh sách sản phẩm trong giỏ
 * @param {number} subtotal - Tạm tính tiền giỏ hàng
 */
function renderCartTable(items = [], subtotal = 0) {
  const emptyBox = document.getElementById('cart-empty-state');
  const contentBox = document.getElementById('cart-content-wrapper');
  const tbody = document.getElementById('cart-table-tbody');
  const subtotalEl = document.getElementById('cart-subtotal');
  const totalEl = document.getElementById('cart-grand-total');
  const formatCur = window.baseView ? window.baseView.formatCurrency : (n => Number(n).toLocaleString('vi-VN') + ' đ');

  // Xử lý khi giỏ hàng trống
  if (!items || items.length === 0) {
    if (emptyBox) emptyBox.style.display = 'block';
    if (contentBox) contentBox.style.display = 'none';
    renderRewardBar(0);
    return;
  }

  if (emptyBox) emptyBox.style.display = 'none';
  if (contentBox) contentBox.style.display = 'grid';

  if (tbody) {
    tbody.innerHTML = items.map(item => {
      const price = Number(item.price) || 0;
      const qty = Number(item.quantity) || 1;
      const lineTotal = price * qty;

      return `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 12px;">
              <img src="${getImg(item.image)}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: contain; border-radius: 8px; border: 1px solid var(--border);" onerror="this.src='/images/default-phone.svg';">
              <div>
                <strong style="font-size: 14px; color: var(--text);">${item.name}</strong>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Còn sẵn ${item.stock} máy</div>
              </div>
            </div>
          </td>
          <td style="font-weight: 700;">${formatCur(price)}</td>
          <td>
            <div class="qty-btn-group">
              <button type="button" onclick="window.cartModule.changeQty('${item.id}', -1)" title="Giảm số lượng">-</button>
              <input type="number" value="${qty}" readonly>
              <button type="button" onclick="window.cartModule.changeQty('${item.id}', 1)" title="Tăng số lượng">+</button>
            </div>
          </td>
          <td style="font-weight: 800; color: var(--accent);">${formatCur(lineTotal)}</td>
          <td style="text-align: center;">
            <button class="btn-danger btn-sm" onclick="window.cartModule.remove('${item.id}')" title="Xóa món này">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  if (subtotalEl) subtotalEl.textContent = formatCur(subtotal);
  if (totalEl) totalEl.textContent = formatCur(subtotal);

  renderRewardBar(subtotal);
}

/**
 * [HÀM 2] Render Thanh Tiến Trình Quà Tặng (Gamification Reward Bar)
 * Tác dụng: Kích thích người dùng mua thêm sản phẩm để đạt mốc nhận quà (Sạc 67W, Tai nghe VIP...)
 * @param {number} tongTien - Tổng giá trị đơn hàng hiện tại
 */
function renderRewardBar(tongTien = 0) {
  const rewardEl = document.getElementById('cart-reward-bar');
  if (!rewardEl) return;

  if (tongTien <= 0) {
    rewardEl.innerHTML = '';
    rewardEl.style.display = 'none';
    return;
  }

  rewardEl.style.display = 'block';
  const moc1 = 10000000; // Mốc 1: 10 triệu
  const moc2 = 20000000; // Mốc 2: 20 triệu
  const formatCur = window.baseView ? window.baseView.formatCurrency : (n => Number(n).toLocaleString('vi-VN') + ' đ');

  let phanTram = 0;
  let thongDiep = '';
  let badgeText = '';

  if (tongTien < moc1) {
    phanTram = Math.min(100, Math.round((tongTien / moc1) * 50));
    const thieu = moc1 - tongTien;
    thongDiep = `🎁 Mua thêm <strong style="color:var(--accent); font-weight:800;">${formatCur(thieu)}</strong> để nhận ngay <strong>Củ Sạc Nhanh 67W Cao Cấp</strong> trị giá 450.000 đ!`;
    badgeText = 'Mốc Quà 1 (Đơn từ 10tr)';
  } else if (tongTien < moc2) {
    const phanTramDoan2 = Math.round(((tongTien - moc1) / (moc2 - moc1)) * 50);
    phanTram = 50 + phanTramDoan2;
    const thieu = moc2 - tongTien;
    thongDiep = `🎉 Đã nhận Củ Sạc 67W! Mua thêm <strong style="color:var(--accent); font-weight:800;">${formatCur(thieu)}</strong> để nhận <strong>Tai Nghe Gaming Type-C & Balo Độc Quyền</strong> trị giá 790.000 đ!`;
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
 * [HÀM 3] Render Khối Tóm Tắt Thanh Toán (Checkout Summary)
 * Tác dụng: Hiển thị các sản phẩm chuẩn bị thanh toán, tạm tính, số tiền voucher giảm, tổng cuối
 * @param {Array<Object>} items - Danh sách món hàng
 * @param {number} subtotal - Tạm tính
 * @param {number} discount - Số tiền giảm giá
 * @param {number} total - Tổng tiền thanh toán cuối
 * @param {Object|null} appliedVoucher - Đối tượng voucher đang áp dụng
 */
function renderCheckoutSummary(items = [], subtotal = 0, discount = 0, total = 0, appliedVoucher = null) {
  const formatCur = window.baseView ? window.baseView.formatCurrency : (n => Number(n).toLocaleString('vi-VN') + ' đ');

  // Danh sách tóm tắt món hàng
  const itemsListEl = document.getElementById('checkout-items-list') || document.getElementById('checkout-items-summary');
  if (itemsListEl) {
    itemsListEl.innerHTML = items.map(item => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed var(--border); font-size: 13.5px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <img src="${getImg(item.image)}" alt="${item.name}" style="width: 36px; height: 36px; object-fit: contain; border-radius: 4px;" onerror="this.src='/images/default-phone.svg';">
          <div>
            <div style="font-weight: 600; color: var(--text);">${item.name}</div>
            <div style="font-size: 12px; color: var(--text-muted);">x${item.quantity}</div>
          </div>
        </div>
        <div style="font-weight: 700; color: var(--text);">${formatCur(item.price * item.quantity)}</div>
      </div>
    `).join('');
  }

  // Cập nhật các trường tổng tiền
  const subtotalEl = document.getElementById('checkout-subtotal');
  if (subtotalEl) subtotalEl.textContent = formatCur(subtotal);

  const discountEl = document.getElementById('checkout-discount-amount') || document.getElementById('checkout-discount');
  const discountRow = document.getElementById('checkout-discount-row');
  if (discountEl) {
    discountEl.textContent = discount > 0 ? `-${formatCur(discount)}` : '-0 đ';
    if (discountRow) discountRow.style.display = discount > 0 ? 'flex' : 'none';
  }

  const totalEl = document.getElementById('checkout-grand-total') || document.getElementById('checkout-total-amount');
  if (totalEl) totalEl.textContent = formatCur(total);

  // Hiển thị thông báo voucher đã kích hoạt
  const alertBox = document.getElementById('applied-voucher-alert') || document.getElementById('voucher-applied-box');
  if (alertBox) {
    if (appliedVoucher && discount > 0) {
      alertBox.style.display = 'flex';
      alertBox.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-circle-check" style="color: var(--success); font-size: 18px;"></i>
          <div>
            <strong style="color: #065f46;">Đã áp dụng mã: ${appliedVoucher.code}</strong>
            <div style="font-size: 12px; color: #047857;">Giảm ngay ${formatCur(discount)} trên đơn hàng</div>
          </div>
        </div>
        <button type="button" class="btn-remove-voucher" onclick="window.cartModule.cancelVoucher()">Gỡ bỏ</button>
      `;
    } else {
      alertBox.style.display = 'none';
      alertBox.innerHTML = '';
    }
  }
}

/**
 * [HÀM 4] Render danh sách voucher chips gợi ý bấm chọn nhanh
 * Tác dụng: Cho phép khách hàng click thẳng vào mã ưu đãi để tự động điền và áp dụng
 * @param {Array<Object>} vouchers - Danh sách voucher khả dụng
 * @param {Object|null} appliedVoucher - Voucher đang kích hoạt
 * @param {number} subtotal - Tạm tính đơn hàng
 */
function renderVoucherChips(vouchers = [], appliedVoucher = null, subtotal = 0) {
  const listEl = document.getElementById('quick-voucher-chips') || document.getElementById('checkout-voucher-list');
  if (!listEl) return;

  if (!vouchers || vouchers.length === 0) {
    listEl.innerHTML = '<span style="font-size: 12px; color: var(--text-muted);">Chưa có mã giảm giá nào.</span>';
    return;
  }

  listEl.innerHTML = vouchers.map(v => {
    const isApplied = appliedVoucher && appliedVoucher.code === v.code;
    const isEligible = !v.minOrder || subtotal >= v.minOrder;
    const chipClass = isApplied ? 'voucher-chip active' : (isEligible ? 'voucher-chip' : 'voucher-chip disabled');

    return `
      <div class="${chipClass}"
           onclick="${isEligible ? `window.cartModule.selectVoucherChip('${v.code}')` : ''}"
           title="${v.description || v.desc || ''}">
        <div style="font-weight: 800; font-size: 12px;"><i class="fa-solid fa-ticket"></i> ${v.code}</div>
        <div style="font-size: 11px; opacity: 0.9;">${v.description || v.desc || 'Mã ưu đãi'}</div>
      </div>
    `;
  }).join('');
}

// ============================================================================
// PHẦN 2: CÁC HÀM RENDER ĐƠN HÀNG, HÓA ĐƠN & TRA CỨU (ORDER VIEW FUNCTIONS)
// ============================================================================

/**
 * [HÀM 5] Render Màn hình Đặt hàng Thành công (Thank You View)
 * Tác dụng: Hiển thị thông báo chúc mừng, mã đơn ##DH..., tên khách, hình thức và danh sách máy đã đặt
 * @param {Object} order - Thông tin đơn hàng vừa hoàn tất
 */
function renderThankYouView(order) {
  if (!order) return;
  const formatCur = window.baseView ? window.baseView.formatCurrency : (n => Number(n).toLocaleString('vi-VN') + ' đ');

  const codeEl = document.getElementById('thankyou-order-code');
  if (codeEl) codeEl.textContent = '#' + (order.orderCode || '').replace(/^#+/, '');

  const summaryBox = document.getElementById('thankyou-order-summary');
  if (summaryBox) {
    summaryBox.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 14px; border-bottom: 1px dashed var(--border); padding-bottom: 14px;">
        <div><strong style="color: var(--text);">Họ và tên:</strong> ${order.customerName || 'Khách hàng'}</div>
        <div><strong style="color: var(--text);">Số điện thoại:</strong> ${order.customerPhone || 'Không có'}</div>
        <div><strong style="color: var(--text);">Hình thức:</strong> ${order.paymentMethod === 'COD' ? 'Tiền mặt khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng 24/7 (QR)'}</div>
        <div><strong style="color: var(--text);">Tổng thanh toán:</strong> <span style="color: var(--accent); font-weight: 800; font-size: 15px;">${formatCur(order.totalAmount)}</span></div>
      </div>
      <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 10px;">
        <strong style="color: var(--text);">Địa chỉ giao máy:</strong> ${order.customerAddress || 'Giao hàng tận nơi'}
      </div>
      ${order.voucherCode ? `
        <div style="font-size: 12.5px; color: #10b981; font-weight: 600; margin-bottom: 8px;">
          <i class="fa-solid fa-ticket"></i> Đã áp dụng mã ưu đãi: <strong>${order.voucherCode}</strong> (-${formatCur(order.discountAmount || 0)})
        </div>
      ` : ''}
      <div style="margin-top: 12px;">
        <strong style="display: block; margin-bottom: 8px; color: var(--text);">Sản phẩm đã đặt (${order.items ? order.items.length : 0} món):</strong>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${(order.items || []).map(item => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; font-size: 13.5px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <img src="${getImg(item.image)}" alt="${item.name}" style="width: 38px; height: 38px; object-fit: contain; border-radius: 4px; border: 1px solid var(--border);" onerror="this.src='/images/default-phone.svg';">
                <div>
                  <strong style="color: var(--text);">${item.name}</strong>
                  <div style="font-size: 11.5px; color: var(--text-muted);">Số lượng: x${item.quantity}</div>
                </div>
              </div>
              <div style="font-weight: 700; color: var(--accent);">${formatCur(item.price * item.quantity)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Gán dữ liệu vào các thẻ rời rạc nếu có trên giao diện
  const nameEl = document.getElementById('thankyou-customer-name');
  if (nameEl) nameEl.textContent = order.customerName || '';

  const phoneEl = document.getElementById('thankyou-customer-phone');
  if (phoneEl) phoneEl.textContent = order.customerPhone || '';

  const addrEl = document.getElementById('thankyou-customer-address');
  if (addrEl) addrEl.textContent = order.customerAddress || '';

  const totalEl = document.getElementById('thankyou-total-amount');
  if (totalEl) totalEl.textContent = formatCur(order.totalAmount);

  const methodEl = document.getElementById('thankyou-payment-method');
  if (methodEl) {
    methodEl.textContent = order.paymentMethod === 'COD'
      ? 'Thanh toán tiền mặt khi nhận hàng (COD)'
      : 'Chuyển khoản ngân hàng 24/7 (QR Code)';
  }

  const itemsEl = document.getElementById('thankyou-order-items');
  if (itemsEl && order.items) {
    itemsEl.innerHTML = order.items.map(item => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px dashed var(--border); font-size: 14px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <img src="${getImg(item.image)}" alt="${item.name}" style="width: 44px; height: 44px; object-fit: contain; border-radius: 6px; border: 1px solid var(--border);" onerror="this.src='/images/default-phone.svg';">
          <div>
            <strong style="color: var(--text);">${item.name}</strong>
            <div style="font-size: 12px; color: var(--text-muted);">Số lượng: x${item.quantity}</div>
          </div>
        </div>
        <div style="font-weight: 700; color: var(--accent);">${formatCur(item.price * item.quantity)}</div>
      </div>
    `).join('');
  }
}

/**
 * [HÀM 6] Render Hộp thoại Xem Hóa Đơn Bán Lẻ Kiêm Phiếu Bảo Hành Chính Hãng
 * Tác dụng: Tạo giao diện hóa đơn chuẩn VAT đầy đủ thông tin pháp lý, có thể in ấn hoặc lưu PDF
 * @param {string} modalBodyId - ID container của thân modal
 * @param {Object} order - Dữ liệu chi tiết đơn hàng
 */
function renderInvoiceModal(modalBodyId, order) {
  const body = document.getElementById(modalBodyId);
  if (!body || !order) return;

  const formatCur = window.baseView ? window.baseView.formatCurrency : (n => Number(n).toLocaleString('vi-VN') + ' đ');
  const ngayTao = order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN');
  const tamTinh = order.subtotal || order.totalAmount;
  const giamGia = order.discountAmount || 0;
  const tongTien = order.totalAmount;

  // Lấy thông tin trạng thái từ Lookup Map
  const statusInfo = ORDER_STATUS_MAP[order.status] ?? { label: 'Đang chuẩn bị hàng', color: 'var(--warning)' };

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
          <div class="info-line"><strong>Trạng thái:</strong> <span style="color: ${statusInfo.color}; font-weight:700;">${statusInfo.label}</span></div>
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
              <td style="text-align: right;">${formatCur(item.price)}</td>
              <td style="text-align: center; font-weight: 700;">${item.quantity}</td>
              <td style="text-align: right; font-weight: 700;">${formatCur(item.price * item.quantity)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="summary-box">
        <div class="summary-row">
          <span>Tạm tính tổng sản phẩm:</span>
          <strong>${formatCur(tamTinh)}</strong>
        </div>
        ${order.voucherCode ? `
          <div class="summary-row" style="color: #ef4444;">
            <span>Giảm giá Voucher [${order.voucherCode}]:</span>
            <strong>-${formatCur(giamGia)}</strong>
          </div>
        ` : ''}
        <div class="summary-row">
          <span>Phí vận chuyển giao tận nhà:</span>
          <strong style="color: #10b981;">0 đ (Miễn Phí)</strong>
        </div>
        <div class="summary-row total">
          <span>TỔNG THANH TOÁN:</span>
          <span>${formatCur(tongTien)}</span>
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

/**
 * [HÀM 7] Render Lịch sử đơn hàng trong trang Profile người dùng
 * @param {string} containerId - ID của thẻ tbody cần điền
 * @param {Array<Object>} orders - Danh sách đơn hàng của tài khoản
 */
function renderUserOrders(containerId, orders = []) {
  const tbody = document.getElementById(containerId);
  if (!tbody) return;

  if (!orders || orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 36px 20px; color: var(--text-muted);">
          <i class="fa-solid fa-box-open" style="font-size: 36px; margin-bottom: 10px; display: block; color: #94a3b8;"></i>
          <span style="font-size: 14px; font-weight: 600;">Bạn chưa có đơn hàng nào tại SmartStore. Hãy khám phá và mua sắm ngay!</span>
        </td>
      </tr>
    `;
    return;
  }

  const formatCur = window.baseView ? window.baseView.formatCurrency : (n => Number(n).toLocaleString('vi-VN') + ' đ');

  tbody.innerHTML = orders.map(d => {
    const ngay = d.createdAt ? new Date(d.createdAt).toLocaleDateString('vi-VN') : 'Mới';
    const statusInfo = ORDER_STATUS_MAP[d.status] ?? { badgeClass: 'badge-warning', label: 'Chờ xử lý' };
    const statusBadge = `<span class="badge ${statusInfo.badgeClass}">${statusInfo.label}</span>`;
    const canCancel = d.status === 'processing' || d.status === 'pending';
    const itemsSummary = (d.items || []).map(i => `${i.name} (x${i.quantity})`).join(', ') || 'Chi tiết trong hóa đơn';
    const paymentLabel = d.paymentMethod === 'BANK' ? 'Chuyển khoản' : (d.paymentMethod || 'COD');

    return `
      <tr>
        <td><strong style="color: var(--primary);">${d.orderCode}</strong></td>
        <td>${ngay}</td>
        <td style="max-width: 250px; font-size: 13px;" title="${itemsSummary}">${itemsSummary}</td>
        <td style="font-weight: 700; color: var(--accent);">${formatCur(d.totalAmount)}</td>
        <td><span class="badge" style="background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; font-size: 11px;">${paymentLabel}</span></td>
        <td>${statusBadge}</td>
        <td style="text-align: center;">
          <div style="display: flex; gap: 6px; justify-content: center;">
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

/**
 * [HÀM 8] Render Kết quả tra cứu đơn hàng (Tracking View) kèm Stepper tiến trình
 * @param {string} containerId - ID vùng chứa kết quả tra cứu
 * @param {Array<Object>} orders - Kết quả đơn hàng tìm thấy
 */
function renderTrackingResult(containerId, orders = []) {
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

  const formatCur = window.baseView ? window.baseView.formatCurrency : (n => Number(n).toLocaleString('vi-VN') + ' đ');

  container.innerHTML = orders.map(d => {
    // Phân bổ trạng thái Stepper 4 bước
    let step1 = 'completed', step2 = '', step3 = '', step4 = '';
    if (d.status === 'processing' || d.status === 'pending') {
      step2 = 'active';
    } else if (d.status === 'shipping') {
      step2 = 'completed';
      step3 = 'active';
    } else if (d.status === 'completed' || d.status === 'delivered') {
      step2 = 'completed';
      step3 = 'completed';
      step4 = 'completed';
    } else if (d.status === 'cancelled') {
      step2 = 'cancelled';
    }

    return `
      <div class="checkout-card" style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 16px;">
          <div>
            <span style="font-size: 13px; color: var(--text-muted);">Mã đơn hàng:</span>
            <h3 style="font-size: 1.3rem; font-weight: 800; color: var(--primary); margin: 0;">${d.orderCode}</h3>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 13px; color: var(--text-muted);">Tổng thanh toán:</span>
            <div style="font-size: 1.25rem; font-weight: 800; color: var(--accent);">${formatCur(d.totalAmount)}</div>
          </div>
        </div>

        <!-- Stepper Tiến trình Đơn Hàng -->
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

// ============================================================================
// XUẤT BẢN MODULE THEO PHONG CÁCH DÙNG HÀM HIỆN ĐẠI
// ============================================================================
const cartView = {
  renderCartTable,
  renderRewardBar,
  renderCheckoutSummary,
  renderVoucherChips,
  renderUserOrders
};

const orderView = {
  renderThankYouView,
  renderInvoiceModal,
  renderUserOrders,
  renderTrackingResult
};

function CartView() { return cartView; }
Object.assign(CartView, cartView);

function OrderView() { return orderView; }
Object.assign(OrderView, orderView);

if (typeof window !== 'undefined') {
  window.cartView = cartView;
  window.CartView = CartView;
  window.orderView = orderView;
  window.OrderView = OrderView;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CartView, OrderView, cartView, orderView };
}
