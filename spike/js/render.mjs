// spike/js/render.mjs — canvas 2D renderer for the hex grid (pointy-top,
// axial coordinates, matching sim.mjs storage). Browser-only; the sim core
// never imports this.
//
// Full-grid redraw every frame. To keep ~40k cells near the 16 ms budget the
// renderer quantizes the field into a small set of colors and blits
// pre-rendered hex sprites from an offscreen atlas instead of tracing 40k
// paths. draw() returns elapsed ms so the UI can display it (the plan's
// perf check is an on-screen number plus an eyeball, recorded as such).

const SQRT3 = Math.sqrt(3);
const VAPOR_LEVELS = 48;
const ICE_LEVELS = 8;

function lerpColor(c0, c1, t) {
  return [
    Math.round(c0[0] + (c1[0] - c0[0]) * t),
    Math.round(c0[1] + (c1[1] - c0[1]) * t),
    Math.round(c0[2] + (c1[2] - c0[2]) * t),
  ];
}

function css([red, green, blue]) {
  return `rgb(${red},${green},${blue})`;
}

// Vapor: deep night blue (dry) -> soft slate blue (near saturation).
const VAPOR_DARK = [10, 14, 30];
const VAPOR_LIGHT = [96, 128, 178];
// Ice: pale glacial blue (fresh) -> white (thick).
const ICE_THIN = [168, 216, 246];
const ICE_THICK = [255, 255, 255];

export function createRenderer(canvas, gridSize, cssSizePx = 640) {
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
  const size = gridSize;

  // Fit hex radius to the requested CSS box.
  const physBox = Math.round(cssSizePx * dpr);
  const hexR = Math.min(
    physBox / (SQRT3 * (size + 0.5)),
    physBox / (1.5 * size + 0.5),
  );
  const width = Math.ceil(SQRT3 * hexR * (size + 0.5)) + 2;
  const height = Math.ceil(1.5 * hexR * (size - 1) + 2 * hexR) + 2;
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${Math.round(width / dpr)}px`;
  canvas.style.height = `${Math.round(height / dpr)}px`;
  const ctx = canvas.getContext('2d');

  // Sprite atlas: one hex per color level, vapor levels then ice levels.
  const spriteW = Math.ceil(SQRT3 * hexR) + 2;
  const spriteH = Math.ceil(2 * hexR) + 2;
  const levelCount = VAPOR_LEVELS + ICE_LEVELS;
  const atlas = document.createElement('canvas');
  atlas.width = spriteW * levelCount;
  atlas.height = spriteH;
  const atlasCtx = atlas.getContext('2d');
  for (let level = 0; level < levelCount; level++) {
    let color;
    if (level < VAPOR_LEVELS) {
      color = lerpColor(VAPOR_DARK, VAPOR_LIGHT, level / (VAPOR_LEVELS - 1));
    } else {
      color = lerpColor(ICE_THIN, ICE_THICK, (level - VAPOR_LEVELS) / (ICE_LEVELS - 1));
    }
    const cx = level * spriteW + spriteW / 2;
    const cy = spriteH / 2;
    atlasCtx.fillStyle = css(color);
    atlasCtx.beginPath();
    for (let k = 0; k < 6; k++) {
      // Pointy-top hexagon: vertices at 30 + 60*k degrees... measured so a
      // vertex points up. Angle offset -90deg puts the first vertex on top.
      const angle = (Math.PI / 180) * (60 * k - 90);
      // +0.35 px overdraw hides seams between neighboring sprites.
      const px = cx + (hexR + 0.35) * Math.cos(angle);
      const py = cy + (hexR + 0.35) * Math.sin(angle);
      if (k === 0) atlasCtx.moveTo(px, py); else atlasCtx.lineTo(px, py);
    }
    atlasCtx.closePath();
    atlasCtx.fill();
  }

  /** Field value -> atlas level. Vapor [0,1) spreads over the vapor ramp;
   *  ice (s >= 1) spreads s in [1, 2.5] over the ice ramp. */
  function levelFor(value) {
    if (value >= 1) {
      const t = Math.min((value - 1) / 1.5, 1);
      return VAPOR_LEVELS + Math.min(ICE_LEVELS - 1, Math.round(t * (ICE_LEVELS - 1)));
    }
    const t = Math.max(0, Math.min(value, 0.9999));
    return Math.min(VAPOR_LEVELS - 1, Math.floor(t * VAPOR_LEVELS));
  }

  /** Full-grid redraw. Returns elapsed milliseconds. */
  function draw(sim) {
    const t0 = performance.now();
    const { s } = sim;
    ctx.fillStyle = css(VAPOR_DARK);
    ctx.fillRect(0, 0, width, height);
    const halfW = spriteW / 2;
    const halfH = spriteH / 2;
    for (let r = 0; r < size; r++) {
      const y = 1 + hexR + 1.5 * hexR * r;
      const oddShift = (r & 1) * 0.5;
      const rowBase = r * size;
      for (let c = 0; c < size; c++) {
        const level = levelFor(s[rowBase + c]);
        const x = 1 + SQRT3 * hexR * (c + oddShift + 0.5);
        ctx.drawImage(
          atlas,
          level * spriteW, 0, spriteW, spriteH,
          x - halfW, y - halfH, spriteW, spriteH,
        );
      }
    }
    return performance.now() - t0;
  }

  return { draw, width, height, hexR };
}
