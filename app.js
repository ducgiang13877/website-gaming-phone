/**
 * ============================================================================
 * SMARTSTORE CLIENT APPLICATION - ES6 MODULE ENTRY POINT
 * Master Entry Point: Nạp tự động toàn bộ Models, Views và Controllers
 * ============================================================================
 */

// 1. TẦNG MODELS (Dữ liệu & Nghiệp vụ)
import './models/productModel.js';
import './models/cartModel.js';
import './models/orderModel.js';
import './models/userModel.js';
import './models/appModel.js';

// 2. TẦNG VIEWS (Giao diện & Render HTML)
import './views/baseView.js';
import './views/productView.js';
import './views/cartView.js';
import './views/userView.js';

// 3. TẦNG CONTROLLERS (Điều phối & Nhạc trưởng)
import './controllers/shopController.js';
import './controllers/cartController.js';
import './controllers/authController.js';
import './controllers/appController.js';

/**
 * 4. BỘ ĐỊNH TUYẾN CHÍNH (FRONT CONTROLLER / MAIN ROUTER)
 * Bắt tham số ?act, ?view hoặc #hash trên URL và điều phối Controller
 */
export function mainRouter() {
  const pathname = window.location.pathname.toLowerCase();
  const urlParams = new URLSearchParams(window.location.search);
  const hashClean = window.location.hash.replace(/^#\/?/, '').split('?')[0];

  // 1. Kiểm tra action rõ ràng từ URL query (?act=... hoặc ?view=...) hoặc hash (#/...)
  const explicitAct = urlParams.get('act') || urlParams.get('view') || hashClean;

  // 2. Nếu đang ở các file độc lập trong thư mục views/ (MPA Mode):
  // Phải tôn trọng file HTML hiện tại, TUYỆT ĐỐI KHÔNG tự tiện fallback về 'home'!
  if (pathname.endsWith('shop.html')) {
    const act = explicitAct || 'shop';
    const params = Object.fromEntries(urlParams.entries());
    window.appCtrl?.goTo(act, params);
    return;
  }
  if (pathname.endsWith('cart.html')) {
    const act = explicitAct || 'cart';
    const params = Object.fromEntries(urlParams.entries());
    window.appCtrl?.goTo(act, params);
    return;
  }
  if (pathname.endsWith('user.html')) {
    const act = explicitAct || 'auth';
    const params = Object.fromEntries(urlParams.entries());
    window.appCtrl?.goTo(act, params);
    return;
  }
  if (pathname.endsWith('admin.html')) {
    return; // Admin có Controller & Router riêng
  }

  // 3. Nếu đang ở trang chủ index.html:
  if (explicitAct) {
    const params = Object.fromEntries(urlParams.entries());
    window.appCtrl?.goTo(explicitAct, params);
  } else {
    // Chỉ kích hoạt home nếu chưa có panel nào khác đang active
    const activePanel = document.querySelector('.view-panel.active');
    if (!activePanel || activePanel.id === 'view-home') {
      window.appCtrl?.goTo('home');
    }
  }
}

// Lắng nghe sự kiện tải trang và thay đổi URL
if (typeof window !== 'undefined') {
  window.mainRouter = mainRouter;

  const runRouterOnce = () => {
    if (window.appCtrl) {
      mainRouter();
    } else {
      setTimeout(mainRouter, 50);
    }
  };

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', runRouterOnce);
  } else {
    runRouterOnce();
  }

  window.addEventListener('popstate', mainRouter);
  window.addEventListener('hashchange', mainRouter);
}

export default { mainRouter };
