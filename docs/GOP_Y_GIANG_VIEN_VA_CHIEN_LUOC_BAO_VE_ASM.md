# 🎓 TÀI LIỆU CHIẾN LƯỢC BẢO VỆ ASM - GÓP Ý CỦA GIẢNG VIÊN & ĐỊNH HƯỚNG NÂNG CAO
> **Dự án:** SmartStore - Thế Giới Smartphone & Gaming Phone  
> **Môn học:** Lập trình JavaScript Nâng Cao (Advanced JavaScript) - FPT Polytechnic  
> **Sinh viên:** Lương Văn Dũng  
> **Tệp lưu trữ:** `GOP_Y_GIANG_VIEN_VA_CHIEN_LUOC_BAO_VE_ASM.md`  
> **Ngày khởi tạo:** 18/10/2026  
> **Trạng thái:** 🔴 KIM CHỈ NAM BẢO VỆ DỰ ÁN (BẮT BUỘC TUÂN THỦ)

---

## 📌 1. NGUYÊN VĂN GÓP Ý & NHẬN XÉT TỪ GIẢNG VIÊN

### 1.1. Về Mặt Giao Diện (UI/UX)
* **Nhận xét của Giảng viên:** *"Giao diện hiện tại tạm chấp nhận được, nhưng nhìn qua là biết sử dụng AI thiết kế là phần lớn, đang có ít ý tưởng sáng tạo và thiết kế riêng của con người."*
* **Định hướng giải quyết:**
  - Không dùng các layout mẫu nhàm chán, generic template của AI.
  - Thổi "hồn riêng" vào sản phẩm: Phối màu đặc trưng Cyberpunk/Gaming đậm chất cá tính, bổ sung các micro-interactions (hiệu ứng rê chuột, âm thanh click nhẹ, badge động, progress bar sinh động).
  - Tối ưu UX thực tế theo hành vi người mua hàng Việt Nam (chính sách bảo hành, cam kết seal máy, đổi trả 1 đổi 1, tư vấn trực quan).

### 1.2. Về Độ Sâu Chức Năng (Feature Complexity)
* **Nhận xét của Giảng viên:** *"Dự án đã đáp ứng đủ yêu cầu tối thiểu của môn học là Quản lý và CRUD cơ bản. Nhưng thay vì chỉ dừng lại ở mức tối thiểu, hãy làm thêm điều gì đó nâng cao hơn, mới hơn, hoặc khác biệt hơn nằm trong khả năng của bản thân để bứt phá điểm số cao."*
* **Định hướng giải quyết:**
  - Nâng cấp dự án từ mức "ASM qua môn" (Điểm 7-8) lên mức "Đồ án xuất sắc / Portfolio tuyển dụng" (Điểm 9.5 - 10).
  - Bổ sung các tính năng đột phá:
    1. **Hệ thống Mã giảm giá (Vouchers / Coupon Engine):** Nhập mã giảm giá tự động kiểm tra điều kiện giá trị đơn hàng, giảm theo % hoặc số tiền cố định, giới hạn lượt dùng.
    2. **Biểu đồ thống kê Analytics trực quan (Canvas / SVG Dashboard):** Vẽ biểu đồ doanh thu theo thương hiệu hoặc theo tháng phía Admin bằng Vanilla JS Canvas mà không cần thư viện cồng kềnh.
    3. **Tính năng "Sản phẩm vừa xem gần đây" (Recently Viewed Products):** Tự động ghi nhớ vào Session/LocalStorage khi khách xem chi tiết máy.
    4. **In hóa đơn bán hàng chuyên nghiệp (Print / PDF Invoice):** Admin hoặc khách hàng có thể bấm "In hóa đơn" để xuất phiếu giao hàng chuẩn hóa đơn bán lẻ.
    5. **Bộ lọc thông minh kết hợp Debounce Search & Sort đa tiêu chí:** Tối ưu hóa hiệu năng không giật lag.

### 1.3. Về Hình Thức Thi & Quy Cách Phỏng Vấn Bảo Vệ ASM
* **Tiết lộ của Giảng viên:**
  - Giảng viên cho phép sinh viên sử dụng AI thoải mái để làm bài tập và dự án.
  - **TUY NHIÊN:** Giảng viên sẽ **hỏi code, hỏi backend, hỏi logic thuật toán, hỏi luồng hoạt động từ Frontend đến Backend và chi tiết các hàm trong mã nguồn**.
