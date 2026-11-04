import { useNavigate } from 'react-router-dom';
import { usePost } from '../../context/PostContext';
import { useAuth } from '../../context/AuthContext';
import VoteControl from './VoteControl';

export default function VoteButtons({ post, layout = 'vertical' }) {
  const { votePost, getUserVote } = usePost();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const currentVote = getUserVote(post.id);
  return <VoteControl score={post.voteScore} layout={layout}
    selected={currentVote === 1 ? 'UP' : currentVote === -1 ? 'DOWN' : null}
    onVote={(direction) => {
      if (!isAuthenticated) { navigate('/login'); return; }
      votePost(post.id, direction === 'UP' ? 1 : -1);
    }} />;
}
