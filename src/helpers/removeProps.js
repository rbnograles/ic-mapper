import fs from 'fs';

// Use this if you want to remove a prop from the over all json array
// Current case im deleting nearNodes from the original json array
const delProp = () => {
    const args = process.argv.slice(2);
    const oldJsonPath = `../../Data/AyalaMalls/${args[0]}Floor/${args[0]}Floor.json`;
    
    const oldData = fs.existsSync(oldJsonPath)
        ? JSON.parse(fs.readFileSync(oldJsonPath, 'utf-8'))
        : { maps: [] };

    const map = oldData.maps.map(d => {
        delete d.basefill;
        return d;
    })

    const result = { maps: map }
    
    fs.writeFileSync(
      '../../Data/AyalaMalls/ThirdFloor/ThirdFloor.json',
      JSON.stringify(result, null, 2)
    );
}

// Executes File
delProp();