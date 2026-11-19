# Discuss Admin API

Tài liệu request và response cho 24 endpoint dưới `/admin` và 3 endpoint báo cáo tương thích. Tất cả yêu cầu quyền `ADMIN`. Ví dụ HTTP dùng biến `{{baseUrl}}` cho URL backend và `{{accessToken}}` cho JWT. Frontend có thể dùng cookie `access_token` theo cấu hình xác thực của dự án. Dữ liệu minh họa là dữ liệu giả.

## Quy ước chung

- Gửi `Content-Type: application/json` cho request có JSON body. Các request còn lại trong tài liệu chỉ dùng path hoặc query.
- ID dạng số nguyên dương. Riêng `id` của bài viết trong JSON là chuỗi.
- Danh sách dùng `Pageable` nhận `page` (từ 0), `size` (mặc định 10, tối đa 50) và `sort` (ví dụ `createdAt,desc`). Báo cáo admin mặc định sắp xếp `createdAt DESC, id DESC`.
- Các endpoint `/search` nhận `search` qua query, bắt buộc có nội dung và tối đa 200 ký tự.
- Mã lỗi thường gặp gồm `400` khi đầu vào không hợp lệ, `401` khi chưa xác thực, `403` khi thiếu quyền và `404` khi tài nguyên không tồn tại. Báo cáo đã xử lý trả `409` nếu xử lý lại.
- Mỗi ví dụ dưới đây trình bày request và JSON response thành công tương ứng. Các thao tác ghi sẽ thay đổi dữ liệu nếu gửi đến server thật.

## Thống kê

### GET `/admin/stats`

```http
GET {{baseUrl}}/admin/stats
Authorization: Bearer {{accessToken}}
```

**Response HTTP 200**

```json
{
  "data": {
    "users": {
      "total": 2,
      "active": 1,
      "suspended": 1
    },
    "communities": {
      "total": 1,
      "active": 1,
      "suspended": 0
    },
    "posts": {
      "total": 1
    },
    "comments": {
      "total": 0
    }
  }
}
```

## Quản lý người dùng

`status` nhận `ACTIVE` hoặc `SUSPENDED`. `role` nhận `USER` hoặc `ADMIN`. Cả hai là bộ lọc tùy chọn cho danh sách và tìm kiếm.

### GET `/admin/users`

```http
GET {{baseUrl}}/admin/users?status=ACTIVE&role=USER&page=0&size=10
Authorization: Bearer {{accessToken}}
```

**Response HTTP 200**

```json
{
  "content": [
    {
      "id": 12,
      "username": "demo_user",
      "email": "demo@example.invalid",
      "displayName": "Demo User",
      "avatarUrl": null,
      "role": "USER",
      "status": "ACTIVE",
      "createdAt": "2026-11-19T00:00:00"
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 1,
  "totalPages": 1,
  "first": true,
  "last": true,
  "empty": false
}
```

### GET `/admin/users/search`

```http
GET {{baseUrl}}/admin/users/search?search=demo&status=ACTIVE&role=USER
Authorization: Bearer {{accessToken}}
```

**Response HTTP 200**

```json
{
  "content": [
    {
      "id": 12,
      "username": "demo_user",
      "email": "demo@example.invalid",
      "displayName": "Demo User",
      "avatarUrl": null,
      "role": "USER",
      "status": "ACTIVE",
      "createdAt": "2026-11-19T00:00:00"
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 1,
  "totalPages": 1,
  "first": true,
  "last": true,
  "empty": false
}
```

### GET `/admin/users/12`

```http
GET {{baseUrl}}/admin/users/12
Authorization: Bearer {{accessToken}}
```

**Response HTTP 200**

```json
{
  "userId": 12,
  "username": "demo_user",
  "joinedAt": "2026-11-19T00:00:00",
  "profile": {
    "displayName": "Demo User",
    "bio": "Xin chào",
    "avatar": null,
    "banner": null,
    "dateOfBirth": null,
    "gender": null,
    "location": null
  },
  "statistics": {
    "postCount": 1,
    "commentCount": 0,
    "communityCount": 1
  }
}
```

