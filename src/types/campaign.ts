export type CampaignMode = 'worldmap' | 'town' | 'battle' | 'character';

export type FactionId =
  | 'player'
  | 'bandit'
  | 'swadia'
  | 'rhodoks'
  | 'vaegirs'
  | 'nords'
  | 'khergit';

export type LocationType = 'town' | 'village' | 'castle';
export type AttributeId = 'strength' | 'agility' | 'intelligence' | 'charisma';
export type CampaignSkillId =
  | 'ironflesh'
  | 'power'
  | 'athletics'
  | 'leadership'
  | 'tactics'
  | 'looting'
  | 'tracking';

export interface CampaignAttribute {
  id: AttributeId;
  name: string;
  value: number;
  description: string;
}

export interface CampaignSkill {
  id: CampaignSkillId;
  name: string;
  level: number;
  maxLevel: number;
  requiredAttribute: AttributeId;
  description: string;
}

export interface CampaignTroopStack {
  id: string;
  classId: string;
  tier: 1 | 2 | 3;
  level: 1 | 2 | 3;
  count: number;
  xp: number;
}

export interface CampaignParty {
  id: string;
  name: string;
  faction: FactionId;
  x: number;
  y: number;
  stacks: CampaignTroopStack[];
  isPlayer: boolean;
  color: string;
  aiTarget?: string;
}

export interface CampaignLocation {
  id: string;
  name: string;
  type: LocationType;
  faction: Exclude<FactionId, 'player' | 'bandit'>;
  x: number;
  y: number;
}

export interface CampaignHero {
  classId: string;
  level: number;
  xp: number;
  xpToNext: number;
  attributePoints: number;
  skillPoints: number;
  attributes: Record<AttributeId, CampaignAttribute>;
  skills: Record<CampaignSkillId, CampaignSkill>;
}

export interface BattleSummary {
  victory: boolean;
  casualties: number;
  enemyCasualties: number;
  goldReward: number;
  xpReward: number;
}

export interface CampaignState {
  mode: CampaignMode;
  gold: number;
  hero: CampaignHero;
  playerParty: CampaignParty;
  enemyParties: CampaignParty[];
  locations: CampaignLocation[];
  selectedLocationId: string | null;
  selectedEnemyId: string | null;
  lastBattleSummary: BattleSummary | null;
}

export interface CampaignSaveV1 {
  version: 1;
  updatedAt: number;
  state: CampaignState;
}
