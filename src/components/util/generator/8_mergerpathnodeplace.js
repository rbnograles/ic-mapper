// mergePlacesWithGraph.js
import fs from "fs";
// ✅ compute centroid of a polygon path
function computeCentroid(pathStr) {
  const numbers = pathStr.match(/-?\d+(\.\d+)?/g)?.map(Number) || [];
  const xs = numbers.filter((_, i) => i % 2 === 0);
  const ys = numbers.filter((_, i) => i % 2 === 1);
  const cx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const cy = ys.reduce((a, b) => a + b, 0) / ys.length;
  return { x: cx, y: cy };
}

// ✅ find k nearest nodes to centroid
function findNearestNodes(centroid, nodes, k = 2) {
  return nodes
    .map((n) => ({
      id: n.id,
      dist: Math.hypot(n.x - centroid.x, n.y - centroid.y),
    }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, k)
    .map((n) => n.id);
}


function main() {
  const routingFile = "../../Data/routingNodes.json"
  const placesFile = "../../Data/GroupFloor.json" // last places file
  const outFile = "../../Data/GroupFloor.json" // overwrite the new place file

  const routing = JSON.parse(fs.readFileSync(routingFile, "utf-8"));
  const places = JSON.parse(fs.readFileSync(placesFile, "utf-8"));
  const nodes = routing.nodes;

  // add nearNodes + keep entranceNode, but don’t add edges
  const updatedPlaces = places.places.map((place) => {
    const centroid = computeCentroid(place.path);
    const nearNodes = findNearestNodes(centroid, nodes, 2);
    return {
      ...place,
      nearNodes,
      entranceNode: place.entranceNode ?? nearNodes[0], // fallback if missing
    };
  });

  const merged = {
    nodes,
    places: updatedPlaces,
  };

  fs.writeFileSync(outFile, JSON.stringify(merged, null, 2));
  console.log(`✅ Merged graph written to ${outFile}`);
}

main();
