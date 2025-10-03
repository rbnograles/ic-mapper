import { useRef, useState, useEffect, useCallback, memo } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import MapFloatingIcons from '../Navigations/MapFloatingIcons';
import ICON_MAP from '../util/iconMapper';
import AMGFMapBoundaries from './partials/AMGF/AM.GF.MapBoundaries';
import AMGroundFloorBase from './partials/AMGF/AM.GF.MapBase';
import { useTheme, useMediaQuery } from '@mui/material';
import type { INodes } from '../../interface/BaseMap';
import AMGFRoadMarks from './partials/AMGF/AM.GF.RoadMarks';
import AMGFBuildingMarks from './partials/AMGF/AM.GF.BuildingMarks';
import AMGFPathNodes from './partials/AMGF/AM.GF.PathNodes';

function AMGroundFloor({
  highlightId,
  highlightName,
  selectedType,
  map,
  onClick,
  handleSliderPathClick,
  activeNodeIds,
  nodes,
}: {
  highlightId: string | null;
  highlightName: string | null;
  selectedType?: string | null;
  map: any[];
  onClick?: (p: any) => void;
  handleSliderPathClick?: () => void;
  activeNodeIds: string[];
  nodes: INodes[];
}) {
  const theme = useTheme();
  const transformRef = useRef<any>(null);

  // ✅ MUI breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // <600px
  const isTablet = useMediaQuery(theme.breakpoints.between('lg', 'xl')); // 600–900px
  const initialScale = isMobile ? 1.5 : isTablet ? 2.4 : 3.5;

  const [centers, setCenters] = useState<Record<string, { x: number; y: number }>>({});
  const originalPositions = useRef<Map<string, { parent: SVGGElement; index: number }>>(new Map());
  const prevHighlightRef = useRef<string | null>(null);

  const focusOnPath = useCallback((id: string, scale = 16) => {
    const path = document.getElementById(id);
    if (!path || !transformRef.current) return;
    transformRef.current.zoomToElement(path, scale, 800);
  }, []);

  useEffect(() => {
    if (!highlightId) return;

    // ✅ Zoom IN when a single place is highlighted
    const timeout = setTimeout(
      () => {
        focusOnPath(highlightId, 16); // 👈 more zoomed in than before
      },
      isMobile ? 200 : 0
    );

    return () => clearTimeout(timeout);
  }, [highlightId, focusOnPath, isMobile]);

  useEffect(() => {
    if (!selectedType || !transformRef.current) return;

    // ✅ Zoom OUT when a type is highlighted
    const timeout = setTimeout(() => {
      transformRef.current.setTransform(0, 0, 3.2, 800);
      // 👆 resets pan & zoom out
    }, 200);

    return () => clearTimeout(timeout);
  }, [selectedType]);

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
    if (!highlightId) return;
    const timeout = setTimeout(
      () => {
        focusOnPath(highlightId);
      },
      isMobile ? 200 : 0
    );
    return () => clearTimeout(timeout);
  }, [highlightId, focusOnPath, isMobile]);

  useEffect(() => {
    if (!highlightId) return;
    const prevId = prevHighlightRef.current;
    if (prevId && prevId !== highlightId) {
      const prevEl = document.getElementById(prevId)?.parentNode as SVGGElement | null;
      const original = originalPositions.current.get(prevId);
      if (prevEl && original) {
        const { parent, index } = original;
        const siblings = Array.from(parent.children);
        const refNode = siblings[index] || null;
        parent.insertBefore(prevEl, refNode);
      }
    }
    const pathEl = document.getElementById(highlightId);
    const groupEl = pathEl?.parentNode as SVGGElement | null;
    const svgRoot = groupEl?.parentNode as SVGGElement | null;
    if (groupEl && svgRoot) svgRoot.appendChild(groupEl);

    const labelsGroup = document.getElementById('Building Marks');
    const baseMapGroup = document.getElementById('Base Map');
    if (labelsGroup && baseMapGroup) baseMapGroup.appendChild(labelsGroup);

    prevHighlightRef.current = highlightId;
  }, [highlightId]);

  const handleClick = useCallback(
    (p: any) => {
      onClick?.(p);
      handleSliderPathClick?.();
    },
    [onClick, handleSliderPathClick]
  );

  return (
    <TransformWrapper
      ref={transformRef}
      limitToBounds={false}
      centerOnInit
      initialScale={initialScale}
      maxScale={12}
    >
      <MapFloatingIcons transformRef={transformRef} />
      <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
        <svg viewBox="0 0 14779 10635" style={{ width: '100%', height: 'auto' }} fill="none">
          <g id="Base Map">
            <AMGFMapBoundaries highlightName={highlightName} />
            <AMGFRoadMarks />

            {map.map((p) => (
              <AMGroundFloorBase
                key={p.id}
                p={p}
                highlightName={highlightName}
                isTypeHighlighted={!!selectedType && p.type === selectedType}
                centers={centers}
                ICON_MAP={ICON_MAP}
                onClick={handleClick}
              />
            ))}

            <AMGFBuildingMarks />

            {/* Draw nodes */}
            {/* {activeNodeIds.length >= 2 &&
              nodes
                .filter(
                  (n) =>
                    n.id === activeNodeIds[0] || // ✅ first node
                    n.id === activeNodeIds[activeNodeIds.length - 1] // ✅ last node
                )
                .map((n) =>
                  n.type === 'entrance' ? (
                    <ellipse
                      key={n.id}
                      id={n.id}
                      cx={n.cx}
                      cy={n.cy}
                      rx={n.rx ?? 20} // default if missing
                      ry={n.ry ?? 20}
                      fill={n.id === activeNodeIds[0] ? '#4CAF50' : 'white'} // start=green, end=white
                      stroke="black"
                      strokeWidth={3}
                    />
                  ) : (
                    <circle
                      key={n.id}
                      id={n.id}
                      cx={n.x}
                      cy={n.y}
                      r={24}
                      fill={n.id === activeNodeIds[0] ? '#4CAF50' : 'white'}
                      stroke="black"
                      strokeWidth={3}
                    />
                  )
                )} */}

            {nodes.map((n) =>
              n.type === 'entrance' ? (
                <ellipse
                  key={n.id}
                  id={n.id}
                  cx={n.cx}
                  cy={n.cy}
                  rx={n.rx ?? 20} // default if missing
                  ry={n.ry ?? 20}
                  fill={n.id === activeNodeIds[0] ? '#4CAF50' : 'white'} // start=green, end=white
                  stroke="black"
                  strokeWidth={3}
                />
              ) : (
                <circle
                  key={n.id}
                  id={n.id}
                  cx={n.x}
                  cy={n.y}
                  r={24}
                  fill={n.id === activeNodeIds[0] ? '#4CAF50' : 'white'}
                  stroke="black"
                  strokeWidth={3}
                />
              )
            )}

            {/* Draw route line */}
            <AMGFPathNodes route={activeNodeIds} nodes={nodes} />
          </g>
        </svg>
      </TransformComponent>
    </TransformWrapper>
  );
}

export default memo(AMGroundFloor);
