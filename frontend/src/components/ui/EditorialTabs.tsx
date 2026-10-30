import React, { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useSettingsStore } from '../../store/useSettingsStore';

interface Props<T extends string> {
  label: string;
  options: { id: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  trailing?: React.ReactNode;
}

export default function EditorialTabs<T extends string>({ label, options, value, onChange, trailing }: Props<T>) {
  const id = useId();
  const reduced = useReducedMotion();
  const intensity = useSettingsStore((state) => state.settings.animationIntensity);
  const quiet = reduced || intensity !== 'full';
  return <nav className="feed-tabs" aria-label={label}>
    {options.map((option) => <button key={option.id} type="button" className={`feed-tab ${value === option.id ? 'is-selected' : ''}`}
      aria-pressed={value === option.id} onClick={() => onChange(option.id)}>
      {option.icon}{option.label}
      {value === option.id && <motion.span className="tab-indicator" layoutId={`tab-${id}`}
        transition={quiet ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 35 }} />}
    </button>)}
    {trailing && <span className="feed-count">{trailing}</span>}
  </nav>;
}
