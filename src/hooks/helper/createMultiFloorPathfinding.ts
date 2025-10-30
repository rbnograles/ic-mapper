// src/routing/utils/createMultiFloorPathfinding.ts
import { floors } from '@/routing/utils/Constants';

export function createMultiFloorPathfinding() {
  function getFloorKeyFromIdentifier(identifier: string): string {
    if (!identifier) return 'ground';
    const parts = identifier.split('_');
    const floorPart = parts[0].toLowerCase();

    const floor = floors.find(
      (f) =>
        f.key === floorPart ||
        f.name.toLowerCase().includes(floorPart) ||
        (f.aliases || []).some((a) => a.toLowerCase().includes(floorPart)) ||
        (f.aliases || []).some((a) => a.toLowerCase().includes(identifier.toLowerCase()))
    );

    return floor ? floor.key : floorPart;
  }

  function findMultiFloorPath(
    verticalsData: any,
    fromFloor: string,
    toFloor: string,
    viaType: string
  ): any[] | null {
    if (!verticalsData?.verticals) return null;
    const verticals = verticalsData.verticals;

    const adj = new Map<
      string,
      { vertical: any; neighbor: string; direction: 'up' | 'down' }[]
    >();

    for (const v of verticals) {
      if (!v || typeof v.type !== 'string') continue;
      if (v.type.toLowerCase() !== viaType.toLowerCase()) continue;

      const fromKey = getFloorKeyFromIdentifier(v.from);
      const toKey = getFloorKeyFromIdentifier(v.to);

      if (!adj.has(fromKey)) adj.set(fromKey, []);
      if (!adj.has(toKey)) adj.set(toKey, []);

      adj.get(fromKey)!.push({ vertical: v, neighbor: toKey, direction: 'up' });
      adj.get(toKey)!.push({ vertical: v, neighbor: fromKey, direction: 'down' });
    }

    const startKey = getFloorKeyFromIdentifier(fromFloor);
    const targetKey = getFloorKeyFromIdentifier(toFloor);

    console.log(`🔍 BFS: "${startKey}" → "${targetKey}"`);
    console.log(`   Available floors:`, Array.from(adj.keys()));

    const queue = [startKey];
    const visited = new Set([startKey]);
    const parent = new Map<
      string,
      { from: string; vertical: any; direction: 'up' | 'down' }
    >();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === targetKey) {
        const path: any[] = [];
        let cur = targetKey;

        while (cur !== startKey) {
          const p = parent.get(cur)!;
          const connector = {
            ...p.vertical,
            from: p.direction === 'down' ? p.vertical.to : p.vertical.from,
            to: p.direction === 'down' ? p.vertical.from : p.vertical.to,
            labelFrom: p.direction === 'down' ? p.vertical.labelTo : p.vertical.labelFrom,
            labelTo: p.direction === 'down' ? p.vertical.labelFrom : p.vertical.labelTo,
            direction: p.direction,
          };
          path.unshift(connector);
          cur = p.from;
        }

        console.log(`✅ Found path with ${path.length} hop(s)`);
        return path;
      }

      const neighbors = adj.get(current) ?? [];
      for (const { vertical, neighbor, direction } of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          parent.set(neighbor, { from: current, vertical, direction });
          queue.push(neighbor);
        }
      }
    }

    console.log(`❌ No path found`);
    return null;
  }

  return { findMultiFloorPath, getFloorKeyFromIdentifier };
}
