import { api } from "./api.js";

// Công ty để QUẢN LÝ (có cả công ty đã ngừng hoạt động).
// Khác với layCongTy trong danhmuc.service.js: hàm đó chỉ lấy công ty đang hoạt động để làm ô chọn.
export const layDanhSachCongTy = () => api.get("/api/cong-ty/danh-sach");

export const layMotCongTy = (id) => api.get(`/api/cong-ty/${id}`);

export const themCongTy = (duLieu) => api.post("/api/cong-ty", duLieu);

export const suaCongTy = (id, duLieu) => api.put(`/api/cong-ty/${id}`, duLieu);

// 1 = hoạt động, 0 = ngừng hoạt động
export const doiTrangThaiCongTy = (id, trangThai) =>
    api.put(`/api/cong-ty/${id}/trang-thai`, { Trang_Thai: Number(trangThai) });