import React from 'react';
import { Dungeon, PlayerStats, ClimateState } from '../types';
import { soundManager } from '../utils/audio';
import {
  Castle,
  ArrowLeft,
  Sparkles,
  Lock,
  CheckCircle2,
  Apple,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';

interface DungeonSelectProps {
  dungeons: Dungeon[];
  stats: PlayerStats;
  climate: ClimateState;
  onEnterDungeon: (dungeon: Dungeon) => void;
  onBack: () => void;
}

export const DungeonSelect: React.FC<DungeonSelectProps> = ({
  dungeons,
  stats,
  climate,
  onEnterDungeon,
  onBack,
}) => {
  const handleEnter = (dungeon: Dungeon) => {
    if (climate.food < dungeon.requiredFood) return;
    soundManager.playSkill();
    onEnterDungeon(dungeon);
  };

  return (
    <div id="dungeon-select-root" className="max-w-4xl mx-auto px-4 py-6 space-y-6">
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

        <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>위기 던전 출몰 구역</span>
        </span>
      </div>

      {/* Hero Overview */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-950 via-stone-900 to-slate-950 border border-indigo-700/50 shadow-xl">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-3 border border-indigo-500/30">
            <Castle className="w-4 h-4" />
            <span>기후 이상 출몰 던전</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
            특별 보스를 격파하고 대지를 구원하라
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-medium">
            심각한 기후 위기가 뭉쳐져 형성된 특별 던전들입니다. 각 던전에 잠복한 보스를 물리치면 대량의 묘목 씨앗과 전설적인 보상이 주어집니다.
          </p>
        </div>
      </div>

      {/* Dungeons List */}
      <div className="space-y-4">
        {dungeons.map((dungeon, index) => {
          const hasFood = climate.food >= dungeon.requiredFood;
          const isUnderleveled = stats.level < dungeon.recommendedLevel;

          return (
            <div
              key={dungeon.id}
              className={`p-6 rounded-3xl border transition-all duration-200 ${
                dungeon.cleared
                  ? 'bg-stone-900/90 border-emerald-700/50'
                  : 'bg-stone-900 border-stone-800 hover:border-indigo-500/50 shadow-lg'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-stone-800 border border-stone-700 flex items-center justify-center text-3xl shrink-0">
                    {dungeon.boss.emoji}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-lg font-bold text-white">{dungeon.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                        권장 Lv.{dungeon.recommendedLevel}
                      </span>
                      {dungeon.cleared && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          정화 완료
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-stone-400 mb-2">{dungeon.subtitle}</p>

                    {/* Boss and Reward preview */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-300">
                      <span>
                        보스: <strong className="text-rose-400">{dungeon.boss.name}</strong> (HP {dungeon.boss.hp})
                      </span>
                      <span>
                        보상: <strong className="text-amber-300">{dungeon.rewardText}</strong>
                      </span>
                    </div>

                    {isUnderleveled && (
                      <div className="mt-2 text-[11px] text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>권장 레벨보다 낮습니다. 마을에서 더 수련 후 진입을 권장합니다!</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Entry Action */}
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="text-right text-xs">
                    <div className="text-stone-400 text-[11px]">필요 식량</div>
                    <div
                      className={`font-bold font-mono flex items-center justify-end gap-1 ${
                        hasFood ? 'text-amber-400' : 'text-stone-500'
                      }`}
                    >
                      <Apple className="w-3.5 h-3.5" />
                      <span>{dungeon.requiredFood}개</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleEnter(dungeon)}
                    disabled={!hasFood}
                    className={`px-5 py-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow ${
                      hasFood
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white hover:scale-105 active:scale-95'
                        : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                    }`}
                  >
                    <span>{dungeon.cleared ? '재도전' : '던전 입장'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