### PATCH `/admin/users/12/lock`

```http
PATCH {{baseUrl}}/admin/users/12/lock
Authorization: Bearer {{accessToken}}
```

**Response HTTP 200**

```json
{
  "message": "User account id 12 locked successfully"
}
```

### PATCH `/admin/users/12/unlock`

```http
PATCH {{baseUrl}}/admin/users/12/unlock
Authorization: Bearer {{accessToken}}
```

**Response HTTP 200**

```json
{
  "message": "User account id 12 unlocked successfully"
}
```

## Quản lý cộng đồng

Bộ lọc tùy chọn `status` nhận `ACTIVE` hoặc `BANED` (đúng chính tả enum hiện tại của backend). `visibility` nhận `PUBLIC` hoặc `PRIVATE`.

### GET `/admin/communities`

```http
GET {{baseUrl}}/admin/communities?status=ACTIVE&visibility=PUBLIC
Authorization: Bearer {{accessToken}}
```

**Response HTTP 200**

```json
{
  "content": [
    {
      "id": 24,
      "name": "demo_java",
      "description": "Thảo luận Java",
      "rules": "Tôn trọng các thành viên",
      "avatarUrl": null,
      "bannerUrl": null,
      "categoryId": 33,
      "categoryName": "Lập trình",
      "visibility": "PUBLIC",
      "status": "ACTIVE",
      "memberCount": 1,
      "createdAt": "2026-11-19T00:00:00",
      "owner": {
        "userId": 12,
        "username": "demo_user",
        "displayName": "Demo User",
        "avatarUrl": null
      }
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 1,
  "totalPages": 1,
  "first": true,
  "last": true,
  "empty": false
}
```

### GET `/admin/communities/search`

```http
GET {{baseUrl}}/admin/communities/search?search=java&status=ACTIVE
Authorization: Bearer {{accessToken}}
```

**Response HTTP 200**

```json
{
  "content": [
    {
      "id": 24,
      "name": "demo_java",
      "description": "Thảo luận Java",
      "rules": "Tôn trọng các thành viên",
      "avatarUrl": null,
      "bannerUrl": null,
      "categoryId": 33,
      "categoryName": "Lập trình",
      "visibility": "PUBLIC",
      "status": "ACTIVE",
      "memberCount": 1,
      "createdAt": "2026-11-19T00:00:00",
      "owner": {
        "userId": 12,
        "username": "demo_user",
        "displayName": "Demo User",
        "avatarUrl": null
      }
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 1,
  "totalPages": 1,
  "first": true,
  "last": true,
  "empty": false
}
```

### GET `/admin/communities/24`

```http
GET {{baseUrl}}/admin/communities/24
Authorization: Bearer {{accessToken}}
```

**Response HTTP 200**

```json
{
  "id": 24,
  "name": "demo_java",
  "description": "Thảo luận Java",
  "rules": "Tôn trọng các thành viên",
  "avatarUrl": null,
  "bannerUrl": null,
  "categoryId": 33,
  "categoryName": "Lập trình",
  "visibility": "PUBLIC",
  "status": "ACTIVE",
  "memberCount": 1,
  "createdAt": "2026-11-19T00:00:00",
  "owner": {
    "userId": 12,
    "username": "demo_user",
    "displayName": "Demo User",
    "avatarUrl": null
  }
}
```

### PATCH `/admin/communities/24/lock`

```http
PATCH {{baseUrl}}/admin/communities/24/lock
Authorization: Bearer {{accessToken}}
```

**Response HTTP 200**

```json
{
  "message": "Community id 24 locked successfully"
}
```

### PATCH `/admin/communities/24/unlock`

```http
PATCH {{baseUrl}}/admin/communities/24/unlock
Authorization: Bearer {{accessToken}}
```

**Response HTTP 200**

```json
{
  "message": "Community id 24 unlocked successfully"
}
```

## Quản lý bài viết

`status` nhận `PUBLISHED`, `HIDDEN` hoặc `DELETED`. `communityName` nhận tên cộng đồng tối đa 255 ký tự. Cả hai bộ lọc đều tùy chọn. Trong response, `type` nhận `TEXT` hoặc `LINK`, `userVote` có thể là `UP`, `DOWN` hoặc `null`, và mỗi phần tử `media` có các trường `type`, `objectKey`, `caption`, `url`, `position`, `inlineImage`.

