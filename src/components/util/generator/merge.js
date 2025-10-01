// mergeTypesFromOld.js
import fs from "fs";

// --- load JSON files ---
const oldData = JSON.parse(fs.readFileSync("../../Data/GroupFloor.json", "utf-8"));
const newData = JSON.parse(fs.readFileSync("places.json", "utf-8"));

// --- normalize names: lowercase + collapse spaces ---
function normalizeName(str) {
  return str ? str.toLowerCase().replace(/\s+/g, " ").trim() : "";
}

// --- create lookup from old data ---
const oldByName = {};
for (let place of oldData.places) {
  oldByName[normalizeName(place.name)] = place;
}

// --- merge types into new data ---
for (let place of newData.places) {
  const norm = normalizeName(place.name);
  if (oldByName[norm] && oldByName[norm].type) {
    place.type = oldByName[norm].type; // override type
  }
}

// --- save merged result ---
fs.writeFileSync("merged_places.json", JSON.stringify(newData, null, 2));
console.log("✅ merged_places.json generated!");
