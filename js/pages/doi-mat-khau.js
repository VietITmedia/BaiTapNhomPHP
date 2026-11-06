import { khoiTaoTrang, chuyenTrang, xuLyHetPhien, noiDungLoi } from "../app.js";
import { layTrangThaiDoiMatKhau, kiemTraMatKhauCu, yeuCauDoiMatKhau, guiLaiOtp, xacNhanDoiMatKhau } from "../services/doimatkhau.service.js";

const $ = (id) => document.getElementById(id);

// Mã OTP: thời điểm (mili giây của trình duyệt) hết hạn và được gửi lại, tính từ số giây backend báo
let hetHanLuc = 0;
let guiLaiLuc = 0;
let conLanGui = 0;
let conLanThu = 0;
let boDem = null;

// Khóa chức năng đổi mật khẩu (nhập sai mật khẩu hiện tại quá 5 lần)
let khoaDenLuc = 0;
let boDemKhoa = null;

const haiSo = (n) => String(n).padStart(2, "0");
const mmss = (giay) => `${haiSo(Math.floor(giay / 60))}:${haiSo(giay % 60)}`;

// Hiện lỗi: 422 có lỗi từng trường thì mỗi lỗi một dòng, còn lại hiện thông báo của backend
function hienLoi(loi) {
    $("thong-bao").textContent = "";
    const ds = $("loi-form");
    ds.replaceChildren();

    const cacCau = Object.values(loi.errors || {}).flat();
    for (const cau of (cacCau.length ? cacCau : [noiDungLoi(loi)])) {
        const li = document.createElement("li");
        li.textContent = cau;
        ds.append(li);
    }
}

function xoaThongBao() {
    $("loi-form").replaceChildren();
    $("thong-bao").textContent = "";
}

// Chỉ một trong ba bước được hiện: "cu" (mật khẩu hiện tại), "moi" (hai ô mật khẩu mới), "otp" (mã email)
function hienBuoc(buoc) {
    $("form-mat-khau-cu").hidden = buoc !== "cu";
    $("form-mat-khau").hidden = buoc !== "moi";
    $("form-otp").hidden = buoc !== "otp";
    if (buoc !== "otp") clearInterval(boDem);
}

// ---------- khóa 30 phút ----------
function capNhatKhoa() {
    const con = Math.max(Math.ceil((khoaDenLuc - Date.now()) / 1000), 0);
    const dangKhoa = con > 0;

    $("khoa").hidden = !dangKhoa;
    $("khoa").textContent = dangKhoa ? `Bạn đã nhập sai mật khẩu hiện tại quá 5 lần. Chức năng đổi mật khẩu bị khóa, thử lại sau ${mmss(con)}.` : "";
    $("mat-khau-cu").disabled = dangKhoa;
    $("nut-kiem-tra").disabled = dangKhoa;
    $("nut-kiem-tra").textContent = dangKhoa ? `Đã khóa, thử lại sau ${mmss(con)}` : "Tiếp tục";

    if (!dangKhoa) clearInterval(boDemKhoa);
}

function datKhoa(giay) {
    khoaDenLuc = Date.now() + giay * 1000;
    clearInterval(boDemKhoa);
    capNhatKhoa();
    boDemKhoa = setInterval(capNhatKhoa, 500);
}

// ---------- mã OTP ----------
function capNhatDem() {
    const conLai = Math.max(Math.ceil((hetHanLuc - Date.now()) / 1000), 0);
    $("dem-nguoc").textContent = conLai > 0 ? `Mã hết hạn sau ${mmss(conLai)}` : 'Mã đã hết hạn, hãy bấm "Gửi lại mã".';

    const cho = Math.max(Math.ceil((guiLaiLuc - Date.now()) / 1000), 0);
    const nut = $("nut-gui-lai");
    nut.disabled = cho > 0 || conLanGui <= 0;
    nut.textContent = conLanGui <= 0 ? "Hết lượt gửi lại" : cho > 0 ? `Gửi lại mã sau ${cho} giây` : "Gửi lại mã";
}

function hienBuocOtp(t) {
    const bay = Date.now();
    hetHanLuc = bay + t.het_han_sau_giay * 1000;
    guiLaiLuc = bay + t.gui_lai_sau_giay * 1000;
    conLanGui = t.con_lan_gui;
    conLanThu = t.con_lan_thu;

    $("email-che").textContent = t.email_che;
    $("con-luot").textContent = `Còn ${conLanThu} lần nhập mã, còn ${conLanGui} lần gửi lại.`;

    hienBuoc("otp");
    capNhatDem();
    clearInterval(boDem);
    boDem = setInterval(capNhatDem, 500);
}

// Hỏi lại backend (sau khi nhập sai mã chẳng hạn) để số lần còn lại luôn đúng
async function lamMoiTrangThai() {
    const t = (await layTrangThaiDoiMatKhau()).du_lieu;
    if (t.dang_cho) hienBuocOtp(t);
}

// Phiên xác minh mật khẩu hiện tại (15 phút) đã hết: quay về bước nhập mật khẩu hiện tại
function canMatKhauCu(loi) {
    if (loi.status === 403 && loi.data?.ma === "CAN_MAT_KHAU_CU") {
        hienBuoc("cu");
        hienLoi({ message: "Phiên xác minh mật khẩu hiện tại đã hết, hãy nhập lại.", errors: {}, status: 403 });
        return true;
    }
    return false;
}

