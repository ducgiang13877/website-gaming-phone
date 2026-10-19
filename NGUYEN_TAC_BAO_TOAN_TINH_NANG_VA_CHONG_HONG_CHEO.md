# 🛡️ NGUYÊN TẮC BẢO TOÀN TÍNH NĂNG & CHỐNG HỎNG CHÉO (ZERO-REGRESSION PRINCIPLE)
> **Dự án:** SmartStore - Thế Giới Smartphone & Gaming Phone  
> **Môn học:** Lập trình JavaScript Nâng Cao - FPT Polytechnic  
> **Sinh viên:** Lương Văn Dũng  
> **Tài liệu:** `NGUYEN_TAC_BAO_TOAN_TINH_NANG_VA_CHONG_HONG_CHEO.md`  
> **Hiệu lực:** BẮT BUỘC ÁP DỤNG TRONG MỌI PHIÊN LÀM VIỆC VÀ MỌI LẦN CẢI TIẾN CODE

---

## 📌 1. BỐI CẢNH & ĐỊNH NGHĨA "QUY TẮC 8/10"
Trong quá trình phát triển và hoàn thiện phần mềm:
* Giả định hệ thống đang có **10 chức năng**, trong đó **8 chức năng đã hoàn thiện, hoạt động đúng và ổn định 100%**.
* Khi người dùng yêu cầu chỉnh sửa, nâng cấp hoặc viết lại **2 chức năng còn lại**, **AI và lập trình viên BẮT BUỘC PHẢI BẢO ĐẢM 8 chức năng trước đó không bị ảnh hưởng, không bị lỗi chéo, không bị mất sự kiện hay vỡ giao diện**.
* **Mục tiêu:** Tỷ lệ lỗi hồi quy bằng 0 (**Zero-Regression**). Mọi sửa đổi chỉ được giới hạn chính xác trong phạm vi của chức năng được yêu cầu.

---

## ⚖️ 2. NĂM NGUYÊN TẮC VÀNG BẮT BUỘC KHI VIẾT VÀ CHỈNH SỬA CODE

### 1. Phân Tích Phạm Vi Ảnh Hưởng Trước Khi Sửa (Blast Radius Analysis)
* Trước khi sửa bất kỳ hàm, biến hay thẻ HTML nào, phải kiểm tra toàn bộ các file trong dự án xem có chức năng nào khác đang gọi đến nó hay không:
  - Kiểm tra các hàm trong `js/user/state.js`, `catalog.js`, `cart.js`, `auth.js`, `main.js`.
  - Kiểm tra các hàm trong `js/admin/state.js`, `products.js`, `orders.js`, `customers.js`, `main.js`.
* Nếu một hàm/biến được dùng chung bởi cả chức năng cần sửa và chức năng đang chạy tốt, **nghiêm cấm thay đổi cấu trúc dữ liệu trả về hoặc xóa bỏ tham số cũ**.

### 2. Bảo Toàn Tương Thích Ngược & Không Xóa Interface (Backward Compatibility)
* Tất cả các đối tượng điều phối Controller gắn trên `window` là **BẤT BIẾN VỀ TÊN GỌI**:
  - `window.appNav`: `goTo`, `updateHeader`, `closeModal`, `openModal`, `filterBrand`, `viewMyOrders`.
  - `window.cartModule`: `add`, `changeQty`, `remove`, `clear`, `applyVoucher`, `cancelVoucher`, `viewInvoice`, `printInvoice`.
  - `window.authModule`: `switchTab`, `login`, `register`, `logout`, `saveProfile`, `cancelOrder`.
  - `window.detailModule`: `getQty`, `changeQty`, `buyNow`.
  - `window.compareModule`: `toggle`, `clear`, `scrollToTable`.
  - `window.shopModule`: `filterByBrand`, `filterByDemand`, `changePage`, `resetFilters`.
  - `window.adminCtrl`: `closeModal`, `switchTab`, `openOrderDetail`, `printInvoice`, ...
* Khi thêm tính năng mới: **CHỈ THÊM MỚI (ADDITIVE CHANGES)**, tuyệt đối không xóa hoặc đổi tên các hàm đã có trong danh sách trên.

