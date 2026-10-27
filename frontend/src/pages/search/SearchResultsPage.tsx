import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { usePostStore } from '../../store/usePostStore';
import { useCommunityStore } from '../../store/useCommunityStore';
import PostCard from '../../components/post/PostCard';
import CommunityCard from '../../components/community/CommunityCard';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import { userService, type UserSearchResult } from '../../services';
import { useToastStore } from '../../store/useToastStore';
import { Search, Sparkles, FileText, Users, User, ArrowLeft, Filter } from 'lucide-react';

export const SearchResultsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const query = searchParams.get('q') || '';
  const activeTab = searchParams.get('type') || 'all';

  const { posts } = usePostStore();
  const { communities } = useCommunityStore();
  const { addToast } = useToastStore();
  const [matchingPeople, setMatchingPeople] = useState<UserSearchResult[]>([]);

  useEffect(() => {
    let isCurrent = true;
    if (!query.trim()) {
      setMatchingPeople([]);
      return () => {
        isCurrent = false;
      };
    }

    userService.search(query).then((people) => {
      if (isCurrent) setMatchingPeople(people);
    }).catch((error: unknown) => {
      if (isCurrent) {
        addToast(error instanceof Error ? error.message : 'Không thể tìm thành viên.', 'error');
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [query, addToast]);

  const matchingPosts = useMemo(() => {
    if (!query) return posts;
    const q = query.toLowerCase();
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [posts, query]);

  const matchingCommunities = useMemo(() => {
    if (!query) return communities;
    const q = query.toLowerCase();
    return communities.filter(
      (c) =>
        c.displayName.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [communities, query]);

  const setType = (type: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('type', type);
    setSearchParams(params);
  };

  const totalResults = matchingPosts.length + matchingCommunities.length + matchingPeople.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left pb-16">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-[#191A1C] border border-[#303235] text-[#9A9DA3] hover:text-[#F5F5F5] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F5]">
            Kết quả tìm kiếm cho "{query}"
          </h1>
          <p className="text-xs text-[#9A9DA3] mt-0.5">
            Tìm thấy {totalResults} kết quả phù hợp trên toàn hệ thống
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#303235] pb-2 text-xs font-semibold">
        <button
          onClick={() => setType('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'all'
              ? 'bg-[#FF5700]/15 text-[#FF5700] border border-[#FF5700]/30 font-bold'
              : 'text-[#9A9DA3] hover:text-[#F5F5F5]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tất cả ({totalResults})</span>
        </button>

        <button
          onClick={() => setType('posts')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'posts'
              ? 'bg-[#FF5700]/15 text-[#FF5700] border border-[#FF5700]/30 font-bold'
              : 'text-[#9A9DA3] hover:text-[#F5F5F5]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Bài viết ({matchingPosts.length})</span>
        </button>

        <button
          onClick={() => setType('communities')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'communities'
              ? 'bg-[#FF5700]/15 text-[#FF5700] border border-[#FF5700]/30 font-bold'
              : 'text-[#9A9DA3] hover:text-[#F5F5F5]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Cộng đồng ({matchingCommunities.length})</span>
        </button>

        <button
          onClick={() => setType('people')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'people'
              ? 'bg-[#FF5700]/15 text-[#FF5700] border border-[#FF5700]/30 font-bold'
              : 'text-[#9A9DA3] hover:text-[#F5F5F5]'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Thành viên ({matchingPeople.length})</span>
        </button>
      </div>

      {/* Results content */}
      <div className="space-y-6">
        {/* COMMUNITIES SECTION */}
        {(activeTab === 'all' || activeTab === 'communities') && matchingCommunities.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#70747C] uppercase tracking-wider">Cộng đồng</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matchingCommunities.slice(0, activeTab === 'all' ? 2 : undefined).map((comm) => (
                <CommunityCard key={comm.id} community={comm} />
              ))}
            </div>
          </div>
        )}

        {/* PEOPLE SECTION */}
        {(activeTab === 'all' || activeTab === 'people') && matchingPeople.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#70747C] uppercase tracking-wider">Thành viên</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {matchingPeople.map((person) => (
                <Link
                  key={person.username}
                  to={`/u/${person.username}`}
                  className="p-3 bg-[#191A1C] border border-[#303235] hover:border-[#45474B] rounded-2xl flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={person.avatarUrl} alt={person.displayName} size="md" />
                    <div>
                      <div className="text-xs font-bold text-[#F5F5F5] hover:text-[#FF5700] transition-colors">
                        {person.displayName}
                      </div>
                      <div className="text-[11px] text-[#70747C]">@{person.username}</div>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm">
                    Xem hồ sơ
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* POSTS SECTION */}
        {(activeTab === 'all' || activeTab === 'posts') && matchingPosts.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#70747C] uppercase tracking-wider">Bài viết</h3>
            <div className="space-y-4">
              {matchingPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {totalResults === 0 && (
          <div className="py-20 text-center bg-[#191A1C] border border-[#303235] rounded-3xl p-8 space-y-4">
            <Search className="w-10 h-10 text-[#FF5700] mx-auto opacity-60" />
            <h3 className="text-base font-bold text-[#F5F5F5]">
              Không tìm thấy kết quả nào cho "{query}"
            </h3>
            <p className="text-xs text-[#9A9DA3] max-w-sm mx-auto">
              Hãy thử kiểm tra lại lỗi chính tả hoặc tìm kiếm bằng từ khóa chung hơn như "React", "Spring Boot", "Đồ án".
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const params = new URLSearchParams();
                params.set('q', 'Spring Boot');
                setSearchParams(params);
              }}
            >
              Thử tìm "Spring Boot"
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResultsPage;
