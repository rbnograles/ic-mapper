import { memo } from 'react';
import type { ILabels} from '@/interface';

const BuildingMarks = ({ buidingMarks }: { buidingMarks: ILabels[] }) => {
  return (
    <g id="Building Marks">
      {buidingMarks.map((bm, index) => {
        return (
          <path
            key={index}
            id={bm.name}
            d={bm.path}
            fill={bm.fill}
          />
        );
      })}
    </g>
  );
};

export default memo(BuildingMarks);
