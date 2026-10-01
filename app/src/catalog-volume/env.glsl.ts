/**
 * The lighting environment, as one GLSL function.
 *
 * There is no HDRI here, and that is deliberate: nothing to fetch, nothing bright
 * enough to wash the page's void out, and — the part that actually matters — the
 * *same* function draws the backdrop and answers the ice's refraction lookups. A
 * screen-space refraction hack samples whatever pixels happen to be behind the
 * crystal, so a facet pointing at empty space returns the colour of the crystal's
 * own neighbour. Sampling a directional environment instead means a facet that
 * points at the key card sees the key card, which is what makes the ice read as
 * being *in* a room.
 *
 * Four cards, in the crystal's own frame (+Z is the c-axis):
 *   key    — large, cool, high front-left. Does the modelling.
 *   rim    — violet, low and behind. The only violet in the scene; it is what
 *            picks every prism edge out of the black.
 *   fill   — wide, dim, cyan, opposite the key. Keeps the shadow side from
 *            going to pure black on an 8-bit display.
 *   bounce — a soft floor card. Ice sitting over nothing looks cut out.
 */

export const ENV_GLSL = /* glsl */ `
  uniform vec3 uKeyDir;
  uniform vec3 uRimDir;
  uniform vec3 uFillDir;
  uniform vec3 uKeyColor;
  uniform vec3 uRimColor;
  uniform vec3 uFillColor;
  uniform vec3 uVoidColor;
  uniform float uKeyIntensity;
  uniform float uRimIntensity;
  uniform float uFillIntensity;
  uniform float uEnvIntensity;

  /**
   * One soft area card. \`tightness\` is the apparent size: high is a small hard
   * source, low is a wall.
   *
   * The \`(t + 1)\` factor is what makes widening a card *spread* its light
   * rather than lose it — the integral of pow(cos, t) over the hemisphere is
   * 2π/(t+1), so scaling by (t+1) holds the total constant. Without it,
   * roughness would read as "gets darker" instead of "gets softer".
   *
   * These are deliberately wide. A first pass used tightnesses around 180,
   * which is a source about four degrees across — a bare bulb. Measured over
   * the sphere it left 93% of all directions below 0.25, so almost every facet
   * reflected black and the crystal came out flat matte no matter what the
   * BSDF did. Twenty is roughly a softbox at arm's length, and it puts 44% of
   * directions above that line.
   */
  float card(vec3 dir, vec3 toward, float tightness) {
    return pow(max(dot(dir, toward), 0.0), tightness) * (tightness + 1.0) / 8.0;
  }

  /**
   * Radiance arriving from \`dir\`.
   *
   * \`blur\` 0 is a mirror sample, 1 is fully diffuse; every card widens with
   * it, which is what a pre-filtered environment map does and why rough ice
   * looks lit rather than dirty.
   *
   * \`baseGain\` scales the room's ambient — the graded void, the dome, the
   * floor bounce, the horizon — while leaving the light sources alone. It
   * exists because the studio this scene describes is a bright rig in front of
   * a black seamless, and those two facts want different answers depending on
   * what is asking.
   *
   * A surface being *lit* is lit by the whole room, ambient included. A ray
   * being *transmitted* is looking at the seamless, and should see it as dark
   * as the camera does. Answering both with the full ambient was why the
   * crystal glowed: what you saw through it came back twenty times brighter
   * than the backdrop beside it, so it read as a lit solid instead of as glass
   * standing in front of a black wall.
   */
  vec3 envRadiance(vec3 dir, float blur, float baseGain) {
    float w = clamp(blur, 0.0, 1.0);

    // Graded void, plus a dim dome. The dome is the floor that stops a facet
    // pointed away from every card from returning pure black — which is the
    // difference between ice and cut-out paper.
    float height = dir.z * 0.5 + 0.5;
    vec3 base = uVoidColor * mix(0.55, 1.35, smoothstep(0.05, 0.95, height));
    base += mix(uFillColor * 0.07, uKeyColor * 0.20, height);
    // Floor bounce: broad, dim, and always from below.
    base += uFillColor * 0.12 * pow(max(-dir.z, 0.0), mix(6.0, 1.0, w));
    // A single soft horizon band. Without it the void reads as flat emptiness
    // and the crystal has nothing to sit against.
    base += uKeyColor * 0.05 * exp(-abs(dir.z) * mix(9.0, 2.5, w));

    vec3 lit = base * baseGain;
    lit += uKeyColor * uKeyIntensity * card(dir, uKeyDir, mix(20.0, 1.5, w));
    lit += uRimColor * uRimIntensity * card(dir, uRimDir, mix(10.0, 1.0, w));
    lit += uFillColor * uFillIntensity * card(dir, uFillDir, mix(4.0, 0.8, w));

    return lit * uEnvIntensity;
  }

  /** Cosine-weighted irradiance. The same cards, opened all the way out. */
  vec3 envIrradiance(vec3 normal) {
    vec3 sum = uVoidColor * 0.5 + mix(uFillColor * 0.07, uKeyColor * 0.20, normal.z * 0.5 + 0.5);
    sum += uKeyColor * uKeyIntensity * max(dot(normal, uKeyDir) * 0.5 + 0.5, 0.0) * 0.26;
    sum += uRimColor * uRimIntensity * max(dot(normal, uRimDir) * 0.5 + 0.5, 0.0) * 0.16;
    sum += uFillColor * uFillIntensity * max(dot(normal, uFillDir) * 0.5 + 0.5, 0.0) * 0.20;
    return sum * uEnvIntensity;
  }
`

