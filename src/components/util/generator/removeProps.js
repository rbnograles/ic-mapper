import fs from 'fs';

// Use this if you want to remove a prop from the over all json array
// Current case im deleting nearNodes from the original json array
const delProp = () => {
    const oldJsonPath = '../../Data/AyalaMalls/GroundFloor/GroundFloor.json'
    
    const oldData = fs.existsSync(oldJsonPath)
        ? JSON.parse(fs.readFileSync(oldJsonPath, 'utf-8'))
        : { places: [] };

    const map = oldData.places.map(d => {
        delete d.nearNodes;
        return d;
    })

    const result = { places: map }
    
    fs.writeFileSync('../../Data/AyalaMalls/GroundFloor/GroundFloor.json', JSON.stringify(result, null, 2));
}

delProp();