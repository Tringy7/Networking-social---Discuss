import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Post } from '../../types';
import Avatar from '../ui/Avatar';
import { postPath } from '../../utils/postPath';
import { formatTimeAgo } from '../../utils/formatters';
import { httpUrl } from '../post/postUrls';

export default function SearchPostResult({ post }: { post: Post }) {
  const thumbnail = post.media?.find(item => item.type === 'IMAGE' && httpUrl(item.url));
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const excerpt = post.content.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/<[^>]*>/g, '')
    .replace(/^[#>]+\s*/gm, '').replace(/[*_`~]/g, '').replace(/\s+/g, ' ').trim();
  return <article className="search-post-result" aria-labelledby={`search-post-${post.id}`}>
    <div className="search-result-byline">
      <Link to={`/c/${encodeURIComponent(post.communityName)}`} className="search-result-community">
        <Avatar src={post.communityAvatar} alt={post.communityDisplayName || post.communityName} size="xs" />
        <span>c/{post.communityName}</span>
      </Link>
      <span aria-hidden="true">·</span><time dateTime={post.createdAt}>{formatTimeAgo(post.createdAt)}</time>
    </div>
    <div className="search-result-body">
      <div className="search-result-copy">
        <h3 id={`search-post-${post.id}`}><Link to={postPath(post)}>{post.title}</Link></h3>
        {excerpt && <p className="search-result-excerpt">{excerpt}</p>}
        <div className="search-result-stats">
          <Link to={`${postPath(post)}#comments`}>{post.commentCount.toLocaleString('vi-VN')} bình luận</Link></div>
      </div>
      {thumbnail && failedUrl !== thumbnail.url && <Link to={postPath(post)} className="search-result-thumbnail" aria-label={`Xem bài viết ${post.title}`}>
        <img src={thumbnail.url} alt={thumbnail.caption || ''} loading="lazy" onError={() => setFailedUrl(thumbnail.url)} />
      </Link>}
    </div>
  </article>;
}
