export interface ArmyUnit {
  classId: string;
  level: number;
  count: number;
}

export interface ArmyComposition {
  units: ArmyUnit[];
  totalPoints: number;
}

export interface ArmyBattleResult {
  victory: boolean;
  survivorCount: number;
  totalAllies: number;
  totalEnemies: number;
}
