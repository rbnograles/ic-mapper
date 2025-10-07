// src/utils/loadMapData.ts
export async function loadMapData(floor: any) {
  switch (floor) {
    case 'ground': {
      const [{ default: mapData }, { default: nodeData }, { default: labels }] = await Promise.all([
        import('../../Data/AyalaMalls/GroundFloor/GroundFloor.json'),
        import('../../Data/AyalaMalls/GroundFloor/GroundFloorNodes.json'),
        import('../../Data/AyalaMalls/GroundFloor/GroundFloorLabels.json'),
      ]);
      return {
        places: mapData.places,
        nodes: nodeData.nodes,
        entrances: nodeData.entrances,
        buidingMarks: labels.buildingMarks,
        roadMarks: labels.roadMarks,
        boundaries: labels.mapBoundaries,
      };
    }

    case 'third': {
      const [{ default: mapData }, { default: nodeData }, { default: labels }] = await Promise.all([
        import('../../Data/AyalaMalls/ThirdFloor/ThirdFloor.json'),
        import('../../Data/AyalaMalls/ThirdFloor/ThirdFloorNodes.json'),
        import('../../Data/AyalaMalls/ThirdFloor/ThirdFloorLabels.json'),
      ]);
      return {
        places: mapData.places,
        nodes: nodeData.nodes,
        entrances: nodeData.entrances,
        buidingMarks: labels.buildingMarks,
        roadMarks: labels.roadMarks,
        boundaries: labels.mapBoundaries,
      };
    }

    default:
      throw new Error(`Unknown floor: ${floor}`);
  }
}
