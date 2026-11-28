# Báo cáo chỉnh sửa giao diện Discuss

[Audit ban đầu](UI_REDESIGN_AUDIT.md) ghi các vấn đề và thứ tự ưu tiên. [Tài liệu thiết kế](DESIGN_README.md) mô tả các quy tắc hiện dùng trong mã nguồn.

## Thay đổi đã triển khai

| Khu vực | Trước | Sau | Mã nguồn |
| --- | --- | --- | --- |
| Khung đọc | Khung giao diện có thể giãn theo chiều ngang. Feed và chi tiết bài có nhiều khai báo chồng nhau. | Khung chính giới hạn 1164 px. Bảng tin, chi tiết bài, hồ sơ và cộng đồng dùng cùng quy tắc chia cột. Khám phá, cộng đồng của tôi và tìm kiếm có giới hạn riêng 1320 px. Cột thông tin chuyển xuống dưới ở 1100 px trở xuống. | [social.css](frontend/src/social.css), [HomePage](frontend/src/pages/home/HomePage.tsx), [PostDetailPage](frontend/src/pages/post/PostDetailPage.tsx) |
| Điều hướng và cài đặt | Ô tìm kiếm phóng nhẹ khi có tiêu điểm bàn phím. Một số trạng thái lựa chọn và bảng nổi dùng màu hoặc kích thước riêng. | Ô tìm kiếm giữ nguyên vị trí khi nhập. Menu tài khoản trả tiêu điểm về nút mở khi nhấn Escape. Thẻ lọc, tùy chọn giao diện và thông báo dùng token màu, cỡ chữ và bo góc nhất quán hơn. | [Navbar](frontend/src/components/layout/Navbar.tsx), [social.css](frontend/src/social.css), [searchResults.css](frontend/src/pages/search/searchResults.css), [notificationPanel.css](frontend/src/components/layout/notificationPanel.css) |
| Hồ sơ và cộng đồng | Ảnh bìa có tỉ lệ 8:1 và giới hạn 140 px trên desktop. Mục giới thiệu lặp tên người dùng và từng hiển thị số bài đã tải như tổng số bài. | Hồ sơ và cộng đồng dùng chung khung ảnh bìa tối đa 168 px trên desktop. Mục giới thiệu gom tiểu sử, điểm và hạng uy tín cùng thông tin cá nhân có dữ liệu. Email chỉ hiển thị cho chủ hồ sơ. Cài đặt cộng đồng dùng cùng thiết kế trường nhập và trạng thái lựa chọn. | [UserProfilePage](frontend/src/pages/profile/UserProfilePage.tsx), [social.css](frontend/src/social.css), [communitySettings.css](frontend/src/components/community/communitySettings.css) |
| Ảnh và bình luận | Bảng tin cho ảnh Markdown cao tới 640 px. Lưới dùng tối đa sáu ô, và phản hồi lồng nhau tiếp tục thu hẹp phần nội dung. | Ảnh đơn và ảnh Markdown trong bảng tin giới hạn 420 px hoặc 54% chiều cao viewport nhỏ, tùy giá trị nào thấp hơn. Lưới hiển thị tối đa bốn ảnh với bộ đếm số ảnh còn lại. Trình xem mở toàn bộ ảnh và báo khi đang tải hoặc tải lỗi. Thụt lề bình luận dừng ở cấp thứ hai và thời gian lấy từ dữ liệu bình luận. | [PostBody](frontend/src/components/post/PostBody.tsx), [ImageLightbox](frontend/src/components/post/ImageLightbox.tsx), [postContent.css](frontend/src/components/post/postContent.css), [PostDetailPage](frontend/src/pages/post/PostDetailPage.tsx) |
| Hộp thoại và xác thực | Nút đóng có thể bị vô hiệu hóa trong khi Escape và vùng nền vẫn đóng được hộp thoại. Biểu mẫu xác thực và hộp thoại dùng một số kích thước riêng. | Hộp thoại dùng cùng điều kiện đóng cho nút, bàn phím và vùng nền. Nội dung cuộn theo chiều cao màn hình. Hộp thoại xác nhận có tên và mô tả cho trình đọc màn hình. Nút đăng bài và hủy có thể xuống hàng. Bố cục xác thực điều chỉnh khoảng cách theo chiều rộng. | [Modal](frontend/src/components/ui/Modal.tsx), [ConfirmDialog](frontend/src/components/ui/ConfirmDialog.tsx), [auth.css](frontend/src/auth.css), [postContent.css](frontend/src/components/post/postContent.css) |
| Chủ đề và quản trị | Các màu nhấn xanh, tím và đỏ có thể khó đọc trong chế độ tối. Màn quản trị ghi đè màu nhấn bằng cam cố định và chừa cột điều hướng ở chiều rộng nhỏ. | Màu chữ nhấn trong chế độ tối tăng độ sáng. Quản trị dùng màu nhấn đã chọn, bảng dùng cỡ chữ tương đối và hàng gọn hơn. Ở 1100 px trở xuống, nội dung quản trị dùng hết khung khi điều hướng đóng. Tùy chọn giảm hoặc tắt chuyển động cũng tắt cuộn mượt. | [index.css](frontend/src/index.css), [useSettingsStore](frontend/src/store/useSettingsStore.ts), [social.css](frontend/src/social.css), [admin.css](frontend/src/layouts/admin.css) |

