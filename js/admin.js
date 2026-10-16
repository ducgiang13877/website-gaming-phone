/**
 * ============================================================================
 * WEBSITE GAMING PHONE (SMARTSTORE) - GIAO DIỆN QUẢN TRỊ VIÊN (js/admin.js)
 * ============================================================================
 * Phong cách code: ES6+ Hiện đại, Ngắn gọn, Tối ưu và Dễ hiểu cho sinh viên.
 * Chức năng: Thống kê KPI, CRUD Sản phẩm (+1 ID), CRUD Danh mục, Quản lý đơn hàng.
 * ============================================================================
 */

// ================= 1. CẤU HÌNH VÀ BIẾN TOÀN CỤC =================
const API = 'http://localhost:3000';
const DEFAULT_IMG = 'https://picsum.photos/50/50';

let products = [];     // Danh sách sản phẩm
let categories = [];   // Danh mục thương hiệu
let orders = [];       // Danh sách đơn hàng
let users = [];        // Danh sách tài khoản người dùng

let editingProductId = null;   // ID sản phẩm đang sửa (null nếu thêm mới)
let editingCategoryId = null;  // ID danh mục đang sửa (null nếu thêm mới)
let productImageBase64 = '';   // Chuỗi ảnh dạng base64 khi admin chọn file

// ================= 2. HÀM TIỆN ÍCH DÙNG CHUNG =================
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

// Định dạng tiền tệ VNĐ (ví dụ: 29.990.000 đ)
const formatMoney = (amount) => (Number(amount) || 0).toLocaleString('vi-VN') + ' đ';

// Gọi API nhanh bằng fetch async/await
const api = async (endpoint, method = 'GET', body = null) => {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : null
  };
  const res = await fetch(`${API}/${endpoint}`, options);
  if (!res.ok) throw new Error(`Lỗi API: ${res.status}`);
  return res.json();
};

