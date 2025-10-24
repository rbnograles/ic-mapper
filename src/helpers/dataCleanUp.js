// update-maps-unique-ids.js
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

// --- Helper: aggressively strip mojibake / encoding junk and normalize ---
function fixMojibake(str) {
  if (!str || typeof str !== 'string') return str;

  // 1) Try a gentle re-decode from latin1/binary -> utf8 (helps some double-encoded cases).
  try {
    const redecoded = Buffer.from(str, 'binary').toString('utf8');
    // use the redecoded value if it seems cleaner (fewer suspect characters)
    const suspects = /[ÃÂâ�]/g;
    const origCount = (String(str).match(suspects) || []).length;
    const newCount = (String(redecoded).match(suspects) || []).length;
    if (newCount < origCount) str = redecoded;
  } catch (e) {
    // ignore decode errors and continue to stripping
  }

  // 2) Explicit common mojibake sequences -> replacements (we convert some to space, others removed)
  const replacements = [
    // obvious line-separator / newline mojibake -> replace with space
    [/Ã¢ÂÂ¨/g, ' '],
    [/â¨/g, ' '],
    // common multi-char mojibake fragments -> remove
    [/Ã¢ÂÂ/g, ''],
    [/Ã¢ÂÂ/g, ''],
    [/Ã¯Â¿Â½/g, ''],
    [/Â/g, ''],          // stray Â often appears in mojibake; remove
    [/Ã©/g, 'é'],
    [/Ã¨/g, 'è'],
    [/Ã¢/g, 'â'],
    [/Ãª/g, 'ê'],
    [/Ã±/g, 'ñ'],
    [/â/g, '-'],
    [/â/g, '—'],
    [/â¦/g, '…'],
    // remove common Windows-1252 misreads of punctuation
    [/â€œ/g, '"'],
    [/â€\x9d/g, '"'],
    [/â€˜/g, "'"],
    [/â€™/g, "'"],
  ];

  let out = str;
  for (const [pattern, repl] of replacements) out = out.replace(pattern, repl);

  // 3) Remove any leftover suspicious sequences starting with Ã, Â, or â followed by 1-6 non-space chars.
  //    This is aggressive: it removes e.g. "Ã¢ÂÂ¨" or "Â\xA0" fragments that weren't matched above.
  //    If you want a less aggressive approach, reduce the max length or remove these lines.
  out = out.replace(/(?:Ã|Â|â)[^\s]{1,8}/g, '');

  // 4) Remove invisible / control / formatting Unicode characters (zero-width spaces, BOM, etc.)
  //    \u0000-\u001F  control chars, \u007F-\u009F  control chars, and some zero-widths
  out = out.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\uFEFF]/g, '');

  // 5) Collapse multiple whitespace and trim
  out = out.replace(/\s+/g, ' ').trim();

  // Final safety: if string is now empty, return original trimmed fallback (or empty)
  return out.length ? out : String(str).replace(/\s+/g, ' ').trim();
}


