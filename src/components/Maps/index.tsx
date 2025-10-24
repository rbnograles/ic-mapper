// AM.GroundFloor.tsx
import { useRef, useState, useEffect, useCallback, memo } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import MapFloatingIcons from '@/components/Navigations/MapFloatingIcons';
import BASE_ICON_MAP from '@/components/props/BaseIconMapper';
import type { IMapItem, INodes, ILabels } from '@/interface';

/* DEFAULT (ground-floor) visuals — keep these as defaults so current behavior is unchanged */
import Boundaries from '@/components/Maps/Boundaries';
import Base from '@/components/Maps/Base';
import RoadMarks from '@/components/Maps/RoadMarks';
import BuildingMarks from '@/components/Maps/BuildingMarks';
import PathNodes from '@/components/Maps/PathNodes';
import useMapStore from '@/store/MapStore';
import useDrawerStore from '@/store/DrawerStore';

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
  // Map Store
  const highlightPlace = useMapStore((state) => state.highlightedPlace);
  const activeNodeIds = useMapStore((state) => state.activeNodeIds);
  const selectedType = useMapStore((state) => state.selectedType);
  // alias assignment to normalize word
  const id = highlightPlace.id;
  const name = highlightPlace.name;
  //Actions
  const handlePathSelect = useMapStore((state) => state.handlePathSelect);
  const handleSetMapItems = useMapStore((state) => state.setMapItems);
  // Drawer Store
  const setIsExpanded = useDrawerStore((state) => state.setIsExpanded);

  // Merge defaults with overrides
  const { BASE_ICON_MAP: ICONS = BASE_ICON_MAP, viewBox = '0 0 14779 10835' } = {};

  const transformRef = useRef<any>(null);

  /* Responsive & scale */
  // (You can keep your useTheme + media queries from the original if needed)
  const initialScale = 3.5; // keep simple; you can compute per breakpoint upstream if desired

  const [centers, setCenters] = useState<Record<string, { x: number; y: number }>>({});
  const originalPositions = useRef<Map<string, { parent: SVGGElement; index: number }>>(new Map());
  const prevHighlightRef = useRef<string | null>(null);

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
        const groupEl = el.parentNode as SVGGElement | null;
        if (groupEl && !originalPositions.current.has(p.id)) {
          const parent = groupEl.parentNode as SVGGElement;
          const index = Array.from(parent.children).indexOf(groupEl);
          originalPositions.current.set(p.id, { parent, index });
        }
      }
    });
    setCenters(newCenters);
  }, [map]);

  useEffect(() => {
    if (!id) return;
    const prevId = prevHighlightRef.current;
    if (prevId && prevId !== id) {
      const prevEl = document.getElementById(prevId)?.parentNode as SVGGElement | null;
      const original = originalPositions.current.get(prevId);
      if (prevEl && original) {
        const { parent, index } = original;
        const siblings = Array.from(parent.children);
        const refNode = siblings[index] || null;
        parent.insertBefore(prevEl, refNode);
      }
    }
    const pathEl = document.getElementById(id);
    const groupEl = pathEl?.parentNode as SVGGElement | null;
    const svgRoot = groupEl?.parentNode as SVGGElement | null;
    if (groupEl && svgRoot) svgRoot.appendChild(groupEl);

    const labelsGroup = document.getElementById('Building Marks');
    const baseMapGroup = document.getElementById('Base Map');
    if (labelsGroup && baseMapGroup) baseMapGroup.appendChild(labelsGroup);

    prevHighlightRef.current = id;
  }, [id]);

  const handleClick = useCallback(
    (p: IMapItem) => {
      handlePathSelect?.(p);
      setIsExpanded?.(true);
      handleSetMapItems?.(p);
    },
    [handlePathSelect, setIsExpanded, handleSetMapItems]
  );

  return (
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
          <g id="Base Map">
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

            {/* Draw nodes (first & last) */}
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

            {/* Route line (component can be overridden per-floor) */}
            <PathNodes route={activeNodeIds} nodes={[...nodes, ...entrances]} />
          </g>
        </svg>
      </TransformComponent>
    </TransformWrapper>
  );
}

export default memo(MapBuilder);