// Hiển thị thông báo Toast góc màn hình (tự đóng sau 3s)
let toastTimer = null;
const showToast = (message, type = 'info') => {
  const toast = $('toast');
  if (!toast) return;
  const icons = {
    success: 'fa-circle-check',
    error: 'fa-circle-xmark',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info'
  };
  toast.innerHTML = `<i class="fas ${icons[type] || 'fa-info'}"></i> <span>${message}</span>`;
  toast.className = `toast-notice toast-${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
};

// Thuật toán tự tăng ID sản phẩm: Lấy ID số lớn nhất hiện có + 1
const getNextProductId = () => {
  const ids = products.map(p => parseInt(p.id, 10)).filter(n => !isNaN(n));
  return String((ids.length ? Math.max(...ids) : 0) + 1);
};

// ================= 3. KIỂM TRA PHÂN QUYỀN & TẢI DỮ LIỆU BAN ĐẦU =================
const checkAdminAuth = () => {
  const isLogged = localStorage.getItem('smartstore_admin_logged') === 'true';
  const loginScreen = $('admin-login-screen');
  const dashScreen = $('admin-dashboard-screen');

  if (isLogged) {
    if (loginScreen) loginScreen.style.display = 'none';
    if (dashScreen) dashScreen.style.display = 'block';

    const user = JSON.parse(localStorage.getItem('smartstore_user') || '{}');
    if ($('admin-logged-name')) {
      $('admin-logged-name').textContent = user.name ? `${user.name} (Admin)` : 'Quản Trị Viên';
    }
    loadAdminData();
  } else {
    if (loginScreen) loginScreen.style.display = 'flex';
    if (dashScreen) dashScreen.style.display = 'none';
  }
};

// Tải đồng thời toàn bộ dữ liệu quản trị bằng Promise.all
const loadAdminData = async () => {
  try {
    const [prods, cates, ords, usrs] = await Promise.all([
      api('products'),
      api('categories'),
      api('orders'),
      api('users')
    ]);

    products = prods || [];
    categories = cates || [];
    orders = ords || [];
    users = usrs || [];

    updateKPI();
    renderCategorySelects();
    renderProductsTable();
    renderCategoriesTable();
    renderOrdersTable();
    renderUsersTable();
  } catch (err) {
    showToast('Lỗi khi tải dữ liệu! Vui lòng kiểm tra server cổng 3000.', 'error');
  }
};

// ================= 4. THỐNG KÊ CHỈ SỐ KPI HỆ THỐNG =================
const updateKPI = () => {
  // Loại trừ đơn hàng bị hủy khi tính doanh thu và lượng bán
  const validOrders = orders.filter(o => o.status !== 'Đã hủy');

  const totalRevenue = validOrders.reduce((sum, o) => sum + (Number(o.total_price || o.total_amount) || 0), 0);
  const totalSold = validOrders.reduce((sum, o) => {
    return sum + (o.items || []).reduce((sub, item) => sub + (Number(item.quantity) || 0), 0);
  }, 0);
  const totalStock = products.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);

  if ($('stat-revenue')) $('stat-revenue').textContent = formatMoney(totalRevenue);
  if ($('stat-sold')) $('stat-sold').textContent = totalSold.toLocaleString('vi-VN');
  if ($('stat-stock')) $('stat-stock').textContent = totalStock.toLocaleString('vi-VN');
  if ($('stat-orders')) $('stat-orders').textContent = orders.length.toLocaleString('vi-VN');
};

// Đổ dữ liệu danh mục vào các ô chọn Select
const renderCategorySelects = () => {
  const formSelect = $('form-product-cate');
  const filterSelect = $('admin-filter-category');

  const optionsHtml = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  if (formSelect) formSelect.innerHTML = `<option value="">-- Chọn thương hiệu --</option>${optionsHtml}`;
  if (filterSelect) filterSelect.innerHTML = `<option value="">Tất cả thương hiệu</option>${optionsHtml}`;
};

// ================= 5. QUẢN LÝ SẢN PHẨM (CRUD SẢN PHẨM) =================

// Hiển thị danh sách sản phẩm kèm bộ lọc tìm kiếm & thương hiệu
const renderProductsTable = () => {
  const tbody = $('admin-product-tbody');
  if (!tbody) return;

  const keyword = ($('admin-search-product')?.value || '').trim().toLowerCase();
  const filterCate = $('admin-filter-category')?.value || '';

  const filtered = products.filter(sp => {
    const matchName = !keyword || (sp.name || '').toLowerCase().includes(keyword);
    const spCate = String(sp.cate_id || sp.category_id || '');
    const matchCate = !filterCate || spCate === filterCate;
    return matchName && matchCate;
  });

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 25px; color: #64748b;">Không tìm thấy sản phẩm phù hợp!</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(sp => {
    const spCateId = String(sp.cate_id || sp.category_id || '');
    const cate = categories.find(c => String(c.id) === spCateId);
    const cateName = cate ? cate.name : 'Chưa phân loại';
    const qty = Number(sp.quantity) || 0;

    return `
      <tr>
        <td style="font-weight: 700; color: #2563eb;">#${sp.id}</td>
        <td>
          <img src="${sp.image || DEFAULT_IMG}" alt="${sp.name}" style="width: 45px; height: 45px; object-fit: cover; border-radius: 6px;" onerror="this.src='${DEFAULT_IMG}'" />
        </td>
        <td style="font-weight: 600;">${sp.name}</td>
        <td><span class="badge" style="background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 4px;">${cateName}</span></td>
        <td style="font-weight: 600;">${formatMoney(sp.price)}</td>
        <td><span style="font-weight: 700; color: ${qty > 0 ? '#16a34a' : '#dc2626'};">${qty} máy</span></td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button type="button" class="btn-primary" style="padding: 5px 10px; font-size: 12px;" onclick="editProduct('${sp.id}')">
              <i class="fas fa-pen-to-square"></i> Sửa
            </button>
            <button type="button" class="btn-secondary" style="padding: 5px 10px; font-size: 12px; background: #fee2e2; color: #b91c1c;" onclick="deleteProduct('${sp.id}')">
              <i class="fas fa-trash"></i> Xóa
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
};

