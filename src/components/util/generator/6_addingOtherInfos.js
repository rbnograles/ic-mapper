import fs from 'fs';

const baseFilePath = '../../Data/GroupFloor.json';

try {
  // ✅ Check if file exists
  if (!fs.existsSync(baseFilePath)) {
    throw new Error(`File not found: ${baseFilePath}`);
  }

  // ✅ Read file
  const raw = fs.readFileSync(baseFilePath, 'utf-8');
  let baseData;
  try {
    baseData = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON format in ${baseFilePath}\n${err}`);
  }

  // ✅ Verify structure
  if (!baseData.GroundFloor || !Array.isArray(baseData.GroundFloor)) {
    throw new Error(`Missing or invalid "GroundFloor" array in ${baseFilePath}`);
  }

  // ✅ Add new fields
  baseData.GroundFloor = baseData.GroundFloor.map(item => ({
    id: item.id,
    name: item.name,
    img: item.img || '',
    description: item.description || '',
    nearLocations: Array.isArray(item.nearLocations) ? item.nearLocations : []
  }));

  // ✅ Save back
  fs.writeFileSync('../../Data/GroupFloor2.json', JSON.stringify(baseData, null, 2), 'utf-8');
  console.log(`✅ Update complete! New fields added in ../../Data/GroupFloor2.json`);

} catch (err) {
  console.error('❌ Error updating JSON:', err.message);
}
