# Đặc tả API theo module cho Discuss

Tài liệu này là đề xuất contract để hoàn thiện backend và tích hợp frontend. Đặc tả được đối chiếu với `backend/src/main/java/com/discuss/discuss/entity`, `enums`, controller hiện có và lời gọi trong `frontend/src`. Những field suy ra từ nhu cầu sản phẩm nhưng chưa có trong entity được đánh dấu **CẦN MODEL**. Không trả entity JPA trực tiếp; response dưới đây là DTO JSON đề xuất.

## Quy ước chung

- API dùng JSON, trừ upload multipart; định danh dùng `Long` dạng JSON number theo entity hiện tại.
- API yêu cầu đăng nhập dùng cookie/token như cấu hình backend hiện tại. Luôn kiểm tra quyền ở service/backend.
- Danh sách dùng `PageResponseDTO<T>` hiện có: `{ content, page, size, totalElements, totalPages, first, last, empty }`. Query phân trang: `page=0&size=20`; giới hạn size đề nghị tối đa 100.
- Thời gian trả ISO-8601. Request không gửi `id`, `userId`, `ownerId`, `createdAt`, `handledBy` để tự nhận diện người dùng từ principal.
- Mã enum phản ánh enum backend hiện tại: `PostStatus=PUBLISHED|HIDDEN|DELETED`, `CommentStatus=VISIBLE|HIDDEN|DELETED`, `VoteType=UP|DOWN`, `ReportStatus=PENDING|RESOLVED|REJECTED`, `MembershipStatus=ACTIVE|LEFT|KICKED|BANNED`.
- Lỗi dùng HTTP status và schema lỗi hiện có (`GlobalExceptionHandler`); mã lỗi cụ thể cần được thống nhất theo từng module.

## Module 0 — Chuẩn hóa API đã có

Không phải API mới, nhưng cần sửa tích hợp trước khi hoàn thiện tính năng:

1. Backend profile đang ở `/user/...` (số ít); frontend service cũ gọi `/users/...` (số nhiều). Chỉ giữ một quy ước. Khuyến nghị giữ `/user` để khớp controller và service TypeScript mới; sửa service cũ.
2. `DELETE /communities/{name}` đã bị comment trong controller: hoặc triển khai soft delete theo `CommunityStatus`, hoặc bỏ chức năng xóa khỏi giao diện.
3. `UpdateProfileRequestDTO` nhận `showPostsOnProfile` nhưng `UserPrivacySettings` hiện không có cột tương ứng (đang comment). Không nên trả/nhận field này như đã lưu trước khi thêm cột/migration.
4. `CommunityStatus` hiện là `ACTIVE|BANED` (enum spelling hiện có); giao diện có giá trị `BANNED`, `DISABLED`, `RESTRICTED`. Chuẩn hóa enum và dữ liệu migration trước API khóa community.
5. `UserController.getPublicUserProfile` hiện trả ngày sinh/vị trí; cần lọc theo `UserPrivacySettings.showDateOfBirth/showLocation` trước khi trả dữ liệu công khai.
6. Backend chưa có endpoint `/media/*` như `frontend/src/services/mediaService.ts` gọi. Upload avatar/banner hiện đi qua `/user/me/avatar`, `/user/me/banner`, `/communities/{name}/avatar`, `/communities/{name}/banner`; ảnh bài viết cần endpoint mới ở Module 4.

## Module 1 — Bài viết (Post, PostContent, PostMedia)

Entity đã có: `Post`, `PostContent`, `PostMedia`, `PostStatus`, `MediaType`. Chưa có controller, repository và DTO cho post.

### 1.1 Tạo bài viết

`POST /communities/{name}/posts` — yêu cầu thành viên community, community ACTIVE; PRIVATE chỉ thành viên được xem/đăng.

Request:

```json
{
  "title": "Tiêu đề",
  "content": "Nội dung bài viết",
  "media": [
    { "mediaUrl": "https://cdn.example/image.jpg", "mediaType": "IMAGE", "displayOrder": 0 }
  ]
}
```

