# 📱 SMARTSTORE - HỆ THỐNG BÁN ĐIỆN THOẠI THÔNG MINH & GAMING PHONE

> **ĐỒ ÁN ASSIGNMENT MÔN HỌC:** LẬP TRÌNH JAVASCRIPT NÂNG CAO  
> **ĐƠN VỊ ĐÀO TẠO:** TRƯỜNG CAO ĐẲNG FPT POLYTECHNIC  
> **CÔNG NGHỆ CHÍNH:** HTML5, CSS3 (Cyber Gaming System), JavaScript ES6+ (Async/Await, Fetch API, LocalStorage, SessionStorage, FileReader), RESTful API (json-server).

---

## 🌟 1. GIỚI THIỆU TỔNG QUAN HỆ THỐNG

**SmartStore** là giải pháp website thương mại điện tử chuyên biệt dành cho thị trường điện thoại thông minh và dòng gaming phone đỉnh cao. Hệ thống được xây dựng trên kiến trúc **Single Page Application (SPA)** mượt mà, kết hợp với bảng quản trị **Admin Dashboard** chuyên nghiệp và cơ sở dữ liệu giả lập chuẩn RESTful API qua `json-server`.

### 🚀 Điểm Nhấn Kiến Trúc & Công Nghệ
- **100% Thuần JavaScript ES6+**: Sử dụng `fetch`, `async/await`, `Intl.NumberFormat`, `FileReader API` để tải ảnh trực tiếp từ máy tính dạng Base64.
- **Kiến trúc SPA 12 Phân Vùng Giao Diện**: Chuyển trang tức thì không giật lag, giữ trọn vẹn trạng thái ứng dụng.
- **Chuẩn Hóa 10 Thông Số Kỹ Thuật (Specs)**: Xây dựng chuẩn theo thông số kỹ thuật của Thế Giới Di Động & CellphoneS phục vụ chức năng Xem Chi Tiết và So Sánh 3 Máy cùng lúc.
- **Tự Động Trừ Tồn Kho Khi Đặt Hàng**: Áp dụng phương thức `PATCH` lên RESTful API để trừ số lượng trong kho và cộng dồn số lượng máy đã bán.
- **Tự Tăng ID An Toàn (+1 ID)**: Thuật toán `Math.max(...ids) + 1` loại bỏ hoàn toàn nguy cơ trùng lặp mã sản phẩm/khách hàng.

---

## 🏷️ 2. QUY MÔ DỮ LIỆU ĐÃ TÍCH HỢP SẴN (`db.json`)

Hệ thống được nạp sẵn toàn bộ dữ liệu mẫu thực tế bao gồm **8 thương hiệu hàng đầu thế giới** và **40 sản phẩm chi tiết**:

| STT | Tên Thương Hiệu | ID Danh Mục | Số Lượng Máy | Dòng Máy Tiêu Biểu |
| :---: | :--- | :---: | :---: | :--- |
| **1** | **Apple (iPhone)** | `1` | 5 máy | iPhone 16 Pro Max, iPhone 16, iPhone 15 Pro, iPhone 15 Plus, iPhone 13 |
| **2** | **Samsung Galaxy** | `2` | 5 máy | Galaxy S25 Ultra, Z Fold6, Z Flip6, S24 FE, Galaxy A55 |
| **3** | **Xiaomi & POCO** | `3` | 5 máy | Xiaomi 15 Pro Leica, 14T Pro, Redmi Note 14 Pro+, POCO F6 Pro, POCO X6 Pro |
| **4** | **OPPO** | `4` | 5 máy | Find X8 Pro, Find N3 Flip, Reno 12 Pro, Reno 12F, OPPO A79 |
| **5** | **vivo** | `5` | 5 máy | vivo X100 Pro ZEISS, V40 5G, V40 Lite, vivo Y200, vivo Y100 |
| **6** | **realme** | `6` | 5 máy | realme GT 7 Pro, realme 13 Pro+, realme 12+, realme C67, realme C65 |
| **7** | **ASUS ROG Phone** | `7` | 5 máy | ROG Phone 9 Pro, ROG Phone 8 Pro, ROG Phone 8, ROG Phone 7 Ultimate, ROG 7 |
| **8** | **Nubia RedMagic** | `8` | 5 máy | RedMagic 10 Pro+, RedMagic 9S Pro, RedMagic 9 Pro, RedMagic 8S Pro, Nubia Neo 2 |

