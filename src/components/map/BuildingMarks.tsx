import { memo } from 'react';
import type { ILabels} from '@/types';
import { useTheme } from "@mui/material/styles";


const BuildingMarks = ({ buidingMarks }: { buidingMarks: ILabels[] }) => {
  const theme = useTheme();
  return (
    <g id="Building Marks">
      {buidingMarks.map((bm, index) => {
        const themeFill =
          (theme?.palette as any)?.maps?.[bm.fill] ?? bm.fill;
        return (
          <path
            key={index}
            id={bm.name}
            d={bm.path}
            fill={themeFill}
          />
        );
      })}
    </g>
  );
};

export default memo(BuildingMarks);
