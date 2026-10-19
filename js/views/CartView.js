/**
 * ============================================================================
 * VIEW: CartView (Render Giỏ Hàng, Thanh Quà Tặng, Voucher & Tóm Tắt Thanh Toán)
 * Kiến trúc: Mô hình MVC Chuẩn - SmartStore
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * ============================================================================
 */

class CartView {
  /** Render bảng giỏ hàng */
  static renderCartTable(items = [], subtotal = 0) {
    const emptyBox = document.getElementById('cart-empty-state');
    const contentBox = document.getElementById('cart-content-wrapper');
    const tbody = document.getElementById('cart-table-tbody');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-grand-total');
    const formatCurrency = BaseView.formatCurrency;

    if (!items || items.length === 0) {
      if (emptyBox) emptyBox.style.display = 'block';
      if (contentBox) contentBox.style.display = 'none';
      this.renderRewardBar(0);
      return;
    }

    if (emptyBox) emptyBox.style.display = 'none';
    if (contentBox) contentBox.style.display = 'grid';

    if (tbody) {
      tbody.innerHTML = items.map(item => {
        const lineTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
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
            <td style="font-weight: 700;">${formatCurrency(item.price)}</td>
            <td>
              <div class="qty-btn-group">
                <button type="button" onclick="window.cartModule.changeQty('${item.id}', -1)" title="Giảm số lượng">-</button>
                <input type="number" value="${item.quantity}" readonly>
                <button type="button" onclick="window.cartModule.changeQty('${item.id}', 1)" title="Tăng số lượng">+</button>
              </div>
            </td>
            <td style="font-weight: 800; color: var(--accent);">${formatCurrency(lineTotal)}</td>
            <td style="text-align: center;">
              <button class="btn-danger btn-sm" onclick="window.cartModule.remove('${item.id}')" title="Xóa món này">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }

    if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
    if (totalEl) totalEl.textContent = formatCurrency(subtotal);

    this.renderRewardBar(subtotal);
  }

  /** Render Thanh Tiến Trình Quà Tặng (Gamification Reward Bar) */
  static renderRewardBar(tongTien = 0) {
    const rewardEl = document.getElementById('cart-reward-bar');
    if (!rewardEl) return;

    if (tongTien <= 0) {
      rewardEl.innerHTML = '';
      rewardEl.style.display = 'none';
      return;
    }

    rewardEl.style.display = 'block';
    const moc1 = 10000000; // 10 triệu
    const moc2 = 20000000; // 20 triệu

    let phanTram = 0;
    let thongDiep = '';
    let badgeText = '';
    const formatCurrency = BaseView.formatCurrency;

    if (tongTien < moc1) {
      phanTram = Math.min(100, Math.round((tongTien / moc1) * 50));
      const thieu = moc1 - tongTien;
      thongDiep = `🎁 Mua thêm <strong style="color:var(--accent); font-weight:800;">${formatCurrency(thieu)}</strong> để nhận ngay <strong>Củ Sạc Nhanh 67W Cao Cấp</strong> trị giá 450.000 đ!`;
      badgeText = 'Mốc Quà 1 (Đơn từ 10tr)';
    } else if (tongTien < moc2) {
      const phanTramDoan2 = Math.round(((tongTien - moc1) / (moc2 - moc1)) * 50);
      phanTram = 50 + phanTramDoan2;
      const thieu = moc2 - tongTien;
      thongDiep = `🎉 Đã nhận Củ Sạc 67W! Mua thêm <strong style="color:var(--accent); font-weight:800;">${formatCurrency(thieu)}</strong> để nhận <strong>Tai Nghe Gaming Type-C & Balo Độc Quyền</strong> trị giá 790.000 đ!`;
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

  /** Render Tóm Tắt Thanh Toán Đơn Hàng (Checkout Summary) */
  static renderCheckoutSummary(items = [], subtotal = 0, discount = 0, total = 0, appliedVoucher = null) {
    const formatCurrency = BaseView.formatCurrency;

    // Danh sách tóm tắt món hàng
    const itemsListEl = document.getElementById('checkout-items-list') || document.getElementById('checkout-items-summary');
    if (itemsListEl) {
      itemsListEl.innerHTML = items.map(item => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed var(--border); font-size: 13.5px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <img src="${item.image}" alt="${item.name}" style="width: 36px; height: 36px; object-fit: contain; border-radius: 4px;">
            <div>
              <div style="font-weight: 600; color: var(--text);">${item.name}</div>
              <div style="font-size: 12px; color: var(--text-muted);">x${item.quantity}</div>
            </div>
          </div>
          <div style="font-weight: 700; color: var(--text);">${formatCurrency(item.price * item.quantity)}</div>
        </div>
      `).join('');
    }

    // Các trường tiền
    const subtotalEl = document.getElementById('checkout-subtotal');
    if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);

    const discountEl = document.getElementById('checkout-discount-amount') || document.getElementById('checkout-discount');
    const discountRow = document.getElementById('checkout-discount-row');
    if (discountEl) {
      discountEl.textContent = discount > 0 ? `-${formatCurrency(discount)}` : '-0 đ';
      if (discountRow) discountRow.style.display = discount > 0 ? 'flex' : 'none';
    }

    const totalEl = document.getElementById('checkout-grand-total') || document.getElementById('checkout-total-amount');
    if (totalEl) totalEl.textContent = formatCurrency(total);

    // Alert voucher đang áp dụng
    const alertBox = document.getElementById('applied-voucher-alert') || document.getElementById('voucher-applied-box');
    if (alertBox) {
      if (appliedVoucher && discount > 0) {
        alertBox.style.display = 'flex';
        alertBox.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-circle-check" style="color: var(--success); font-size: 18px;"></i>
            <div>
              <strong style="color: #065f46;">Đã áp dụng mã: ${appliedVoucher.code}</strong>
              <div style="font-size: 12px; color: #047857;">Giảm ngay ${formatCurrency(discount)} trên đơn hàng</div>
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

  /** Render danh sách voucher chips gợi ý bấm chọn nhanh */
  static renderVoucherChips(vouchers = [], appliedVoucher = null, subtotal = 0) {
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
             title="${v.desc || ''}">
          <div style="font-weight: 800; font-size: 12px;"><i class="fa-solid fa-ticket"></i> ${v.code}</div>
          <div style="font-size: 11px; opacity: 0.9;">${v.desc || 'Mã ưu đãi'}</div>
        </div>
      `;
    }).join('');
  }
}

// Khởi tạo Singleton toàn cục trong namespace View
window.CartView = CartView;
