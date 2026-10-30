import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { usePostStore } from '../../store/usePostStore';
import { useCommunityStore } from '../../store/useCommunityStore';
import PostCard from '../../components/post/PostCardView';
import CommunityCard from '../../components/community/CommunityCard.tsx';
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
  const [isPeopleSearchLoading, setIsPeopleSearchLoading] = useState(false);
  const [peopleSearchFailed, setPeopleSearchFailed] = useState(false);
  const [searchRetry, setSearchRetry] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    if (!query.trim()) {
      setMatchingPeople([]);
      setIsPeopleSearchLoading(false);
      setPeopleSearchFailed(false);
      return () => {
        isCurrent = false;
      };
    }

    setMatchingPeople([]);
    setIsPeopleSearchLoading(true);
    setPeopleSearchFailed(false);
    userService.search(query).then((people) => {
      if (isCurrent) setMatchingPeople(people);
    }).catch((error: unknown) => {
      if (isCurrent) {
        setPeopleSearchFailed(true);
        addToast(error instanceof Error ? error.message : 'Không thể tìm thành viên.', 'error');
      }
    }).finally(() => {
      if (isCurrent) setIsPeopleSearchLoading(false);
    });

    return () => {
      isCurrent = false;
    };
  }, [query, addToast, searchRetry]);

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
  const visibleResultsCount = activeTab === 'posts'
    ? matchingPosts.length
    : activeTab === 'communities'
      ? matchingCommunities.length
      : activeTab === 'people'
        ? matchingPeople.length
        : totalResults;
  const shouldWaitForPeople = isPeopleSearchLoading && (activeTab === 'all' || activeTab === 'people');
  const shouldShowPeopleError = peopleSearchFailed && (activeTab === 'all' || activeTab === 'people');

  return (
    <div className="utility-page space-y-5 text-left pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          aria-label="Quay lại"
          className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            Kết quả tìm kiếm cho "{query}"
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Tìm thấy {totalResults} kết quả phù hợp trên toàn hệ thống
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-sm font-medium">
        <button
          onClick={() => setType('all')}
          aria-pressed={activeTab === 'all'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'all'
              ? 'bg-[var(--color-orange-soft)] text-[var(--color-orange-ink)] border border-[var(--color-orange-border)] font-semibold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tất cả ({totalResults})</span>
        </button>

        <button
          onClick={() => setType('posts')}
          aria-pressed={activeTab === 'posts'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'posts'
              ? 'bg-[var(--color-orange-soft)] text-[var(--color-orange-ink)] border border-[var(--color-orange-border)] font-semibold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Bài viết ({matchingPosts.length})</span>
        </button>

        <button
          onClick={() => setType('communities')}
          aria-pressed={activeTab === 'communities'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'communities'
              ? 'bg-[var(--color-orange-soft)] text-[var(--color-orange-ink)] border border-[var(--color-orange-border)] font-semibold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Cộng đồng ({matchingCommunities.length})</span>
        </button>

        <button
          onClick={() => setType('people')}
          aria-pressed={activeTab === 'people'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'people'
              ? 'bg-[var(--color-orange-soft)] text-[var(--color-orange-ink)] border border-[var(--color-orange-border)] font-semibold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Thành viên ({matchingPeople.length})</span>
        </button>
      </div>

      {/* Results content */}
      <div className="space-y-6">
        {shouldWaitForPeople && (
          <div role="status" className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-secondary)]">
            Đang tìm thành viên…
          </div>
        )}
        {shouldShowPeopleError && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-4 py-3">
            <span className="text-sm text-[var(--text-secondary)]">Không thể tải kết quả tìm thành viên.</span>
            <Button variant="secondary" size="sm" onClick={() => setSearchRetry((count) => count + 1)}>Thử lại</Button>
          </div>
        )}
        {/* COMMUNITIES SECTION */}
        {(activeTab === 'all' || activeTab === 'communities') && matchingCommunities.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Cộng đồng</h2>
            <div className="community-directory">
              {matchingCommunities.slice(0, activeTab === 'all' ? 2 : undefined).map((comm) => (
                <CommunityCard key={comm.id} community={comm} />
              ))}
            </div>
          </div>
        )}

        {/* PEOPLE SECTION */}
        {(activeTab === 'all' || activeTab === 'people') && matchingPeople.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Thành viên</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {matchingPeople.map((person) => (
                <Link
                  key={person.username}
                  to={`/user/${person.username}`}
                  className="p-3 bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--border-hover)] rounded-xl flex items-center justify-between gap-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={person.avatarUrl} alt={person.displayName} size="md" />
                    <div>
                      <div className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--color-orange-ink)] transition-colors">
                        {person.displayName}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">@{person.username}</div>
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
            <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Bài viết</h2>
            <div className="space-y-4">
              {matchingPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {visibleResultsCount === 0 && !shouldWaitForPeople && !shouldShowPeopleError && (
          <div className="py-16 text-center bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[var(--radius-card)] p-8 space-y-4">
            <Search className="w-10 h-10 text-[var(--color-orange)] mx-auto opacity-60" />
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Không tìm thấy kết quả nào cho "{query}"
            </h2>
            <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto">
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
