# 🧠 TÀI LIỆU TOÀN DIỆN: KIẾN TRÚC & LOGIC HỆ THỐNG SMARTSTORE
> **Dự án:** SmartStore - Thế Giới Smartphone & Gaming Phone  
> **Môn học:** Lập trình JavaScript Nâng Cao (Advanced JavaScript) - FPT Polytechnic  
> **Kiến trúc:** Mô hình MVC Chuẩn (Model - View - Controller) & ES6 Native Modules  
> **Phong cách lập trình:** Functional Programming (Dùng hàm hiện đại, Closure, Factory Functions)  
> **Tài liệu tham chiếu:** Dùng để sinh viên ôn tập và bảo vệ đồ án trước Hội đồng Giảng viên

---

## 📑 MỤC LỤC TỔNG QUAN

1. **[TỔNG QUAN KIẾN TRÚC MÔ HÌNH MVC NÂNG CAO](#1-tổng-quan-kiến-trúc-mô-hình-mvc-nâng-cao)**
   * 1.1. Bản chất mô hình MVC trong JavaScript Client-Side
   * 1.2. Giải thích câu hỏi thi: "Tại sao trong thư mục `views/` lại có các file `.js`?"
   * 1.3. Sơ đồ tương tác 3 tầng Model - View - Controller
2. **[CHUẨN MODULAR HÓA ES6 NATIVE MODULES (`type="module"`)](#2-chuẩn-modular-hóa-es6-native-modules-typemodule)**
   * 2.1. Đột phá từ 14 thẻ script thủ công thành 1 entry point duy nhất
   * 2.2. Cơ chế nạp bất đồng bộ `defer` và Giải pháp Helper `onReady` an toàn
   * 2.3. Hai Entry Point độc lập: `app.js` (Client) & `admin.js` (Quản trị)
3. **[LOGIC BỘ ĐỊNH TUYẾN KÉP (DUAL-MODE ROUTER SPA / MPA)](#3-logic-bộ-định-tuyến-kép-dual-mode-router-spa--mpa)**
   * 3.1. Tư duy Front Controller Router
   * 3.2. Cơ chế chuyển Panel không giật trang trên `index.html` (SPA Mode)
   * 3.3. Cơ chế điều hướng trang vật lý đa tệp HTML (MPA Mode)
   * 3.4. Xử lý Query Parameters (`?view=...`, `?act=...`) và Hash Fragment (`#/shop`)
4. **[LOGIC QUẢN LÝ TRẠNG THÁI & LƯU TRỮ DỮ LIỆU (STATE MANAGEMENT)](#4-logic-quản-lý-trạng-thái--lưu-trữ-dữ-liệu-state-management)**
   * 4.1. Kỹ thuật Closure & Factory Functions bảo vệ dữ liệu Private
   * 4.2. Ma trận 4 cấp độ lưu trữ dữ liệu (RAM -> SessionStorage -> LocalStorage -> RESTful DB)
   * 4.3. Cấu trúc RESTful Collection trong `db.json` (json-server)
5. **[LOGIC NGHIỆP VỤ CỐT LÕI & ĐỘT PHÁ CÔNG NGHỆ](#5-logic-nghiệp-vụ-cốt-lõi--đột-phá-công-nghệ)**
   * 5.1. Logic Xác Thực Đăng Ký Thông Minh & Auto-Login (Smart Register UX)
   * 5.2. Logic Nhận Diện Khách Hàng Thân Thiết Khi Checkout (Smart Identity Resolution)
   * 5.3. Logic Động Cơ Mã Giảm Giá Đa Điều Kiện (Voucher Engine)
   * 5.4. Logic Máy Trạng Thái Đơn Hàng (FSM) & Tự Động Hoàn Kho Khi Hủy Đơn
   * 5.5. Logic Kiểm Soát Tồn Kho & Rào Chắn Biên Giỏ Hàng (Stock Bounds & Sanitize)
   * 5.6. Logic Động Cơ So Sánh Đối Đầu 10 Thông Số (Comparison Engine)
   * 5.7. Logic Phân Quyền Quản Trị Viên (RBAC Auth Guard)
   * 5.8. Logic Động Cơ In Hóa Đơn Trực Quan (Invoice Engine & Window Print)
6. **[CẨM NANG BẢO VỆ & TRẢ LỜI CÁC CÂU HỎI HÓC BÚA CỦA GIẢNG VIÊN](#6-cẩm-nang-bảo-vệ--trả-lời-các-câu-hỏi-hóc-búa-của-giảng-viên)**

---

## 1. TỔNG QUAN KIẾN TRÚC MÔ HÌNH MVC NÂNG CAO

### 1.1. Bản chất mô hình MVC trong JavaScript Client-Side
Trong kiến trúc phần mềm cổ điển (Server-side MVC như PHP Laravel, ASP.NET MVC), View là các file template HTML/Blade được Server render xong mới trả về trình duyệt.  
Tuy nhiên, trong **JavaScript Nâng Cao (Front-end Architecture)**, toàn bộ ứng dụng chạy trực tiếp trên trình duyệt của người dùng (Client-Side Rendering - CSR):
* **MODEL (Tầng Dữ Liệu & Nghiệp Vụ - `models/`):**
  * Nắm giữ State (trạng thái dữ liệu nội bộ).
  * Chịu trách nhiệm gửi các yêu cầu HTTP bất đồng bộ (`fetch API`) tới RESTful Server (`json-server`).
  * Thực hiện các logic nghiệp vụ thuần túy: tính toán tiền, kiểm tra tồn kho, áp dụng chiết khấu voucher, mã hóa bóc tách mật khẩu, lưu trữ `localStorage`.
  * **Quy tắc vàng:** Model KHÔNG BAO GIỜ can thiệp vào DOM (`document.getElementById`, `innerHTML`).
* **VIEW (Tầng Giao Diện & Trình Diễn - `views/`):**
  * Chịu trách nhiệm trực quan hóa dữ liệu nhận được từ Controller thành các phần tử HTML.
  * Thao tác trực tiếp với DOM: hiển thị/ẩn modal, vẽ bảng dữ liệu, đổi màu badge, bắn thông báo Toast, format tiền tệ VNĐ.
  * **Quy tắc vàng:** View KHÔNG BAO GIỜ tự ý gọi API `fetch` hoặc tự quyết định lưu trữ dữ liệu vào database.
* **CONTROLLER (Tầng Điều Phối & Lắng Nghe Sự Kiện - `controllers/`):**
  * Đóng vai trò "Nhạc trưởng" điều phối toàn bộ hoạt động của hệ thống.
  * Lắng nghe các sự kiện từ người dùng (Event Listeners: `click`, `submit`, `input`, `change`, `blur`).
  * Khi người dùng hành động: Controller gọi Model xử lý dữ liệu -> nhận kết quả trả về -> chuyển dữ liệu cho View cập nhật lại màn hình.

---

### 1.2. Giải thích câu hỏi thi: "Tại sao trong thư mục `views/` lại có các file `.js`?"
> **❓ Giảng viên hỏi:**  
> *"Theo mô hình MVC thông thường, View phải là file `.html`. Tại sao trong thư mục `views/` của em lại có các file `.js` như `productView.js`, `cartView.js`? Điều đó đúng hay sai?"*

**🎯 Trả lời chuẩn chuyên gia:**
> *"Thưa thầy/cô, điều này hoàn toàn **ĐÚNG 100%** và là tiêu chuẩn kiến trúc Client-Side Rendering (CSR) trong JavaScript Nâng cao và các thư viện hiện đại như React, Vue, Angular:*
> 1. *File HTML tĩnh (`index.html`) chỉ đóng vai trò là 'vỏ khung rỗng' (Skeleton Container) chứa các thẻ `<div id="product-list">`.*
> 2. *Các file `.js` trong thư mục `views/` đóng vai trò là **Giao Diện Động (Dynamic View Renderer)**. Chúng chứa các hàm chuyên trách nhận mảng dữ liệu (Array of Objects) từ Controller và biên dịch thành chuỗi HTML Template String (`inner_html = products.map(...).join('')`) để nhúng vào DOM.*
> 3. *Nhờ cách làm này, giao diện có thể cập nhật từng phần tử nhỏ (ví dụ: chỉ cập nhật số lượng giỏ hàng hoặc màu sắc nút bấm) mà **không cần phải tải lại toàn bộ trang web**, giúp trang web chạy cực kỳ mượt mà, tối ưu tài nguyên và chuẩn theo kiến trúc Single Page Application (SPA).'*

---

### 1.3. Sơ đồ tương tác 3 tầng Model - View - Controller

```
        ┌─────────────────────────────────────────────────────────┐
        │                  NGƯỜI DÙNG (USER)                      │
        └────────────────────────────┬────────────────────────────┘
                                     │ Tương tác (Click, Submit, Input)
                                     ▼
                        ┌────────────────────────┐
                        │   TẦNG CONTROLLER      │
                        │  (Điều phối sự kiện)   │
                        └───┬────────────────┬───┘
                            │                │
            1. Gọi xử lý data│                │3. Truyền dữ liệu sang View
                            ▼                ▼
        ┌────────────────────────┐      ┌────────────────────────┐
        │      TẦNG MODEL        │      │       TẦNG VIEW        │
        │  (Nghiệp vụ & Dữ liệu) │      │  (Render HTML & DOM)   │
        └───┬────────────────────┘      └────────────┬───────────┘
            │ 2. fetch() REST API                    │ 4. innerHTML / Toast
            ▼                                        ▼
    ┌───────────────┐                       ┌─────────────────┐
    │  BACKEND DB   │                       │  GIAO DIỆN WEB  │
    │  (`db.json`)  │                       │  (Màn hình DOM) │
    └───────────────┘                       └─────────────────┘
```

---

## 2. CHUẨN MODULAR HÓA ES6 NATIVE MODULES (`type="module"`)

### 2.1. Đột phá từ 14 thẻ script thủ công thành 1 entry point duy nhất
Trước đây, việc nạp file truyền thống đòi hỏi liệt kê 13-14 thẻ `<script src="...">` ở mỗi file HTML:
```html
<!-- CÁCH CŨ: Dễ lỗi thứ tự nạp, làm ô nhiễm window scope -->
<script src="models/productModel.js"></script>
<script src="models/cartModel.js"></script>
<script src="views/baseView.js"></script>
<script src="controllers/shopController.js"></script>
... (14 thẻ script)
```

**Cải tiến đột phá:** Sử dụng chuẩn **ES6 Native Modules** được hỗ trợ nguyên bản trên mọi trình duyệt hiện đại:
```html
<!-- CÁCH MỚI: Chỉ cần đúng 1 thẻ script duy nhất -->
<script type="module" src="app.js"></script>
```

### 2.2. Cơ chế nạp bất đồng bộ `defer` và Giải pháp Helper `onReady` an toàn
* Khi trình duyệt gặp thẻ `<script type="module">`, nó tự động tải script ở chế độ bất đồng bộ (`defer`).
* **Vấn đề kỹ thuật:** Nếu sử dụng `document.addEventListener('DOMContentLoaded', fn)`, trong nhiều trường hợp DOM đã hoàn thành quá trình nạp (`document.readyState === 'interactive'` hoặc `'complete'`) trước khi module kịp đăng ký listener. Hậu quả là sự kiện `DOMContentLoaded` không bao giờ được kích hoạt, làm đơ toàn bộ website.
* **Giải pháp Helper `onReady` độc quyền:**
```javascript
const onReady = (fn) => {
  if (typeof document === 'undefined') return;
  // Nếu DOM vẫn đang trong giai đoạn tải -> Đăng ký sự kiện
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    // Nếu DOM đã sẵn sàng -> Kích hoạt ngay lập tức!
    fn();
  }
};
```

### 2.3. Hai Entry Point độc lập
1. **`app.js` (Phân hệ Khách hàng):** Nạp toàn bộ 4 Model (`Product`, `Cart`, `Order`, `User`), 4 View (`Base`, `Product`, `Cart`, `User`) và các Controller nghiệp vụ của người mua hàng.
2. **`admin.js` (Phân hệ Quản trị):** Nạp chuyên biệt `AdminView` và `AdminController`, đảm bảo code quản trị không bị tải dư thừa trên giao diện người dùng, nâng cao tính bảo mật và tốc độ tải trang.

---

## 3. LOGIC BỘ ĐỊNH TUYẾN KÉP (DUAL-MODE ROUTER SPA / MPA)

### 3.1. Tư duy Front Controller Router
Mọi yêu cầu điều hướng trong hệ thống đều đi qua một "cổng kiểm soát duy nhất" (Single Entry Point) là hàm `goTo(viewName, params)` nằm trong [appController.js](file:///d:/Code/Javascript%20n%C3%A2ng%20cao/website-gaming-phone/controllers/appController.js).

```
                            [goTo(viewName, params)]
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
       Có thẻ #view-${viewName}?                     Không tìm thấy thẻ?
                │                                             │
      ┌─────────┴─────────┐                         ┌─────────┴─────────┐
      ▼                   ▼                         ▼                   ▼
  Ẩn panel cũ        Hiện panel mới              Xác định file:      Chuyển URL:
  .view-panel       .view-panel.active          `views/${view}.html` window.location.href
  (SPA Mode - 0s)   (Render dữ liệu)            (MPA Mode)          (kèm Query Params)
```

### 3.2. Cơ chế chuyển Panel không giật trang trên `index.html` (SPA Mode)
1. Tại trang `index.html`, tất cả các màn hình (Trang chủ, Cửa hàng, Chi tiết, Giỏ hàng, Thanh toán, Hồ sơ) đều tồn tại dưới dạng các thẻ `<section id="view-[tên]" class="view-panel">`.
2. Mặc định chỉ có `#view-home` có class `.active`.
3. Khi gọi `appCtrl.goTo('shop')`:
   ```javascript
   document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
   targetPanel.classList.add('active');
   triggerViewRender('shop', params); // Kích hoạt render dữ liệu tương ứng
   window.scrollTo({ top: 0, behavior: 'smooth' });
   ```
4. **Ưu điểm:** Tốc độ chuyển trang tức thì (0.01 giây), người dùng không cảm thấy độ trễ hay chớp giật màn hình trắng của trình duyệt.

### 3.3. Cơ chế điều hướng trang vật lý đa tệp HTML (MPA Mode)
Nếu người dùng đang đứng ở một trang vật lý độc lập (ví dụ mở thẳng file `views/shop.html` hoặc `views/admin.html`) và muốn chuyển sang trang khác:
```javascript
const inViews = window.location.pathname.toLowerCase().includes('/views/');
const prefix = inViews ? '' : 'views/';
const query = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';

// Chuyển trực tiếp tới file HTML tương ứng
if (viewName === 'home') window.location.href = `${inViews ? '../' : ''}index.html${query}`;
else window.location.href = `${prefix}${viewName}.html${query}`;
```

### 3.4. Xử lý Query Parameters & Hash Fragment
Hệ thống hỗ trợ cả 2 chuẩn URL thân thiện:
* Chuẩn Query: `index.html?view=shop&brand=asus`
* Chuẩn Hash Fragment: `index.html#/detail?id=prod_01`
* Hàm `handleRouteOnLoad()` sử dụng `URLSearchParams` để trích xuất sạch sẽ các tham số này và tự động gọi `goTo()` tương ứng khi người dùng F5 hoặc chia sẻ đường link cho bạn bè.

---

## 4. LOGIC QUẢN LÝ TRẠNG THÁI & LƯU TRỮ DỮ LIỆU (STATE MANAGEMENT)

### 4.1. Kỹ thuật Closure & Factory Functions bảo vệ dữ liệu Private
Trong JavaScript cổ điển, việc khai báo `var products = []` ở phạm vi toàn cục rất nguy hiểm vì bất kỳ file script nào hoặc người dùng mở F12 Console cũng có thể sửa đổi hoặc xóa sạch dữ liệu.  
Hệ thống SmartStore áp dụng chuẩn **Factory Function kết hợp Closure**:
```javascript
function createProductModel(apiUrl = 'http://localhost:3000') {
  // BIẾN PRIVATE TRONG CLOSURE: Bên ngoài không thể can thiệp trực tiếp!
  let products = [];
  let categories = [];
  let currentFilter = { categoryId: 'all', priceRange: 'all', search: '', sort: 'default' };

  // Các phương thức công khai được phép đọc/ghi có kiểm soát
  return {
    fetchAllProducts: async () => { ... },
    getFilteredProducts: () => { ... },
    getProductById: (id) => products.find(p => p.id == id)
  };
}
```

### 4.2. Ma trận 4 cấp độ lưu trữ dữ liệu

| Cấp Độ Lưu Trữ | Vị Trí Lưu | Đặc Tính Kỹ Thuật | Dữ Liệu Áp Dụng |
| :--- | :--- | :--- | :--- |
| **Cấp 1: RAM State** | Biến trong Closure Model | Tốc độ truy xuất nano-giây, mất đi khi F5. | Cache danh sách sản phẩm, danh mục, kết quả lọc hiện tại. |
| **Cấp 2: SessionStorage** | Bộ nhớ phiên trình duyệt | Tự động xóa khi đóng tab/trình duyệt. | Danh sách sản phẩm đang so sánh (`smartstore_compare`), phiên đăng nhập tạm thời của Admin (`smartstore_admin_logged`). |
| **Cấp 3: LocalStorage** | Bộ nhớ bền vững trình duyệt | Lưu vĩnh viễn trên máy khách cho đến khi xóa cache. | Giỏ hàng mua sắm (`smartstore_cart`), tài khoản người dùng đăng nhập (`smartstore_user`). |
| **Cấp 4: RESTful DB** | File `db.json` qua `json-server` | Cơ sở dữ liệu tập trung phía Backend, hỗ trợ CRUD chuẩn qua HTTP. | Danh sách sản phẩm, tài khoản người dùng, đơn đặt hàng, mã voucher. |

---

## 5. LOGIC NGHIỆP VỤ CỐT LÕI & ĐỘT PHÁ CÔNG NGHỆ

### 5.1. Logic Xác Thực Đăng Ký Thông Minh & Auto-Login (Smart Register UX)

```
                            [Khách gõ Email ở Form Đăng Ký]
                                           │
                                           ▼ (Sự kiện blur)
                           [userModel.checkIdentityByEmail()]
                                           │
                        ┌──────────────────┴──────────────────┐
                        ▼                                     ▼
                Email CHƯA tồn tại                     Email ĐÃ TỒN TẠI
                        │                                     │
                  Ẩn cảnh báo                           1. maskEmail(email) -> "hun****@gmail.com"
                  Cho phép đăng ký mới                  2. Hiện #reg-exist-alert
                                                        3. Nút [Đăng Nhập Ngay]
                                                              │
                                            ┌─────────────────┴─────────────────┐
                                            ▼                                   ▼
                               [Bấm "Đăng Nhập Ngay"]              [Cứ bấm "Đăng Ký Tài Khoản"]
                                            │                                   │
                               1. Chuyển tab Login                 Thử login với mật khẩu vừa nhập:
                               2. Giữ nguyên email                 userModel.login(email, pass)
                               3. focus() vào ô password                        │
                                                                   ┌────────────┴────────────┐
                                                                   ▼                         ▼
                                                              ĐÚNG MẬT KHẨU              SAI MẬT KHẨU
                                                                   │                         │
                                                            TỰ ĐỘNG ĐĂNG NHẬP          Báo lỗi & nhắc
                                                            (AUTO-LOGIN 100%)!        chuyển tab đăng nhập
```

* **Thuật toán Che mờ Email (Email Masking):**
  ```javascript
  const maskEmail = (email) => {
    if (!email || !email.includes('@')) return email || '';
    const [name, domain] = email.split('@');
    if (name.length <= 2) return `${name[0]}*@${domain}`;
    return `${name.slice(0, 3)}****@${domain}`;
  };
  // Ví dụ: hung.nv@gmail.com -> hun****@gmail.com
  ```
* **Auto-Login:** Giúp giảm tối đa tỉ lệ khách hàng bỏ rơi form vì quên rằng mình đã có tài khoản. Nếu khách nhập đúng mật khẩu, hệ thống nhận diện và đăng nhập ngay, nâng cao chỉ số chuyển đổi của website.

---

### 5.2. Logic Nhận Diện Khách Hàng Thân Thiết Khi Checkout (Smart Identity Resolution)
* **Vấn đề thực tế:** Khách hàng vãng lai thường ngại đăng nhập trước khi mua hàng.
* **Giải pháp thông minh:**
  1. Khi khách nhập email tại trang thanh toán và blur ra ngoài (`#checkout-email`).
  2. Model kiểm tra `checkIdentityByEmail(email)`.
  3. Nếu tìm thấy tài khoản cũ: Mở hộp thoại nhận diện thông minh, chào đúng tên khách hàng (ví dụ: *"Chào mừng anh Nguyễn Văn Hùng!"*).
  4. Khách chỉ cần nhập mật khẩu là toàn bộ Số điện thoại và Địa chỉ nhận hàng cũ tự động được điền vào form mà không cần gõ lại từ đầu.

---

### 5.3. Logic Động Cơ Mã Giảm Giá Đa Điều Kiện (Voucher Engine)
Thuật toán tính toán chiết khấu trong [cartModel.js](file:///d:/Code/Javascript%20n%C3%A2ng%20cao/website-gaming-phone/models/cartModel.js):
```javascript
// 1. Kiểm tra điều kiện đơn hàng tối thiểu
if (subtotal < voucher.minOrder) {
  return { valid: false, message: `Đơn hàng tối thiểu phải từ ${formatCurrency(voucher.minOrder)}!` };
}

// 2. Tính toán số tiền chiết khấu
let discount = 0;
if (voucher.type === 'percentage') {
  discount = Math.round((subtotal * voucher.value) / 100);
  // Chặn trần chiết khấu tối đa nếu có quy định
  if (voucher.maxDiscount && discount > voucher.maxDiscount) {
    discount = voucher.maxDiscount;
  }
} else if (voucher.type === 'fixed') {
  discount = voucher.value;
}

// 3. Đảm bảo số tiền giảm không vượt quá tổng giá trị đơn hàng
discount = Math.min(discount, subtotal);
```

---

### 5.4. Logic Máy Trạng Thái Đơn Hàng (FSM) & Tự Động Hoàn Kho Khi Hủy Đơn

```
[pending] ────► [processing] ────► [shipping] ────► [delivered] (BẤT BIẾN / KHÓA CHẶT)
    │                │                 │
    └────────────────┼─────────────────┴──────────► [cancelled]
                                                          │
                                                          ▼
                                            TỰ ĐỘNG CỘNG HOÀN TRẢ TỒN KHO:
                                            stock = stock + item.quantity
                                            sold  = sold  - item.quantity
```

* **Khóa Bất Biến Trạng Thái Đã Giao (`delivered`):** Một khi đơn hàng đã giao thành công và thu tiền, đây là trạng thái kết thúc (Terminal State). Hệ thống tự động vô hiệu hóa dropdown chỉnh sửa để đảm bảo không ai có thể sửa lùi đơn hàng, bảo vệ sự minh bạch tài chính.
* **Tự Động Hoàn Kho:** Khi đơn hàng bị chuyển sang `cancelled`, hệ thống tự động phát ra các lệnh `PATCH /products/:id` cộng trả lại số lượng từng món vào kho trong file `db.json`.

---

### 5.5. Logic Kiểm Soát Tồn Kho & Rào Chắn Biên Giỏ Hàng (Stock Bounds & Sanitize)
1. **Làm sạch dữ liệu đầu vào (Input Sanitization):**
   * Nếu người dùng nhập số âm (ví dụ: `-5`): Hệ thống tự động đưa về `1`.
   * Nếu người dùng nhập số thập phân (ví dụ: `2.7`): Hệ thống làm tròn `Math.floor()`.
2. **Kiểm tra trần tồn kho:**
   * Khi thêm vào giỏ: `currentInCart + addQty <= product.stock`.
   * Nếu vượt quá: Chặn lại, gán bằng chính `product.stock` và bắn thông báo cảnh báo cho khách.

---

### 5.6. Logic Động Cơ So Sánh Đối Đầu 10 Thông Số (Comparison Engine)
* **Giới hạn dung lượng:** Cho phép so sánh tối đa 3 máy (mức chuẩn giao diện desktop/mobile không bị vỡ bố cục).
* **Cơ chế Toggle:** Bấm lần 1 thêm vào danh sách, bấm lần 2 trên cùng sản phẩm sẽ tự động gỡ ra.
* **Lưu trữ Session:** Danh sách so sánh được lưu trong `sessionStorage`, khi đóng trình duyệt sẽ tự giải phóng bộ nhớ.

---

### 5.7. Logic Phân Quyền Quản Trị Viên (RBAC Auth Guard)
* **Rào chắn bảo mật:** Tại `adminController.js`:
  ```javascript
  function kiemTraDangNhapAdmin() {
    const user = userModel.getCurrentUser();
    if (!user || user.role !== 'admin') {
      // Ẩn Dashboard, bắt đăng nhập
      showScreen('admin-login-screen');
    } else {
      // Mở khóa Dashboard
      showScreen('admin-dashboard-screen');
      taiDuLieuAdmin();
    }
  }
  ```
* **Chặn xóa Admin:** Trong chức năng CRUD quản trị, hệ thống có rào chắn không cho phép bất kỳ ai bấm xóa tài khoản có `role === 'admin'`.

---

### 5.8. Logic Động Cơ In Hóa Đơn Trực Quan (Invoice Engine & Window Print)
1. Trích xuất thông tin đối tượng đơn hàng từ State (`items`, `customerInfo`, `voucherDiscount`, `totalAmount`).
2. Nhúng vào một cửa sổ mới qua `window.open('', '_blank')`.
3. Bơm mã CSS chuyên biệt `@media print`:
   * Ẩn thanh header, footer, background tối màu.
   * Chuyển toàn bộ phông chữ sang đen trắng độ tương phản cao.
   * Thiết lập ngắt trang thông minh `page-break-inside: avoid`.
4. Kích hoạt lệnh in phần cứng `window.print()`.

---

## 6. CẨM NANG BẢO VỆ & TRẢ LỜI CÁC CÂU HỎI HÓC BÚA CỦA GIẢNG VIÊN

### 🎯 Câu Hỏi 1: "Tại sao em chọn mô hình MVC bằng hàm (Functional) mà không dùng Class?"
* **Trả lời:**  
  *"Thưa thầy/cô, việc sử dụng hàm hiện đại (Functional Programming & Factory Functions) mang lại 3 ưu thế vượt trội so với Class truyền thống trong JavaScript:*
  1. *Tránh hoàn toàn lỗi mất ngữ cảnh của con trỏ `this` khi truyền hàm qua các Event Listener (`onClick`, `addEventListener`).*
  2. *Tận dụng sức mạnh của **Closure** để tạo ra các biến dữ liệu Private thực sự (như `products`, `users`), bên ngoài không thể can thiệp phá hỏng dữ liệu.*
  3. *Mã nguồn ngắn gọn, dễ debug và phù hợp với xu hướng phát triển hiện đại của hệ sinh thái JavaScript (giống như React chuyển dịch từ Class Components sang Function Components & Hooks).'*

---

### 🎯 Câu Hỏi 2: "Điều gì xảy ra khi 2 khách hàng cùng đặt mua chiếc điện thoại cuối cùng trong kho?"
* **Trả lời:**  
  *"Thưa thầy/cô, hệ thống của em có cơ chế bảo vệ tồn kho 2 lớp:*
  1. *Lớp 1 (Phía Client): Khi bấm thêm giỏ hàng, `cartModel` kiểm tra ngay với số lượng tồn kho `stock` hiện tại.*
  2. *Lớp 2 (Khi Xác Nhận Đặt Hàng): Trước khi lưu đơn hàng, hệ thống gửi request kiểm tra lại tồn kho thời gian thực từ endpoint `GET /products/:id`. Nếu số lượng tồn kho đã bị khách khác mua trước và giảm về 0, hệ thống lập tức thông báo: 'Rất tiếc, sản phẩm này vừa hết hàng!' và không cho phép tạo đơn, đảm bảo tính toàn vẹn của kho hàng.'*

---

### 🎯 Câu Hỏi 3: "Làm thế nào để website của em chống bị lộ mật khẩu người dùng?"
* **Trả lời:**  
  *"Thưa thầy/cô, hệ thống áp dụng kỹ thuật **Bóc Tách Mật Khẩu An Toàn (Safe Password Destructuring)**:*
  *Khi người dùng đăng nhập thành công từ server, hàm `saveUser` trong `userModel.js` sử dụng toán tử Rest của ES6:*
  ```javascript
  const { password: _pw, ...safeUser } = userFromServer;
  localStorage.setItem('smartstore_user', JSON.stringify(safeUser));
  ```
  *Thuộc tính `password` bị hủy bỏ ngay lập tức và không bao giờ được lưu vào `localStorage`. Dữ liệu lưu trên máy người dùng chỉ chứa tên, email, SĐT và vai trò, đảm bảo an toàn tuyệt đối.'*

---
*Tài liệu được biên soạn đồng bộ 100% với kiến trúc mã nguồn dự án SmartStore phục vụ buổi bảo vệ môn Lập trình JavaScript Nâng Cao.*