Các thay đổi dùng lại `EditorialTabs`, `EntityBanner`, `Modal`, `Button` và các store hiện có. Phần triển khai nằm ở frontend.

## Kiểm chứng

- `npm run build` thành công. Vite còn cảnh báo một chunk vượt 500 kB.
- `npm run lint` báo lỗi trong cả mã nguồn và tệp build phục vụ kiểm tra giao diện. Khi chạy riêng trên `src`, ESLint còn 16 lỗi đã có ở `AdminDataContext.jsx`, `AdminUI.jsx`, `adminRoutes.jsx` và `errorTranslation.js`. Cấu hình hiện tại áp dụng các quy tắc này cho JavaScript và JSX.
- Đã tính độ tương phản cho sáu màu nhấn. Tỷ lệ nhỏ nhất là 4,51:1 trên các cặp chữ/nền được kiểm tra, gồm nút thường, nút hover và chữ màu nhấn trên bề mặt sáng/tối.
- Đã chạy giao diện với dữ liệu kiểm thử trên Edge ở 360, 390, 768, 1024, 1280, 1440, 1920 và 2560 px. Kiểm tra tràn ngang cho bảng tin, chi tiết bài, hồ sơ, cộng đồng, Khám phá, Cộng đồng của tôi, tìm kiếm, thông báo, cài đặt giao diện, đăng nhập và tổng quan quản trị. Bảng tin và chi tiết bài có cùng chiều rộng nội dung ở cả tám kích thước.
- Đã kiểm tra lưới 1, 2, 3, 4 và 7 ảnh tại 390 px, mở ảnh thứ tư, chuyển sang ảnh thứ năm bằng phím mũi tên và đóng bằng sự kiện hủy của hộp thoại. Cũng đã kiểm tra đổi sang chủ đề tối, màu xanh, chữ lớn, mật độ gọn và tắt chuyển động.

## Hạng mục cần kiểm tra thêm

- Các luồng cần Spring Boot và tài khoản thật, gồm Google Sign-In, lưu hồ sơ, tải ảnh, gửi OTP, duyệt thành viên và thao tác quản trị, cần kiểm thử tích hợp.
- Tab bình luận hồ sơ chưa có nguồn dữ liệu hoạt động. Tổng số bài và bình luận cần số liệu do backend cung cấp trước khi hiển thị.
- DTO cập nhật hồ sơ có `showPostsOnProfile`, nhưng thuộc tính tương ứng trong thực thể backend đang được chú thích và mapper hồ sơ công khai mặc định giá trị thành `true`. Cần kiểm thử quyền riêng tư của endpoint danh sách bài trên hồ sơ và tùy chọn chỉ hiện năm sinh bằng hai tài khoản. Quyền truy cập dữ liệu do backend quyết định.

## Thiết kế lại khu vực quản trị

- Chế độ sáng dùng sidebar trắng, nền nội dung trung tính và bề mặt riêng cho bảng, bộ lọc và biểu mẫu. Chế độ tối dùng cùng cấu trúc. Các màu nhấn vẫn lấy từ tùy chọn Discuss.
- Tổng quan đưa công việc kiểm duyệt lên trước số liệu hệ thống. Bốn ô số liệu hiển thị tổng và đặt số đang hoạt động ngay trên ô người dùng hoặc cộng đồng tương ứng.
- Các màn hình quản lý dùng tiêu đề, tên cột và bộ lọc tiếng Việt. Bảng có vùng cuộn nhận tiêu điểm bàn phím. Trên điện thoại, nhóm hành động nằm cuối bản ghi. Mật độ gọn điều chỉnh đệm theo từng hàng.
- Hộp thoại xử lý báo cáo nhận phím Escape trước ngăn chi tiết. Menu điều hướng trên mobile trả tiêu điểm về nút mở khi đóng bằng Escape hoặc vùng nền.

Build frontend thành công và còn cảnh báo kích thước bundle của Vite. Edge vượt qua 30 ca dùng dữ liệu kiểm thử, gồm cả tám màn ở 360, 390 và 1440 px, cùng các chiều rộng bổ sung cho trang tổng quan. Các ca kiểm tra tràn ngang, cuộn bảng bằng bàn phím, menu mobile và đóng hộp thoại lồng nhau. ESLint trên mã nguồn còn 16 lỗi đã có. Spring Boot chưa chạy ở cổng 8080 trong lần kiểm tra này.

Xem bố cục, danh sách màn hình và thành phần dùng chung trong [thiết kế Admin](frontend/ADMIN_UI.md).

