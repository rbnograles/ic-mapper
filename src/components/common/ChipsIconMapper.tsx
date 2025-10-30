import type { JSX } from 'react';
import { FaRunning } from 'react-icons/fa';
import {
    FaBus,
  FaHandHoldingHand,
  FaMasksTheater,
  FaPeopleArrows,
  FaStairs,
} from 'react-icons/fa6';
import { BsBank2 } from 'react-icons/bs';
import { MdHotel } from 'react-icons/md';
import { FaSignsPost } from 'react-icons/fa6';
import { MdEmojiEvents } from 'react-icons/md';
import { GrEscalator } from 'react-icons/gr';
import FlatwareIcon from '@mui/icons-material/Flatware';
import StorefrontIcon from '@mui/icons-material/Storefront';
import WcIcon from '@mui/icons-material/Wc';
import RoomServiceIcon from '@mui/icons-material/RoomService';
import ElevatorIcon from '@mui/icons-material/Elevator';
import DoorFrontIcon from '@mui/icons-material/DoorFront';
import ParkIcon from '@mui/icons-material/Park';

const CHIPS_ICONMAP: Record<string, (style?: React.CSSProperties) => JSX.Element> = {
  'Food & Beverage': (style = {}) => (
    <FlatwareIcon style={{ color: 'white', fontSize: 15, ...style }} />
  ),
  Retail: (style = {}) => <StorefrontIcon style={{ color: 'white', ...style }} />,
  Restroom: (style = {}) => <WcIcon style={{ color: 'white', ...style }} />,
  Services: (style = {}) => (
    <FaHandHoldingHand style={{ color: 'white', fontSize: 15, ...style }} />
  ),
  Concierge: (style = {}) => <RoomServiceIcon style={{ color: 'white', ...style }} />,
  Elevator: (style = {}) => <ElevatorIcon style={{ color: 'white', ...style }} />,
  Escalator: (style = {}) => <GrEscalator style={{ color: 'white', ...style }} />,
  'Entrance/Exit': (style = {}) => <DoorFrontIcon style={{ color: 'white', ...style }} />,
  Park: (style = {}) => <ParkIcon style={{ color: 'white', ...style }} />,
  'Transport Terminal': (style = {}) => <FaBus style={{ color: 'white', ...style }} />,
  Stairs: (style = {}) => <FaStairs style={{ color: 'white', ...style }} />,
  Bank: (style = {}) => <BsBank2 style={{ color: 'white', ...style }} />,
  Entertainment: (style = {}) => <FaMasksTheater style={{ color: 'white', ...style }} />,
  'Fire Exit': (style = {}) => <FaRunning style={{ color: 'white', ...style }} />,
  Hotel: (style = {}) => <MdHotel style={{ color: 'white', ...style }} />,
  Landmark: (style = {}) => <FaSignsPost style={{ color: 'white', ...style }} />,
  'Activity Center': (style = {}) => <MdEmojiEvents style={{ color: 'white', ...style }} />,
  "Jehovah's Witnesses Carts": (style = {}) => (
    <FaPeopleArrows style={{ color: 'white', ...style }} />
  ),
};

export default CHIPS_ICONMAP
