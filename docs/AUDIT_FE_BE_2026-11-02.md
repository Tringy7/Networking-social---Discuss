# Khảo sát tích hợp API và chức năng Discuss

Ngày khảo sát: 02/11/2026, múi giờ Asia/Saigon. Phạm vi: `frontend/`, `backend/`, ứng dụng prototype `test/` và tài liệu/cấu hình liên quan.

## 1. Kết luận

- Backend có **34 endpoint đang khai báo**, thuộc 6 controller. **34/34 có đường gọi từ frontend hiện tại**; chưa thấy endpoint backend nào hoàn toàn không được FE tham chiếu. Đây là kết quả truy vết mã nguồn, không phải thống kê traffic thực tế.
- FE hiện tại khai báo thêm **34 tổ hợp HTTP method + đường dẫn không có controller tương ứng trong BE**: 10 có luồng UI gọi HTTP hiện tại, 17 có luồng UI nhưng HTTP bị tắt bởi cờ tính năng, 7 chưa có caller ở UI/store hiện tại.
- Bài viết, bình luận, thả tim, lưu bài, thông báo và chat đang dùng dữ liệu demo/local. Tương tác trong bộ nhớ mất khi reload; tùy chọn thông báo và giao diện lưu localStorage.
- Báo cáo, hàng đợi kiểm duyệt, admin và tìm người dùng **không có mock fallback trong FE hiện tại**: FE thực sự gọi API chưa tồn tại. Có giao diện không đồng nghĩa chức năng đã được BE hỗ trợ. Với request đã xác thực thường sẽ không tìm thấy handler; request chưa xác thực có thể bị Security trả 401 trước đó.
- Có lỗi tích hợp ở chức năng đã có API: quyền moderator không được trả về, ownership chưa đồng bộ, kick thiếu kiểm tra quyền người thực hiện, guest không đọc được một số trang đặt ở public route, và trường quyền riêng tư chưa được lưu.
- Tài liệu `frontend/README.md`, `test/README.md`, `backend/API_GAP_ANALYSIS.md` có một số mô tả lệch code hiện tại; khi lập backlog cần dựa trên controller/service thực tế.

Không sửa mã nghiệp vụ trong lần khảo sát này. Các đường dẫn đề xuất ở phần backlog chưa phải API đang hoạt động.

Danh mục có thể đọc bằng máy, kèm đường dẫn file/dòng và danh sách ứng viên mã không còn nối vào entry: [API_INVENTORY_2026-11-02.json](API_INVENTORY_2026-11-02.json).

## 2. Ứng dụng nào đang chạy?

Luồng FE chính: `frontend/index.html` → `src/main.jsx` → `App.jsx` (re-export) → `App.tsx` → `routes/index.tsx` → pages TypeScript → Zustand stores → `services/index.ts` / `services/apiClient.ts`.

| Khu vực | Thực trạng | Ý nghĩa khi kiểm kê API |
|---|---|---|
| `frontend/src/services/` + `store/` + pages theo module | Giao diện chính hiện tại | Dùng để kết luận caller đang tồn tại |
| `frontend/src/api/*.js` | Không nối vào entry của FE hiện tại | Toàn bộ 7 file là lớp service cũ; không tính những hàm mock ở đây thành API BE |
| `frontend/src/context/*.jsx`, pages JSX ở gốc `pages/`, phần lớn component JSX cũ | Không nối vào entry hiện tại | Có sửa post/comment, ghim, ban/unban trong mô hình cũ nhưng không có nghĩa UI hiện tại hỗ trợ |
| `test/` | Một ứng dụng Vite riêng, có prototype và role switcher | Không phải bộ kiểm thử backend; vẫn dùng mock cho nhiều màn hình |

Truy vết import tĩnh trên filesystem Windows hiện tại tìm thấy 60 file JS/JSX/TS/TSX của `frontend/src` không đi tới từ entry (đã bỏ file `*.test.*`). Đây là ứng viên dọn mã, không phải chỉ dẫn xóa tự động. Riêng hai file `GoogleSigninButton.jsx` / `GoogleSignInButton.tsx` có tên gần như chỉ khác hoa/thường: import không ghi extension có thể chọn bản khác nhau trên filesystem Windows/Linux; cần thống nhất còn một component.

