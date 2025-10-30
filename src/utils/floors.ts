export interface Floors {
  key: string;
  name: string;
  location: string;
  aliases: string[];
  assets: any;
}

export const floors: Floors[] = [
  {
    key: 'ground',
    name: 'Ground Floor',
    location: 'Ayala Malls',
    aliases: ['Ayala Malls Ground Floor'],
    assets: {},
  },
  {
    key: 'second',
    name: '2nd Floor',
    location: 'Ayala Malls',
    aliases: ['Ayala Malls Second Floor'],
    assets: {},
  },
  {
    key: 'third',
    name: '3rd Floor',
    location: 'Ayala Malls',
    aliases: ['Ayala Malls Third Floor'],
    assets: {},
  },
  {
    key: 'fourth',
    name: '4th Floor',
    location: 'Ayala Malls',
    aliases: ['Ayala Malls Fourth Floor'],
    assets: {},
  },
  {
    key: 'fifth',
    name: '5th Floor',
    location: 'Ayala Malls',
    aliases: ['Ayala Malls Fifth Floor'],
    assets: {},
  },
];
