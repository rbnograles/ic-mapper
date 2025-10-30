// src/routing/utils/floorKeyResolver.ts
import { floors } from '@/routing/utils/Constants';

export function createFloorKeyResolver() {
  function getFloorKey(floorIdentifier: string): string {
    if (!floorIdentifier) return 'ground';

    const identifier = floorIdentifier.toLowerCase().trim();

    const floor = floors.find(
      (f) =>
        f.key === identifier ||
        f.name.toLowerCase() === identifier ||
        (f.aliases || []).some((a) => a.toLowerCase() === identifier)
    );

    if (floor) {
      console.log(`   🔑 Resolved "${floorIdentifier}" → key: "${floor.key}"`);
      return floor.key;
    }

    console.warn(`   ⚠️ Could not resolve floor: "${floorIdentifier}"`);
    return identifier;
  }

  function getFloorKeyFromNode(nodeId: string): string {
    if (!nodeId) return 'ground';
    const floorPart = nodeId.split('_')[0];
    return getFloorKey(floorPart);
  }

  return { getFloorKey, getFloorKeyFromNode };
}
