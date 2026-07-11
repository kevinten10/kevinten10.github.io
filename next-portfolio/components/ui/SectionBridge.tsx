'use client';

export default function SectionBridge({ variant = 'dots' }: { variant?: 'dots' | 'diamond' }) {
  return (
    <div className="section-bridge" aria-hidden="true">
      <div className="bridge-line" />
      <div className={`bridge-accent bridge-accent--${variant}`}>
        {variant === 'dots' ? (
          <><span /><span /><span /></>
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12"><rect x="6" y="0" width="8.5" height="8.5" rx="1.5" transform="rotate(45 6 0)" fill="none" stroke="currentColor" strokeWidth="1" /></svg>
        )}
      </div>
      <div className="bridge-line" />
    </div>
  );
}
