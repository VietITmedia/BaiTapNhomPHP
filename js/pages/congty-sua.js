import { khoiTaoTrang, chuyenTrang, xuLyHetPhien, noiDungLoi } from "../app.js";
import { layMotCongTy, suaCongTy } from "../services/congty.service.js";

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

// Lỗi không sửa tiếp được (không thấy công ty...): hiện đúng câu đó và ẩn form
function baoLoiVaAnForm(cau) {
    const ds = $("loi-form");
    ds.replaceChildren();

    const li = document.createElement("li");
    li.textContent = cau;
    ds.append(li);

    $("form-sua").hidden = true;
}

function ngayHomNay() {
    const bay = new Date();
    return new Date(bay.getTime() - bay.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

async function main() {
    // chỉ ai có quyền sửa công ty mới vào được trang này; thiếu quyền thì về trang chủ
    const ctx = await khoiTaoTrang({ canDangNhap: true, quyenCan: "congty.sua" });
    if (!ctx) return;

    // trang này cần biết sửa công ty nào: lấy id từ địa chỉ (congty-sua.html?id=3)
    const id = Number(new URLSearchParams(window.location.search).get("id"));
    if (!Number.isInteger(id) || id <= 0) {
        chuyenTrang("congty.html");
        return;
    }

    try {
        const c = (await layMotCongTy(id)).du_lieu;

        $("ma").textContent = c.ma;
        $("loai").textContent = c.ten_loai;
        $("cong-ty-cha").textContent = c.ten_cong_ty_cha ?? "—";
        $("trang-thai").textContent = c.ten_trang_thai;

        $("ten").value = c.ten;
        $("dia-diem").value = c.dia_diem;
        $("sdt").value = c.sdt;
        $("email").value = c.email;
        $("ngay-thanh-lap").max = ngayHomNay();
        $("ngay-thanh-lap").value = c.ngay_thanh_lap ?? "";

        $("form-sua").hidden = false;
    } catch (loi) {
        if (xuLyHetPhien(loi)) return;
        baoLoiVaAnForm(loi.status === 404 ? "Không tìm thấy công ty." : noiDungLoi(loi));
        return;
    }

    $("form-sua").addEventListener("submit", async (e) => {
        e.preventDefault();
        $("loi-form").replaceChildren();
        $("nut-luu").disabled = true;

        try {
            await suaCongTy(id, {
                Ten_CongTy: $("ten").value.trim(),
                Dia_Diem: $("dia-diem").value.trim(),
                SDT_CongTy: $("sdt").value.trim(),
                Email_CongTy: $("email").value.trim(),
                Ngay_ThanhLap: $("ngay-thanh-lap").value === "" ? null : $("ngay-thanh-lap").value,
            });
            chuyenTrang("congty.html?thongbao=sua");
        } catch (loi) {
            if (xuLyHetPhien(loi)) return;
            hienLoi(loi);                                  // 422: lỗi từng trường (ví dụ tên trùng)
            $("nut-luu").disabled = false;
        }
    });
}

main();