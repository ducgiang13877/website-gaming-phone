# THƯ MỤC LƯU TRỮ MÃ NGUỒN CŨ (LEGACY MONOLITHIC BACKUP)

Thư mục này chứa 2 file mã nguồn gộp nguyên bản ban đầu (`app.js` và `admin.js`) trước khi dự án được tái cấu trúc sang **Kiến Trúc Module Hóa Phân Tầng Hiện Đại**.

---

## 🚀 KIẾN TRÚC HIỆN TẠI ĐANG CHẠY CỦA DỰ ÁN
Toàn bộ hệ thống website SmartStore hiện tại đang nạp và thực thi trực tiếp 10 module độc lập:

1. **Phía Khách Hàng (`js/user/`)**:
   - `state.js`: Cấu hình API, State giỏ hàng, người dùng, bộ lọc và Router SPA 12 phân vùng.
   - `catalog.js`: Render danh mục sản phẩm, bộ lọc 8 hãng, tìm kiếm, Quick View và so sánh 10 thông số.
   - `cart.js`: Quản lý giỏ hàng, thanh toán, trừ kho tự động và chốt chặn an ninh Hard Block Admin.
   - `auth.js`: Đăng nhập, đăng ký, cơ chế Nhận diện Thông minh (Smart Identity Resolution) và điều hướng thanh toán.
   - `main.js`: Lắng nghe sự kiện DOMContentLoaded và export Controllers ra Window.

2. **Phía Quản Trị Viên (`js/admin/`)**:
   - `state.js`: Cấu hình URL, biến quản trị, Toast thông báo và Dashboard tính toán 4 chỉ số KPI.
   - `products.js`: CRUD sản phẩm phân trang, đọc ảnh Base64 FileReader và cảnh báo tồn kho sắp hết.
   - `customers.js`: Quản lý danh sách khách hàng, tự động tăng ID (+1) và bảo vệ an ninh tài khoản Admin.
   - `orders.js`: Quản lý đơn hàng, đổi trạng thái nhanh, tự động hoàn kho khi hủy và **Khóa bất biến (Immutable State Lock)** đơn đã giao.
   - `main.js`: Lắng nghe sự kiện trang Admin và export Controller `window.adminCtrl`.