### 3. Bảo Toàn Cấu Trúc Trạng Thái Toàn Cục (State Schema Integrity)
* Các biến State trong RAM và LocalStorage/SessionStorage không được phép đổi kiểu dữ liệu đột ngột:
  - `gioHang`: Mảng các đối tượng chứa `{ id, name, price, image, quantity, stock }`.
  - `nguoiDungHienTai`: Chứa `{ id, name/fullName, email, phone, address, role }`.
  - `dsDonHang` & `donHangVuaDat`: Chứa `{ orderCode, items, totalAmount, status, ... }`.
* Nếu chức năng mới cần thêm trường dữ liệu (ví dụ: `voucherCode`, `discountAmount`), phải dùng giá trị mặc định (`null` hoặc `0`) để các chức năng cũ khi duyệt mảng không bị lỗi `undefined`.

### 4. Cô Lập Sự Kiện DOM & Ngăn Chặn Lỗi Mồ Côi (Event Listener Isolation)
* Mọi sự kiện DOM gắn trong `main.js` đều phải dùng toán tử kiểm tra an toàn `?.`:
  - Ví dụ: `document.getElementById('btn-example')?.addEventListener(...)`.
  - Điều này đảm bảo khi một trang hoặc một view không chứa phần tử đó, mã JavaScript vẫn chạy thông suốt, không sinh ra lỗi `TypeError: Cannot read properties of null` làm dừng toàn bộ luồng chạy của ứng dụng.
* Hỗ trợ cả 2 phương thức kích hoạt: Vừa gắn `onclick="window.cartModule...."` trên HTML vừa gắn qua `addEventListener` trong file JS để đảm bảo 100% người dùng bấm là phản hồi ngay lập tức.

### 5. Kiểm Thử Đối Chiếu Toàn Diện Trước Khi Đóng Gói (Regression Verification)
* Sau khi chỉnh sửa, bắt buộc thực hiện các bước xác thực:
  1. Chạy `node -c` trên toàn bộ 12 file `.js` của dự án để đảm bảo không có bất kỳ lỗi cú pháp nào.
  2. Kiểm tra tính hợp lệ của `db.json` bằng `JSON.parse`.
  3. Rà soát danh sách 8 chức năng cốt lõi đã chạy trước đó để chắc chắn không có chức năng nào bị ảnh hưởng gián tiếp.

---

## 🗺️ 3. BẢNG MA TRẬN LIÊN HỆ GIỮA CÁC CHỨC NĂNG TRONG SMARTSTORE

| Nhóm Chức Năng | Chức Năng Cụ Thể | Phụ Thuộc Vào State / DOM | Lưu Ý Đặc Biệt Khi Chỉnh Sửa |
| :--- | :--- | :--- | :--- |
| **Giỏ Hàng & Mua Hàng** | Thêm, sửa số lượng, xóa món | `gioHang`, `localStorage`, `renderRewardBar` | Không làm mất badge giỏ hàng trên Header |
| **Thanh Toán (Checkout)** | Form thông tin, Voucher, Đặt hàng | `gioHang`, `voucherDangApDung`, `nguoiDungHienTai` | Bảo toàn quyền chặn tài khoản Admin không được đặt hàng |
| **Hóa Đơn & Cảm Ơn** | Xem hóa đơn, In hóa đơn | `donHangVuaDat`, `#customer-invoice-modal` | Phải mở xem trước trên màn hình trước khi in |
| **Tra Cứu & Lịch Sử** | Xem đơn của tôi, Tra cứu mã đơn | `donHangVuaDat`, `nguoiDungHienTai`, `#view-profile`, `#view-tracking` | Tự động phân luồng: nếu đã đăng nhập thì mở Profile, nếu khách vãng lai thì mở Tracking tra cứu mã vừa đặt |
| **Quản Trị Đơn (Admin)** | Xem chi tiết, Đổi trạng thái, In hóa đơn | `donHangDangXem`, `#order-detail-modal` | Giữ nguyên quy tắc FSM khóa bất biến đơn `delivered` và tự động hoàn kho khi `cancelled` |

---
*Tài liệu này là kim chỉ nam bắt buộc phải tuân thủ trong suốt vòng đời bảo trì và phát triển của dự án SmartStore.*
