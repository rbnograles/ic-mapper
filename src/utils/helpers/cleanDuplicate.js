import fs from 'fs';

const findDuplicatedIds = () => {
  const args = process.argv.slice(2);
  const oldJsonPath = `../../Data/AyalaMalls/${args[0]}Floor/${args[0]}Floor.json`;

  if (!fs.existsSync(oldJsonPath)) {
    console.error('File not found:', oldJsonPath);
    process.exit(1);
  }

  const oldData = JSON.parse(fs.readFileSync(oldJsonPath, 'utf-8'));

  // Collect all ids from every node array that contains objects with an id
  const allIds = [];

  oldData.maps.forEach((map) => {
    Object.values(map).forEach((val) => {
      if (Array.isArray(val)) {
        val.forEach((item) => {
          if (item && typeof item === 'object' && 'id' in item) {
            allIds.push(item.id);
          }
        });
      }
    });
  });

  // Find duplicated ids
  const idCount = allIds.reduce((acc, id) => {
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});

  const duplicatedIds = Object.keys(idCount).filter((id) => idCount[id] > 1);

  console.log('Duplicated IDs:', duplicatedIds);
  fs.writeFileSync(
    '../Data/findResult.json',
    JSON.stringify({ duplicatedIds }, null, 2)
  );
};

// Executes File
findDuplicatedIds();