* **Cấu trúc câu hỏi điển hình:**
  > *"Chức năng [X] này có luồng hoạt động như thế nào từ Frontend đến Backend?"*  
  > *"Giải thích cơ chế hoạt động của chức năng [Y]?"*
* **Yêu cầu chuẩn cho câu trả lời:**
  - Phải trình bày mạch lạc xuyên suốt từ **Giao diện (Frontend) -> Bắt sự kiện (Event) -> Phương thức truyền tải (HTTP Method & Payload) -> Tiếp nhận & Điều phối (Router/Controller) -> Xử lý dữ liệu & Lưu trữ (Model/DB) -> Phản hồi & Render giao diện (View)**.

---

## 🏛️ 2. KHUNG QUY CHUẨN 6 BƯỚC "TRẢ LỜI TỪ FRONTEND ĐẾN BACKEND"
> Sinh viên học thuộc và áp dụng công thức 6 bước này cho MỌI câu hỏi luồng của giảng viên:

```
[BƯỚC 1: FRONTEND TRIGGER] 
Người dùng click nút / nhập form (DOM Event: click, submit, change)
       │
       ▼
[BƯỚC 2: EVENT HANDLING & PAYLOAD PREPARATION] 
EventListener / Handler bắt sự kiện, validate input, đóng gói payload (JSON object, params)
       │
       ▼
[BƯỚC 3: HTTP DISPATCH (API REQUEST)] 
Gọi fetch() với phương thức (GET, POST, PUT, PATCH, DELETE) + Headers + Body đến Endpoint json-server
       │
       ▼
[BƯỚC 4: BACKEND / CONTROLLER DISPATCH] 
json-server (Mock RESTful API) tiếp nhận Request tại URI, Router phân luồng đúng Collection
       │
       ▼
[BƯỚC 5: BUSINESS LOGIC & DATABASE EXECUTION] 
Xử lý nghiệp vụ (Kiểm tra tồn kho, Hash ID, FSM trạng thái, hoàn kho, ghi đè file db.json)
       │
       ▼
[BƯỚC 6: RESPONSE & REACTIVE UI UPDATE] 
Server trả HTTP Status (200, 201, 204, 404, 500) + JSON. Phía Client nhận Promise, cập nhật State nội bộ, gọi hàm render() cập nhật DOM và bắn Toast thông báo.
```

---

## 📚 3. CẨM NANG TRẢ LỜI MẪU 5 CHỨC NĂNG CỐT LÕI (CHUẨN 10 ĐIỂM)

### 🎯 Câu Hỏi 1: "Luồng hoạt động của chức năng ĐẶT HÀNG & THANH TOÁN (Checkout Flow) từ FE đến BE?"
* **Bước 1 (Frontend Trigger):** Khách hàng tại trang `checkout` điền Form thông tin giao hàng (họ tên, SĐT, địa chỉ, phương thức thanh toán) và nhấn nút `[Xác Nhận Đặt Hàng]`.
* **Bước 2 (Event & Validation):** Sự kiện `submit` của `#checkout-form` kích hoạt hàm `xuLyDatHang(e)`. Hàm `preventDefault()` để ngăn tải lại trang, sau đó kiểm tra dữ liệu đầu vào (SĐT đủ 10 số, không để trống địa chỉ, giỏ hàng phải có ít nhất 1 sản phẩm).
* **Bước 3 (Đóng gói Payload):** Tạo mã đơn hàng duy nhất `orderCode` bằng công thức `#SMART-` + `Date.now()`. Đóng gói Object `donHangMoi` chứa: `orderCode`, `userId`, `customerInfo`, `items` (danh sách món kèm số lượng và giá), `totalAmount`, `status: "processing"`, `createdAt`.
* **Bước 4 (HTTP Request đến Backend):** 
  - Gọi `fetch('http://localhost:3000/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(donHangMoi) })`.
  - Đồng thời kích hoạt vòng lặp `Promise.all()` gọi các request `PATCH http://localhost:3000/products/:id` để trừ tồn kho (`stock`) và tăng số lượng đã bán (`sold`) của từng sản phẩm tương ứng trong database.
