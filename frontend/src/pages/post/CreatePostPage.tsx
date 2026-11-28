import { useNavigate, useSearchParams } from 'react-router-dom';
import PostComposer from '../../components/post/PostComposer';
import { postPath } from '../../utils/postPath';

export default function CreatePostPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const community = params.get('community') || undefined;
  const returnPath = community ? `/c/${encodeURIComponent(community)}` : '/';

  return <section className="post-create-page" aria-labelledby="post-create-title">
    <header className="post-create-header">
      <h1 id="post-create-title">Tạo bài viết</h1>
    </header>
    <PostComposer key={community || ''} initialCommunity={community}
      onCancel={() => navigate(returnPath, { replace: true })}
      onSaved={(post) => navigate(postPath(post), { replace: true })} />
  </section>;
}
