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
    'nav.awards': 'Awards',
    'nav.writing': 'Writing',
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

    // AI Native media
    'media.kicker': 'AI-NATIVE MEDIA',
    'media.title': 'Visual System Story',
    'media.desc': 'Illustrations and a short film connect the personal-site backend, agent ecosystem, and AI Native builder story.',
    'media.system.kicker': 'System Map',
    'media.system.title': 'Edge-first personal site backend',
    'media.system.desc': 'Cloudflare Workers, identity, payments, D1, R2, analytics, queues, and AI agents are presented as one connected operating map.',
    'media.film.kicker': 'Promo Film',
    'media.film.title': 'AI Native builder intro',
    'media.film.desc': 'A six-second visual generated from the key art, connecting technology, product craft, and personal brand in one shot.',
    'media.film.play': 'Play video',
    'media.octopus.title': 'Realm-native agent map',
    'media.octopus.desc': 'Travel, health, finance, tools, creation, and learning form a collaborative network around the personal AI agent system.',

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
    'exp.mg.period': '2023.6 - 2026.3',
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
    // New Chapter
    'exp.chapter.new': '🚀 New Chapter',
    'exp.new.period': '2026.4 - Present',
    'exp.new.title': 'AI Agent · New Journey',
    'exp.new.role': 'AI Agent Developer',
    'exp.new.team': 'AI Native Team',
    'exp.new.impact': 'Building...',
    'exp.new.company': 'AI Industry Company',
    'exp.new.description': 'Fully dedicated to AI Agent product development, integrating hands-on experience from distributed systems, cloud-native architecture, and 30+ AI Agent applications into production-grade AI Agent systems at scale.',
    'exp.new.h1.title': 'AI Agent Product Dev',
    'exp.new.h1.text': 'Deeply involved in core AI Agent product architecture design and engineering implementation',
    'exp.new.h2.title': 'AI Engineering at Scale',
    'exp.new.h2.text': 'Driving full-lifecycle engineering practices from AI Agent prototypes to production systems',

    // Projects Section 03
    'proj.desc': 'Featured Open Source Projects & Contributions',
    'proj.capa.desc': 'Multi-runtime SDK for hybrid cloud. Implementing "write once, run anywhere", enabling apps with cross-cloud capabilities.',
    'proj.vrml.desc': 'Advanced abstraction API library for application runtime. Aiming to migrate to cloud-runtimes as a standard API implementation.',
    'proj.dubbo.desc': 'Java implementation of Apache Dubbo. A high-performance RPC and microservices framework widely used in large-scale distributed systems.',
    'proj.dapr.desc': 'Portable runtime for building distributed apps across cloud and edge, combining event-driven architecture with workflow orchestration.',
    'proj.layotto.desc': 'Fast and efficient cloud-native application runtime, providing distributed capability abstraction for applications.',
    'proj.openclaw.desc': 'Your own personal AI assistant. Any OS. Any Platform.',
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
    'eco.name.desc': 'Ark AI Name Generator',
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
    'eco.aiideas.desc': '35+ AI Product Incubator',
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
    'awards.spotlight.title': 'Trip.com Group Employee Spotlight',
    'awards.spotlight.project': 'Official LinkedIn Employee Feature',
    'awards.spotlight.label': 'Corporate Recognition',
    'awards.badge.hackathon': 'Hackathon Awards',
    'awards.badge.annual': 'Annual Awards',
    'awards.badge.audience': 'AI Talk Attendees',
    'awards.badge.meetup': 'Tech Meetups',

    // Social Groups
    'social.dev': 'Dev & AI',
    'social.blog': 'Blog & Writing',
    'social.social': 'Social',

    // Writing Section 08
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

    // AI Infra
    'infra.title': 'AI Infra',
    'infra.desc': 'Training LLMs from Scratch · Full-pipeline AI Infrastructure',
    'infra.ikun.tagline': 'LLM Training from Scratch · Full Pipeline · 10 Repos',
    'infra.ikun.desc': 'A hands-on LLM training project covering the complete pipeline: tokenizer, pretraining, preference alignment (DPO), reinforcement learning (GRPO), reasoning (CoT), Mixture of Experts, knowledge distillation, vision-language model, and deployment.',

    // Gallery Section 08
    'gallery.title': 'Gallery',
    'gallery.desc': 'Recording tech growth & life moments',
    'gallery.all': 'All',
    'gallery.professional': 'Professional',
    'gallery.life': 'Life',

    // Hobbies
    'hobbies.title': 'Hobbies',
    'hobbies.desc': 'Life Beyond Code',
    'hobbies.moto': 'Motorcycle',
    'hobbies.moto.note': 'ADV Off-road · Touring',
    'hobbies.travel': 'Travel',
    'hobbies.travel.note': 'Traveled across China · Neighboring countries',
    'hobbies.dj': 'DJ / Music',
    'hobbies.dj.note': 'Electronic Music Production',
    'hobbies.print': '3D Printing',
    'hobbies.print.note': 'Model Design · Maker',
    'hobbies.photo': 'Photography',
    'hobbies.photo.note': 'Travel · Street',
    'hobbies.pet': 'Pets',
    'hobbies.pet.note': 'Dog Parent · Walker',
    'hobbies.fish': 'Fishing',
    'hobbies.fish.note': 'Lure · Sea Fishing',
    'hobbies.host': 'Hosting',
    'hobbies.host.note': 'Events · Alumni',

    // Contact Section 09
    'contact.desc': 'Open to tech exchanges, collaboration & creative partnerships',
    'contact.availability': "I'm particularly interested in these collaborations:",
    'contact.interest1': '🤖 AI Agent App Architecture / AI Native Full-Stack Dev',
    'contact.interest2': '🐙 AI Agent Ecosystem / MCP Toolchain Building',
    'contact.interest3': '🏗️ Distributed Systems Architecture / Cloud Native Platform',
    'contact.interest4': '🌟 Open Source Community / One-Person Company / AI Startup',

    // AI Assistant
    'ai.title': 'KevinTen AI Guide',
    'ai.status': 'Site guide',
    'ai.subtitle': 'Ask about projects, architecture, AI Native work, or collaboration.',
    'ai.placeholder': 'Ask about OpenOctopus, tech stack, or experience...',
    'ai.welcome': "Hi, I'm KevinTen's AI guide. I can answer common site questions instantly and route deeper questions to the live model when it is available.",
    'ai.suggested1': 'What is OpenOctopus?',
    'ai.suggested2': "What is KevinTen's tech stack?",
    'ai.suggested3': 'How does multi-runtime architecture work?',
    'ai.suggested4': 'How does AI Native show up in his work?',
    'ai.clear': 'Clear',
    'ai.thinking': 'Thinking',
    'ai.offline': 'The live model is not connected here, but I can answer the suggested site questions locally.',
    'ai.error': 'The live model is temporarily unavailable. Try one of the suggested site questions.',
    'ai.answer.openoctopus': "OpenOctopus is KevinTen's Realm-native personal agent system: a life operating layer where independent agents handle different domains, share context, and collaborate through runtime boundaries.",
    'ai.answer.techstack': 'KevinTen works across Java, Go, TypeScript, cloud-native systems, Dapr, Layotto, Dubbo, MCP tools, AI agents, and full-stack AI application engineering.',
    'ai.answer.multiruntime': 'Multi-runtime architecture separates capabilities into specialized runtimes, such as service invocation, state, workflow, agents, and tool execution, then connects them through clear contracts so systems can evolve independently.',
    'ai.answer.ainative': 'His AI Native work focuses on turning agents into practical software teammates: MCP tools, coding automation, review and diagnostic systems, and personal-product workflows.',
    'ai.answer.contact': 'For collaboration, the strongest fits are AI Agent architecture, cloud-native distributed systems, MCP tooling, open source, and one-person-company style product experiments.',

    // Comments Section
    'comments.title': 'Comments',
    'comments.desc': 'Share your thoughts and suggestions',
    'comments.loading': 'Loading...',
    'comments.loading.detail': 'Syncing the latest public notes',
    'comments.empty': 'No comments yet. Be the first!',
    'comments.empty.detail': 'The first note will appear here. Questions, context, and collaboration leads all fit.',
    'comments.disabled': 'Comments are not connected in this environment.',
    'comments.disabled.title': 'Comments are offline',
    'comments.error.load': 'Failed to load. Please try again later.',
    'comments.error.load.detail': 'The network or API is temporarily unavailable.',
    'comments.error.submit': 'Submission failed. Please try again.',
    'comments.error.name': 'Add a nickname or sign in first.',
    'comments.error.empty': 'Write a message first.',
    'comments.error.rateLimit': 'Too frequent. Please wait a moment.',
    'comments.error.notLoggedIn': 'Not logged in',
    'comments.status.approved': 'Published',
    'comments.status.pending': 'Submitted for review',
    'comments.status.sending': 'Submitting, one moment',
    'comments.submitting': 'Submitting...',
    'comments.composer.kicker': 'Comment channel',
    'comments.composer.title': 'Leave a concrete note',
    'comments.composer.desc': 'Post anonymously, or sign in so your identity is attached. Notes are moderated before they appear.',
    'comments.auth.label': 'Identity',
    'comments.name.label': 'Name',
    'comments.website.label': 'Link',
    'comments.message.label': 'Message',
    'comments.hint.markdown': 'Markdown supported: **bold** and `code`',
    'comments.submit': 'Post Comment',
    'comments.reply': 'Reply',
    'comments.reply.submit': 'Post Reply',
    'comments.placeholder': 'Ask a question, add feedback, or leave context...',
    'comments.reply.placeholder': 'Reply...',
    'comments.guest': 'Guest',
    'comments.name.placeholder': 'Your name or handle',
    'comments.website.placeholder': 'Website or profile, optional',
    'auth.login': 'Log in',
    'auth.logout': 'Log out',
    'auth.status.guest': 'Browsing anonymously. You can still comment.',
    'auth.status.signedIn': 'Signed in. Your note will include your identity.',
    'auth.status.unavailable': 'Login unavailable. Anonymous comments still work.',

    // Rewards Section
    'rewards.title': 'Support & Thanks',
    'rewards.desc': 'Real support payments use WeChat or Alipay QR codes. Stripe is kept in sandbox mode only and is not a live payment option.',
    'rewards.note': 'After scanning and paying, submit the record here. It appears on the thanks wall after manual confirmation.',
    'rewards.submit': 'Submit for Confirmation',
    'rewards.submitting': 'Submitting...',
    'rewards.disabled': 'Rewards are not connected in this environment.',
    'rewards.empty': 'No public supporters yet.',
    'rewards.verified': 'Verified',
    'rewards.status.sending': 'Submitting support record',
    'rewards.status.pending': 'Submitted for confirmation. It will appear after payment is checked.',
    'rewards.error.name': 'Add a nickname first.',
    'rewards.error.submit': 'Submission failed. Please try again.',
    'rewards.error.load': 'Thanks wall is temporarily unavailable.',

    // Footer
    'footer.built': 'Built with vanilla JS, too much ☕, and a mass of curiosity.'
  };

  // Store original Chinese text for restoration
  // Pre-populate dynamic widget keys so language toggle works for rendered content
  var originalTexts = {
    'ai.title': 'KevinTen AI 导览',
    'ai.status': '站内导览',
    'ai.subtitle': '可以问项目、架构、AI Native 实践或合作方向。',
    'ai.placeholder': '输入你想了解的项目、技术或经历...',
    'ai.welcome': '你好，我是 KevinTen 的 AI 导览。常见站内问题我会即时回答，更深入的问题会在模型可用时转给在线助手。',
    'ai.suggested1': 'OpenOctopus 是什么？',
    'ai.suggested2': 'KevinTen 的技术栈是什么？',
    'ai.suggested3': '多运行时架构怎么理解？',
    'ai.suggested4': 'KevinTen 的 AI Native 项目有哪些？',
    'ai.clear': '清空',
    'ai.thinking': '思考中',
    'ai.offline': '在线模型当前未连接，但我可以先回答这些站内常见问题。',
    'ai.error': '在线模型暂时不可用，可以先试试上面的站内问题。',
    'ai.answer.openoctopus': 'OpenOctopus 是 KevinTen 正在构建的 Realm-native 个人智能体系统：把生活里的不同领域拆给独立智能体处理，通过共享上下文和清晰运行时边界协同工作。',
    'ai.answer.techstack': 'KevinTen 的技术栈横跨 Java、Go、TypeScript、云原生分布式系统、Dapr、Layotto、Dubbo、MCP 工具、AI Agent 和 AI Native 全栈应用工程。',
    'ai.answer.multiruntime': '多运行时架构强调把服务调用、状态、工作流、工具执行和智能体能力拆到专门运行时里，再通过清晰契约连接，让系统可以独立演进、组合和替换。',
    'ai.answer.ainative': '他的 AI Native 实践重点是把智能体变成可落地的软件协作者：MCP 工具链、AI Coding 自动化、代码评审、问题诊断，以及个人产品工作流。',
    'ai.answer.contact': '适合交流或合作的方向包括 AI Agent 架构、云原生分布式系统、MCP 工具链、开源项目，以及 One-Person Company 式 AI 产品实验。',
    'comments.loading': '加载中...',
    'comments.loading.detail': '正在同步最近的公开留言',
    'comments.empty': '暂无留言，来写第一条吧',
    'comments.empty.detail': '第一条留言会显示在这里，适合提问、补充资料或留下合作线索。',
    'comments.disabled': '留言功能暂未启用',
    'comments.disabled.title': '留言暂时离线',
    'comments.error.load': '加载失败，请稍后重试',
    'comments.error.load.detail': '网络或接口暂时不可用。',
    'comments.error.submit': '提交失败',
    'comments.error.name': '请先填写昵称或登录',
    'comments.error.empty': '请先写点内容',
    'comments.error.rateLimit': '提交太频繁，请稍后再试',
    'comments.error.notLoggedIn': '未登录',
    'comments.status.approved': '已发布',
    'comments.status.pending': '已提交，待审核',
    'comments.status.sending': '正在提交，稍等片刻',
    'comments.submitting': '提交中...',
    'comments.composer.kicker': '留言通道',
    'comments.composer.title': '写下具体想法',
    'comments.composer.desc': '可以匿名，也可以登录后留下可识别身份。内容会经过审核后展示。',
    'comments.auth.label': '当前身份',
    'comments.name.label': '昵称',
    'comments.website.label': '链接',
    'comments.message.label': '内容',
    'comments.hint.markdown': '支持 Markdown：**加粗** 与 `代码`',
    'comments.submit': '提交留言',
    'comments.reply': '回复',
    'comments.reply.submit': '提交回复',
    'comments.placeholder': '写下一个问题、反馈或补充信息...',
    'comments.reply.placeholder': '回复...',
    'comments.guest': '访客',
    'comments.name.placeholder': '你的名字或代号',
    'comments.website.placeholder': '网站或主页，可选',
    'auth.login': '登录',
    'auth.logout': '退出',
    'auth.status.guest': '匿名浏览，可直接留言',
    'auth.status.signedIn': '已登录，留言会带上身份',
    'auth.status.unavailable': '登录暂不可用，仍可匿名留言',
    'rewards.title': '支持与鸣谢',
    'rewards.desc': '真实收款当前启用支付宝扫码；微信收款码未配置；Stripe 内嵌沙箱测试完成后由 webhook 验证入库。',
    'rewards.note': '支付宝扫码完成后填写右侧信息；Stripe 沙箱会打开内嵌支付页，验证到账后展示在鸣谢墙。',
    'rewards.submit': '提交待确认',
    'rewards.submitting': '提交中...',
    'rewards.stripe.start': '创建 Stripe 内嵌支付',
    'rewards.stripe.loading': '创建 Stripe 支付中...',
    'rewards.disabled': '鸣谢功能暂未启用',
    'rewards.empty': '还没有公开鸣谢。',
    'rewards.verified': '已确认',
    'rewards.status.sending': '正在提交待确认记录',
    'rewards.status.pending': '已提交待确认，核对到账后会出现在鸣谢墙',
    'rewards.error.name': '请先填写昵称',
    'rewards.error.submit': '提交失败，请稍后再试',
    'rewards.error.load': '鸣谢墙暂时不可用。'
  };

  function saveChinese() {
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      var key = els[i].getAttribute('data-i18n');
      if (!originalTexts[key]) {
        originalTexts[key] = els[i].textContent;
      }
    }
  }

  function getText(key, fallback) {
    var current = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
    if (current === 'en' && EN[key]) {
      return EN[key];
    }
    if (current === 'zh' && originalTexts[key]) {
      return originalTexts[key];
    }
    return fallback !== undefined ? fallback : key;
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

    // Handle placeholders
    var placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    for (var p = 0; p < placeholders.length; p++) {
      var pKey = placeholders[p].getAttribute('data-i18n-placeholder');
      if (lang === 'en' && EN[pKey]) {
        placeholders[p].placeholder = EN[pKey];
      } else if (lang === 'zh' && originalTexts[pKey]) {
        placeholders[p].placeholder = originalTexts[pKey];
      }
    }

    // Update html lang attribute
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';

    // Update toggle button text
    var toggles = document.querySelectorAll('.lang-toggle-btn span');
    for (var j = 0; j < toggles.length; j++) {
      toggles[j].textContent = lang === 'en' ? '中文' : 'EN';
    }

    // Notify other modules
    try {
      var event = new CustomEvent('langchange', { detail: { lang: lang } });
      document.dispatchEvent(event);
    } catch (e) {}
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

  window.I18n = { toggle: toggle, get: getText };
})();
