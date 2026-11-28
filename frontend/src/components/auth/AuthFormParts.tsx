import React from 'react';
import { Link } from 'react-router-dom';
import { CircleAlert } from 'lucide-react';

export function AuthHeading({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return <header className="auth-heading"><h1>{title}</h1><p>{children}</p></header>;
}

export function AuthError({ message }: { message: string }) {
  if (!message) return null;
  return <div role="alert" className="auth-error"><CircleAlert size={18} aria-hidden="true" /><p>{message}</p></div>;
}

export function AuthDivider() {
  return <div className="auth-divider"><span>hoặc</span></div>;
}

export function AuthSwitch({ prompt, to, children }: { prompt: string; to: string; children: React.ReactNode }) {
  return <p className="auth-switch">{prompt}{' '}<Link to={to}>{children}</Link></p>;
}
