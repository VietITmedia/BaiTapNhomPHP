import { api } from "./api.js";

// 1. Đăng nhập
export function dangNhap(tenDangNhap, matKhau) {
    return api.post("/api/dang-nhap", {
        Ten_DangNhap: tenDangNhap,
        MatKhau: matKhau
    });
}

// 2. Lấy thông tin người dùng
export function layThongTinNguoiDung() {
    return api.get("/api/toi");
}

// 3. Đăng xuất
export function dangXuat() {
    return api.post("/api/dang-xuat");
}