async function main() {
    const ctx = await khoiTaoTrang({ canDangNhap: true });
    if (!ctx) return;

    // nhân viên mới (mật khẩu tạm) bỏ qua bước nhập mật khẩu hiện tại: họ vừa dùng chính mật khẩu đó để đăng nhập
    const batBuoc = Boolean(ctx.nguoiDung.phai_doi_mat_khau);
    $("tieu-de").textContent = batBuoc ? "Đổi mật khẩu bắt buộc" : "Đổi mật khẩu";
    $("gioi-thieu-bat-buoc").hidden = !batBuoc;
    $("gioi-thieu-chu-dong").hidden = batBuoc;
    $("menu").hidden = batBuoc;                      // người bị bắt đổi không nên đi đâu khác
    $("gach-menu").hidden = batBuoc;
    $("ve-trang-chu").hidden = batBuoc;

    try {
        const t = (await layTrangThaiDoiMatKhau()).du_lieu;

        if (t.khoa_con_giay > 0) datKhoa(t.khoa_con_giay);

        if (t.dang_cho) hienBuocOtp(t);                        // tải lại giữa chừng: vào thẳng bước nhập mã
        else if (!batBuoc && !t.da_xac_minh_cu) hienBuoc("cu");
        else hienBuoc("moi");
    } catch (loi) {
        if (xuLyHetPhien(loi)) return;
        hienLoi(loi);
        return;
    }

    for (const [nut, o] of [["hien-mat-khau-cu", ["mat-khau-cu"]], ["hien-mat-khau", ["mat-khau-moi", "nhap-lai"]]]) {
        $(nut).addEventListener("change", (e) => {
            for (const id of o) $(id).type = e.target.checked ? "text" : "password";
        });
    }

    // Bước 1: mật khẩu hiện tại
    $("form-mat-khau-cu").addEventListener("submit", async (e) => {
        e.preventDefault();
        xoaThongBao();
        $("nut-kiem-tra").disabled = true;

        try {
            await kiemTraMatKhauCu($("mat-khau-cu").value);
            $("mat-khau-cu").value = "";                       // không để mật khẩu cũ nằm lại trên trang
            hienBuoc("moi");
        } catch (loi) {
            if (loi.status === 423) {                          // sai quá 5 lần: khóa 30 phút
                hienLoi(loi);
                $("mat-khau-cu").value = "";
                datKhoa(loi.data?.khoa_con_giay ?? 1800);
                return;
            }
            if (xuLyHetPhien(loi)) return;
            hienLoi(loi);                                      // 422: còn N lần thử
            $("mat-khau-cu").value = "";
        } finally {
            if (khoaDenLuc <= Date.now()) $("nut-kiem-tra").disabled = false;
        }
    });

    // Bước 2: gửi mật khẩu mới, nhận mã qua email
    $("form-mat-khau").addEventListener("submit", async (e) => {
        e.preventDefault();
        xoaThongBao();
        $("nut-gui-ma").disabled = true;

        try {
            const t = (await yeuCauDoiMatKhau($("mat-khau-moi").value, $("nhap-lai").value)).du_lieu;
            $("mat-khau-moi").value = "";
            $("nhap-lai").value = "";
            hienBuocOtp(t);
            $("thong-bao").textContent = "Đã gửi mã xác minh, hãy kiểm tra email.";
        } catch (loi) {
            if (xuLyHetPhien(loi) || canMatKhauCu(loi)) return;
            hienLoi(loi);                                      // 422: mật khẩu yếu hoặc không khớp; 429: yêu cầu quá nhiều
        } finally {
            $("nut-gui-ma").disabled = false;
        }
    });

    // Bước 3: nhập mã
    $("form-otp").addEventListener("submit", async (e) => {
        e.preventDefault();
        xoaThongBao();
        $("nut-xac-nhan").disabled = true;

        try {
            await xacNhanDoiMatKhau($("ma-otp").value.trim());
            chuyenTrang("login.html?thongbao=doi-mat-khau");   // backend đã đăng xuất; đăng nhập lại bằng mật khẩu mới
        } catch (loi) {
            if (xuLyHetPhien(loi)) return;
            hienLoi(loi);
            $("ma-otp").value = "";
            try { await lamMoiTrangThai(); } catch { /* giữ nguyên số liệu cũ nếu không hỏi lại được */ }
        } finally {
            $("nut-xac-nhan").disabled = false;
        }
    });

    $("nut-gui-lai").addEventListener("click", async () => {
        xoaThongBao();
        $("nut-gui-lai").disabled = true;

        try {
            hienBuocOtp((await guiLaiOtp()).du_lieu);
            $("ma-otp").value = "";
            $("thong-bao").textContent = "Đã gửi mã mới, mã cũ không còn dùng được.";
        } catch (loi) {
            if (xuLyHetPhien(loi) || canMatKhauCu(loi)) return;
            hienLoi(loi);                                      // 429: chưa đủ 60 giây hoặc hết lượt gửi
            capNhatDem();
        }
    });

    $("nut-nhap-lai-mk").addEventListener("click", () => {
        xoaThongBao();
        hienBuoc("moi");
        $("ma-otp").value = "";
    });
}

main();