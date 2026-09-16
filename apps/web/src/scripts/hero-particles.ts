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

export type ParticleRole = 'glyph' | 'field' | 'giant'

export const MINIPROGRAM_VIEWBOX = 1024
export const MINIPROGRAM_PATH = 'M512 0a512 512 0 1 0 512 512A512 512 0 0 0 512 0z m256.717 460.186a151.962 151.962 0 0 1-87.347 65.74 83.251 83.251 0 0 1-24.474 4.096 29.082 29.082 0 0 1 0-58.163 15.667 15.667 0 0 0 6.451-1.229 91.443 91.443 0 0 0 55.91-40.96 75.264 75.264 0 0 0 11.06-39.628c0-45.978-42.496-83.866-94.31-83.866a105.267 105.267 0 0 0-51.2 13.414 81.92 81.92 0 0 0-43.725 70.452v244.224a138.445 138.445 0 0 1-72.704 120.422 159.642 159.642 0 0 1-79.77 20.48c-84.378 0-153.6-63.488-153.6-142.029a136.192 136.192 0 0 1 19.763-69.837 151.962 151.962 0 0 1 87.347-65.74 85.914 85.914 0 0 1 24.474-4.096 29.082 29.082 0 1 1 0 58.163 15.667 15.667 0 0 0-6.451 1.229 95.949 95.949 0 0 0-55.91 40.96 75.264 75.264 0 0 0-11.06 39.628c0 45.978 42.496 83.866 94.925 83.866a105.267 105.267 0 0 0 51.2-13.414 81.92 81.92 0 0 0 43.622-70.452V390.35a138.752 138.752 0 0 1 72.807-120.525 151.245 151.245 0 0 1 79.155-21.504c84.378 0 153.6 63.488 153.6 142.029a136.192 136.192 0 0 1-19.763 69.837z'

const VERTEX = `#version 300 es
in vec2 a_start;
in vec2 a_target;
in float a_delay;
in float a_size;
in float a_brightness;
in float a_accent;
in float a_depth;
in float a_seed;
in float a_kind;
in float a_orbit;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_progress;
uniform vec2 u_pointer;
uniform float u_pointerStrength;
out float v_brightness;
out float v_accent;
out float v_kind;
out float v_spin;
out float v_seed;
void main() {
  float span = max(0.18, 1.0 - max(a_delay, 0.0));
  float t = clamp((u_progress - a_delay) / span, 0.0, 1.0);
  float e = 1.0 - pow(1.0 - t, 3.0);
  vec2 pos = mix(a_start, a_target, e);
  float idle = max(
    1.0 - smoothstep(0.0, 0.12, u_progress),
    smoothstep(0.55, 1.0, u_progress)
  );
  float glyph = step(0.0, a_delay);
  float speed = mix(0.06, 0.38, glyph) * (0.55 + a_seed);
  float ang = u_time * speed + a_seed * 6.2832;
  pos += vec2(cos(ang), sin(ang * 0.87)) * a_orbit * idle;
  pos += vec2(
    sin(u_time * 0.042 + a_seed * 5.1),
    cos(u_time * 0.031 + a_depth * 2.7)
  ) * mix(a_orbit * 2.4, 0.35, glyph) * idle;
  vec2 away = pos - u_pointer;
  float dist = length(away);
  pos += normalize(away + 0.0001) * u_pointerStrength * exp(-dist / 170.0);
  vec2 clip = (pos / u_resolution) * 2.0 - 1.0;
  clip.y *= -1.0;
  gl_Position = vec4(clip, 0.0, 1.0);
  gl_PointSize = min(48.0, a_size * (0.72 + a_depth * 0.85));
  v_brightness = a_brightness * (0.82 + 0.18 * sin(u_time * 1.35 + a_seed * 12.0));
  v_accent = a_accent;
  v_kind = a_kind;
  v_spin = u_time * (0.11 + a_seed * 0.32);
  v_seed = a_seed;
}
`

