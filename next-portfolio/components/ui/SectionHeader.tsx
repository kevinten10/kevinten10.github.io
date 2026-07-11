'use client';

import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface SectionHeaderProps {
  idx: string;
  title: string;
  description?: string;
}

export default function SectionHeader({ idx, title, description }: SectionHeaderProps) {
  const { ref, isVisible } = useIntersectionObserver<HTMLDivElement>();
  return (
    <div ref={ref} className={`section-header animate-on-scroll${isVisible ? ' is-visible' : ''}`}>
      <span className="section-idx">{idx}</span>
      <h2 className="section-title">{title}</h2>
      {description && <p className="section-description">{description}</p>}
    </div>
  );
}
