import fs from "fs";

// --- Helpers ---
function computeBoundingBox(pathStr) {
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

// --- Parse circles + entrances ---
function parseSvgToRoutingGraph(svgString, outputPath, threshold = 50) {
  const nodes = [];
  const entrances = [];

  // --- Parse <circle> → path nodes ---
  const circleRegex = /<circle[^>]*id="([^"]+)"[^>]*cx="([^"]+)"[^>]*cy="([^"]+)"[^>]*r="([^"]+)"/g;
  let match;
  while ((match = circleRegex.exec(svgString)) !== null) {
    const [, id, cx, cy, r] = match;
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

  // --- Parse entrances from <g id="Entrances"> <path ...> ---
  const entrancesGroupRegex = /<g[^>]*id="Entrances"[^>]*>([\s\S]*?)<\/g>/;
  const groupMatch = svgString.match(entrancesGroupRegex);

  if (groupMatch) {
    const groupContent = groupMatch[1];
    const pathRegex = /<path[^>]*id="([^"]+)"[^>]*d="([^"]+)"[^>]*>/g;

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
  }

  // --- Spatial grid index ---
  const grid = new Map();
  const cellSize = threshold;

  function getCellKey(x, y) {
    return `${Math.floor(x / cellSize)},${Math.floor(y / cellSize)}`;
  }

  // Put nodes into grid (circles only)
  for (const node of nodes) {
    const key = getCellKey(node.x, node.y);
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(node);
  }

  // --- Step 1: Circle <-> Circle neighbors ---
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
            if (!node.neighbors.includes(other.id)) {
              node.neighbors.push(other.id);
            }
          }
        }
      }
    }
  }

  // --- Step 2: Entrance <-> Path connections only ---
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
            // ✅ only connect entrance → circle (no entrance → entrance)
            if (!entrance.neighbors.includes(node.id)) {
              entrance.neighbors.push(node.id);
            }

            // ✅ bidirectional connection: circle also knows its entrance
            if (!node.neighbors.includes(entrance.id)) {
              node.neighbors.push(entrance.id);
            }
          }
        }
      }
    }
  }

  // --- Output { nodes, entrances } ---
  const result = { nodes, entrances };
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`✅ Routing graph written to ${outputPath}`);
}

// --- Example usage ---
function main() {
  const svgString = fs.readFileSync('../../../assets/AyalaMallsMap/GroundFloor.svg', 'utf-8');
  const outputPath = '../../Data/AyalaMalls/GroundFloor/GroundFloorNodes.json';

  parseSvgToRoutingGraph(svgString, outputPath, 350);
}

main();
