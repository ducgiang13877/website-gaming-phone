/**
 * ============================================================================
 * 📋 MỤC LỤC CÁC HÀM & TÁC DỤNG (TABLE OF CONTENTS):
 * ----------------------------------------------------------------------------
 * 1. Khởi tạo & Trạng thái Module (Closure State):
 *    • createCartModel(apiUrl)          : Factory Function khởi tạo module & lưu trữ state trong Closure
 *    • CartModel(apiUrl)                : Constructor tương thích ngược trả về instance CartModel
 *    • _http(endpoint, options)         : Helper gửi HTTP request bất đồng bộ an toàn
 *
 * 2. Quản lý Giỏ hàng & Đồng bộ LocalStorage:
 *    • getItems()                       : Lấy danh sách sản phẩm trong giỏ từ LocalStorage
 *    • saveItems(items)                 : Lưu mảng sản phẩm giỏ hàng mới vào LocalStorage
 *    • getTotalCount()                  : Tính tổng số lượng máy điện thoại đang có trong giỏ hàng
 *    • getSubtotal()                    : Tính tạm tính tổng giá trị tiền hàng (chưa trừ voucher)
 *    • addItem(product, quantity)       : [BƯỚC 3-4] Thêm máy vào giỏ kèm kiểm soát tồn kho nghiêm ngặt (Stock Guard)
 *    • changeQuantity(id, delta)        : Tăng (+1) hoặc giảm (-1) số lượng, cảnh báo xóa khi số lượng <= 0
 *    • removeItem(productId)            : Xóa 1 dòng sản phẩm được chỉ định ra khỏi giỏ hàng
 *    • clearCart()                      : Xóa sạch toàn bộ giỏ hàng và làm mới LocalStorage
 *
 * 3. Động cơ Voucher & Khuyến mãi (Voucher Engine):
 *    • getSavedVoucher()                : Lấy thông tin voucher đang được áp dụng từ LocalStorage
 *    • saveVoucher(voucher)             : Ghi nhớ voucher hợp lệ vào LocalStorage hoặc xóa bỏ
 *    • setAppliedVoucher(voucher)       : Áp dụng voucher đã được xác thực
 *    • clearVoucher()                   : Hủy bỏ voucher đang áp dụng
 *    • fetchVouchers()                  : Lấy danh sách mã giảm giá từ CSDL JSON-Server (/vouchers)
 *    • checkVoucher(code, subtotal)     : Kiểm tra tính hợp lệ của mã giảm giá & điều kiện giá trị đơn tối thiểu (minOrder)
 *    • calculateDiscount(subtotal, v)   : Tính số tiền chiết khấu thực tế (hỗ trợ cả % lẫn số tiền cố định và chặn trần maxDiscount)
 *    • getFinalTotal()                  : Tính tổng số tiền thanh toán cuối cùng (Subtotal - Discount)
 *
 * 4. Thanh tiến trình Game hóa nhận quà (Gamification Reward Bar):
 *    • getRewardProgress(subtotal)      : Tính mốc nhận quà tặng tự động theo giá trị đơn hàng (10tr, 20tr, 35tr)
 * ============================================================================
 */

