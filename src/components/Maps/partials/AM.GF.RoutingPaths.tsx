import { useEffect, useState } from "react";
import type { EdgePathTypes } from "../../../App";

export default function AMGFRoutingPaths({
  paths,
  activeIds,
}: {
  paths: EdgePathTypes[];
  activeIds: any[];
}) {
  // store calculated start/end points
  const [points, setPoints] = useState<Record<string, { start: DOMPoint; end: DOMPoint }>>({});

  useEffect(() => {
    const newPoints: Record<string, { start: DOMPoint; end: DOMPoint }> = {};
    paths.forEach((p) => {
      const temp = document.createElementNS("http://www.w3.org/2000/svg", "path");
      temp.setAttribute("d", p.d);
      // get total length
      const len = temp.getTotalLength();
      // ask browser for coordinates at 0 and total length
      const start = temp.getPointAtLength(0);
      const end = temp.getPointAtLength(len);
      newPoints[p.id as string] = { start, end };
    });
    setPoints(newPoints);
  }, [paths]);

  return (
    <g id="RoutingPath">
      {paths.map((p) => {
        const isActive = activeIds.includes(p.id);
        const pt = points[p.id as string];

        return (
          <g key={p.id}>
            <path
              d={p.d}
              stroke={isActive ? "#F02430" : "transparent"}
              strokeWidth={6}
              strokeLinecap="round"
              fill="none"
              className={isActive ? "path-flow" : ""}
            />
            {isActive && pt && (
              <>
                <circle
                  cx={pt.start.x}
                  cy={pt.start.y}
                  r={10}
                  fill="#F02430"
                  stroke="#fff"
                  strokeWidth={2}
                />
                <circle
                  cx={pt.end.x}
                  cy={pt.end.y}
                  r={10}
                  fill="#F02430"
                  stroke="#fff"
                  strokeWidth={2}
                />
              </>
            )}
          </g>
        );
      })}
    </g>
  );
}