* **Bước 5 (Database Execution):** `json-server` nhận yêu cầu `POST`, tự động sinh khóa chính `id`, lưu bản ghi mới vào mảng `"orders"` trong file `db.json`, đồng thời cập nhật số lượng tồn kho mới vào collection `"products"`.
* **Bước 6 (Response & UI Update):** Nhận phản hồi HTTP Status `201 Created`. Client làm trống giỏ hàng `gioHang = []`, xóa cache `localStorage.removeItem('smartstore_cart')`, cập nhật badge giỏ hàng về `0`, gọi `chuyenTrang('thankyou')` để hiển thị hóa đơn chúc mừng và mã tra cứu cho khách.

---

### 🎯 Câu Hỏi 2: "Luồng hoạt động của chức năng THÊM VÀO GIỎ HÀNG (Add to Cart Flow)?"
* **Bước 1 (Frontend Trigger):** Người dùng bấm vào nút icon giỏ hàng `.btn-add-cart` trên thẻ card sản phẩm hoặc nút `[Thêm Vào Giỏ]` tại trang chi tiết / modal xem nhanh.
* **Bước 2 (Event & Parameter):** Lắng nghe sự kiện `click`, hàm `themVaoGio(idSP, soLuong = 1)` được gọi kèm tham số `id` của sản phẩm.
* **Bước 3 (Logic & Stock Verification):** 
  - Tìm sản phẩm trong mảng State `dsSanPham.find(item => item.id == idSP)`.
  - Kiểm tra điều kiện tồn kho: Nếu `stock <= 0` lập tức bắn thông báo lỗi và ngắt thực thi.
  - Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa:
    - Nếu đã có: Tăng thuộc tính `quantity` lên, nhưng chặn lại nếu tổng số lượng vượt quá `stock` tồn kho.
    - Nếu chưa có: Tạo object mới chứa `id, name, price, image, quantity, stock` rồi `push()` vào mảng `gioHang`.
* **Bước 4 (Client-side Persistence):** Do giỏ hàng phía Client được thiết kế theo tiêu chuẩn TMĐT (hỗ trợ khách vãng lai mua hàng không cần đăng nhập trước), dữ liệu giỏ được lưu trữ bền vững tại `localStorage.setItem('smartstore_cart', JSON.stringify(gioHang))`.
* **Bước 5 (UI Update & Toast Feedback):** Gọi hàm `capNhatBadge()` để tính tổng số lượng `reduce((tong, item) => tong + item.quantity, 0)` và hiển thị số màu đỏ trên icon Header, đồng thời gọi `hienThongBao("Đã thêm sản phẩm vào giỏ hàng", "success")`.

---

### 🎯 Câu Hỏi 3: "Luồng hoạt động của chức năng ADMIN ĐỔI TRẠNG THÁI ĐƠN HÀNG (FSM Status Flow)?"
* **Bước 1 (Frontend Trigger):** Admin chọn một giá trị mới từ thẻ `<select>` trạng thái ngay trên bảng đơn hàng (hoặc trong modal chi tiết đơn).
* **Bước 2 (Event Handling & FSM Guard):** Sự kiện `change` gọi hàm `doiTrangThaiDonHangTrucTiep(idDon, trangThaiMoi, selectEl)`.
  - **Rào chắn bất biến (Immutable Terminal State):** Nếu trạng thái cũ là `delivered` (Đã giao thành công), hệ thống chặn đứng lập tức: Đơn đã giao là đã chốt sổ tài chính và xuất kho, nghiêm cấm sửa đổi ngược lại để bảo vệ đối soát kế toán.
  - **Hộp thoại cảnh báo:** Hiển thị cảnh báo xác nhận rõ ràng tác vụ và hệ quả (hoàn kho nếu hủy đơn).
* **Bước 3 (HTTP Request):** 
  - Gọi `fetch('http://localhost:3000/orders/' + idDon, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: trangThaiMoi }) })`.
  - Nếu chuyển sang `cancelled` (Đã hủy): Hệ thống tự động duyệt qua các sản phẩm trong đơn, gọi `PATCH http://localhost:3000/products/:id` để **cộng hoàn trả lại số lượng tồn kho** tương ứng.
