import { ArrowBigUp, ArrowBigDown, LoaderCircle } from 'lucide-react';

interface VoteControlProps {
  subject?: 'bài viết' | 'bình luận';
  disabled?: boolean;
  score: number;
  selected: 'UP' | 'DOWN' | null;
  pending?: boolean;
  layout?: 'horizontal' | 'vertical';
  onVote: (direction: 'UP' | 'DOWN') => void;
}

/** Shared visual control for post cards and post details. */
export default function VoteControl({ score, selected, pending = false, disabled = false, subject = 'bài viết', layout = 'horizontal', onVote }: VoteControlProps) {
  const tone = selected === 'UP' ? 'up' : selected === 'DOWN' ? 'down' : 'neutral';
  return <div className={`post-votes post-votes--${layout}`} data-vote={tone}
    role="group" aria-label={`Đánh giá ${subject}`} aria-busy={pending}
    onClick={(event) => event.stopPropagation()}>
    <button type="button" className="post-votes__button post-votes__button--up"
      disabled={pending || disabled} aria-pressed={selected === 'UP'}
      aria-label={selected === 'UP' ? 'Bỏ upvote' : `Upvote ${subject}`}
      title={selected === 'UP' ? 'Bỏ upvote' : `Upvote · ${subject} hữu ích`} onClick={() => onVote('UP')}>
      <ArrowBigUp aria-hidden="true" fill={selected === 'UP' ? 'currentColor' : 'none'} />
    </button>
    <span className="post-votes__score" data-negative={score < 0 || undefined}
      aria-live="polite" aria-atomic="true" aria-label={`${score} điểm`}
      title={`${score.toLocaleString('vi-VN')} điểm · Upvote trừ downvote`}>
      {score.toLocaleString('vi-VN')}
    </span>
    <button type="button" className="post-votes__button post-votes__button--down"
      disabled={pending || disabled} aria-pressed={selected === 'DOWN'}
      aria-label={selected === 'DOWN' ? 'Bỏ downvote' : `Downvote ${subject}`}
      title={selected === 'DOWN' ? 'Bỏ downvote' : `Downvote · ${subject} chưa hữu ích`} onClick={() => onVote('DOWN')}>
      <ArrowBigDown aria-hidden="true" fill={selected === 'DOWN' ? 'currentColor' : 'none'} />
    </button>
    {pending && <span className="post-votes__pending" role="status"><LoaderCircle aria-hidden="true" /><span className="sr-only">Đang cập nhật vote</span></span>}
  </div>;
}
