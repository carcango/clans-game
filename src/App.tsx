import React, { useState, useCallback } from 'react';
import { HeroClass } from './types/hero';
import CharacterSelectScreen from './components/character-select/CharacterSelectScreen';
import BattleScreen from './components/battle/BattleScreen';

type Phase = 'character-select' | 'battle';

const App: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('character-select');
  const [selectedHero, setSelectedHero] = useState<HeroClass | null>(null);

  const handleStartBattle = useCallback((heroClass: HeroClass) => {
    setSelectedHero(heroClass);
    setPhase('battle');
  }, []);

  const handleChangeHero = useCallback(() => {
    setSelectedHero(null);
    setPhase('character-select');
  }, []);

  if (phase === 'battle' && selectedHero) {
    return (
      <BattleScreen
        key={`${selectedHero.id}-${selectedHero.level}-${Date.now()}`}
        heroClass={selectedHero}
        onChangeHero={handleChangeHero}
      />
    );
  }

  return <CharacterSelectScreen onStartBattle={handleStartBattle} />;
};

export default App;
