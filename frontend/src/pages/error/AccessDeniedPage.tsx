import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { ArrowUpRight } from 'lucide-react';
export default function AccessDeniedPage() {
  return <section className="error-editorial"><span className="error-code">403</span><h1 className="editorial-title">Cuộc trò chuyện có giới hạn.</h1><p>Bạn cần quyền phù hợp để truy cập khu vực này. Liên hệ quản trị viên nếu bạn cần hỗ trợ.</p><div className="flex flex-wrap gap-3 mt-6"><Link to="/"><Button size="sm">Về bảng tin</Button></Link><Link to="/explore"><Button size="sm" variant="ghost" rightIcon={<ArrowUpRight size={16} />}>Khám phá cộng đồng</Button></Link></div></section>;
}