## 3. Đầy đủ 34 endpoint BE và caller FE

Các tên biến `{name}` / `{communitiesName}` dưới đây được chuẩn hóa thành `{name}` khi cùng mang tên cộng đồng. Bỏ query khi đếm endpoint. `POST /auth/refresh` được gọi ở API client khi cần refresh, không cần có nút riêng trên UI.

| # | Endpoint BE | Hàm FE / đường gọi | Trạng thái |
|---|---|---|---|
| 1 | `POST /auth/register` | `authService.register` → auth store → RegisterPage | Có caller |
| 2 | `POST /auth/verify-email` | `authService.verifyEmail` → VerifyEmailPage | Có caller |
| 3 | `POST /auth/resend-otp` | `authService.resendOtp` → xác thực email | Có caller |
| 4 | `POST /auth/refresh` | `services/apiClient.ts: refreshSession` | Có caller tự động |
| 5 | `POST /auth/social/{provider}` | `authService.loginSocial` → LoginPage | Có caller; provider đã triển khai là Google |
| 6 | `POST /auth/login` | `authService.login` → LoginPage | Có caller |
| 7 | `POST /auth/forgot-password` | `authService.forgotPassword` → ForgotPasswordPage | Có caller |
| 8 | `POST /auth/forgot-password/verify` | `authService.verifyForgotPasswordOtp` | Có caller |
| 9 | `POST /auth/forgot-password/reset` | `authService.resetPassword` → ResetPasswordPage | Có caller |
| 10 | `PATCH /auth/change-password` | `authService.changePassword` → AccountSettingsPage | Có caller |
| 11 | `POST /auth/logout` | `authService.logout` → navbar/settings | Có caller |
| 12 | `GET /user/me` | `userService.getMe` → auth/profile | Có caller |
| 13 | `PUT /user/me/avatar` | `userService.uploadAvatar` → profile/settings | Có caller |
| 14 | `PUT /user/me/banner` | `userService.uploadBanner` → profile/settings | Có caller |
| 15 | `GET /user/{name}` | `userService.getPublicProfile` → UserProfilePage | Có caller; guest bị chặn bởi Security |
| 16 | `GET /user/me/owned` | `communityService.mine` → `hydrateMine` | Có caller |
| 17 | `GET /user/me/joined` | `communityService.mine` → `hydrateMine` | Có caller |
| 18 | `PATCH /user/me/profile` | `userService.updateProfile` → profile/privacy | Có caller; thiếu lưu `showPostsOnProfile` |
| 19 | `GET /categories` | `categoryService.list` → Explore/Create/Edit community | Có caller; guest bị chặn |
| 20 | `GET /explore` | `communityService.list` → Explore/App | Có caller |
| 21 | `GET /explore/{slug}` | `communityService.listByCategory` → Explore | Có caller |
| 22 | `GET /explore/search` | `communityService.search` → Explore | Có caller |
| 23 | `POST /communities` | `communityService.create` → CreateCommunityPage | Có caller |
| 24 | `PATCH /communities/{name}` | `communityService.update` → EditCommunityPage | Có caller |
| 25 | `GET /communities/{name}` | `communityService.getByName` → detail/settings/members | Có caller; guest bị chặn |
| 26 | `PUT /communities/{name}/avatar` | `communityService.uploadAvatar` | Có caller |
| 27 | `PUT /communities/{name}/banner` | `communityService.uploadBanner` | Có caller |
| 28 | `GET /communities/{name}/members` | `communityService.members` → CommunityMembersPage | Có caller; query `role` chưa được UI chuyển xuống |
| 29 | `POST /communities/{name}/members` | `communityService.join` → membership buttons | Có caller |
| 30 | `DELETE /communities/{name}/members/me` | `communityService.leave` | Có caller |
| 31 | `PUT /communities/{name}/moderators/{username}` | `communityService.appointModerator` | Có caller |
| 32 | `DELETE /communities/{name}/moderators/{username}` | `communityService.removeModerator` | Có caller |
| 33 | `DELETE /communities/{name}/members/{username}` | `communityService.kickMember` | Có caller; thiếu authorization phía BE |
| 34 | `PUT /communities/{name}/owner` | `communityService.transferOwnership` | Có caller; chưa cập nhật `Community.owner` |

