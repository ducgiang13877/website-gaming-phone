/**
 * ============================================================================
 * DỰ ÁN: SMARTSTORE - THẾ GIỚI SMARTPHONE & GAMING PHONE
 * MODULE: js/user/catalog.js (CATALOG SẢN PHẨM, BỘ LỌC ĐA TIÊU CHÍ & SO SÁNH 10 TIÊU CHÍ)
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * Sinh viên thực hiện: Lương Văn Dũng
 * ============================================================================
 */

// ============================================================================
// 1. NGHIỆP VỤ CATALOG SẢN PHẨM & BỘ LỌC ĐA TIÊU CHÍ (CATALOG & FILTER ENGINE)
// ============================================================================

/**
 * 🎯 Mục đích: Sinh mã HTML component thẻ sản phẩm chuẩn UI/UX kèm các Spec Chips và trạng thái So Sánh
 * ⚙️ Hàm có sẵn: Array.prototype.find, Array.prototype.some, Template Literals
 */
function taoTheSanPhamHTML(sp) {
  const tonKho = (sp.stock !== undefined && sp.stock !== null) ? Number(sp.stock) : (Number(sp.quantity) || 15);
  const hetHang = tonKho <= 0;
  const hang = dsDanhMuc.find(h => h.id == (sp.categoryId || sp.cate_id));
  const tenHang = hang ? hang.name : (sp.brand || 'Chính Hãng');
  const thongSo = sp.specs || {};
  const dangSoSanh = dsSoSanh.some(id => String(id) === String(sp.id));

  // Tính phần trăm giảm giá nếu có giá gốc
  let badgeGiamGiaHTML = '';
  if (sp.originalPrice && sp.originalPrice > sp.price) {
    const ptGiam = Math.round(((sp.originalPrice - sp.price) / sp.originalPrice) * 100);
    badgeGiamGiaHTML = `<span class="badge badge-sale">Giảm ${ptGiam}%</span>`;
  } else if (sp.isHot) {
    badgeGiamGiaHTML = `<span class="badge badge-hot">Hot 🔥</span>`;
  }

  return `
    <div class="product-card" data-id="${sp.id}">
      <div class="card-badge-box">
        ${badgeGiamGiaHTML}
        ${hetHang ? '<span class="badge badge-out-stock">Hết hàng</span>' : ''}
      </div>

      <div class="card-img-box" onclick="chuyenTrang('detail', { id: '${sp.id}' })">
        <img src="${sp.image}" alt="${sp.name}" loading="lazy" onerror="this.onerror=null; this.src='https://picsum.photos/300/300';">
      </div>

      <div class="card-body">
        <div class="card-brand">${tenHang}</div>
        <h3 class="card-title" onclick="chuyenTrang('detail', { id: '${sp.id}' })" title="${sp.name}">
          ${sp.name}
        </h3>

        <!-- Cụm Specs Chips rút gọn -->
        <div class="card-specs-chips">
          ${thongSo.ram ? `<span class="spec-chip"><i class="fa-solid fa-microchip"></i> ${thongSo.ram}</span>` : ''}
          ${(thongSo.battery || thongSo.pin) ? `<span class="spec-chip"><i class="fa-solid fa-battery-three-quarters"></i> ${(thongSo.battery || thongSo.pin).split(',')[0]}</span>` : ''}
          ${(thongSo.cpu || thongSo.chip) ? `<span class="spec-chip"><i class="fa-solid fa-bolt"></i> ${(thongSo.cpu || thongSo.chip).split(' ')[0]}</span>` : ''}
        </div>

        <div class="card-price-row">
          <div class="card-current-price">${dinhDangTien(sp.price)}</div>
          ${sp.originalPrice && sp.originalPrice > sp.price ? `
            <div class="card-original-price">${dinhDangTien(sp.originalPrice)}</div>
          ` : ''}
        </div>

        <div class="card-stock-row">
          <span class="stock-indicator ${hetHang ? 'out' : 'in'}">
            <i class="fa-solid fa-circle" style="font-size: 8px;"></i>
            ${hetHang ? 'Tạm hết hàng' : `Còn sẵn ${tonKho} máy`}
          </span>
          <span class="sold-count">Đã bán ${sp.sold || 0}</span>
        </div>

        <!-- Cụm nút thao tác -->
        <div class="card-actions-row">
          <button class="btn-quickview" onclick="moXemNhanh('${sp.id}')" title="Xem nhanh cấu hình">
            <i class="fa-solid fa-eye"></i>
          </button>

          <button class="btn-compare-card ${dangSoSanh ? 'active' : ''}" 
                  id="btn-compare-card-${sp.id}"
                  onclick="batTatSoSanh('${sp.id}')" 
                  title="${dangSoSanh ? 'Đang so sánh - Bấm để bỏ' : 'Thêm vào so sánh'}">
            <i class="fa-solid ${dangSoSanh ? 'fa-check' : 'fa-code-compare'}"></i>
            <span>${dangSoSanh ? 'Đã chọn' : 'So sánh'}</span>
          </button>

          <button class="btn-add-cart" 
                  onclick="themVaoGio('${sp.id}')" 
                  ${hetHang ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''} 
                  title="Thêm vào giỏ hàng">
            <i class="fa-solid fa-cart-plus"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * 🎯 Mục đích: Render dữ liệu trang chủ (8 Thương Hiệu, 4 Siêu Phẩm Gaming, Flash Sale & Top 8 Bán Chạy)
 * ⚙️ Hàm có sẵn: Array.prototype.slice, Array.prototype.map, Array.prototype.join, Array.prototype.filter
 */
function hienThiTrangChu() {
  // 1. Dải 8 Thương Hiệu Hàng Đầu (Home Category Pills)
  const homePills = document.getElementById('home-category-pills');
  if (homePills && dsDanhMuc && dsDanhMuc.length > 0) {
    homePills.innerHTML = dsDanhMuc.map(hang => `
      <button class="brand-pill-btn" onclick="locTheoHang('${hang.id}')" title="Xem sản phẩm ${hang.name}">
        <i class="${hang.icon || 'fa-solid fa-mobile-screen'}"></i>
        <span>${hang.name}</span>
      </button>
    `).join('');
  }

  // 2. Siêu phẩm Chiến Binh Gaming Phone (Top 4 Gaming Phone: ROG & RedMagic)
  const gridGaming = document.getElementById('home-gaming-products');
  if (gridGaming && dsSanPham && dsSanPham.length > 0) {
    const spGaming = dsSanPham
      .filter(sp => (sp.categoryId == '7' || sp.categoryId == '8' || sp.cate_id == '7' || sp.cate_id == '8' || (sp.brand && (sp.brand.includes('ROG') || sp.brand.includes('RedMagic')))))
      .slice(0, 4);
    gridGaming.innerHTML = spGaming.map(sp => taoTheSanPhamHTML(sp)).join('');
  }

  // 3. Top 8 điện thoại bán chạy nhất / mới nhất
  const gridMoiNhat = document.getElementById('home-featured-products') || document.getElementById('home-latest-grid');
  if (gridMoiNhat && dsSanPham && dsSanPham.length > 0) {
    const spMoiNhat = dsSanPham.slice(0, 8);
    gridMoiNhat.innerHTML = spMoiNhat.map(sp => taoTheSanPhamHTML(sp)).join('');
  }

  // 4. Sản phẩm Flash Sale
  hienThiFlashSale();

  // 5. Cập nhật icon so sánh trên các thẻ card
  capNhatNutSoSanhCard();
}

/**
 * 🎯 Mục đích: Khởi tạo đồng hồ đếm ngược Flash Sale thời gian thực
 */
function khoiTaoDemNguocFlashSale() {
  const boxGio = document.getElementById('flash-timer-hours') || document.getElementById('flash-sale-hours');
  const boxPhut = document.getElementById('flash-timer-minutes') || document.getElementById('flash-sale-minutes');
  const boxGiay = document.getElementById('flash-timer-seconds') || document.getElementById('flash-sale-seconds');
  if (!boxGio || !boxPhut || !boxGiay) return;

  let thoiGianConLai = 4 * 3600 + 45 * 60 + 20; // 4 giờ 45 phút 20 giây

  setInterval(() => {
    if (thoiGianConLai <= 0) {
      thoiGianConLai = 24 * 3600;
    }
    thoiGianConLai--;

    const gio = Math.floor(thoiGianConLai / 3600);
    const phut = Math.floor((thoiGianConLai % 3600) / 60);
    const giay = thoiGianConLai % 60;

    boxGio.textContent = String(gio).padStart(2, '0');
    boxPhut.textContent = String(phut).padStart(2, '0');
    boxGiay.textContent = String(giay).padStart(2, '0');
  }, 1000);
}

function hienThiFlashSale() {
  const gridFlashSale = document.getElementById('home-flash-sale-products') || document.getElementById('home-flash-sale-grid');
  if (!gridFlashSale) return;

  const spSale = dsSanPham.filter(sp => sp.originalPrice && sp.originalPrice > sp.price).slice(0, 4);
  gridFlashSale.innerHTML = spSale.map(sp => taoTheSanPhamHTML(sp)).join('');
}

/**
 * 🎯 Mục đích: Mở modal xem nhanh cấu hình sản phẩm mà không cần chuyển trang
 */
function moXemNhanh(idSP) {
  const sp = dsSanPham.find(item => item.id == idSP);
  if (!sp) return;

  const modalBody = document.getElementById('quick-view-body') || document.getElementById('quickview-modal-body');
  if (!modalBody) return;

  const hang = dsDanhMuc.find(h => h.id == (sp.categoryId || sp.cate_id));
  const tenHang = hang ? hang.name : (sp.brand || 'Chính Hãng');
  const thongSo = sp.specs || {};
  const tonKho = (sp.stock !== undefined && sp.stock !== null) ? Number(sp.stock) : (Number(sp.quantity) || 15);

  modalBody.innerHTML = `
    <div class="quickview-wrapper">
      <div class="quickview-img-col">
        <img src="${sp.image}" alt="${sp.name}" onerror="this.onerror=null; this.src='https://picsum.photos/300/300';">
      </div>
      <div class="quickview-info-col">
        <div style="font-size: 12px; font-weight: 700; color: var(--primary); text-transform: uppercase;">${tenHang}</div>
        <h2 style="font-size: 1.4rem; font-weight: 800; margin: 6px 0 10px;">${sp.name}</h2>
        <div style="font-size: 1.5rem; font-weight: 800; color: var(--accent); margin-bottom: 12px;">
          ${dinhDangTien(sp.price)}
          ${sp.originalPrice ? `<span style="font-size: 14px; text-decoration: line-through; color: var(--text-muted); margin-left: 8px;">${dinhDangTien(sp.originalPrice)}</span>` : ''}
        </div>

        <div style="background: var(--bg); padding: 12px; border-radius: var(--radius-md); font-size: 13px; line-height: 1.7; margin-bottom: 16px;">
          <div><strong>Màn hình:</strong> ${thongSo.screen || 'AMOLED 120Hz'}</div>
          <div><strong>Vi xử lý:</strong> ${thongSo.cpu || thongSo.chip || 'Snapdragon 8 Elite'}</div>
          <div><strong>RAM / ROM:</strong> ${thongSo.ram || '12GB'} / ${thongSo.rom || '256GB'}</div>
          <div><strong>Camera:</strong> ${thongSo.rear_camera || thongSo.camSau || '50MP OIS'}</div>
          <div><strong>Pin & Sạc:</strong> ${thongSo.battery || thongSo.pin || '5000mAh'}</div>
          <div><strong>Trạng thái:</strong> <span style="color: ${tonKho > 0 ? 'var(--success)' : 'var(--accent)'}; font-weight: 700;">${tonKho > 0 ? `Còn sẵn ${tonKho} máy` : 'Tạm hết hàng'}</span></div>
        </div>

        <div style="display: flex; gap: 10px;">
          <button class="btn-primary" onclick="themVaoGio('${sp.id}'); dongModal('quick-view-modal'); dongModal('quickview-modal');" ${tonKho <= 0 ? 'disabled style="opacity: 0.5;"' : ''}>
            <i class="fa-solid fa-cart-plus"></i> Thêm Vào Giỏ
          </button>
          <button class="btn-secondary" onclick="dongModal('quick-view-modal'); dongModal('quickview-modal'); chuyenTrang('detail', { id: '${sp.id}' });">
            Chi Tiết Đầy Đủ
          </button>
        </div>
      </div>
    </div>
  `;

  moModal('quick-view-modal');
  moModal('quickview-modal');
}

/**
 * 🎯 Mục đích: Lọc sản phẩm đa tiêu chí trong trang Cửa Hàng (Catalog Page)
 * ⚙️ Hàm có sẵn: Array.prototype.filter, Array.prototype.sort, Array.prototype.slice, Math.ceil
 */
function hienThiCuaHang() {
  let ketQua = [...dsSanPham];

  // 1. Lọc theo hãng
  if (boLoc.hang !== 'all') {
    ketQua = ketQua.filter(sp => (sp.categoryId || sp.cate_id) == boLoc.hang);
  }

  // 2. Lọc theo nhu cầu (gaming, flagship, pin, gia-re)
  if (boLoc.nhuCau !== 'all') {
    if (boLoc.nhuCau === 'gaming') {
      ketQua = ketQua.filter(sp => {
        const ten = sp.name.toLowerCase();
        const chip = (sp.specs?.chip || '').toLowerCase();
        return ten.includes('rog') || ten.includes('redmagic') || ten.includes('gaming') || chip.includes('snapdragon 8') || chip.includes('dimensity 9');
      });
    } else if (boLoc.nhuCau === 'flagship') {
      ketQua = ketQua.filter(sp => sp.price >= 20000000);
    } else if (boLoc.nhuCau === 'pin') {
      ketQua = ketQua.filter(sp => {
        const pinStr = sp.specs?.pin || '';
        const dungLuong = parseInt(pinStr) || 0;
        return dungLuong >= 5500;
      });
    } else if (boLoc.nhuCau === 'gia-re') {
      ketQua = ketQua.filter(sp => sp.price < 10000000);
    }
  }

  // 3. Lọc theo từ khóa tìm kiếm
  if (boLoc.tuKhoa.trim() !== '') {
    const kw = boLoc.tuKhoa.toLowerCase().trim();
    ketQua = ketQua.filter(sp => {
      const ten = sp.name.toLowerCase();
      const chip = (sp.specs?.chip || '').toLowerCase();
      return ten.includes(kw) || chip.includes(kw);
    });
  }

  // 4. Lọc theo mức giá
  if (boLoc.khoangGia !== 'all') {
    if (boLoc.khoangGia === 'duoi-10tr') ketQua = ketQua.filter(sp => sp.price < 10000000);
    else if (boLoc.khoangGia === '10-20tr') ketQua = ketQua.filter(sp => sp.price >= 10000000 && sp.price <= 20000000);
    else if (boLoc.khoangGia === '20-30tr') ketQua = ketQua.filter(sp => sp.price > 20000000 && sp.price <= 30000000);
    else if (boLoc.khoangGia === 'tren-30tr') ketQua = ketQua.filter(sp => sp.price > 30000000);
  }

  // 5. Sắp xếp sản phẩm
  if (boLoc.sapXep === 'price-asc') ketQua.sort((a, b) => a.price - b.price);
  else if (boLoc.sapXep === 'price-desc') ketQua.sort((a, b) => b.price - a.price);
  else if (boLoc.sapXep === 'name-asc') ketQua.sort((a, b) => a.name.localeCompare(b.name));
  else if (boLoc.sapXep === 'sold-desc') ketQua.sort((a, b) => (b.sold || 0) - (a.sold || 0));

  // Cập nhật số lượng tìm thấy
  const countEl = document.getElementById('shop-result-count') || document.getElementById('shop-total-count');
  if (countEl) countEl.innerHTML = `Đang hiển thị <strong>${ketQua.length}</strong> sản phẩm`;

  // 6. Phân trang 8 sản phẩm / trang
  const tongSoTrang = Math.ceil(ketQua.length / SO_SP_MOI_TRANG) || 1;
  if (boLoc.trang > tongSoTrang) boLoc.trang = 1;

  const batDau = (boLoc.trang - 1) * SO_SP_MOI_TRANG;
  const spTrangHienTai = ketQua.slice(batDau, batDau + SO_SP_MOI_TRANG);

  // Render lưới sản phẩm
  const grid = document.getElementById('shop-product-grid');
  if (grid) {
    if (spTrangHienTai.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0;">
          <i class="fa-solid fa-magnifying-glass" style="font-size: 36px; color: #94a3b8; margin-bottom: 10px;"></i>
          <h3>Không tìm thấy sản phẩm phù hợp!</h3>
          <p style="color: #64748b; font-size: 13px; margin-top: 6px;">Vui lòng thử lại với từ khóa hoặc mức giá khác.</p>
        </div>
      `;
    } else {
      grid.innerHTML = spTrangHienTai.map(sp => taoTheSanPhamHTML(sp)).join('');
    }
  }

  // Render các nút số trang
  const paginBox = document.getElementById('shop-pagination');
  if (paginBox) {
    if (tongSoTrang <= 1) {
      paginBox.innerHTML = '';
    } else {
      let html = '';
      for (let i = 1; i <= tongSoTrang; i++) {
        html += `
          <button class="page-btn ${boLoc.trang === i ? 'active' : ''}" onclick="chuyenTrangCuaHang(${i})">
            ${i}
          </button>
        `;
      }
      paginBox.innerHTML = html;
    }
  }

  // Cập nhật bảng so sánh tích hợp trong Cửa Hàng
  hienThiSoSanh();
  capNhatNutSoSanhCard();
}