// --- Helper: classify type based on name similarity ---
function classifyType(name) {
  if (!name) return null;
  const cleanName = name.toLowerCase();

  for (const [type, list] of Object.entries(categories)) {
    if (!Array.isArray(list)) continue;
    if (
      list.some((n) => {
        if (!n) return false;
        const cleanN = String(n).toLowerCase().replace(/[^\w\s]/g, '').trim();
        if (cleanN.length < 3) return false; // avoid accidental matches
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
  return String(input)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s-]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// --- Special-type detection helpers ---
const specialTypeMatchers = [
  {
    key: 'Fire Exit',
    pattern: /\bfire\s*exit\b/i,
    name: 'Fire Exit',
    type: 'Fire Exit',
    idPrefix: 'Fire Exit',
    baseFill: '#F66E19',
    icon: 'fire',
  },
  {
    key: 'Stairs',
    pattern: /\b(stairs?|staircase|stairway)\b/i,
    name: 'Stairs',
    type: 'Stairs',
    idPrefix: 'Stairs',
    baseFill: '#DFB133',
    icon: 'stairs',
  },
  {
    key: 'Escalator',
    pattern: /\b(escalator|escalators?)\b/i,
    name: 'Escalator',
    type: 'Escalator',
    idPrefix: 'Escalator',
    baseFill: '#DFB133',
    icon: 'escalator',
  },
  {
    key: 'Elevator',
    pattern: /\b(elevator|lift)\b/i,
    name: 'Elevator',
    type: 'Elevator',
    idPrefix: 'Elevator',
    baseFill: '#DFB133',
    icon: 'elevator',
  },
  {
    key: 'Restroom',
    // match restroom, rest room, toilet, bathroom, lavatory, cr (comfort room), male/female toilet variations
    pattern: /\b(restroom|rest room|toilet|bathroom|lavatory|comfort\s*room|cr)\b/i,
    name: 'Restroom',
    type: 'Restroom',
    idPrefix: 'Restroom',
    baseFill: '#1691B3',
    icon: 'restroom',
  }
];

// Data Clean Up function
const dataCleanUp = () => {
  const args = process.argv.slice(2);
  const oldJsonPath = path.resolve(`../Data/AyalaMalls/${args[0]}Floor/${args[0]}Floor.json`);

  // --- Load JSON ---
  if (!fs.existsSync(oldJsonPath)) {
    console.error('❌ File not found:', oldJsonPath);
    return;
  }

  const oldData = JSON.parse(fs.readFileSync(oldJsonPath, 'utf-8'));

  if (!oldData.maps || !Array.isArray(oldData.maps)) {
    console.error('❌ Invalid JSON format — missing "maps" array');
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

  // Normalizer for category text variants into canonical type names
  function normalizeCategoryName(raw) {
    if (!raw || typeof raw !== 'string') return null;
    let s = raw.trim();

    // common cleanups
    s = s.replace(/\s+/g, ' ');
    s = s.replace(/[_]+/g, ' ');
    s = s.replace(/&amp;/gi, '&');

    const low = s.toLowerCase();

    // canonical mapping - extend as needed
    const map = {
      'food & beverages': 'Food & Beverage',
      'food and beverages': 'Food & Beverage',
      'food': 'Food & Beverage',
      'retail': 'Retail',
      'service': 'Services',
      'services': 'Services',
      'entertainment / recreation': 'Entertainment',
      'entertainment': 'Entertainment',
      'recreation': 'Entertainment / Recreation',
      'entertainment & recreation': 'Entertainment',
      'entertainment / recreation': 'Entertainment',
    };

    // If categories object exists and has keys, prefer its keys (case-insensitive)
    if (categories && typeof categories === 'object' && Object.keys(categories).length > 0) {
      const keys = Object.keys(categories);
      // try to find case-insensitive match
      const found = keys.find((k) => k.toLowerCase() === low);
      if (found) return found;
    }

    if (map[low]) return map[low];

    // fallback: Title Case the incoming suffix
    return s.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  // Prepare centroid tracking outside map so we can remove duplicates later
  const seenCentroid = new Map(); // centroidKey -> firstIndex
  const duplicateCentroids = [];

  // Suffix detection pattern:
  // will match a trailing " - SOME CATEGORY", "— SOME CATEGORY", ", SOME CATEGORY", "/ SOME CATEGORY", or just "NAME CATEGORY" with dash-like separators.
  const trailingCategoryPattern = /^(.*?)(?:\s*[-–—\/,]+\s*)([^-–—\/,()]+(?:\s*\/\s*[^-–—\/,()]+)?)\s*$/;

  // --- Modify + clean items ---
  const transformed = oldData.maps.map((place, i) => {
    // start with copy and default floor
    let updated = { ...place, floor: place.floor };

    // Normalize and fix mojibake on incoming name/id first
    if (typeof updated.name === 'string') {
      updated.name = fixMojibake(updated.name);
      // unify whitespace and underscores
      updated.name = updated.name.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    }
    if (typeof updated.id === 'string') {
      updated.id = fixMojibake(updated.id);
    }

    // --- Clean trailing category in name (e.g. "MASTER SIOMAI- Food & Beverages", "FUMA-Retail") ---
    if (typeof updated.name === 'string' && updated.name.length > 0) {
      const m = updated.name.match(trailingCategoryPattern);
      if (m) {
        // m[1] = name without suffix, m[2] = candidate category suffix
        const possibleName = (m[1] || '').trim();
        const possibleCategory = (m[2] || '').trim();

        const normalizedCategory = normalizeCategoryName(possibleCategory);
        // only accept it as category if the normalizedCategory is non-empty and not something that looks like a leftover name
        if (normalizedCategory) {
          // if the place doesn't already have a special type, adopt the suffix as type
          const isSpecial = ['Fire Exit', 'Stairs', 'Escalator', 'Elevator', 'Restroom'].includes(updated.type);
          if (!isSpecial) {
            updated.type = normalizedCategory;
          }

          // set the cleaned name if it's non-empty; otherwise keep original
          if (possibleName && possibleName.length > 0) {
            updated.name = possibleName;
          } else {
            // if cleaning produced an empty name, keep original trimmed
            updated.name = updated.name.replace(/\s+/g, ' ').trim();
          }
        }
      }
    }

    // --- Special types handling: Fire Exit / Stairs / Escalator / Elevator / Restroom ---
    // Use normalized values for detection (updated.name and updated.id)
    const detectSource = `${updated.id || ''} ${updated.name || ''}`.trim();

    // Try each special matcher in order; stop at first match
    for (const matcher of specialTypeMatchers) {
      if (matcher.pattern.test(detectSource)) {
        updated = {
          ...updated,
          id: `${matcher.idPrefix}_${i}`, // temporary id; will be slugified/unique later
          name: matcher.name,
          type: matcher.type,
          baseFill: matcher.baseFill,
          icon: matcher.icon,
          centerY: updated.centerY || matcher.centerY || 40,
        };
        break;
      }
    }

    // Auto-classify by imported categories only if still not a special-type and not already a known category
    const isSpecial = ['Fire Exit', 'Stairs', 'Escalator', 'Elevator', 'Restroom'].includes(updated.type);
    const detectedType = !isSpecial ? classifyType(updated.name || '') : null;
    if (detectedType) {
      updated.type = detectedType;
    } else if (!isSpecial) {
      // Only record unmatched names if categories were provided
      if (Object.keys(categories || {}).length > 0) unmatched.push(updated.name || null);
    }

    // Detect duplicate paths
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

    // --- Centroid duplicate detection ---
    // Normalize centroid to a string key so we can detect duplicates robustly
    let centroidKey = null;
    if (Array.isArray(updated.centroid) && updated.centroid.length > 0) {
      // numeric centroid array -> "x,y" string
      centroidKey = updated.centroid.map((c) => {
        const n = Number(c);
        return Number.isFinite(n) ? n.toFixed(6) : String(c);
      }).join(',');
    } else if (typeof updated.centroid === 'string' && updated.centroid.trim() !== '') {
      centroidKey = updated.centroid.trim();
    }

    if (centroidKey) {
      if (seenCentroid.has(centroidKey)) {
        // mark this place for removal later (duplicate centroid)
        duplicateCentroids.push({
          duplicateIndex: i,
          originalIndex: seenCentroid.get(centroidKey),
          centroid: centroidKey,
          name: updated.name,
        });
        // add a flag so we can filter it out after mapping
        updated._removeBecauseDuplicateCentroid = true;
      } else {
        seenCentroid.set(centroidKey, i);
      }
    }

    // --- Ensure unique id for every place ---
    // Prefer existing id, then name, then fallback to index
    const preferred = updated.id || updated.name || `place_${i}`;
    const uniqueId = makeUniqueId(preferred, i);
    updated.id = uniqueId;

    return updated;
  });

  // Remove items marked as duplicate centroids (keep first occurrence)
  const updatedPlaces = transformed.filter((p) => !p._removeBecauseDuplicateCentroid);

  // --- Write updated JSON ---
  const result = { ...oldData, maps: updatedPlaces };
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

  if (duplicateCentroids.length > 0) {
    console.warn('⚠️ Duplicate centroids found (duplicates removed, first occurrence kept):');
    console.table(duplicateCentroids);
    console.log(`Removed ${duplicateCentroids.length} place(s) that had matching centroids.`);
  } else {
    console.log('✅ No duplicate centroids found.');
  }
};


dataCleanUp();
