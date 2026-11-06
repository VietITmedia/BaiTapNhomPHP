import { khoiTaoTrang, chuyenTrang, xuLyHetPhien, noiDungLoi } from "../app.js";
import { themPhongBan } from "../services/phongban.service.js";
import { layCongTy, layPhongBan } from "../services/danhmuc.service.js";

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

// Chọn công ty xong thì nạp các phòng ban đang hoạt động của công ty đó để làm phòng ban cha
async function taiPhongBanCha() {
    const idCongTy = $("cong-ty").value;

    if (!idCongTy) {
        doVaoOChon($("phong-ban-cha"), [], () => "", "-- Không có (phòng ban cấp cao nhất) --");
        return;
    }

    try {
        const ds = (await layPhongBan(idCongTy)).du_lieu;
        doVaoOChon($("phong-ban-cha"), ds, (p) => `${p.ten} (${p.ma})`, "-- Không có (phòng ban cấp cao nhất) --");
    } catch (loi) {
        if (xuLyHetPhien(loi)) return;
        hienLoi(loi);
    }
}

async function main() {
    // chỉ ai có quyền thêm phòng ban mới vào được trang này; thiếu quyền thì về trang chủ
    const ctx = await khoiTaoTrang({ canDangNhap: true, quyenCan: "phongban.them" });
    if (!ctx) return;

    $("ngay-thanh-lap").max = ngayHomNay();

    // mã luôn là chữ hoa
    $("ma").addEventListener("input", (e) => { e.target.value = e.target.value.toUpperCase(); });

    try {
        const dsCongTy = (await layCongTy()).du_lieu;
        doVaoOChon($("cong-ty"), dsCongTy, (c) => c.ten, "-- Chọn công ty --");
        if (dsCongTy.length === 1) $("cong-ty").value = dsCongTy[0].id;      // chỉ có một công ty để chọn thì chọn sẵn
    } catch (loi) {
        if (xuLyHetPhien(loi)) return;
        hienLoi(loi);
        return;
    }

    await taiPhongBanCha();
    $("cong-ty").addEventListener("change", taiPhongBanCha);

    $("form-them").addEventListener("submit", async (e) => {
        e.preventDefault();
        $("loi-form").replaceChildren();
        $("nut-luu").disabled = true;

        try {
            await themPhongBan({
                ID_CongTy: Number($("cong-ty").value),
                Ma_PhongBan: $("ma").value.trim(),
                Ten_PhongBan: $("ten").value.trim(),
                ID_PhongBanCha: $("phong-ban-cha").value === "" ? null : Number($("phong-ban-cha").value),
                Email_PhongBan: $("email").value.trim() === "" ? null : $("email").value.trim(),
                Ngay_ThanhLap: $("ngay-thanh-lap").value === "" ? null : $("ngay-thanh-lap").value,
            });
            chuyenTrang("phongban.html?thongbao=them");
        } catch (loi) {
            if (xuLyHetPhien(loi)) return;
            hienLoi(loi);                                  // 422: lỗi từng trường; 403: ngoài phạm vi
            $("nut-luu").disabled = false;
        }
    });
}

main();