/**
 * NOTE: Not Currently in used, the idea is them ever we click location, highligh location or point to point search a toll tip 
 * will show displaining location name
 */
import type { IBaseP } from '@/interface';

export const Tooltip = ({
  tooltipWidth,
  closeTooltip,
  onClick,
  p,
}: {
  tooltipWidth: any;
  closeTooltip: () => void;
  onClick?: ((p: any) => void);
  p: IBaseP;
}) => {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        pointerEvents: 'auto',
        zIndex: 99999
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: tooltipWidth,
          background: '#fff',
          color: '#0f172a',
          borderRadius: 10,
          boxShadow: '0 12px 30px rgba(2,6,23,0.18)',
          border: '1px solid rgba(15, 23, 42, 0.06)',
          padding: '14px 16px 12px 16px',
          position: 'relative',
          boxSizing: 'border-box',
          transform: 'translateY(0)',
        }}
      >
        {/* close button (top-right) */}
        <button
          onClick={() => closeTooltip()}
          aria-label="close"
          style={{
            position: 'absolute',
            right: 8,
            top: 8,
            width: 28,
            height: 28,
            borderRadius: 6,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: '#333',
            fontSize: 18,
            lineHeight: '28px',
            padding: 0,
          }}
        >
          ×
        </button>

        {/* content */}
        <div style={{ display: 'flex', gap: 12 }}>
          {/* optional left icon / marker */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#e9eefc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {/* small dot or icon */}
            <div style={{ width: 14, height: 14, borderRadius: 7, background: '#3b82f6' }} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{p.name}</div>
            <div style={{ fontSize: 13, color: '#475569' }}>
              Some short description or action area (customize as needed)
            </div>

            {/* optional actions */}
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  // example action: call parent onClick again or any action
                  onClick?.(p);
                  closeTooltip();
                }}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(15,23,42,0.08)',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Go
              </button>

              <button
                onClick={() => {
                  // placeholder for secondary action
                  closeTooltip();
                }}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#3b82f6',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>

        {/* triangular pointer under the tooltip */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: -10,
            width: 0,
            height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '10px solid #fff',
            filter: 'drop-shadow(0 -2px 6px rgba(2,6,23,0.08))',
          }}
        />
      </div>
    </div>
  );
};
