import { khoiTaoTrang, chuyenTrang, xuLyHetPhien, noiDungLoi } from "../app.js";
import { layNhanVien, suaNhanVien, layDanhSachNhanVien } from "../services/nhanvien.service.js";
import { layPhongBan } from "../services/danhmuc.service.js";
import { layDanhSachChucVu } from "../services/chucvu.service.js";

const $ = (id) => document.getElementById(id);

const TEN_TRANG_THAI = { 1: "Đang làm việc", 2: "Tạm nghỉ", 0: "Đã nghỉ việc" };

// Hai giá trị đặc biệt của ô "Đổi người quản lý": giữ nguyên (không gửi gì lên) hoặc bỏ người quản lý
const GIU_NGUYEN = "__giu";
const BO_QUAN_LY = "__bo";

// Đổ một danh sách vào ô chọn; dòng đầu là dòng nhắc (value rỗng)
function doVaoOChon(oChon, danhSach, layNhan, dongNhac) {
    oChon.replaceChildren();

    const nhac = document.createElement("option");
    nhac.value = "";
    nhac.textContent = dongNhac;
    oChon.append(nhac);

    for (const muc of danhSach) {
        const o = document.createElement("option");
        o.value = muc.id;
        o.textContent = layNhan(muc);
        oChon.append(o);
    }
}

function themOption(oChon, giaTri, chu) {
    const o = document.createElement("option");
    o.value = giaTri;
    o.textContent = chu;
    oChon.append(o);
}

// Hiện lỗi: 422 có lỗi từng trường thì mỗi lỗi một dòng, còn lại hiện thông báo của backend
function hienLoi(loi) {
    $("thanh-cong").textContent = "";
    const ds = $("loi-form");
    ds.replaceChildren();

    const cacCau = Object.values(loi.errors || {}).flat();
    for (const cau of (cacCau.length ? cacCau : [noiDungLoi(loi)])) {
        const li = document.createElement("li");
        li.textContent = cau;
        ds.append(li);
    }
}

// Lỗi không sửa tiếp được (không thấy người, tự sửa mình...): hiện đúng câu đó và ẩn form
function baoLoiVaAnForm(cau) {
    $("thanh-cong").textContent = "";
    const ds = $("loi-form");
    ds.replaceChildren();

    const li = document.createElement("li");
    li.textContent = cau;
    ds.append(li);

    $("form-sua").hidden = true;
}

// Lấy hồ sơ hiện tại về và điền vào form
async function nap(id, nguoiDung) {
    const nv = (await layNhanVien(id)).du_lieu;

    if (nv.ma === nguoiDung.ma_nhan_vien) {
        baoLoiVaAnForm("Bạn không thể tự sửa hồ sơ của chính mình ở đây.");
        return false;
    }
    if (nv.ngay_sinh === undefined) {                       // backend không gửi = bạn không được xem đầy đủ hồ sơ này
        baoLoiVaAnForm("Bạn không có quyền xem đầy đủ hồ sơ này nên không thể sửa.");
        return false;
    }
    if (Number(nv.trang_thai) === 0) {
        baoLoiVaAnForm("Nhân viên đã nghỉ việc, không thể sửa hồ sơ.");
        return false;
    }

    $("ma").textContent = nv.ma;
    $("cong-ty-ten").textContent = nv.cong_ty;
    $("trang-thai-ten").textContent = TEN_TRANG_THAI[nv.trang_thai] ?? "—";

    $("ho-ten").value = nv.ho_ten;
    $("gioi-tinh").value = String(Number(nv.gioi_tinh));
    $("ngay-sinh").value = nv.ngay_sinh;
    $("sdt").value = nv.sdt;
    $("email").value = nv.email;
    $("dia-chi").value = nv.dia_chi;
    $("ngay-vao-lam").value = nv.ngay_vao_lam;

    // phòng ban, chức vụ, người quản lý: chỉ trong phạm vi công ty của nhân viên này
    const [phongBan, chucVu, quanLy] = await Promise.all([
        layPhongBan(nv.id_cong_ty),
        layDanhSachChucVu(1, nv.id_cong_ty),
        layDanhSachNhanVien({ moiTrang: 50, trangThai: "1", idCongTy: nv.id_cong_ty }),
    ]);

    doVaoOChon($("phong-ban"), phongBan.du_lieu, (p) => p.ten, "-- Chọn phòng ban --");
    $("phong-ban").value = nv.id_phong_ban;

    doVaoOChon($("chuc-vu"), chucVu.du_lieu, (c) => c.ten, "-- Chọn chức vụ --");
    $("chuc-vu").value = nv.id_chuc_vu;

    // người quản lý hiện tại có thể nằm ngoài phạm vi bạn được xem nên có thể không hiện ở đây
    $("quan-ly-hien-tai").textContent = nv.cap_tren?.length
        ? nv.cap_tren.map((n) => `${n.ho_ten} (${n.ma})`).join(", ")
        : "Chưa có, hoặc nằm ngoài phạm vi bạn được xem";

    const oQuanLy = $("quan-ly");
    oQuanLy.replaceChildren();
    themOption(oQuanLy, GIU_NGUYEN, "-- Giữ nguyên --");
    themOption(oQuanLy, BO_QUAN_LY, "-- Bỏ người quản lý --");
    for (const n of quanLy.du_lieu.filter((x) => x.id !== nv.id)) {
        themOption(oQuanLy, n.id, `${n.ho_ten} (${n.ma})`);
    }

    $("form-sua").hidden = false;
    return true;
}

