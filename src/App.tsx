import React, { useState, useCallback } from 'react';
import { HeroClass } from './types/hero';
import { ArmyUnit } from './types/army';
import MainMenu from './components/MainMenu';
import CharacterSelectScreen from './components/character-select/CharacterSelectScreen';
import BattleScreen from './components/battle/BattleScreen';
import ArmyComposeScreen from './components/army-compose/ArmyComposeScreen';
import ArmyBattleScreen from './components/army-battle/ArmyBattleScreen';
import CampaignScreen from './components/campaign/CampaignScreen';

type Phase =
  | 'main-menu'
  | 'campaign'
  | 'hero-select'
  | 'hero-arena'
  | 'skirmish-compose'
  | 'skirmish-battle';

interface ArmyBattleConfig {
  playerArmy: ArmyUnit[];
  enemyArmy: ArmyUnit[];
  playerClassId: string;
  playerLevel: number;
}

const App: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('main-menu');
  const [selectedHero, setSelectedHero] = useState<HeroClass | null>(null);
  const [armyConfig, setArmyConfig] = useState<ArmyBattleConfig | null>(null);

  // Main menu
  const handleCampaign = useCallback(() => setPhase('campaign'), []);
  const handleSkirmish = useCallback(() => setPhase('skirmish-compose'), []);
  const handleHeroArena = useCallback(() => setPhase('hero-select'), []);

  // Hero arena flow
  const handleStartBattle = useCallback((heroClass: HeroClass) => {
    setSelectedHero(heroClass);
    setPhase('hero-arena');
  }, []);

  const handleChangeHero = useCallback(() => {
    setSelectedHero(null);
    setPhase('hero-select');
  }, []);

  // Skirmish flow
  const handleStartArmyBattle = useCallback((
    playerArmy: ArmyUnit[],
    enemyArmy: ArmyUnit[],
    playerClassId: string,
    playerLevel: number
  ) => {
    setArmyConfig({ playerArmy, enemyArmy, playerClassId, playerLevel });
    setPhase('skirmish-battle');
  }, []);

  const handleArmyPlayAgain = useCallback(() => {
    setArmyConfig(null);
    setPhase('skirmish-compose');
  }, []);

  const handleBackToMenu = useCallback(() => {
    setSelectedHero(null);
    setArmyConfig(null);
    setPhase('main-menu');
  }, []);

  if (phase === 'campaign') {
    return <CampaignScreen onBackToMenu={handleBackToMenu} />;
  }

  if (phase === 'hero-arena' && selectedHero) {
    return (
      <BattleScreen
        key={`${selectedHero.id}-${selectedHero.level}-${Date.now()}`}
        heroClass={selectedHero}
        onChangeHero={handleChangeHero}
      />
    );
  }

  if (phase === 'hero-select') {
    return <CharacterSelectScreen onStartBattle={handleStartBattle} />;
  }

  if (phase === 'skirmish-compose') {
    return (
      <ArmyComposeScreen
        onStartBattle={handleStartArmyBattle}
        onBack={handleBackToMenu}
      />
    );
  }

  if (phase === 'skirmish-battle' && armyConfig) {
    return (
      <ArmyBattleScreen
        key={`army-${Date.now()}`}
        playerArmy={armyConfig.playerArmy}
        enemyArmy={armyConfig.enemyArmy}
        playerClassId={armyConfig.playerClassId}
        playerLevel={armyConfig.playerLevel}
        onPlayAgain={handleArmyPlayAgain}
        onBackToMenu={handleBackToMenu}
      />
    );
  }

  return (
    <MainMenu
      onCampaign={handleCampaign}
      onSkirmish={handleSkirmish}
      onHeroArena={handleHeroArena}
    />
  );
};

export default App;
