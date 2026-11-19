import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import useAdminQuery from '../../hooks/useAdminQuery';
import useAdminResource from '../../hooks/useAdminResource';
import { listAdminPosts } from '../../services/adminPostService.js';
import {
  AdminDataTable,
  AdminEmptyState,
  AdminFilter,
  AdminPageHeader,
  AdminPagination,
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

export default function PostManagementPage() {
  const query = useAdminQuery();
  const statusValue = query.params.get('status') || '';
  const status = ['PUBLISHED', 'HIDDEN', 'DELETED'].includes(statusValue) ? statusValue : '';
  const communityName = (query.params.get('communityName') || '').slice(0, 255);
  const { page, size } = query;
  const result = useAdminResource(useCallback(
    () => listAdminPosts({ page, size, status, communityName }),
    [page, size, status, communityName],
  ));
  const [communityDraftState, setCommunityDraftState] = useState({ source: communityName, value: communityName });
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
      render: post => <strong className="admin-cell-title">{post.title || '—'}</strong>,
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
      render: post => <Link className="admin-text-action" to={`/post/${encodeURIComponent(post.id)}`}>Mở bài viết</Link>,
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
    </div>
  );
}
