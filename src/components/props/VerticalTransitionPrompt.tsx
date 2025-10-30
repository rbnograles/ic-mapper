import { MdStairs, MdArrowUpward, MdArrowDownward } from 'react-icons/md';
import ElevatorIcon from '@mui/icons-material/Elevator';
import EscalatorWarningIcon from '@mui/icons-material/EscalatorWarning';
import useMapStore from '@/store/MapStore';
import { floors } from '@/utils/floors';
import useDrawerStore from '@/store/DrawerStore';
import theme from '@/styles/theme';
import { useMediaQuery } from '@mui/material';
import { FaTimes } from 'react-icons/fa';

interface VerticalTransitionPromptProps {
  centers: { [key: string]: { x: number; y: number } };
  maps: any[];
  currentFloor?: string;
}

export function VerticalTransitionPrompt({ centers, maps }: VerticalTransitionPromptProps) {
  const highlightedId = useMapStore((s) => s.highlightedPlace?.id);
  const currentFloor = useMapStore((s) => s.selectedFloorMap);
  const multiFloorRoute = useMapStore((s) => s.multiFloorRoute);
  const setSelectedFloorMap = useMapStore((s) => s.setSelectedFloorMap);
  const resetMap = useMapStore((s) => s.resetMap);
  const clearMultiFloorRoute = useMapStore((s) => s.clearMultiFloorRoute);
  const nextRouteStep = useMapStore((s) => s.nextRouteStep);
  const setIsExpanded = useDrawerStore((state) => state.setIsExpanded);
  const setIsFloorMapOpen = useDrawerStore((state) => state.setIsFloorMapOpen);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });

  const highlightedKey = highlightedId ?? '';
  const clickedMap = maps.find((m) => m.id === highlightedKey);
  const isVertical =
    !!clickedMap && ['Stairs', 'Elevator', 'Escalator'].includes(clickedMap.type || '');

  // ✅ Check if multi-floor route is active
  const isMultiFloorActive = multiFloorRoute?.isActive;
  
  if (!isVertical || !clickedMap) return null;

  const center = centers[clickedMap.id];
  if (!center) return null;

  const currentIndex = floors.findIndex((f) => f.key === currentFloor);
  const isGroundFloor = String(currentFloor ?? '')
    .toLowerCase()
    .includes('ground');

  const hasUp = currentIndex >= 0 && currentIndex < floors.length - 1;
  const hasDown = currentIndex > 0;
  const nextFloor = hasUp ? floors[currentIndex + 1] : undefined;
  const prevFloor = hasDown ? floors[currentIndex - 1] : undefined;
  const currentFloorLabel = currentIndex >= 0 ? floors[currentIndex].name : 'Unknown';
  const upLabel = nextFloor ? nextFloor.name : '';
  const downLabel = prevFloor ? prevFloor.name : '';

  // Responsive scaling
  const baseScale = isMobile ? 2.5 : 3;
  const tooltipWidth = !isGroundFloor ? 300 * baseScale : 280 * baseScale;
  const tooltipHeight = !isGroundFloor ? 170 * baseScale : 160 * baseScale;
  const arrowSize = 8 * baseScale;
  const iconSize = 20 * baseScale;
  const fontSize = 16 * baseScale;
  const buttonHeight = 48 * baseScale;
  const buttonFontSize = 14 * baseScale;

  const tooltipX = center.x - tooltipWidth / 2;
  const tooltipY = center.y - tooltipHeight - arrowSize - 12 * baseScale;

  const getIcon = () => {
    const iconProps = {
      style: { fontSize: iconSize, color: '#1976d2' },
    };
    switch (clickedMap.type) {
      case 'Stairs':
        return <MdStairs {...iconProps} />;
      case 'Elevator':
        return <ElevatorIcon sx={{ fontSize: iconSize, color: '#1976d2' }} />;
      case 'Escalator':
        return <EscalatorWarningIcon sx={{ fontSize: iconSize, color: '#1976d2' }} />;
      default:
        return null;
    }
  };

  const handleMove = (direction: 'up' | 'down') => {
    const currentIndexLocal = floors.findIndex((f) => f.key === currentFloor);
    if (currentIndexLocal === -1) return;

    let nextFloorLocal;
    if (direction === 'up' && currentIndexLocal < floors.length - 1) {
      nextFloorLocal = floors[currentIndexLocal + 1];
    } else if (direction === 'down' && currentIndexLocal > 0) {
      nextFloorLocal = floors[currentIndexLocal - 1];
    } else {
      return;
    }

    // ✅ If in multi-floor route, advance step BEFORE floor change
    if (isMultiFloorActive) {
      console.log(`✅ Advancing to step ${multiFloorRoute.currentStep + 2}/${multiFloorRoute.steps.length}`);
      nextRouteStep();
    }

    // ✅ Change floor
    setSelectedFloorMap(nextFloorLocal.key);
    setIsFloorMapOpen(false);
    setIsExpanded(false);
    
    // ✅ Only reset if NOT multi-floor
    if (!isMultiFloorActive) {
      console.log('Manual floor change - resetting map');
      resetMap();
    }
  };

  const handleClose = () => {
    // ✅ Clear both map and multi-floor route
    if (isMultiFloorActive) {
      clearMultiFloorRoute();
    }
    resetMap();
  };

  const primary = theme?.palette?.primary?.main ?? '#1976d2';
  const surface = '#ffffff';
  const textPrimary = '#1a1a1a';
  const textSecondary = '#666666';

  return (
    <g style={{ pointerEvents: 'all' }} data-vertical-prompt>
      {/* Shadow/backdrop blur effect */}
      <defs>
        <filter id="prompt-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="8" />
          <feOffset dx="0" dy="6" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.15" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <linearGradient id="button-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={primary} stopOpacity="1" />
          <stop offset="100%" stopColor={primary} stopOpacity="0.85" />
        </linearGradient>

        <linearGradient id="disabled-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e0e0e0" stopOpacity="1" />
          <stop offset="100%" stopColor="#d0d0d0" stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* Main tooltip container */}
      <rect
        x={tooltipX}
        y={tooltipY}
        width={tooltipWidth}
        height={tooltipHeight}
        rx={16 * baseScale}
        fill={surface}
        stroke="rgba(0,0,0,0.08)"
        strokeWidth={2}
        filter="url(#prompt-shadow)"
      />

      {/* Arrow pointing to connector */}
      <path
        d={`M ${center.x - arrowSize} ${tooltipY + tooltipHeight} 
            L ${center.x} ${tooltipY + tooltipHeight + arrowSize} 
            L ${center.x + arrowSize} ${tooltipY + tooltipHeight} Z`}
        fill={surface}
        stroke="rgba(0,0,0,0.08)"
        strokeWidth={2}
      />

      {/* Header section with icon and title */}
      <foreignObject
        x={tooltipX + 16 * baseScale}
        y={tooltipY + 16 * baseScale}
        width={tooltipWidth - 32 * baseScale}
        height={56 * baseScale}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            height: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 * baseScale }}>
            {/* Icon container with subtle background */}
            <div
              style={{
                width: 44 * baseScale,
                height: 44 * baseScale,
                borderRadius: 12 * baseScale,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  'linear-gradient(135deg, rgba(25,118,210,0.1) 0%, rgba(25,118,210,0.05) 100%)',
                border: '2px solid rgba(25,118,210,0.2)',
              }}
            >
              {getIcon()}
            </div>

            {/* Title and current floor */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 * baseScale }}>
              <div
                style={{
                  fontSize: fontSize,
                  fontWeight: 700,
                  color: textPrimary,
                  lineHeight: 1.2,
                }}
              >
                {isGroundFloor ? (isMultiFloorActive ? 'Continue Route' : 'Go Upstairs') : 'Change Floor'}
              </div>
              <div
                style={{
                  fontSize: fontSize * 0.75,
                  color: textSecondary,
                  fontWeight: 500,
                }}
              >
                Currently on: {currentFloorLabel}
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            aria-label="Close"
            style={{
              border: 'none',
              background: 'rgba(0,0,0,0.04)',
              cursor: 'pointer',
              fontSize: 18 * baseScale,
              color: textSecondary,
              width: 32 * baseScale,
              height: 32 * baseScale,
              borderRadius: 8 * baseScale,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              pointerEvents: 'auto',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.08)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
            }}
          >
            <FaTimes />
          </button>
        </div>
      </foreignObject>

      {/* Subtitle text */}
      {!isGroundFloor && (
        <foreignObject
          x={tooltipX + 16 * baseScale}
          y={tooltipY + 72 * baseScale}
          width={tooltipWidth - 32 * baseScale}
          height={30 * baseScale}
        >
          <div
            style={{
              fontSize: fontSize * 0.85,
              color: textSecondary,
              textAlign: 'center',
              fontWeight: 500,
            }}
          >
            {isMultiFloorActive ? 'Continue your route' : 'Which direction would you like to go?'}
          </div>
        </foreignObject>
      )}

      {/* Button section */}
      {isGroundFloor ? (
        // Single "Go Up" button
        <g
          onClick={() => hasUp && handleMove('up')}
          style={{ cursor: hasUp ? 'pointer' : 'not-allowed' }}
        >
          <rect
            x={tooltipX + 16 * baseScale}
            y={tooltipY + tooltipHeight - buttonHeight - 16 * baseScale}
            width={tooltipWidth - 32 * baseScale}
            height={buttonHeight}
            rx={12 * baseScale}
            fill={hasUp ? 'url(#button-gradient)' : 'url(#disabled-gradient)'}
            style={{
              opacity: hasUp ? 1 : 0.5,
              transition: 'all 0.3s',
            }}
          />

          <foreignObject
            x={tooltipX + 16 * baseScale}
            y={tooltipY + tooltipHeight - buttonHeight - 16 * baseScale}
            width={tooltipWidth - 32 * baseScale}
            height={buttonHeight}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12 * baseScale,
                height: '100%',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: buttonFontSize,
                pointerEvents: 'none',
              }}
            >
              <MdArrowUpward style={{ fontSize: buttonFontSize * 1.5 }} />
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  lineHeight: 1.3,
                }}
              >
                <span style={{ fontSize: buttonFontSize }}>
                  {isMultiFloorActive ? 'Continue Route' : 'Go to Upper Floor'}
                </span>
                {hasUp && (
                  <span style={{ fontSize: buttonFontSize * 0.8, opacity: 0.9 }}>{upLabel}</span>
                )}
              </div>
            </div>
          </foreignObject>

          {/* Invisible click catcher */}
          <rect
            x={tooltipX + 16 * baseScale}
            y={tooltipY + tooltipHeight - buttonHeight - 16 * baseScale}
            width={tooltipWidth - 32 * baseScale}
            height={buttonHeight}
            rx={12 * baseScale}
            fill="transparent"
            style={{ cursor: hasUp ? 'pointer' : 'not-allowed' }}
          />
        </g>
      ) : (
        // Two buttons for up and down
        <>
          {/* Up button */}
          <g
            onClick={() => hasUp && handleMove('up')}
            style={{ cursor: hasUp ? 'pointer' : 'not-allowed' }}
          >
            <rect
              x={tooltipX + 16 * baseScale}
              y={tooltipY + tooltipHeight - buttonHeight - 16 * baseScale}
              width={(tooltipWidth - 48 * baseScale) / 2}
              height={buttonHeight}
              rx={12 * baseScale}
              fill={hasUp ? 'url(#button-gradient)' : 'url(#disabled-gradient)'}
              style={{ opacity: hasUp ? 1 : 0.5 }}
            />

            <foreignObject
              x={tooltipX + 16 * baseScale}
              y={tooltipY + tooltipHeight - buttonHeight - 16 * baseScale}
              width={(tooltipWidth - 48 * baseScale) / 2}
              height={buttonHeight}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4 * baseScale,
                  height: '100%',
                  color: '#ffffff',
                  fontWeight: 700,
                  pointerEvents: 'none',
                }}
              >
                <MdArrowUpward style={{ fontSize: buttonFontSize * 1.4 }} />
                <span style={{ fontSize: buttonFontSize * 0.8 }}>
                  {isMultiFloorActive ? 'CONTINUE' : 'UP'}
                </span>
                <span style={{ fontSize: buttonFontSize * 0.75, opacity: 0.9 }}>
                  {hasUp ? upLabel : ''}
                </span>
              </div>
            </foreignObject>

            <rect
              x={tooltipX + 16 * baseScale}
              y={tooltipY + tooltipHeight - buttonHeight - 16 * baseScale}
              width={(tooltipWidth - 48 * baseScale) / 2}
              height={buttonHeight}
              rx={12 * baseScale}
              fill="transparent"
              style={{ cursor: hasUp ? 'pointer' : 'not-allowed' }}
            />
          </g>

          {/* Down button */}
          <g
            onClick={() => hasDown && handleMove('down')}
            style={{ cursor: hasDown ? 'pointer' : 'not-allowed' }}
          >
            <rect
              x={tooltipX + tooltipWidth / 2 + 8 * baseScale}
              y={tooltipY + tooltipHeight - buttonHeight - 16 * baseScale}
              width={(tooltipWidth - 48 * baseScale) / 2}
              height={buttonHeight}
              rx={12 * baseScale}
              fill={hasDown ? 'url(#button-gradient)' : 'url(#disabled-gradient)'}
              style={{ opacity: hasDown ? 1 : 0.5 }}
            />

            <foreignObject
              x={tooltipX + tooltipWidth / 2 + 8 * baseScale}
              y={tooltipY + tooltipHeight - buttonHeight - 16 * baseScale}
              width={(tooltipWidth - 48 * baseScale) / 2}
              height={buttonHeight}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4 * baseScale,
                  height: '100%',
                  color: '#ffffff',
                  fontWeight: 700,
                  pointerEvents: 'none',
                }}
              >
                <MdArrowDownward style={{ fontSize: buttonFontSize * 1.4 }} />
                <span style={{ fontSize: buttonFontSize * 0.8 }}>DOWN</span>
                <span style={{ fontSize: buttonFontSize * 0.75, opacity: 0.9 }}>
                  {hasDown ? downLabel : ''}
                </span>
              </div>
            </foreignObject>

            <rect
              x={tooltipX + tooltipWidth / 2 + 8 * baseScale}
              y={tooltipY + tooltipHeight - buttonHeight - 16 * baseScale}
              width={(tooltipWidth - 48 * baseScale) / 2}
              height={buttonHeight}
              rx={12 * baseScale}
              fill="transparent"
              style={{ cursor: hasDown ? 'pointer' : 'not-allowed' }}
            />
          </g>
        </>
      )}
    </g>
  );
}