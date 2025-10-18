import fs from 'fs';

// Use this if you want to remove a prop from the over all json array
// Current case im deleting nearNodes from the original json array
const findProp = () => {
    const args = process.argv.slice(2);
    const oldJsonPath = `../Data/AyalaMalls/${args[0]}Floor/${args[0]}Floor.json`;
    
    const oldData = fs.existsSync(oldJsonPath)
        ? JSON.parse(fs.readFileSync(oldJsonPath, 'utf-8'))
        : { maps: [] };

    const map = oldData.maps.map(d => {
       if(d.type === "Building") {
            return d.name
       }
    }).filter((f) => f !== undefined)

     fs.writeFileSync(
      './catResult.json',
      JSON.stringify(map, null, 2)
    );
}

// Executes File
findProp();