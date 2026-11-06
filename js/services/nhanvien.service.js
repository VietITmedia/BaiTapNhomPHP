import { api } from "./api.js";

// trang: số trang cần lấy; tuKhoa: chữ tìm kiếm (theo tên hoặc mã nhân viên);
// trangThai: "" = đang làm và tạm nghỉ, "1" = đang làm, "2" = tạm nghỉ, "0" = đã nghỉ việc;
// idCongTy: chỉ lấy nhân viên của một công ty ("" = không lọc)
export function layDanhSachNhanVien({ trang = 1, moiTrang = 20, tuKhoa = "", trangThai = "", idCongTy = "" } = {}) {
    const thamSo = new URLSearchParams({ trang, moi_trang: moiTrang });
    if (tuKhoa) thamSo.set("tu_khoa", tuKhoa);
    if (trangThai !== "") thamSo.set("trang_thai", trangThai);
    if (idCongTy !== "") thamSo.set("id_cong_ty", idCongTy);

    return api.get(`/api/nhan-vien?${thamSo}`);
}

// Một nhân viên theo ID (backend trả 404 nếu không có hoặc nằm ngoài phạm vi)
export function layNhanVien(id) {
    return api.get(`/api/nhan-vien/${id}`);
}

// Chuyển đổi trạng thái: 1 = đang làm việc, 2 = tạm nghỉ, 0 = đã nghỉ việc
export function doiTrangThaiNhanVien(id, trangThai) {
    return api.put(`/api/nhan-vien/${id}/trang-thai`, { Trang_Thai: Number(trangThai) });
}

// Thêm nhân viên mới (kèm tài khoản). Kết quả có mật khẩu tạm, chỉ hiện một lần
export function themNhanVien(duLieu) {
    return api.post("/api/nhan-vien", duLieu);
}
// Sửa hồ sơ nhân viên. Không gửi khóa ID_QuanLy = giữ nguyên người quản lý; gửi null = bỏ người quản lý
export function suaNhanVien(id, duLieu) {
    return api.put(`/api/nhan-vien/${id}`, duLieu);
}