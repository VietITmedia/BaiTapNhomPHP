import { khoiTaoTrang, coQuyen, xuLyHetPhien, noiDungLoi } from "../app.js";
import { layDanhSachChucVu, ngungDungChucVu } from "../services/chucvu.service.js";

const $ = (id) => document.getElementById(id);

// thông báo hiện một lần khi quay về từ trang thêm hoặc sửa (?thongbao=them hoặc sua)
const THONG_BAO_SAU_LUU = { them: "Đã thêm chức vụ.", sua: "Đã cập nhật chức vụ." };

let nguoiDung = null;

function bao(loai, noiDung) {
    const o = $("thongbao");
    o.style.color = loai === "loi" ? "crimson" : "green";
    o.textContent = noiDung;
}

function xuLyLoi(loi) {
    if (xuLyHetPhien(loi)) return;          // 401: hết phiên, về trang đăng nhập
    bao("loi", noiDungLoi(loi));             // 403, 409: thông báo từ backend
}

function taoO(noiDung) {
    const td = document.createElement("td");
    td.textContent = noiDung;                // textContent: không chèn HTML, tránh XSS
    return td;
}

function veBang(danhSach) {
    const thanBang = $("bang-chuc-vu");
    thanBang.replaceChildren();

    for (const cv of danhSach) {
        const hang = document.createElement("tr");
        hang.append(
            taoO(cv.id), taoO(cv.ma), taoO(cv.ten), taoO(cv.mo_ta ?? ""),
            taoO(cv.trang_thai === 1 ? "Đang dùng" : "Ngừng dùng"),
        );

        const oNut = document.createElement("td");

        if (coQuyen(nguoiDung, "chucvu.sua")) {
            const sua = document.createElement("a");     // Sửa: chuyển sang trang sửa của dòng này
            sua.href = `chucvu-sua.html?id=${cv.id}`;
            sua.textContent = "Sửa";
            sua.style.marginRight = "8px";
            oNut.append(sua);
        }
        if (coQuyen(nguoiDung, "chucvu.ngung") && cv.trang_thai === 1) {
            const ngung = document.createElement("button");
            ngung.type = "button";
            ngung.textContent = "Xoá";
            ngung.addEventListener("click", () => ngungDung(cv));
            oNut.append(ngung);
        }
        hang.append(oNut);

        thanBang.append(hang);
    }
}

async function taiDanhSach() {
    try {
        const chiDangDung = $("chi-dang-dung").checked;
        const kq = await layDanhSachChucVu(chiDangDung ? 1 : undefined);
        veBang(kq.du_lieu);
    } catch (loi) {
        xuLyLoi(loi);
    }
}

async function ngungDung(cv) {
    if (!window.confirm(`Ngừng dùng chức vụ "${cv.ten}"?`)) return;

    try {
        await ngungDungChucVu(cv.id);
        bao("thanhcong", "Đã ngừng dùng chức vụ.");
        await taiDanhSach();
    } catch (loi) {
        xuLyLoi(loi);                        // ví dụ 409: còn nhân viên đang giữ chức vụ này
    }
}

async function main() {
    const ctx = await khoiTaoTrang({ canDangNhap: true, quyenCan: "chucvu.xem" });
    if (!ctx) return;
    nguoiDung = ctx.nguoiDung;

    // nút Thêm chỉ hiện khi có quyền (ẩn hiện chỉ để tiện nhìn; backend mới là nơi chặn thật)
    $("lien-ket-them").hidden = !coQuyen(nguoiDung, "chucvu.them");

    const ma = new URLSearchParams(window.location.search).get("thongbao");
    if (Object.hasOwn(THONG_BAO_SAU_LUU, ma)) {
        bao("thanhcong", THONG_BAO_SAU_LUU[ma]);
        window.history.replaceState(null, "", "chucvu.html");   // F5 không hiện lại thông báo
    }

    $("chi-dang-dung").addEventListener("change", taiDanhSach);
    await taiDanhSach();
}

main();