// Mở modal thêm hoặc chỉnh sửa sản phẩm
const openProductModal = (id = null) => {
  editingProductId = id;
  productImageBase64 = '';

  const modal = $('product-modal');
  const title = $('product-modal-title');
  const form = $('product-form');
  const preview = $('product-img-preview');
  const thumb = $('preview-product-thumb');

  if (id) {
    const sp = products.find(p => String(p.id) === String(id));
    if (!sp) return showToast('Không tìm thấy sản phẩm!', 'error');

    title.textContent = `Chỉnh Sửa Sản Phẩm (#${sp.id})`;
    $('form-product-name').value = sp.name || '';
    $('form-product-cate').value = sp.cate_id || sp.category_id || '';
    $('form-product-price').value = sp.price || '';
    $('form-product-qty').value = sp.quantity || 0;
    $('form-product-detail').value = sp.detail || '';

    if (sp.image) {
      productImageBase64 = sp.image;
      thumb.src = sp.image;
      preview.style.display = 'flex';
    } else {
      preview.style.display = 'none';
    }
  } else {
    title.textContent = 'Thêm Sản Phẩm Mới (Tự Tăng ID +1)';
    form.reset();
    preview.style.display = 'none';
  }

  modal?.classList.add('open');
};

// Xử lý nộp form thêm mới / cập nhật sản phẩm
const handleSaveProduct = async (e) => {
  e.preventDefault();

  const name = $('form-product-name')?.value.trim();
  const category_id = $('form-product-cate')?.value.trim();
  const price = Number($('form-product-price')?.value) || 0;
  const quantity = Number($('form-product-qty')?.value) || 0;
  const detail = $('form-product-detail')?.value.trim();

  if (!name || !category_id || price <= 0) {
    return showToast('Vui lòng nhập đầy đủ tên, hãng và giá sản phẩm!', 'warning');
  }

  const payload = {
    name,
    cate_id: category_id,
    category_id,
    price,
    quantity,
    detail,
    image: productImageBase64 || DEFAULT_IMG
  };

  try {
    if (editingProductId) {
      // Chế độ CẬP NHẬT (Update)
      const updated = await api(`products/${editingProductId}`, 'PATCH', payload);
      const index = products.findIndex(p => String(p.id) === String(editingProductId));
      if (index !== -1) products[index] = { ...products[index], ...updated };
      showToast(`Đã cập nhật sản phẩm "${name}" thành công!`, 'success');
    } else {
      // Chế độ THÊM MỚI (Create) -> Tự động tính ID kế tiếp (+1)
      const nextId = getNextProductId();
      payload.id = nextId;

      const created = await api('products', 'POST', payload);
      products.push(created);
      showToast(`Đã thêm sản phẩm "${name}" thành công với ID #${nextId}!`, 'success');
    }

    $('product-modal')?.classList.remove('open');
    renderProductsTable();
    updateKPI();
  } catch (err) {
    showToast('Lỗi khi lưu sản phẩm lên máy chủ!', 'error');
  }
};

// Xóa sản phẩm
const deleteProduct = async (id) => {
  const sp = products.find(p => String(p.id) === String(id));
  const name = sp ? sp.name : `#${id}`;

  if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}" không?`)) return;

  try {
    await api(`products/${id}`, 'DELETE');
    products = products.filter(p => String(p.id) !== String(id));
    renderProductsTable();
    updateKPI();
    showToast(`Đã xóa sản phẩm "${name}" thành công!`, 'success');
  } catch (err) {
    showToast('Lỗi khi xóa sản phẩm!', 'error');
  }
};

// Đọc tệp ảnh tải lên từ máy tính bằng FileReader
const handleImageUpload = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (file.size > 1.5 * 1024 * 1024) {
    showToast('Kích thước ảnh vượt quá 1.5MB! Vui lòng chọn ảnh nhẹ hơn.', 'warning');
    e.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    productImageBase64 = event.target.result;
    $('preview-product-thumb').src = productImageBase64;
    $('product-img-preview').style.display = 'flex';
  };
  reader.readAsDataURL(file);
};