Nguồn BE: toàn bộ file trong `backend/src/main/java/com/discuss/discuss/controller/`. Nguồn FE: `frontend/src/services/index.ts`, `services/apiClient.ts`, stores và `routes/index.tsx`.

`DELETE /communities/{name}` đang bị comment trong controller, **không tính vào 34 API đang khai báo**. Không tìm thấy webhook hoặc controller nội bộ khác cần loại trừ khỏi thống kê caller FE.

## 4. FE gọi API chưa có BE: 10 endpoint có luồng HTTP hiện tại

Tất cả nằm trong `frontend/src/services/index.ts`; không được bảo vệ bằng các cờ `*_AVAILABLE`.

| Endpoint FE | Caller cuối | Phần BE còn thiếu |
|---|---|---|
| `GET /users/search?q=...` | SearchResultsPage → `userService.search` | Route tìm user; đang dùng `/users` trong khi controller hiện tại dùng `/user` |
| `POST /reports` | ReportModal → report store | Tạo báo cáo POST/COMMENT/COMMUNITY/USER; kiểm tra target và chống gửi trùng |
| `GET /reports` | Admin ReportManagementPage | Danh sách báo cáo theo quyền admin, phân trang/lọc |
| `GET /reports/community/{name}` | CommunityModerationPage | Hàng đợi theo cộng đồng và quyền mod/owner |
| `PATCH /reports/{id}` | Resolve/reject ở admin/moderation | Xử lý report, người xử lý, ghi chú, tác động lên nội dung |
| `GET /admin/stats` | AdminDashboardPage | Tổng hợp số liệu, growth theo thời gian |
| `GET /admin/users` | UserManagementPage | Danh sách/search/filter/pagination user |
| `PATCH /admin/users/{id}/status` | UserManagementPage | Khóa/mở user; xác thực ADMIN và trạng thái hợp lệ |
| `GET /admin/communities` | CommunityManagementPage | Liệt kê cả community đang bị khóa |
| `PATCH /communities/{name}/status` | CommunityManagementPage | Khóa/mở community, chuẩn hóa enum |

Hiện FE có thể gửi report cho ID `demo-post-*`/`demo-comment-*`. Khi bổ sung API, phải chuyển target sang ID thật hoặc ngăn report nội dung demo; nếu chỉ thêm ReportsController thì luồng này vẫn chưa dùng được đầy đủ.

## 5. FE có luồng UI nhưng HTTP đang bị tắt: 17 endpoint

`frontend/src/services/index.ts:64–66` đặt cứng `POSTS_AVAILABLE = false`, `NOTIFICATIONS_AVAILABLE = false`, `MESSAGES_AVAILABLE = false`. Không phải cờ lấy từ `.env`; đổi `VITE_USE_MOCK` ở ứng dụng `test/` không thay đổi FE chính.

| Module | Endpoint chưa có BE | Hành vi hiện tại |
|---|---|---|
| Post (7) | `GET /posts?tab=...`; `GET /posts/{id}`; `POST /posts`; `DELETE /posts/{id}`; `PUT /posts/{id}/vote`; `PUT /posts/{id}/save`; `GET /posts/saved` | `usePostStore` tạo/đọc/xóa/tim/lưu trong bộ nhớ bằng demoPosts |
| Comment (3) | `GET /posts/{id}/comments`; `POST /posts/{id}/comments`; `PUT /posts/{id}/comments/{commentId}/vote` | `usePostStore` dùng demoComments, hỗ trợ reply local |
| Notification (3) | `GET /notifications`; `PUT /notifications/{id}/read`; `PUT /notifications/read-all` | `useNotificationStore` và badge đọc trạng thái local |
| Message (3) | `GET /messages`; `GET /messages/{id}`; `POST /messages/{id}` | `messageService` thao tác mảng `localConversations`, không gửi sang tài khoản khác |
| Ảnh bài viết (1) | `POST /media/post-image` | PostComposer dùng data URL khi post API chưa bật; không upload MinIO |