### GET `/admin/posts`

```http
GET {{baseUrl}}/admin/posts?status=PUBLISHED&communityName=demo_java
Authorization: Bearer {{accessToken}}
```

**Response HTTP 200**

```json
{
  "content": [
    {
      "id": "27",
      "communityName": "demo_java",
      "communityDisplayName": "demo_java",
      "communityAvatar": null,
      "author": {
        "id": "12",
        "username": "demo_user",
        "displayName": "Demo User",
        "avatarUrl": null
      },
      "title": "Java demo",
      "type": "TEXT",
      "content": "Nội dung mẫu",
      "media": [],
      "linkUrl": null,
      "voteScore": 0,
      "commentCount": 0,
      "userVote": null,
      "isSaved": false,
      "pinned": false,
      "status": "PUBLISHED",
      "createdAt": "2026-11-19T00:00:00",
      "updatedAt": "2026-11-19T00:00:00"
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 1,
  "totalPages": 1,
  "first": true,
  "last": true,
  "empty": false
}
```

### GET `/admin/posts/search`

```http
GET {{baseUrl}}/admin/posts/search?search=Java&status=PUBLISHED&communityName=demo_java
Authorization: Bearer {{accessToken}}
```

**Response HTTP 200**

```json
{
  "content": [
    {
      "id": "27",
      "communityName": "demo_java",
      "communityDisplayName": "demo_java",
      "communityAvatar": null,
      "author": {
        "id": "12",
        "username": "demo_user",
        "displayName": "Demo User",
        "avatarUrl": null
      },
      "title": "Java demo",
      "type": "TEXT",
      "content": "Nội dung mẫu",
      "media": [],
      "linkUrl": null,
      "voteScore": 0,
      "commentCount": 0,
      "userVote": null,
      "isSaved": false,
      "pinned": false,
      "status": "PUBLISHED",
      "createdAt": "2026-11-19T00:00:00",
      "updatedAt": "2026-11-19T00:00:00"
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 1,
  "totalPages": 1,
  "first": true,
  "last": true,
  "empty": false
}
```

### GET `/admin/posts/27`

```http
GET {{baseUrl}}/admin/posts/27
Authorization: Bearer {{accessToken}}
```

**Response HTTP 200**

```json
{
  "id": "27",
  "communityName": "demo_java",
  "communityDisplayName": "demo_java",
  "communityAvatar": null,
  "author": {
    "id": "12",
    "username": "demo_user",
    "displayName": "Demo User",
    "avatarUrl": null
  },
  "title": "Java demo",
  "type": "TEXT",
  "content": "Nội dung mẫu",
  "media": [],
  "linkUrl": null,
  "voteScore": 0,
  "commentCount": 0,
  "userVote": null,
  "isSaved": false,
  "pinned": false,
  "status": "PUBLISHED",
  "createdAt": "2026-11-19T00:00:00",
  "updatedAt": "2026-11-19T00:00:00"
}
```

### DELETE `/admin/posts/27`

```http
DELETE {{baseUrl}}/admin/posts/27
Authorization: Bearer {{accessToken}}
```

**Response HTTP 200**

```json
{
  "message": "Post id 27 deleted successfully"
}
```

## Quản lý báo cáo

`type` bắt buộc, nhận `POST`, `COMMENT` hoặc `COMMUNITY`. Trong route chi tiết và xử lý, `reportId` là ID của báo cáo thuộc loại đã chọn và `targetId` trong response là ID đối tượng bị báo cáo. Danh sách có thể lọc theo `status` (`PENDING`, `RESOLVED`, `REJECTED`) và `communityName` (tối đa 255 ký tự). `reason` nhận `SPAM`, `HARASSMENT`, `HATE_SPEECH`, `INAPPROPRIATE_CONTENT`, `MISINFORMATION` hoặc `OTHER`.

### GET `/admin/reports`

