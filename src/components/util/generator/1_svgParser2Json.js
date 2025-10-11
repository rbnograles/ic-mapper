import fs from 'fs';
import { DOMParser } from 'xmldom';
import bounds from 'svg-path-bounds';
import parse from 'svg-path-parser';

// --- helpers ---
function getCentroid(path) {
  try {
    const [x1, y1, x2, y2] = bounds(path);
    return [(x1 + x2) / 2, (y1 + y2) / 2];
  } catch {
    return [0, 0];
  }
}

function normalizeId(id) {
  if (!id) return null;
  const match = id.match(/vector\s*(\d+)/i);
  if (match) return `BLDG_${match[1]}`;
  return id;
}

// convert path to polygon (approximation using path commands)
function parsePathToPolygon(pathStr) {
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
function isPointInPolygon(point, polygon, tolerance = 10) {
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

function getAttr(node, name) {
  if (!node) return null;
  return node.getAttribute ? node.getAttribute(name) : null;
}

function parseSvgToJson(svgFile, oldJsonPath) {
  const svgContent = fs.readFileSync(svgFile, 'utf-8');
  const doc = new DOMParser().parseFromString(svgContent, 'image/svg+xml');
  const oldData = fs.existsSync(oldJsonPath)
    ? JSON.parse(fs.readFileSync(oldJsonPath, 'utf-8'))
    : { places: [] };

  // --- buildings (group id = 'BLDG') ---
  const buildingGroup = doc.getElementById('BLDG');
  const buildingPaths = buildingGroup ? buildingGroup.getElementsByTagName('path') : [];
  const seen = new Set();
  let buildings = [];

  for (let i = 0; i < buildingPaths.length; i++) {
    const pathNode = buildingPaths.item(i);
    const rawId = getAttr(pathNode, 'id') || `BLDG_${i}`;
    const id = normalizeId(rawId);
    const d = getAttr(pathNode, 'd');
    if (!d) continue;
    if (seen.has(d)) continue;
    seen.add(d);

    buildings.push({
      id,
      path: d,
      centroid: getCentroid(d),
      name: null,
      entranceNodes: [],
    });
  }

  const unclikableGroup = doc.getElementById('Unclikable');
  const unclikablePaths = unclikableGroup ? unclikableGroup.getElementsByTagName('path') : [];

  for (let i = 0; i < unclikablePaths.length; i++) {
    const pathNode = unclikablePaths.item(i);
    const rawId = getAttr(pathNode, 'id');
    const id = normalizeId(rawId) || `BLDG_${buildings.length + i}`;
    const d = getAttr(pathNode, 'd');

    if (!d) continue;
    if (seen.has(d)) continue;
    seen.add(d);

    buildings.push({
      id,
      path: d,
      centroid: getCentroid(d),
      name: 'NotClickable',
      type: 'NotClickable',
      baseFill: "white",
      description: 'Place description goes in here...',
      entranceNodes: [],
      floor: 'Ayala Malls Thrid Floor',
    });
  }

  // --- labels (group id = 'Building Marks') ---
  const labelGroup = doc.getElementById('Building Marks') || doc.getElementById('Building_Marks');
  const labelPaths = labelGroup ? labelGroup.getElementsByTagName('path') : [];
  let labels = [];

  for (let i = 0; i < labelPaths.length; i++) {
    const pathNode = labelPaths.item(i);
    const id = getAttr(pathNode, 'id') || `label_${i}`;
    const d = getAttr(pathNode, 'd');
    if (!d) continue;
    const centroid = getCentroid(d);
    labels.push({ name: id, centroid });
  }

  for (const label of labels) {
    let nearest = null,
      minDist = Infinity;
    for (const b of buildings) {
      const dx = label.centroid[0] - b.centroid[0];
      const dy = label.centroid[1] - b.centroid[1];
      const dist = Math.hypot(dx, dy);
      if (dist < minDist) {
        minDist = dist;
        nearest = b;
      }
    }
    if (nearest) nearest.name = label.name;
  }

  // --- entrances: accept path, circle, ellipse inside Entrances group ---
  const entranceGroup = doc.getElementById('Entrances') || doc.getElementById('entrances');
  let entrances = [];

  if (entranceGroup) {
    // paths
    const entrancePaths = entranceGroup.getElementsByTagName('path');
    for (let i = 0; i < entrancePaths.length; i++) {
      const node = entrancePaths.item(i);
      const id = getAttr(node, 'id') || `entr_path_${i}`;
      const d = getAttr(node, 'd');
      if (!d) continue;
      const centroid = getCentroid(d);
      entrances.push({ id, centroid, path: d, type: 'path' });
    }

    // circles
    const entranceCircles = entranceGroup.getElementsByTagName('circle');
    for (let i = 0; i < entranceCircles.length; i++) {
      const node = entranceCircles.item(i);
      const id = getAttr(node, 'id') || `entr_circle_${i}`;
      const cx = parseFloat(getAttr(node, 'cx') || '0');
      const cy = parseFloat(getAttr(node, 'cy') || '0');
      entrances.push({ id, centroid: [cx, cy], path: null, type: 'circle' });
    }

    // ellipses
    const entranceEllipses = entranceGroup.getElementsByTagName('ellipse');
    for (let i = 0; i < entranceEllipses.length; i++) {
      const node = entranceEllipses.item(i);
      const id = getAttr(node, 'id') || `entr_ellipse_${i}`;
      const cx = parseFloat(getAttr(node, 'cx') || '0');
      const cy = parseFloat(getAttr(node, 'cy') || '0');
      entrances.push({ id, centroid: [cx, cy], path: null, type: 'ellipse' });
    }
  } else {
    console.warn('⚠️ No Entrances group found in SVG (id="Entrances")');
  }

  // --- assign entrances to buildings when inside polygon (tolerance allowed) ---
  for (const entrance of entrances) {
    const pt = { x: entrance.centroid[0], y: entrance.centroid[1] };

    for (const b of buildings) {
      const poly = parsePathToPolygon(b.path);
      // if polygon conversion failed or is degenerate, skip
      if (!poly || poly.length < 3) continue;

      if (isPointInPolygon(pt, poly, 15)) {
        // avoid duplicates
        if (!b.entranceNodes.includes(entrance.id)) {
          b.entranceNodes.push(entrance.id);
        }
        // once matched to a building, break (entrance belongs only to nearest/one building)
        break;
      }
    }
  }

  // --- merge with old ---
  const oldPathMap = new Map((oldData.places || []).map((p) => [p.path, p]));
  const oldIdMap = new Map((oldData.places || []).map((p) => [p.id, p]));
  const merged = [];

  for (const nb of buildings) {
    const old = oldPathMap.get(nb.path) || oldIdMap.get(nb.id);
    if (!old) {
      merged.push({
        id: nb.id,
        name: nb.name || 'Unknown',
        path: nb.path,
        type: nb.name === 'NotClickable' ? 'NotClickable' : 'Building',
        entranceNodes: nb.entranceNodes,
        description: 'Place description goes in here...',
        nearNodes: [],
        baseFill: nb.baseFill ?? 'white',
        centerX: nb.centerX,
        centerY: nb.centerY,
        icon: nb.icon
      });
      continue;
    }

    const mergedObj = {
      ...old,
      ...nb,
      path: nb.path, // always use new path
    };

    // Fix name/type/fill
    if ((nb.name === 'Unknown' || !nb.name) && old.name) mergedObj.name = old.name;
    if (nb.type === 'Building' && old.type && old.type !== 'Building') mergedObj.type = old.type;
    if (nb.baseFill === '#FFFFFF' && old.baseFill && old.baseFill !== '#FFFFFF') {
      mergedObj.baseFill = old.baseFill;
    }

    merged.push(mergedObj);
  }

  const unmatchedOld = (oldData.places || []).filter((op) => !merged.some((mp) => mp.id === op.id));

  console.log(
    '⚠️ Unmatched old items:',
    unmatchedOld.map((x) => x.id)
  );
  return {
    places: merged,
  };
}

// --- run ---
const svgPath = '../../../assets/AyalaMallsMap/2ndFloor.svg';
const oldJson = '../../Data/AyalaMalls/SecondFloor/SecondFloor.json';

const result = parseSvgToJson(svgPath, oldJson);

fs.writeFileSync(
  '../../Data/AyalaMalls/SecondFloor/SecondFloor.json',
  JSON.stringify({ places: result.places }, null, 2)
);

console.log(`✅ Wrote merged SecondFloor.json (buildings with entranceNodes).`);
