# Thiết kế giao diện Discuss

Discuss là mạng xã hội thảo luận theo cộng đồng. Giao diện dùng nền trung tính, đường phân cách mảnh và màu nhấn mặc định là cam để làm nổi bật hành động chính. Bài viết và thảo luận nằm ở cột nội dung. Thông tin như nội quy, thống kê và hồ sơ tác giả xuất hiện ở vùng phù hợp với từng màn hình.

## Bố cục ứng dụng

| Khu vực | Cách tổ chức | Mã nguồn |
| --- | --- | --- |
| Giao diện người dùng | Thanh đầu trang, điều hướng bên trái trên desktop và thanh điều hướng mobile. Màn hình con hiển thị trong vùng nội dung chính. | [AppLayout](frontend/src/layouts/AppLayout.tsx), [MobileNavigation](frontend/src/components/layout/MobileNavigation.tsx) |
| Xác thực | Trên desktop, phần minh họa cộng đồng và phần biểu mẫu nằm cạnh nhau. Phần biểu mẫu dùng chung bố cục cho đăng nhập, đăng ký, xác minh email và khôi phục mật khẩu. | [AuthLayout](frontend/src/layouts/AuthLayout.tsx), [auth.css](frontend/src/auth.css) |
| Cài đặt | Điều hướng theo nhóm cài đặt. Các tùy chọn được trình bày thành từng hàng với nhãn, mô tả và điều khiển tương ứng. | [SettingsLayout](frontend/src/layouts/SettingsLayout.tsx), [các trang cài đặt](frontend/src/pages/settings/) |
| Quản trị | Bố cục riêng cho tổng quan, danh sách quản lý và xử lý báo cáo. Các trang dùng bảng, bộ lọc, nhãn trạng thái và hành động theo từng bản ghi. | [Thiết kế khu vực quản trị](frontend/ADMIN_UI.md), [AdminLayout](frontend/src/layouts/AdminLayout.jsx), [admin.css](frontend/src/layouts/admin.css) |

### Thích ứng theo kích thước màn hình

- Thanh đầu trang cao 64 px. Sidebar trái rộng 248 px khi mở và 72 px khi thu gọn. Cột thông tin rộng 300 px và cách nội dung chính 24 px. Từ 1600 px, cột thông tin rộng 320 px. Khung nội dung căn giữa có giới hạn 1164 px. Khám phá, Cộng đồng của tôi và Tìm kiếm dùng giới hạn 1320 px.
- Ở 1100 px trở xuống, feed, chi tiết bài viết, hồ sơ và cộng đồng xếp thành một cột rộng tối đa 820 px. Phần thông tin phụ nằm dưới nội dung chính. Từ 1023 px trở xuống, sidebar trái được ẩn. Ở 767 px trở xuống, các hàng cài đặt và tiêu đề hồ sơ được bố trí lại cho màn hình nhỏ.
- Danh sách cộng đồng dùng container query. Lưới chuyển từ một cột sang hai, ba hoặc bốn cột khi vùng chứa đạt 640, 1000 hoặc 1360 px.

## Thiết kế theo màn hình

