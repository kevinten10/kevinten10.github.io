'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useScrollPosition } from '@/hooks/useScrollPosition';
import { useTheme } from '@/providers/ThemeProvider';
import { useI18n } from '@/providers/I18nProvider';

const NAV_LINKS = [
  { text: '经历', href: '#experience', i18nKey: 'nav.experience' },
  { text: '项目', href: '#projects', i18nKey: 'nav.projects' },
  { text: '技术栈', href: '#tech', i18nKey: 'nav.tech' },
  { text: '开源', href: '#contributions', i18nKey: 'nav.contributions' },
  { text: '荣誉', href: '#awards', i18nKey: 'nav.awards' },
  { text: '写作', href: '#writing', i18nKey: 'nav.writing' },
  { text: '相册', href: '#gallery', i18nKey: 'nav.gallery' },
  { text: '联系', href: '#contact', i18nKey: 'nav.contact' },
];

export default function Header() {
  const { isScrolled } = useScrollPosition();
  const { theme, toggle: toggleTheme } = useTheme();
  const { lang, toggle: toggleLang, t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobile();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeMobile]);

  return (
    <>
      <header className={`nav-header${isScrolled ? ' is-scrolled' : ''}`} role="banner">
        <div className="nav-container">
          <Link href="/" className="nav-logo">
            <img src="https://avatars.githubusercontent.com/u/22876610?v=4" alt="KevinTen" width="40" height="40" />
            <span>KevinTen</span>
          </Link>

          <nav className="nav-links" role="navigation" aria-label="主导航">
            {NAV_LINKS.map(link => (
              <a key={link.href} href={link.href} className="nav-link">
                {t(link.i18nKey, link.text)}
              </a>
            ))}
          </nav>

          <button
            className={`mobile-menu-btn${mobileOpen ? ' active' : ''}`}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <span className="hamburger" />
            <span className="hamburger" />
            <span className="hamburger" />
          </button>

          <button className="lang-toggle-btn" onClick={toggleLang} aria-label="Switch language">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            <span>{lang === 'zh' ? 'EN' : '中文'}</span>
          </button>

          <button className="theme-toggle-btn" id="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            <svg className="theme-icon sun-icon" style={{ display: theme === 'dark' ? 'block' : 'none' }} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M1 12h2"/><path d="M21 12h2"/><path d="M4.93 19.07l1.41-1.41"/><path d="M17.66 6.34l1.41-1.41"/></svg>
            <svg className="theme-icon moon-icon" style={{ display: theme === 'light' ? 'block' : 'none' }} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </button>

          <div className="nav-actions">
            <a href="https://github.com/kevinten10" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              GitHub
            </a>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div id="mobile-nav" className={`mobile-nav${mobileOpen ? ' active' : ''}`} aria-hidden={!mobileOpen}>
        <div className="mobile-nav-backdrop" onClick={closeMobile} />
        <div className="mobile-nav-content">
          <div className="mobile-nav-header">
            <span className="mobile-nav-title">Navigation</span>
            <button className="mobile-nav-close" aria-label="Close menu" onClick={closeMobile}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <nav className="mobile-nav-links" aria-label="Mobile navigation">
            {NAV_LINKS.map(link => (
              <a key={link.href} href={link.href} className="mobile-nav-link" onClick={closeMobile}>
                {t(link.i18nKey, link.text)}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
