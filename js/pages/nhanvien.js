import { khoiTaoTrang, coQuyen, xuLyHetPhien, noiDungLoi } from "../app.js";
import { layDanhSachNhanVien, doiTrangThaiNhanVien } from "../services/nhanvien.service.js";

const $ = (id) => document.getElementById(id);

// Các trạng thái của nhân viên (phải khớp NhanVienService::TRANG_THAI ở backend)
const TEN_TRANG_THAI = { 1: "Đang làm việc", 2: "Tạm nghỉ", 0: "Đã nghỉ việc" };

let nguoiDung = null;
let trangHienTai = 1;

function bao(loai, noiDung) {
    const o = $("thongbao");
    o.style.color = loai === "loi" ? "crimson" : "green";
    o.textContent = noiDung;
}

// Mỗi nhân viên là một dòng nhân bản từ <template id="mau-dong"> trong nhanvien.html
function veBang(danhSach) {
    const thanBang = $("bang-nhan-vien");
    thanBang.replaceChildren();

    const coQuyenDoi = coQuyen(nguoiDung, "nhanvien.doi_trang_thai");
    const coQuyenSua = coQuyen(nguoiDung, "nhanvien.sua");
    for (const nv of danhSach) {
        const dong = $("mau-dong").content.cloneNode(true);

        dong.querySelectorAll("[data-cot]").forEach((o) => {
            const cot = o.dataset.cot;
            const giaTri = nv[cot];

            if (giaTri === undefined || giaTri === null) {
                o.textContent = "—";                  // backend không gửi trường này (ngoài bậc được xem)
            } else {
                o.textContent = cot === "trang_thai" ? (TEN_TRANG_THAI[giaTri] ?? giaTri) : giaTri;
            }
        });

        // liên kết "Xem": gán địa chỉ trang chi tiết của người ở dòng này
        const lienKet = dong.querySelector("[data-nut='chi-tiet']");
        if (lienKet) lienKet.href = `nhanvien-chitiet.html?id=${nv.id}`;

        // ô chọn "Chuyển đổi trạng thái": chỉ có với người có quyền, và không có ở dòng của chính mình
                // liên kết "Sửa": chỉ có với người có quyền sửa, và không có ở dòng của chính mình
        const lienKetSua = dong.querySelector("[data-nut='sua']");
        if (lienKetSua) {
            if (coQuyenSua && nv.ma !== nguoiDung.ma_nhan_vien) {
                lienKetSua.href = `nhanvien-sua.html?id=${nv.id}`;
            } else {
                lienKetSua.remove();
            }
        }
        const chon = dong.querySelector("[data-nut='doi-trang-thai']");
        if (chon) {
            if (!coQuyenDoi || nv.ma === nguoiDung.ma_nhan_vien) {
                chon.remove();
            } else {
                // bỏ lựa chọn trùng trạng thái hiện tại (chỉ biết khi được xem hồ sơ đầy đủ)
                if (nv.trang_thai !== undefined) {
                    chon.querySelector(`option[value="${nv.trang_thai}"]`)?.remove();
                }
                chon.addEventListener("change", () => doiTrangThai(nv, chon));
            }
        }

        thanBang.append(dong);
    }
}

async function taiTrang() {
    $("thongbao").textContent = "";

    try {
        const kq = await layDanhSachNhanVien({
            trang: trangHienTai,
            tuKhoa: $("tu-khoa").value.trim(),
            trangThai: $("loc-trang-thai").value,
        });
        veBang(kq.du_lieu);

        const pt = kq.phan_trang;
        $("thong-tin-trang").textContent = `Trang ${pt.trang} / ${Math.max(pt.so_trang, 1)} (tổng ${pt.tong} người)`;
        $("nut-truoc").disabled = pt.trang <= 1;
        $("nut-sau").disabled = pt.trang >= pt.so_trang;
    } catch (loi) {
        if (xuLyHetPhien(loi)) return;           // 401: hết phiên, về trang đăng nhập
        bao("loi", noiDungLoi(loi));
    }
}

async function doiTrangThai(nv, chon) {
    const trangThaiMoi = chon.value;
    if (trangThaiMoi === "") return;

    const tenMoi = TEN_TRANG_THAI[trangThaiMoi];
    if (!window.confirm(`Chuyển "${nv.ho_ten}" (${nv.ma}) sang trạng thái "${tenMoi}"?`)) {
        chon.value = "";                          // không đồng ý: trả ô chọn về ban đầu
        return;
    }

    chon.disabled = true;
    try {
        await doiTrangThaiNhanVien(nv.id, trangThaiMoi);
        await taiTrang();                         // vẽ lại bảng với trạng thái mới
        bao("thanhcong", `Đã chuyển ${nv.ho_ten} (${nv.ma}) sang "${tenMoi}".`);
    } catch (loi) {
        chon.disabled = false;
        chon.value = "";
        if (xuLyHetPhien(loi)) return;
        bao("loi", noiDungLoi(loi));              // ví dụ 409: đang quản lý người khác
    }
}

async function main() {
    // chỉ ai có quyền xem nhân viên mới vào được trang này
    const ctx = await khoiTaoTrang({ canDangNhap: true, quyenCan: "nhanvien.xem" });
    if (!ctx) return;
    nguoiDung = ctx.nguoiDung;
        // Hiển thị liên kết Thêm nhân viên nếu có quyền
    const lienKetThem = $("lien-ket-them");

    if (lienKetThem) {
        lienKetThem.hidden = !coQuyen(nguoiDung, "nhanvien.them");
    }
    // chỉ người có quyền xem hồ sơ đầy đủ mới lọc được "Đã nghỉ việc"
    if (!coQuyen(nguoiDung, "nhanvien.xem_day_du")) {
        $("loc-trang-thai").querySelector("option[value='0']")?.remove();
    }

    $("form-tim").addEventListener("submit", (e) => {
        e.preventDefault();
        trangHienTai = 1;                         // tìm kiếm mới thì quay về trang đầu
        taiTrang();
    });
    $("loc-trang-thai").addEventListener("change", () => {
        trangHienTai = 1;
        taiTrang();
    });
    $("nut-truoc").addEventListener("click", () => { trangHienTai -= 1; taiTrang(); });
    $("nut-sau").addEventListener("click", () => { trangHienTai += 1; taiTrang(); });

    await taiTrang();
}

main();