# DỰ ÁN ASSIGNMENT - WEBSITE GAMING PHONE (SMARTSTORE)
**Môn học:** Lập trình JavaScript Nâng Cao (WEB2064)  
**Tên dự án:** Website Bán Điện Thoại Thông Minh Gaming (SmartStore)  
**Nhóm thực hiện:** 3 thành viên  

---

## 👥 1. BẢNG PHÂN CHIA CÔNG VIỆC CHO NHÓM 3 NGƯỜI

| Thành viên | Vai trò & Trách nhiệm chính | Các chức năng cụ thể phụ trách |
| :--- | :--- | :--- |
| **Thành viên 1** | **Front-End & Hiển thị Sản phẩm (Client Shop)** | - Thiết kế cấu trúc cơ sở dữ liệu `categories` & `products` trong `db.json`.<br>- Hiển thị danh sách điện thoại dạng lưới thẻ sản phẩm (Product Grid) gọn gàng, đẹp mắt.<br>- Phân trang sản phẩm mượt mà (8 sản phẩm / trang).<br>- Bộ lọc đa năng: Tìm kiếm theo tên (real-time input), lọc theo thương hiệu, lọc theo 3 khoảng giá.<br>- Modal xem chi tiết cấu hình điện thoại (ảnh, thương hiệu, giá, tồn kho, mô tả). |
| **Thành viên 2** | **Giỏ hàng, Thanh toán, Đơn hàng & User Profile** | - Logic giỏ hàng: Thêm vào giỏ, Mua ngay, tăng/giảm số lượng (kiểm tra tồn kho tối đa), xóa món hàng.<br>- Tính toán tạm tính, miễn phí vận chuyển và tổng tiền thanh toán.<br>- **Sinh mã đơn hàng chuẩn 11 ký tự**: Bắt đầu bằng `#` kết hợp chữ in hoa (A-Z) và số (0-9) ngẫu nhiên.<br>- Đặt hàng gửi lên `orders` trên JSON-Server và **tự động trừ số lượng tồn kho** (`PATCH /products/:id`).<br>- Màn hình cảm ơn và xem lịch sử đơn hàng của người dùng.<br>- Quản lý tài khoản: Đăng nhập, Đăng ký, Đổi mật khẩu và **chức năng User tự sửa thông tin cá nhân** (Họ tên, SĐT, Địa chỉ).<br>- **Tự động chuyển hướng Admin**: Đăng nhập tài khoản Admin tự động chuyển sang trang quản trị `admin.html`. |
| **Thành viên 3** | **Quản trị Hệ thống & Thống kê KPI (Admin Dashboard)** | - Xây dựng trang Admin độc lập quản lý toàn diện hệ thống theo kiến trúc SPA (Single Page App).<br>- **Cơ chế CRUD không reload trang**: Mọi thao tác Thêm, Sửa, Xóa sản phẩm/danh mục/đơn hàng đều cập nhật trực tiếp trên DOM, bảo toàn tab đang chọn bằng `sessionStorage`.<br>- **Thuật toán tự động tăng ID sản phẩm (+1)**: Tự động tính toán ID kế tiếp (`taoIdSanPhamMoi()`) khi thêm mới.<br>- Tích hợp tải ảnh sản phẩm từ máy tính (`FileReader` Base64) có xem trước.<br>- Quản lý danh mục thương hiệu (có kiểm tra ràng buộc toàn vẹn dữ liệu khi xóa).<br>- Quản lý đơn hàng: Cập nhật trực tiếp 4 trạng thái ("Đang xử lý", "Đang giao hàng", "Đã giao hàng", "Đã hủy"), xem Modal chi tiết các món hàng khách mua.<br>- Thống kê KPI tự động: Doanh thu thực tế, Tổng sản phẩm đã bán, Hàng tồn kho và Tổng đơn hàng.<br>- Thanh điều hướng chuyển đổi 2 chiều mượt mà giữa Shop (`index.html`) và Quản trị (`admin.html`). |

---

## 🛠️ 2. CÔNG NGHỆ VÀ KỸ THUẬT ÁP DỤNG
- **Ngôn ngữ:** HTML5, CSS3 hiện đại (Flexbox, CSS Grid, Responsive Design), Vanilla JavaScript (ES6+ chuẩn mực).
- **Kỹ thuật JavaScript nâng cao nổi bật:**
  - `fetch()` kết hợp `async/await` giao tiếp bất đồng bộ với REST API chuẩn RESTful.
  - Kiến trúc ứng dụng đơn trang (SPA): Điều hướng các view và thao tác CRUD mượt mà không reload trang.
  - `FileReader` API: Đọc tệp hình ảnh từ máy tính chuyển thành chuỗi Base64 lưu trực tiếp vào database.
  - `localStorage` & `sessionStorage`: Lưu giỏ hàng, thông tin phiên đăng nhập và ghi nhớ tab quản trị đang hoạt động.
  - Các hàm xử lý mảng nâng cao: `map()`, `filter()`, `find()`, `reduce()`, `some()`, `slice()`.
  - Hàm định dạng tiền tệ quốc tế `Intl.NumberFormat('vi-VN')`.
  - Cơ chế phòng vệ chống XSS bằng hàm mã hóa HTML entities.
  - Xử lý lỗi hình ảnh (`onerror`) tự động thế ảnh placeholder dự phòng chống vỡ giao diện.
- **Backend / Mock API:** `json-server` (Cung cấp đầy đủ REST endpoints GET, POST, PUT, PATCH, DELETE trên cổng `3000`).
- **Biểu tượng:** Font Awesome 6.5.1.

---