```http
GET {{baseUrl}}/admin/reports?type=POST&status=PENDING&communityName=demo_java
Authorization: Bearer {{accessToken}}
```

**Response HTTP 200**

```json
{
  "content": [
    {
      "id": 81,
      "targetType": "POST",
      "targetId": 27,
      "communityName": "demo_java",
      "reporterUsername": "demo_user",
      "reason": "SPAM",
      "description": "Nội dung lặp lại",
      "status": "PENDING",
      "action": null,
      "resolutionNote": null,
      "resolvedBy": null,
      "resolvedAt": null,
      "createdAt": "2026-11-19T00:00:00"
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 1,
  "totalPages": 1,
  "first": true,
  "last": true,
  "empty": false
}
```

### GET `/admin/reports/POST/81`

```http
GET {{baseUrl}}/admin/reports/POST/81
Authorization: Bearer {{accessToken}}
```

**Response HTTP 200**

```json
{
  "id": 81,
  "targetType": "POST",
  "targetId": 27,
  "communityName": "demo_java",
  "reporterUsername": "demo_user",
  "reason": "SPAM",
  "description": "Nội dung lặp lại",
  "status": "PENDING",
  "action": null,
  "resolutionNote": null,
  "resolvedBy": null,
  "resolvedAt": null,
  "createdAt": "2026-11-19T00:00:00"
}
```

### PATCH `/admin/reports/POST/81/resolve`

`resolutionNote` bắt buộc có nội dung, tối đa 2.000 ký tự. Báo cáo phải đang `PENDING`. Thao tác ghi nhận kết quả xử lý. Gỡ nội dung là thao tác riêng.

```http
PATCH {{baseUrl}}/admin/reports/POST/81/resolve
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "resolutionNote": "Đã xem xét nội dung"
}
```

**Response HTTP 200**

```json
{
  "id": 81,
  "targetType": "POST",
  "targetId": 27,
  "communityName": "demo_java",
  "reporterUsername": "demo_user",
  "reason": "SPAM",
  "description": "Nội dung lặp lại",
  "status": "RESOLVED",
  "action": "REVIEWED",
  "resolutionNote": "Đã xem xét nội dung",
  "resolvedBy": "demo_admin",
  "resolvedAt": "2026-11-19T00:00:00",
  "createdAt": "2026-11-19T00:00:00"
}
```

### PATCH `/admin/reports/COMMENT/82/reject`

`resolutionNote` bắt buộc có nội dung, tối đa 2.000 ký tự. Báo cáo phải đang `PENDING`.

```http
PATCH {{baseUrl}}/admin/reports/COMMENT/82/reject
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "resolutionNote": "Nội dung không vi phạm"
}
```

**Response HTTP 200**

```json
{
  "id": 82,
  "targetType": "COMMENT",
  "targetId": 40,
  "communityName": "demo_java",
  "reporterUsername": "demo_user",
  "reason": "SPAM",
  "description": "Nội dung lặp lại",
  "status": "REJECTED",
  "action": "REJECTED",
  "resolutionNote": "Nội dung không vi phạm",
  "resolvedBy": "demo_admin",
  "resolvedAt": "2026-11-19T00:00:00",
  "createdAt": "2026-11-19T00:00:00"
}
```

### URL báo cáo tương thích

Ba endpoint sau vẫn yêu cầu `ADMIN`. Loại báo cáo được xác định từ URL. `status` và `communityName` là tùy chọn. `page` mặc định 0 và `size` mặc định 20, nhận giá trị từ 1 đến 100. Thứ tự cố định `createdAt DESC, id DESC`.

### GET `/reports/posts`

```http
GET {{baseUrl}}/reports/posts?status=PENDING&communityName=demo_java&page=0&size=20
Authorization: Bearer {{accessToken}}
```

**Response HTTP 200**

```json
{
  "content": [
    {
      "id": 81,
      "targetType": "POST",
      "targetId": 27,
      "communityName": "demo_java",
      "reporterUsername": "demo_user",
      "reason": "SPAM",
      "description": "Nội dung lặp lại",
      "status": "PENDING",
      "action": null,
      "resolutionNote": null,
      "resolvedBy": null,
      "resolvedAt": null,
      "createdAt": "2026-11-19T00:00:00"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1,
  "first": true,
  "last": true,
  "empty": false
}
```

