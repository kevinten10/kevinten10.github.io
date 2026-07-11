'use client';

import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useI18n } from '@/providers/I18nProvider';
import SectionHeader from '@/components/ui/SectionHeader';

const SKILLS = {
  expert: [
    { name: 'AI Agents', hue: 265, sat: '80%', delay: '0s', driftX: '10px', driftY: '-10px', dur: '7s' },
    { name: 'LLM', hue: 280, sat: '70%', delay: '0.3s', driftX: '-12px', driftY: '8px', dur: '8s' },
    { name: 'Java', hue: 38, sat: '92%', delay: '0.6s', driftX: '8px', driftY: '-12px', dur: '9s' },
    { name: 'Spring Boot', hue: 100, sat: '52%', delay: '0.9s', driftX: '-14px', driftY: '6px', dur: '7.5s' },
    { name: 'Distributed Systems', hue: 220, sat: '80%', delay: '1.2s', driftX: '6px', driftY: '10px', dur: '8.5s' },
    { name: 'Reactive', hue: 330, sat: '75%', delay: '1.5s', driftX: '-8px', driftY: '-14px', dur: '9.5s' },
  ],
  advanced: [
    { name: 'MCP', hue: 330, sat: '80%', delay: '0.1s', driftX: '-6px', driftY: '10px', dur: '7s' },
    { name: 'RAG', hue: 160, sat: '75%', delay: '0.3s', driftX: '10px', driftY: '-6px', dur: '8s' },
    { name: 'Dify', hue: 240, sat: '75%', delay: '0.5s', driftX: '-12px', driftY: '8px', dur: '9s' },
    { name: 'Prompt Engineering', hue: 200, sat: '70%', delay: '0.7s', driftX: '8px', driftY: '12px', dur: '7.5s' },
    { name: 'Fine-tuning', hue: 300, sat: '65%', delay: '0.9s', driftX: '-10px', driftY: '-10px', dur: '8.5s' },
    { name: 'Python', hue: 215, sat: '60%', delay: '1.1s', driftX: '14px', driftY: '4px', dur: '9.5s' },
    { name: 'Apache Dubbo', hue: 24, sat: '90%', delay: '1.3s', driftX: '-4px', driftY: '-12px', dur: '7s' },
    { name: 'Netty', hue: 40, sat: '88%', delay: '1.5s', driftX: '12px', driftY: '8px', dur: '8s' },
    { name: 'Golang', hue: 190, sat: '100%', delay: '0.2s', driftX: '-8px', driftY: '6px', dur: '9s' },
    { name: 'Kubernetes', hue: 225, sat: '78%', delay: '0.4s', driftX: '6px', driftY: '-8px', dur: '7.5s' },
    { name: 'Service Mesh', hue: 185, sat: '60%', delay: '0.6s', driftX: '-10px', driftY: '10px', dur: '8.5s' },
  ],
  proficient: [
    { name: 'Claude Code', hue: 180, sat: '55%', delay: '0.15s', driftX: '10px', driftY: '6px', dur: '8s' },
    { name: 'LangChain', hue: 145, sat: '60%', delay: '0.45s', driftX: '-6px', driftY: '-10px', dur: '9s' },
    { name: 'Agentic Workflow', hue: 25, sat: '70%', delay: '0.75s', driftX: '8px', driftY: '12px', dur: '7.5s' },
    { name: 'Dapr', hue: 140, sat: '70%', delay: '1.05s', driftX: '-12px', driftY: '-4px', dur: '8.5s' },
    { name: 'Layotto', hue: 265, sat: '65%', delay: '1.35s', driftX: '4px', driftY: '8px', dur: '9.5s' },
    { name: 'Envoy', hue: 235, sat: '55%', delay: '0.25s', driftX: '-8px', driftY: '10px', dur: '7s' },
    { name: 'Docker', hue: 210, sat: '85%', delay: '0.55s', driftX: '12px', driftY: '-6px', dur: '8s' },
    { name: 'Kafka', hue: 200, sat: '40%', delay: '0.85s', driftX: '-10px', driftY: '4px', dur: '9s' },
    { name: 'MySQL', hue: 210, sat: '55%', delay: '1.15s', driftX: '6px', driftY: '-12px', dur: '7.5s' },
    { name: 'Redis', hue: 0, sat: '70%', delay: '1.45s', driftX: '-14px', driftY: '8px', dur: '8.5s' },
    { name: 'ClickHouse', hue: 50, sat: '60%', delay: '0.35s', driftX: '10px', driftY: '10px', dur: '9.5s' },
    { name: 'Elasticsearch', hue: 170, sat: '50%', delay: '0.65s', driftX: '-6px', driftY: '-8px', dur: '7s' },
    { name: 'Observability', hue: 200, sat: '45%', delay: '0.95s', driftX: '12px', driftY: '8px', dur: '8s' },
    { name: 'Prometheus', hue: 10, sat: '70%', delay: '1.25s', driftX: '-8px', driftY: '6px', dur: '9s' },
    { name: 'Grafana', hue: 30, sat: '80%', delay: '0.05s', driftX: '6px', driftY: '-8px', dur: '7.5s' },
    { name: 'GitLab CI', hue: 25, sat: '65%', delay: '0.5s', driftX: '-6px', driftY: '-8px', dur: '8.5s' },
  ],
  familiar: [
    { name: 'JavaScript', hue: 52, sat: '90%', delay: '0.4s', driftX: '8px', driftY: '6px', dur: '8s' },
    { name: 'Node.js', hue: 120, sat: '45%', delay: '0.8s', driftX: '-10px', driftY: '-6px', dur: '9s' },
    { name: 'gRPC', hue: 220, sat: '65%', delay: '1.2s', driftX: '6px', driftY: '10px', dur: '7.5s' },
    { name: 'WebAssembly', hue: 260, sat: '55%', delay: '0.6s', driftX: '-8px', driftY: '8px', dur: '8.5s' },
    { name: 'Workflow', hue: 180, sat: '40%', delay: '1.0s', driftX: '12px', driftY: '-10px', dur: '9.5s' },
  ],
  practice: [
    { name: 'DDD', hue: 220, sat: '80%', delay: '0.3s', driftX: '-6px', driftY: '12px', dur: '8s' },
    { name: 'Reactive', hue: 330, sat: '75%', delay: '0.7s', driftX: '10px', driftY: '-8px', dur: '9s' },
    { name: 'Design Patterns', hue: 210, sat: '30%', delay: '1.1s', driftX: '-12px', driftY: '4px', dur: '7.5s' },
    { name: 'Chaos Engineering', hue: 0, sat: '65%', delay: '1.5s', driftX: '8px', driftY: '10px', dur: '8.5s' },
  ],
};