// ================= 6. QUẢN LÝ DANH MỤC THƯƠNG HIỆU (CRUD DANH MỤC) =================

// Hiển thị bảng danh mục thương hiệu
const renderCategoriesTable = () => {
  const tbody = $('admin-category-tbody');
  if (!tbody) return;

  if (!categories.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px;">Chưa có danh mục nào!</td></tr>`;
    return;
  }

  tbody.innerHTML = categories.map(dm => `
    <tr>
      <td style="font-weight: 700; color: #2563eb;">#${dm.id}</td>
      <td style="font-weight: 600;">${dm.name}</td>
      <td style="color: #64748b;">${dm.parent_id || '0 (Gốc)'}</td>
      <td>
        <div style="display: flex; gap: 6px;">
          <button type="button" class="btn-primary" style="padding: 5px 10px; font-size: 12px;" onclick="editCategory('${dm.id}')">
            <i class="fas fa-pen-to-square"></i> Sửa
          </button>
          <button type="button" class="btn-secondary" style="padding: 5px 10px; font-size: 12px; background: #fee2e2; color: #b91c1c;" onclick="deleteCategory('${dm.id}')">
            <i class="fas fa-trash"></i> Xóa
          </button>
        </div>
      </td>
    </tr>
  `).join('');
};

// Mở modal thêm hoặc sửa danh mục
const openCategoryModal = (id = null) => {
  editingCategoryId = id;
  const modal = $('category-modal');
  const title = $('category-modal-title');
  const form = $('category-form');

  if (id) {
    const dm = categories.find(c => String(c.id) === String(id));
    if (!dm) return;
    title.textContent = `Sửa Danh Mục (#${dm.id})`;
    $('form-category-name').value = dm.name || '';
  } else {
    title.textContent = 'Thêm Danh Mục Mới';
    form.reset();
  }

  modal?.classList.add('open');
};

// Lưu danh mục (Thêm mới hoặc Cập nhật)
const handleSaveCategory = async (e) => {
  e.preventDefault();
  const name = $('form-category-name')?.value.trim();
  if (!name) return showToast('Vui lòng nhập tên danh mục!', 'warning');

  try {
    if (editingCategoryId) {
      const updated = await api(`categories/${editingCategoryId}`, 'PATCH', { name });
      const idx = categories.findIndex(c => String(c.id) === String(editingCategoryId));
      if (idx !== -1) categories[idx] = { ...categories[idx], ...updated };
      showToast(`Đã sửa danh mục thành "${name}"!`, 'success');
    } else {
      const created = await api('categories', 'POST', { name, parent_id: 0 });
      categories.push(created);
      showToast(`Đã thêm danh mục "${name}"!`, 'success');
    }

    $('category-modal')?.classList.remove('open');
    renderCategoriesTable();
    renderCategorySelects();
  } catch (err) {
    showToast('Lỗi khi lưu danh mục!', 'error');
  }
};

// Xóa danh mục (kiểm tra an toàn ràng buộc dữ liệu)
const deleteCategory = async (id) => {
  const inUse = products.filter(p => String(p.category_id || p.cate_id) === String(id));
  if (inUse.length > 0) {
    return showToast(`Không thể xóa! Đang có ${inUse.length} sản phẩm thuộc hãng này.`, 'warning');
  }

  const dm = categories.find(c => String(c.id) === String(id));
  const name = dm ? dm.name : `#${id}`;

  if (!confirm(`Bạn có chắc chắn muốn xóa danh mục "${name}" không?`)) return;

  try {
    await api(`categories/${id}`, 'DELETE');
    categories = categories.filter(c => String(c.id) !== String(id));
    renderCategoriesTable();
    renderCategorySelects();
    showToast(`Đã xóa danh mục "${name}" thành công!`, 'success');
  } catch (err) {
    showToast('Lỗi khi xóa danh mục!', 'error');
  }
};

