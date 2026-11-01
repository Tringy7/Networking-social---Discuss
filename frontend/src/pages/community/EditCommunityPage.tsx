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
  const [isCommunityLoading, setIsCommunityLoading] = useState(true);
  const [communityLoadFailed, setCommunityLoadFailed] = useState(false);

  useEffect(() => {
    let active = true;
    if (communityName) {
      setIsCommunityLoading(true);
      setCommunityLoadFailed(false);
      hydrateCommunity(communityName)
        .catch((error: unknown) => {
          if (!active) return;
          setCommunityLoadFailed(true);
          addToast(error instanceof Error ? error.message : 'Không thể tải cộng đồng.', 'error');
        })
        .finally(() => {
          if (active) setIsCommunityLoading(false);
        });
    } else {
      setIsCommunityLoading(false);
    }
    categoryService.list().then(setCategories).catch((error: unknown) => addToast(error instanceof Error ? error.message : 'Không thể tải danh mục.', 'error'));
    return () => { active = false; };
  }, [addToast, communityName, hydrateCommunity]);

  useEffect(() => {
    if (!community) return;
    setDescription(community.description);
    setCategory(community.category);
    setVisibility(community.visibility);
  }, [community?.id]);

  if (!community) {
    return (
      <section className="mx-auto flex min-h-64 max-w-xl flex-col items-center justify-center gap-4 px-4 py-16 text-center" aria-live="polite">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
          {communityLoadFailed ? 'Không tải được cài đặt cộng đồng' : isCommunityLoading ? 'Đang tải cài đặt cộng đồng' : 'Không tìm thấy cộng đồng'}
        </h1>
        <p className="text-sm leading-6 text-[var(--text-secondary)]">
          {communityLoadFailed
            ? 'Hãy thử tải lại hoặc trở về trang cộng đồng.'
            : isCommunityLoading
              ? `Đang tải community/${communityName}.`
              : `Không tìm thấy community/${communityName}.`}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {communityLoadFailed && communityName && (
            <Button variant="secondary" size="sm" onClick={() => {
              setIsCommunityLoading(true);
              setCommunityLoadFailed(false);
              hydrateCommunity(communityName)
                .catch((error: unknown) => {
                  setCommunityLoadFailed(true);
                  addToast(error instanceof Error ? error.message : 'Không thể tải cộng đồng.', 'error');
                })
                .finally(() => setIsCommunityLoading(false));
            }}>Thử lại</Button>
          )}
          <Link to={communityName ? `/community/${communityName}` : '/explore'}>
            <Button variant="primary" size="sm">Quay lại cộng đồng</Button>
          </Link>
        </div>
      </section>
    );
  }

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

  return (
    <div className="utility-page space-y-5 pb-8 text-left">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            onClick={() => navigate(`/community/${community.name}`)}
            aria-label="Quay lại cộng đồng"
            className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          ><ArrowLeft className="h-4 w-4" /></button>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--text-muted)]">community/{community.name}</p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
              <Settings className="h-5 w-5 shrink-0 text-[var(--color-orange-ink)]" />
              Cài đặt cộng đồng
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Tên định danh không thể thay đổi.</p>
          </div>
        </div>
        <Link to={`/community/${community.name}/members`}><Button variant="secondary" size="sm">Quản lý thành viên</Button></Link>
      </header>

      <form onSubmit={handleSubmit} className="community-settings-form space-y-5">
        <div className="space-y-2">
          <label htmlFor="community-description" className="text-sm font-semibold text-[var(--text-secondary)]">Mô tả cộng đồng</label>
          <textarea id="community-description" rows={4} value={description} onChange={(event) => setDescription(event.target.value)} required className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-3 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--color-orange)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-semibold text-[var(--text-secondary)]">Danh mục
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-orange)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]">
              {categories.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm font-semibold text-[var(--text-secondary)]">Ảnh đại diện
            <input type="file" accept="image/*" onChange={(event) => setAvatarFile(event.target.files?.[0])} className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-2 text-sm text-[var(--text-secondary)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--color-orange-soft)] file:px-3 file:py-1.5 file:font-semibold file:text-[var(--color-orange-ink)]" />
          </label>
          <label className="space-y-2 text-sm font-semibold text-[var(--text-secondary)]">Ảnh bìa
            <input type="file" accept="image/*" onChange={(event) => setBannerFile(event.target.files?.[0])} className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-2 text-sm text-[var(--text-secondary)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--color-orange-soft)] file:px-3 file:py-1.5 file:font-semibold file:text-[var(--color-orange-ink)]" />
          </label>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-[var(--text-secondary)]">Quyền riêng tư</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(['PUBLIC', 'PRIVATE'] as const).map((value) => (
              <button key={value} type="button" aria-pressed={visibility === value} onClick={() => setVisibility(value)} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${visibility === value ? 'bg-[var(--color-orange-soft)] text-[var(--color-orange-ink)]' : 'bg-[var(--bg-main)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}>
                {value === 'PUBLIC' ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {value === 'PUBLIC' ? 'Công khai' : 'Riêng tư'}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" size="md" onClick={() => navigate(-1)}>Hủy bỏ</Button>
          <Button type="submit" variant="primary" size="md" isLoading={isLoading} leftIcon={<Check className="h-4 w-4" />}>Lưu thay đổi</Button>
        </div>
      </form>
    </div>
  );
};

export default EditCommunityPage;
