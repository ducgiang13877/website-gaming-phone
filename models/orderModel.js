/**
 * ============================================================================
 * 📋 MỤC LỤC CÁC HÀM & TÁC DỤNG (TABLE OF CONTENTS):
 * ----------------------------------------------------------------------------
 * 1. Khởi tạo & Trạng thái Module (Closure State):
 *    • createOrderModel(apiUrl)         : Factory Function khởi tạo module & lưu mảng orders trong Closure
 *    • OrderModel(apiUrl)               : Constructor tương thích ngược trả về instance OrderModel
 *    • _http(endpoint, options)         : Helper gửi HTTP request bất đồng bộ an toàn
 *
 * 2. Quản lý Đơn hàng Gần nhất (Recent Order LocalStorage):
 *    • saveRecentOrder(order)           : Lưu đơn hàng vừa hoàn tất vào LocalStorage phục vụ Thank You & Biên nhận
 *    • getRecentOrder()                 : Trích xuất đơn hàng mới nhất từ LocalStorage để in hóa đơn
 *
 * 3. Giao tiếp RESTful API & Backend (JSON-Server /orders):
 *    • createOrder(orderData)           : [BƯỚC 3-5 TRONG CHECKOUT] Gửi đơn hàng mới lên db.json (POST)
 *    • fetchOrderByCode(orderCode)      : [BƯỚC 3 TRONG TRA CỨU ĐƠN] Tìm đơn theo mã (#DH...) hoặc ID
 *    • fetchOrdersByUser(email)         : Lấy lịch sử mua hàng của khách hàng theo Email
 *    • fetchOrdersByUserId(userId)      : Lấy toàn bộ lịch sử đơn hàng của tài khoản theo ID người dùng
 *    • searchOrders(query)              : Tra cứu đa năng theo Mã đơn hàng, Số điện thoại hoặc Họ tên
 *    • fetchAllOrders()                 : Nạp toàn bộ danh sách đơn hàng cho Quản trị viên Admin Dashboard
 *
 * 4. Nghiệp vụ Quản trị Vòng đời Đơn hàng & Hoàn kho (FSM & Stock Guard):
 *    • updateStatus(id, newStatus)      : Cập nhật trạng thái đơn (FSM: pending -> confirmed -> shipping -> delivered)
 *    • cancelOrder(orderId, reason)     : [HOÀN KHO TỰ ĐỘNG] Hủy đơn hàng và tự động hoàn trả 100% số lượng tồn kho
 * ============================================================================
 */

