// getUniqueTypes.js
import fs from 'fs';

// ✅ Path to your JSON file
const inputFile = '../../Data/GroupFloor.json';

// 1️⃣ Load and parse the file
const data = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

// 2️⃣ Extract types and keep only unique ones
const uniqueTypes = [
  ...new Set(
    data.places
      .map((item) => item.type) // take the 'type' of each item
      .filter(Boolean) // remove null/undefined/empty
  ),
];

// 3️⃣ Output result
console.log('Unique types:', uniqueTypes);

// Optional: write to a file
fs.writeFileSync('../../Data/unique_types.json', JSON.stringify(uniqueTypes, null, 2), 'utf-8');
console.log('✅ Saved to unique_types.json');
