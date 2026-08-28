import React, { useState, useEffect } from 'react';
import { Monster, PlayerStats, ClimateState, Skill } from '../types';
import { PLAYER_SKILLS, GAME_IMAGES } from '../data/gameContent';
import { soundManager } from '../utils/audio';
import {
  Swords,
  Shield,
  Apple,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  Trophy,
  CheckCircle2,
  TreePine,
  Trash2,
  Zap,
} from 'lucide-react';

interface BattleArenaProps {
  monster: Monster;
  stats: PlayerStats;
  climate: ClimateState;
  onVictory: (rewards: {
    exp: number;
    gold: number;
    waste: number;
    saplings: number;
    food: number;
    monsterId: string;
    category: 'village' | 'dungeon' | 'final';
  }) => void;
  onPlayerFaint: () => void;
  onFlee: () => void;
  onUpdateStats: (newStats: PlayerStats) => void;
  onUpdateClimate: (newClimate: ClimateState) => void;
}

export const BattleArena: React.FC<BattleArenaProps> = ({
  monster,
  stats,
  climate,
  onVictory,
  onPlayerFaint,
  onFlee,
  onUpdateStats,
  onUpdateClimate,
}) => {
  const [monsterHp, setMonsterHp] = useState(monster.hp);
  const [battleLogs, setBattleLogs] = useState<
    Array<{ id: string; text: string; type: 'player' | 'enemy' | 'heal' | 'eco' }>
  >([
    {
      id: 'init-1',
      text: `야생의 [${monster.name}]이(가) 나타났다!`,
      type: 'eco',
    },
  ]);
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [showDefeatModal, setShowDefeatModal] = useState(false);
  const [hitEffect, setHitEffect] = useState<'none' | 'monster' | 'player'>('none');

  // Special climate shield weakening for final boss
  const isFinalBoss = monster.category === 'final';
  const treeShieldBreak = Math.min(85, climate.trees * 4);
  const effectiveBossDef = isFinalBoss
    ? Math.max(5, Math.round(monster.def * (1 - treeShieldBreak / 100)))
    : monster.def;

  const addLog = (text: string, type: 'player' | 'enemy' | 'heal' | 'eco') => {
    setBattleLogs((prev) => [
      { id: Math.random().toString(), text, type },
      ...prev.slice(0, 7),
    ]);
  };

  // Trigger monster attack on player after player action
  const executeEnemyTurn = (currentMonHp: number, playerCurrentHp: number) => {
    if (currentMonHp <= 0) return;

    setIsProcessingTurn(true);
    setTimeout(() => {
      // Monster attacks
      const baseDmg = monster.atk;
      const mitigatedDmg = Math.max(4, baseDmg - Math.floor(stats.def * 0.75));
      const newPlayerHp = Math.max(0, playerCurrentHp - mitigatedDmg);

      soundManager.playHurt();
      setHitEffect('player');
      setTimeout(() => setHitEffect('none'), 400);

      addLog(
        `💥 [${monster.name}]의 공격! ${mitigatedDmg}의 피해를 입었습니다.`,
        'enemy'
      );

      onUpdateStats({ ...stats, hp: newPlayerHp });

      if (newPlayerHp <= 0) {
        // Player defeated
        setTimeout(() => {
          setShowDefeatModal(true);
        }, 500);
      } else {
        setIsProcessingTurn(false);
      }
    }, 650);
  };

  // Normal Attack
  const handleNormalAttack = () => {
    if (isProcessingTurn || monsterHp <= 0 || stats.hp <= 0) return;

    soundManager.playAttack();
    setHitEffect('monster');
    setTimeout(() => setHitEffect('none'), 400);

    const isCrit = Math.random() < 0.25;
    const baseDamage = Math.max(6, stats.atk - Math.floor(effectiveBossDef * 0.5));
    const damage = Math.round(isCrit ? baseDamage * 1.5 : baseDamage);

    const newMonHp = Math.max(0, monsterHp - damage);
    setMonsterHp(newMonHp);

    addLog(
      `🗡️ ${isCrit ? '⚡치명타! ' : ''}[${monster.name}]에게 ${damage}의 물리 피해를 입혔습니다!`,
      'player'
    );

    if (newMonHp <= 0) {
      handleMonsterDefeated();
    } else {
      executeEnemyTurn(newMonHp, stats.hp);
    }
  };

  // Use Skill
  const handleUseSkill = (skill: Skill) => {
    if (isProcessingTurn || monsterHp <= 0 || stats.hp <= 0) return;

    if (climate.food < skill.foodCost) {
      addLog(`⚠️ 스킬 사용에 필요한 식량이 부족합니다! (필요: ${skill.foodCost}개)`, 'eco');
      return;
    }

    // Deduct food
    const nextFood = climate.food - skill.foodCost;
    onUpdateClimate({ ...climate, food: nextFood });

    soundManager.playSkill();
    setHitEffect('monster');
    setTimeout(() => setHitEffect('none'), 400);

    // Calculate skill damage
    const skillBase = Math.round(stats.atk * skill.powerMultiplier) - Math.floor(effectiveBossDef * 0.3);
    const damage = Math.max(10, skillBase);
    const newMonHp = Math.max(0, monsterHp - damage);
    setMonsterHp(newMonHp);

    // Check heal effect if any
    let updatedPlayerHp = stats.hp;
    if (skill.healPercent) {
      const healAmount = Math.round(stats.maxHp * skill.healPercent);
      updatedPlayerHp = Math.min(stats.maxHp, stats.hp + healAmount);
      onUpdateStats({ ...stats, hp: updatedPlayerHp });
      addLog(`💚 [${skill.name}] 생명력 ${healAmount} 회복!`, 'heal');
    }

    addLog(
      `✨ ${skill.effectName} [${monster.name}]에게 ${damage}의 정화 피해! (식량 ${skill.foodCost} 소모)`,
      'eco'
    );

    if (newMonHp <= 0) {
      handleMonsterDefeated();
    } else {
      executeEnemyTurn(newMonHp, updatedPlayerHp);
    }
  };

  // Eat Food in Battle
  const handleEatFood = () => {
    if (isProcessingTurn || stats.hp <= 0) return;
    if (climate.food <= 0) {
      addLog('⚠️ 보유한 식량이 없습니다!', 'eco');
      return;
    }
    if (stats.hp >= stats.maxHp) {
      addLog('💡 체력이 이미 가득 차 있습니다.', 'eco');
      return;
    }

    soundManager.playEatFood();
    const healAmount = 35;
    const nextHp = Math.min(stats.maxHp, stats.hp + healAmount);
    const nextFood = climate.food - 1;

    onUpdateStats({ ...stats, hp: nextHp });
    onUpdateClimate({ ...climate, food: nextFood });

    addLog(`🍎 청정 식량을 먹고 체력 +${healAmount} 회복했습니다. (남은 식량: ${nextFood})`, 'heal');

    executeEnemyTurn(monsterHp, nextHp);
  };

  // Handle Monster Defeated
  const handleMonsterDefeated = () => {
    soundManager.playVictory();
    addLog(`🎉 [${monster.name}]을(를) 정화하고 승리했습니다!`, 'eco');
    setTimeout(() => {
      setShowVictoryModal(true);
    }, 600);
  };

  const handleConfirmVictory = () => {
    onVictory({
      exp: monster.expReward,
      gold: monster.goldReward,
      waste: monster.wasteDrop,
      saplings: monster.saplingDrop,
      food: monster.foodDrop,
      monsterId: monster.id,
      category: monster.category,
    });
  };

  // Monster visual image helper
  const monsterImage =
    monster.category === 'final'
      ? GAME_IMAGES.finalBoss
      : monster.category === 'dungeon'
      ? GAME_IMAGES.dungeonBoss
      : null;

  const monsterHpPercent = Math.max(0, Math.min(100, (monsterHp / monster.maxHp) * 100));

  return (
    <div id="battle-arena-root" className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      {/* Top Navigation & Flee */}
      <div className="flex items-center justify-between">
        <button
          id="battle-flee-btn"
          type="button"
          onClick={onFlee}
          disabled={isProcessingTurn}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>마을로 후퇴하기</span>
        </button>

        <div className="text-xs font-bold text-stone-400">
          전투 모드 : {monster.category === 'final' ? '👑 최종 마왕전' : monster.category === 'dungeon' ? '🏰 출몰 던전 보스' : '🌿 마을 오염 소탕'}
        </div>
      </div>

      {/* Arena Stage Card */}
      <div className="rounded-3xl border border-stone-800 bg-stone-900 overflow-hidden shadow-2xl relative">
        {/* Background if boss */}
        {monsterImage ? (
          <div className="absolute inset-0 z-0 opacity-30">
            <img
              src={monsterImage}
              alt="보스 배경"
              className="w-full h-full object-cover blur-xs"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-stone-900 via-stone-950 to-stone-900" />
        )}

        <div className="relative z-10 p-6 sm:p-8 flex flex-col items-center">
          {/* Final Boss Gimmick Notice */}
          {isFinalBoss && (
            <div className="mb-4 w-full p-3 rounded-2xl bg-rose-950/80 border border-rose-600/60 backdrop-blur-md text-xs text-stone-200">
              <div className="flex items-center justify-between font-bold text-rose-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <TreePine className="w-4 h-4 text-emerald-400" />
                  대자연의 정화 효과 (심은 나무 {climate.trees}그루)
                </span>
                <span className="text-emerald-400">마왕 방어막 -{treeShieldBreak}% 약화 적용!</span>
              </div>
              <p className="text-[11px] text-stone-400">
                심은 나무의 산소 에너지가 카르보나스의 독성 탄소 실드를 강제로 분해하고 있습니다.
              </p>
            </div>
          )}

          {/* Monster Avatar Display */}
          <div
            className={`relative my-4 flex flex-col items-center transition-transform duration-200 ${
              hitEffect === 'monster' ? 'scale-90 brightness-150 animate-bounce' : ''
            }`}
          >
            {monsterImage ? (
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl overflow-hidden border-2 border-rose-500/60 shadow-2xl shadow-rose-950/60">
                <img
                  src={monsterImage}
                  alt={monster.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-stone-800/90 border border-stone-700 flex items-center justify-center text-6xl sm:text-7xl shadow-xl">
                {monster.emoji}
              </div>
            )}

            {/* Hit impact indicator */}
            {hitEffect === 'monster' && (
              <span className="absolute -top-3 -right-3 text-red-500 font-black text-2xl animate-ping">
                💥
              </span>
            )}

            <div className="mt-3 text-center">
              <h3 className="text-xl sm:text-2xl font-black text-white flex items-center justify-center gap-2">
                <span>{monster.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 font-mono">
                  {monster.category === 'final' ? 'BOSS' : `HP ${monsterHp}/${monster.maxHp}`}
                </span>
              </h3>
              <p className="text-xs text-stone-400 max-w-md mt-1">{monster.description}</p>
            </div>
          </div>

          {/* Monster HP Bar */}
          <div className="w-full max-w-md">
            <div className="flex justify-between items-center text-xs font-bold text-stone-300 mb-1">
              <span className="text-rose-400">적 생명력</span>
              <span className="font-mono">
                {monsterHp} / {monster.maxHp} ({Math.round(monsterHpPercent)}%)
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-stone-800 overflow-hidden border border-stone-700/60">
              <div
                className="h-full bg-gradient-to-r from-rose-600 via-red-500 to-amber-500 transition-all duration-300"
                style={{ width: `${monsterHpPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Combat Actions & Battle Log Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Action Buttons */}
        <div className="p-5 rounded-3xl bg-stone-900 border border-stone-800 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              공격 및 기후 정화 행동
            </h4>
            <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
              <Apple className="w-3.5 h-3.5" />
              보유 식량: {climate.food}개
            </span>
          </div>

          {/* 1. 기본 공격 */}
          <button
            id="battle-attack-btn"
            type="button"
            onClick={handleNormalAttack}
            disabled={isProcessingTurn || monsterHp <= 0}
            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-stone-800 to-stone-750 hover:from-stone-700 hover:to-stone-650 border border-stone-700 text-white font-bold text-sm flex items-center justify-between transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-950/80 border border-orange-600/50 flex items-center justify-center text-orange-400">
                <Swords className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div>일반 물리 공격</div>
                <div className="text-[10px] text-stone-400 font-normal">
                  위력 {stats.atk} (적 방어력에 따라 피해량 계산)
                </div>
              </div>
            </div>
            <span className="text-xs font-mono text-stone-400">0 식량</span>
          </button>

          {/* 2. 기후 스킬 목록 */}
          <div className="space-y-2 pt-1">
            {PLAYER_SKILLS.map((skill) => {
              const canAfford = climate.food >= skill.foodCost;
              return (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => handleUseSkill(skill)}
                  disabled={isProcessingTurn || !canAfford || monsterHp <= 0}
                  className={`w-full p-3 rounded-2xl border text-white font-bold text-sm flex items-center justify-between transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 ${
                    canAfford
                      ? 'bg-emerald-950/60 hover:bg-emerald-900/80 border-emerald-600/50 text-emerald-100'
                      : 'bg-stone-850 border-stone-800 text-stone-500'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-900/80 border border-emerald-500/40 flex items-center justify-center text-base">
                      {skill.id === 'solar_strike' ? '☀️' : skill.id === 'life_stream' ? '💧' : '🍃'}
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white">{skill.name}</div>
                      <div className="text-[10px] text-stone-300 font-normal">{skill.description}</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-900/80 text-amber-300 border border-stone-700 shrink-0">
                    식량 {skill.foodCost}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 3. 식량 섭취 즉시 회복 */}
          <button
            id="battle-eat-btn"
            type="button"
            onClick={handleEatFood}
            disabled={isProcessingTurn || climate.food <= 0 || stats.hp >= stats.maxHp}
            className="w-full p-2.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-600/50 text-amber-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
          >
            <Apple className="w-4 h-4 text-amber-400" />
            <span>청정 식량 섭취 (체력 +35 즉시 회복)</span>
          </button>
        </div>

        {/* Right: Live Battle Log */}
        <div className="p-5 rounded-3xl bg-stone-900 border border-stone-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                실시간 전투 기록
              </h4>
              <span className="text-[10px] text-stone-500 font-mono">전투 상황 중계</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {battleLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2 rounded-xl text-xs font-medium border ${
                    log.type === 'player'
                      ? 'bg-blue-950/40 border-blue-800/40 text-blue-200'
                      : log.type === 'enemy'
                      ? 'bg-rose-950/40 border-rose-800/40 text-rose-200'
                      : log.type === 'heal'
                      ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-200'
                      : 'bg-stone-800/60 border-stone-700/60 text-stone-300'
                  }`}
                >
                  {log.text}
                </div>
              ))}
            </div>
          </div>

          {/* Educational Climate Fact Box */}
          <div className="mt-3 p-3 rounded-2xl bg-stone-950 border border-stone-800 text-[11px] text-stone-300">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>에코 나이트 기후 수첩</span>
            </div>
            <p className="leading-relaxed">{monster.climateFact}</p>
          </div>
        </div>
      </div>

      {/* Victory Reward Modal */}
      {showVictoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-stone-900 border border-emerald-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-3xl mx-auto mb-3 animate-bounce">
              🏆
            </div>
            <h3 className="text-2xl font-black text-white mb-1">
              {monster.name} 정화 성공!
            </h3>
            <p className="text-xs text-emerald-400 font-medium mb-5">
              오염된 대지를 정화하고 소중한 자원을 수거했습니다.
            </p>

            {/* Rewards Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-left text-xs mb-3">
              <div className="p-2.5 rounded-xl bg-stone-800 border border-stone-700 flex items-center gap-2">
                <span className="text-base">⭐</span>
                <div>
                  <div className="text-stone-400 text-[10px]">경험치 획득</div>
                  <div className="font-bold text-cyan-300">+{monster.expReward} EXP</div>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-800 border border-stone-700 flex items-center gap-2">
                <span className="text-base">🪙</span>
                <div>
                  <div className="text-stone-400 text-[10px]">골드 획득</div>
                  <div className="font-bold text-amber-300">+{monster.goldReward} G</div>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-800 border border-stone-700 flex items-center gap-2">
                <span className="text-base">🗑️</span>
                <div>
                  <div className="text-stone-400 text-[10px]">쓰레기 수거</div>
                  <div className="font-bold text-cyan-400">+{monster.wasteDrop}개</div>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-800 border border-stone-700 flex items-center gap-2">
                <span className="text-base">🌱</span>
                <div>
                  <div className="text-stone-400 text-[10px]">묘목 씨앗</div>
                  <div className="font-bold text-emerald-400">+{monster.saplingDrop}개</div>
                </div>
              </div>
            </div>

            {/* Score Contribution Banner */}
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-between mb-4">
              <span>서버 누적 점수 기여:</span>
              <span className="font-mono text-sm">
                +{monster.category === 'final' ? '2,500' : monster.category === 'dungeon' ? '650' : '50'}점 반영
              </span>
            </div>

            {/* Climate knowledge card */}
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-700/40 text-left text-[11px] text-emerald-200 mb-6">
              <span className="font-bold block mb-0.5">🌱 환경 실천 메모:</span>
              <span>{monster.climateFact}</span>
            </div>

            <button
              id="confirm-victory-btn"
              type="button"
              onClick={handleConfirmVictory}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-transform hover:scale-105"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>보상 수령하고 계속하기</span>
            </button>
          </div>
        </div>
      )}

      {/* Defeat Modal */}
      {showDefeatModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-stone-900 border border-rose-600/60 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-3xl mx-auto mb-3">
              💀
            </div>
            <h3 className="text-xl font-black text-white mb-2">
              오염의 힘에 쓰러졌습니다...
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed mb-6">
              마을로 무사히 후퇴했습니다. 식량을 먹어 체력을 회복하고, 쓰레기를 업사이클링하여 장비를 강화한 뒤 다시 도전하세요!
            </p>
            <button
              id="confirm-defeat-btn"
              type="button"
              onClick={onPlayerFaint}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-stone-800 hover:bg-stone-700 text-white border border-stone-600 transition-colors"
            >
              마을로 복귀
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
