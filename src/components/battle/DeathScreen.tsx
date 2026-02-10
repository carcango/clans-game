import React from 'react';
import { Skull } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import FullscreenDialog from '../ui/fullscreen-dialog';
import { Badge } from '../ui/badge';

interface DeathScreenProps {
  kills: number;
  wave: number;
  alliesRemaining: number;
  onRestart: () => void;
  onChangeHero: () => void;
}

const DeathScreen: React.FC<DeathScreenProps> = ({ kills, wave, alliesRemaining, onRestart, onChangeHero }) => (
  <FullscreenDialog
    open
    title="Fallen In Battle"
    description="The line broke. Re-arm and return stronger."
    preventClose
  >
    <Card variant="elevated" className="mx-auto w-full max-w-xl">
      <CardContent className="space-y-6 p-6 text-center sm:p-8">
        <div className="animate-bounce-in-up stagger-1">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-[var(--color-destructive)]/30 bg-[rgba(196,64,64,0.15)] text-[var(--color-destructive)]">
            <Skull className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>

        <div className="animate-bounce-in-up stagger-2 flex flex-wrap items-center justify-center gap-2">
          <Badge variant="destructive" className="text-sm px-3 py-1.5">Kills {kills}</Badge>
          <Badge variant="secondary" className="text-sm px-3 py-1.5">Wave {wave}</Badge>
          <Badge variant="info" className="text-sm px-3 py-1.5">Allies {alliesRemaining}</Badge>
        </div>

        <div className="animate-bounce-in-up stagger-3">
          <p className="text-sm text-[var(--color-text-muted)]">
            You fought until your formation collapsed. Try again or switch to a different hero.
          </p>
        </div>

        <div className="animate-bounce-in-up stagger-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={onRestart} size="lg" className="min-w-[180px]">
            Fight Again
          </Button>
          <Button onClick={onChangeHero} variant="secondary" className="min-w-[180px]">
            Change Hero
          </Button>
        </div>
      </CardContent>
    </Card>
  </FullscreenDialog>
);

export default DeathScreen;
