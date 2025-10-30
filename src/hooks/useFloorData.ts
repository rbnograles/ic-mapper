import { useState, useEffect, useRef } from 'react';
import { loadMapData } from '@/routing/utils/mapLoader';
import type { FloorData } from '@/types';
import { floors } from '@/routing/utils/Constants';

interface UseFloorDataReturn {
  floorData: Omit<FloorData, 'floor'>;
  floorDataRef: React.MutableRefObject<Omit<FloorData, 'floor'>>;
  isLoading: boolean;
  selectedMapName: string;
  loadedFloorsRef: React.MutableRefObject<Set<string>>;
}

export function useFloorData(
  selectedFloorMap: string,
  setIsLoading: (loading: boolean) => void
): UseFloorDataReturn {
  const [selectedMapName, setSelectedMapName] = useState<string>('');
  const loadedFloorsRef = useRef(new Set<string>());
  const [isLoading, setLocalIsLoading] = useState(false);

  const [floorData, setFloorData] = useState<Omit<FloorData, 'floor'>>({
    maps: [],
    nodes: [],
    entrances: [],
    buidingMarks: [],
    roadMarks: [],
    boundaries: [],
  });

  const floorDataRef = useRef(floorData);

  // Sync ref with state
  useEffect(() => {
    floorDataRef.current = floorData;
  }, [floorData]);

  // Update selected map name
  useEffect(() => {
    const floor = floors.find((f) => f.key === selectedFloorMap);
    setSelectedMapName(floor?.name ?? '');
  }, [selectedFloorMap]);

  // Load map data when floor changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setLocalIsLoading(true);

    const floorKey = selectedFloorMap ?? floors[0].key;

    loadMapData(floorKey)
      .then((data) => {
        if (!isMounted) return;

        setFloorData({
          maps: data.maps,
          nodes: data.nodes,
          entrances: data.entrances,
          buidingMarks: data.buidingMarks ?? [],
          roadMarks: data.roadMarks ?? [],
          boundaries: data.boundaries ?? [],
        });

        loadedFloorsRef.current.add(floorKey);
        setIsLoading(false);
        setLocalIsLoading(false);
      })
      .catch((err) => {
        console.error('Error loading map data:', err);
        if (isMounted) {
          setIsLoading(false);
          setLocalIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedFloorMap, setIsLoading]);

  return {
    floorData,
    floorDataRef,
    isLoading: isLoading,
    selectedMapName,
    loadedFloorsRef,
  };
}