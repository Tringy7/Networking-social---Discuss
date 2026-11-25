import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useAdminQuery from '../../hooks/useAdminQuery';
import useAdminResource from '../../hooks/useAdminResource';
import { deleteAdminPost, getAdminPostDetail, listAdminPosts, searchAdminPosts } from '../../services/adminPostService.js';
import ImageLightbox from '../../components/post/ImageLightbox';
import PostMarkdown from '../../components/post/PostMarkdown';
import { httpUrl } from '../../components/post/postUrls';
import {
  AdminAvatar,
  AdminConfirmDialog,
  AdminDataTable,
  AdminDetailLink,
  AdminDetailPage,
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

export function PostDetailPage() {
  const { postId } = useParams();
  return <AdminDetailPage title="Chi tiết bài viết" backTo="/admin/posts" backLabel="Về danh sách bài viết">
    <PostDetailContent key={postId} postId={postId} />
  </AdminDetailPage>;
}

function PostDetailContent({ postId }) {
  const detail = useAdminResource(useCallback(() => getAdminPostDetail(postId), [postId]));
  const [selectedImage, setSelectedImage] = useState(null);

  if (detail.loading) return <AdminLoadingSkeleton />;
  if (detail.error) return <AdminErrorState error={detail.error} retry={detail.reload} />;

  const post = detail.data;
  const author = post.author || {};
  const media = Array.isArray(post.media) ? post.media : [];
  const imageMedia = media.filter(item => item.type === 'IMAGE');
  const images = imageMedia.flatMap(item => {
    const url = httpUrl(item.url);
    return url ? [{ url, alt: item.caption, key: item.objectKey || url }] : [];
  });
  const videos = media.flatMap(item => {
    if (item.type !== 'VIDEO') return [];
    const url = httpUrl(item.url);
    return url ? [{ url, key: item.objectKey || url }] : [];
  });
  const linkUrl = httpUrl(post.linkUrl);

  const openInlineImage = url => {
    const index = images.findIndex(image => image.url === url);
    if (index !== -1) setSelectedImage(index);
  };

  return (
    <div className="admin-post-detail">
      <section className="admin-post-detail-section">
        <h2>{post.title || 'Thông tin bài viết'}</h2>
        <AdminFields items={[
          ['ID bài viết', post.id],
          ['Community Name', post.communityName],
          ['Community Display Name', post.communityDisplayName],
          ['Loại bài', post.type],
          ['Link URL', linkUrl ? <a href={linkUrl} target="_blank" rel="noopener noreferrer">{post.linkUrl}</a> : post.linkUrl],
          ['Điểm bình chọn', adminNumber(post.voteScore)],
          ['Bình luận', adminNumber(post.commentCount)],
          ['User Vote', post.userVote],
          ['Is Saved', post.isSaved == null ? '—' : post.isSaved ? 'Yes' : 'No'],
          ['Pinned', post.pinned == null ? '—' : post.pinned ? 'Yes' : 'No'],
          ['Trạng thái', <AdminStatusBadge status={post.status} />],
          ['Ngày tạo', adminDate(post.createdAt)],
          ['Cập nhật', adminDate(post.updatedAt)],
        ]} />
      </section>

      <section className="admin-post-detail-section">
        <h2>Cộng đồng</h2>
        <div className="admin-post-detail-identity">
          <AdminAvatar name={post.communityName || 'Cộng đồng'} src={post.communityAvatar} square />
          <AdminFields items={[
            ['Community Name', post.communityName],
            ['Community Display Name', post.communityDisplayName],
            ['Community Avatar', post.communityAvatar],
          ]} />
        </div>
      </section>

      <section className="admin-post-detail-section">
        <h2>Tác giả</h2>
        <div className="admin-post-detail-identity">
          <AdminAvatar name={author.displayName || author.username || 'Tác giả'} src={author.avatarUrl} />
          <AdminFields items={[
            ['ID', author.id],
            ['Username', author.username ? `@${author.username}` : '—'],
            ['Display Name', author.displayName],
            ['Avatar URL', author.avatarUrl],
          ]} />
        </div>
      </section>

      <section className="admin-post-detail-section">
        <h2>Nội dung</h2>
        {post.content
          ? <div className="admin-post-detail-content"><PostMarkdown content={post.content} images={imageMedia} onImageClick={openInlineImage} /></div>
          : <p className="admin-post-detail-muted">—</p>}
      </section>

      {images.length > 0 && (
        <section className="admin-post-detail-section" aria-labelledby="admin-post-images-title">
          <h2 id="admin-post-images-title">Hình ảnh <span className="admin-post-image-count">({images.length})</span></h2>
          <ul className="admin-post-image-grid">
            {images.map(({ url, key, alt }, index) => (
              <li key={key}>
                <button type="button" className="admin-post-image-button"
                  aria-label={alt ? `Xem ảnh ${index + 1}: ${alt}` : `Xem ảnh ${index + 1} kích thước lớn`}
                  onClick={() => setSelectedImage(index)}>
                  <img src={url} alt="" loading="lazy" decoding="async" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {videos.length > 0 && (
        <section className="admin-post-detail-section">
          <h2>Video</h2>
          <div className="admin-post-video-list">
            {videos.map(({ url, key }) => <video key={key} src={url} controls preload="metadata" />)}
          </div>
        </section>
      )}
      {selectedImage !== null && <ImageLightbox images={images} index={selectedImage}
        onChange={setSelectedImage} onClose={() => setSelectedImage(null)} />}
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
  const [action, setAction] = useState(null);
  const communityDraft = communityDraftState.source === communityName ? communityDraftState.value : communityName;
  const posts = result.data?.empty ? [] : result.data?.content || [];

  const requestDelete = post => setAction({
    title: 'Xóa bài viết',
    label: 'Xóa bài viết',
    danger: true,
    description: 'This post will be deleted. Confirm to continue.',
    preview: (
      <div className="admin-post-delete-preview">
        <strong>{post.title || 'Untitled post'}</strong>
        <span>Post ID: {post.id}</span>
        <span>Author: {post.author?.username ? `@${post.author.username}` : '—'}</span>
        <span>Community: {post.communityName ? `c/${post.communityName}` : '—'}</span>
      </div>
    ),
    execute: () => deleteAdminPost(post.id),
    success: `Post #${post.id} deleted successfully.`,
  });

  const columns = [
    {
      key: 'id',
      label: 'ID bài viết',
      render: post => <span className="admin-post-id">#{post.id}</span>,
    },
    {
      key: 'title',
      label: 'Tiêu đề',
      className: 'admin-title-cell',
      render: post => <AdminDetailLink className="admin-name-button" to={`/admin/posts/${post.id}`}><strong className="admin-cell-title">{post.title || '—'}</strong></AdminDetailLink>,
    },
    {
      key: 'author',
      label: 'Tác giả',
      render: post => post.author?.username
        ? <Link to={`/u/${encodeURIComponent(post.author.username)}`}>@{post.author.username}</Link>
        : '—',
    },
    {
      key: 'community',
      label: 'Cộng đồng',
      render: post => post.communityName
        ? <Link to={`/c/${encodeURIComponent(post.communityName)}`}>c/{post.communityName}</Link>
        : '—',
    },
    { key: 'type', label: 'Loại bài', render: post => post.type || '—' },
    { key: 'votes', label: 'Điểm bình chọn', numeric: true, render: post => adminNumber(post.voteScore) },
    { key: 'comments', label: 'Bình luận', numeric: true, render: post => adminNumber(post.commentCount) },
    { key: 'status', label: 'Trạng thái', render: post => <AdminStatusBadge status={post.status} /> },
    { key: 'created', label: 'Ngày tạo', numeric: true, render: post => adminDate(post.createdAt) },
    { key: 'updated', label: 'Cập nhật', numeric: true, render: post => adminDate(post.updatedAt) },
    {
      key: 'actions',
      label: 'Thao tác',
      className: 'admin-actions-cell',
      render: post => <div className="admin-post-row-actions">
        <AdminDetailLink className="admin-text-action" to={`/admin/posts/${post.id}`}>Xem chi tiết</AdminDetailLink>
        <button className="admin-text-action is-danger" type="button" onClick={() => requestDelete(post)}>Delete</button>
      </div>,
    },
  ];

  const applyCommunity = event => {
    event.preventDefault();
    const value = communityDraft.trim().slice(0, 255);
    setCommunityDraftState({ source: value, value });
    query.update({ communityName: value });
  };

  return (
    <div className="admin-page admin-post-management">
      <AdminPageHeader
        title="Quản lý bài viết"
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
            label="Trạng thái"
            value={status}
            options={POST_STATUSES}
            onChange={value => query.update({ status: value })}
          />
          <label className="admin-filter" htmlFor="admin-post-community-name">
            <span>Cộng đồng</span>
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
        caption="Danh sách bài viết"
        empty={<AdminEmptyState title="Không tìm thấy bài viết" />}
      />
      <AdminPagination
        result={result.data}
        page={page}
        size={size}
        disabled={result.loading || !!result.error}
        onChange={query.update}
      />
      {action && <AdminConfirmDialog action={action} onClose={() => setAction(null)} onSuccess={result.reload} />}
    </div>
  );
}
