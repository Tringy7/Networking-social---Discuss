import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { ArrowUpRight } from 'lucide-react';
export default function NotFoundPage() {
  return <section className="error-editorial"><span className="error-code">404</span><h1 className="editorial-title">Góc nhìn này chưa tồn tại.</h1><p>Trang bạn tìm có thể đã được chuyển hoặc không còn tồn tại.</p><div className="flex flex-wrap gap-3 mt-6"><Link to="/"><Button size="sm">Về bảng tin</Button></Link><Link to="/explore"><Button size="sm" variant="ghost" rightIcon={<ArrowUpRight size={16} />}>Khám phá cộng đồng</Button></Link></div></section>;
}
