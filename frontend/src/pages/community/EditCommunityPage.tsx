import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, BookOpen, Camera, Check, Globe, Image as ImageIcon, Lock, Settings2, Users } from 'lucide-react';
import { useCommunityStore } from '../../store/useCommunityStore';
import { useToastStore } from '../../store/useToastStore';
import { categoryService } from '../../services';
import type { Community } from '../../types';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import EntityBanner from '../../components/ui/EntityBanner';
import ImageCropEditor from '../../components/profile/ImageCropEditor';
import type { ProfileImageKind } from '../../components/profile/ImageCropEditor';
import CommunityRulesEditor from '../../components/community/CommunityRulesEditor';
import CommunityMembersPanel from '../../components/community/CommunityMembersPanel';
import '../../components/community/communitySettings.css';

const tabs = [
  { id: 'general', label: 'Thông tin chung', icon: Settings2, description: 'Giới thiệu cộng đồng và giúp mọi người tìm đúng chủ đề.' },
  { id: 'appearance', label: 'Ảnh cộng đồng', icon: ImageIcon, description: 'Thay ảnh đại diện và ảnh bìa để mọi người nhận ra cộng đồng.' },
  { id: 'rules', label: 'Nội quy', icon: BookOpen, description: 'Đặt những nguyên tắc chung cho các cuộc thảo luận.' },
  { id: 'members', label: 'Thành viên', icon: Users, description: 'Quản lý thành viên, kiểm duyệt viên và quyền sở hữu cộng đồng.' },
  { id: 'privacy', label: 'Quyền riêng tư', icon: Lock, description: 'Chọn cách mọi người tìm thấy và tham gia cộng đồng.' },
] as const;
type SettingsTab = typeof tabs[number]['id'];
type Category = { id: number; name: string; slug: string };

function useImagePreview(file?: File) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!file) { setUrl(undefined); return; }
    const preview = URL.createObjectURL(file);
    setUrl(preview);
    return () => URL.revokeObjectURL(preview);
  }, [file]);
  return url;
}

