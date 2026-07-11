'use client';

import { useI18n } from '@/providers/I18nProvider';
import SectionHeader from '@/components/ui/SectionHeader';

const CONTACT_ITEMS = [
  {
    icon: 'email',
    title: 'Email',
    value: 'wshten@gmail.com',
    href: 'mailto:wshten@gmail.com',
  },
  {
    icon: 'github',
    title: 'GitHub',
    value: '@kevinten10',
    href: 'https://github.com/kevinten10',
  },
  {
    icon: 'twitter',
    title: 'X / Twitter',
    value: '@kevinten1024',
    href: 'https://x.com/kevinten1024',
  },
  {
    icon: 'wechat',
    title: 'WeChat',
    value: 'KevinTen',
  },
  {
    icon: 'location',
    title: 'Location',
    value: 'China · GMT+8',
  },
];

const SOCIAL_LINKS = [
  { group: 'Dev & AI', links: [
    { href: 'https://huggingface.co/IKUN-LLM', title: 'HuggingFace', label: '🤗 HuggingFace' },
    { href: 'https://www.producthunt.com/@ten_wang', title: 'Product Hunt', label: '🚀 Product Hunt' },
  ]},
  { group: 'Blog', links: [
    { href: 'https://medium.com/@wshten', title: 'Medium', label: '✍️ Medium' },
    { href: 'https://dev.to/kevinten10', title: 'DEV.to', label: '👩‍💻 DEV.to' },
    { href: 'https://juejin.cn/user/3350967171951912', title: '掘金', label: '💎 掘金' },
    { href: 'https://blog.csdn.net/wsh596823919', title: 'CSDN', label: '📝 CSDN' },
    { href: 'https://www.zhihu.com/people/wang-shi-hao-93-9', title: '知乎', label: '💡 知乎' },
    { href: 'https://www.moltbook.com/u/LuckyPuppy', title: 'Moltbook', label: '📖 Moltbook' },
  ]},
  { group: 'Social', links: [
    { href: 'https://bsky.app/profile/kevinten10.bsky.social', title: 'Bluesky', label: '🦋 Bluesky' },
    { href: 'https://www.xiaohongshu.com/user/profile/5beeb71fe4873800017463fa', title: '小红书', label: '📕 小红书' },
    { href: 'https://www.douyin.com/user/MS4wLjABAAAAvJHfd8N6myG3RyTR480KNC3J0bqmXwd_263-MZksxzU', title: '抖音', label: '🎵 抖音' },
    { href: 'https://www.tiktok.com/@kevinten1024', title: 'TikTok', label: '🎬 TikTok' },
  ]},
];

export default function ContactSection() {
  const { t } = useI18n();

  return (
    <section className="section section-spacious contact-section section-alt" id="contact">
      <div className="container">
        <SectionHeader idx="11" title="Get In Touch" description={t('contact.desc', '欢迎技术交流、项目合作、创意碰撞')} />

        <div className="contact-content">
          <div className="contact-info">
            {CONTACT_ITEMS.map((item) => (
              <div key={item.icon} className="contact-item">
                <div className="contact-icon">
                  {item.icon === 'email' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
                  {item.icon === 'github' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>}
                  {item.icon === 'twitter' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>}
                  {item.icon === 'wechat' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm3.164 4.508c-3.71 0-7.48 2.57-7.48 5.852 0 3.352 3.247 5.852 7.48 5.852a9.036 9.036 0 0 0 2.45-.34.727.727 0 0 1 .615.083l1.633.954a.28.28 0 0 0 .143.047c.137 0 .25-.113.25-.253 0-.06-.025-.12-.041-.182l-.335-1.27a.502.502 0 0 1 .183-.571C21.891 19.685 24 17.82 24 16.35c0-3.282-3.77-5.852-7.238-5.852zm-2.505 2.456c.555 0 1.006.458 1.006 1.02a1.01 1.01 0 0 1-1.006 1.016 1.01 1.01 0 0 1-1.005-1.017c0-.56.45-1.02 1.005-1.02zm5.01 0c.555 0 1.006.458 1.006 1.02a1.01 1.01 0 0 1-1.006 1.016 1.01 1.01 0 0 1-1.005-1.017c0-.56.45-1.02 1.005-1.02z"/></svg>}
                  {item.icon === 'location' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>}
                </div>
                <div className="contact-details">
                  <h4>{item.title}</h4>
                  {item.href ? <a href={item.href} target="_blank" rel="noopener noreferrer">{item.value}</a> : <span>{item.value}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="contact-cta">
            <div className="availability-card">
              <div className="availability-header">
                <span className="availability-status available">
                  <span className="availability-dot"></span>
                  AI Native Builder
                </span>
              </div>
              <p className="availability-text">{t('contact.availability', '我对以下类型的合作与交流特别感兴趣：')}</p>
              <ul className="availability-interests">
                <li>{t('contact.interest1', '🤖 AI Agent 应用架构 / AI Native 全栈开发')}</li>
                <li>{t('contact.interest2', '🐙 AI Agent 生态系统 / MCP 工具链构建')}</li>
                <li>{t('contact.interest3', '🏗️ 分布式系统架构 / 云原生平台')}</li>
                <li>{t('contact.interest4', '🌟 开源社区 / One-Person Company / AI 创业')}</li>
              </ul>
              <div className="contact-actions">
                <a href="mailto:wshten@gmail.com" className="btn btn-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  Send Email
                </a>
                <a href="https://github.com/kevinten10" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                  GitHub Profile
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Social Links Bar */}
        <div className="contact-social-bar">
          <div className="social-links-bar">
            {SOCIAL_LINKS.map(group => (
              <span key={group.group} style={{ display: 'contents' }}>
                <span className="social-group-label">{group.group}</span>
                {group.links.map(link => (
                  <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="social-pill" title={link.title}>{link.label}</a>
                ))}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
