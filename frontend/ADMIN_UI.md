# DISCUSS Admin UI

## Phạm vi bàn giao

Giao diện gồm bảy màn hình, dùng chung khung Admin, bảng dữ liệu, bộ lọc,
phân trang, menu thao tác, ngăn chi tiết và hộp xác nhận. Giữ React/Vite,
Nunito Sans, Zustand, React Router, cơ chế theme và API client có cookie/refresh token.
Không thay đổi backend hoặc hợp đồng API.

| Đường dẫn | Chức năng có thể dùng |
| --- | --- |
| `/admin` | Tổng số người dùng/cộng đồng/bài viết/bình luận, trạng thái tài khoản/cộng đồng, số báo cáo chờ xử lý/đã giải quyết, lối tắt quản lý |
| `/admin/users` | Tìm username/email, lọc ACTIVE/SUSPENDED, sắp xếp, phân trang, xem thông tin và hồ sơ công khai |
| `/admin/communities` | Xem và tìm trong danh sách cộng đồng ACTIVE, xem chi tiết/chủ sở hữu/quyền riêng tư |
| `/admin/posts` | Bài đã đăng trong phạm vi được phép xem, tìm tiêu đề/nội dung, lọc cộng đồng, xem Markdown/ảnh/code, xóa mềm có xác nhận |
| `/admin/comments` | Chọn/tìm bài viết, xem bình luận trong bài, lọc nội dung/tác giả, phân trang phía client, xem đầy đủ và xóa mềm có xác nhận |
| `/admin/reports` | POST/COMMENT/COMMUNITY, lọc trạng thái/loại/cộng đồng, ghép và phân trang, xem nội dung, xóa bài viết/bình luận vi phạm |
| `/admin/categories` | Danh sách và tìm tên/slug, phân trang; có biểu mẫu tạo/sửa và xác nhận xóa nhưng chưa thể gửi |

## Tệp mới

- `src/components/admin/AdminHeader.tsx`: logo, theme, tài khoản, đăng xuất, về cộng đồng.
- `src/components/admin/AdminSidebar.tsx`: bảy mục theo nhóm, thu gọn, số báo cáo chờ xử lý.
- `src/components/admin/AdminDataContext.tsx`: thống kê dùng chung và tổng số báo cáo.
- `src/components/admin/AdminUI.tsx`: header, bảng, bộ lọc, tìm kiếm debounce, badge, phân trang, trạng thái tải/lỗi/rỗng, menu, avatar, ngăn chi tiết, xác nhận.
- `src/components/admin/AdminPreviews.tsx`: xem trước cộng đồng, bài viết, bình luận.
- `src/hooks/useAdminQuery.ts`: đồng bộ bộ lọc/phân trang với URL.
- `src/hooks/useAdminResource.ts`: tải dữ liệu, thử lại, ngăn kết quả cũ ghi đè sau khi đổi bộ lọc.
- `src/services/adminModeration.ts`: adapter API, ghép báo cáo, capability và ranh giới tích hợp còn thiếu.
- `src/pages/admin/PostManagementPage.tsx`.
- `src/pages/admin/CommentManagementPage.tsx`.
- `src/pages/admin/CategoryManagementPage.tsx`.
- `src/layouts/admin.css`: token và giao diện riêng cho Admin, hỗ trợ light/dark/responsive.
- `ADMIN_UI.md`: tài liệu này.

## Tệp chỉnh sửa / tái sử dụng

- `src/layouts/AdminLayout.tsx`: ghép header/sidebar/provider, giữ kiểm tra đăng nhập và ADMIN trước khi tải API quản trị.
- `src/pages/admin/AdminDashboardPage.tsx`: thống kê thật và tổng quan kiểm duyệt.
- `src/pages/admin/UserManagementPage.tsx`: bảng và ngăn hồ sơ dùng chung.
- `src/pages/admin/CommunityManagementPage.tsx`: danh sách đúng phạm vi và ngăn chi tiết.
- `src/pages/admin/ReportManagementPage.tsx`: không gian xem xét báo cáo.
- `src/routes/index.tsx`: bổ sung routes bài viết/bình luận/danh mục.
- `src/components/ui/Modal.tsx`: thêm placement bên phải; bàn phím nhường cho native image dialog khi đang mở. Mặc định vẫn là modal giữa màn hình.
- `src/services/index.ts`: tái sử dụng thống kê/người dùng/phần hồ sơ từ triển khai trước, postService.delete và commentService.delete. Các cờ quản lý chưa có API vẫn tắt.
- Bộ hiển thị `PostBody`, `PostMarkdown`, `ImageLightbox` và toast/theme hiện có được tái sử dụng.

## API đã nối

| API | Cách sử dụng |
| --- | --- |
| `GET /admin/stats` | Đọc lớp bọc `data`, không tạo số liệu tăng trưởng giả |
| `GET /admin/users` | `page`, `size`, `sort`, `status`; page từ 0 |
| `GET /admin/users/search` | `search` và các tham số phân trang/trạng thái |
| `GET /user/{name}` | Qua `userService.getPublicProfile`; tôn trọng thông tin công khai backend trả về |
| `GET /explore` | Đọc các trang cộng đồng ACTIVE; tìm kiếm client sau khi đã có đầy đủ các trang của phạm vi này |
| `GET /communities/{name}` | Chi tiết cộng đồng và chủ sở hữu |
| `GET /posts` | `tab=latest`, `q`, `page`, `size`; chỉ dữ liệu được phép xem theo backend |
| `GET /communities/{name}/posts` | Lọc cộng đồng; nếu thêm từ khóa thì lọc toàn bộ các trang trong cộng đồng, không lọc riêng một trang |
| `GET /posts/{id}` | Nội dung xem trước thật |
| `GET /posts/{postId}/comments` | Danh sách phẳng; tìm kiếm và chia trang client trong bài viết |
| `DELETE /posts/{id}` | Xóa mềm theo backend, có xác nhận/chống gửi lặp/hiển thị lỗi |
| `DELETE /comments/{id}` | Xóa mềm và thay nội dung bằng `[deleted]` theo backend |
| `GET /reports/posts` | Báo cáo bài viết |
| `GET /reports/comments` | Báo cáo bình luận |
| `GET /reports/communities` | Báo cáo cộng đồng |
| `GET /categories` | Danh mục thật; không giả số lượng cộng đồng |

