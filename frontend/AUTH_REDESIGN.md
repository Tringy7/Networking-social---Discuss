# DISCUSS — giao diện xác thực

## Thiết kế đã triển khai

Áp dụng `design-taste-frontend`, nhánh app screen. Direction: **Editorial greeting**, seed **2001881530**; không redraw. Giữ Nunito Sans, logo, màu cam và hệ thống theme hiện có. Bố cục hai cột, input 48px, bo góc 10–14px, divider và chuyển động xuất hiện nhẹ tuân theo yêu cầu cụ thể của người dùng.

Ý tưởng: một cuộc thảo luận nhỏ giúp người dùng thấy cách một sở thích trở thành sự kết nối. Câu hỏi chính của màn hình là “Làm thế nào để quay lại hoặc tham gia câu chuyện?”. Form là nơi thực hiện hành động; cụm bài đăng bên trái là minh họa tĩnh.

- Container tối đa 1200px; form tối đa 420px; header chung có logo, theme toggle và Trang chủ.
- Cụm minh họa HTML/CSS gồm bài đăng lập trình, cộng đồng nhiếp ảnh và âm nhạc, có chú thích “Nội dung minh họa”. Không có nút feed giả, số lượng người dùng hoặc lời chứng thực.
- Mobile giữ một dòng giới thiệu ngắn; ẩn cụm minh họa và ưu tiên form. Đăng ký cuộn tự nhiên.
- Dùng component chung cho tiêu đề, lỗi server, divider và liên kết chuyển trang. Lỗi validation nằm dưới trường, focus vào trường lỗi đầu tiên.
- Giữ 5 trường đăng ký, checkbox điều khoản và các API/store/cookie/refresh token/điều hướng hiện có. Không thêm Google vào đăng ký vì trang đăng ký đang được route sử dụng chưa có luồng này.
- OTP dùng cùng phong cách, hỗ trợ dán 6 chữ số, loading và chặn gửi lặp.
- Chuyển động opacity/translate ngắn, có stagger, tôn trọng reduced motion và cài đặt animation của ứng dụng. Không có chuyển động lặp.
- Nút Google vẫn do SDK render, đổi theme và cập nhật chiều rộng bằng ResizeObserver; dùng các tùy chọn được [Google Identity Services hỗ trợ](https://developers.google.com/identity/gsi/web/reference/js-reference#GsiButtonConfiguration). Import có đuôi `.tsx` để tránh Windows chọn nhầm file JSX cũ có tên gần trùng.
- Dòng điều khoản nằm ngay dưới form và chỉ liên kết tới trang công khai `/terms`.

## Các file thay đổi

| File | Nội dung |
| --- | --- |
| `src/layouts/AuthLayout.tsx` | Header, bố cục chung, giới thiệu, minh họa và điều khoản |
| `src/auth.css` | Geometry, responsive, form, light/dark và trạng thái tương tác |
| `src/social.css` | Xóa CSS xác thực cũ để tránh các breakpoint ghi đè nhau |
| `src/components/auth/CommunityIllustration.tsx` | Bài đăng và hai cộng đồng minh họa, xuất hiện tuần tự |
| `src/components/auth/AuthFormParts.tsx` | Các thành phần form dùng chung |
| `src/components/auth/GoogleSignInButton.tsx` | SDK responsive, theme, disabled và trạng thái chưa khả dụng |
| `src/pages/auth/LoginPage.tsx` | Nội dung, icon username, autocomplete, validation và loading |
| `src/pages/auth/RegisterPage.tsx` | Form đồng bộ, giữ draft và các trường/điều khoản hiện có |
| `src/pages/auth/VerifyEmailPage.tsx` | OTP đồng bộ, paste và chặn request lặp |

Không thêm dependency, không thay đổi backend hoặc store xác thực.

## Kiểm tra

- `npm run build`: đạt. Vite vẫn cảnh báo bundle chính vượt 500kB.
- `npm test`: **40/40** test hiện có đạt.
- `git diff --check`: đạt.
- Taste Skill source lint cho 8 file UI xác thực: **0 FAIL, 0 WARN**. Ngoại lệ có ghi chú: box-shadow chỉ dùng làm focus ring của input.
- Taste Skill kiểm tra production: Login **0 FAIL, 1 WARN**; Register và OTP **0 FAIL, 0 WARN**. Cảnh báo Login thuộc font Google Sans bên trong nút do Google SDK tạo; font chính Nunito Sans đã tải được. Không ghi đè CSS nội bộ của Google.
- Login/Register: kiểm tra 375, 390, 768, 1024 và 1440px. OTP: inspector ở 375, 768, 1440px; bộ kiểm tra UI bổ sung cả 1024 và 1366px.
- **109 kiểm tra UI đạt** trên production: tràn ngang, form/input, theme, runtime errors, validation, hiện mật khẩu, Enter, loading, chặn gửi lặp, lỗi server, giữ dữ liệu, draft khi đọc điều khoản, đăng ký → OTP → đăng nhập, dán OTP, quên mật khẩu và system theme/reduced motion.
- Login không cuộn dọc ở 1024×768, 1366×768 và 1440×900. Đăng ký dài cuộn được và không bị cắt.
- `npm run lint`: chưa đạt, có **129 lỗi ở các file JSX cũ ngoài phạm vi sửa**. Cấu hình ESLint hiện chỉ kiểm tra JS/JSX, chưa có parser cho TypeScript; build kiểm tra việc đóng gói TSX, không thay thế type-check.

Giới hạn: các kịch bản lỗi/thành công của API trong bộ kiểm tra UI dùng request interception trong trình duyệt tạm; không tạo tài khoản thật hoặc xác minh OAuth bằng tài khoản Google thật. Ứng dụng production không có mock xác thực.

Ảnh và báo cáo đo lưu tại thư mục `.taste-skill/` ở gốc dự án: `auth-before-login`, `auth-before-register`, `auth-final-login`, `auth-final-register`, `auth-final-otp`, `auth-qa`. Kịch bản QA cục bộ: `.taste-skill/auth-qa.mjs`.

## Đánh giá trực quan

ROUND 1

Seen in one second: DISCUSS, một cộng đồng theo sở thích, bên cạnh form đăng nhập rõ ràng.

Idea (one sentence): cho thấy một câu hỏi bình dị trong cộng đồng thay cho các khoảng trắng và thông điệp quảng cáo.

Live thing: form xác thực hiện có; minh họa không tương tác.

Layout words by section: header=compact / introduction=two-line / community=staggered / form=focused.

Scores: design 7.0 · usability 7.4 · creativity 7.0 · content 8.0 → overall 7.2.

Caps applied: dùng rubric app screen; không áp các yêu cầu ảnh/chuyển động của landing page.

Top three problems:

1. `auth-after-login/desktop-fold.jpg`: cụm minh họa kéo trang tới 945px trên viewport cao 900px. Bỏ dòng trả lời phụ trong bài mẫu.
2. `auth-after-login/mobile-375-fold.jpg`: Google rộng 360px vì import chọn nhầm JSX cũ trên Windows. Chỉ định TSX và cập nhật width bằng SDK.
3. `auth-after-register/desktop-fold.jpg`: dòng tiêu đề có một từ đứng riêng. Ngắt dòng để giữ cụm “của bạn” cùng nhau.

ROUND 2

Seen in one second: mạng cộng đồng DISCUSS; hành động tiếp theo là đăng nhập hoặc tạo tài khoản.

Idea (one sentence): cùng sở thích dẫn tới cùng một cuộc trò chuyện, thể hiện bằng một bài đăng và hai cộng đồng.

Live thing: form thật, Google SDK và OTP hiện có.

Layout words by section: header=compact / introduction=connected / community=quiet / form=legible.

Scores: design 7.6 · usability 8.3 · creativity 7.0 · content 8.0 → overall 7.7.

Caps applied: rubric app screen; các ngoại lệ theo brief là màu nhấn tiêu đề, divider và chuyển động xuất hiện.

Top three problems: ba vấn đề của vòng trước đã được sửa và kiểm tra lại ở toàn bộ viewport. Giới hạn còn lại: minh họa chủ ý là nội dung mẫu, không phải feed live; nút Google giữ kích thước/phông do SDK quyết định; đăng ký cần cuộn trên viewport thấp theo yêu cầu.

Không dùng ảnh tải ngoài hoặc ảnh AI. Avatar cộng đồng là biểu tượng vector từ Lucide đã có trong dự án; không dùng ảnh người hoặc nhận diện người thật. Bài đăng, tác giả `minhng`, hai chỉ số tương tác và các tên cộng đồng là nội dung minh họa cố định, đã được chú thích ngay dưới hình; không phải dữ liệu thống kê nền tảng.