function createCartModel(apiUrl = 'http://localhost:3000') {
  const storageKey = 'smartstore_cart';
  const voucherKey = 'smartstore_voucher';
  let appliedVoucher = null;

  // Khôi phục voucher đã lưu từ trước
  try {
    const savedV = localStorage.getItem(voucherKey);
    if (savedV) appliedVoucher = JSON.parse(savedV);
  } catch (e) {}

  /**
   * Helper gửi request HTTP an toàn tới Backend
   */
  const _http = async (endpoint, options = {}) => {
    try {
      const res = await fetch(`${apiUrl}${endpoint}`, {
        headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
        ...options
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error(`[CartModel._http] Lỗi kết nối ${endpoint}:`, err.message);
      return null;
    }
  };

  /**
   * Lấy danh sách sản phẩm trong giỏ hàng từ LocalStorage
   */
  const getItems = () => {
    try {
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      return [];
    }
  };

  /**
   * Lưu mảng giỏ hàng mới vào LocalStorage
   */
  const saveItems = (items = []) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch (e) {}
  };

  /**
   * Lấy tổng số lượng món hàng trong giỏ
   */
  const getTotalCount = () => {
    return getItems().reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  };

  /**
   * Tính tạm tính tổng giá trị tiền hàng
   */
  const getSubtotal = () => {
    return getItems().reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 0)), 0);
  };

  /**
   * [BƯỚC 3-4] Thêm sản phẩm vào giỏ kèm kiểm soát tồn kho (Stock Guard)
   */
  const addItem = (product, quantity = 1) => {
    if (!product || !product.id) return { success: false, message: 'Dữ liệu sản phẩm không hợp lệ!' };

    // Chuẩn hóa số lượng đầu vào: Sanitize số âm, số 0 về tối thiểu 1 máy
    const validQty = Math.max(1, parseInt(quantity) || 1);
    const items = getItems();
    const existing = items.find(i => String(i.id) === String(product.id));
    const stockAvailable = Number(product.stock ?? product.quantity ?? 99);

    if (existing) {
      const currentQty = Number(existing.quantity) || 0;
      if (currentQty + validQty > stockAvailable) {
        return {
          success: false,
          message: `Kho chỉ còn ${stockAvailable} sản phẩm! Bạn đã có ${currentQty} trong giỏ.`
        };
      }
      existing.quantity = currentQty + validQty;
    } else {
      if (validQty > stockAvailable) {
        return {
          success: false,
          message: `Số lượng yêu cầu (${validQty}) vượt quá tồn kho hiện có (${stockAvailable})!`
        };
      }
      items.push({
        id: String(product.id),
        name: product.name,
        price: Number(product.price) || 0,
        image: product.image,
        quantity: validQty,
        stock: stockAvailable
      });
    }

    saveItems(items);
    return { success: true, count: getTotalCount() };
  };

  /**
   * Thay đổi số lượng của sản phẩm (+1 hoặc -1)
   */
  const changeQuantity = (productId, delta) => {
    const items = getItems();
    const item = items.find(i => String(i.id) === String(productId));
    if (!item) return { success: false, message: 'Sản phẩm không có trong giỏ hàng!' };

    const newQty = (Number(item.quantity) || 0) + Number(delta);

    // Nếu giảm về 0 hoặc nhỏ hơn -> Kích hoạt requireDelete
    if (newQty <= 0) {
      return { success: false, requireDelete: true, message: 'Xác nhận xóa sản phẩm?' };
    }

    // Kiểm tra chặn vượt quá số lượng tồn kho
    const stockAvailable = Number(item.stock ?? 99);
    if (newQty > stockAvailable) {
      return {
        success: false,
        message: `Kho chỉ còn sẵn ${stockAvailable} máy! Không thể tăng thêm.`
      };
    }

    item.quantity = newQty;
    saveItems(items);
    return { success: true, quantity: newQty };
  };

  /**
   * Xóa một sản phẩm khỏi giỏ hàng
   */
  const removeItem = (productId) => {
    const items = getItems().filter(i => String(i.id) !== String(productId));
    saveItems(items);
    return { success: true, count: getTotalCount() };
  };

  /**
   * Xóa sạch toàn bộ giỏ hàng
   */
  const clearCart = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {}
    return { success: true };
  };

  // ==========================================================================
  // VOUCHER ENGINE & GIẢM GIÁ KHUYẾN MÃI
  // ==========================================================================

  const getSavedVoucher = () => {
    try {
      const data = localStorage.getItem(voucherKey);
      return data ? JSON.parse(data) : appliedVoucher;
    } catch (e) {
      return appliedVoucher;
    }
  };

  const saveVoucher = (voucher) => {
    appliedVoucher = voucher;
    try {
      if (voucher) {
        localStorage.setItem(voucherKey, JSON.stringify(voucher));
      } else {
        localStorage.removeItem(voucherKey);
      }
    } catch (e) {}
  };

  const setAppliedVoucher = (voucher) => saveVoucher(voucher);
  const clearVoucher = () => saveVoucher(null);

  /**
   * Nạp danh sách voucher từ db.json
   */
  const fetchVouchers = async () => {
    return await _http('/vouchers');
  };

  /**
   * Kiểm tra mã voucher có hợp lệ theo đơn hàng không
   */
  const checkVoucher = async (code, subtotal) => {
    if (!code || !code.trim()) return { success: false, message: 'Vui lòng nhập mã giảm giá!' };
    const cleanCode = code.trim().toUpperCase();

    const vouchers = await fetchVouchers();
    if (!vouchers || !Array.isArray(vouchers)) {
      return { success: false, message: 'Không thể kết nối máy chủ voucher!' };
    }

    const found = vouchers.find(v => v.code.toUpperCase() === cleanCode);
    if (!found) return { success: false, message: 'Mã giảm giá không tồn tại hoặc đã hết hạn!' };

    if (found.minOrder && subtotal < found.minOrder) {
      const minText = new Intl.NumberFormat('vi-VN').format(found.minOrder);
      return {
        success: false,
        message: `Mã ${cleanCode} chỉ áp dụng cho đơn hàng từ ${minText} đ trở lên!`
      };
    }

    saveVoucher(found);
    return { success: true, voucher: found, message: `Áp dụng mã ${cleanCode} thành công!` };
  };

  /**
   * Tính số tiền được giảm giá thuần túy
   */
  const calculateDiscount = (subtotal = 0, voucher = null) => {
    const v = voucher || getSavedVoucher();
    if (!v || !subtotal || subtotal <= 0) return 0;
    if (v.minOrder && subtotal < v.minOrder) return 0;

    let discount = 0;
    if (v.discountAmount || v.type === 'fixed') {
      discount = Number(v.discountAmount ?? v.discount ?? v.value ?? 0);
    } else if (v.discountPercent || v.type === 'percent') {
      const pct = Number(v.discountPercent ?? v.discount ?? v.value ?? 0);
      discount = Math.round((subtotal * pct) / 100);
    }

    if (v.maxDiscount && discount > Number(v.maxDiscount)) {
      discount = Number(v.maxDiscount);
    }

    return Math.min(discount, subtotal);
  };

  /**
   * Tính tổng thanh toán cuối cùng sau khi trừ voucher
   */
  const getFinalTotal = () => {
    const subtotal = getSubtotal();
    const discount = calculateDiscount(subtotal);
    return Math.max(0, subtotal - discount);
  };

  /**
   * Gamification Reward Bar: Tính mốc nhận quà tặng
   */
  const getRewardProgress = (subtotal = getSubtotal()) => {
    const milestones = [
      { target: 10_000_000, reward: 'Tặng Cáp Sạc Nhanh 65W' },
      { target: 20_000_000, reward: 'Tặng Tai Nghe Gaming Type-C' },
      { target: 35_000_000, reward: 'Tặng Quạt Tản Nhiệt Sò Lạnh Gaming' }
    ];

    const current = milestones.find(m => subtotal < m.target) || milestones[milestones.length - 1];
    const isMax = subtotal >= milestones[milestones.length - 1].target;
    const progress = Math.min(100, Math.round((subtotal / current.target) * 100));

    return {
      subtotal,
      target: current.target,
      reward: current.reward,
      progress,
      isMax,
      remaining: Math.max(0, current.target - subtotal)
    };
  };

  const modelInstance = {
    apiUrl,
    _http,
    getItems,
    saveItems,
    getTotalCount,
    getSubtotal,
    addItem,
    changeQuantity,
    updateQuantity: changeQuantity,
    removeItem,
    clearCart,
    getSavedVoucher,
    getAppliedVoucher: getSavedVoucher,
    saveVoucher,
    setAppliedVoucher,
    clearVoucher,
    fetchVouchers,
    checkVoucher,
    calculateDiscount,
    getFinalTotal,
    getRewardProgress
  };

  return modelInstance;
}

const cartModel = createCartModel();

function CartModel(apiUrl) {
  return apiUrl ? createCartModel(apiUrl) : cartModel;
}

if (typeof window !== 'undefined') {
  window.CartModel = CartModel;
  window.cartModel = cartModel;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CartModel;
}