Tổng số báo cáo trên sidebar/overview lấy `totalElements` của từng loại với
`size=1`, theo trạng thái PENDING/RESOLVED. Danh sách tất cả loại ghép các nguồn
theo `createdAt DESC`, `id DESC`, loại; khóa hàng gồm cả loại và ID vì các bảng
báo cáo có thể trùng ID. Đọc tiền tố đủ dài của từng nguồn để chia trang toàn cục,
không tải toàn bộ lịch sử báo cáo cho mỗi trang.

## API / tích hợp còn thiếu

Không đặt URL mới dự đoán và không trả thành công giả cho các phần này:

- Khóa/mở khóa tài khoản, đổi vai trò, lọc người dùng theo vai trò.
- Danh sách cộng đồng mọi trạng thái và cấm/mở lại cộng đồng.
- Danh sách bài viết toàn hệ thống bao gồm trạng thái ẩn/đã xóa/nội dung riêng tư.
- Danh sách bình luận toàn hệ thống, tra một bình luận theo ID độc lập với bài viết.
- Cập nhật báo cáo thành RESOLVED/REJECTED, lọc ngày báo cáo.
- Nhật ký hoạt động kiểm duyệt.
- Tạo/sửa/xóa danh mục, quy tắc chỉnh sửa slug/ràng buộc xóa, số cộng đồng theo danh mục.

Các thao tác chưa có tích hợp nằm trong `adminMutations` và được bảo vệ bằng
`adminCapabilities`. Giao diện có thể mở biểu mẫu/xác nhận để thấy rõ dự kiến,
nhưng nút gửi bị khóa. Chỉ bật capability sau khi đã nối API thật và xác nhận
kiểm tra quyền phía backend; đổi cờ đơn thuần không làm thao tác hoạt động.
Không tự khóa hoặc đổi quyền tài khoản đang đăng nhập.

Báo cáo bình luận không chứa postId trong DTO hiện tại. Ngăn báo cáo yêu cầu
ID bài viết gốc, tải bình luận của bài đó và đối chiếu đúng targetId trước khi
hiển thị nội dung/xóa. Không đoán bài viết gốc. Xóa nội dung không tự chuyển
trạng thái báo cáo thành đã giải quyết.

## Thiết kế và kiểm tra

- Taste direction: Framed sheet, seed `1961064246`, giữ palette/type của DISCUSS.
  Theo yêu cầu, header có đường viền, metric có icon nhỏ không nền, sheet radius 10px,
  active navigation dùng cam nhạt. Không biểu đồ hoặc tăng trưởng giả.
- Build production và kiểm tra TypeScript có mục tiêu: đạt.
- 25 kiểm tra tương tác trình duyệt và 4 kiểm tra bổ sung: đạt với dữ liệu kiểm tra riêng.
  Bao gồm phân quyền, xóa/hủy/lỗi 403/chống gửi lặp, các trang quản lý, báo cáo ghép,
  phân trang qua mốc 100 bản ghi/nguồn, dữ liệu 0, phản hồi cũ và xem ảnh lồng trong drawer.
- Đã chụp/kiểm tra 1440px, 768px, 390px; sáng/tối; drawer/modal; loading/empty/error.
  Các trang không có FAIL của inspector sau sửa. Cảnh báo khoảng trống còn lại ở
  danh sách danh mục ít dữ liệu và cuối danh sách chọn năm bài gần đây được giữ có chủ ý;
  không tạo hàng hoặc nội dung giả để lấp đầy canvas. Overview cho phép `no-data-hue`
  vì icon Lucide bị nhận nhầm là biểu đồ, trong khi màn hình chỉ chứa số liệu.
- Source lint không có FAIL. Cảnh báo shadow chỉ thuộc menu nổi; dấu gạch ngang
  biểu thị trường chưa có dữ liệu.
- Backend không phản hồi tại localhost:8080 ở thời điểm kiểm tra; chưa có kiểm thử
  end-to-end với phiên backend thật. Fixture và ảnh kiểm tra nằm trong `.taste-skill/`
  đã được gitignore, không nhập vào mã production và không thay đổi dữ liệu thật.
- Vite vẫn báo chunk chính trên 500kB; không đổi thư viện/routing của toàn ứng dụng.

## Giới hạn vận hành

Tìm cộng đồng và tìm trong một cộng đồng kèm từ khóa cần đọc đủ các trang của
phạm vi đó vì backend chưa có truy vấn quản trị tương ứng. Với lượng dữ liệu lớn,
nên bổ sung bộ lọc/phân trang server cho các phạm vi này trước khi mở rộng vận hành.
Frontend không mở rộng quyền truy cập nội dung riêng tư và không thay thế kiểm tra
quyền phía backend. Các bộ lọc chưa được hỗ trợ không được gửi như thể đã có hiệu lực.
