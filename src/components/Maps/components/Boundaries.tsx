import { memo } from 'react';
import type { Labels } from '../../../interface/BaseMap';

const Boundaries = ({boundaries}: {boundaries: Labels[]}) => {
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
