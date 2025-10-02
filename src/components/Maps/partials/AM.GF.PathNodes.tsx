import { motion } from 'framer-motion';
import { line, curveCatmullRom } from 'd3-shape';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { memo } from 'react';

type Node = { id: string; x: number; y: number };

const AMGFPathNodes = ({ route, nodes }: { route: string[]; nodes: Node[] }) => {
  if (!route || route.length < 2) return null;

  // Extract coordinates of route nodes
  const points = route
    .map((id) => nodes.find((n) => n.id === id))
    .filter((n): n is Node => !!n)
    .map((n) => [n.x, n.y] as [number, number]);

  // Smooth line generator
  const lineGenerator = line<[number, number]>()
    .x((d) => d[0])
    .y((d) => d[1])
    .curve(curveCatmullRom.alpha(1)); // smooth, rounded edges

  const pathData = lineGenerator(points) || '';

  const startNode = points[0];
  const endNode = points[points.length - 1];

  return (
    <g id="current-route">
      {/* Animated flowing path */}
      <motion.path
        d={pathData}
        stroke="#FF0000"
        strokeWidth={15}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="10 20"
        initial={{ strokeDashoffset: 1000 }}
        animate={{ strokeDashoffset: 0 }}
        transition={{
          repeat: Infinity,
          ease: 'linear',
          duration: 10,
        }}
      />

      {/* Start node circle */}
      {startNode && (
        <circle
          cx={startNode[0]}
          cy={startNode[1]}
          r={30}
          fill="#4CAF50"
          stroke="black"
          strokeWidth={2}
        />
      )}

      {/* End node pin */}
      {endNode && (
        <foreignObject x={endNode[0] - 44} y={endNode[1] - 80} width={85} height={85}>
          <FaMapMarkerAlt size={85} color="blue" style={{ outline: 'white' }} />
        </foreignObject>
      )}
    </g>
  );
}

export default memo(AMGFPathNodes)