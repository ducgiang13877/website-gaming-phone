/**
 * ============================================================================
 * 📋 MỤC LỤC & TỔ HỢP CÁC MODULE CON (TABLE OF CONTENTS):
 * ----------------------------------------------------------------------------
 * 1. models/productModel.js         : Quản lý 40 sản phẩm, 8 danh mục, lọc đa năng & so sánh
 * 2. models/cartModel.js            : Quản lý giỏ hàng, tồn kho (Stock Guard) & Voucher Engine
 * 3. models/orderModel.js           : Quản lý đơn hàng, tra cứu (#DH...) & hoàn kho tự động
 * 4. models/userModel.js            : Xác thực đăng nhập/đăng ký, Smart Identity & quản lý người dùng
 * 5. window.AppModel                : Cầu nối Facade tổng hợp 4 Model cho Trình duyệt & CommonJS (Node.js)
 * ============================================================================
 */

// Hỗ trợ môi trường Node.js (Unit Test / Sandbox Simulation)
if (typeof require !== 'undefined' && typeof module !== 'undefined' && module.exports) {
  try {
    const ProductModel = require('./productModel');
    const CartModel = require('./cartModel');
    const OrderModel = require('./orderModel');
    const UserModel = require('./userModel');
    module.exports = { ProductModel, CartModel, OrderModel, UserModel };
  } catch (e) {
    // Bỏ qua nếu chạy trong môi trường không hỗ trợ CommonJS
  }
}

// Hỗ trợ môi trường Trình duyệt (Browser Global Namespace)
if (typeof window !== 'undefined') {
  window.AppModel = {
    ProductModel: window.ProductModel,
    CartModel: window.CartModel,
    OrderModel: window.OrderModel,
    UserModel: window.UserModel
  };
}
