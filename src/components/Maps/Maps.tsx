// Maps.tsx - Fixed using CSS z-index instead of DOM manipulation
import { useRef, useState, useEffect, useCallback, memo } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import MapFloatingIcons from '@/components/Navigations/MapFloatingIcons';
import BASE_ICON_MAP from '@/components/props/BaseIconMapper';
import type { IMapItem, INodes, ILabels } from '@/interface';

import Boundaries from '@/components/Maps/Boundaries';
import Base from '@/components/Maps/Base';
import RoadMarks from '@/components/Maps/RoadMarks';
import BuildingMarks from '@/components/Maps/BuildingMarks';
import PathNodes from '@/components/Maps/PathNodes';
import useMapStore from '@/store/MapStore';
import useDrawerStore from '@/store/DrawerStore';
import { VerticalTransitionPrompt } from '../props/VerticalTransitionPrompt';

type TMapBuilder = {
  map: any[];
  nodes: INodes[];
  entrances: INodes[];
  boundaries: ILabels[];
  buidingMarks: ILabels[];
  roadMarks: ILabels[];
  floorKey?: string;
};

function MapBuilder({ map, nodes, entrances, boundaries, buidingMarks, roadMarks }: TMapBuilder) {
  const highlightPlace = useMapStore((state) => state.highlightedPlace);
  const activeNodeIds = useMapStore((state) => state.activeNodeIds);
  const selectedType = useMapStore((state) => state.selectedType);
  const id = highlightPlace.id;
  const name = highlightPlace.name;
  const handlePathSelect = useMapStore((state) => state.handlePathSelect);
  const handleSetMapItems = useMapStore((state) => state.setMapItems);
  const setIsExpanded = useDrawerStore((state) => state.setIsExpanded);

  const { BASE_ICON_MAP: ICONS = BASE_ICON_MAP, viewBox = '0 0 14779 10835' } = {};

  const transformRef = useRef<any>(null);
  const initialScale = 3.5;

  const [centers, setCenters] = useState<Record<string, { x: number; y: number }>>({});

  const focusOnPath = useCallback((id: string, scale = 16) => {
    const path = document.getElementById(id);
    if (!path || !transformRef.current) return;
    transformRef.current.zoomToElement(path, scale, 800);
  }, []);

  useEffect(() => {
    if (!id) return;
    const timeout = setTimeout(() => focusOnPath(id, 16), 0);
    return () => clearTimeout(timeout);
  }, [id, focusOnPath]);

  useEffect(() => {
    const newCenters: Record<string, { x: number; y: number }> = {};
    map.forEach((p: any) => {
      const el = document.getElementById(p.id) as SVGPathElement | null;
      if (el) {
        const box = el.getBBox();
        newCenters[p.id] = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      }
    });
    setCenters(newCenters);
  }, [map]);

  const handleClick = useCallback(
    (p: IMapItem) => {
      handlePathSelect?.(p);
      setIsExpanded?.(true);
      handleSetMapItems?.(p);
    },
    [handlePathSelect, setIsExpanded, handleSetMapItems]
  );

  return (
    <>
      <TransformWrapper
        ref={transformRef}
        limitToBounds={false}
        centerOnInit
        initialScale={initialScale}
        maxScale={20}
      >
        <MapFloatingIcons transformRef={transformRef} />
        <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
          <svg viewBox={viewBox} style={{ width: '100%', height: 'auto' }} fill="none">
            {/* Layer 1: Base elements (z-index handled in CSS) */}
            <g id="Base Map" style={{ isolation: 'isolate' }}>
              <Boundaries boundaries={boundaries} />
              <RoadMarks roadMarks={roadMarks} />
              {map.map((p) => (
                <Base
                  key={p.id}
                  p={p}
                  highlightName={name}
                  isTypeHighlighted={!!selectedType && p.type === selectedType}
                  centers={centers}
                  BASE_ICON_MAP={ICONS}
                  onClick={handleClick}
                />
              ))}
              <BuildingMarks buidingMarks={buidingMarks} />
            </g>

            {/* Layer 2: Route (always on top via rendering order) */}
            <g id="route-layer" style={{ isolation: 'isolate' }}>
              <PathNodes route={activeNodeIds} nodes={[...nodes, ...entrances]} />

              {/* Start/end markers */}
              {activeNodeIds.length >= 2 &&
                [...nodes, ...entrances]
                  .filter(
                    (n) =>
                      n.id === activeNodeIds[0] || n.id === activeNodeIds[activeNodeIds.length - 1]
                  )
                  .map((n) =>
                    n.type === 'entrance' ? (
                      <ellipse
                        key={n.id}
                        id={n.id}
                        cx={n.x}
                        cy={n.y}
                        rx={n.rx ?? 20}
                        ry={n.ry ?? 20}
                        fill={activeNodeIds.includes(n.id) ? '#4CAF50' : '#FFC107'}
                        stroke="black"
                        strokeWidth={3}
                      />
                    ) : (
                      <circle
                        key={n.id}
                        id={n.id}
                        cx={n.x}
                        cy={n.y}
                        r={20}
                        fill={activeNodeIds.includes(n.id) ? '#4CAF50' : 'white'}
                        stroke="black"
                        strokeWidth={3}
                      />
                    )
                  )}
            </g>

            {/* Layer 3: Prompts (topmost) */}
            <VerticalTransitionPrompt centers={centers} maps={map} />
          </svg>
        </TransformComponent>
      </TransformWrapper>
    </>
  );
}

export default memo(MapBuilder);