'use client';

import { useI18n } from '@/providers/I18nProvider';
import MetricCard from '@/components/ui/MetricCard';
import SectionHeader from '@/components/ui/SectionHeader';

const METRICS = [
  { icon: '\u{1F4BC}', value: 7, labelKey: 'impact.years.label', labelZh: '年工作经验', descKey: 'impact.years.desc', descZh: '软件架构师' },
  { icon: '\u{1F3D7}\u{FE0F}', value: 2, labelKey: 'impact.systems.label', labelZh: '亿级流量系统', descKey: 'impact.systems.desc', descZh: '主导设计与开发' },
  { icon: '\u2B50', value: 1400, suffix: '+', labelKey: 'impact.stars.label', labelZh: 'GitHub Stars', descKey: 'impact.stars.desc', descZh: '开源项目影响力' },
  { icon: '\u{1F465}', value: 700, suffix: '+', labelKey: 'impact.sharing.label', labelZh: 'AI 技术分享', descKey: 'impact.sharing.desc', descZh: '3 次集团分享 · 700+ 人' },
  { icon: '\u{1F527}', value: 7, labelKey: 'impact.mcp.label', labelZh: '集团 MCP 后端工具矩阵', descKey: 'impact.mcp.desc', descZh: '监控 / DB / 日志 / 埋点 / GitLab' },
  { icon: '\u{1F916}', value: 10, suffix: '+', labelKey: 'impact.agents.label', labelZh: 'AI Agent 应用', descKey: 'impact.agents.desc', descZh: '旅行 / 健康 / 理财 / 起名 / 钓鱼...' },
  { icon: '\u{1F3C6}', value: 4, suffix: '+', labelKey: 'impact.hackathon.label', labelZh: 'Hackathon 奖项', descKey: 'impact.hackathon.desc', descZh: '金奖 · 亚军 · 铜奖' },
  { icon: '\u{1F4E6}', value: 10, suffix: '+', labelKey: 'impact.opensource.label', labelZh: '开源项目', descKey: 'impact.opensource.desc', descZh: '个人项目 + 社区贡献' },
  { icon: '\u{1F3A4}', value: 20, suffix: '+', labelKey: 'impact.meetup.label', labelZh: '技术 Meetup', descKey: 'impact.meetup.desc', descZh: '组织与参与' },
];

export default function ImpactSection() {
  const { t } = useI18n();
  return (
    <section className="section section-spacious section-alt" id="impact">
      <div className="container">
        <SectionHeader idx="01" title="Impact" description={t('impact.desc', '关键成果与影响力')} />
        <div className="impact-dashboard">
          {METRICS.map((m, i) => (
            <MetricCard key={i} {...m} stagger={(i % 5) + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