`title` bắt buộc; `content` theo chính sách loại bài (đề nghị cho phép chuỗi rỗng nếu bài có media); media tùy chọn. `user`, `community`, `status=PUBLISHED`, `isPinned=false` và timestamps lấy/đặt ở server. Entity hiện không có kiểu bài link/code/tag; không nhận các field đó cho đến khi có model.

Response `201 PostDetailDTO`:

```json
{
  "id": 101,
  "title": "Tiêu đề",
  "content": "Nội dung bài viết",
  "status": "PUBLISHED",
  "isPinned": false,
  "author": { "id": 7, "username": "an", "displayName": "An", "avatarUrl": null },
  "community": { "id": 5, "name": "java" },
  "media": [{ "id": 91, "mediaUrl": "https://cdn.example/image.jpg", "mediaType": "IMAGE", "displayOrder": 0 }],
  "voteScore": 0,
  "commentCount": 0,
  "myVote": null,
  "createdAt": "2026-10-29T10:00:00",
  "updatedAt": "2026-10-29T10:00:00"
}
```

`voteScore`, `commentCount`, `myVote` là dữ liệu tổng hợp; hiện chưa có cột counter, nên truy vấn/aggregate từ `PostVote` và `Comment` hoặc bổ sung chiến lược cache.

### 1.2 Danh sách bài trong community

`GET /communities/{name}/posts?page=0&size=20&sortBy=new|top|hot`

Response `PageResponseDTO<PostSummaryDTO>`; mỗi phần tử gồm `id,title,contentPreview,author,community,mediaPreview,voteScore,commentCount,myVote,isPinned,createdAt`. Mặc định `new`; `top` sắp theo score trong khoảng thời gian đã thống nhất; `hot` cần công thức ranking được chốt. Kiểm tra visibility/status.

### 1.3 Feed

`GET /feed?page=0&size=20&sortBy=new|top|hot`

Trả cùng page DTO bài từ các cộng đồng user đang tham gia (`CommunityMember.status=ACTIVE`). Cần định nghĩa có bao gồm bài public ngoài các cộng đồng đã tham gia hay không; đề nghị feed mặc định chỉ từ cộng đồng đã join.

### 1.4 Chi tiết, sửa và xóa

- `GET /posts/{postId}` → `200 PostDetailDTO`; chỉ bài PUBLISHED/HIDDEN theo quyền; không trả bài DELETED cho người thường.
- `PATCH /posts/{postId}` request `{ "title": "...", "content": "...", "media": [...] }` → `200 PostDetailDTO`. Chỉ tác giả hoặc moderator/owner theo chính sách. Thay media nên đồng bộ các hàng `PostMedia` trong transaction.
- `DELETE /posts/{postId}` → `204`; soft delete bằng `status=DELETED`, `deletedAt=now`, giữ comment tree và báo cáo.
- `PATCH /posts/{postId}/pin` request `{ "isPinned": true }` → `200 { "postId": 101, "isPinned": true }`. Chỉ owner/moderator; dùng cột `Post.isPinned`.

### 1.5 Upload ảnh cho bài viết

`POST /media/post-image` multipart field `file` → `201 StoredImageDTO` hiện có (`objectKey,url,contentType,width,height,size`). Validate loại/kích thước file, lưu qua media service. Tạo post sau đó gửi URL ở `media[]`. Backend hiện chưa expose endpoint media này dù frontend đang gọi.

## Module 2 — Vote bài viết (PostVote)

Entity đã có `PostVote` và enum `VoteType`; chưa có controller/repository. Một user chỉ có một vote trên một post (cần unique constraint `(post_id,user_id)` trong DB để chống race).

- `PUT /posts/{postId}/vote` request `{ "voteType": "UP" }` hoặc `DOWN` → `200 { "postId": 101, "myVote": "UP", "voteScore": 4 }`.
- Lặp lại cùng vote có thể toggle thành null, hoặc giữ idempotent; đề nghị **idempotent**: cùng vote không đổi. Đổi UP↔DOWN cập nhật record hiện tại.
- `DELETE /posts/{postId}/vote` → `200 { "postId": 101, "myVote": null, "voteScore": 3 }`.

Vote score tính `UP=+1`, `DOWN=-1`. Frontend hiện gửi `voteType: 0` để hủy; cần đổi frontend sang DELETE hoặc định nghĩa rõ nullable contract, vì `VoteType` không có giá trị 0.

