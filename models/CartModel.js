/**
 * ============================================================================
 * MODEL: CartModel (Quản lý Dữ liệu Giỏ hàng, Voucher & Gamification Rewards)
 * Kiến trúc: Mô hình MVC Chuẩn - SmartStore
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * ============================================================================
 */

class CartModel {
  constructor(apiUrl = 'http://localhost:3000') {
    this.apiUrl = apiUrl;
    this.storageKey = 'smartstore_cart';
    this.voucherKey = 'smartstore_voucher';
  }

  /** Lấy danh sách sản phẩm trong giỏ từ localStorage */
  getItems() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('[CartModel] Lỗi đọc giỏ hàng:', e);
      return [];
    }
  }

  /** Lưu giỏ hàng vào localStorage */
  saveItems(items) {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  /** Thêm sản phẩm vào giỏ hàng (Kiểm tra nghiêm ngặt tồn kho) */
  addItem(product, quantity = 1) {
    const items = this.getItems();
    const existingIndex = items.findIndex(i => String(i.id) === String(product.id));
    const stockAvailable = Number(product.stock) || Number(product.quantity) || 99;

    if (existingIndex > -1) {
      const currentQty = Number(items[existingIndex].quantity) || 0;
      if (currentQty + quantity > stockAvailable) {
        return {
          success: false,
          message: `Kho chỉ còn ${stockAvailable} sản phẩm! Bạn đã có ${currentQty} trong giỏ.`
        };
      }
      items[existingIndex].quantity = currentQty + quantity;
    } else {
      if (quantity > stockAvailable) {
        return {
          success: false,
          message: `Số lượng yêu cầu (${quantity}) vượt quá tồn kho (${stockAvailable})!`
        };
      }
      items.push({
        id: String(product.id),
        name: product.name,
        price: Number(product.price) || 0,
        image: product.image,
        quantity: quantity,
        stock: stockAvailable
      });
    }

    this.saveItems(items);
    return { success: true, count: this.getTotalCount() };
  }

  /** Thay đổi số lượng của sản phẩm trong giỏ */
  changeQuantity(productId, delta) {
    const items = this.getItems();
    const item = items.find(i => String(i.id) === String(productId));
    if (!item) return { success: false };

    const newQty = (Number(item.quantity) || 1) + delta;
    if (newQty < 1) {
      return { success: false, requireDelete: true };
    }
    if (item.stock && newQty > item.stock) {
      return {
        success: false,
        message: `Rất tiếc, kho chỉ còn tối đa ${item.stock} máy!`
      };
    }

    item.quantity = newQty;
    this.saveItems(items);
    return { success: true, newQty };
  }

  /** Xóa 1 sản phẩm khỏi giỏ */
  removeItem(productId) {
    let items = this.getItems();
    items = items.filter(i => String(i.id) !== String(productId));
    this.saveItems(items);
    return items;
  }

  /** Xóa sạch toàn bộ giỏ hàng */
  clearCart() {
    localStorage.removeItem(this.storageKey);
    this.clearVoucher();
  }

  /** Tổng số lượng sản phẩm trong giỏ (cho Badge hiển thị) */
  getTotalCount() {
    return this.getItems().reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }

  /** Tạm tính tiền hàng (Subtotal) */
  getSubtotal() {
    return this.getItems().reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 0)), 0);
  }

  // --- QUẢN LÝ VOUCHER & KHUYẾN MÃI ---
  async fetchVouchers() {
    try {
      const res = await fetch(`${this.apiUrl}/vouchers`);
      if (!res.ok) throw new Error('Không lấy được vouchers');
      return await res.json();
    } catch (e) {
      // Fallback danh sách voucher mặc định chuẩn dự án
      return [
        { code: 'GAMING500K', discountAmount: 500000, discountPercent: null, minOrder: 10000000, maxDiscount: 500000, desc: 'Giảm 500.000đ cho đơn từ 10 triệu' },
        { code: 'VIPGAMER1TR', discountAmount: 1000000, discountPercent: null, minOrder: 20000000, maxDiscount: 1000000, desc: 'Giảm 1.000.000đ cho đơn từ 20 triệu' },
        { code: 'SMART10', discountAmount: null, discountPercent: 10, minOrder: 15000000, maxDiscount: 1500000, desc: 'Giảm 10% (tối đa 1.5 triệu) cho đơn từ 15 triệu' },
        { code: 'FREESHIP', discountAmount: 50000, discountPercent: null, minOrder: 0, maxDiscount: 50000, desc: 'Miễn phí vận chuyển toàn quốc' }
      ];
    }
  }

  getAppliedVoucher() {
    try {
      const data = sessionStorage.getItem(this.voucherKey);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  setAppliedVoucher(voucherObj) {
    sessionStorage.setItem(this.voucherKey, JSON.stringify(voucherObj));
  }

  clearVoucher() {
    sessionStorage.removeItem(this.voucherKey);
  }

  /** Tính toán số tiền được giảm theo voucher */
  calculateDiscount(subtotal) {
    const voucher = this.getAppliedVoucher();
    if (!voucher) return 0;

    // Kiểm tra điều kiện đơn hàng tối thiểu
    if (voucher.minOrder && subtotal < voucher.minOrder) {
      return 0;
    }

    let discount = 0;
    if (voucher.discountAmount) {
      discount = Number(voucher.discountAmount);
    } else if (voucher.discountPercent) {
      discount = Math.round((subtotal * voucher.discountPercent) / 100);
      if (voucher.maxDiscount && discount > voucher.maxDiscount) {
        discount = voucher.maxDiscount;
      }
    }
    return Math.min(discount, subtotal);
  }

  /** Tổng tiền thanh toán cuối cùng */
  getFinalTotal() {
    const subtotal = this.getSubtotal();
    const discount = this.calculateDiscount(subtotal);
    return Math.max(0, subtotal - discount);
  }

  /** Tính toán tiến trình quà tặng (Gamification Reward Bar) */
  calculateRewardProgress(subtotal) {
    const milestones = [
      { amount: 15000000, gift: 'Cáp sạc nhanh 100W Gaming', reached: subtotal >= 15000000 },
      { amount: 30000000, gift: 'Tai nghe Gaming Type-C Hi-Res', reached: subtotal >= 30000000 },
      { amount: 50000000, gift: 'Quạt tản nhiệt bán dẫn RGB Pro', reached: subtotal >= 50000000 }
    ];

    let nextMilestone = milestones.find(m => !m.reached);
    let percent = 100;
    let message = 'Chúc mừng! Bạn đã mở khóa toàn bộ QUÀ TẶNG GAMING độc quyền!';

    if (nextMilestone) {
      percent = Math.min(100, Math.round((subtotal / nextMilestone.amount) * 100));
      const remaining = nextMilestone.amount - subtotal;
      message = `Mua thêm <strong>${new Intl.NumberFormat('vi-VN').format(remaining)}đ</strong> để nhận ngay: <strong>${nextMilestone.gift}</strong>!`;
    }

    return { percent, message, milestones };
  }
}

// Khởi tạo Singleton toàn cục trong namespace Model
window.CartModel = CartModel;
