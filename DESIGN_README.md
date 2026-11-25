# Thiết kế giao diện Discuss

Discuss là mạng xã hội thảo luận theo cộng đồng. Giao diện dùng nền trung tính, đường phân cách mảnh và màu nhấn mặc định là cam để làm nổi bật hành động chính. Bài viết và thảo luận nằm ở cột nội dung. Thông tin như nội quy, thống kê và hồ sơ tác giả xuất hiện ở vùng phù hợp với từng màn hình.

## Bố cục ứng dụng

| Khu vực | Cách tổ chức | Mã nguồn |
| --- | --- | --- |
| Giao diện người dùng | Thanh đầu trang, điều hướng bên trái trên desktop và thanh điều hướng mobile. Màn hình con hiển thị trong vùng nội dung chính. | [AppLayout](frontend/src/layouts/AppLayout.tsx), [MobileNavigation](frontend/src/components/layout/MobileNavigation.tsx) |
| Xác thực | Trên desktop, phần minh họa cộng đồng và phần biểu mẫu nằm cạnh nhau. Phần biểu mẫu dùng chung bố cục cho đăng nhập, đăng ký, xác minh email và khôi phục mật khẩu. | [AuthLayout](frontend/src/layouts/AuthLayout.tsx), [auth.css](frontend/src/auth.css) |
| Cài đặt | Điều hướng theo nhóm cài đặt. Các tùy chọn được trình bày thành từng hàng với nhãn, mô tả và điều khiển tương ứng. | [SettingsLayout](frontend/src/layouts/SettingsLayout.tsx), [các trang cài đặt](frontend/src/pages/settings/) |
| Quản trị | Bố cục riêng cho tổng quan, danh sách quản lý và xử lý báo cáo. Các trang dùng bảng, bộ lọc, nhãn trạng thái và hành động theo từng bản ghi. | [AdminLayout](frontend/src/layouts/AdminLayout.jsx), [admin.css](frontend/src/layouts/admin.css) |

### Thích ứng theo kích thước màn hình

- Bố cục chung khai báo sidebar trái rộng 248 px, cột thông tin rộng 300 px và khoảng cách giữa các cột là 24 px. Từ 1600 px, cột thông tin tăng lên 320 px.
- Ở 1100 px trở xuống, feed và trang cộng đồng chuyển về một cột, còn phần **Giới thiệu** trên hồ sơ xếp dưới phần hoạt động. Từ 1023 px trở xuống, sidebar trái được ẩn. Ở 767 px trở xuống, các hàng cài đặt và tiêu đề hồ sơ được bố trí lại cho màn hình nhỏ.
- Danh sách cộng đồng dùng container query. Lưới chuyển từ một cột sang hai, ba hoặc bốn cột khi vùng chứa đạt 640, 1000 hoặc 1360 px.

## Thiết kế theo màn hình

| Màn hình | Cấu trúc và tương tác hiện có |
| --- | --- |
| Trang chủ | Feed dùng các thẻ bài viết theo chiều dọc. Mỗi thẻ có thông tin cộng đồng và tác giả, tiêu đề, phần xem trước và các thao tác tương tác. |
| Khám phá và Cộng đồng của tôi | Dùng bố cục danh sách cộng đồng với avatar, tên và thông tin ngắn. Phần khám phá có lọc theo danh mục và sắp xếp. |
| Chi tiết cộng đồng | Ảnh bìa và avatar định danh cộng đồng. Hành động thành viên nằm gần tiêu đề. Bài viết nằm ở vùng chính, còn giới thiệu, nội quy và thông tin cộng đồng nằm ở cột phụ khi đủ chỗ. |
| Hồ sơ cá nhân | Ảnh bìa, avatar, tên hiển thị và tên người dùng tạo thành phần đầu trang. Bên dưới là các tab hoạt động và mục **Giới thiệu**. Mục này hiển thị ngày tham gia, tiểu sử, giới tính, địa điểm, ngày sinh và uy tín theo dữ liệu có sẵn. Email chỉ hiện cho chủ hồ sơ. Khách xem thấy địa điểm và ngày sinh theo quyền riêng tư. Chủ hồ sơ có thể mở cài đặt để bổ sung tiểu sử. |
| Bài viết và bình luận | Trang chi tiết mở rộng nội dung bài viết và đặt phần bình luận bên dưới. Nội dung Markdown, khối mã và ảnh có thành phần hiển thị riêng. Ảnh có thể mở trong lightbox. |
| Tạo bài viết | Trình soạn bài mở dưới dạng modal dùng chung trong giao diện chính. Người dùng chọn cộng đồng, nhập nội dung và đính kèm theo loại bài viết. |
| Thông báo | Thanh đầu trang có chỉ báo thông báo, bảng thông báo nhanh và đường dẫn đến trang danh sách. Trạng thái đã đọc và chưa đọc được phân biệt trong danh sách. |
| Giao diện và hồ sơ trong Cài đặt | Tùy chọn giao diện gồm chủ đề, màu nhấn, cỡ chữ, mật độ và chuyển động. Trang chỉnh sửa hồ sơ cung cấp các trường thông tin cá nhân và luồng cập nhật ảnh. |

## Design tokens

CSS custom properties trong [index.css](frontend/src/index.css) định nghĩa màu, kiểu chữ, khoảng cách, bo góc và thời lượng chuyển động. [social.css](frontend/src/social.css) dùng các biến này cho bố cục và các mẫu giao diện chung.

