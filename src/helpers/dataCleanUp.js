// update-places-unique-ids.js
import fs from 'fs';
import path from 'path';

// ✅ Load category reference
const categoriesPath = path.resolve('../Data/category.json');

if (!fs.existsSync(categoriesPath)) {
  console.error('❌ Category file not found:', categoriesPath);
  process.exit(1);
}

const categoryFile = JSON.parse(fs.readFileSync(categoriesPath, 'utf-8'));
const categories = categoryFile.categories || categoryFile;

// --- Helper: classify type based on name similarity ---
function classifyType(name) {
  if (!name) return null;
  const cleanName = name.toLowerCase();

  for (const [type, list] of Object.entries(categories)) {
    if (
      list.some((n) => {
        const cleanN = n.toLowerCase().replace(/[^\w\s]/g, '').trim();
        return cleanName.includes(cleanN);
      })
    ) {
      return type;
    }
  }
  return null;
}

// --- Helper: create a normalized slug/id from a string ---
function slugifyId(input) {
  if (!input) return '';
  // toLower, remove non-word characters except spaces, replace spaces with underscore, trim underscores
  return String(input)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s-]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// ✅ Data factory for cleaning and enhancing place JSON
const dataFactory = () => {
  const args = process.argv.slice(2);
  const oldJsonPath = path.resolve(`../Data/AyalaMalls/${args[0]}Floor/${args[0]}Floor.json`);

  // --- Load JSON ---
  if (!fs.existsSync(oldJsonPath)) {
    console.error('❌ File not found:', oldJsonPath);
    return;
  }

  const oldData = JSON.parse(fs.readFileSync(oldJsonPath, 'utf-8'));

  if (!oldData.places || !Array.isArray(oldData.places)) {
    console.error('❌ Invalid JSON format — missing "places" array');
    return;
  }

  const seenPaths = new Map();
  const duplicatePaths = [];
  const unmatched = [];

  // Keep track of used ids to enforce uniqueness
  const usedIds = new Set();

  // function to produce a unique id (adds suffixes when collision)
  function makeUniqueId(base, indexFallback) {
    const cleanBase = slugifyId(base) || `place_${indexFallback}`;
    let candidate = cleanBase;
    let suffix = 1;
    while (usedIds.has(candidate)) {
      candidate = `${cleanBase}_${suffix}`;
      suffix += 1;
    }
    usedIds.add(candidate);
    return candidate;
  }

  // --- Modify + clean items ---
  const updatedPlaces = oldData.places.map((place, i) => {
    // start with copy and default floor
    let updated = { ...place, floor: place.floor || 'Third Floor' };

    // 🔥 Fire Exit handling (assign temporary id; we'll still normalize/unique it below)
    if (/fire\s*exit/i.test(place.id || '') || /fire\s*exit/i.test(place.name || '')) {
      updated = {
        ...updated,
        id: `Fire Exit_${i}`, // will be normalized by slugify + uniquified below
        name: 'Fire Exit',
        type: 'Fire Exit',
        baseFill: '#F66E19',
        icon: 'fire',
        centerY: place.centerY || 40,
      };
    }

    // 🧹 Remove underscores in name
    if (typeof updated.name === 'string') {
      updated.name = updated.name.replace(/_/g, ' ').trim();
    }

    // 🏷️ Auto-classify by imported categories
    const detectedType = classifyType(updated.name || '');
    if (detectedType) {
      updated.type = detectedType;
    } else if (updated.type !== 'Fire Exit') {
      unmatched.push(updated.name);
    }

    // 🧩 Detect duplicate paths
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

    // --- Ensure unique id for every place ---
    // Prefer existing id, then name, then fallback to index
    const preferred = updated.id || updated.name || `place_${i}`;
    const uniqueId = makeUniqueId(preferred, i);
    updated.id = uniqueId;

    return updated;
  });

  // --- Write updated JSON ---
  const result = { ...oldData, places: updatedPlaces };
  fs.writeFileSync(oldJsonPath, JSON.stringify(result, null, 2), 'utf-8');

  // --- Write unmatched names for review ---
  if (unmatched.length > 0) {
    const unmatchedPath = path.resolve('../Data/unmatched.json');
    fs.writeFileSync(unmatchedPath, JSON.stringify(unmatched, null, 2), 'utf-8');
    console.warn(`⚠️ Some names did not match any category. Saved to ${unmatchedPath}`);
  }

  // --- Report summary ---
  console.log(`✅ Completed data cleanup & saved to ${oldJsonPath}`);
  if (duplicatePaths.length > 0) {
    console.warn('⚠️ Duplicate paths found:');
    console.table(duplicatePaths);
  } else {
    console.log('✅ No duplicate paths found.');
  }
};

// Executes File
dataFactory();
``