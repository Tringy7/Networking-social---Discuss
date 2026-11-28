import { useRef, useState } from 'react';
import VoteControl from '../post/VoteControl';
import { useNavigate } from 'react-router-dom';
import type { Comment } from '../../types';
import { usePostStore } from '../../store/usePostStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';

export default function CommentVotes({ comment }: { comment: Comment }) {
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);
  const vote = usePostStore((state) => state.voteComment);
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const addToast = useToastStore((state) => state.addToast);
  const navigate = useNavigate();
  const submit = async (type: 'UP' | 'DOWN') => {
    if (!authenticated) {
      addToast('Vui lòng đăng nhập để đánh giá bình luận', 'warning');
      navigate('/login');
      return;
    }
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    try { await vote(comment.postId, comment.id, comment.userVote === type ? null : type); }
    catch (error) { addToast(error instanceof Error ? error.message : 'Không thể cập nhật vote.', 'error'); }
    finally { inFlight.current = false; setPending(false); }
  };
  return <VoteControl subject="bình luận" disabled={comment.status !== 'VISIBLE'} score={comment.voteScore} selected={comment.userVote} pending={pending}
    onVote={(direction) => void submit(direction)} />;
}
