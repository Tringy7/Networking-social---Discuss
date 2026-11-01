import React from 'react';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  description?: string;
  actions?: ReactNode;
  variant?: 'compact' | 'default';
}

export default function PageHeader({ title, description, actions, variant = 'default' }: Props) {
  return <header className={`page-header page-header--${variant}`}>
    <div className="page-header-copy"><h1>{title}</h1>{description && <p>{description}</p>}</div>
    {actions && <div className="page-header-actions">{actions}</div>}
  </header>;
}
