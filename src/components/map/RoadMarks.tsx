import { memo } from 'react';
import type { ILabels} from '@/types';

const RoadMarks = ({ roadMarks }: { roadMarks: ILabels[] }) => {
  return (
    <g id="RoadMarks">
      {roadMarks.map((roadMark, index) => {
        return (
          <path
            key={index}
            id={roadMark.name}
            d={roadMark.path}
            fill={roadMark.fill}
          />
        );
      })}
    </g>
  );
};

export default memo(RoadMarks);
