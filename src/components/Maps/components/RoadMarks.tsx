import { memo } from 'react';
import type { Labels } from '../../../interface/BaseMap';

const RoadMarks = ({ roadMarks }: { roadMarks: Labels[] }) => {
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
