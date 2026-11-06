import { khoiTaoTrang, chuyenTrang, xuLyHetPhien, noiDungLoi } from "../app.js";
import { layNhanVien } from "../services/nhanvien.service.js";

const $ = (id) => document.getElementById(id);

const MUC_XEM = { 1: "Danh bạ", 2: "Danh bạ và liên hệ", 3: "Hồ sơ đầy đủ" };

// "2020-01-15" -> "15/01/2020"
function ngayVN(chuoi) {
    const [nam, thang, ngay] = String(chuoi).split("-");
    return `${ngay}/${thang}/${nam}`;
}

// Đổi giá trị thô của backend thành chữ dễ đọc (cột nào không có ở đây thì hiện nguyên giá trị)
const DINH_DANG = {
    gioi_tinh: (v) => (Number(v) === 0 ? "Nữ" : "Nam"),
    trang_thai: (v) => (Number(v) === 1 ? "Đang làm" : "Đã nghỉ việc"),
    ngay_sinh: ngayVN,
    ngay_vao_lam: ngayVN,
     trang_thai: (v) => ({ 1: "Đang làm việc", 2: "Tạm nghỉ", 0: "Đã nghỉ việc" }[Number(v)] ?? v),
};

// Mỗi ô có data-cot="tên trường" thì điền đúng trường đó
function dien(nv) {
    document.querySelectorAll("[data-cot]").forEach((o) => {
        const cot = o.dataset.cot;

        if (!(cot in nv)) {                          // backend KHÔNG gửi trường này = ngoài mức được xem
            o.textContent = "Không có quyền xem";
            o.style.color = "#888";
            return;
        }

        const giaTri = nv[cot];
        o.textContent = giaTri === null || giaTri === "" ? "—" : (DINH_DANG[cot] ? DINH_DANG[cot](giaTri) : giaTri);
    });

    $("muc-xem").textContent = MUC_XEM[nv.bac] ?? "";
}

async function main() {
    const ctx = await khoiTaoTrang({ canDangNhap: true, quyenCan: "nhanvien.xem" });
    if (!ctx) return;

    // trang này cần biết xem ai: lấy id từ địa chỉ (nhanvien-chitiet.html?id=19)
    const id = Number(new URLSearchParams(window.location.search).get("id"));
    if (!Number.isInteger(id) || id <= 0) {
        chuyenTrang("nhanvien.html");
        return;
    }

    try {
        const kq = await layNhanVien(id);
        dien(kq.du_lieu);
    } catch (loi) {
        if (xuLyHetPhien(loi)) return;
        $("khung-chi-tiet").hidden = true;
        $("thongbao").style.color = "crimson";
        $("thongbao").textContent = loi.status === 404 ? "Không tìm thấy nhân viên." : noiDungLoi(loi);
    }
}

main();