// ================= 7. QUẢN LÝ ĐƠN HÀNG (TRẠNG THÁI & CHI TIẾT ĐƠN) =================

// Hiển thị bảng đơn hàng (đơn mới nhất lên đầu)
const renderOrdersTable = () => {
  const tbody = $('admin-order-tbody');
  if (!tbody) return;

  if (!orders.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 25px; color: #64748b;">Chưa có đơn hàng nào trong hệ thống!</td></tr>`;
    return;
  }

  const reversed = [...orders].reverse();
  const statuses = ['Đang xử lý', 'Đang giao hàng', 'Đã giao hàng', 'Đã hủy'];

  tbody.innerHTML = reversed.map(order => {
    const code = order.order_code || order.id || '#SMARTSTORE';
    const dateStr = order.created_at || order.created_date ? new Date(order.created_at || order.created_date).toLocaleString('vi-VN') : '—';
    const total = Number(order.total_price || order.total_amount) || 0;
    const currentStatus = order.status || 'Đang xử lý';

    const statusOptions = statuses.map(s => `<option value="${s}" ${s === currentStatus ? 'selected' : ''}>${s}</option>`).join('');

    return `
      <tr>
        <td style="font-weight: 700; color: #2563eb;">${code}</td>
        <td style="font-weight: 600;">${order.customer_name || 'Khách vãng lai'}</td>
        <td>${order.customer_phone || order.phone || '—'}</td>
        <td style="font-weight: 700; color: #ef4444;">${formatMoney(total)}</td>
        <td style="font-size: 13px; color: #64748b;">${dateStr}</td>
        <td>
          <select class="order-status-select" onchange="updateOrderStatus('${order.id}', this.value)">
            ${statusOptions}
          </select>
        </td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button type="button" class="btn-primary" style="padding: 5px 10px; font-size: 12px;" onclick="viewOrderDetail('${order.id}')">
              <i class="fas fa-eye"></i> Chi tiết
            </button>
            <button type="button" class="btn-secondary" style="padding: 5px 10px; font-size: 12px; background: #fee2e2; color: #b91c1c;" onclick="deleteOrder('${order.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
};

// Cập nhật trạng thái đơn hàng (Đang xử lý / Đang giao hàng / Đã giao hàng / Đã hủy)
const updateOrderStatus = async (orderId, newStatus) => {
  const order = orders.find(o => String(o.id) === String(orderId));
  if (!order) return;

  try {
    await api(`orders/${orderId}`, 'PATCH', { status: newStatus });
    order.status = newStatus;
    updateKPI();
    showToast(`Đã đổi trạng thái đơn ${order.order_code || order.id} sang "${newStatus}"!`, 'success');
  } catch (err) {
    showToast('Lỗi khi cập nhật trạng thái đơn hàng!', 'error');
    renderOrdersTable();
  }
};

// Xem chi tiết các sản phẩm trong đơn hàng
const viewOrderDetail = (orderId) => {
  const order = orders.find(o => String(o.id) === String(orderId));
  if (!order) return showToast('Không tìm thấy thông tin đơn hàng!', 'error');

  const modal = $('admin-order-modal');
  const title = $('admin-order-modal-title');
  const content = $('admin-order-detail-content');

  const code = order.order_code || order.id || '#SMARTSTORE';
  title.textContent = `Chi Tiết Đơn Hàng ${code}`;

  const itemsHtml = (order.items || []).map(item => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px dashed #e2e8f0;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <img src="${item.image || DEFAULT_IMG}" alt="${item.name}" style="width: 45px; height: 45px; object-fit: cover; border-radius: 6px;" onerror="this.src='${DEFAULT_IMG}'" />
        <div>
          <strong style="color: #1e293b;">${item.name || item.product_name}</strong>
          <div style="font-size: 13px; color: #64748b;">Số lượng: x${item.quantity} • Đơn giá: ${formatMoney(item.price)}</div>
        </div>
      </div>
      <strong style="color: #0f172a;">${formatMoney((item.price || 0) * (item.quantity || 1))}</strong>
    </div>
  `).join('');

  content.innerHTML = `
    <div style="background: #f8fafc; padding: 14px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #e2e8f0; font-size: 14px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
        <div><strong>Khách hàng:</strong> ${order.customer_name || '—'}</div>
        <div><strong>Điện thoại:</strong> ${order.customer_phone || order.phone || '—'}</div>
        <div><strong>Email:</strong> ${order.customer_email || '—'}</div>
        <div><strong>Trạng thái:</strong> <span class="badge" style="background: #dbeafe; color: #1d4ed8; padding: 2px 8px; border-radius: 4px;">${order.status || 'Đang xử lý'}</span></div>
      </div>
      <div><strong>Địa chỉ nhận hàng:</strong> ${order.shipping_address || order.address || '—'}</div>
    </div>
    <h4 style="margin-bottom: 8px;"><i class="fas fa-boxes-stacked"></i> Danh Sách Sản Phẩm Mua:</h4>
    <div style="max-height: 240px; overflow-y: auto;">${itemsHtml || '<p>Không có dữ liệu chi tiết sản phẩm.</p>'}</div>
    <div style="display: flex; justify-content: flex-end; align-items: center; gap: 10px; margin-top: 16px; padding-top: 12px; border-top: 2px solid #e2e8f0;">
      <span>Tổng thanh toán:</span>
      <strong style="font-size: 1.25rem; color: #ef4444;">${formatMoney(order.total_price || order.total_amount)}</strong>
    </div>
  `;

  modal?.classList.add('open');
};

// Xóa đơn hàng
const deleteOrder = async (orderId) => {
  const order = orders.find(o => String(o.id) === String(orderId));
  const code = order ? (order.order_code || order.id) : `#${orderId}`;

  if (!confirm(`Bạn có chắc chắn muốn xóa đơn hàng ${code} không?`)) return;

  try {
    await api(`orders/${orderId}`, 'DELETE');
    orders = orders.filter(o => String(o.id) !== String(orderId));
    renderOrdersTable();
    updateKPI();
    showToast(`Đã xóa đơn hàng ${code} thành công!`, 'success');
  } catch (err) {
    showToast('Lỗi khi xóa đơn hàng!', 'error');
  }
};

// ================= 8. QUẢN LÝ TÀI KHOẢN KHÁCH HÀNG =================
const renderUsersTable = () => {
  const tbody = $('admin-user-tbody');
  if (!tbody) return;

  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px;">Chưa có tài khoản nào!</td></tr>`;
    return;
  }

  tbody.innerHTML = users.map((u, i) => `
    <tr>
      <td>${i + 1}</td>
      <td style="font-weight: 600;">${u.name || '—'}</td>
      <td>${u.email || '—'}</td>
      <td>${u.phone || '—'}</td>
      <td>
        <span class="badge" style="background: ${u.role === 'admin' ? '#fef3c7' : '#e0f2fe'}; color: ${u.role === 'admin' ? '#b45309' : '#0369a1'}; padding: 3px 8px; border-radius: 4px;">
          ${u.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}
        </span>
      </td>
      <td style="font-size: 13px; color: #64748b;">${u.address || '—'}</td>
    </tr>
  `).join('');
};

