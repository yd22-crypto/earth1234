import React from 'react';
import { ClimateState, PlayerStats, UpcycleRecipe } from '../types';
import { soundManager } from '../utils/audio';
import { Recycle, ArrowLeft, Sparkles, Check, Hammer, Trash2, Coins } from 'lucide-react';

interface UpcycleWorkshopProps {
  climate: ClimateState;
  stats: PlayerStats;
  recipes: UpcycleRecipe[];
  onCraftRecipe: (recipeId: string) => void;
  onBack: () => void;
}

export const UpcycleWorkshop: React.FC<UpcycleWorkshopProps> = ({
  climate,
  stats,
  recipes,
  onCraftRecipe,
  onBack,
}) => {
  const handleCraft = (recipe: UpcycleRecipe) => {
    if (climate.waste < recipe.requiredWaste || stats.gold < recipe.requiredGold) return;
    soundManager.playRecycle();
    onCraftRecipe(recipe.id);
  };

  return (
    <div id="upcycle-workshop-root" className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header */}
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
          <span>자원 순환 연구소</span>
        </span>
      </div>

      {/* Hero Overview */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-cyan-950 via-stone-900 to-teal-950 border border-cyan-700/50 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold mb-3 border border-cyan-500/30">
            <Recycle className="w-4 h-4" />
            <span>친환경 업사이클링 공방</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
            버려진 쓰레기를 강력한 장비로!
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-lg">
            몬스터에게서 수거한 플라스틱, 캔 폐기물을 재활용 장비로 제작하면 공격력과 방어력이 영구적으로 상승합니다.
          </p>
        </div>

        {/* Current Resources Mini Panel */}
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-700/70 text-xs space-y-2 w-full sm:w-48 shrink-0">
          <div className="flex justify-between items-center text-stone-300">
            <span className="flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5 text-cyan-400" />
              보유 쓰레기:
            </span>
            <span className="font-bold text-cyan-300 font-mono">{climate.waste}개</span>
          </div>
          <div className="flex justify-between items-center text-stone-300">
            <span className="flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              보유 골드:
            </span>
            <span className="font-bold text-amber-300 font-mono">{stats.gold} G</span>
          </div>
          <div className="pt-1.5 border-t border-stone-800 flex justify-between items-center text-[11px] text-stone-400">
            <span>누적 재활용:</span>
            <span className="font-bold text-emerald-400">{climate.recycledCount}회</span>
          </div>
        </div>
      </div>

      {/* Recipes List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider">
          업사이클링 제작 가능한 아이템
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recipes.map((recipe) => {
            const canAfford =
              climate.waste >= recipe.requiredWaste && stats.gold >= recipe.requiredGold;

            return (
              <div
                key={recipe.id}
                className={`p-5 rounded-2xl border transition-all ${
                  recipe.crafted
                    ? 'bg-stone-900/60 border-emerald-800/40 opacity-80'
                    : canAfford
                    ? 'bg-stone-900 border-stone-750 hover:border-cyan-500/60 shadow-md'
                    : 'bg-stone-900/80 border-stone-800 opacity-75'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-stone-800 border border-stone-700 flex items-center justify-center text-2xl shrink-0">
                    {recipe.icon}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-sm font-bold text-white">{recipe.title}</h4>
                      {recipe.crafted && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          제작 완료
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400 mb-2 leading-relaxed">
                      {recipe.description}
                    </p>

                    {/* Stat bonuses preview */}
                    <div className="flex flex-wrap gap-2 text-[11px] font-bold text-emerald-400 mb-3">
                      {recipe.statBonus.atk && <span>⚔️ 공격력 +{recipe.statBonus.atk}</span>}
                      {recipe.statBonus.def && <span>🛡️ 방어력 +{recipe.statBonus.def}</span>}
                      {recipe.statBonus.maxHp && <span>❤️ 최대HP +{recipe.statBonus.maxHp}</span>}
                      {recipe.statBonus.saplings && (
                        <span>🌱 묘목 +{recipe.statBonus.saplings}그루</span>
                      )}
                    </div>

                    {/* Requirements & Action */}
                    <div className="flex items-center justify-between pt-2 border-t border-stone-800">
                      <div className="flex items-center gap-3 text-xs">
                        <span
                          className={`font-mono font-bold ${
                            climate.waste >= recipe.requiredWaste
                              ? 'text-cyan-400'
                              : 'text-stone-500'
                          }`}
                        >
                          🗑️ {recipe.requiredWaste}개
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            stats.gold >= recipe.requiredGold
                              ? 'text-amber-400'
                              : 'text-stone-500'
                          }`}
                        >
                          🪙 {recipe.requiredGold} G
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCraft(recipe)}
                        disabled={recipe.crafted || !canAfford}
                        className={`px-4 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                          recipe.crafted
                            ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                            : canAfford
                            ? 'bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white shadow hover:scale-105'
                            : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                        }`}
                      >
                        <Hammer className="w-3.5 h-3.5" />
                        <span>{recipe.crafted ? '보유 중' : '업사이클 제작'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
