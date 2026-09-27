import { describe, expect, it } from 'vitest'
import { generateLaunchKit } from './brandGenerator'
import { generateLocalizedManifestos } from './localization'

describe('generateLocalizedManifestos', () => {
  it('generates culturally attuned translations for English, Chinese, Korean, Japanese, and Spanish', () => {
    const kit = generateLaunchKit('Angry billionaire cat that hates Wall Street.')
    const localized = generateLocalizedManifestos(kit)

    // English
    expect(localized.en).toBeDefined()
    expect(localized.en.languageName).toBe('English')
    expect(localized.en.markdown).toContain('Official Manifesto')

    // Chinese
    expect(localized.zh).toBeDefined()
    expect(localized.zh.languageName).toContain('Chinese')
    expect(localized.zh.markdown).toContain('官方中文宣言与冲锋指南')
    expect(localized.zh.raidMessages.length).toBeGreaterThan(0)
    expect(localized.zh.tokenomicsSummary).toContain('100% LP锁定')

    // Korean
    expect(localized.kr).toBeDefined()
    expect(localized.kr.languageName).toContain('Korean')
    expect(localized.kr.markdown).toContain('공식 한국어 매니페스토')
    expect(localized.kr.raidMessages.length).toBeGreaterThan(0)

    // Japanese
    expect(localized.jp).toBeDefined()
    expect(localized.jp.languageName).toContain('Japanese')
    expect(localized.jp.markdown).toContain('公式日本語マニフェスト')
    expect(localized.jp.raidMessages.length).toBeGreaterThan(0)

    // Spanish
    expect(localized.es).toBeDefined()
    expect(localized.es.languageName).toContain('Spanish')
    expect(localized.es.markdown).toContain('Manifiesto Oficial en Español')
    expect(localized.es.raidMessages.length).toBeGreaterThan(0)
  })
})
