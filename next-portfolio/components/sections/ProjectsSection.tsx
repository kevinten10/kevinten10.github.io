'use client';

import SectionHeader from '@/components/ui/SectionHeader';
import { useI18n } from '@/providers/I18nProvider';

// Placeholder — full project data with GitHub stats will be added later
const PROJECTS = [
  { name: 'Capa', desc: 'Multi-runtime SDK for hybrid cloud', tags: ['Java', 'Multi-Runtime', 'Dapr'], github: 'https://github.com/intellimoo/capa' },
  { name: 'OpenOctopus', desc: 'Realm-native life intelligence system', tags: ['TypeScript', 'AI Agent', 'MCP'], github: 'https://github.com/kevinten10/OpenOctopus' },
  { name: 'Apache Dubbo', desc: 'High-performance RPC framework', tags: ['Java', 'RPC', 'Microservices'], github: 'https://github.com/apache/dubbo' },
  { name: 'Dapr', desc: 'Portable runtime for distributed apps', tags: ['Go', 'Runtime', 'Cloud Native'], github: 'https://github.com/dapr/dapr' },
  { name: 'Layotto', desc: 'Cloud-native application runtime', tags: ['Go', 'Runtime', 'Mecha'], github: 'https://github.com/mosn/layotto' },
];

export default function ProjectsSection() {
  const { t } = useI18n();
  return (
    <section className="section section-spacious section-alt" id="projects">
      <div className="container">
        <SectionHeader idx="03" title="Projects" description={t('proj.desc', '精选开源项目与贡献')} />
        <div className="projects-grid">
          {PROJECTS.map((proj) => (
            <a key={proj.name} href={proj.github} target="_blank" rel="noopener noreferrer" className="project-card">
              <h3 className="project-name">{proj.name}</h3>
              <p className="project-desc">{t(`proj.${proj.name.toLowerCase()}.desc`, proj.desc)}</p>
              <div className="project-tags">
                {proj.tags.map(tag => <span key={tag} className="tech-tag">{tag}</span>)}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
