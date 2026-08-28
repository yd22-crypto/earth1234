import React from 'react';
import { PlayerStats, ClimateState, StudentProfile } from '../types';
import { soundManager } from '../utils/audio';
import {
  Volume2,
  VolumeX,
  Trophy,
  TreePine,
  Trash2,
  Apple,
  Heart,
  Coins,
  Shield,
  Swords,
  Sparkles,
} from 'lucide-react';

interface HeaderNavProps {
  student: StudentProfile;
  stats: PlayerStats;
  climate: ClimateState;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenLeaderboard: () => void;
  onQuickEatFood: () => void;
  onGoToVillage: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  student,
  stats,
  climate,
  soundEnabled,
  onToggleSound,
  onOpenLeaderboard,
  onQuickEatFood,
  onGoToVillage,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100));
  const expPercent = Math.max(0, Math.min(100, (stats.exp / stats.maxExp) * 100));

  return (
    <header
      id="game-header-nav"
      className="bg-stone-900 border-b border-stone-800 text-stone-100 sticky top-0 z-30 shadow-md"
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 flex flex-col gap-2">
        {/* Top row: Profile & Meta buttons */}
        <div className="flex items-center justify-between gap-3">
          {/* Student Info & Level */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              id="header-home-btn"
              type="button"
              onClick={onGoToVillage}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/80 transition-colors text-xs font-bold"
              title="마을 광장으로 이동"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">에코 나이트</span>
              <span className="font-mono">Lv.{stats.level}</span>
            </button>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-white max-w-[100px] truncate">{student.name}</span>
              <span className="px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 font-mono text-[10px]">
                {student.studentCode}
              </span>
              <span className="hidden md:inline text-[11px] text-emerald-400 font-medium">
                {student.title}
              </span>
            </div>
          </div>

          {/* Right actions: Audio & Leaderboard */}
          <div className="flex items-center gap-2">
            {/* Live Eco Score */}
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold"
              title="실시간 누적 에코 점수"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{(student.currentScore ?? student.highScore).toLocaleString()}점</span>
            </div>

            {/* Server Sync Indicator */}
            <div
              className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium"
              title="모든 기기와 링크에서 데이터가 안전하게 서버에 보관됩니다"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>서버 보관</span>
            </div>

            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-stone-800 border border-stone-700 text-amber-300 text-xs font-mono">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>{stats.gold} G</span>
            </div>

            <button
              id="header-leaderboard-btn"
              type="button"
              onClick={onOpenLeaderboard}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">명예의 전당</span>
            </button>

            <button
              id="header-sound-btn"
              type="button"
              onClick={onToggleSound}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
              title={soundEnabled ? '효과음 끄기' : '효과음 켜기'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-stone-500" />
              )}
            </button>
          </div>
        </div>

        {/* Bottom row: Combat stats & 3 Climate variables */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 border-t border-stone-800/80">
          {/* Left: HP & EXP Bar */}
          <div className="flex items-center gap-3">
            {/* HP Bar */}
            <div className="flex-1">
              <div className="flex justify-between items-center text-[10px] font-bold text-stone-300 mb-0.5">
                <span className="flex items-center gap-1 text-rose-400">
                  <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                  체력 (HP)
                </span>
                <span className="font-mono">{stats.hp} / {stats.maxHp}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-300"
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>

            {/* EXP Bar */}
            <div className="w-24 sm:w-28">
              <div className="flex justify-between items-center text-[10px] font-bold text-stone-300 mb-0.5">
                <span className="text-cyan-400">EXP</span>
                <span className="font-mono text-[9px]">{stats.exp}/{stats.maxExp}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-300"
                  style={{ width: `${expPercent}%` }}
                />
              </div>
            </div>

            {/* ATK & DEF mini badges */}
            <div className="flex items-center gap-2 text-[10px] font-mono text-stone-400">
              <span className="flex items-center gap-0.5 text-orange-400 font-bold" title="공격력">
                <Swords className="w-3 h-3" />
                {stats.atk}
              </span>
              <span className="flex items-center gap-0.5 text-sky-400 font-bold" title="방어력">
                <Shield className="w-3 h-3" />
                {stats.def}
              </span>
            </div>
          </div>

          {/* Right: 3 Core Climate Variables */}
          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
            {/* 1. 나무 (Tree) */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-700/50 text-emerald-300"
              title="심은 나무 수 및 대기 정화도"
            >
              <TreePine className="w-3.5 h-3.5 text-emerald-400" />
              <div className="flex items-center gap-1 font-bold">
                <span>{climate.trees}그루</span>
                <span className="text-[10px] font-mono text-emerald-400">({climate.airPurity}%)</span>
              </div>
            </div>

            {/* 2. 쓰레기 (Waste) */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/70 border border-cyan-700/50 text-cyan-300"
              title="수거한 쓰레기 (업사이클링 공방에서 사용)"
            >
              <Trash2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-bold">{climate.waste}개</span>
            </div>

            {/* 3. 식량 (Food) with Eat Button */}
            <button
              id="header-eat-food-btn"
              type="button"
              onClick={onQuickEatFood}
              disabled={climate.food <= 0 || stats.hp >= stats.maxHp}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${
                climate.food > 0 && stats.hp < stats.maxHp
                  ? 'bg-amber-950/80 border-amber-500/60 text-amber-300 hover:bg-amber-900 animate-pulse'
                  : 'bg-stone-800 border-stone-700 text-stone-400'
              }`}
              title={
                stats.hp >= stats.maxHp
                  ? '체력이 가득 찼습니다'
                  : climate.food <= 0
                  ? '식량이 부족합니다'
                  : '식량 1개를 섭취하여 HP를 35 회복합니다'
              }
            >
              <Apple className="w-3.5 h-3.5 text-amber-400" />
              <span>{climate.food}개</span>
              {stats.hp < stats.maxHp && climate.food > 0 && (
                <span className="text-[10px] text-amber-400 underline ml-0.5">회복</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
