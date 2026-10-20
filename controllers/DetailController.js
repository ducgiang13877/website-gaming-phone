/**
 * ============================================================================
 * CONTROLLER: DetailController (Điều phối Trang Chi Tiết Sản Phẩm & Mua Ngay)
 * Kiến trúc: Mô hình MVC Chuẩn - SmartStore
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * ============================================================================
 */

class DetailController {
  constructor(productModel, cartModel) {
    this.productModel = productModel || new window.ProductModel();
    this.cartModel = cartModel || new window.CartModel();
    this.currentProduct = null;
  }

  /** Nạp và hiển thị chi tiết sản phẩm */
  async loadDetail(productId) {
    let sp = this.productModel.products.find(p => String(p.id) === String(productId));
    if (!sp) {
      sp = await this.productModel.fetchProductById(productId);
    }

    if (!sp) {
      window.BaseView.showToast('Không tìm thấy sản phẩm yêu cầu!', 'error');
      if (window.appNav) window.appNav.goTo('shop');
      return;
    }

    this.currentProduct = sp;

    // Breadcrumb
    const breadcrumb = document.getElementById('detail-breadcrumb-name');
    if (breadcrumb) breadcrumb.textContent = sp.name;

    // Lấy tên hãng
    const cat = this.productModel.categories.find(c => String(c.id) === String(sp.categoryId || sp.cate_id));
    const catName = cat ? cat.name : (sp.brand || '');
    const isComparing = this.productModel.getCompareIds().includes(String(sp.id));

    // Render thông tin chi tiết & Bảng 10 thông số chuẩn CellphoneS
    window.ProductView.renderProductDetail('product-detail-container', sp, catName, isComparing);
  }

  /** Tăng giảm số lượng chọn mua trên trang chi tiết */
  changeQty(delta) {
    const input = document.getElementById('detail-qty-input');
    if (!input || !this.currentProduct) return;

    let val = parseInt(input.value) || 1;
    const maxStock = (this.currentProduct.stock !== undefined && this.currentProduct.stock !== null) 
      ? Number(this.currentProduct.stock) 
      : (Number(this.currentProduct.quantity) || 10);

    val += delta;
    if (val < 1) val = 1;
    if (val > maxStock) {
      val = maxStock;
      window.BaseView.showToast(`Rất tiếc, kho chỉ còn sẵn tối đa ${maxStock} máy!`, 'warning');
    }

    input.value = val;
  }

  /** Lấy số lượng hiện tại */
  getQty() {
    const input = document.getElementById('detail-qty-input');
    return input ? (parseInt(input.value) || 1) : 1;
  }

  /** Mua ngay: Thêm vào giỏ hàng và chuyển hướng ngay tới Thanh Toán */
  buyNow(productId) {
    const qty = this.getQty();
    let sp = this.currentProduct;
    if (!sp || String(sp.id) !== String(productId)) {
      sp = this.productModel.products.find(p => String(p.id) === String(productId));
    }

    if (!sp) {
      window.BaseView.showToast('Không tìm thấy thông tin sản phẩm!', 'error');
      return;
    }

    const res = this.cartModel.addItem(sp, qty);
    if (!res.success) {
      window.BaseView.showToast(res.message, 'warning');
      return;
    }

    // Cập nhật badge giỏ hàng
    window.BaseView.updateCartBadge(this.cartModel.getTotalCount());

    window.BaseView.showToast(`Đã thêm ${sp.name} vào giỏ. Đang chuyển tới thanh toán...`, 'success');
    setTimeout(() => {
      if (window.appNav) window.appNav.goTo('checkout');
    }, 400);
  }
}

// Khởi tạo Singleton toàn cục trong namespace Controller
window.DetailController = DetailController;
