import { useRef, useState, useEffect, useCallback, memo } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import MapFloatingIcons from '../Navigations/MapFloatingIcons';
import ICON_MAP from '../util/iconMapper';
import AMGFMapBoundaries from './partials/AM.GF.MapBoundaries';
import AMGroundFloorBase from './partials/AM.GF.MapBase';
import { useTheme, useMediaQuery } from '@mui/material';
import type { INodes } from '../../interface/BaseMap';
import AMGFRoadMarks from './partials/AM.GF.RoadMarks';
import AMGFBuildingMarks from './partials/AM.GF.BuildingMarks';

import { motion } from 'framer-motion';
import { line, curveCatmullRom } from 'd3-shape';
import { FaMapMarkerAlt } from 'react-icons/fa';

type Node = { id: string; x: number; y: number };

export function Route({ route, nodes }: { route: string[]; nodes: Node[] }) {
  if (!route || route.length < 2) return null;

  // Extract coordinates of route nodes
  const points = route
    .map((id) => nodes.find((n) => n.id === id))
    .filter((n): n is Node => !!n)
    .map((n) => [n.x, n.y] as [number, number]);

  // Smooth line generator
  const lineGenerator = line<[number, number]>()
    .x((d) => d[0])
    .y((d) => d[1])
    .curve(curveCatmullRom.alpha(1)); // smooth, rounded edges

  const pathData = lineGenerator(points) || '';

  const startNode = points[0];
  const endNode = points[points.length - 1];

  return (
    <g id="current-route">
      {/* Animated flowing path */}
      <motion.path
        d={pathData}
        stroke="#FF0000"
        strokeWidth={15}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="10 20"
        initial={{ strokeDashoffset: 1000 }}
        animate={{ strokeDashoffset: 0 }}
        transition={{
          repeat: Infinity,
          ease: 'linear',
          duration: 10,
        }}
      />

      {/* Start node circle */}
      {startNode && (
        <circle
          cx={startNode[0]}
          cy={startNode[1]}
          r={30}
          fill="#4CAF50"
          stroke="black"
          strokeWidth={2}
        />
      )}

      {/* End node pin */}
      {endNode && (
        <foreignObject x={endNode[0] - 44} y={endNode[1] - 80} width={85} height={85}>
          <FaMapMarkerAlt size={85} color="blue" style={{ outline: 'white' }} />
        </foreignObject>
      )}
    </g>
  );
}

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
          <g id="Base Map" filter="url(#filter0_d_232_11)">
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
            {activeNodeIds.length >= 2 &&
              nodes
                .filter(
                  (n) =>
                    n.id === activeNodeIds[0] || // ✅ first node
                    n.id === activeNodeIds[activeNodeIds.length - 1] // ✅ last node
                )
                .map((n) => (
                  <circle
                    key={n.id}
                    id={n.id}
                    cx={n.x}
                    cy={n.y}
                    r={24}
                    fill={n.id === activeNodeIds[0] ? '#4CAF50' : '#F44336'} // start=green, end=red
                    stroke="black"
                    strokeWidth={3}
                  />
                ))}

            {/* Draw route line */}
            <Route route={activeNodeIds} nodes={nodes} />
          </g>
          <defs>
            <filter
              id="filter0_d_232_11"
              x="0.000488281"
              y="0.983643"
              width="14512"
              height="10507.5"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix
                in="SourceAlpha"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                result="hardAlpha"
              />
              <feOffset dx="103" dy="144" />
              <feGaussianBlur stdDeviation="15" />
              <feComposite in2="hardAlpha" operator="out" />
              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
              <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_232_11" />
              <feBlend
                mode="normal"
                in="SourceGraphic"
                in2="effect1_dropShadow_232_11"
                result="shape"
              />
            </filter>
            <filter
              id="filter1_d_232_11"
              x="0.000488281"
              y="0.983643"
              width="14579"
              height="10542.5"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix
                in="SourceAlpha"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                result="hardAlpha"
              />
              <feOffset dx="150" dy="159" />
              <feGaussianBlur stdDeviation="25" />
              <feComposite in2="hardAlpha" operator="out" />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0.858824 0 0 0 0 0.858824 0 0 0 0 0.858824 0 0 0 1 0"
              />
              <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_232_11" />
              <feBlend
                mode="normal"
                in="SourceGraphic"
                in2="effect1_dropShadow_232_11"
                result="shape"
              />
            </filter>
          </defs>
        </svg>
      </TransformComponent>
    </TransformWrapper>
  );
}

export default memo(AMGroundFloor);
