import type { JSX } from 'react';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EscalatorIcon from '@mui/icons-material/Escalator';
import DoorSlidingIcon from '@mui/icons-material/DoorSliding';
import ElevatorIcon from '@mui/icons-material/Elevator';
import WcIcon from '@mui/icons-material/Wc';

const style = {
  default: { color: 'white', fontSize: 22 },
}

const ICON_MAP: Record<string, JSX.Element> = {
    location: <LocationOnIcon style={style.default} />,
    escalator: <EscalatorIcon style={style.default} />,
    door: <DoorSlidingIcon style={style.default} />,
    elevator: <ElevatorIcon style={style.default} />,
    restroom: <WcIcon style={style.default} />,
};

export default ICON_MAP;