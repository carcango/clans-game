import React from 'react';
import { ArrowRight, Crown, Flag, Swords } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import ScreenShell from './ui/screen-shell';

interface MainMenuProps {
  onCampaign: () => void;
  onSkirmish: () => void;
  onHeroArena: () => void;
}

interface MenuMode {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  action: () => void;
  accent: string;
  iconBg: string;
}

const MainMenu: React.FC<MainMenuProps> = ({ onCampaign, onSkirmish, onHeroArena }) => {
  const modes: MenuMode[] = [
    {
      id: 'campaign',
      title: 'Campaign',
      subtitle: 'Travel the world map, recruit troops, and progress your warband.',
      icon: <Flag className="h-6 w-6" aria-hidden="true" />,
      action: onCampaign,
      accent: 'text-[var(--color-tertiary)]',
      iconBg: 'border-[var(--color-tertiary)]/30 bg-[rgba(90,138,168,0.15)] text-[var(--color-tertiary)]',
    },
    {
      id: 'skirmish',
      title: 'Skirmish Sandbox',
      subtitle: 'Build both armies, choose your hero stack, and run custom battles.',
      icon: <Swords className="h-6 w-6" aria-hidden="true" />,
      action: onSkirmish,
      accent: 'text-[var(--color-secondary)]',
      iconBg: 'border-[var(--color-secondary-light)] bg-[rgba(107,79,160,0.15)] text-[var(--color-secondary-light)]',
    },
    {
      id: 'hero',
      title: 'Hero Arena',
      subtitle: 'Pick one class and survive endless waves as long as possible.',
      icon: <Crown className="h-6 w-6" aria-hidden="true" />,
      action: onHeroArena,
      accent: 'text-[var(--color-primary)]',
      iconBg: 'border-[var(--color-primary)]/30 bg-[rgba(212,168,67,0.15)] text-[var(--color-primary)]',
    },
  ];

  return (
    <ScreenShell contentClassName="flex h-full items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-3xl space-y-8">
        <div className="space-y-4 text-center">
          <h1 className="animate-float font-display text-7xl font-bold tracking-[0.12em] uppercase text-[var(--color-text-heading)] sm:text-8xl">
            Clans
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-[var(--color-text-muted)] sm:text-base">
            Simple tactical battles in a clean voxel world. Choose a mode and jump in.
          </p>
        </div>

        <div className="mx-auto flex items-center justify-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-secondary)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-tertiary)]" />
        </div>

        <Card className="w-full">
          <CardContent className="grid gap-3 p-4 sm:p-6">
            {modes.map((mode, index) => (
              <Button
                key={mode.id}
                variant="secondary"
                onClick={mode.action}
                className={`animate-bounce-in-up stagger-${index + 1} h-auto w-full justify-between rounded-[var(--radius-xl)] px-4 py-5 text-left`}
              >
                <span className="flex min-w-0 items-center gap-4">
                  <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border-2 ${mode.iconBg}`}>
                    {mode.icon}
                  </span>
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="text-base font-semibold text-[var(--color-text-heading)]">{mode.title}</span>
                    <span className="text-xs text-[var(--color-text-muted)] sm:text-sm">{mode.subtitle}</span>
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden="true" />
              </Button>
            ))}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-[var(--color-text-muted)]/60">
          WASD Move · Mouse Look · Left Click Attack · Right Click Block · Q Ability
        </p>
      </div>
    </ScreenShell>
  );
};

export default MainMenu;