---

## 📑 3. DANH SÁCH 13 PHÂN VÙNG GIAO DIỆN & TÍNH NĂNG

### Phía Người Dùng (Client SPA - `index.html`)
1. **Trang Chủ (`#view-home`)**: Banner Cyber Gaming, 4 cam kết vàng, danh mục 8 hãng dạng pills cuộn ngang, khối Gaming Phone nổi bật, khối Điện thoại bán chạy nhất.
2. **Cửa Hàng (`#view-shop`)**: Thanh tìm kiếm đa năng (tên máy, chip, mô tả), bộ lọc 8 hãng, lọc 4 khoảng giá, sắp xếp theo giá & tên, phân trang 8 sản phẩm/trang.
3. **Xem Chi Tiết Sản Phẩm (`#view-detail`)**: Ảnh độ phân giải cao, giá bán, bảng cấu hình chi tiết 10 thông số (Màn hình, CPU, GPU, RAM, ROM, Camera sau, Camera trước, Pin, OS, Tính năng đặc biệt), nút tăng giảm số lượng, Thêm vào giỏ, Mua ngay, khối sản phẩm liên quan cùng hãng.
4. **Giỏ Hàng (`#view-cart`)**: Bảng danh sách sản phẩm, tăng giảm số lượng (tự khống chế không vượt quá tồn kho), xóa từng món, nút dọn sạch giỏ hàng, bảng tính tạm tính và miễn phí ship.
5. **Thanh Toán & Đặt Hàng (`#view-checkout`)**: Nhập thông tin giao hàng (tự động điền nếu đã đăng nhập), 3 hình thức thanh toán (COD, VietQR, Ví điện tử), xác thực form chặt chẽ.
6. **Màn Hình Cảm Ơn (`#view-thankyou`)**: Sinh mã đơn hàng chuẩn mực 11 ký tự (Ví dụ `#DH883921094`), tiến trình trạng thái 4 bước (Đã đặt -> Chuẩn bị -> Đang giao -> Hoàn tất).
7. **Đăng Nhập & Đăng Ký (`#view-auth`)**: Chuyển đổi tab linh hoạt, đăng ký lưu vào CSDL, đăng nhập tự động nhận diện quyền Quản trị viên để chuyển hướng.
8. **Thông Tin Cá Nhân (`#view-profile`)**: Khách hàng tự do chỉnh sửa Họ tên, SĐT, Địa chỉ, Mật khẩu mới, xem lại lịch sử các đơn hàng đã đặt kèm trạng thái.
9. **Tra Cứu Đơn Hàng (`#view-tracking`)**: Tra cứu tức thì theo mã đơn hàng hoặc số điện thoại, hiển thị sơ đồ timeline tiến độ giao hàng.
10. **So Sánh Điện Thoại (`#view-compare`)**: Cho phép chọn tối đa 3 mẫu máy bất kỳ từ cửa hàng để đưa lên bàn cân đối chiếu trực tiếp 10 thông số kỹ thuật.
11. **Giới Thiệu (`#view-about`)**: Giới thiệu sứ mệnh, hệ sinh thái gaming phone và thông tin đồ án.
12. **Liên Hệ (`#view-contact`)**: Thông tin trụ sở, showroom, số hotline và form gửi tin nhắn có phản hồi thông báo toast.

