import { describe, expect, it } from 'vitest'
import { downsamplePoints, glyphDelay, sampleWordmark } from './hero-particles'

describe('hero particle layout', () => {
  it('downsamples a dense cloud without emptying it', () => {
    const source = Array.from({ length: 40 }, (_, index) => index)
    expect(downsamplePoints(source, 10)).toHaveLength(10)
    expect(downsamplePoints(source, 80)).toEqual(source)
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
