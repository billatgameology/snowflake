import {
  ClampToEdgeWrapping,
  Color,
  DataArrayTexture,
  GLSL3,
  Matrix3,
  Matrix4,
  NearestFilter,
  RedIntegerFormat,
  ShaderMaterial,
  UnsignedIntType,
  Vector3,
} from 'three'
import { BACKDROP_MODES, BRDF_GLSL, ENV_GLSL, STRUCTURE_GLSL } from './env.glsl'
import { NEVER_TICK } from './growthAsset'

/**
 * The crystal.
 *
 * There is no mesh. The 961,597 attachment events are uploaded as one integer
 * volume — *when* each lattice site froze — and the surface is found by marching
 * a ray until the revealed fraction crosses an isovalue. Growing the crystal is
 * then just moving a number: the playhead. Nothing is re-tessellated, no vertex
 * buffer is rewritten, and the whole 70,000-tick history is scrubbable at any
 * frame because all of it is already resident.
 *
 * The lighting is where this departs from the source repository's viewer, which
 * shades the same surface with one hardcoded light direction and a rim term. Here
 * the first hit feeds a full ice BSDF: GGX speculars from a three-point rig, an
 * analytic environment answering both the reflection and the refraction, Beer–
 * Lambert absorption measured along a second march through the ice, a clearcoat
 * lobe, edge iridescence, and an emissive band on the sites that froze in the
 * last fraction of a second.
 *
 * MODEL, NOT MEASUREMENT — the *geometry* and *timing* are measured solver output
 * and are reproduced exactly. The appearance is art direction: real ice is not
 * this colour, and no optical claim is made by it.
 */

export type IceQuality = {
  /** Hard ceiling on first-hit march steps. */
  readonly maxSteps: number
  /** Samples per lattice cell along the ray. Above 1 costs, below 1 aliases. */
  readonly samplesPerCell: number
  /** Steps used to measure how much ice a refracted ray passes through. */
  readonly thicknessSteps: number
  /** Field taps used for contact darkening. */
  readonly aoSamples: number
  /** Split the transmission into three wavelengths. The expensive, correct-looking one. */
  readonly dispersion: boolean
}

export const ICE_QUALITY: Record<0 | 1 | 2 | 3, IceQuality> = {
  0: { maxSteps: 192, samplesPerCell: 0.7, thicknessSteps: 0, aoSamples: 3, dispersion: false },
  1: { maxSteps: 256, samplesPerCell: 0.85, thicknessSteps: 10, aoSamples: 3, dispersion: false },
  2: { maxSteps: 512, samplesPerCell: 1.2, thicknessSteps: 18, aoSamples: 4, dispersion: false },
  3: { maxSteps: 768, samplesPerCell: 1.55, thicknessSteps: 28, aoSamples: 5, dispersion: true },
}

/** Every knob the stage animates or the controls expose. */
export type IceLook = {
  readonly roughness: number
  readonly ior: number
  readonly clearcoat: number
  readonly clearcoatRoughness: number
  /**
   * How much of the light gets through rather than scattering at the surface.
   *
   * 0 is a milky, internally-scattering crystal; 1 is close to clear ice. It
   * drives two things at once because transparency is two things at once:
   * the diffuse albedo comes down, and the transmitted term comes up. Lowering
   * albedo alone just makes the crystal darker.
   */
  readonly clarity: number
  /**
   * How dark the room looks *through* the crystal, against how bright it looks
   * lighting it. 1 makes a transmitted ray see the same room a lit surface
   * does, which reads as a glowing solid; low values put a black seamless
   * behind the glass and let only the light sources come through.
   */
  readonly seeThrough: number
  /** Weight on the measured local growth rate. See `frontRate` in the shader. */
  readonly rateEmphasis: number
  /** Beer–Lambert extinction, per world unit, per channel. Sets the ice's colour. */
  readonly absorption: Vector3
  readonly bodyColor: Color
  readonly glowColor: Color
  readonly glowStrength: number
  /** Ticks over which a freshly frozen site stops glowing. */
  readonly glowTicks: number
  /** Ticks over which a freshly frozen site fades from empty to solid. */
  readonly transitionTicks: number
  readonly iridescence: number
  readonly aoStrength: number
  readonly exposure: number
}

