import fs from "fs";

// --- Parse circles + ellipses into nodes + build neighbor graph ---
function parseSvgToRoutingGraph(svgString, placesFile, outputPath, threshold = 50) {
  const nodes = [];

  // --- Parse <circle> ---
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
      type: 'path',
      neighbors: [],
    });
  }

  // --- Parse <ellipse> ---
  const ellipseRegex =
    /<ellipse[^>]*id="([^"]+)"[^>]*cx="([^"]+)"[^>]*cy="([^"]+)"[^>]*rx="([^"]+)"[^>]*ry="([^"]+)"/g;
  while ((match = ellipseRegex.exec(svgString)) !== null) {
    const [, id, cx, cy, rx, ry] = match;
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

  // --- Spatial grid index ---
  const grid = new Map();
  const cellSize = threshold;

  function getCellKey(x, y) {
    return `${Math.floor(x / cellSize)},${Math.floor(y / cellSize)}`;
  }

  // Put nodes into grid
  for (const node of nodes) {
    const key = getCellKey(node.x, node.y);
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(node);
  }

  // Find neighbors (within threshold)
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

  // --- Load places file (keep places untouched) ---
  const placesData = JSON.parse(fs.readFileSync(placesFile, 'utf-8'));

  // Merge nodes + places
  const merged = {
    nodes,
    places: placesData.places || placesData,
  };

  fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2), 'utf-8');
  console.log(`✅ Graph (circles + ellipses + places) written to ${outputPath}`);
}

// --- Example usage ---
function main() {
  const svgString = fs.readFileSync('../../../assets/AyalaMallsMap/3RDFLoor.svg', 'utf-8');
  const placesFile = '../../Data/3rdFloor.json'; // your places file
  const outputPath = '../../Data/3rdFloor.json'; // overwrite with new merged graph

  parseSvgToRoutingGraph(svgString, placesFile, outputPath, 100);
}

main();
