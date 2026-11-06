import { khoiTaoTrang, chuyenTrang, xuLyHetPhien, noiDungLoi } from "../app.js";
import { layChucVu, suaChucVu } from "../services/chucvu.service.js";

const $ = (id) => document.getElementById(id);

function bao(loai, noiDung) {
    $("thongbao").style.color = loai === "loi" ? "crimson" : "green";
    $("thongbao").textContent = noiDung;
}

async function main() {
    // chỉ ai có quyền sửa mới vào được trang này; thiếu quyền thì về trang chủ
    const ctx = await khoiTaoTrang({ canDangNhap: true, quyenCan: "chucvu.sua" });
    if (!ctx) return;

    // trang sửa cần biết sửa dòng nào: lấy id từ địa chỉ (chucvu-sua.html?id=19)
    const id = Number(new URLSearchParams(window.location.search).get("id"));
    if (!Number.isInteger(id) || id <= 0) {
        chuyenTrang("chucvu.html");
        return;
    }

    // nạp dữ liệu hiện tại của chức vụ vào form
    try {
        const cv = (await layChucVu(id)).du_lieu;
        $("cv-ma").value = cv.ma;
        $("cv-ten").value = cv.ten;
        $("cv-mo-ta").value = cv.mo_ta ?? "";
    } catch (loi) {
        if (xuLyHetPhien(loi)) return;
        $("form-chuc-vu").hidden = true;
        bao("loi", loi.status === 404 ? "Không tìm thấy chức vụ này." : noiDungLoi(loi));
        return;
    }

    $("form-chuc-vu").addEventListener("submit", async (e) => {
        e.preventDefault();

        $("thongbao").textContent = "";
        $("nut-luu").disabled = true;

        try {
            await suaChucVu(id, {
                Ma_ChucVu: $("cv-ma").value.trim(),
                Ten_ChucVu: $("cv-ten").value.trim(),
                Mo_Ta: $("cv-mo-ta").value.trim() || null,
            });
            chuyenTrang("chucvu.html?thongbao=sua");       // thành công: về danh sách
        } catch (loi) {
            if (xuLyHetPhien(loi)) return;
            bao("loi", noiDungLoi(loi));
            $("nut-luu").disabled = false;
        }
    });
}

main();
