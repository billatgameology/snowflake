import { BackSide, Color, GLSL3, ShaderMaterial, Vector2, Vector3 } from 'three'
import { BACKDROP_MODES, BRDF_GLSL, ENV_GLSL, STRUCTURE_GLSL } from './env.glsl'

/**
 * The room, drawn on the inside of a sphere.
 *
 * It runs the *same* `envRadiance` the ice refracts through, so what the visitor
 * sees behind the crystal and what the crystal bends are one thing. Two separate
 * backdrops — a gradient plate for the eye and a lighting model for the shader —
 * is the usual arrangement, and it is why so much real-time glass reads as a
 * decal rather than as an object standing in a place.
 *
 * Sampled at high blur: the cards are soft walls here, never visible discs.
 */
export function createBackdropMaterial() {
  const uniforms = {
    uKeyDir: { value: new Vector3(0.42, -0.55, 0.72).normalize() },
    uRimDir: { value: new Vector3(-0.55, 0.62, -0.55).normalize() },
    uFillDir: { value: new Vector3(-0.7, -0.3, 0.24).normalize() },
    uKeyColor: { value: new Color('#cdefff') },
    uRimColor: { value: new Color('#a78bfa') },
    uFillColor: { value: new Color('#7fe3ff') },
    uVoidColor: { value: new Color('#05070e') },
    uKeyIntensity: { value: 3.6 },
    uRimIntensity: { value: 4.4 },
    uFillIntensity: { value: 1.5 },
    uEnvIntensity: { value: 1.15 },
    /**
     * How much of the room the backdrop shows.
     *
     * Very low, and that is the whole trick: a bright lighting environment with
     * a near-black seamless behind it, which is how a product still is lit. At
     * 0.13 the widened rim card came through as a violet wash across half the
     * frame and the page stopped looking like the rest of the site.
     */
    uBackdropGain: { value: 0.045 },
    uResolution: { value: new Vector2(1, 1) },
    uVignette: { value: 0.62 },
    uBackdropMode: { value: BACKDROP_MODES.void.index },
    uStructureGain: { value: BACKDROP_MODES.void.structure },
    uStructureColor: { value: new Color('#c9f2ff') },
    uSkyUp: { value: new Vector3(0, 0, 1) },
    uBackdropSpin: { value: 0 },
  }

  const material = new ShaderMaterial({
    glslVersion: GLSL3,
    uniforms,
    side: BackSide,
    depthWrite: false,
    depthTest: false,
    fog: false,
    vertexShader: /* glsl */ `
      out vec3 vDirection;
      void main() {
        vDirection = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;

      uniform float uBackdropGain;
      uniform float uVignette;
      uniform vec2 uResolution;

      in vec3 vDirection;
      out vec4 outColor;

      ${ENV_GLSL}
      ${STRUCTURE_GLSL}
      ${BRDF_GLSL}

      void main() {
        vec3 dir = normalize(vDirection);
        // Ambient is dimmed to keep the seamless dark; the pattern is not,
        // because it has to match the strength the crystal refracts it at.
        // Structure at zero blur: this is the direct view of the background, the one
        // thing in frame that should be perfectly sharp. Sampling it at 0.5, the
        // way a rough reflection does, was smearing the cloud into haze.
        vec3 ambient = envRadiance(dir, 0.86, 1.0) * uBackdropGain;
        vec3 background = envStructure(dir, 0.0);

        // Corner falloff drawn into the backdrop rather than added in post. A
        // post vignette darkens the crystal too, and the crystal is the one
        // thing in frame that should not lose light at the edges.
        //
        // uResolution must be the *drawing buffer* size. It was being fed the
        // CSS size, so on any display with a pixel ratio above 1 the normalised
        // coordinate ran past 1, the falloff clamped to zero over most of the
        // frame, and the background became a bright off-centre ellipse in a
        // black surround. Invisible at dpr 1, which is why it survived.
        vec2 centred = (gl_FragCoord.xy / max(uResolution, vec2(1.0))) - 0.5;
        float falloff = clamp(1.0 - uVignette * dot(centred, centred) * 2.0, 0.0, 1.0);

        // Only the room's own graded void is vignetted. A chosen background is a
        // thing standing behind the crystal and should fill the frame; darkening
        // its corners reads as a lens artefact laid over a photograph.
        vec3 color = ambient * falloff + background;
        outColor = linearToOutputTexel(vec4(acesFilmic(color), 1.0));
      }
    `,
  })

  return { material, uniforms }
}
