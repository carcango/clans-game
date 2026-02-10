import { HERO_CLASSES } from './classes';
import {
  AttributeId,
  CampaignHero,
  CampaignLocation,
  CampaignParty,
  CampaignSkillId,
  CampaignState,
  FactionId,
} from '../types/campaign';

export const CAMPAIGN_SAVE_KEY = 'clansCampaignSaveV1';
export { HERO_CLASSES };

export const TROOP_TIER_XP_REQUIREMENTS = {
  '1-2': 100,
  '2-3': 180,
} as const;

export const TROOP_UPGRADE_COSTS = {
  '1-2': 60,
  '2-3': 110,
} as const;

export const TROOP_RECRUIT_COSTS: Record<string, number> = {
  warrior: 35,
  archer: 35,
  rogue: 45,
  mage: 45,
  paladin: 55,
  necromancer: 55,
};

export const TOWN_RECRUIT_POOLS: Record<Exclude<FactionId, 'player' | 'bandit'>, string[]> = {
  swadia: ['warrior', 'paladin', 'archer'],
  vaegirs: ['archer', 'mage', 'warrior'],
  rhodoks: ['paladin', 'necromancer', 'archer'],
  nords: ['warrior', 'rogue', 'paladin'],
  khergit: ['rogue', 'archer', 'mage'],
};

export const HERO_RESPEC_COST = 300;
export const MAX_PARTY_CAP = 30;
export const BASE_PARTY_CAP = 20;
export const BATTLE_SIDE_CAP = 30;

const ATTRIBUTE_TEMPLATE: Record<AttributeId, { name: string; description: string }> = {
  strength: { name: 'Strength', description: 'Improves health and raw damage.' },
  agility: { name: 'Agility', description: 'Improves movement and stamina efficiency.' },
  intelligence: { name: 'Intelligence', description: 'Improves battlefield planning and map awareness.' },
  charisma: { name: 'Charisma', description: 'Improves party size and command authority.' },
};

const SKILL_TEMPLATE: Record<
  CampaignSkillId,
  {
    name: string;
    description: string;
    requiredAttribute: AttributeId;
  }
> = {
  ironflesh: {
    name: 'Ironflesh',
    description: '+8 max health per level in battle.',
    requiredAttribute: 'strength',
  },
  power: {
    name: 'Power',
    description: '+6% hero damage per level in battle.',
    requiredAttribute: 'strength',
  },
  athletics: {
    name: 'Athletics',
    description: '+3% hero move speed per level in battle.',
    requiredAttribute: 'agility',
  },
  leadership: {
    name: 'Leadership',
    description: '+2 party size per level.',
    requiredAttribute: 'charisma',
  },
  tactics: {
    name: 'Tactics',
    description: '+4% allied damage per level in battle.',
    requiredAttribute: 'intelligence',
  },
  looting: {
    name: 'Looting',
    description: '+10% battle gold reward per level.',
    requiredAttribute: 'intelligence',
  },
  tracking: {
    name: 'Tracking',
    description: 'Reduces bandit detection/engage pressure.',
    requiredAttribute: 'intelligence',
  },
};

function nextId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export function createTroopStack(classId: string, level: 1 | 2 | 3, count: number) {
  return {
    id: nextId(`stack-${classId}`),
    classId,
    tier: level,
    level,
    count,
    xp: 0,
  };
}

export function createInitialHero(classId = 'warrior'): CampaignHero {
  const safeClassId = HERO_CLASSES.some((hero) => hero.id === classId) ? classId : 'warrior';

  return {
    classId: safeClassId,
    level: 1,
    xp: 0,
    xpToNext: calculateExperienceForLevel(1),
    attributePoints: 0,
    skillPoints: 0,
    attributes: {
      strength: {
        id: 'strength',
        name: ATTRIBUTE_TEMPLATE.strength.name,
        value: 5,
        description: ATTRIBUTE_TEMPLATE.strength.description,
      },
      agility: {
        id: 'agility',
        name: ATTRIBUTE_TEMPLATE.agility.name,
        value: 5,
        description: ATTRIBUTE_TEMPLATE.agility.description,
      },
      intelligence: {
        id: 'intelligence',
        name: ATTRIBUTE_TEMPLATE.intelligence.name,
        value: 5,
        description: ATTRIBUTE_TEMPLATE.intelligence.description,
      },
      charisma: {
        id: 'charisma',
        name: ATTRIBUTE_TEMPLATE.charisma.name,
        value: 5,
        description: ATTRIBUTE_TEMPLATE.charisma.description,
      },
    },
    skills: {
      ironflesh: {
        id: 'ironflesh',
        name: SKILL_TEMPLATE.ironflesh.name,
        description: SKILL_TEMPLATE.ironflesh.description,
        level: 0,
        maxLevel: 10,
        requiredAttribute: 'strength',
      },
      power: {
        id: 'power',
        name: SKILL_TEMPLATE.power.name,
        description: SKILL_TEMPLATE.power.description,
        level: 0,
        maxLevel: 10,
        requiredAttribute: 'strength',
      },
      athletics: {
        id: 'athletics',
        name: SKILL_TEMPLATE.athletics.name,
        description: SKILL_TEMPLATE.athletics.description,
        level: 0,
        maxLevel: 10,
        requiredAttribute: 'agility',
      },
      leadership: {
        id: 'leadership',
        name: SKILL_TEMPLATE.leadership.name,
        description: SKILL_TEMPLATE.leadership.description,
        level: 0,
        maxLevel: 10,
        requiredAttribute: 'charisma',
      },
      tactics: {
        id: 'tactics',
        name: SKILL_TEMPLATE.tactics.name,
        description: SKILL_TEMPLATE.tactics.description,
        level: 0,
        maxLevel: 10,
        requiredAttribute: 'intelligence',
      },
      looting: {
        id: 'looting',
        name: SKILL_TEMPLATE.looting.name,
        description: SKILL_TEMPLATE.looting.description,
        level: 0,
        maxLevel: 10,
        requiredAttribute: 'intelligence',
      },
      tracking: {
        id: 'tracking',
        name: SKILL_TEMPLATE.tracking.name,
        description: SKILL_TEMPLATE.tracking.description,
        level: 0,
        maxLevel: 10,
        requiredAttribute: 'intelligence',
      },
    },
  };
}