/**
 * The background, as a pattern on the same sphere the lighting lives on.
 *
 * Kept separate from `envRadiance` because it is not ambient: it is a thing
 * standing behind the crystal, and it has to arrive at full strength down all
 * three paths — seen directly beside the crystal, reflected off it, and
 * refracted through it. Dimming it on one of those paths is what makes glass
 * stop reading as glass.
 *
 * That is also the whole point of offering a structured one. A refracted ray in
 * an empty black room has nothing to reveal, so however correct the refraction
 * is, the surface reads as a tinted solid. Put a grid behind it and the
 * displacement becomes visible, which is the oldest test there is for whether
 * something is really transparent.
 */
export const STRUCTURE_GLSL = /* glsl */ `
  uniform int uBackdropMode;
  uniform float uStructureGain;
  uniform vec3 uStructureColor;
  /**
   * Which way is up for the sky, in world space.
   *
   * Set to the camera's own up rather than to the lattice c-axis. The tour
   * always looks down at the plate from above, so a world-anchored sky puts its
   * entire ground hemisphere behind the crystal and nothing else is ever in
   * frame; and because the camera's roll changes with yaw, a fixed axis would
   * also swing the horizon around during the move. Anchoring to the camera is
   * what a painted studio backdrop does, and it keeps the horizon level.
   */
  uniform vec3 uSkyUp;
  /**
   * Radians to counter-rotate the cloud field by, about the crystal's c-axis.
   *
   * A background fixed in world space sweeps past at exactly the camera's own
   * angular rate, which on a 16-second orbit reads as the sky being whipped
   * around rather than as the camera moving through a still afternoon. Winding
   * the sample direction back by most of the camera's yaw leaves the clouds
   * drifting at a fraction of that — parallax, as though they were a long way
   * off. The gradient and the horizon are deliberately left out of it: they
   * are keyed to the sky-up vector and stay level in frame.
   */
  uniform float uBackdropSpin;

  vec3 rotateAboutC(vec3 dir, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec3(dir.x * c - dir.y * s, dir.x * s + dir.y * c, dir.z);
  }

  float hash31(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float valueNoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(
        mix(hash31(i + vec3(0.0, 0.0, 0.0)), hash31(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x),
        f.y),
      mix(
        mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x),
        f.y),
      f.z);
  }

  /** Four octaves, not eight. This runs up to six times per fragment — once for
   *  the reflection, once for the coat, once per dispersed wavelength, once for
   *  the far surface — so an octave here is six octaves on the bill. */
  float fbm(vec3 p) {
    float sum = 0.0;
    float amplitude = 0.5;
    for (int octave = 0; octave < 4; octave++) {
      sum += amplitude * valueNoise(p);
      p *= 2.03;
      amplitude *= 0.5;
    }
    return sum;
  }

  /**
   * Daylight sky with broken cloud.
   *
   * Chosen over a plain graded sweep because a sweep varies in *value* and
   * barely in hue, and value alone is easy for a bright surface to swamp. A sky
   * runs deep blue overhead, pale and warm at the horizon, and carries warm
   * sunlit cloud against cool shadowed cloud — so a refracted ray landing a few
   * degrees off its neighbour comes back a visibly different colour. That hue
   * shift is what makes the crystal read as transparent rather than merely
   * bright.
   */
  vec3 skyBackdrop(vec3 dir, float blur) {
    float w = clamp(blur, 0.0, 1.0);
    // Offset so the horizon sits a little below frame centre: looking straight
    // at the crystal puts that dot product near zero, which would cut the
    // composition in half exactly through the subject.
    // Amplified, not just offset. A 30° lens sees about half a radian of the
    // sphere, so the raw dot product only moves by ±0.26 across the whole frame
    // and the gradient came out as one flat tone.
    float height = dot(dir, uSkyUp) * 1.7 + 0.45;

    // Saturated. The first pass used a pale blue-grey against off-white cloud,
    // which photographs of real broken sky are not: they run a deep blue
    // overhead, near-white cloud tops, and genuinely dark grey in the masses.
    // Low contrast here also costs the crystal, because a background that is
    // all one value gives a refracted ray nothing to be displaced against.
    vec3 zenith = vec3(0.012, 0.060, 0.36);
    vec3 horizon = vec3(0.16, 0.36, 0.72);
    vec3 ground = vec3(0.06, 0.08, 0.12);

    vec3 sky = mix(horizon, zenith, smoothstep(-0.05, 1.05, height));
    sky = mix(ground, sky, smoothstep(-0.14, 0.02, height));

    // A low sun off to one side: it gives the cloud a lit edge and the whole
    // field a direction, which is most of what stops procedural sky looking
    // procedural.
    // The sun rides the sky's own frame too, or it would swing loose of the
    // horizon it is supposed to be sitting above.
    vec3 sunSide = normalize(cross(uSkyUp, vec3(0.0, 0.0, 1.0)) + vec3(0.13, 0.0, 0.0));
    vec3 sunDir = normalize(sunSide * 0.78 + uSkyUp * 0.30);
    float sun = max(dot(dir, sunDir), 0.0);
    sky += vec3(1.0, 0.78, 0.50) * pow(sun, mix(400.0, 6.0, w)) * 0.9;
    // The broad halo is kept small on purpose: at 0.16 it laid a warm wash over
    // most of the visible sky and pulled the blue grey.
    sky += vec3(0.95, 0.70, 0.45) * pow(sun, mix(24.0, 3.0, w)) * 0.06;

    // Cloud frequency falls with blur, so a rough reflection samples soft
    // weather instead of noise.
    // Frequency set against that same half-radian: at 2.6 the visible patch
    // did not span a single noise cell, so the "cloud" was one constant value.
    // Nine puts several banks across the frame, which is what a refracted ray
    // needs in order to land somewhere visibly different from its neighbour.
    float scale = mix(11.0, 3.0, w);
    vec3 field = rotateAboutC(dir, uBackdropSpin) * scale + vec3(0.0, 0.0, 1.7);
    float n = fbm(field);

    // Narrow, so cloud has an edge. A wide ramp is what made the first sky look
    // like haze: real broken cloud meets blue over a short distance.
    float cover = smoothstep(0.455, 0.545, n) * smoothstep(-0.10, 0.10, height);

    // No self-shadowing. A second noise sample stepped toward the sun did give
    // banks a bright top and a dark underside, but on a sphere with no real
    // depth to it the grey landed wherever the noise happened to rise, not
    // where a cloud's underside would be — so it read as dirt rather than as
    // form. Deep blue against white carries the contrast on its own, and this
    // drops a whole fbm evaluation from a function that runs six times per
    // fragment.
    float lit = smoothstep(0.44, 0.62, n);
    vec3 cloudEdge = vec3(0.78, 0.84, 0.93);
    vec3 cloudCore = vec3(1.0, 1.0, 0.99);
    vec3 cloud = mix(cloudEdge, cloudCore, lit);

    return mix(sky, cloud, cover);
  }

  vec3 envStructure(vec3 dir, float blur) {
    if (uBackdropMode == 0 || uStructureGain <= 0.0) return vec3(0.0);
    float w = clamp(blur, 0.0, 1.0);

    if (uBackdropMode == 1) return skyBackdrop(dir, blur) * uStructureGain;

    float value = 0.0;
    {
      float azimuth = atan(dir.y, dir.x);
      float elevation = asin(clamp(dir.z, -1.0, 1.0));
      // Line width follows the blur, so a rough reflection samples a soft
      // pattern rather than an aliased one. \`fwidth\` is no use here: the
      // refracted direction can swing wildly between neighbouring pixels.
      // Frequencies are set against the 30° lens, not chosen for roundness. At
      // six divisions of the sphere the lines sit 60° apart and exactly one
      // lands in frame, which reads as a stray light rather than as a grid —
      // and a grid you cannot count is no use for seeing refraction bend it.
      // Forty-four puts roughly four columns and seven rows across the frame.
      if (uBackdropMode == 2) {
        float sharpness = mix(28.0, 3.0, w);
        float meridians = pow(max(cos(azimuth * 44.0), 0.0), sharpness);
        float parallels = pow(max(cos(elevation * 44.0), 0.0), sharpness);
        value = max(meridians, parallels);
      } else {
        float sharpness = mix(22.0, 3.0, w);
        value = pow(
          max(cos(azimuth * 44.0), 0.0) * max(cos(elevation * 33.0), 0.0),
          sharpness
        );
      }
    }

    return uStructureColor * value * uStructureGain;
  }
`

