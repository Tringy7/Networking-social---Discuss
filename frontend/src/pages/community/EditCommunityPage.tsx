import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCommunityStore } from '../../store/useCommunityStore';
import { useToastStore } from '../../store/useToastStore';
import { categoryService } from '../../services';
import Button from '../../components/ui/Button';
import { ArrowLeft, Check, Globe, Lock, Settings } from 'lucide-react';

export const EditCommunityPage: React.FC = () => {
  const { communityName } = useParams<{ communityName: string }>();
  const navigate = useNavigate();
  const { communities, updateCommunity, hydrateCommunity, uploadAvatar, uploadBanner } = useCommunityStore();
  const { addToast } = useToastStore();
  const community = communities.find((item) => item.name === communityName);
  const [categories, setCategories] = useState<Array<{ id: number; name: string; slug: string }>>([]);
  const [description, setDescription] = useState(community?.description || '');
  const [category, setCategory] = useState(community?.category || '');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>(community?.visibility || 'PUBLIC');
  const [avatarFile, setAvatarFile] = useState<File>();
  const [bannerFile, setBannerFile] = useState<File>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (communityName) hydrateCommunity(communityName).catch((error: unknown) => addToast(error instanceof Error ? error.message : 'Không thể tải cộng đồng.', 'error'));
    categoryService.list().then(setCategories).catch((error: unknown) => addToast(error instanceof Error ? error.message : 'Không thể tải danh mục.', 'error'));
  }, [addToast, communityName, hydrateCommunity]);

  useEffect(() => {
    if (!community) return;
    setDescription(community.description);
    setCategory(community.category);
    setVisibility(community.visibility);
  }, [community?.id]);

  if (!community) return <div className="py-24 text-center text-sm text-[#9A9DA3]">Đang tải cộng đồng…</div>;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      await updateCommunity(community.name, { description: description.trim(), category, visibility });
      if (avatarFile) await uploadAvatar(community.name, avatarFile);
      if (bannerFile) await uploadBanner(community.name, bannerFile);
      addToast('Cài đặt cộng đồng đã được cập nhật.', 'success');
      navigate(`/community/${community.name}`);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể cập nhật cộng đồng.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return <div className="max-w-4xl mx-auto space-y-6 text-left pb-16">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/community/${community.name}`)} className="p-2 rounded-xl bg-[#191A1C] border border-[#303235] text-[#9A9DA3]"><ArrowLeft className="w-4 h-4" /></button>
        <div><h1 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-2"><Settings className="w-5 h-5 text-[#FF5700]" />Cài đặt community/{community.name}</h1><p className="text-xs text-[#9A9DA3] mt-0.5">Tên định danh không thể thay đổi.</p></div>
      </div>
      <Link to={`/community/${community.name}/members`}><Button variant="secondary" size="sm">Quản lý thành viên</Button></Link>
    </div>
    <form onSubmit={handleSubmit} className="space-y-6 bg-[#191A1C] border border-[#303235] rounded-3xl p-6 sm:p-8">
      <div className="space-y-1.5"><label className="text-xs font-semibold text-[#9A9DA3]">Mô tả cộng đồng</label><textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} required className="w-full bg-[#101112] border border-[#303235] focus:border-[#FF5700] rounded-xl p-3 text-xs text-[#F5F5F5] outline-none" /></div>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="space-y-1.5 text-xs font-semibold text-[#9A9DA3]">Danh mục<select value={category} onChange={(event) => setCategory(event.target.value)} className="block w-full mt-1 bg-[#101112] border border-[#303235] rounded-xl p-2.5 text-[#F5F5F5]">{categories.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label>
        <label className="space-y-1.5 text-xs font-semibold text-[#9A9DA3]">Ảnh đại diện<input type="file" accept="image/*" onChange={(event) => setAvatarFile(event.target.files?.[0])} className="block w-full mt-1 text-xs" /></label>
        <label className="space-y-1.5 text-xs font-semibold text-[#9A9DA3]">Ảnh bìa<input type="file" accept="image/*" onChange={(event) => setBannerFile(event.target.files?.[0])} className="block w-full mt-1 text-xs" /></label>
      </div>
      <div className="space-y-1.5"><label className="text-xs font-semibold text-[#9A9DA3]">Quyền riêng tư</label><div className="flex gap-3">
        {(['PUBLIC', 'PRIVATE'] as const).map((value) => <button key={value} type="button" onClick={() => setVisibility(value)} className={`flex-1 p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 ${visibility === value ? 'bg-[#FF5700]/15 border-[#FF5700] text-[#FF5700]' : 'bg-[#101112] border-[#303235] text-[#9A9DA3]'}`}>{value === 'PUBLIC' ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}{value === 'PUBLIC' ? 'Công khai' : 'Riêng tư'}</button>)}
      </div></div>
      <div className="flex justify-end gap-3 pt-4 border-t border-[#303235]"><Button type="button" variant="ghost" size="md" onClick={() => navigate(-1)}>Hủy bỏ</Button><Button type="submit" variant="primary" size="md" isLoading={isLoading} leftIcon={<Check className="w-4 h-4" />}>Lưu thay đổi</Button></div>
    </form>
  </div>;
};

export default EditCommunityPage;
