import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useSettingsStore } from '../../store/useSettingsStore';

/** Animate the rendered outlet, never delay navigation or remount on query changes. */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const reduced = useReducedMotion();
  const intensity = useSettingsStore((state) => state.settings.animationIntensity);
  const settingsRoute = pathname === '/settings' || pathname.startsWith('/settings/');
  const quiet = settingsRoute || reduced || intensity !== 'full';
  return (
    <motion.div key={settingsRoute ? "/settings" : pathname} className="route-content"
      initial={quiet ? false : { opacity: 0.85, y: 3 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: quiet ? 0 : 0.18, ease: 'easeOut' }}>
      {children}
    </motion.div>
  );
}
