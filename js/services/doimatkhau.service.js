import { api } from "./api.js";

// Trạng thái hiện tại: có yêu cầu đang chờ không, có cần nhập mật khẩu hiện tại không, đã nhập đúng chưa, có đang bị khóa không
export const layTrangThaiDoiMatKhau = () => api.get("/api/doi-mat-khau/trang-thai");

// Bước nhập mật khẩu hiện tại (chỉ với người đổi chủ động): sai tối đa 5 lần, quá thì khóa chức năng này 30 phút
export const kiemTraMatKhauCu = (matKhauCu) => api.post("/api/doi-mat-khau/kiem-tra-cu", { MatKhau_Cu: matKhauCu });

// Gửi mật khẩu mới (kèm ô nhập lại); backend lưu bản băm ở trạng thái chờ rồi gửi mã OTP qua email
export const yeuCauDoiMatKhau = (matKhauMoi, nhapLai) =>
    api.post("/api/doi-mat-khau/yeu-cau", { MatKhau_Moi: matKhauMoi, MatKhau_Moi_confirmation: nhapLai });

// Gửi lại mã: mã cũ hết hiệu lực
export const guiLaiOtp = () => api.post("/api/doi-mat-khau/gui-lai", {});

// Nhập mã OTP; đúng thì đổi mật khẩu, backend đăng xuất và bắt đăng nhập lại
export const xacNhanDoiMatKhau = (maOtp) => api.post("/api/doi-mat-khau/xac-nhan", { Ma_OTP: maOtp });