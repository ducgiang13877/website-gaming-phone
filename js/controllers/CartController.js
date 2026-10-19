/**
 * ============================================================================
 * CONTROLLER: CartController (Điều phối Giỏ Hàng, Voucher, Thanh Toán & Hóa Đơn)
 * Kiến trúc: Mô hình MVC Chuẩn - SmartStore
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * ============================================================================
 */

class CartController {
  constructor(cartModel, productModel, orderModel, userModel) {
    this.cartModel = cartModel || new window.CartModel();
    this.productModel = productModel || new window.ProductModel();
    this.orderModel = orderModel || new window.OrderModel();
    this.userModel = userModel || new window.UserModel();
  }

  /** Thêm sản phẩm vào giỏ hàng */
  async add(productId, quantity = 1) {
    let sp = this.productModel.products.find(p => String(p.id) === String(productId));
    if (!sp) {
      sp = await this.productModel.fetchProductById(productId);
    }

    if (!sp) {
      window.BaseView.showToast('Không tìm thấy sản phẩm!', 'error');
      return;
    }

    const res = this.cartModel.addItem(sp, quantity);
    if (!res.success) {
      window.BaseView.showToast(res.message, 'warning');
      return;
    }

    // Cập nhật số lượng trên Header
    window.BaseView.updateCartBadge(this.cartModel.getTotalCount());
    window.BaseView.showToast(`Đã thêm ${quantity} máy "${sp.name}" vào giỏ hàng!`, 'success');

    // Nếu đang ở màn hình giỏ hàng, cập nhật lại bảng
    if (document.getElementById('view-cart')?.classList.contains('active')) {
      this.renderCart();
    }
  }

  /** Thay đổi số lượng sản phẩm trong giỏ */
  changeQty(productId, delta) {
    const res = this.cartModel.changeQuantity(productId, delta);
    if (!res.success) {
      if (res.requireDelete) {
        this.remove(productId);
        return;
      }
      if (res.message) window.BaseView.showToast(res.message, 'warning');
      return;
    }

    window.BaseView.updateCartBadge(this.cartModel.getTotalCount());
    this.renderCart();
  }

  /** Xóa sản phẩm khỏi giỏ */
  remove(productId) {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?')) {
      return;
    }