| Màn hình | Cấu trúc và tương tác hiện có |
| --- | --- |
| Trang chủ | Feed dùng các thẻ bài viết theo chiều dọc. Mỗi thẻ có thông tin cộng đồng và tác giả, tiêu đề, phần xem trước và các thao tác tương tác. |
| Khám phá và Cộng đồng của tôi | Dùng bố cục danh sách cộng đồng với avatar, tên và thông tin ngắn. Phần khám phá có lọc theo danh mục và sắp xếp. |
| Chi tiết cộng đồng | Ảnh bìa và avatar định danh cộng đồng. Hành động thành viên nằm gần tiêu đề. Giới thiệu, nội quy và người điều hành nằm ở cột phụ khi đủ chỗ. Cộng đồng và hồ sơ dùng cùng khung ảnh bìa, tối đa 168 px trên desktop và 112 px ở 767 px trở xuống. |
| Hồ sơ cá nhân | Ảnh bìa, avatar, tên hiển thị và tên người dùng tạo thành phần đầu trang. Bên dưới là các tab hoạt động và mục **Giới thiệu**. Tiểu sử đọc được theo nhiều dòng. Điểm và hạng uy tín nằm chung trong một nhóm. Các trường như ngày tham gia, giới tính, địa điểm và ngày sinh hiện theo dữ liệu có sẵn. Email chỉ hiện cho chủ hồ sơ. Khách xem thấy địa điểm và ngày sinh theo quyền riêng tư. |
| Bài viết và bình luận | Trang chi tiết dùng cùng khung đọc với bảng tin. Thẻ bài viết lần lượt hiển thị nguồn bài, tiêu đề, nội dung và nhóm thao tác. Bình luận dùng đường kẻ ở hai mức lồng đầu tiên. Ảnh đơn và ảnh Markdown trên bảng tin có giới hạn 420 px hoặc 54% chiều cao viewport nhỏ, lấy giá trị thấp hơn. Lưới xem trước hiển thị tối đa bốn ảnh và số ảnh còn lại. Lightbox mở toàn bộ ảnh, hỗ trợ phím mũi tên, Escape và thông báo trạng thái tải. |
| Tạo bài viết | Trình soạn bài dùng modal chung. Nhóm nút Hủy và Đăng bài nằm ở mép dưới vùng cuộn và có thể xuống hàng khi chật chỗ. |
| Thông báo | Thanh đầu trang có chỉ báo thông báo, bảng thông báo nhanh và đường dẫn đến trang danh sách. Trạng thái đã đọc và chưa đọc được phân biệt trong danh sách. |
| Giao diện và hồ sơ trong Cài đặt | Tùy chọn giao diện gồm chủ đề, màu nhấn, cỡ chữ, mật độ và chuyển động. Trang chỉnh sửa hồ sơ cung cấp các trường thông tin cá nhân và luồng cập nhật ảnh. |

## Design tokens

CSS custom properties trong [index.css](frontend/src/index.css) định nghĩa màu, kiểu chữ, khoảng cách, bo góc và thời lượng chuyển động. [social.css](frontend/src/social.css) dùng các biến này cho bố cục và các mẫu giao diện chung.

| Nhóm | Token chính | Giá trị và cách dùng |
| --- | --- | --- |
| Nền và viền | `--bg-main`, `--bg-surface`, `--bg-elevated`, `--bg-hover`, `--border-color` | Nền chính là `#FFFFFF` ở chế độ sáng và `#151719` ở chế độ tối. Token bề mặt và hover phân cấp vùng nội dung, lớp nổi và trạng thái rê chuột. |
| Văn bản | `--text-primary`, `--text-secondary`, `--text-muted` | Lần lượt dùng cho nội dung chính, nội dung phụ và siêu dữ liệu. |
| Màu nhấn | `--action-bg`, `--action-hover`, `--action-ink`, `--color-orange-ink`, `--color-orange-soft` | Preset mặc định dùng `#F97316` làm màu chính. Nút nền màu chọn chữ sáng hoặc tối theo độ tương phản. Chữ màu nhấn trong chế độ tối pha 40% trắng để đọc rõ trên nền tối. Vùng quản trị dùng chung màu nhấn. |
| Trạng thái | `--color-success`, `--color-warning`, `--color-danger`, `--color-info` | Dùng cho trạng thái thành công, cảnh báo, lỗi hoặc hành động nguy hiểm và thông tin. |
| Kiểu chữ | `--font-family-ui`, `--font-size-caption`, `--font-size-body`, `--font-size-lead`, `--font-size-title` | Nunito Sans với font hệ thống dự phòng. Các cỡ chữ tương ứng là 0.8125, 0.9375, 1.125 và 1.5 rem. |
| Khoảng cách | `--space-1` đến `--space-16` | Các mốc có khai báo trải từ 0.25 đến 4 rem. Bố cục nhiều cột dùng thêm `--layout-gap` và `--layout-gutter`. |
| Bo góc | `--radius-sm`, `--radius-control`, `--radius-card`, `--radius-panel`, `--radius-full` | Bốn mốc đầu lần lượt là 0.5 rem, 0.625 rem, 0.75 rem và 1 rem. `--radius-full` dùng 9999 px cho dạng viên thuốc hoặc hình tròn. |
| Độ nổi | `--surface-shadow` | Dùng cho hộp thoại và bảng nổi như menu tài khoản. Bảng tin dùng đường phân cách giữa các bài. |
| Chuyển động | `--duration-fast`, `--duration-normal`, `--ease-spring` | Hai thời lượng CSS là 120 ms và 180 ms. Một số tương tác như chỉ báo tab dùng thêm Framer Motion. |