export function createInitialLocations(): CampaignLocation[] {
  return [
    { id: 'town1', name: 'Zendar', type: 'town', x: 300, y: 300, faction: 'swadia' },
    { id: 'town2', name: 'Sargoth', type: 'town', x: 820, y: 430, faction: 'vaegirs' },
    { id: 'village1', name: 'Uslum', type: 'village', x: 500, y: 200, faction: 'nords' },
    { id: 'village2', name: 'Ruldi', type: 'village', x: 630, y: 620, faction: 'rhodoks' },
    { id: 'castle1', name: 'Dhirim', type: 'castle', x: 390, y: 540, faction: 'khergit' },
  ];
}

export function createInitialPlayerParty(heroClassId: string): CampaignParty {
  return {
    id: 'player',
    name: 'Player Warband',
    faction: 'player',
    x: 600,
    y: 400,
    stacks: [
      createTroopStack(heroClassId as string, 1, 2),
      createTroopStack('warrior', 1, heroClassId === 'warrior' ? 1 : 2),
      createTroopStack('archer', 1, heroClassId === 'archer' ? 1 : 2),
    ],
    isPlayer: true,
    color: '#4a90e2',
  };
}

export function createInitialEnemyParties(): CampaignParty[] {
  return [
    {
      id: 'bandit1',
      name: 'Forest Bandits',
      faction: 'bandit',
      x: 400,
      y: 250,
      stacks: [createTroopStack('rogue', 1, 7)],
      isPlayer: false,
      color: '#8b0000',
    },
    {
      id: 'bandit2',
      name: 'Mountain Raiders',
      faction: 'bandit',
      x: 900,
      y: 200,
      stacks: [createTroopStack('warrior', 1, 5), createTroopStack('rogue', 1, 4)],
      isPlayer: false,
      color: '#8b0000',
    },
    {
      id: 'lord1',
      name: 'Lord Haringoth',
      faction: 'swadia',
      x: 300,
      y: 500,
      stacks: [
        createTroopStack('paladin', 3, 3),
        createTroopStack('warrior', 2, 4),
        createTroopStack('archer', 2, 4),
      ],
      isPlayer: false,
      color: '#dc2626',
    },
    {
      id: 'lord2',
      name: 'Count Rafard',
      faction: 'rhodoks',
      x: 220,
      y: 320,
      stacks: [
        createTroopStack('paladin', 3, 3),
        createTroopStack('necromancer', 2, 4),
        createTroopStack('archer', 2, 4),
      ],
      isPlayer: false,
      color: '#9333ea',
    },
    {
      id: 'lord3',
      name: 'Boyar Meriga',
      faction: 'vaegirs',
      x: 980,
      y: 620,
      stacks: [
        createTroopStack('warrior', 2, 4),
        createTroopStack('archer', 3, 3),
        createTroopStack('mage', 2, 4),
      ],
      isPlayer: false,
      color: '#14b8a6',
    },
  ];
}

export function createInitialCampaignState(selectedClassId = 'warrior'): CampaignState {
  const hero = createInitialHero(selectedClassId);
  return {
    mode: 'worldmap',
    gold: 260,
    hero,
    playerParty: createInitialPlayerParty(hero.classId),
    enemyParties: createInitialEnemyParties(),
    locations: createInitialLocations(),
    selectedLocationId: null,
    selectedEnemyId: null,
    lastBattleSummary: null,
  };
}

export function calculateExperienceForLevel(level: number) {
  return Math.floor(100 * Math.pow(level, 1.5));
}