/**
 * Physically-shaped BRDF pieces. Trowbridge-Reitz distribution, Smith height-
 * correlated visibility, Schlick Fresnel — the standard set, written out rather
 * than pulled from three's chunks because this material never runs the lights
 * pass those chunks expect.
 */
export const BRDF_GLSL = /* glsl */ `
  const float PI_ = 3.141592653589793;

  /**
   * Narkowicz's ACES filmic curve, written out here rather than called from
   * three's injected \`toneMapping\`.
   *
   * That helper only exists in the compiled prefix when the *renderer* has tone
   * mapping switched on, and the renderer under an effect composer does not.
   * Depending on it means a material that compiles on one page and fails to
   * compile on the next. Colour space is still handed back to three, via
   * \`linearToOutputTexel\`, because that one has to agree with whatever buffer
   * is currently being drawn into.
   */
  vec3 acesFilmic(vec3 x) {
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
  }

  float distributionGGX(float nDotH, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float d = nDotH * nDotH * (a2 - 1.0) + 1.0;
    return a2 / max(PI_ * d * d, 1e-7);
  }

  float visibilitySmith(float nDotV, float nDotL, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float v = nDotL * sqrt(nDotV * nDotV * (1.0 - a2) + a2);
    float l = nDotV * sqrt(nDotL * nDotL * (1.0 - a2) + a2);
    return 0.5 / max(v + l, 1e-7);
  }

  vec3 fresnelSchlick(float cosTheta, vec3 f0) {
    return f0 + (1.0 - f0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
  }

  /** One analytic light: GGX specular plus a wrapped diffuse lobe.
   *  The wrap is doing translucency's job cheaply — light that entered the plate
   *  a millimetre away and came back out here. Unwrapped Lambert makes thin ice
   *  look like painted metal. */
  vec3 directLight(
    vec3 normal, vec3 view, vec3 lightDir, vec3 radiance,
    vec3 albedo, float roughness, vec3 f0, float wrap
  ) {
    vec3 halfway = normalize(view + lightDir);
    float nDotV = max(dot(normal, view), 1e-4);
    float nDotL = max(dot(normal, lightDir), 0.0);
    float nDotH = max(dot(normal, halfway), 0.0);
    float vDotH = max(dot(view, halfway), 0.0);

    vec3 fresnel = fresnelSchlick(vDotH, f0);
    float ndf = distributionGGX(nDotH, roughness);
    float vis = visibilitySmith(nDotV, nDotL, roughness);
    vec3 specular = fresnel * ndf * vis;

    float wrapped = max((dot(normal, lightDir) + wrap) / (1.0 + wrap), 0.0);
    vec3 diffuse = albedo * wrapped / PI_;

    return (diffuse * (1.0 - fresnel) + specular * nDotL) * radiance;
  }

  /**
   * Thin-film interference at the edges.
   *
   * Facet steps on real ice are a few hundred nanometres apart, which is why a
   * crystal edge flashes colour rather than white. This is the cheap cosine
   * approximation of that, kept deliberately faint — turned up it stops reading
   * as ice and starts reading as an oil slick.
   */
  vec3 iridescence(float cosTheta, float thicknessNm) {
    vec3 wavelengths = vec3(612.0, 549.0, 464.0);
    vec3 phase = (4.0 * PI_ * thicknessNm * max(cosTheta, 0.02)) / wavelengths;
    return 0.5 + 0.5 * cos(phase);
  }
`

