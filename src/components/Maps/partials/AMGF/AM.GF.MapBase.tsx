import { memo } from 'react';
import Tooltip from '@mui/material/Tooltip';
import { Button } from '@mui/material';

type MapRegionProps = {
  p: {
    id: string;
    name: string;
    path: string;
    baseFill?: string;
    strokeWidth?: string | number;
    icon?: any;
    type?: string;
    isTypeHighlighted: boolean;
    centerX: number | undefined;
    centerY: number | undefined;
  };
  highlightName: string | null;
  centers: { [key: string]: { x: number; y: number } };
  ICON_MAP: { [key: string]: React.ReactNode };
  onHover?: (p: any) => void;
  onClick?: (p: any) => void;
  isTypeHighlighted?: boolean;
};

const AMGroundFloorBase = memo(
  function MapRegion({
    p,
    highlightName,
    centers,
    ICON_MAP,
    onClick,
    isTypeHighlighted = false,
  }: MapRegionProps) {
    const isNameHighlighted = highlightName === p.name;

    const fillColor = isNameHighlighted
      ? '#F2FFB7'
      : isTypeHighlighted
        ? '#F2FFB7'
        : p.baseFill || '#E4E9F4';

    const strokeColor = isNameHighlighted ? '#FDC023' : isTypeHighlighted ? '#FDC023' : '#F4EDDB';

    const strokeWidth = isNameHighlighted || isTypeHighlighted ? 4 : 2;

    return (
      <g key={p.id} onClick={p.type !== 'NotClickable' ? () => onClick?.(p) : () => {}}>
        {/* ---- Path ---- */}
        <path
          id={p.id}
          d={p.path}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          style={{
            transformBox: 'fill-box',
            transformOrigin: 'center',
            transition: 'transform 0.4s ease-in-out, fill 0.3s ease',
          }}
        />

        {/* ---- Center Icon ---- */}
        {centers[p.id] && (
          <foreignObject
            x={centers[p.id].x - 40}
            y={centers[p.id].y - (p.centerY !== undefined ? p.centerY : 12)}
            width={p.type === 'Unknown' ? 206 : 86}
            height={100}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              {ICON_MAP[p.icon]}

              {p.type === 'Unknown' && (
                <Tooltip title="Add">
                  <Button
                    style={{
                      backgroundColor: 'red',
                      color: 'white',
                      fontSize: 24,
                    }}
                  >
                    {p.id}
                  </Button>
                </Tooltip>
              )}
            </div>
          </foreignObject>
        )}
      </g>
    );
  },
  (prev, next) =>
    prev.highlightName === next.highlightName &&
    prev.isTypeHighlighted === next.isTypeHighlighted &&
    prev.p === next.p &&
    prev.centers === next.centers
);

export default AMGroundFloorBase;
