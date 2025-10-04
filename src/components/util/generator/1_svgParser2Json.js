// parseSvgToJson.js
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

// convert path to polygon
function parsePathToPolygon(pathStr) {
  const commands = parse(pathStr);
  const pts = [];
  let start = null;
  let current = { x: 0, y: 0 };

  for (const cmd of commands) {
    switch (cmd.code) {
      case 'M':
      case 'L':
        current = { x: cmd.x, y: cmd.y };
        if (!start) start = { ...current };
        pts.push(current);
        break;
      case 'H':
        current = { x: cmd.x, y: current.y };
        pts.push(current);
        break;
      case 'V':
        current = { x: current.x, y: cmd.y };
        pts.push(current);
        break;
      case 'Z':
        if (start) pts.push({ ...start });
        break;
      default:
        if (cmd.x !== undefined && cmd.y !== undefined) {
          current = { x: cmd.x, y: cmd.y };
          pts.push(current);
        }
        break;
    }
  }
  return pts;
}

// check if point is inside polygon (with tolerance)
function isPointInPolygon(point, polygon, tolerance = 10) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x,
      yi = polygon[i].y;
    const xj = polygon[j].x,
      yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;

    // edge tolerance
    const dx = xj - xi;
    const dy = yj - yi;
    const lenSq = dx * dx + dy * dy;
    if (lenSq > 0) {
      const t = Math.max(0, Math.min(1, ((point.x - xi) * dx + (point.y - yi) * dy) / lenSq));
      const projX = xi + t * dx;
      const projY = yi + t * dy;
      const dist = Math.sqrt((projX - point.x) ** 2 + (projY - point.y) ** 2);
      if (dist <= tolerance) return true;
    }
  }
  return inside;
}

function parseSvgToJson(svgFile, oldJsonPath) {
  const svgContent = fs.readFileSync(svgFile, 'utf-8');
  const doc = new DOMParser().parseFromString(svgContent, 'image/svg+xml');
  const oldData = fs.existsSync(oldJsonPath)
    ? JSON.parse(fs.readFileSync(oldJsonPath, 'utf-8'))
    : { places: [] };

  const buildingGroup = doc.getElementById('BLDG');
  const buildingPaths = buildingGroup.getElementsByTagName('path');
  const seen = new Set();
  let buildings = [];

  for (let i = 0; i < buildingPaths.length; i++) {
    const pathNode = buildingPaths.item(i);
    const rawId = pathNode.getAttribute('id') || `BLDG_${i}`;
    const id = normalizeId(rawId);
    const d = pathNode.getAttribute('d');
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

  // --- labels ---
  const labelGroup = doc.getElementById('Building Marks');
  const labelPaths = labelGroup.getElementsByTagName('path');
  let labels = [];

  for (let i = 0; i < labelPaths.length; i++) {
    const pathNode = labelPaths.item(i);
    const id = pathNode.getAttribute('id');
    const d = pathNode.getAttribute('d');
    const centroid = getCentroid(d);
    labels.push({ name: id, centroid });
  }

  for (const label of labels) {
    let nearest = null,
      minDist = Infinity;
    for (const b of buildings) {
      const dx = label.centroid[0] - b.centroid[0];
      const dy = label.centroid[1] - b.centroid[1];
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        nearest = b;
      }
    }
    if (nearest) nearest.name = label.name;
  }

  // --- entrances ---
  const entranceGroup = doc.getElementById('Entrances');
  const entrancePaths = entranceGroup.getElementsByTagName('path');
  let entrances = [];
  for (let i = 0; i < entrancePaths.length; i++) {
    const pathNode = entrancePaths.item(i);
    const id = pathNode.getAttribute('id');
    const d = pathNode.getAttribute('d');
    if (!d) continue;
    const centroid = getCentroid(d);
    entrances.push({ id, centroid, path: d });
  }

  for (const entrance of entrances) {
    for (const b of buildings) {
      const poly = parsePathToPolygon(b.path);
      const point = { x: entrance.centroid[0], y: entrance.centroid[1] };
      if (isPointInPolygon(point, poly, 15)) {
        b.entranceNodes.push(entrance.id);
        break;
      }
    }
  }

  // --- merge with old ---
  const oldPathMap = new Map(oldData.places.map((p) => [p.path, p]));
  const oldIdMap = new Map(oldData.places.map((p) => [p.id, p]));
  const merged = [];

  for (const nb of buildings) {
    let old = oldPathMap.get(nb.path) || oldIdMap.get(nb.id);
    if (!old) {
      merged.push({
        id: nb.id,
        name: nb.name || 'Unknown',
        path: nb.path,
        type: 'Building',
        entranceNodes: nb.entranceNodes,
        description: 'Place description goes in here...',
        nearNodes: [],
        baseFill: '#FFFFFF',
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

  const unmatchedOld = oldData.places.filter((op) => !merged.some((mp) => mp.id === op.id));

  console.log(
    '⚠️ Unmatched old items:',
    unmatchedOld.map((x) => x.id)
  );
  return { places: merged };
}

// --- run ---
const svgPath = '../../../assets/AyalaMallsMap/GroundFloor.svg';
const oldJson = './oldPlaces.json';

const result = parseSvgToJson(svgPath, oldJson);
fs.writeFileSync('places.merged.json', JSON.stringify(result, null, 2));
console.log('✅ places.merged.json generated (merged by path/id, cleaned, deduped).');