/* ------------------------------------------------------------------ */
/* Backdrop modes                                                      */
/* ------------------------------------------------------------------ */

export type BackdropMode = 'auto' | 'void' | 'sky' | 'grid' | 'motes'

/**
 * `index` selects the pattern in `envStructure`. `ambient` is how much of the
 * room's own graded void the *visible* backdrop shows — pulled up under the
 * plain modes because with no pattern to look at, the sweep is the background.
 */
export const BACKDROP_MODES: Record<
  BackdropMode,
  { readonly index: number; readonly structure: number; readonly ambient: number; readonly label: string }
> = {
  // Void until the tour ends, then the sky fades up. Resolved per frame by
  // `resolveBackdrop`, so it is the sky's pattern all along at a gain of zero —
  // which costs nothing, because `envStructure` returns early on a zero gain.
  auto: { index: 1, structure: 0.95, ambient: 0.03, label: 'Auto' },
  void: { index: 0, structure: 0, ambient: 0.045, label: 'Void' },
  sky: { index: 1, structure: 0.95, ambient: 0.03, label: 'Sky' },
  grid: { index: 2, structure: 0.62, ambient: 0.06, label: 'Grid' },
  motes: { index: 3, structure: 1.1, ambient: 0.05, label: 'Motes' },
}

/**
 * The backdrop settings actually in force this frame.
 *
 * `reveal` only means anything to `auto`; every other choice is a fixed
 * override and ignores it.
 */
export function resolveBackdrop(
  mode: BackdropMode,
  reveal: number,
): { readonly index: number; readonly structure: number; readonly ambient: number } {
  if (mode !== 'auto') return BACKDROP_MODES[mode]
  const t = Math.min(Math.max(reveal, 0), 1)
  const sky = BACKDROP_MODES.sky
  const empty = BACKDROP_MODES.void
  return {
    index: sky.index,
    structure: sky.structure * t,
    ambient: empty.ambient + (sky.ambient - empty.ambient) * t,
  }
}
