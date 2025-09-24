// mergeTypes.js
import fs from 'fs';

// ✅ Set your file paths
const baseFile = '../Data/GroupFloor.json';            // Your base JSON
const typesFile = '../Data/mall_directory_with_types.json';   // JSON with { id, name, type }
const outputFile = '../Data/GroupFloor.json';    // Output file

// 1️⃣ Read and parse the files
const baseData = JSON.parse(fs.readFileSync(baseFile, 'utf-8'));
const typeData = JSON.parse(fs.readFileSync(typesFile, 'utf-8'));

// 2️⃣ Create a lookup map for quick type matching by name (case-insensitive)
const typeMap = new Map(
  typeData.map(entry => [entry.name.trim().toLowerCase(), entry.type])
);

// 3️⃣ Merge: Add the `type` field to each GroundFloor item
baseData.GroundFloor = baseData.GroundFloor.map(item => {
  const key = item.name.trim().toLowerCase();
  return {
    ...item,
    type: typeMap.get(key) || item.name
  };
});

// 4️⃣ Save the merged result
fs.writeFileSync(outputFile, JSON.stringify(baseData, null, 2), 'utf-8');

console.log(`✅ Merge complete! Output saved to ${outputFile}`);
