# Discuss

Discuss là nền tảng mạng xã hội chia sẻ và thảo luận theo cộng đồng chủ đề. Người dùng có thể khám phá cộng đồng, đăng bài viết dạng Markdown, bình luận, phản ứng, lưu bài, báo cáo vi phạm, nhận thông báo và quản lý tài khoản. Hệ thống còn cung cấp cổng quản trị để kiểm duyệt người dùng, cộng đồng, bài viết, báo cáo, danh mục và ghi nhật ký hoạt động.

## 1. Mục tiêu dự án

- Xây dựng môi trường thảo luận trực tuyến theo từng chủ đề.
- Hỗ trợ bài viết Markdown, media, bình luận, bình chọn và lưu bài.
- Cung cấp quy trình xác thực an toàn và quản lý phiên đăng nhập.
- Xây dựng cơ chế báo cáo, moderator review và kiểm duyệt quản trị.
- Phân tách frontend, REST API, cơ sở dữ liệu, Redis và object storage.

## 2. Công nghệ sử dụng

### 2.1. Frontend

- React 19, JavaScript và TypeScript.
- Vite.
- React Router DOM.
- Zustand.
- Fetch API thông qua API client dùng chung; Axios có trong một số module cũ.
- Tailwind CSS.
- Framer Motion, Lucide React và Recharts.
- `react-markdown`, `remark-gfm` và `rehype-highlight` để hiển thị Markdown.

### 2.2. Backend

- Java 21.
- Spring Boot 4.
- Spring MVC, Spring Validation và RESTful API.
- Spring Security và Spring OAuth2 Resource Server.
- JWT và BCrypt.
- Spring Data JPA/Hibernate.
- MySQL.
- Redis.
- Spring Mail và Thymeleaf.
- Google social sign-in.
- MinIO cho media.
- Thumbnailator và WebP ImageIO.
- MapStruct và Lombok.
- Maven.
- Spring `@Scheduled` cho notification outbox worker.

## 3. Kiến trúc tổng thể

```text
Trình duyệt
    |
    +-- React SPA
    |     +-- React Router
    |     +-- Zustand
    |     +-- Markdown renderer
    |     +-- Fetch API client + cookie xác thực
    |
    +-- REST/JSON
          |
          +-- Spring Boot
                +-- Controller
                +-- Service
                +-- Repository
                +-- JPA/Hibernate
                +-- MySQL
                +-- Redis
                +-- SMTP
                +-- MinIO
                +-- Notification Outbox Worker
```

Frontend gọi backend qua `VITE_API_URL`, mặc định `http://localhost:8080`. API client gửi `credentials: 'include'`, xử lý lỗi tập trung và tự làm mới access token khi refresh thành công.

Backend được tổ chức theo controller, DTO, mapper, service, repository, entity và exception handler theo từng miền nghiệp vụ.

## 4. Chức năng đã triển khai

### 4.1. Xác thực và tài khoản

- Đăng ký tài khoản và xác minh email bằng OTP.
- Gửi lại OTP có thời hạn và cơ chế gửi lại.
- Đăng nhập bằng username/password.
- Đăng nhập bằng Google ID token.
- Access token và refresh token lưu trong HTTP-only cookie.
- Làm mới access token bằng refresh token.
- Liệt kê và thu hồi phiên đăng nhập.
- Đăng xuất và thu hồi refresh token.
- Quên mật khẩu, xác minh OTP đặt lại mật khẩu và đặt mật khẩu mới.
- Đổi mật khẩu theo luồng OTP riêng.
- Trang tài khoản bị khóa.
- Băm mật khẩu bằng BCrypt.
- Kiểm tra loại access/refresh token và trạng thái phiên trong JWT decoder.

### 4.2. Hồ sơ người dùng

- Xem hồ sơ cá nhân và hồ sơ công khai.
- Cập nhật tên hiển thị, bio, vị trí, ngày sinh và giới tính.
- Tải avatar và banner.
- Cấu hình quyền hiển thị ngày sinh, vị trí và bài viết.
- Tìm kiếm người dùng.
- Xem bài viết và thống kê công khai của người dùng.

### 4.3. Cộng đồng

- Khám phá, tìm kiếm và lọc cộng đồng theo danh mục.
- Tạo và cập nhật cộng đồng.
- Tải/cập nhật avatar và banner.
- Tham gia/rời cộng đồng.
- Xem thành viên và vai trò.
- Bổ nhiệm/gỡ moderator.
- Kick thành viên.
- Chuyển quyền owner.
- Thiết lập nhận thông báo bài viết mới.
- Dùng quy tắc và trạng thái public/private/active/locked.

### 4.4. Bài viết

