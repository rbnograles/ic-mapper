import { FloorData } from "@/interface";

// src/utils/loadMapData.ts


export async function loadMapData(floor: any) {
  const loadSingleFloor = async (dirName: string, canonicalFloorName: string): Promise<FloorData> => {
    const [{ default: mapData }, { default: nodeData }, { default: labels }] = await Promise.all([
      import(`@/Data/AyalaMalls/${dirName}/${dirName}.json`),
      import(`@/Data/AyalaMalls/${dirName}/${dirName}Nodes.json`),
      import(`@/Data/AyalaMalls/${dirName}/${dirName}Labels.json`),
    ]);

    const maps = Array.isArray(mapData?.maps) ? mapData.maps : [];
    const nodes = Array.isArray(nodeData?.nodes) ? nodeData.nodes : [];
    const entrances = Array.isArray(nodeData?.entrances) ? nodeData.entrances : [];
    const buidingMarks = Array.isArray(labels?.buildingMarks) ? labels.buildingMarks : [];
    const roadMarks = Array.isArray(labels?.roadMarks) ? labels.roadMarks : [];
    const boundaries = Array.isArray(labels?.mapBoundaries) ? labels.mapBoundaries : [];

    return {
      floor: canonicalFloorName,
      maps,
      nodes,
      entrances,
      buidingMarks,
      roadMarks,
      boundaries,
    };
  };

  switch (String(floor)) {
    case 'ground':
      return loadSingleFloor('GroundFloor', 'ground');
    case 'second':
      return loadSingleFloor('SecondFloor', 'second');
    case 'third':
      return loadSingleFloor('ThirdFloor', 'third');
    case 'fourth':
      return loadSingleFloor('FourthFloor', 'fourth');
    case 'fifth':
      return loadSingleFloor('FifthFloor', 'fifth');

    case 'all': {
      const floorsToLoad: { dir: string; name: string }[] = [
        { dir: 'GroundFloor', name: 'ground' },
        { dir: 'SecondFloor', name: 'second' },
        { dir: 'ThirdFloor', name: 'third' },
        { dir: 'FourthFloor', name: 'fourth' },
        { dir: 'FifthFloor', name: 'fifth' },
      ];

      const results = await Promise.all(
        floorsToLoad.map(async (f) => {
          try {
            return await loadSingleFloor(f.dir, f.name);
          } catch (err) {
            console.error(`Failed to load ${f.name}`, err);
            return null;
          }
        })
      );

      // filter out nulls and combine
      const valid = results.filter((r): r is FloorData => r !== null && r !== undefined);

      // initial accumulator with floor: 'all' to satisfy the type
      const merged = valid.reduce(
        (acc: FloorData, cur: FloorData) => ({
          floor: acc.floor, // keep 'all'
          maps: [...acc.maps, ...cur.maps.map((p) => ({ ...p }))],
          nodes: [...acc.nodes, ...cur.nodes],
          entrances: [...acc.entrances, ...cur.entrances],
          buidingMarks: [...acc.buidingMarks, ...cur.buidingMarks],
          roadMarks: [...acc.roadMarks, ...cur.roadMarks],
          boundaries: [...acc.boundaries, ...cur.boundaries],
        }),
        {
          floor: 'all',
          maps: [],
          nodes: [],
          entrances: [],
          buidingMarks: [],
          roadMarks: [],
          boundaries: [],
        }
      );

      return merged;
    }

    default:
      throw new Error(`Unknown floor: ${floor}`);
  }
}
