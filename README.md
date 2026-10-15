# DỰ ÁN ASSIGNMENT - WEBSITE GAMING PHONE
**Môn học:** Lập trình JavaScript Nâng Cao (WEB2064)  
**Tên dự án:** Website Gaming Phone (SmartStore)  
**Nhóm thực hiện:** 3 thành viên  

---

## 👥 1. BẢNG PHÂN CHIA CÔNG VIỆC CHO NHÓM 3 NGƯỜI

| Thành viên | Vai trò & Nhiệm vụ chính | Các chức năng cụ thể phụ trách |
| :--- | :--- | :--- |
| **Thành viên 1** | **Front-End & Quản lý Danh mục/Sản phẩm (Client View)** | - Thiết kế cấu trúc cơ sở dữ liệu `categories` & `products` trong `db.json`.<br>- Xây dựng giao diện hiển thị danh sách điện thoại dạng lưới (Product Grid).<br>- Lập trình bộ lọc đa năng: Tìm kiếm theo tên, lọc theo thương hiệu, lọc theo 3 khoảng giá.<br>- Thiết kế giao diện chung và cấu trúc Responsive chuẩn. |
| **Thành viên 2** | **Logic Giỏ hàng, Thanh toán & Trừ Tồn Kho (Cart & Orders)** | - Lập trình chức năng thêm sản phẩm vào giỏ hàng từ trang chủ (kiểm tra tồn kho).<br>- Chức năng cập nhật số lượng (+ / -), xóa sản phẩm khỏi giỏ hàng.<br>- Tính toán tạm tính, phí vận chuyển và tổng tiền đơn hàng.<br>- Xử lý form đặt hàng gửi dữ liệu về bảng `orders` trên JSON-Server.<br>- **Tự động trừ số lượng tồn kho** (`PATCH /products/:id`) sau khi đặt hàng thành công.<br>- Màn hình cảm ơn hiển thị mã đơn hàng và thông tin khách mua. |
| **Thành viên 3** | **Quản trị Hệ thống & Báo cáo Thống kê (Admin Panel & KPIs)** | - Xây dựng trang Admin độc lập quản lý: Thêm, Sửa, Xóa sản phẩm và danh mục.<br>- Tích hợp chức năng chọn ảnh từ máy tính (`FileReader` Base64) có kiểm soát dung lượng.<br>- Ràng buộc dữ liệu khi xóa danh mục (ngăn chặn sản phẩm mồ côi).<br>- Quản lý danh sách khách hàng và lịch sử đơn hàng.<br>- Lập trình các thẻ thống kê tự động: Doanh thu thực tế, **tổng số sản phẩm đã bán**, số lượng tồn kho và tổng đơn hàng. |

---

## 🛠️ 2. CÔNG NGHỆ VÀ THƯ VIỆN SỬ DỤNG
- **Ngôn ngữ:** HTML5, CSS3 hiện đại, Vanilla JavaScript (ECMAScript 6+).
- **Kỹ thuật JS nâng cao áp dụng:**
  - `fetch()` API kết hợp `async/await` để giao tiếp bất đồng bộ với REST API.
  - `FileReader` API để đọc file ảnh từ máy tính chuyển thành chuỗi Base64.
  - `localStorage` để lưu trữ dữ liệu giỏ hàng và phiên đăng nhập trên trình duyệt.
  - Các phương thức mảng tiện ích: `map()`, `filter()`, `find()`, `some()`, `reduce()`, `forEach()`.
  - Cơ chế phòng chống tấn công XSS thông qua hàm mã hóa entities an toàn.
  - Fallback xử lý lỗi ảnh (`onerror`) chống vỡ giao diện khi mất kết nối CDN.
- **Backend / Mock API:** `json-server` (REST API cổng `3000` hỗ trợ đầy đủ GET, POST, PUT, PATCH, DELETE).
- **Icons:** Font Awesome 6.5.1.

---

## 📁 3. CẤU TRÚC THƯ MỤC DỰ ÁN
```
website-gaming-phone/
├── chay_server.bat     # Phím tắt 1-click khởi động JSON Server cổng 3000 & mở web
├── index.html          # Trang giao diện chính dành cho khách hàng (SPA)
├── admin.html          # Bảng điều khiển quản trị hệ thống độc lập (Admin Dashboard)
├── db.json             # Cơ sở dữ liệu mẫu cho JSON Server (products, categories, orders, users)
├── README.md           # Tài liệu hướng dẫn, mô tả chức năng & phân chia công việc
├── styles/
│   └── style.css       # Toàn bộ CSS (Variables, Flexbox, Grid, Responsive)
├── js/
│   ├── app.js          # Logic Client (REST API cổng 3000, giỏ hàng, đặt hàng, trừ tồn kho, auth)
│   └── admin.js        # Logic Admin (Thống kê KPI chuẩn, CRUD sản phẩm/danh mục, ảnh FileReader)
└── images/             # Thư mục lưu trữ hình ảnh sản phẩm
```

---

## 🚀 4. HƯỚNG DẪN CÀI ĐẶT VÀ CHẠY DỰ ÁN

### Bước 1: Khởi động Mock API (JSON Server cổng 3000)
- **Cách 1 (Nhanh nhất):** Nhấp đúp chuột vào file `chay_server.bat` để tự động chạy JSON Server kiêm Web Server tĩnh trên cổng 3000 và tự mở website tại `http://localhost:3000`.
- **Cách 2:** Mở cửa sổ dòng lệnh (Terminal / PowerShell) tại thư mục `website-gaming-phone` và chạy lệnh:
```bash
npx json-server -s . db.json -p 3000
```
*Lưu ý: Web và API sẽ sẵn sàng trực tiếp tại địa chỉ `http://localhost:3000` với các tài nguyên `products`, `categories`, `orders`, `users`.*

### Bước 2: Mở website
- Mở file `index.html` trực tiếp bằng trình duyệt web (hoặc sử dụng Live Server trên Visual Studio Code) để trải nghiệm giao diện khách hàng.
- Mở file `admin.html` để truy cập bảng điều khiển Quản trị viên (Tài khoản mặc định: `admin@smartstore.vn` / Mật khẩu: `admin`).
