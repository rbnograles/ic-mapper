import type { JSX } from 'react';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { FaRestroom, FaRunning } from 'react-icons/fa';
import { FaConciergeBell } from 'react-icons/fa';
import { FaDoorOpen } from 'react-icons/fa';
import { FaElevator } from 'react-icons/fa6';
import { FaBoxesStacked } from 'react-icons/fa6';
import { GrEscalator } from 'react-icons/gr';
import { PiStairsFill } from 'react-icons/pi';
import Cart from '@/components/props/Cart';

const style = {
  default: { color: 'white', fontSize: 84 },
};

const ICON_MAP: Record<string, JSX.Element> = {
  location: <LocationOnIcon style={style.default} />,
  Escalator: <GrEscalator style={style.default} />,
  door: <FaDoorOpen style={style.default} />,
  elevator: <FaElevator style={style.default} />,
  restroom: <FaRestroom style={style.default} />,
  concierge: <FaConciergeBell style={style.default} />,
  box: <FaBoxesStacked style={style.default} />,
  stairs: <PiStairsFill style={style.default} />,
  fire: <FaRunning style={style.default} />,
  "Jehovah's Witnesses Carts": <Cart />,
};

export default ICON_MAP;
