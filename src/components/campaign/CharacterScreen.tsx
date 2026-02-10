import React from 'react';
import { CampaignHero, AttributeId, CampaignSkillId } from '../../types/campaign';
import { getSkillRequirementLevel } from '../../campaign/rules';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import ScreenShell from '../ui/screen-shell';
import SectionHeader from '../ui/section-header';

interface CharacterScreenProps {
  hero: CampaignHero;
  onIncreaseAttribute: (attribute: AttributeId) => void;
  onIncreaseSkill: (skill: CampaignSkillId) => void;
  onBack: () => void;
}

const skillsByAttribute: Record<AttributeId, CampaignSkillId[]> = {
  strength: ['ironflesh', 'power'],
  agility: ['athletics'],
  intelligence: ['tactics', 'looting', 'tracking'],
  charisma: ['leadership'],
};

const CharacterScreen: React.FC<CharacterScreenProps> = ({ hero, onIncreaseAttribute, onIncreaseSkill, onBack }) => {
  const xpProgress = Math.min(100, (hero.xp / hero.xpToNext) * 100);

  return (
    <ScreenShell contentClassName="mx-auto flex h-full w-full max-w-6xl flex-col gap-6 p-6 sm:p-8">
      <SectionHeader
        title="Character Sheet"
        subtitle="Allocate attributes and skills to shape your campaign hero."
        eyebrow="Hero"
        action={
          <Button variant="outline" onClick={onBack}>
            Back To Map
          </Button>
        }
      />

      {/* Hero Banner */}
      <Card variant="elevated" className="overflow-hidden">
        <CardContent className="space-y-5 p-6 sm:p-8">
          {/* Level and class - big and prominent */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]">Level</p>
              <p className="font-display text-4xl font-bold text-[var(--color-text)]">{hero.level}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--color-text-muted)]">Experience</p>
              <p className="text-lg font-semibold text-[var(--color-text)]">
                {hero.xp} <span className="text-sm text-[var(--color-text-muted)]">/ {hero.xpToNext}</span>
              </p>
            </div>
          </div>

          {/* XP progress bar - taller */}
          <Progress value={xpProgress} variant="default" className="h-3.5" />

          {/* Available points - separated with more breathing room */}
          <div className="flex items-center gap-4 pt-1">
            <Badge variant={hero.attributePoints > 0 ? 'glow' : 'outline'} className="px-4 py-1.5 text-xs">
              {hero.attributePoints} attribute points
            </Badge>
            <Badge variant={hero.skillPoints > 0 ? 'glow' : 'outline'} className="px-4 py-1.5 text-xs">
              {hero.skillPoints} skill points
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card className="min-h-0 flex-1 overflow-auto">
        <CardContent className="space-y-8 p-6 sm:p-8">
          <Tabs defaultValue="attributes" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="attributes">Attributes</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
            </TabsList>

            <TabsContent value="attributes" className="grid gap-4 pt-6 md:grid-cols-2">
              {(Object.keys(hero.attributes) as AttributeId[]).map((attributeId) => {
                const attribute = hero.attributes[attributeId];
                return (
                  <Card key={attributeId} variant="elevated">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-6">
                        <div className="space-y-3">
                          <div>
                            <p className="font-display text-lg font-bold text-[var(--color-text)]">{attribute.name}</p>
                            <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-text-muted)]">{attribute.description}</p>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="font-display text-3xl font-bold text-[var(--color-primary-strong)]">{attribute.value}</span>
                            <span className="text-xs text-[var(--color-text-muted)]">pts</span>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          onClick={() => onIncreaseAttribute(attributeId)}
                          disabled={hero.attributePoints <= 0}
                          aria-label={`Increase ${attribute.name}`}
                          className="h-11 w-11 shrink-0 rounded-[var(--radius-lg)] text-lg"
                        >
                          +
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="skills" className="space-y-8 pt-6">
              {(Object.keys(hero.attributes) as AttributeId[]).map((attributeId) => {
                const attr = hero.attributes[attributeId];
                const skills = skillsByAttribute[attributeId];
                return (
                  <div key={attributeId}>
                    <h3 className="mb-3 font-display text-lg font-semibold text-[var(--color-text)]">{attr.name} Skills</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {skills.map((skillId) => {
                        const skill = hero.skills[skillId];
                        const minAttr = getSkillRequirementLevel(skill.level);
                        const canLevel =
                          hero.skillPoints > 0 &&
                          skill.level < skill.maxLevel &&
                          hero.attributes[skill.requiredAttribute].value >= minAttr;

                        return (
                          <Card key={skillId} variant="elevated">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between gap-6">
                                <div className="flex-1 space-y-3">
                                  <div>
                                    <p className="text-base font-bold text-[var(--color-text)]">{skill.name}</p>
                                    <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">{skill.description}</p>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-[var(--color-text-muted)]">Requires {skill.requiredAttribute} {minAttr}+</span>
                                      <span className="font-semibold text-[var(--color-text)]">{skill.level} / {skill.maxLevel}</span>
                                    </div>
                                    <Progress value={(skill.level / skill.maxLevel) * 100} variant="ability" className="h-2" />
                                  </div>
                                </div>
                                <Button size="icon" onClick={() => onIncreaseSkill(skillId)} disabled={!canLevel} className="h-11 w-11 shrink-0 rounded-[var(--radius-lg)] text-lg">
                                  +
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </ScreenShell>
  );
};

export default CharacterScreen;
