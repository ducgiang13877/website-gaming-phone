/**
 * ============================================================================
 * DỰ ÁN: SMARTSTORE - THẾ GIỚI SMARTPHONE & GAMING PHONE
 * MODULE: js/user/main.js (GẮN SỰ KIỆN GIAO DIỆN & EXPORT CONTROLLER PHÍA USER)
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * Sinh viên thực hiện: Lương Văn Dũng
 * ============================================================================
 */

// ============================================================================
// 1. EXPORT CONTROLLERS RA WINDOW ĐỂ GIAO DIỆN HTML ONCLICK GỌI AN TOÀN
// ============================================================================

window.appNav = {
  goTo: chuyenTrang,
  updateHeader: capNhatNguoiDungHeader
};

window.cartModule = {
  add: themVaoGio,
  changeQty: doiSoLuongGioHang,
  remove: xoaKhoiGio,
  clear: xoaSachGioHang
};

window.detailModule = {
  getQty: laySoLuongChiTiet,
  changeQty: tangGiamSoLuongChiTiet,
  buyNow: muaNgay
};

window.authModule = {
  switchTab: (tab) => {
    const fLogin = document.getElementById('form-login');
    const fReg = document.getElementById('form-register');
    const tabLogin = document.getElementById('tab-btn-login');
    const tabReg = document.getElementById('tab-btn-register');

    if (tab === 'login') {
      if (fLogin) fLogin.style.display = 'block';
      if (fReg) fReg.style.display = 'none';
      if (tabLogin) tabLogin.classList.add('active');
      if (tabReg) tabReg.classList.remove('active');
    } else {
      if (fLogin) fLogin.style.display = 'none';
      if (fReg) fReg.style.display = 'block';
      if (tabLogin) tabLogin.classList.remove('active');
      if (tabReg) tabReg.classList.add('active');
    }
  },
  login: xuLyDangNhap,
  register: xuLyDangKy,
  logout: dangXuat
};

window.compareModule = {
  toggle: batTatSoSanh,
  clear: xoaSachSoSanh,
  scrollToTable: cuonDenBangSoSanh
};

window.shopModule = {
  filterByBrand: locTheoHang,
  filterByDemand: locTheoNhuCau,
  changePage: chuyenTrangCuaHang,
  resetFilters: datLaiBoLoc
};

// ============================================================================
// 2. KHỞI CHẠY KHI DOM SẴN SÀNG (DOM CONTENT LOADED)
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Tải dữ liệu danh mục & sản phẩm từ API
  taiDuLieu();

  // 2. Logo Header quay về Trang Chủ
  document.getElementById('header-logo-link')?.addEventListener('click', () => chuyenTrang('home'));

  // 3. Menu điều hướng Header SPA
  document.querySelectorAll('.main-nav .nav-item').forEach(nut => {
    nut.addEventListener('click', () => {
      const ten = nut.getAttribute('data-view');
      if (ten) chuyenTrang(ten);
    });
  });

  // 4. Tìm kiếm sản phẩm
  const searchInput = document.getElementById('shop-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      boLoc.tuKhoa = e.target.value;
      boLoc.trang = 1;
      hienThiCuaHang();
    });
  }

  // 5. Lọc giá & Sắp xếp
  document.getElementById('filter-price-range')?.addEventListener('change', (e) => {
    boLoc.khoangGia = e.target.value;
    boLoc.trang = 1;
    hienThiCuaHang();
  });
  document.getElementById('filter-sort-by')?.addEventListener('change', (e) => {
    boLoc.sapXep = e.target.value;
    hienThiCuaHang();
  });
  document.getElementById('btn-reset-filters')?.addEventListener('click', datLaiBoLoc);

  // 6. Xóa giỏ hàng
  document.getElementById('btn-clear-cart')?.addEventListener('click', xoaSachGioHang);

  // 7. Form Đặt hàng & Chặn tài khoản Quản trị viên (Admin)
  document.getElementById('checkout-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    xuLyDatHang();
  });

  document.getElementById('btn-submit-order')?.addEventListener('click', (e) => {
    if (nguoiDungHienTai && nguoiDungHienTai.role === 'admin') {
      e.preventDefault();
      hienThongBao('Tài khoản Quản trị viên không được phép đặt hàng thương mại. Vui lòng đăng xuất để dùng tài khoản Khách hàng!', 'error');
    }
  });

  // 8. Form Đăng nhập
  document.getElementById('form-login')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-password').value.trim();
    xuLyDangNhap(email, pass);
  });

  // 9. Form Đăng ký
  document.getElementById('form-register')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const ten = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const sdt = document.getElementById('reg-phone').value.trim();
    const diaChi = document.getElementById('reg-address').value.trim();
    const pass = document.getElementById('reg-password').value.trim();
    xuLyDangKy(ten, email, sdt, diaChi, pass);
  });

  // 10. Smart Identity Resolution
  document.getElementById('btn-smart-login-submit')?.addEventListener('click', xuLySmartLoginSubmit);
  document.getElementById('btn-smart-cancel')?.addEventListener('click', huySmartLogin);
  document.getElementById('smart-login-password')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') xuLySmartLoginSubmit();
  });

  // 11. Xóa bảng so sánh
  document.getElementById('btn-shop-clear-compare')?.addEventListener('click', xoaSachSoSanh);
  document.getElementById('btn-clear-compare')?.addEventListener('click', xoaSachSoSanh);

  // 12. Sửa hồ sơ cá nhân
  document.getElementById('profile-edit-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    luuSuaThongTinCaNhan();
  });

  // 13. Tra cứu đơn hàng
  document.getElementById('btn-tracking-search')?.addEventListener('click', xuLyTraCuu);
  document.getElementById('tracking-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') xuLyTraCuu();
  });

  // 14. Form liên hệ
  document.getElementById('contact-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    hienThongBao('Cảm ơn bạn đã gửi tin nhắn! SmartStore sẽ liên hệ lại sớm.', 'success');
    e.target.reset();
  });
});