function locTheoHang(maHang) {
  boLoc.hang = maHang;
  boLoc.trang = 1;

  const pills = document.querySelectorAll('#shop-brand-pills .brand-pill-btn');
  pills.forEach(btn => {
    const isAct = (maHang === 'all' && btn.textContent.includes('Tất Cả')) || (btn.getAttribute('onclick')?.includes(`'${maHang}'`));
    btn.classList.toggle('active', !!isAct);
  });

  chuyenTrang('shop');
  hienThiCuaHang();
}

function locTheoNhuCau(nhuCau) {
  boLoc.nhuCau = nhuCau;
  boLoc.trang = 1;

  const chipBtns = document.querySelectorAll('#shop-demand-filter-chips .filter-chip-btn');
  chipBtns.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-demand') === nhuCau);
  });

  hienThiCuaHang();
}

function chuyenTrangCuaHang(trangMoi) {
  boLoc.trang = trangMoi;
  hienThiCuaHang();
  window.scrollTo({ top: 100, behavior: 'smooth' });
}

function datLaiBoLoc() {
  boLoc = { hang: 'all', nhuCau: 'all', tuKhoa: '', khoangGia: 'all', sapXep: 'default', trang: 1 };
  const sInput = document.getElementById('shop-search-input');
  const pFilter = document.getElementById('filter-price-range');
  const sFilter = document.getElementById('filter-sort-by');
  if (sInput) sInput.value = '';
  if (pFilter) pFilter.value = 'all';
  if (sFilter) sFilter.value = 'default';

  const chipBtns = document.querySelectorAll('#shop-demand-filter-chips .filter-chip-btn');
  chipBtns.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-demand') === 'all');
  });

  hienThiCuaHang();
  hienThongBao('Đã đặt lại tất cả bộ lọc', 'info');
}