Các đường dẫn này là contract FE đang dự kiến, không phải yêu cầu giữ nguyên bắt buộc. Cần thống nhất DTO/phân trang/enum rồi mới bật cờ.

## 6. Hàm service chưa được UI/store gọi: 7 endpoint dự kiến

| Hàm FE | Endpoint chưa có BE | Kết luận |
|---|---|---|
| `notificationService.getPreferences` | `GET /notifications/preferences` | Không có caller; hydrate hiện chỉ tải danh sách thông báo |
| `notificationService.savePreferences` | `PUT /notifications/preferences` | Không có caller; store hiện ghi localStorage, kể cả nếu bật `NOTIFICATIONS_AVAILABLE` |
| `messageService.createConversation` | `POST /messages/conversations` | Không có caller; thiếu nút/luồng bắt đầu chat với user mới |
| `mediaService.uploadAvatar` | `POST /media/avatar?size=...` | Không có caller; avatar user/community dùng endpoint PUT chuyên biệt đã có |
| `mediaService.uploadCover` | `POST /media/cover` | Không có caller; banner dùng endpoint PUT chuyên biệt đã có |
| `mediaService.uploadMedia` | `POST /media/upload` | Không có caller; chưa có MediaController |
| `mediaService.uploadMultipleMedia` | `POST /media/upload/multiple` | Không có caller; chưa có UI nhiều ảnh/video hoàn chỉnh |

`mediaService.getMediaUrl` cũng chưa có caller nhưng chỉ là helper, không phải endpoint. `useCommunityStore.banCommunity/unbanCommunity` chỉ throw lỗi, không gửi HTTP; admin hiện gọi `adminService.setCommunityStatus` trực tiếp.

Không cần triển khai toàn bộ `/media/*` chỉ để hết danh sách này: avatar/banner chuyên biệt đã hoạt động theo contract hiện tại; có thể xóa helper dư sau khi chọn hướng upload.

## 7. Ma trận chức năng và model còn thiếu