### Phía Quản Trị Viên (Admin Dashboard - `admin.html`)
13. **Trang Quản Trị Admin**:
    - **Bảo mật truy cập**: Chặn người dùng thường, chỉ tài khoản có role `admin` mới được vào.
    - **4 Thẻ Thống Kê KPI Tự Động**: Doanh thu thực tế, Tổng số máy đã bán, Tổng số máy tồn kho, Tổng số đơn hàng.
    - **Quản lý Sản phẩm (CRUD)**: Thêm mới (+1 ID tự tăng), chọn ảnh từ máy qua `FileReader` sang Base64 hoặc dán URL, nhập đủ 10 thông số kỹ thuật, chỉnh sửa, xóa có hộp thoại xác nhận.
    - **Quản lý Khách hàng (CRUD)**: Xem danh sách, thêm khách hàng mới, sửa thông tin, phân quyền Admin/User, xóa tài khoản.
    - **Quản lý Đơn hàng**: Xem danh sách đơn, xem chi tiết từng đơn hàng (các sản phẩm đặt mua, số lượng, địa chỉ giao), cập nhật 4 trạng thái (Chờ xử lý, Đang giao, Đã giao, Đã hủy).

---

## ⚡ 4. HƯỚNG DẪN KHỞI CHẠY HỆ THỐNG

### Cách 1: Khởi Chạy Tự Động 1-Click (Khuyên Dùng)
Chỉ cần nhấp đúp chuột vào tệp:
```plaintext
chay_server.bat
```
*Tệp batch sẽ tự động quét và giải phóng cổng 3000 nếu đang bị ứng dụng khác chiếm giữ, sau đó tự động mở trình duyệt web và khởi động máy chủ API.*

### Cách 2: Khởi Chạy Bằng Dòng Lệnh Terminal / PowerShell
Tại thư mục dự án `website-gaming-phone`, thực hiện lệnh:
```bash
npx json-server -s . db.json -p 3000
```
Sau đó truy cập:
- **Giao diện Cửa hàng (Client):** [http://localhost:3000/index.html](http://localhost:3000/index.html)
- **Giao diện Quản trị viên (Admin):** [http://localhost:3000/admin.html](http://localhost:3000/admin.html)

---

## 🔑 5. DANH SÁCH TÀI KHOẢN TRẢI NGHIỆM DEMO

| Vai Trò | Email Đăng Nhập | Mật Khẩu | Quyền Hạn |
| :--- | :--- | :---: | :--- |
| **Quản Trị Viên (Admin)** | `admin@smartstore.vn` | `admin` | Truy cập toàn bộ Admin Dashboard, CRUD Sản phẩm, Khách hàng, Đơn hàng. |
| **Khách Hàng (User 1)** | `hung.nv@gmail.com` | `123` | Mua hàng, sửa thông tin cá nhân, tra cứu đơn, so sánh điện thoại. |
| **Khách Hàng (User 2)** | `mai.tran@gmail.com` | `123` | Mua hàng, sửa thông tin cá nhân, kiểm tra lịch sử mua hàng. |

---

## 👥 6. BẢNG PHÂN CHIA CÔNG VIỆC NHÓM (CHUẨN BÁO CÁO ASM)

| Thành Viên | Nhiệm Vụ Đảm Nhận | Tỷ Lệ Hoàn Thành |
| :--- | :--- | :---: |
| **Thành viên 1** (Trưởng nhóm) | Thiết kế CSDL `db.json` (40 sản phẩm, 8 danh mục), viết logic Admin Dashboard (`admin.html` + `js/admin.js`), thuật toán +1 ID và FileReader Base64. | **100%** |
| **Thành viên 2** | Xây dựng giao diện CSS toàn cục (`styles/style.css`), thiết kế bố cục Client SPA (`index.html`), phân vùng Giỏ hàng, Đặt hàng, Màn hình Cảm ơn. | **100%** |
| **Thành viên 3** | Viết mã nguồn Client logic (`js/app.js`), tích hợp Fetch API, bộ lọc 8 hãng, tìm kiếm, phân trang, thuật toán trừ kho và bảng so sánh 10 thông số. | **100%** |

---
*Bản quyền © 2026 SmartStore. Dự án Assignment môn Lập trình JavaScript Nâng Cao - FPT Polytechnic.*