    this.cartModel.removeItem(productId);
    window.BaseView.updateCartBadge(this.cartModel.getTotalCount());
    window.BaseView.showToast('Đã xóa sản phẩm khỏi giỏ hàng', 'info');
    this.renderCart();
  }

  /** Xóa sạch giỏ hàng */
  clear() {
    if (this.cartModel.getItems().length === 0) return;
    if (!confirm('Bạn có chắc chắn muốn làm trống toàn bộ giỏ hàng?')) return;

    this.cartModel.clearCart();
    window.BaseView.updateCartBadge(0);
    window.BaseView.showToast('Đã xóa sạch giỏ hàng', 'info');
    this.renderCart();
  }

  /** Render giao diện Trang Giỏ Hàng */
  renderCart() {
    const items = this.cartModel.getItems();
    const subtotal = this.cartModel.getSubtotal();
    window.CartView.renderCartTable(items, subtotal);
  }

  /** Render giao diện Trang Thanh Toán (Checkout) */
  async renderCheckout() {
    const items = this.cartModel.getItems();
    if (!items || items.length === 0) {
      window.BaseView.showToast('Giỏ hàng của bạn đang trống! Hãy chọn mua sản phẩm trước.', 'warning');
      if (window.appNav) window.appNav.goTo('shop');
      return;
    }

    const subtotal = this.cartModel.getSubtotal();
    const appliedVoucher = this.cartModel.getAppliedVoucher();
    const discount = this.cartModel.calculateDiscount(subtotal);
    const total = this.cartModel.getFinalTotal();

    // 1. Render tóm tắt đơn hàng
    window.CartView.renderCheckoutSummary(items, subtotal, discount, total, appliedVoucher);

    // 2. Nạp danh sách mã giảm giá gợi ý
    const vouchers = await this.cartModel.fetchVouchers();
    window.CartView.renderVoucherChips(vouchers, appliedVoucher, subtotal);

    // 3. Tự động điền thông tin nếu khách hàng đã đăng nhập
    const user = this.userModel.getCurrentUser();
    if (user) {
      const nameInput = document.getElementById('checkout-name');
      const emailInput = document.getElementById('checkout-email');
      const phoneInput = document.getElementById('checkout-phone');
      const addrInput = document.getElementById('checkout-address');

      if (nameInput && !nameInput.value) nameInput.value = user.name || '';
      if (emailInput && !emailInput.value) emailInput.value = user.email || '';
      if (phoneInput && !phoneInput.value) phoneInput.value = user.phone || '';
      if (addrInput && !addrInput.value) addrInput.value = user.address || '';
    }
  }

  /** Áp dụng mã giảm giá Voucher */
  async applyVoucher(inputCode) {
    const code = (inputCode || document.getElementById('input-voucher-code')?.value || document.getElementById('checkout-voucher-input')?.value || '').trim().toUpperCase();
    if (!code) {
      window.BaseView.showToast('Vui lòng nhập mã giảm giá!', 'warning');
      return;
    }

    const subtotal = this.cartModel.getSubtotal();
    const vouchers = await this.cartModel.fetchVouchers();
    const voucher = vouchers.find(v => v.code.toUpperCase() === code);

    if (!voucher) {
      window.BaseView.showToast(`Mã giảm giá "${code}" không hợp lệ hoặc đã hết hạn!`, 'error');
      return;
    }

    if (voucher.minOrder && subtotal < voucher.minOrder) {
      const formatCurrency = BaseView.formatCurrency;
      window.BaseView.showToast(`Mã "${code}" chỉ áp dụng cho đơn hàng từ ${formatCurrency(voucher.minOrder)}!`, 'warning');
      return;
    }

    this.cartModel.setAppliedVoucher(voucher);
    const discount = this.cartModel.calculateDiscount(subtotal);
    window.BaseView.showToast(`Áp dụng thành công mã "${code}"! Giảm ${BaseView.formatCurrency(discount)}.`, 'success');

    this.renderCheckout();
  }

  /** Chọn nhanh voucher từ chip */
  selectVoucherChip(code) {
    const input = document.getElementById('input-voucher-code') || document.getElementById('checkout-voucher-input');
    if (input) input.value = code;
    this.applyVoucher(code);
  }

  /** Hủy bỏ mã giảm giá đang dùng */
  cancelVoucher() {
    this.cartModel.clearVoucher();
    const input = document.getElementById('input-voucher-code') || document.getElementById('checkout-voucher-input');
    if (input) input.value = '';

    window.BaseView.showToast('Đã gỡ bỏ mã giảm giá', 'info');
    this.renderCheckout();
  }

  /** Xử lý Đặt hàng (Thanh toán đơn hàng) */
  async processOrder(e) {
    if (e) e.preventDefault();

    // 1. Kiểm tra Hard-Block: Chặn tài khoản Quản trị viên (Admin) đặt hàng
    const currentUser = this.userModel.getCurrentUser();
    if (currentUser && currentUser.role === 'admin') {
      alert('⚠️ QUYỀN TRUY CẬP BỊ TỪ CHỐI!\n\nTài khoản Quản trị viên (Admin) không được phép thực hiện chức năng mua sắm hoặc đặt đơn hàng của khách hàng.\n\nVui lòng đăng xuất hoặc sử dụng tài khoản Khách hàng để trải nghiệm mua sắm!');
      return;
    }

    // 2. Lấy dữ liệu biểu mẫu thanh toán
    const name = document.getElementById('checkout-name')?.value.trim();
    const phone = document.getElementById('checkout-phone')?.value.trim();
    const email = document.getElementById('checkout-email')?.value.trim() || '';
    const address = document.getElementById('checkout-address')?.value.trim();
    const note = document.getElementById('checkout-note')?.value.trim() || '';
    const paymentMethodEl = document.querySelector('input[name="payment_method"]:checked');
    const paymentMethod = paymentMethodEl ? paymentMethodEl.value : 'COD';

    if (!name || !phone || !address) {
      window.BaseView.showToast('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ nhận máy!', 'warning');
      return;
    }

    const items = this.cartModel.getItems();
    if (items.length === 0) {
      window.BaseView.showToast('Giỏ hàng trống!', 'error');
      return;
    }

    const subtotal = this.cartModel.getSubtotal();
    const appliedVoucher = this.cartModel.getAppliedVoucher();
    const discount = this.cartModel.calculateDiscount(subtotal);
    const totalAmount = this.cartModel.getFinalTotal();

    // Sinh mã đơn hàng ngẫu nhiên chuyên nghiệp
    const randomSuffix = Math.floor(100000000 + Math.random() * 900000000);
    const orderCode = `#DH${randomSuffix}`;

    const newOrder = {
      orderCode,
      userId: currentUser ? String(currentUser.id) : null,
      customerName: name,
      customerPhone: phone,
      customerEmail: email,
      customerAddress: address,
      note,
      paymentMethod,
      items: [...items],
      subtotal,
      voucherCode: appliedVoucher ? appliedVoucher.code : null,
      discountAmount: discount,
      totalAmount,
      status: 'processing',
      createdAt: new Date().toISOString()
    };

    // 3. Gửi đơn hàng lên server
    const createdOrder = await this.orderModel.createOrder(newOrder);
    if (!createdOrder) {
      window.BaseView.showToast('Lỗi máy chủ khi tạo đơn hàng, vui lòng thử lại!', 'error');
      return;
    }

    // 4. Trừ tồn kho và tăng số lượng đã bán trên db.json
    const stockUpdates = items.map(async item => {
      const sp = await this.productModel.fetchProductById(item.id);
      if (sp) {
        const khoMoi = Math.max(0, (Number(sp.stock) || Number(sp.quantity) || 0) - item.quantity);
        const daBanMoi = (Number(sp.sold) || 0) + item.quantity;
        return this.productModel.updateStock(item.id, khoMoi, daBanMoi);
      }
    });
    await Promise.all(stockUpdates);

    // 5. Làm sạch giỏ hàng & voucher
    this.cartModel.clearCart();
    window.BaseView.updateCartBadge(0);

    window.BaseView.showToast('Đặt hàng thành công! Đang chuyển đến biên nhận đơn...', 'success');

    // 6. Chuyển sang màn hình cảm ơn
    setTimeout(() => {
      if (window.appNav) {
        window.appNav.goTo('thankyou', { orderCode });
      }
    }, 500);
  }

  /** Render Màn hình Cảm ơn (Thank You View) */
  async renderThankYou(orderCode) {
    let order = null;
    if (orderCode) {
      order = await this.orderModel.fetchOrderByCode(orderCode);
    }
    if (!order) {
      order = this.orderModel.getRecentOrder();
    }

    if (!order) {
      window.BaseView.showToast('Không tìm thấy thông tin đơn hàng vừa đặt!', 'warning');
      return;
    }

    window.OrderView.renderThankYouView(order);
  }

  /** Mở Hộp thoại Xem Chi Tiết Hóa Đơn Bán Lẻ Kiêm Phiếu Bảo Hành */
  async openCustomerInvoice(orderCode) {
    let order = null;
    if (orderCode) {
      order = await this.orderModel.fetchOrderByCode(orderCode);
    }
    if (!order) {
      order = this.orderModel.getRecentOrder();
    }

    if (!order) {
      window.BaseView.showToast('Không tìm thấy hóa đơn của đơn hàng này!', 'error');
      return;
    }

    window.OrderView.renderInvoiceModal('customer-invoice-body', order);
    window.BaseView.openModal('customer-invoice-modal');
  }

  /** In hóa đơn trực tiếp */
  printInvoice() {
    window.print();
  }

  /**
   * 🎯 NÚT "XEM ĐƠN HÀNG CỦA TÔI":
   * Phân luồng điều hướng thông minh theo phiên làm việc:
   * - Nếu đã đăng nhập tài khoản: Chuyển thẳng về Hồ Sơ Cá Nhân (profile) -> Tab Lịch Sử Đơn Hàng.
   * - Nếu chưa đăng nhập: Chuyển sang Tra Cứu Đơn Hàng (tracking) và tự động điền sẵn mã đơn vừa đặt!
   */
  xemDonHangCuaToi() {
    const currentUser = this.userModel.getCurrentUser();
    const recentOrder = this.orderModel.getRecentOrder();
    const orderCodeEl = document.getElementById('thankyou-order-code');
    const orderCode = (orderCodeEl ? orderCodeEl.textContent.trim() : '') || (recentOrder ? recentOrder.orderCode : '');

    if (currentUser) {
      window.BaseView.showToast(`Đang mở danh sách đơn hàng của bạn (${currentUser.name || currentUser.email})...`, 'info');
      if (window.appNav) window.appNav.goTo('profile');
    } else {
      window.BaseView.showToast('Đang chuyển tới trang Tra Cứu Vận Đơn...', 'info');
      if (window.appNav) window.appNav.goTo('tracking');

      setTimeout(() => {
        const trackingInput = document.getElementById('tracking-order-input') || document.getElementById('tracking-input');
        if (trackingInput && orderCode) {
          trackingInput.value = orderCode;
          if (window.authCtrl) window.authCtrl.searchOrders(orderCode);
        }
      }, 300);
    }
  }
}

// Khởi tạo Singleton toàn cục trong namespace Controller
window.CartController = CartController;
