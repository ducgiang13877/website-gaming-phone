/**
 * ============================================================================
 * VIEW: ProductView (Render Lưới Sản phẩm, Chi tiết, So sánh, Phân trang)
 * Kiến trúc: Mô hình MVC Chuẩn - SmartStore
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * ============================================================================
 */

class ProductView {
  /** Tạo chuỗi HTML thẻ sản phẩm chuẩn UI/UX */
  static createProductCardHtml(sp, isComparing = false, categoryName = '') {
    const formatCurrency = BaseView.formatCurrency;
    const tonKho = (sp.stock !== undefined && sp.stock !== null) ? Number(sp.stock) : (Number(sp.quantity) || 10);
    const hetHang = tonKho <= 0;
    const thongSo = sp.specs || {};
    const tenHang = categoryName || sp.brand || 'Chính Hãng';

    let badgeGiamGiaHTML = '';
    if (sp.originalPrice && sp.originalPrice > sp.price) {
      const ptGiam = Math.round(((sp.originalPrice - sp.price) / sp.originalPrice) * 100);
      badgeGiamGiaHTML = `<span class="badge badge-sale">Giảm ${ptGiam}%</span>`;
    } else if (sp.isHot) {
      badgeGiamGiaHTML = `<span class="badge badge-hot">Hot 🔥</span>`;
    }

    return `
      <div class="product-card" data-id="${sp.id}">
        <div class="card-badge-box">
          ${badgeGiamGiaHTML}
          ${hetHang ? '<span class="badge badge-out-stock">Hết hàng</span>' : ''}
        </div>

        <div class="card-img-box" onclick="window.appNav.goTo('detail', { id: '${sp.id}' })">
          <img src="${sp.image}" alt="${sp.name}" loading="lazy" onerror="this.onerror=null; this.src='https://picsum.photos/300/300';">
        </div>

        <div class="card-body">
          <div class="card-brand">${tenHang}</div>
          <h3 class="card-title" onclick="window.appNav.goTo('detail', { id: '${sp.id}' })" title="${sp.name}">
            ${sp.name}
          </h3>

          <!-- Cụm Specs Chips rút gọn -->
          <div class="card-specs-chips">
            ${thongSo.ram ? `<span class="spec-chip"><i class="fa-solid fa-microchip"></i> ${thongSo.ram}</span>` : ''}
            ${(thongSo.battery || thongSo.pin) ? `<span class="spec-chip"><i class="fa-solid fa-battery-three-quarters"></i> ${(thongSo.battery || thongSo.pin).split(',')[0]}</span>` : ''}
            ${(thongSo.cpu || thongSo.chip) ? `<span class="spec-chip"><i class="fa-solid fa-bolt"></i> ${(thongSo.cpu || thongSo.chip).split(' ')[0]}</span>` : ''}
          </div>

          <div class="card-price-row">
            <div class="card-current-price">${formatCurrency(sp.price)}</div>
            ${sp.originalPrice && sp.originalPrice > sp.price ? `
              <div class="card-original-price">${formatCurrency(sp.originalPrice)}</div>
            ` : ''}
          </div>

          <div class="card-stock-row">
            <span class="stock-indicator ${hetHang ? 'out' : 'in'}">
              <i class="fa-solid fa-circle" style="font-size: 8px;"></i>
              ${hetHang ? 'Tạm hết hàng' : `Còn sẵn ${tonKho} máy`}
            </span>
            <span class="sold-count">Đã bán ${sp.sold || 0}</span>
          </div>

          <!-- Cụm nút thao tác -->
          <div class="card-actions-row">
            <button class="btn-quickview" onclick="window.appNav.quickView('${sp.id}')" title="Xem nhanh cấu hình">
              <i class="fa-solid fa-eye"></i>
            </button>

            <button class="btn-compare-card ${isComparing ? 'active' : ''}" 
                    id="btn-compare-card-${sp.id}"
                    onclick="window.compareModule.toggle('${sp.id}')" 
                    title="${isComparing ? 'Đang so sánh - Bấm để bỏ' : 'Thêm vào so sánh'}">
              <i class="fa-solid ${isComparing ? 'fa-check' : 'fa-code-compare'}"></i>
              <span>${isComparing ? 'Đã chọn' : 'So sánh'}</span>
            </button>

            <button class="btn-add-cart" 
                    onclick="window.cartModule.add('${sp.id}')" 
                    ${hetHang ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''} 
                    title="Thêm vào giỏ hàng">
              <i class="fa-solid fa-cart-plus"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /** Render lưới sản phẩm */
  static renderProductGrid(containerId, products, compareIds = [], categories = [], emptyMsg = 'Không tìm thấy sản phẩm phù hợp!') {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!products || products.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box" style="grid-column: 1 / -1; padding: 40px; text-align: center;">
          <i class="fa-solid fa-mobile-screen" style="font-size: 40px; color: var(--text-muted); margin-bottom: 12px;"></i>
          <h4 style="color: var(--text); font-size: 16px;">${emptyMsg}</h4>
          <p style="color: var(--text-muted); font-size: 13px;">Vui lòng thử tìm kiếm với từ khóa khác hoặc điều chỉnh lại bộ lọc.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = products.map(sp => {
      const isComparing = compareIds.includes(String(sp.id));
      const cat = categories.find(c => String(c.id) === String(sp.categoryId || sp.cate_id));
      const catName = cat ? cat.name : (sp.brand || '');
      return this.createProductCardHtml(sp, isComparing, catName);
    }).join('');
  }

  /** Render thanh phân trang */
  static renderPagination(containerId, totalPages, currentPage) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = '';
    // Nút Trước
    html += `
      <button class="pagination-btn ${currentPage <= 1 ? 'disabled' : ''}" 
              onclick="window.shopModule.changePage(${currentPage - 1})" 
              ${currentPage <= 1 ? 'disabled' : ''}>
        <i class="fa-solid fa-chevron-left"></i> Trước
      </button>
    `;

    // Các số trang
    for (let i = 1; i <= totalPages; i++) {
      html += `
        <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                onclick="window.shopModule.changePage(${i})">
          ${i}
        </button>
      `;
    }

    // Nút Sau
    html += `
      <button class="pagination-btn ${currentPage >= totalPages ? 'disabled' : ''}" 
              onclick="window.shopModule.changePage(${currentPage + 1})" 
              ${currentPage >= totalPages ? 'disabled' : ''}>
        Sau <i class="fa-solid fa-chevron-right"></i>
      </button>
    `;

    container.innerHTML = html;
  }

  /** Render Chi tiết sản phẩm với Bảng 10 Thông số Kỹ thuật Chuẩn CellphoneS */
  static renderProductDetail(containerId, sp, categoryName = '', isComparing = false) {
    const container = document.getElementById(containerId);
    if (!container || !sp) return;

    const formatCurrency = BaseView.formatCurrency;
    const ts = sp.specs || {};
    const tonKho = (sp.stock !== undefined && sp.stock !== null) ? Number(sp.stock) : (Number(sp.quantity) || 10);
    const hetHang = tonKho <= 0;
    const tenHang = categoryName || sp.brand || 'Chính Hãng';

    container.innerHTML = `
      <div class="detail-gallery-box">
        <img src="${sp.image}" alt="${sp.name}" onerror="this.onerror=null; this.src='https://picsum.photos/300/300';">
      </div>

      <div class="detail-info-col">
        <div style="font-size: 13px; font-weight: 700; color: var(--primary); text-transform: uppercase;">
          Thương hiệu: ${tenHang}
        </div>
        <h1>${sp.name}</h1>
        <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">
          <span>Đã bán: <strong>${sp.sold || 0} máy</strong></span> • 
          <span style="color: ${hetHang ? 'var(--accent)' : 'var(--success)'}; font-weight: 700;">
            ${hetHang ? 'Hết hàng' : `Còn sẵn ${tonKho} máy tại kho`}
          </span>
        </div>

        <div class="detail-price-box">
          <div class="detail-current-price">${formatCurrency(sp.price)}</div>
          ${sp.originalPrice && sp.originalPrice > sp.price ? `
            <div class="detail-original-price">${formatCurrency(sp.originalPrice)}</div>
          ` : ''}
        </div>

        <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 18px;">
          ${sp.detail || sp.description || 'Sản phẩm chính hãng, đầy đủ phụ kiện, bảo hành 12 tháng 1 đổi 1 tại các trung tâm bảo hành toàn quốc.'}
        </p>

        <!-- Bộ chọn số lượng -->
        <div class="detail-qty-control">
          <span>Số lượng:</span>
          <div class="qty-btn-group">
            <button type="button" onclick="window.detailModule.changeQty(-1)" title="Giảm số lượng">-</button>
            <input type="number" id="detail-qty-input" value="1" min="1" max="${tonKho}" readonly>
            <button type="button" onclick="window.detailModule.changeQty(1)" title="Tăng số lượng">+</button>
          </div>
        </div>

        <!-- Cụm nút hành động -->
        <div style="display: flex; gap: 12px; margin-top: 20px; flex-wrap: wrap;">
          <button class="btn-primary" onclick="window.cartModule.add('${sp.id}', window.detailModule.getQty())" ${hetHang ? 'disabled style="opacity: 0.5;"' : ''}>
            <i class="fa-solid fa-cart-plus"></i> Thêm Vào Giỏ
          </button>
          <button class="btn-success btn-buy-now" onclick="window.detailModule.buyNow('${sp.id}')" ${hetHang ? 'disabled style="opacity: 0.5;"' : ''}>
            <i class="fa-solid fa-bolt"></i> Mua Ngay
          </button>
          <button class="btn-secondary" onclick="window.compareModule.toggle('${sp.id}')">
            <i class="fa-solid ${isComparing ? 'fa-check' : 'fa-code-compare'}"></i>
            <span>${isComparing ? 'Đang So Sánh' : 'So Sánh Máy'}</span>
          </button>
        </div>

        <!-- Cam kết chính sách -->
        <div style="margin-top: 24px; padding: 14px; background: #f8fafc; border-radius: var(--radius-md); border: 1px dashed var(--border); font-size: 12.5px; color: #475569; line-height: 1.8;">
          <div><i class="fa-solid fa-shield-halved" style="color: var(--primary);"></i> Bảo hành chính hãng 12 tháng tại hơn 100 TTBH toàn quốc</div>
          <div><i class="fa-solid fa-rotate-left" style="color: var(--primary);"></i> 1 đổi 1 trong 30 ngày nếu phát sinh lỗi từ nhà sản xuất</div>
          <div><i class="fa-solid fa-truck-fast" style="color: var(--primary);"></i> Giao hàng hỏa tốc trong 2 giờ nội thành</div>
        </div>
      </div>

      <!-- BẢNG 10 THÔNG SỐ KỸ THUẬT CHUẨN CELLPHONES -->
      <div class="detail-specs-table-box" style="grid-column: 1 / -1; margin-top: 30px;">
        <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text); margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-microchip" style="color: var(--primary);"></i> 
          Bảng 10 Thông Số Kỹ Thuật Chi Tiết
        </h3>
        <table class="specs-table">
          <tbody>
            <tr><td><i class="fa-solid fa-mobile-screen"></i> Màn hình</td><td><strong>${ts.screen || '6.7 inch AMOLED 120Hz, 1.5K'}</strong></td></tr>
            <tr><td><i class="fa-solid fa-bolt"></i> Chipset (CPU)</td><td><strong>${ts.cpu || ts.chip || 'Snapdragon 8 Elite / Dimensity 9400'}</strong></td></tr>
            <tr><td><i class="fa-solid fa-memory"></i> Dung lượng RAM</td><td><strong>${ts.ram || '16GB LPDDR5X'}</strong></td></tr>
            <tr><td><i class="fa-solid fa-hard-drive"></i> Bộ nhớ trong (ROM)</td><td><strong>${ts.rom || '512GB UFS 4.0'}</strong></td></tr>
            <tr><td><i class="fa-solid fa-camera"></i> Camera sau</td><td><strong>${ts.rearCamera || ts.camera || '50MP OIS Sony IMX'}</strong></td></tr>
            <tr><td><i class="fa-solid fa-camera-rotate"></i> Camera trước</td><td><strong>${ts.frontCamera || '32MP HDR'}</strong></td></tr>
            <tr><td><i class="fa-solid fa-battery-three-quarters"></i> Pin & Công nghệ sạc</td><td><strong>${ts.battery || ts.pin || '6000mAh, Sạc siêu nhanh 120W'}</strong></td></tr>
            <tr><td><i class="fa-brands fa-android"></i> Hệ điều hành</td><td><strong>${ts.os || 'Android 15 / iOS 18'}</strong></td></tr>
            <tr><td><i class="fa-solid fa-weight-scale"></i> Trọng lượng & Thiết kế</td><td><strong>${ts.weight || '210g, Khung kim loại mặt lưng kính'}</strong></td></tr>
            <tr><td><i class="fa-solid fa-star"></i> Tính năng đặc biệt</td><td><strong>${ts.special || 'Hệ thống tản nhiệt buồng hơi ICE 13.0, Nút Trigger cảm ứng'}</strong></td></tr>
          </tbody>
        </table>
      </div>
    `;
  }

  /** Render Bảng So Sánh 10 Tiêu Chí */
  static renderComparisonTable(containerId, products = [], categories = []) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!products || products.length === 0) {
      container.innerHTML = `
        <div style="padding: 40px; text-align: center; color: var(--text-muted);">
          <i class="fa-solid fa-sliders" style="font-size: 36px; margin-bottom: 12px; display: block;"></i>
          Chưa có sản phẩm nào được chọn để so sánh. Hãy bấm nút "So sánh" trên các sản phẩm ở Cửa Hàng!
        </div>
      `;
      return;
    }

    const formatCurrency = BaseView.formatCurrency;

    let headersHtml = '<th>Tiêu chí so sánh</th>';
    products.forEach(sp => {
      headersHtml += `
        <th style="min-width: 220px; text-align: center;">
          <div style="position: relative;">
            <button onclick="window.compareModule.remove('${sp.id}')" class="btn-danger btn-sm" style="position: absolute; right: 0; top: 0;" title="Xóa khỏi so sánh">
              <i class="fa-solid fa-xmark"></i>
            </button>
            <img src="${sp.image}" alt="${sp.name}" style="width: 100px; height: 100px; object-fit: contain; margin: 0 auto 10px; display: block;">
            <div style="font-weight: 800; font-size: 14px; margin-bottom: 6px;">${sp.name}</div>
            <div style="color: var(--primary); font-weight: 800; font-size: 15px;">${formatCurrency(sp.price)}</div>
            <button class="btn-primary btn-sm" style="margin-top: 8px; width: 100%;" onclick="window.cartModule.add('${sp.id}')">
              <i class="fa-solid fa-cart-plus"></i> Thêm Vào Giỏ
            </button>
          </div>
        </th>
      `;
    });

    const criteria = [
      { label: 'Thương hiệu', getVal: sp => {
        const c = categories.find(cat => String(cat.id) === String(sp.categoryId || sp.cate_id));
        return c ? c.name : (sp.brand || 'Chính hãng');
      }},
      { label: 'Màn hình', getVal: sp => sp.specs?.screen || 'Đang cập nhật' },
      { label: 'Chipset (CPU)', getVal: sp => sp.specs?.cpu || sp.specs?.chip || 'Đang cập nhật' },
      { label: 'RAM', getVal: sp => sp.specs?.ram || 'Đang cập nhật' },
      { label: 'Bộ nhớ ROM', getVal: sp => sp.specs?.rom || 'Đang cập nhật' },
      { label: 'Camera sau', getVal: sp => sp.specs?.rearCamera || sp.specs?.camera || 'Đang cập nhật' },
      { label: 'Camera trước', getVal: sp => sp.specs?.frontCamera || 'Đang cập nhật' },
      { label: 'Dung lượng Pin & Sạc', getVal: sp => sp.specs?.battery || sp.specs?.pin || 'Đang cập nhật' },
      { label: 'Hệ điều hành', getVal: sp => sp.specs?.os || 'Đang cập nhật' },
      { label: 'Tính năng đặc biệt', getVal: sp => sp.specs?.special || 'Đang cập nhật' }
    ];

    let rowsHtml = '';
    criteria.forEach(c => {
      rowsHtml += `<tr><td><strong>${c.label}</strong></td>`;
      products.forEach(sp => {
        rowsHtml += `<td>${c.getVal(sp)}</td>`;
      });
      rowsHtml += '</tr>';
    });

    container.innerHTML = `
      <table class="specs-table compare-table">
        <thead><tr>${headersHtml}</tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `;
  }

  /** Render Dock So Sánh Nổi Dưới Màn Hình */
  static renderStickyCompareDock(dockId, products = []) {
    const dock = document.getElementById(dockId);
    if (!dock) return;

    if (!products || products.length === 0) {
      dock.style.display = 'none';
      return;
    }

    dock.style.display = 'block';
    const countEl = document.getElementById('dock-compare-count');
    if (countEl) countEl.textContent = products.length;

    const thumbsEl = document.getElementById('dock-compare-thumbs');
    if (thumbsEl) {
      thumbsEl.innerHTML = products.map(sp => `
        <div style="position: relative; width: 40px; height: 40px; background: #fff; border-radius: 6px; padding: 2px;">
          <img src="${sp.image}" alt="${sp.name}" style="width: 100%; height: 100%; object-fit: contain;">
          <button onclick="window.compareModule.remove('${sp.id}')" style="position: absolute; -top: 4px; -right: 4px; background: var(--accent); color: #fff; border: none; border-radius: 50%; width: 16px; height: 16px; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center;">&times;</button>
        </div>
      `).join('');
    }
  }

  /** Render Modal Xem Nhanh Sản Phẩm */
  static renderQuickViewModal(modalBodyId, sp, categoryName = '') {
    const body = document.getElementById(modalBodyId);
    if (!body || !sp) return;

    const formatCurrency = BaseView.formatCurrency;
    const ts = sp.specs || {};
    const tenHang = categoryName || sp.brand || 'Chính Hãng';

    body.innerHTML = `
      <div style="display: grid; grid-template-columns: 280px 1fr; gap: 24px; align-items: center;">
        <div style="background: #f8fafc; border-radius: var(--radius-md); padding: 20px; text-align: center;">
          <img src="${sp.image}" alt="${sp.name}" style="max-width: 100%; max-height: 240px; object-fit: contain;">
        </div>
        <div>
          <div style="font-size: 12px; font-weight: 700; color: var(--primary); text-transform: uppercase;">${tenHang}</div>
          <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--text); margin: 6px 0 10px;">${sp.name}</h2>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--primary); margin-bottom: 14px;">
            ${formatCurrency(sp.price)}
          </div>
          <ul style="font-size: 13.5px; line-height: 1.8; color: #475569; padding-left: 18px; margin-bottom: 18px;">
            <li><strong>Màn hình:</strong> ${ts.screen || 'Đang cập nhật'}</li>
            <li><strong>Chipset:</strong> ${ts.cpu || ts.chip || 'Đang cập nhật'}</li>
            <li><strong>RAM / ROM:</strong> ${ts.ram || '8GB'} / ${ts.rom || '256GB'}</li>
            <li><strong>Pin & Sạc:</strong> ${ts.battery || ts.pin || '5000mAh'}</li>
          </ul>
          <div style="display: flex; gap: 10px;">
            <button class="btn-primary" onclick="window.cartModule.add('${sp.id}'); BaseView.closeModal('quick-view-modal');">
              <i class="fa-solid fa-cart-plus"></i> Thêm Vào Giỏ
            </button>
            <button class="btn-secondary" onclick="window.appNav.goTo('detail', { id: '${sp.id}' }); BaseView.closeModal('quick-view-modal');">
              Xem Đầy Đủ Chi Tiết <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

// Khởi tạo Singleton toàn cục trong namespace View
window.ProductView = ProductView;