[useSettingsStore](frontend/src/store/useSettingsStore.ts) áp dụng lớp giao diện lên phần tử gốc và cập nhật biến CSS của màu nhấn. Chế độ **Hệ thống** lấy chủ đề theo `prefers-color-scheme`. CSS và các thành phần có chuyển động dùng `prefers-reduced-motion` hoặc tùy chọn giảm chuyển động của Discuss.

## Thành phần dùng chung

| Nhu cầu | Thành phần |
| --- | --- |
| Hành động chính, phụ hoặc nguy hiểm | [Button](frontend/src/components/ui/Button.tsx) có các biến thể `primary`, `secondary`, `outline`, `ghost`, `danger`, ba kích thước và trạng thái đang xử lý. |
| Biểu mẫu | [Input](frontend/src/components/ui/Input.tsx) gắn nhãn và liên kết thông báo lỗi hoặc hướng dẫn với trường nhập. Điều khiển tiêu chuẩn cao từ 40 px. |
| Hộp thoại và xác nhận | [Modal](frontend/src/components/ui/Modal.tsx) và [ConfirmDialog](frontend/src/components/ui/ConfirmDialog.tsx) gắn tiêu đề và mô tả với hộp thoại, giữ tiêu điểm bàn phím trong hộp thoại và trả về điều khiển mở khi đóng. |
| Phản hồi ngắn | [ToastContainer](frontend/src/components/ui/ToastContainer.tsx) dùng cho thông báo kết quả thao tác. |
| Chuyển mục trong cùng màn hình | [EditorialTabs](frontend/src/components/ui/EditorialTabs.tsx) hiển thị mục đang chọn bằng đường chỉ báo và `aria-pressed`. |
| Nhận diện hồ sơ và cộng đồng | [Avatar](frontend/src/components/ui/Avatar.tsx), [EntityBanner](frontend/src/components/ui/EntityBanner.tsx), [EntityImageActions](frontend/src/components/ui/EntityImageActions.tsx) và [Badge](frontend/src/components/ui/Badge.tsx). |
| Nội dung bài viết | [PostCardView](frontend/src/components/post/PostCardView.tsx), [PostBody](frontend/src/components/post/PostBody.tsx), [PostMarkdown](frontend/src/components/post/PostMarkdown.tsx) và [ImageLightbox](frontend/src/components/post/ImageLightbox.tsx). |

## Khi thêm hoặc chỉnh sửa giao diện

1. Chọn bố cục phù hợp với luồng người dùng, xác thực, cài đặt hoặc quản trị. Cấu hình tuyến đường nằm trong [routes](frontend/src/routes/).
2. Dùng thành phần chung cho nút, trường nhập, hộp thoại và tab. Dùng token theo vai trò giao diện để màn hình tự thích ứng với chủ đề và màu nhấn đã chọn.
3. Đặt kiểu dùng xuyên trang trong `social.css`. Đặt kiểu riêng gần tính năng, theo các mẫu như [postContent.css](frontend/src/components/post/postContent.css) và [searchResults.css](frontend/src/pages/search/searchResults.css).
4. Kiểm tra chế độ sáng và tối, màn hình nhỏ, nội dung tiếng Việt dài, thao tác bàn phím và nhãn cho nút chỉ có biểu tượng. Với màn hình lấy dữ liệu, kiểm tra cả trạng thái đang tải, trống và lỗi. Với hồ sơ, xem thử bằng tài khoản chủ hồ sơ và tài khoản khách để kiểm tra các trường riêng tư.
5. Dùng biểu tượng Lucide nhất quán. Ưu tiên 14–16 px cho biểu tượng trong văn bản và 18–20 px trong thanh điều hướng. Biểu tượng trang trí dùng `aria-hidden`. Nút chỉ có biểu tượng cần tên có thể đọc bằng trình đọc màn hình.
6. Dùng thông báo tải trong vùng đang chờ dữ liệu. Trạng thái trống nói rõ nội dung còn thiếu và đặt hành động kế tiếp khi phù hợp. Trạng thái lỗi dùng thông báo tiếng Việt và nút thử lại nếu màn hình có luồng tải lại.

Hướng dẫn chạy frontend có trong [README của frontend](frontend/README.md).
