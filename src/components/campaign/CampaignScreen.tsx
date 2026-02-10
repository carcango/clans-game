import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ArmyUnit } from '../../types/army';
import {
  CampaignHero,
  CampaignParty,
  CampaignSkillId,
  CampaignState,
  CampaignTroopStack,
  AttributeId,
} from '../../types/campaign';
import {
  BATTLE_SIDE_CAP,
  HERO_CLASSES,
  HERO_RESPEC_COST,
  TROOP_RECRUIT_COSTS,
  createInitialCampaignState,
  calculateExperienceForLevel,
} from '../../constants/campaign';
import {
  applySurvivorCounts,
  buildArmyUnitsForBattle,
  calculateAverageEnemyTier,
  calculateGoldReward,
  calculateHeroXpReward,
  canUpgradeStack,
  getDeployCapForPlayer,
  getPartyCap,
  getSelectedEnemy,
  getSelectedLocation,
  getSkillRequirementLevel,
  getStackTroopCount,
  getTacticsAllyDamageMultiplier,
  getTrackingModifier,
  getUpgradeCostForStack,
  getHeroBattleModifiers,
  mergeStacks,
  splitStacksForDeployment,
  upgradeStack,
} from '../../campaign/rules';
import { clearCampaignSave, loadCampaignSave, saveCampaignState } from '../../campaign/save';
import WorldMapScreen from './WorldMapScreen';
import TownScreen from './TownScreen';
import CharacterScreen from './CharacterScreen';
import CampaignBattleScreen from './CampaignBattleScreen';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import FullscreenDialog from '../ui/fullscreen-dialog';
import ScreenShell from '../ui/screen-shell';
import GameToaster from '../ui/game-toaster';

interface CampaignScreenProps {
  onBackToMenu: () => void;
}

interface BattleContext {
  playerArmy: ArmyUnit[];
  enemyArmy: ArmyUnit[];
  enemyId: string;
  deployedStacks: CampaignTroopStack[];
  reserveStacks: CampaignTroopStack[];
  avgEnemyTier: number;
  enemyTotal: number;
  deployedAllyTotal: number;
}

const savedCampaign = loadCampaignSave();

function getPartyStrength(party: CampaignParty) {
  return party.stacks.reduce((total, stack) => total + stack.count * (1 + (stack.tier - 1) * 0.5), 0);
}

function applyHeroXp(hero: CampaignHero, xpGain: number): CampaignHero {
  let xp = hero.xp + xpGain;
  let level = hero.level;
  let xpToNext = hero.xpToNext;
  let attributePoints = hero.attributePoints;
  let skillPoints = hero.skillPoints;

  while (xp >= xpToNext) {
    xp -= xpToNext;
    level += 1;
    attributePoints += 1;
    skillPoints += 1;
    xpToNext = calculateExperienceForLevel(level);
  }

  return {
    ...hero,
    xp,
    level,
    xpToNext,
    attributePoints,
    skillPoints,
  };
}

