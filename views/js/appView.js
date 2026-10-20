/**
 * ============================================================================
 * APP VIEW (MÔ HÌNH HIỂN THỊ GIAO DIỆN TỔNG HỢP)
 * Gộp toàn bộ: BaseView, ProductView, CartView, OrderView, UserView
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * ============================================================================
 */


class BaseView {
  /** Định dạng tiền Việt Nam Đồng chuẩn */
  static formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  }

  /** Hiển thị Toast thông báo trạng thái nổi góc dưới */
  static showToast(message, type = 'success') {
    const toast = document.getElementById('toast-container');
    const toastMsg = document.getElementById('toast-message');
    if (!toast || !toastMsg) return;

    toastMsg.textContent = message;
    toast.className = 'toast-notice show';

    if (type === 'error') {
      toast.style.borderLeftColor = 'var(--danger)';
      toast.querySelector('i').className = 'fa-solid fa-triangle-exclamation';
      toast.querySelector('i').style.color = 'var(--danger)';
    } else if (type === 'warning') {
      toast.style.borderLeftColor = 'var(--warning)';
      toast.querySelector('i').className = 'fa-solid fa-circle-exclamation';
      toast.querySelector('i').style.color = 'var(--warning)';
    } else if (type === 'info') {
      toast.style.borderLeftColor = 'var(--primary)';
      toast.querySelector('i').className = 'fa-solid fa-circle-info';
      toast.querySelector('i').style.color = 'var(--primary)';
    } else {
      toast.style.borderLeftColor = 'var(--success)';
      toast.querySelector('i').className = 'fa-solid fa-circle-check';
      toast.querySelector('i').style.color = 'var(--success)';
    }

    clearTimeout(window.__toastTimeout);
    window.__toastTimeout = setTimeout(() => {
      toast.className = 'toast-notice';
    }, 3500);
  }

  /** Mở Modal Hộp thoại */
  static openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  /** Đóng Modal */
  static closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  /** Đóng tất cả Modal đang mở */
  static closeAllModals() {
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
  }

  /** Cập nhật số lượng huy hiệu giỏ hàng trên Header */
  static updateCartBadge(count) {
    const badge = document.getElementById('cart-badge-count');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
      badge.classList.remove('badge-bounce');
      void badge.offsetWidth; // trigger reflow
      badge.classList.add('badge-bounce');
    }
  }

  /** Cập nhật khu vực tài khoản trên Navbar */
  static renderNavUser(user) {
    const container = document.getElementById('user-nav-status');
    if (!container) return;

    if (user) {
      const displayName = user.name || user.email.split('@')[0];
      const roleBadge = user.role === 'admin' 
        ? '<span style="background:var(--accent); color:#fff; font-size:10px; padding:2px 6px; border-radius:4px; margin-left:4px; font-weight:800;">ADMIN</span>' 
        : '';

      container.innerHTML = `
        <div class="user-profile-menu" style="position: relative;">
          <button class="btn-secondary btn-sm" id="user-menu-btn" style="display: flex; align-items: center; gap: 8px; border-radius: var(--radius-full);">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700;">
              ${displayName.charAt(0).toUpperCase()}
            </div>
            <span style="font-weight: 700; max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${displayName}
            </span>
            ${roleBadge}
            <i class="fa-solid fa-chevron-down" style="font-size: 11px;"></i>
          </button>
          
          <div class="user-dropdown-card" id="user-dropdown">
            <div style="padding: 12px 16px; border-bottom: 1px solid var(--border);">
              <div style="font-weight: 700; color: var(--text); font-size: 14px;">${displayName}</div>
              <div style="font-size: 12px; color: var(--text-muted);">${user.email}</div>
            </div>
            <ul style="list-style: none; padding: 6px 0; margin: 0;">
              <li>
                <a href="javascript:void(0)" onclick="window.appNav.goTo('profile')" class="dropdown-link">
                  <i class="fa-solid fa-id-card"></i> Hồ sơ của tôi
                </a>
              </li>
              <li>
                <a href="javascript:void(0)" onclick="window.appNav.goTo('profile')" class="dropdown-link">
                  <i class="fa-solid fa-box-archive"></i> Đơn hàng đã mua
                </a>
              </li>
              ${user.role === 'admin' ? `
              <li>
                <a href="javascript:void(0)" onclick="window.appNav.goTo('admin')" class="dropdown-link" style="color: var(--accent); font-weight: 700;">
                  <i class="fa-solid fa-screwdriver-wrench"></i> Quản trị Admin
                </a>
              </li>` : ''}
              <li style="border-top: 1px solid var(--border); margin-top: 4px; padding-top: 4px;">
                <a href="javascript:void(0)" onclick="window.authModule.logout()" class="dropdown-link text-danger">
                  <i class="fa-solid fa-right-from-bracket"></i> Đăng xuất
                </a>
              </li>
            </ul>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <button class="btn-primary btn-sm" onclick="window.appNav.goTo('auth')">
          <i class="fa-solid fa-user"></i> Đăng Nhập
        </button>
      `;
    }
  }

  /** Đánh dấu tab menu active trên header */
  static highlightActiveNav(viewName) {
    document.querySelectorAll('.main-nav .nav-item').forEach(btn => {
      if (btn.getAttribute('data-view') === viewName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
}

// Khởi tạo Singleton toàn cục trong namespace View
window.BaseView = BaseView;



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



class UserView {
  /** Chuyển tab giữa Đăng Nhập và Đăng Ký */
  static switchAuthTab(tab) {
    const tabLogin = document.getElementById('tab-login-btn');
    const tabRegister = document.getElementById('tab-register-btn');
    const formLogin = document.getElementById('auth-login-form');
    const formRegister = document.getElementById('auth-register-form');

    if (tab === 'register') {
      if (tabLogin) tabLogin.classList.remove('active');
      if (tabRegister) tabRegister.classList.add('active');
      if (formLogin) formLogin.style.display = 'none';
      if (formRegister) formRegister.style.display = 'block';
    } else {
      if (tabLogin) tabLogin.classList.add('active');
      if (tabRegister) tabRegister.classList.remove('active');
      if (formLogin) formLogin.style.display = 'block';
      if (formRegister) formRegister.style.display = 'none';
    }
  }

  /** Render thông tin vào form Hồ sơ cá nhân */
  static renderProfileForm(user) {
    if (!user) return;

    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    const phoneInput = document.getElementById('profile-phone');
    const addrInput = document.getElementById('profile-address');
    const avatarEl = document.getElementById('profile-avatar-letter');
    const titleEl = document.getElementById('profile-display-name');

    if (nameInput) nameInput.value = user.name || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.phone || '';
    if (addrInput) addrInput.value = user.address || '';

    const displayName = user.name || user.email.split('@')[0];
    if (avatarEl) avatarEl.textContent = displayName.charAt(0).toUpperCase();
    if (titleEl) titleEl.textContent = displayName;
  }

  /** Hiển thị thẻ nhận diện thông minh (Smart Identity Card) khi gõ email lúc thanh toán */
  static renderSmartIdentityCard(containerId, user) {
    const box = document.getElementById(containerId);
    if (!box) return;

    if (!user) {
      box.style.display = 'none';
      box.innerHTML = '';
      return;
    }

    box.style.display = 'block';
    box.innerHTML = `
      <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1.5px solid #93c5fd; border-radius: var(--radius-md); padding: 14px; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; animation: fadeIn 0.3s ease;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700;">
            ${(user.name || user.email).charAt(0).toUpperCase()}
          </div>
          <div>
            <div style="font-size: 13px; font-weight: 700; color: #1e3a8a;">
              Chào bạn, chúng tôi nhận diện tài khoản: <strong>${user.name || user.email}</strong>
            </div>
            <div style="font-size: 12px; color: #3b82f6;">
              Bấm xác nhận để tự động điền SĐT & Địa chỉ nhận hàng của bạn!
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 6px;">
          <button type="button" class="btn-primary btn-sm" id="btn-smart-confirm" onclick="window.authModule.confirmSmartIdentity()">
            <i class="fa-solid fa-check"></i> Điền Nhanh
          </button>
          <button type="button" class="btn-secondary btn-sm" id="btn-smart-cancel" onclick="window.authModule.cancelSmartIdentity()">
            Bỏ qua
          </button>
        </div>
      </div>
    `;
  }
}

// Khởi tạo Singleton toàn cục trong namespace View
window.UserView = UserView;


