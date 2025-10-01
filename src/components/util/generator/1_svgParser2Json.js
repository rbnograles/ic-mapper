// parseSvgToJson.js
import fs from 'fs';
import { DOMParser } from 'xmldom';
import bounds from 'svg-path-bounds';

// ✅ helper to compute centroid of a path
function getCentroid(path) {
  try {
    const [x1, y1, x2, y2] = bounds(path);
    return [(x1 + x2) / 2, (y1 + y2) / 2];
  } catch {
    return [0, 0];
  }
}

// ✅ recursive collector to get ALL <path> under a <g>
function collectPaths(group) {
  let results = [];
  if (!group) return results;

  // group identifier (for prefixing IDs)
  const groupId = group.getAttribute('id') || 'Group';

  // collect all <path> directly under this group
  const paths = group.getElementsByTagName('path');
  let counter = 1;
  for (let i = 0; i < paths.length; i++) {
    const pathNode = paths.item(i);
    const d = pathNode.getAttribute('d');
    const fill = pathNode.getAttribute('fill') || '#FFFFFF';
    const centroid = getCentroid(d);

    // ✅ assign unique id as groupId_index
    const id = `${groupId}_${counter++}`;

    results.push({
      id,
      path: d,
      centroid,
      name: null,
      baseFill: fill,
    });
  }

  // recurse into nested groups
  const childGroups = group.getElementsByTagName('g');
  for (let i = 0; i < childGroups.length; i++) {
    results = results.concat(collectPaths(childGroups.item(i)));
  }

  return results;
}

// ✅ main
function parseSvgToJson(svgFile) {
  const svgContent = fs.readFileSync(svgFile, 'utf-8');
  const doc = new DOMParser().parseFromString(svgContent, 'image/svg+xml');

  // --- get building vectors (including nested groups) ---
  const buildingGroup = doc.getElementById('BLDG');
  let buildings = collectPaths(buildingGroup);

  // --- get labels ---
  const labelGroup = doc.getElementById('Building Marks');
  const labelPaths = labelGroup?.getElementsByTagName('path') || [];

  let labels = [];
  for (let i = 0; i < labelPaths.length; i++) {
    const pathNode = labelPaths.item(i);
    const id = pathNode.getAttribute('id');
    const d = pathNode.getAttribute('d');
    const centroid = getCentroid(d);
    labels.push({ name: id, centroid });
  }

  // --- match labels to nearest building ---
  for (let label of labels) {
    let nearest = null;
    let minDist = Infinity;
    for (let b of buildings) {
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

  // --- format JSON output ---
  const places = buildings.map((b) => ({
    id: b.id,
    name: b.name || 'Unknown',
    path: b.path,
    type: 'Building',
    entranceNode: '',
    description: 'Place description goes in here...',
    nearNodes: [],
    baseFill: b.baseFill || '#FFFFFF',
  }));

  return { places };
}

// Run script
const json = parseSvgToJson('../../../assets/AyalaMallsMap/GroundFloor.svg');
fs.writeFileSync('places.json', JSON.stringify(json, null, 2));
console.log('✅ places.json generated!');
