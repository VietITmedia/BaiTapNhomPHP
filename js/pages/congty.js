import { khoiTaoTrang, coQuyen, xuLyHetPhien, noiDungLoi } from "../app.js";
import { layDanhSachCongTy, doiTrangThaiCongTy } from "../services/congty.service.js";

const $ = (id) => document.getElementById(id);

// Các trạng thái của công ty (phải khớp CongTyService::TRANG_THAI ở backend)
const TEN_TRANG_THAI = { 1: "Hoạt động", 0: "Ngừng hoạt động" };

let nguoiDung = null;

function bao(loai, noiDung) {
    const o = $("thongbao");
    o.style.color = loai === "loi" ? "crimson" : "green";
    o.textContent = noiDung;
}

// Mỗi công ty là một dòng nhân bản từ <template id="mau-dong"> trong congty.html
function veBang(danhSach) {
    const thanBang = $("bang-cong-ty");
    thanBang.replaceChildren();

    const coQuyenSua = coQuyen(nguoiDung, "congty.sua");
    const coQuyenDoi = coQuyen(nguoiDung, "congty.doi_trang_thai");

    for (const c of danhSach) {
        const dong = $("mau-dong").content.cloneNode(true);

        dong.querySelectorAll("[data-cot]").forEach((o) => {
            const giaTri = c[o.dataset.cot];
            o.textContent = giaTri === undefined || giaTri === null ? "—" : giaTri;
        });

        // liên kết "Sửa"
        const lienKetSua = dong.querySelector("[data-nut='sua']");
        if (lienKetSua) {
            if (coQuyenSua) lienKetSua.href = `congty-sua.html?id=${c.id}`;
            else lienKetSua.remove();
        }

        // ô chọn "Chuyển đổi trạng thái": chỉ có với người có quyền, và không có ở tập đoàn (loai = 0, không ngừng được)
        const chon = dong.querySelector("[data-nut='doi-trang-thai']");
        if (chon) {
            if (!coQuyenDoi || c.loai === 0) {
                chon.remove();
            } else {
                chon.querySelector(`option[value="${c.trang_thai}"]`)?.remove();   // bỏ lựa chọn trùng trạng thái hiện tại
                chon.addEventListener("change", () => doiTrangThai(c, chon));
            }
        }

        thanBang.append(dong);
    }
}

async function taiDanhSach() {
    $("thongbao").textContent = "";

    try {
        veBang((await layDanhSachCongTy()).du_lieu);
    } catch (loi) {
        if (xuLyHetPhien(loi)) return;
        bao("loi", noiDungLoi(loi));
    }
}

async function doiTrangThai(c, chon) {
    const trangThaiMoi = chon.value;
    if (trangThaiMoi === "") return;

    const tenMoi = TEN_TRANG_THAI[trangThaiMoi];
    if (!window.confirm(`Chuyển "${c.ten}" (${c.ma}) sang trạng thái "${tenMoi}"?`)) {
        chon.value = "";                          // không đồng ý: trả ô chọn về ban đầu
        return;
    }

    chon.disabled = true;
    try {
        await doiTrangThaiCongTy(c.id, trangThaiMoi);
        await taiDanhSach();                      // vẽ lại bảng với trạng thái mới
        bao("thanhcong", `Đã chuyển "${c.ten}" sang "${tenMoi}".`);
    } catch (loi) {
        chon.disabled = false;
        chon.value = "";
        if (xuLyHetPhien(loi)) return;
        bao("loi", noiDungLoi(loi));              // ví dụ 409: còn nhân viên, phòng ban hoặc công ty con
    }
}

async function main() {
    // chỉ ai có quyền quản lý công ty mới vào được trang này; thiếu quyền thì về trang chủ
        const ctx = await khoiTaoTrang({ canDangNhap: true, quyenCan: "congty.xem" });
    if (!ctx) return;
    nguoiDung = ctx.nguoiDung;

    $("lien-ket-them").hidden = !coQuyen(nguoiDung, "congty.them");

    await taiDanhSach();

    // thông báo sau khi thêm hoặc sửa (trang kia chuyển về đây kèm ?thongbao=...)
    const tham = new URLSearchParams(window.location.search).get("thongbao");
    const CAU = { them: "Đã thêm công ty.", sua: "Đã lưu thay đổi công ty." };
    if (CAU[tham]) {
        bao("thanhcong", CAU[tham]);
        window.history.replaceState(null, "", "congty.html");   // F5 không hiện lại thông báo cũ
    }
}

main();
