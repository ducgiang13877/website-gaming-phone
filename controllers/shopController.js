/**
 * ============================================================================
 * 📋 MỤC LỤC CÁC HÀM & TÁC DỤNG (TABLE OF CONTENTS):
 * ----------------------------------------------------------------------------
 * A. SHOP CONTROLLER (createShopController - Điều phối Cửa Hàng & Trang Chủ):
 *    1. Điều phối Render Màn hình Chính:
 *       • renderHome()                  : [BƯỚC 1-6 TRANG CHỦ] Render dải 8 hãng, Flash Sale, Gaming Phone & Bán Chạy
 *       • renderShop()                  : [BƯỚC 1-6 CỬA HÀNG] Lọc, phân trang (8 máy/trang) và render lưới sản phẩm
 *    2. Nhóm Hàm Hành Động Bộ Lọc & Tìm Kiếm (Filter Actions):
 *       • filterBrand(brandId)          : [ACTION] Lọc theo thương hiệu và kích hoạt active tab
 *       • search(keyword)               : [ACTION] Tìm kiếm sản phẩm theo từ khóa theo thời gian thực
 *       • filterPrice(priceRange)       : [ACTION] Lọc sản phẩm theo 4 khoảng giá (<10tr, 10-20tr, 20-30tr, >30tr)
 *       • sort(sortBy)                  : [ACTION] Sắp xếp sản phẩm (giá tăng/giảm, tên A-Z, bán chạy)
 *       • changePage(page)              : [ACTION] Chuyển trang và cuộn mượt về đầu danh sách sản phẩm
 *       • setDemand(demand)             : [ACTION] Lọc theo nhu cầu (Gaming, Camera, Pin trâu, Màn gập)
 *       • resetFilters()                : [ACTION] Đặt lại toàn bộ bộ lọc về trạng thái mặc định ban đầu
 *    3. Nhóm Hàm So Sánh Đối Đầu (Compare Actions):
 *       • toggleCompare(id)             : [ACTION] Thêm/bỏ máy vào so sánh (khống chế tối đa 3 máy)
 *       • removeCompare(id)             : [ACTION] Xóa 1 máy khỏi danh sách so sánh
 *       • clearCompare()                : [ACTION] Xóa sạch toàn bộ danh sách so sánh
 *       • updateCompareButtons()        : Đồng bộ trạng thái active của nút so sánh trên các thẻ sản phẩm
 *       • updateCompareDock()           : Hiển thị / ẩn Dock so sánh nổi dưới chân màn hình
 *       • renderCompare()               : Render Bảng so sánh chi tiết 10 tiêu chí kỹ thuật
 *       • scrollToCompare()             : Chuyển sang màn hình so sánh và cuộn tới bảng thông số
 *    4. Tiện ích Thời gian thực:
 *       • initFlashSaleCountdown()      : Kích hoạt đồng hồ đếm ngược giờ vàng Flash Sale thời gian thực
 *
 * B. DETAIL CONTROLLER (createDetailController - Điều phối Chi Tiết Sản Phẩm):
 *    • loadDetail(productId)            : [BƯỚC 1-6 CHI TIẾT] Nạp và hiển thị bảng 10 thông số chuẩn CellphoneS & máy cùng hãng
 *    • changeQty(delta)                 : Tăng/giảm số lượng chọn mua kèm kiểm soát trần kho hàng
 *    • getQty()                         : Trích xuất số lượng người dùng đang chọn trên form
 *    • buyNow(productId)                : Mua ngay: Thêm sản phẩm vào giỏ và chuyển thẳng sang màn hình Thanh Toán
 * ============================================================================
 */

/**
 * Factory khởi tạo Module Điều phối Cửa Hàng & Trang Chủ (Shop Controller)
 * @param {Object} [productModel] - Thể hiện của ProductModel
 */
