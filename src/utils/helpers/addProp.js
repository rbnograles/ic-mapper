import fs from 'fs';

// ✅ Add new property "floor" to every place object
const addFloorProp = () => {
  const args = process.argv.slice(2);
  const oldJsonPath = `../../Data/AyalaMalls/${args[0]}Floor/${args[0]}FloorNodes.json`;
  const floorName = `Ayala Malls ${args[0]} Floor`;

  // Load the JSON
  const oldData = fs.existsSync(oldJsonPath)
    ? JSON.parse(fs.readFileSync(oldJsonPath, 'utf-8'))
    : { maps: [] };

  // Add floor property
  const updatedPlaces = oldData.nodes.map((place) => {
    // Remove nearNodes if you still want
    delete place.nearNodes;

    // Add floor property (overwrite if exists)
    return {
      ...place,
      id: `${args[0]}_${[place.id]}`,
      floor: args[0],
    };
  });

  // Save back to file
  const result = { nodes: updatedPlaces, entrances: oldData.entrances  };
  fs.writeFileSync(oldJsonPath, JSON.stringify(result, null, 2));

  console.log(`✅ Added "floor": "${floorName}" to ${updatedPlaces.length} maps`);
};

// Executes File
addFloorProp();
