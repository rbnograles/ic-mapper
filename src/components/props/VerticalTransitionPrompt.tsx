import React from 'react';
import { MdStairs, MdArrowUpward, MdArrowDownward } from 'react-icons/md';
import ElevatorIcon from '@mui/icons-material/Elevator';
import EscalatorWarningIcon from '@mui/icons-material/EscalatorWarning';
import useMapStore from '@/store/MapStore';
import { floors } from '@/pages/IndoorMap/partials/floors';
import useDrawerStore from '@/store/DrawerStore';
import theme from '@/styles/theme';
import { useMediaQuery } from '@mui/material';

interface VerticalTransitionPromptProps {
  centers: { [key: string]: { x: number; y: number } };
  maps: any[];
  currentFloor?: string;
}

export function VerticalTransitionPrompt({ centers, maps }: VerticalTransitionPromptProps) {
  // ------------------------------
  // Hooks: call all at top level
  // ------------------------------
  const highlightedId = useMapStore((s) => s.highlightedPlace?.id);
  const currentFloor = useMapStore((s) => s.selectedFloorMap);
  const setSelectedFloorMap = useMapStore((s) => s.setSelectedFloorMap);
  const resetMap = useMapStore((s) => s.resetMap);
  const setIsExpanded = useDrawerStore((state) => state.setIsExpanded);
  const setIsFloorMapOpen = useDrawerStore((state) => state.setIsFloorMapOpen);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const mR = useMapStore((s) => s.multiFloorRoute)

  // ------------------------------
  // Defensive / derived values
  // ------------------------------
  const highlightedKey = highlightedId ?? '';
  const clickedMap = maps.find((m) => m.id === highlightedKey);
  const isVertical =
    !!clickedMap && ['Stairs', 'Elevator', 'Escalator'].includes(clickedMap.type || '');

  if (!isVertical || !clickedMap) return null;

  const center = centers[clickedMap.id];
  if (!center) return null;

  
  const currentIndex = floors.findIndex((f) => f.key === currentFloor);
  const isGroundFloor = String(currentFloor ?? '')
    .toLowerCase()
    .includes('ground');

  // compute availability and labels
  const hasUp = currentIndex >= 0 && currentIndex < floors.length - 1;
  const hasDown = currentIndex > 0;
  const nextFloor = hasUp ? floors[currentIndex + 1] : undefined;
  const prevFloor = hasDown ? floors[currentIndex - 1] : undefined;
  const currentFloorLabel = currentIndex >= 0 ? floors[currentIndex].name : 'Unknown';
  const upLabel = nextFloor ? nextFloor.name : '—';
  const downLabel = prevFloor ? prevFloor.name : '—';

  // ------------------------------
  // UI sizing (kept similar to yours but slightly tuned)
  // ------------------------------
  const scale = 3;
  const tooltipWidth = 250 * scale;
  const tooltipHeight = 150 * scale;
  const arrowSize = 7 * scale;
  const iconSize = 18 * scale;
  const fontSize = 15 * scale;
  const buttonHeight = 36 * scale;
  const buttonFontSize = 13 * scale;

  const tooltipX = center.x - tooltipWidth / 2;
  const tooltipY = center.y - tooltipHeight - arrowSize - 10 * scale;

  // ------------------------------
  // Helpers
  // ------------------------------
  const getIcon = () => {
    const iconStyle = {
      fontSize: iconSize,
      color: theme?.palette?.text?.primary ?? '#444',
    } as React.CSSProperties;
    switch (clickedMap.type) {
      case 'Stairs':
        return <MdStairs style={iconStyle} />;
      case 'Elevator':
        return (
          <ElevatorIcon
            sx={{ fontSize: iconSize, color: theme?.palette?.text?.primary ?? '#444' }}
          />
        );
      case 'Escalator':
        return (
          <EscalatorWarningIcon
            sx={{ fontSize: iconSize, color: theme?.palette?.text?.primary ?? '#444' }}
          />
        );
      default:
        return null;
    }
  };

  const handleMove = (direction: 'up' | 'down') => {
    const currentIndexLocal = floors.findIndex((f) => f.key === currentFloor);
    if (currentIndexLocal === -1) {
      console.warn('Invalid current floor');
      return;
    }

    let nextFloorLocal;
    if (direction === 'up' && currentIndexLocal < floors.length - 1) {
      nextFloorLocal = floors[currentIndexLocal + 1];
    } else if (direction === 'down' && currentIndexLocal > 0) {
      nextFloorLocal = floors[currentIndexLocal - 1];
    } else {
      console.log(
        `You are already at the ${floors[currentIndexLocal].name}. Can't move ${direction}.`
      );
      return;
    }
    setSelectedFloorMap(nextFloorLocal.key);
    setIsFloorMapOpen(false);
    setIsExpanded(false);
    resetMap();
  };

  const handleClose = () => {
    setIsFloorMapOpen(false);
    setIsExpanded(false);
  };

  // small style helpers to avoid repeating long inline objects
  const primary = theme?.palette?.primary?.main ?? '#1976d2';
  const muted = theme?.palette?.text?.secondary ?? '#6b7280';
  const surface = theme?.palette?.background?.default ?? '#ffffff';

  // ------------------------------
  // Render tooltip (full SVG + foreignObject content)
  // ------------------------------
  return (
    <g style={{ pointerEvents: 'all' }} data-vertical-prompt>
      {/* Tooltip container */}
      <g>
        {/* Background with a very soft border and shadow */}
        <rect
          x={tooltipX}
          y={tooltipY}
          width={tooltipWidth}
          height={tooltipHeight}
          rx={12 * scale}
          fill={surface}
          stroke="#e6eef8"
          strokeWidth={1}
          filter="url(#tooltip-shadow)"
        />

        {/* Arrow pointing down (softer) */}
        <path
          d={`M ${center.x - arrowSize} ${tooltipY + tooltipHeight} 
              L ${center.x} ${tooltipY + tooltipHeight + arrowSize} 
              L ${center.x + arrowSize} ${tooltipY + tooltipHeight} Z`}
          fill={surface}
          stroke="#e6eef8"
          strokeWidth={1}
        />

        {/* Shadow filter */}
        <defs>
          <filter id="tooltip-shadow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
            <feOffset dx="0" dy="4" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.12" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Header area: icon, title and close */}
        <foreignObject
          x={tooltipX + 12 * scale}
          y={tooltipY + 12 * scale}
          width={tooltipWidth - 24 * scale}
          height={48 * scale}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10 * scale,
                pointerEvents: 'auto',
              }}
            >
              <div
                aria-hidden
                style={{
                  width: 36 * scale,
                  height: 36 * scale,
                  borderRadius: 10 * scale,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(25,118,210,0.08)',
                }}
              >
                {getIcon()}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: fontSize, fontWeight: 700, color: '#0f172a' }}>
                  {isGroundFloor ? 'Move up' : 'Change floor'}
                </div>
                <div
                  style={{ fontSize: fontSize * 0.78, color: muted }}
                >{`Current: ${currentFloorLabel}`}</div>
              </div>
            </div>

            {/* Close button */}
            <div style={{ pointerEvents: 'auto' }}>
              <button
                onClick={handleClose}
                aria-label="Close"
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 14 * scale,
                  color: muted,
                  padding: 6 * scale,
                }}
              >
                ✕
              </button>
            </div>
          </div>
        </foreignObject>

        <foreignObject
          x={tooltipX}
          y={isMobile ? tooltipY + 65 * scale : tooltipY + 50 * scale}
          width={tooltipWidth}
          height={110}
        >
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 45 }}>
              {' '}
              {isGroundFloor ? 'Where would you like to go?' : 'Which direction?'}
            </p>
          </div>
        </foreignObject>

        {/* Buttons area */}
        {isGroundFloor ? (
          <g
            onClick={() => hasUp && handleMove('up')}
            style={{ cursor: hasUp ? 'pointer' : 'not-allowed' }}
          >
            {/* big single button */}
            <rect
              x={tooltipX + 20 * scale}
              y={tooltipY + tooltipHeight - buttonHeight - 14 * scale}
              width={tooltipWidth - 40 * scale}
              height={buttonHeight}
              rx={10 * scale}
              fill={hasUp ? primary : '#bcd6f6'}
              style={{ opacity: hasUp ? 1 : 0.6 }}
            />

            <foreignObject
              x={tooltipX + 20 * scale}
              y={tooltipY + tooltipHeight - buttonHeight - 14 * scale}
              width={tooltipWidth - 40 * scale}
              height={buttonHeight}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10 * scale,
                  height: '100%',
                  pointerEvents: 'none',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: buttonFontSize,
                }}
              >
                <MdArrowUpward style={{ fontSize: buttonFontSize * 1.4 }} />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                  <span>{hasUp ? `Go to ${upLabel}` : 'Top floor'}</span>
                </div>
              </div>
            </foreignObject>

            {/* invisible click-catcher */}
            <rect
              x={tooltipX + 20 * scale}
              y={tooltipY + tooltipHeight - buttonHeight - 14 * scale}
              width={tooltipWidth - 40 * scale}
              height={buttonHeight}
              rx={10 * scale}
              fill="transparent"
              style={{ cursor: hasUp ? 'pointer' : 'not-allowed' }}
            />
          </g>
        ) : (
          // two-column layout for up/down
          <>
            {/* Up */}
            <g
              onClick={() => hasUp && handleMove('up')}
              style={{ cursor: hasUp ? 'pointer' : 'not-allowed' }}
            >
              <rect
                x={tooltipX + 18 * scale}
                y={tooltipY + tooltipHeight - buttonHeight - 14 * scale}
                width={(tooltipWidth - 48 * scale) / 2}
                height={buttonHeight}
                rx={10 * scale}
                fill={hasUp ? primary : '#bcd6f6'}
                style={{ opacity: hasUp ? 1 : 0.6 }}
              />
              <foreignObject
                x={tooltipX + 18 * scale}
                y={tooltipY + tooltipHeight - buttonHeight - 14 * scale}
                width={(tooltipWidth - 48 * scale) / 2}
                height={buttonHeight}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8 * scale,
                    height: '100%',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: buttonFontSize,
                    pointerEvents: 'none',
                  }}
                >
                  <MdArrowUpward style={{ fontSize: buttonFontSize * 1.2 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                    <small style={{ fontSize: buttonFontSize * 0.8 }}>
                      {hasUp ? upLabel : '—'}
                    </small>
                  </div>
                </div>
              </foreignObject>

              <rect
                x={tooltipX + 18 * scale}
                y={tooltipY + tooltipHeight - buttonHeight - 14 * scale}
                width={(tooltipWidth - 48 * scale) / 2}
                height={buttonHeight}
                rx={10 * scale}
                fill="transparent"
                style={{ cursor: hasUp ? 'pointer' : 'not-allowed' }}
              />
            </g>

            {/* Down */}
            <g
              onClick={() => hasDown && handleMove('down')}
              style={{ cursor: hasDown ? 'pointer' : 'not-allowed' }}
            >
              <rect
                x={tooltipX + tooltipWidth / 2 + 6 * scale}
                y={tooltipY + tooltipHeight - buttonHeight - 14 * scale}
                width={(tooltipWidth - 48 * scale) / 2}
                height={buttonHeight}
                rx={10 * scale}
                fill={hasDown ? primary : '#bcd6f6'}
                style={{ opacity: hasDown ? 1 : 0.6 }}
              />
              <foreignObject
                x={tooltipX + tooltipWidth / 2 + 6 * scale}
                y={tooltipY + tooltipHeight - buttonHeight - 14 * scale}
                width={(tooltipWidth - 48 * scale) / 2}
                height={buttonHeight}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8 * scale,
                    height: '100%',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: buttonFontSize,
                    pointerEvents: 'none',
                  }}
                >
                  <MdArrowDownward style={{ fontSize: buttonFontSize * 1.2 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                    <small style={{ fontSize: buttonFontSize * 0.8 }}>
                      {hasDown ? downLabel : '—'}
                    </small>
                  </div>
                </div>
              </foreignObject>

              <rect
                x={tooltipX + tooltipWidth / 2 + 6 * scale}
                y={tooltipY + tooltipHeight - buttonHeight - 14 * scale}
                width={(tooltipWidth - 48 * scale) / 2}
                height={buttonHeight}
                rx={10 * scale}
                fill="transparent"
                style={{ cursor: hasDown ? 'pointer' : 'not-allowed' }}
              />
            </g>
          </>
        )}
      </g>
    </g>
  );
}