| Chức năng | FE chính | BE hiện có | Cần hoàn thiện |
|---|---|---|---|
| Đăng ký/login/Google/OTP/reset/change password | Nối API | Controller, service, DTO, token/email | Kiểm thử end-to-end, vòng đời session và cấu hình Google |
| Sửa profile/avatar/banner | Nối API | User/Profile/Image service | DTO identity, ảnh public profile, xóa field nullable |
| Ngày sinh/vị trí riêng tư | Nối API | Có model và lọc trong public service | Kiểm chứng phân quyền và format ngày |
| Ẩn bài viết trên profile | Có toggle | DTO nhận nhưng cột entity bị comment | Thêm cột, response, mapping và enforce query profile |
| Explore/category/tìm community | Nối API | Có controller/service/repository | Quyền guest, thống nhất visibility, paging UI |
| Tạo/sửa community, avatar/banner | Nối API | Có luồng tương ứng | Quyền owner/admin theo quyết định sản phẩm; dữ liệu role ở DTO |
| Tham gia/rời/bổ nhiệm/kick/chuyển owner | Nối API | Có controller/service | Sửa authorization, identity owner, moderator role trả về |
| Community private | FE cho chọn PRIVATE | Join trực tiếp bị từ chối; chưa có request/invite | Model join request/invitation, duyệt/từ chối, kiểm tra quyền đọc |
| Nội quy community | UI đọc `rules`, mapper FE luôn trả `[]` | Chưa có field/entity tương ứng | Rule model + CRUD và UI quản lý |
| Post/feed/community feed/profile posts | Mock | Entity Post/PostContent/PostMedia | Repository, DTO, service, controller, phân trang, sort và quyền |
| Sửa/ghim/ẩn bài viết | UI chính chưa có luồng sửa/ghim; model có pinned | Post có `isPinned`, status | API và UI; khôi phục chức năng JSX cũ có chọn lọc |
| Tim/vote post | Mock tim | Entity PostVote, enum UP/DOWN | Chốt tim hay up/down; API, uniqueness, aggregate count |
| Bookmark | Mock | Chưa có model SavedPost | Entity/migration + unique(user,post), API idempotent |
| Comment/reply | Mock | Entity Comment có parent/status | API CRUD, paging cây reply, permission và soft delete |
| Tim comment | Mock | Chưa có model CommentReaction/CommentVote | Model quan hệ user/comment, uniqueness, count |
| Báo cáo/moderation | Gọi API chưa có | PostReport/CommentReport/CommunityReport | CRUD xử lý, scope quyền, lý do/kết quả, UserReport hoặc report chung |
| Ban/mute member và lịch sử | Chủ yếu có ở JSX/prototype, FE chính mới có kick | BanHistory, MembershipStatus.BANNED | Ban/unban API; mute cần field/trạng thái/thời hạn; UI tương ứng |
| Admin | Gọi API chưa có | User/Community enum có trạng thái | Controller/service ADMIN, statistics, filter/paging, nhật ký hành động |
| Notification, unread, read-all | Mock | Chưa có entity/module | Notification recipient/event/readAt, phát sự kiện, API, badge |
| Notification preferences/email digest | localStorage | Chưa có model | Lưu theo user, endpoint và nối store; worker/scheduler gửi email |
| Chat | Mock | Chưa có model | Conversation/Participant/Message/read cursor, API, quyền thành viên; realtime hoặc polling |
| Bắt đầu chat/tin nhắn chưa đọc | Thiếu UI tạo chat; unreadCount demo | Chưa có model/logic | Chọn người nhận, tạo/tái sử dụng cuộc trò chuyện, cập nhật unread |
| Hồ sơ: statistics/lịch sử bình luận | Post lọc trong mảng local; tab comment là placeholder | Statistics public trả ba số 0 cố định | Query post/comment/community thật; API lịch sử, quyền riêng tư |
| Tìm kiếm toàn hệ thống | Post/community lọc store; user gọi endpoint chưa có | Chỉ có search community | Search post/user, phân trang và nối đúng tab; không tìm toàn DB từ mảng FE |
| Liên kết tài khoản Google | Hiển thị cố định đã liên kết | Có provider để login, chưa có API liên kết/unlink | Trả provider thực tế; chỉ triển khai link/unlink nếu nằm trong scope |
| Thiết bị/phiên đăng nhập | Chrome/macOS và iPhone cố định; revoke chỉ toast | RefreshToken không có metadata thiết bị; phát token mới revoke các refresh token cũ | Chốt single/multi session; list/revoke session, device metadata và UI thật |
| Giao diện/theme/search history | localStorage, có tác dụng trên thiết bị | Không có endpoint | Có thể giữ local; chỉ cần BE nếu muốn đồng bộ nhiều thiết bị |

Tags/codeSnippet cũng chưa có field/entity riêng. `PostMedia.mediaType` hiện chỉ `IMAGE|VIDEO`, trong khi FE dùng `image|code|link`: code/link cần contract nội dung riêng, không truyền trực tiếp vào enum ảnh/video.

## 8. Lỗi tích hợp cần xử lý trước khi mở rộng

### P0 — Kick member chưa kiểm tra quyền người thực hiện

`backend/.../service/community/CommunityMemberService.java: kickMember` chỉ lấy target user và kiểm tra target không phải OWNER, không lấy current user và không gọi `requireModeratorOrOwner`. Controller không có `@PreAuthorize`; Security chỉ yêu cầu authenticated. Theo code hiện tại, request từ user đăng nhập không có quyền quản trị vẫn có thể đi vào nhánh kick. Cần kiểm tra caller, scope community và thứ bậc target ở BE; không dựa vào việc FE ẩn nút.

### P1 — Ownership có hai nguồn dữ liệu chưa đồng bộ

