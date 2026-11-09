import PageHeader from '../../components/ui/PageHeader';
import React, { useEffect, useState, useMemo } from 'react';
import { useCommunityStore } from '../../store/useCommunityStore';
import { useToastStore } from '../../store/useToastStore';
import CommunityCard from '../../components/community/CommunityCard.tsx';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Search, SlidersHorizontal, RotateCcw, Loader2 } from 'lucide-react';
import { categoryService } from '../../services';
import { useNavigate, useParams } from 'react-router-dom';

export const ExplorePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { communities, hydrate, hydrateByCategory, hydrateSearch } = useCommunityStore();
  const { addToast } = useToastStore();
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
          (c.displayName || c.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.description || '').toLowerCase().includes(searchQuery.toLowerCase());

        const selectedCategoryName = categories.find((item) => item.slug === selectedCategory)?.name;
        const matchesCategory = !selectedCategory || c.category === selectedCategoryName;

        return matchesQuery && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'members') return b.memberCount - a.memberCount;
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return (a.displayName || a.name).localeCompare(b.displayName || b.name);
      });
  }, [communities, categories, searchQuery, selectedCategory, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    navigate('/explore');
    setSortBy('members');
  };

  return (
    <div className="explore-page text-left pb-8">
      <PageHeader title="Khám phá cộng đồng" description="Tìm những người cùng sở thích, bắt đầu một cuộc trò chuyện mới." />

      {/* FILTER BAR & SEARCH */}
      <div className="directory-filters">
        <div className="directory-search-row">
          {/* Search Box */}
          <div className="flex-1 w-full">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              showClear
              aria-label="Tìm cộng đồng"
              leftIcon={<Search className="w-4 h-4" />}
              placeholder="Tìm kiếm theo tên cộng đồng, từ khóa mô tả..."
              className="directory-search-input"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <SlidersHorizontal className="w-4 h-4 text-[var(--text-muted)] hidden sm:block" />
            <select
              aria-label="Sắp xếp cộng đồng"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="directory-sort"
            >
              <option value="members">Nhiều thành viên nhất</option>
              <option value="newest">Mới tạo gần đây</option>
              <option value="alphabetical">Tên A-Z</option>
            </select>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="directory-categories" role="group" aria-label="Danh mục cộng đồng">
          {[{ id: 0, name: 'Tất cả', slug: '' }, ...categories].map((cat) => (
            <button
              key={cat.id}
              type="button"
              aria-pressed={selectedCategory === cat.slug}
              onClick={() => {
                navigate(cat.slug ? `/explore/${encodeURIComponent(cat.slug)}` : '/explore');
              }}
              className={`directory-category-filter ${selectedCategory === cat.slug ? 'is-selected' : ''}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* COMMUNITY GRID */}
      <section className="directory-results" aria-label="Danh sách cộng đồng" aria-busy={isLoadingCommunities}>
        <div className="directory-results-heading">
          <div aria-live="polite" className="text-sm font-medium text-[var(--text-secondary)]">
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
          <div role="status" className="community-empty">
            <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin text-[var(--color-orange)] motion-reduce:animate-none" />
            <span>Đang tải danh sách cộng đồng...</span>
          </div>
        ) : loadFailed ? (
          <div role="alert" className="community-empty">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Không tải được danh sách cộng đồng</h2>
            <p className="text-sm text-[var(--text-secondary)]">Kiểm tra kết nối rồi thử lại.</p>
            <Button variant="secondary" size="sm" onClick={() => setRetryCount((count) => count + 1)}>Thử lại</Button>
          </div>
        ) : filteredCommunities.length > 0 ? (
          <div className="community-directory">
            {filteredCommunities.map((community) => (
              <CommunityCard key={community.id} community={community} />
            ))}
          </div>
        ) : (
          <div className="community-empty">
            <Search size={24} aria-hidden="true" />
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Không tìm thấy cộng đồng nào</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Không có kết quả nào trùng khớp với bộ lọc hoặc từ khóa "{searchQuery}".
            </p>
            <Button variant="secondary" size="sm" onClick={handleResetFilters}>
              Đặt lại toàn bộ bộ lọc
            </Button>
          </div>
        )}
      </section>
    </div>
  );
};

export default ExplorePage;
