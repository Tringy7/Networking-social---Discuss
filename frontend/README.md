# DISCUSS — Frontend

Ứng dụng React/Vite của DISCUSS. Hướng dẫn kiến trúc, trạng thái tính năng, cấu hình hạ tầng và sử dụng nằm trong [README chính](../README.md).

## Chạy local

Chuẩn bị và chạy backend cùng MySQL, Redis, SMTP và MinIO theo README chính. Trong `frontend/`, tạo `.env`:

```dotenv
VITE_API_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=replace_with_google_client_id
VITE_MINIO_ENDPOINT=http://localhost:9000
VITE_MINIO_BUCKET=discuss-media
```

Các biến `VITE_*` hiển thị trong bundle: không đặt secret vào đây.

```sh
npm ci
npm run dev
```

Truy cập `http://localhost:5173`. API client gửi cookie với `credentials: include`; dùng cùng hostname và đúng CORS của backend.

## Lệnh

| Lệnh | Chức năng |
| --- | --- |
| `npm run dev` | Vite development server |
| `npm run build` | Build vào `dist/` |
| `npm run preview` | Xem bản build local; cần CORS nếu gọi API từ port preview |
| `npm run lint` | ESLint hiện áp dụng cho JavaScript/JSX |

Không có script `npm test` trong package hiện tại. Vite yêu cầu Node `20.19+` thuộc nhánh 20 hoặc `22.12+` trở lên.

## Tích hợp hiện tại

Tài khoản, hồ sơ, cộng đồng, bài viết, bình luận, tạo báo cáo và quản lý thiết bị dùng API. Thông báo/tin nhắn còn dùng dữ liệu mẫu; quản trị và xử lý báo cáo chưa được bật đầy đủ. Các cờ nằm tại `src/services/index.ts`.

Luồng chính bắt đầu ở `src/main.jsx`, chuyển qua `App.jsx` sang `App.tsx`. `src/routes/` quản lý điều hướng, `src/services/` gọi API và `src/store/` quản lý trạng thái bằng Zustand. Một số component/context JSX cũ còn trong cây thư mục; kiểm tra router trước khi sửa.
