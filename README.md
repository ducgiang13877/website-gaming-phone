# DỰ ÁN ASSIGNMENT - WEBSITE GAMING PHONE
**Môn học:** Lập trình JavaScript Nâng Cao (WEB2064)  
**Tên dự án:** Website Gaming Phone  
**Nhóm thực hiện:** 3 thành viên

---

## 👥 1. BẢNG PHÂN CHIA CÔNG VIỆC CHO NHÓM 3 NGƯỜI

| Thành viên | Vai trò & Nhiệm vụ chính | Các chức năng cụ thể phụ trách |
| :--- | :--- | :--- |
| **Thành viên 1** | **Front-End & Quản lý Danh mục/Sản phẩm (Client View)** | - Thiết kế cấu trúc cơ sở dữ liệu `categories` & `products` trong `db.json`.<br>- Xây dựng giao diện hiển thị danh sách điện thoại dạng lưới (Product Grid).<br>- Lập trình bộ lọc đa năng: Tìm kiếm theo tên, lọc theo thương hiệu (Apple, Samsung, Xiaomi, OPPO), lọc theo 3 khoảng giá.<br>- Thiết kế giao diện chung và cấu trúc Responsive chuẩn. |
| **Thành viên 2** | **Logic Giỏ hàng & Thanh toán (Cart & Orders)** | - Lập trình chức năng thêm sản phẩm vào giỏ hàng từ trang chủ.<br>- Chức năng cập nhật số lượng (+ / -), xóa sản phẩm khỏi giỏ hàng.<br>- Tính toán tạm tính, phí vận chuyển và tổng tiền đơn hàng.<br>- Xử lý form đặt hàng gửi dữ liệu về bảng `orders` trên JSON-Server.<br>- Màn hình cảm ơn hiển thị mã đơn hàng và thông tin khách mua. |
| **Thành viên 3** | **Quản trị Hệ thống (Admin Panel & Thống kê)** | - Xây dựng trang Admin quản lý: Thêm, Sửa, Xóa sản phẩm và danh mục.<br>- Tích hợp chức năng chọn ảnh từ máy tính (Choose File bằng FileReader chuyển sang Base64).<br>- Quản lý danh sách khách hàng (User Management theo chuẩn Lab 7.2).<br>- Lập trình các thẻ thống kê tự động: Doanh thu thực tế, số sản phẩm đã bán, số lượng tồn kho và tổng đơn hàng. |

---

## 🛠️ 2. CÔNG NGHỆ VÀ THƯ VIỆN SỬ DỤNG
- **Ngôn ngữ:** HTML5, CSS3 hiện đại, Vanilla JavaScript (ECMAScript 6+).
- **Kỹ thuật JS nâng cao áp dụng:**
  - `fetch()` API kết hợp `async/await` để giao tiếp bất đồng bộ với REST API.
  - `FileReader` API để đọc file ảnh từ máy tính chuyển thành chuỗi Base64.
  - `localStorage` để lưu trữ dữ liệu giỏ hàng trên trình duyệt khi tải lại trang.
  - Các phương thức mảng tiện ích: `map()`, `filter()`, `find()`, `forEach()`.
- **Backend / Mock API:** `json-server` (REST API hoàn chỉnh hỗ trợ đầy đủ GET, POST, PUT, DELETE).
- **Icons:** Font Awesome 6.5.1.

---

## 📁 3. CẤU TRÚC THƯ MỤC DỰ ÁN
```
ASM1/
├── index.html          # Trang giao diện chính (SPA chứa Shop, Giỏ hàng, Admin)
├── db.json             # Cơ sở dữ liệu mẫu cho JSON Server
├── README.md           # Tài liệu hướng dẫn & Phân chia công việc
├── styles/
│   └── style.css       # Toàn bộ CSS (tách biệt hoàn toàn, không có inline CSS)
├── js/
│   └── app.js          # Toàn bộ mã nguồn JavaScript nâng cao có chú thích chi tiết
└── images/             # Thư mục lưu trữ hình ảnh sản phẩm
```

---

## 🚀 4. HƯỚNG DẪN CÀI ĐẶT VÀ CHẠY DỰ ÁN

### Bước 1: Khởi động Mock API (JSON Server)
Mở cửa sổ dòng lệnh (Terminal / PowerShell) tại thư mục `ASM1` và chạy lệnh:
```bash
npx json-server db.json --port 3000
```
*Lưu ý: API sẽ sẵn sàng tại địa chỉ `http://localhost:3000` với các tài nguyên `products`, `categories`, `orders`, `users`.*

### Bước 2: Mở website
Mở file `index.html` trực tiếp bằng trình duyệt web (hoặc sử dụng Live Server trên Visual Studio Code).
