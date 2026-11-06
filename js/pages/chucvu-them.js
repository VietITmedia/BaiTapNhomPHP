import { khoiTaoTrang, chuyenTrang, xuLyHetPhien, noiDungLoi } from "../app.js";
import { themChucVu } from "../services/chucvu.service.js";

async function main() {
    // chỉ ai có quyền thêm mới vào được trang này; thiếu quyền thì về trang chủ
    const ctx = await khoiTaoTrang({ canDangNhap: true, quyenCan: "chucvu.them" });
    if (!ctx) return;

    const form = document.getElementById("form-chuc-vu");
    const nut = document.getElementById("nut-luu");
    const thongBao = document.getElementById("thongbao");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        thongBao.textContent = "";
        nut.disabled = true;

        try {
            await themChucVu({
                Ma_ChucVu: document.getElementById("cv-ma").value.trim(),
                Ten_ChucVu: document.getElementById("cv-ten").value.trim(),
                Mo_Ta: document.getElementById("cv-mo-ta").value.trim() || null,
            });
            chuyenTrang("chucvu.html?thongbao=them");      // thành công: về danh sách
        } catch (loi) {
            if (xuLyHetPhien(loi)) return;
            thongBao.style.color = "crimson";
            thongBao.textContent = noiDungLoi(loi);        // 422: lỗi từng trường; 403: không đủ quyền
            nut.disabled = false;
        }
    });
}

main();
