/**
 * ============================================================================
 * DỰ ÁN: SMARTSTORE - THẾ GIỚI SMARTPHONE & GAMING PHONE
 * MODULE: js/admin/products.js (QUẢN LÝ SẢN PHẨM & XÓA AN TOÀN 2 LỚP)
 * Môn học: Lập trình JavaScript Nâng Cao - FPT Polytechnic
 * Sinh viên thực hiện: Lương Văn Dũng
 * ============================================================================
 */

// ============================================================================
// 1. QUẢN LÝ SẢN PHẨM (PRODUCTS CRUD ENGINE)
// ============================================================================

/**
 * 🎯 Mục đích: Render bảng danh sách sản phẩm có tìm kiếm, lọc danh mục và phân trang 6 món/trang
 */
function renderBangSanPham() {
  const tbody = document.getElementById('admin-products-tbody');
  if (!tbody) return;

  const tuKhoa = (document.getElementById('admin-search-product')?.value || '').toLowerCase().trim();
  const dmLoc = document.getElementById('admin-filter-category')?.value || 'all';

  let ketQua = [...dsSanPham];

  if (dmLoc !== 'all') {
    ketQua = ketQua.filter(sp => (sp.categoryId || sp.cate_id) == dmLoc);
  }
  if (tuKhoa !== '') {
    ketQua = ketQua.filter(sp => sp.name.toLowerCase().includes(tuKhoa));
  }

  const tongSoTrang = Math.ceil(ketQua.length / SO_SP_TRANG_ADMIN) || 1;
  if (trangHienTaiSP > tongSoTrang) trangHienTaiSP = 1;

  const batDau = (trangHienTaiSP - 1) * SO_SP_TRANG_ADMIN;
  const spTrang = ketQua.slice(batDau, batDau + SO_SP_TRANG_ADMIN);

  tbody.innerHTML = spTrang.map(sp => {
    const hang = dsDanhMuc.find(d => d.id == (sp.categoryId || sp.cate_id));
    const tenHang = hang ? hang.name : (sp.brand || '-');
    const tonKho = (sp.stock !== undefined && sp.stock !== null) ? Number(sp.stock) : (Number(sp.quantity) || 15);
    const hetHang = tonKho <= 0;

    return `
      <tr>
        <td><strong>#${sp.id}</strong></td>
        <td>
          <img src="${sp.image}" alt="${sp.name}" style="width: 50px; height: 50px; object-fit: contain; border-radius: 6px; border: 1px solid #e2e8f0;">
        </td>
        <td>
          <strong>${sp.name}</strong>
          <div style="font-size: 11px; color: #64748b;">${sp.specs?.chip || ''}</div>
        </td>
        <td><span class="badge" style="background: #e0f2fe; color: #0369a1;">${tenHang}</span></td>
        <td style="font-weight: 700; color: var(--accent);">${dinhDangTien(sp.price)}</td>
        <td>
          <span style="font-weight: 700; color: ${hetHang ? 'var(--accent)' : 'var(--success)'};">
            ${hetHang ? 'Hết hàng' : `${tonKho} máy`}
          </span>
        </td>
        <td>${sp.sold || 0}</td>
        <td style="text-align: center;">
          <button class="btn-secondary btn-sm" onclick="moSuaSanPham('${sp.id}')" title="Chỉnh sửa sản phẩm"><i class="fa-solid fa-pen-to-square"></i></button>
          <button class="btn-danger btn-sm" onclick="xacNhanXoa('product', '${sp.id}', '${sp.name.replace(/'/g, "\\'")}')" title="Xóa sản phẩm"><i class="fa-solid fa-trash-can"></i></button>
        </td>
      </tr>
    `;
  }).join('');

  // Render các nút chuyển trang
  const paginBox = document.getElementById('admin-products-pagination') || document.getElementById('admin-product-pagination');
  if (paginBox) {
    if (tongSoTrang <= 1) {
      paginBox.innerHTML = '';
    } else {
      let html = '';
      for (let i = 1; i <= tongSoTrang; i++) {
        html += `<button class="page-btn ${trangHienTaiSP === i ? 'active' : ''}" onclick="chuyenTrangSanPhamAdmin(${i})">${i}</button>`;
      }
      paginBox.innerHTML = html;
    }
  }
}

function chuyenTrangSanPhamAdmin(p) {
  trangHienTaiSP = p;
  renderBangSanPham();
}

function moThemSanPham() {
  document.getElementById('product-form').reset();
  document.getElementById('prod-id').value = '';
  const preview = document.getElementById('prod-image-preview');
  if (preview) preview.style.display = 'none';
  const modalTitle = document.getElementById('product-modal-title');
  if (modalTitle) modalTitle.textContent = 'Thêm Mới Điện Thoại Thông Minh';
  moModal('product-modal');
}

