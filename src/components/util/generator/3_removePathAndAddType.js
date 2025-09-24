// extractPaths.js
import fs from 'fs';

// 1️⃣ Read the original JSON file
const raw = fs.readFileSync('../Data/GroupFloor.json', 'utf8');
const groupFloor = JSON.parse(raw); // Make sure GroupFloor.json is a valid JSON

// 2️⃣ Extract only the fields you need
const data = groupFloor.GroundFloor.map(item => ({
  id: item.id,
  name: item.name,
  type: '' // New field
}));

// 3️⃣ Write the new JSON file
fs.writeFileSync(
  '../Data/GroupFloorModified.json',
  JSON.stringify({ GroundFloor: data }, null, 2)
);

console.log(`✅ Extracted ${data.length} items`);
