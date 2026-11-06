import { api } from "./api.js";

// Công ty và phòng ban mà người đăng nhập được phép chọn (backend đã lọc theo phạm vi)
export const layCongTy = () => api.get("/api/cong-ty");

export const layPhongBan = (idCongTy) => api.get(`/api/phong-ban?id_cong_ty=${idCongTy}`);