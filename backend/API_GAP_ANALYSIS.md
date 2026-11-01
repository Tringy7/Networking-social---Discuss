# Phân tích API còn thiếu cho backend Discuss

## Phạm vi và cách đánh giá

Tài liệu này chỉ rà soát backend Spring Boot trong `backend/src/main/java`. Các API dưới đây được xem là **chưa triển khai ở tầng HTTP/controller** sau khi đối chiếu các controller hiện có. Đây là đề xuất cho một mạng xã hội thảo luận theo mô hình Reddit; tên và đường dẫn có thể được chuẩn hóa lại theo quy ước API của dự án trước khi triển khai.

Backend đã có entity cho `Post`, `PostContent`, `PostVote`, `Comment`, các loại report, `CommunityMember` và `BanHistory`, nhưng chưa có controller/service/repository tương ứng cho các luồng bài viết, bình luận, vote, report và ban. Vì vậy, có thể tái sử dụng một phần mô hình dữ liệu hiện có; cần kiểm tra và bổ sung tầng nghiệp vụ, truy vấn, phân quyền và DTO.

## API đã có

| Nhóm | API hiện có |
|---|---|
| Xác thực | `POST /auth/register`, `/auth/login`, `/auth/logout`, `/auth/refresh`, `/auth/verify-email`, `/auth/resend-otp`, `/auth/social/{provider}`, `/auth/forgot-password`, `/auth/forgot-password/verify`, `/auth/forgot-password/reset`; `PATCH /auth/change-password` |
| Community | `POST /communities`; `GET /communities/{name}`; `PATCH /communities/{name}`; `DELETE /communities/{name}`; `PUT /communities/{name}/avatar`, `/banner` |
| Thành viên community | `POST /communities/{name}/members` (tham gia); `DELETE /communities/{name}/members/me` (rời) |
| Khám phá/category | `GET /explore`, `/explore/{slug}`, `/explore/search`; `GET /categories` |
| User/profile | `GET /users/me`, `/users/{userId}`, `/users/me/owned`, `/users/me/joined`; `PATCH /users/me/profile`; `PUT /users/me/avatar`, `/users/me/banner` |

## API cần làm — ưu tiên P0 (chức năng cốt lõi)

| HTTP method | Tên API | Endpoint đề xuất | Mục đích |
|---|---|---|---|
| `POST` | Tạo bài viết | `/communities/{name}/posts` | Tạo bài viết trong community; hỗ trợ bài dạng text/link và media nếu được bật. |
| `GET` | Lấy danh sách bài viết trong community | `/communities/{name}/posts` | Trả danh sách có phân trang và sắp xếp như `new`, `top`, `hot`; kiểm tra quyền truy cập community private. |
| `GET` | Lấy chi tiết bài viết | `/posts/{postId}` | Lấy nội dung, tác giả, community, điểm vote và thông tin bình luận. |
| `PATCH` | Cập nhật bài viết | `/posts/{postId}` | Cho tác giả chỉnh sửa nội dung/tiêu đề; kiểm tra quyền sở hữu và trạng thái bài. |
| `DELETE` | Xóa bài viết | `/posts/{postId}` | Xóa mềm hoặc chuyển trạng thái bài; cho phép tác giả hoặc moderator theo chính sách. |
| `GET` | Lấy feed cá nhân | `/feed` | Trả bài viết từ các community người dùng tham gia, có phân trang và lựa chọn cách sắp xếp. |
| `PUT` | Đặt/cập nhật vote cho bài viết | `/posts/{postId}/vote` | Ghi nhận upvote/downvote (loại vote nằm trong request body); thao tác lặp lại phải có kết quả nhất quán. |
| `DELETE` | Gỡ vote khỏi bài viết | `/posts/{postId}/vote` | Xóa vote hiện tại của người dùng trên bài viết. |
| `GET` | Lấy bình luận của bài viết | `/posts/{postId}/comments` | Trả cây bình luận có phân trang; hỗ trợ sắp xếp như `new`, `top`. |
| `POST` | Tạo bình luận/trả lời | `/posts/{postId}/comments` | Tạo bình luận; nhận `parentCommentId` tùy chọn để trả lời bình luận khác. |
| `PATCH` | Sửa bình luận | `/comments/{commentId}` | Cho tác giả sửa nội dung bình luận của mình. |
| `DELETE` | Xóa bình luận | `/comments/{commentId}` | Xóa mềm hoặc đánh dấu đã xóa để giữ cấu trúc các câu trả lời bên dưới. |

## API cần làm — ưu tiên P1 (quản trị cộng đồng và an toàn)

