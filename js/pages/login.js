import { dangNhap } from "../services/auth.service.js";
import { khoiTaoTrang, chuyenTrang, TRANG_CHINH } from "../app.js";

async function main() {
    // trang đăng nhập: đã đăng nhập rồi thì vào thẳng bên trong
    const ctx = await khoiTaoTrang({ canDangNhap: false });
    if (!ctx) return;

    const form = document.getElementById("form-dang-nhap");
    const oTen = document.getElementById("ten");
    const oMatKhau = document.getElementById("mk");
    const nut = document.getElementById("nut-dang-nhap");
    const thongBao = document.getElementById("thongbao");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        thongBao.textContent = "";
        nut.disabled = true;

        try {
            await dangNhap(oTen.value.trim(), oMatKhau.value);
            chuyenTrang(TRANG_CHINH);
        } catch (loi) {
            thongBao.style.color = "crimson";
            thongBao.textContent = loi.status ? loi.message : "Không kết nối được máy chủ.";
            nut.disabled = false;
        } finally {
            oMatKhau.value = "";             // không để mật khẩu nằm lại trên trang
        }
    });
}

main();
