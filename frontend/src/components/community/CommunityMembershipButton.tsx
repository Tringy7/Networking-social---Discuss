import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Plus } from 'lucide-react';
import { Community } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import { useCommunityStore } from '../../store/useCommunityStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useToastStore } from '../../store/useToastStore';
import Button from '../ui/Button';

export default function CommunityMembershipButton({ community }: { community: Community }) {
  const navigate = useNavigate();
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const join = useCommunityStore((state) => state.joinCommunity);
  const leave = useCommunityStore((state) => state.leaveCommunity);
  const notify = useToastStore((state) => state.addToast);
  const intensity = useSettingsStore((state) => state.settings.animationIntensity);
  const reduced = useReducedMotion();
  const [pending, setPending] = useState(false);
  const joined = authenticated && community.currentUserRole !== 'NONE';
  const awaitingReview = authenticated && community.joinRequestPending;
  const label = joined ? 'Đã tham gia' : awaitingReview ? 'Đang chờ duyệt'
    : community.visibility === 'PRIVATE' ? 'Gửi yêu cầu tham gia' : 'Tham gia';
  const toggle = async () => {
    if (!authenticated) { notify('Đăng nhập để tham gia cộng đồng nhé.', 'info'); navigate('/login'); return; }
    if (pending) return;
    setPending(true);
    try {
      if (joined) {
        await leave(community.name);
        notify(`Đã rời ${community.displayName}`, 'info');
      } else {
        const awaitingApproval = await join(community.name);
        notify(awaitingApproval ? 'Đã gửi yêu cầu tham gia.' : `Chào mừng bạn đến với ${community.displayName}!`, 'success');
      }
    } catch (error) { notify(error instanceof Error ? error.message : 'Chưa thể cập nhật. Bạn thử lại nhé.', 'error'); }
    finally { setPending(false); }
  };
  return <Button className="membership-button" variant={joined ? 'secondary' : 'outline'} size="sm" isLoading={pending}
    onClick={toggle} disabled={awaitingReview} aria-pressed={joined} aria-label={`${joined ? 'Rời khỏi' : label} cộng đồng ${community.displayName}`}
    leftIcon={joined ? <Check size={14} /> : <Plus size={14} />}>
    <motion.span key={joined ? 'joined' : 'join'} initial={reduced || intensity !== 'full' ? false : { opacity: 0.5 }} animate={{ opacity: 1 }} transition={{ duration: 0.12 }}>{label}</motion.span>
  </Button>;
}
