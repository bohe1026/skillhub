import { describe, expect, it } from 'vitest'
import {
  getPublishCategoryLabelSlugs,
  SKILL_DISCOVERY_GROUPS,
  SKILL_DISCOVERY_LABEL_SLUGS,
} from './skill-discovery-taxonomy'

describe('skill discovery taxonomy', () => {
  it('keeps category and scenario labels available for real filtering', () => {
    expect(SKILL_DISCOVERY_GROUPS).toHaveLength(6)
    expect(SKILL_DISCOVERY_LABEL_SLUGS.has('cat-content-generation')).toBe(true)
    expect(SKILL_DISCOVERY_LABEL_SLUGS.has('scene-text-to-image')).toBe(true)
  })

  it('builds publish label slugs from required category and optional scenario', () => {
    expect(getPublishCategoryLabelSlugs('cat-content-generation', [
      'scene-text-to-image',
      'scene-image-to-image',
    ])).toEqual([
      'cat-content-generation',
      'scene-text-to-image',
      'scene-image-to-image',
    ])
    expect(getPublishCategoryLabelSlugs('cat-content-generation', [])).toEqual(['cat-content-generation'])
  })
})