function createOrderModel(apiUrl = 'http://localhost:3000') {
  let orders = [];
  const recentOrderKey = 'smartstore_recent_order';

  const _http = async (endpoint, options = {}) => {
    try {
      const res = await fetch(`${apiUrl}${endpoint}`, {
        headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
        ...options
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error(`[OrderModel._http] Lỗi kết nối ${endpoint}:`, err.message);
      return null;
    }
  };

  const saveRecentOrder = (order) => {
    if (order) {
      try { localStorage.setItem(recentOrderKey, JSON.stringify(order)); } catch (e) {}
    }
  };

  const getRecentOrder = () => {
    try {
      const data = localStorage.getItem(recentOrderKey);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  };

  /**
   * [BƯỚC 3-5 TRONG LUỒNG CHECKOUT] Tạo đơn hàng mới lên db.json
   */
  const createOrder = async (orderData) => {
    const created = await _http('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
    if (created) {
      saveRecentOrder(created);
      orders.unshift(created);
    }
    return created;
  };

  /**
   * [BƯỚC 3 TRONG LUỒNG TRA CỨU ĐƠN] Tra cứu chi tiết đơn hàng theo mã đơn
   */
  const fetchOrderByCode = async (orderCode) => {
    if (!orderCode) return null;
    const raw = String(orderCode).trim();
    const withHash = raw.startsWith('#') ? raw : `#${raw}`;
    const clean = raw.replace(/^#+/, '');

    // 1. Tìm theo mã có dấu #
    let list = await _http(`/orders?orderCode=${encodeURIComponent(withHash)}`);
    if (list?.length) return list[0];

    // 2. Tìm theo mã không dấu #
    list = await _http(`/orders?orderCode=${encodeURIComponent(clean)}`);
    if (list?.length) return list[0];

    // 3. Tìm theo ID
    const byId = await _http(`/orders/${encodeURIComponent(clean)}`);
    if (byId && byId.id) return byId;

    // 4. Fallback tìm trong cache RAM
    if (orders && orders.length) {
      const found = orders.find(o =>
        String(o.orderCode || '').replace(/^#+/, '') === clean || String(o.id) === clean
      );
      if (found) return found;
    }

    return null;
  };

  /**
   * Lấy lịch sử đơn hàng của khách hàng theo Email
   */
  const fetchOrdersByUser = async (email) => {
    if (!email) return [];
    const all = await fetchAllOrders();
    const cleanEmail = email.trim().toLowerCase();
    return all.filter(o => (o.customerEmail || '').trim().toLowerCase() === cleanEmail);
  };

  /**
   * Lấy tất cả đơn hàng của 1 người dùng theo userId hoặc email
   */
  const fetchOrdersByUserId = async (userId, userEmail = '') => {
    if (!userId && !userEmail) return [];
    const all = await fetchAllOrders();
    const cleanEmail = (userEmail || '').trim().toLowerCase();
    return all.filter(o =>
      (userId && String(o.userId) === String(userId)) ||
      (cleanEmail && (o.customerEmail || '').trim().toLowerCase() === cleanEmail)
    );
  };

  /**
   * Tra cứu đơn hàng theo Mã đơn hoặc Số điện thoại người nhận
   */
  const searchOrders = async (query) => {
    if (!query || !String(query).trim()) return [];
    const q = String(query).trim().toLowerCase();
    const clean = q.replace(/^#+/, '');
    const all = await fetchAllOrders();
    return all.filter(o =>
      (o.orderCode || '').toLowerCase().includes(clean) ||
      (o.customerPhone || '').includes(clean) ||
      (o.customerName || '').toLowerCase().includes(q) ||
      String(o.id || '').toLowerCase() === clean
    );
  };

  /**
   * Lấy toàn bộ danh sách đơn hàng (Dành cho Quản trị viên Admin)
   */
  const fetchAllOrders = async () => {
    const list = await _http('/orders');
    orders = Array.isArray(list) ? list : [];
    orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return orders;
  };

  /**
   * Cập nhật trạng thái đơn hàng (FSM State Machine)
   */
  const updateStatus = async (orderId, newStatus, currentOrder = null) => {
    const updated = await _http(`/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: newStatus,
        updatedAt: new Date().toISOString()
      })
    });

    if (updated) {
      const idx = orders.findIndex(o => String(o.id) === String(orderId));
      if (idx !== -1) orders[idx] = { ...orders[idx], ...updated };
    }

    return updated;
  };

  /**
   * Cập nhật trạng thái đơn hàng dành cho Admin Controller (chuẩn đối tượng { success, order })
   */
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      if (newStatus === 'cancelled') {
        return await cancelOrder(orderId, 'Quản trị viên hủy đơn');
      }
      const updated = await updateStatus(orderId, newStatus);
      if (updated) {
        return { success: true, order: updated };
      }
      return { success: false, error: 'Không thể cập nhật trạng thái đơn hàng!' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /**
   * Hủy đơn hàng kèm cơ chế hoàn kho tự động (Restore Stock Guard)
   */
  const cancelOrder = async (orderId, reason = 'Khách hủy đơn') => {
    let order = orders.find(o => String(o.id) === String(orderId));
    if (!order) {
      order = await _http(`/orders/${orderId}`);
    }

    if (!order) return { success: false, message: 'Không tìm thấy đơn hàng cần hủy!' };

    // FSM Guard: Không cho phép hủy đơn đã giao thành công
    if (order.status === 'delivered' || order.status === 'completed') {
      return { success: false, message: 'Đơn hàng đã được giao thành công, không thể hủy!' };
    }

    // Cập nhật trạng thái hủy
    const updated = await _http(`/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'cancelled',
        cancelReason: reason,
        updatedAt: new Date().toISOString()
      })
    });

    if (!updated) return { success: false, message: 'Lỗi khi cập nhật trạng thái hủy đơn!' };

    // Hoàn trả số lượng tồn kho tự động
    if (Array.isArray(order.items)) {
      for (const item of order.items) {
        try {
          const prod = await _http(`/products/${item.id}`);
          if (prod) {
            const restoredStock = (Number(prod.stock) || 0) + (Number(item.quantity) || 0);
            const restoredSold = Math.max(0, (Number(prod.sold) || 0) - (Number(item.quantity) || 0));
            await _http(`/products/${item.id}`, {
              method: 'PATCH',
              body: JSON.stringify({ stock: restoredStock, sold: restoredSold })
            });
          }
        } catch (e) {
          console.error(`[OrderModel.cancelOrder] Lỗi hoàn kho máy ${item.id}:`, e);
        }
      }
    }

    return { success: true, order: updated, message: 'Đã hủy đơn hàng và hoàn lại tồn kho thành công!' };
  };

  const modelInstance = {
    apiUrl,
    get orders() { return orders; },
    set orders(val) { orders = Array.isArray(val) ? val : []; },
    _http,
    saveRecentOrder,
    getRecentOrder,
    createOrder,
    fetchOrderByCode,
    fetchOrdersByUser,
    fetchOrdersByUserId,
    searchOrders,
    fetchAllOrders,
    updateStatus,
    updateOrderStatus,
    cancelOrder
  };

  return modelInstance;
}

const orderModel = createOrderModel();

function OrderModel(apiUrl) {
  return apiUrl ? createOrderModel(apiUrl) : orderModel;
}

if (typeof window !== 'undefined') {
  window.OrderModel = OrderModel;
  window.orderModel = orderModel;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OrderModel;
}
