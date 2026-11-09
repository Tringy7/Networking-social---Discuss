import { parseSearchQuery, formatSearchQuery, type SearchType } from '../../utils/searchQuery';
import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { usePostStore } from '../../store/usePostStore';
import { useAuthStore } from '../../store/useAuthStore';
import type { Community, Post } from '../../types';
import SearchPostResult from '../../components/search/SearchPostResult';
import CommunityMembershipButton from '../../components/community/CommunityMembershipButton';
import './searchResults.css';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import { userService, communityService, USER_SEARCH_AVAILABLE, type UserSearchResult } from '../../services';
import { Search, ChevronRight } from 'lucide-react';

export const SearchResultsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawQuery = searchParams.get('q') || '';
  const { keyword: query, type: prefixedType } = parseSearchQuery(rawQuery);
  const activeTab = prefixedType === 'posts' && searchParams.get('type') === 'all' ? 'all' : prefixedType;

  const { posts, searchPosts } = usePostStore();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const [matchingPeople, setMatchingPeople] = useState<UserSearchResult[]>([]);
  const [isPeopleSearchLoading, setIsPeopleSearchLoading] = useState(false);
  const [peopleSearchFailed, setPeopleSearchFailed] = useState(false);
  const [searchRetry, setSearchRetry] = useState(0);

  const [postResults, setPostResults] = useState<{ query: string; ids: string[]; total: number; page: number; last: boolean } | null>(null);
  const [communityResults, setCommunityResults] = useState<{ query: string; items: Community[] } | null>(null);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postSearchFailed, setPostSearchFailed] = useState(false);
  const [communitiesLoading, setCommunitiesLoading] = useState(false);
  const [communitySearchFailed, setCommunitySearchFailed] = useState(false);
  const searchGeneration = useRef(0);

  useEffect(() => {
    const generation = ++searchGeneration.current;
    let active = true;
    setPostResults(null); setCommunityResults(null); setMatchingPeople([]);
    setPostSearchFailed(false); setCommunitySearchFailed(false); setPeopleSearchFailed(false);
    setPostsLoading(!!query && (activeTab === 'posts' || activeTab === 'all') && isAuthenticated);
    setCommunitiesLoading(!!query && activeTab !== 'people');
    setIsPeopleSearchLoading(!!query && (activeTab === 'people' || activeTab === 'all') && USER_SEARCH_AVAILABLE && isAuthenticated);
    if (!query.trim()) return;
    const timer = setTimeout(() => {
      if ((activeTab === 'posts' || activeTab === 'all') && isAuthenticated) {
        searchPosts(query).then(page => {
          if (active) setPostResults({ query, ids: page.content.map(post => post.id), total: page.totalElements, page: page.page, last: page.last });
        }).catch(() => { if (active) setPostSearchFailed(true); })
          .finally(() => { if (active) setPostsLoading(false); });
      }
      if (activeTab !== 'people') communityService.search(query).then(items => {
        if (active) setCommunityResults({ query, items });
      }).catch(() => { if (active) setCommunitySearchFailed(true); })
        .finally(() => { if (active) setCommunitiesLoading(false); });
      if ((activeTab === 'people' || activeTab === 'all') && USER_SEARCH_AVAILABLE && isAuthenticated) {
        userService.search(query).then(people => { if (active) setMatchingPeople(people); })
          .catch(() => { if (active) setPeopleSearchFailed(true); })
          .finally(() => { if (active) setIsPeopleSearchLoading(false); });
      }
    }, 250);
    return () => { active = false; clearTimeout(timer); if (searchGeneration.current === generation) searchGeneration.current++; };
  }, [query, activeTab, isAuthenticated, searchPosts, searchRetry]);

  const currentPosts = postResults?.query === query ? postResults : null;
  const matchingPosts = (currentPosts?.ids || []).map(id => posts.find(post => post.id === id)).filter((post): post is Post => !!post);
  const matchingCommunities = communityResults?.query === query ? communityResults.items : [];
  const postTotal = currentPosts?.total || 0;
  const loadMorePosts = async () => {
    if (!currentPosts || currentPosts.last || postsLoading) return;
    const generation = searchGeneration.current;
    setPostsLoading(true); setPostSearchFailed(false);
    try {
      const page = await searchPosts(query, currentPosts.page + 1);
      if (generation === searchGeneration.current) setPostResults(previous => previous?.query === query
        ? { query, ids: [...new Set([...previous.ids, ...page.content.map(post => post.id)])], total: page.totalElements, page: page.page, last: page.last }
        : previous);
    } catch { if (generation === searchGeneration.current) setPostSearchFailed(true); }
    finally { if (generation === searchGeneration.current) setPostsLoading(false); }
  };

  const setType = (type: SearchType | 'all') => {
    const params = new URLSearchParams(searchParams);
    params.set('q', formatSearchQuery(type === 'all' ? 'posts' : type, query));
    if (type === 'all') params.set('type', 'all'); else params.delete('type');
    setSearchParams(params);
  };

  const visibleResultsCount = activeTab === 'all' ? postTotal + matchingCommunities.length + matchingPeople.length
    : activeTab === 'posts' ? postTotal : activeTab === 'communities' ? matchingCommunities.length : matchingPeople.length;
  const loading = (activeTab !== 'communities' && postsLoading) || (activeTab !== 'people' && communitiesLoading) || isPeopleSearchLoading;
  const failed = (activeTab !== 'communities' && postSearchFailed) || (activeTab !== 'people' && communitySearchFailed) || peopleSearchFailed;
  const showPosts = activeTab === 'posts' || activeTab === 'all';
  const showPeople = activeTab === 'people' || activeTab === 'all';
  const showCommunities = activeTab === 'communities' || activeTab === 'all';
  const sectionHeading = (label: string, type: SearchType) => <div className="search-section-heading"><h2>{label}</h2>
    {activeTab === 'all' && <button type="button" onClick={() => setType(type)}>Xem thêm <ChevronRight size={16} /></button>}</div>;
  const communityRow = (community: Community, compact = false) => <div key={community.id} className={`search-community-result ${compact ? 'is-compact' : ''}`}>
    <Link to={`/c/${encodeURIComponent(community.name)}`} aria-label={`Cộng đồng ${community.displayName}`}>
      <Avatar src={community.avatarUrl} alt={community.displayName} size={compact ? 'sm' : 'md'} />
    </Link>
    <div className="search-community-copy"><Link to={`/c/${encodeURIComponent(community.name)}`}>c/{community.name}</Link>
      <p>{community.description}</p><span>{community.memberCount.toLocaleString('vi-VN')} thành viên</span></div>
    {!compact && <CommunityMembershipButton community={community} />}
  </div>;

  return <div className="search-results-page">
    <header className="search-results-header"><h1>Kết quả tìm kiếm cho “{rawQuery}”</h1></header>
    <nav className="search-result-tabs" aria-label="Loại kết quả tìm kiếm">
      {([{ id: 'all', label: 'Tất cả' }, { id: 'posts', label: 'Bài viết' }, { id: 'communities', label: 'Cộng đồng' }, { id: 'people', label: 'Hồ sơ' }] as const).map(tab =>
        <button key={tab.id} type="button" aria-pressed={activeTab === tab.id} disabled={tab.id === 'people' && !USER_SEARCH_AVAILABLE}
          onClick={() => setType(tab.id)}>{tab.label}</button>)}
    </nav>
    <div className="search-results-layout">
      <div className="search-results-main" aria-label="Kết quả tìm kiếm">
        <div className="search-results-summary"><span>{loading ? 'Đang tìm kiếm…' : `${visibleResultsCount.toLocaleString('vi-VN')} kết quả`}</span>
          <span>{activeTab === 'posts' ? 'Bài viết mới nhất' : activeTab === 'all' ? 'Theo từng loại nội dung' : activeTab === 'people' ? 'Username và tên hiển thị' : 'Tên và mô tả cộng đồng'}</span></div>
        {failed && <div role="alert" className="search-results-notice"><span>Không thể tải đầy đủ kết quả tìm kiếm.</span>
          <Button variant="secondary" size="sm" onClick={() => setSearchRetry(value => value + 1)}>Thử lại</Button></div>}
        {loading && <p role="status" className="sr-only">Đang tìm kiếm…</p>}
        {!query && <p className="search-results-notice">Nhập nội dung để tìm bài viết, u/tên để tìm người dùng hoặc c/tên để tìm cộng đồng.</p>}
        {!isAuthenticated && activeTab !== 'communities' && <p className="search-results-notice"><Link to="/login">Đăng nhập</Link> để tìm bài viết và người dùng.</p>}
        {showPosts && matchingPosts.length > 0 && <section aria-label="Bài viết">
          {sectionHeading('Bài viết', 'posts')}
          <div className="search-post-list">{matchingPosts.slice(0, activeTab === 'all' ? 5 : undefined).map(post => <SearchPostResult key={post.id} post={post} />)}</div>
          {activeTab === 'posts' && currentPosts && !currentPosts.last && <Button className="search-load-more" variant="secondary" disabled={postsLoading} onClick={() => void loadMorePosts()}>{postsLoading ? 'Đang tải…' : 'Xem thêm bài viết'}</Button>}
        </section>}
        {showCommunities && matchingCommunities.length > 0 && <section aria-label="Cộng đồng">
          {sectionHeading('Cộng đồng', 'communities')}
          {matchingCommunities.slice(0, activeTab === 'all' ? 3 : undefined).map(community => communityRow(community))}
        </section>}
        {showPeople && matchingPeople.length > 0 && <section aria-label="Hồ sơ">
          {sectionHeading('Hồ sơ', 'people')}
          {matchingPeople.slice(0, activeTab === 'all' ? 3 : undefined).map(person => <Link key={person.id} className="search-person-result" to={`/u/${encodeURIComponent(person.username)}`}>
            <Avatar src={person.avatarUrl || undefined} alt={person.displayName} size="md" />
            <div><h3>{person.displayName}</h3><span>u/{person.username}</span>{person.bio && <p>{person.bio}</p>}</div><ChevronRight size={18} />
          </Link>)}
        </section>}
        {!!query && visibleResultsCount === 0 && !loading && !failed && (isAuthenticated || activeTab === 'communities') && <div className="search-results-empty"><Search size={28} /><h2>Không tìm thấy kết quả cho “{query}”</h2><p>Thử từ khóa khác hoặc kiểm tra lại chính tả.</p></div>}
      </div>
      {showPosts && <aside className="search-community-sidebar" aria-label="Cộng đồng liên quan"><h2>Cộng đồng liên quan</h2>
        {communitiesLoading ? <p role="status">Đang tìm cộng đồng…</p> : matchingCommunities.length ? <>{matchingCommunities.slice(0, 5).map(community => communityRow(community, true))}
          <button type="button" className="search-more-communities" onClick={() => setType('communities')}>Xem thêm cộng đồng <ChevronRight size={15} /></button></>
          : <p>{communitySearchFailed ? 'Chưa thể tải cộng đồng.' : 'Chưa có cộng đồng phù hợp với từ khóa này.'}</p>}
      </aside>}
    </div>
  </div>;
};

export default SearchResultsPage;
