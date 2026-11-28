# Thiết kế giao diện quản trị Discuss

Khu vực `/admin` phục vụ quản trị viên cần tra cứu, kiểm duyệt và theo dõi thao tác trên Discuss. Giao diện ưu tiên ba việc thường gặp: nhận biết mục cần xử lý, tìm đúng đối tượng và xác nhận trước khi thay đổi dữ liệu.

## Bố cục và nhận diện

| Vùng | Thiết kế hiện tại |
| --- | --- |
| Thanh đầu trang | Cao 64 px, đặt logo Discuss và tên khu vực ở trái. Đổi chủ đề, về cộng đồng và menu tài khoản nằm ở phải. |
| Điều hướng | Sidebar rộng 240 px, có thể thu gọn. Ba nhóm là Tổng quan, Quản lý và Kiểm duyệt. Mục đang mở dùng nền pha màu nhấn. Mục Báo cáo có số chờ xử lý khi số liệu đã tải. |
| Vùng nội dung | Dùng nền trung tính. Bảng, bộ lọc và biểu mẫu dùng bề mặt riêng với viền mảnh. Tiêu đề trang, mô tả ngắn và hành động chung nằm phía trên. |
| Màn hình nhỏ | Từ 1100 px trở xuống, sidebar mở dạng ngăn trượt và vùng chính chiếm toàn bộ chiều rộng. Từ 900 px trở xuống, lưới tổng quan còn hai cột. Từ 700 px trở xuống, các hàng bảng chuyển thành nhóm trường có nhãn. |

Admin dùng Nunito Sans và dùng chung chủ đề sáng/tối cùng màu nhấn của Discuss. Chủ đề sáng có nền `#F6F7F9`, sidebar trắng và đường viền `#E1E5EB`. Chủ đề tối dùng nền `#101416`, sidebar `#151C1F` và đường viền `#2C3437`. Màu cam mặc định `#F97316` dành cho hành động chính và trạng thái đang chọn. Trạng thái nghiệp vụ có màu và nhãn chữ riêng.

Xem [AdminLayout](src/layouts/AdminLayout.jsx), [AdminHeader](src/components/admin/AdminHeader.jsx), [AdminSidebar](src/components/admin/AdminSidebar.jsx), [admin.css](src/layouts/admin.css) và [quy tắc thiết kế chung](../DESIGN_README.md).

## Các màn hình

| Màn hình | Tuyến đường | Bố cục và thao tác |
| --- | --- | --- |
| Tổng quan hệ thống | `/admin` | Khối Kiểm duyệt nằm đầu trang với báo cáo chờ xử lý, báo cáo đã giải quyết, tài khoản bị khóa và cộng đồng bị cấm. Bên dưới là bốn ô tổng số người dùng, cộng đồng, bài viết và bình luận. Số đang hoạt động nằm dưới tổng người dùng và tổng cộng đồng. |
| Người dùng | `/admin/users` | Tìm theo tên người dùng hoặc email, lọc vai trò và trạng thái. Hồ sơ riêng tại `/admin/users/:userId` hiển thị ảnh, thông tin tài khoản, giới thiệu và hoạt động. Khóa hoặc mở khóa có xác nhận. |
| Cộng đồng | `/admin/communities` | Tìm theo tên, lọc trạng thái và quyền hiển thị. Hồ sơ tại `/admin/communities/:communityId` có thông tin cộng đồng và chủ sở hữu. |
| Bài viết | `/admin/posts` | Tìm nội dung, lọc trạng thái và cộng đồng. Trang `/admin/posts/:postId` hiển thị thông tin bài, tác giả, nội dung và tệp đính kèm. |
| Danh mục | `/admin/categories` | Bảng tên và slug. Tạo và sửa bằng biểu mẫu trong hộp thoại. Xóa có bước xác nhận. |
| Điểm uy tín | `/admin/reputation` | Biểu mẫu cấu hình ngưỡng Người đóng góp, Uy tín và Uy tín cao, có thông báo lỗi nhập liệu và phản hồi sau khi lưu. |
| Báo cáo | `/admin/reports` | Lọc loại đối tượng, trạng thái và cộng đồng. Trang `/admin/reports/:type/:reportId` hiển thị nội dung và các hành động xử lý báo cáo. |

Tuyến đường và giới hạn truy cập được khai báo trong [adminRoutes.jsx](src/routes/adminRoutes.jsx) và [AdminLayout](src/layouts/AdminLayout.jsx). Bố cục quản trị xuất hiện khi phiên đăng nhập có vai trò ADMIN.

## Thành phần và trạng thái dùng chung

| Thành phần | Quy tắc |
| --- | --- |
| Tiêu đề trang | Đặt tên màn hình và mô tả ngắn. Nút làm mới hoặc hành động cấp trang nằm cạnh tiêu đề. |
| Tìm kiếm và bộ lọc | Đặt trước bảng. Các trang dùng `useAdminQuery` lưu bộ lọc và trang hiện tại trong URL để có thể mở lại đúng danh sách. |
| Bảng dữ liệu | Header cao 44 px trên desktop. Canh số và thời gian nhất quán theo cột. Vùng bảng có thể nhận tiêu điểm bàn phím khi cần cuộn. Mật độ gọn giảm đệm các hàng. Trên mobile, các nút thao tác nằm cuối mỗi bản ghi. |
| Trang chi tiết | Mở trong vùng nội dung quản trị, hỗ trợ mở trực tiếp theo URL. Liên kết quay lại giữ bộ lọc và số trang của danh sách. |
| Hộp thoại xác nhận | Nêu rõ đối tượng và hành động sắp thực hiện. Hành động như xóa hoặc khóa được đánh dấu nguy hiểm. Trạng thái đang xử lý phản ánh tiến độ gửi yêu cầu. |
| Đang tải, trống và lỗi | Dùng skeleton khi đang tải. Trạng thái trống giải thích kết quả và cung cấp đặt lại bộ lọc ở màn hình có hỗ trợ. Trạng thái lỗi có thao tác thử lại. |

Mã dùng chung nằm trong [AdminUI.jsx](src/components/admin/AdminUI.jsx), [useAdminQuery](src/hooks/useAdminQuery.ts), [useAdminResource](src/hooks/useAdminResource.ts) và [Modal](src/components/ui/Modal.tsx).
