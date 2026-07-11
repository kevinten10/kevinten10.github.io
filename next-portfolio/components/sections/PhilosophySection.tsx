'use client';

import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

export default function PhilosophySection() {
  const { ref, isVisible } = useIntersectionObserver<HTMLElement>();
  const { ref: ref2, isVisible: isVis2 } = useIntersectionObserver<HTMLDivElement>();
  return (
    <section className="philosophy-section" aria-label="Architecture Philosophy" ref={ref}>
      <div className="container">
        <div className={`philosophy-content animate-on-scroll${isVisible ? ' is-visible' : ''}`}>
          <blockquote className="philosophy-manifesto">
            <span className="philosophy-label">Architecture Philosophy</span>
            <p className="philosophy-text">
              I believe <strong className="philosophy-highlight">software should be written once and run anywhere</strong> — middleware should be invisible, runtimes should collaborate, and <strong className="philosophy-highlight">agents should think for themselves</strong>.
            </p>
          </blockquote>
          <div ref={ref2} className={`career-timeline animate-on-scroll stagger-2${isVis2 ? ' is-visible' : ''}`}>
            <div className="timeline-track"><div className="timeline-fill" /></div>
            <div className="timeline-era" style={{ '--accent': '#10B981' } as React.CSSProperties}><div className="timeline-marker" /><span className="timeline-year">2018</span><span className="timeline-domain">IoT</span></div>
            <div className="timeline-era" style={{ '--accent': '#3B82F6' } as React.CSSProperties}><div className="timeline-marker" /><span className="timeline-year">2021</span><span className="timeline-domain">Cloud Native</span></div>
            <div className="timeline-era" style={{ '--accent': '#8B5CF6' } as React.CSSProperties}><div className="timeline-marker" /><span className="timeline-year">2023</span><span className="timeline-domain">Distributed</span></div>
            <div className="timeline-era" style={{ '--accent': '#F59E0B' } as React.CSSProperties}><div className="timeline-marker" /><span className="timeline-year">2025</span><span className="timeline-domain">AI Native</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}
