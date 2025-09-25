import { useRef, useState, useEffect, useCallback, memo } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import MapFloatingIcons from '../Navigations/MapFloatingIcons';
import ICON_MAP from '../util/iconMapper';
import AMGFNames from './partials/AM.GF.Names';
import AMGFMapBoundaries from './partials/AM.GF.MapBoundaries';
import AMGroundFloorBase from './partials/AM.GF.MapBase';
import { useTheme, useMediaQuery } from '@mui/material';
import AMGFRoutingPaths from './partials/AM.GF.RoutingPaths';
import type { EdgePathTypes } from '../../App';

function AMGroundFloor({
  highlightId,
  highlightName,
  selectedType,
  map,
  onClick,
  handleSliderPathClick,
  activePathIds,
  edgePath,
}: {
  highlightId: string | null;
  highlightName: string | null;
  selectedType?: string | null;
  map: any[];
  onClick?: (p: any) => void;
  handleSliderPathClick?: () => void;
  activePathIds: string[];
  edgePath: EdgePathTypes;
}) {
  const theme = useTheme();
  const transformRef = useRef<any>(null);
  // ✅ MUI breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // <600px
  const isTablet = useMediaQuery(theme.breakpoints.between('lg', 'xl')); // 600–900px

  // ✅ Decide scale based on breakpoint
  const initialScale = isMobile ? 1.5 : isTablet ? 2.4 : 3.5;

  const [centers, setCenters] = useState<Record<string, { x: number; y: number }>>({});
  const originalPositions = useRef<Map<string, { parent: SVGGElement; index: number }>>(new Map());
  const prevHighlightRef = useRef<string | null>(null);

  const focusOnPath = useCallback((id: string) => {
    const path = document.getElementById(id);
    if (!path || !transformRef.current) return;
    transformRef.current.zoomToElement(path, 5.5, 800);
  }, []);

  // Calculate centers and store original positions of paths whenever the map changes
  // eg. clicks or highlights
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

  // make sure that the view of the application focuses on the highlighted path
  // allows smoother transitions
  useEffect(() => {
    if (!highlightId) return;
    const timeout = setTimeout(
      () => {
        focusOnPath(highlightId);
      },
      isMobile ? 200 : 0
    ); // delay only on mobile
    return () => clearTimeout(timeout);
  }, [highlightId, focusOnPath, isMobile]);

  // Move highlighted path to end of SVG to ensure it's on top
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

    const labelsGroup = document.getElementById('map-labels');
    const baseMapGroup = document.getElementById('Base Map');
    if (labelsGroup && baseMapGroup) baseMapGroup.appendChild(labelsGroup);

    prevHighlightRef.current = highlightId;
  }, [highlightId]);

  const handleClick = useCallback(
    (p: any) => {
      onClick?.(p); // first callback
      handleSliderPathClick?.(); // second callback
    },
    [onClick, handleSliderPathClick]
  );

  return (
    <TransformWrapper
      ref={transformRef}
      limitToBounds={false}
      centerOnInit
      initialScale={initialScale}
    >
      <MapFloatingIcons transformRef={transformRef} />
      <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
        <svg viewBox="-10 -20 1760 1190" style={{ width: '100%', height: 'auto' }} fill="none">
          <g id="Base Map">
            <defs>
              <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow
                  dx="24"
                  dy="16"
                  stdDeviation="12"
                  floodColor="rgba(64, 26, 136, 0.6)"
                />
              </filter>
            </defs>

            <AMGFMapBoundaries highlightName={highlightName} />

            {map.map((p) => (
              <AMGroundFloorBase
                key={p.id}
                p={p}
                highlightName={highlightName}
                isTypeHighlighted={!!selectedType && p.type === selectedType} // ✅ NEW
                centers={centers}
                ICON_MAP={ICON_MAP}
                onClick={handleClick}
              />
            ))}

            <AMGFNames />
            <AMGFRoutingPaths activeIds={activePathIds} paths={edgePath as any} />
          </g>
        </svg>
      </TransformComponent>
    </TransformWrapper>
  );
}

export default memo(AMGroundFloor);