- Tạo bài viết bằng JSON hoặc multipart.
- Hỗ trợ Markdown, tiêu đề, slug, tóm tắt, liên kết, loại bài và media.
- Chỉnh sửa toàn bộ nội dung; community của bài không thay đổi.
- Xem bài theo feed, cộng đồng và người dùng.
- Tab feed: dành cho bạn, mới nhất, nổi bật.
- Tìm kiếm bài viết.
- Upvote/downvote bài viết.
- Lưu/bỏ lưu bài viết.
- Xem bài đã lưu.
- Xóa mềm vào thùng rác.
- Khôi phục bài viết.
- Xóa bài viết.
- Hiển thị Markdown và media.

### 4.5. Bình luận

- Xem danh sách/cây bình luận theo bài viết.
- Tạo bình luận bằng văn bản hoặc kèm hình ảnh.
- Trả lời bình luận cha.
- Chỉnh sửa và xóa bình luận.
- Upvote/downvote bình luận.
- Kiểm tra quyền xem và thao tác theo bài viết/cộng đồng.

### 4.6. Báo cáo và kiểm duyệt

- Gửi báo cáo bài viết, bình luận hoặc cộng đồng.
- Phân loại trạng thái báo cáo.
- Owner/moderator xem và xử lý báo cáo trong cộng đồng.
- Quản trị viên xem danh sách, chi tiết, tìm kiếm và lọc báo cáo.
- Giải quyết/từ chối báo cáo kèm ghi chú.
- Ghi activity log cho thao tác kiểm duyệt.

### 4.7. Thông báo

- Thông báo bài viết mới trong cộng đồng.
- Thông báo bình luận và phản hồi bình luận.
- Thông báo báo cáo mới và kết quả xử lý.
- Phân trang, lọc chưa đọc và đếm số thông báo chưa đọc.
- Đánh dấu một thông báo hoặc toàn bộ là đã đọc.
- Xóa thông báo đã đọc.
- Đưa các sự kiện vào transactional outbox.
- Worker `@Scheduled` xử lý theo batch, retry và đánh dấu thất bại sau số lần tối đa.

### 4.8. Quản trị

- Dashboard thống kê tổng quan.
- Quản lý người dùng: tìm kiếm, lọc, xem chi tiết, khóa/mở khóa.
- Quản lý cộng đồng: tìm kiếm, lọc, xem chi tiết, khóa/mở khóa.
- Quản lý bài viết: tìm kiếm, lọc, xem chi tiết và xóa.
- Quản lý danh mục: xem, tạo, sửa, xóa.
- Quản lý báo cáo: xem, lọc, xem chi tiết, giải quyết/từ chối.
- Xem activity log theo actor, action và target type.
- Endpoint `/admin/**` yêu cầu role `ADMIN`.

### 4.9. Media

- Tải avatar/banner người dùng và cộng đồng.
- Tải nhiều media cho bài viết/bình luận.
- Kiểm soát dung lượng, kích thước pixel, số tệp, multipart và mức xử lý đồng thời.
- Lưu object và tạo URL công khai bằng MinIO.

## 5. Mô hình dữ liệu chính

- **Người dùng:** `User`, `UserProfile`, `UserPrivacySettings`, `RefreshToken`, `AuthSession`.
- **Cộng đồng:** `Community`, `CommunityInfo`, `CommunityMember`, `CommunityNotificationPreference`, `Category`, `BanHistory`.
- **Bài viết:** `Post`, `PostContent`, `PostMedia`, `PostSave`, `PostVote`.
- **Bình luận:** `Comment`, `CommentAttachment`, `CommentVote`.
- **Báo cáo:** `PostReport`, `CommentReport`, `CommunityReport`.
- **Thông báo:** `Notification`, `OutboxEvent`.
- **Quản trị:** `AdminActivityLog`.

Dự án sử dụng JPA/Hibernate để ánh xạ entity vào MySQL. Hibernate được cấu hình `ddl-auto=update` và dữ liệu danh mục/cộng đồng được seed bằng `CommandLineRunner`.

## 6. Luồng hoạt động tiêu biểu

### 6.1. Đăng ký và đăng nhập

1. Người dùng gửi thông tin đăng ký.
2. Backend kiểm tra dữ liệu, tạo tài khoản và gửi OTP qua email.
3. Người dùng xác minh OTP.
4. Backend phát hành access token/refresh token và đặt HTTP-only cookie.
5. Frontend khôi phục phiên và tải dữ liệu người dùng.

### 6.2. Tạo bài viết

1. Người dùng nhập Markdown, tiêu đề và media.
2. Frontend gửi JSON hoặc multipart request.
3. `PostController` validation và gọi `PostService`.
4. Media được xử lý/lưu qua MinIO.
5. Bài viết được lưu JPA; một outbox event được tạo.
6. `NotificationOutboxWorker` tạo thông báo cho thành viên phù hợp.

