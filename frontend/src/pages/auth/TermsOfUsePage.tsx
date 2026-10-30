import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

const termsSections = [
  {
    title: '1. Chấp nhận điều khoản',
    content:
      'Khi tạo tài khoản hoặc sử dụng DISCUSS, bạn đồng ý tuân thủ các điều khoản này và Quy chuẩn ứng xử cộng đồng. Nếu không đồng ý, vui lòng không tạo tài khoản hoặc ngừng sử dụng dịch vụ.',
  },
  {
    title: '2. Tài khoản người dùng',
    content:
      'Bạn cần cung cấp thông tin đăng ký chính xác, giữ bí mật thông tin đăng nhập và chịu trách nhiệm với hoạt động diễn ra qua tài khoản của mình. Hãy thông báo cho DISCUSS nếu phát hiện tài khoản bị truy cập trái phép. Mỗi người chỉ nên sử dụng tài khoản theo đúng mục đích cá nhân và không mạo danh người khác.',
  },
  {
    title: '3. Quy tắc sử dụng',
    content:
      'Bạn không được sử dụng DISCUSS để đăng tải nội dung trái pháp luật, đe dọa hoặc quấy rối người khác, phát tán mã độc, gửi thư rác, xâm phạm quyền riêng tư hoặc quyền sở hữu trí tuệ. Không được tìm cách truy cập trái phép, làm gián đoạn hay gây ảnh hưởng đến hệ thống và người dùng khác.',
  },
  {
    title: '4. Nội dung do người dùng đăng tải',
    content:
      'Bạn giữ quyền đối với nội dung do mình tạo và đăng. Khi đăng nội dung, bạn cho phép DISCUSS lưu trữ, hiển thị và phân phối nội dung đó trong phạm vi cần thiết để vận hành các tính năng của dịch vụ. Bạn chịu trách nhiệm bảo đảm mình có quyền đăng nội dung và không vi phạm quyền của người khác.',
  },
  {
    title: '5. Báo cáo và kiểm duyệt',
    content:
      'Bạn có thể báo cáo nội dung hoặc tài khoản vi phạm. DISCUSS có thể xem xét, hạn chế hiển thị hoặc gỡ nội dung và áp dụng biện pháp với tài khoản khi cần để bảo vệ cộng đồng, tuân thủ pháp luật hoặc thực thi các điều khoản này.',
  },
  {
    title: '6. Quyền riêng tư',
    content:
      'Việc xử lý thông tin tài khoản và dữ liệu sử dụng được thực hiện theo Chính sách quyền riêng tư. Bạn có thể quản lý một số thông tin hồ sơ và tùy chọn hiển thị trong phần cài đặt tài khoản.',
  },
  {
    title: '7. Thay đổi hoặc chấm dứt dịch vụ',
    content:
      'DISCUSS có thể cập nhật tính năng hoặc điều khoản để phù hợp với hoạt động của dịch vụ và yêu cầu pháp luật. Khi thay đổi đáng kể, chúng tôi sẽ thông báo phù hợp trong sản phẩm. Bạn có thể ngừng sử dụng dịch vụ; DISCUSS có thể tạm ngưng hoặc chấm dứt quyền truy cập nếu có vi phạm nghiêm trọng.',
  },
  {
    title: '8. Liên hệ',
    content:
      'Nếu có câu hỏi về các điều khoản này, vui lòng liên hệ đội ngũ DISCUSS qua kênh hỗ trợ được cung cấp trong ứng dụng.',
  },
];

export const TermsOfUsePage: React.FC = () => (
  <article className="space-y-5 text-left">
    <Link
      to="/register"
      className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-orange)] hover:underline"
    >
      <ArrowLeft className="h-4 w-4" />
      Quay lại đăng ký
    </Link>

    <header className="space-y-2 border-b border-[var(--border-color)] pb-4">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-orange-soft)] text-[var(--color-orange)]">
        <FileText className="h-5 w-5" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
        Điều khoản sử dụng DISCUSS
      </h1>
      <p className="text-xs text-[var(--text-secondary)]">Cập nhật lần cuối: 27/10/2026</p>
      <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
        Các điều khoản dưới đây mô tả những nguyên tắc cơ bản khi tạo tài khoản và tham gia cộng đồng DISCUSS.
      </p>
    </header>

    <div className="max-h-[55vh] space-y-5 overflow-y-auto pr-2">
      {termsSections.map((section) => (
        <section key={section.title} className="space-y-1.5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">{section.title}</h2>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{section.content}</p>
          {section.title.startsWith('6.') && (
            <Link
              to="/settings/privacy"
              className="inline-block text-sm font-semibold text-[var(--color-orange)] hover:underline"
            >
              Xem chính sách quyền riêng tư
            </Link>
          )}
        </section>
      ))}
    </div>

    <div className="border-t border-[var(--border-color)] pt-4">
      <Link
        to="/register"
        className="inline-flex items-center justify-center rounded-full bg-[var(--color-orange)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-orange-hover)]"
      >
        Tiếp tục đăng ký
      </Link>
    </div>
  </article>
);

export default TermsOfUsePage;
