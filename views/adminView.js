/**
 * ============================================================================
 * SMARTSTORE ADMIN VIEW (TẦNG VIEW QUẢN TRỊ)
 * Đảm nhiệm hiển thị toàn bộ giao diện Bảng điều khiển Quản trị viên (Admin Dashboard)
 * Tương thích 100% với views/admin.html và controllers/adminController.js
 * ============================================================================
 */

/**
 * [HÀM 1] Định dạng tiền tệ VND chuẩn hiển thị
 * @param {number} so - Số tiền
 * @returns {string} Chuỗi tiền tệ dạng "25.000.000 đ"
 */
function formatCurrency(so) {
  if (so === undefined || so === null || isNaN(so)) return '0 đ';
  return Number(so).toLocaleString('vi-VN') + ' đ';
}

/**
 * [HÀM 1B] Chuẩn hóa đường dẫn hình ảnh cho mọi môi trường
 * @param {string} src
 * @returns {string}
 */
function formatImg(src) {
  if (!src) return '/images/default-phone.svg';
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }
  const clean = src.replace(/^\.\//, '').replace(/^\//, '');
  return '/' + clean;
}

/**
 * [HÀM 2] Hiển thị Toast thông báo trạng thái nổi góc màn hình
 * @param {string} noiDung - Nội dung thông báo
 * @param {'info'|'success'|'error'|'warning'} [loai='info'] - Phân loại thông báo
 */
function showToast(noiDung, loai = 'info') {
  let hopChua = document.getElementById('toast-container');
  if (!hopChua) {
    hopChua = document.createElement('div');
    hopChua.id = 'toast-container';
    hopChua.className = 'toast-notice';
    document.body.appendChild(hopChua);
  }

  const iconMap = {
    info: 'fa-circle-info',
    success: 'fa-circle-check',
    error: 'fa-triangle-exclamation',
    warning: 'fa-circle-exclamation'
  };
  const icon = iconMap[loai] ?? 'fa-circle-info';

  const msgSpan = document.getElementById('toast-message');
  if (msgSpan && hopChua.childElementCount <= 2) {
    msgSpan.textContent = noiDung;
    hopChua.className = `toast-notice show toast-${loai}`;
    const iconEl = hopChua.querySelector('i');
    if (iconEl) iconEl.className = `fa-solid ${icon}`;

    clearTimeout(hopChua._timeoutId);
    hopChua._timeoutId = setTimeout(() => {
      hopChua.classList.remove('show');
    }, 3200);
    return;
  }

  const toast = document.createElement('div');
  toast.className = `toast-notice show toast-${loai}`;
  toast.style.position = 'fixed';
  toast.style.bottom = `${20 + (document.querySelectorAll('.toast-notice.dynamic-toast').length * 56)}px`;
  toast.style.right = '20px';
  toast.style.zIndex = '99999';
  toast.classList.add('dynamic-toast');

  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${noiDung}</span>
  `;

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 350);
  }, 3200);
}

/**
 * [HÀM 3] Mở Modal Hộp thoại
 * @param {string} id - ID của Modal
 */
function openModal(id) {
  const m = document.getElementById(id) || document.getElementById(`modal-${id}`) || document.getElementById(`${id}-modal`);
  if (m) {
    m.classList.add('show', 'active', 'open');
    m.style.display = 'flex';
  }
}

/**
 * [HÀM 4] Đóng Modal Hộp thoại
 * @param {string} id - ID của Modal
 */
function closeModal(id) {
  const m = document.getElementById(id) || document.getElementById(`modal-${id}`) || document.getElementById(`${id}-modal`);
  if (m) {
    m.classList.remove('show', 'active', 'open');
    m.style.display = 'none';
  }
}

/**
 * [HÀM 5] Điền danh sách danh mục vào các ô select chọn hãng trong Admin
 * @param {Array<Object>} categories - Mảng danh mục các hãng
 */
function populateCategoryDropdowns(categories = []) {
  const dropFilter = document.getElementById('admin-filter-category') || document.getElementById('filter-category');
  const dropForm = document.getElementById('prod-category');

  const optionsFilter = '<option value="all">Tất cả thương hiệu (8 Hãng)</option>' +
    categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  const optionsForm = '<option value="">-- Chọn thương hiệu --</option>' +
    categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  if (dropFilter) {
    dropFilter.innerHTML = optionsFilter;
  }
  if (dropForm) {
    dropForm.innerHTML = optionsForm;
  }
}

/**
 * [HÀM 6] Kết xuất 4 Thẻ KPI Dashboard Thống Kê
 * Tác dụng: Cập nhật doanh thu thực tế, tổng máy đã bán, tổng máy tồn kho, tổng số đơn hàng
 * @param {Object} stats - Dữ liệu thống kê { doanhThu, tongDaBan, tongTonKho, tongDon, soMaySapHet }
 */
function renderKPIs(stats = {}) {
  const doanhThu = stats.doanhThu ?? stats.tongDoanhThu ?? 0;
  const tongDaBan = stats.tongDaBan ?? stats.tongDonHang ?? 0;
  const tongTonKho = stats.tongTonKho ?? stats.tongSanPham ?? 0;
  const tongDon = stats.tongDon ?? stats.tongKhachHang ?? 0;
  const soMaySapHet = stats.soMaySapHet ?? 0;

  // Cập nhật các ID chuẩn trong views/admin.html
  const elRevenue = document.getElementById('stat-revenue');
  const elSold = document.getElementById('stat-sold-count');
  const elStock = document.getElementById('stat-stock-count');
  const elStockAlert = document.getElementById('stat-stock-alert');
  const elOrders = document.getElementById('stat-order-count');

  if (elRevenue) elRevenue.textContent = formatCurrency(doanhThu);
  if (elSold) elSold.textContent = `${Number(tongDaBan).toLocaleString('vi-VN')} máy`;
  if (elStock) elStock.textContent = `${Number(tongTonKho).toLocaleString('vi-VN')} máy`;
  if (elOrders) elOrders.textContent = `${Number(tongDon).toLocaleString('vi-VN')} đơn`;

  if (elStockAlert) {
    if (soMaySapHet > 0) {
      elStockAlert.className = 'stat-card-trend down';
      elStockAlert.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Có ${soMaySapHet} máy sắp hết hàng!`;
    } else {
      elStockAlert.className = 'stat-card-trend';
      elStockAlert.innerHTML = `<i class="fa-solid fa-boxes-stacked"></i> Tồn kho ổn định`;
    }
  }

  // Fallback cho các id kpi cũ nếu có
  const elKpiRev = document.getElementById('kpi-revenue');
  const elKpiOrd = document.getElementById('kpi-orders');
  const elKpiProd = document.getElementById('kpi-products');
  const elKpiCust = document.getElementById('kpi-customers');
  if (elKpiRev) elKpiRev.textContent = formatCurrency(doanhThu);
  if (elKpiOrd) elKpiOrd.textContent = Number(tongDon).toLocaleString('vi-VN');
  if (elKpiProd) elKpiProd.textContent = Number(tongTonKho).toLocaleString('vi-VN');
  if (elKpiCust) elKpiCust.textContent = Number(tongDaBan).toLocaleString('vi-VN');
}

