import { memo } from 'react';
import type { ILabels} from '@/types';
import { useTheme } from '@mui/material/styles';

const RoadMarks = ({ roadMarks }: { roadMarks: ILabels[] }) => {
  const theme = useTheme();
  return (
    <g id="RoadMarks">
      {roadMarks.map((roadMark, index) => {
        const themeFill =
          (theme?.palette as any)?.maps?.[roadMark.fill] ?? roadMark.fill;
        return (
          <path
            key={index}
            id={roadMark.name}
            d={roadMark.path}
            fill={themeFill}
          />
        );
      })}
    </g>
  );
};

export default memo(RoadMarks);
