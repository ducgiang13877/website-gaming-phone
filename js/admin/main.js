/**
 * ============================================================================
 * DỰ ÁN: SMARTSTORE - THẾ GIỚI SMARTPHONE & GAMING PHONE
 * MODULE: js/admin/main.js (GẮN SỰ KIỆN GIAO DIỆN & EXPORT CONTROLLER PHÍA ADMIN)
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * Sinh viên thực hiện: Lương Văn Dũng
 * ============================================================================
 */

// ============================================================================
// 1. EXPORT CONTROLLER RA WINDOW.ADMINCTRL ĐỂ HTML ONCLICK GỌI AN TOÀN
// ============================================================================

window.adminCtrl = {
  closeModal: dongModal,
  switchTab: chuyenTabAdmin,
  chuyenTab: chuyenTabAdmin,
  setProductPage: chuyenTrangSanPhamAdmin,
  openAddProduct: moThemSanPham,
  openEditProduct: moSuaSanPham,
  saveProduct: luuSanPham,
  openAddCustomer: moThemKhachHang,
  openEditCustomer: moSuaKhachHang,
  saveCustomer: luuKhachHang,
  askDelete: xacNhanXoa,
  executeDelete: thucHienXoa,
  openOrderDetail: moXemDonHang,
  updateOrderStatus: capNhatTrangThaiDon,
  inlineUpdateOrderStatus: doiTrangThaiDonHangTrucTiep
};

// ============================================================================
// 2. KHỞI CHẠY KHI DOM SẴN SÀNG (DOM CONTENT LOADED)
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Kiểm tra trạng thái đăng nhập Admin
  kiemTraDangNhapAdmin();

  // 2. Form Đăng nhập Admin
  document.getElementById('admin-login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-login-email').value.trim();
    const pass = document.getElementById('admin-login-password').value.trim();
    dangNhapAdmin(email, pass);
  });

  // 3. Nút Đăng xuất Admin
  document.getElementById('btn-admin-logout')?.addEventListener('click', dangXuatAdmin);
  document.getElementById('admin-logout-btn')?.addEventListener('click', dangXuatAdmin);

  // 4. Chuyển đổi Tab điều hướng Dashboard (Products, Orders, Customers)
  document.querySelectorAll('.main-nav button[data-admin-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-admin-tab');
      chuyenTabAdmin(tabId);
    });
  });
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      chuyenTabAdmin(tabId);
    });
  });

  // 5. Tìm kiếm & Lọc Sản phẩm
  document.getElementById('admin-search-product')?.addEventListener('input', () => {
    trangHienTaiSP = 1;
    trangSanPham = 1;
    renderBangSanPham();
  });
  document.getElementById('admin-filter-category')?.addEventListener('change', () => {
    trangHienTaiSP = 1;
    trangSanPham = 1;
    renderBangSanPham();
  });
  document.getElementById('btn-open-add-product')?.addEventListener('click', moThemSanPham);

  // 6. Xử lý tải ảnh sản phẩm Base64 qua FileReader
  document.getElementById('prod-image-file')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        document.getElementById('prod-image-url').value = evt.target.result;
        const preview = document.getElementById('prod-image-preview');
        if (preview) {
          preview.src = evt.target.result;
          preview.style.display = 'block';
        }
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('prod-image-url')?.addEventListener('input', (e) => {
    const preview = document.getElementById('prod-image-preview');
    if (preview) {
      preview.src = e.target.value || 'https://picsum.photos/300/300';
      preview.style.display = 'block';
    }
  });

  // 7. Form Lưu Sản phẩm
  document.getElementById('product-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    luuSanPham();
  });

  // 8. Quản lý Khách hàng
  document.getElementById('admin-search-customer')?.addEventListener('input', renderBangKhachHang);
  document.getElementById('btn-open-add-customer')?.addEventListener('click', moThemKhachHang);
  document.getElementById('customer-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    luuKhachHang();
  });

  // 9. Quản lý Đơn hàng
  document.getElementById('admin-search-order')?.addEventListener('input', renderBangDonHang);
  document.getElementById('admin-filter-order-status')?.addEventListener('change', renderBangDonHang);
  document.getElementById('btn-save-order-status')?.addEventListener('click', capNhatTrangThaiDon);

  // 10. Xác nhận Xóa dữ liệu an toàn
  document.getElementById('btn-confirm-delete-action')?.addEventListener('click', thucHienXoa);
  document.getElementById('btn-confirm-delete')?.addEventListener('click', thucHienXoa);
});
