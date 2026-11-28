# Notification outbox

Bài viết, bình luận, báo cáo và các thao tác thành viên được hỗ trợ ghi sự kiện vào `outbox_events` trong cùng giao dịch nghiệp vụ. Bản ghi có loại sự kiện, ID người dùng liên quan, đối tượng và trạng thái xử lý. Khi giao dịch commit, Spring đánh thức worker để tạo thông báo ở luồng nền. Khi rollback, bản ghi và tín hiệu xử lý cùng bị loại bỏ.

Worker khóa và xử lý từng sự kiện trong một giao dịch. Thông báo và trạng thái hoàn tất được commit cùng nhau. Mỗi cặp ID sự kiện và ID người nhận là duy nhất. Các lần thử lại được hẹn sau 5, 10, 20 và 40 giây. Sau năm lần thất bại, sự kiện ở lại trạng thái `FAILED` để kiểm tra.

Ứng dụng kiểm tra tồn đọng khi khởi động và mặc định mỗi 5 phút để khôi phục sự kiện nếu tín hiệu sau commit bị mất. Có thể cấu hình khoảng khôi phục bằng `app.notifications.recovery-delay-ms` (mili giây). Khi còn sự kiện hẹn giờ, worker đặt một lịch theo thời điểm gần nhất. Nhật ký quản trị vẫn được lưu riêng trong `admin_activity_logs`.

## Existing MySQL database

For an existing `notifications` table, check the existing column definitions and make both target IDs nullable before deploying the new worker. If either is declared `NOT NULL`, run the following as part of the database upgrade:

```sql
ALTER TABLE notifications
    MODIFY COLUMN post_id BIGINT NULL,
    MODIFY COLUMN comment_id BIGINT NULL;
```

The development setting `spring.jpa.hibernate.ddl-auto=update` creates `outbox_events` and `community_notification_preferences` and adds the new notification columns and index. For deployments with schema updates disabled, apply the equivalent schema migration from the entity mappings before startup. Existing notifications keep their original contents and may have a null event ID.

Community joins and private join requests also write events in the membership transaction.
Applicants receive a confirmation or review result. Active owners and moderators receive new requests and successful joins.
For deployments with automatic schema updates disabled, widen the event and notification type columns before deploying:

```sql
ALTER TABLE outbox_events MODIFY COLUMN event_type VARCHAR(64) NOT NULL;
ALTER TABLE notifications MODIFY COLUMN type VARCHAR(64) NOT NULL;
```

## Community preference

Active members can call `GET /communities/{name}/notification-preferences` and `PUT /communities/{name}/notification-preferences`. The PUT body is `{"newPostEnabled":false}`. Preferences default to enabled and are read when processing the event. A change affects future deliveries and preserves notifications already received.

## Hướng dẫn gọi API

Gửi request bằng phiên đăng nhập hiện tại. API thông báo tự xác định người nhận từ phiên đăng nhập. Hai API tùy chọn yêu cầu tài khoản là thành viên đang hoạt động của cộng đồng. `{name}` là tên định danh của cộng đồng.

| Hàm controller | Request mẫu | Kết quả |
|---|---|---|
| `NotificationController.list` | `GET /notifications?page=0&size=10&unreadOnly=true` | `200` kèm `PageResponseDTO<NotificationResponseDTO>`. `page` bắt đầu từ 0, mặc định 10 mục. Bỏ `unreadOnly` để xem cả đã đọc và chưa đọc. Danh sách mới nhất trước. |
| `NotificationController.unreadCount` | `GET /notifications/unread-count` | `200` kèm `{"unreadCount":3}`, dùng cho số trên chuông. |
| `NotificationController.markRead` | `PUT /notifications/42/read` | `204` khi đánh dấu thành công hoặc đã đọc từ trước. Trả `404` nếu ID không tồn tại hoặc thuộc tài khoản khác. |
| `NotificationController.markAllRead` | `PUT /notifications/read-all` | `204` sau khi đánh dấu toàn bộ thông báo chưa đọc của phiên hiện tại. |
| `CommunityNotificationPreferenceController.get` | `GET /communities/java/notification-preferences` | `200` kèm `{"newPostEnabled":true}` nếu đang bật hoặc chưa có tùy chọn riêng. |
| `CommunityNotificationPreferenceController.update` | `PUT /communities/java/notification-preferences` với JSON `{"newPostEnabled":false}` | `200` kèm tùy chọn đã lưu. Phải gửi giá trị boolean và header `Content-Type: application/json`. |

Các hàm controller đều trả `ResponseEntity<T>`. Hai request đánh dấu đã đọc dùng body rỗng. Với API danh sách, mỗi mục có `id`, `type`, `actor`, `read` và `createdAt`. Các trường `postId`, `commentId`, `communityName`, `reportId`, `reportTargetType` và `reportStatus` có thể là `null` tùy loại thông báo. Frontend dùng các trường này để hiển thị và điều hướng.

