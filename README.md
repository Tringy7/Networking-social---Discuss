# DISCUSS — Mạng xã hội thảo luận theo cộng đồng

[![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.1.1-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge)](https://openjdk.org/projects/jdk/21/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)

**DISCUSS** là ứng dụng web giúp người dùng kết nối theo chủ đề, xây dựng cộng đồng, chia sẻ bài viết và trao đổi qua bình luận. Dự án gồm frontend React và REST API Spring Boot, có phân quyền cộng đồng và quản lý đăng nhập trên nhiều thiết bị.

[Repository](https://github.com/Tringy7/Networking-social---Discuss) · [Cài đặt](#cài-đặt-và-chạy-dự-án) · [Cách sử dụng](#hướng-dẫn-sử-dụng)

## Chức năng chính

| Nhóm | Chức năng |
| --- | --- |
| Tài khoản | Đăng ký, xác minh email bằng OTP, đăng nhập local/Google, đổi và khôi phục mật khẩu |
| Hồ sơ cá nhân | Cập nhật thông tin, quyền riêng tư, ảnh đại diện và ảnh bìa |
| Cộng đồng | Khám phá, tìm kiếm, tạo cộng đồng, tham gia/rời cộng đồng |
| Quản lý cộng đồng | Chỉnh sửa nội quy, quản lý thành viên, bổ nhiệm moderator và chuyển quyền chủ |
| Bài viết | Tạo/sửa/xóa bài, Markdown, ảnh, bình chọn và lưu bài |
| Bình luận | Bình luận, trả lời theo luồng, đính kèm ảnh và bình chọn |
| Báo cáo | Báo cáo bài viết, bình luận hoặc cộng đồng |
| Bảo mật | Cookie HttpOnly, refresh token rotation, xem và đăng xuất từng thiết bị |
| Giao diện | Hỗ trợ sáng/tối, trình xem ảnh và bố cục phù hợp nhiều kích thước màn hình |

> **Đang phát triển:** thông báo và tin nhắn hiện dùng dữ liệu mẫu. Quản trị hệ thống và xử lý báo cáo chưa được tích hợp đầy đủ; chức năng tạo báo cáo đã nối API.

## Công nghệ sử dụng

| Thành phần | Công nghệ |
| --- | --- |
| Frontend | React 19, TypeScript/JavaScript, Vite 8, React Router, Zustand |
| Giao diện | Tailwind CSS 4, CSS, Lucide React, Framer Motion |
| Backend | Java 21, Spring Boot 4.1.1, Spring Security |
| Dữ liệu | MySQL, Spring Data JPA / Hibernate |
| Xác thực | JWT, cookie HttpOnly, Google Sign-In, OTP qua email |
| Hạ tầng | Redis, MinIO, SMTP |
| Công cụ | Maven Wrapper, npm, Docker Compose |

## Kiến trúc và cấu trúc thư mục

```text
Trình duyệt → React → REST API Spring Boot
                         ├── MySQL: dữ liệu ứng dụng và phiên đăng nhập
                         ├── Redis: OTP và token xác minh
                         ├── MinIO: ảnh
                         └── SMTP: email xác minh
```

```text
.
├── backend/
│   ├── src/main/java/com/discuss/discuss/
│   │   ├── config/         # Cấu hình bảo mật và hạ tầng
│   │   ├── controller/     # REST API
│   │   ├── service/        # Xử lý nghiệp vụ
│   │   ├── repository/     # Truy vấn dữ liệu
│   │   ├── entity/         # Mô hình database
│   │   ├── dto/            # Request / response
│   │   └── exception/      # Xử lý lỗi
│   ├── src/main/resources/application.properties
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── components/     # Thành phần giao diện
│   │   ├── pages/          # Các trang chức năng
│   │   ├── layouts/        # Bố cục dùng chung
│   │   ├── routes/         # Điều hướng
│   │   ├── services/       # Gọi API
│   │   └── store/          # Quản lý trạng thái
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

## Cài đặt và chạy dự án

### 1. Yêu cầu

- **JDK 21**.
- **Node.js** tương thích Vite: nhánh 20 từ `20.19`, hoặc `22.12` trở lên.
- **MySQL**, **Redis**, **MinIO** và tài khoản **SMTP**.
- **Docker Compose** nếu chạy MinIO bằng cấu hình có sẵn.
- Thông tin **Google OAuth** nếu sử dụng đăng nhập Google.

Dự án có Maven Wrapper nên không bắt buộc cài Maven riêng.

### 2. Clone repository

```bash
git clone https://github.com/Tringy7/Networking-social---Discuss.git
cd Networking-social---Discuss
```

Chọn nhánh phát triển phù hợp nếu các tính năng chưa được merge vào `main`.

### 3. Chuẩn bị dịch vụ

Tạo database trong MySQL:

```sql
CREATE DATABASE discuss CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Khởi động Redis và MinIO. Nếu dùng Docker Compose của dự án, tạo `.env` ở gốc theo `.env.example`, sau đó chạy:

```bash
docker compose up -d minio
```

**Lưu ý:** compose hiện chỉ chạy MinIO và dùng image nội bộ `discuss-minio:local`. Cần nạp/build image này trước hoặc dùng dịch vụ MinIO đã có. MySQL và Redis phải chuẩn bị riêng.

### 4. Cấu hình môi trường

Tạo **`backend/.env`**:

```dotenv
DB_URL=jdbc:mysql://localhost:3306/discuss?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
DB_USERNAME=your_database_user
DB_PASSWORD=your_database_password

JWT_SECRET=your_base64_encoded_random_secret

MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=your_smtp_username
MAIL_PASSWORD=your_smtp_password

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=your_minio_access_key
MINIO_SECRET_KEY=your_minio_secret_key
MINIO_BUCKET=discuss-media
```

`JWT_SECRET` phải là chuỗi Base64 của ít nhất 32 byte ngẫu nhiên. Thay toàn bộ giá trị mẫu bằng cấu hình thực tế. Backend đọc `.env` theo thư mục làm việc, vì vậy chạy BE từ `backend/`.

Tạo **`frontend/.env`**:

```dotenv
VITE_API_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_MINIO_ENDPOINT=http://localhost:9000
VITE_MINIO_BUCKET=discuss-media
```

Client ID Google ở FE và BE phải khớp. Không đặt mật khẩu hoặc client secret vào biến `VITE_*` vì các biến này xuất hiện trong bundle frontend. Không commit `.env`.

### 5. Chạy backend

Mở terminal thứ nhất:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Trên macOS/Linux, dùng `./mvnw spring-boot:run`.

### 6. Chạy frontend

Mở terminal thứ hai từ gốc repository:

```bash
cd frontend
npm ci
npm run dev
```

| Dịch vụ | Địa chỉ local |
| --- | --- |
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8080 |
| MinIO API | http://localhost:9000 |
| MinIO Console | http://localhost:9001 |

Dùng thống nhất `localhost`. CORS hiện cho phép frontend tại `http://localhost:5173`; đổi domain/port cần cập nhật `SecurityConfiguration`. Cookie mặc định có `Secure=true`: nếu trình duyệt không nhận cookie qua HTTP local, ghi đè `APP_COOKIE_SECURE=false` cho môi trường local; khi triển khai HTTPS giữ `true`.

## Hướng dẫn sử dụng

1. **Tạo tài khoản:** đăng ký, nhận OTP qua email và xác minh trước khi đăng nhập bằng username/mật khẩu.
2. **Tham gia thảo luận:** khám phá cộng đồng tại `/explore`, mở hoặc tạo cộng đồng, đăng bài và bình luận theo quyền.
3. **Lưu nội dung:** bình chọn, lưu bài và xem lại tại `/saved`.
4. **Quản lý cộng đồng:** chủ cộng đồng mở cài đặt để chỉnh nội quy, quản lý thành viên và chuyển quyền.
5. **Báo cáo vi phạm:** chọn báo cáo ở bài viết, bình luận hoặc trang cộng đồng; bổ sung mô tả nếu chọn lý do khác.
6. **Quản lý thiết bị:** mở **Cài đặt → Tài khoản & Bảo mật** (`/settings/account`) để xem và đăng xuất từng phiên.

Cộng đồng công khai cho phép người đã đăng nhập bình luận dù chưa tham gia, miễn không bị ban. Cộng đồng riêng tư yêu cầu thành viên hợp lệ và không hỗ trợ tự tham gia qua luồng join thông thường.

Mỗi lần đăng nhập tạo phiên riêng cho thiết bị/trình duyệt. Refresh giữ nguyên phiên đó; đăng xuất một phiên không ảnh hưởng các phiên khác. Đổi/reset mật khẩu thu hồi toàn bộ phiên của tài khoản.

## Build

**Backend**, từ `backend/`:

```powershell
.\mvnw.cmd package
```

**Frontend**, từ `frontend/`:

```bash
npm run build
npm run preview
```

Frontend build vào `frontend/dist/`. Chi tiết lệnh frontend tại [frontend/README.md](frontend/README.md).

## Lưu ý

- Backend dùng `ddl-auto=update` trong môi trường phát triển và có dữ liệu khởi tạo danh mục/cộng đồng. Kiểm tra cấu hình trước khi dùng database thật.
- MinIO phải kết nối được khi BE khởi động; SMTP và Redis cần cho các luồng OTP.
- Các token cũ không có thông tin phiên hợp lệ cần đăng nhập lại sau khi cập nhật bảo mật.
- Khi triển khai, cấu hình HTTPS, cookie, CORS, secret và migration phù hợp; compose hiện chưa đóng gói toàn hệ thống.

## Hướng phát triển

- [ ] Hoàn thiện thông báo và tin nhắn bằng API.
- [ ] Hoàn thiện quản trị, hàng đợi kiểm duyệt và xử lý báo cáo.
- [ ] Bổ sung đăng xuất tất cả thiết bị trên UI.
- [ ] Chuẩn hóa migration và cấu hình triển khai.

## Tác giả

**Nguyễn Hữu Trí** — [GitHub](https://github.com/Tringy7).