async function main() {
    // chỉ ai có quyền sửa nhân viên mới vào được trang này; thiếu quyền thì về trang chủ
    const ctx = await khoiTaoTrang({ canDangNhap: true, quyenCan: "nhanvien.sua" });
    if (!ctx) return;

    // trang này cần biết sửa ai: lấy id từ địa chỉ (nhanvien-sua.html?id=19)
    const id = Number(new URLSearchParams(window.location.search).get("id"));
    if (!Number.isInteger(id) || id <= 0) {
        chuyenTrang("nhanvien.html");
        return;
    }

    try {
        await nap(id, ctx.nguoiDung);
    } catch (loi) {
        if (xuLyHetPhien(loi)) return;
        baoLoiVaAnForm(loi.status === 404 ? "Không tìm thấy nhân viên." : noiDungLoi(loi));
        return;
    }

    $("form-sua").addEventListener("submit", async (e) => {
        e.preventDefault();
        $("loi-form").replaceChildren();
        $("thanh-cong").textContent = "";
        $("nut-luu").disabled = true;

        const duLieu = {
            Ho_Ten: $("ho-ten").value.trim(),
            Gioi_Tinh: Number($("gioi-tinh").value),
            Ngay_Sinh: $("ngay-sinh").value,
            SDT_NhanVien: $("sdt").value.trim(),
            Email_NhanVien: $("email").value.trim(),
            Dia_Chi: $("dia-chi").value.trim(),
            Ngay_VaoLam: $("ngay-vao-lam").value,
            ID_PhongBan: Number($("phong-ban").value),
            ID_ChucVu: Number($("chuc-vu").value),
        };

        // CHỈ gửi người quản lý khi người dùng chủ động đổi: tránh vô tình xóa người quản lý mà họ không nhìn thấy
        const chonQuanLy = $("quan-ly").value;
        if (chonQuanLy === BO_QUAN_LY) duLieu.ID_QuanLy = null;
        else if (chonQuanLy !== GIU_NGUYEN) duLieu.ID_QuanLy = Number(chonQuanLy);

        try {
            await suaNhanVien(id, duLieu);
            await nap(id, ctx.nguoiDung);                  // lấy lại hồ sơ mới để hiện đúng
            $("thanh-cong").textContent = "Đã lưu thay đổi.";
        } catch (loi) {
            if (xuLyHetPhien(loi)) return;
            hienLoi(loi);                                  // 422: lỗi từng trường; 409: vi phạm luật nghiệp vụ
        } finally {
            $("nut-luu").disabled = false;
        }
    });
}

main();