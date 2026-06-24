export type SkillDiscoveryItem = {
  labelKey: string
  fallbackLabel: string
  slug: string
  query: string
}

export type SkillDiscoveryGroup = SkillDiscoveryItem & {
  iconKey: 'content' | 'document' | 'data' | 'development' | 'office' | 'opsSecurity'
  accentClassName: string
  scenarios: SkillDiscoveryItem[]
}

export const SKILL_DISCOVERY_GROUPS: SkillDiscoveryGroup[] = [
  {
    iconKey: 'content',
    labelKey: 'search.discovery.groups.content',
    fallbackLabel: '内容生成',
    slug: 'cat-content-generation',
    query: '内容生成',
    accentClassName: 'bg-blue-600 text-white',
    scenarios: [
      { labelKey: 'search.discovery.scenarios.textToImage', fallbackLabel: '文生图', slug: 'scene-text-to-image', query: '文生图' },
      { labelKey: 'search.discovery.scenarios.imageToImage', fallbackLabel: '图生图', slug: 'scene-image-to-image', query: '图生图' },
      { labelKey: 'search.discovery.scenarios.textToVideo', fallbackLabel: '文生视频', slug: 'scene-text-to-video', query: '文生视频' },
    ],
  },
  {
    iconKey: 'document',
    labelKey: 'search.discovery.groups.document',
    fallbackLabel: '文档知识',
    slug: 'cat-document-knowledge',
    query: '文档 知识',
    accentClassName: 'bg-emerald-500 text-white',
    scenarios: [
      { labelKey: 'search.discovery.scenarios.contractReview', fallbackLabel: '合同审查', slug: 'scene-contract-review', query: '合同审查' },
      { labelKey: 'search.discovery.scenarios.knowledgeQa', fallbackLabel: '知识问答', slug: 'scene-knowledge-qa', query: '知识问答' },
      { labelKey: 'search.discovery.scenarios.reportWriting', fallbackLabel: '报告生成', slug: 'scene-report-writing', query: '报告生成' },
    ],
  },
  {
    iconKey: 'data',
    labelKey: 'search.discovery.groups.data',
    fallbackLabel: '数据分析',
    slug: 'cat-data-analysis',
    query: '数据分析',
    accentClassName: 'bg-cyan-500 text-white',
    scenarios: [
      { labelKey: 'search.discovery.scenarios.sql', fallbackLabel: 'SQL 生成', slug: 'scene-sql-generation', query: 'SQL 生成' },
      { labelKey: 'search.discovery.scenarios.reportAnalysis', fallbackLabel: '报表分析', slug: 'scene-report-analysis', query: '报表分析' },
      { labelKey: 'search.discovery.scenarios.charting', fallbackLabel: '图表生成', slug: 'scene-charting', query: '图表生成' },
    ],
  },
  {
    iconKey: 'development',
    labelKey: 'search.discovery.groups.development',
    fallbackLabel: '研发提效',
    slug: 'cat-development',
    query: '研发 提效',
    accentClassName: 'bg-violet-500 text-white',
    scenarios: [
      { labelKey: 'search.discovery.scenarios.codeReview', fallbackLabel: '代码审查', slug: 'scene-code-review', query: '代码审查' },
      { labelKey: 'search.discovery.scenarios.unitTest', fallbackLabel: '单测生成', slug: 'scene-unit-test', query: '单测生成' },
      { labelKey: 'search.discovery.scenarios.logAnalysis', fallbackLabel: '日志分析', slug: 'scene-log-analysis', query: '日志分析' },
    ],
  },
  {
    iconKey: 'office',
    labelKey: 'search.discovery.groups.office',
    fallbackLabel: '业务办公',
    slug: 'cat-office',
    query: '业务办公',
    accentClassName: 'bg-amber-500 text-white',
    scenarios: [
      { labelKey: 'search.discovery.scenarios.meeting', fallbackLabel: '会议纪要', slug: 'scene-meeting-notes', query: '会议纪要' },
      { labelKey: 'search.discovery.scenarios.email', fallbackLabel: '邮件撰写', slug: 'scene-email-writing', query: '邮件撰写' },
      { labelKey: 'search.discovery.scenarios.customerService', fallbackLabel: '客服回复', slug: 'scene-customer-service', query: '客服回复' },
    ],
  },
  {
    iconKey: 'opsSecurity',
    labelKey: 'search.discovery.groups.opsSecurity',
    fallbackLabel: '运维安全',
    slug: 'cat-ops-security',
    query: '运维 安全',
    accentClassName: 'bg-slate-700 text-white',
    scenarios: [
      { labelKey: 'search.discovery.scenarios.alert', fallbackLabel: '告警分析', slug: 'scene-alert-analysis', query: '告警分析' },
      { labelKey: 'search.discovery.scenarios.securityScan', fallbackLabel: '安全扫描', slug: 'scene-security-scan', query: '安全扫描' },
      { labelKey: 'search.discovery.scenarios.riskReport', fallbackLabel: '风险报告', slug: 'scene-risk-report', query: '风险报告' },
    ],
  },
]

export const SKILL_DISCOVERY_LABEL_SLUGS = new Set(
  SKILL_DISCOVERY_GROUPS.flatMap((group) => [group.slug, ...group.scenarios.map((scenario) => scenario.slug)])
)

export function getPublishCategoryLabelSlugs(categorySlug: string, scenarioSlugs: string[]) {
  return [categorySlug, ...scenarioSlugs].filter(Boolean)
}
