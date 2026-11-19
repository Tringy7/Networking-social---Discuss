import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import useAdminQuery from '../../hooks/useAdminQuery';
import useAdminResource from '../../hooks/useAdminResource';
import { getAdminPostDetail, listAdminPosts, searchAdminPosts } from '../../services/adminPostService.js';
import PostMarkdown from '../../components/post/PostMarkdown';
import { httpUrl } from '../../components/post/postUrls';
import {
  AdminAvatar,
  AdminDataTable,
  AdminDetailDrawer,
  AdminErrorState,
  AdminEmptyState,
  AdminFields,
  AdminFilter,
  AdminLoadingSkeleton,
  AdminPageHeader,
  AdminPagination,
  AdminSearchInput,
  AdminStatusBadge,
  adminDate,
  adminNumber,
} from '../../components/admin/AdminUI.jsx';

const POST_STATUSES = [
  ['', 'Tất cả trạng thái'],
  ['PUBLISHED', 'Đã đăng'],
  ['HIDDEN', 'Đã ẩn'],
  ['DELETED', 'Đã xóa'],
];

function PostDetailContent({ postId }) {
  const detail = useAdminResource(useCallback(() => getAdminPostDetail(postId), [postId]));

  if (detail.loading) return <AdminLoadingSkeleton />;
  if (detail.error) return <AdminErrorState error={detail.error} retry={detail.reload} />;

  const post = detail.data;
  const author = post.author || {};
  const media = Array.isArray(post.media) ? post.media : [];
  const linkUrl = httpUrl(post.linkUrl);

  return (
    <div className="admin-post-detail">
      <section className="admin-post-detail-section">
        <h2>Post information</h2>
        <AdminFields items={[
          ['Post ID', post.id],
          ['Title', post.title],
          ['Community Name', post.communityName],
          ['Community Display Name', post.communityDisplayName],
          ['Type', post.type],
          ['Link URL', linkUrl ? <a href={linkUrl} target="_blank" rel="noopener noreferrer">{post.linkUrl}</a> : post.linkUrl],
          ['Vote Score', adminNumber(post.voteScore)],
          ['Comment Count', adminNumber(post.commentCount)],
          ['User Vote', post.userVote],
          ['Is Saved', post.isSaved == null ? '—' : post.isSaved ? 'Yes' : 'No'],
          ['Pinned', post.pinned == null ? '—' : post.pinned ? 'Yes' : 'No'],
          ['Status', <AdminStatusBadge status={post.status} />],
          ['Created At', adminDate(post.createdAt)],
          ['Updated At', adminDate(post.updatedAt)],
        ]} />
      </section>

      <section className="admin-post-detail-section">
        <h2>Community</h2>
        <div className="admin-post-detail-identity">
          <AdminAvatar name={post.communityName || 'Community'} src={post.communityAvatar} square />
          <AdminFields items={[
            ['Community Name', post.communityName],
            ['Community Display Name', post.communityDisplayName],
            ['Community Avatar', post.communityAvatar],
          ]} />
        </div>
      </section>

      <section className="admin-post-detail-section">
        <h2>Author</h2>
        <div className="admin-post-detail-identity">
          <AdminAvatar name={author.displayName || author.username || 'Author'} src={author.avatarUrl} />
          <AdminFields items={[
            ['ID', author.id],
            ['Username', author.username ? `@${author.username}` : '—'],
            ['Display Name', author.displayName],
            ['Avatar URL', author.avatarUrl],
          ]} />
        </div>
      </section>

      <section className="admin-post-detail-section">
        <h2>Content</h2>
        {post.content
          ? <div className="admin-post-detail-content"><PostMarkdown content={post.content} images={media.filter(item => item.type === 'IMAGE')} /></div>
          : <p className="admin-post-detail-muted">—</p>}
      </section>

      {media.length > 0 && (
        <section className="admin-post-detail-section">
          <h2>Media</h2>
          <div className="admin-post-detail-media-list">
            {media.map(item => {
              const mediaUrl = httpUrl(item.url);
              const key = item.objectKey || item.url || `${item.type}-${item.position}`;
              return (
                <article className="admin-post-detail-media" key={key}>
                  {mediaUrl && item.type === 'IMAGE' && <img src={mediaUrl} alt={item.caption || post.title || 'Post media'} loading="lazy" />}
                  {mediaUrl && item.type === 'VIDEO' && <video src={mediaUrl} controls preload="metadata" />}
                  <AdminFields items={[
                    ['Type', item.type],
                    ['Object Key', item.objectKey],
                    ['Caption', item.caption],
                    ['URL', mediaUrl ? <a href={mediaUrl} target="_blank" rel="noopener noreferrer">{item.url}</a> : item.url],
                    ['Position', item.position],
                    ['Inline Image', item.inlineImage == null ? '—' : item.inlineImage ? 'Yes' : 'No'],
                  ]} />
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

export default function PostManagementPage() {
  const query = useAdminQuery();
  const search = (query.params.get('search') || '').trim().slice(0, 200);
  const statusValue = query.params.get('status') || '';
  const status = ['PUBLISHED', 'HIDDEN', 'DELETED'].includes(statusValue) ? statusValue : '';
  const communityName = (query.params.get('communityName') || '').slice(0, 255);
  const { page, size } = query;
  const result = useAdminResource(useCallback(
    () => search
      ? searchAdminPosts({ search, page, size, status, communityName })
      : listAdminPosts({ page, size, status, communityName }),
    [page, size, search, status, communityName],
  ));
  const [communityDraftState, setCommunityDraftState] = useState({ source: communityName, value: communityName });
  const [selectedPostId, setSelectedPostId] = useState(null);
  const communityDraft = communityDraftState.source === communityName ? communityDraftState.value : communityName;
  const posts = result.data?.empty ? [] : result.data?.content || [];

  const columns = [
    {
      key: 'id',
      label: 'Post ID',
      render: post => <span className="admin-post-id">#{post.id}</span>,
    },
    {
      key: 'title',
      label: 'Title',
      className: 'admin-title-cell',
      render: post => <button className="admin-name-button" type="button" onClick={() => setSelectedPostId(post.id)}><strong className="admin-cell-title">{post.title || '—'}</strong></button>,
    },
    {
      key: 'author',
      label: 'Author',
      render: post => post.author?.username
        ? <Link to={`/u/${encodeURIComponent(post.author.username)}`}>@{post.author.username}</Link>
        : '—',
    },
    {
      key: 'community',
      label: 'Community',
      render: post => post.communityName
        ? <Link to={`/c/${encodeURIComponent(post.communityName)}`}>c/{post.communityName}</Link>
        : '—',
    },
    { key: 'type', label: 'Type', render: post => post.type || '—' },
    { key: 'votes', label: 'Vote Score', numeric: true, render: post => adminNumber(post.voteScore) },
    { key: 'comments', label: 'Comment Count', numeric: true, render: post => adminNumber(post.commentCount) },
    { key: 'status', label: 'Status', render: post => <AdminStatusBadge status={post.status} /> },
    { key: 'created', label: 'Created At', numeric: true, render: post => adminDate(post.createdAt) },
    { key: 'updated', label: 'Updated At', numeric: true, render: post => adminDate(post.updatedAt) },
    {
      key: 'actions',
      label: 'Actions',
      className: 'admin-actions-cell',
      render: post => <button className="admin-text-action" type="button" onClick={() => setSelectedPostId(post.id)}>View Details</button>,
    },
  ];

  const applyCommunity = event => {
    event.preventDefault();
    const value = communityDraft.trim().slice(0, 255);
    setCommunityDraftState({ source: value, value });
    query.update({ communityName: value });
  };

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Post Management"
        description="Theo dõi trạng thái và hoạt động của bài viết trong Discuss."
        loading={result.loading}
        onRefresh={result.reload}
      />

      <div className="admin-table-toolbar">
        <AdminSearchInput
          label="Tìm kiếm bài viết"
          value={search}
          onChange={value => query.update({ search: value.slice(0, 200) }, true)}
          placeholder="Tìm theo nội dung bài viết…"
          maxLength={200}
        />
        <form className="admin-filter-bar" onSubmit={applyCommunity}>
          <AdminFilter
            label="Status"
            value={status}
            options={POST_STATUSES}
            onChange={value => query.update({ status: value })}
          />
          <label className="admin-filter" htmlFor="admin-post-community-name">
            <span>Community Name</span>
            <input
              id="admin-post-community-name"
              className="admin-filter-input"
              value={communityDraft}
              maxLength={255}
              onChange={event => setCommunityDraftState({ source: communityName, value: event.target.value })}
              placeholder="Nhập tên cộng đồng"
            />
          </label>
          <button className="admin-button admin-button-primary" type="submit">Áp dụng</button>
          {communityName && <button className="admin-button" type="button" onClick={() => {
            setCommunityDraftState({ source: '', value: '' });
            query.update({ communityName: '' });
          }}>Xóa lọc</button>}
        </form>
      </div>

      <div className="admin-list-meta">
        <span role="status">
          {result.loading
            ? 'Đang tải bài viết…'
            : result.error
              ? 'Chưa tải được danh sách'
              : `${adminNumber(result.data?.totalElements)} bài viết`}
        </span>
      </div>

      <AdminDataTable
        rows={posts}
        columns={columns}
        rowKey={post => post.id}
        loading={result.loading}
        error={result.error}
        retry={result.reload}
        caption="Danh sách bài viết Admin"
        empty={<AdminEmptyState title="Không tìm thấy bài viết" />}
      />
      <AdminPagination
        result={result.data}
        page={page}
        size={size}
        disabled={result.loading || !!result.error}
        onChange={query.update}
      />
      {selectedPostId !== null && <AdminDetailDrawer title="Post Details" onClose={() => setSelectedPostId(null)}><PostDetailContent postId={selectedPostId} /></AdminDetailDrawer>}
    </div>
  );
}
