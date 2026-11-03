import { useRef, useState } from 'react';
import VoteControl from './VoteControl';
import { useNavigate } from 'react-router-dom';
import type { Post } from '../../types';
import { usePostStore } from '../../store/usePostStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';

export default function PostVotes({ post }: { post: Post }) {
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);
  const vote = usePostStore((state) => state.vote);
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const addToast = useToastStore((state) => state.addToast);
  const navigate = useNavigate();
  const submit = async (type: 'UP' | 'DOWN') => {
    if (!authenticated) {
      addToast('Vui lòng đăng nhập để vote bài viết', 'warning');
      navigate('/login');
      return;
    }
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    try { await vote(post.id, post.userVote === type ? null : type); }
    catch (error) { addToast(error instanceof Error ? error.message : 'Không thể cập nhật vote.', 'error'); }
    finally { inFlight.current = false; setPending(false); }
  };
  return <VoteControl score={post.voteScore} selected={post.userVote} pending={pending}
    onVote={(direction) => void submit(direction)} />;
}
