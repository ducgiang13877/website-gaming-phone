/**
 * ============================================================================
 * SMARTSTORE ADMIN DASHBOARD - ES6 MODULE ENTRY POINT
 * Master Entry Point: Nạp tự động toàn bộ Models, Views và Controllers cho Admin
 * ============================================================================
 */

// 1. TẦNG MODELS (Dữ liệu & Nghiệp vụ)
import './models/productModel.js';
import './models/orderModel.js';
import './models/userModel.js';
import './models/appModel.js';

// 2. TẦNG VIEWS (Giao diện Quản trị)
import './views/adminView.js';

// 3. TẦNG CONTROLLER (Điều phối Quản trị Admin)
import './controllers/adminController.js';

export default {
  adminCtrl: typeof window !== 'undefined' ? window.adminCtrl : null
};