## Module 3 — Bình luận (Comment)

Entity đã có `Comment` với parent-child, trạng thái và soft delete. Chưa có controller/repository/DTO.

- `GET /posts/{postId}/comments?page=0&size=50&sortBy=top|new` → `PageResponseDTO<CommentDTO>`; `CommentDTO` gồm `id,postId,parentCommentId,content,status,author,voteScore,myVote,createdAt,updatedAt,replies` (có thể trả phẳng kèm parent id để phân trang hiệu quả). Không trả nội dung của comment HIDDEN/DELETED cho user thường; giữ placeholder để giữ nhánh reply.
- `POST /posts/{postId}/comments` request `{ "content": "...", "parentCommentId": 55 }` (`parentCommentId` optional) → `201 CommentDTO`. Tác giả lấy từ principal; parent phải thuộc cùng post.
- `PATCH /comments/{commentId}` request `{ "content": "Nội dung mới" }` → `200 CommentDTO`; chỉ tác giả, comment chưa bị xóa.
- `DELETE /comments/{commentId}` → `204`; soft delete `status=DELETED`, `deletedAt=now`, giữ replies.
- `PATCH /comments/{commentId}/moderation` request `{ "status": "VISIBLE|HIDDEN" }` → `200 CommentDTO`; moderator/owner/admin.

**CẦN MODEL nếu cần vote/heart bình luận:** chưa có `CommentVote`; frontend có action comment heart nhưng entity hiện chỉ có `PostVote`. Tạo entity `CommentVote(comment,user,voteType,createdAt)` + unique `(comment_id,user_id)` rồi mới mở `PUT/DELETE /comments/{commentId}/vote` tương tự vote post. Nếu chỉ cần like, có thể dùng enum riêng thay vì tái sử dụng VoteType.

## Module 4 — Báo cáo và kiểm duyệt (PostReport, CommentReport, CommunityReport)

Ba entity báo cáo đã có reason, status, người xử lý, thời điểm xử lý. Chưa có API/controller. Tên response thống nhất `ReportDTO` với `targetType=POST|COMMENT|COMMUNITY`.

- `POST /posts/{postId}/reports` request `{ "reason": "SPAM" }` → `201 ReportDTO`.
- `POST /comments/{commentId}/reports` request `{ "reason": "HARASSMENT" }` → `201 ReportDTO`.
- `POST /communities/{name}/reports` request `{ "reason": "..." }` → `201 ReportDTO`.
- Người báo cáo lấy từ principal; trạng thái ban đầu `PENDING`; hạn chế report trùng/spam. `reason` hiện là text tự do trong entity, vì vậy các giá trị trên chỉ là ví dụ.
- `GET /admin/reports?status=PENDING&type=POST&page=0&size=20` → `PageResponseDTO<ReportDTO>`; admin hệ thống; moderator chỉ thấy report thuộc community được quản lý (cần API community-scoped hoặc filter quyền ở server).
- `PATCH /admin/reports/{reportId}` request `{ "status": "RESOLVED", "resolutionNote": "..." }` → `200 ReportDTO`. `handledBy` lấy từ principal, `handledAt=now`. **CẦN MODEL** `resolutionNote` chưa có cột ở ba entity; bỏ khỏi request hoặc thêm cột migration.

`ReportDTO`: `{ id, targetType, targetId, targetLabel, reason, status, reporter:{id,username}, handledBy:{id,username}|null, handledAt, createdAt }`.

## Module 5 — Thành viên, vai trò và ban community (CommunityMember, BanHistory)

Join/leave/kick/promote/transfer-owner/list-members đã có API. Cần bổ sung ban lifecycle vì entity đã có `BanHistory` và `MembershipStatus.BANNED`, nhưng chưa có controller/repository cho lịch sử ban.

