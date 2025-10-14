import { Fragment, memo, cloneElement } from 'react';

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

const FloorBase = memo(
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

    const strokeColor = isNameHighlighted ? '#FDC023' : isTypeHighlighted ? '#FDC023' : '#7B48FF';

    const strokeWidth = isNameHighlighted || isTypeHighlighted ? 4 : 2;

    // Clone the icon and override color if highlighted
    const iconElement = ICON_MAP[p.icon];
    const iconNode =
      p.icon &&
      iconElement &&
      // Ensure it's a valid ReactElement and supports 'style' prop
      typeof iconElement === 'object' &&
      'props' in iconElement
        ? cloneElement(iconElement as React.ReactElement<any>, {
            ...(iconElement.props &&
            typeof iconElement.props === 'object' &&
            iconElement.props !== null &&
            'style' in iconElement.props
              ? {
                  style: {
                    ...((typeof iconElement.props.style === 'object' &&
                    iconElement.props.style !== null
                      ? iconElement.props.style
                      : {}) as React.CSSProperties),
                    color:
                      isNameHighlighted || isTypeHighlighted
                        ? 'black'
                        : (iconElement.props.style as React.CSSProperties)?.color,
                    fontSize: 100,
                  },
                }
              : {}),
          })
        : null;

    return (
      <Fragment>
        <g
          key={p.id}
          onClick={p.type !== 'NotClickable' && p.name !== 'Park' ? () => onClick?.(p) : undefined}
        >
          {/* ---- Path ---- */}
          <path
            id={p.id}
            d={p.path}
            fill={p.type !== 'NotClickable' ? fillColor : '#B8B6B6'}
            stroke={p.type !== 'NotClickable' && p.type !== 'Park' ? strokeColor : 'white'}
            strokeWidth={p.type !== 'NotClickable' ? strokeWidth : 5}
            style={{
              transformBox: 'fill-box',
              transformOrigin: 'center',
              transition: 'transform 0.4s ease-in-out, fill 0.3s ease',
            }}
          />

          {/* ---- Center Icon ---- */}
          {centers[p.id] && iconNode && (
            <foreignObject
              x={centers[p.id].x - (p.centerX ?? 50)}
              y={centers[p.id].y - (p.centerY ?? 30)}
              width={100}
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
                  zIndex: 999999,
                }}
              >
                {iconNode}
              </div>
            </foreignObject>
          )}
        </g>
      </Fragment>
    );
  },
  (prev, next) =>
    prev.highlightName === next.highlightName &&
    prev.isTypeHighlighted === next.isTypeHighlighted &&
    prev.p === next.p &&
    prev.centers === next.centers
);

export default FloorBase;
