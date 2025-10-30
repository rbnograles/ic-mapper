import { useCallback } from 'react';
import type { FloorData } from '@/types';

export function useMapItemResolver(floorData: Omit<FloorData, 'floor'>) {
  const resolveMapItemIdentifier = useCallback(
    (candidate: string) => {
      const existsAsId =
        floorData.maps.some((m) => m.id === candidate) ||
        floorData.entrances.some((e) => e.id === candidate);
      return existsAsId ? candidate : candidate;
    },
    [floorData.maps, floorData.entrances]
  );

  return { resolveMapItemIdentifier };
}