- `POST /communities/{name}/bans` request `{ "username": "user_a", "reason": "Vi phạm nội quy" }` → `201 BanDTO { id, communityId, userId, username, reason, startedAt, endedAt:null, moderatorId }`. Ghi `BanHistory`, đặt membership `BANNED`; chỉ owner/moderator đủ quyền.
- `DELETE /communities/{name}/bans/{username}` → `200 { "message": "Member unbanned" }`; đặt `endedAt=now`, trạng thái membership theo chính sách (đề nghị `LEFT`, user cần join lại).
- `GET /communities/{name}/bans?page=0&size=20&active=true` → `PageResponseDTO<BanDTO>`; chỉ moderator/owner.
- `PATCH /communities/{name}/members/{username}/role` request `{ "role": "MEMBER|MODERATOR" }` → `200 CommunityMemberResponseDTO`; bổ sung nếu cần chỉnh vai trò tổng quát; endpoint appoint/remove hiện tại cũng đã xử lý hai trường hợp đó.

Không cho phép ban owner hiện tại hoặc tự gán role cao hơn quyền người thao tác. Đảm bảo uniqueness của membership hiện hành.

## Module 6 — Hồ sơ, tìm user và quyền riêng tư

Hồ sơ hiện có API `/user/me`, `/user/{name}`, profile update/avatar/banner. Entity có `UserPrivacySettings` nhưng thiếu trường `showPostsOnProfile` mà request DTO/frontend mong muốn.

- `GET /users/search?q=...&page=0&size=20` → `PageResponseDTO<UserSearchResultDTO>` (`id,username,displayName,bio,avatarUrl`). Frontend hiện gọi API này nhưng backend chưa có endpoint. Tìm theo username/displayName, chỉ user phù hợp quyền riêng tư.
- `GET /user/{name}/posts?page=0&size=20` → `PageResponseDTO<PostSummaryDTO>`; chỉ trả bài PUBLISHED và chỉ khi privacy cho phép. Cần xác nhận thêm `showPostsOnProfile` vào `UserPrivacySettings` và migration.
- Giữ `PATCH /user/me/profile` nhưng chỉ nhận/lưu privacy field thực sự được persist. Hiện `showDateOfBirth`, `showLocation` có model; `showPostsOnProfile` chưa có.
- Public profile DTO cần ẩn `dateOfBirth`/`location` khi privacy flags tương ứng false. Response có thể trả null cho field bị ẩn; không tiết lộ flag/giá trị riêng tư.

## Module 7 — Quản trị hệ thống

Frontend admin đang gọi endpoint chưa tồn tại. `User`, `Community` có status; không có entity thống kê riêng, nên stats nên tổng hợp từ repository.

- `GET /admin/stats` → `{ "totalUsers": 120, "totalPosts": 540, "activeCommunities": 18, "pendingReports": 6, "userGrowth": [{ "month": "2026-10", "users": 12 }] }`. Admin only; post/report count cần có repositories trước.
- `GET /admin/users?q=&status=&page=0&size=20` → `PageResponseDTO<AdminUserDTO>` (`id,username,email,displayName,avatarUrl,role,status,createdAt`). Frontend hiện kỳ vọng array; chuyển sang page DTO để khớp backend pagination.
- `PATCH /admin/users/{userId}/status` request `{ "status": "ACTIVE|LOCKED|DELETED" }` → `200 AdminUserDTO`; admin only. `UserStatus` không có `SUSPENDED`.
- `GET /admin/communities?status=&page=0&size=20` → `PageResponseDTO<CommunityPreviewResponseDTO>`; admin only.
- `PATCH /admin/communities/{name}/status` request `{ "status": "ACTIVE|BANED" }` → `200 CommunityDetailResponseDTO`. Khuyến nghị đặt status admin dưới `/admin`; frontend hiện gọi `/communities/{name}/status` nhưng backend chưa có.
- `DELETE /communities/{name}` nếu cần xóa community: soft-delete/status policy phải được xác định; không xóa vật lý entity có posts/reports/members liên quan.

## Module 8 — Lưu bài, thông báo, tin nhắn (cần chốt phạm vi/model)

Frontend đã có trang tương ứng nhưng backend hiện không có entity/controller cho các dữ liệu này. Các API chỉ nên bật sau khi thêm entity/migration.

### Lưu bài

**CẦN MODEL** `SavedPost(user,post,createdAt)`, unique `(user_id,post_id)`.

