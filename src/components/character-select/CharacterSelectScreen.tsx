import React, { useState, useCallback } from 'react';
import { HeroClass } from '../../types/hero';
import { HERO_CLASSES } from '../../constants/classes';
import VoxelPreview from './VoxelPreview';
import ClassGrid from './ClassGrid';
import HeroStatsPanel from './HeroStatsPanel';

interface CharacterSelectScreenProps {
  onStartBattle: (heroClass: HeroClass) => void;
}

const CharacterSelectScreen: React.FC<CharacterSelectScreenProps> = ({ onStartBattle }) => {
  const [currentClass, setCurrentClass] = useState<HeroClass>(HERO_CLASSES[0]);

  const handleClassSelect = useCallback((hero: HeroClass) => {
    setCurrentClass({ ...hero, level: 1 });
  }, []);

  const handleLevelUp = useCallback(() => {
    if (currentClass.level >= 3) return;
    setCurrentClass((prev) => ({ ...prev, level: prev.level + 1 }));
  }, [currentClass.level]);

  return (
    <div className="relative w-full h-screen bg-slate-950 selection:bg-red-500/30">
      {/* 3D Preview */}
      <VoxelPreview heroClass={currentClass} />

      {/* Overlay UI */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 sm:p-10 z-10">
        {/* Top Header */}
        <div className="flex flex-col items-center sm:items-start text-white animate-fade-in">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase font-[var(--font-medieval)]">
            {currentClass.name}
          </h1>
          <div className="h-1 w-24 bg-red-500 mt-2 mb-4" />
        </div>

        {/* Bottom Controls */}
        <div className="flex flex-col sm:flex-row items-end justify-between gap-6 pointer-events-auto">
          <div className="flex flex-col gap-4">
            <ClassGrid
              currentClass={currentClass}
              onClassSelect={handleClassSelect}
              onLevelUp={handleLevelUp}
            />

            <button
              onClick={() => onStartBattle(currentClass)}
              className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-800 rounded-xl font-black text-white text-lg shadow-2xl hover:from-red-500 hover:to-red-700 transition-all transform hover:scale-105 active:scale-95 tracking-wider uppercase"
            >
              Enter Battle
            </button>

            <div className="text-slate-500 text-[10px] uppercase tracking-widest">
              WASD Move | Mouse Look | Left Click Attack | Right Click Block | Q Ability
            </div>
          </div>

          <HeroStatsPanel heroClass={currentClass} />
        </div>
      </div>

      {/* Decorative gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-red-600/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
    </div>
  );
};

export default CharacterSelectScreen;
