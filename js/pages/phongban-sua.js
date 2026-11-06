import { khoiTaoTrang, chuyenTrang, xuLyHetPhien, noiDungLoi } from "../app.js";
import { layMotPhongBan, suaPhongBan } from "../services/phongban.service.js";

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

// Lỗi không sửa tiếp được (không thấy phòng ban...): hiện đúng câu đó và ẩn form
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
    // chỉ ai có quyền sửa phòng ban mới vào được trang này; thiếu quyền thì về trang chủ
    const ctx = await khoiTaoTrang({ canDangNhap: true, quyenCan: "phongban.sua" });
    if (!ctx) return;

    // trang này cần biết sửa phòng ban nào: lấy id từ địa chỉ (phongban-sua.html?id=3)
    const id = Number(new URLSearchParams(window.location.search).get("id"));
    if (!Number.isInteger(id) || id <= 0) {
        chuyenTrang("phongban.html");
        return;
    }

    try {
        const p = (await layMotPhongBan(id)).du_lieu;

        $("ma").textContent = p.ma;
        $("cong-ty").textContent = p.ten_cong_ty;
        $("phong-ban-cha").textContent = p.ten_phong_ban_cha ?? "—";
        $("trang-thai").textContent = p.ten_trang_thai;

        $("ten").value = p.ten;
        $("email").value = p.email ?? "";
        $("ngay-thanh-lap").max = ngayHomNay();
        $("ngay-thanh-lap").value = p.ngay_thanh_lap ?? "";

        $("form-sua").hidden = false;
    } catch (loi) {
        if (xuLyHetPhien(loi)) return;
        baoLoiVaAnForm(loi.status === 404 ? "Không tìm thấy phòng ban." : noiDungLoi(loi));
        return;
    }

    $("form-sua").addEventListener("submit", async (e) => {
        e.preventDefault();
        $("loi-form").replaceChildren();
        $("nut-luu").disabled = true;

        try {
            await suaPhongBan(id, {
                Ten_PhongBan: $("ten").value.trim(),
                Email_PhongBan: $("email").value.trim() === "" ? null : $("email").value.trim(),
                Ngay_ThanhLap: $("ngay-thanh-lap").value === "" ? null : $("ngay-thanh-lap").value,
            });
            chuyenTrang("phongban.html?thongbao=sua");
        } catch (loi) {
            if (xuLyHetPhien(loi)) return;
            hienLoi(loi);                                  // 422: lỗi từng trường (ví dụ tên trùng)
            $("nut-luu").disabled = false;
        }
    });
}

main();