* **Bước 4 (Database Update):** `json-server` ghi đè trạng thái mới của đơn hàng và cập nhật lại kho trong `db.json`.
* **Bước 5 (Response & UI Re-render):** Khi nhận phản hồi HTTP `200 OK`, cập nhật lại phần tử trong mảng `dsDonHang`, tính toán lại 4 chỉ số KPI doanh thu `tinhToanKPI()`, và gọi `renderBangDonHang()` để cập nhật màu sắc badge trạng thái tương ứng.

---

### 🎯 Câu Hỏi 4: "Luồng hoạt động của chức năng XÓA DỮ LIỆU AN TOÀN 2 LỚP (Safe CRUD Delete Flow)?"
* **Bước 1 (Trigger Lớp 1):** Admin bấm nút icon thùng rác đỏ `.btn-danger` trên dòng sản phẩm, khách hàng hoặc đơn hàng.
* **Bước 2 (Chặn an ninh Lớp 1):** Hàm `xacNhanXoa(loai, id, ten)` được gọi:
  - Kiểm tra nếu `loai === 'customer'` và tài khoản là `admin` -> Lập tức chặn lại và báo lỗi (Bảo vệ không cho phép xóa tài khoản quản trị viên).
  - Kiểm tra nếu `loai === 'order'` và trạng thái là `delivered` -> Lập tức chặn lại (Không được xóa đơn đã giao thành công).
  - Nếu hợp lệ: Lưu tạm `{ loai, id, ten }` vào biến toàn cục `mucCanXoa`, hiển thị Modal xác nhận xóa an toàn.
* **Bước 3 (Trigger Lớp 2):** Admin nhấn nút `[Đồng Ý Xóa]` trên hộp thoại modal.
* **Bước 4 (HTTP Request):** Hàm `thucHienXoa()` kiểm tra an ninh lần 2, sau đó gửi request:
  - `fetch('http://localhost:3000/' + endpoint + '/' + id, { method: 'DELETE' })`.
* **Bước 5 (Database Execution):** `json-server` xóa vĩnh viễn record đó khỏi collection tương ứng trong file `db.json`.
* **Bước 6 (Response & State Synchronization):** Nhận HTTP Status `200/204`, Client lọc bỏ phần tử khỏi State (`dsSanPham = dsSanPham.filter(p => p.id != id)`), đóng modal, tính lại KPI và gọi hàm `render...()` cập nhật bảng dữ liệu mà không cần tải lại trang.

---

### 🎯 Câu Hỏi 5: "Luồng hoạt động của chức năng SO SÁNH 10 TIÊU CHÍ (Comparison Module)?"
* **Bước 1 (Frontend Trigger):** Người dùng bấm nút "So sánh" trên thẻ card sản phẩm hoặc trong trang chi tiết.
* **Bước 2 (Event & State Limit):** Hàm `batTatSoSanh(idSP)` kiểm tra mảng `dsSoSanh`:
  - Nếu ID đã có: Bỏ ra khỏi mảng (`splice`).
  - Nếu ID chưa có: Kiểm tra giới hạn (tối đa 3 máy). Nếu đã đủ 3 máy thì báo cảnh báo, nếu chưa thì `push` ID vào mảng.
* **Bước 3 (Persistence & Dock Update):** Lưu mảng ID vào `sessionStorage.setItem('smartstore_compare', ...)`. Cập nhật thanh Dock ghim nổi dưới đáy màn hình (`sticky-compare-dock`).
* **Bước 4 (Render Bảng Đối Chiếu 10 Thông Số):** Hàm `hienThiSoSanh()` lọc các sản phẩm tương ứng từ `dsSanPham`, sinh bảng so sánh động `<table>` đối chiếu 10 tiêu chí kỹ thuật (Màn hình, Chipset, RAM, ROM, Camera trước/sau, Pin, Sạc, Hệ điều hành, Tính năng đặc biệt).
* **Bước 5 (Đồng bộ UI toàn trang):** Gọi `capNhatNutSoSanhCard()` duyệt qua tất cả thẻ sản phẩm đang hiển thị để đổi màu nút thành xanh lá cây và chuyển text thành "Đã chọn", giúp người dùng nhận biết trực quan.

