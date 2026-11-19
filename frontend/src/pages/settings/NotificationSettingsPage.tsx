import { Link } from 'react-router-dom';

export default function NotificationSettingsPage() {
  return (
    <section className="space-y-4 text-left">
      <h2 className="text-lg font-semibold">Thông báo bài mới</h2>
      <p className="text-sm text-[var(--text-secondary)]">
        Mở một cộng đồng đã tham gia để bật hoặc tắt thông báo bài mới của cộng đồng đó.
      </p>
      <Link to="/communities/mine" className="text-sm font-semibold underline">
        Xem cộng đồng của tôi
      </Link>
    </section>
  );
}
