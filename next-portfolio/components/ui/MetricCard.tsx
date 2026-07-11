'use client';

import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useI18n } from '@/providers/I18nProvider';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

interface MetricCardProps {
  icon: string;
  value: number;
  suffix?: string;
  labelKey: string;
  labelZh: string;
  descKey: string;
  descZh: string;
  stagger: number;
}

export default function MetricCard({ icon, value, suffix, labelKey, labelZh, descKey, descZh, stagger }: MetricCardProps) {
  const { ref, isVisible } = useIntersectionObserver<HTMLDivElement>();
  const { t } = useI18n();
  return (
    <div ref={ref} className={`impact-metric animate-on-scroll stagger-${stagger}${isVisible ? ' is-visible' : ''}`}>
      <div className="metric-icon">{icon}</div>
      <div className="metric-value"><AnimatedCounter value={value} suffix={suffix} /></div>
      <div className="metric-label">{t(labelKey, labelZh)}</div>
      <div className="metric-desc">{t(descKey, descZh)}</div>
    </div>
  );
}
