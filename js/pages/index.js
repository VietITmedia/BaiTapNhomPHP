import { layThongTinNguoiDung } from "../services/auth.service.js";
import { chuyenTrang, TRANG_CHINH, TRANG_DANG_NHAP } from "../app.js";

try {
    await layThongTinNguoiDung();
    chuyenTrang(TRANG_CHINH);               // đã đăng nhập: vào trong
} catch (loi) {
    if (loi.status === 401) {
        chuyenTrang(TRANG_DANG_NHAP);       // chưa đăng nhập: về trang đăng nhập
    } else {
        document.body.textContent = "Không kết nối được máy chủ. Hãy tải lại trang.";
    }
}
