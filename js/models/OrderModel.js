/**
 * ============================================================================
 * MODEL: OrderModel (Quản lý Dữ liệu Đơn hàng, Tra cứu, Hủy đơn & Tồn kho)
 * Kiến trúc: Mô hình MVC Chuẩn - SmartStore
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * ============================================================================
 */

class OrderModel {
  constructor(apiUrl = 'http://localhost:3000') {
    this.apiUrl = apiUrl;
    this.recentOrderKey = 'smartstore_recent_order';
  }

  /** Lưu đơn hàng vừa tạo xong vào localStorage để tiện xem ngay */
  saveRecentOrder(order) {
    localStorage.setItem(this.recentOrderKey, JSON.stringify(order));
  }

  getRecentOrder() {
    try {
      const data = localStorage.getItem(this.recentOrderKey);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  /** Tạo đơn hàng mới lên db.json */
  async createOrder(orderData) {
    try {
      const res = await fetch(`${this.apiUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (!res.ok) throw new Error(`Lỗi tạo đơn: ${res.status}`);
      const createdOrder = await res.json();
      this.saveRecentOrder(createdOrder);
      return createdOrder;
    } catch (err) {
      console.error('[OrderModel] Lỗi tạo đơn hàng:', err);
      return null;
    }
  }

  /** Lấy chi tiết đơn hàng theo mã đơn (#DH...) hoặc ID */
  async fetchOrderByCode(orderCode) {
    try {
      const code = orderCode.trim();
      const res = await fetch(`${this.apiUrl}/orders?orderCode=${encodeURIComponent(code)}`);
      if (res.ok) {
        const orders = await res.json();
        if (orders.length > 0) return orders[0];
      }
      // Thử tìm theo ID
      const resId = await fetch(`${this.apiUrl}/orders/${encodeURIComponent(code)}`);
      if (resId.ok) return await resId.json();
      return null;
    } catch (e) {
      console.error('[OrderModel] Lỗi tìm đơn hàng:', e);
      return null;
    }
  }

  /** Lấy tất cả đơn hàng của 1 người dùng theo userId */
  async fetchOrdersByUserId(userId) {
    try {
      const res = await fetch(`${this.apiUrl}/orders?userId=${userId}&_sort=createdAt&_order=desc`);
      if (!res.ok) throw new Error('Lỗi lấy danh sách đơn');
      return await res.json();
    } catch (e) {
      console.error('[OrderModel] Lỗi nạp đơn hàng cá nhân:', e);
      return [];
    }
  }

  /** Tra cứu đơn hàng theo Mã đơn hoặc Số điện thoại */
  async searchOrders(query) {
    try {
      const q = query.trim();
      let res = await fetch(`${this.apiUrl}/orders?orderCode=${encodeURIComponent(q)}`);
      let list = await res.json();

      if (!list || list.length === 0) {
        // Tìm theo số điện thoại
        res = await fetch(`${this.apiUrl}/orders?customerPhone=${encodeURIComponent(q)}`);
        list = await res.json();
      }
      return list || [];
    } catch (e) {
      console.error('[OrderModel] Lỗi tra cứu đơn:', e);
      return [];
    }
  }

  /** Khách hủy đơn hàng ở trạng thái Chờ xử lý & hoàn trả kho */
  async cancelOrder(orderId) {
    try {
      // 1. Cập nhật trạng thái đơn thành cancelled
      const res = await fetch(`${this.apiUrl}/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });
      if (!res.ok) throw new Error('Không thể cập nhật trạng thái đơn hàng');
      const updatedOrder = await res.json();

      // 2. Hoàn trả lại số lượng tồn kho cho các sản phẩm trong đơn
      if (updatedOrder.items && updatedOrder.items.length > 0) {
        const restorePromises = updatedOrder.items.map(async item => {
          const resSp = await fetch(`${this.apiUrl}/products/${item.id}`);
          if (resSp.ok) {
            const sp = await resSp.json();
            const khoMoi = (Number(sp.stock) || 0) + (Number(item.quantity) || 0);
            const daBanMoi = Math.max(0, (Number(sp.sold) || 0) - (Number(item.quantity) || 0));
            return fetch(`${this.apiUrl}/products/${item.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ stock: khoMoi, quantity: khoMoi, sold: daBanMoi })
            });
          }
        });
        await Promise.all(restorePromises);
      }

      return { success: true, order: updatedOrder };
    } catch (e) {
      console.error('[OrderModel] Lỗi hủy đơn:', e);
      return { success: false, error: e.message };
    }
  }
}

// Khởi tạo Singleton toàn cục trong namespace Model
window.OrderModel = OrderModel;
