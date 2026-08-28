import React from 'react';
import { ClimateState, PlayerStats } from '../types';
import { soundManager } from '../utils/audio';
import { TreePine, Sprout, Wind, Shield, ArrowLeft, Sparkles } from 'lucide-react';

interface TreeGardenProps {
  climate: ClimateState;
  stats: PlayerStats;
  onPlantTree: (amount: number) => void;
  onBack: () => void;
}

export const TreeGarden: React.FC<TreeGardenProps> = ({
  climate,
  stats,
  onPlantTree,
  onBack,
}) => {
  const handlePlant = (count: number) => {
    if (climate.treeSaplings <= 0) return;
    const toPlant = Math.min(climate.treeSaplings, count);
    soundManager.playPlantTree();
    onPlantTree(toPlant);
  };

  // Generate visual tree icons representation (up to 30 visible)
  const displayTreesCount = Math.min(36, climate.trees);

  return (
    <div id="tree-garden-root" className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header & Back */}
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
          <span>산림 복원 구역</span>
        </span>
      </div>

      {/* Hero Overview Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950 via-stone-900 to-teal-950 border border-emerald-700/50 shadow-xl">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-3 border border-emerald-500/30">
            <TreePine className="w-4 h-4" />
            <span>대정령의 생명 숲</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
            나무를 심어 대기를 정화하세요
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-medium">
            몬스터를 정화하여 얻은 묘목 씨앗을 이곳에 심으면, 대기 정화도가 상승하고 최종 마왕 카르보나스의 독성 탄소 보호막이 영구 약화됩니다.
          </p>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-emerald-900/60">
          <div className="p-3 rounded-2xl bg-stone-900/80 border border-emerald-800/40 text-center">
            <div className="text-[11px] text-stone-400">심은 나무 총합</div>
            <div className="text-xl font-black text-emerald-400">{climate.trees}그루</div>
          </div>
          <div className="p-3 rounded-2xl bg-stone-900/80 border border-emerald-800/40 text-center">
            <div className="text-[11px] text-stone-400">보유한 묘목</div>
            <div className="text-xl font-black text-emerald-300">{climate.treeSaplings}개</div>
          </div>
          <div className="p-3 rounded-2xl bg-stone-900/80 border border-emerald-800/40 text-center">
            <div className="text-[11px] text-stone-400">대기 정화율</div>
            <div className="text-xl font-black text-cyan-400">{climate.airPurity}%</div>
          </div>
          <div className="p-3 rounded-2xl bg-stone-900/80 border border-emerald-800/40 text-center">
            <div className="text-[11px] text-stone-400">마왕 방어막 약화</div>
            <div className="text-xl font-black text-amber-400">
              -{Math.min(80, climate.trees * 4)}%
            </div>
          </div>
        </div>
      </div>

      {/* Visual Forest Display */}
      <div className="p-6 rounded-3xl bg-stone-900 border border-stone-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-stone-300 flex items-center gap-2">
            <span>자라나는 숲의 풍경</span>
            <span className="text-xs text-stone-500 font-normal">
              (현재 {climate.trees}그루 조림 완료)
            </span>
          </h3>
        </div>

        <div className="min-h-[140px] p-6 rounded-2xl bg-gradient-to-b from-stone-950 to-emerald-950/40 border border-emerald-900/40 flex flex-wrap items-center justify-center gap-3">
          {climate.trees === 0 ? (
            <div className="text-center py-6 text-stone-500 text-xs">
              아직 심은 나무가 없습니다. 아래 버튼을 눌러 첫 묘목을 심어주세요! 🌱
            </div>
          ) : (
            Array.from({ length: displayTreesCount }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center animate-fade-in group cursor-pointer transition-transform hover:scale-125"
                title={`나무 #${i + 1} (산소 공급 중)`}
              >
                <span className="text-2xl sm:text-3xl filter drop-shadow-md">
                  {i % 3 === 0 ? '🌲' : i % 3 === 1 ? '🌳' : '🌿'}
                </span>
              </div>
            ))
          )}
          {climate.trees > 36 && (
            <span className="text-xs text-emerald-400 font-bold px-3 py-1 bg-emerald-950 rounded-full border border-emerald-700">
              외 +{climate.trees - 36}그루 울창한 숲 조성 중!
            </span>
          )}
        </div>
      </div>

      {/* Planting Action Card */}
      <div className="p-6 rounded-3xl bg-stone-900 border border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl shrink-0">
            🌱
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">묘목을 대지에 심기</h4>
            <p className="text-xs text-stone-400 mt-0.5">
              묘목 1그루를 심을 때마다 대기 정화도 +3% 및 누적 점수 +80점이 즉시 반영됩니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            id="plant-one-tree-btn"
            type="button"
            onClick={() => handlePlant(1)}
            disabled={climate.treeSaplings <= 0}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 transition-colors shadow"
          >
            1그루 심기
          </button>
          <button
            id="plant-all-trees-btn"
            type="button"
            onClick={() => handlePlant(climate.treeSaplings)}
            disabled={climate.treeSaplings <= 0}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white disabled:opacity-40 transition-all shadow"
          >
            모두 심기 ({climate.treeSaplings}개)
          </button>
        </div>
      </div>
    </div>
  );
};
