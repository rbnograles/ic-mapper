// updatePathsInJson.js
import fs from 'fs';
import { DOMParser } from 'xmldom';
import bounds from 'svg-path-bounds';

// Helper to compute centroid (optional, kept for reference)
function getCentroid(path) {
  try {
    const [x1, y1, x2, y2] = bounds(path);
    return [(x1 + x2) / 2, (y1 + y2) / 2];
  } catch {
    return [0, 0];
  }
}

// Recursive collector to get ALL <path> under a <g>
function collectPaths(group) {
  let results = [];
  if (!group) return results;

  const paths = group.getElementsByTagName('path');
  for (let i = 0; i < paths.length; i++) {
    const pathNode = paths.item(i);
    const id = pathNode.getAttribute('id');
    const d = pathNode.getAttribute('d');
    if (id && d) {
      results.push({ id, path: d });
    }
  }

  const childGroups = group.getElementsByTagName('g');
  for (let i = 0; i < childGroups.length; i++) {
    results = results.concat(collectPaths(childGroups.item(i)));
  }

  return results;
}

// Main
function updatePathsInJson(svgFile, jsonFile, outputFile) {
  const svgContent = fs.readFileSync(svgFile, 'utf-8');
  const doc = new DOMParser().parseFromString(svgContent, 'image/svg+xml');
  const currentData = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));

  // --- collect paths from SVG ---
  const buildingGroup = doc.getElementById('BLDG');
  const svgPaths = collectPaths(buildingGroup);

  // --- map for quick lookup ---
  const pathMap = new Map(svgPaths.map((b) => [b.id, b.path]));

  // --- update existing places ---
  const updatedPlaces = currentData.places.map((place) => {
    if (pathMap.has(place.id)) {
      return { ...place, path: pathMap.get(place.id) };
    }
    return place;
  });

  // --- write back JSON, keeping nodes intact ---
  const updatedJson = {
    ...currentData,
    places: updatedPlaces,
  };

  fs.writeFileSync(outputFile, JSON.stringify(updatedJson, null, 2));
  console.log(`✅ Updated paths written to ${outputFile}`);
}

// Run
updatePathsInJson(
  '../../../assets/AyalaMallsMap/3RDFLoor.svg',
  '../../Data/3rdFloor.json',
  '../../Data/3rdFloor.json' // overwrite original
);
