import fs from 'fs';
import { DOMParser } from 'xmldom';
// geometry utility
import { parsePathToPolygon, getCentroid, isPointInPolygon } from './geometry';

/**
 * 
 * @param {*} id 
 * @returns id in format of BLDG_vector***
 */
const normalizeId = (id) => {
  if (!id) return null;
  const match = id.match(/vector\s*(\d+)/i);
  if (match) return `BLDG_${match[1]}`;
  return id;
}

/**
 * 
 * @param {*} node 
 * @param {*} name 
 * @returns 
 */
const getAttr = (node, name) => {
  if (!node) return null;
  return node.getAttribute ? node.getAttribute(name) : null;
}

function parseSvgToJson(svgFile, oldJsonPath) {
  const svgContent = fs.readFileSync(svgFile, 'utf-8');
  const doc = new DOMParser().parseFromString(svgContent, 'image/svg+xml');
  const oldData = fs.existsSync(oldJsonPath)
    ? JSON.parse(fs.readFileSync(oldJsonPath, 'utf-8'))
    : { maps: [] };

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
      name: id,
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
  const oldPathMap = new Map((oldData.maps || []).map((p) => [p.path, p]));
  const merged = [];

  for (const nb of buildings) {
    const old = oldPathMap.get(nb.path);
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

  const unmatchedOld = (oldData.maps || []).filter((op) => !merged.some((mp) => mp.id === op.id));

  console.log(
    '⚠️ Unmatched old items:',
    unmatchedOld.map((x) => x.id)
  );
  return {
    maps: merged,
  };
}

// --- run ---
const args = process.argv.slice(2);
const svgPath = `../assets/AyalaMallsMap/${args[0]}Floor.svg`;
const oldJson = `../Data/AyalaMalls/${args[0]}Floor/${args[0]}Floor.json`;

const result = parseSvgToJson(svgPath, oldJson);

fs.writeFileSync(
  `../Data/AyalaMalls/${args[0]}Floor/${args[0]}Floor.json`,
  JSON.stringify({ maps: result.maps }, null, 2)
);

console.log(`Wrote merged ${args[0]}Floor.json buildings with entranceNodes`);
