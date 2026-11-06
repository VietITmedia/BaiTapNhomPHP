import { layThongTinNguoiDung, dangXuat } from "./services/auth.service.js";

export const TRANG_DANG_NHAP = "login.html";
export const TRANG_CHINH = "dashboard.html";

// Danh sách chức năng của hệ thống. Thêm tính năng mới = thêm MỘT khối ở đây.
//   quyen / href : trang xem (danh sách) của chức năng, cũng là mục trên menu
//   hanhDong     : các thẻ hiện ở trang chủ, mỗi thẻ dẫn sang một trang riêng
//                  (Sửa và Ngừng dùng thao tác trên một dòng cụ thể nên nằm ở trang danh sách)
const CHUC_NANG = [
  {
    ten: "Chức vụ",
    tienTo: "chucvu",
    href: "chucvu.html",
    quyen: "chucvu.xem",
    hanhDong: [
      {
        ten: "Xem danh sách",
        moTa: "Xem các chức vụ của tập đoàn",
        href: "chucvu.html",
        quyen: "chucvu.xem",
      },
      {
        ten: "Thêm chức vụ",
        moTa: "Tạo một chức vụ mới",
        href: "chucvu-them.html",
        quyen: "chucvu.them",
      },
    ],
  },
  {
    ten: "Nhân viên",
    tienTo: "nhanvien",
    href: "nhanvien.html",
    quyen: "nhanvien.xem",
    hanhDong: [
      {
        ten: "Xem danh sách",
        moTa: "Danh bạ nhân viên trong phạm vi của bạn",
        href: "nhanvien.html",
        quyen: "nhanvien.xem",
      },
      {
        ten: "Thêm nhân viên",
        moTa: "Tạo hồ sơ và tài khoản cho nhân viên mới",
        href: "nhanvien-them.html",
        quyen: "nhanvien.them",
      },
    ],
  },
  {
    ten: "Công ty",
    tienTo: "congty",
    href: "congty.html",
    quyen: "congty.xem",
    hanhDong: [
      {
        ten: "Xem danh sách",
        moTa: "Thông tin các công ty trong phạm vi của bạn",
        href: "congty.html",
        quyen: "congty.xem",
      },
      {
        ten: "Thêm công ty",
        moTa: "Tạo một công ty thành viên mới",
        href: "congty-them.html",
        quyen: "congty.them",
      },
    ],
  },
  {
    ten: "Phòng ban",
    tienTo: "phongban",
    href: "phongban.html",
    quyen: "phongban.xem",
    hanhDong: [
      {
        ten: "Xem danh sách",
        moTa: "Các phòng ban trong phạm vi của bạn",
        href: "phongban.html",
        quyen: "phongban.xem",
      },
      {
        ten: "Thêm phòng ban",
        moTa: "Tạo một phòng ban mới trong công ty",
        href: "phongban-them.html",
        quyen: "phongban.them",
      },
    ],
  },
];

const NHAN_PHAM_VI = {
  tat_ca: "Toàn tập đoàn",
  cong_ty: "Công ty của bạn",
  cap_duoi: "Cấp dưới của bạn",
  cua_minh: "Chỉ của bạn",
};

export const coQuyen = (nguoiDung, ten) => Boolean(nguoiDung?.quyen?.[ten]);

// replace: nút Back không quay lại trang cũ
export function chuyenTrang(duongDan) {
  window.location.replace(duongDan);
}

// Lỗi API do hết phiên (401) thì về trang đăng nhập. Trả true nếu đã xử lý.
export function xuLyHetPhien(loi) {
  if (loi?.status === 401) {
    chuyenTrang(TRANG_DANG_NHAP);
    return true;
  }
  return false;
}

// Nội dung báo lỗi cho người dùng: lỗi từng trường (422) hoặc thông báo từ backend (403, 409...)
export function noiDungLoi(loi) {
  if (!loi?.status) return "Không kết nối được máy chủ.";

  const chiTiet = Object.values(loi.errors || {})
    .flat()
    .join(" ");
  return chiTiet || loi.message;
}

function veMenu(nguoiDung) {
  const nav = document.getElementById("menu");
  if (!nav) return;

  nav.replaceChildren();

  const tenFile = window.location.pathname.split("/").pop();
  const cacMuc = [
    { ten: "Trang chủ", href: TRANG_CHINH, tienTo: "dashboard" },
    ...CHUC_NANG.filter((cn) => coQuyen(nguoiDung, cn.quyen)),
     { ten: "Đổi mật khẩu", href: "doi-mat-khau.html", tienTo: "doi-mat-khau" },
  ];

  for (const muc of cacMuc) {
    const a = document.createElement("a");
    a.href = muc.href;
    a.textContent = muc.ten;
    a.style.marginRight = "12px";
    if (tenFile.startsWith(muc.tienTo)) a.style.fontWeight = "bold";
    nav.append(a);
  }
}

