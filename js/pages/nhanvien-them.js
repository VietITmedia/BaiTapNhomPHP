import { khoiTaoTrang, xuLyHetPhien, noiDungLoi } from "../app.js";
import { themNhanVien, layDanhSachNhanVien } from "../services/nhanvien.service.js";
import { layCongTy, layPhongBan } from "../services/danhmuc.service.js";
import { layDanhSachChucVu } from "../services/chucvu.service.js";

const $ = (id) => document.getElementById(id);

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

// Hiện lỗi: 422 có lỗi từng trường thì mỗi lỗi một dòng, còn lại hiện thông báo của backend
function hienLoi(loi) {
    const ds = $("loi-form");
    ds.replaceChildren();

    const cacCau = Object.values(loi.errors || {}).flat();
    for (const cau of (cacCau.length ? cacCau : [noiDungLoi(loi)])) {
        const li = document.createElement("li");
        li.textContent = cau;
        ds.append(li);
    }
}

function ngayHomNay() {
    const bay = new Date();
    return new Date(bay.getTime() - bay.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

// Chọn công ty xong thì nạp phòng ban, chức vụ của công ty đó và những người có thể làm quản lý trực tiếp
async function taiTheoCongTy() {
    const idCongTy = $("cong-ty").value;

    if (!idCongTy) {
        doVaoOChon($("phong-ban"), [], () => "", "-- Chọn công ty trước --");
        doVaoOChon($("chuc-vu"), [], () => "", "-- Chọn công ty trước --");
        doVaoOChon($("quan-ly"), [], () => "", "-- Không chọn --");
        return;
    }

    try {
        const [phongBan, chucVu, quanLy] = await Promise.all([
            layPhongBan(idCongTy),
            layDanhSachChucVu(1, idCongTy),                                    // chức vụ dùng chung và chức vụ riêng của công ty này
            layDanhSachNhanVien({ moiTrang: 50, trangThai: "1", idCongTy }),   // chỉ người đang làm việc
        ]);
        doVaoOChon($("phong-ban"), phongBan.du_lieu, (p) => p.ten, "-- Chọn phòng ban --");
        doVaoOChon($("chuc-vu"), chucVu.du_lieu, (c) => c.ten, "-- Chọn chức vụ --");
        doVaoOChon($("quan-ly"), quanLy.du_lieu, (n) => `${n.ho_ten} (${n.ma})`, "-- Không chọn --");
    } catch (loi) {
        if (xuLyHetPhien(loi)) return;
        hienLoi(loi);
    }
}

// Đặt form về trạng thái ban đầu
async function datLaiForm(dsCongTy) {
    $("form-them").reset();
    $("loi-form").replaceChildren();
    $("ngay-vao-lam").value = ngayHomNay();

    // chỉ có một công ty để chọn (ví dụ nhân sự Vincom) thì chọn sẵn
    doVaoOChon($("cong-ty"), dsCongTy, (c) => c.ten, "-- Chọn công ty --");
    if (dsCongTy.length === 1) $("cong-ty").value = dsCongTy[0].id;

    await taiTheoCongTy();
}

async function main() {
    // chỉ ai có quyền thêm nhân viên mới vào được trang này; thiếu quyền thì về trang chủ
    const ctx = await khoiTaoTrang({ canDangNhap: true, quyenCan: "nhanvien.them" });
    if (!ctx) return;

    $("ngay-sinh").max = ngayHomNay();

    let dsCongTy = [];
    try {
        dsCongTy = (await layCongTy()).du_lieu;
    } catch (loi) {
        if (xuLyHetPhien(loi)) return;
        hienLoi(loi);
        return;
    }

    await datLaiForm(dsCongTy);

    $("cong-ty").addEventListener("change", taiTheoCongTy);

    $("form-them").addEventListener("submit", async (e) => {
        e.preventDefault();
        $("loi-form").replaceChildren();
        $("nut-luu").disabled = true;

        try {
            const kq = (await themNhanVien({
                Ho_Ten: $("ho-ten").value.trim(),
                Gioi_Tinh: Number($("gioi-tinh").value),
                Ngay_Sinh: $("ngay-sinh").value,
                SDT_NhanVien: $("sdt").value.trim(),
                Email_NhanVien: $("email").value.trim(),
                Dia_Chi: $("dia-chi").value.trim(),
                Ngay_VaoLam: $("ngay-vao-lam").value,
                ID_CongTy: Number($("cong-ty").value),
                ID_PhongBan: Number($("phong-ban").value),
                ID_ChucVu: Number($("chuc-vu").value),
                ID_QuanLy: $("quan-ly").value === "" ? null : Number($("quan-ly").value),
            })).du_lieu;

            $("kq-ho-ten").textContent = kq.ho_ten;
            $("kq-ma").textContent = kq.ma;
            $("kq-ten-dang-nhap").textContent = kq.ten_dang_nhap;
            $("kq-mat-khau").textContent = kq.mat_khau_tam;

            $("form-them").hidden = true;
            $("ket-qua").hidden = false;
        } catch (loi) {
            if (xuLyHetPhien(loi)) return;
            hienLoi(loi);                                  // 422: lỗi từng trường; 403: ngoài phạm vi
        } finally {
            $("nut-luu").disabled = false;
        }
    });

    $("nut-them-nua").addEventListener("click", async () => {
        $("kq-mat-khau").textContent = "";                 // không để mật khẩu nằm lại trên trang
        $("ket-qua").hidden = true;
        $("form-them").hidden = false;
        await datLaiForm(dsCongTy);
    });
}

main();