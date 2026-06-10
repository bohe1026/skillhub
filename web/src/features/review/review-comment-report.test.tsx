import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ReviewCommentReport } from './review-comment-report'

describe('ReviewCommentReport', () => {
  it('renders the automatic Skill Judge report content', () => {
    const html = renderToStaticMarkup(
      <ReviewCommentReport
        comment={`# Skill Judge 自动审核报告

结论：自动拒绝
分数：84/120

## 逐项问题
1. description 缺少明确触发场景。

## 示例改写
1. 建议写法：

\`\`\`markdown
description: Use when reviewing SKILL.md packages.
\`\`\``}
      />
    )

    expect(html).toContain('Skill Judge 自动审核报告')
    expect(html).toContain('结论：自动拒绝')
    expect(html).toContain('description 缺少明确触发场景')
    expect(html).toContain('description: Use when reviewing SKILL.md packages.')
  })

  it('keeps compact comments readable in review lists', () => {
    const html = renderToStaticMarkup(
      <ReviewCommentReport comment="# Skill Judge 自动审核报告\n\n结论：自动通过" compact />
    )

    expect(html).toContain('whitespace-pre-wrap')
    expect(html).toContain('Skill Judge 自动审核报告')
    expect(html).toContain('结论：自动通过')
  })
})
