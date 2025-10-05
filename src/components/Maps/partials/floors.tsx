import { Fragment } from "react";
import AMGroundFloor from "../AM.GroundFloor";

export const floors = [
  { key: 'ground', name: 'Ayala Malls Ground Floor', component: AMGroundFloor },
  { key: 'third', name: 'Ayala Malls 3rd Floor', component: () => <Fragment>3rd Floor Map</Fragment> },
  // add new floors here
];