// ================= 9. ĐIỀU HƯỚNG TAB QUẢN TRỊ & ĐĂNG NHẬP / ĐĂNG XUẤT =================

// Chuyển đổi tab quản trị (giữ nguyên tab qua sessionStorage)
const switchAdminTab = (tabId) => {
  if (!tabId) return;

  $$('.admin-tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.subtab === tabId));
  $$('.admin-subpanel').forEach(panel => panel.style.display = panel.id === tabId ? 'block' : 'none');
  sessionStorage.setItem('smartstore_admin_active_tab', tabId);
};

// Đăng nhập Admin
const handleAdminLogin = (e) => {
  e.preventDefault();
  const email = $('admin-email')?.value.trim();
  const password = $('admin-password')?.value.trim();

  const foundAdmin = users.find(u => u.email === email && u.password === password && u.role === 'admin');
  const isDefaultAdmin = email === 'admin@smartstore.vn' && password === 'admin';

  if (isDefaultAdmin || foundAdmin) {
    localStorage.setItem('smartstore_admin_logged', 'true');
    const adminUser = foundAdmin || {
      id: '1',
      name: 'Quản Trị Viên (Admin)',
      email: 'admin@smartstore.vn',
      phone: '0988888888',
      role: 'admin',
      address: 'Hà Nội'
    };
    localStorage.setItem('smartstore_user', JSON.stringify(adminUser));
    showToast('Đăng nhập Quản trị viên thành công!', 'success');
    checkAdminAuth();
  } else {
    showToast('Sai email hoặc mật khẩu Admin! (Mặc định: admin@smartstore.vn / admin)', 'error');
  }
};

// Đăng xuất Admin
const handleAdminLogout = () => {
  if (!confirm('Bạn có chắc muốn đăng xuất khỏi trang Quản trị?')) return;
  localStorage.removeItem('smartstore_admin_logged');
  localStorage.removeItem('smartstore_user');
  checkAdminAuth();
  showToast('Đã đăng xuất trang Quản trị.', 'info');
};

// ================= 10. GẮN BIẾN TOÀN CỤC CHO CÁC SỰ KIỆN INLINE ONCLICK =================
window.editProduct = window.suaSanPham = openProductModal;
window.deleteProduct = window.xoaSanPham = deleteProduct;
window.editCategory = window.suaDanhMuc = openCategoryModal;
window.deleteCategory = window.xoaDanhMuc = deleteCategory;
window.updateOrderStatus = window.doiTrangThaiDonHang = updateOrderStatus;
window.viewOrderDetail = window.xemChiTietDonHangAdmin = viewOrderDetail;
window.deleteOrder = window.xoaDonHangAdmin = deleteOrder;

// ================= 11. KHỞI CHẠY SỰ KIỆN KHI TRANG TẢI XONG =================
document.addEventListener('DOMContentLoaded', () => {
  checkAdminAuth();

  // Khôi phục tab đang mở trước đó
  const savedTab = sessionStorage.getItem('smartstore_admin_active_tab') || 'admin-tab-products';
  switchAdminTab(savedTab);

  // Sự kiện chuyển tab
  $$('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      switchAdminTab(btn.dataset.subtab);
    });
  });

  // Sự kiện mở modal thêm mới
  $('btn-admin-add-product')?.addEventListener('click', () => openProductModal(null));
  $('btn-admin-add-category')?.addEventListener('click', () => openCategoryModal(null));

  // Sự kiện đóng modal
  $('btn-close-product-modal')?.addEventListener('click', () => $('product-modal')?.classList.remove('open'));
  $('btn-cancel-product-modal')?.addEventListener('click', () => $('product-modal')?.classList.remove('open'));
  $('btn-close-category-modal')?.addEventListener('click', () => $('category-modal')?.classList.remove('open'));
  $('btn-cancel-category-modal')?.addEventListener('click', () => $('category-modal')?.classList.remove('open'));
  $('btn-close-order-modal')?.addEventListener('click', () => $('admin-order-modal')?.classList.remove('open'));
  $('btn-close-order-detail')?.addEventListener('click', () => $('admin-order-modal')?.classList.remove('open'));

  // Sự kiện nộp form
  $('product-form')?.addEventListener('submit', handleSaveProduct);
  $('category-form')?.addEventListener('submit', handleSaveCategory);

  // Tải ảnh từ máy tính (FileReader)
  $('form-product-file')?.addEventListener('change', handleImageUpload);

  // Tìm kiếm và lọc sản phẩm
  $('admin-search-product')?.addEventListener('input', renderProductsTable);
  $('admin-filter-category')?.addEventListener('change', renderProductsTable);

  // Đăng nhập & Đăng xuất
  $('admin-login-form')?.addEventListener('submit', handleAdminLogin);
  $('btn-admin-logout')?.addEventListener('click', handleAdminLogout);
});
