import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import useAdminResource from '../../hooks/useAdminResource';
import { adminModeration, type AdminComment } from '../../services/adminModeration';
import PostBody from '../post/PostBody';
import PostMarkdown from '../post/PostMarkdown';
import { httpUrl } from '../post/postUrls';
import { AdminAvatar, AdminFields, AdminLoadingSkeleton, AdminErrorState, AdminStatusBadge, adminDate } from './AdminUI';

export function CommunityPreview({ name }: { name: string }) {
  const result = useAdminResource(useCallback(() => adminModeration.community(name), [name]));
  if (result.loading) return <AdminLoadingSkeleton />;
  if (result.error) return <AdminErrorState error={result.error} retry={result.reload} />;
  const community = result.data!;
  return <div className="admin-content-preview">{httpUrl(community.bannerUrl) && <img className="admin-community-banner" src={httpUrl(community.bannerUrl)} alt={`Ảnh bìa c/${community.name}`} />}<div className="admin-identity"><AdminAvatar name={community.name} src={community.avatarUrl} square /><span><strong>c/{community.name}</strong><small>{community.categoryName || 'Chưa phân loại'}</small></span></div><p className="admin-preserve-lines">{community.description || 'Chưa có mô tả.'}</p>
    <AdminFields items={[[ 'Chủ sở hữu', community.owner ? <Link to={`/u/${encodeURIComponent(community.owner.username)}`}>@{community.owner.username}</Link> : '—'], ['Danh mục', community.categoryName], ['Quyền riêng tư', community.visibility === 'PRIVATE' ? 'Riêng tư' : 'Công khai'], ['Thành viên', community.memberCount.toLocaleString('vi-VN')], ['Trạng thái', <AdminStatusBadge status={community.status || community.communityStatus} />], ['Ngày tạo', adminDate(community.createdAt)]]} />
    <Link className="admin-button" to={`/c/${encodeURIComponent(community.name)}`}>Xem cộng đồng <ArrowUpRight size={15} /></Link>
  </div>;
}
export function PostPreview({ id, onDelete }: { id: string; onDelete?: () => void }) {
  const result = useAdminResource(useCallback(() => adminModeration.post(id), [id]));
  if (result.loading) return <AdminLoadingSkeleton />;
  if (result.error) return <AdminErrorState error={result.error} retry={result.reload} />;
  const post = result.data!;
  return <article className="admin-content-preview"><div className="admin-preview-meta"><Link to={`/u/${encodeURIComponent(post.author.username)}`}>@{post.author.username}</Link><Link to={`/c/${encodeURIComponent(post.communityName)}`}>c/{post.communityName}</Link><span>{adminDate(post.createdAt)}</span></div><h2>{post.title}</h2><PostBody post={post} /><AdminFields items={[[ 'Loại bài viết', post.type || '—'], ['Trạng thái', <AdminStatusBadge status={post.status} />]]} /><div className="admin-inline-actions"><Link className="admin-button" to={`/post/${post.id}`}>Mở bài viết <ArrowUpRight size={15} /></Link>{onDelete && <button className="admin-button admin-button-danger-outline" onClick={onDelete}>Xóa bài viết</button>}</div></article>;
}
export function CommentPreview({ comment }: { comment: AdminComment }) {
  return <article className="admin-content-preview"><div className="admin-preview-meta"><Link to={`/u/${encodeURIComponent(comment.author.username)}`}>@{comment.author.username}</Link><span>{adminDate(comment.createdAt)}</span><AdminStatusBadge status={comment.status} /></div><PostMarkdown content={comment.content} />{comment.attachments?.map(file => httpUrl(file.url) && <a key={file.id} href={httpUrl(file.url)} target="_blank" rel="noopener noreferrer" className="admin-comment-attachment">{file.contentType.startsWith('image/') ? <img src={httpUrl(file.url)} alt={file.fileName} /> : file.fileName}</a>)}<Link className="admin-button" to={`/post/${comment.postId}`}>Xem bài viết gốc <ArrowUpRight size={15} /></Link></article>;
}
