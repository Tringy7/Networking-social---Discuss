import React, { useEffect, useState, useMemo } from 'react';
import { useCommunityStore } from '../../store/useCommunityStore';
import { useToastStore } from '../../store/useToastStore';
import CommunityCard from '../../components/community/CommunityCard.tsx';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Compass, Search, Sparkles, SlidersHorizontal, RotateCcw, Loader2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { categoryService } from '../../services';
import { useNavigate, useParams } from 'react-router-dom';

export const ExplorePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { communities, hydrate, hydrateByCategory, hydrateSearch } = useCommunityStore();
  const { addToast } = useToastStore();
  const shouldReduceMotion = useReducedMotion();
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categories, setCategories] = useState<Array<{ id: number; name: string; slug: string }>>([]);
  const [sortBy, setSortBy] = useState<'members' | 'newest' | 'alphabetical'>('members');

  useEffect(() => {
    categoryService.list().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    let active = true;
    setIsLoadingCommunities(true);
    setLoadFailed(false);
    const loadCommunities = debouncedSearch && !slug
      ? hydrateSearch(debouncedSearch)
      : slug
        ? hydrateByCategory(slug)
        : hydrate();
    loadCommunities
      .catch((error: unknown) => {
        if (active) {
          setLoadFailed(true);
          addToast(error instanceof Error ? error.message : 'Không thể tải danh sách cộng đồng.', 'error');
        }
      })
      .finally(() => {
        if (active) setIsLoadingCommunities(false);
      });
    return () => { active = false; };
  }, [addToast, debouncedSearch, hydrate, hydrateByCategory, hydrateSearch, retryCount, slug]);

  const selectedCategory = slug || '';

  const filteredCommunities = useMemo(() => {
    return communities
      .filter((c) => {
        const matchesQuery =
          c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase());

        const selectedCategoryName = categories.find((item) => item.slug === selectedCategory)?.name;
        const matchesCategory = !selectedCategory || c.category === selectedCategoryName;

        return matchesQuery && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'members') return b.memberCount - a.memberCount;
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return a.displayName.localeCompare(b.displayName);
      });
  }, [communities, categories, searchQuery, selectedCategory, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    navigate('/explore');
    setSortBy('members');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-left pb-12">
      <header className="flex items-end justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]"><Compass className="h-4 w-4 text-[var(--color-orange)]" /> Khám phá DISCUSS</div>
          <h1 className="mt-2 text-xl sm:text-3xl font-semibold tracking-tight text-[var(--text-primary)]">Khám phá cộng đồng</h1>
          <p className="mt-1.5 text-sm text-[var(--text-secondary)]">Theo dõi những không gian có cùng mối quan tâm.</p>
        </div>
      </header>

      {/* FILTER BAR & SEARCH */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="flex-1 w-full">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              showClear
              leftIcon={<Search className="w-4 h-4" />}
              placeholder="Tìm kiếm theo tên cộng đồng, từ khóa mô tả..."
              className="bg-[var(--bg-surface)]"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <SlidersHorizontal className="w-4 h-4 text-[#70747C] hidden sm:block" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full sm:w-auto bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--border-hover)] focus:border-[var(--color-orange)] rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] cursor-pointer"
            >
              <option value="members">Nhiều thành viên nhất</option>
              <option value="newest">Mới tạo gần đây</option>
              <option value="alphabetical">Tên A-Z</option>
            </select>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[{ id: 0, name: 'Tất cả', slug: '' }, ...categories].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                navigate(cat.slug ? `/explore/${encodeURIComponent(cat.slug)}` : '/explore');
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors duration-150 whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.slug
                  ? 'bg-[var(--color-orange-soft)] text-[var(--color-orange-ink)]'
                  : 'bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* COMMUNITY GRID */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-[var(--text-secondary)]">
            <span className="text-[var(--text-primary)]">{filteredCommunities.length}</span> cộng đồng
          </div>
          {(selectedCategory !== '' || searchQuery) && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 text-sm text-[var(--color-orange-ink)] hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại bộ lọc</span>
            </button>
          )}
        </div>

        {isLoadingCommunities ? (
          <div role="status" className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] py-16 text-sm text-[var(--text-secondary)]">
            <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin text-[var(--color-orange)] motion-reduce:animate-none" />
            <span>Đang tải danh sách cộng đồng...</span>
          </div>
        ) : loadFailed ? (
          <div role="alert" className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-5 py-12 text-center">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Không tải được danh sách cộng đồng</h2>
            <p className="text-sm text-[var(--text-secondary)]">Kiểm tra kết nối rồi thử lại.</p>
            <Button variant="secondary" size="sm" onClick={() => setRetryCount((count) => count + 1)}>Thử lại</Button>
          </div>
        ) : filteredCommunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCommunities.map((community, index) => (
              <motion.div
                key={community.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.2, delay: shouldReduceMotion ? 0 : index * 0.04 }}
              >
                <CommunityCard community={community} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-8 space-y-4 max-w-md mx-auto">
            <Sparkles className="w-10 h-10 text-[#FF5700] mx-auto opacity-70" />
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Không tìm thấy cộng đồng nào</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Không có kết quả nào trùng khớp với bộ lọc hoặc từ khóa "{searchQuery}".
            </p>
            <Button variant="secondary" size="sm" onClick={handleResetFilters}>
              Đặt lại toàn bộ bộ lọc
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplorePage;
