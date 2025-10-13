import fs from 'fs';

// Use this if you want to remove a prop from the over all json array
// Current case im deleting nearNodes from the original json array
const delProp = () => {
    const args = process.argv.slice(2);
    const oldJsonPath = `../../Data/AyalaMalls/${args[0]}Floor/${args[0]}Floor.json`;
    
    const oldData = fs.existsSync(oldJsonPath)
        ? JSON.parse(fs.readFileSync(oldJsonPath, 'utf-8'))
        : { places: [] };

    const map = oldData.places.map(d => {
        delete d.basefill;
        return d;
    })

    const result = { places: map }
    
    fs.writeFileSync(
      '../../Data/AyalaMalls/ThirdFloor/ThirdFloor.json',
      JSON.stringify(result, null, 2)
    );
}

// Executes File
delProp();