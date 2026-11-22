// Small 2D geometry kit: collision push-out, ray casts and line of sight
// against axis-aligned rectangles and smoke circles.

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export function angDiff(a, b) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function turnToward(cur, target, maxStep) {
  const d = angDiff(cur, target);
  return Math.abs(d) <= maxStep ? target : cur + Math.sign(d) * maxStep;
}

// Push a circle {x,y} of radius r out of every rect it overlaps (slides along walls).
export function pushOutCircle(c, r, rects) {
  for (const q of rects) {
    const nx = clamp(c.x, q.x, q.x + q.w);
    const ny = clamp(c.y, q.y, q.y + q.h);
    const dx = c.x - nx;
    const dy = c.y - ny;
    const d2 = dx * dx + dy * dy;
    if (d2 >= r * r) continue;
    if (d2 > 1e-6) {
      const d = Math.sqrt(d2);
      c.x = nx + (dx / d) * r;
      c.y = ny + (dy / d) * r;
    } else {
      const l = c.x - q.x, rr = q.x + q.w - c.x, t = c.y - q.y, b = q.y + q.h - c.y;
      const m = Math.min(l, rr, t, b);
      if (m === l) c.x = q.x - r;
      else if (m === rr) c.x = q.x + q.w + r;
      else if (m === t) c.y = q.y - r;
      else c.y = q.y + q.h + r;
    }
  }
}

// Segment (x,y)+(dx,dy)*t, t in [0,1], against a rect. Returns entry t or Infinity.
export function segRect(x, y, dx, dy, q) {
  let t0 = 0;
  let t1 = 1;
  if (Math.abs(dx) < 1e-9) {
    if (x < q.x || x > q.x + q.w) return Infinity;
  } else {
    let a = (q.x - x) / dx, b = (q.x + q.w - x) / dx;
    if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a);
    t1 = Math.min(t1, b);
    if (t0 > t1) return Infinity;
  }
  if (Math.abs(dy) < 1e-9) {
    if (y < q.y || y > q.y + q.h) return Infinity;
  } else {
    let a = (q.y - y) / dy, b = (q.y + q.h - y) / dy;
    if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a);
    t1 = Math.min(t1, b);
    if (t0 > t1) return Infinity;
  }
  return t0;
}

export function segCircle(x, y, dx, dy, cx, cy, r) {
  const fx = x - cx, fy = y - cy;
  const c = fx * fx + fy * fy - r * r;
  if (c <= 0) return 0;
  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const disc = b * b - 4 * a * c;
  if (disc < 0) return Infinity;
  const t = (-b - Math.sqrt(disc)) / (2 * a);
  return t >= 0 && t <= 1 ? t : Infinity;
}

export function castRay(x, y, ang, len, rects, smokes) {
  const dx = Math.cos(ang) * len;
  const dy = Math.sin(ang) * len;
  let t = 1;
  for (const q of rects) {
    const h = segRect(x, y, dx, dy, q);
    if (h < t) t = h;
  }
  for (const s of smokes) {
    if (s.r < 8) continue;
    const h = segCircle(x, y, dx, dy, s.x, s.y, s.r * 0.85);
    if (h < t) t = h;
  }
  return t * len;
}

export function clearLine(x1, y1, x2, y2, rects, smokes) {
  const dx = x2 - x1, dy = y2 - y1;
  for (const q of rects) if (segRect(x1, y1, dx, dy, q) < 1) return false;
  for (const s of smokes) if (s.r >= 8 && segCircle(x1, y1, dx, dy, s.x, s.y, s.r * 0.85) < 1) return false;
  return true;
}

export function inCone(vx, vy, facing, half, range, px, py) {
  const dx = px - vx, dy = py - vy;
  if (dx * dx + dy * dy > range * range) return false;
  return Math.abs(angDiff(facing, Math.atan2(dy, dx))) <= half;
}

// Visible polygon of a cone, clipped by walls, props and smoke.
export function conePoly(x, y, facing, half, range, rects, smokes, n = 40) {
  const pts = [x, y];
  for (let i = 0; i <= n; i++) {
    const a = facing - half + (2 * half * i) / n;
    const d = castRay(x, y, a, range, rects, smokes);
    pts.push(x + Math.cos(a) * d, y + Math.sin(a) * d);
  }
  return pts;
}