### GET `/reports/comments`

```http
GET {{baseUrl}}/reports/comments?status=PENDING&communityName=demo_java&page=0&size=20
Authorization: Bearer {{accessToken}}
```

**Response HTTP 200**

```json
{
  "content": [
    {
      "id": 81,
      "targetType": "COMMENT",
      "targetId": 40,
      "communityName": "demo_java",
      "reporterUsername": "demo_user",
      "reason": "SPAM",
      "description": "Nội dung lặp lại",
      "status": "PENDING",
      "action": null,
      "resolutionNote": null,
      "resolvedBy": null,
      "resolvedAt": null,
      "createdAt": "2026-11-19T00:00:00"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1,
  "first": true,
  "last": true,
  "empty": false
}
```

### GET `/reports/communities`

```http
GET {{baseUrl}}/reports/communities?status=PENDING&communityName=demo_java&page=0&size=20
Authorization: Bearer {{accessToken}}
```

**Response HTTP 200**

```json
{
  "content": [
    {
      "id": 81,
      "targetType": "COMMUNITY",
      "targetId": 24,
      "communityName": "demo_java",
      "reporterUsername": "demo_user",
      "reason": "SPAM",
      "description": "Nội dung lặp lại",
      "status": "PENDING",
      "action": null,
      "resolutionNote": null,
      "resolvedBy": null,
      "resolvedAt": null,
      "createdAt": "2026-11-19T00:00:00"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1,
  "first": true,
  "last": true,
  "empty": false
}
```

## Quản lý danh mục

Tạo và sửa đều yêu cầu `name` và `slug` có nội dung, tối đa 100 ký tự mỗi trường. `slug` theo mẫu `[a-z0-9]+(?:-[a-z0-9]+)*`.

### GET `/admin/categories`

```http
GET {{baseUrl}}/admin/categories
Authorization: Bearer {{accessToken}}
```

**Response HTTP 200**

```json
[
  {
    "id": 33,
    "name": "Lập trình",
    "slug": "lap-trinh"
  }
]
```

### POST `/admin/categories`

```http
POST {{baseUrl}}/admin/categories
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "name": "Lập trình",
  "slug": "lap-trinh"
}
```

**Response HTTP 201**

```json
{
  "id": 33,
  "name": "Lập trình",
  "slug": "lap-trinh"
}
```

### PATCH `/admin/categories/33`

```http
PATCH {{baseUrl}}/admin/categories/33
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "name": "Công nghệ",
  "slug": "cong-nghe"
}
```

**Response HTTP 200**

```json
{
  "id": 33,
  "name": "Công nghệ",
  "slug": "cong-nghe"
}
```

### DELETE `/admin/categories/33`

```http
DELETE {{baseUrl}}/admin/categories/33
Authorization: Bearer {{accessToken}}
```

**Response HTTP 204**

Body rỗng.

## Nhật ký hoạt động

Các bộ lọc tùy chọn gồm `actorUserId` (số nguyên dương), `action` (tối đa 80 ký tự) và `targetType` (tối đa 40 ký tự). Các bộ lọc có giá trị được kết hợp bằng `AND`. Ví dụ, `DELETE_POST` đi với `POST`, còn `RESOLVE_REPORT` có thể đi với `POST_REPORT`, `COMMENT_REPORT` hoặc `COMMUNITY_REPORT`.

### GET `/admin/activity-logs`

```http
GET {{baseUrl}}/admin/activity-logs?actorUserId=9&action=DELETE_POST&targetType=POST&page=0&size=10
Authorization: Bearer {{accessToken}}
```

**Response HTTP 200**

```json
{
  "content": [
    {
      "id": 44,
      "actorUserId": 9,
      "actorUsername": "demo_admin",
      "action": "DELETE_POST",
      "targetType": "POST",
      "targetId": 27,
      "note": null,
      "createdAt": "2026-11-19T00:00:00"
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 1,
  "totalPages": 1,
  "first": true,
  "last": true,
  "empty": false
}
```
