import { memo } from 'react';
import type { ILabels} from '@/interface';

const Boundaries = ({boundaries}: {boundaries: ILabels[]}) => {
  return (
    <g id="Map Boundaries">
      {boundaries.map((bound, index) => {
        return (
          <path
            key={index}
            id={bound.name}
            d={bound.path}
            fill={bound.fill}
            stroke="#B1ABAB"
            strokeWidth="15"
          />
        );
      })}
    </g>
  );
};

export default memo(Boundaries);