/**
 * [HÀM 7] Chuyển đổi giao diện Tab Quản trị
 * @param {string} tabId - Tên tab ('products', 'customers', 'orders')
 */
function switchTabUI(tabId) {
  if (!tabId) return;

  // 1. Cập nhật trạng thái active trên các nút điều hướng Header
  document.querySelectorAll('.main-nav button[data-admin-tab], .admin-nav-item, .admin-tab-btn').forEach(btn => {
    const target = btn.getAttribute('data-admin-tab') || btn.getAttribute('data-tab');
    if (target === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // 2. Ẩn toàn bộ các Section Panel
  document.querySelectorAll('.admin-tab-content, .admin-tab-panel').forEach(panel => {
    panel.style.display = 'none';
    panel.classList.remove('active');
  });

  // 3. Hiển thị Section Panel mục tiêu
  const panelMap = {
    products: document.getElementById('admin-panel-products'),
    customers: document.getElementById('admin-panel-customers'),
    orders: document.getElementById('admin-panel-orders'),
    vouchers: document.getElementById('admin-panel-vouchers')
  };
  const targetPanel = panelMap[tabId] || document.getElementById(`admin-panel-${tabId}`) || document.getElementById(`tab-${tabId}`);
  if (targetPanel) {
    targetPanel.style.display = 'block';
    targetPanel.classList.add('active');
  }

  // 4. Cập nhật tiêu đề nếu có
  const titleMap = {
    products: 'Quản Lý Sản Phẩm (Kho Hàng Smartphone)',
    customers: 'Quản Lý Khách Hàng (Tài Khoản Thành Viên)',
    orders: 'Quản Lý Đơn Hàng (Theo Dõi & Điều Phối)',
    vouchers: 'Quản Lý Mã Giảm Giá (Chiến Dịch Khuyến Mãi)'
  };
  const titleEl = document.getElementById('admin-page-title');
  if (titleEl) titleEl.textContent = titleMap[tabId] || 'Quản Trị Hệ Thống SmartStore';
}

/**
 * [HÀM 8] Kết xuất Bảng Quản Lý Sản Phẩm (Products Table CRUD)
 * Chuẩn 8 cột thead trong views/admin.html
 * @param {Array<Object>} products - Danh sách sản phẩm của trang hiện tại
 * @param {Array<Object>} categories - Danh mục hãng
 * @param {number} currentPage - Trang hiện tại
 * @param {number} totalPages - Tổng số trang
 */
function renderProductsTable(products, categories, currentPage, totalPages) {
  const tbody = document.getElementById('admin-products-tbody') || document.getElementById('admin-products-table-tbody');
  if (!tbody) return;

  if (!products || products.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding: 40px; color: var(--text-muted);">
          <i class="fa-solid fa-box-open" style="font-size: 32px; margin-bottom: 10px; display: block; color: #94a3b8;"></i>
          Không tìm thấy điện thoại nào phù hợp với bộ lọc tìm kiếm!
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = products.map((sp, idx) => {
    const cat = (categories || []).find(c => String(c.id) === String(sp.categoryId || sp.cate_id));
    const catName = cat ? cat.name : (sp.brand || 'Khác');
    const stt = ((currentPage - 1) * 6) + idx + 1;
    const tonKho = Number(sp.stock ?? sp.quantity ?? 0);
    const tonKhoClass = tonKho <= 3 ? 'text-danger' : '';
    const safeName = (sp.name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const daBan = Number(sp.sold || 0);

    return `
      <tr>
        <td><strong>#${sp.id || stt}</strong></td>
        <td>
          <img src="${formatImg(sp.image)}" alt="${sp.name}" style="width: 48px; height: 48px; object-fit: contain; border-radius: 6px; border: 1px solid var(--border); background: #ffffff;" onerror="this.src='/images/default-phone.svg'">
        </td>
        <td>
          <strong style="color: var(--text); font-size: 14px;">${sp.name}</strong>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
            ${sp.chip || sp.cpu || (sp.specs && (sp.specs.cpu || sp.specs.chip)) || ''} • RAM ${sp.ram || (sp.specs && sp.specs.ram) || '8GB'}
          </div>
        </td>
        <td><span class="badge badge-brand" style="background: rgba(2, 132, 199, 0.12); color: #0284c7; padding: 4px 8px; border-radius: 4px; font-weight: 700;">${catName}</span></td>
        <td style="font-weight: 700; color: var(--primary);">${formatCurrency(sp.price)}</td>
        <td class="${tonKhoClass}" style="font-weight: 600;">
          ${tonKho <= 0 ? '<span class="badge badge-danger" style="background: #fee2e2; color: #ef4444; padding: 3px 6px; border-radius: 4px;">Hết hàng</span>' : `${tonKho} máy`}
        </td>
        <td style="font-weight: 600; color: #10b981;">
          ${daBan.toLocaleString('vi-VN')} máy
        </td>
        <td style="text-align: center;">
          <div class="action-btn-group" style="display: inline-flex; gap: 6px; justify-content: center;">
            <button class="btn-action edit" onclick="window.adminCtrl.openEditProduct('${sp.id}')" title="Chỉnh sửa sản phẩm" style="padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border); background: #fff; cursor: pointer; color: var(--primary);">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn-action delete" onclick="window.adminCtrl.askDelete('product', '${sp.id}', '${safeName}')" title="Xóa sản phẩm khỏi hệ thống" style="padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border); background: #fff; cursor: pointer; color: var(--accent);">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Render phân trang sản phẩm
  const paginEl = document.getElementById('admin-products-pagination');
  if (paginEl) {
    if (totalPages <= 1) {
      paginEl.innerHTML = '';
      return;
    }

    let phtml = `
      <button class="btn-pagination pagination-btn ${currentPage <= 1 ? 'disabled' : ''}" onclick="window.adminCtrl.setProductPage(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''} title="Trang trước">
        <i class="fa-solid fa-chevron-left"></i>
      </button>
    `;
    for (let i = 1; i <= totalPages; i++) {
      phtml += `
        <button class="btn-pagination pagination-btn ${i === currentPage ? 'active' : ''}" onclick="window.adminCtrl.setProductPage(${i})" title="Trang ${i}">
          ${i}
        </button>
      `;
    }
    phtml += `
      <button class="btn-pagination pagination-btn ${currentPage >= totalPages ? 'disabled' : ''}" onclick="window.adminCtrl.setProductPage(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''} title="Trang sau">
        <i class="fa-solid fa-chevron-right"></i>
      </button>
    `;
    paginEl.innerHTML = phtml;
  }
}

/**
 * [HÀM 9] Điền dữ liệu vào Modal Thêm / Sửa Sản Phẩm
 * Khớp 100% với form #product-modal và các thông số kỹ thuật spec- trong admin.html
 * @param {Object|null} product - Dữ liệu sản phẩm khi sửa, null khi thêm mới
 * @param {number|string|null} nextId - Số ID kế tiếp tự động tăng (+1 ID) cho sản phẩm mới
 */
function renderProductModal(product = null, nextId = null) {
  const modalTitle = document.getElementById('product-modal-title') || document.getElementById('modal-product-title');
  const form = document.getElementById('product-form');
  if (!form) return;

  form.reset();

  const preview = document.getElementById('prod-image-preview');
  if (preview) {
    preview.src = product && product.image ? formatImg(product.image) : '/images/default-phone.svg';
    preview.style.display = 'block';
  }

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val ?? '';
  };

  if (product) {
    if (modalTitle) modalTitle.textContent = `Chỉnh Sửa Điện Thoại #${product.id} - ${product.name}`;
    setVal('prod-id', product.id);
    setVal('prod-id-display', `#${product.id} (Đang sửa)`);
    setVal('prod-name', product.name);
    setVal('prod-category', product.categoryId || product.cate_id || '1');
    setVal('prod-price', product.price);
    setVal('prod-stock', product.stock ?? product.quantity ?? 15);
    setVal('prod-sold', product.sold ?? 0);
    setVal('prod-image-url', product.image || '');
    setVal('prod-desc', product.detail || product.description || '');

    // 10 Thông số kỹ thuật chuẩn CellphoneS
    const specs = product.specs || {};
    setVal('spec-screen', specs.screen || product.screen || '');
    setVal('spec-cpu', specs.cpu || specs.chip || product.cpu || product.chip || '');
    setVal('spec-gpu', specs.gpu || product.gpu || '');
    setVal('spec-ram', specs.ram || product.ram || '');
    setVal('spec-rom', specs.rom || product.rom || '');
    setVal('spec-rear-cam', specs.rear_camera || specs.camSau || '');
    setVal('spec-front-cam', specs.front_camera || specs.camTruoc || '');
    setVal('spec-battery', specs.battery || specs.pin || product.battery || product.pin || '');
    setVal('spec-os', specs.os || product.os || '');
    setVal('spec-special', specs.special || product.special || '');

    // Fallback nếu dùng id spec cũ
    setVal('prod-screen', specs.screen || '');
    setVal('prod-cpu', specs.cpu || specs.chip || '');
    setVal('prod-ram', specs.ram || '');
    setVal('prod-rom', specs.rom || '');
    setVal('prod-battery', specs.battery || specs.pin || '');
    setVal('prod-special', specs.special || '');

    if (preview && product.image) {
      preview.src = formatImg(product.image);
    }
  } else {
    const autoIdText = nextId ? `#${nextId} (Tự động +1)` : 'Tự động tăng (+1 ID)';
    if (modalTitle) modalTitle.textContent = nextId ? `Thêm Điện Thoại Mới (Mã Tự Động: #${nextId})` : 'Thêm Điện Thoại Mới Vào Hệ Thống';
    setVal('prod-id', '');
    setVal('prod-id-display', autoIdText);
    setVal('prod-stock', 25);
    setVal('prod-sold', 0);
  }

  openModal('product-modal');
}

/**
 * [HÀM 10] Kết xuất Bảng Quản Lý Đơn Hàng (Orders Table)
 * Chuẩn 8 cột thead trong views/admin.html
 * @param {Array<Object>} orders - Mảng danh sách đơn hàng
 */
function renderOrdersTable(orders) {
  const tbody = document.getElementById('admin-orders-tbody') || document.getElementById('admin-orders-table-tbody');
  if (!tbody) return;

  if (!orders || orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding: 40px; color: var(--text-muted);">
          <i class="fa-solid fa-receipt" style="font-size: 32px; margin-bottom: 10px; display: block; color: #94a3b8;"></i>
          Không tìm thấy đơn hàng nào trong hệ thống!
        </td>
      </tr>
    `;
    return;
  }

  const mapStatusName = {
    processing: 'Chờ xử lý',
    shipping: 'Đang giao hàng',
    delivered: 'Đã hoàn tất (Chốt)',
    cancelled: 'Đã hủy đơn'
  };

  tbody.innerHTML = orders.map(d => {
    const ngay = new Date(d.createdAt || Date.now()).toLocaleDateString('vi-VN');
    const tongTien = Number(d.totalAmount || 0);
    const ptttText = d.paymentMethod === 'COD' ? 'Tiền mặt (COD)' : 'Chuyển khoản';
    const isLocked = (d.status === 'delivered' || d.status === 'completed');

    return `
      <tr>
        <td><strong style="color: var(--primary); font-size: 13px;">${d.orderCode || '#' + d.id}</strong></td>
        <td>
          <div style="font-weight: 700; color: var(--text);">${d.customerName || 'Khách vãng lai'}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${d.customerEmail || ''}</div>
        </td>
        <td><span style="font-weight: 600;">${d.customerPhone || 'Chưa cung cấp'}</span></td>
        <td><span style="font-size: 13px; color: var(--text-muted);">${ngay}</span></td>
        <td style="font-weight: 800; color: var(--accent);">${formatCurrency(tongTien)}</td>
        <td><span class="badge" style="background: #f1f5f9; color: var(--text); padding: 4px 8px; border-radius: 4px; font-size: 12px;">${ptttText}</span></td>
        <td>
          <select class="admin-status-select select-custom" onchange="window.adminCtrl.inlineUpdateOrderStatus('${d.id}', this.value, this)" ${isLocked ? 'disabled style="opacity:0.75; cursor:not-allowed;"' : ''} style="padding: 5px 8px; font-size: 12px; font-weight: 600; border-radius: 6px;">
            <option value="processing" ${d.status === 'processing' ? 'selected' : ''}>Chờ xử lý</option>
            <option value="shipping" ${d.status === 'shipping' ? 'selected' : ''}>Đang giao</option>
            <option value="delivered" ${(d.status === 'delivered' || d.status === 'completed') ? 'selected' : ''}>Đã giao thành công</option>
            <option value="cancelled" ${d.status === 'cancelled' ? 'selected' : ''}>Đã hủy đơn</option>
          </select>
        </td>
        <td style="text-align: center;">
          <div class="action-btn-group" style="display: inline-flex; gap: 6px; justify-content: center;">
            <button class="btn-action view" onclick="window.adminCtrl.openOrderDetail('${d.orderCode || d.id}')" title="Xem chi tiết đơn hàng" style="padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border); background: #fff; cursor: pointer; color: var(--primary);">
              <i class="fa-solid fa-eye"></i>
            </button>
            <button class="btn-action print" onclick="window.adminCtrl.printInvoice('${d.id}')" title="In phiếu xuất kho" style="padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border); background: #fff; cursor: pointer; color: #10b981;">
              <i class="fa-solid fa-print"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * [HÀM 11] Kết xuất Modal Chi Tiết Đơn Hàng Cho Admin
 * Đổ toàn bộ nội dung HTML vào #order-modal-body của views/admin.html
 * @param {Object} order - Dữ liệu chi tiết đơn hàng
 */
function renderOrderDetailModal(order) {
  if (!order) return;
  const d = order;

  const modalTitle = document.getElementById('order-modal-title');
  if (modalTitle) {
    modalTitle.textContent = `Chi Tiết Đơn Hàng #${d.orderCode || d.id}`;
  }

  const selectStatus = document.getElementById('order-status-update-select');
  if (selectStatus) {
    selectStatus.value = d.status || 'processing';
    if (d.status === 'delivered' || d.status === 'completed') {
      selectStatus.disabled = true;
    } else {
      selectStatus.disabled = false;
    }
  }

  const modalBody = document.getElementById('order-modal-body');
  if (modalBody) {
    const ngayDat = new Date(d.createdAt || Date.now()).toLocaleString('vi-VN');
    const tamTinh = d.subtotal || ((d.items || []).reduce((s, i) => s + (i.price * i.quantity), 0)) || d.totalAmount;
    const giamGia = Number(d.discountAmount) || 0;
    const tongTien = d.totalAmount || tamTinh;
    const ptttText = d.paymentMethod === 'COD' ? 'Thanh toán tiền mặt khi nhận hàng (COD)' : 'Chuyển khoản trực tuyến';

    modalBody.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid var(--border);">
        <div>
          <h4 style="font-size: 13px; text-transform: uppercase; color: var(--primary); margin-bottom: 8px; font-weight: 800;">
            <i class="fa-solid fa-user"></i> Người Nhận Hàng
          </h4>
          <div style="font-size: 13px; line-height: 1.6;">
            <div><strong>Họ tên:</strong> ${d.customerName || 'Khách vãng lai'}</div>
            <div><strong>Số điện thoại:</strong> ${d.customerPhone || 'Chưa cung cấp'}</div>
            <div><strong>Email:</strong> ${d.customerEmail || 'Chưa cung cấp'}</div>
            <div><strong>Địa chỉ giao:</strong> ${d.customerAddress || 'Giao hàng tiêu chuẩn'}</div>
          </div>
        </div>
        <div>
          <h4 style="font-size: 13px; text-transform: uppercase; color: var(--primary); margin-bottom: 8px; font-weight: 800;">
            <i class="fa-solid fa-receipt"></i> Thông Tin Đơn Hàng
          </h4>
          <div style="font-size: 13px; line-height: 1.6;">
            <div><strong>Mã đơn:</strong> <span style="color: var(--primary); font-weight: 700;">#${d.orderCode || d.id}</span></div>
            <div><strong>Ngày đặt:</strong> ${ngayDat}</div>
            <div><strong>Thanh toán:</strong> ${ptttText}</div>
            <div><strong>Ghi chú:</strong> ${d.note || 'Không có ghi chú'}</div>
          </div>
        </div>
      </div>

      <h4 style="font-size: 14px; font-weight: 800; margin-bottom: 10px; color: var(--text);">
        <i class="fa-solid fa-boxes-stacked"></i> Danh Sách Sản Phẩm Đặt Mua (${(d.items || []).length} mặt hàng)
      </h4>

      <table class="admin-table" style="margin-bottom: 16px;">
        <thead>
          <tr>
            <th>STT</th>
            <th>Sản phẩm</th>
            <th style="text-align: right;">Đơn giá</th>
            <th style="text-align: center;">SL</th>
            <th style="text-align: right;">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${(d.items || []).map((item, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <img src="${formatImg(item.image)}" alt="${item.name}" style="width: 36px; height: 36px; object-fit: contain; border-radius: 4px; border: 1px solid var(--border); background: #fff;" onerror="this.src='/images/default-phone.svg'">
                  <div>
                    <strong style="color: var(--text);">${item.name}</strong>
                    <div style="font-size: 11px; color: var(--text-muted);">${item.color || ''} ${item.storage || ''}</div>
                  </div>
                </div>
              </td>
              <td style="text-align: right;">${formatCurrency(item.price)}</td>
              <td style="text-align: center;"><strong>x${item.quantity}</strong></td>
              <td style="text-align: right; font-weight: 700; color: var(--primary);">${formatCurrency(item.price * item.quantity)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="max-width: 340px; margin-left: auto; background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid var(--border); font-size: 13px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span>Tạm tính tiền hàng:</span>
          <strong>${formatCurrency(tamTinh)}</strong>
        </div>
        ${giamGia > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #ef4444;">
            <span>Voucher giảm giá:</span>
            <strong>-${formatCurrency(giamGia)}</strong>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #10b981;">
          <span>Phí vận chuyển:</span>
          <strong>0 đ (Miễn phí)</strong>
        </div>
        <hr style="margin: 8px 0; border: none; border-top: 1px solid var(--border);">
        <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; color: var(--accent);">
          <span>TỔNG THANH TOÁN:</span>
          <span>${formatCurrency(tongTien)}</span>
        </div>
      </div>
    `;
  }

  openModal('order-detail-modal');
}

/**
 * [HÀM 12] Kết xuất Bảng Quản Lý Khách Hàng (Customers Table)
 * Chuẩn 7 cột thead trong views/admin.html
 * @param {Array<Object>} customers - Danh sách người dùng hệ thống
 */
function renderCustomersTable(customers) {
  const tbody = document.getElementById('admin-customers-tbody') || document.getElementById('admin-customers-table-tbody');
  if (!tbody) return;

  if (!customers || customers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding: 40px; color: var(--text-muted);">
          <i class="fa-solid fa-users" style="font-size: 32px; margin-bottom: 10px; display: block; color: #94a3b8;"></i>
          Không tìm thấy tài khoản người dùng nào!
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = customers.map((c, idx) => {
    const roleBadge = c.role === 'admin'
      ? '<span class="badge" style="background: rgba(14, 165, 233, 0.15); color: #0284c7; padding: 4px 8px; border-radius: 4px; font-weight: 700;"><i class="fa-solid fa-user-shield"></i> Quản trị viên</span>'
      : '<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 4px 8px; border-radius: 4px; font-weight: 600;"><i class="fa-solid fa-user"></i> Khách hàng</span>';
    const displayName = c.fullName || c.name || (c.email ? c.email.split('@')[0] : 'Khách hàng');
    const safeName = displayName.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const avatarLetter = displayName.charAt(0).toUpperCase();

    return `
      <tr>
        <td><strong>#${c.id || idx + 1}</strong></td>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 34px; height: 34px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px;">
              ${avatarLetter}
            </div>
            <div>
              <strong style="color: var(--text);">${displayName}</strong>
            </div>
          </div>
        </td>
        <td><span style="color: var(--text);">${c.email}</span></td>
        <td><span style="font-weight: 600;">${c.phone || '<span style="color:var(--text-muted);">Chưa cập nhật</span>'}</span></td>
        <td style="max-width: 240px; font-size: 12px; color: var(--text-muted);">${c.address || 'Chưa cập nhật'}</td>
        <td>${roleBadge}</td>
        <td style="text-align: center;">
          <div class="action-btn-group" style="display: inline-flex; gap: 6px; justify-content: center;">
            <button class="btn-action edit" onclick="window.adminCtrl.openEditCustomer('${c.id}')" title="Sửa thông tin khách hàng" style="padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border); background: #fff; cursor: pointer; color: var(--primary);">
              <i class="fa-solid fa-user-pen"></i>
            </button>
            <button class="btn-action delete" onclick="window.adminCtrl.askDelete('customer', '${c.id}', '${safeName}')" title="Xóa tài khoản" ${c.role === 'admin' ? 'disabled style="padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border); background: #f1f5f9; opacity:0.35; cursor:not-allowed;"' : 'style="padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border); background: #fff; cursor: pointer; color: var(--accent);"'}>
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * [HÀM 13] Điền dữ liệu vào Modal Thêm / Sửa Khách Hàng
 * Khớp 100% với form #customer-modal trong views/admin.html
 * @param {Object|null} customer - Dữ liệu khách hàng
 */
function renderCustomerModal(customer = null) {
  const modalTitle = document.getElementById('customer-modal-title') || document.getElementById('modal-customer-title');
  const form = document.getElementById('customer-form');
  if (!form) return;

  form.reset();

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val ?? '';
  };

  const roleSelect = document.getElementById('cust-role');
  const roleHint = document.getElementById('cust-role-hint');

  if (customer) {
    if (modalTitle) modalTitle.textContent = `Chỉnh Sửa Tài Khoản #${customer.id} - ${customer.fullName || customer.name}`;
    setVal('cust-id', customer.id);
    setVal('cust-name', customer.fullName || customer.name);
    setVal('cust-email', customer.email);
    setVal('cust-phone', customer.phone);
    setVal('cust-address', customer.address);
    setVal('cust-role', customer.role || 'user');

    const passInput = document.getElementById('cust-password');
    if (passInput) passInput.placeholder = 'Để trống nếu giữ nguyên mật khẩu cũ';

    if (customer.role === 'admin') {
      if (roleSelect) roleSelect.disabled = true;
      if (roleHint) roleHint.style.display = 'block';
    } else {
      if (roleSelect) roleSelect.disabled = false;
      if (roleHint) roleHint.style.display = 'none';
    }
  } else {
    if (modalTitle) modalTitle.textContent = 'Thêm Tài Khoản Thành Viên Mới';
    setVal('cust-id', '');
    setVal('cust-role', 'user');
    if (roleSelect) roleSelect.disabled = false;
    if (roleHint) roleHint.style.display = 'none';

    const passInput = document.getElementById('cust-password');
    if (passInput) passInput.placeholder = 'Nhập mật khẩu khởi tạo cho tài khoản';
  }

  openModal('customer-modal');
}

/**
 * [HÀM 14] Mở Modal Xác Nhận Xóa
 * Khớp 100% với #confirm-modal trong views/admin.html
 * @param {'product'|'customer'|'order'} loai - Loại đối tượng cần xóa
 * @param {string|number} id - ID đối tượng
 * @param {string} ten - Tên đối tượng hiển thị
 */
function renderDeleteModal(loai, id, ten) {
  const loaiText = loai === 'product' ? 'điện thoại' : loai === 'customer' ? 'tài khoản người dùng' : loai === 'voucher' ? 'mã giảm giá' : 'đơn hàng';
  const msgEl = document.getElementById('confirm-modal-message');
  if (msgEl) {
    msgEl.innerHTML = `Bạn có chắc chắn muốn xóa ${loaiText} <strong>"${ten}"</strong> (ID: #${id}) khỏi cơ sở dữ liệu không?<br><span style="color:#ef4444; font-size:12px;">* Thao tác này sẽ xóa vĩnh viễn và không thể hoàn tác!</span>`;
  }
  openModal('confirm-modal');
}

/**
 * [HÀM 15] Mở Cửa Sổ In Hóa Đơn Cho Quản Trị Viên (Print Invoice)
 * @param {Object} order - Đơn hàng cần in hóa đơn
 */
function printInvoice(order) {
  if (!order) {
    showToast('Vui lòng chọn hoặc mở một đơn hàng để in hóa đơn!', 'warning');
    return;
  }

  const d = order;
  const ngayDat = new Date(d.createdAt || Date.now()).toLocaleString('vi-VN');
  const giamGia = Number(d.discountAmount) || 0;
  const tamTinh = d.subtotal || ((d.items || []).reduce((s, i) => s + (i.price * i.quantity), 0)) || d.totalAmount;
  const tongTien = d.totalAmount || tamTinh;

  const popup = window.open('', '_blank', 'width=850,height=900,menubar=no,toolbar=no,location=no,status=no');
  if (!popup) {
    showToast('Trình duyệt đã chặn cửa sổ bật lên (Popup)! Vui lòng cho phép popup để in hóa đơn.', 'error');
    return;
  }

  const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Hóa Đơn Bán Hàng - SmartStore ${d.orderCode || '#' + d.id}</title>
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
    }
    .header {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .brand-name {
      font-size: 24px;
      font-weight: 800;
      color: #0284c7;
    }
    .inv-title {
      font-size: 20px;
      font-weight: 800;
      text-align: right;
      color: #0f172a;
    }
    .grid-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .info-box {
      background: #f8fafc;
      padding: 14px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    .info-box h4 {
      margin-bottom: 8px;
      color: #0284c7;
      font-size: 13px;
      text-transform: uppercase;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      font-weight: 700;
      color: #334155;
    }
    .totals {
      width: 320px;
      margin-left: auto;
      margin-bottom: 24px;
    }
    .tot-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
    }
    .tot-row.grand {
      border-top: 2px solid #0f172a;
      font-size: 16px;
      font-weight: 800;
      color: #ef4444;
      padding-top: 10px;
    }
    .footer-signs {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      text-align: center;
    }
    .sign-box {
      width: 220px;
    }
    .sign-title {
      font-weight: 700;
      margin-bottom: 60px;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div>
        <div class="brand-name">⚡ SMARTSTORE</div>
        <div style="font-size: 12px; color: #64748b;">Hệ thống Smartphone & Gaming Phone chính hãng</div>
        <div style="font-size: 12px; color: #64748b;">Hotline: 1800.6936 - Website: smartstore.vn</div>
      </div>
      <div>
        <div class="inv-title">PHIẾU XUẤT KHO KIÊM BẢO HÀNH</div>
        <div style="text-align: right; font-size: 12px; color: #64748b; margin-top: 4px;">Mã đơn: <strong>${d.orderCode || '#' + d.id}</strong></div>
        <div style="text-align: right; font-size: 12px; color: #64748b;">Ngày lập: ${ngayDat}</div>
      </div>
    </div>

    <div class="grid-info">
      <div class="info-box">
        <h4>Thông Tin Khách Hàng</h4>
        <div><strong>Họ tên:</strong> ${d.customerName || 'Khách vãng lai'}</div>
        <div><strong>Số điện thoại:</strong> ${d.customerPhone || 'Chưa cung cấp'}</div>
        <div><strong>Email:</strong> ${d.customerEmail || 'Chưa cung cấp'}</div>
        <div><strong>Địa chỉ:</strong> ${d.customerAddress || 'Giao hàng tiêu chuẩn'}</div>
      </div>
      <div class="info-box">
        <h4>Chi Tiết Giao Hàng</h4>
        <div><strong>Phương thức thanh toán:</strong> ${d.paymentMethod === 'COD' ? 'Tiền mặt khi giao (COD)' : 'Chuyển khoản trực tuyến'}</div>
        <div><strong>Trạng thái:</strong> ${d.status}</div>
        <div><strong>Ghi chú:</strong> ${d.note || 'Không có'}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>STT</th>
          <th>Tên Sản Phẩm</th>
          <th style="text-align: right;">Đơn Giá</th>
          <th style="text-align: center;">SL</th>
          <th style="text-align: right;">Thành Tiền</th>
        </tr>
      </thead>
      <tbody>
        ${(d.items || []).map((item, i) => `
          <tr>
            <td>${i + 1}</td>
            <td><strong>${item.name}</strong></td>
            <td style="text-align: right;">${formatCurrency(item.price)}</td>
            <td style="text-align: center;">${item.quantity}</td>
            <td style="text-align: right; font-weight: 700;">${formatCurrency(item.price * item.quantity)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="tot-row">
        <span>Tạm tính tiền máy:</span>
        <strong>${formatCurrency(tamTinh)}</strong>
      </div>
      ${giamGia > 0 ? `
        <div class="tot-row" style="color: #ef4444;">
          <span>Giảm giá khuyến mãi:</span>
          <strong>-${formatCurrency(giamGia)}</strong>
        </div>
      ` : ''}
      <div class="tot-row">
        <span>Phí vận chuyển:</span>
        <strong style="color: #10b981;">0 đ (Miễn phí)</strong>
      </div>
      <div class="tot-row grand">
        <span>TỔNG CỘNG:</span>
        <span>${formatCurrency(tongTien)}</span>
      </div>
    </div>

    <div style="font-size: 11px; color: #64748b; margin-top: 10px; font-style: italic;">
      * Quý khách vui lòng kiểm tra kỹ sản phẩm, phụ kiện và hóa đơn trước khi nhận hàng.<br>
      * Sản phẩm được bảo hành chính hãng 12 tháng tại các trung tâm bảo hành ủy quyền toàn quốc.
    </div>

    <div class="footer-signs">
      <div class="sign-box">
        <div class="sign-title">NGƯỜI MUA HÀNG<br><span style="font-size: 11px; font-weight: normal;">(Ký, ghi rõ họ tên)</span></div>
      </div>
      <div class="sign-box">
        <div class="sign-title">NGƯỜI LẬP HÓA ĐƠN<br><span style="font-size: 11px; font-weight: normal;">(Ký, đóng dấu)</span></div>
      </div>
    </div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  <\/script>
</body>
</html>
  `;

  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  showToast('Đang mở cửa sổ in hóa đơn...', 'info');
}

/**
 * [HÀM 16] Kết xuất Bảng Quản Lý Mã Giảm Giá (Vouchers Table)
 * @param {Array<Object>} vouchers - Danh sách mã giảm giá
 */
function renderVouchersTable(vouchers) {
  const tbody = document.getElementById('admin-vouchers-tbody');
  if (!tbody) return;

  if (!vouchers || vouchers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding: 40px; color: var(--text-muted);">
          <i class="fa-solid fa-ticket" style="font-size: 32px; margin-bottom: 10px; display: block; color: #94a3b8;"></i>
          Chưa có mã giảm giá nào trong hệ thống!
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = vouchers.map(v => {
    const isPercent = v.type === 'percent';
    const discDisplay = isPercent ? `${v.discount}%` : formatCurrency(v.discount);
    const minOrderDisplay = v.minOrder ? formatCurrency(v.minOrder) : '0 đ (Mọi đơn)';
    const maxDiscDisplay = (isPercent && v.maxDiscount) ? ` (Tối đa ${formatCurrency(v.maxDiscount)})` : '';
    const usageLeft = v.usageLeft !== undefined ? Number(v.usageLeft) : 20;
    const usageClass = usageLeft <= 3 ? 'text-danger' : '';
    const safeCode = (v.code || '').replace(/'/g, "\\'");

    return `
      <tr>
        <td><strong>#${v.id}</strong></td>
        <td>
          <span class="badge" style="background: rgba(14, 165, 233, 0.15); color: #0284c7; font-weight: 800; font-family: monospace; font-size: 13px; padding: 4px 8px; border-radius: 4px; border: 1px dashed #0284c7;">
            ${v.code}
          </span>
        </td>
        <td>
          <strong style="color: var(--text);">${v.name}</strong>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
            ${v.description || ''}
          </div>
        </td>
        <td style="font-weight: 700; color: #10b981;">
          ${discDisplay}${maxDiscDisplay}
        </td>
        <td style="font-size: 13px;">${minOrderDisplay}</td>
        <td class="${usageClass}" style="font-weight: 700;">
          ${usageLeft} lượt
        </td>
        <td>
          <span class="badge" style="background: ${isPercent ? '#fef3c7; color: #d97706;' : '#dcfce7; color: #15803d;'} padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11px;">
            ${isPercent ? 'Phần trăm (%)' : 'Tiền mặt (VNĐ)'}
          </span>
        </td>
        <td style="text-align: center;">
          <div class="action-btn-group" style="display: inline-flex; gap: 6px; justify-content: center;">
            <button class="btn-action edit" onclick="window.adminCtrl.openEditVoucher('${v.id}')" title="Chỉnh sửa voucher" style="padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border); background: #fff; cursor: pointer; color: var(--primary);">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn-action delete" onclick="window.adminCtrl.askDelete('voucher', '${v.id}', '${safeCode}')" title="Xóa voucher" style="padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border); background: #fff; cursor: pointer; color: var(--accent);">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * [HÀM 17] Điền Dữ Liệu Vào Modal Thêm / Sửa Mã Giảm Giá
 * @param {Object|null} voucher - Dữ liệu voucher khi sửa, null khi thêm mới
 * @param {number|string|null} nextId - Số ID kế tiếp tự động tăng (+1 ID)
 */
function renderVoucherModal(voucher = null, nextId = null) {
  const modalTitle = document.getElementById('voucher-modal-title');
  const form = document.getElementById('voucher-form');
  if (!form) return;

  form.reset();

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val ?? '';
  };

  if (voucher) {
    if (modalTitle) modalTitle.textContent = `Chỉnh Sửa Mã Giảm Giá #${voucher.id} - ${voucher.code}`;
    setVal('vouch-id', voucher.id);
    setVal('vouch-id-display', `#${voucher.id} (Đang sửa)`);
    setVal('vouch-code', voucher.code);
    setVal('vouch-type', voucher.type || 'fixed');
    setVal('vouch-name', voucher.name);
    setVal('vouch-discount', voucher.discount);
    setVal('vouch-min-order', voucher.minOrder || 0);
    setVal('vouch-max-discount', voucher.maxDiscount || '');
    setVal('vouch-usage', voucher.usageLeft !== undefined ? voucher.usageLeft : 20);
    setVal('vouch-desc', voucher.description || '');
  } else {
    const autoIdText = nextId ? `#${nextId} (Tự động +1)` : 'Tự động tăng (+1 ID)';
    if (modalTitle) modalTitle.textContent = nextId ? `Thêm Mã Giảm Giá Mới (Mã Tự Động: #${nextId})` : 'Thêm Mã Giảm Giá Mới';
    setVal('vouch-id', '');
    setVal('vouch-id-display', autoIdText);
    setVal('vouch-type', 'fixed');
    setVal('vouch-min-order', 0);
    setVal('vouch-usage', 20);
  }

  openModal('voucher-modal');
}

// ============================================================================
// XUẤT BẢN MODULE THEO PHONG CÁCH DÙNG HÀM HIỆN ĐẠI
// ============================================================================
const adminView = {
  formatCurrency,
  showToast,
  openModal,
  closeModal,
  populateCategoryDropdowns,
  renderKPIs,
  switchTabUI,
  renderProductsTable,
  renderProductModal,
  renderOrdersTable,
  renderOrderDetailModal,
  renderCustomersTable,
  renderCustomerModal,
  renderVouchersTable,
  renderVoucherModal,
  renderDeleteModal,
  printInvoice
};

function AdminView() { return adminView; }
Object.assign(AdminView, adminView);

if (typeof window !== 'undefined') {
  window.adminView = adminView;
  window.AdminView = AdminView;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = adminView;
}
