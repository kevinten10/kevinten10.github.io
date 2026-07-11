'use client';

import { useI18n } from '@/providers/I18nProvider';
import SectionHeader from '@/components/ui/SectionHeader';

const FEATURED_ARTICLE = {
  href: 'https://mp.weixin.qq.com/s/gQYZGQVwqWF3LOH51JAOwg',
  accent: '#EC4899',
  tag: 'Reactive',
  titleKey: 'writing.reactive.title',
  titleDefault: 'Reactive模式在某OTA消息推送平台上的实践',
  excerptKey: 'writing.reactive.excerpt',
  excerptDefault: '基于实际业务，分享 Reactive 模式在消息触达平台中的落地与收益。',
};

const ARTICLES = [
  {
    href: 'https://capa-cloud.github.io/capa.io/blog/2022/01/18/capa-mecha-sdk-of-cloud-application-api/',
    accent: '#8B5CF6',
    tag: 'Multi-Runtime',
    title: 'Capa: Mecha SDK of Cloud Application Api',
    excerptKey: 'writing.capa.excerpt',
    excerptDefault: '介绍 Capa/Mecha SDK 的设计理念与跨云运行时实践。',
  },
  {
    href: 'https://www.linkedin.com/pulse/',
    accent: '#0A66C2',
    tag: 'LinkedIn Pulse',
    title: 'For a better world，在携程一起追逐太阳吧',
    excerptDefault: '从国际业务后端开发经历出发，分享在携程做技术、旅行与成长的真实体验。',
  },
  {
    href: 'https://aitools.rxcloud.group',
    accent: '#F59E0B',
    tag: 'AI Tools',
    titleKey: 'writing.aitools.title',
    titleDefault: 'AI 开发工具选型指南',
    excerptKey: 'writing.aitools.excerpt',
    excerptDefault: '涵盖 IDE、LLM、插件等 30+ 款 AI 开发工具的全面 SWOT 分析与实战数据。',
  },
  {
    href: 'https://openoctopus.club',
    accent: '#22D3EE',
    tag: 'OpenOctopus',
    title: 'OpenOctopus: Realm-native 生活智能体系统',
    excerptKey: 'writing.octopus.excerpt',
    excerptDefault: '按领域组织生活，将万物召唤为具有记忆与个性的 AI Agent。项目官网与设计理念。',
  },
  {
    href: 'https://fanqienovel.com/page/7610459214112115736',
    accent: '#EF4444',
    tag: 'AI Creative',
    titleKey: 'writing.dao.title',
    titleDefault: '编译天道 · AI 修仙小说',
    excerptKey: 'writing.dao.excerpt',
    excerptDefault: '程序员修仙世界观，天道即源码。AI 辅助创作的奇幻修真小说，番茄小说连载中。',
  },
];

const ArrowSVG = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 12L12 4M12 4H5M12 4v7"/></svg>
);

export default function WritingSection() {
  const { t } = useI18n();

  return (
    <section className="section section-spacious section-alt" id="writing">
      <div className="container">
        <SectionHeader idx="08" title={t('writing.title', '发表文章')} description={t('writing.desc', '技术文章、实践总结与职业分享')} />

        <div className="articles-showcase">
          {/* Featured Article */}
          <a href={FEATURED_ARTICLE.href} target="_blank" rel="noopener noreferrer" className="article-featured" style={{ '--accent': FEATURED_ARTICLE.accent } as React.CSSProperties}>
            <div className="article-featured-glow"></div>
            <span className="article-tag">{FEATURED_ARTICLE.tag}</span>
            <h3 className="article-featured-title">{t(FEATURED_ARTICLE.titleKey, FEATURED_ARTICLE.titleDefault)}</h3>
            <p className="article-featured-excerpt">{t(FEATURED_ARTICLE.excerptKey, FEATURED_ARTICLE.excerptDefault)}</p>
            <span className="article-arrow"><ArrowSVG /></span>
          </a>

          {/* Articles Grid */}
          <div className="articles-grid">
            {ARTICLES.map((article) => (
              <a key={article.href} href={article.href} target="_blank" rel="noopener noreferrer" className="article-card" style={{ '--accent': article.accent } as React.CSSProperties}>
                <span className="article-tag">{article.tag}</span>
                <h3 className="article-card-title">{article.titleKey ? t(article.titleKey, article.titleDefault || article.title) : article.title}</h3>
                <p className="article-card-excerpt">{article.excerptKey ? t(article.excerptKey, article.excerptDefault) : article.excerptDefault}</p>
                <span className="article-arrow"><ArrowSVG /></span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
