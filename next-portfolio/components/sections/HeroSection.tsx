'use client';

import { useState } from 'react';
import { useI18n } from '@/providers/I18nProvider';
import ParticleCanvas from '@/components/ui/ParticleCanvas';

const SOCIAL_GROUPS = [
  {
    labelKey: 'social.dev',
    labelZh: 'Dev & AI',
    links: [
      { name: 'GitHub', url: 'https://github.com/kevinten10', brand: '#E6EDF3', icon: 'github' },
      { name: 'HuggingFace', url: 'https://huggingface.co/IKUN-LLM', brand: '#FFD21E', icon: 'huggingface' },
      { name: 'Product Hunt', url: 'https://www.producthunt.com/@ten_wang', brand: '#DA552F', icon: 'producthunt' },
    ],
  },
  {
    labelKey: 'social.blog',
    labelZh: 'Blog & Writing',
    links: [
      { name: 'Medium', url: 'https://medium.com/@wshten', brand: '#FFFFFF', icon: 'medium' },
      { name: 'DEV.to', url: 'https://dev.to/kevinten10', brand: '#A8B2D1', icon: 'devto' },
      { name: '掘金', url: 'https://juejin.cn/user/3350967171951912', brand: '#1E80FF', icon: 'juejin' },
      { name: 'CSDN', url: 'https://blog.csdn.net/wsh596823919', brand: '#FC5531', icon: 'csdn' },
      { name: '知乎', url: 'https://www.zhihu.com/people/wang-shi-hao-93-9', brand: '#0066FF', icon: 'zhihu' },
      { name: 'Moltbook', url: 'https://www.moltbook.com/u/LuckyPuppy', brand: '#FF6B35', icon: 'moltbook' },
    ],
  },
  {
    labelKey: 'social.social',
    labelZh: 'Social',
    links: [
      { name: 'X', url: 'https://x.com/kevinten1024', brand: '#E7E9EA', icon: 'x' },
      { name: 'LinkedIn', url: 'https://www.linkedin.com/in/kevinten', brand: '#0A66C2', icon: 'linkedin' },
      { name: 'Bluesky', url: 'https://bsky.app/profile/kevinten10.bsky.social', brand: '#0085FF', icon: 'bluesky' },
      { name: '微信公众号', url: '', brand: '#07C160', icon: 'wechat' },
      { name: '小红书', url: 'https://www.xiaohongshu.com/user/profile/5beeb71fe4873800017463fa', brand: '#FF2442', icon: 'xiaohongshu' },
      { name: '抖音', url: 'https://www.douyin.com/user/MS4wLjABAAAAvJHfd8N6myG3RyTR480KNC3J0bqmXwd_263-MZksxzU', brand: '#FE2C55', icon: 'douyin' },
      { name: 'TikTok', url: 'https://www.tiktok.com/@kevinten1024', brand: '#00F2EA', icon: 'tiktok' },
    ],
  },
];

export default function HeroSection() {
  const { t } = useI18n();
  const [showVideo, setShowVideo] = useState(false);

  return (
    <>
      <section className="hero section-spacious" id="about" aria-label="个人简介">
        <div className="hero-background" />
        <div className="hero-glow-cyan" aria-hidden="true" />
        <ParticleCanvas />

        <div className="hero-container">
          <div className="hero-avatar-wrap animate-on-scroll">
            <div className="hero-avatar-ring" />
            <img src="https://avatars.githubusercontent.com/u/22876610?v=4" alt="KevinTen" className="hero-avatar" />
            <div className="hero-status" title="AI Native Builder">
              <span className="status-dot" />
            </div>
          </div>

          <div className="hero-header animate-on-scroll stagger-1">
            <h1 className="hero-title">KevinTen</h1>
            <p className="hero-subtitle">
              <span className="subtitle-highlight">AI-Native Builder</span> · Software Architect · Open Source Contributor
            </p>
            <p className="hero-description">{t('hero.description', '专注云原生分布式系统、多运行时架构与 AI 应用工程')}</p>
          </div>

          <div className="hero-facts animate-on-scroll stagger-2">
            <div className="fact-item">
              <span className="fact-number">7+</span>
              <span className="fact-text">{t('hero.fact.years', '年经验')}</span>
            </div>
            <span className="fact-separator">·</span>
            <div className="fact-item">
              <span className="fact-number">2</span>
              <span className="fact-text">{t('hero.fact.systems', '亿级系统')}</span>
            </div>
            <span className="fact-separator">·</span>
            <div className="fact-item">
              <span className="fact-number">1.4k</span>
              <span className="fact-text">GitHub Stars</span>
            </div>
            <span className="fact-separator">·</span>
            <div className="fact-badge-group">
              <span className="fact-badge">Dapr</span>
              <span className="fact-badge">Layotto</span>
              <span className="fact-badge">Dubbo</span>
            </div>
          </div>

          <div className="hero-cta animate-on-scroll stagger-3">
            <a href="#projects" className="btn btn-primary">
              <span>{t('hero.btn.projects', '查看项目')}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </a>
            <a href="#contact" className="btn btn-secondary">{t('hero.btn.contact', '联系我')}</a>
            <button className="btn btn-video" onClick={() => setShowVideo(true)} aria-label="观看个人宣传视频">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              <span>{t('hero.btn.video', '观看视频')}</span>
            </button>
          </div>

          <div className="hero-bio-card animate-on-scroll stagger-4">
            <p>
              <span>{t('hero.bio1', '跨越 IoT → 云原生 → 分布式 → AI 的全栈架构师，信奉')}</span>{' '}
              <strong>AI Native · One-Person Company · Open Source</strong>
              <span>{t('hero.bio2', '。Apache Dubbo / Dapr / Layotto 开源贡献者，打造 20+ AI Agent 应用与 MCP 工具链。正在构建')}</span>{' '}
              <strong>OpenOctopus</strong>
              <span>{t('hero.bio3', ' — 如章鱼般每条触手拥有独立神经中枢的生活智能体系统。')}</span>
            </p>
          </div>

          <div className="social-matrix animate-on-scroll stagger-5">
            {SOCIAL_GROUPS.map(group => (
              <div key={group.labelKey} className="social-group">
                <span className="social-group-label">{t(group.labelKey, group.labelZh)}</span>
                <div className="social-group-pills">
                  {group.links.map(link => (
                    link.url ? (
                      <a key={link.name} href={link.url} target="_blank" rel="noopener" className="social-pill" style={{ '--brand': link.brand } as React.CSSProperties} aria-label={link.name}>
                        <span>{link.name}</span>
                      </a>
                    ) : (
                      <div key={link.name} className="social-pill social-wechat" tabIndex={0} style={{ '--brand': link.brand } as React.CSSProperties} aria-label="微信公众号">
                        <span>{link.name === '微信公众号' ? '微信 AIRider' : link.name}</span>
                        {link.icon === 'wechat' && (
                          <div className="wechat-tooltip">
                            <img src="/images/wechat.png" alt="微信" width="100" height="100" />
                            <span>AIRider</span>
                          </div>
                        )}
                      </div>
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-scroll">
          <span className="scroll-text">Scroll to explore</span>
          <div className="scroll-line">
            <div className="scroll-dot" />
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {showVideo && (
        <div className="modal-overlay" onClick={() => setShowVideo(false)}>
          <div className="modal-content video-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowVideo(false)} aria-label="Close">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <video controls autoPlay style={{ width: '100%', maxHeight: '80vh' }}>
              <source src="/video/promo.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      )}
    </>
  );
}
