import { HeroClass } from '../types/hero';

export const HERO_CLASSES: HeroClass[] = [
  {
    id: 'warrior',
    name: 'Warrior',
    level: 1,
    colors: { primary: 0x457b9d, secondary: 0x1d3557, accent: 0xe63946, skin: 0xffdbac },
    equipment: { head: 'helmet', rightHand: 'sword', leftHand: 'shield' },
  },
  {
    id: 'archer',
    name: 'Archer',
    level: 1,
    colors: { primary: 0x2a9d8f, secondary: 0x264653, accent: 0xe9c46a, skin: 0xffdbac },
    equipment: { head: 'hood', rightHand: 'bow', leftHand: 'empty' },
  },
  {
    id: 'mage',
    name: 'Mage',
    level: 1,
    colors: { primary: 0x6d597a, secondary: 0x355070, accent: 0xb56576, skin: 0xffdbac },
    equipment: { head: 'wizard_hat', rightHand: 'staff', leftHand: 'book' },
  },
  {
    id: 'paladin',
    name: 'Paladin',
    level: 1,
    colors: { primary: 0xeae2b7, secondary: 0xfcbf49, accent: 0xf77f00, skin: 0xffdbac },
    equipment: { head: 'crown', rightHand: 'mace', leftHand: 'shield' },
  },
  {
    id: 'rogue',
    name: 'Rogue',
    level: 1,
    colors: { primary: 0x333333, secondary: 0x111111, accent: 0x990000, skin: 0xe0ac69 },
    equipment: { head: 'mask', rightHand: 'dagger', leftHand: 'dagger' },
  },
  {
    id: 'necromancer',
    name: 'Necromancer',
    level: 1,
    colors: { primary: 0x2d6a4f, secondary: 0x081c15, accent: 0x95d5b2, skin: 0xd3d3d3 },
    equipment: { head: 'hood', rightHand: 'scythe', leftHand: 'orb' },
  },
];