| HTTP method | Tên API | Endpoint đề xuất | Mục đích |
|---|---|---|---|
| `GET` | Tìm kiếm toàn hệ thống | `/search?q={query}` | Tìm bài viết, community và user; hiện tại mới có tìm kiếm community trong `/explore/search`. |
| `GET` | Lấy bài viết của user | `/users/{userId}/posts` | Hiển thị bài viết công khai trên profile; hỗ trợ phân trang và lọc trạng thái. |
| `GET` | Lấy danh sách thành viên community | `/communities/{name}/members` | Liệt kê thành viên và vai trò, phân trang; chỉ trả dữ liệu phù hợp với visibility/quyền truy cập. |
| `PATCH` | Cập nhật vai trò thành viên | `/communities/{name}/members/{userId}/role` | Owner/moderator được ủy quyền thay đổi vai trò; không cho phép vượt quyền hoặc tự hạ cấp owner trái quy tắc. |
| `POST` | Ban thành viên khỏi community | `/communities/{name}/bans` | Ban user với lý do; cập nhật trạng thái membership và ghi lịch sử ban. |
| `DELETE` | Unban thành viên | `/communities/{name}/bans/{userId}` | Gỡ ban để user có thể tham gia lại nếu đủ điều kiện. |
| `GET` | Lấy danh sách ban | `/communities/{name}/bans` | Moderator/owner xem danh sách ban và thông tin lịch sử. |
| `PATCH` | Ghim/bỏ ghim bài viết | `/posts/{postId}/pin` | Moderator/owner quản lý trạng thái ghim; entity `Post` đã có trường `isPinned`. |
| `POST` | Báo cáo bài viết | `/posts/{postId}/reports` | Người dùng gửi lý do báo cáo; chống gửi trùng lặp hoặc spam theo chính sách. |
| `POST` | Báo cáo bình luận | `/comments/{commentId}/reports` | Người dùng báo cáo bình luận vi phạm. |
| `POST` | Báo cáo community | `/communities/{name}/reports` | Người dùng báo cáo community vi phạm. |
| `GET` | Lấy danh sách report để xử lý | `/admin/reports` | Admin/moderator có thẩm quyền lọc report theo trạng thái, loại và phân trang. |
| `PATCH` | Cập nhật trạng thái report | `/admin/reports/{reportId}` | Đánh dấu report đang xử lý/đã xử lý/từ chối; lưu người xử lý và thời điểm. |

## API nên cân nhắc — ưu tiên P2

Các chức năng sau thường hữu ích cho sản phẩm kiểu Reddit nhưng chưa thấy entity/API tương ứng trong backend hiện tại. Cần thống nhất yêu cầu và thiết kế model trước khi triển khai.

| HTTP method | Tên API | Endpoint đề xuất | Ghi chú |
|---|---|---|---|
| `GET` | Lấy bài viết đã lưu | `/users/me/saved-posts` | Cần model lưu quan hệ user–post. |
| `PUT` | Lưu bài viết | `/users/me/saved-posts/{postId}` | Cần xác định hành vi lưu trùng và quyền xem bài. |
| `DELETE` | Bỏ lưu bài viết | `/users/me/saved-posts/{postId}` | Cần model lưu quan hệ user–post. |
| `GET` | Lấy thông báo của tôi | `/users/me/notifications` | Cần model thông báo và chính sách giữ dữ liệu. |
| `PATCH` | Đánh dấu thông báo đã đọc | `/users/me/notifications/{notificationId}` | Cần xác thực chủ sở hữu thông báo. |

## Gợi ý thứ tự triển khai

1. Làm post CRUD, danh sách bài trong community và chi tiết bài viết.
2. Làm comment/reply và vote; sau đó hoàn thiện feed cá nhân và sắp xếp bài viết.
3. Bổ sung kiểm soát quyền truy cập community private, quyền tác giả và quyền moderator cho các thao tác trên.
4. Làm báo cáo và hàng đợi xử lý report; tiếp theo là danh sách thành viên, phân quyền moderator, ban/unban và pin bài.
5. Bổ sung tìm kiếm toàn hệ thống và bài viết trên profile; chỉ triển khai saved posts/notifications sau khi chốt model và yêu cầu nghiệp vụ.

## Lưu ý triển khai

- Các endpoint đề xuất chưa phải contract đã được kiểm chứng với frontend; thống nhất request/response DTO và mã lỗi trước khi tích hợp.
- Dùng phân trang cho danh sách lớn; giới hạn kích thước trang theo cấu hình backend.
- Xác thực quyền ở service/backend, không dựa vào việc ẩn nút ở giao diện.
- Các luồng xóa nên cân nhắc soft-delete vì entity bài viết/bình luận đã có trạng thái và thời điểm xóa.
- Backend hiện yêu cầu xác thực cho mọi endpoint ngoài `/auth/**`; các API đọc công khai cần được cho phép rõ ràng theo chính sách truy cập dự kiến.