## 📁 3. CẤU TRÚC THƯ MỤC DỰ ÁN
```
website-gaming-phone/
├── chay_server.bat       # Phím tắt 1-click khởi động JSON Server cổng 3000 & mở ứng dụng
├── index.html            # Giao diện Cửa hàng dành cho Khách hàng (Client Shop)
├── admin.html            # Giao diện Bảng điều khiển Quản trị viên (Admin Dashboard)
├── db.json               # Cơ sở dữ liệu Mock API (products, categories, orders, users)
├── README.md             # Tài liệu mô tả chức năng, phân công & hướng dẫn chạy dự án
├── .vscode/
│   └── settings.json     # Cấu hình VS Code Live Server bỏ qua db.json (chống reload khi CRUD)
├── styles/
│   └── style.css         # Toàn bộ CSS phong cách Gaming hiện đại, Responsive
└── js/
    ├── app.js            # Logic Client (REST API, giỏ hàng, đặt hàng, phân trang, auth)
    └── admin.js          # Logic Admin (CRUD sản phẩm/danh mục/đơn hàng, KPI, SPA tab)
```

---

## 🚀 4. HƯỚNG DẪN CÀI ĐẶT VÀ KHỞI CHẠY DỰ ÁN

### Cách 1: Khởi động 1-Click với file `chay_server.bat` (Khuyên dùng nhất ⭐)
1. Nhấp đúp chuột vào file **`chay_server.bat`** trong thư mục `website-gaming-phone`.
2. Tệp batch sẽ tự động:
   - Giải phóng cổng `3000` nếu có tiến trình cũ đang chiếm giữ.
   - Khởi động máy chủ `json-server` phục vụ đồng thời cả REST API và Web tĩnh (`-s .`).
   - Tự động mở trình duyệt web tại địa chỉ: **`http://localhost:3000`**.
3. **Ưu điểm vượt trội:** Khi chạy trực tiếp qua `http://localhost:3000`, mọi thao tác CRUD (Thêm, Sửa, Xóa, Đổi trạng thái) đều diễn ra tức thì, **hoàn toàn không bị reload trang**.

### Cách 2: Khởi động bằng Terminal / PowerShell
Mở cửa sổ dòng lệnh tại thư mục `website-gaming-phone` và chạy lệnh sau:
```bash
npx json-server -s . db.json -p 3000
```
Sau đó truy cập trình duyệt tại:
- **Trang Cửa Hàng (Khách hàng):** `http://localhost:3000` (hoặc `http://localhost:3000/index.html`)
- **Trang Quản Trị (Admin):** `http://localhost:3000/admin.html`

> [!NOTE]
> **Lưu ý khi mở bằng tiện ích VS Code Live Server (cổng 5500):**  
> Dự án đã được cấu hình sẵn tệp `.vscode/settings.json` chứa khai báo `"liveServer.settings.ignoreFiles": ["**/db.json"]`. Nhờ đó, tiện ích Live Server sẽ không tự động reload trang mỗi khi JSON Server ghi dữ liệu vào tệp `db.json`.

---

## 🔐 5. TÀI KHOẢN KIỂM THỬ HỆ THỐNG

| Vai trò | Email đăng nhập | Mật khẩu | Quyền hạn & Chức năng |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@smartstore.vn` | `admin` | - Đăng nhập tại `index.html` tự động chuyển hướng sang `admin.html`.<br>- Toàn quyền quản trị CRUD sản phẩm, danh mục, đổi trạng thái đơn hàng, theo dõi báo cáo doanh thu KPI. |
| **Khách hàng (Customer)** | `hung@gmail.com` | `123456` | - Xem sản phẩm, lọc theo giá/hãng, thêm vào giỏ, đặt hàng, xem lịch sử đơn hàng.<br>- Tự chỉnh sửa thông tin cá nhân và đổi mật khẩu trong trang cá nhân. |
| **Khách vãng lai** | *(Không cần đăng nhập)* | *(Trống)* | - Xem sản phẩm, tìm kiếm, xem chi tiết và thêm vào giỏ hàng bình thường. |

---

## ✨ 6. CÁC ĐIỂM SÁNG NÂNG CAO ĐÃ HOÀN THIỆN
1. **Tự động tăng ID (+1) cho sản phẩm mới**: Hàm `taoIdSanPhamMoi()` tự động tính `Math.max()` của danh sách ID hiện có rồi cộng thêm 1, giúp mã sản phẩm tăng dần liên tục và chuẩn mực theo chuẩn REST API.
2. **Mã đơn hàng chuẩn 11 ký tự**: Hàm `taoMaDonHang()` tạo mã đơn hàng dạng `#XXXXXXXXXX` (1 ký tự `#` ở đầu + 10 ký tự gồm chữ IN HOA và số ngẫu nhiên), loại bỏ hoàn toàn ký tự đặc biệt.
3. **Cơ chế chuyển đổi 2 chiều Shop ↔ Admin mượt mà**:
   - Khi Admin ở `admin.html`: Nút `[🏪 Xem Cửa Hàng (Shop)]` mở trang shop ngay trên cùng cửa sổ.
   - Khi Admin ở `index.html`: Nút `[🛡️ Trang Quản Trị]` màu vàng hổ phách nổi bật trên thanh Header cho phép quay lại trang quản trị bất cứ lúc nào.
4. **Trải nghiệm Single Page Application (SPA)**: Các thao tác Thêm, Sửa, Xóa đều thao tác trực tiếp trên DOM mà không load lại trang, giữ nguyên vị trí cuộn và ghi nhớ tab đang làm việc bằng `sessionStorage`.