export const DEFAULT_LOOK: IceLook = {
  roughness: 0.06,
  // Ice Ih at visible wavelengths. Kept honest even though everything around it
  // is art direction — it costs nothing and it is the one number we know.
  ior: 1.309,
  clearcoat: 0.95,
  clearcoatRoughness: 0.04,
  clarity: 0.92,
  seeThrough: 0.85,
  /**
   * How hard the local growth rate is drawn out. 0 renders the crystal as one
   * uniform material; 1 is the calibrated reading.
   */
  rateEmphasis: 0.8,
  /**
   * Beer–Lambert extinction per world unit, per channel.
   *
   * Three times the first grade, which is what turns transparency into glass
   * rather than into "dimmer". Against a near-black room a body with almost no
   * absorption has no depth cue at all — every path through it comes back the
   * same, so it reads as a flat silhouette however little it scatters. At this
   * strength a single plate crossing (~44 units) transmits roughly 0.45 / 0.70
   * / 0.82 and two overlapping arms go markedly deeper. That difference *is*
   * the sense of looking into something.
   */
  absorption: new Vector3(0.018, 0.008, 0.0045),
  bodyColor: new Color('#dff4ff'),
  glowColor: new Color('#7fe3ff'),
  // Sized for an additive, clipping blend: a fast, freshly frozen tip saturates
  // and blooms, and everything slower falls off underneath it.
  glowStrength: 1.4,
  /**
   * How long a site keeps glowing after it freezes, in solver ticks. ~1.1s of
   * tour time.
   *
   * Set by how wide the glowing shell reads on screen, not by taste. The
   * crystal's rim advances at roughly 23 world units a second at the midpoint
   * of the tour, so 2,000 ticks put the glow in a band about fourteen pixels
   * wide — present, and invisible. Six thousand gives a shell that follows
   * every arm flank and side branch, which is where attachment is actually
   * happening.
   */
  glowTicks: 6000,
  transitionTicks: 620,
  iridescence: 0.28,
  aoStrength: 0.85,
  exposure: 1.10,
}

/**
 * Clarity → the two values it actually drives.
 *
 * Exported rather than inlined so the slider and the material read the same
 * curve; a UI that computes its own version of this is how a control ends up
 * meaning something slightly different from what it moves.
 */
export function albedoScaleFor(clarity: number): number {
  const t = Math.min(Math.max(clarity, 0), 1)
  // 0.008 is glass. The previous clear end, 0.025, still left enough diffuse
  // scattering to read as a solid — the body has to get out of the way almost
  // entirely before reflection and transmission can carry the surface.
  return 0.24 + (0.008 - 0.24) * t
}

export function transmissionGainFor(clarity: number): number {
  const t = Math.min(Math.max(clarity, 0), 1)
  return 0.8 + (1.5 - 0.8) * t
}

export type IceUniforms = ReturnType<typeof createIceMaterial>['uniforms']

export function createArrivalTexture(
  data: Uint32Array,
  size: readonly [number, number, number],
): DataArrayTexture {
  // A 2D array texture rather than a 3D one: the crop is 17 layers deep and a
  // layered texture indexes exactly the way the lattice is laid out, with no
  // filtering across the c-axis that we would have to undo. Integer format,
  // nearest sampling — the ticks are compared as integers in the shader, so any
  // interpolation here would be a bug, not a smoothing.
  const texture = new DataArrayTexture(data, size[0], size[1], size[2])
  texture.format = RedIntegerFormat
  texture.type = UnsignedIntType
  texture.internalFormat = 'R32UI'
  texture.minFilter = NearestFilter
  texture.magFilter = NearestFilter
  texture.wrapS = ClampToEdgeWrapping
  texture.wrapT = ClampToEdgeWrapping
  texture.generateMipmaps = false
  texture.unpackAlignment = 4
  texture.needsUpdate = true
  return texture
}

