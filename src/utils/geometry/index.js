import parse from 'svg-path-parser';
import bounds from 'svg-path-bounds';

/**
 * This utility aims to aid with the following:
 * - mathematical computation
 * - polygon parsing
 * - centroid computation
 * anything involving math on vectors
 */


/**
 * @param {*} pathStr 
 * convert path to polygon (approximation using path commands)
 * @returns polygon points
 */
export const  parsePathToPolygon = (pathStr) => {
  const commands = parse(pathStr);
  const pts = [];
  let start = null;
  let current = { x: 0, y: 0 };

  for (const cmd of commands) {
    const code = cmd.code.toUpperCase?.() || cmd.code;
    switch (code) {
      case 'M':
      case 'L':
        current = { x: cmd.x, y: cmd.y };
        if (!start) start = { ...current };
        pts.push({ x: current.x, y: current.y });
        break;
      case 'H':
        current = { x: cmd.x, y: current.y };
        pts.push({ x: current.x, y: current.y });
        break;
      case 'V':
        current = { x: current.x, y: cmd.y };
        pts.push({ x: current.x, y: current.y });
        break;
      case 'Z':
        if (start) pts.push({ x: start.x, y: start.y });
        break;
      default:
        // handle implicit absolute coordinates (e.g., C/T/Q) by taking endpoint if present
        if (cmd.x !== undefined && cmd.y !== undefined) {
          current = { x: cmd.x, y: cmd.y };
          pts.push({ x: current.x, y: current.y });
        }
        break;
    }
  }
  return pts;
}

// correct point-in-polygon (ray-casting) plus edge tolerance check
export const isPointInPolygon = (point, polygon, tolerance = 10) => {
  if (!polygon || polygon.length === 0) return false;

  // 1) Edge distance tolerance: if point is within `tolerance` of any segment -> inside
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x,
      yi = polygon[i].y;
    const xj = polygon[j].x,
      yj = polygon[j].y;

    // projection of point onto segment
    const dx = xj - xi;
    const dy = yj - yi;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) {
      // degenerate segment (same points)
      const dist = Math.hypot(point.x - xi, point.y - yi);
      if (dist <= tolerance) return true;
      continue;
    }
    const t = Math.max(0, Math.min(1, ((point.x - xi) * dx + (point.y - yi) * dy) / lenSq));
    const projX = xi + t * dx;
    const projY = yi + t * dy;
    const dist = Math.hypot(projX - point.x, projY - point.y);
    if (dist <= tolerance) return true;
  }

  // 2) Ray-casting for strict inside/outside
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x,
      yi = polygon[i].y;
    const xj = polygon[j].x,
      yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * 
 * @param {*} path Vectpr path
 * This calculate the center of a shape based on the svg path data
 * @returns Array of numbers (decimal points)
 */
export const getCentroid = (path) => {
  try {
    const [x1, y1, x2, y2] = bounds(path);
    return [(x1 + x2) / 2, (y1 + y2) / 2];
  } catch {
    return [0, 0];
  }
}

/**
 * 
 * @param {*} pathStr 
 * @returns 
 */
export const computeBoundingBox = (pathStr) => {
  const numbers = pathStr.match(/-?\d+(\.\d+)?/g)?.map(Number) || [];
  const xs = numbers.filter((_, i) => i % 2 === 0);
  const ys = numbers.filter((_, i) => i % 2 === 1);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
    rx: (maxX - minX) / 2,
    ry: (maxY - minY) / 2,
  };
}