function taoThe(hanhDong, nguoiDung) {
  const the = document.createElement("a");
  the.href = hanhDong.href;
  the.style.cssText =
    "display:block;width:260px;padding:12px;border:1px solid #999;border-radius:8px;text-decoration:none;color:inherit";

  const tieuDe = document.createElement("strong");
  tieuDe.textContent = hanhDong.ten;

  const moTa = document.createElement("div");
  moTa.textContent = hanhDong.moTa;

  const phamVi = document.createElement("small");
  phamVi.style.display = "block";
  phamVi.textContent =
    "Phạm vi: " + (NHAN_PHAM_VI[nguoiDung.quyen[hanhDong.quyen]] ?? "");

  the.append(tieuDe, moTa, phamVi);
  return the;
}

// Trang chủ: mỗi chức năng một nhóm, mỗi hành động được phép là một thẻ dẫn sang trang riêng
function veChucNang(nguoiDung) {
  const khung = document.getElementById("danh-sach-chuc-nang");
  if (!khung) return;

  khung.replaceChildren();
  let coThe = false;

  for (const nhom of CHUC_NANG) {
    const cacThe = nhom.hanhDong.filter((hd) => coQuyen(nguoiDung, hd.quyen));
    if (cacThe.length === 0) continue;
    coThe = true;

    const tenNhom = document.createElement("h4");
    tenNhom.textContent = nhom.ten;
    tenNhom.style.cssText = "width:100%;margin:12px 0 0";
    khung.append(tenNhom);

    for (const hd of cacThe) khung.append(taoThe(hd, nguoiDung));
  }

  if (!coThe)
    khung.textContent = "Tài khoản của bạn chưa được cấp chức năng nào.";
}

// Điền thông tin vào mọi phần tử có data-nguoi-dung="ho_ten", "vai_tro"...
function dienThongTin(nguoiDung) {
  document.querySelectorAll("[data-nguoi-dung]").forEach((el) => {
    const giaTri = nguoiDung[el.dataset.nguoiDung];
    el.textContent = Array.isArray(giaTri) ? giaTri.join(", ") : (giaTri ?? "");
  });
}

function ganNutDangXuat() {
  document.querySelectorAll("[data-hanh-dong='dang-xuat']").forEach((nut) => {
    nut.addEventListener("click", async () => {
      nut.disabled = true;
      try {
        await dangXuat();
      } catch (loi) {
        // 401 hoặc 419: phiên đã mất sẵn, coi như đã thoát; lỗi khác thì báo để thử lại
        if (loi.status !== 401 && loi.status !== 419) {
          nut.disabled = false;
          window.alert("Không đăng xuất được, vui lòng thử lại.");
          return;
        }
      }
      chuyenTrang(TRANG_DANG_NHAP);
    });
  });
}

/**
 * Mọi trang gọi hàm này ĐẦU TIÊN.
 *   canDangNhap: true  = trang trong hệ thống (chưa đăng nhập thì về trang đăng nhập)
 *                false = trang đăng nhập (đã đăng nhập thì vào thẳng bên trong)
 *   quyenCan:    tên quyền để vào trang này (không đủ thì về trang chủ)
 * Trả về { nguoiDung } để trang tiếp tục, hoặc null nếu đã chuyển trang hoặc lỗi (trang dừng lại).
 */
export async function khoiTaoTrang({
  canDangNhap = true,
  quyenCan = null,
} = {}) {
  let nguoiDung = null;

  try {
    nguoiDung = (await layThongTinNguoiDung()).nguoi_dung;
  } catch (loi) {
    if (loi.status !== 401) {
      // mất kết nối hoặc lỗi máy chủ
      document.body.hidden = false;
      document.body.textContent =
        "Không kết nối được máy chủ. Hãy tải lại trang.";
      return null;
    }
  }

  if (canDangNhap && !nguoiDung) {
    chuyenTrang(TRANG_DANG_NHAP);
    return null;
  }
  if (!canDangNhap && nguoiDung) {
    chuyenTrang(TRANG_CHINH);
    return null;
  }

  if (nguoiDung) {
    // còn cờ bắt đổi mật khẩu: chỉ được ở trang đổi mật khẩu (backend cũng chặn mọi API nghiệp vụ khác)
    if (
      nguoiDung.phai_doi_mat_khau &&
      window.location.pathname.split("/").pop() !== "doi-mat-khau.html"
    ) {
      chuyenTrang("doi-mat-khau.html");
      return null;
    }

    if (quyenCan && !coQuyen(nguoiDung, quyenCan)) {
      chuyenTrang(TRANG_CHINH); // không đủ quyền vào trang này
      return null;
    }
    veMenu(nguoiDung);
    veChucNang(nguoiDung);
    dienThongTin(nguoiDung);
    ganNutDangXuat();
  }

  document.body.hidden = false; // chỉ hiện trang sau khi đã kiểm tra xong
  return { nguoiDung };
}