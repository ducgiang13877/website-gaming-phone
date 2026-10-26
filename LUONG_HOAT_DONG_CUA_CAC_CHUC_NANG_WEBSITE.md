# 📘 LUỒNG HOẠT ĐỘNG CHI TIẾT CỦA CÁC CHỨC NĂNG TRÊN WEBSITE SMARTSTORE

> **Hệ Thống:** SmartStore - Website Bán Điện Thoại Thông Minh & Gaming Phone Hàng Đầu  
> **Đồ Án Môn Học:** Lập trình JavaScript Nâng Cao (Assignment FPT Polytechnic)  
> **Kiến Trúc Triển Khai:** Functional MVC (Model - View - Controller), Native ES6+ Modules, RESTful API (JSON-Server), Dual-Mode Router (Single Page Application SPA kết hợp Multi-Page Application MPA).  
> **Trạng Thái Mã Nguồn:** Chuẩn hóa 100% Production-Grade, loại bỏ file rác, lưu trữ ảnh vật lý, bảo vệ phân quyền chặt chẽ.

---

## 📑 MỤC LỤC 12 CỤM CHỨC NĂNG NGHIỆP VỤ CỐT LÕI

1. **[CHỨC NĂNG 01: Khởi Động Ứng Dụng & Điều Hướng Kép (App Init & Dual-Mode Router)](#chức-năng-01-khởi-động-ứng-dụng--điều-hướng-kép-app-init--dual-mode-router)**
2. **[CHỨC NĂNG 02: Tìm Kiếm Thời Gian Thực & Bộ Lọc Đa Tiêu Chí (Live Search, Filter & Sort)](#chức-năng-02-tìm-kiếm-thời-gian-thực--bộ-lọc-đa-tiêu-chí-live-search-filter--sort)**
3. **[CHỨC NĂNG 03: Xem Nhanh & Chi Tiết Sản Phẩm 10 Thông Số (Quick View & Product Detail)](#chức-năng-03-xem-nhanh--chi-tiết-sản-phẩm-10-thông-số-quick-view--product-detail)**
4. **[CHỨC NĂNG 04: So Sánh Đối Đầu 10 Tiêu Chí Kỹ Thuật (Sticky Compare Dock & Matrix)](#chức-năng-04-so-sánh-đối-đầu-10-tiêu-chí-kỹ-thuật-sticky-compare-dock--matrix)**
5. **[CHỨC NĂNG 05: Quản Lý Giỏ Hàng & Kiểm Soát Trần Tồn Kho (Cart Engine & Stock Bounds)](#chức-năng-05-quản-lý-giỏ-hàng--kiểm-soát-trần-tồn-kho-cart-engine--stock-bounds)**
6. **[CHỨC NĂNG 06: Động Cơ Mã Giảm Giá Đa Điều Kiện (Voucher Engine & Validation)](#chức-năng-06-động-cơ-mã-giảm-giá-đa-điều-kiện-voucher-engine--validation)**
7. **[CHỨC NĂNG 07: Quy Trình Đặt Hàng & Trừ Tồn Kho Tự Động (Checkout & Auto Stock Deduction)](#chức-năng-07-quy-trình-đặt-hàng--trừ-tồn-kho-tự-động-checkout--auto-stock-deduction)**
8. **[CHỨC NĂNG 08: Nhận Diện Khách Hàng Thân Thiết Khi Checkout (Smart Identity Resolution)](#chức-năng-08-nhận-diện-khách-hàng-thân-thiết-khi-checkout-smart-identity-resolution)**
9. **[CHỨC NĂNG 09: Xuất Bản & In Hóa Đơn Bán Lẻ Điện Tử (Invoice Modal & Window Print)](#chức-năng-09-xuất-bản--in-hóa-đơn-bán-lẻ-điện-tử-invoice-modal--window-print)**
10. **[CHỨC NĂNG 10: Xác Thực Đăng Ký Thông Minh & Bảo Vệ Mật Khẩu (Smart Register & Auto-Login)](#chức-năng-10-xác-thực-đăng-ký-thông-minh--bảo-vệ-mật-khẩu-smart-register--auto-login)**
11. **[CHỨC NĂNG 11: Đăng Nhập Hệ Thống, Lịch Sử Đơn Hàng & Hồ Sơ (RBAC Login & Order History)](#chức-năng-11-đăng-nhập-hệ-thống-lịch-sử-đơn-hàng--hồ-sơ-rbac-login--order-history)**
12. **[CHỨC NĂNG 12: Quản Trị Hệ Thống Admin Dashboard Toàn Diện (KPI, CRUD & FSM Orders)](#chức-năng-12-quản-trị-hệ-thống-admin-dashboard-toàn-diện-kpi-crud--fsm-orders)**

---

### CHỨC NĂNG 01: Khởi Động Ứng Dụng & Điều Hướng Kép (App Init & Dual-Mode Router)
> *Bao gồm: Nạp trang ban đầu, Đồng bộ trạng thái Navbar, và Bộ định tuyến kép SPA / MPA.*

* **1. Người dùng tương tác với DOM:**  
  Người dùng mở trình duyệt gõ địa chỉ website `http://localhost:3000/` hoặc click vào các mục trên Menu Header (Trang Chủ, Cửa Hàng, Giỏ Hàng, Tài Khoản) với thuộc tính `data-view="shop"` hoặc bấm vào Logo SmartStore.
* **2. Hành động & Thông tin gửi kèm, phương thức gửi:**  
  * Khi mở trang: Trình duyệt phát tín hiệu sự kiện `DOMContentLoaded`.  
  * Khi click menu: Bắn sự kiện `click`, gửi kèm tham số chuỗi tên màn hình `viewName` (ví dụ: `'shop'`, `'cart'`, `'home'`) và object tham số URL `params`.
* **3. Nơi tiếp nhận & Xử lý nghiệp vụ tại Controller/Model:**  
  * Trong [appController.js](file:///d:/Code/Javascript%20n%C3%A2ng%20cao/website-gaming-phone/controllers/appController.js): Hàm `onReady` an toàn kích hoạt `appCtrl.init()`.
  * Bước 1: `syncNavbar()` lấy thông tin tài khoản đang lưu từ `userModel.getCurrentUser()` và số lượng giỏ hàng từ `cartModel.getTotalCount()`.
  * Bước 2: Hàm `goTo(viewName, params)` kiểm tra:  
    * **Chế độ SPA (Single Page Application):** Nếu tìm thấy thẻ `#view-${viewName}` ngay trên trang `index.html`, gỡ bỏ class `.active` của panel cũ, gắn `.active` cho panel mới.
    * **Chế độ MPA (Multi-Page Application):** Nếu đang ở trang riêng lẻ (`views/shop.html`, `views/cart.html`, `views/user.html`), sử dụng `window.location.href` điều hướng vật lý có kèm Query String `?view=...`. File `views/home.html` thừa đã được loại bỏ hoàn toàn, chuẩn hóa duy nhất `index.html` làm Front Controller trang chủ.
* **4. Tương tác với cơ sở dữ liệu `db.json`:**  
  Tại thời điểm khởi động, Controller kích hoạt `Promise.all` gửi song song 2 HTTP Request bằng phương thức `GET`:  
  * `GET http://localhost:3000/categories` để nạp danh sách 8 thương hiệu.  
  * `GET http://localhost:3000/products` để nạp danh sách 40 sản phẩm lưu vào RAM Cache của `productModel`.
* **5. Dữ liệu trả về & Cập nhật giao diện màn hình (View Render):**  
  * `baseView.renderNavUser(user)`: Hiển thị tên người dùng và dropdown tài khoản hoặc nút Đăng nhập.  
  * `baseView.updateCartBadge(count)`: Cập nhật con số màu đỏ trên icon giỏ hàng.  
  * `baseView.highlightActiveNav(viewName)`: Gắn gạch chân sáng màu cho mục menu đang mở.  
  * Màn hình chuyển đổi mượt mà trong 0.05 giây và cuộn êm ái lên đầu trang.
* **💡 Ví dụ minh họa thực tế:**  
  Khách hàng đang ở màn hình Trang chủ, bấm vào chữ "Cửa Hàng" trên thanh Menu Header. Hàm `appCtrl.goTo('shop')` được gọi, màn hình `#view-home` ẩn đi, màn hình `#view-shop` hiện lên tức thì không bị chớp màn hình trắng, thanh menu sáng đèn ở chữ Cửa Hàng, danh sách 8 điện thoại trang 1 hiện ra.

---

### CHỨC NĂNG 02: Tìm Kiếm Thời Gian Thực & Bộ Lọc Đa Tiêu Chí (Live Search, Filter & Sort)
> *Bao gồm: Gõ tìm kiếm tức thì, Lọc theo Hãng, Lọc theo Nhu cầu, Lọc theo Giá, Sắp xếp và Phân trang.*

* **1. Người dùng tương tác với DOM:**  
  * Gõ chữ vào ô tìm kiếm `#shop-search-input` (sự kiện `input`).  
  * Click vào các nút thương hiệu (Asus ROG, RedMagic, Apple, Samsung...) hoặc tag nhu cầu (Chơi game nặng, Pin trâu, Chụp ảnh).  
  * Thay đổi dropdown chọn giá `#filter-price-range` hoặc dropdown sắp xếp `#filter-sort-by` (sự kiện `change`).  
  * Click vào số trang `[1] [2] [3]` hoặc nút `< Trước` / `Sau >`.
* **2. Hành động & Thông tin gửi kèm, phương thức gửi:**  
  * Sự kiện truyền giá trị chuỗi tìm kiếm `keyword`, ID thương hiệu `brandId`, khoảng giá `priceRange` (ví dụ: `'under-10m'`, `'10m-20m'`), tiêu chí sắp xếp `sortBy` (ví dụ: `'price-asc'`, `'best-selling'`), hoặc số trang muốn đến `page = 2`.
* **3. Nơi tiếp nhận & Xử lý nghiệp vụ tại Controller/Model:**  
  * Trong [shopController.js](file:///d:/Code/Javascript%20n%C3%A2ng%20cao/website-gaming-phone/controllers/shopController.js):  
    * Các hàm `search(kw)`, `filterBrand(id)`, `filterPrice(range)`, `sort(by)` được gọi và cập nhật vào biến trạng thái `filters` trong Closure.  
    * Tự động đưa trang hiện tại về trang 1: `filters.page = 1`.  
    * `productModel.getFilteredProducts(filters)` thực hiện thuật toán lọc lồng nhau (Pipeline Filter):  
      `Lọc Hãng ➔ Lọc Nhu Cầu ➔ Lọc Khoảng Giá ➔ Lọc Từ Khóa Tên ➔ Sắp Xếp Dữ Liệu`.  
    * Áp dụng thuật toán phân trang: Cắt mảng kết quả bằng `slice((page - 1) * 8, page * 8)`.
* **4. Tương tác với cơ sở dữ liệu `db.json`:**  
  * Toàn bộ quá trình lọc và tìm kiếm diễn ra trên **RAM Cache** của `productModel` (đã nạp sẵn 40 máy từ đầu), **KHÔNG cần gửi lại request HTTP lên backend mỗi khi gõ phím**, giúp tốc độ phản hồi đạt mức tức thì (dưới 10ms), giảm tải tối đa cho máy chủ `json-server`.
* **5. Dữ liệu trả về & Cập nhật giao diện màn hình (View Render):**  
  * `productView.renderProducts(pagedList)`: Xóa danh sách cũ và vẽ lại 8 thẻ card điện thoại tương ứng.  
  * `productView.renderPagination(totalFiltered, currentPage)`: Vẽ lại cụm nút chuyển trang.  
  * Nếu không tìm thấy kết quả nào (`pagedList.length === 0`): `productView.renderEmptyState()` vẽ khối thông báo kính lúp "Không tìm thấy sản phẩm" kèm nút "Đặt Lại Bộ Lọc".
* **💡 Ví dụ minh họa thực tế:**  
  Khách hàng chọn hãng "Asus ROG", chọn mức giá "20-30 triệu", và gõ chữ "8 pro". Controller lọc ra đúng 1 sản phẩm là *Asus ROG Phone 8 Pro* giá 24.990.000 đ. Lưới hiển thị 1 thẻ sản phẩm duy nhất, các máy khác tự động ẩn đi.

---

### CHỨC NĂNG 03: Xem Nhanh & Chi Tiết Sản Phẩm 10 Thông Số (Quick View & Product Detail)
> *Bao gồm: Popup xem nhanh cấu hình, Trang chi tiết sản phẩm chuyên sâu và Bộ chọn số lượng mua.*

* **1. Người dùng tương tác với DOM:**  
  * Bấm nút icon con mắt `[Xem nhanh]` trên card sản phẩm, hoặc bấm trực tiếp vào ảnh/tên sản phẩm.  
  * Bấm nút `[-]` hoặc `[+]` tại bộ chọn số lượng.  
  * Bấm nút `[Thêm Vào Giỏ]` hoặc `[Mua Ngay]`.
* **2. Hành động & Thông tin gửi kèm, phương thức gửi:**  
  * Gửi mã định danh sản phẩm `productId` (ví dụ: `1` hoặc `'prod_01'`) và delta thay đổi số lượng (`+1` hoặc `-1`).
* **3. Nơi tiếp nhận & Xử lý nghiệp vụ tại Controller/Model:**  
  * Controller gọi `productModel.getProductById(productId)` để trích xuất đầy đủ 10 tiêu chí kỹ thuật: Vi xử lý, RAM, ROM, Tần số quét màn hình, Pin, Công nghệ sạc, Tản nhiệt, Camera...  
  * Bộ điều khiển số lượng [detailModule.changeQty(delta)](file:///d:/Code/Javascript%20n%C3%A2ng%20cao/website-gaming-phone/controllers/shopController.js) kiểm tra:  
    * Biên dưới: Số lượng không được nhỏ hơn `1`.  
    * Biên trên (Trần kho): Lấy `product.stock`. Nếu số lượng người dùng chọn vượt quá tồn kho, chặn lại và vô hiệu hóa nút `[+]`.  
  * Nếu bấm `[Mua Ngay]`: Gọi `cartCtrl.add(productId, qty)` sau đó gọi tiếp `appCtrl.goTo('cart')`.
* **4. Tương tác với cơ sở dữ liệu `db.json`:**  
  * Truy vấn dữ liệu sản phẩm chi tiết qua `GET /products/:id` (hoặc lấy từ RAM Cache).
* **5. Dữ liệu trả về & Cập nhật giao diện màn hình (View Render):**  
  * **Với Xem nhanh:** `productView.renderQuickView(product)` đổ dữ liệu và gọi `baseView.openModal('quick-view-modal')` hiển thị popup giữa màn hình với nền mờ. Đã tối ưu giao diện chỉ giữ duy nhất 1 nút Thêm Giỏ Hàng nổi bật.  
  * **Với Trang chi tiết:** Điều hướng màn hình `#view-detail`, đổ thư viện ảnh, bài đánh giá chuyên sâu và danh sách các sản phẩm cùng thương hiệu liên quan ở bên dưới.
* **💡 Ví dụ minh họa thực tế:**  
  Khách hàng bấm xem nhanh chiếc *RedMagic 9 Pro* chỉ còn 3 máy trong kho. Ô số lượng hiển thị số 1. Khách bấm `[+]` 2 lần lên số 3, khi bấm lần nữa lên 4, hệ thống chặn lại và hiện thông báo: "Kho chỉ còn 3 máy, không thể chọn thêm!".

---

### CHỨC NĂNG 04: So Sánh Đối Đầu 10 Tiêu Chí Kỹ Thuật (Sticky Compare Dock & Matrix)
> *Bao gồm: Chọn máy so sánh, Thanh Dock nổi đáy màn hình, và Bảng đối chiếu 10 thông số.*

* **1. Người dùng tương tác với DOM:**  
  * Bấm nút icon cán cân `[So sánh]` trên thẻ card sản phẩm.  
  * Bấm nút `[x]` xóa từng máy hoặc nút `[Xóa Hết]` trên thanh Dock nổi.  
  * Bấm nút `[So Sánh Ngay]` để mở bảng đối đầu.
* **2. Hành động & Thông tin gửi kèm, phương thức gửi:**  
  * Truyền mã sản phẩm `productId` vào hàm toggle.
* **3. Nơi tiếp nhận & Xử lý nghiệp vụ tại Controller/Model:**  
  * Trong [shopController.js](file:///d:/Code/Javascript%20n%C3%A2ng%20cao/website-gaming-phone/controllers/shopController.js): Hàm `toggleCompare(id)` kiểm tra mảng `compareList`:  
    * **Rào chắn trùng lặp:** Nếu máy đã có trong mảng -> Xóa bỏ khỏi mảng (Toggle Out).  
    * **Rào chắn số lượng:** Nếu chưa có, kiểm tra nếu `compareList.length >= 3` -> Chặn lại và bắn Toast: "Chỉ được so sánh tối đa 3 sản phẩm!". Nếu chưa đủ 3 máy -> `push` ID vào mảng.  
    * Lưu mảng ID vào `sessionStorage.setItem('smartstore_compare', JSON.stringify(compareList))`.
* **4. Tương tác với cơ sở dữ liệu `db.json`:**  
  * Dùng danh sách ID trong `compareList` lọc lấy các object sản phẩm từ `productModel` (thuần Client-Side State).
* **5. Dữ liệu trả về & Cập nhật giao diện màn hình (View Render):**  
  * `productView.updateCompareDock(compareList)`: Thanh dock `#compare-dock` trượt lên ghim đáy màn hình với nền Cyberpunk mờ, hiển thị ảnh nhỏ của các máy đã chọn.  
  * Đổi màu nút trên card sản phẩm sang xanh lá cây với chữ "Đã chọn".  
  * `productView.renderCompare(products)`: Vẽ bảng HTML dạng lưới so sánh song song 10 tiêu chí (Chip, RAM, Màn hình, Pin, Tản nhiệt...), thông số nào vượt trội được gắn icon sao vàng.
* **💡 Ví dụ minh họa thực tế:**  
  Khách chọn so sánh *Asus ROG Phone 8* và *RedMagic 9 Pro*. Thanh dock hiện lên ở đáy màn hình với 2 máy. Bấm "So Sánh Ngay", bảng mở ra đối chiếu: Khách thấy ngay RedMagic có pin 6500mAh lớn hơn ROG 8 (5500mAh), giúp ra quyết định mua hàng chính xác.

---

### CHỨC NĂNG 05: Quản Lý Giỏ Hàng & Kiểm Soát Trần Tồn Kho (Cart Engine & Stock Bounds)
> *Bao gồm: Thêm giỏ hàng, Tăng/giảm số lượng có rào chắn kho, Xóa món, và Tính tiền tạm tính.*

* **1. Người dùng tương tác với DOM:**  
  * Click icon giỏ hàng trên card sản phẩm hoặc nút `[Thêm Vào Giỏ]` tại trang chi tiết / quick view.  
  * Click nút `[-]` hoặc `[+]` tại dòng sản phẩm trong trang Giỏ Hàng (`#view-cart`).  
  * Click icon thùng rác xóa từng món hoặc nút `[Xóa Toàn Bộ Giỏ Hàng]`.
* **2. Hành động & Thông tin gửi kèm, phương thức gửi:**  
  * Gửi `productId` và số lượng `quantity` (mặc định là `1`).  
  * Gửi `delta = +1` hoặc `-1`.
* **3. Nơi tiếp nhận & Xử lý nghiệp vụ tại Controller/Model:**  
  * Trong [cartController.js](file:///d:/Code/Javascript%20n%C3%A2ng%20cao/website-gaming-phone/controllers/cartController.js): Hàm `add(productId, quantity)` gọi `cartModel.addItem(product, quantity)`.  
  * **Kiểm tra rào chắn kho hàng (Stock Guard):** Lấy tồn kho `p.stock`. Nếu `số lượng hiện tại trong giỏ + số lượng muốn thêm > p.stock` -> Chặn lại và bắn Toast: "Số lượng vượt quá tồn kho (kho còn [X] máy)!".  
  * **Xử lý giảm về 0:** Khi bấm `[-]` mà số lượng về `0`, hệ thống hỏi xác nhận xóa sản phẩm khỏi giỏ hàng.  
  * **Tính toán tiền và số lượng:** `cartModel.getSubtotal()` tính tổng tiền = `reduce(t + price * qty)`, `cartModel.getTotalCount()` tính tổng số món.  
  * Lưu giỏ hàng bền vững vào `localStorage.setItem('smartstore_cart', JSON.stringify(items))`.
* **4. Tương tác với cơ sở dữ liệu `db.json`:**  
  * Giữ trạng thái giỏ hàng Client-Side để người dùng thoải mái thêm bớt. Dữ liệu kho trong `db.json` chỉ chính thức bị khấu trừ khi người dùng bấm nút Xác nhận đặt hàng ở bước Checkout.
* **5. Dữ liệu trả về & Cập nhật giao diện màn hình (View Render):**  
  * `baseView.updateCartBadge(count)`: Cập nhật ngay con số màu đỏ trên icon Giỏ hàng ở Header.  
  * `cartView.renderCart(items)`: Vẽ lại bảng giỏ hàng, cập nhật cột Thành tiền của từng dòng và ô Tạm tính tổng đơn.  
  * `baseView.showToast("Đã thêm sản phẩm vào giỏ hàng!", "success")`.
* **💡 Ví dụ minh họa thực tế:**  
  Điện thoại *iPhone 16 Pro Max* trong kho chỉ còn đúng 2 chiếc. Khách bấm thêm vào giỏ 1 chiếc -> Giỏ hàng nhận 1 chiếc, badge Header nhảy lên số 1. Khách vào trang giỏ bấm `[+]` -> Số lượng thành 2. Khách bấm tiếp `[+]` lần nữa -> Hệ thống chặn lại, giữ nguyên số 2 và cảnh báo: "Kho chỉ còn 2 máy, không thể tăng thêm!".

---

### CHỨC NĂNG 06: Động Cơ Mã Giảm Giá Đa Điều Kiện (Voucher Engine & Validation)
> *Bao gồm: Nhập mã voucher, Kiểm tra điều kiện đơn hàng tối thiểu, và Tính tiền chiết khấu.*

* **1. Người dùng tương tác với DOM:**  
  * Khách nhập chuỗi mã vào ô `#input-voucher-code` rồi bấm `[Áp Dụng]`, hoặc bấm trực tiếp vào các thẻ Chip gợi ý voucher (`#voucher-chip-gaming`, `#voucher-chip-flagship`).
* **2. Hành động & Thông tin gửi kèm, phương thức gửi:**  
  * Gửi chuỗi mã voucher (ví dụ: `'GAMING2026'`, `'FLAGSHIP10'`) qua hàm Controller.
* **3. Nơi tiếp nhận & Xử lý nghiệp vụ tại Controller/Model:**  
  * Trong [cartController.js](file:///d:/Code/Javascript%20n%C3%A2ng%20cao/website-gaming-phone/controllers/cartController.js): Hàm `applyVoucher(code)` gọi `cartModel.applyVoucher(code)`.  
  * **Thuật toán kiểm tra 3 tầng nghiệp vụ:**  
    1. *Tồn tại:* Tìm mã trong collection `vouchers`. Nếu không có -> Báo lỗi "Mã giảm giá không tồn tại!".  
    2. *Hạn mức lượt dùng:* Kiểm tra `voucher.usageLeft > 0`. Nếu hết lượt -> Báo "Mã giảm giá đã hết lượt sử dụng!".  
    3. *Điều kiện đơn hàng tối thiểu (Min Order Guard):* So sánh `subtotal < voucher.minOrder`. Nếu chưa đủ tiền -> Từ chối áp dụng và báo: "Đơn hàng phải từ [X] triệu trở lên để dùng mã này!".  
  * **Tính toán số tiền giảm:**  
    * Nếu `type === 'fixed'`: Giảm thẳng số tiền (ví dụ: 500.000 đ).  
    * Nếu `type === 'percentage'`: Tính `subtotal * value / 100`, có rào chắn chặn trần `maxDiscount`.
* **4. Tương tác với cơ sở dữ liệu `db.json`:**  
  * Gửi HTTP Request: `GET http://localhost:3000/vouchers?code=GAMING2026`.  
  * Backend trả về đối tượng voucher có cấu trúc: `{ id: 1, code: "GAMING2026", type: "fixed", value: 500000, minOrder: 15000000, usageLeft: 50 }`.
* **5. Dữ liệu trả về & Cập nhật giao diện màn hình (View Render):**  
  * `cartView.renderCheckout()`: Hiển thị dòng "Giảm giá Voucher" màu xanh lá cây `- 500.000 đ`.  
  * Trừ trực tiếp vào dòng "Tổng thanh toán cuối cùng".  
  * Hiển thị thẻ Badge mã voucher đang áp dụng kèm nút `[Gỡ Bỏ]`.  
  * `baseView.showToast("Áp dụng mã giảm giá GAMING2026 thành công!", "success")`.
* **💡 Ví dụ minh họa thực tế:**  
  Khách mua máy trị giá 25.000.000 đ. Khách bấm vào chip voucher `GAMING2026` (Yêu cầu đơn từ 15 triệu, giảm 500k). Hệ thống đối chiếu 25tr > 15tr (hợp lệ), ngay lập tức khấu trừ 500.000 đ, tổng tiền thanh toán giảm từ 25.000.000 đ xuống còn 24.500.000 đ.

---

### CHỨC NĂNG 07: Quy Trình Đặt Hàng & Trừ Tồn Kho Tự Động (Checkout & Auto Stock Deduction)
> *Bao gồm: Kiểm tra bắt buộc đăng nhập, Validate form giao hàng, Gửi tạo đơn hàng, Trừ kho sản phẩm trong CSDL và Xóa giỏ.*

* **1. Người dùng tương tác với DOM:**  
  * Khách hàng tại màn hình Giỏ Hàng bấm `[Tiến Hành Thanh Toán]`, hoặc tại màn hình Checkout điền form: Họ tên, Số điện thoại, Email, Địa chỉ, chọn phương thức (COD / Chuyển khoản), rồi bấm nút `[Xác Nhận Đặt Hàng]`.
* **2. Hành động & Thông tin gửi kèm, phương thức gửi:**  
  * Sự kiện `submit` của `#checkout-form`.  
  * Đóng gói toàn bộ thông tin người nhận, danh sách sản phẩm mua `items`, mã voucher đã dùng, và tổng tiền thành một Payload JSON Object `donHangMoi`.
* **3. Nơi tiếp nhận & Xử lý nghiệp vụ tại Controller/Model:**  
  * Trong [appController.js](file:///d:/Code/Javascript%20n%C3%A2ng%20cao/website-gaming-phone/controllers/appController.js) & [cartController.js](file:///d:/Code/Javascript%20n%C3%A2ng%20cao/website-gaming-phone/controllers/cartController.js):  
    * **Rào chắn 1 (BẮT BUỘC ĐĂNG NHẬP):** Nếu người dùng chưa đăng nhập tài khoản (`currentUser === null`), hệ thống chặn ngay việc thanh toán, thông báo Toast cảnh báo và tự động điều hướng sang form Đăng Nhập kèm tham số `redirect=checkout`. Khi người dùng đăng nhập thành công, hệ thống tự động đưa khách quay lại đúng màn hình Checkout.  
    * **Rào chắn 2 (RBAC Admin Guard):** Chặn tài khoản Quản trị viên (Admin) không được phép đặt đơn mua hàng (Admin chỉ có quyền quản trị kho vận và tài chính).  
    * **Rào chắn 3 (Form Validation):** Kiểm tra Họ tên >= 2 ký tự, SĐT đủ 10 số đúng đầu số Việt Nam (03, 05, 07, 08, 09), Email đúng định dạng regex RFC, Địa chỉ >= 5 ký tự.  
    * **Liên kết dữ liệu đơn hàng:** Đơn hàng tự động lưu `userId: String(currentUser.id)` và `customerEmail: email || currentUser.email` để đảm bảo đơn hàng xuất hiện tức thì trong mục "Đơn hàng đã mua" của khách.  
    * **Sinh mã đơn hàng:** Gọi hàm sinh mã tự động theo thời gian: `#DH` + chuỗi 9 số ngẫu nhiên (ví dụ: `#DH124256508`).  
    * Trạng thái khởi tạo của đơn hàng là: `status: "processing"`.
* **4. Tương tác với cơ sở dữ liệu `db.json`:**  
  * **Bước A (Tạo đơn hàng):** Gửi `POST http://localhost:3000/orders` với body là `donHangMoi`. `json-server` lưu bản ghi mới vào mảng `"orders"` trong `db.json`.  
  * **Bước B (Khấu trừ tồn kho & tăng số đã bán):** Kích hoạt vòng lặp `Promise.all` duyệt qua từng sản phẩm trong đơn, gửi song song các request:  
    `PATCH http://localhost:3000/products/:id` với body `{ stock: currentStock - buyQty, sold: currentSold + buyQty }`.  
  * **Bước C (Trừ lượt dùng voucher):** Nếu có dùng voucher, gửi `PATCH /vouchers/:id` với body `{ usageLeft: usageLeft - 1 }`.
* **5. Dữ liệu trả về & Cập nhật giao diện màn hình (View Render):**  
  * Nhận HTTP Status `201 Created`.  
  * Xóa sạch giỏ hàng: `cartModel.clearCart()`, xóa `localStorage('smartstore_cart')`, đưa badge Header về số `0`.  
  * Chuyển màn hình sang `#view-thankyou` qua `cartCtrl.renderThankYou(orderCode)`.  
  * Hiển thị dấu tích xanh chúc mừng, in rõ mã đơn hàng `#DH124256508` và cung cấp 2 nút bấm: `[Xem Hóa Đơn Chi Tiết]` và `[Xem Đơn Hàng Của Tôi]`.
* **💡 Ví dụ minh họa thực tế:**  
  Khách hàng đăng nhập tài khoản anh Dũng, đặt 1 chiếc *Asus ROG 8 Pro* (kho đang có 5 máy). Sau khi bấm xác nhận, trong `db.json` xuất hiện 1 đơn hàng mới mang mã `#DH124256508` gắn đúng `userId: "vYCdM-OJs40"`, số lượng tồn kho của máy trong `db.json` lập tức bị trừ từ 5 xuống còn 4, giỏ hàng trở về rỗng và màn hình hiện thông báo chúc mừng đặt hàng thành công.

---

### CHỨC NĂNG 08: Nhận Diện Khách Hàng Thân Thiết Khi Checkout (Smart Identity Resolution)
> *Bao gồm: Lắng nghe gõ email tại checkout, Nhận diện khách cũ, và Đăng nhập nhanh để tự điền form.*

* **1. Người dùng tương tác với DOM:**  
  * Khách hàng tại màn hình thanh toán gõ email vào ô `#checkout-email` rồi click chuột ra ngoài (sự kiện `blur`).
* **2. Hành động & Thông tin gửi kèm, phương thức gửi:**  
  * Lấy chuỗi email vừa nhập (ví dụ: `'hung.nv@gmail.com'`).
* **3. Nơi tiếp nhận & Xử lý nghiệp vụ tại Controller/Model:**  
  * Controller gọi `authCtrl.checkCheckoutEmail(email)`.  
  * `userModel.checkIdentityByEmail(email)` truy vấn kiểm tra trong CSDL.  
  * Nếu tìm thấy: Hệ thống kích hoạt thuật toán che mờ bảo mật `maskEmail(email)` (ví dụ: `hun****@gmail.com`).  
  * Lưu tạm thông tin khách hàng vào biến `matchedIdentityUser`.
* **4. Tương tác với cơ sở dữ liệu `db.json`:**  
  * Gửi HTTP Request: `GET http://localhost:3000/users?email=hung.nv%40gmail.com`.  
  * Backend kiểm tra và trả về bản ghi người dùng khớp email.
* **5. Dữ liệu trả về & Cập nhật giao diện màn hình (View Render):**  
  * Khối thẻ thông minh `#smart-identity-resolution-card` hiện ra ngay dưới ô email với giao diện gradient xanh biển sang trọng.  
  * Hiển thị câu chào cá nhân hóa: *"Chào bạn, chúng tôi nhận diện tài khoản: Nguyễn Văn Hùng"*.  
  * Khi khách bấm nút `[Điền Nhanh]`: Hệ thống tự động điền SĐT và Địa chỉ nhà cũ vào form thanh toán mà khách không cần gõ lại một chữ nào.
* **💡 Ví dụ minh họa thực tế:**  
  Anh Hùng gõ `hung.nv@gmail.com` ở Checkout. Vừa click ra ngoài, một thông báo hiện lên: "Chào bạn, chúng tôi nhận diện tài khoản: Nguyễn Văn Hùng". Anh Hùng bấm "Điền Nhanh", ngay lập tức ô SĐT `0912345678` và địa chỉ `Số 12 Chùa Bộc, Đống Đa, Hà Nội` tự động điền vào form đầy đủ.

---

### CHỨC NĂNG 09: Xuất Bản & In Hóa Đơn Bán Lẻ Điện Tử (Invoice Modal & Window Print)
> *Bao gồm: Popup xem hóa đơn bán lẻ chuẩn TMĐT và Kích hoạt lệnh in phần cứng.*

* **1. Người dùng tương tác với DOM:**  
  * Khách hàng bấm nút `[Xem Hóa Đơn]` tại màn hình Thank You hoặc bấm nút `[Hóa Đơn]` trong Lịch sử đơn hàng; hoặc Admin bấm `[In Hóa Đơn]` tại bảng quản trị đơn hàng.  
  * Tiếp đó bấm nút `[In Hóa Đơn Này]`.
* **2. Hành động & Thông tin gửi kèm, phương thức gửi:**  
  * Gửi mã đơn hàng `orderCode` (ví dụ: `'#DH124256508'`).
* **3. Nơi tiếp nhận & Xử lý nghiệp vụ tại Controller/Model:**  
  * Trong [cartController.js](file:///d:/Code/Javascript%20n%C3%A2ng%20cao/website-gaming-phone/controllers/cartController.js): Hàm `openCustomerInvoice(orderCode)` lấy thông tin đơn hàng từ `orderModel.fetchOrderByCode(orderCode)`.  
  * Trích xuất thông tin doanh nghiệp (SmartStore, MST 0108923456, Trịnh Văn Bô, Nam Từ Liêm), thông tin người mua, bảng danh sách sản phẩm, chiết khấu voucher, tổng tiền thanh toán và con dấu đỏ cam kết bảo hành 12 tháng.  
  * Khi bấm In: Hàm `printInvoice()` mở một cửa sổ in ấn chuyên biệt `@media print`.
* **4. Tương tác với cơ sở dữ liệu `db.json`:**  
  * Truy vấn dữ liệu đơn hàng qua `GET /orders?orderCode=...` (hoặc lấy từ RAM Cache đơn hàng vừa tạo).
* **5. Dữ liệu trả về & Cập nhật giao diện màn hình (View Render):**  
  * `orderView.renderInvoiceModal(order)`: Mở popup `#customer-invoice-modal` hiển thị tờ hóa đơn mua hàng sắc nét như siêu thị Thế Giới Di Động / FPT Shop.  
  * Khi bấm nút In: Lệnh `window.print()` gốc của trình duyệt được kích hoạt, mở hộp thoại in của hệ điều hành Windows cho phép in ra máy in hoặc lưu file PDF.
* **💡 Ví dụ minh họa thực tế:**  
  Khách hàng vào xem lịch sử đơn hàng, bấm nút "Hóa Đơn" của đơn `#DH124256508`. Một tờ hóa đơn thanh toán chuẩn VAT hiện lên đầy đủ thông tin máy iPhone 15 Pro Max giá 29.990.000 đ kèm điều khoản bảo hành đổi mới 30 ngày. Khách bấm "In", máy tính mở hộp thoại in cho phép lưu file PDF về máy.

---

### CHỨC NĂNG 10: Xác Thực Đăng Ký Thông Minh & Bảo Vệ Mật Khẩu (Smart Register & Auto-Login)
> *Bao gồm: Kiểm tra email tồn tại khi blur, Nút Toggle mắt xem mật khẩu, Đồng bộ cache RAM, và Auto-Login nếu đúng mật khẩu.*

* **1. Người dùng tương tác với DOM:**  
  * Khách gõ email vào ô `#reg-email` của form Đăng Ký rồi click ra ngoài (sự kiện `blur`).  
  * Khách bấm icon con mắt bên cạnh ô mật khẩu để kiểm tra ký tự đã gõ.  
  * Điền đầy đủ form đăng ký rồi bấm nút `[Đăng Ký Tài Khoản]`.
* **2. Hành động & Thông tin gửi kèm, phương thức gửi:**  
  * Gửi `{ name, email, password, phone, address }`. Các trường mật khẩu được trang bị `autocomplete="new-password"`.
* **3. Nơi tiếp nhận & Xử lý nghiệp vụ tại Controller/Model:**  
  * Trong [authController.js](file:///d:/Code/Javascript%20n%C3%A2ng%20cao/website-gaming-phone/controllers/authController.js) & [userModel.js](file:///d:/Code/Javascript%20n%C3%A2ng%20cao/website-gaming-phone/models/userModel.js):  
    * **Xử lý sự kiện blur:** `checkRegisterEmail()` gọi `userModel.checkIdentityByEmail(email)`. Nếu email đã có trên hệ thống -> Kích hoạt `maskEmail(email)` che mờ bảo mật và hiển thị hộp thông báo `#reg-exist-alert`.  
    * **Xử lý nút chuyển tab:** Khi khách bấm nút `[Đăng Nhập Ngay]` trên hộp thông báo, hàm `switchToLoginWithEmail()` chuyển sang tab Login, tự động điền cả email và mật khẩu khách vừa gõ sang form đăng nhập để khách không phải gõ lại.  
    * **Xử lý Auto-Login khi Submit:** Nếu khách bấm Đăng ký với email đã tồn tại, Controller thử đăng nhập với mật khẩu vừa nhập qua `userModel.login(email, password)`.  
      * *Nếu đúng mật khẩu: TỰ ĐỘNG ĐĂNG NHẬP NGAY LẬP TỨC!* Lưu phiên an toàn và chuyển vào màn hình cá nhân.  
      * *Nếu sai mật khẩu:* Cảnh báo tài khoản đã tồn tại và gợi ý kiểm tra lại mật khẩu.  
    * **Xử lý tạo tài khoản mới & Đồng bộ RAM:** Khi tạo tài khoản mới hoàn toàn, `userModel.register()` gửi `POST /users`, đồng thời **lập tức kích hoạt `users.push(saved)` vào cache RAM** để người dùng có thể đăng xuất ra và đăng nhập lại ngay tức thì mà không gặp bất kỳ lỗi sai lệch dữ liệu nào.
* **4. Tương tác với cơ sở dữ liệu `db.json`:**  
  * Gửi `GET http://localhost:3000/users?email=...` để đối soát sự tồn tại và mật khẩu.  
  * Nếu là tài khoản mới hoàn toàn: Gửi `POST http://localhost:3000/users` để lưu thành viên mới vào `db.json`.
* **5. Dữ liệu trả về & Cập nhật giao diện màn hình (View Render):**  
  * **Trường hợp phát hiện email cũ:** Hiện khung thông báo `#reg-exist-alert` với dòng chữ: *"Tài khoản **giag****@gmail.com** đã tồn tại, tiến hành đăng nhập?"* kèm nút bấm.  
  * **Trường hợp tạo tài khoản mới:** Bắn Toast xanh: *"Đăng ký tài khoản thành công! Tự động đăng nhập..."*, cập nhật tên lên Header và điều hướng sang trang Profile hoặc Checkout.
* **💡 Ví dụ minh họa thực tế:**  
  Khách hàng đăng ký tài khoản mới với email `giagiong001@gmail.com` và mật khẩu `1234`. Khách bấm icon con mắt để xem lại đúng mật khẩu `1234` (không bị gõ nhầm Unikey), sau đó bấm "Đăng Ký Tài Khoản". Hệ thống tạo tài khoản trong `db.json`, đồng bộ vào RAM cache, và đưa khách vào trang cá nhân an toàn.

---

### CHỨC NĂNG 11: Đăng Nhập Hệ Thống, Lịch Sử Đơn Hàng & Hồ Sơ (RBAC Login & Order History)
> *Bao gồm: Xác thực mật khẩu 3 tầng, Bóc tách an toàn không lưu pass, Bảng lịch sử đơn hàng 7 cột, Hủy đơn hoàn kho, và Đăng xuất về Trang chủ.*

* **1. Người dùng tương tác với DOM:**  
  * Khách nhập email (hoặc SĐT) và mật khẩu tại form Đăng Nhập, có thể bấm icon con mắt để hiện mật khẩu, rồi bấm `[Đăng Nhập Ngay]`.  
  * Tại trang Profile: Xem thông tin cá nhân, sửa SĐT/Địa chỉ, xem bảng Lịch Sử Đơn Hàng Của Bạn, bấm nút `[Hóa Đơn]` hoặc nút `[Hủy Đơn]`.  
  * Bấm nút `[Đăng Xuất Tài Khoản]`.  
  * Hoặc gõ mã đơn/SĐT vào ô tra cứu `#tracking-input` và bấm `[Kiểm Tra]`.
* **2. Hành động & Thông tin gửi kèm, phương thức gửi:**  
  * Form submit gửi `{ email, password }` hoặc chuỗi truy vấn tra cứu `q`.
* **3. Nơi tiếp nhận & Xử lý nghiệp vụ tại Controller/Model:**  
  * Trong [authController.js](file:///d:/Code/Javascript%20n%C3%A2ng%20cao/website-gaming-phone/controllers/authController.js) & [userModel.js](file:///d:/Code/Javascript%20n%C3%A2ng%20cao/website-gaming-phone/models/userModel.js):  
    * **Thuật toán đối soát đăng nhập 3 tầng an toàn:**  
      * *Tầng 1 (Direct Query):* Gửi `GET /users?email=...` tìm kiếm trực tiếp.  
      * *Tầng 2 (Full Scan Case-Insensitive):* Nếu không thấy, tự động gọi `_http('/users')` quét toàn bộ danh sách, hỗ trợ không phân biệt chữ hoa thường và hỗ trợ đăng nhập linh hoạt bằng cả Số điện thoại.  
      * *Tầng 3 (Multi-User Password Match):* Nếu có nhiều tài khoản trùng SĐT, thuật toán tự động lọc đúng tài khoản khớp với mật khẩu đang gõ (`userList.find(u => u.password === pw)`).  
    * **Bóc tách mật khẩu an toàn (Safe Destructuring):**  
      `const { password: _pw, ...safeUser } = user;`  
      Thuộc tính `password` bị loại bỏ hoàn toàn, chỉ lưu `safeUser` vào `localStorage.setItem('smartstore_user', ...)`.  
    * **Phân quyền người dùng (RBAC):**  
      * Nếu `user.role === 'admin'`: Điều hướng sang Dashboard Quản trị `admin.html`.  
      * Nếu `user.role === 'user'`: Điều hướng vào trang Hồ sơ cá nhân hoặc quay lại Checkout nếu có tham số `redirect=checkout`.  
    * **Nạp Lịch Sử Đơn Hàng Của Bạn (`renderProfile`):**  
      * Gọi `orderModel.fetchOrdersByUserId(user.id, user.email)`: Thuật toán tìm kiếm thông minh kết hợp cả `userId` và `customerEmail`, giúp nạp chính xác 100% tất cả đơn hàng đã mua (kể cả các đơn cũ tạo trước đó).  
      * Controller gọi `oView.renderUserOrders(tbodyId, orders)` vẽ bảng **7 cột chuẩn xác**: Mã đơn, Ngày đặt, Sản phẩm, Tổng tiền, Phương thức, Trạng thái, Thao tác.  
    * **Khách tự hủy đơn hàng & Hoàn kho tự động (`cancelOrder`):**  
      * Nếu đơn ở trạng thái `processing` hoặc `pending`, nút `[Hủy Đơn]` màu đỏ sẽ xuất hiện. Khách bấm hủy -> Hệ thống đổi trạng thái đơn thành `cancelled` và tự động duyệt qua từng sản phẩm để **cộng hoàn trả lại 100% số lượng tồn kho** trong `db.json`!  
    * **Đăng xuất an toàn (`logout`):**  
      * Xóa sạch phiên đăng nhập trong LocalStorage, làm sạch các trường password trên form để tránh browser autofill, và **luôn điều hướng sạch sẽ về giao diện Trang chủ ban đầu (`index.html`)**.
* **4. Tương tác với cơ sở dữ liệu `db.json`:**  
  * `GET /users?email=...` để đối soát thông tin đăng nhập.  
  * `GET /orders` để nạp danh sách đơn hàng của khách.  
  * `PATCH /orders/:id` và `PATCH /products/:id` khi hủy đơn hoàn kho.
* **5. Dữ liệu trả về & Cập nhật giao diện màn hình (View Render):**  
  * `baseView.renderNavUser(user)`: Hiển thị tên người dùng và dropdown menu trên Header.  
  * `orderView.renderUserOrders(tbodyId, orders)`: Vẽ bảng lịch sử đơn hàng 7 cột thẳng hàng, đẹp mắt.  
  * `cartView.renderTrackingResult(containerId, orders)`: Vẽ thanh tiến trình trạng thái 4 bước: Đã Đặt Hàng ➔ Chuẩn Bị Hàng ➔ Đang Giao Hàng ➔ Đã Hoàn Tất.
* **💡 Ví dụ minh họa thực tế:**  
  Anh Dũng sau khi đăng ký tài khoản `giagiong001@gmail.com`, bấm Đăng xuất thì trình duyệt quay về Trang chủ. Anh Dũng vào form Đăng nhập, gõ lại đúng email và mật khẩu `1234` (có thể bấm icon con mắt để xem lại). Hệ thống đăng nhập thành công ngay tức khắc, đưa vào trang cá nhân hiển thị đầy đủ danh sách 3 đơn hàng anh Dũng đã từng đặt kèm mã đơn, số tiền và nút xem Hóa đơn.

---

### CHỨC NĂNG 12: Quản Trị Hệ Thống Admin Dashboard Toàn Diện (KPI, CRUD & FSM Orders)
> *Bao gồm: Rào chắn bảo mật Admin, 4 Thẻ KPI, Tab Sản Phẩm hiển thị mặc định, Quản lý CRUD Sản phẩm ảnh vật lý `/images/`, CRUD Khách hàng, Đổi trạng thái đơn hoàn kho, và Đăng xuất về Trang chủ.*

* **1. Người dùng tương tác với DOM:**  
  * Admin truy cập `views/admin.html` (hệ thống tự động kích hoạt ngay tab Quản Lý Sản Phẩm hiển thị dữ liệu).  
  * Bấm `[+ Thêm Sản Phẩm Mới]`, chọn ảnh từ máy tính hoặc dán đường dẫn ảnh vật lý (lưu vào thư mục `images/`), nhập đủ 10 thông số kỹ thuật, bấm `[Lưu Sản Phẩm]`.  
  * Bấm menu `[Quản Lý Khách Hàng]`, thực hiện thêm, sửa hoặc xóa tài khoản khách hàng.  
  * Chọn trạng thái mới trong dropdown `<select>` đơn hàng (Chờ xử lý, Đang chuẩn bị, Đang giao, Đã giao, Đã hủy).  
  * Bấm nút icon thùng rác đỏ xóa sản phẩm/đơn hàng/khách hàng.  
  * Bấm nút `[Đăng Xuất Admin]` ở góc trên bên phải.
* **2. Hành động & Thông tin gửi kèm, phương thức gửi:**  
  * Gửi ID sản phẩm, Payload thông tin máy mới kèm đường dẫn ảnh vật lý `/images/...`, trạng thái đơn mới `newStatus`, dữ liệu tài khoản khách hàng mới, hoặc yêu cầu xóa `id`.
* **3. Nơi tiếp nhận & Xử lý nghiệp vụ tại Controller/Model:**  
  * Trong [adminController.js](file:///d:/Code/Javascript%20n%C3%A2ng%20cao/website-gaming-phone/controllers/adminController.js):  
    * **Rào chắn RBAC:** `kiemTraDangNhapAdmin()` kiểm tra phiên làm việc. Nếu chưa đăng nhập hoặc không phải admin -> Khóa toàn bộ Dashboard, chỉ hiển thị form đăng nhập chuyên dụng của Quản trị viên.  
    * **Mặc định mở tab Sản phẩm:** Khi tải trang, hàm `taiDuLieuAdmin()` tự động kích hoạt `chuyenTabAdmin('products')` để bảng danh sách sản phẩm hiển thị ngay lập tức, không bắt Admin phải bấm thủ công vào menu.  
    * **Tính toán 4 Thẻ KPI Tài Chính:** Tổng doanh thu (tính từ các đơn `delivered`), Tổng sản phẩm đã bán, Tổng máy tồn kho và Cảnh báo sản phẩm sắp hết hàng (`stock < 5`).  
    * **Cơ Chế Tự Tăng ID Sản Phẩm (+1 ID Số) Đa Tầng:**  
      * Khi mở modal Thêm mới, hệ thống tự động quét danh sách sản phẩm thực tế, tính toán ID kế tiếp theo thuật toán `nextId = Math.max(...validIds) + 1` (ví dụ: máy thứ 41 có ID là `41`), đồng thời hiển thị trực tiếp mã ID tự tăng này lên ô "Mã Sản Phẩm (ID Hệ Thống)" và tiêu đề Modal để Admin quan sát rõ ràng.  
      * Cả ở tầng Controller (`adminController.js`) và tầng Model (`productModel.js`) đều tích hợp bộ bảo vệ tự gán `payload.id = String(nextId)`, ngăn chặn tuyệt đối tình trạng JSON-Server sinh chuỗi ký tự ngẫu nhiên (nanoid).  
    * **Quản lý Ảnh Vật Lý Tiết Kiệm Băng Thông:**  
      * Hỗ trợ tải file ảnh từ máy tính thông qua endpoint upload nội bộ, lưu file trực tiếp vào thư mục vật lý `images/`.  
      * Trong `db.json`, hệ thống **chỉ lưu đường dẫn ảnh tương đối** (ví dụ: `images/rog-phone-8.png` hoặc `/images/...`), loại bỏ hoàn toàn chuỗi Base64 cồng kềnh, giúp file `db.json` luôn gọn nhẹ, tối ưu hóa tốc độ tải trang gấp 10 lần.  
    * **CRUD Khách Hàng Toàn Diện:** Cung cấp đầy đủ các hàm nghiệp vụ `themKhachHang`, `suaKhachHang`, `xoaKhachHang`. Chặn tuyệt đối hành vi xóa tài khoản Quản trị viên cấp cao.  
    * **Máy trạng thái đơn hàng (FSM):**  
      * *Khóa đơn đã giao:* Nếu đơn hàng đã ở trạng thái `delivered` -> Vô hiệu hóa dropdown để bảo vệ tính toàn vẹn doanh thu tài chính.  
      * *Tự động hoàn kho khi hủy đơn:* Nếu chuyển trạng thái sang `cancelled` -> Hệ thống tự động duyệt qua các sản phẩm trong đơn và cộng hoàn trả lại số lượng tồn kho `stock = stock + buyQty` trong `db.json`.  
    * **Đăng Xuất Admin:** Khi Admin bấm đăng xuất, hệ thống xóa session `smartstore_admin_logged` và **chuyển hướng thẳng về Trang chủ ban đầu (`index.html`)**, thay vì giữ lại màn hình login admin xám xịt.
* **4. Tương tác với cơ sở dữ liệu `db.json`:**  
  * `taiDuLieuAdmin()`: Gửi `Promise.all` nạp đồng thời `/products`, `/categories`, `/orders`, `/users`.  
  * Thêm/Sửa sản phẩm: Gửi `POST /products` (thêm mới) hoặc `PATCH /products/:id` (cập nhật).  
  * Thêm/Sửa/Xóa khách hàng: Gửi `POST /users`, `PATCH /users/:id`, `DELETE /users/:id`.  
  * Đổi trạng thái đơn: Gửi `PATCH /orders/:id` với body `{ status: newStatus }`. Nếu hủy đơn gửi tiếp các lệnh `PATCH /products/:id` để cộng kho.  
  * Xóa dữ liệu: Gửi `DELETE /products/:id`.
* **5. Dữ liệu trả về & Cập nhật giao diện màn hình (View Render):**  
  * Cập nhật số liệu 4 thẻ KPI tài chính đầu trang.  
  * `renderBangSanPham()`, `renderBangDonHang()`, `renderBangKhachHang()` vẽ lại bảng dữ liệu tương ứng mà không cần tải lại trang.  
  * Hiển thị thông báo Toast góc phải màn hình sau mỗi thao tác.
* **💡 Ví dụ minh họa thực tế:**  
  Admin đăng nhập tài khoản `admin@smartstore.vn`, màn hình lập tức hiện danh sách 40 sản phẩm điện thoại kèm ảnh sắc nét. Admin có 1 đơn hàng khách từ chối nhận gồm 2 máy ROG Phone 8. Admin mở dropdown chuyển trạng thái từ "Đang giao" sang "Đã hủy". Ngay lập tức trong file `db.json`, trạng thái đơn đổi thành `cancelled`, và số lượng tồn kho của máy ROG Phone 8 trong file `db.json` tự động được cộng thêm 2 máy trở lại kho hàng. Khi xong việc, Admin bấm "Đăng Xuất Admin", trình duyệt chuyển thẳng về Trang chủ SmartStore.

---

## 📊 BẢNG MA TRẬN ĐỐI CHIẾU 12 CỤM CHỨC NĂNG VỚI HỆ THỐNG MÃ NGUỒN

| Cụm Chức Năng | Tệp Controller Phụ Trách | Tệp Model Dữ Liệu | Tệp View Render Giao Diện | Endpoint Tương Tác `db.json` & Lưu Trữ |
| :--- | :--- | :--- | :--- | :--- |
| **01. Khởi Động & Router Kép** | `controllers/appController.js` | `models/appModel.js` | `views/baseView.js` | `GET /categories`, `GET /products` (RAM Cache) |
| **02. Tìm Kiếm & Bộ Lọc Đa Tiêu Chí** | `controllers/shopController.js` | `models/productModel.js` | `views/productView.js` | Xử lý RAM Cache tức thì (<10ms) |
| **03. Xem Nhanh & Chi Tiết 10 Thông Số** | `controllers/shopController.js` | `models/productModel.js` | `views/productView.js` | `GET /products/:id` |
| **04. So Sánh 10 Tiêu Chí Đối Đầu** | `controllers/shopController.js` | `models/productModel.js` | `views/productView.js` | `sessionStorage('smartstore_compare')` |
| **05. Giỏ Hàng & Kiểm Soát Tồn Kho** | `controllers/cartController.js` | `models/cartModel.js` | `views/cartView.js` | `localStorage('smartstore_cart')` |
| **06. Động Cơ Voucher Đa Điều Kiện** | `controllers/cartController.js` | `models/cartModel.js` | `views/cartView.js` | `GET /vouchers`, `PATCH /vouchers/:id` |
| **07. Đặt Hàng & Trừ Kho Tự Động** | `controllers/cartController.js` | `models/orderModel.js` | `views/cartView.js` | `POST /orders`, `PATCH /products/:id` |
| **08. Nhận Diện Khách Cũ (Smart Identity)**| `controllers/authController.js` | `models/userModel.js` | `views/cartView.js` | `GET /users?email=...` |
| **09. In Hóa Đơn Bán Lẻ Điện Tử** | `controllers/cartController.js` | `models/orderModel.js` | `views/cartView.js` | `window.print()` & `@media print` |
| **10. Smart Register & Bảo Vệ Mật Khẩu** | `controllers/authController.js` | `models/userModel.js` | `views/userView.js` | `GET /users?email=...`, `POST /users` |
| **11. Đăng Nhập, Lịch Sử Đơn & Hồ Sơ** | `controllers/authController.js` | `models/userModel.js`, `models/orderModel.js` | `views/userView.js`, `views/cartView.js` | `GET /users`, `GET /orders`, `PATCH /orders/:id` |
| **12. Quản Trị Admin Dashboard** | `controllers/adminController.js`| `models/*.js` | `views/adminView.js` | `GET/POST/PUT/PATCH/DELETE` đa collection + Thư mục `images/` |

---
*Cẩm nang tài liệu kỹ thuật này được đồng bộ và cập nhật chính xác 100% với kiến trúc mã nguồn hiện tại của SmartStore, phục vụ hoàn hảo cho quá trình bảo vệ đồ án Lập trình JavaScript Nâng Cao.*
