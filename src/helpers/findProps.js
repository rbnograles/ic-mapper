import fs from 'fs';

// Use this if you want to remove a prop from the over all json array
// Current case im deleting nearNodes from the original json array
const findProp = () => {
    const args = process.argv.slice(2);
    const oldJsonPath = `../Data/AyalaMalls/${args[0]}Floor/${args[0]}Floor.json`;
    
    const oldData = fs.existsSync(oldJsonPath)
        ? JSON.parse(fs.readFileSync(oldJsonPath, 'utf-8'))
        : { places: [] };

    const map = oldData.places.map(d => {
       if(d.entranceNodes.length === 0 && d.type !== 'NotClickable') {
            return d
       }
    }).filter((f) => f !== undefined)

    const result = { places: map }
    console.log(result)
    fs.writeFileSync(
      '../Data/findResult.json',
      JSON.stringify(result, null, 2)
    );
}

// Executes File
findProp();