/**
 * ============================================================================
 * 📋 MỤC LỤC CÁC HÀM & TÁC DỤNG (TABLE OF CONTENTS):
 * ----------------------------------------------------------------------------
 * 1. Khởi tạo & Điều phối Dependencies:
 *    • createCartController(...)        : Factory Function khởi tạo controller kết nối 4 model (cart, product, order, user)
 *    • CartController(...)              : Constructor tương thích ngược trả về instance CartController
 *
 * 2. Thao tác Giỏ Hàng & Tương Tác View (Cart Actions):
 *    • add(productId, quantity)         : [BƯỚC 1-6 THÊM GIỎ] Thêm máy vào giỏ, kiểm tra tồn kho (Stock Guard) & cập nhật Badge
 *    • changeQty(productId, delta)      : [ACTION] Tăng (+1) hoặc giảm (-1) số lượng, tự động kích hoạt xóa khi về 0
 *    • remove(productId)                : [ACTION] Hộp thoại xác nhận xóa 1 dòng sản phẩm khỏi giỏ hàng
 *    • clear()                          : [ACTION] Hộp thoại xác nhận làm trống toàn bộ giỏ hàng
 *    • renderCart()                     : [ACTION] Render bảng danh sách sản phẩm và tổng tiền trong trang giỏ hàng
 *
 * 3. Động cơ Voucher & Khuyến mãi (Voucher Controller Actions):
 *    • renderCheckout()                 : [BƯỚC 1-6 CHECKOUT] Render tóm tắt đơn hàng, danh sách chip voucher & điền thông tin cũ
 *    • applyVoucher(inputCode)          : [ACTION] Kiểm tra tính hợp lệ của voucher, kiểm tra minOrder và áp dụng giảm giá
 *    • selectVoucherChip(code)          : [ACTION] Chọn nhanh mã voucher bằng cách bấm vào chip gợi ý
 *    • cancelVoucher()                  : [ACTION] Gỡ bỏ voucher đang áp dụng và tính lại tổng thanh toán
 *
 * 4. Xử lý Đặt hàng, Thanh toán & Quản trị Hóa đơn (Order & Invoice Actions):
 *    • processOrder(e)                  : [BƯỚC 1-6 CỐT LÕI CHECKOUT] Chặn Admin mua hàng, validate form, tạo đơn POST /orders,
 *                                         trừ kho PATCH /products song song, làm sạch giỏ và chuyển sang Thank You
 *    • renderThankYou(orderCode)        : Nạp dữ liệu đơn hàng và hiển thị giao diện Xác Nhận Đơn Hàng Thành Công
 *    • openCustomerInvoice(orderCode)   : Mở Modal Hóa Đơn Bán Lẻ Kiêm Phiếu Bảo Hành Điện Tử
 *    • printInvoice()                   : Gọi lệnh in hóa đơn trực tiếp ra khổ giấy A4/A5
 *    • xemDonHangCuaToi()               : Điều hướng thông minh: Khách đăng nhập sang Profile, Khách vãng lai sang Tra Cứu
 * ============================================================================
 */