export default function TechSection() {
  const { ref, isVisible } = useIntersectionObserver<HTMLElement>();
  const { t } = useI18n();

  return (
    <section ref={ref} className={`section section-spacious${isVisible ? ' is-visible' : ''}`} id="tech">
      <div className="container">
        <SectionHeader idx="04" title="Tech Stack" description={t('tech.desc', '核心技术能力与专业领域')} />

        <div className="skill-galaxy" aria-label="Technical skills visualization">
          <div className="skill-galaxy-bg"></div>
          <div className="skill-galaxy-cloud">
            {(Object.entries(SKILLS) as [string, typeof SKILLS.expert][]).map(([level, skills]) =>
              skills.map((skill) => (
                <span
                  key={`${level}-${skill.name}`}
                  className={`skill-node skill-${level}`}
                  data-level={level}
                  style={{
                    '--hue': skill.hue,
                    '--sat': skill.sat,
                    '--delay': skill.delay,
                    '--drift-x': skill.driftX,
                    '--drift-y': skill.driftY,
                    '--dur': skill.dur,
                  } as React.CSSProperties}
                >
                  {skill.name}
                </span>
              ))
            )}
          </div>

          <div className="skill-galaxy-legend">
            <span className="legend-item"><span className="legend-dot expert-dot"></span><span>{t('tech.legend.expert', 'Expert 核心专长')}</span></span>
            <span className="legend-item"><span className="legend-dot advanced-dot"></span><span>{t('tech.legend.advanced', 'Advanced 精通')}</span></span>
            <span className="legend-item"><span className="legend-dot proficient-dot"></span><span>{t('tech.legend.proficient', 'Proficient 熟练')}</span></span>
            <span className="legend-item"><span className="legend-dot familiar-dot"></span><span>{t('tech.legend.familiar', 'Familiar 了解')}</span></span>
            <span className="legend-item"><span className="legend-dot practice-dot"></span><span>{t('tech.legend.practice', 'Practices 实践')}</span></span>
          </div>
        </div>
      </div>
    </section>
  );
}