const FRAGMENT = `#version 300 es
precision mediump float;
in float v_brightness;
in float v_accent;
in float v_kind;
in float v_spin;
in float v_seed;
out vec4 fragColor;
void main() {
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  float ca = cos(v_spin);
  float sa = sin(v_spin);
  vec2 p = vec2(ca * uv.x - sa * uv.y, sa * uv.x + ca * uv.y);
  int k = int(floor(v_kind + 0.5));
  vec3 light = normalize(vec3(0.38, 0.56, 0.74));
  vec3 cold = vec3(0.93, 0.98, 0.95);
  vec3 green = vec3(0.41, 0.78, 0.65);
  if (k == 0) {
    float d = dot(uv, uv);
    if (d > 1.0) {
      discard;
    }
    float alpha = exp(-d * 3.4) * v_brightness;
    fragColor = vec4(mix(cold, green, v_accent) * alpha, alpha);
    return;
  }
  if (k == 3) {
    float d = dot(uv, uv);
    float spike = max(0.0, 1.0 - abs(uv.x) * 9.0) * max(0.0, 1.0 - abs(uv.y) * 1.7)
      + max(0.0, 1.0 - abs(uv.y) * 9.0) * max(0.0, 1.0 - abs(uv.x) * 1.7);
    float core = exp(-d * 10.0);
    float alpha = (core * 1.25 + spike * 0.58) * v_brightness;
    if (alpha < 0.02) {
      discard;
    }
    fragColor = vec4(mix(cold, green, v_accent) * alpha, alpha);
    return;
  }
  float r = length(p);
  float ring = 0.0;
  if (k == 5) {
    float ell = abs(p.y * 3.15 + p.x * 0.14);
    ring = smoothstep(0.18, 0.02, ell) * smoothstep(1.28, 0.7, length(vec2(p.x, p.y * 0.32)));
  }
  if (r > 1.0 && ring < 0.02) {
    discard;
  }
  float z = sqrt(max(0.0, 1.0 - r * r));
  vec3 n = vec3(p, z);
  float ndl = max(0.16, dot(n, light));
  vec3 albedo = mix(vec3(0.5, 0.58, 0.54), green, v_accent * 0.55);
  if (k == 2) {
    albedo = mix(vec3(0.42, 0.6, 0.56), green, 0.4) * (0.58 + 0.42 * sin((p.y + v_seed) * 10.0));
  }
  else if (k == 4) {
    albedo = vec3(0.66, 0.68, 0.7) * (0.82 + 0.18 * sin(p.x * 14.0 + v_seed * 8.0));
  }
  else if (k == 1) {
    albedo *= 0.78 + 0.22 * sin((p.x * 3.4 + p.y * 5.1 + v_seed) * 4.0);
  }
  vec3 color = albedo * ndl;
  float limb = smoothstep(1.02, 0.76, r);
  float alpha = v_brightness * limb;
  if (k == 5) {
    color += mix(vec3(0.55, 0.72, 0.66), green, 0.35) * ring * 0.9;
    alpha = max(alpha, ring * v_brightness);
  }
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

export function pickParticleKind(rand: number, accent: number, role: ParticleRole): number {
  if (role === 'giant') {
    if (rand < 0.34) {
      return 5
    }
    if (rand < 0.7) {
      return 2
    }
    return 1
  }
  if (accent > 0.5) {
    return rand < 0.55 ? 3 : 1
  }
  if (role === 'glyph') {
    if (rand < 0.68) {
      return 0
    }
    if (rand < 0.88) {
      return 1
    }
    if (rand < 0.95) {
      return 4
    }
    return 3
  }
  if (rand < 0.74) {
    return 0
  }
  if (rand < 0.88) {
    return 1
  }
  if (rand < 0.94) {
    return 3
  }
  if (rand < 0.98) {
    return 4
  }
  return 2
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

export interface SamplePathOptions {
  d: string
  viewBox: number
  width: number
  height: number
  size: number
  step?: number
}

export function samplePathSilhouette(options: SamplePathOptions): GlyphPoint[] {
  const canvas = document.createElement('canvas')
  const step = Math.max(1, options.step ?? 2)
  canvas.width = Math.max(1, Math.floor(options.width))
  canvas.height = Math.max(1, Math.floor(options.height))
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx || typeof Path2D !== 'function') {
    return []
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.translate(canvas.width / 2, canvas.height / 2)
  const scale = options.size / options.viewBox
  ctx.scale(scale, scale)
  ctx.translate(-options.viewBox / 2, -options.viewBox / 2)
  ctx.fillStyle = '#fff'
  ctx.fill(new Path2D(options.d), 'evenodd')
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  const points: GlyphPoint[] = []
  for (let y = 0; y < canvas.height; y += step) {
    for (let x = 0; x < canvas.width; x += step) {
      const index = (y * canvas.width + x) * 4
      const a = pixels[index + 3] ?? 0
      if (a < 36) {
        continue
      }
      points.push({ x, y, accent: 0 })
    }
  }
  return points
}

export function sortCloud(points: GlyphPoint[], cx: number, cy: number): GlyphPoint[] {
  return [...points].sort((left, right) => {
    const angle = Math.atan2(left.y - cy, left.x - cx) - Math.atan2(right.y - cy, right.x - cx)
    if (angle !== 0) {
      return angle
    }
    return left.x - right.x
  })
}

export function pairClouds(from: GlyphPoint[], to: GlyphPoint[], cx: number, cy: number): Array<{ from: GlyphPoint, to: GlyphPoint }> {
  if (from.length === 0 || to.length === 0) {
    return []
  }
  const start = sortCloud(from, cx, cy)
  const end = sortCloud(to, cx, cy)
  const count = Math.max(start.length, end.length)
  const pairs: Array<{ from: GlyphPoint, to: GlyphPoint }> = []
  for (let index = 0; index < count; index += 1) {
    pairs.push({
      from: start[index % start.length]!,
      to: end[index % end.length]!,
    })
  }
  return pairs
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
    kind: gl.getAttribLocation(program, 'a_kind'),
    orbit: gl.getAttribLocation(program, 'a_orbit'),
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
    kind: gl.createBuffer(),
    orbit: gl.createBuffer(),
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
    const cssFontSize = Number.parseFloat(titleStyle.fontSize) || Math.min(cssWidth * 0.17, 208)
    const fontSize = cssFontSize * dpr
    const mobile = cssWidth < 720
    const glyphBudget = mobile ? 2800 : 7800
    const fieldBudget = mobile ? 1800 : 5200
    const giantCount = mobile ? 8 : 14
    const word = downsamplePoints(sampleWordmark({
      text: 'weapp.dev',
      fontFamily: titleStyle.fontFamily || 'Sora Variable, sans-serif',
      fontWeight: titleStyle.fontWeight || '740',
      fontSize,
      letterSpacingEm: -0.07,
      width: canvas.width,
      height: canvas.height,
      step: 2,
    }), glyphBudget)
    const mark = downsamplePoints(samplePathSilhouette({
      d: MINIPROGRAM_PATH,
      viewBox: MINIPROGRAM_VIEWBOX,
      width: canvas.width,
      height: canvas.height,
      size: Math.min(canvas.width, canvas.height) * (mobile ? 0.42 : 0.46),
      step: 2,
    }), glyphBudget)
    const cx = canvas.width / 2
    const cy = canvas.height / 2
    const paired = pairClouds(mark, word, cx, cy)
    if (paired.length < 40) {
      return false
    }
    const rand = mulberry32(0x5EED ^ Math.floor(cssWidth * 13 + cssHeight))
    const maxDist = Math.hypot(canvas.width, canvas.height) * 0.28
    const total = paired.length + fieldBudget
    const start = new Float32Array(total * 2)
    const target = new Float32Array(total * 2)
    const delay = new Float32Array(total)
    const size = new Float32Array(total)
    const brightness = new Float32Array(total)
    const accent = new Float32Array(total)
    const depth = new Float32Array(total)
    const seed = new Float32Array(total)
    const kind = new Float32Array(total)
    const orbit = new Float32Array(total)
    paired.forEach((pair, index) => {
      start[index * 2] = pair.from.x
      start[index * 2 + 1] = pair.from.y
      target[index * 2] = pair.to.x
      target[index * 2 + 1] = pair.to.y
      delay[index] = glyphDelay(pair.to.x, pair.to.y, cx, cy, maxDist, rand())
      const picked = pickParticleKind(rand(), pair.to.accent, 'glyph')
      kind[index] = picked
      size[index] = (picked === 0 ? 2.1 + rand() * 1.8 : 3.1 + rand() * 2.8) * dpr
      brightness[index] = 0.55 + rand() * 0.4
      accent[index] = pair.to.accent && rand() > 0.82 ? 1 : picked === 3 ? 0.35 : 0
      depth[index] = 0.5 + rand() * 0.5
      seed[index] = rand()
      orbit[index] = (0.016 + rand() * 0.022) * fontSize
    })
    for (let index = 0; index < fieldBudget; index += 1) {
      const i = paired.length + index
      const giant = index < giantCount
      const x = rand() * canvas.width
      const y = rand() * canvas.height
      const wander = (giant ? 0.08 : 0.035 + rand() * 0.09) * Math.min(canvas.width, canvas.height)
      const heading = rand() * Math.PI * 2
      start[i * 2] = x
      start[i * 2 + 1] = y
      target[i * 2] = x + Math.cos(heading) * wander
      target[i * 2 + 1] = y + Math.sin(heading) * wander
      delay[i] = -1
      const picked = pickParticleKind(rand(), 0, giant ? 'giant' : 'field')
      kind[i] = picked
      size[i] = (giant ? 20 + rand() * 18 : picked === 0 ? 0.9 + rand() * 1.5 : 3.2 + rand() * 4.8) * dpr
      brightness[i] = giant ? 0.55 + rand() * 0.25 : 0.1 + rand() * 0.22
      accent[i] = rand() > 0.82 ? 0.55 : 0
      depth[i] = giant ? 0.85 : rand()
      seed[i] = rand()
      orbit[i] = (giant ? 14 + rand() * 18 : 8 + rand() * 20) * dpr
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
    bindFloat(buffers.kind, loc.kind, kind, 1)
    bindFloat(buffers.orbit, loc.orbit, orbit, 1)
    return true
  }

  if (!rebuild()) {
    return null
  }
  screen.dataset.particlesActive = ''

  const hold = 850
  const assemble = 1850
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
    pointer.strength = 48
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
    screen.dataset.particlesActive = ''
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
    else {
      pause()
    }
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
      delete screen.dataset.particlesActive
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
        delete screen.dataset.particlesActive
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
