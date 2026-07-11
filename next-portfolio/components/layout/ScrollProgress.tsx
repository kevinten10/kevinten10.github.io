'use client';

import { useScrollPosition } from '@/hooks/useScrollPosition';

export default function ScrollProgress() {
  const { scrollY } = useScrollPosition();

  useEffect(() => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
    document.documentElement.style.setProperty('--scroll-progress', `${progress}%`);
  }, [scrollY]);

  return <div className="scroll-progress" aria-hidden="true" style={{ width: 'var(--scroll-progress, 0%)' }} />;
}

import { useEffect } from 'react';
