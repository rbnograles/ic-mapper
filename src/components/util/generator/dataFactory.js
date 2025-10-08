import fs from 'fs';
import path from 'path';

// ✅ Data factory for cleaning and enhancing place JSON
const dataFactory = () => {
  const oldJsonPath = path.resolve('../../Data/AyalaMalls/ThirdFloor/ThirdFloor.json');

  // --- Load file ---
  if (!fs.existsSync(oldJsonPath)) {
    console.error('❌ File not found:', oldJsonPath);
    return;
  }

  const oldData = JSON.parse(fs.readFileSync(oldJsonPath, 'utf-8'));

  if (!oldData.places || !Array.isArray(oldData.places)) {
    console.error('❌ Invalid JSON format — missing "places" array');
    return;
  }

  const seenPaths = new Map(); // path string → first item index
  const duplicatePaths = [];

  // --- Modify + clean items ---
  const updatedPlaces = oldData.places.map((place, i) => {
    let updated = { ...place, floor: 'Third Floor' };

    // 🔥 Special handling for Fire Exits
    if (place.id?.includes('Fire Exit')) {
      updated = {
        ...updated,
        id: `Fire Exit_${i}`,
        name: 'Fire Exit',
        type: 'Fire Exit',
        baseFill: '#F66E19',
        icon: 'fire',
        centerY: 40,
      };
    }

    // 🧹 Clean up names with underscores
    if (typeof updated.name === 'string' && updated.name.includes('_')) {
      updated.name = updated.name.replace(/_/g, ' ').trim();
    }

    // 🧩 Detect duplicate path entries
    if (typeof updated.path === 'string') {
      const normalizedPath = updated.path.trim();
      if (seenPaths.has(normalizedPath)) {
        duplicatePaths.push({
          duplicateIndex: i,
          originalIndex: seenPaths.get(normalizedPath),
          path: normalizedPath,
        });
      } else {
        seenPaths.set(normalizedPath, i);
      }
    }

    return updated;
  });

  // --- Write file ---
  const result = { places: updatedPlaces };
  fs.writeFileSync(oldJsonPath, JSON.stringify(result, null, 2));

  // --- Report summary ---
  console.log(`✅ Completed data cleanup & saved to ${oldJsonPath}`);
  if (duplicatePaths.length > 0) {
    console.warn('⚠️ Duplicate paths found:');
    console.table(duplicatePaths);
  } else {
    console.log('✅ No duplicate paths found.');
  }
};

dataFactory();
