'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type Lang = 'zh' | 'en';

interface I18nContextType {
  lang: Lang;
  toggle: () => void;
  t: (key: string, zhText?: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: 'zh',
  toggle: () => {},
  t: (key: string) => key,
});

export function useI18n() {
  return useContext(I18nContext);
}

const STORAGE_KEY = 'kevinten-lang';

// English translations — keys match data-i18n attributes
const EN: Record<string, string> = {
  'nav.skip': 'Skip to main content',
  'nav.experience': 'Experience',
  'nav.projects': 'Projects',
  'nav.tech': 'Tech Stack',
  'nav.contributions': 'Open Source',
  'nav.awards': 'Awards',
  'nav.writing': 'Writing',
  'nav.gallery': 'Gallery',
  'nav.contact': 'Contact',
  'hero.description': 'Focused on cloud-native distributed systems, multi-runtime architecture & AI engineering',
  'hero.fact.years': 'Years Exp',
  'hero.fact.systems': 'Large-scale Systems',
  'hero.btn.projects': 'View Projects',
  'hero.btn.contact': 'Contact Me',
  'hero.btn.video': 'Watch Video',
  'impact.desc': 'Key Achievements & Impact',
  'impact.years.label': 'Years of Experience',
  'impact.years.desc': 'Software Architect',
  'impact.systems.label': 'Billion-level Traffic Systems',
  'impact.systems.desc': 'Led design & development',
  'impact.stars.desc': 'Open source impact',
  'impact.sharing.label': 'AI Tech Talks',
  'impact.sharing.desc': '3 company-wide talks · 700+ attendees',
  'impact.mcp.label': 'Enterprise MCP Backend Tools',
  'impact.mcp.desc': 'Monitoring / DB / Logs / Analytics / GitLab',
  'impact.agents.label': 'AI Agent Apps',
  'impact.agents.desc': 'Travel / Health / Finance / Naming / Fishing...',
  'impact.hackathon.label': 'Hackathon Awards',
  'impact.hackathon.desc': 'Gold · Runner-up · Bronze',
  'impact.opensource.label': 'Open Source Projects',
  'impact.opensource.desc': 'Personal + community contributions',
  'impact.meetup.label': 'Tech Meetups',
  'impact.meetup.desc': 'Organized & participated',
  'exp.title': 'Work Experience',
  'exp.desc': 'Key Projects & Technical Achievements',
  'exp.mh.title': 'Message Hub · Marketing Communication System',
  'exp.mh.role': 'Core Dev & Owner',
  'exp.mh.team': 'Small Cross-functional Team',
  'exp.mh.impact': 'Scaled daily sending volume',
  'exp.mh.company': 'Leading Internet Company',
  'exp.mh.description': 'Marketing message delivery system for overseas users, covering lifecycle, membership, browse abandonment, pre/post-booking, and cross-selling. Supports Email, AppPush, In-app, WhatsApp multi-channel delivery at scale.',
  'exp.mh.h1.title': 'Combinator Pipeline',
  'exp.mh.h1.text': 'Chain of Responsibility + Bridge pattern, annotation-driven pipeline assembly, greatly improving extensibility and reducing development cost',
  'exp.mh.h2.title': 'Traffic Smoothing',
  'exp.mh.h2.text': 'Custom distributed traffic smoothing based on Sentinel, HPA auto-scaling, smooth functions to regulate downstream QPS',
  'exp.mh.h3.title': 'Reactive IO',
  'exp.mh.h3.text': 'CTO-sponsored async non-blocking IO transformation, reduced 50% CPU & memory, published technical article',
  'exp.capa.title': 'Capa · Hybrid Cloud Middleware',
  'exp.capa.role': 'Core Architect & Lead Dev',
  'exp.capa.team': 'Cross-team Collaboration',
  'exp.capa.impact': 'Enterprise cloud migration',
  'exp.capa.company': 'Leading Internet Company',
  'exp.capa.description': 'Multi-Runtime middleware based on Mecha design, achieving "write once, run anywhere" hybrid cloud architecture. Supporting enterprise cloud migration with private and AWS public cloud, high production stability.',
  'exp.capa.h1.title': 'Hybrid Cloud Architecture',
  'exp.capa.h1.text': 'Led full architecture design, responsible for RPC, Crypto, Proxy, Secret middleware development',
  'exp.capa.h2.title': 'Public Cloud SRE',
  'exp.capa.h2.text': 'Public cloud SRE responsibilities, maintaining K8s, Service Mesh, Envoy cloud-native components',
  'exp.capa.h3.title': 'Open Source Community',
  'exp.capa.h3.text': 'Dapr api-sig Co-Chair, Layotto Member, contributed 5+ API proposals',
  'exp.mg.title': 'Message Gateway · Enterprise Messaging Platform',
  'exp.mg.role': 'Core Developer',
  'exp.mg.team': 'Platform Team',
  'exp.mg.impact': 'Enterprise messaging platform',
  'exp.mg.company': 'Leading Internet Company',
  'exp.mg.description': 'Responsible for most external messaging channels including SMS, Email, Push, In-app, WeChat, LINE, WhatsApp, Kakao, and 10+ delivery channels, serving global brands.',
  'exp.mg.h1.title': 'Multi-tenant Architecture',
  'exp.mg.h1.text': 'Designed multi-tenant mechanism supporting complex configuration and differentiated billing',
  'exp.mg.h2.title': 'Cross-border Multi-Region',
  'exp.mg.h2.text': 'Multi-region deployment architecture, MQ broadcast and DRC sync ensuring data compliance',
  'exp.mg.h3.title': 'DDD State Machine',
  'exp.mg.h3.text': 'DDD + State Machine pattern refactoring template management, achieving logic isolation and extensibility',
  'exp.ai.title': 'AI Exploration & Applications',
  'exp.ai.role': 'AI-First Practitioner',
  'exp.ai.team': 'Tech Evangelism',
  'exp.ai.impact': '700+ attendees',
  'exp.ai.company': 'Leading Internet Company',
  'exp.ai.description': 'With the rise of AI Coding, deeply explored and implemented AI applications. AI Coding Token usage ranked #1 enterprise-wide, led building enterprise MCP tool matrix, driving AI + software engineering integration.',
  'exp.ai.h2.title': 'MCP Tool Matrix',
  'exp.ai.h2.text': 'Developed 7 MCP tools (monitoring, DB, analytics, logs, GitLab), hundreds of thousands of invocations',
  'exp.ai.h3.title': 'AI Productization',
  'exp.ai.h3.text': 'Built Code Review, error analysis, slow SQL products on Dify, fully adopted by international business lines',
  'proj.desc': 'Featured Open Source Projects & Contributions',
  'proj.capa.desc': 'Multi-runtime SDK for hybrid cloud. Implementing "write once, run anywhere", enabling apps with cross-cloud capabilities.',
  'proj.vrml.desc': 'Advanced abstraction API library for application runtime. Aiming to migrate to cloud-runtimes as a standard API implementation.',
  'proj.dubbo.desc': 'Java implementation of Apache Dubbo. A high-performance RPC and microservices framework widely used in large-scale distributed systems.',
  'proj.dapr.desc': 'Portable runtime for building distributed apps across cloud and edge, combining event-driven architecture with workflow orchestration.',
  'proj.layotto.desc': 'Fast and efficient cloud-native application runtime, providing distributed capability abstraction for applications.',
  'proj.octopus.desc': 'Realm-native life intelligence system. Organize life by domains, summon everything as AI Agents with memory and personality.',
  'proj.aitools.desc': 'Comprehensive AI development tool selection guide, covering SWOT analysis and real-world data for 30+ tools.',
  'tech.desc': 'Core Technical Capabilities & Expertise',
  'contrib.desc': 'Open Source Community Contributions & Projects',
  'awards.title': 'Awards & Recognitions',
  'awards.spotlight.title': 'Trip.com Group Employee Spotlight',
  'awards.spotlight.project': 'Official LinkedIn Employee Feature',
  'awards.spotlight.label': 'Corporate Recognition',
  'writing.title': 'Published Articles',
  'writing.desc': 'Technical Articles & Practice Sharing',
  'gallery.title': 'Gallery',
  'gallery.desc': 'Recording tech growth & life moments',
  'gallery.all': 'All',
  'gallery.professional': 'Professional',
  'gallery.life': 'Life',
  'contact.desc': 'Open to tech exchanges, collaboration & creative partnerships',
  'footer.built': 'Built with vanilla JS, too much ☕, and a mass of curiosity.',
  'social.dev': 'Dev & AI',
  'social.blog': 'Blog & Writing',
  'social.social': 'Social',
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('zh');

  const t = useCallback(
    (key: string, zhText?: string) => {
      if (lang === 'zh' && zhText) return zhText;
      if (lang === 'en' && EN[key]) return EN[key];
      return zhText || key;
    },
    [lang]
  );

  const toggle = useCallback(() => {
    setLang(prev => {
      const next = prev === 'zh' ? 'en' : 'zh';
      localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.lang = next === 'en' ? 'en' : 'zh-CN';
      return next;
    });
  }, []);

  return (
    <I18nContext.Provider value={{ lang, toggle, t }}>
      {children}
    </I18nContext.Provider>
  );
}