### 6.3. Báo cáo và xử lý

1. Người dùng gửi báo cáo bài viết/bình luận/cộng đồng.
2. Backend lưu báo cáo và tạo outbox event.
3. Owner/moderator hoặc quản trị viên nhận thông báo.
4. Người có thẩm quyền giải quyết hoặc từ chối.
5. Backend ghi activity log và thông báo cho người báo cáo.

## 7. Bảo mật

- JWT được đọc từ cookie `access_token`, fallback từ Authorization Bearer.
- Access token có thời hạn ngắn; refresh token có thời hạn dài.
- Refresh token được lưu/băm và gắn với phiên.
- Có thể thu hồi từng phiên hoặc toàn bộ phiên hiện tại.
- Mật khẩu được mã hóa bằng BCrypt.
- OTP lưu Redis, có thời hạn và giới hạn số lần xác minh.
- CORS cấu hình danh sách origin frontend được phép.
- `/admin/**` yêu cầu role `ADMIN`.
- Validation và `GlobalExceptionHandler` xử lý lỗi tập trung.

## 8. Trạng thái còn hạn chế

- Tin nhắn vẫn dùng dữ liệu demo/local; backend chưa có API `/messages`.
- Chưa tích hợp WebSocket/Socket.IO real-time.
- Chưa tích hợp AI/LLM, grammar checker, dịch văn bản hoặc speech processing.
- Chưa thấy Swagger/OpenAPI trong cấu hình backend.
- Chưa thấy cơ chế rate limiting tổng quát.
- Dependency Cloudinary có trong pom nhưng luồng media hiện triển khai chủ yếu bằng MinIO.

## 9. Cấu hình và chạy dự án

### 9.1. Yêu cầu

- JDK 21.
- Maven hoặc Maven Wrapper.
- Node.js và npm.
- MySQL.
- Redis.
- SMTP server.
- MinIO hoặc object storage tương thích.
- Google OAuth client nếu dùng đăng nhập Google.

### 9.2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Tạo `frontend/.env` nếu backend không chạy tại địa chỉ mặc định:

```dotenv
VITE_API_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=<Google OAuth client ID>
```

### 9.3. Backend

Backend đọc file `backend/.env`. Cần cấu hình:

- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`.
- `JWT_SECRET`.
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`.
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`.

Không commit file `.env` hoặc secret thật.

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

### 9.4. MinIO

```powershell
docker compose up -d minio
```

Docker Compose hiện chỉ khai báo dịch vụ MinIO; MySQL và Redis cần chạy riêng.

## 10. Kiểm thử

```powershell
cd frontend
npm run build
npm run lint

cd ../backend
.\mvnw.cmd test
```

Cần kiểm thử:

- Đăng ký, OTP, đăng nhập, refresh và thu hồi phiên.
- Phân quyền người dùng/cộng đồng/quản trị viên.
- Tạo/sửa/xóa/khôi phục bài viết.
- Bình luận, vote, lưu bài và tìm kiếm.
- Báo cáo và luồng moderator/admin review.
- Upload media và giới hạn dung lượng.
- Notification outbox, retry và trạng thái thất bại.

## 11. Prompt tham khảo để tạo báo cáo bằng AI

```text
Dựa trên README và mã nguồn dự án Discuss, hãy soạn báo cáo đồ án bằng tiếng Việt theo mẫu báo cáo tốt nghiệp.

Yêu cầu:
1. Giữ đúng công nghệ thực tế: React, Spring Boot, JPA/Hibernate, MySQL, Redis, JWT, BCrypt, Google sign-in, MinIO và Spring Scheduled.
2. Phân biệt giữa chức năng hoàn thiện và tin nhắn demo chưa có backend.
3. Mô tả luồng xác thực, bài viết, bình luận, báo cáo, thông báo, moderator và quản trị viên.
4. Không thêm Node.js/Express, TypeORM, Redux Toolkit, Socket.IO, AI/LLM, Swagger/OpenAPI, node-cron hoặc rate limiting nếu chưa có bằng chứng.
5. Không bịa số liệu hiệu năng hoặc kết quả khảo sát.
6. Gắn lý thuyết với implementation của dự án.
7. Entity không đồng nghĩa chức năng API đã hoàn thiện.
8. Nếu thiếu dữ liệu, ghi [CẦN BỔ SUNG: ...].
9. Liệt kê hình giao diện, use case, ERD, sơ đồ lớp, sơ đồ tuần tự, kết quả kiểm thử và môi trường triển khai cần bổ sung.
```
