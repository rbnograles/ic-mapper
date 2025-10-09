// components/Maps/partials/floors.ts
// import AMGroundFloor from '../AM.GroundFloor';
// import other floor-specific visuals only if they exist
// import AM3FMapBoundaries from '../AM.3F/AM.3F.MapBoundaries';
// import AM3FMapBase from '../AM.3F/AM.3F.MapBase';

export const floors = [
  {
    key: 'ground',
    name: 'Ayala Malls Ground Floor',
    // no assets -> will use defaults inside AMGroundFloor
  },
   {
    key: 'second',
    name: 'Ayala Malls 2nd Floor',
    assets: {
      // if you have specialized components for the 3rd floor, pass them here
      // Boundaries: AM3FMapBoundaries,
      // Base: AM3FMapBase,
      // viewBox: '0 0 12000 9000',
    },
  },
  {
    key: 'third',
    name: 'Ayala Malls 3rd Floor',
    assets: {
      // if you have specialized components for the 3rd floor, pass them here
      // Boundaries: AM3FMapBoundaries,
      // Base: AM3FMapBase,
      // viewBox: '0 0 12000 9000',
    },
  },
  {
    key: 'fourth',
    name: 'Ayala Malls 4th Floor',
    assets: {
      // if you have specialized components for the 3rd floor, pass them here
      // Boundaries: AM3FMapBoundaries,
      // Base: AM3FMapBase,
      // viewBox: '0 0 12000 9000',
    },
  },
   {
    key: 'fifth',
    name: 'Ayala Malls 5th Floor',
    assets: {
      // if you have specialized components for the 3rd floor, pass them here
      // Boundaries: AM3FMapBoundaries,
      // Base: AM3FMapBase,
      // viewBox: '0 0 12000 9000',
    },
  },
  // more floors...
];