---

### 🎯 Câu Hỏi 6: "Luồng hoạt động của Hệ Thống Mã Giảm Giá (Voucher / Coupon Engine)?"
* **Bước 1 (Frontend Trigger):** Khách hàng nhập mã (ví dụ: `GAMING2026`) vào ô `#input-voucher-code` rồi bấm `[Áp Dụng]`, hoặc chạm nhanh vào một trong các Chip gợi ý (`#quick-voucher-chips`).
* **Bước 2 (Event Dispatching):** Sự kiện `click` hoặc `keypress (Enter)` kích hoạt hàm `window.cartModule.applyVoucher(code)`.
* **Bước 3 (HTTP Request & Fetch Collection):** Gửi yêu cầu `fetch('http://localhost:3000/vouchers')` bằng phương thức `GET` lên endpoint `/vouchers` trong `db.json`.
* **Bước 4 (Controller & Business Logic Validation):**
  - Kiểm tra mã voucher có tồn tại hay không.
  - Kiểm tra số lượt sử dụng còn lại: `usageLeft > 0`.
  - Kiểm tra điều kiện giá trị đơn hàng tối thiểu: `subtotal >= minOrder`.
  - Tính toán số tiền chiết khấu: Nếu là `%` thì tính `(subtotal * discount / 100)` và chặn trần `maxDiscount`; nếu là `fixed` thì trừ số tiền cố định.
  - Lưu voucher hợp lệ vào biến State: `voucherDangApDung`.
* **Bước 5 (Database Update khi Checkout):** Khi bấm `[Xác Nhận Đặt Hàng]`, gửi `POST /orders` kèm `voucherCode` và `discountAmount`, đồng thời gửi song song `PATCH /vouchers/:id` để trừ 1 lượt sử dụng: `{ usageLeft: usageLeft - 1 }`.
* **Bước 6 (UI Re-render):** Hiển thị dòng "Giảm giá Voucher" màu đỏ, trừ vào "Tổng thanh toán", hiển thị badge thông báo voucher kèm nút `[Gỡ bỏ]`, và bắn thông báo Toast chúc mừng.

---

### 🎯 Câu Hỏi 7: "Luồng hoạt động của Thanh Tiến Trình Quà Tặng Độc Quyền (Gamification Reward Bar)?"
* **Bước 1 (Frontend Trigger):** Khách hàng thêm sản phẩm vào giỏ hoặc tăng/giảm số lượng món trong giỏ hàng.
* **Bước 2 (Data Calculation):** Hàm `hienThiGioHang()` tính tổng tiền tạm tính: `tongTien = gioHang.reduce(...)`.
* **Bước 3 (Controller Logic):** Hàm `renderRewardBar(tongTien)` đối chiếu tổng tiền với 2 mốc doanh thu:
  - Dưới 10 triệu: Tính % thanh tiến trình từ 0 - 50%, thông báo số tiền còn thiếu để nhận Củ Sạc 67W trị giá 350k.
  - Từ 10 - 20 triệu: Tính % từ 50 - 100%, thông báo số tiền còn thiếu để nhận Combo Tai Nghe Gaming & Balo ROG trị giá 790k.
  - Từ 20 triệu trở lên: Đạt 100%, thông báo đã mở khóa trọn bộ Quà Tặng Gaming VIP.
* **Bước 4 (UI Animation):** Cập nhật thuộc tính `style="width: ...%"` của thanh tiến trình với transition mượt mà, đổi màu các cột mốc đã đạt sang xanh lá cây (`.achieved`).

---

