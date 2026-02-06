export type EquipmentSlot = 'head' | 'rightHand' | 'leftHand' | 'back';

export type EquipmentType =
  | 'helmet' | 'hood' | 'wizard_hat' | 'crown' | 'mask'
  | 'sword' | 'shield' | 'bow' | 'staff' | 'book' | 'mace' | 'dagger' | 'scythe' | 'orb'
  | 'cape' | 'empty';

export interface ColorPalette {
  primary: number;
  secondary: number;
  accent: number;
  skin: number;
}

export interface HeroClass {
  id: string;
  name: string;
  level: number;
  colors: ColorPalette;
  equipment: {
    [key in EquipmentSlot]?: EquipmentType;
  };
}

export type AttackType = 'melee' | 'ranged';