- `GET /user/me/saved-posts?page=0&size=20` → `PageResponseDTO<PostSummaryDTO>`.
- `PUT /user/me/saved-posts/{postId}` → `200 { "postId": 101, "saved": true }`.
- `DELETE /user/me/saved-posts/{postId}` → `204`.

Frontend TS hiện gọi `/posts/saved` và `/posts/{id}/save`; chuẩn hóa sang một bộ endpoint ở trên hoặc giữ đường dẫn hiện tại và sửa server/client đồng bộ.

### Thông báo

**CẦN MODEL** `Notification(id,recipient,actor,type,targetType,targetId,readAt,createdAt)`; cần định nghĩa loại notification và chính sách retention.

- `GET /user/me/notifications?unreadOnly=false&page=0&size=20` → `PageResponseDTO<NotificationDTO>`.
- `PATCH /user/me/notifications/{notificationId}` request `{ "read": true }` → `200 NotificationDTO`.
- `POST /user/me/notifications/read-all` → `200 { "updatedCount": 8 }`.
- `GET /user/me/notification-preferences` và `PUT /user/me/notification-preferences` → preferences `{ inAppReplies,inAppMentions,inAppCommunityActivity,emailDigest,emailAnnouncements }`; **CẦN MODEL** preference.

### Tin nhắn

**CẦN MODEL** `Conversation`, participant membership, `Message` (sender, body, createdAt, readAt); xác định hỗ trợ realtime, đính kèm và chặn người dùng trước khi chốt contract.

- `GET /conversations?page=0&size=20` → page hội thoại với participant/lastMessage/unreadCount.
- `POST /conversations` request `{ "participantId": 22 }` → `201 ConversationDTO`.
- `GET /conversations/{conversationId}/messages?page=0&size=50` → page tin nhắn.
- `POST /conversations/{conversationId}/messages` request `{ "text": "..." }` → `201 MessageDTO`.
- `PATCH /conversations/{conversationId}/read` → `204`.

## Danh sách endpoint đề xuất theo trạng thái

| Module | Số endpoint đề xuất | Phụ thuộc model đã có? |
|---|---:|---|
| Post | 7 + upload ảnh | Có, cần service/repository/DTO; media cần kiểm tra storage API |
| Vote bài | 2 | Có (`PostVote`), cần unique constraint |
| Comment | 5 | Có (`Comment`); comment vote cần entity mới |
| Report | 5 | Có 3 entity report; resolution note cần cột nếu dùng |
| Ban community | 3 | Có (`BanHistory`, membership status) |
| User search/profile posts/privacy | 2–3 | Search/profile posts cần post repository; privacy cần thêm field |
| Admin | 5–6 | Có User/Community; stats tổng hợp; post/report repository cần bổ sung |
| Saved posts | 3 | Cần entity mới |
| Notifications | 4 | Cần entity và preferences mới |
| Messaging | 5 | Cần entity mới và quyết định realtime |

Số endpoint ở bảng là đề xuất cho phạm vi tính năng, có thể đổi sau khi chốt contract; không cộng các API hiện hữu.

## Thứ tự triển khai đề nghị

1. Chuẩn hóa DTO/API hiện hữu, sửa đường dẫn `/user` vs `/users`, pagination và quyền riêng tư.
2. Post CRUD/list/feed + vote bài viết; đây là luồng cốt lõi và entity đã sẵn.
3. Comment CRUD/tree + moderation; sau đó quyết định có cần comment vote không.
4. Report intake và moderator queue; chốt `resolutionNote` trước migration.
5. Ban/unban, admin status/stats, user search/profile posts.
6. Chốt yêu cầu và thiết kế entity cho saved posts, notification, messaging; sau đó mới bật các trang demo thành dữ liệu thật.

## API hiện hữu được rà soát

Backend hiện có endpoint auth, community/category/explore, community membership và profile theo các controller `AuthController`, `CategoryController`, `CommunityController`, `CommunityMemberController`, `ExploreCommunityController`, `UserController`. Danh sách chính xác nằm tại route annotations trong các file đó; các đề xuất trên không tính lặp những endpoint đã có. `DELETE /communities/{name}` hiện chỉ là code comment nên được xem là chưa triển khai.
