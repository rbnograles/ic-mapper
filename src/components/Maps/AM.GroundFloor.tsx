import React, { useRef, useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import MapFloatingIcons from '../Navigations/MapFloatingIcons';
import ICON_MAP from '../util/iconMapper';
import AMGFNames from './partials/AM.GF.Names';
import AMGFMapBoundaries from './partials/AM.GF.MapBoundaries';

function AMGroundFloor({
  highlightId,
  highlightName,
  map,
}: {
  highlightId: string | null;
  highlightName: string | null;
  map: any[];
}) {
  const transformRef = useRef<any>(null);
  const [centers, setCenters] = useState<Record<string, { x: number; y: number }>>({});

  const focusOnPath = (id: string) => {
    const path = document.getElementById(id);
    if (!path || !transformRef.current) return;

    transformRef.current.zoomToElement(path, 4.5, 300); // smooth zoom + center
  };

  React.useEffect(() => {
    if (highlightId) focusOnPath(highlightId);

    // After first render, measure each path’s bounding box
    const newCenters: Record<string, { x: number; y: number }> = {};
    map.forEach((p: any) => {
      const el = document.getElementById(p.id) as SVGPathElement | null;
      if (el) {
        const box = el.getBBox();
        newCenters[p.id] = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      }
    });
    setCenters(newCenters);
  }, [highlightId, map]);

  return (
    <TransformWrapper ref={transformRef} initialScale={3}>
      <MapFloatingIcons />
      <TransformComponent wrapperStyle={{ width: '100%', height: '100%', paddingTop: 100 }}>
        <svg viewBox="-10 -20 1820 1300" style={{ width: '100%', height: 'auto' }} fill="none">
          <g id="Base Map">
            <defs>
              <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow
                  dx="6" /* horizontal offset */
                  dy="8" /* vertical offset */
                  stdDeviation="3" /* blur amount */
                  floodColor="rgba(93, 62, 133, 0.6)" /* shadow color & opacity */
                />
              </filter>
            </defs>
            <AMGFMapBoundaries highlightName={highlightName} />
            {/* Base map, looping through all svg's via map */}
            {map.map((p) => (
              <g key={p.id}>
                <defs>
                  <filter id="roomShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow
                      dx="1"
                      dy="1"
                      stdDeviation="2"
                      floodColor="#210244ff"
                      floodOpacity="0.2"
                    />
                  </filter>
                </defs>
                <path
                  id={p.id}
                  d={p.path}
                  fill={highlightName === p.name ? '#7B48FF' : p.baseFill || '#E4E9F4'}
                  stroke="#7b48ff"
                  strokeWidth={p.strokeWidth || '2'}
                  filter="url(#roomShadow)"
                  style={{
                    transition: 'fill 0.3s ease, transform 0.3s ease',
                    transform: highlightName === p.name ? 'scale(1.05)' : 'scale(1)',
                    transformBox: 'fill-box', // use the path’s bounding box
                    transformOrigin: 'center', // center of that box
                  }}
                />
                {centers[p.id] && (
                  <foreignObject
                    x={centers[p.id].x - 12} // center horizontally
                    y={centers[p.id].y - 12} // center vertically
                    width={24}
                    height={24}
                  >
                    {/* Use a div so we can render a React/MUI icon */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'rgba(123,72,255,0.1)',
                        boxShadow: '0 0 4px rgba(123,72,255,0.3)',
                      }}
                    >
                      {ICON_MAP[p.icon]}
                    </div>
                  </foreignObject>
                )}
              </g>
            ))}
            <AMGFNames />
          </g>
          <defs>
            <filter
              id="filter0_d_67_2605"
              x="524.624"
              y="748.619"
              width="207.239"
              height="301.766"
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
              <feOffset />
              <feGaussianBlur stdDeviation="1.85" />
              <feComposite in2="hardAlpha" operator="out" />
              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
              <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_67_2605" />
              <feBlend
                mode="normal"
                in="SourceGraphic"
                in2="effect1_dropShadow_67_2605"
                result="shape"
              />
            </filter>
          </defs>
        </svg>
      </TransformComponent>
    </TransformWrapper>
  );
}

export default AMGroundFloor;
