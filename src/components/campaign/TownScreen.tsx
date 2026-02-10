import React from 'react';
import { HERO_CLASSES } from '../../constants/classes';
import { HERO_RESPEC_COST, TROOP_RECRUIT_COSTS, TOWN_RECRUIT_POOLS } from '../../constants/campaign';
import { canUpgradeStack, getStackTroopCount, getUpgradeCostForStack } from '../../campaign/rules';
import { CampaignHero, CampaignLocation, CampaignParty } from '../../types/campaign';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import ScreenShell from '../ui/screen-shell';
import SectionHeader from '../ui/section-header';

interface TownScreenProps {
  location: CampaignLocation;
  hero: CampaignHero;
  gold: number;
  partyCap: number;
  playerParty: CampaignParty;
  onRecruit: (classId: string) => void;
  onUpgrade: (stackId: string) => void;
  onRespecHeroClass: (classId: string) => void;
  onLeave: () => void;
}

const TownScreen: React.FC<TownScreenProps> = ({
  location,
  hero,
  gold,
  partyCap,
  playerParty,
  onRecruit,
  onUpgrade,
  onRespecHeroClass,
  onLeave,
}) => {
  const recruitPool = TOWN_RECRUIT_POOLS[location.faction];
  const totalTroops = getStackTroopCount(playerParty.stacks);

  return (
    <ScreenShell contentClassName="mx-auto flex h-full w-full max-w-7xl flex-col gap-6 p-6 sm:p-8">
      <SectionHeader
        title={location.name}
        subtitle={`${location.type} of ${location.faction}`}
        eyebrow="Town"
        action={
          <Button variant="outline" onClick={onLeave}>
            Return To Map
          </Button>
        }
      />

      {/* Resource Bar */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--color-gold)]">Gold</span>
          <span className="font-display text-xl font-bold text-[var(--color-text)]">{gold}</span>
        </div>
        <div className="h-1 w-1 rounded-full bg-[var(--color-primary)]/40" />
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]">Army</span>
          <span className="font-display text-xl font-bold text-[var(--color-text)]">{totalTroops}<span className="text-sm text-[var(--color-text-muted)]">/{partyCap}</span></span>
        </div>
        <div className="h-1 w-1 rounded-full bg-[var(--color-primary)]/40" />
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]">Hero</span>
          <span className="font-display text-xl font-bold text-[var(--color-text)]">{hero.classId}</span>
        </div>
      </div>

      {/* Decorative separator */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent" />

      <Card className="min-h-0 flex-1 overflow-auto">
        <CardContent className="space-y-6 p-6 sm:p-8">
          <Tabs defaultValue="recruit" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="recruit">Recruit</TabsTrigger>
              <TabsTrigger value="upgrades">Upgrades</TabsTrigger>
              <TabsTrigger value="hero">Hero Class</TabsTrigger>
            </TabsList>

            <TabsContent value="recruit" className="grid gap-4 pt-6 md:grid-cols-3">
              {recruitPool.map((classId) => {
                const heroClass = HERO_CLASSES.find((entry) => entry.id === classId);
                const cost = TROOP_RECRUIT_COSTS[classId] ?? 40;
                const isFull = totalTroops >= partyCap;
                return (
                  <Card key={classId} variant="elevated">
                    <CardContent className="space-y-4 p-6">
                      <div>
                        <div className="text-xl font-bold font-display text-[var(--color-primary-strong)]">{heroClass?.name ?? classId}</div>
                        <div className="mt-1 text-xs text-[var(--color-text-muted)]">Tier 1 Initiate</div>
                      </div>
                      <div className="text-sm font-semibold text-[var(--color-text)]">
                        <span className="text-[var(--color-gold)]">{cost}</span> gold
                      </div>
                      <div className="h-px w-full bg-[var(--color-border)]" />
                      <Button className="w-full" onClick={() => onRecruit(classId)} disabled={gold < cost || isFull}>
                        Recruit
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="upgrades" className="space-y-4 pt-6">
              {playerParty.stacks.length === 0 && (
                <Card>
                  <CardContent className="p-5 text-sm text-[var(--color-text-muted)]">No troops in party.</CardContent>
                </Card>
              )}

              {playerParty.stacks.map((stack) => {
                const heroClass = HERO_CLASSES.find((entry) => entry.id === stack.classId);
                const ready = canUpgradeStack(stack);
                const cost = getUpgradeCostForStack(stack);
                const maxTier = stack.tier >= 3;
                const requiredXp = stack.tier === 1 ? 100 : stack.tier === 2 ? 180 : 0;

                return (
                  <Card key={stack.id}>
                    <CardContent className="p-5">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <div className="text-lg font-semibold font-display text-[var(--color-text)]">
                              {heroClass?.name ?? stack.classId}
                            </div>
                            <Badge variant="secondary">Tier {stack.tier}</Badge>
                          </div>
                          <div className="mt-2 space-y-1">
                            <div className="text-xs text-[var(--color-text-muted)]">
                              Count: {stack.count}
                            </div>
                            <div className="text-xs text-[var(--color-text-muted)]">
                              XP: {stack.xp}{!maxTier && ` / ${requiredXp}`}
                            </div>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => onUpgrade(stack.id)} disabled={!ready || maxTier || gold < cost}>
                          {maxTier ? 'Max Tier' : `Upgrade (${cost}g)`}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="hero" className="space-y-4 pt-6">
              <Card variant="elevated">
                <CardContent className="space-y-5 p-6">
                  <div className="text-base text-[var(--color-text-muted)]">
                    Respec cost: <span className="text-[var(--color-gold)] font-bold">{HERO_RESPEC_COST}</span> gold
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    {HERO_CLASSES.map((heroClass) => (
                      <Button
                        key={heroClass.id}
                        className="min-h-14 text-base"
                        variant={heroClass.id === hero.classId ? 'primary' : 'secondary'}
                        onClick={() => onRespecHeroClass(heroClass.id)}
                        disabled={heroClass.id === hero.classId || gold < HERO_RESPEC_COST}
                      >
                        {heroClass.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </ScreenShell>
  );
};

export default TownScreen;
