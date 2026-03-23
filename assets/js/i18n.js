/**
 * i18n — Internationalization module for KevinTen portfolio
 * Supports Chinese (default) and English with one-click toggle
 * Uses textContent only — no innerHTML for security
 * @version 1
 */
(function() {
  'use strict';

  var STORAGE_KEY = 'kevinten-lang';
  var DEFAULT_LANG = 'zh';

  // English translation dictionary — keys match data-i18n attributes in HTML
  var EN = {
    // Navigation
    'nav.skip': 'Skip to main content',
    'nav.experience': 'Experience',
    'nav.projects': 'Projects',
    'nav.tech': 'Tech Stack',
    'nav.contributions': 'Open Source',
    'nav.gallery': 'Gallery',
    'nav.contact': 'Contact',

    // Hero
    'hero.description': 'Focused on cloud-native distributed systems, multi-runtime architecture & AI engineering',
    'hero.fact.years': 'Years Exp',
    'hero.fact.systems': 'Large-scale Systems',
    'hero.btn.projects': 'View Projects',
    'hero.btn.contact': 'Contact Me',
    'hero.btn.video': 'Watch Video',
    'hero.bio1': 'Full-stack architect spanning IoT → Cloud Native → Distributed → AI, believes in',
    'hero.bio2': '. Apache Dubbo / Dapr / Layotto open source contributor, built 20+ AI Agent apps & MCP toolchain. Building',
    'hero.bio3': ' — a life intelligence system where each tentacle has its own neural center, like an octopus.',

    // Impact Section 01
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

    // Experience Section 02
    'exp.title': 'Work Experience',
    'exp.desc': 'Key Projects & Technical Achievements',
    // Message Hub
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
    // Capa
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
    // Message Gateway
    'exp.mg.title': 'Message Gateway · Enterprise Messaging Platform',
    'exp.mg.period': '2023.6 - Present',
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
    // AI
    'exp.ai.title': 'AI Exploration & Applications',
    'exp.ai.period': '2025.2 - 2026.3',
    'exp.ai.role': 'AI-First Practitioner',
    'exp.ai.team': 'Tech Evangelism',
    'exp.ai.impact': '700+ attendees',
    'exp.ai.company': 'Leading Internet Company',
    'exp.ai.description': 'With the rise of AI Coding, deeply explored and implemented AI applications. AI Coding Token usage ranked #1 enterprise-wide, led building enterprise MCP tool matrix, driving AI + software engineering integration.',
    'exp.ai.h1.text': 'Token usage ranked #1 enterprise-wide, drove multiple business requirements completed with AI assistance',
    'exp.ai.h2.title': 'MCP Tool Matrix',
    'exp.ai.h2.text': 'Developed 7 MCP tools (monitoring, DB, analytics, logs, GitLab), hundreds of thousands of invocations',
    'exp.ai.h3.title': 'AI Productization',
    'exp.ai.h3.text': 'Built Code Review, error analysis, slow SQL products on Dify, fully adopted by international business lines',

    // Projects Section 03
    'proj.desc': 'Featured Open Source Projects & Contributions',
    'proj.capa.desc': 'Multi-runtime SDK for hybrid cloud. Implementing "write once, run anywhere", enabling apps with cross-cloud capabilities.',
    'proj.vrml.desc': 'Advanced abstraction API library for application runtime. Aiming to migrate to cloud-runtimes as a standard API implementation.',
    'proj.dubbo.desc': 'Java implementation of Apache Dubbo. A high-performance RPC and microservices framework widely used in large-scale distributed systems.',
    'proj.dapr.desc': 'Portable runtime for building distributed apps across cloud and edge, combining event-driven architecture with workflow orchestration.',
    'proj.layotto.desc': 'Fast and efficient cloud-native application runtime, providing distributed capability abstraction for applications.',
    'proj.capabff.desc': '[Hackathon] Zero-cost BFF solution - Gold Award at 2021 Hackathon.',
    'proj.octopus.desc': 'Realm-native life intelligence system. Organize life by domains, summon everything as AI Agents with memory and personality.',
    'proj.aitools.desc': 'Comprehensive AI development tool selection guide, covering SWOT analysis and real-world data for 30+ tools.',
    'proj.trip.desc': 'Multi-Agent intelligent travel planning assistant, using AI to generate personalized itineraries.',
    'proj.dao.desc': 'AI Fantasy Novel · Programmer Cultivation · The Dao is Source Code. AI-assisted cultivation worldview novel.',

    // Octopus Showcase
    'octopus.tagline': 'Realm-native Life Intelligence System',
    'octopus.desc': 'Like an octopus, each tentacle has its own neural center — organize life by domains, summon everything as AI Agents with memory and personality.',
    'octopus.travel': 'Travel',
    'octopus.health': 'Health',
    'octopus.finance': 'Finance',
    'octopus.tools': 'Tools',
    'octopus.creative': 'Creative',
    'octopus.learning': 'Learning',

    // AI Ecosystem
    'eco.subtitle': '30+ AI Apps · Covering travel, life, learning, research, tools, creative, and more',
    'eco.openAll': 'Open All Projects',
    'eco.cat.travel': '🌏 Travel & Outdoor',
    'eco.cat.life': '🏠 Life & Social',
    'eco.cat.learning': '📚 Learning & Utility',
    'eco.cat.content': '🎨 Content & Creative',
    'eco.cat.research': '🧠 AI Research',
    'eco.cat.tools': '🔧 Tools & MCP',
    'eco.tripmeta.desc': 'AI+VR Metaverse Tourism',
    'eco.tripava.desc': 'AI Digital Travel Guide',
    'eco.tripagent.desc': 'Multi-Agent Trip Planning',
    'eco.adv.desc': 'Motorcycle Riding Community + AI Routes',
    'eco.vietnam.desc': 'One-stop Vietnam Travel Guide',
    'eco.meeting.desc': 'AI Meeting Planner',
    'eco.pawpal.desc': 'Pet Social App',
    'eco.spa.desc': 'SPA Knowledge + AI Consultant',
    'eco.maichong.desc': 'AI Intimate Circle Coordination',
    'eco.health.desc': 'AI Pregnancy Checkup Guide',
    'eco.name.desc': 'GLM-4 AI Name Generator',
    'eco.spring.name': 'Spring Festival AI',
    'eco.spring.desc': 'Awesome Spring Festival',
    'eco.english.desc': 'Immersive AI English Learning',
    'eco.smartbrain.desc': 'AI Thinking Coach',
    'eco.clawx.desc': 'AI Money Guide · 33 Methods',
    'eco.law.desc': 'AI Consumer Rights Consulting',
    'eco.argue.desc': 'Real-time Debate + Argument Verification',
    'eco.video.desc': 'AI Multimedia Tools · 61+',
    'eco.3d.desc': 'One-stop 3D Model Generation',
    'eco.promotion.desc': 'Cross-platform Social Media Publishing · 11+',
    'eco.2077.desc': 'Dispatches from the Future News',
    'eco.fish.desc': 'Pixel-style Fishing Simulator',
    'eco.yuanjie.desc': 'AI Technology & Application Innovation',
    'eco.aiideas.desc': 'AI Creative Ideas Collection',
    'eco.rag.desc': 'RAG Retrieval-Augmented Generation Platform',
    'eco.hotel.desc': 'Browser-Use AI Agent for Hotels',
    'eco.deepresearch.desc': 'Mini Deep Research Agent',
    'eco.ccuse.desc': 'Claude Code Config Switcher CLI',
    'eco.pua.desc': 'Fun AI CLI Tool',
    'eco.mcpvideo.desc': 'Multi-provider Video/Speech MCP',
    'eco.mcp3d.desc': 'Multi-provider 3D Model MCP',
    'eco.mcpimage.desc': 'Gemini Image Generation MCP',
    'eco.mcpffmpeg.desc': 'FFmpeg Audio/Video Editing · 30+ Tools',
    'eco.mcpstyles.desc': 'Platform-specific Content Creation MCP',

    // Tech Stack Section 04
    'tech.desc': 'Core Technical Capabilities & Expertise',
    'tech.legend.expert': 'Expert Core Strengths',
    'tech.legend.advanced': 'Advanced Mastery',
    'tech.legend.proficient': 'Proficient Skilled',
    'tech.legend.familiar': 'Familiar Understanding',
    'tech.legend.practice': 'Practices Applied',

    // Contributions Section 05
    'contrib.desc': 'Open Source Community Contributions & Projects',
    'contrib.personal': 'Personal Projects',
    'contrib.major': 'Major Contributions',
    'contrib.vrml.desc': 'Java functional extension toolkit, providing monitoring, logging, network proxy and other tools',
    'contrib.capa.desc': 'Mecha SDK implementing "write once, run anywhere", enabling Java apps with cross-cloud capabilities',
    'contrib.octopus.desc': 'Realm-native life intelligence system, organizing life by domains, summoning everything as AI Agents',
    'contrib.aitools.desc': 'AI development tool selection guide, covering SWOT analysis for 30+ tools',
    'contrib.dubbo.desc': 'Optimized Invoker chain, improved framework OOP design',
    'contrib.dapr.desc': 'api-sig Co-Chair, driving Multi-Runtime ecosystem',
    'contrib.layotto.desc': 'Wrote Reactive Java-SDK, multiple API proposals',
    'contrib.reactor.desc': 'Reactive programming core library contributions',

    // Awards Section 06
    'awards.title': 'Awards & Recognitions',
    'awards.hero.label': 'Team Lead',
    'awards.hero.title': 'Enterprise Hackathon Gold Award',
    'awards.hero.project': '"Zero-cost BFF Framework"',
    'awards.silver.title': 'Campus Recruit Competition Runner-up',
    'awards.silver.project': '"Script-based Tourism"',
    'awards.silver.label': 'Mentor',
    'awards.bronze.title': 'Enterprise GPT Hackathon Bronze',
    'awards.bronze.project': '"AI Travel Content Assistant"',
    'awards.bronze.label': 'Team Lead',
    'awards.finalist.title': 'Enterprise Hackathon Finalist',
    'awards.finalist.project': '"AI + VR Metaverse Tourism Platform"',
    'awards.finalist.label': 'Team Lead',
    'awards.outstanding.title': 'International Division Outstanding Project',
    'awards.outstanding.project': 'Next-gen Cross-channel Communication Platform',
    'awards.outstanding.label': 'Lead Developer',
    'awards.annual.title': 'Enterprise Annual Achievement Award',
    'awards.annual.project': 'Individual Contribution - Excellence (3rd Tier)',
    'awards.annual.label': 'Multi-year Recipient',
    'awards.arch.title': 'Architecture Committee Outstanding Individual',
    'awards.arch.project': 'Enterprise Hybrid Cloud Middleware',
    'awards.arch.label': 'Core Architect',
    'awards.badge.hackathon': 'Hackathon Awards',
    'awards.badge.annual': 'Annual Awards',
    'awards.badge.audience': 'AI Talk Attendees',
    'awards.badge.meetup': 'Tech Meetups',

    // Writing Section 07
    'writing.title': 'Published Articles',
    'writing.desc': 'Technical Articles & Practice Sharing',
    'writing.reactive.title': 'Reactive Pattern Practice on an OTA Messaging Platform',
    'writing.reactive.excerpt': 'Sharing the implementation and benefits of Reactive patterns in a messaging platform.',
    'writing.capa.excerpt': 'Design philosophy and cross-cloud runtime practice of Capa/Mecha SDK.',
    'writing.aitools.title': 'AI Development Tool Selection Guide',
    'writing.aitools.excerpt': 'Comprehensive SWOT analysis for 30+ AI development tools including IDEs, LLMs, plugins.',
    'writing.octopus.excerpt': 'Organize life by domains, summon everything as AI Agents with memory and personality.',
    'writing.dao.title': 'Compiling the Dao · AI Cultivation Novel',
    'writing.dao.excerpt': 'Programmer cultivation worldview, the Dao is source code. AI-assisted novel serializing on Fanqie Novel.',

    // Gallery Section 08
    'gallery.title': 'Gallery',
    'gallery.desc': 'Recording tech growth & life moments',
    'gallery.all': 'All',
    'gallery.professional': 'Professional',
    'gallery.life': 'Life',

    // Contact Section 09
    'contact.desc': 'Open to tech exchanges, collaboration & creative partnerships',
    'contact.availability': "I'm particularly interested in these collaborations:",
    'contact.interest1': '🤖 AI Agent App Architecture / AI Native Full-Stack Dev',
    'contact.interest2': '🐙 AI Agent Ecosystem / MCP Toolchain Building',
    'contact.interest3': '🏗️ Distributed Systems Architecture / Cloud Native Platform',
    'contact.interest4': '🌟 Open Source Community / One-Person Company / AI Startup',

    // Footer
    'footer.built': 'Built with vanilla JS, too much ☕, and a mass of curiosity.'
  };

  // Store original Chinese text for restoration
  var originalTexts = {};

  function saveChinese() {
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      var key = els[i].getAttribute('data-i18n');
      if (!originalTexts[key]) {
        originalTexts[key] = els[i].textContent;
      }
    }
  }

  function applyLang(lang) {
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      var key = els[i].getAttribute('data-i18n');
      if (lang === 'en' && EN[key]) {
        els[i].textContent = EN[key];
      } else if (lang === 'zh' && originalTexts[key]) {
        els[i].textContent = originalTexts[key];
      }
    }

    // Update html lang attribute
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';

    // Update toggle button text
    var toggles = document.querySelectorAll('.lang-toggle-btn span');
    for (var j = 0; j < toggles.length; j++) {
      toggles[j].textContent = lang === 'en' ? '中文' : 'EN';
    }
  }

  function toggle() {
    var current = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
    var next = current === 'zh' ? 'en' : 'zh';
    localStorage.setItem(STORAGE_KEY, next);
    applyLang(next);
  }

  function init() {
    saveChinese();
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en') {
      applyLang('en');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.I18n = { toggle: toggle };
})();
