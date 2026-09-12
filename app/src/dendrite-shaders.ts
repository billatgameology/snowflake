// Each point is one recorded lattice site, never a simulated molecule.
export const dendriteVertex = /* glsl */ `
attribute float attachTick;
uniform float playhead;
uniform float finalTick;
uniform float pixelsPerUnit;
uniform float style;
uniform float halo;
varying float age;
varying float born;
varying float layer;
varying vec3 site;
void main() {
  born = attachTick / finalTick;
  age = max(0.0, (playhead - attachTick) / finalTick);
  site = position;
  layer = position.z;
  vec3 p = position;
  vec4 eye = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * eye;
  float size = 1.42;
  gl_PointSize = clamp(pixelsPerUnit * size * (halo > 0.5 ? 5.0 : 1.0), 1.0, 48.0);
}
`;

export const dendriteFragment = /* glsl */ `
uniform float style;
uniform float halo;
uniform float strength;
varying float age;
varying float born;
varying float layer;
varying vec3 site;
vec3 spectrum(float t) {
  vec3 c = mix(vec3(0.92, 0.52, 0.24), vec3(0.56, 0.24, 0.64), smoothstep(0.0, 0.24, t));
  c = mix(c, vec3(0.16, 0.40, 0.84), smoothstep(0.22, 0.52, t));
  c = mix(c, vec3(0.12, 0.78, 0.70), smoothstep(0.48, 0.82, t));
  return mix(c, vec3(0.8, 0.92, 0.58), smoothstep(0.80, 1.0, t));
}
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(p, p);
  if (r2 > 1.0) discard;
  float fresh = exp(-age * 95.0);
  float wake = exp(-age * 18.0);
  vec3 color;
  float opacity = 1.0;
  float bevel = 0.70 + 0.30 * sqrt(max(0.0, 1.0 - r2));
  float relief = 0.58 + 0.42 * cos(layer * 0.47);
  if (style < 0.5) {
    color = mix(vec3(0.025, 0.14, 0.20), vec3(0.04, 0.68, 0.70), wake);
    color += fresh * vec3(0.66, 1.0, 0.88) * strength;
    color *= bevel * (0.7 + relief * 0.3);
  } else {
    // Colour and narrow bands are keyed to arrival time, not radius.
    float band = pow(0.5 + 0.5 * cos(born * 110.0), 12.0);
    color = spectrum(born) * (0.38 + 0.38 * relief + 0.24 * band);
    color += fresh * vec3(0.8, 0.66, 0.5) * strength;
    color *= bevel;
  }
  if (halo > 0.5) {
    if (fresh < 0.008) discard;
    color = style < 0.5 ? vec3(0.12, 0.95, 0.72) : spectrum(born);
    opacity = exp(-r2 * 6.5) * fresh * 0.09 * strength;
  }
  gl_FragColor = vec4(color, opacity);
}
`;
