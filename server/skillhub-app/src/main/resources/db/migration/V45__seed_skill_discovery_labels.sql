-- Seed business discovery labels used by the publish form and search page.
-- These are real label definitions, so publishing with a selected category writes to skill_label.

WITH seed_labels(slug, sort_order, zh_name, en_name) AS (
    VALUES
        ('cat-content-generation', 100, '内容生成', 'Content Generation'),
        ('scene-text-to-image', 110, '文生图', 'Text to Image'),
        ('scene-image-to-image', 111, '图生图', 'Image to Image'),
        ('scene-text-to-video', 112, '文生视频', 'Text to Video'),
        ('cat-document-knowledge', 200, '文档知识', 'Docs & Knowledge'),
        ('scene-contract-review', 210, '合同审查', 'Contract Review'),
        ('scene-knowledge-qa', 211, '知识问答', 'Knowledge Q&A'),
        ('scene-report-writing', 212, '报告生成', 'Report Writing'),
        ('cat-data-analysis', 300, '数据分析', 'Data Analysis'),
        ('scene-sql-generation', 310, 'SQL 生成', 'SQL Generation'),
        ('scene-report-analysis', 311, '报表分析', 'Report Analysis'),
        ('scene-charting', 312, '图表生成', 'Charting'),
        ('cat-development', 400, '研发提效', 'Developer Productivity'),
        ('scene-code-review', 410, '代码审查', 'Code Review'),
        ('scene-unit-test', 411, '单测生成', 'Unit Tests'),
        ('scene-log-analysis', 412, '日志分析', 'Log Analysis'),
        ('cat-office', 500, '业务办公', 'Business Office'),
        ('scene-meeting-notes', 510, '会议纪要', 'Meeting Notes'),
        ('scene-email-writing', 511, '邮件撰写', 'Email Writing'),
        ('scene-customer-service', 512, '客服回复', 'Customer Service'),
        ('cat-ops-security', 600, '运维安全', 'Ops & Security'),
        ('scene-alert-analysis', 610, '告警分析', 'Alert Analysis'),
        ('scene-security-scan', 611, '安全扫描', 'Security Scan'),
        ('scene-risk-report', 612, '风险报告', 'Risk Report')
),
upserted AS (
    INSERT INTO label_definition (slug, type, visible_in_filter, sort_order, created_by)
    SELECT slug, 'RECOMMENDED', TRUE, sort_order, NULL
    FROM seed_labels
    ON CONFLICT (slug) DO UPDATE
        SET type = EXCLUDED.type,
            visible_in_filter = TRUE,
            sort_order = EXCLUDED.sort_order,
            updated_at = CURRENT_TIMESTAMP
    RETURNING id, slug
)
INSERT INTO label_translation (label_id, locale, display_name)
SELECT upserted.id, translation.locale, translation.display_name
FROM upserted
JOIN seed_labels ON seed_labels.slug = upserted.slug
CROSS JOIN LATERAL (
    VALUES
        ('zh', seed_labels.zh_name),
        ('zh-CN', seed_labels.zh_name),
        ('en', seed_labels.en_name)
) AS translation(locale, display_name)
ON CONFLICT (label_id, locale) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        updated_at = CURRENT_TIMESTAMP;
