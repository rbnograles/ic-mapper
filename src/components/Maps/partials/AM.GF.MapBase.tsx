import React from 'react';

type MapRegionProps = {
  p: {
    id: string;
    name: string;
    path: string;
    baseFill?: string;
    strokeWidth?: string | number;
    icon?: any;
    isTypeHighlighted: boolean;
  };
  highlightName: string | null;
  centers: { [key: string]: { x: number; y: number } };
  ICON_MAP: { [key: string]: React.ReactNode };
  onHover?: (p: any) => void;
  onClick?: (p: any) => void;
  isTypeHighlighted?: boolean; // NEW
};

const AMGroundFloorBase = React.memo(
  function MapRegion({
    p,
    highlightName,
    centers,
    ICON_MAP,
    onClick,
    isTypeHighlighted = false, // ✅ NEW
  }: MapRegionProps) {
    const isNameHighlighted = highlightName === p.name;

    const fillColor = isNameHighlighted
      ? '#7B48FF'
      : isTypeHighlighted
        ? '#7B48FF' // ✅ lighter fill for type highlight
        : p.baseFill || '#E4E9F4';

    const strokeColor = isNameHighlighted
      ? '#010626ff'
      : isTypeHighlighted
        ? '#010626ff' // ✅ darker border for type highlight
        : '#7b48ff';

    const strokeWidth = isNameHighlighted || isTypeHighlighted ? 3 : 1;

    return (
      <g key={p.id} onClick={() => onClick?.(p)}>
        <path
          id={p.id}
          d={p.path}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          style={{
            transform: isNameHighlighted ? 'scale(1.10)' : 'scale(1)',
            transformBox: 'fill-box',
            transformOrigin: 'center',
            transition: 'transform 0.4s ease-in-out, fill 0.3s ease',
          }}
        />
        {centers[p.id] && (
          <foreignObject x={centers[p.id].x - 12} y={centers[p.id].y - 12} width={24} height={24}>
            <div style={{ justifyContent: 'center', alignItems: 'center' }}>{ICON_MAP[p.icon]}</div>
          </foreignObject>
        )}
      </g>
    );
  },
  (prev, next) =>
    // ✅ re-render only if relevant props changed
    prev.highlightName === next.highlightName &&
    prev.isTypeHighlighted === next.isTypeHighlighted &&
    prev.p === next.p &&
    prev.centers === next.centers
);

export default AMGroundFloorBase;