const CampaignScreen: React.FC<CampaignScreenProps> = ({ onBackToMenu }) => {
  const [campaign, setCampaign] = useState<CampaignState>(savedCampaign?.state ?? createInitialCampaignState());
  const [showClassPicker, setShowClassPicker] = useState(!savedCampaign);
  const [battleContext, setBattleContext] = useState<BattleContext | null>(null);

  const campaignRef = useRef(campaign);
  const aiVelocitiesRef = useRef<Map<string, { vx: number; vy: number }>>(new Map());

  useEffect(() => {
    campaignRef.current = campaign;
  }, [campaign]);

  useEffect(() => {
    if (!showClassPicker) {
      saveCampaignState(campaign);
    }
  }, [campaign, showClassPicker]);

  useEffect(() => {
    let frameId = 0;

    const updateAI = () => {
      setCampaign((prev) => {
        if (showClassPicker || prev.mode === 'battle') return prev;

        const trackingLevel = getTrackingModifier(prev.hero);
        const playerStrength = getPartyStrength(prev.playerParty);

        const updatedEnemies = prev.enemyParties.map((party) => {
          if (!aiVelocitiesRef.current.has(party.id)) {
            aiVelocitiesRef.current.set(party.id, { vx: 0, vy: 0 });
          }
          const velocity = aiVelocitiesRef.current.get(party.id)!;

          let targetX = party.x;
          let targetY = party.y;
          let desiredSpeed = 0;

          if (party.faction === 'bandit') {
            const partyStrength = getPartyStrength(party);
            const ratio = playerStrength <= 0 ? 999 : partyStrength / playerStrength;
            const dx = prev.playerParty.x - party.x;
            const dy = prev.playerParty.y - party.y;
            const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);
            const banditVisionRange = Math.max(90, 180 - trackingLevel * 10);

            if (ratio > 0.7 && distanceToPlayer < banditVisionRange && distanceToPlayer > 0) {
              targetX = prev.playerParty.x;
              targetY = prev.playerParty.y;
              desiredSpeed = 0.58;
            } else if (distanceToPlayer < 140) {
              targetX = party.x - dx;
              targetY = party.y - dy;
              desiredSpeed = 0.78;
            } else if (!party.aiTarget || Math.random() < 0.02) {
              const angle = Math.random() * Math.PI * 2;
              const dist = 100;
              targetX = party.x + Math.cos(angle) * dist;
              targetY = party.y + Math.sin(angle) * dist;
              desiredSpeed = 0.32;
            }
          } else if (party.faction !== 'player') {
            const bandits = prev.enemyParties.filter((entry) => entry.faction === 'bandit');
            const lordVisionRange = 250;

            let closest: CampaignParty | null = null;
            let minDistance = Infinity;
            for (const bandit of bandits) {
              const dx = bandit.x - party.x;
              const dy = bandit.y - party.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < minDistance && dist < lordVisionRange) {
                minDistance = dist;
                closest = bandit;
              }
            }

            if (closest) {
              targetX = closest.x;
              targetY = closest.y;
              desiredSpeed = 0.7;
            } else if (!party.aiTarget || Math.random() < 0.02) {
              const angle = Math.random() * Math.PI * 2;
              const dist = 80;
              targetX = party.x + Math.cos(angle) * dist;
              targetY = party.y + Math.sin(angle) * dist;
              desiredSpeed = 0.42;
            }
          }

          const dx = targetX - party.x;
          const dy = targetY - party.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 5 && desiredSpeed > 0) {
            const desiredVx = (dx / distance) * desiredSpeed;
            const desiredVy = (dy / distance) * desiredSpeed;
            const acceleration = 0.1;
            velocity.vx += (desiredVx - velocity.vx) * acceleration;
            velocity.vy += (desiredVy - velocity.vy) * acceleration;
          } else {
            velocity.vx *= 0.95;
            velocity.vy *= 0.95;
          }

          return {
            ...party,
            x: Math.max(50, Math.min(1150, party.x + velocity.vx)),
            y: Math.max(50, Math.min(750, party.y + velocity.vy)),
          };
        });

        const toRemove = new Set<string>();
        for (const lord of updatedEnemies) {
          if (lord.faction === 'bandit' || lord.faction === 'player') continue;
          for (const bandit of updatedEnemies) {
            if (bandit.faction !== 'bandit' || toRemove.has(lord.id) || toRemove.has(bandit.id)) continue;
            const dx = lord.x - bandit.x;
            const dy = lord.y - bandit.y;
            if (Math.sqrt(dx * dx + dy * dy) < 25) {
              if (Math.random() < 0.8) {
                toRemove.add(bandit.id);
              } else {
                toRemove.add(lord.id);
              }
            }
          }
        }

        const filteredEnemies = updatedEnemies.filter((enemy) => !toRemove.has(enemy.id));
        return {
          ...prev,
          enemyParties: filteredEnemies,
        };
      });

      frameId = requestAnimationFrame(updateAI);
    };

    frameId = requestAnimationFrame(updateAI);

    const spawnInterval = setInterval(() => {
      setCampaign((prev) => {
        if (showClassPicker) return prev;
        const bandits = prev.enemyParties.filter((party) => party.faction === 'bandit');
        if (bandits.length >= 12) return prev;

        let spawnX = 0;
        let spawnY = 0;
        let attempts = 0;
        while (attempts < 20) {
          spawnX = Math.random() * 1100 + 50;
          spawnY = Math.random() * 700 + 50;
          const dx = spawnX - prev.playerParty.x;
          const dy = spawnY - prev.playerParty.y;
          if (Math.sqrt(dx * dx + dy * dy) >= 200) break;
          attempts += 1;
        }

        const banditNames = ['Forest Bandits', 'Mountain Raiders', 'Desert Outlaws', 'Sea Raiders'];
        const classId = Math.random() < 0.5 ? 'rogue' : 'warrior';
        const stackSize = Math.floor(Math.random() * 6) + 5;

        const newParty: CampaignParty = {
          id: `bandit-${Date.now()}`,
          name: banditNames[Math.floor(Math.random() * banditNames.length)],
          faction: 'bandit',
          x: spawnX,
          y: spawnY,
          stacks: [
            {
              id: `bandit-stack-${Date.now()}`,
              classId,
              tier: 1,
              level: 1,
              count: stackSize,
              xp: 0,
            },
          ],
          isPlayer: false,
          color: '#8b0000',
        };

        return {
          ...prev,
          enemyParties: [...prev.enemyParties, newParty],
        };
      });
    }, 20000);

    return () => {
      cancelAnimationFrame(frameId);
      clearInterval(spawnInterval);
    };
  }, [showClassPicker]);

  const partyCap = getPartyCap(campaign.hero);
  const selectedLocation = getSelectedLocation(campaign);
  const selectedEnemy = getSelectedEnemy(campaign);
  const trackingLevel = getTrackingModifier(campaign.hero);
  const encounterDistance = Math.max(10, 20 - trackingLevel);
  const spottedBandits = campaign.enemyParties.filter((party) => {
    if (party.faction !== 'bandit') return false;
    const dx = party.x - campaign.playerParty.x;
    const dy = party.y - campaign.playerParty.y;
    return Math.sqrt(dx * dx + dy * dy) <= 180 + trackingLevel * 40;
  }).length;

  const selectStartingClass = (classId: string) => {
    const nextCampaign = createInitialCampaignState(classId);
    setCampaign(nextCampaign);
    setBattleContext(null);
    setShowClassPicker(false);
    toast.success(`Campaign started as ${classId}.`);
  };

  const handleStartNewCampaign = useCallback(() => {
    clearCampaignSave();
    setShowClassPicker(true);
  }, []);

  const handleMovePlayer = useCallback((x: number, y: number) => {
    setCampaign((prev) => ({
      ...prev,
      playerParty: {
        ...prev.playerParty,
        x,
        y,
      },
    }));
  }, []);

  const handleEnterLocation = useCallback((locationId: string) => {
    setCampaign((prev) => ({
      ...prev,
      selectedLocationId: locationId,
      mode: 'town',
    }));
  }, []);

  const handleEngageEnemy = useCallback((enemyId: string) => {
    const state = campaignRef.current;
    const enemy = state.enemyParties.find((party) => party.id === enemyId);
    if (!enemy) return;

    if (enemy.faction !== 'bandit') {
      toast.info(`${enemy.name} is not hostile.`);
      return;
    }

    const troopCount = getStackTroopCount(state.playerParty.stacks);
    if (troopCount <= 0) {
      toast.error('You need troops to fight.');
      return;
    }

    const playerArmy = buildArmyUnitsForBattle(state.playerParty.stacks, getDeployCapForPlayer());
    if (playerArmy.length === 0) {
      toast.error('No troops available for deployment.');
      return;
    }

    const enemyArmy = buildArmyUnitsForBattle(enemy.stacks, BATTLE_SIDE_CAP);
    const { deployedStacks, reserveStacks } = splitStacksForDeployment(state.playerParty.stacks, playerArmy);

    setBattleContext({
      playerArmy,
      enemyArmy,
      enemyId: enemy.id,
      deployedStacks,
      reserveStacks,
      avgEnemyTier: calculateAverageEnemyTier(enemyArmy),
      enemyTotal: enemyArmy.reduce((sum, unit) => sum + unit.count, 0),
      deployedAllyTotal: playerArmy.reduce((sum, unit) => sum + unit.count, 0),
    });

    setCampaign((prev) => ({
      ...prev,
      selectedEnemyId: enemy.id,
      mode: 'battle',
    }));
  }, []);

  const handleRecruit = (classId: string) => {
    setCampaign((prev) => {
      const cost = TROOP_RECRUIT_COSTS[classId] ?? 40;
      const total = getStackTroopCount(prev.playerParty.stacks);
      if (prev.gold < cost) {
        toast.error('Not enough gold.');
        return prev;
      }
      if (total >= getPartyCap(prev.hero)) {
        toast.error('Party is full. Increase leadership or lose troops first.');
        return prev;
      }

      const nextStacks = mergeStacks([
        ...prev.playerParty.stacks,
        {
          id: `stack-${Date.now()}`,
          classId,
          tier: 1,
          level: 1,
          count: 1,
          xp: 0,
        },
      ]);

      return {
        ...prev,
        gold: prev.gold - cost,
        playerParty: {
          ...prev.playerParty,
          stacks: nextStacks,
        },
      };
    });
  };

  const handleUpgrade = (stackId: string) => {
    setCampaign((prev) => {
      const stack = prev.playerParty.stacks.find((entry) => entry.id === stackId);
      if (!stack) return prev;
      if (!canUpgradeStack(stack)) {
        toast.error('This stack does not have enough XP yet.');
        return prev;
      }

      const cost = getUpgradeCostForStack(stack);
      if (prev.gold < cost) {
        toast.error('Not enough gold to upgrade.');
        return prev;
      }

      const nextStacks = mergeStacks(
        prev.playerParty.stacks.map((entry) => (entry.id === stackId ? upgradeStack(entry) : entry))
      );

      return {
        ...prev,
        gold: prev.gold - cost,
        playerParty: {
          ...prev.playerParty,
          stacks: nextStacks,
        },
      };
    });
  };

  const handleRespecHeroClass = (classId: string) => {
    setCampaign((prev) => {
      if (prev.hero.classId === classId) return prev;
      if (prev.gold < HERO_RESPEC_COST) {
        toast.error('Not enough gold for respec.');
        return prev;
      }

      toast.success(`Hero class changed to ${classId}.`);

      return {
        ...prev,
        gold: prev.gold - HERO_RESPEC_COST,
        hero: {
          ...prev.hero,
          classId,
        },
      };
    });
  };

  const handleLeaveTown = () => {
    setCampaign((prev) => ({
      ...prev,
      selectedLocationId: null,
      mode: 'worldmap',
    }));
  };

  const handleOpenCharacter = () => {
    setCampaign((prev) => ({ ...prev, mode: 'character' }));
  };

  const handleIncreaseAttribute = (attributeId: AttributeId) => {
    setCampaign((prev) => {
      if (prev.hero.attributePoints <= 0) return prev;
      return {
        ...prev,
        hero: {
          ...prev.hero,
          attributePoints: prev.hero.attributePoints - 1,
          attributes: {
            ...prev.hero.attributes,
            [attributeId]: {
              ...prev.hero.attributes[attributeId],
              value: prev.hero.attributes[attributeId].value + 1,
            },
          },
        },
      };
    });
  };

  const handleIncreaseSkill = (skillId: CampaignSkillId) => {
    setCampaign((prev) => {
      const skill = prev.hero.skills[skillId];
      if (prev.hero.skillPoints <= 0 || skill.level >= skill.maxLevel) return prev;
      const required = getSkillRequirementLevel(skill.level);
      const attrValue = prev.hero.attributes[skill.requiredAttribute].value;
      if (attrValue < required) {
        toast.error(`Need ${skill.requiredAttribute} ${required} to improve ${skill.name}.`);
        return prev;
      }

      return {
        ...prev,
        hero: {
          ...prev.hero,
          skillPoints: prev.hero.skillPoints - 1,
          skills: {
            ...prev.hero.skills,
            [skillId]: {
              ...skill,
              level: skill.level + 1,
            },
          },
        },
      };
    });
  };

  const handleBattleContinue = (result: {
    victory: boolean;
    heroAlive: boolean;
    allySurvivorsByClassLevel: { classId: string; level: number; count: number }[];
    enemySurvivorsByClassLevel: { classId: string; level: number; count: number }[];
    kills: number;
  }) => {
    if (!battleContext) return;

    setCampaign((prev) => {
      const enemySurvivorCount = result.enemySurvivorsByClassLevel.reduce((sum, entry) => sum + entry.count, 0);
      const enemyCasualties = Math.max(0, battleContext.enemyTotal - enemySurvivorCount);
      const goldReward = result.victory ? calculateGoldReward(enemyCasualties, prev.hero.skills.looting.level) : 0;
      const heroXpReward = calculateHeroXpReward(battleContext.avgEnemyTier, result.victory);

      const nextHero = applyHeroXp(prev.hero, heroXpReward);
      const survivorStacks = result.victory
        ? applySurvivorCounts(battleContext.deployedStacks, result.allySurvivorsByClassLevel, 50)
        : [];
      const nextPlayerStacks = mergeStacks([...battleContext.reserveStacks, ...survivorStacks]);

      const nextEnemyParties = result.victory
        ? prev.enemyParties.filter((party) => party.id !== battleContext.enemyId)
        : prev.enemyParties;

      return {
        ...prev,
        mode: 'worldmap',
        gold: prev.gold + goldReward,
        hero: nextHero,
        playerParty: {
          ...prev.playerParty,
          stacks: nextPlayerStacks,
        },
        enemyParties: nextEnemyParties,
        selectedEnemyId: null,
        lastBattleSummary: {
          victory: result.victory,
          casualties: battleContext.deployedAllyTotal - result.allySurvivorsByClassLevel.reduce((sum, e) => sum + e.count, 0),
          enemyCasualties,
          goldReward,
          xpReward: heroXpReward,
        },
      };
    });

    setBattleContext(null);
  };

  const heroBattleLevel = useMemo(() => {
    if (campaign.hero.level >= 3) return 3;
    if (campaign.hero.level <= 1) return 1;
    return 2;
  }, [campaign.hero.level]);

  if (showClassPicker) {
    return (
      <ScreenShell contentClassName="p-0">
        <GameToaster />
        <FullscreenDialog
          open
          title="Start New Campaign"
          description="Choose your banner hero to begin a fresh run."
          preventClose={false}
        >
          <Card variant="elevated" className="mx-auto w-full max-w-3xl">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-2xl">Choose Banner Hero</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 px-6 pb-8 pt-2 sm:px-8">
              <div className="grid gap-4 md:grid-cols-3">
                {HERO_CLASSES.map((heroClass) => (
                  <Button
                    key={heroClass.id}
                    variant="secondary"
                    onClick={() => selectStartingClass(heroClass.id)}
                    className="h-auto min-h-24 flex-col items-center justify-center gap-2.5 rounded-[var(--radius-xl)] px-5 py-6 text-center hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary-strong)]"
                  >
                    <span className="font-display text-base font-bold">{heroClass.name}</span>
                    <span className="text-[11px] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">{heroClass.id}</span>
                  </Button>
                ))}
              </div>
              {savedCampaign && (
                <div className="pt-2 text-center">
                  <Button variant="ghost" onClick={() => setShowClassPicker(false)} className="mx-auto">
                    Keep Existing Save
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </FullscreenDialog>
      </ScreenShell>
    );
  }

  if (campaign.mode === 'town' && selectedLocation) {
    return (
      <>
        <GameToaster />
        <TownScreen
          location={selectedLocation}
          hero={campaign.hero}
          gold={campaign.gold}
          partyCap={partyCap}
          playerParty={campaign.playerParty}
          onRecruit={handleRecruit}
          onUpgrade={handleUpgrade}
          onRespecHeroClass={handleRespecHeroClass}
          onLeave={handleLeaveTown}
        />
      </>
    );
  }

  if (campaign.mode === 'character') {
    return (
      <>
        <GameToaster />
        <CharacterScreen
          hero={campaign.hero}
          onIncreaseAttribute={handleIncreaseAttribute}
          onIncreaseSkill={handleIncreaseSkill}
          onBack={() => setCampaign((prev) => ({ ...prev, mode: 'worldmap' }))}
        />
      </>
    );
  }

  if (campaign.mode === 'battle' && battleContext && selectedEnemy) {
    return (
      <>
        <GameToaster />
        <CampaignBattleScreen
          playerArmy={battleContext.playerArmy}
          enemyArmy={battleContext.enemyArmy}
          playerClassId={campaign.hero.classId}
          playerLevel={heroBattleLevel}
          heroModifiers={getHeroBattleModifiers(campaign.hero)}
          allyDamageMultiplier={getTacticsAllyDamageMultiplier(campaign.hero)}
          onContinue={handleBattleContinue}
        />
      </>
    );
  }

  return (
    <>
      <GameToaster />
      <WorldMapScreen
        playerParty={campaign.playerParty}
        locations={campaign.locations}
        enemyParties={campaign.enemyParties}
        gold={campaign.gold}
        hero={campaign.hero}
        partyCap={partyCap}
        spottedBandits={spottedBandits}
        trackingLevel={trackingLevel}
        encounterDistance={encounterDistance}
        onMovePlayer={handleMovePlayer}
        onEnterLocation={handleEnterLocation}
        onEngageEnemy={handleEngageEnemy}
        onOpenCharacter={handleOpenCharacter}
        onBackToMenu={onBackToMenu}
        onStartNewCampaign={handleStartNewCampaign}
      />
    </>
  );
};

export default CampaignScreen;
