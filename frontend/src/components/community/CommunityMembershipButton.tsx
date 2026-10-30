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
  const joined = community.currentUserRole !== 'NONE';
  const toggle = async () => {
    if (!authenticated) { notify('Đăng nhập để tham gia cộng đồng nhé.', 'info'); navigate('/login'); return; }
    if (pending) return;
    setPending(true);
    try {
      if (joined) await leave(community.name);
      else await join(community.name);
      notify(joined ? `Đã rời ${community.displayName}` : `Chào mừng bạn đến với ${community.displayName}!`, joined ? 'info' : 'success');
    } catch (error) { notify(error instanceof Error ? error.message : 'Chưa thể cập nhật. Bạn thử lại nhé.', 'error'); }
    finally { setPending(false); }
  };
  return <Button className="membership-button" variant={joined ? 'secondary' : 'outline'} size="sm" isLoading={pending}
    onClick={toggle} aria-pressed={joined} aria-label={`${joined ? 'Rời khỏi' : 'Tham gia'} cộng đồng ${community.displayName}`}
    leftIcon={joined ? <Check size={14} /> : <Plus size={14} />}>
    <motion.span key={joined ? 'joined' : 'join'} initial={reduced || intensity !== 'full' ? false : { opacity: 0.5 }} animate={{ opacity: 1 }} transition={{ duration: 0.12 }}>{joined ? 'Đã tham gia' : 'Tham gia'}</motion.span>
  </Button>;
}
