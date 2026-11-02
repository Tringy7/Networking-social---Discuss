import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUp, Camera, Code2, MessageCircle, Music2 } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';

/** Static product illustration. Counts describe this sample post, never platform usage. */
export default function CommunityIllustration() {
  const reducedMotion = useReducedMotion();
  const intensity = useSettingsStore((state) => state.settings.animationIntensity);
  const quiet = reducedMotion || intensity !== 'full';
  const entrance = (delay: number) => ({
    initial: quiet ? false as const : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, delay: quiet ? 0 : delay, ease: 'easeOut' as const },
  });

  return (
    <figure className="auth-illustration" aria-label="Minh họa một cuộc thảo luận và các cộng đồng theo sở thích">
      <div className="auth-community-scene" data-ui="community-illustration">
        <motion.div className="auth-mini-community auth-mini-community--photo" {...entrance(0.08)}>
          <span className="auth-community-avatar auth-community-avatar--photo"><Camera size={20} aria-hidden="true" /></span>
          <div><strong>c/nhiepanh</strong><span>Góc nhìn qua ống kính</span></div>
        </motion.div>

        <motion.article className="auth-sample-post" {...entrance(0.16)}>
          <div className="auth-sample-byline">
            <span className="auth-community-avatar auth-community-avatar--code"><Code2 size={22} aria-hidden="true" /></span>
            <div><strong>c/laptrinh</strong><span>Đăng bởi minhng · 2 giờ trước</span></div>
          </div>
          <h2>Dự án đầu tay của bạn<br className="auth-post-break" /> bắt đầu từ đâu?</h2>
          <p>Một ý tưởng nhỏ, vài dòng code và rất nhiều lần thử. Bạn ước mình biết điều gì khi mới bắt đầu?</p>
          <div className="auth-sample-stats">
            <span><ArrowUp size={16} aria-hidden="true" />128 lượt ủng hộ</span>
            <span><MessageCircle size={16} aria-hidden="true" />24 bình luận</span>
          </div>
        </motion.article>

        <motion.div className="auth-mini-community auth-mini-community--music" {...entrance(0.24)}>
          <span className="auth-community-avatar auth-community-avatar--music"><Music2 size={20} aria-hidden="true" /></span>
          <div><strong>c/amnhac</strong><span>Chung một nhịp điệu</span></div>
        </motion.div>
      </div>
      <figcaption>Một góc cộng đồng · Nội dung minh họa</figcaption>
    </figure>
  );
}
