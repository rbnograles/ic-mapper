// src/utils/loadMapData.ts
export async function loadMapData(floor: any) {
  switch (floor) {
    case 'ground': {
      const [{ default: mapData }, { default: nodeData }] = await Promise.all([
        import('../../Data/AyalaMalls/GroundFloor/GroundFloor.json'),
        import('../../Data/AyalaMalls/GroundFloor/GroundFloorNodes.json'),
      ]);
      return {
        places: mapData.places,
        nodes: nodeData.nodes,
        entrances: nodeData.entrances,
      };
    }

    case 'third': {
      const [{ default: mapData }, { default: nodeData }] = await Promise.all([
        import('../../Data/AyalaMalls/ThirdFloor/ThirdFloor.json'),
        import('../../Data/AyalaMalls/ThirdFloor/ThirdFloorNodes.json'),
      ]);
      return {
        places: mapData.places,
        nodes: nodeData.nodes,
        entrances: nodeData.entrances,
      };
    }

    default:
      throw new Error(`Unknown floor: ${floor}`);
  }
}
