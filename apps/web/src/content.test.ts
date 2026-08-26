import { describe, expect, it } from 'vitest'
import varo from './content/projects/varo.json'
import tailwind from './content/projects/weapp-tailwindcss.json'
import vite from './content/projects/weapp-vite.json'

describe('project definitions', () => {
  const projects = [tailwind, vite, varo]

  it('provides complete localized content for every project', () => {
    for (const project of projects) {
      for (const locale of ['zh-CN', 'en'] as const) {
        expect(project.locales[locale].name).not.toHaveLength(0)
        expect(project.locales[locale].description).not.toHaveLength(0)
        expect(project.locales[locale].capabilities.length).toBeGreaterThan(0)
      }
    }
  })

  it('reserves canonical documentation routes without publishing them', () => {
    for (const project of projects) {
      expect(project.futureDocsPath).toMatch(/^\/docs\/[\w-]+\/$/)
      expect(project.docsUrl).toMatch(/^https:\/\//)
    }
  })

  it('uses explicit placeholders for the planned Varo release', () => {
    expect(varo).toMatchObject({
      status: 'planned',
      packageName: '@varo/cli',
      github: 'daguanren21/Varo',
      docsUrl: 'https://github.com/daguanren21/Varo#readme',
    })
  })
})
