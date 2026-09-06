import * as THREE from "three";
import { visibleEventCount, type DendriteData } from "./dendrite-data.ts";

/** Display window (start, end], retaining the seed when the window reaches time zero. */
export function recentEventRange(data: Pick<DendriteData, "ticks" | "finalTick">, progress: number, window: number): { start: number; count: number } {
  const end = visibleEventCount(data.ticks, progress * data.finalTick);
  const start = progress <= window ? 0 : visibleEventCount(data.ticks, (progress - window) * data.finalTick);
  return { start, count: end - start };
}

const maskVertex = /* glsl */ `
uniform float pixelsPerUnit;
uniform float extent;
varying float height;
void main() {
  height = 0.5 + (modelMatrix * vec4(position, 1.0)).z / (extent * 2.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = clamp(pixelsPerUnit * 1.55, 1.4, 48.0);
}`;
const maskFragment = /* glsl */ `
uniform float extent;
uniform float recent;
varying float height;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(p, p);
  if (r2 > 1.0) discard;
  // The rounded cell cap and subsequent bevel are artistic surface reconstruction.
  gl_FragColor = vec4(height + sqrt(1.0 - r2) * 0.12 / extent, recent, 1.0, 1.0);
}`;
const screenVertex = /* glsl */ `
varying vec2 uvScreen;
void main() { uvScreen = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
const screenFragment = /* glsl */ `
uniform sampler2D imprint;
uniform vec2 texel;
uniform float mode;
uniform float lightAngle;
uniform float depthToPixels;
varying vec2 uvScreen;
vec3 field(vec2 p) { return texture2D(imprint, clamp(p, texel, vec2(1.0) - texel)).rgb; }
float coverage(vec2 p, float radius) {
  vec2 d = texel * radius;
  return (field(p + vec2(d.x, 0.0)).b + field(p - vec2(d.x, 0.0)).b
    + field(p + vec2(0.0, d.y)).b + field(p - vec2(0.0, d.y)).b
    + field(p + d * 0.7071).b + field(p - d * 0.7071).b
    + field(p + vec2(d.x, -d.y) * 0.7071).b + field(p + vec2(-d.x, d.y) * 0.7071).b) * 0.125;
}
float sculptedHeight(vec2 p) {
  vec3 m = field(p);
  return (m.r - 0.5) * depthToPixels + coverage(p, 3.5) * 4.0;
}
void main() {
  vec2 p = uvScreen;
  vec3 m = field(p);
  if (mode < 2.5) {
    // New sites are a separate union: projected older ice cannot hide recent attachments.
    float edge = abs(m.b - coverage(p, 1.7));
    float glow = 0.0;
    for (int i = 0; i < 12; i++) {
      float angle = float(i) * 6.2831853 / 12.0;
      vec2 dir = vec2(cos(angle), sin(angle));
      glow += field(p + dir * texel * 3.5).g * 0.55;
      glow += field(p + dir * texel * 9.0).g * 0.25;
    }
    vec3 background = vec3(0.025, 0.043, 0.058);
    vec3 color = background + edge * vec3(0.14, 0.21, 0.24);
    color += glow / 12.0 * vec3(0.26, 0.49, 0.55);
    color = mix(color, vec3(0.89, 0.98, 0.98), m.g);
    gl_FragColor = vec4(color, 1.0);
    return;
  }
  vec2 lightDir = vec2(cos(lightAngle), sin(lightAngle));
  float shadow = 0.0;
  for (int i = 0; i < 12; i++) {
    float angle = float(i) * 6.2831853 / 12.0;
    vec2 blur = vec2(cos(angle), sin(angle)) * texel * 4.0;
    shadow += field(p - lightDir * texel * 13.0 + blur).b;
  }
  shadow /= 12.0;
  float contact = coverage(p, 3.0);
  vec3 paper = vec3(0.79, 0.82, 0.79);
  // Deliberate cast-relief lighting, not an ice-optics simulation.
  paper *= 1.0 - shadow * 0.28 - contact * 0.14;
  if (m.b < 0.01) { gl_FragColor = vec4(paper, 1.0); return; }
  float hx = sculptedHeight(p - vec2(texel.x, 0.0)) - sculptedHeight(p + vec2(texel.x, 0.0));
  float hy = sculptedHeight(p - vec2(0.0, texel.y)) - sculptedHeight(p + vec2(0.0, texel.y));
  vec3 normal = normalize(vec3(hx, hy, 2.4));
  vec3 light = normalize(vec3(lightDir * 0.88, 0.65));
  float diffuse = max(0.0, dot(normal, light));
  float rim = coverage(p, 6.0);
  float sheen = pow(max(0.0, dot(normal, normalize(light + vec3(0.0, 0.0, 1.0)))), 28.0);
  vec3 porcelain = vec3(0.89, 0.92, 0.88) * (0.43 + 0.57 * diffuse);
  porcelain += sheen * 0.17;
  porcelain *= 0.84 + 0.16 * rim;
  gl_FragColor = vec4(mix(paper, porcelain, m.b), 1.0);
}`;

/** A shared bounded mask and full-screen pass; recorded geometry stays owned by the player. */
export class GrowthSculpture {
  private readonly target: THREE.WebGLRenderTarget;
  private readonly mask: THREE.ShaderMaterial;
  private readonly screen: THREE.ShaderMaterial;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.Camera();
  private readonly quad = new THREE.PlaneGeometry(2, 2);
  private readonly renderer: THREE.WebGLRenderer;

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    const floatTarget = renderer.extensions.has("EXT_color_buffer_float");
    const precise = floatTarget && renderer.extensions.has("EXT_float_blend") && renderer.extensions.has("OES_texture_float_linear");
    this.target = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false, type: precise ? THREE.FloatType : floatTarget ? THREE.HalfFloatType : THREE.UnsignedByteType });
    this.mask = new THREE.ShaderMaterial({ vertexShader: maskVertex, fragmentShader: maskFragment,
      uniforms: { pixelsPerUnit: { value: 1 }, extent: { value: 1 }, recent: { value: 0 } },
      depthTest: false, depthWrite: false, transparent: true,
      blending: THREE.CustomBlending, blendEquation: THREE.MaxEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    });
    this.screen = new THREE.ShaderMaterial({ vertexShader: screenVertex, fragmentShader: screenFragment,
      uniforms: { imprint: { value: this.target.texture }, texel: { value: new THREE.Vector2(1, 1) }, mode: { value: 2 }, lightAngle: { value: 2.25 }, depthToPixels: { value: 1 } },
      depthTest: false, depthWrite: false,
    });
    this.scene.add(new THREE.Mesh(this.quad, this.screen));
  }

  render(scene: THREE.Scene, camera: THREE.Camera, geometry: THREE.BufferGeometry, glow: THREE.Points,
    data: DendriteData, rect: DOMRect, canvasHeight: number, extent: number, mode: number, progress: number, window: number, lightAngle: number): void {
    const renderer = this.renderer;
    const scale = Math.min(renderer.getPixelRatio(), 1536 / Math.max(rect.width, rect.height));
    const width = Math.max(1, Math.round(rect.width * scale)), height = Math.max(1, Math.round(rect.height * scale));
    if (this.target.width !== width || this.target.height !== height) this.target.setSize(width, height);
    const pixelsPerUnit = height / (extent * 2);
    this.mask.uniforms.pixelsPerUnit!.value = pixelsPerUnit;
    this.mask.uniforms.extent!.value = data.extent;
    this.mask.uniforms.recent!.value = 0;
    renderer.setRenderTarget(this.target); renderer.setScissorTest(false);
    renderer.setViewport(0, 0, width, height); renderer.setClearColor(0x000000, 0); renderer.clear();
    scene.overrideMaterial = this.mask; glow.visible = false;
    const count = visibleEventCount(data.ticks, progress * data.finalTick);
    geometry.setDrawRange(0, count);
    renderer.render(scene, camera);
    if (mode === 2) {
      const recent = recentEventRange(data, progress, window);
      geometry.setDrawRange(recent.start, recent.count);
      this.mask.uniforms.recent!.value = 1;
      renderer.render(scene, camera);
    }
    geometry.setDrawRange(0, count); scene.overrideMaterial = null; glow.visible = true;
    renderer.setRenderTarget(null); renderer.setClearColor(0x080d12, 1);
    renderer.setViewport(rect.left, canvasHeight - rect.bottom, rect.width, rect.height);
    renderer.setScissor(rect.left, Math.max(0, canvasHeight - rect.bottom), rect.width, Math.min(canvasHeight, rect.bottom) - Math.max(0, rect.top));
    renderer.setScissorTest(true);
    this.screen.uniforms.texel!.value.set(1 / width, 1 / height);
    this.screen.uniforms.mode!.value = mode;
    this.screen.uniforms.lightAngle!.value = lightAngle;
    this.screen.uniforms.depthToPixels!.value = data.extent * 2 * pixelsPerUnit;
    renderer.render(this.scene, this.camera);
  }

  dispose(): void { this.target.dispose(); this.mask.dispose(); this.screen.dispose(); this.quad.dispose(); }
}
