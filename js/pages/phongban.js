import { khoiTaoTrang, coQuyen, xuLyHetPhien, noiDungLoi } from "../app.js";
import { layDanhSachPhongBan, doiTrangThaiPhongBan } from "../services/phongban.service.js";

const $ = (id) => document.getElementById(id);

// Các trạng thái của phòng ban (phải khớp PhongBanService::TRANG_THAI ở backend)
const TEN_TRANG_THAI = { 1: "Hoạt động", 0: "Ngừng hoạt động" };

let nguoiDung = null;
let tatCa = [];                                    // toàn bộ phòng ban được xem; ô lọc công ty chỉ lọc trên danh sách này

function bao(loai, noiDung) {
    const o = $("thongbao");
    o.style.color = loai === "loi" ? "crimson" : "green";
    o.textContent = noiDung;
}

// Mỗi phòng ban là một dòng nhân bản từ <template id="mau-dong"> trong phongban.html
function veBang(danhSach) {
    const thanBang = $("bang-phong-ban");
    thanBang.replaceChildren();

    const coQuyenSua = coQuyen(nguoiDung, "phongban.sua");
    const coQuyenDoi = coQuyen(nguoiDung, "phongban.doi_trang_thai");

    for (const p of danhSach) {
        const dong = $("mau-dong").content.cloneNode(true);

        dong.querySelectorAll("[data-cot]").forEach((o) => {
            const giaTri = p[o.dataset.cot];
            o.textContent = giaTri === undefined || giaTri === null ? "—" : giaTri;
        });

        // liên kết "Sửa": chỉ có với người có quyền sửa
        const lienKetSua = dong.querySelector("[data-nut='sua']");
        if (lienKetSua) {
            if (coQuyenSua) lienKetSua.href = `phongban-sua.html?id=${p.id}`;
            else lienKetSua.remove();
        }

        // ô chọn "Chuyển đổi trạng thái": chỉ có với người có quyền
        const chon = dong.querySelector("[data-nut='doi-trang-thai']");
        if (chon) {
            if (!coQuyenDoi) {
                chon.remove();
            } else {
                chon.querySelector(`option[value="${p.trang_thai}"]`)?.remove();   // bỏ lựa chọn trùng trạng thái hiện tại
                chon.addEventListener("change", () => doiTrangThai(p, chon));
            }
        }

        thanBang.append(dong);
    }
}

// Ô lọc công ty: dựng từ chính danh sách; nếu chỉ có một công ty thì ẩn đi
function veOLoc() {
    const oLoc = $("loc-cong-ty");
    const dangChon = oLoc.value;

    const congTy = new Map();
    for (const p of tatCa) congTy.set(p.id_cong_ty, p.ten_cong_ty);

    oLoc.replaceChildren();
    const tatCaOption = document.createElement("option");
    tatCaOption.value = "";
    tatCaOption.textContent = "Tất cả công ty";
    oLoc.append(tatCaOption);

    for (const [id, ten] of congTy) {
        const o = document.createElement("option");
        o.value = id;
        o.textContent = ten;
        oLoc.append(o);
    }

    oLoc.value = congTy.has(Number(dangChon)) ? dangChon : "";
    $("khung-loc").hidden = congTy.size < 2;
}

function ve() {
    const id = $("loc-cong-ty").value;
    veBang(id === "" ? tatCa : tatCa.filter((p) => String(p.id_cong_ty) === id));
}

async function taiDanhSach() {
    $("thongbao").textContent = "";

    try {
        tatCa = (await layDanhSachPhongBan()).du_lieu;
        veOLoc();
        ve();
    } catch (loi) {
        if (xuLyHetPhien(loi)) return;
        bao("loi", noiDungLoi(loi));
    }
}

async function doiTrangThai(p, chon) {
    const trangThaiMoi = chon.value;
    if (trangThaiMoi === "") return;

    const tenMoi = TEN_TRANG_THAI[trangThaiMoi];
    if (!window.confirm(`Chuyển "${p.ten}" (${p.ma}) sang trạng thái "${tenMoi}"?`)) {
        chon.value = "";                          // không đồng ý: trả ô chọn về ban đầu
        return;
    }

    chon.disabled = true;
    try {
        await doiTrangThaiPhongBan(p.id, trangThaiMoi);
        await taiDanhSach();                      // vẽ lại bảng với trạng thái mới
        bao("thanhcong", `Đã chuyển "${p.ten}" sang "${tenMoi}".`);
    } catch (loi) {
        chon.disabled = false;
        chon.value = "";
        if (xuLyHetPhien(loi)) return;
        bao("loi", noiDungLoi(loi));              // ví dụ 409: còn nhân viên hoặc phòng ban con
    }
}

async function main() {
    // ai có quyền xem phòng ban đều vào được (chỉ thấy phòng ban trong phạm vi của mình); Sửa, Thêm, đổi trạng thái hiện theo quyền
    const ctx = await khoiTaoTrang({ canDangNhap: true, quyenCan: "phongban.xem" });
    if (!ctx) return;
    nguoiDung = ctx.nguoiDung;

    $("lien-ket-them").hidden = !coQuyen(nguoiDung, "phongban.them");
    $("loc-cong-ty").addEventListener("change", ve);

    await taiDanhSach();

    // thông báo sau khi thêm hoặc sửa (trang kia chuyển về đây kèm ?thongbao=...)
    const tham = new URLSearchParams(window.location.search).get("thongbao");
    const CAU = { them: "Đã thêm phòng ban.", sua: "Đã lưu thay đổi phòng ban." };
    if (CAU[tham]) {
        bao("thanhcong", CAU[tham]);
        window.history.replaceState(null, "", "phongban.html");   // F5 không hiện lại thông báo cũ
    }
}

main();