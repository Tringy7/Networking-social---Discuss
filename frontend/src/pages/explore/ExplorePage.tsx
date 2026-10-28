import React, { useEffect, useState, useMemo } from 'react';
import { useCommunityStore } from '../../store/useCommunityStore';
import { useToastStore } from '../../store/useToastStore';
import CommunityCard from '../../components/community/CommunityCard.tsx';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Compass, Search, Sparkles, SlidersHorizontal, RotateCcw, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { categoryService } from '../../services';
import { useNavigate, useParams } from 'react-router-dom';

export const ExplorePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { communities, hydrate, hydrateByCategory } = useCommunityStore();
  const { addToast } = useToastStore();
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Array<{ id: number; name: string; slug: string }>>([]);
  const [sortBy, setSortBy] = useState<'members' | 'newest' | 'alphabetical'>('members');

  useEffect(() => {
    categoryService.list().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoadingCommunities(true);
    const loadCommunities = slug ? hydrateByCategory(slug) : hydrate();
    loadCommunities
      .catch((error: unknown) => {
        if (active) {
          addToast(error instanceof Error ? error.message : 'Không thể tải danh sách cộng đồng.', 'error');
        }
      })
      .finally(() => {
        if (active) setIsLoadingCommunities(false);
      });
    return () => { active = false; };
  }, [addToast, hydrate, hydrateByCategory, slug]);

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
    <div className="max-w-6xl mx-auto space-y-8 text-left pb-12">
      {/* HERO SECTION MATCHING SCREENSHOT */}
      <div className="relative rounded-3xl overflow-hidden p-8 sm:p-12 border border-[var(--border-color)] bg-[var(--hero-gradient)] shadow-2xl">
        {/* Subtle warm harmonious glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-48 bg-[var(--color-orange)]/12 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 max-w-2xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-orange-soft)] border border-[var(--color-orange-border)] text-[var(--color-orange)] text-xs font-bold tracking-wider uppercase">
            <Compass className="w-4 h-4" />
            <span>KHÁM PHÁ THẾ GIỚI DISCUSS</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--text-primary)] tracking-tight leading-tight">
            Tìm cộng đồng yêu thích của bạn
          </h1>

          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-lg mx-auto">
            Hàng trăm không gian kết nối chuyên sâu về kỹ thuật, lập trình, thiết kế giao diện và đời sống sinh viên đang chờ đón bạn.
          </p>
        </div>
      </div>

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
              className="bg-[#191A1C]"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <SlidersHorizontal className="w-4 h-4 text-[#70747C] hidden sm:block" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full sm:w-auto bg-[#191A1C] border border-[#303235] hover:border-[#45474B] focus:border-[#FF5700] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#F5F5F5] outline-none cursor-pointer"
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
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.slug
                  ? 'bg-[var(--color-orange)] text-white shadow-sm'
                  : 'bg-[#161922] border border-[#262C3A] text-[#959DAA] hover:text-[#F1F3F7] hover:border-[#343C4E]'
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
          <div className="text-xs font-bold text-[#9A9DA3]">
            Hiển thị <span className="text-[#F5F5F5]">{filteredCommunities.length}</span> cộng đồng
          </div>
          {(selectedCategory !== '' || searchQuery) && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 text-xs text-[#FF5700] hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại bộ lọc</span>
            </button>
          )}
        </div>

        {isLoadingCommunities ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-[#303235] bg-[#191A1C] py-16 text-sm text-[#9A9DA3]">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--color-orange)]" />
            <span>Đang tải danh sách cộng đồng...</span>
          </div>
        ) : filteredCommunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCommunities.map((community, index) => (
              <motion.div
                key={community.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
              >
                <CommunityCard community={community} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-[#191A1C] border border-[#303235] rounded-3xl p-8 space-y-4 max-w-md mx-auto">
            <Sparkles className="w-10 h-10 text-[#FF5700] mx-auto opacity-70" />
            <h3 className="text-base font-bold text-[#F5F5F5]">Không tìm thấy cộng đồng nào</h3>
            <p className="text-xs text-[#9A9DA3]">
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
