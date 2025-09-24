// extractPaths.js
import fs from 'fs';
import { parse } from 'node-html-parser';

// read the svg file
const svg = fs.readFileSync('./src/assets/AyalaMallsMap/GroundFloor.svg', 'utf8');

// parse SVG
const root = parse(svg);

// find all <path> elements
const paths = root.querySelectorAll('path');

// build JSON
const data = paths.map((p, i) => {
  const rawId = p.getAttribute('id');
  return {
    id: rawId && rawId.trim() ? rawId : `path-${i}`, // ✅ fallback unique id
    name: rawId && rawId.trim() ? rawId : `Path ${i + 1}`,
    path: p.getAttribute('d'),
  };
});


// write JSON
fs.writeFileSync(
  './src/components/Data/GroupFloor.json',
  JSON.stringify({ GroundFloor: data }, null, 2)
);

console.log(`✅ Extracted ${data.length} paths`);