function moSuaSanPham(idSP) {
  const sp = dsSanPham.find(item => item.id == idSP);
  if (!sp) return;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined && val !== null ? val : '';
  };

  setVal('prod-id', sp.id);
  setVal('prod-name', sp.name);
  setVal('prod-category', sp.categoryId || sp.cate_id || '');
  setVal('prod-price', sp.price);
  setVal('prod-original-price', sp.originalPrice || '');
  const tonKho = (sp.stock !== undefined && sp.stock !== null) ? Number(sp.stock) : (Number(sp.quantity) || 15);
  setVal('prod-stock', tonKho);
  setVal('prod-sold', sp.sold || 0);
  setVal('prod-image-url', sp.image || '');

  // Điền mô tả
  setVal('prod-desc', sp.detail || sp.description || '');
  setVal('prod-detail', sp.detail || sp.description || '');

  // Điền 10 thông số kỹ thuật chuẩn
  const ts = sp.specs || {};
  setVal('spec-screen', ts.screen || '');
  setVal('spec-cpu', ts.cpu || ts.chip || '');
  setVal('spec-gpu', ts.gpu || '');
  setVal('spec-ram', ts.ram || '');
  setVal('spec-rom', ts.rom || '');
  setVal('spec-rear-cam', ts.rear_camera || ts.camSau || '');
  setVal('spec-front-cam', ts.front_camera || ts.camTruoc || '');
  setVal('spec-battery', ts.battery || ts.pin || '');
  setVal('spec-os', ts.os || '');
  setVal('spec-special', ts.special || '');

  // Hỗ trợ fallback IDs cũ nếu có
  setVal('prod-spec-screen', ts.screen || '');
  setVal('prod-spec-chip', ts.cpu || ts.chip || '');
  setVal('prod-spec-ram', ts.ram || '');
  setVal('prod-spec-rom', ts.rom || '');
  setVal('prod-spec-camsau', ts.rear_camera || ts.camSau || '');
  setVal('prod-spec-camtruoc', ts.front_camera || ts.camTruoc || '');
  setVal('prod-spec-pin', ts.battery || ts.pin || '');
  setVal('prod-spec-charge', ts.charge || '');
  setVal('prod-spec-os', ts.os || '');
  setVal('prod-spec-special', ts.special || '');

  const preview = document.getElementById('prod-image-preview');
  if (preview) {
    if (sp.image) {
      preview.src = sp.image;
      preview.style.display = 'block';
    } else {
      preview.style.display = 'none';
    }
  }

  const modalTitle = document.getElementById('product-modal-title');
  if (modalTitle) modalTitle.textContent = `Chỉnh Sửa Điện Thoại #${sp.id}`;
  moModal('product-modal');
}

/**
 * 🎯 Mục đích: Lưu sản phẩm (Thêm mới qua POST hoặc Cập nhật qua PUT/PATCH) kèm FileReader chuyển Base64
 * ⚙️ Hàm có sẵn: FileReader, fetch, Date.now
 */