export function createIceMaterial(
  arrival: DataArrayTexture,
  size: readonly [number, number, number],
  quality: IceQuality,
  look: IceLook,
) {
  const uniforms = {
    uArrival: { value: arrival },
    uVolumeSize: { value: new Vector3(size[0], size[1], size[2]) },

    /* transport. Only `cameraPosition` comes from three: its fragment prefix
       declares that one, but not `modelMatrix`, so the model transform has to
       be handed over explicitly. */
    uLocalToWorld: { value: new Matrix4() },
    uWorldToLocal: { value: new Matrix4() },
    uLocalToWorldNormal: { value: new Matrix3() },
    uLocalToClip: { value: new Matrix4() },

    /* playhead */
    /**
     * World-space radius of the crystal right now, from the measured envelope.
     * Rays that miss this cylinder are rejected before they march.
     */
    uActiveRadius: { value: 1e9 },
    uDebugMode: { value: 0 },
    uPlayheadTick: { value: 0 },
    uPlayheadOffset: { value: 0 },
    uTransition: { value: look.transitionTicks },
    uGlowTicks: { value: look.glowTicks },
    uGlowStrength: { value: look.glowStrength },
    uGlowColor: { value: look.glowColor.clone() },

    /* surface */
    uIso: { value: 0.36 },
    uRoughness: { value: look.roughness },
    uIor: { value: look.ior },
    uClearcoat: { value: look.clearcoat },
    uClearcoatRoughness: { value: look.clearcoatRoughness },
    uAbsorption: { value: look.absorption.clone() },
    uBodyColor: { value: look.bodyColor.clone() },
    uIridescence: { value: look.iridescence },
    uRateEmphasis: { value: look.rateEmphasis },
    /**
     * Mean radial front speed of this run, in volume cells per tick. Written by
     * the stage from the measured radius envelope, so the rate readout is
     * normalised against the crystal's own average rather than a magic number.
     */
    uReferenceSpeed: { value: 0 },
    uAlbedoScale: { value: albedoScaleFor(look.clarity) },
    uTransmissionGain: { value: transmissionGainFor(look.clarity) },
    uAoStrength: { value: look.aoStrength },
    uExposure: { value: look.exposure },
    uDirectGain: { value: 0.38 },

    /* lighting rig — world space, written per frame by the stage */
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
     * How much of the room's ambient a transmitted ray sees, against the 1.0
     * a lit surface sees. Below 1, because looking through the crystal should
     * land nearer the black seamless the camera sees beside it; the light
     * sources still come through at full strength, which is what makes a facet
     * flare when it happens to line up with one.
     *
     * Not much below 1, though. Matching the backdrop exactly — 0.16 — is what
     * the studio physically implies and it deleted the crystal: with the body
     * this clear there is nothing else holding the surface up, and it went to
     * black on black. This is the compromise, and it is a compromise.
     */
    uThroughBase: { value: look.seeThrough },
    uBackdropMode: { value: BACKDROP_MODES.void.index },
    uStructureGain: { value: BACKDROP_MODES.void.structure },
    uStructureColor: { value: new Color('#c9f2ff') },
    uSkyUp: { value: new Vector3(0, 0, 1) },
    uBackdropSpin: { value: 0 },
  }

  const material = new ShaderMaterial({
    glslVersion: GLSL3,
    uniforms,
    transparent: false,
    depthWrite: true,
    depthTest: true,
    vertexShader: /* glsl */ `
      out vec3 vLocalPosition;
      void main() {
        vLocalPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      precision highp int;
      precision highp usampler2DArray;

      #define AO_SAMPLES ${quality.aoSamples}
      #define THICKNESS_STEPS ${quality.thicknessSteps}
      ${quality.dispersion ? '#define DISPERSION' : ''}
      ${quality.thicknessSteps > 0 ? '#define TRANSMISSION' : ''}

      uniform usampler2DArray uArrival;
      uniform vec3 uVolumeSize;

      uniform mat4 uLocalToWorld;
      uniform mat4 uWorldToLocal;
      uniform mat3 uLocalToWorldNormal;
      uniform mat4 uLocalToClip;

      uniform float uActiveRadius;
      uniform int uDebugMode;
      uniform uint uPlayheadTick;
      uniform float uPlayheadOffset;
      uniform float uTransition;
      uniform float uGlowTicks;
      uniform float uGlowStrength;
      uniform vec3 uGlowColor;

      uniform float uIso;
      uniform float uRoughness;
      uniform float uIor;
      uniform float uClearcoat;
      uniform float uClearcoatRoughness;
      uniform vec3 uAbsorption;
      uniform vec3 uBodyColor;
      uniform float uIridescence;
      uniform float uThroughBase;
      uniform float uRateEmphasis;
      uniform float uReferenceSpeed;
      uniform float uAlbedoScale;
      uniform float uTransmissionGain;
      uniform float uAoStrength;
      uniform float uExposure;
      uniform float uDirectGain;

      in vec3 vLocalPosition;
      out vec4 outColor;

      ${ENV_GLSL}
      ${STRUCTURE_GLSL}
      ${BRDF_GLSL}

      // Unsigned literal suffix, not uint(4294967295): the bare literal is an
      // int constant past INT_MAX, which some drivers reject at compile time.
      const uint NEVER = ${NEVER_TICK}u;

      /* ---------------------------------------------------------------- */
      /* The field                                                        */
      /* ---------------------------------------------------------------- */

      /** How solid one lattice site is right now: 0 empty, 1 frozen and settled. */
      float revealAt(ivec3 cell) {
        if (any(lessThan(cell, ivec3(0))) || any(greaterThanEqual(cell, ivec3(uVolumeSize)))) return 0.0;
        uint arrival = texelFetch(uArrival, cell, 0).r;
        if (arrival == NEVER) return 0.0;
        // Seed sites carry tick 0 and are present from the first frame.
        if (arrival == uint(0)) return 1.0;
        // Integer compare before any float math: the playhead is an exact tick,
        // and a site must not appear one frame early because of a rounding.
        if (arrival > uPlayheadTick) return 0.0;
        if (uTransition <= 0.0) return 1.0;
        float age = float(uPlayheadTick - arrival) + uPlayheadOffset;
        float t = clamp(age / uTransition, 0.0, 1.0);
        return t * t * (3.0 - 2.0 * t);
      }

      /** Ticks since this one cell froze; huge if it never did. */
      float ageAtCell(ivec3 cell) {
        if (any(lessThan(cell, ivec3(0))) || any(greaterThanEqual(cell, ivec3(uVolumeSize)))) return 1e9;
        uint arrival = texelFetch(uArrival, cell, 0).r;
        if (arrival == NEVER || arrival > uPlayheadTick) return 1e9;
        return float(uPlayheadTick - arrival) + uPlayheadOffset;
      }

      /**
       * The sample grid is triangular, not square — \`i\` runs along x and \`j\`
       * along a 60° axis. Bilinear interpolation would cut every hexagon across
       * the wrong diagonal and put a faint square grid over a six-fold object,
       * so each cell is split into the two triangles the lattice actually has.
       */
      float triangularPlaneAt(ivec3 base, vec2 f) {
        float c00 = revealAt(base);
        float c10 = revealAt(base + ivec3(1, 0, 0));
        float c01 = revealAt(base + ivec3(0, 1, 0));
        if (f.x + f.y <= 1.0) {
          return c00 + (c10 - c00) * f.x + (c01 - c00) * f.y;
        }
        float c11 = revealAt(base + ivec3(1, 1, 0));
        return c10 * (1.0 - f.y) + c01 * (1.0 - f.x) + c11 * (f.x + f.y - 1.0);
      }

      /**
       * Age of the ice at a surface point.
       *
       * Rounding the hit to its nearest cell does not work, and this cost a
       * round of "why is the glow so weak": the isosurface is the 0.36 level
       * set, so it sits between a frozen cell and an empty one and *nearer the
       * empty one*. The nearest cell is therefore usually a site that never
       * froze, which reports as infinitely old, and the growing edge went dark
       * over most of its length. Step inward along the normal instead and take
       * the youngest ice found.
       */
      float ageAtSurface(vec3 point, vec3 outwardNormal) {
        vec3 cell = 1.0 / max(uVolumeSize - vec3(1.0), vec3(1.0));
        vec3 scale = uVolumeSize - vec3(1.0);
        float youngest = 1e9;
        for (int step = 1; step <= 2; step++) {
          vec3 probe = point - outwardNormal * cell * (float(step) * 0.9);
          youngest = min(youngest, ageAtCell(ivec3(floor(probe * scale + 0.5))));
        }
        return youngest;
      }

      /**
       * How fast the growth front was moving when it laid down this patch.
       *
       * Measured, not invented. The arrival ticks are a time-of-arrival field,
       * and for a moving front the speed is the reciprocal of that field's
       * gradient — so stepping inward along the normal and asking how much
       * older the ice gets answers it directly. A tip that ran out quickly
       * leaves a shallow age gradient; a pocket that filled slowly leaves a
       * steep one.
       *
       * Normalised against this run's own mean radial speed, so the reading is
       * a ratio rather than an arbitrary scale. Returns 0.5 — "no opinion" —
       * where either probe lands outside the ice.
       */
      float frontRate(vec3 point, vec3 outwardNormal) {
        if (uReferenceSpeed <= 0.0) return 0.5;
        vec3 cell = 1.0 / max(uVolumeSize - vec3(1.0), vec3(1.0));
        vec3 scale = uVolumeSize - vec3(1.0);
        float shallow = ageAtCell(ivec3(floor((point - outwardNormal * cell * 1.2) * scale + 0.5)));
        float deep = ageAtCell(ivec3(floor((point - outwardNormal * cell * 5.0) * scale + 0.5)));
        if (shallow > 1e8 || deep > 1e8) return 0.5;

        float ageGain = max(deep - shallow, 1.0);
        float speed = 3.8 / ageGain;

        // Against the mean radial speed, not a multiple of it. A dendrite tip
        // advances at roughly the mean, so this puts the running tips at the
        // top of the range and lets the slow surfaces fall away beneath them:
        // an arm's flank comes out near a fifth, a pocket between branches
        // near a twentieth. Dividing by twice the mean — the first attempt —
        // capped the tips at half scale and the whole crystal read as one
        // material again.
        return clamp(speed / uReferenceSpeed, 0.0, 1.0);
      }

      float fieldAt(vec3 localPoint) {
        vec3 voxel = localPoint * (uVolumeSize - vec3(1.0));
        ivec3 base = ivec3(floor(voxel));
        vec3 f = fract(voxel);
        float z0 = triangularPlaneAt(base, f.xy);
        float z1 = triangularPlaneAt(base + ivec3(0, 0, 1), f.xy);
        return mix(z0, z1, f.z);
      }

      vec3 normalizedOr(vec3 value, vec3 fallback) {
        float lengthSquared = dot(value, value);
        if (lengthSquared > 1e-12) return value * inversesqrt(lengthSquared);
        float fallbackSquared = dot(fallback, fallback);
        return fallbackSquared > 1e-12
          ? fallback * inversesqrt(fallbackSquared)
          : vec3(0.0, 0.0, 1.0);
      }

      /** Outward surface normal in local space, from the field's gradient. */
      vec3 surfaceNormal(vec3 point, vec3 fallback) {
        // Keyed to the cell grid rather than to a world epsilon, so all six arms
        // differentiate identically and the crystal cannot lose its symmetry to
        // rounding.
        // A sub-cell stencil turns every lattice terrace into a high-contrast
        // microfacet. Those facets are real topology but not useful optical
        // normals: against the dark studio they flash between cyan and black as
        // the camera moves. A 1.8-cell central difference keeps branch/terrace
        // form while making the presentation normal coherent across pixels.
        vec3 epsilon = 1.8 / max(uVolumeSize - vec3(1.0), vec3(1.0));
        float dx = fieldAt(point + vec3(epsilon.x, 0.0, 0.0)) - fieldAt(point - vec3(epsilon.x, 0.0, 0.0));
        float dy = fieldAt(point + vec3(0.0, epsilon.y, 0.0)) - fieldAt(point - vec3(0.0, epsilon.y, 0.0));
        float dz = fieldAt(point + vec3(0.0, 0.0, epsilon.z)) - fieldAt(point - vec3(0.0, 0.0, epsilon.z));
        return normalizedOr(-vec3(dx / epsilon.x, dy / epsilon.y, dz / epsilon.z), fallback);
      }

      bool rayBox(vec3 origin, vec3 direction, out float entry, out float exitDistance) {
        vec3 safeDirection = mix(vec3(1e-7), direction, greaterThan(abs(direction), vec3(1e-7)));
        vec3 inverseDirection = 1.0 / safeDirection;
        vec3 nearPlane = (vec3(0.0) - origin) * inverseDirection;
        vec3 farPlane = (vec3(1.0) - origin) * inverseDirection;
        vec3 lower = min(nearPlane, farPlane);
        vec3 upper = max(nearPlane, farPlane);
        entry = max(max(lower.x, lower.y), lower.z);
        exitDistance = min(min(upper.x, upper.y), upper.z);
        return exitDistance >= max(entry, 0.0);
      }

      /**
       * Clip the ray to the cylinder the crystal actually occupies.
       *
       * The proxy is the crop's bounding box, and the crystal is a hexagonal
       * plate inscribed in it — so the corners of that box are empty, and a ray
       * through one of them used to march its full step budget and find
       * nothing. Worse, early in the tour the crystal is a fraction of the crop
       * and *almost every* ray was doing that.
       *
       * The radius comes from the same measured envelope that drives the
       * tracking shot, so the clip is always exactly as tight as the data
       * allows and never cuts into the crystal. Local space is sheared, so the
       * test is done in world space, where the cylinder is round; the ray
       * parameter is shared because the transform is linear.
       */
      bool clipToActive(vec3 origin, vec3 direction, inout float entry, inout float exitDistance) {
        if (uActiveRadius > 1e8) return true;

        vec3 worldOrigin = (uLocalToWorld * vec4(origin, 1.0)).xyz;
        vec3 worldDirection = mat3(uLocalToWorld) * direction;

        vec2 o = worldOrigin.xy;
        vec2 d = worldDirection.xy;
        float a = dot(d, d);
        float b = 2.0 * dot(o, d);
        float c = dot(o, o) - uActiveRadius * uActiveRadius;

        // A ray travelling straight down the axis never leaves the cylinder,
        // so the quadratic degenerates and the answer is just "is it inside".
        if (a < 1e-12) return c <= 0.0;

        float discriminant = b * b - 4.0 * a * c;
        if (discriminant < 0.0) return false;

        float root = sqrt(discriminant);
        float near = (-b - root) / (2.0 * a);
        float far = (-b + root) / (2.0 * a);

        entry = max(entry, near);
        exitDistance = min(exitDistance, far);
        return exitDistance >= entry;
      }

      /** March to the first isosurface crossing, then bisect it four times. */
      bool firstHit(vec3 origin, vec3 direction, float entry, float exitDistance, out float hit) {
        vec3 cellPath = abs(direction * (exitDistance - entry)) * (uVolumeSize - vec3(1.0));
        float requested = max(8.0, ceil(length(cellPath) * ${quality.samplesPerCell.toFixed(3)}));
        float stepCount = min(requested, ${quality.maxSteps.toFixed(1)});
        float stepLength = (exitDistance - entry) / max(stepCount, 1.0);

        float previousDistance = entry;
        float previousField = fieldAt(origin + direction * entry);
        if (previousField >= uIso) { hit = entry; return true; }

        for (int step = 1; step <= ${quality.maxSteps}; step++) {
          if (float(step) > stepCount) break;
          float along = min(exitDistance, entry + float(step) * stepLength);
          float value = fieldAt(origin + direction * along);
          if (value >= uIso && previousField < uIso) {
            float low = previousDistance;
            float high = along;
            for (int refine = 0; refine < 4; refine++) {
              float middle = (low + high) * 0.5;
              if (fieldAt(origin + direction * middle) >= uIso) high = middle;
              else low = middle;
            }
            hit = high;
            return true;
          }
          previousField = value;
          previousDistance = along;
        }
        return false;
      }

      /* ---------------------------------------------------------------- */
      /* Shading                                                          */
      /* ---------------------------------------------------------------- */

      /**
       * Contact darkening, read straight out of the field.
       *
       * Walking outward along the normal and asking whether we are still inside
       * something answers "how enclosed is this point" for free — no rays, no
       * samples of a neighbour buffer. It is what puts shadow in the crotch of
       * every side branch, and without it a thousand branches read as one flat
       * doily.
       */
      float ambientOcclusion(vec3 point, vec3 normal) {
        vec3 cell = 1.0 / max(uVolumeSize - vec3(1.0), vec3(1.0));
        float occlusion = 0.0;
        float total = 0.0;
        float weight = 1.0;
        for (int i = 1; i <= AO_SAMPLES; i++) {
          float reach = float(i) * 2.6;
          vec3 probe = point + normal * cell * reach;
          occlusion += weight * clamp(fieldAt(probe) - uIso, 0.0, 1.0) / max(1.0 - uIso, 1e-3);
          total += weight;
          weight *= 0.62;
        }
        return clamp(1.0 - uAoStrength * occlusion / max(total, 1e-4), 0.0, 1.0);
      }

      #ifdef TRANSMISSION
      /**
       * Follow a refracted ray through the crystal.
       *
       * Returns how much ice it crosses, in world units, and — the part that
       * matters for the look — whether it leaves the body it started in and
       * runs into another one. On a snowflake seen at any angle off face-on the
       * arms overlap, so that second body is the far side of the crystal seen
       * through the near side. It is the only structure a refracted ray has to
       * find in a black room, and without it no amount of tuning makes the
       * surface read as glass rather than as a tinted solid.
       */
      float traceInterior(vec3 point, vec3 direction, out bool reachedFar, out vec3 farPoint) {
        reachedFar = false;
        farPoint = point;

        float entry;
        float exitDistance;
        if (!rayBox(point, direction, entry, exitDistance)) return 0.0;
        exitDistance = max(exitDistance, 0.0);

        float stepLength = exitDistance / float(THICKNESS_STEPS);
        float inside = 0.0;
        bool leftFirstBody = false;
        float previousAlong = 0.0;
        for (int i = 1; i <= THICKNESS_STEPS; i++) {
          float along = (float(i) - 0.5) * stepLength;
          vec3 probe = point + direction * along;
          float value = fieldAt(probe);
          if (value >= uIso) {
            inside += 1.0;
            if (leftFirstBody && !reachedFar) {
              reachedFar = true;
              // The coarse thickness sample may land many cells inside the far
              // body, where the scalar field is flat and its normal is zero.
              // Refine the actual empty→solid crossing before shading it.
              float low = previousAlong;
              float high = along;
              for (int refine = 0; refine < 4; refine++) {
                float middle = (low + high) * 0.5;
                if (fieldAt(point + direction * middle) >= uIso) high = middle;
                else low = middle;
              }
              farPoint = point + direction * high;
            }
          } else {
            leftFirstBody = true;
          }
          previousAlong = along;
        }
        // Local step → world step. The lattice is sheared and the c-axis is
        // exaggerated, so a local unit is not a world unit and absorption would
        // be anisotropic if this were skipped.
        float worldPerLocal = length(mat3(uLocalToWorld) * direction);
        return inside * stepLength * worldPerLocal;
      }
      #endif

      void main() {
        vec3 cameraLocal = (uWorldToLocal * vec4(cameraPosition, 1.0)).xyz;
        vec3 rayDirection = normalize(vLocalPosition - cameraLocal);
        vec3 rayOrigin = vLocalPosition - rayDirection * 1e-4;

        float entry;
        float exitDistance;
        if (!rayBox(rayOrigin, rayDirection, entry, exitDistance)) discard;
        entry = max(entry, 0.0);
        if (!clipToActive(rayOrigin, rayDirection, entry, exitDistance)) discard;

        float hitDistance;
        if (!firstHit(rayOrigin, rayDirection, entry, exitDistance, hitDistance)) discard;
        vec3 hit = rayOrigin + rayDirection * hitDistance;

        if (uDebugMode == 1) {
          vec4 debugClip = uLocalToClip * vec4(hit, 1.0);
          gl_FragDepth = 0.5 * (debugClip.z / debugClip.w) + 0.5;
          outColor = linearToOutputTexel(vec4(0.85, 0.92, 1.0, 1.0));
          return;
        }

        vec3 localNormal = surfaceNormal(hit, -rayDirection);

        vec3 worldHit = (uLocalToWorld * vec4(hit, 1.0)).xyz;
        vec3 view = normalize(cameraPosition - worldHit);
        vec3 normal = normalizedOr(uLocalToWorldNormal * localNormal, view);
        // The proxy box is drawn front-side only, but a grazing ray can still
        // land on a back-facing patch of the implicit surface.
        if (dot(normal, view) < 0.0) normal = -normal;

        if (uDebugMode == 2) {
          vec4 debugClip = uLocalToClip * vec4(hit, 1.0);
          gl_FragDepth = 0.5 * (debugClip.z / debugClip.w) + 0.5;
          outColor = linearToOutputTexel(vec4(normal * 0.5 + 0.5, 1.0));
          return;
        }

        float nDotV = clamp(dot(normal, view), 1e-4, 1.0);
        float occlusion = ambientOcclusion(hit, localNormal);

        float f0Scalar = pow((uIor - 1.0) / (uIor + 1.0), 2.0);
        vec3 f0 = vec3(f0Scalar);
        // Optically clear ice would be ~0.02 here; a snow crystal is not clear,
        // because it is stacked plates and facet steps and it scatters at every
        // one of them. The clarity control slides between the two.
        //
        // Modulated by the local growth rate, which is not a stylistic choice:
        // ice laid down fast traps defects and air and comes out milky, while a
        // slowly built facet grows clear. It is why the tips of a real stellar
        // dendrite look frosted and its inner plates look glassy — and it makes
        // the fast-growing frontier read as a different material, which is
        // exactly where the eye should go.
        float rate = frontRate(hit, localNormal);
        // Gently. Rate drives three things — cloudiness, transmission and the
        // emission — and at first it pushed albedo by up to 2.6× the emphasis,
        // which meant turning the growth readout up past about 1.2 rendered the
        // whole frontier as white paint. The emission is what communicates the
        // growth; the cloudiness only has to hint at it, or it eats the glass.
        float cloudiness = mix(1.0, 1.0 + 0.7 * uRateEmphasis, rate);
        vec3 albedo = uBodyColor * uAlbedoScale * cloudiness;

        /* ---- direct rig ---- */
        // The same three sources appear in the environment as cards, so these
        // are scaled back: their job is the crisp GGX highlight and the wrapped
        // scatter the environment lookup cannot express, not a second full
        // helping of the same light.
        vec3 direct = vec3(0.0);
        direct += directLight(normal, view, uKeyDir, uKeyColor * uKeyIntensity, albedo, uRoughness, f0, 0.55);
        direct += directLight(normal, view, uRimDir, uRimColor * uRimIntensity, albedo, uRoughness * 1.4, f0, 0.85);
        direct += directLight(normal, view, uFillDir, uFillColor * uFillIntensity, albedo, uRoughness * 2.0, f0, 0.6);
        direct *= uDirectGain;

        /* ---- environment ---- */
        vec3 reflected = reflect(-view, normal);
        vec3 specularIbl = envRadiance(reflected, uRoughness, 1.0) + envStructure(reflected, uRoughness);
        vec3 fresnel = fresnelSchlick(nDotV, f0);
        // Split-sum's second half, approximated. Without it the grazing rim
        // over-brightens and the crystal gains a white outline it has not earned.
        vec3 specular = specularIbl * (fresnel * 0.94 + 0.06) * occlusion;
        vec3 diffuse = envIrradiance(normal) * albedo * occlusion;

        /* ---- transmission ---- */
        vec3 transmitted = vec3(0.0);
        #ifdef TRANSMISSION
        float eta = 1.0 / uIor;
        vec3 refractedWorld = refract(-view, normal, eta);
        if (dot(refractedWorld, refractedWorld) < 1e-6) {
          // Total internal reflection: nothing gets through, so pay it back to
          // the reflection instead of dropping the energy on the floor.
          transmitted = specularIbl * 0.5;
        } else {
          refractedWorld = normalize(refractedWorld);
          vec3 refractedLocal = normalizedOr(
            (uWorldToLocal * vec4(refractedWorld, 0.0)).xyz,
            rayDirection
          );
          bool reachedFar;
          vec3 farPoint;
          float thickness = traceInterior(hit, refractedLocal, reachedFar, farPoint);

          #ifdef DISPERSION
          // Three wavelengths at slightly separated indices. This is the whole
          // reason a real crystal edge throws colour, and the cheapest way to
          // stop refraction reading as frosted glass. Unrolled rather than
          // looped: dynamic vector indexing is legal here but not uniformly
          // well-optimised across drivers, and this runs per fragment.
          float blur = uRoughness * 1.35;
          vec3 bentR = refract(-view, normal, 1.0 / (uIor - 0.012));
          vec3 bentG = refract(-view, normal, 1.0 / uIor);
          vec3 bentB = refract(-view, normal, 1.0 / (uIor + 0.014));
          bentR = dot(bentR, bentR) < 1e-6 ? reflected : normalize(bentR);
          bentG = dot(bentG, bentG) < 1e-6 ? reflected : normalize(bentG);
          bentB = dot(bentB, bentB) < 1e-6 ? reflected : normalize(bentB);
          vec3 through = vec3(
            (envRadiance(bentR, blur, uThroughBase) + envStructure(bentR, blur)).r,
            (envRadiance(bentG, blur, uThroughBase) + envStructure(bentG, blur)).g,
            (envRadiance(bentB, blur, uThroughBase) + envStructure(bentB, blur)).b
          );
          #else
          vec3 through = envRadiance(refractedWorld, uRoughness * 1.35, uThroughBase)
            + envStructure(refractedWorld, uRoughness * 1.35);
          #endif

          // The far arm, if the ray found one. Shaded cheaply — a Fresnel-
          // weighted environment reflection and a little diffuse, no second
          // transmission and no occlusion — because it is being viewed through
          // a body that is about to absorb most of it anyway.
          if (reachedFar) {
            vec3 farNormalLocal = surfaceNormal(farPoint, -refractedLocal);
            vec3 farNormal = normalizedOr(uLocalToWorldNormal * farNormalLocal, -refractedWorld);
            if (dot(farNormal, refractedWorld) > 0.0) farNormal = -farNormal;

            float farFacing = max(dot(farNormal, -refractedWorld), 1e-4);
            vec3 farFresnel = fresnelSchlick(farFacing, f0);
            vec3 farDir = reflect(refractedWorld, farNormal);
            vec3 far = (envRadiance(farDir, uRoughness, 1.0) + envStructure(farDir, uRoughness))
              * (farFresnel * 0.9 + 0.1);
            far += envIrradiance(farNormal) * albedo;
            // Half, not most. Strictly a ray that runs into another arm sees
            // that arm and not the room, so 0.85 was the physical answer — and
            // at an oblique angle enough of the projected area is overlapping
            // arms that it hid the background completely, which defeats the
            // point of putting a background there. This lets both through.
            through = mix(through, far, 0.55);
          }

          // Beer–Lambert. Thin arm tips stay near-white and the thick core goes
          // deep cyan — the single strongest cue that this is ice and not glass.
          transmitted = through * exp(-uAbsorption * thickness);
        }
        // Cloudy ice transmits less, for the same reason it scatters more.
        transmitted *= (1.0 - fresnel) * occlusion * uTransmissionGain
          * mix(1.0, 1.0 - 0.22 * clamp(uRateEmphasis, 0.0, 1.0), rate);
        #endif

        /* ---- clearcoat ---- */
        vec3 coatF0 = vec3(0.04);
        vec3 coatFresnel = fresnelSchlick(nDotV, coatF0);
        vec3 coat = (envRadiance(reflected, uClearcoatRoughness, 1.0)
          + envStructure(reflected, uClearcoatRoughness)) * coatFresnel * uClearcoat;
        coat += directLight(normal, view, uKeyDir, uKeyColor * uKeyIntensity, vec3(0.0), uClearcoatRoughness, coatF0, 0.0) * uClearcoat;

        /* ---- edge iridescence ---- */
        vec3 film = iridescence(nDotV, 420.0);
        float edge = pow(1.0 - nDotV, 3.2);
        vec3 sheen = film * edge * uIridescence * (uKeyColor * 0.6 + uRimColor * 0.4);

        vec3 color = direct + specular + diffuse + transmitted + coat + sheen;
        color *= uExposure;

        /* ---- the growing edge ---- */
        // Sites that froze in the last fraction of a second emit. It is the one
        // frankly non-physical light in the scene and it is the point of the
        // whole piece: the crystal writes itself in light, at the rim, in the
        // order the solver actually built it.
        float age = ageAtSurface(hit, localNormal);
        float freshness = uGlowTicks <= 0.0 ? 0.0 : exp(-age / uGlowTicks);

        // Age is the whole signal, and deliberately the only one. Gating this on
        // distance from the crystal's centre was tried and reverted: attachment
        // happens along the flank of every arm and all through the side
        // branches, not just at the outermost radius, so a radial gate left the
        // six tips glowing and switched the rest of the growing surface off.
        // The frontier is where growth is both recent *and* fast, so the two
        // measurements multiply. A slowly filling pocket still glows, but the
        // running tips are what carry the frame.
        vec3 emission = uGlowColor * freshness * uGlowStrength * (0.35 + 0.65 * edge)
          * mix(0.45, 1.0 + 0.9 * uRateEmphasis, rate);

        vec4 hitClip = uLocalToClip * vec4(hit, 1.0);
        gl_FragDepth = 0.5 * (hitClip.z / hitClip.w) + 0.5;

        // Tone map the lit surface, then add the emission straight on top of
        // it. Adding it before would let ACES roll the one thing the bloom pass
        // exists to find straight back down.
        //
        // Added, and allowed to clip. A screened blend that approaches white
        // asymptotically was tried, to stop the opening seconds blowing out
        // while most of the crystal is genuinely fresh — and it was wrong. That
        // blowout is the reading: it says the whole crystal is growing at once,
        // and the plate cools out of it into clear ice as the front runs away.
        // Protecting against it threw away the signal.
        vec3 mapped = acesFilmic(color) + emission;
        outColor = linearToOutputTexel(vec4(mapped, 1.0));
      }
    `,
  })

  return { material, uniforms }
}
