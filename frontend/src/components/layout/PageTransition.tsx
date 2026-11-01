import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useSettingsStore } from '../../store/useSettingsStore';

/** Animate the rendered outlet, never delay navigation or remount on query changes. */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const reduced = useReducedMotion();
  const intensity = useSettingsStore((state) => state.settings.animationIntensity);
  const quiet = reduced || intensity !== 'full';
  return (
    <motion.div key={pathname} className="route-content"
      initial={quiet ? false : { opacity: 0.8 }} animate={{ opacity: 1 }}
      transition={{ duration: quiet ? 0 : 0.12, ease: 'easeOut' }}>
      {children}
    </motion.div>
  );
}
