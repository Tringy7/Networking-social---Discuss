import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCommunityStore } from '../../store/useCommunityStore';
import { useToastStore } from '../../store/useToastStore';
import { CommunityCategory } from '../../types';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { ArrowLeft, Settings, Globe, Lock, Check, Plus, Trash2, Image } from 'lucide-react';

export const EditCommunityPage: React.FC = () => {
  const { communityName } = useParams<{ communityName: string }>();
  const navigate = useNavigate();

  const { communities, updateCommunity } = useCommunityStore();
  const { addToast } = useToastStore();

  const community = communities.find((c) => c.name === communityName);

  const [displayName, setDisplayName] = useState(community?.displayName || '');
  const [description, setDescription] = useState(community?.description || '');
  const [category, setCategory] = useState<CommunityCategory>(community?.category || 'Lập trình');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>(community?.visibility || 'PUBLIC');
  const [avatarUrl, setAvatarUrl] = useState(community?.avatarUrl || '');
  const [bannerUrl, setBannerUrl] = useState(community?.bannerUrl || '');
  const [rules, setRules] = useState(community?.rules || []);
  const [newRuleTitle, setNewRuleTitle] = useState('');
  const [newRuleDesc, setNewRuleDesc] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  if (!community) {
    return (
      <div className="py-24 text-center space-y-4">
        <h2 className="text-2xl font-bold text-[#F5F5F5]">Không tìm thấy cộng đồng</h2>
        <Link to="/explore">
          <Button variant="primary" size="sm">
            Khám phá cộng đồng
          </Button>
        </Link>
      </div>
    );
  }

  const handleAddRule = () => {
    if (!newRuleTitle.trim()) return;
    setRules([
      ...rules,
      {
        id: `r_${Date.now()}`,
        title: newRuleTitle.trim(),
        description: newRuleDesc.trim(),
      },
    ]);
    setNewRuleTitle('');
    setNewRuleDesc('');
  };

  const handleRemoveRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      updateCommunity(community.name, {
        displayName: displayName.trim(),
        description: description.trim(),
        category,
        visibility,
        avatarUrl,
        bannerUrl,
        rules,
      });
      setIsLoading(false);
      addToast('Cài đặt cộng đồng đã được cập nhật thành công!', 'success');
      navigate(`/c/${community.name}`);
    }, 400);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left pb-16">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/c/${community.name}`)}
            className="p-2 rounded-xl bg-[#191A1C] border border-[#303235] text-[#9A9DA3] hover:text-[#F5F5F5] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#FF5700]" />
              <span>Cài đặt cộng đồng c/{community.name}</span>
            </h1>
            <p className="text-xs text-[#9A9DA3] mt-0.5">
              Tên định danh c/{community.name} là cố định theo quy định hệ thống.
            </p>
          </div>
        </div>

        <Link to={`/c/${community.name}/members`}>
          <Button variant="secondary" size="sm">
            Quản lý thành viên & Mod
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-[#191A1C] border border-[#303235] rounded-3xl p-6 sm:p-8">
        <Input
          label="Tên hiển thị cộng đồng"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#9A9DA3]">Mô tả cộng đồng</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="w-full bg-[#101112] border border-[#303235] focus:border-[#FF5700] rounded-xl p-3 text-xs text-[#F5F5F5] placeholder-[#70747C] outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="URL Ảnh đại diện"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
          />
          <Input
            label="URL Ảnh bìa"
            value={bannerUrl}
            onChange={(e) => setBannerUrl(e.target.value)}
          />
        </div>

        {/* Visibility */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#9A9DA3]">Trạng thái hiển thị</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setVisibility('PUBLIC')}
              className={`flex-1 p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                visibility === 'PUBLIC'
                  ? 'bg-[#FF5700]/15 border-[#FF5700] text-[#FF5700]'
                  : 'bg-[#101112] border-[#303235] text-[#9A9DA3]'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Công khai (Ai cũng có thể xem & tham gia)</span>
            </button>
            <button
              type="button"
              onClick={() => setVisibility('PRIVATE')}
              className={`flex-1 p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                visibility === 'PRIVATE'
                  ? 'bg-[#FF5700]/15 border-[#FF5700] text-[#FF5700]'
                  : 'bg-[#101112] border-[#303235] text-[#9A9DA3]'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Riêng tư (Cần duyệt thành viên)</span>
            </button>
          </div>
        </div>

        {/* Community Rules Editor */}
        <div className="space-y-3 pt-3 border-t border-[#303235]">
          <h3 className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider">
            Nội quy cộng đồng ({rules.length})
          </h3>
          <div className="space-y-2">
            {rules.map((rule, idx) => (
              <div
                key={rule.id}
                className="flex items-start justify-between gap-3 p-3 rounded-xl bg-[#141517] border border-[#303235]"
              >
                <div className="text-xs">
                  <div className="font-bold text-[#F5F5F5]">
                    {idx + 1}. {rule.title}
                  </div>
                  <div className="text-[11px] text-[#9A9DA3] mt-0.5">{rule.description}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveRule(rule.id)}
                  className="text-[#70747C] hover:text-[#EF4444] p-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add new rule */}
          <div className="p-3 rounded-xl bg-[#141517] border border-[#303235] space-y-2">
            <span className="text-[11px] font-semibold text-[#9A9DA3]">Thêm điều luật mới</span>
            <input
              type="text"
              value={newRuleTitle}
              onChange={(e) => setNewRuleTitle(e.target.value)}
              placeholder="Tiêu đề quy tắc (Ví dụ: Không spam link tiếp thị)"
              className="w-full bg-[#101112] border border-[#303235] rounded-xl px-3 py-1.5 text-xs text-[#F5F5F5] outline-none"
            />
            <input
              type="text"
              value={newRuleDesc}
              onChange={(e) => setNewRuleDesc(e.target.value)}
              placeholder="Mô tả cụ thể chế tài xử phạt..."
              className="w-full bg-[#101112] border border-[#303235] rounded-xl px-3 py-1.5 text-xs text-[#F5F5F5] outline-none"
            />
            <div className="flex justify-end">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddRule}
                disabled={!newRuleTitle.trim()}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Thêm nội quy
              </Button>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#303235]">
          <Button type="button" variant="ghost" size="md" onClick={() => navigate(-1)}>
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            leftIcon={<Check className="w-4 h-4" />}
          >
            Lưu thay đổi cài đặt
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditCommunityPage;
