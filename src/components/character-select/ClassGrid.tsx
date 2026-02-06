import React from 'react';
import { HeroClass } from '../../types/hero';
import { HERO_CLASSES } from '../../constants/classes';

interface ClassGridProps {
  currentClass: HeroClass;
  onClassSelect: (hero: HeroClass) => void;
  onLevelUp: () => void;
}

const ClassGrid: React.FC<ClassGridProps> = ({ currentClass, onClassSelect, onLevelUp }) => {
  const levelNames = ['Novice', 'Elite', 'Legendary'];
  const levelColors = ['text-slate-400', 'text-blue-400', 'text-amber-400'];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        {HERO_CLASSES.map((cls) => (
          <button
            key={cls.id}
            onClick={() => onClassSelect(cls)}
            className={`px-4 py-2 rounded-lg font-bold transition-all transform hover:scale-105 active:scale-95 border-2 text-sm ${
              currentClass.id === cls.id
                ? 'bg-red-600 border-red-400 text-white shadow-lg'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
            }`}
          >
            {cls.name}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {currentClass.level < 3 && (
          <button
            onClick={onLevelUp}
            className="group relative flex items-center gap-2 px-5 py-2.5 bg-white text-slate-950 rounded-xl font-bold shadow-xl hover:bg-slate-100 transition-all"
          >
            <span>ASCEND HERO</span>
            <div className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </div>
          </button>
        )}
        <div className={`px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs font-bold uppercase tracking-widest ${levelColors[currentClass.level - 1]}`}>
          Lvl {currentClass.level}: {levelNames[currentClass.level - 1]}
        </div>
      </div>
    </div>
  );
};

export default ClassGrid;
