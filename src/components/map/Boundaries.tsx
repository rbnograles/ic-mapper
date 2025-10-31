// Boundaries.tsx
import { memo } from "react";
import type { ILabels } from "@/types";
import { useTheme } from "@mui/material/styles";

const Boundaries = ({ boundaries }: { boundaries: ILabels[] }) => {
  const theme = useTheme();

  return (
    <g id="Map Boundaries">
      {boundaries.map((bound, index) => {
        const themeFill =
          (theme?.palette as any)?.maps?.[bound.fill] ?? bound.fill;

        return (
          <path
            key={index}
            id={bound.name}
            d={bound.path}
            fill={themeFill}
            stroke={(theme?.palette as any)?.divider ?? "#B1ABAB"}
            strokeWidth="15"
          />
        );
      })}
    </g>
  );
};

export default memo(Boundaries);