function createShopController(productModel) {
  const model = productModel || (typeof window !== 'undefined' && window.productModel ? window.productModel : (typeof ProductModel !== 'undefined' ? new ProductModel() : null));

  // Bộ lọc trạng thái (Filter State) lưu trong Closure an toàn
  const filters = {
    brandId: 'all',
    keyword: '',
    priceRange: 'all',
    sort: 'default',
    demand: 'all',
    page: 1,
    pageSize: 8
  };

  /**
   * [BƯỚC 1-6 TRONG LUỒNG TRANG CHỦ] Render toàn bộ dữ liệu Trang Chủ
   * Luồng MVC:
   *   Bước 1: Khách hàng mở website (action = 'home').
   *   Bước 2: Controller tiếp nhận yêu cầu điều phối.
   *   Bước 3: Controller lấy mảng sản phẩm & danh mục từ Model.
   *   Bước 4: Gọi ProductView render Dải 8 thương hiệu, Flash Sale, Gaming Phone và Top Bán Chạy.
   */
  const renderHome = () => {
    if (!model) return;
    const categories = model.categories;
    const products = model.products;
    const compareIds = model.getCompareIds ? model.getCompareIds() : [];

    const pView = typeof window !== 'undefined' && (window.productView || window.ProductView);
    if (!pView) return;

    // 1. Dải 8 thương hiệu (Brand Pills)
    pView.renderCategoryPills('home-category-pills', categories, null, true);

    // 2. Render 4 Sản Phẩm Ưu Đãi Giờ Vàng (Flash Sale)
    const flashGrid = document.getElementById('home-flash-sale-products');
    if (flashGrid && products.length > 0) {
      const flashList = products.filter(sp => (sp.originalPrice && sp.originalPrice > sp.price) || sp.isHot || sp.isSale).slice(0, 4);
      const displayFlash = flashList.length >= 4 ? flashList : products.slice(0, 4);
      pView.renderProductGrid('home-flash-sale-products', displayFlash, compareIds, categories);
    }

    // 3. Top 4 Siêu Phẩm Gaming Phone (ROG & RedMagic)
    const gamingGrid = document.getElementById('home-gaming-products');
    if (gamingGrid && products.length > 0) {
      const gamingList = products.filter(sp =>
        sp.categoryId == '7' || sp.categoryId == '8' ||
        sp.cate_id == '7' || sp.cate_id == '8' ||
        (sp.brand && (sp.brand.includes('ROG') || sp.brand.includes('RedMagic')))
      ).slice(0, 4);

      pView.renderProductGrid('home-gaming-products', gamingList, compareIds, categories);
    }

    // 4. Top 8 Bán Chạy / Nổi Bật
    const featuredGrid = document.getElementById('home-featured-products') || document.getElementById('home-latest-grid');
    if (featuredGrid && products.length > 0) {
      const topList = products.slice(0, 8);
      pView.renderProductGrid(featuredGrid.id, topList, compareIds, categories);
    }

    // 5. Khởi động đồng hồ đếm ngược Flash Sale
    initFlashSaleCountdown();

    // 6. Cập nhật Dock So Sánh nếu có sản phẩm đang chọn
    updateCompareDock();
  };

  /**
   * [BƯỚC 1-6 TRONG LUỒNG CỬA HÀNG] Render dữ liệu Trang Cửa Hàng (Shop) kèm Bộ lọc Đa năng
   */
  const renderShop = () => {
    if (!model) return;
    const categories = model.categories;
    const products = model.products;
    const compareIds = model.getCompareIds ? model.getCompareIds() : [];
    const pView = typeof window !== 'undefined' && (window.productView || window.ProductView);
    if (!pView) return;

    // 1. Render dải chọn thương hiệu trong Shop
    pView.renderCategoryPills('shop-brand-pills', categories, filters.brandId, false);

    // 2. Lọc và phân trang theo state bộ lọc
    const filtered = model.filterProducts(products, filters);
    const paged = model.paginate(filtered, filters.page, filters.pageSize);

    // Cập nhật số lượng sản phẩm tìm thấy
    const countEl = document.getElementById('shop-product-count');
    if (countEl) countEl.textContent = filtered.length;

    // Render lưới sản phẩm và phân trang
    pView.renderProductGrid('shop-product-grid', paged.items, compareIds, categories);
    pView.renderPagination('shop-pagination', paged.totalPages, paged.currentPage);

    // Cập nhật dock so sánh
    updateCompareDock();
  };

  /**
   * [HÀM ACTION] Lọc sản phẩm theo thương hiệu
   * @param {string} brandId - ID của hãng hoặc 'all'
   */
  const filterBrand = (brandId) => {
    filters.brandId = brandId;
    filters.page = 1;

    const pills = document.querySelectorAll('#shop-brand-pills .brand-pill-btn');
    pills.forEach(btn => {
      const isAct = (brandId === 'all' && btn.textContent.includes('Tất Cả')) ||
                    (btn.getAttribute('onclick')?.includes(`'${brandId}'`));
      btn.classList.toggle('active', !!isAct);
    });

    if (window.appNav) window.appNav.goTo('shop');
    renderShop();
  };

  /**
   * [HÀM ACTION] Tìm kiếm sản phẩm theo từ khóa
   * @param {string} keyword - Từ khóa người dùng nhập vào ô tìm kiếm
   */
  const search = (keyword) => {
    filters.keyword = keyword;
    filters.page = 1;
    renderShop();
  };

  /**
   * [HÀM ACTION] Lọc sản phẩm theo khoảng giá
   * @param {string} priceRange - Mã khoảng giá ('under-10m', '10m-20m', 'over-20m', 'all')
   */
  const filterPrice = (priceRange) => {
    filters.priceRange = priceRange;
    filters.page = 1;
    renderShop();
  };

  /**
   * [HÀM ACTION] Sắp xếp sản phẩm
   * @param {string} sortBy - Kiểu sắp xếp ('price-asc', 'price-desc', 'name-asc', 'best-seller', 'default')
   */
  const sort = (sortBy) => {
    filters.sort = sortBy;
    filters.page = 1;
    renderShop();
  };

  /**
   * [HÀM ACTION] Chuyển trang và cuộn mượt về đầu lưới sản phẩm
   * @param {number} page - Số trang cần chuyển tới
   */
  const changePage = (page) => {
    filters.page = page;
    renderShop();
    const grid = document.getElementById('shop-product-grid');
    if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /**
   * [HÀM ACTION] Lọc sản phẩm theo nhu cầu người dùng (Demand)
   * @param {'all'|'gaming'|'camera'|'battery'|'foldable'} demand - Nhu cầu
   */
  const setDemand = (demand) => {
    filters.demand = demand;
    filters.page = 1;
    const chips = document.querySelectorAll('#shop-demand-filter-chips .filter-chip-btn');
    chips.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-demand') === demand);
    });
    renderShop();
  };

  /**
   * [HÀM ACTION] Đặt lại toàn bộ bộ lọc về trạng thái ban đầu
   */
  const resetFilters = () => {
    filters.brandId = 'all';
    filters.keyword = '';
    filters.priceRange = 'all';
    filters.sort = 'default';
    filters.demand = 'all';
    filters.page = 1;
    filters.pageSize = 8;

    const sInput = document.getElementById('shop-search-input');
    const pFilter = document.getElementById('filter-price-range');
    const sFilter = document.getElementById('filter-sort-by');
    if (sInput) sInput.value = '';
    if (pFilter) pFilter.value = 'all';
    if (sFilter) sFilter.value = 'default';

    document.querySelectorAll('#shop-demand-filter-chips .filter-chip-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-demand') === 'all');
    });

    renderShop();
    if (window.baseView) window.baseView.showToast('Đã đặt lại tất cả bộ lọc', 'info');
  };

  /**
   * [HÀM ACTION] Thêm hoặc bỏ sản phẩm khỏi danh sách so sánh đối đầu
   * @param {string|number} id - ID sản phẩm
   */
  const toggleCompare = (id) => {
    if (!model) return;
    const compareIds = model.getCompareIds();
    const strId = String(id);
    const toast = window.baseView ? window.baseView.showToast : console.log;

    if (compareIds.includes(strId)) {
      model.removeFromCompare(strId);
      toast('Đã bỏ sản phẩm khỏi danh sách so sánh', 'info');
    } else {
      const res = model.addToCompare(strId);
      if (!res.success) {
        toast(res.message, 'warning');
        return;
      }
      toast(`Đã thêm vào so sánh (${res.count}/3 máy)`, 'success');
    }

    updateCompareButtons();
    updateCompareDock();
    if (document.getElementById('view-compare')?.classList.contains('active')) {
      renderCompare();
    }
  };

  /**
   * [HÀM ACTION] Xóa một sản phẩm khỏi danh sách so sánh
   */
  const removeCompare = (id) => {
    if (!model) return;
    model.removeFromCompare(id);
    if (window.baseView) window.baseView.showToast('Đã xóa khỏi danh sách so sánh', 'info');
    updateCompareButtons();
    updateCompareDock();
    renderCompare();
  };

  /**
   * [HÀM ACTION] Xóa toàn bộ danh sách so sánh
   */
  const clearCompare = () => {
    if (!model) return;
    model.clearCompare();
    if (window.baseView) window.baseView.showToast('Đã xóa sạch danh sách so sánh', 'info');
    updateCompareButtons();
    updateCompareDock();
    renderCompare();
  };

  /**
   * Đồng bộ trạng thái các nút so sánh trên thẻ sản phẩm
   */
  const updateCompareButtons = () => {
    if (!model) return;
    const compareIds = model.getCompareIds();
    const pView = typeof window !== 'undefined' && (window.productView || window.ProductView);
    pView?.updateCompareButtons(compareIds);
  };

  /**
   * Cập nhật hiển thị của Dock so sánh nổi dưới màn hình
   */
  const updateCompareDock = () => {
    if (!model) return;
    const compareIds = model.getCompareIds();
    const comparingProducts = model.products.filter(p => compareIds.includes(String(p.id)));
    const pView = typeof window !== 'undefined' && (window.productView || window.ProductView);
    pView?.renderStickyCompareDock('sticky-compare-dock', comparingProducts);
  };

  /**
   * Render Bảng so sánh 10 tiêu chí chi tiết
   */
  const renderCompare = () => {
    if (!model) return;
    const compareIds = model.getCompareIds();
    const comparingProducts = model.products.filter(p => compareIds.includes(String(p.id)));
    const pView = typeof window !== 'undefined' && (window.productView || window.ProductView);
    if (!pView) return;

    const targetContainers = ['compare-table-wrapper', 'shop-compare-table-wrapper', 'compare-table-container'];
    targetContainers.forEach(cId => {
      if (document.getElementById(cId)) {
        pView.renderComparisonTable(cId, comparingProducts, model.categories);
      }
    });
  };

  /**
   * Điều hướng và cuộn tới bảng so sánh
   */
  const scrollToCompare = () => {
    if (window.appNav) window.appNav.goTo('compare');
    renderCompare();
    const table = document.getElementById('compare-table-wrapper') || document.getElementById('shop-compare-table-wrapper') || document.getElementById('compare-table-container');
    if (table) table.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /**
   * Đồng hồ đếm ngược giờ vàng Flash Sale (Real-time timer)
   */
  const initFlashSaleCountdown = () => {
    const boxGio = document.getElementById('flash-timer-hours') || document.getElementById('flash-sale-hours');
    const boxPhut = document.getElementById('flash-timer-minutes') || document.getElementById('flash-sale-minutes');
    const boxGiay = document.getElementById('flash-timer-seconds') || document.getElementById('flash-sale-seconds');
    if (!boxGio || !boxPhut || !boxGiay) return;

    let totalSec = 5 * 3600 + 42 * 60 + 18;
    if (window.__flashTimer) clearInterval(window.__flashTimer);

    window.__flashTimer = setInterval(() => {
      if (totalSec <= 0) totalSec = 12 * 3600;
      totalSec--;

      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;

      boxGio.textContent = String(h).padStart(2, '0');
      boxPhut.textContent = String(m).padStart(2, '0');
      boxGiay.textContent = String(s).padStart(2, '0');
    }, 1000);
  };

  return {
    get model() { return model; },
    get filters() { return filters; },
    renderHome,
    renderShop,
    filterBrand,
    search,
    filterPrice,
    sort,
    changePage,
    setDemand,
    resetFilters,
    toggleCompare,
    removeCompare,
    clearCompare,
    updateCompareButtons,
    updateCompareDock,
    renderCompare,
    scrollToCompare,
    initFlashSaleCountdown
  };
}