function CommunitySettings({ community }: { community: Community }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab = tabs.find((tab) => tab.id === requestedTab) || tabs[0];
  const [description, setDescription] = useState(community.description);
  const [category, setCategory] = useState(community.category as string);
  const [rules, setRules] = useState(community.rules);
  const [visibility, setVisibility] = useState(community.visibility);
  const [avatarFile, setAvatarFile] = useState<File>();
  const [bannerFile, setBannerFile] = useState<File>();
  const [cropKind, setCropKind] = useState<ProfileImageKind | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryError, setCategoryError] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [categoryAttempt, setCategoryAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const navigationRef = useRef<HTMLElement>(null);
  const avatarPreview = useImagePreview(avatarFile);
  const bannerPreview = useImagePreview(bannerFile);
  const notify = useToastStore((state) => state.addToast);
  const dirty: Record<SettingsTab, boolean> = {
    general: description !== community.description || category !== community.category,
    appearance: Boolean(avatarFile || bannerFile),
    members: false,
    rules: rules !== community.rules,
    privacy: visibility !== community.visibility,
  };

  useEffect(() => {
    const nav = navigationRef.current;
    if (!nav) return;
    const revealSelection = () => {
      const selected = nav.querySelector<HTMLElement>('[aria-current="page"]');
      if (!selected || nav.scrollWidth <= nav.clientWidth) return;
      const left = nav.scrollLeft + selected.getBoundingClientRect().left - nav.getBoundingClientRect().left
        - (nav.clientWidth - selected.clientWidth) / 2;
      nav.scrollTo({ left: Math.max(0, left), behavior: 'instant' });
    };
    revealSelection();
    const observer = new ResizeObserver(revealSelection);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [activeTab.id]);

  useEffect(() => {
    let active = true;
    setCategoryLoading(true);
    setCategoryError(false);
    categoryService.list().then((items) => { if (active) setCategories(items); })
      .catch(() => { if (active) setCategoryError(true); })
      .finally(() => { if (active) setCategoryLoading(false); });
    return () => { active = false; };
  }, [categoryAttempt]);

  const discard = () => {
    if (activeTab.id === 'general') { setDescription(community.description); setCategory(community.category); }
    if (activeTab.id === 'rules') setRules(community.rules);
    if (activeTab.id === 'privacy') setVisibility(community.visibility);
    if (activeTab.id === 'appearance') { setAvatarFile(undefined); setBannerFile(undefined); }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending.current || activeTab.id === 'members' || !dirty[activeTab.id]) return;
    pending.current = true;
    setSaving(true);
    const store = useCommunityStore.getState();
    try {
      if (activeTab.id === 'general') {
        await store.updateCommunity(community.name, {
          description: description.trim(),
          ...(category !== community.category ? { category: category as Community['category'] } : {}),
        });
        setDescription(description.trim());
      } else if (activeTab.id === 'rules') {
        await store.updateCommunity(community.name, { rules });
        const saved = useCommunityStore.getState().communities.find((item) => item.name === community.name);
        setRules(saved?.rules ?? rules);
      } else if (activeTab.id === 'privacy') {
        await store.updateCommunity(community.name, { visibility });
      } else {
        if (avatarFile) { await store.uploadAvatar(community.name, avatarFile); setAvatarFile(undefined); }
        if (bannerFile) { await store.uploadBanner(community.name, bannerFile); setBannerFile(undefined); }
      }
      notify(`Đã lưu ${activeTab.label.toLowerCase()} của cộng đồng.`, 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Không thể lưu thay đổi. Hãy thử lại.', 'error');
    } finally { pending.current = false; setSaving(false); }
  };

  const chooseTab = (event: React.MouseEvent<HTMLAnchorElement>, id: SettingsTab) => {
    event.preventDefault();
    if (saving) return;
    const params = new URLSearchParams(searchParams);
    params.set('tab', id);
    setSearchParams(params, { preventScrollReset: true });
  };

  return <div className="settings-page community-settings-page text-left">
    <header className="community-settings-heading">
      <div className="community-settings-title">
        <Link to={`/c/${community.name}`} className="icon-button" aria-label="Quay lại cộng đồng"><ArrowLeft size={18} /></Link>
        <div><h1>Cài đặt cộng đồng</h1><p>Quản lý thông tin, hình ảnh, nội quy và thành viên của c/{community.name}.</p></div>
      </div>
      <Link to={`/c/${community.name}`} className="community-settings-view">Xem cộng đồng <ArrowUpRight size={15} /></Link>
    </header>

    <section className="community-settings-identity" aria-label="Hình ảnh cộng đồng">
      <EntityBanner src={bannerPreview || community.bannerUrl} alt={`Ảnh bìa ${community.displayName}`} variant="community"
        fallback={<span className="community-settings-cover-empty"><ImageIcon size={22} />Cộng đồng chưa có ảnh bìa</span>}>
        {activeTab.id === 'appearance' && <Button type="button" variant="secondary" size="sm" className="community-settings-cover-action" disabled={saving} onClick={() => setCropKind('banner')} leftIcon={<Camera size={15} />}>Đổi ảnh bìa</Button>}
      </EntityBanner>
      <div className="community-settings-profile">
        <div className="community-settings-avatar">
          <Avatar src={avatarPreview || community.avatarUrl} alt={community.displayName || community.name} size="xl" />
          {activeTab.id === 'appearance' && <button type="button" className="community-settings-avatar-action" aria-label="Đổi ảnh đại diện cộng đồng" disabled={saving} onClick={() => setCropKind('avatar')}><Camera size={15} /></button>}
        </div>
        <div className="community-settings-name"><h2>{community.displayName || community.name}</h2><p>c/{community.name}</p></div>
        <span className="community-settings-member-count"><Users size={15} />{community.memberCount.toLocaleString('vi-VN')} thành viên</span>
      </div>
    </section>

    <div className="settings-workspace community-settings-workspace">
      <nav ref={navigationRef} className="settings-navigation community-settings-navigation" aria-label="Các mục cài đặt cộng đồng">
        {tabs.map(({ id, label, icon: Icon }) => <Link key={id} to={`?tab=${id}`} onClick={(event) => chooseTab(event, id)}
          aria-current={activeTab.id === id ? 'page' : undefined} aria-disabled={saving || undefined}
          className={`settings-tab community-settings-tab ${activeTab.id === id ? 'is-selected' : ''}`}>
          <Icon size={17} /><span>{label}</span>{dirty[id] && <span className="community-settings-dirty" aria-label="Có thay đổi chưa lưu" />}
        </Link>)}
      </nav>

      {activeTab.id === 'members' ? <section className="settings-content community-settings-panel" aria-labelledby="community-members-section-title">
        <header className="community-settings-section-heading"><h2 id="community-members-section-title">{activeTab.label}</h2><p>{activeTab.description}</p></header>
        <CommunityMembersPanel community={community} />
      </section> : <form onSubmit={save} className="settings-content community-settings-panel" aria-labelledby="community-settings-section-title">
        <header className="community-settings-section-heading"><h2 id="community-settings-section-title">{activeTab.label}</h2><p>{activeTab.description}</p></header>
        <fieldset disabled={saving} className="community-settings-fields">
          {activeTab.id === 'general' && <>
            <div className="community-settings-field"><label htmlFor="community-slug">Tên định danh</label><div className="community-settings-slug"><span>c/</span><input id="community-slug" value={community.name} readOnly aria-describedby="community-slug-help" /><Lock size={14} /></div><p id="community-slug-help">Địa chỉ cộng đồng đã được cố định khi tạo.</p></div>
            <div className="community-settings-field"><label htmlFor="community-description">Mô tả cộng đồng</label><textarea id="community-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={5} maxLength={500} aria-describedby="community-description-count" placeholder="Giới thiệu chủ đề và những điều thành viên có thể chia sẻ…" /><p id="community-description-count" className="community-settings-counter">{description.length}/500 ký tự</p></div>
            <div className="community-settings-field"><label htmlFor="community-category">Danh mục</label><select id="community-category" value={category} onChange={(event) => setCategory(event.target.value)} disabled={categoryLoading || categoryError}>
              {!categories.some((item) => item.name === category) && <option value={category}>{category || 'Chọn danh mục'}</option>}
              {categories.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
            </select>{categoryLoading && <p role="status">Đang tải danh mục…</p>}{categoryError && <p role="status">Không thể tải danh mục. <button type="button" onClick={() => setCategoryAttempt((attempt) => attempt + 1)}>Thử lại</button></p>}</div>
          </>}
          {activeTab.id === 'appearance' && <div className="community-settings-image-options">
            <div><div><h3>Ảnh đại diện</h3><p>Ảnh vuông 1:1, hiển thị cạnh tên cộng đồng và bài viết.</p>{avatarFile && <span className="community-settings-pending">Ảnh mới · chưa lưu</span>}</div><Button type="button" variant="secondary" size="sm" onClick={() => setCropKind('avatar')} leftIcon={<Camera size={15} />}>Đổi ảnh đại diện</Button></div>
            <div><div><h3>Ảnh bìa</h3><p>Ảnh ngang 4:1. Giữ nội dung chính ở giữa để phù hợp với điện thoại.</p>{bannerFile && <span className="community-settings-pending">Ảnh mới · chưa lưu</span>}</div><Button type="button" variant="secondary" size="sm" onClick={() => setCropKind('banner')} leftIcon={<ImageIcon size={15} />}>Đổi ảnh bìa</Button></div>
            <p className="community-settings-image-note">Chọn ảnh JPG, PNG hoặc WebP tối đa 10 MB. Bạn có thể cắt và căn chỉnh ảnh trước khi lưu.</p>
          </div>}
          {activeTab.id === 'rules' && <CommunityRulesEditor value={rules} onChange={setRules} disabled={saving} />}
          {activeTab.id === 'privacy' && <div className="community-settings-privacy" role="radiogroup" aria-label="Quyền riêng tư cộng đồng">
            {(['PUBLIC', 'PRIVATE'] as const).map((value) => <label key={value} className={`community-settings-privacy-option ${visibility === value ? 'is-selected' : ''}`}>
              <input type="radio" name="community-visibility" value={value} checked={visibility === value} onChange={() => setVisibility(value)} />
              {value === 'PUBLIC' ? <Globe size={20} /> : <Lock size={20} />}<span><strong>{value === 'PUBLIC' ? 'Công khai' : 'Riêng tư'}</strong><span>{value === 'PUBLIC' ? 'Mọi người có thể tìm thấy và tham gia cộng đồng.' : 'Thành viên mới không thể tự tham gia cộng đồng.'}</span></span><Check size={17} className="community-settings-selected-check" />
            </label>)}
          </div>}
        </fieldset>
        <footer className="community-settings-footer"><p aria-live="polite">{dirty[activeTab.id] ? 'Có thay đổi chưa lưu trong mục này.' : 'Các thay đổi trong mục này đã được lưu.'}</p><div><Button type="button" variant="ghost" size="sm" disabled={saving || !dirty[activeTab.id]} onClick={discard}>Hoàn tác</Button><Button type="submit" size="sm" disabled={!dirty[activeTab.id]} isLoading={saving} leftIcon={<Check size={15} />}>Lưu thay đổi</Button></div></footer>
      </form>}
    </div>
    {cropKind && <ImageCropEditor key={cropKind} kind={cropKind} entity="community" isOpen onClose={() => setCropKind(null)} onSave={async (file) => { if (cropKind === 'avatar') setAvatarFile(file); else setBannerFile(file); }} />}
  </div>;
}

export const EditCommunityPage: React.FC = () => {
  const { communityName } = useParams<{ communityName: string }>();
  const community = useCommunityStore((state) => state.communities.find((item) => item.name === communityName));
  const hydrate = useCommunityStore((state) => state.hydrateCommunity);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setFailed(false);
    if (!communityName) { setLoading(false); return; }
    hydrate(communityName).catch(() => { if (active) setFailed(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [communityName, hydrate, attempt]);
  if (loading || failed || !community) return <section className="community-settings-loading" aria-live="polite">
    <h1>{loading ? 'Đang tải cài đặt cộng đồng' : 'Chưa thể mở cài đặt cộng đồng'}</h1><p>{loading ? 'Đang tải thông tin, ảnh đại diện và ảnh bìa…' : 'Hãy thử tải lại hoặc trở về trang cộng đồng.'}</p>
    {!loading && <div><Button size="sm" variant="secondary" onClick={() => setAttempt((value) => value + 1)}>Thử lại</Button><Link to={communityName ? `/c/${communityName}` : '/explore'}>Quay lại cộng đồng</Link></div>}
  </section>;
  return <CommunitySettings key={community.name} community={community} />;
};
export default EditCommunityPage;