## Hàm ghi sự kiện

Inject `NotificationEvents` vào service nghiệp vụ và gọi sau khi đã lưu đối tượng có ID, trong giao dịch `@Transactional` của thao tác đó. `Propagation.MANDATORY` yêu cầu giao dịch đang mở. Nếu thao tác rollback, sự kiện cũng rollback.

| Hàm | Gọi ở đâu và truyền gì | Kết quả |
|---|---|---|
| `postCreated(post)` | `PostService` gọi sau khi tạo bài viết. Truyền entity bài viết đã có ID, tác giả và cộng đồng. | Ghi sự kiện `POST_CREATED`. Worker gửi cho thành viên đủ điều kiện. |
| `commentCreated(comment)` | `CommentService` gọi sau khi tạo bình luận. Truyền entity bình luận đã có ID và bài viết cha. | Ghi `COMMENT_CREATED`. Worker kiểm tra quan hệ bình luận cha khi xử lý. |
| `reportSubmitted(actorId, reportId, type, communityId)` | `ReportService` gọi sau khi lưu báo cáo. `actorId` là người gửi, `reportId` là ID báo cáo, `type` nhận `POST`, `COMMENT` hoặc `COMMUNITY`. | Ghi `REPORT_SUBMITTED` cho luồng kiểm duyệt. |
| `reportReviewed(actorId, reportId, type, reporterId, status)` | `ReportReviewService` gọi sau khi giải quyết hoặc bác bỏ. `actorId` là người duyệt, `reporterId` là người gửi, `status` là `RESOLVED` hoặc `REJECTED`. | Ghi `REPORT_REVIEWED` để báo kết quả cho người gửi. |
| `event(type, actorId)` | Hàm nội bộ dùng bởi bốn hàm trên. | Tạo builder với trạng thái `PENDING` và thời điểm xử lý ban đầu. Hàm gọi bổ sung dữ liệu và lưu. |

Ví dụ trong service tạo bài viết, sau khi bài viết đã được lưu:

```java
notificationEvents.postCreated(post);
```

## Hàm của worker

| Hàm | Chức năng và cách dùng |
|---|---|
| `NotificationOutboxDispatcher.onQueued()` | Nhận tín hiệu sau commit và đặt lịch chạy nền. Các tín hiệu đến gần nhau được gộp. |
| `NotificationOutboxDispatcher.recoverPending()` | Kích hoạt kiểm tra tồn đọng khi khởi động hoặc đến lịch khôi phục. |
| `processDueEvents()` | Lấy tối đa 25 ID `PENDING` đã đến hạn, xử lý mỗi ID trong giao dịch riêng và trả mốc chạy tiếp nếu còn việc. |
| `process(id)` | Khóa sự kiện, chọn nhánh theo loại, tạo thông báo và chuyển sang `COMPLETED`. Nhánh `REPORT_REVIEWED` gửi trực tiếp cho `reporterId`. Sự kiện có thể hoàn tất với 0 người nhận. |
| `notifyCommunity(event)` | Xử lý `POST_CREATED`. Kiểm tra bài còn được đăng và cộng đồng còn hoạt động. Bỏ tác giả và thành viên đã tắt nhận bài mới. |
| `notifyComment(event)` | Xử lý `COMMENT_CREATED`. Bỏ qua bình luận đã ẩn hoặc gỡ. Chọn tác giả bài và tác giả bình luận được trả lời, loại người thực hiện, kiểm tra quyền đọc. Nếu hai vai trò trùng người, ưu tiên `COMMENT_REPLIED`. |
| `notifyReportSubmitted(event)` | Nếu báo cáo chính cộng đồng, gửi cho admin đang hoạt động. Nếu báo cáo bài viết hoặc bình luận, gửi cho owner và moderator đủ điều kiện. Loại người gửi khỏi danh sách. |
| `save(event, recipient, type, communityName)` | Lưu một thông báo cho người nhận. Cặp `event_id` và `recipient_id` là khóa duy nhất cho sự kiện mới. |
| `isPublished(post)` | Kiểm tra bài tồn tại, có trạng thái `PUBLISHED` và cộng đồng `ACTIVE`. |
| `canRead(post, user)` | Dùng `PostSupport.requireRead(...)` để kiểm tra người nhận có quyền mở bài. |
| `lockDueEvent(id)` | Khóa ghi bản ghi outbox và kiểm tra lại trạng thái, thời điểm chạy trước khi xử lý hoặc cập nhật lỗi. Trả `null` nếu bản ghi không còn đủ điều kiện. |
| `recordFailure(id, failure)` | Chạy trong giao dịch riêng sau rollback. Tăng số lần lỗi, lưu tên loại lỗi, hẹn thử lại hoặc chuyển sang `FAILED` sau lần lỗi thứ năm. |

