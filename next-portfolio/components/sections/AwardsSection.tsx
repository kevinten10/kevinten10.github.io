'use client';

import { useI18n } from '@/providers/I18nProvider';
import SectionHeader from '@/components/ui/SectionHeader';

const HERO_AWARD = {
  year: '2021',
  labelKey: 'awards.hero.label',
  labelDefault: '队长',
  titleKey: 'awards.hero.title',
  titleDefault: '集团 Hackathon 金奖',
  projectKey: 'awards.hero.project',
  projectDefault: '《零成本 BFF 框架》',
};

const AWARD_CARDS = [
  { badge: '🥈', year: '2024', titleKey: 'awards.silver.title', titleDefault: '校招生竞赛集团亚军', projectKey: 'awards.silver.project', projectDefault: '《剧本旅游》', labelKey: 'awards.silver.label', labelDefault: '带队导师', accent: '#94A3B8' },
  { badge: '🥉', year: '2023', titleKey: 'awards.bronze.title', titleDefault: '集团 GPT Hackathon 铜奖', projectKey: 'awards.bronze.project', projectDefault: '《AI 旅行内容助手》', labelKey: 'awards.bronze.label', labelDefault: '队长', accent: '#D97706' },
  { badge: '🏅', year: '2022', titleKey: 'awards.finalist.title', titleDefault: '集团 Hackathon 入围奖', projectKey: 'awards.finalist.project', projectDefault: '《AI + VR 元宇宙旅游平台》', labelKey: 'awards.finalist.label', labelDefault: '队长', accent: '#22D3EE' },
  { badge: '⭐', year: '2024', titleKey: 'awards.outstanding.title', titleDefault: '国际部优秀项目奖', projectKey: 'awards.outstanding.project', projectDefault: '集团下一代跨渠道沟通平台', labelKey: 'awards.outstanding.label', labelDefault: '主导开发', accent: '#22D3EE' },
  { badge: '🎖️', year: '2020 · 2022 · 2023', titleKey: 'awards.annual.title', titleDefault: '集团年度程果奖', projectKey: 'awards.annual.project', projectDefault: '个人贡献奖 - 优秀奖（集团三等奖）', labelKey: 'awards.annual.label', labelDefault: '连续多年', accent: '#6366F1' },
  { badge: '🏛️', year: '2021', titleKey: 'awards.arch.title', titleDefault: '集团架构委员会优秀个人提名', projectKey: 'awards.arch.project', projectDefault: '集团混合云中间件', labelKey: 'awards.arch.label', labelDefault: '核心架构师', accent: '#8B5CF6' },
];

const SPOTLIGHT_CARD = {
  badge: '🌐',
  year: '2022',
  titleKey: 'awards.spotlight.title',
  titleDefault: 'Trip.com Group Employee Spotlight',
  projectKey: 'awards.spotlight.project',
  projectDefault: '集团官方 LinkedIn 员工专访',
  labelKey: 'awards.spotlight.label',
  labelDefault: '企业官方认可',
  href: 'https://www.linkedin.com/feed/update/urn:li:activity:6925748725587853312/',
};

export default function AwardsSection() {
  const { t } = useI18n();

  return (
    <section className="section section-spacious" id="awards">
      <div className="container">
        <SectionHeader idx="07" title={t('awards.title', '荣誉成就')} description="Awards & Recognitions" />

        <div className="awards-showcase">
          {/* Hero Award */}
          <div className="award-hero" style={{ '--accent': '#F59E0B' } as React.CSSProperties}>
            <div className="award-hero-glow"></div>
            <span className="award-hero-badge">🏆</span>
            <div className="award-hero-content">
              <div className="award-hero-meta">
                <span className="award-hero-year">{HERO_AWARD.year}</span>
                <span className="award-hero-label">{t(HERO_AWARD.labelKey, HERO_AWARD.labelDefault)}</span>
              </div>
              <h3 className="award-hero-title">{t(HERO_AWARD.titleKey, HERO_AWARD.titleDefault)}</h3>
              <p className="award-hero-project">{t(HERO_AWARD.projectKey, HERO_AWARD.projectDefault)}</p>
            </div>
          </div>

          {/* Awards Grid */}
          <div className="awards-grid">
            {AWARD_CARDS.map((card) => (
              <div key={card.badge + card.year} className="award-card" style={{ '--accent': card.accent } as React.CSSProperties}>
                <div className="award-card-head">
                  <span className="award-card-badge">{card.badge}</span>
                  <span className="award-card-year">{card.year}</span>
                </div>
                <h3 className="award-card-title">{t(card.titleKey, card.titleDefault)}</h3>
                <p className="award-card-project">{t(card.projectKey, card.projectDefault)}</p>
                <span className="award-card-label">{t(card.labelKey, card.labelDefault)}</span>
              </div>
            ))}

            {/* Spotlight Card — External Link */}
            <a href={SPOTLIGHT_CARD.href} target="_blank" rel="noopener noreferrer" className="award-card" style={{ '--accent': '#0A66C2' } as React.CSSProperties}>
              <div className="award-card-head">
                <span className="award-card-badge">{SPOTLIGHT_CARD.badge}</span>
                <span className="award-card-year">{SPOTLIGHT_CARD.year}</span>
              </div>
              <h3 className="award-card-title">{t(SPOTLIGHT_CARD.titleKey, SPOTLIGHT_CARD.titleDefault)}</h3>
              <p className="award-card-project">{t(SPOTLIGHT_CARD.projectKey, SPOTLIGHT_CARD.projectDefault)}</p>
              <span className="award-card-label">{t(SPOTLIGHT_CARD.labelKey, SPOTLIGHT_CARD.labelDefault)}</span>
            </a>
          </div>
        </div>

        {/* Achievement Badges */}
        <div className="achievement-badges">
          <div className="badge-group">
            <div className="badge-chip"><span>🏆</span> <strong>4+</strong> <span>{t('awards.badge.hackathon', 'Hackathon 奖项')}</span></div>
            <div className="badge-chip"><span>🎖️</span> <strong>4+</strong> <span>{t('awards.badge.annual', '年度集团奖项')}</span></div>
            <div className="badge-chip"><span>👥</span> <strong>700+</strong> <span>{t('awards.badge.audience', 'AI分享听众')}</span></div>
            <div className="badge-chip"><span>🎤</span> <strong>20+</strong> <span>{t('awards.badge.meetup', '技术meetup组织')}</span></div>
          </div>
          <div className="badge-group github-badges">
            <div className="badge-chip gh"><span>🦈</span> Pull Shark x2</div>
            <div className="badge-chip gh"><span>🌟</span> Starstruck</div>
            <div className="badge-chip gh"><span>🧊</span> Arctic Code Vault</div>
            <div className="badge-chip gh"><span>🎯</span> YOLO</div>
          </div>
        </div>
      </div>
    </section>
  );
}
