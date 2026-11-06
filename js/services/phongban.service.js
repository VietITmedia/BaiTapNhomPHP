import { api } from "./api.js";

// Danh sách phòng ban (đầy đủ thông tin) mà người đăng nhập được xem: quản trị thấy tất cả, người khác thấy phòng ban công ty mình.
// Khác với layPhongBan trong danhmuc.service.js: hàm đó chỉ lấy phòng ban đang hoạt động để làm ô chọn.
export const layDanhSachPhongBan = () => api.get("/api/phong-ban/danh-sach");

export const layMotPhongBan = (id) => api.get(`/api/phong-ban/${id}`);

export const themPhongBan = (duLieu) => api.post("/api/phong-ban", duLieu);

export const suaPhongBan = (id, duLieu) => api.put(`/api/phong-ban/${id}`, duLieu);

// 1 = hoạt động, 0 = ngừng hoạt động
export const doiTrangThaiPhongBan = (id, trangThai) =>
    api.put(`/api/phong-ban/${id}/trang-thai`, { Trang_Thai: Number(trangThai) });