| Nhóm | Token chính | Giá trị và cách dùng |
| --- | --- | --- |
| Nền và viền | `--bg-main`, `--bg-surface`, `--bg-elevated`, `--bg-hover`, `--border-color` | Nền chính là `#FFFFFF` ở chế độ sáng và `#151719` ở chế độ tối. Token bề mặt và hover phân cấp vùng nội dung, lớp nổi và trạng thái rê chuột. |
| Văn bản | `--text-primary`, `--text-secondary`, `--text-muted` | Lần lượt dùng cho nội dung chính, nội dung phụ và siêu dữ liệu. |
| Màu nhấn | `--action-bg`, `--action-hover`, `--action-ink`, `--color-orange-ink`, `--color-orange-soft` | CSS khai báo màu cam cơ sở `#F97316` cho chủ đề sáng và `#FB923C` cho chủ đề tối. Khi ứng dụng áp dụng tùy chọn giao diện, preset đã chọn ghi đè các biến màu nhấn. Preset mặc định dùng `#F97316` làm màu chính. |
| Trạng thái | `--color-success`, `--color-warning`, `--color-danger`, `--color-info` | Dùng cho trạng thái thành công, cảnh báo, lỗi hoặc hành động nguy hiểm và thông tin. |
| Kiểu chữ | `--font-family-ui`, `--font-size-caption`, `--font-size-body`, `--font-size-lead`, `--font-size-title` | Nunito Sans với font hệ thống dự phòng. Các cỡ chữ tương ứng là 0.8125, 0.9375, 1.125 và 1.5 rem. |
| Khoảng cách | `--space-1` đến `--space-16` | Các mốc có khai báo trải từ 0.25 đến 4 rem. Bố cục nhiều cột dùng thêm `--layout-gap` và `--layout-gutter`. |
| Bo góc | `--radius-sm`, `--radius-control`, `--radius-card`, `--radius-panel`, `--radius-full` | Bốn mốc đầu lần lượt là 0.5 rem, 0.625 rem, 0.875 rem và 1 rem. `--radius-full` dùng 9999 px cho dạng viên thuốc hoặc hình tròn. |
| Chuyển động | `--duration-fast`, `--duration-normal`, `--ease-spring` | Hai thời lượng CSS là 120 ms và 180 ms. Một số tương tác như chỉ báo tab dùng thêm Framer Motion. |

[useSettingsStore](frontend/src/store/useSettingsStore.ts) áp dụng lớp giao diện lên phần tử gốc và cập nhật biến CSS của màu nhấn. Chế độ **Hệ thống** lấy chủ đề theo `prefers-color-scheme`. CSS và các thành phần có chuyển động dùng `prefers-reduced-motion` hoặc tùy chọn giảm chuyển động của Discuss.

## Thành phần dùng chung

| Nhu cầu | Thành phần |
| --- | --- |
| Hành động chính, phụ hoặc nguy hiểm | [Button](frontend/src/components/ui/Button.tsx) có các biến thể `primary`, `secondary`, `outline`, `ghost`, `danger`, ba kích thước và trạng thái đang xử lý. |
| Biểu mẫu | [Input](frontend/src/components/ui/Input.tsx) cho trường nhập dùng chung. |
| Hộp thoại và xác nhận | [Modal](frontend/src/components/ui/Modal.tsx) và [ConfirmDialog](frontend/src/components/ui/ConfirmDialog.tsx). |
| Phản hồi ngắn | [ToastContainer](frontend/src/components/ui/ToastContainer.tsx) dùng cho thông báo kết quả thao tác. |
| Chuyển mục trong cùng màn hình | [EditorialTabs](frontend/src/components/ui/EditorialTabs.tsx) hiển thị mục đang chọn bằng đường chỉ báo và `aria-pressed`. |
| Nhận diện hồ sơ và cộng đồng | [Avatar](frontend/src/components/ui/Avatar.tsx), [EntityBanner](frontend/src/components/ui/EntityBanner.tsx), [EntityImageActions](frontend/src/components/ui/EntityImageActions.tsx) và [Badge](frontend/src/components/ui/Badge.tsx). |
| Nội dung bài viết | [PostCardView](frontend/src/components/post/PostCardView.tsx), [PostBody](frontend/src/components/post/PostBody.tsx), [PostMarkdown](frontend/src/components/post/PostMarkdown.tsx) và [ImageLightbox](frontend/src/components/post/ImageLightbox.tsx). |

## Khi thêm hoặc chỉnh sửa giao diện

1. Chọn bố cục phù hợp với luồng người dùng, xác thực, cài đặt hoặc quản trị. Cấu hình tuyến đường nằm trong [routes](frontend/src/routes/).
2. Dùng thành phần chung cho nút, trường nhập, hộp thoại và tab. Dùng token theo vai trò giao diện để màn hình tự thích ứng với chủ đề và màu nhấn đã chọn.
3. Đặt kiểu dùng xuyên trang trong `social.css`. Đặt kiểu riêng gần tính năng, theo các mẫu như [postContent.css](frontend/src/components/post/postContent.css) và [searchResults.css](frontend/src/pages/search/searchResults.css).
4. Kiểm tra chế độ sáng và tối, màn hình nhỏ, nội dung tiếng Việt dài, thao tác bàn phím và nhãn cho nút chỉ có biểu tượng. Với màn hình lấy dữ liệu, kiểm tra cả trạng thái đang tải, trống và lỗi. Với hồ sơ, xem thử bằng tài khoản chủ hồ sơ và tài khoản khách để kiểm tra các trường riêng tư.

Hướng dẫn chạy frontend có trong [README của frontend](frontend/README.md).