### 🎯 Câu Hỏi 8: "Luồng hoạt động của Chức năng Xem & In Hóa Đơn Bán Lẻ (`View & Print Invoice`)?"
* **Bước 1 (Trigger Lớp 1 - Xem Trước Hóa Đơn On-screen):** Khách hàng nhấn nút `[Xem Hóa Đơn]` tại màn hình cảm ơn (#view-thankyou), hoặc Admin nhấn `[In Hóa Đơn]` tại Modal Chi Tiết Đơn Hàng.
* **Bước 2 (Event Dispatching):** Hàm `window.cartModule.viewInvoice()` hoặc `window.adminCtrl.printInvoice()` được kích hoạt.
* **Bước 3 (Data Extraction):** Trích xuất thông tin đối tượng đơn hàng từ State (`donHangVuaDat` hoặc `donHangDangXem`).
* **Bước 4 (Render Modal Xem Hóa Đơn Tại Chỗ):** Hàm `xemHoaDon(d)` biên dịch cấu trúc Hóa Đơn Bán Lẻ chuẩn TMĐT và chèn vào `#customer-invoice-body`, sau đó gọi `moModal('customer-invoice-modal')` để khách hàng xem chi tiết toàn bộ món hàng, chiết khấu voucher, tổng thanh toán và chính sách bảo hành ngay trên màn hình.
* **Bước 5 (Trigger Lớp 2 - Kích Hoạt Lệnh In):** Khách hàng nhấn nút `[In Hóa Đơn Này]` trong modal, kích hoạt hàm `inHoaDonDonHang(d)`.
* **Bước 6 (Native Print Dialog):** Cửa sổ in độc lập được mở (`window.open`), nạp bản in sạch và tự động gọi `window.print()` mở hộp thoại in của hệ điều hành.

---

## 🚀 4. DANH SÁCH TÍNH NĂNG NÂNG CAO ĐÃ TRIỂN KHAI THÀNH CÔNG (GÓI ĐIỂM 10)

| STT | Tính năng nâng cao | Trạng thái | Vị trí file mã nguồn | Luồng bảo vệ đồ án ASM |
| :---: | :--- | :---: | :--- | :---: |
| **1** | **Hệ thống Mã Giảm Giá Đa Điều Kiện (Vouchers Engine)** | ✅ Đã hoàn thành 100% | `db.json`, `index.html`, `js/user/cart.js`, `styles/style.css` | Câu Hỏi 6 |
| **2** | **Thanh Tiến Trình Quà Tặng Giỏ Hàng (Gamification Reward Bar)** | ✅ Đã hoàn thành 100% | `index.html`, `js/user/cart.js`, `styles/style.css` | Câu Hỏi 7 |
| **3** | **Xem & In Hóa Đơn Bán Lẻ Chuẩn TMĐT (View & Print Invoice)** | ✅ Đã hoàn thành 100% | `index.html`, `admin.html`, `js/user/cart.js`, `js/admin/orders.js` | Câu Hỏi 8 |
| **4** | **Hệ Thống So Sánh 10 Tiêu Chí Kỹ Thuật (Sticky Compare Dock)** | ✅ Đã hoàn thành 100% | `index.html`, `js/user/catalog.js`, `styles/style.css` | Câu Hỏi 5 |
| **5** | **Khóa Trạng Thái Đơn Bất Biến & Hoàn Kho Tự Động (FSM & Inventory)** | ✅ Đã hoàn thành 100% | `js/admin/orders.js` | Câu Hỏi 3 |

---

## 🛡️ 5. NGUYÊN TẮC BẢO TOÀN TÍNH NĂNG & CHỐNG HỎNG CHÉO (QUY TẮC 8/10)
> *Toàn bộ quy trình phát triển và chỉnh sửa mã nguồn được kiểm soát nghiêm ngặt theo tài liệu:  
> 🔗 [`NGUYEN_TAC_BAO_TOAN_TINH_NANG_VA_CHONG_HONG_CHEO.md`](file:///d:/Code/Javascript%20n%C3%A2ng%20cao/website-gaming-phone/NGUYEN_TAC_BAO_TOAN_TINH_NANG_VA_CHONG_HONG_CHEO.md)*  
> **Cam kết:** Khi cải tiến hoặc chỉnh sửa 2 tính năng, 8 tính năng đã chạy trước đó bắt buộc phải được giữ nguyên 100% tính toàn vẹn và ổn định.

---
*Tài liệu này được biên soạn độc quyền cho đồ án tốt nghiệp môn Lập trình JavaScript Nâng Cao của sinh viên Lương Văn Dũng.*

