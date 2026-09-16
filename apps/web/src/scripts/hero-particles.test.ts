import { describe, expect, it } from 'vitest'
import { downsamplePoints, glyphDelay, pairClouds, pickParticleKind, sampleWordmark } from './hero-particles'

describe('hero particle layout', () => {
  it('downsamples a dense cloud without emptying it', () => {
    const source = Array.from({ length: 40 }, (_, index) => index)
    expect(downsamplePoints(source, 10)).toHaveLength(10)
    expect(downsamplePoints(source, 80)).toEqual(source)
  })

  it('assigns planet kinds for giants and mixed glyph dust', () => {
    expect(pickParticleKind(0.1, 0, 'giant')).toBe(5)
    expect(pickParticleKind(0.5, 0, 'giant')).toBe(2)
    expect(pickParticleKind(0.9, 0, 'giant')).toBe(1)
    expect(pickParticleKind(0.2, 0, 'glyph')).toBe(0)
    expect(pickParticleKind(0.8, 0, 'glyph')).toBe(1)
    expect(pickParticleKind(0.2, 1, 'glyph')).toBe(3)
  })

  it('pairs clouds by angle so morphs keep neighborhood', () => {
    const from = [
      { x: 2, y: 0, accent: 0 },
      { x: 0, y: 2, accent: 0 },
    ]
    const to = [
      { x: 4, y: 0, accent: 1 },
      { x: 0, y: 4, accent: 0 },
      { x: -4, y: 0, accent: 0 },
    ]
    const pairs = pairClouds(from, to, 0, 0)
    expect(pairs).toHaveLength(3)
    expect(pairs[0]?.from).toEqual(from[0])
    expect(pairs.every(pair => pair.from && pair.to)).toBe(true)
  })

  it('delays edge glyph particles more than the center', () => {
    const center = glyphDelay(400, 200, 400, 200, 400, 0)
    const edge = glyphDelay(40, 40, 400, 200, 400, 0)
    expect(edge).toBeGreaterThan(center)
    expect(edge).toBeLessThanOrEqual(0.52)
  })

  it('samples a weapp.dev cloud when a 2d canvas is available', () => {
    if (typeof document === 'undefined') {
      return
    }
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext?.('2d')
    if (!ctx) {
      return
    }
    const points = sampleWordmark({
      text: 'weapp.dev',
      fontFamily: 'sans-serif',
      fontWeight: '700',
      fontSize: 96,
      letterSpacingEm: -0.07,
      width: 720,
      height: 280,
      step: 2,
    })
    expect(points.length).toBeGreaterThan(80)
    const xs = points.map(point => point.x)
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(180)
    expect(points.some(point => point.accent === 1)).toBe(true)
  })
})
