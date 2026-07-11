'use client';

import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useI18n } from '@/providers/I18nProvider';
import SectionHeader from '@/components/ui/SectionHeader';

interface Experience {
  period: string;
  titleKey: string;
  titleZh: string;
  roleKey: string;
  roleZh: string;
  isNew?: boolean;
}

const EXPERIENCES: Experience[] = [
  { period: '2018.7 - 2023.5', titleKey: 'exp.mh.title', titleZh: 'Message Hub · 营销触达系统', roleKey: 'exp.mh.role', roleZh: 'Core Dev & Owner' },
  { period: '2021.7 - 2023.5', titleKey: 'exp.capa.title', titleZh: 'Capa · 混合云中间件', roleKey: 'exp.capa.role', roleZh: '核心架构师 & 主导开发' },
  { period: '2023.6 - 2026.3', titleKey: 'exp.mg.title', titleZh: 'Message Gateway · 企业消息平台', roleKey: 'exp.mg.role', roleZh: '核心开发者' },
  { period: '2025.2 - 2026.3', titleKey: 'exp.ai.title', titleZh: 'AI 探索与应用', roleKey: 'exp.ai.role', roleZh: 'AI-First 实践者' },
  { period: '2026.4 - Present', titleKey: 'exp.new.title', titleZh: 'AI Agent · 新征程', roleKey: 'exp.new.role', roleZh: 'AI Agent Developer', isNew: true },
];

export default function ExperienceSection() {
  const { t } = useI18n();
  return (
    <section className="section section-spacious" id="experience">
      <div className="container">
        <SectionHeader idx="02" title={t('exp.title', 'Work Experience')} description={t('exp.desc', '核心项目与技术成就')} />
        <div className="experience-timeline">
          {EXPERIENCES.map((exp, index) => (
            <ExperienceCard key={exp.titleKey} {...exp} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ExperienceCard({
  period,
  titleKey,
  titleZh,
  roleKey,
  roleZh,
  index,
  isNew,
}: Experience & { index: number }) {
  const { ref, isVisible } = useIntersectionObserver<HTMLDivElement>();
  const { t } = useI18n();
  return (
    <div ref={ref} className={`experience-card animate-on-scroll stagger-${(index % 3) + 1}${isVisible ? ' is-visible' : ''}`}>
      <div className="exp-period">{period}</div>
      {isNew && <span className="exp-new-badge">🚀</span>}
      <h3 className="exp-title">{t(titleKey, titleZh)}</h3>
      <div className="exp-role">{t(roleKey, roleZh)}</div>
    </div>
  );
}
