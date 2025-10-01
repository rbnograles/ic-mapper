import type { JSX } from 'react';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { GiEscalator } from 'react-icons/gi';
import { FaRestroom } from 'react-icons/fa';
import { FaConciergeBell } from 'react-icons/fa';
import { FaDoorOpen } from 'react-icons/fa';
import { FaElevator, FaStairs } from 'react-icons/fa6';
import { FaBoxesStacked } from 'react-icons/fa6';

const style = {
  default: { color: 'black', fontSize: 500 },
};

const ICON_MAP: Record<string, JSX.Element> = {
  location: <LocationOnIcon style={style.default} />,
  escalator: <GiEscalator style={style.default} />,
  door: <FaDoorOpen style={{ color: 'black', fontSize: 20, margin: 2 }} />,
  elevator: <FaElevator style={{ color: 'white', fontSize: 18, margin: 2 }} />,
  restroom: <FaRestroom style={style.default} />,
  concierge: <FaConciergeBell style={{ color: 'black', fontSize: 20, margin: 2 }} />,
  box: <FaBoxesStacked style={{ color: 'black', fontSize: 20, margin: 2 }} />,
  stairs: <FaStairs style={{ color: 'black', fontSize: 500, margin: 2 }} />,
};

export default ICON_MAP;