async function luuSanPham() {
  const getVal = (id1, id2) => {
    const el = document.getElementById(id1) || (id2 ? document.getElementById(id2) : null);
    return el ? el.value.trim() : '';
  };

  const id = getVal('prod-id');
  const ten = getVal('prod-name');
  const dm = getVal('prod-category');
  const gia = Number(getVal('prod-price'));
  const giaGoc = Number(getVal('prod-original-price')) || null;
  const kho = Number(getVal('prod-stock')) || 0;
  const daBan = Number(getVal('prod-sold')) || 0;
  let anh = getVal('prod-image-url');

  const fileInput = document.getElementById('prod-image-file');
  if (fileInput && fileInput.files && fileInput.files[0]) {
    anh = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(fileInput.files[0]);
    });
  }

  if (!ten || !dm || !gia) {
    hienThongBao('Vui lòng điền đủ Tên, Thương hiệu và Giá bán!', 'error');
    return;
  }

  const moTa = getVal('prod-desc', 'prod-detail');
  const screenVal = getVal('spec-screen', 'prod-spec-screen');
  const cpuVal = getVal('spec-cpu', 'prod-spec-chip');
  const gpuVal = getVal('spec-gpu', 'prod-spec-gpu');
  const ramVal = getVal('spec-ram', 'prod-spec-ram');
  const romVal = getVal('spec-rom', 'prod-spec-rom');
  const rearCamVal = getVal('spec-rear-cam', 'prod-spec-camsau');
  const frontCamVal = getVal('spec-front-cam', 'prod-spec-camtruoc');
  const batteryVal = getVal('spec-battery', 'prod-spec-pin');
  const osVal = getVal('spec-os', 'prod-spec-os');
  const specialVal = getVal('spec-special', 'prod-spec-special');

  const payload = {
    name: ten,
    categoryId: Number(dm),
    cate_id: String(dm),
    price: gia,
    originalPrice: giaGoc,
    stock: kho,
    quantity: kho,
    sold: daBan,
    image: anh || 'https://picsum.photos/300/300',
    detail: moTa,
    description: moTa,
    specs: {
      screen: screenVal,
      cpu: cpuVal,
      chip: cpuVal,
      gpu: gpuVal,
      ram: ramVal,
      rom: romVal,
      rear_camera: rearCamVal,
      camSau: rearCamVal,
      front_camera: frontCamVal,
      camTruoc: frontCamVal,
      battery: batteryVal,
      pin: batteryVal,
      os: osVal,
      special: specialVal
    }
  };

  try {
    if (id) {
      // 1. Cập nhật sản phẩm
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const spCapNhat = await res.json();
      const viTri = dsSanPham.findIndex(item => item.id == id);
      if (viTri > -1) dsSanPham[viTri] = spCapNhat;
      hienThongBao('Cập nhật sản phẩm thành công!', 'success');
    } else {
      // 2. Thêm mới sản phẩm (+1 ID tự động)
      const cacIdSo = dsSanPham.map(sp => Number(sp.id)).filter(n => !isNaN(n) && n > 0);
      const maxId = cacIdSo.length > 0 ? Math.max(...cacIdSo) : 0;
      payload.id = maxId + 1;

      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const spMoi = await res.json();
      dsSanPham.push(spMoi);
      hienThongBao('Thêm mới điện thoại thành công!', 'success');
    }

    dongModal('product-modal');
    tinhToanKPI();
    renderBangSanPham();
  } catch (loi) {
    console.error(loi);
    hienThongBao('Lỗi khi lưu sản phẩm vào máy chủ API!', 'error');
  }
}

// ============================================================================
// 2. XÓA DỮ LIỆU AN TOÀN 2 LỚP BẢO VỆ
// ============================================================================

/**
 * 🎯 Mục đích: Mở modal xác nhận xóa an toàn và chặn xóa Quản trị viên
 */
function xacNhanXoa(loai, id, ten) {
  // Lớp phòng thủ số 1: Chặn xóa tài khoản Admin
  if (loai === 'customer') {
    const userCanXoa = dsKhachHang.find(u => u.id == id);
    if (userCanXoa && userCanXoa.role === 'admin') {
      hienThongBao('Bảo mật: Không được phép xóa bất kỳ tài khoản Quản trị viên (Admin) nào!', 'error');
      return;
    }
  }

  mucCanXoa = { loai, id, ten };
  const msgEl = document.getElementById('confirm-modal-message');
  if (msgEl) {
    msgEl.innerHTML = `Bạn có chắc muốn xóa <strong>${ten}</strong> (#${id})? Thao tác này không thể hoàn tác!`;
  }
  moModal('confirm-modal');
}

/**
 * 🎯 Mục đích: Thực hiện lệnh xóa dữ liệu qua HTTP DELETE (Lớp phòng thủ an ninh số 2)
 */
async function thucHienXoa() {
  if (!mucCanXoa) return;
  const { loai, id } = mucCanXoa;

  // Lớp phòng thủ số 2: Kiểm tra lại trước khi gọi DELETE
  if (loai === 'customer') {
    const userCanXoa = dsKhachHang.find(u => u.id == id);
    if (userCanXoa && userCanXoa.role === 'admin') {
      hienThongBao('Bảo mật: Nghiêm cấm xóa tài khoản Quản trị viên (Admin)!', 'error');
      dongModal('confirm-modal');
      return;
    }
  }

  try {
    const endpoint = loai === 'product' ? 'products' : 'users';
    await fetch(`${API_URL}/${endpoint}/${id}`, { method: 'DELETE' });

    if (loai === 'product') {
      dsSanPham = dsSanPham.filter(p => p.id != id);
      hienThongBao('Đã xóa sản phẩm thành công', 'info');
      tinhToanKPI();
      renderBangSanPham();
    } else {
      dsKhachHang = dsKhachHang.filter(c => c.id != id);
      hienThongBao('Đã xóa khách hàng thành công', 'info');
      renderBangKhachHang();
    }

    dongModal('confirm-modal');
  } catch (loi) {
    console.error(loi);
    hienThongBao('Lỗi khi xóa dữ liệu!', 'error');
  }
}