function createCartController(cartModel, productModel, orderModel, userModel) {
  const cModel = cartModel || (typeof window !== 'undefined' && window.cartModel ? window.cartModel : (typeof CartModel !== 'undefined' ? new CartModel() : null));
  const pModel = productModel || (typeof window !== 'undefined' && window.productModel ? window.productModel : (typeof ProductModel !== 'undefined' ? new ProductModel() : null));
  const oModel = orderModel || (typeof window !== 'undefined' && window.orderModel ? window.orderModel : (typeof OrderModel !== 'undefined' ? new OrderModel() : null));
  const uModel = userModel || (typeof window !== 'undefined' && window.userModel ? window.userModel : (typeof UserModel !== 'undefined' ? new UserModel() : null));

  /**
   * [BƯỚC 1-6 TRONG LUỒNG THÊM GIỎ] Thêm sản phẩm vào giỏ hàng
   * B1: Khách hàng click "Thêm vào giỏ" trên thẻ máy hoặc trang chi tiết.
   * B2: Controller nhận productId, quantity.
   * B3: Kiểm tra thông tin máy và số lượng tồn kho (Stock Guard) trong CartModel.
   * B6: Cập nhật Badge trên Header & vẽ lại bảng nếu đang mở giỏ hàng.
   * @param {string|number} productId - Mã sản phẩm
   * @param {number} [quantity=1] - Số lượng muốn mua
   */
  const add = async (productId, quantity = 1) => {
    if (!pModel || !cModel) return;

    let sp = pModel.products.find(p => String(p.id) === String(productId));
    if (!sp) {
      sp = await pModel.fetchProductById(productId);
    }

    if (!sp) {
      if (window.baseView) window.baseView.showToast('Không tìm thấy sản phẩm!', 'error');
      return;
    }

    const res = cModel.addItem(sp, quantity);
    if (!res.success) {
      if (window.baseView) window.baseView.showToast(res.message, 'warning');
      return;
    }

    // Bước 6: Cập nhật Badge trên Header và thông báo Toast
    if (window.baseView) {
      window.baseView.updateCartBadge(cModel.getTotalCount());
      window.baseView.showToast(`Đã thêm ${quantity} máy "${sp.name}" vào giỏ hàng!`, 'success');
    }

    if (document.getElementById('view-cart')?.classList.contains('active')) {
      renderCart();
    }
  };

  /**
   * [HÀM ACTION] Thay đổi số lượng sản phẩm (+1 / -1)
   * @param {string|number} productId - Mã sản phẩm
   * @param {number} delta - Độ biến thiên (+1 hoặc -1)
   */
  const changeQty = (productId, delta) => {
    if (!cModel) return;
    const res = cModel.changeQuantity(productId, delta);
    if (!res.success) {
      if (res.requireDelete) {
        remove(productId);
        return;
      }
      if (res.message && window.baseView) window.baseView.showToast(res.message, 'warning');
      return;
    }

    if (window.baseView) window.baseView.updateCartBadge(cModel.getTotalCount());
    renderCart();
  };

  /**
   * [HÀM ACTION] Xóa một sản phẩm khỏi giỏ hàng
   * @param {string|number} productId - Mã sản phẩm
   */
  const remove = (productId) => {
    if (!cModel) return;
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?')) {
      return;
    }

    cModel.removeItem(productId);
    if (window.baseView) {
      window.baseView.updateCartBadge(cModel.getTotalCount());
      window.baseView.showToast('Đã xóa sản phẩm khỏi giỏ hàng', 'info');
    }
    renderCart();
  };

  /**
   * [HÀM ACTION] Làm trống toàn bộ giỏ hàng
   */
  const clear = () => {
    if (!cModel) return;
    if (cModel.getItems().length === 0) return;
    if (!confirm('Bạn có chắc chắn muốn làm trống toàn bộ giỏ hàng?')) return;

    cModel.clearCart();
    if (window.baseView) {
      window.baseView.updateCartBadge(0);
      window.baseView.showToast('Đã xóa sạch giỏ hàng', 'info');
    }
    renderCart();
  };

  /**
   * [HÀM ACTION] Render giao diện Trang Giỏ Hàng
   */
  const renderCart = () => {
    if (!cModel) return;
    const items = cModel.getItems();
    const subtotal = cModel.getSubtotal();
    const cView = typeof window !== 'undefined' && (window.cartView || window.CartView);
    cView?.renderCartTable(items, subtotal);
  };

  /**
   * [BƯỚC 1-6 TRONG LUỒNG CHECKOUT] Render giao diện Trang Thanh Toán
   */
  const renderCheckout = async () => {
    if (!cModel) return;
    const items = cModel.getItems();
    if (!items || items.length === 0) {
      if (window.baseView) window.baseView.showToast('Giỏ hàng của bạn đang trống! Hãy chọn mua sản phẩm trước.', 'warning');
      if (window.appNav) window.appNav.goTo('shop');
      return;
    }

    // 0. BẢO VỆ PHÂN QUYỀN ĐẶT HÀNG: BẮT BUỘC ĐĂNG NHẬP
    let user = uModel?.getCurrentUser();
    if (!user) {
      if (window.baseView) {
        window.baseView.showToast('Vui lòng đăng nhập tài khoản để tiến hành đặt hàng và kích hoạt bảo hành điện tử chính hãng!', 'warning');
      }
      if (window.appNav) {
        window.appNav.goTo('auth', { redirect: 'checkout' });
      }
      return;
    }

    // Luôn đồng bộ dữ liệu hồ sơ mới nhất từ CSDL nếu có tài khoản
    if (user.email && uModel?.findUserByEmail) {
      try {
        const freshUser = await uModel.findUserByEmail(user.email);
        if (freshUser) {
          user = { ...user, ...freshUser };
          uModel.saveUser?.(user);
        }
      } catch (e) {}
    }

    // Chặn Quản trị viên (Admin) mua hàng
    if (user.role === 'admin') {
      alert('⚠️ QUYỀN TRUY CẬP BỊ TỪ CHỐI!\n\nTài khoản Quản trị viên (Admin) không được phép thực hiện chức năng mua sắm hoặc đặt đơn hàng của khách hàng.\n\nVui lòng đăng xuất hoặc sử dụng tài khoản Khách hàng để trải nghiệm mua sắm!');
      if (window.appNav) window.appNav.goTo('admin');
      return;
    }

    const subtotal = cModel.getSubtotal();
    const appliedVoucher = cModel.getAppliedVoucher ? cModel.getAppliedVoucher() : cModel.getSavedVoucher();
    const discount = cModel.calculateDiscount(subtotal);
    const total = cModel.getFinalTotal();

    const cView = typeof window !== 'undefined' && (window.cartView || window.CartView);

    // 1. Render tóm tắt đơn hàng
    cView?.renderCheckoutSummary(items, subtotal, discount, total, appliedVoucher);

    // 2. Nạp danh sách mã giảm giá gợi ý
    const vouchers = await cModel.fetchVouchers();
    cView?.renderVoucherChips(vouchers, appliedVoucher, subtotal);

    // 3. Tự động điền/đồng bộ thông tin khách hàng mới nhất từ hồ sơ tài khoản (KHÔNG BỊ CHẶN BỞI CACHE CŨ)
    const nameInput = document.getElementById('checkout-name');
    const emailInput = document.getElementById('checkout-email');
    const phoneInput = document.getElementById('checkout-phone');
    const addrInput = document.getElementById('checkout-address');

    if (nameInput) nameInput.value = user.name || user.fullName || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.phone || '';
    if (addrInput) addrInput.value = user.address || '';
  };

  /**
   * Khôi phục/nạp lại địa chỉ mặc định từ hồ sơ cá nhân vào ô nhập checkout
   */
  const resetAddressToDefault = async () => {
    let user = uModel?.getCurrentUser();
    if (user?.email && uModel?.findUserByEmail) {
      try {
        const freshUser = await uModel.findUserByEmail(user.email);
        if (freshUser) {
          user = { ...user, ...freshUser };
          uModel.saveUser?.(user);
        }
      } catch (e) {}
    }
    const addrInput = document.getElementById('checkout-address');
    if (addrInput && user) {
      addrInput.value = user.address || '';
      if (window.baseView) {
        window.baseView.showToast(user.address ? `Đã nạp địa chỉ mặc định: ${user.address}` : 'Tài khoản chưa lưu địa chỉ mặc định trong hồ sơ!', user.address ? 'info' : 'warning');
      }
    }
  };

  /**
   * [HÀM ACTION] Áp dụng mã giảm giá Voucher
   * @param {string} [inputCode] - Mã voucher nhập thủ công hoặc từ chip
   */
  const applyVoucher = async (inputCode) => {
    if (!cModel) return;
    const code = (inputCode || document.getElementById('input-voucher-code')?.value || document.getElementById('checkout-voucher-input')?.value || '').trim().toUpperCase();
    if (!code) {
      if (window.baseView) window.baseView.showToast('Vui lòng nhập mã giảm giá!', 'warning');
      return;
    }

    const subtotal = cModel.getSubtotal();
    const vouchers = await cModel.fetchVouchers();
    const voucher = (vouchers || []).find(v => v.code.toUpperCase() === code);

    if (!voucher) {
      if (window.baseView) window.baseView.showToast(`Mã giảm giá "${code}" không hợp lệ hoặc đã hết hạn!`, 'error');
      return;
    }

    if (voucher.minOrder && subtotal < voucher.minOrder) {
      const minText = window.baseView ? window.baseView.formatCurrency(voucher.minOrder) : `${voucher.minOrder} đ`;
      if (window.baseView) window.baseView.showToast(`Mã "${code}" chỉ áp dụng cho đơn hàng từ ${minText}!`, 'warning');
      return;
    }

    cModel.setAppliedVoucher(voucher);
    const discount = cModel.calculateDiscount(subtotal);
    const discText = window.baseView ? window.baseView.formatCurrency(discount) : `${discount} đ`;
    if (window.baseView) window.baseView.showToast(`Áp dụng thành công mã "${code}"! Giảm ${discText}.`, 'success');

    renderCheckout();
  };

  /**
   * Chọn nhanh voucher từ chip gợi ý
   */
  const selectVoucherChip = (code) => {
    const input = document.getElementById('input-voucher-code') || document.getElementById('checkout-voucher-input');
    if (input) input.value = code;
    applyVoucher(code);
  };

  /**
   * Hủy bỏ mã giảm giá đang dùng
   */
  const cancelVoucher = () => {
    if (!cModel) return;
    cModel.clearVoucher();
    const input = document.getElementById('input-voucher-code') || document.getElementById('checkout-voucher-input');
    if (input) input.value = '';

    if (window.baseView) window.baseView.showToast('Đã gỡ bỏ mã giảm giá', 'info');
    renderCheckout();
  };

  /**
   * [BƯỚC 1-6 CỐT LÕI NHẤT] Xử lý Đặt hàng (Thanh toán đơn hàng & Trừ tồn kho)
   * Luồng MVC:
   *   Bước 1: Khách hàng click "Xác nhận đặt hàng" trên trang Checkout.
   *   Bước 2: Controller thu thập form, validate họ tên, SĐT, địa chỉ, chặn Admin mua sắm.
   *   Bước 3: Gọi OrderModel tạo đơn hàng mới trên db.json.
   *   Bước 4: Gọi ProductModel trừ tồn kho và tăng số lượng bán song song.
   *   Bước 5: Xóa sạch giỏ hàng trong CartModel.
   *   Bước 6: Chuyển hướng sang màn hình Cảm ơn và hiển thị biên nhận.
   * @param {Event} [e] - Sự kiện submit form
   */
  const processOrder = async (e) => {
    if (e) e.preventDefault();

    // 1. Kiểm tra trạng thái đăng nhập: BẮT BUỘC ĐĂNG NHẬP
    const currentUser = uModel?.getCurrentUser();
    if (!currentUser) {
      if (window.baseView) {
        window.baseView.showToast('Vui lòng đăng nhập tài khoản để tiến hành đặt hàng!', 'error');
      } else {
        alert('Vui lòng đăng nhập tài khoản để tiến hành đặt hàng!');
      }
      if (window.appNav) {
        window.appNav.goTo('auth', { redirect: 'checkout' });
      }
      return;
    }

    // 2. Chặn tài khoản Quản trị viên (Admin) đặt hàng
    if (currentUser.role === 'admin') {
      alert('⚠️ QUYỀN TRUY CẬP BỊ TỪ CHỐI!\n\nTài khoản Quản trị viên (Admin) không được phép thực hiện chức năng mua sắm hoặc đặt đơn hàng của khách hàng.\n\nVui lòng đăng xuất hoặc sử dụng tài khoản Khách hàng để trải nghiệm mua sắm!');
      return;
    }

    // 2. Lấy dữ liệu biểu mẫu thanh toán
    const name = document.getElementById('checkout-name')?.value.trim();
    const phone = document.getElementById('checkout-phone')?.value.trim();
    const email = document.getElementById('checkout-email')?.value.trim() || (currentUser?.email || '');
    const address = document.getElementById('checkout-address')?.value.trim();
    const note = document.getElementById('checkout-note')?.value.trim() || '';
    const paymentMethodEl = document.querySelector('input[name="payment_method"]:checked');
    const paymentMethod = paymentMethodEl ? paymentMethodEl.value : 'COD';

    const toast = window.baseView ? window.baseView.showToast : alert;

    if (!name || !phone || !address) {
      toast('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ nhận máy!', 'warning');
      return;
    }

    if (name.length < 2) {
      toast('Họ và tên người nhận phải có ít nhất 2 ký tự!', 'warning');
      return;
    }

    const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      toast('Số điện thoại nhận máy không hợp lệ (ví dụ: 0912345678 hoặc +84912345678)!', 'warning');
      return;
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast('Địa chỉ email không đúng định dạng (ví dụ: khachhang@gmail.com)!', 'warning');
        return;
      }
    }

    if (address.length < 5) {
      toast('Địa chỉ nhận máy quá ngắn, vui lòng nhập rõ số nhà, tên đường, phường/xã!', 'warning');
      return;
    }

    if (!cModel || !oModel || !pModel) return;

    const items = cModel.getItems();
    if (items.length === 0) {
      toast('Giỏ hàng trống!', 'error');
      return;
    }

    const subtotal = cModel.getSubtotal();
    const appliedVoucher = cModel.getAppliedVoucher ? cModel.getAppliedVoucher() : cModel.getSavedVoucher();
    const discount = cModel.calculateDiscount(subtotal);
    const totalAmount = cModel.getFinalTotal();

    // Sinh mã đơn hàng ngẫu nhiên chuyên nghiệp (#DH + 9 chữ số)
    const randomSuffix = Math.floor(100000000 + Math.random() * 900000000);
    const orderCode = `#DH${randomSuffix}`;

    const newOrder = {
      orderCode,
      userId: currentUser ? String(currentUser.id) : '',
      customerName: name,
      customerPhone: phone,
      customerEmail: email || (currentUser?.email || ''),
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

    // 3. Gửi đơn hàng lên Backend JSON-Server (POST /orders)
    const createdOrder = await oModel.createOrder(newOrder);
    if (!createdOrder) {
      toast('Lỗi máy chủ khi tạo đơn hàng, vui lòng thử lại!', 'error');
      return;
    }

    // 4. Trừ tồn kho và tăng số lượng đã bán song song (PATCH /products/:id)
    const stockUpdates = items.map(async item => {
      const sp = await pModel.fetchProductById(item.id);
      if (sp) {
        const khoHienTai = Number(sp.stock) || Number(sp.quantity) || 0;
        const khoMoi = Math.max(0, khoHienTai - item.quantity);
        const daBanMoi = (Number(sp.sold) || 0) + item.quantity;
        return pModel.updateProductStock(item.id, khoMoi, daBanMoi);
      }
    });
    await Promise.all(stockUpdates);

    // 5. Làm sạch giỏ hàng & voucher
    cModel.clearCart();
    if (window.baseView) {
      window.baseView.updateCartBadge(0);
      window.baseView.showToast('Đặt hàng thành công! Đang chuyển đến biên nhận đơn...', 'success');
    }

    // 6. Chuyển sang màn hình cảm ơn
    setTimeout(() => {
      if (window.appNav) {
        window.appNav.goTo('thankyou', { orderCode });
      }
    }, 500);
  };

  /**
   * Render Màn hình Cảm ơn (Thank You View)
   * @param {string} [orderCode] - Mã đơn hàng
   */
  const renderThankYou = async (orderCode) => {
    if (!oModel) return;
    let order = null;
    if (orderCode) {
      order = await oModel.fetchOrderByCode(orderCode);
    }
    if (!order) {
      order = oModel.getRecentOrder();
    }

    if (!order) {
      if (window.baseView) window.baseView.showToast('Không tìm thấy thông tin đơn hàng vừa đặt!', 'warning');
      return;
    }

    const oView = typeof window !== 'undefined' && (window.orderView || window.OrderView);
    oView?.renderThankYouView(order);
  };

  /**
   * Mở Hộp thoại Xem Chi Tiết Hóa Đơn Bán Lẻ Kiêm Phiếu Bảo Hành
   * @param {string} [orderCode] - Mã đơn hàng
   */
  const openCustomerInvoice = async (orderCode) => {
    if (!oModel) return;
    let order = null;
    if (orderCode) {
      order = await oModel.fetchOrderByCode(orderCode);
    }
    if (!order) {
      order = oModel.getRecentOrder();
    }

    if (!order) {
      if (window.baseView) window.baseView.showToast('Không tìm thấy hóa đơn của đơn hàng này!', 'error');
      return;
    }

    const oView = typeof window !== 'undefined' && (window.orderView || window.OrderView);
    oView?.renderInvoiceModal('customer-invoice-body', order);
    if (window.baseView) window.baseView.openModal('customer-invoice-modal');
  };

  /**
   * In hóa đơn trực tiếp ra khổ giấy A4/A5
   */
  const printInvoice = () => {
    window.print();
  };

  /**
   * Nút "Xem đơn hàng của tôi" - Phân luồng điều hướng thông minh theo phiên làm việc
   */
  const xemDonHangCuaToi = () => {
    const currentUser = uModel?.getCurrentUser();
    const recentOrder = oModel?.getRecentOrder();
    const orderCodeEl = document.getElementById('thankyou-order-code');
    let orderCode = (orderCodeEl ? orderCodeEl.textContent.trim() : '') || (recentOrder ? recentOrder.orderCode : '');
    orderCode = orderCode.replace(/^#+/, '');

    if (currentUser) {
      if (window.baseView) window.baseView.showToast(`Đang mở danh sách đơn hàng của bạn (${currentUser.name || currentUser.fullName || currentUser.email})...`, 'info');
      if (window.appNav) window.appNav.goTo('profile');
    } else {
      if (window.baseView) window.baseView.showToast('Đang chuyển tới trang Tra Cứu Đơn Hàng...', 'info');
      if (window.appNav) {
        window.appNav.goTo('tracking', { code: orderCode });
      }
    }
  };

  return {
    get cartModel() { return cModel; },
    get productModel() { return pModel; },
    get orderModel() { return oModel; },
    get userModel() { return uModel; },
    add,
    changeQty,
    remove,
    clear,
    renderCart,
    renderCheckout,
    applyVoucher,
    selectVoucherChip,
    cancelVoucher,
    processOrder,
    renderThankYou,
    openCustomerInvoice,
    viewInvoice: openCustomerInvoice,
    printInvoice,
    xemDonHangCuaToi,
    viewMyOrders: xemDonHangCuaToi,
    resetAddressToDefault
  };
}

// Khởi tạo Singleton toàn cục trong namespace Controller
const cartController = createCartController();

// Constructor tương thích ngược 100% với mã gọi new CartController()
function CartController(cartModel, productModel, orderModel, userModel) {
  return createCartController(cartModel, productModel, orderModel, userModel);
}

if (typeof window !== 'undefined') {
  window.cartController = cartController;
  window.CartController = CartController;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CartController;
}
