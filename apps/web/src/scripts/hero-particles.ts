export interface GlyphPoint {
  x: number
  y: number
  accent: number
}

export interface SampleWordmarkOptions {
  text: string
  fontFamily: string
  fontWeight: string
  fontSize: number
  letterSpacingEm: number
  width: number
  height: number
  step?: number
}

const VERTEX = `#version 300 es
in vec2 a_start;
in vec2 a_target;
in float a_delay;
in float a_size;
in float a_brightness;
in float a_accent;
in float a_depth;
in float a_seed;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_progress;
uniform vec2 u_pointer;
uniform float u_pointerStrength;
out float v_brightness;
out float v_accent;
void main() {
  float span = max(0.18, 1.0 - max(a_delay, 0.0));
  float t = clamp((u_progress - a_delay) / span, 0.0, 1.0);
  float e = 1.0 - pow(1.0 - t, 3.0);
  vec2 pos = mix(a_start, a_target, e);
  float idle = smoothstep(0.82, 1.0, u_progress);
  float swirl = u_time * (0.22 + a_seed * 0.18);
  float glyph = step(0.0, a_delay);
  pos += vec2(sin(swirl + a_seed * 6.2832), cos(swirl * 0.83 + a_depth * 4.0)) * mix(2.4, 0.45, glyph) * idle;
  vec2 away = pos - u_pointer;
  float dist = length(away);
  pos += normalize(away + 0.0001) * u_pointerStrength * exp(-dist / 170.0);
  vec2 clip = (pos / u_resolution) * 2.0 - 1.0;
  clip.y *= -1.0;
  gl_Position = vec4(clip, 0.0, 1.0);
  gl_PointSize = a_size * (0.65 + a_depth * 1.05);
  v_brightness = a_brightness * (0.72 + 0.28 * sin(u_time * 1.7 + a_seed * 12.0));
  v_accent = a_accent;
}
`

const FRAGMENT = `#version 300 es
precision mediump float;
in float v_brightness;
in float v_accent;
out vec4 fragColor;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float d = dot(p, p);
  if (d > 1.0) discard;
  float alpha = exp(-d * 3.4) * v_brightness;
  vec3 color = mix(vec3(0.93, 0.98, 0.95), vec3(0.41, 0.78, 0.65), v_accent);
  fragColor = vec4(color * alpha, alpha);
}
`

export function downsamplePoints<T>(items: T[], max: number): T[] {
  if (items.length <= max) {
    return items
  }
  const step = items.length / max
  const next: T[] = []
  for (let index = 0; index < max; index += 1) {
    next.push(items[Math.floor(index * step)]!)
  }
  return next
}

export function glyphDelay(x: number, y: number, cx: number, cy: number, maxDist: number, jitter: number): number {
  const dist = Math.hypot(x - cx, y - cy)
  return Math.min(0.52, (dist / Math.max(1, maxDist)) * 0.38 + jitter * 0.16)
}

