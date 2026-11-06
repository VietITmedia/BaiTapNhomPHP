import { API_CONFIG } from "../config/api.config.js";

/* ---------- Phần 2: đọc cookie theo tên ---------- */
    function getCookie(name) {
        const cookie = document.cookie
            .split("; ")
            .find(item => item.startsWith(`${name}=`));

        // cookie lưu dạng mã hóa URL (đuôi %3D), phải giải mã
        return cookie ? decodeURIComponent(cookie.substring(name.length + 1)) : null;
    }

    /* ---------- Phần 3: xin cookie CSRF nếu chưa có ---------- */
    async function damBaoCsrfCookie() {
        if (getCookie("XSRF-TOKEN")) return;

        await fetch(`${API_CONFIG.BASE_URL}/sanctum/csrf-cookie`, {
            credentials: "include"
        });
    }

    /* ---------- Phần 4: hàm chung, mọi yêu cầu đi qua đây ---------- */
    export async function apiRequest(endpoint, options = {}) {
        const method = (options.method || "GET").toUpperCase();

        const headers = new Headers(options.headers || {});
        headers.set("Accept", "application/json");

        // gửi JSON thì phải khai báo
        if (options.body && typeof options.body === "string") {
            headers.set("Content-Type", "application/json");
        }

        // lệnh làm thay đổi dữ liệu (POST, PUT, PATCH, DELETE) cần mã CSRF
        if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
            await damBaoCsrfCookie();
            const maCsrf = getCookie("XSRF-TOKEN");
            if (maCsrf) headers.set("X-XSRF-TOKEN", maCsrf);
        }

        let response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
            ...options,
            method,
            headers,
            credentials: "include"      // luôn gửi và nhận cookie
        });

        // 419 = mã CSRF cũ (phiên đã đổi): xin mã mới rồi thử lại đúng một lần
        if (response.status === 419 && !options._daThuLai) {
            await fetch(`${API_CONFIG.BASE_URL}/sanctum/csrf-cookie`, { credentials: "include" });
            return apiRequest(endpoint, { ...options, _daThuLai: true });
        }

        // 204 = thành công nhưng không có nội dung
        const data = response.status === 204
            ? null
            : await response.json().catch(() => null);

        if (!response.ok) {
            const error = new Error(data?.loi || data?.message || `HTTP ${response.status}`);
            error.status = response.status;
            error.errors = data?.errors || {};
            error.data = data;
            throw error;
        }

        return data;
    }

/* ---------- Phần 5: hàm tắt theo phương thức ---------- */
export const api = {
    get:    (endpoint)       => apiRequest(endpoint),
    post:   (endpoint, body) => apiRequest(endpoint, { method: "POST",   body: JSON.stringify(body ?? {}) }),
    put:    (endpoint, body) => apiRequest(endpoint, { method: "PUT",    body: JSON.stringify(body ?? {}) }),
    patch:  (endpoint, body) => apiRequest(endpoint, { method: "PATCH",  body: JSON.stringify(body ?? {}) }),
    delete: (endpoint)       => apiRequest(endpoint, { method: "DELETE" }),
};