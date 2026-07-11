'use client';

import { useI18n } from '@/providers/I18nProvider';
// import '@/styles/sections/footer.css';

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-content">
        <p className="footer-quote">
          &ldquo;Building systems where humans design, agents execute, and runtimes collaborate.&rdquo;
        </p>
        <div className="footer-links">
          <a href="https://github.com/kevinten10" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <a href="https://x.com/kevinten1024" target="_blank" rel="noopener noreferrer">
            X / Twitter
          </a>
          <a href="mailto:wshten@gmail.com">Email</a>
          <a href="https://dev.to/kevinten10" target="_blank" rel="noopener noreferrer">
            DEV.to
          </a>
          <a
            href="https://www.xiaohongshu.com/user/profile/5beeb71fe4873800017463fa"
            target="_blank"
            rel="noopener noreferrer"
          >
            小红书
          </a>
          <a
            href="https://www.zhihu.com/people/wang-shi-hao-93-9"
            target="_blank"
            rel="noopener noreferrer"
          >
            知乎
          </a>
        </div>
        <p className="footer-built-with">
          {t('footer.built', 'Built with vanilla JS, too much ☕, and a mass of curiosity.')}
        </p>
        <p className="footer-copyright">&copy; 2019 - 2026 KevinTen. All rights reserved.</p>
      </div>
    </footer>
  );
}
