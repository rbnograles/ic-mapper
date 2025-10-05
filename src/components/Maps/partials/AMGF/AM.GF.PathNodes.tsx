import { motion } from 'framer-motion';
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

  // Extract coordinates of route nodes
  const routeNodes = route
    .map((id) => nodes.find((n) => n.id === id))
    .filter((n): n is INodes => !!n);

  const points = routeNodes.map((n) => [n.x, n.y] as [number, number]);

  // Smooth line generator
  const lineGenerator = line<[number, number]>()
    .x((d) => d[0])
    .y((d) => d[1])
    .curve(curveCatmullRom.alpha(1));

  const pathData = lineGenerator(points) || '';

  const startNode = routeNodes[0];
  const endNode = routeNodes[routeNodes.length - 1];

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(1000);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [pathData]);

  return (
    <ThemeProvider theme={theme}>
      <g id="current-route">
        {/* Animated flowing path */}
        <motion.path
          ref={pathRef}
          d={pathData}
          stroke="#7B48FF"
          strokeWidth={25}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="10 50"
          animate={{
            strokeDashoffset: [0, -pathLength], // move dash forward
          }}
          transition={{
            repeat: Infinity,
            ease: 'linear',
            duration: 20, // speed of animation
          }}
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
            <FaMapMarkerAlt
              className="bounce"
              size={isMobile ? 90 : 85} // scale marker for mobile
              color="red"
            />
          </g>
        )}
      </g>
    </ThemeProvider>
  );
};

export default memo(AMGFPathNodes);