// ============================================================================
// 2. CHI TIẾT SẢN PHẨM & BẢNG 10 THÔNG SỐ CHUẨN THẾ GIỚI DI ĐỘNG
// ============================================================================

/**
 * 🎯 Mục đích: Hiển thị trang chi tiết sản phẩm và bảng 10 thông số kỹ thuật chuẩn
 */
function hienThiChiTiet(idSP) {
  const sp = dsSanPham.find(item => item.id == idSP);
  if (!sp) {
    hienThongBao('Không tìm thấy sản phẩm!', 'error');
    chuyenTrang('shop');
    return;
  }

  const breadcrumb = document.getElementById('detail-breadcrumb-name');
  if (breadcrumb) breadcrumb.textContent = sp.name;

  const hang = dsDanhMuc.find(h => h.id == (sp.categoryId || sp.cate_id));
  const tenHang = hang ? hang.name : (sp.brand || 'Chính Hãng');
  const ts = sp.specs || {};
  const tonKho = (sp.stock !== undefined && sp.stock !== null) ? Number(sp.stock) : (Number(sp.quantity) || 15);
  const hetHang = tonKho <= 0;
  const dangSoSanh = dsSoSanh.some(id => String(id) === String(sp.id));

  const container = document.getElementById('product-detail-container');
  if (container) {
    container.innerHTML = `
      <div class="detail-gallery-box">
        <img src="${sp.image}" alt="${sp.name}" onerror="this.onerror=null; this.src='https://picsum.photos/300/300';">
      </div>

      <div class="detail-info-col">
        <div style="font-size: 13px; font-weight: 700; color: var(--primary); text-transform: uppercase;">
          Thương hiệu: ${tenHang}
        </div>
        <h1>${sp.name}</h1>
        <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">
          <span>Đã bán: <strong>${sp.sold || 0} máy</strong></span> • 
          <span style="color: ${hetHang ? 'var(--accent)' : 'var(--success)'}; font-weight: 700;">
            ${hetHang ? 'Hết hàng' : `Còn sẵn ${tonKho} máy tại kho`}
          </span>
        </div>

        <div class="detail-price-box">
          <div class="detail-current-price">${dinhDangTien(sp.price)}</div>
          ${sp.originalPrice && sp.originalPrice > sp.price ? `
            <div class="detail-original-price">${dinhDangTien(sp.originalPrice)}</div>
          ` : ''}
        </div>

        <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 18px;">
          ${sp.detail || sp.description || 'Sản phẩm chính hãng, đầy đủ phụ kiện, bảo hành 12 tháng 1 đổi 1 tại các trung tâm bảo hành toàn quốc.'}
        </p>

        <!-- Bộ chọn số lượng -->
        <div class="detail-qty-control">
          <span>Số lượng:</span>
          <div class="qty-btn-group">
            <button type="button" onclick="tangGiamSoLuongChiTiet(-1)" title="Giảm số lượng">-</button>
            <input type="number" id="detail-qty-input" value="1" min="1" max="${tonKho}" readonly>
            <button type="button" onclick="tangGiamSoLuongChiTiet(1)" title="Tăng số lượng">+</button>
          </div>
        </div>

        <!-- Cụm nút hành động -->
        <div style="display: flex; gap: 12px; margin-top: 20px; flex-wrap: wrap;">
          <button class="btn-primary" onclick="themVaoGio('${sp.id}', laySoLuongChiTiet())" ${hetHang ? 'disabled style="opacity: 0.5;"' : ''}>
            <i class="fa-solid fa-cart-plus"></i> Thêm Vào Giỏ
          </button>
          <button class="btn-success btn-buy-now" onclick="muaNgay('${sp.id}')" ${hetHang ? 'disabled style="opacity: 0.5;"' : ''}>
            <i class="fa-solid fa-bolt"></i> Mua Ngay
          </button>
          <button class="btn-secondary" onclick="batTatSoSanh('${sp.id}')">
            <i class="fa-solid ${dangSoSanh ? 'fa-check' : 'fa-code-compare'}"></i>
            <span>${dangSoSanh ? 'Đang So Sánh' : 'So Sánh Máy'}</span>
          </button>
        </div>

        <!-- BẢNG 10 THÔNG SỐ KỸ THUẬT CHUẨN THẾ GIỚI DI ĐỘNG -->
        <div style="margin-top: 32px; border-top: 1px solid var(--border); padding-top: 22px;">
          <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 12px; color: var(--text);">
            <i class="fa-solid fa-list-check" style="color: var(--primary);"></i> Thông Số Kỹ Thuật Chi Tiết (10 Tiêu Chí)
          </h3>
          <table class="specs-table">
            <tbody>
              <tr><td class="spec-name">1. Màn hình</td><td class="spec-val"><strong>${ts.screen || 'AMOLED 120Hz'}</strong></td></tr>
              <tr><td class="spec-name">2. Vi xử lý (CPU)</td><td class="spec-val"><strong>${ts.cpu || ts.chip || 'Snapdragon 8 Elite'}</strong></td></tr>
              <tr><td class="spec-name">3. Đồ họa (GPU)</td><td class="spec-val">${ts.gpu || 'Adreno GPU'}</td></tr>
              <tr><td class="spec-name">4. RAM</td><td class="spec-val"><strong>${ts.ram || '12GB LPDDR5X'}</strong></td></tr>
              <tr><td class="spec-name">5. Bộ nhớ trong (ROM)</td><td class="spec-val"><strong>${ts.rom || '256GB UFS 4.0'}</strong></td></tr>
              <tr><td class="spec-name">6. Camera sau</td><td class="spec-val">${ts.rear_camera || ts.camSau || '50MP + 50MP + 64MP OIS'}</td></tr>
              <tr><td class="spec-name">7. Camera trước</td><td class="spec-val">${ts.front_camera || ts.camTruoc || '32MP HDR'}</td></tr>
              <tr><td class="spec-name">8. Pin & Sạc</td><td class="spec-val"><strong>${ts.battery || (ts.pin ? `${ts.pin} - ${ts.charge || ''}` : '5500mAh 65W')}</strong></td></tr>
              <tr><td class="spec-name">9. Hệ điều hành</td><td class="spec-val">${ts.os || 'Android 14'}</td></tr>
              <tr><td class="spec-name">10. Tính năng đặc biệt</td><td class="spec-val">${ts.special || 'Tản nhiệt buồng hơi, Nút trigger Gaming, Kháng nước IP68'}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // Render sản phẩm cùng thương hiệu
  const relatedGrid = document.getElementById('detail-related-products') || document.getElementById('detail-related-grid');
  if (relatedGrid) {
    const spLienQuan = dsSanPham
      .filter(p => (p.categoryId || p.cate_id) == (sp.categoryId || sp.cate_id) && p.id != sp.id)
      .slice(0, 4);
    relatedGrid.innerHTML = spLienQuan.map(p => taoTheSanPhamHTML(p)).join('');
  }
}

function laySoLuongChiTiet() {
  const el = document.getElementById('detail-qty-input');
  return el ? (parseInt(el.value) || 1) : 1;
}

function tangGiamSoLuongChiTiet(soThayDoi) {
  const el = document.getElementById('detail-qty-input');
  if (!el) return;
  let val = (parseInt(el.value) || 1) + soThayDoi;
  const maxVal = parseInt(el.max) || 99;
  if (val < 1) val = 1;
  if (val > maxVal) {
    val = maxVal;
    hienThongBao(`Kho chỉ còn ${maxVal} máy!`, 'warning');
  }
  el.value = val;
}

function muaNgay(idSP) {
  const sl = laySoLuongChiTiet();
  themVaoGio(idSP, sl);
  chuyenTrang('checkout');
}

// ============================================================================
// 3. NGHIỆP VỤ SO SÁNH 10 THÔNG SỐ (COMPARISON MODULE & STICKY DOCK)
// ============================================================================

/**
 * 🎯 Mục đích: Bật/Tắt một sản phẩm vào danh sách so sánh (Tối đa 3 máy)
 * ⚙️ Hàm có sẵn: Array.prototype.findIndex, Array.prototype.splice, Array.prototype.push
 */
function batTatSoSanh(idSP) {
  const idStr = String(idSP);
  const index = dsSoSanh.findIndex(id => String(id) === idStr);

  if (index > -1) {
    dsSoSanh.splice(index, 1);
    hienThongBao('Đã bỏ so sánh sản phẩm', 'info');
  } else {
    if (dsSoSanh.length >= 3) {
      hienThongBao('Chỉ có thể so sánh tối đa 3 máy cùng lúc!', 'warning');
      return;
    }
    dsSoSanh.push(idStr);
    hienThongBao('Đã thêm vào danh sách so sánh trong Cửa Hàng', 'success');
  }

  sessionStorage.setItem('smartstore_compare', JSON.stringify(dsSoSanh));
  capNhatBadge();
  hienThiSoSanh();
  capNhatNutSoSanhCard();
}

/**
 * 🎯 Mục đích: Đồng bộ icon và màu sắc nút So Sánh trên tất cả các thẻ sản phẩm đang hiển thị
 */
function capNhatNutSoSanhCard() {
  dsSanPham.forEach(sp => {
    const nut = document.getElementById(`btn-compare-card-${sp.id}`);
    if (nut) {
      const dangChon = dsSoSanh.some(id => String(id) === String(sp.id));
      nut.classList.toggle('active', dangChon);
      const icon = nut.querySelector('i');
      const text = nut.querySelector('span');
      if (icon) icon.className = `fa-solid ${dangChon ? 'fa-check' : 'fa-code-compare'}`;
      if (text) text.textContent = dangChon ? 'Đã chọn' : 'So sánh';
    }
  });
}

/**
 * 🎯 Mục đích: Render Bảng so sánh 10 tiêu chí động và thanh Sticky Dock ghim đáy màn hình
 */
function hienThiSoSanh() {
  const shopWrapper = document.getElementById('shop-compare-table-wrapper');
  const oldWrapper = document.getElementById('compare-table-wrapper');
  const dock = document.getElementById('sticky-compare-dock');
  const dockCount = document.getElementById('dock-compare-count');
  const dockThumbs = document.getElementById('dock-compare-thumbs');

  // Lấy danh sách sản phẩm được chọn so sánh
  const dsMay = dsSanPham.filter(p => dsSoSanh.some(id => String(id) === String(p.id)));

  // 1. Cập nhật thanh ghim so sánh nổi (Sticky Dock) dưới đáy màn hình
  if (dock) {
    if (dsSoSanh.length > 0) {
      dock.style.display = 'block';
      if (dockCount) dockCount.textContent = dsSoSanh.length;
      if (dockThumbs) {
        dockThumbs.innerHTML = dsMay.map(p => `
          <div class="dock-thumb-item" title="${p.name}">
            <img src="${p.image}" alt="${p.name}">
            <button class="dock-thumb-del" onclick="batTatSoSanh('${p.id}')">×</button>
          </div>
        `).join('');
      }
    } else {
      dock.style.display = 'none';
    }
  }

  // 2. Render bảng đối chiếu 10 thông số kỹ thuật chi tiết
  let html = '';
  if (dsMay.length === 0) {
    html = `
      <div style="text-align: center; padding: 30px; color: var(--text-muted); font-size: 13px;">
        <i class="fa-solid fa-code-compare" style="font-size: 32px; color: #94a3b8; margin-bottom: 10px;"></i>
        <p>Chưa có sản phẩm nào được chọn để so sánh.</p>
        <p style="font-size: 12px; margin-top: 4px;">Hãy bấm nút <strong>"So sánh"</strong> trên thẻ sản phẩm (tối đa 3 máy).</p>
      </div>
    `;
  } else {
    html = `
      <table class="compare-table">
        <thead>
          <tr>
            <th style="width: 180px;">Tiêu Chí So Sánh</th>
            ${dsMay.map(p => `
              <th style="text-align: center;">
                <img src="${p.image}" alt="${p.name}" style="height: 100px; object-fit: contain; margin-bottom: 8px;">
                <div style="font-size: 14px; font-weight: 800;">${p.name}</div>
                <div style="color: var(--accent); font-size: 15px; font-weight: 800; margin: 4px 0;">${dinhDangTien(p.price)}</div>
                <button class="btn-danger btn-sm" onclick="batTatSoSanh('${p.id}')" style="margin-top: 4px;">
                  <i class="fa-solid fa-xmark"></i> Bỏ máy này
                </button>
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1. Màn hình</strong></td>
            ${dsMay.map(p => `<td>${p.specs?.screen || '-'}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>2. Vi xử lý (CPU)</strong></td>
            ${dsMay.map(p => `<td><strong>${p.specs?.cpu || p.specs?.chip || '-'}</strong></td>`).join('')}
          </tr>
          <tr>
            <td><strong>3. Đồ họa (GPU)</strong></td>
            ${dsMay.map(p => `<td>${p.specs?.gpu || '-'}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>4. RAM</strong></td>
            ${dsMay.map(p => `<td><strong>${p.specs?.ram || '-'}</strong></td>`).join('')}
          </tr>
          <tr>
            <td><strong>5. Bộ nhớ trong (ROM)</strong></td>
            ${dsMay.map(p => `<td><strong>${p.specs?.rom || '-'}</strong></td>`).join('')}
          </tr>
          <tr>
            <td><strong>6. Cụm Camera sau</strong></td>
            ${dsMay.map(p => `<td>${p.specs?.rear_camera || p.specs?.camSau || '-'}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>7. Camera trước</strong></td>
            ${dsMay.map(p => `<td>${p.specs?.front_camera || p.specs?.camTruoc || '-'}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>8. Dung lượng Pin & Sạc</strong></td>
            ${dsMay.map(p => `<td><strong>${p.specs?.battery || (p.specs?.pin ? `${p.specs?.pin} - ${p.specs?.charge || ''}` : '-')}</strong></td>`).join('')}
          </tr>
          <tr>
            <td><strong>9. Hệ điều hành</strong></td>
            ${dsMay.map(p => `<td>${p.specs?.os || '-'}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>10. Tính năng đặc biệt</strong></td>
            ${dsMay.map(p => `<td>${p.specs?.special || '-'}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Mua ngay</strong></td>
            ${dsMay.map(p => `
              <td style="text-align: center;">
                <button class="btn-primary btn-sm" onclick="themVaoGio('${p.id}')">
                  <i class="fa-solid fa-cart-plus"></i> Thêm Giỏ
                </button>
              </td>
            `).join('')}
          </tr>
        </tbody>
      </table>
    `;
  }

  if (shopWrapper) shopWrapper.innerHTML = html;
  if (oldWrapper) oldWrapper.innerHTML = html;
}

function cuonDenBangSoSanh() {
  const shopView = document.getElementById('view-shop');
  if (!shopView.classList.contains('active')) {
    chuyenTrang('shop');
  }
  setTimeout(() => {
    document.getElementById('shop-compare-section')?.scrollIntoView({ behavior: 'smooth' });
  }, 100);
}

function xoaSachSoSanh() {
  if (dsSoSanh.length === 0) return;
  if (!confirm('XÁC NHẬN XÓA SO SÁNH:\nBạn có chắc chắn muốn xóa toàn bộ sản phẩm khỏi bảng so sánh không?')) {
    return;
  }
  dsSoSanh = [];
  sessionStorage.removeItem('smartstore_compare');
  capNhatBadge();
  hienThiSoSanh();
  capNhatNutSoSanhCard();
  hienThongBao('Đã xóa toàn bộ sản phẩm khỏi bảng so sánh', 'info');
}
