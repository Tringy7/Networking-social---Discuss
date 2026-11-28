import React, { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useSettingsStore } from '../../store/useSettingsStore';

interface Props<T extends string> {
  label: string;
  options: { id: NoInfer<T>; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (value: NoInfer<T>) => void;
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
      {value === option.id && <motion.span aria-hidden="true" className="tab-indicator"
        layoutId={quiet ? undefined : `tab-${id}`}
        transition={{ duration: quiet ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }} />}
    </button>)}
    {trailing && <span className="feed-count">{trailing}</span>}
  </nav>;
}
