// AMGFPathNodes.tsx (replace the file contents with this)
import { motion, useAnimation } from 'framer-motion';
import { line, curveCatmullRom } from 'd3-shape';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { memo, useEffect, useRef, useState } from 'react';
import type { INodes } from '../../../../interface/BaseMap';
import { ThemeProvider, useMediaQuery, useTheme } from '@mui/material';

interface AMGFPathNodesProps {
  route: string[];
  nodes: INodes[];
}

const AMGFPathNodes = ({ route, nodes }: AMGFPathNodesProps) => {
  if (!route || route.length < 2) return null;

  // Extract coordinates of route nodes in the given order
  const routeNodes = route
    .map((id) => nodes.find((n) => n.id === id))
    .filter((n): n is INodes => !!n);

  const points = routeNodes.map((n) => [n.x, n.y] as [number, number]);

  const lineGenerator = line<[number, number]>()
    .x((d) => d[0])
    .y((d) => d[1])
    .curve(curveCatmullRom.alpha(1));

  const pathData = lineGenerator(points) || '';

  const startNode = routeNodes[0];
  const endNode = routeNodes[routeNodes.length - 1];

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const pathRef = useRef<SVGPathElement | null>(null);
  const [pathLength, setPathLength] = useState(0);

  const controls = useAnimation();

  // ensure pathLength is read after the SVG path is laid out
  useEffect(() => {
    if (!pathRef.current) {
      setPathLength(0);
      return;
    }
    // use requestAnimationFrame to ensure DOM has rendered the new path
    const handle = requestAnimationFrame(() => {
      try {
        const length = pathRef.current?.getTotalLength() ?? 0;
        setPathLength(length);
      } catch (err) {
        // fallback
        setPathLength(0);
      }
    });

    return () => cancelAnimationFrame(handle);
  }, [pathData]); // recalc whenever pathData changes

  // restart / control animation whenever pathLength or the route changes.
  // Use route.join to detect swapped order.
  useEffect(() => {
    if (!pathLength) return;

    // Decide direction: you can choose which end is "start".
    // We'll animate from 0 -> -pathLength (flowing forward).
    // If you'd instead want reversed flow when swapped, flip these values.
    const from = 0;
    const to = -pathLength;

    controls.start({
      strokeDashoffset: [from, to],
      transition: {
        repeat: Infinity,
        ease: 'linear',
        duration: 20,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathLength, route.join('-')]); // include route order so swapping restarts animation

  return (
    <ThemeProvider theme={theme}>
      <g id="current-route">
        {/* Animated flowing path
            - Use key based on pathData so React remounts the element when pathData changes.
            - Use controls (animate={controls}) instead of static animate prop.
        */}
        <motion.path
          ref={pathRef}
          key={route.join('-') /* forces remount when node order changes */}
          d={pathData}
          stroke="#7B48FF"
          strokeWidth={25}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="10 50"
          initial={{ strokeDashoffset: 0 }}
          animate={controls}
        />

        {/* Start node marker (only if entrance) */}
        {startNode?.type === 'entrance' && (
          <circle
            cx={startNode.x}
            cy={startNode.y}
            r={30}
            fill="#7B48FF"
            stroke="black"
            strokeWidth={2}
          />
        )}

        {/* End node pin (only if entrance) */}
        {endNode?.type === 'entrance' && (
          <g transform={`translate(${(endNode.x ?? 0) - 43}, ${(endNode.y ?? 0) - 94})`}>
            <FaMapMarkerAlt className="bounce" size={isMobile ? 90 : 85} color="red" />
          </g>
        )}
      </g>
    </ThemeProvider>
  );
};

export default memo(AMGFPathNodes);
