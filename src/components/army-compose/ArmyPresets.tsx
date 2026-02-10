import React from 'react';
import { ArmyUnit } from '../../types/army';
import { ARMY_PRESETS } from '../../constants/army';
import { Button } from '../ui/button';

interface ArmyPresetsProps {
  onApply: (units: ArmyUnit[]) => void;
}

const ArmyPresets: React.FC<ArmyPresetsProps> = ({ onApply }) => (
  <div className="space-y-2 rounded-[var(--radius-xl)] border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-3">
    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Presets</p>
    <div className="flex flex-wrap gap-2">
      {ARMY_PRESETS.map((preset) => (
        <Button
          key={preset.name}
          onClick={() => onApply(preset.units.map((u) => ({ ...u })))}
          variant="secondary"
          size="sm"
          className="rounded-full"
        >
          {preset.name}
        </Button>
      ))}
    </div>
  </div>
);

export default ArmyPresets;
