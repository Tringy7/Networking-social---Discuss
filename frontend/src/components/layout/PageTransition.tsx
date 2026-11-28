import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useSettingsStore } from '../../store/useSettingsStore';

/** Animate the rendered outlet, never delay navigation or remount on query changes. */
export default function PageTransition({ children, routeKey }: { children: React.ReactNode; routeKey?: string }) {
  const { pathname } = useLocation();
  const reduced = useReducedMotion();
  const intensity = useSettingsStore((state) => state.settings.animationIntensity);
  const quiet = reduced || intensity !== 'full';
  return (
    <motion.div key={routeKey ?? pathname} className="route-content"
      initial={quiet ? false : { opacity: 0.65, y: 7 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: quiet ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}