## Hàm service và repository

| Hàm | Chức năng và cách dùng |
|---|---|
| `NotificationService.list(unreadOnly, pageable)` | Controller truyền bộ lọc và phân trang. Service lấy ID của phiên hiện tại và sắp xếp cố định theo `createdAt DESC, id DESC`. |
| `NotificationService.unreadCount()` | Đếm bản ghi có `readAt = null` của tài khoản hiện tại. |
| `NotificationService.markRead(id)` | Ghi thời điểm đọc. Trả `true` nếu người dùng sở hữu thông báo dù đã đọc trước đó, `false` nếu không tìm thấy trong phạm vi tài khoản. |
| `NotificationService.markAllRead()` | Cập nhật thời điểm đọc cho các bản ghi chưa đọc của tài khoản hiện tại. |
| `NotificationService.toResponse(notification)` | Hàm nội bộ ánh xạ entity sang DTO, dựng thông tin người thực hiện và đặt `read` dựa vào `readAt`. |
| `CommunityNotificationPreferenceService.isNewPostEnabled(name)` | Kiểm tra thành viên rồi đọc tùy chọn. Mặc định `true` nếu chưa cài đặt. |
| `CommunityNotificationPreferenceService.update(name, enabled)` | Kiểm tra thành viên rồi lưu hoặc cập nhật tùy chọn riêng của người dùng. |
| `CommunityNotificationPreferenceService.memberKey(name)` | Hàm nội bộ kiểm tra thành viên và tạo khóa ghép `userId, communityId`. |
| `NotificationRepository.findByRecipientId(...)` | Đọc tất cả thông báo của một người theo trang. |
| `NotificationRepository.findByRecipientIdAndReadAtIsNull(...)` | Đọc riêng thông báo chưa đọc theo trang. |
| `NotificationRepository.countByRecipientIdAndReadAtIsNull(...)` | Đếm thông báo chưa đọc. |
| `NotificationRepository.existsByIdAndRecipientId(...)` | Xác minh quyền sở hữu khi lệnh cập nhật một thông báo không thay đổi bản ghi nào. |
| `NotificationRepository.markRead(...)` và `markAllRead(...)` | Câu lệnh cập nhật trực tiếp các bản ghi chưa đọc, giới hạn theo người nhận. |
| `OutboxEventRepository.findDueIds(status, now, limit)` | Lấy các ID đủ điều kiện theo thứ tự thời điểm chạy và ID, có giới hạn theo lô. |
| `CommunityNotificationPreferenceRepository.savePreference(...)` | Thêm hoặc cập nhật tùy chọn theo khóa ghép trên MySQL. |
| `CommunityMemberRepository.findNotificationRecipientIds(...)` | Trả ID thành viên đủ điều kiện nhận bài mới, áp dụng tùy chọn tắt nhận. |
| `CommunityMemberRepository.findStaffNotificationRecipientIds(...)` | Trả ID thành viên có vai trò kiểm duyệt và tài khoản đang hoạt động. |

## Cách dùng từ frontend

| Hàm | Khi gọi |
|---|---|
| `notificationService.list(page, unreadOnly)` | Tải danh sách theo trang. Hàm nội bộ `mapNotification(item)` chuyển DTO thành nội dung và đường dẫn hiển thị. |
| `notificationService.unreadCount()` | Cập nhật số trên chuông độc lập với số mục đã tải. |
| `notificationService.markRead(id)` | Đánh dấu một mục khi người dùng mở thông báo. |
| `notificationService.markAllRead()` | Xử lý nút Đọc tất cả. |
| `notificationService.communityPreference(name)` | Đọc trạng thái công tắc khi mở trang cộng đồng. |
| `notificationService.updateCommunityPreference(name, newPostEnabled)` | Lưu trạng thái khi người dùng đổi công tắc. |
| `useNotificationStore.hydrate()`, `loadMore()` | Nạp trang đầu kèm số chưa đọc hoặc nối thêm trang kế tiếp. |
| `useNotificationStore.refreshUnreadCount()` | Đồng bộ số chưa đọc từ server, kể cả những mục nằm ngoài trang đã tải. |
| `useNotificationStore.markRead(id)`, `markAllRead()` | Gọi API, cập nhật danh sách đã tải và đồng bộ lại số chưa đọc. |
| `useNotificationStore.clear()` | Xóa dữ liệu hiển thị và vô hiệu hóa kết quả tải đang chờ khi đổi phiên đăng nhập. |