export function sampleWordmark(options: SampleWordmarkOptions): GlyphPoint[] {
  const canvas = document.createElement('canvas')
  const step = Math.max(1, options.step ?? 2)
  canvas.width = Math.max(1, Math.floor(options.width))
  canvas.height = Math.max(1, Math.floor(options.height))
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    return []
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#fff'
  ctx.font = `${options.fontWeight} ${options.fontSize}px ${options.fontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const spacing = `${options.letterSpacingEm * options.fontSize}px`
  if ('letterSpacing' in ctx) {
    ctx.letterSpacing = spacing
  }
  const cx = canvas.width / 2
  const cy = canvas.height / 2
  const [left, right] = options.text.split('.')
  const gap = ctx.measureText('.').width
  const leftWidth = ctx.measureText(left ?? '').width
  const rightWidth = ctx.measureText(right ?? '').width
  const total = leftWidth + gap + rightWidth
  const leftX = cx - total / 2 + leftWidth / 2
  const dotX = cx - total / 2 + leftWidth + gap / 2
  const rightX = cx + total / 2 - rightWidth / 2
  ctx.fillText(left ?? '', leftX, cy)
  ctx.fillText(right ?? '', rightX, cy)
  ctx.fillStyle = '#00ff00'
  ctx.fillText('.', dotX, cy)
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  const points: GlyphPoint[] = []
  for (let y = 0; y < canvas.height; y += step) {
    for (let x = 0; x < canvas.width; x += step) {
      const index = (y * canvas.width + x) * 4
      const r = pixels[index] ?? 0
      const g = pixels[index + 1] ?? 0
      const a = pixels[index + 3] ?? 0
      if (a < 36) {
        continue
      }
      points.push({ x, y, accent: g > 160 && r < 80 ? 1 : 0 })
    }
  }
  return points
}

function mulberry32(seed: number) {
  let value = seed >>> 0
  return () => {
    value = value + 0x6D2B79F5 | 0
    let t = Math.imul(value ^ value >>> 15, 1 | value)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) {
    return null
  }
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

interface Engine {
  stop: () => void
}

function createEngine(canvas: HTMLCanvasElement, screen: HTMLElement, title: HTMLElement): Engine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    powerPreference: 'high-performance',
  })
  if (!gl) {
    return null
  }
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX)
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT)
  if (!vertex || !fragment) {
    return null
  }
  const program = gl.createProgram()
  if (!program) {
    return null
  }
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return null
  }
  gl.useProgram(program)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE)
  gl.disable(gl.DEPTH_TEST)

  const loc = {
    start: gl.getAttribLocation(program, 'a_start'),
    target: gl.getAttribLocation(program, 'a_target'),
    delay: gl.getAttribLocation(program, 'a_delay'),
    size: gl.getAttribLocation(program, 'a_size'),
    brightness: gl.getAttribLocation(program, 'a_brightness'),
    accent: gl.getAttribLocation(program, 'a_accent'),
    depth: gl.getAttribLocation(program, 'a_depth'),
    seed: gl.getAttribLocation(program, 'a_seed'),
    resolution: gl.getUniformLocation(program, 'u_resolution'),
    time: gl.getUniformLocation(program, 'u_time'),
    progress: gl.getUniformLocation(program, 'u_progress'),
    pointer: gl.getUniformLocation(program, 'u_pointer'),
    pointerStrength: gl.getUniformLocation(program, 'u_pointerStrength'),
  }

  const buffers = {
    start: gl.createBuffer(),
    target: gl.createBuffer(),
    delay: gl.createBuffer(),
    size: gl.createBuffer(),
    brightness: gl.createBuffer(),
    accent: gl.createBuffer(),
    depth: gl.createBuffer(),
    seed: gl.createBuffer(),
  }

  let count = 0
  let assembled = false
  let startedAt = 0
  let raf = 0
  let visible = true
  let pageHidden = document.hidden
  const pointer = { x: -9999, y: -9999, strength: 0 }
  const dprCap = 1.75

  const bindFloat = (buffer: WebGLBuffer | null, location: number, data: Float32Array, size: number) => {
    if (!buffer || location < 0) {
      return
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(location)
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0)
  }

  const rebuild = () => {
    const cssWidth = Math.max(1, screen.clientWidth)
    const cssHeight = Math.max(1, screen.clientHeight)
    const dpr = Math.min(dprCap, window.devicePixelRatio || 1)
    canvas.width = Math.floor(cssWidth * dpr)
    canvas.height = Math.floor(cssHeight * dpr)
    gl.viewport(0, 0, canvas.width, canvas.height)
    const titleStyle = getComputedStyle(title)
    const fontSize = Number.parseFloat(titleStyle.fontSize) || Math.min(cssWidth * 0.12, 140)
    const mobile = cssWidth < 720
    const glyphBudget = mobile ? 3200 : 8200
    const fieldBudget = mobile ? 2200 : 6200
    const sampled = downsamplePoints(sampleWordmark({
      text: 'weapp.dev',
      fontFamily: titleStyle.fontFamily || 'Sora Variable, sans-serif',
      fontWeight: titleStyle.fontWeight || '740',
      fontSize,
      letterSpacingEm: -0.07,
      width: canvas.width,
      height: canvas.height,
      step: mobile ? 3 : 2,
    }), glyphBudget)
    if (sampled.length < 40) {
      return false
    }
    const rand = mulberry32(0x5EED ^ Math.floor(cssWidth * 13 + cssHeight))
    const cx = canvas.width / 2
    const cy = canvas.height / 2
    const maxDist = Math.hypot(canvas.width, canvas.height) * 0.28
    const total = sampled.length + fieldBudget
    const start = new Float32Array(total * 2)
    const target = new Float32Array(total * 2)
    const delay = new Float32Array(total)
    const size = new Float32Array(total)
    const brightness = new Float32Array(total)
    const accent = new Float32Array(total)
    const depth = new Float32Array(total)
    const seed = new Float32Array(total)
    sampled.forEach((point, index) => {
      const angle = rand() * Math.PI * 2
      const radius = (0.18 + rand() * 0.55) * Math.min(canvas.width, canvas.height) * 0.42
      start[index * 2] = cx + Math.cos(angle) * radius
      start[index * 2 + 1] = cy + Math.sin(angle) * radius * 0.72
      target[index * 2] = point.x
      target[index * 2 + 1] = point.y
      delay[index] = glyphDelay(point.x, point.y, cx, cy, maxDist, rand())
      size[index] = (1.5 + rand() * 1.35) * dpr
      brightness[index] = 0.52 + rand() * 0.42
      accent[index] = point.accent && rand() > 0.9 ? 1 : 0
      depth[index] = 0.55 + rand() * 0.45
      seed[index] = rand()
    })
    for (let index = 0; index < fieldBudget; index += 1) {
      const i = sampled.length + index
      const x = rand() * canvas.width
      const y = rand() * canvas.height
      start[i * 2] = x
      start[i * 2 + 1] = y
      target[i * 2] = x
      target[i * 2 + 1] = y
      delay[i] = -1
      size[i] = (0.8 + rand() * 1.4) * dpr
      brightness[i] = 0.08 + rand() * 0.22
      accent[i] = rand() > 0.86 ? 0.65 : 0
      depth[i] = rand()
      seed[i] = rand()
    }
    count = total
    bindFloat(buffers.start, loc.start, start, 2)
    bindFloat(buffers.target, loc.target, target, 2)
    bindFloat(buffers.delay, loc.delay, delay, 1)
    bindFloat(buffers.size, loc.size, size, 1)
    bindFloat(buffers.brightness, loc.brightness, brightness, 1)
    bindFloat(buffers.accent, loc.accent, accent, 1)
    bindFloat(buffers.depth, loc.depth, depth, 1)
    bindFloat(buffers.seed, loc.seed, seed, 1)
    return true
  }

  if (!rebuild()) {
    return null
  }

  const hold = 280
  const assemble = 1750
  const tick = (now: number) => {
    if (!startedAt) {
      startedAt = now
    }
    const elapsed = now - startedAt
    const progress = assembled ? 1 : Math.min(1, Math.max(0, (elapsed - hold) / assemble))
    if (progress >= 1) {
      assembled = true
      screen.dataset.particlesReady = ''
    }
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(program)
    gl.uniform2f(loc.resolution, canvas.width, canvas.height)
    gl.uniform1f(loc.time, elapsed / 1000)
    gl.uniform1f(loc.progress, progress)
    gl.uniform2f(loc.pointer, pointer.x, pointer.y)
    gl.uniform1f(loc.pointerStrength, pointer.strength)
    gl.drawArrays(gl.POINTS, 0, count)
    if (visible && !pageHidden) {
      raf = requestAnimationFrame(tick)
    }
  }

  const play = () => {
    if (raf || !visible || pageHidden) {
      return
    }
    raf = requestAnimationFrame(tick)
  }
  const pause = () => {
    cancelAnimationFrame(raf)
    raf = 0
  }

  const onPointer = (event: PointerEvent) => {
    const box = canvas.getBoundingClientRect()
    const sx = canvas.width / Math.max(1, box.width)
    const sy = canvas.height / Math.max(1, box.height)
    pointer.x = (event.clientX - box.left) * sx
    pointer.y = (event.clientY - box.top) * sy
    pointer.strength = 42
  }
  const onPointerLeave = () => {
    pointer.strength = 0
  }
  const onVisibility = () => {
    pageHidden = document.hidden
    if (pageHidden) {
      pause()
    }
    else {
      play()
    }
  }
  const resizeObserver = new ResizeObserver(() => {
    const ready = assembled
    if (!rebuild()) {
      return
    }
    if (ready) {
      assembled = true
      screen.dataset.particlesReady = ''
    }
  })
  const intersection = new IntersectionObserver((entries) => {
    visible = entries.some(entry => entry.isIntersecting)
    if (visible) {
      play()
    }
    else { pause() }
  }, { threshold: 0.08 })

  screen.addEventListener('pointermove', onPointer)
  screen.addEventListener('pointerleave', onPointerLeave)
  document.addEventListener('visibilitychange', onVisibility)
  resizeObserver.observe(screen)
  intersection.observe(screen)
  play()

  return {
    stop() {
      pause()
      resizeObserver.disconnect()
      intersection.disconnect()
      screen.removeEventListener('pointermove', onPointer)
      screen.removeEventListener('pointerleave', onPointerLeave)
      document.removeEventListener('visibilitychange', onVisibility)
      delete screen.dataset.particlesReady
      const ext = gl.getExtension('WEBGL_lose_context')
      ext?.loseContext()
    },
  }
}

function bindHeroCosmos(screen: HTMLElement) {
  const root = document.documentElement
  const sync = (on: boolean) => {
    root.toggleAttribute('data-hero-cosmos', on)
  }
  sync(true)
  const observer = new IntersectionObserver((entries) => {
    sync(entries.some(entry => entry.isIntersecting && entry.intersectionRatio > 0.28))
  }, { threshold: [0, 0.28, 0.6, 1] })
  observer.observe(screen)
  return () => {
    observer.disconnect()
    sync(false)
  }
}

export function defineHeroParticles() {
  if (customElements.get('hero-particles')) {
    return
  }
  class HeroParticles extends HTMLElement {
    #stop: (() => void) | undefined
    connectedCallback() {
      if (this.#stop) {
        return
      }
      const canvas = this.querySelector('canvas')
      const screen = this.closest<HTMLElement>('.home-hero-screen')
      const title = document.getElementById('home-hero-title')
      if (!screen) {
        return
      }
      const unbind = bindHeroCosmos(screen)
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !canvas || !title) {
        this.#stop = unbind
        return
      }
      const engine = createEngine(canvas, screen, title)
      if (!engine) {
        this.#stop = unbind
        return
      }
      this.#stop = () => {
        engine.stop()
        unbind()
      }
    }

    disconnectedCallback() {
      this.#stop?.()
      this.#stop = undefined
    }
  }
  customElements.define('hero-particles', HeroParticles)
}
