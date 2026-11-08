# Mẫu exception cho Post

Theo cấu trúc Community/Auth/Media đang có trong dự án:

- PostErrorCode: khai báo tên lỗi, HTTP status và thông báo mặc định.
- PostException: mang mã lỗi; hỗ trợ thông báo riêng và nguyên nhân gốc.
- GlobalExceptionHandler.handlePostException: ghi log và trả response thống nhất.
- PostService/PostMarkdown: chỉ throw theo mã lỗi, không tự ghép status/message.
- ImageService: dùng MediaException/MediaErrorCode hiện có cho lỗi ảnh.

## Các mẫu sử dụng

### Dùng thông báo mặc định

```java
throw new PostException(PostErrorCode.POST_NOT_FOUND);
```

### Ghi đè thông báo cho một tình huống

```java
throw new PostException(
        PostErrorCode.POST_EDIT_FORBIDDEN,
        "Bạn không có quyền sửa bài viết này"
);
```

### Giữ nguyên exception gốc để chẩn đoán

```java
throw new PostException(
        PostErrorCode.MARKDOWN_MEDIA_MISSING,
        "Ảnh trong nội dung chưa có trong danh sách media",
        cause
);
```

Chỉ truyền message phù hợp cho người dùng: message được trả về API. cause không được trả về response.

### Lỗi media dùng lại mẫu của Media

```java
throw new MediaException(MediaErrorCode.MEDIA_ACCESS_DENIED);
throw new MediaException(MediaErrorCode.INVALID_IMAGE);
```

## Các mã Post cơ bản

| Mã | HTTP |
| --- | --- |
| INVALID_MEDIA | 400 |
| EMPTY_POST | 400 |
| UNSUPPORTED_POST_TYPE | 400 |
| COMMUNITY_CHANGE_NOT_ALLOWED | 400 |
| DUPLICATE_MEDIA | 400 |
| MARKDOWN_MEDIA_MISSING | 400 |
| TOO_MANY_MEDIA | 400 |
| POST_EDIT_FORBIDDEN | 403 |
| POST_NOT_FOUND | 404 |
| UNSUPPORTED_MEDIA_TYPE | 415 |

Đổi status/message tại PostErrorCode để thay đổi hành vi cho tất cả nơi dùng mã đó.

## Thêm lỗi mới

1. Thêm hằng vào PostErrorCode, ví dụ:

```java
POST_ALREADY_DELETED(HttpStatus.CONFLICT, "Post has already been deleted")
```

2. Throw new PostException(PostErrorCode.POST_ALREADY_DELETED) tại điều kiện nghiệp vụ tương ứng.
3. GlobalExceptionHandler tự lấy status/message từ enum, không cần viết thêm handler.

Chỉ dùng mẫu trên khi điều kiện nghiệp vụ thực sự cần; mã ví dụ chưa được thêm vào luồng xóa hiện tại.

## Response

```json
{
  "status": 404,
  "message": "Post not found"
}
```

Giữ cùng định dạng với các module hiện có. Muốn đổi response hoặc thêm trường code, chỉnh trong GlobalExceptionHandler; chưa thêm field mới để tránh thay đổi contract hiện tại.

Validation field của @NotBlank/@Size/@NotNull vẫn đi qua handleValidation và trả errors theo tên field. Lỗi nghiệp vụ EMPTY_POST và UNSUPPORTED_POST_TYPE nằm tại service để bạn quản lý bằng enum. Lỗi xác thực và quyền thành viên Community vẫn theo module gốc.

LINK đã bị chặn trong create/update bằng UNSUPPORTED_POST_TYPE theo lựa chọn của bạn. Enum LINK được giữ để đọc dữ liệu cũ; frontend tạo bài chỉ gửi TEXT và không gửi linkUrl. Ảnh mới được gửi cùng request multipart khi đăng/sửa bài. Ảnh giữ lại phải thuộc chính bài đang sửa; VIDEO hiện trả UNSUPPORTED_MEDIA_TYPE.

## Các điểm tùy chỉnh

- Thông báo/status của Post: PostErrorCode.java.
- Thông báo/status của ảnh: MediaErrorCode.java.
- Định dạng response và log: GlobalExceptionHandler.java.
- Điều kiện phát sinh lỗi: PostService.java, PostMarkdown.java, ImageService.java.

Không catch lỗi nghiệp vụ rồi trả thành công hoặc để exception lộ stack trace ra JSON.

## Gửi bài cùng ảnh

`POST /posts` và `PATCH /posts/{id}` nhận multipart gồm:

- `post`: JSON (`application/json`) chứa communityName, title, type, content, media.
- `files`: các ảnh mới theo thứ tự upload.
- Media mới: `{"type":"IMAGE","objectKey":"local/uuid","fileIndex":0}`.
- Media giữ lại khi sửa: `{"type":"IMAGE","objectKey":"posts/123/existing.png"}`.

Markdown dùng `![Ảnh](post-image:local/uuid)` trong lúc soạn; server thay token bằng key đã lưu.
Key mới chỉ được tạo khi submit. Upload được dọn khi transaction thất bại; ảnh bị gỡ được xóa sau commit.
Endpoint JSON vẫn dùng được cho bài không có ảnh mới. Không còn endpoint upload ảnh nháp.
