'use client';

import { useI18n } from '@/providers/I18nProvider';
import SectionHeader from '@/components/ui/SectionHeader';

const PERSONAL_PROJECTS = [
  {
    title: 'VRML',
    href: 'https://github.com/project-vrml/vrml',
    accent: '#3B82F6',
    descKey: 'contrib.vrml.desc',
    descDefault: 'Java常用函数式拓展工具集合，提供监控埋点、日志组件、网络请求代理等工具',
    role: 'Project Lead',
    lang: 'Java',
    langColor: 'var(--color-java)',
  },
  {
    title: 'Capa',
    href: 'https://github.com/capa-cloud/capa-java',
    accent: '#8B5CF6',
    descKey: 'contrib.capa.desc',
    descDefault: 'Mecha SDK 实现 "write once, run anywhere"，让 Java 应用具备跨云和混合云运行能力',
    role: 'Lead & Core Architect',
    lang: 'Java',
    langColor: 'var(--color-java)',
  },
  {
    title: 'OpenOctopus',
    href: 'https://github.com/open-octopus/openoctopus',
    accent: '#22D3EE',
    descKey: 'contrib.octopus.desc',
    descDefault: 'Realm-native 生活智能体系统，按领域组织生活，召唤万物为 AI Agent',
    role: 'Creator & Lead',
    lang: 'TypeScript',
    langColor: 'var(--color-typescript)',
  },
  {
    title: 'AI Tools',
    href: 'https://github.com/ava-agent/ai-tools',
    accent: '#F59E0B',
    descKey: 'contrib.aitools.desc',
    descDefault: 'AI 开发工具选型指南，涵盖 30+ 款工具的 SWOT 分析与实战数据',
    role: 'Creator & Lead',
    lang: 'JavaScript',
    langColor: 'var(--color-javascript)',
  },
];

const MAJOR_CONTRIBUTIONS = [
  {
    title: 'Apache Dubbo',
    href: 'https://github.com/apache/dubbo',
    accent: '#F97316',
    descKey: 'contrib.dubbo.desc',
    descDefault: '优化 Invoker 链路，提升框架面向对象设计',
    role: 'Contributor · 41k+ Stars',
  },
  {
    title: 'Dapr',
    href: 'https://github.com/dapr/dapr',
    accent: '#22C55E',
    descKey: 'contrib.dapr.desc',
    descDefault: 'api-sig Co-Chair，推动 Multi-Runtime 生态',
    role: 'Co-Chair · CNCF · 25k+ Stars',
  },
  {
    title: 'Layotto',
    href: 'https://github.com/mosn/layotto',
    accent: '#8B5CF6',
    descKey: 'contrib.layotto.desc',
    descDefault: 'Reactive Java-SDK 编写，多项 API 提案',
    role: 'Member · 852 Stars',
  },
  {
    title: 'Reactor-core',
    href: 'https://github.com/reactor/reactor-core',
    accent: '#00B4AB',
    descKey: 'contrib.reactor.desc',
    descDefault: '响应式编程核心库代码贡献',
    role: 'Contributor',
  },
];

export default function ContributionsSection() {
  const { t } = useI18n();

  return (
    <section className="section section-spacious section-alt" id="contributions">
      <div className="container">
        <SectionHeader idx="06" title="Open Source Contributions" description={t('contrib.desc', '开源社区贡献与项目')} />

        <div className="contributions-enhanced">
          {/* Personal Projects */}
          <div className="contrib-section">
            <div className="contrib-section-label">
              <span className="contrib-label-icon">◆</span>
              <span>{t('contrib.personal', '个人项目')}</span>
              <span className="contrib-label-line"></span>
            </div>
            <div className="project-tiles">
              {PERSONAL_PROJECTS.map((proj) => (
                <a key={proj.title} href={proj.href} target="_blank" rel="noopener noreferrer" className="project-tile" style={{ '--accent': proj.accent } as React.CSSProperties}>
                  <div className="tile-accent"></div>
                  <div className="tile-body">
                    <div className="tile-head">
                      <h4 className="tile-title">{proj.title}</h4>
                      <span className="tile-arrow">→</span>
                    </div>
                    <p className="tile-desc">{t(proj.descKey, proj.descDefault)}</p>
                    <div className="tile-footer">
                      <span className="tile-role">{proj.role}</span>
                      <span className="tile-lang"><span className="lang-dot" style={{ background: proj.langColor }}></span>{proj.lang}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Major Contributions */}
          <div className="contrib-section">
            <div className="contrib-section-label">
              <span className="contrib-label-icon">◇</span>
              <span>{t('contrib.major', '主要贡献')}</span>
              <span className="contrib-label-line"></span>
            </div>
            <div className="contrib-river">
              {MAJOR_CONTRIBUTIONS.map((contrib, i) => (
                <span key={contrib.title} style={{ display: 'contents' }}>
                  <a href={contrib.href} target="_blank" rel="noopener noreferrer" className="river-node" style={{ '--accent': contrib.accent } as React.CSSProperties}>
                    <div className="river-content">
                      <h4 className="river-title">{contrib.title}</h4>
                      <p className="river-desc">{t(contrib.descKey, contrib.descDefault)}</p>
                      <span className="river-role">{contrib.role}</span>
                    </div>
                  </a>
                  {i < MAJOR_CONTRIBUTIONS.length - 1 && (
                    <div className="river-connector">
                      <svg width="40" height="2" viewBox="0 0 40 2"><line x1="0" y1="1" x2="40" y2="1" stroke="currentColor" strokeDasharray="4 4" strokeWidth="1.5"/></svg>
                    </div>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Stats Banner */}
          <div className="contrib-stats-banner">
            <div className="contrib-stat">
              <span className="contrib-stat-value">5+</span>
              <span className="contrib-stat-label">API Proposals</span>
            </div>
            <div className="contrib-stat-divider"></div>
            <div className="contrib-stat">
              <span className="contrib-stat-value">30+</span>
              <span className="contrib-stat-label">Open Source Projects</span>
            </div>
            <div className="contrib-stat-divider"></div>
            <div className="contrib-stat">
              <span className="contrib-stat-value">1.4k+</span>
              <span className="contrib-stat-label">Stars Earned</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
