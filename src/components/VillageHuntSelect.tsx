import React from 'react';
import { Monster, PlayerStats } from '../types';
import { VILLAGE_MONSTERS } from '../data/gameContent';
import { soundManager } from '../utils/audio';
import { ArrowLeft, Swords, Sparkles, ChevronRight, Shield, Zap } from 'lucide-react';

interface VillageHuntSelectProps {
  stats: PlayerStats;
  onSelectMonster: (monster: Monster) => void;
  onBack: () => void;
}

export const VillageHuntSelect: React.FC<VillageHuntSelectProps> = ({
  stats,
  onSelectMonster,
  onBack,
}) => {
  const handleSelect = (m: Monster) => {
    soundManager.playSkill();
    onSelectMonster(m);
  };

  return (
    <div id="village-hunt-select-root" className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>마을로 돌아가기</span>
        </button>

        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>마을 주변 정화 구역</span>
        </span>
      </div>

      {/* Hero Overview */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950 via-stone-900 to-teal-950 border border-emerald-700/50 shadow-xl">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-3 border border-emerald-500/30">
            <Swords className="w-4 h-4" />
            <span>오염 마귀 소탕 작전</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
            초보 마을 주변을 정화하세요
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-medium">
            비닐 슬라임과 매연 고블린 등 처리하기 쉬운 몬스터를 정화하면서 레벨업하고, 드롭되는 쓰레기와 묘목 씨앗, 식량을 수거하여 성장하세요!
          </p>
        </div>
      </div>

      {/* Monster Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {VILLAGE_MONSTERS.map((monster) => (
          <div
            key={monster.id}
            onClick={() => handleSelect(monster)}
            className="group cursor-pointer p-5 rounded-3xl bg-stone-900 border border-stone-800 hover:border-emerald-500/60 hover:bg-stone-850 transition-all duration-200 shadow-md flex flex-col justify-between"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-stone-800 border border-stone-700 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform">
                {monster.emoji}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {monster.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-800 text-stone-300">
                    HP {monster.hp}
                  </span>
                </div>
                <p className="text-xs text-stone-400 mb-2 leading-relaxed">
                  {monster.description}
                </p>

                {/* Drops & Rewards preview */}
                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-medium text-stone-300">
                  <div className="flex items-center gap-1 text-cyan-300">
                    <span>🗑️ 쓰레기 +{monster.wasteDrop}</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-300">
                    <span>🌱 묘목 +{monster.saplingDrop}</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-300">
                    <span>🍞 식량 +{monster.foodDrop}</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-300">
                    <span>⭐ EXP +{monster.expReward}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between text-xs">
              <span className="text-[11px] text-stone-500">
                공격력 {monster.atk} / 방어력 {monster.def}
              </span>
              <button
                type="button"
                className="px-3.5 py-1.5 rounded-xl font-bold bg-emerald-600 group-hover:bg-emerald-500 text-white flex items-center gap-1 transition-colors"
              >
                <span>소탕 출동</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
