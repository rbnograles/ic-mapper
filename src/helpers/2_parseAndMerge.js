import fs from 'fs';

import { computeBoundingBox } from './geometry';


function parseSvgToRoutingGraph(svgString, outputPath, threshold = 50) {
  const nodes = [];
  const entrances = [];

  // --- Build a map: elementId -> parentGroupId ---
  const idToGroup = new Map();
  const groupRegex = /<g\b[^>]*\bid\s*=\s*"([^"]+)"[^>]*>([\s\S]*?)<\/g>/gi;
  let gMatch;

  while ((gMatch = groupRegex.exec(svgString)) !== null) {
    const [, groupId, groupContent] = gMatch;

    // find circles, ellipses, paths
    const allElementRegex = /<(circle|ellipse|path)\b[^>]*\bid\s*=\s*"([^"]+)"[^>]*>/gi;
    let match;
    while ((match = allElementRegex.exec(groupContent)) !== null) {
      const [, , elementId] = match;
      if (elementId) idToGroup.set(elementId, groupId);
    }
  }

  /** ---------------- ENTRANCES ---------------- **/
  const entrancesGroupRegex = /<g\b[^>]*\bid\s*=\s*"(?:Entrances|entrances)"[^>]*>([\s\S]*?)<\/g>/i;
  const groupMatchEntrances = svgString.match(entrancesGroupRegex);

  if (groupMatchEntrances) {
    const groupContent = groupMatchEntrances[1];

    // paths as entrances
    const pathRegex = /<path\b[^>]*\bid="([^"]+)"[^>]*\bd="([^"]+)"[^>]*\/?>/gi;
    let pMatch;
    while ((pMatch = pathRegex.exec(groupContent)) !== null) {
      const [, id, d] = pMatch;
      const { cx, cy, rx, ry } = computeBoundingBox(d);
      entrances.push({
        id,
        x: Math.round(cx * 100) / 100,
        y: Math.round(cy * 100) / 100,
        rx: Math.round(rx * 100) / 100,
        ry: Math.round(ry * 100) / 100,
        type: 'entrance',
        neighbors: [],
      });
    }

    // circles inside Entrances
    const circleInGroupRegex = /<circle\b[^>]*>/gi;
    let cMatch;
    while ((cMatch = circleInGroupRegex.exec(groupContent)) !== null) {
      const tag = cMatch[0];
      const id = (tag.match(/id\s*=\s*"([^"]+)"/i) || [, undefined])[1];
      const cx = (tag.match(/cx\s*=\s*"([^"]+)"/i) || [, undefined])[1];
      const cy = (tag.match(/cy\s*=\s*"([^"]+)"/i) || [, undefined])[1];
      const r = (tag.match(/r\s*=\s*"([^"]+)"/i) || [, 0])[1];

      if (id && cx && cy) {
        entrances.push({
          id,
          x: Math.round(parseFloat(cx) * 100) / 100,
          y: Math.round(parseFloat(cy) * 100) / 100,
          rx: r ? Math.round(parseFloat(r) * 100) / 100 : 0,
          ry: r ? Math.round(parseFloat(r) * 100) / 100 : 0,
          type: 'entrance',
          neighbors: [],
        });
      }
    }

    // ellipses inside Entrances
    const ellipseInGroupRegex = /<ellipse\b[^>]*>/gi;
    let eMatch;
    while ((eMatch = ellipseInGroupRegex.exec(groupContent)) !== null) {
      const tag = eMatch[0];
      const id = (tag.match(/id\s*=\s*"([^"]+)"/i) || [, undefined])[1];
      const cx = (tag.match(/cx\s*=\s*"([^"]+)"/i) || [, undefined])[1];
      const cy = (tag.match(/cy\s*=\s*"([^"]+)"/i) || [, undefined])[1];
      const rx = (tag.match(/rx\s*=\s*"([^"]+)"/i) || [, 0])[1];
      const ry = (tag.match(/ry\s*=\s*"([^"]+)"/i) || [, 0])[1];

      if (id && cx && cy) {
        entrances.push({
          id,
          x: Math.round(parseFloat(cx) * 100) / 100,
          y: Math.round(parseFloat(cy) * 100) / 100,
          rx: rx ? Math.round(parseFloat(rx) * 100) / 100 : 0,
          ry: ry ? Math.round(parseFloat(ry) * 100) / 100 : 0,
          type: 'entrance',
          neighbors: [],
        });
      }
    }
  }

  /** ---------------- PATHS (as nodes) ---------------- **/
  const pathsGroupRegex = /<g\b[^>]*\bid\s*=\s*"(?:Paths|paths)"[^>]*>([\s\S]*?)<\/g>/i;
  const groupMatchPaths = svgString.match(pathsGroupRegex);

  if (groupMatchPaths) {
    const groupContent = groupMatchPaths[1];

    // parse all <path> inside Paths group as nodes
    const pathRegex = /<path\b[^>]*\bid="([^"]+)"[^>]*\bd="([^"]+)"[^>]*\/?>/gi;
    let pMatch;
    while ((pMatch = pathRegex.exec(groupContent)) !== null) {
      const [, id, d] = pMatch;
      const { cx, cy, rx, ry } = computeBoundingBox(d);
      nodes.push({
        id,
        x: Math.round(cx * 100) / 100,
        y: Math.round(cy * 100) / 100,
        rx: Math.round(rx * 100) / 100,
        ry: Math.round(ry * 100) / 100,
        type: 'path',
        neighbors: [],
      });
    }
  }

  // --- Parse all circles globally ---
  const circleRegexGlobal = /<circle\b[^>]*>/gi;
  let cm;
  while ((cm = circleRegexGlobal.exec(svgString)) !== null) {
    const tag = cm[0];
    const id = (tag.match(/id\s*=\s*"([^"]+)"/i) || [, undefined])[1];
    const cx = (tag.match(/cx\s*=\s*"([^"]+)"/i) || [, undefined])[1];
    const cy = (tag.match(/cy\s*=\s*"([^"]+)"/i) || [, undefined])[1];
    const r = (tag.match(/r\s*=\s*"([^"]+)"/i) || [, 0])[1];
    if (!id || !cx || !cy) continue;

    const parentGroup = idToGroup.get(id);
    if (parentGroup && /^entrances$/i.test(parentGroup)) {
      if (!entrances.find((e) => e.id === id)) {
        entrances.push({
          id,
          x: Math.round(parseFloat(cx) * 100) / 100,
          y: Math.round(parseFloat(cy) * 100) / 100,
          rx: r ? Math.round(parseFloat(r) * 100) / 100 : 0,
          ry: r ? Math.round(parseFloat(r) * 100) / 100 : 0,
          type: 'entrance',
          neighbors: [],
        });
      }
    } else {
      nodes.push({
        id,
        x: Math.round(parseFloat(cx) * 100) / 100,
        y: Math.round(parseFloat(cy) * 100) / 100,
        rx: parseFloat(r),
        ry: parseFloat(r),
        type: 'circle',
        neighbors: [],
      });
    }
  }

  // --- Ellipses global ---
  const ellipseRegexGlobal = /<ellipse\b[^>]*>/gi;
  let em;
  while ((em = ellipseRegexGlobal.exec(svgString)) !== null) {
    const tag = em[0];
    const id = (tag.match(/id\s*=\s*"([^"]+)"/i) || [, undefined])[1];
    const cx = (tag.match(/cx\s*=\s*"([^"]+)"/i) || [, undefined])[1];
    const cy = (tag.match(/cy\s*=\s*"([^"]+)"/i) || [, undefined])[1];
    const rx = (tag.match(/rx\s*=\s*"([^"]+)"/i) || [, 0])[1];
    const ry = (tag.match(/ry\s*=\s*"([^"]+)"/i) || [, 0])[1];
    if (!id || !cx || !cy) continue;

    const parentGroup = idToGroup.get(id);
    if (parentGroup && /^entrances$/i.test(parentGroup)) {
      if (!entrances.find((e) => e.id === id)) {
        entrances.push({
          id,
          x: Math.round(parseFloat(cx) * 100) / 100,
          y: Math.round(parseFloat(cy) * 100) / 100,
          rx: rx ? Math.round(parseFloat(rx) * 100) / 100 : 0,
          ry: ry ? Math.round(parseFloat(ry) * 100) / 100 : 0,
          type: 'entrance',
          neighbors: [],
        });
      }
    } else {
      nodes.push({
        id,
        x: Math.round(parseFloat(cx) * 100) / 100,
        y: Math.round(parseFloat(cy) * 100) / 100,
        rx: parseFloat(rx),
        ry: parseFloat(ry),
        type: 'ellipse',
        neighbors: [],
      });
    }
  }

  // --- Spatial grid index ---
  const grid = new Map();
  const cellSize = threshold;

  function getCellKey(x, y) {
    return `${Math.floor(x / cellSize)},${Math.floor(y / cellSize)}`;
  }

  for (const node of nodes) {
    const key = getCellKey(node.x, node.y);
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(node);
  }

  // --- Step 1: Node <-> Node neighbors ---
  for (const node of nodes) {
    const cx = Math.floor(node.x / cellSize);
    const cy = Math.floor(node.y / cellSize);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${cx + dx},${cy + dy}`;
        const bucket = grid.get(key) || [];
        for (const other of bucket) {
          if (other.id === node.id) continue;
          const dist = Math.hypot(node.x - other.x, node.y - other.y);
          if (dist <= threshold) {
            if (!node.neighbors.includes(other.id)) node.neighbors.push(other.id);
          }
        }
      }
    }
  }

  // --- Step 2: Entrance <-> Node connections ---
  for (const entrance of entrances) {
    const cx = Math.floor(entrance.x / cellSize);
    const cy = Math.floor(entrance.y / cellSize);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${cx + dx},${cy + dy}`;
        const bucket = grid.get(key) || [];

        for (const node of bucket) {
          const dist = Math.hypot(entrance.x - node.x, entrance.y - node.y);
          if (dist <= threshold) {
            if (!entrance.neighbors.includes(node.id)) entrance.neighbors.push(node.id);
            if (!node.neighbors.includes(entrance.id)) node.neighbors.push(entrance.id);
          }
        }
      }
    }
  }

  const result = { nodes, entrances };
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`✅ Routing graph written to ${outputPath}`);
}

// --- Example usage ---
function main() {
  const args = process.argv.slice(2);
  const svgString = fs.readFileSync(`../assets/AyalaMallsMap/${args[0]}Floor.svg`, 'utf-8');
  const outputPath = `../Data/AyalaMalls/${args[0]}Floor/${args[0]}FloorNodes.json`;
  parseSvgToRoutingGraph(svgString, outputPath, 150);
}

main();
