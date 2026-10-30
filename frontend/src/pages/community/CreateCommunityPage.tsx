import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCommunityStore } from '../../store/useCommunityStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { categoryService } from '../../services';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { BookOpen, BriefcaseBusiness, Check, Code2, Cpu, Gamepad2, Globe, Layers3, Lock, Palette, Sparkles, Users } from 'lucide-react';

interface Category { id: number; name: string; slug: string }

const categoryIcons = [Code2, Cpu, Palette, BookOpen, Gamepad2, BriefcaseBusiness, Sparkles, Layers3];

export const CreateCommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const { createCommunity, communities } = useCommunityStore();
  const { isAuthenticated } = useAuthStore();
  const { addToast } = useToastStore();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [createdName, setCreatedName] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    categoryService.list().then((items) => {
      if (!active) return;
      setCategories(items);
      setCategoryId(items[0]?.id ?? null);
    }).catch((loadError: unknown) => {
      if (active) setError(loadError instanceof Error ? loadError.message : 'Không thể tải danh mục.');
    }).finally(() => { if (active) setLoadingCategories(false); });
    return () => { active = false; };
  }, []);

  const selectedCategory = categories.find((item) => item.id === categoryId);
  const cleanName = name.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
  const nameAvailable = !communities.some((item) => item.name.toLowerCase() === cleanName);

  const nextStep = () => {
    setError('');
    if (step === 1 && !categoryId) return setError('Vui lòng chọn danh mục cho cộng đồng.');
    if (step === 3) {
      if (cleanName.length < 3 || cleanName.length > 21) return setError('Tên cộng đồng phải từ 3 đến 21 ký tự (chữ thường, số, dấu gạch dưới).');
      if (!nameAvailable) return setError('Tên cộng đồng này đã được sử dụng.');
      if (!description.trim()) return setError('Vui lòng nhập mô tả cộng đồng.');
    }
    setStep((current) => Math.min(current + 1, 3));
  };

  const handleCreate = async () => {
    if (!isAuthenticated) {
      addToast('Vui lòng đăng nhập để tạo cộng đồng.', 'warning');
      navigate('/login');
      return;
    }
    if (!selectedCategory) return setError('Danh mục không còn khả dụng. Vui lòng tải lại trang.');
    setIsLoading(true);
    setError('');
    try {
      const created = await createCommunity({
        name: cleanName,
        description: description.trim(),
        categoryId: selectedCategory.id,
        visibility,
      });
      setCreatedName(created.name);
      setStep(4);
      addToast(`Cộng đồng community/${created.name} đã được tạo thành công!`, 'success');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Không thể tạo cộng đồng.');
    } finally {
      setIsLoading(false);
    }
  };

  const steps = ['Danh mục', 'Quyền riêng tư', 'Thông tin', 'Hoàn tất'];
  const closeWizard = () => navigate('/explore');

  return <Modal isOpen onClose={closeWizard} maxWidth="4xl">
    <section className="create-community-wizard text-left">
      <header className="mb-5"><h1 id="create-community-title" className="editorial-title text-2xl sm:text-[32px] text-[var(--text-primary)]">{step === 1 ? 'Cộng đồng của bạn sẽ nói về điều gì?' : step === 2 ? 'Cộng đồng này hoạt động như thế nào?' : step === 3 ? 'Giới thiệu cộng đồng của bạn' : 'Tạo cộng đồng thành công'}</h1><p className="mt-2 text-sm text-[var(--text-secondary)]">{step === 1 ? 'Chọn một chủ đề để mọi người dễ tìm thấy cộng đồng.' : step === 2 ? 'Chọn ai có thể xem và tham gia cộng đồng.' : step === 3 ? 'Tên và mô tả giúp mọi người hiểu cộng đồng của bạn.' : 'Cộng đồng đã sẵn sàng để bắt đầu.'}</p></header>
      {error && <div role="alert" className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs font-medium text-red-500">{error}</div>}

      <div className="min-h-[180px] flex-1 text-[var(--text-primary)]">
      {step === 1 && <div className="space-y-5">
        {loadingCategories ? <p className="text-sm text-[var(--text-secondary)]">Đang tải danh mục…</p> : categories.length === 0 ? <p className="text-sm text-red-500">Không có danh mục để chọn. Kiểm tra backend rồi tải lại.</p> : <div className="flex flex-wrap gap-2">
          {categories.map((item, index) => { const CategoryIcon = categoryIcons[index % categoryIcons.length]; return <button key={item.id} type="button" onClick={() => setCategoryId(item.id)} aria-pressed={categoryId === item.id} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${categoryId === item.id ? 'border-[var(--color-orange)] bg-[var(--color-orange-soft)] text-[var(--color-orange)]' : 'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:border-[var(--color-orange-border)] hover:text-[var(--text-primary)]'}`}><CategoryIcon className="h-3.5 w-3.5" />{item.name}</button>; })}
        </div>}
      </div>}

      {step === 2 && <div className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          {(['PUBLIC', 'PRIVATE'] as const).map((value) => <button key={value} type="button" onClick={() => setVisibility(value)} aria-pressed={visibility === value} className={`rounded-[var(--radius-card)] border p-5 text-left transition-colors ${visibility === value ? 'border-[var(--color-orange)] bg-[var(--color-orange-soft)]' : 'border-[var(--border-color)] bg-[var(--bg-main)] hover:border-[var(--color-orange-border)]'}`}>
            <span className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">{value === 'PUBLIC' ? <Globe className="w-4 h-4 text-[var(--color-orange)]" /> : <Lock className="w-4 h-4 text-[var(--color-orange)]" />}{value === 'PUBLIC' ? 'Công khai' : 'Riêng tư'}</span>
            <span className="mt-2 block text-xs text-[var(--text-secondary)]">{value === 'PUBLIC' ? 'Mọi người có thể tìm thấy và tham gia cộng đồng.' : 'Chỉ thành viên được mời mới có thể tham gia.'}</span>
          </button>)}
        </div>
      </div>}

      {step === 3 && <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-[var(--color-orange-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-orange)]">{selectedCategory?.name}</span><span className="rounded-full bg-[var(--bg-elevated)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">{visibility === 'PUBLIC' ? 'Công khai' : 'Riêng tư'}</span></div>
        <label className="block space-y-1.5"><span className="text-xs font-semibold text-[var(--text-secondary)]">Tên cộng đồng</span><input value={name} onChange={(event) => { setName(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')); setError(''); }} placeholder="lap_trinh_rust" maxLength={21} className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-orange)]" /><span className="text-xs text-[var(--text-muted)]">Từ 3 đến 21 ký tự, chỉ gồm chữ thường, số và dấu gạch dưới · discuss.vn/community/{cleanName || 'ten_cong_dong'}</span>{cleanName && !nameAvailable && <span className="block text-xs text-red-500">Tên này đã được sử dụng.</span>}</label>
        <label className="block space-y-1.5"><span className="text-xs font-semibold text-[var(--text-secondary)]">Mô tả</span><textarea rows={5} value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} placeholder="Cộng đồng này dành cho chủ đề gì?" className="w-full resize-y rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-orange)]" /><span className="text-xs text-[var(--text-muted)]">{description.length}/500 ký tự</span></label></div>
        <aside className="self-start rounded-[var(--radius-card)] border border-[var(--border-color)] bg-[var(--bg-elevated)] p-5"><h3 className="text-sm font-bold text-[var(--text-primary)]">Trước khi tạo</h3><p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">Tên cộng đồng sẽ là địa chỉ cố định. Mô tả và danh mục giúp thành viên biết đây có phải là nơi phù hợp với họ.</p><div className="mt-4 space-y-2 border-t border-[var(--border-color)] pt-4 text-xs text-[var(--text-secondary)]"><div className="flex justify-between gap-3"><span>Danh mục</span><span className="font-semibold text-[var(--text-primary)]">{selectedCategory?.name}</span></div><div className="flex justify-between gap-3"><span>Quyền riêng tư</span><span className="font-semibold text-[var(--text-primary)]">{visibility === 'PUBLIC' ? 'Công khai' : 'Riêng tư'}</span></div></div></aside>
      </div>}

      {step === 4 && <div className="min-h-[270px] flex flex-col items-center justify-center space-y-4 text-center"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-orange-soft)] text-[var(--color-orange)]"><Check className="h-7 w-7" /></span><div><h2 className="text-xl font-bold text-[var(--text-primary)]">Tạo cộng đồng thành công!</h2><p className="mt-2 text-sm text-[var(--text-secondary)]">community/{createdName} đã sẵn sàng. Bạn là chủ sở hữu cộng đồng.</p></div></div>}

      </div>
      <footer className="mt-6 flex items-center justify-between gap-3 border-t border-[var(--border-color)] pt-5">
        <div className="flex items-center gap-1.5" aria-label={`Bước ${step} trên 4`}>{steps.map((label, index) => <span key={label} className={`h-2 w-2 rounded-full ${step === index + 1 ? 'bg-[var(--color-orange)]' : step > index + 1 ? 'bg-[var(--color-orange-border)]' : 'bg-[var(--border-color)]'}`} />)}</div>
        {step === 4 ? <Button variant="primary" size="md" onClick={() => navigate(`/community/${createdName}`)} leftIcon={<Users className="w-4 h-4" />}>Vào cộng đồng</Button> : <div className="flex gap-3"><Button type="button" variant="ghost" size="md" onClick={() => step === 1 ? closeWizard() : setStep(step - 1)}>{step === 1 ? 'Hủy' : 'Quay lại'}</Button>{step < 3 ? <Button type="button" variant="primary" size="md" disabled={step === 1 && (!categoryId || loadingCategories)} onClick={nextStep}>Tiếp tục</Button> : <Button type="button" variant="primary" size="md" isLoading={isLoading} onClick={handleCreate}>Tạo cộng đồng</Button>}</div>}
      </footer>
    </section>
  </Modal>;
};

export default CreateCommunityPage;