`transferOwnership` và `transferOwnershipBeforeLeaving` chỉ đổi `CommunityMember.role`, không cập nhật `Community.owner`. `createMembership/reactivateMembership` có thể tự gán OWNER khi thiếu active owner nhưng cũng không cập nhật owner của Community.

`getAllCommunitiesOfOwner` dùng `communityRepository.findByOwner`, mapper detail dùng `community.getOwner`: chủ cũ có thể vẫn xuất hiện trong `/user/me/owned`, UI vẫn hiển thị owner cũ và FE lại suy ra quyền OWNER từ endpoint owned. Cần cập nhật owner cùng transaction, chốt hành vi khi community hết thành viên và hydrate lại mine/role ở FE.

### P1 — DTO không trả membership role của người đang xem

`CommunityPreviewResponseDTO`/`CommunityDetailResponseDTO` không có `currentUserRole`. FE fallback owned→OWNER, joined→MEMBER; moderator thành MEMBER. Sau đăng nhập lại hoặc mở trang trực tiếp, moderator có thể mất quyền hiển thị công cụ quản trị dù membership BE vẫn là MODERATOR.

Thêm `currentUserRole` ở DTO hoặc endpoint membership-me và dùng dữ liệu thật ở FE. UI đang cho ADMIN làm một số thao tác mà BE chỉ cho OWNER; cần thống nhất ma trận quyền theo hệ thống và theo cộng đồng.

### P1 — Public route ở FE không khớp Security BE

`SecurityConfiguration.PUBLIC_ENDPOINTS` chỉ mở `/auth/**`, `/explore`, `/explore/**`. Nhưng FE cho guest vào `/user/:username`, `/community/:communityName`, Explore gọi `/categories`. Các GET `/user/{name}`, `/communities/{name}`, `/categories` vẫn cần xác thực.

Cho phép GET public theo yêu cầu sản phẩm, vẫn chặn dữ liệu PRIVATE ở service. Không mở toàn bộ `/user/**` hoặc `/communities/**` vì có API ghi và dữ liệu cá nhân. Home guest cũng không hydrate community trong App.tsx, nên sidebar/search phụ thuộc dữ liệu đã tải ở trang khác.

### P1 — Privacy toggle hiển thị bài viết không lưu

`UpdateProfileRequestDTO.showPostsOnProfile` tồn tại, nhưng field trong `UserPrivacySettings` đang comment; `UserInfoResponseDTO.PrivacySettings` chỉ trả DOB/location; mapper IGNORE bỏ qua field không có target. FE thường fallback true. Ngày sinh/vị trí **đã được service public lọc theo privacy**, khác với nhận định cũ trong API_GAP_ANALYSIS.md.

### P1 — Chuẩn hóa status/vote/media trước khi nối API

- BE UserStatus: `ACTIVE|PENDING|LOCKED|DELETED`; admin FE gửi `BANNED` khi khóa. Mapping hiện chỉ đổi LOCKED→SUSPENDED ở response, không đổi request ngược lại.
- BE CommunityStatus: `ACTIVE|BANED`; FE gửi `BANNED`, có thêm RESTRICTED. Mapper FE có chữa response nhưng request vẫn lệch enum.
- BE VoteType: UP/DOWN; post FE gửi `voteType: 0|1`. Cần chốt tim một chiều hay up/down và thao tác hủy vote.
- BE MediaType: IMAGE/VIDEO; FE dùng image/code/link; không thể bật cờ và dùng nguyên DTO.

### P1 — Public profile và identity chưa thống nhất

- `UserInfoResponseDTO` không trả user id; auth store dùng username làm id dự phòng. Public profile trả Long userId; một số so sánh ownership/media hoặc post sau này cần ID nhất quán. Thêm id vào self DTO và chuẩn hóa string ở FE boundary.
- `UserMapper.toPublicUserProfileResponse` trả raw `profile.getAvatar/getBanner`, trong khi self mapper gọi MinioService.buildFileUrl. Avatar/banner ở profile người khác có thể là object key thay vì URL.
- Public DTO không có `role` nhưng FE đọc `response.role`; statistics là `0L,0L,0L` cố định; FE lại gán postCount sang karma. Cần trả đúng trường và bỏ số liệu suy diễn.
- Public DOB format `dd/MM/yyyy`, self profile ISO; UI profile dùng Date parsing nên có thể hiển thị sai/Invalid Date. Chốt ISO cho transport.
- FE gửi null khi xóa DOB, nhưng UserUpdateMapper dùng `NullValuePropertyMappingStrategy.IGNORE`; thao tác xóa DOB không thể được lưu bằng cách này. Cần phân biệt field không gửi với field muốn xóa.

