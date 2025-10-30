import React from 'react';
import { MdStairs } from 'react-icons/md';
import ElevatorIcon from '@mui/icons-material/Elevator';
import EscalatorWarningIcon from '@mui/icons-material/EscalatorWarning';
import useMapStore from '@/store/MapStore';
import { floors } from '@/utils/floors';
import useDrawerStore from '@/store/DrawerStore';
import theme from '@/styles/theme';
import { useMediaQuery } from '@mui/material';
import { FaArrowAltCircleDown, FaArrowAltCircleUp, FaTimes } from 'react-icons/fa';

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

  const isMultiFloorActive = multiFloorRoute?.isActive;

  if (!isVertical || !clickedMap) return null;

  const center = centers[clickedMap.id];
  if (!center) return null;

  const currentIndex = floors.findIndex((f) => f.key === currentFloor);
  const isGroundFloor = String(currentFloor ?? '')
    .toLowerCase()
    .includes('ground');

  // Determine which directions are valid for multi-floor route
  let expectedDirection: 'up' | 'down' | 'both' = 'both';
  if (isMultiFloorActive && multiFloorRoute.currentStep < multiFloorRoute.steps.length - 1) {
    const nextStep = multiFloorRoute.steps[multiFloorRoute.currentStep + 1];
    if (nextStep) {
      const nextFloorIndex = floors.findIndex((f) => f.key === nextStep.floor);
      expectedDirection = nextFloorIndex > currentIndex ? 'up' : 'down';
    }
  }

  const hasUp = currentIndex >= 0 && currentIndex < floors.length - 1;
  const hasDown = currentIndex > 0;

  const canGoUp =
    hasUp && (!isMultiFloorActive || expectedDirection === 'up' || expectedDirection === 'both');
  const canGoDown =
    hasDown &&
    (!isMultiFloorActive || expectedDirection === 'down' || expectedDirection === 'both');

  const nextFloor = hasUp ? floors[currentIndex + 1] : undefined;
  const prevFloor = hasDown ? floors[currentIndex - 1] : undefined;
  const currentFloorLabel = currentIndex >= 0 ? floors[currentIndex].name : 'Unknown';
  const upLabel = nextFloor ? nextFloor.name : '';
  const downLabel = prevFloor ? prevFloor.name : '';

  // Responsive scaling
  const baseScale = isMobile ? 2.5 : 3;
  const tooltipWidth = !isGroundFloor ? 320 * baseScale : 300 * baseScale;
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

    if (isMultiFloorActive) {
      const nextStep = multiFloorRoute.steps[multiFloorRoute.currentStep + 1];

      if (nextStep) {
        const nextStepFloorKey = nextStep.floor;
        const nextFloorIndex = floors.findIndex((f) => f.key === nextStepFloorKey);
        const expectedDir = nextFloorIndex > currentIndexLocal ? 'up' : 'down';

        if (direction !== expectedDir) {
          console.warn(`⚠️ Wrong direction! Expected ${expectedDir}, got ${direction}`);
          return;
        }
      }

      console.log(
        `✅ Advancing to step ${multiFloorRoute.currentStep + 2}/${multiFloorRoute.steps.length} (going ${direction})`
      );
      nextRouteStep();
    }

    setSelectedFloorMap(nextFloorLocal.key);
    setIsFloorMapOpen(false);
    setIsExpanded(false);

    if (!isMultiFloorActive) {
      console.log('Manual floor change - resetting map');
      resetMap();
    }
  };

  const handleClose = () => {
    if (isMultiFloorActive) {
      clearMultiFloorRoute();
    }
    resetMap();
  };

  const primary = theme?.palette?.primary?.main ?? '#1976d2';
  const surface = '#ffffff';
  const textPrimary = '#1a1a1a';
  const textSecondary = '#666666';

  // Shared button content component (arrow left + two lines)
  const ButtonContent = ({
    direction,
    title,
    subtitle,
    icon,
  }: {
    direction: 'up' | 'down';
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
  }) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12 * baseScale,
        height: '100%',
        paddingLeft: 8 * baseScale,
        pointerEvents: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <div
        style={{ display: 'flex', flexDirection: 'column', color: '#ffffff', textAlign: 'left' }}
      >
        <div style={{ fontSize: buttonFontSize, fontWeight: 700, lineHeight: 1 }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: buttonFontSize * 0.85, opacity: 0.95 }}>{subtitle}</div>
        )}
      </div>
    </div>
  );

  return (
    <g style={{ pointerEvents: 'all' }} data-vertical-prompt>
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

      <path
        d={`M ${center.x - arrowSize} ${tooltipY + tooltipHeight} 
            L ${center.x} ${tooltipY + tooltipHeight + arrowSize} 
            L ${center.x + arrowSize} ${tooltipY + tooltipHeight} Z`}
        fill={surface}
        stroke="rgba(0,0,0,0.08)"
        strokeWidth={2}
      />

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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 * baseScale }}>
              <div
                style={{
                  fontSize: fontSize,
                  fontWeight: 700,
                  color: textPrimary,
                  lineHeight: 1.2,
                }}
              >
                {isGroundFloor
                  ? isMultiFloorActive
                    ? 'Continue Route'
                    : 'Go Upstairs'
                  : 'Change Floor'}
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
              textAlign: 'start',
              fontWeight: 500,
            }}
          >
            {isMultiFloorActive
              ? `Continue moving ${expectedDirection === 'up' ? 'upward' : expectedDirection === 'down' ? 'downward' : 'your route'}?`
              : 'Which direction would you like to go?'}
          </div>
        </foreignObject>
      )}

      {isGroundFloor ? (
        // Single full-width button (ground)
        <g
          style={{ cursor: canGoUp ? 'pointer' : 'not-allowed' }}
          onClick={() => canGoUp && handleMove('up')}
        >
          <rect
            x={tooltipX + 16 * baseScale}
            y={tooltipY + tooltipHeight - buttonHeight - 16 * baseScale}
            width={tooltipWidth - 32 * baseScale}
            height={buttonHeight}
            rx={12 * baseScale}
            fill={canGoUp ? 'url(#button-gradient)' : 'url(#disabled-gradient)'}
            style={{
              opacity: canGoUp ? 1 : 0.5,
              transition: 'all 0.3s',
            }}
          />

          <foreignObject
            x={tooltipX + 16 * baseScale}
            y={tooltipY + tooltipHeight - buttonHeight - 16 * baseScale}
            width={tooltipWidth - 32 * baseScale}
            height={buttonHeight}
          >
            {/* Arrow left + two-line text */}
            <div style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
              <ButtonContent
                direction="up"
                title={isMultiFloorActive ? 'Continue Route' : 'Go to Upper Floor'}
                subtitle={canGoUp ? upLabel : ''}
                icon={
                  <FaArrowAltCircleUp style={{ fontSize: buttonFontSize * 1.6, color: 'white' }} />
                }
              />
            </div>
          </foreignObject>

          {/* transparent clickable overlay kept for consistent pointer behavior */}
          <rect
            x={tooltipX + 16 * baseScale}
            y={tooltipY + tooltipHeight - buttonHeight - 16 * baseScale}
            width={tooltipWidth - 32 * baseScale}
            height={buttonHeight}
            rx={12 * baseScale}
            fill="transparent"
            style={{ cursor: canGoUp ? 'pointer' : 'not-allowed' }}
          />
        </g>
      ) : (
        // Two side-by-side buttons with the same visual style
        <>
          {/* UP */}
          <g
            style={{ cursor: canGoUp ? 'pointer' : 'not-allowed' }}
            onClick={() => canGoUp && handleMove('up')}
          >
            <rect
              x={tooltipX + 16 * baseScale}
              y={tooltipY + tooltipHeight - buttonHeight - 16 * baseScale}
              width={(tooltipWidth - 48 * baseScale) / 2}
              height={buttonHeight}
              rx={12 * baseScale}
              fill={canGoUp ? 'url(#button-gradient)' : 'url(#disabled-gradient)'}
              style={{ opacity: canGoUp ? 1 : 0.5 }}
            />

            <foreignObject
              x={tooltipX + 16 * baseScale}
              y={tooltipY + tooltipHeight - buttonHeight - 16 * baseScale}
              width={(tooltipWidth - 48 * baseScale) / 2}
              height={buttonHeight}
            >
              <div style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                <ButtonContent
                  direction="up"
                  title={isMultiFloorActive && expectedDirection === 'up' ? 'CONTINUE' : 'UP'}
                  subtitle={canGoUp ? upLabel : ''}
                  icon={<FaArrowAltCircleUp style={{ fontSize: buttonFontSize * 1.4, color: 'white' }} />}
                />
              </div>
            </foreignObject>

            <rect
              x={tooltipX + 16 * baseScale}
              y={tooltipY + tooltipHeight - buttonHeight - 16 * baseScale}
              width={(tooltipWidth - 48 * baseScale) / 2}
              height={buttonHeight}
              rx={12 * baseScale}
              fill="transparent"
              style={{ cursor: canGoUp ? 'pointer' : 'not-allowed' }}
            />
          </g>

          {/* DOWN */}
          <g
            style={{ cursor: canGoDown ? 'pointer' : 'not-allowed' }}
            onClick={() => canGoDown && handleMove('down')}
          >
            <rect
              x={tooltipX + tooltipWidth / 2 + 8 * baseScale}
              y={tooltipY + tooltipHeight - buttonHeight - 16 * baseScale}
              width={(tooltipWidth - 48 * baseScale) / 2}
              height={buttonHeight}
              rx={12 * baseScale}
              fill={canGoDown ? 'url(#button-gradient)' : 'url(#disabled-gradient)'}
              style={{ opacity: canGoDown ? 1 : 0.5 }}
            />

            <foreignObject
              x={tooltipX + tooltipWidth / 2 + 8 * baseScale}
              y={tooltipY + tooltipHeight - buttonHeight - 16 * baseScale}
              width={(tooltipWidth - 48 * baseScale) / 2}
              height={buttonHeight}
            >
              <div style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                <ButtonContent
                  direction="down"
                  title={isMultiFloorActive && expectedDirection === 'down' ? 'CONTINUE' : 'DOWN'}
                  subtitle={canGoDown ? downLabel : ''}
                  icon={<FaArrowAltCircleDown style={{ fontSize: buttonFontSize * 1.4, color: 'white' }} />}
                />
              </div>
            </foreignObject>

            <rect
              x={tooltipX + tooltipWidth / 2 + 8 * baseScale}
              y={tooltipY + tooltipHeight - buttonHeight - 16 * baseScale}
              width={(tooltipWidth - 48 * baseScale) / 2}
              height={buttonHeight}
              rx={12 * baseScale}
              fill="transparent"
              style={{ cursor: canGoDown ? 'pointer' : 'not-allowed' }}
            />
          </g>
        </>
      )}
    </g>
  );
}

export default VerticalTransitionPrompt;
