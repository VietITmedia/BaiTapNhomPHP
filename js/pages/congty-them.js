import { khoiTaoTrang, chuyenTrang, xuLyHetPhien, noiDungLoi } from "../app.js";
import { themCongTy } from "../services/congty.service.js";
import { layCongTy } from "../services/danhmuc.service.js";

const $ = (id) => document.getElementById(id);

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

async function main() {
    // chỉ ai có quyền thêm công ty mới vào được trang này; thiếu quyền thì về trang chủ
    const ctx = await khoiTaoTrang({ canDangNhap: true, quyenCan: "congty.them" });
    if (!ctx) return;

    $("ngay-thanh-lap").max = ngayHomNay();

    // mã luôn là chữ hoa
    $("ma").addEventListener("input", (e) => { e.target.value = e.target.value.toUpperCase(); });

    // công ty cha: các công ty đang hoạt động; chọn sẵn tập đoàn (công ty không có công ty cha) cho tiện
    try {
        const dsCongTy = (await layCongTy()).du_lieu;
        const oChon = $("cong-ty-cha");
        oChon.replaceChildren();

        const nhac = document.createElement("option");
        nhac.value = "";
        nhac.textContent = "-- Chọn công ty cha --";
        oChon.append(nhac);

        for (const c of dsCongTy) {
            const o = document.createElement("option");
            o.value = c.id;
            o.textContent = c.ten;
            oChon.append(o);
        }

        const tapDoan = dsCongTy.find((c) => c.id_cong_ty_cha === null);
        if (tapDoan) oChon.value = tapDoan.id;
    } catch (loi) {
        if (xuLyHetPhien(loi)) return;
        hienLoi(loi);
        return;
    }

    $("form-them").addEventListener("submit", async (e) => {
        e.preventDefault();
        $("loi-form").replaceChildren();
        $("nut-luu").disabled = true;

        try {
            await themCongTy({
                Ma_CongTy: $("ma").value.trim(),
                Ten_CongTy: $("ten").value.trim(),
                ID_CongTyCha: Number($("cong-ty-cha").value),
                Dia_Diem: $("dia-diem").value.trim(),
                SDT_CongTy: $("sdt").value.trim(),
                Email_CongTy: $("email").value.trim(),
                Ngay_ThanhLap: $("ngay-thanh-lap").value === "" ? null : $("ngay-thanh-lap").value,
            });
            chuyenTrang("congty.html?thongbao=them");
        } catch (loi) {
            if (xuLyHetPhien(loi)) return;
            hienLoi(loi);                                  // 422: lỗi từng trường; 403: ngoài phạm vi
            $("nut-luu").disabled = false;
        }
    });
}

main();