import { api } from "./api.js";

// trangThai: 1 = đang dùng, 0 = ngừng dùng, bỏ trống = tất cả
// idCongTy: chỉ lấy chức vụ dùng chung và chức vụ riêng của công ty này, bỏ trống = không lọc
export function layDanhSachChucVu(trangThai, idCongTy) {
    const thamSo = new URLSearchParams();
    if (trangThai !== undefined) thamSo.set("trang_thai", trangThai);
    if (idCongTy !== undefined && idCongTy !== "") thamSo.set("id_cong_ty", idCongTy);

    const chuoi = thamSo.toString();
    return api.get("/api/chuc-vu" + (chuoi ? `?${chuoi}` : ""));
}

export const layChucVu = (id) => api.get(`/api/chuc-vu/${id}`);

export const themChucVu = (duLieu) => api.post("/api/chuc-vu", duLieu);

export const suaChucVu = (id, duLieu) => api.put(`/api/chuc-vu/${id}`, duLieu);

export const ngungDungChucVu = (id) => api.delete(`/api/chuc-vu/${id}`);