### P1/P2 — Session và trạng thái local khi đổi tài khoản

- `AuthController.logout` hiện xóa cookie, không revoke refresh token ở database. Chưa có luồng thu hồi session thực sự từ UI thiết bị.
- `TokenService.saveRefreshToken` gọi revokeAllUserTokens mỗi lần phát token: UI nhiều thiết bị đang ngụ ý hành vi chưa được hỗ trợ đầy đủ.
- `useAuthStore.clearSession` không reset post/community/report/notification store hoặc `localConversations`. Dữ liệu demo và trạng thái cache có thể đi theo từ tài khoản A sang B trong cùng lần mở ứng dụng. Cần reset hoặc key dữ liệu theo user trước khi dùng API thật.
- `useNotificationStore.savePreferences` luôn ghi localStorage; bật flag không tự nối preferences với BE.

### P2 — Search, paging và PRIVATE chưa nhất quán

- CommunityMembersPage lọc role/search local sau khi tải tất cả trang; BE đã có query role nhưng store/UI chưa dùng. Đây là tham số chưa khai thác, không phải endpoint chưa dùng.
- Community list/member helper lấy mọi page với size=100 rồi Promise.all các page còn lại. Admin/report/post contract hiện mong array. Cần chuyển UI paging/infinite scroll và adapter PageResponse trước khi dữ liệu lớn.
- SearchResultsPage lọc posts/communities từ store toàn cục. Explore có thể đã thay store bằng một category/search subset; kết quả không đại diện toàn hệ thống.
- `/explore/search` dùng specification PUBLIC, còn `/explore` chỉ lọc ACTIVE và category query cũng không lọc visibility. Cần quyết định PRIVATE có được discovery không và áp dụng nhất quán. `getCommunityDetail/getCommunityMembers` cũng chưa kiểm tra membership cho PRIVATE ngoài yêu cầu đăng nhập chung.
- Report resolve hiện chỉ gửi status/note nhưng UI mô tả đã gỡ nội dung. API tương lai phải có action thực thi rõ ràng (ẩn/xóa/cảnh cáo) hoặc đổi nội dung UI theo kết quả thật.

## 9. Ứng dụng prototype `test/` cần xử lý riêng

- `test/src/services/index.ts` mặc định `USE_MOCK = true` nếu VITE_USE_MOCK không bằng chuỗi `false`. Community/post/report services có fallback mock, nhưng nhiều page/store còn thao tác mock trực tiếp; đổi flag không đủ chuyển cả app sang BE.
- Auth/profile gọi BE, nhưng userService dùng `/users/me`, `/users/me/profile`, `/users/me/avatar`, `/users/me/banner`, lệch `/user/...` đang có. Login thành công vẫn có thể thất bại ở bước getMe.
- Chế độ không mock còn gọi `GET /communities`, `POST /communities/{name}/join`, `POST /communities/{name}/leave`: BE hiện dùng GET /explore, POST members và DELETE members/me; response list phân trang cũng khác.
- Script dev chạy port 3000; CORS BE hiện chỉ cho localhost:5173 (và biến thể có dấu `/`). README của test nói đã cho phép localhost/127.0.0.1:3000 nhưng code không như vậy.
- `test/src/store/useAuthStore.verifyEmail` gọi getMe ngay sau verify; BE verify email chỉ trả message, không set auth cookie. FE chính đã chuyển về trạng thái chưa đăng nhập sau xác thực. Prototype cần cùng semantics hoặc login rõ ràng.
- DevRoleSwitcher thay role phía FE, không cấp quyền thật ở BE. Chỉ dùng preview; không dùng để xác nhận authorization.
- Dashboard/users/reports/profile/notifications/messages có dữ liệu MOCK; đây là mẫu chức năng, không phải bằng chứng endpoint đã hoạt động.

