import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCommunityStore } from '../../store/useCommunityStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { CommunityCategory } from '../../types';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import { Users, Globe, Lock, Sparkles, Check, ArrowLeft, Image } from 'lucide-react';

export const CreateCommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const { createCommunity, communities } = useCommunityStore();
  const { isAuthenticated } = useAuthStore();
  const { addToast } = useToastStore();

  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CommunityCategory>('Lập trình');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [avatarUrl, setAvatarUrl] = useState('https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=150&auto=format&fit=crop&q=80');
  const [bannerUrl, setBannerUrl] = useState('https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Validate slug name
  const isNameAvailable = !communities.some(
    (c) => c.name.toLowerCase() === name.toLowerCase().trim()
  );

  const categories: CommunityCategory[] = [
    'Lập trình',
    'Frontend',
    'Backend',
    'Công nghệ',
    'Thiết kế',
    'Giải trí',
    'Games',
    'Giáo dục',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      addToast('Vui lòng đăng nhập để tạo cộng đồng', 'warning');
      navigate('/login');
      return;
    }

    const cleanName = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '');

    if (cleanName.length < 3 || cleanName.length > 21) {
      setError('Tên định danh cộng đồng phải từ 3 đến 21 ký tự (chữ thường, số, dấu gạch ngang).');
      return;
    }

    if (!isNameAvailable) {
      setError('Tên cộng đồng này đã được sử dụng. Vui lòng chọn tên khác.');
      return;
    }

    if (!displayName.trim() || !description.trim()) {
      setError('Vui lòng nhập tên hiển thị và mô tả cộng đồng.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const created = createCommunity({
        name: cleanName,
        displayName: displayName.trim(),
        description: description.trim(),
        category,
        visibility,
        avatarUrl,
        bannerUrl,
      });
      setIsLoading(false);
      addToast(`Cộng đồng c/${created.name} đã được tạo thành công!`, 'success');
      navigate(`/c/${created.name}`);
    }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-[#191A1C] border border-[#303235] text-[#9A9DA3] hover:text-[#F5F5F5] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#F5F5F5]">Tạo cộng đồng mới</h1>
          <p className="text-xs text-[#9A9DA3] mt-0.5">
            Xây dựng không gian thảo luận cho riêng bạn và kết nối những người cùng sở thích
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-xs text-[#EF4444] font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form fields (2 Cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5 bg-[#191A1C] border border-[#303235] rounded-3xl p-6 sm:p-8">
          {/* Community Name slug */}
          <div className="space-y-1.5">
            <Input
              label="Tên định danh cộng đồng (c/name)"
              value={name}
              onChange={(e) => {
                setName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''));
                setError('');
              }}
              placeholder="lap-trinh-rust"
              helperText="Tên này là cố định và không thể thay đổi sau khi tạo (3–21 ký tự)."
              required
            />
            {name && (
              <div className="text-[11px] flex items-center gap-1 font-mono">
                URL xem trước: <span className="text-[#FF5700]">discuss.vn/c/{name}</span>
                {isNameAvailable ? (
                  <span className="text-[#22C55E] ml-2 flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> Hợp lệ
                  </span>
                ) : (
                  <span className="text-[#EF4444] ml-2">Đã tồn tại</span>
                )}
              </div>
            )}
          </div>

          <Input
            label="Tên hiển thị công khai (Display Name)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Ví dụ: Cộng đồng Lập trình Rust Việt Nam"
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#9A9DA3]">Mô tả cộng đồng</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Giới thiệu mục tiêu của cộng đồng, đối tượng tham gia và những chủ đề thường được thảo luận..."
              required
              className="w-full bg-[#101112] border border-[#303235] focus:border-[#FF5700] rounded-xl p-3 text-xs text-[#F5F5F5] placeholder-[#70747C] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#9A9DA3]">Chủ đề / Chuyên mục</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CommunityCategory)}
                className="w-full bg-[#101112] border border-[#303235] focus:border-[#FF5700] rounded-xl p-2.5 text-xs text-[#F5F5F5] outline-none cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#9A9DA3]">Quyền riêng tư</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVisibility('PUBLIC')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    visibility === 'PUBLIC'
                      ? 'bg-[#FF5700]/15 border-[#FF5700] text-[#FF5700]'
                      : 'bg-[#101112] border-[#303235] text-[#9A9DA3]'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Công khai</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('PRIVATE')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    visibility === 'PRIVATE'
                      ? 'bg-[#FF5700]/15 border-[#FF5700] text-[#FF5700]'
                      : 'bg-[#101112] border-[#303235] text-[#9A9DA3]'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Riêng tư</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#303235]">
            <Button type="button" variant="ghost" size="md" onClick={() => navigate(-1)}>
              Hủy bỏ
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
              Tạo cộng đồng ngay
            </Button>
          </div>
        </form>

        {/* Live Preview Card (Right Column) */}
        <div className="space-y-4">
          <span className="text-xs font-bold text-[#70747C] uppercase tracking-wider block">
            Xem trước thẻ cộng đồng
          </span>
          <div className="bg-[#191A1C] border border-[#303235] rounded-2xl p-5 space-y-4 text-left shadow-lg">
            <div className="flex items-start gap-3">
              <Avatar src={avatarUrl} alt={displayName || 'D'} size="lg" shape="rounded" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-[#F5F5F5] truncate">
                  {displayName || 'Tên cộng đồng của bạn'}
                </h3>
                <span className="text-xs text-[#70747C] font-mono">
                  c/{name || 'ten-cong-dong'}
                </span>
                <div className="mt-1">
                  <span className="text-[11px] font-semibold text-[#FF5700] bg-[#FF5700]/10 px-2 py-0.5 rounded-full inline-block">
                    {category}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#9A9DA3] line-clamp-3 leading-relaxed">
              {description || 'Mô tả ngắn về cộng đồng của bạn sẽ hiển thị ở đây để thu hút thành viên mới.'}
            </p>

            <div className="pt-3 border-t border-[#303235]/60 flex items-center justify-between gap-3 text-xs text-[#70747C]">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#9A9DA3]" />
                <span className="font-semibold text-[#9A9DA3]">1</span> thành viên
              </div>
              <Button variant="primary" size="sm" className="py-1 px-4 text-xs font-bold">
                Tham gia
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCommunityPage;
