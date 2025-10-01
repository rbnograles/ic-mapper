// checkDuplicates.js
import fs from "fs";

// --- load your parsed JSON ---
const data = JSON.parse(fs.readFileSync("../../Data/GroupFloor.json", "utf-8"));
const places = data.places || data;

// --- map of d => first ID and duplicates ---
const seen = new Map();
const duplicates = [];
const cleaned = [];

for (const place of places) {
  const d = place.path;
  if (!d) continue;

  if (seen.has(d)) {
    // ✅ already seen -> this is a duplicate
    seen.get(d).ids.push(place.id);
    duplicates.push(place); // keep track of removed items
  } else {
    // ✅ first occurrence -> keep
    seen.set(d, { ids: [place.id], place });
    cleaned.push(place);
  }
}

// --- report duplicates ---
if (duplicates.length === 0) {
  console.log("✅ No duplicate paths found!");
} else {
  console.log("⚠️ Found duplicates:");
  for (const [d, entry] of seen.entries()) {
    if (entry.ids.length > 1) {
      console.log(`- Path (d): ${d.slice(0, 80)}...`);
      console.log(`  Used by IDs: ${entry.ids.join(", ")}`);
    }
  }
}

// --- save cleaned JSON ---
const output = { places: cleaned };
fs.writeFileSync("../../Data/GroupFloor.json", JSON.stringify(output, null, 2));

console.log(`\n✅ Cleaned file written to GroupFloor.cleaned.json (removed ${duplicates.length} duplicates).`);