/**
 * Factory khởi tạo Module Chi Tiết Sản Phẩm (Detail Controller)
 * Quản lý trang Chi Tiết Sản Phẩm: 10 thông số CellphoneS, tăng giảm SL, Mua Ngay
 * @param {Object} [productModel] - Thể hiện của ProductModel
 * @param {Object} [cartModel] - Thể hiện của CartModel
 */
function createDetailController(productModel, cartModel) {
  const pModel = productModel || (typeof window !== 'undefined' && window.productModel ? window.productModel : (typeof ProductModel !== 'undefined' ? new ProductModel() : null));
  const cModel = cartModel || (typeof window !== 'undefined' && window.cartModel ? window.cartModel : (typeof CartModel !== 'undefined' ? new CartModel() : null));

  let currentProduct = null;

  /**
   * [BƯỚC 1-6 TRONG LUỒNG CHI TIẾT] Nạp và hiển thị chi tiết sản phẩm kèm Bảng 10 thông số chuẩn CellphoneS
   * @param {string|number} productId - Mã sản phẩm
   */
  const loadDetail = async (productId) => {
    if (!pModel) return;
    let sp = pModel.products.find(p => String(p.id) === String(productId));
    if (!sp) {
      sp = await pModel.fetchProductById(productId);
    }

    if (!sp) {
      if (window.baseView) window.baseView.showToast('Không tìm thấy sản phẩm yêu cầu!', 'error');
      if (window.appNav) window.appNav.goTo('shop');
      return;
    }

    currentProduct = sp;

    // Cập nhật Breadcrumb đường dẫn
    const breadcrumb = document.getElementById('detail-breadcrumb-name');
    if (breadcrumb) breadcrumb.textContent = sp.name;

    // Lấy tên hãng danh mục
    const cat = pModel.categories.find(c => String(c.id) === String(sp.categoryId || sp.cate_id));
    const catName = cat ? cat.name : (sp.brand || '');
    const isComparing = pModel.getCompareIds ? pModel.getCompareIds().includes(String(sp.id)) : false;

    // Render thông tin chi tiết & Bảng 10 thông số
    const pView = typeof window !== 'undefined' && (window.productView || window.ProductView);
    pView?.renderProductDetail('product-detail-container', sp, catName, isComparing);

    // Render danh sách sản phẩm cùng hãng liên quan
    const relatedContainer = document.getElementById('detail-related-products');
    if (relatedContainer) {
      const cId = String(sp.categoryId || sp.cate_id);
      const relatedList = pModel.products
        .filter(p => String(p.id) !== String(sp.id) && (String(p.categoryId) === cId || String(p.cate_id) === cId))
        .slice(0, 4);
      const displayRelated = relatedList.length > 0
        ? relatedList
        : pModel.products.filter(p => String(p.id) !== String(sp.id)).slice(0, 4);
      pView?.renderProductGrid('detail-related-products', displayRelated, pModel.getCompareIds ? pModel.getCompareIds() : [], pModel.categories);
    }
  };

  /**
   * Tăng giảm số lượng chọn mua trên trang chi tiết
   * @param {number} delta - Độ biến thiên (+1 hoặc -1)
   */
  const changeQty = (delta) => {
    const input = document.getElementById('detail-qty-input');
    if (!input || !currentProduct) return;

    let val = parseInt(input.value) || 1;
    const maxStock = (currentProduct.stock !== undefined && currentProduct.stock !== null)
      ? Number(currentProduct.stock)
      : (Number(currentProduct.quantity) || 10);

    val += delta;
    if (val < 1) val = 1;
    if (val > maxStock) {
      val = maxStock;
      if (window.baseView) window.baseView.showToast(`Rất tiếc, kho chỉ còn sẵn tối đa ${maxStock} máy!`, 'warning');
    }

    input.value = val;
  };

  /**
   * Lấy số lượng sản phẩm đang được chọn
   * @returns {number}
   */
  const getQty = () => {
    const input = document.getElementById('detail-qty-input');
    return input ? (parseInt(input.value) || 1) : 1;
  };

  /**
   * Mua ngay: Thêm vào giỏ hàng và chuyển hướng ngay tới màn hình Thanh Toán
   * @param {string|number} productId - Mã sản phẩm
   */
  const buyNow = (productId) => {
    const qty = getQty();
    let sp = currentProduct;
    if (!sp || String(sp.id) !== String(productId)) {
      sp = pModel?.products.find(p => String(p.id) === String(productId));
    }

    if (!sp) {
      if (window.baseView) window.baseView.showToast('Không tìm thấy thông tin sản phẩm!', 'error');
      return;
    }

    if (!cModel) return;
    const res = cModel.addItem(sp, qty);
    if (!res.success) {
      if (window.baseView) window.baseView.showToast(res.message, 'warning');
      return;
    }

    if (window.baseView) {
      window.baseView.updateCartBadge(cModel.getTotalCount());
      window.baseView.showToast(`Đã thêm ${sp.name} vào giỏ. Đang chuyển tới thanh toán...`, 'success');
    }

    setTimeout(() => {
      if (window.appNav) window.appNav.goTo('checkout');
    }, 400);
  };

  return {
    get productModel() { return pModel; },
    get cartModel() { return cModel; },
    get currentProduct() { return currentProduct; },
    set currentProduct(val) { currentProduct = val; },
    loadDetail,
    changeQty,
    getQty,
    buyNow
  };
}

// Khởi tạo Singleton toàn cục trong namespace Controller
const shopController = createShopController();
const detailController = createDetailController();

// Constructor tương thích ngược 100% với mã gọi new ShopController() hoặc new DetailController()
function ShopController(productModel) {
  return createShopController(productModel);
}
function DetailController(productModel, cartModel) {
  return createDetailController(productModel, cartModel);
}

if (typeof window !== 'undefined') {
  window.shopController = shopController;
  window.ShopController = ShopController;
  window.detailController = detailController;
  window.DetailController = DetailController;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ShopController, DetailController, shopController, detailController };
}
