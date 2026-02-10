import React from 'react';
import { Trophy, ShieldOff } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import FullscreenDialog from '../ui/fullscreen-dialog';
import { Badge } from '../ui/badge';

interface ArmyResultScreenProps {
  victory: boolean;
  survivorCount: number;
  totalAllies: number;
  totalEnemies: number;
  kills: number;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

const ArmyResultScreen: React.FC<ArmyResultScreenProps> = ({
  victory,
  survivorCount,
  totalAllies,
  totalEnemies,
  kills,
  onPlayAgain,
  onBackToMenu,
}) => (
  <FullscreenDialog
    open
    title={victory ? 'Victory' : 'Defeat'}
    description={victory ? 'Your army held the field.' : 'Your warband was overrun.'}
    preventClose
  >
    <Card variant="elevated" className="mx-auto w-full max-w-xl">
      <CardContent className="space-y-6 p-6 text-center sm:p-8">
        <div className="animate-bounce-in-up stagger-1">
          <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 ${victory ? 'border-[var(--color-primary)]/40 bg-[rgba(212,168,67,0.15)] text-[var(--color-primary)]' : 'border-[var(--color-destructive)]/40 bg-[rgba(196,64,64,0.15)] text-[var(--color-destructive)]'}`}>
            {victory ? <Trophy className="h-5 w-5" aria-hidden="true" /> : <ShieldOff className="h-5 w-5" aria-hidden="true" />}
          </div>
        </div>

        <div className="animate-bounce-in-up stagger-2 flex flex-wrap items-center justify-center gap-2">
          <Badge variant="destructive" className="text-sm px-3 py-1.5">Kills {kills}</Badge>
          <Badge variant="info" className="text-sm px-3 py-1.5">
            Survivors {survivorCount}/{totalAllies}
          </Badge>
          <Badge variant="secondary" className="text-sm px-3 py-1.5">Enemy {totalEnemies}</Badge>
        </div>

        <div className="animate-bounce-in-up stagger-3">
          <p className="text-sm text-[var(--color-text-muted)]">
            {victory ? 'Your formation broke the enemy line.' : 'Your formation failed under pressure.'}
          </p>
        </div>

        <div className="animate-bounce-in-up stagger-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={onPlayAgain} size="lg" className="min-w-[180px]">
            Play Again
          </Button>
          <Button onClick={onBackToMenu} variant="secondary" className="min-w-[180px]">
            Main Menu
          </Button>
        </div>
      </CardContent>
    </Card>
  </FullscreenDialog>
);

export default ArmyResultScreen;