## 10. Backlog đề xuất theo thứ tự triển khai

| Mốc | Công việc | Điều kiện nghiệm thu |
|---|---|---|
| P0 | Sửa kick authorization; rà quyền thao tác member/private | User thường không thể kick; mod/owner chỉ thao tác trong scope được phép |
| P1-A | Đồng bộ owner, currentUserRole, DTO user id/ảnh/ngày/privacy; thống nhất status và guest access | Đăng nhập lại vẫn thấy đúng owner/mod; chuyển owner cập nhật cả owned list và header; privacy có tác dụng sau reload |
| P1-B | Post CRUD/feed, post media, comment/reply CRUD, reaction, bookmark | Bài/ảnh/comment/tim/save tồn tại sau reload và giữa hai tài khoản; post private không bị đọc trái quyền |
| P1-C | Search user/post và profile activity, paging | Search truy vấn dữ liệu hệ thống; lịch sử profile lấy từ API, số liệu đúng |
| P1-D | Reports + xử lý nội dung + admin users/community/stats | Gửi report ID thật, mod chỉ thấy community của mình, admin có dữ liệu và khóa/mở được với enum BE |
| P2-A | PRIVATE join request/invite, rules, ban/unban/mute | User xin vào được duyệt/từ chối; nội quy và trạng thái ban có persistence |
| P2-B | Notification + preferences + phát event/email theo scope | Reply tạo thông báo đúng recipient, unread/read-all persist, preferences theo user |
| P2-C | Chat + tạo hội thoại + read/unread + cập nhật nhận tin | Hai tài khoản gửi/nhận được, refresh không mất, không đọc hội thoại người khác |
| P2-D | Session/device/provider UI thật, dọn legacy/prototype | Thu hồi session có tác dụng ở server; UI provider phản ánh tài khoản; chỉ một bộ contract được duy trì |

Các API mới cần thiết nhưng **chưa có cả wrapper trong FE chính** gồm sửa/ghim/ẩn post, sửa/xóa comment, lịch sử post/comment theo user, nội quy, join-request/invite, ban/unban/mute và session list/revoke. Chọn URL sau khi chốt scope; không tính chúng vào 34 đường dẫn FE đã khai báo ở trên.

Model mới tối thiểu theo mô hình FE hiện tại: SavedPost, CommentReaction, Notification, NotificationPreference, Conversation, ConversationParticipant, Message; bổ sung CommunityRule, JoinRequest/Invitation, UserReport hoặc unified Report nếu giữ những chức năng này. Tags/codeSnippet, session metadata, report resolutionNote/action và mute expiry cần mở rộng model/contract tương ứng.

## 11. Kiểm chứng và giới hạn

- Đã rà controller đang hoạt động, DTO/entity/mapper/service/repository liên quan; bỏ annotation bị comment; truy từ entry/routes tới UI/store/service và đối chiếu HTTP method + path.
- `frontend: npm run build`: PASS. Có cảnh báo chunk lớn hơn 500 kB; build không kiểm chứng API hay đầy đủ type-check TypeScript.
- `frontend: npm test`: PASS, 3 file / 40 test. Các test hiện chủ yếu kiểm tra demo/store/community media/directory; không phải E2E FE–BE.
- `backend: mvnw.cmd -o -DskipTests compile`: PASS, compile 125 source file, BUILD SUCCESS. Có ghi chú deprecated API ở GlobalExceptionHandler; chưa chạy integration test.
- Chưa chạy E2E với tài khoản/DB/Redis/MinIO/SMTP thật, chưa đo network traffic production. Kết luận “có dùng/chưa dùng” nghĩa là tồn tại hoặc không tồn tại đường gọi trong source hiện tại.
- ESLint hiện chỉ nhắm `*.js,*.jsx`, không kiểm tra đầy đủ phần TS/TSX đang chạy. Không dùng lint làm bằng chứng hoàn thiện integration.
