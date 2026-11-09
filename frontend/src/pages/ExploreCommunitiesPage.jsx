import React, { useState } from 'react';
import CommunityCard from '../components/community/CommunityCard';
import { useCommunity } from '../context/CommunityContext';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Compass } from 'lucide-react';

export default function ExploreCommunitiesPage({ onSelectCommunity, onOpenCreateCommunity }) {
  const { communities } = useCommunity();
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = [
    'ALL',
    'Lập trình',
    'Frontend',
    'Thiết kế',
    'Giải trí',
    'Công nghệ',
  ];

  const filteredCommunities = communities.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCat =
      selectedCategory === 'ALL' || c.category === selectedCategory;

    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Banner Hero */}
      <div className="bg-gradient-to-r from-[#1e1e20] via-[#261f1a] to-[#1a1a1b] rounded-2xl p-6 sm:p-8 text-[#d7dadc] border border-[#343536] shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Compass className="w-4 h-4 text-orange-500" />
            <span>Khám phá thế giới Discuss</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
            Tìm cộng đồng yêu thích của bạn
          </h1>
          <p className="text-xs sm:text-sm text-[#818384] leading-relaxed mb-5">
            Khám phá hàng trăm chủ đề từ kỹ thuật phần mềm, thiết kế sản phẩm đến giải trí. Tham gia thảo luận hoặc tự tạo cộng đồng riêng!
          </p>

          {isAuthenticated && (
            <button
              onClick={onOpenCreateCommunity}
              className="px-4 py-2.5 bg-[#ff4500] hover:bg-[#ff5722] text-white font-bold rounded-full text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Cộng Đồng Mới</span>
            </button>
          )}
        </div>

        {/* Decorative elements */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Search & Category Filter */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-[#818384] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm cộng đồng theo tên, chủ đề..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1b] border border-[#343536] rounded-2xl text-xs sm:text-sm text-[#d7dadc] placeholder-[#818384] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition shadow-xs"
          />
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-orange-500 text-white shadow-sm font-bold border border-orange-500'
                  : 'bg-[#1a1a1b] text-[#818384] hover:text-[#d7dadc] hover:bg-[#272729] border border-[#343536]'
              }`}
            >
              {cat === 'ALL' ? 'Tất cả chủ đề' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Communities Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {filteredCommunities.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-[#818384] bg-[#1a1a1b] rounded-2xl border border-[#343536]">
            Không tìm thấy cộng đồng nào phù hợp.
          </div>
        ) : (
          filteredCommunities.map((c) => (
            <CommunityCard
              key={c.id}
              community={c}
              onSelectCommunity={onSelectCommunity}
            />
          ))
        )}
      </div>
    </div>
  );
}
