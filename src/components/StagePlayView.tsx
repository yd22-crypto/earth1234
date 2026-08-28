import React, { useState, useEffect } from 'react';
import { StageData, StudentProfile } from '../types';
import { STAGES_DATA } from '../data/stagesData';
import { soundManager } from '../utils/audio';
import {
  Swords,
  Shield,
  Sparkles,
  Heart,
  Zap,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  Trophy,
  Leaf,
  Info,
} from 'lucide-react';

interface StagePlayViewProps {
  student: StudentProfile;
  currentStageNumber: number;
  score: number;
  clearedStages: number[];
  onStageCleared: (stageNum: number, stageScore: number) => void;
  onSelectStage: (stageNum: number) => void;
  onGoToEnding: () => void;
  onOpenLeaderboard: () => void;
}

export const StagePlayView: React.FC<StagePlayViewProps> = ({
  student,
  currentStageNumber,
  score,
  clearedStages,
  onStageCleared,
  onSelectStage,
  onGoToEnding,
  onOpenLeaderboard,
}) => {
  const stageIndex = Math.max(0, Math.min(STAGES_DATA.length - 1, currentStageNumber - 1));
  const stageData: StageData = STAGES_DATA[stageIndex];

  // Combat State
  const playerMaxHp = 100;
  const [playerHp, setPlayerHp] = useState<number>(playerMaxHp);
  const [ecoEnergy, setEcoEnergy] = useState<number>(50); // 0~100%
  const [hasShield, setHasShield] = useState<boolean>(false);
  const [monsterHp, setMonsterHp] = useState<number>(stageData.monsterMaxHp);

  // Interaction State
  const [turnState, setTurnState] = useState<'IDLE' | 'PLAYER_ACTION' | 'ENEMY_ACTION' | 'CLEAR' | 'DEFEAT'>('IDLE');
  const [combatLog, setCombatLog] = useState<string>(
    `${stageData.title} 시작! ${stageData.monsterName}이(가) 나타났습니다.`
  );
  const [floatingText, setFloatingText] = useState<{ text: string; color: string; id: number } | null>(null);

  // Quiz Modal State
  const [isQuizOpen, setIsQuizOpen] = useState<boolean>(false);
  const [activeQuizIndex, setActiveQuizIndex] = useState<number>(0);
  const [quizFeedback, setQuizFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);

  // Stage Clear Modal State
  const [clearModalData, setClearModalData] = useState<{
    pointsEarned: number;
    hpBonus: number;
    totalEarned: number;
  } | null>(null);

  // When stage changes, reset battle
  useEffect(() => {
    setPlayerHp(playerMaxHp);
    setEcoEnergy(50);
    setHasShield(false);
    setMonsterHp(stageData.monsterMaxHp);
    setTurnState('IDLE');
    setCombatLog(`${stageData.title} 시작! ${stageData.monsterName}이(가) 나타났습니다.`);
    setClearModalData(null);
    setQuizFeedback(null);
    setIsQuizOpen(false);

    // Switch BGM theme based on stage difficulty
    if (stageData.stageNumber >= 4) {
      soundManager.startBGM('boss');
    } else {
      soundManager.startBGM('adventure');
    }
  }, [stageData.stageNumber]);

  // Show floating damage number
  const triggerFloatingText = (text: string, color: string = 'text-amber-400') => {
    setFloatingText({ text, color, id: Date.now() });
    setTimeout(() => {
      setFloatingText(null);
    }, 1200);
  };

  // 1. Normal Cleanse Attack
  const handleAttack = () => {
    if (turnState !== 'IDLE' || monsterHp <= 0) return;

    setTurnState('PLAYER_ACTION');
    soundManager.playAttack();

    // Damage calculation: 35~45 dmg
    const dmg = Math.floor(35 + Math.random() * 12);
    const nextMonsterHp = Math.max(0, monsterHp - dmg);
    setMonsterHp(nextMonsterHp);

    triggerFloatingText(`-${dmg} 정화!`, 'text-cyan-400');
    setCombatLog(`⚔️ 정화 공격으로 ${stageData.monsterName}에게 ${dmg} 피해를 입혔습니다!`);

    // Gain +25% Eco Energy
    setEcoEnergy((prev) => Math.min(100, prev + 25));

    if (nextMonsterHp <= 0) {
      handleVictory();
    } else {
      setTimeout(() => {
        handleMonsterTurn();
      }, 700);
    }
  };

  // 2. Open Quiz Shield
  const handleOpenQuiz = () => {
    if (turnState !== 'IDLE' || monsterHp <= 0) return;
    soundManager.playButtonClick();
    const randQuiz = Math.floor(Math.random() * stageData.quizzes.length);
    setActiveQuizIndex(randQuiz);
    setQuizFeedback(null);
    setIsQuizOpen(true);
  };

  // Submit Quiz Answer
  const handleAnswerQuiz = (selectedIndex: number) => {
    const currentQuiz = stageData.quizzes[activeQuizIndex];
    const isCorrect = selectedIndex === currentQuiz.correctIndex;

    if (isCorrect) {
      soundManager.playQuizCorrect();
      setHasShield(true);
      setQuizFeedback({
        isCorrect: true,
        text: `정답입니다! 🛡️ 자연 실천 방어막이 활성화되어 다음 공격을 100% 무효화하고 반격 피해를 입힙니다!`,
      });

      // Bonus counter damage: 55~70 dmg
      const counterDmg = Math.floor(55 + Math.random() * 15);
      const nextMonsterHp = Math.max(0, monsterHp - counterDmg);
      setMonsterHp(nextMonsterHp);

      triggerFloatingText(`크리티컬 -${counterDmg}!`, 'text-emerald-400');
      setCombatLog(`🌱 퀴즈 정답! 방어막을 전개하고 ${counterDmg} 카운터 피해를 입혔습니다!`);
      setEcoEnergy((prev) => Math.min(100, prev + 40));

      setTimeout(() => {
        setIsQuizOpen(false);
        if (nextMonsterHp <= 0) {
          handleVictory();
        } else {
          setTurnState('PLAYER_ACTION');
          setTimeout(() => {
            handleMonsterTurn();
          }, 600);
        }
      }, 1400);
    } else {
      soundManager.playQuizWrong();
      setQuizFeedback({
        isCorrect: false,
        text: `오답입니다! 정답은 [${currentQuiz.options[currentQuiz.correctIndex]}] 입니다. ${currentQuiz.explanation}`,
      });

      setTimeout(() => {
        setIsQuizOpen(false);
        setTurnState('PLAYER_ACTION');
        setTimeout(() => {
          handleMonsterTurn();
        }, 500);
      }, 2000);
    }
  };

  // 3. Eco Ultimate Skill
  const handleEcoUltimate = () => {
    if (turnState !== 'IDLE' || ecoEnergy < 100 || monsterHp <= 0) return;

    setTurnState('PLAYER_ACTION');
    soundManager.playEcoSkill();

    // Massive damage 130~160
    const dmg = Math.floor(130 + Math.random() * 30);
    const nextMonsterHp = Math.max(0, monsterHp - dmg);
    setMonsterHp(nextMonsterHp);

    // Heal player +45 HP
    const nextHp = Math.min(playerMaxHp, playerHp + 45);
    setPlayerHp(nextHp);

    // Reset energy
    setEcoEnergy(0);

    triggerFloatingText(`대자연 강타 -${dmg}!`, 'text-emerald-300');
    setCombatLog(`🌿 대자연의 힘! ${stageData.monsterName}에게 ${dmg}의 막대한 정화 피해를 입히고 HP를 45 회복했습니다!`);

    if (nextMonsterHp <= 0) {
      handleVictory();
    } else {
      setTimeout(() => {
        handleMonsterTurn();
      }, 800);
    }
  };

  // Monster's Turn
  const handleMonsterTurn = () => {
    setTurnState('ENEMY_ACTION');

    setTimeout(() => {
      if (hasShield) {
        // Shield absorbs attack completely
        soundManager.playShield();
        setHasShield(false);
        setCombatLog(`🛡️ 방어막이 ${stageData.monsterName}의 오염 공격을 완벽히 흡수했습니다!`);
        triggerFloatingText(`방어 성공! (0 피해)`, 'text-cyan-300');
        setTurnState('IDLE');
      } else {
        // Monster deals damage
        soundManager.playHurt();
        const dmg = Math.floor(stageData.monsterAtk + (Math.random() * 6 - 3));
        const nextHp = Math.max(0, playerHp - dmg);
        setPlayerHp(nextHp);

        triggerFloatingText(`-${dmg} HP`, 'text-rose-400');
        setCombatLog(`💥 ${stageData.monsterName}의 공격! 에코 나이트가 ${dmg} 피해를 입었습니다.`);

        if (nextHp <= 0) {
          handleDefeat();
        } else {
          setTurnState('IDLE');
        }
      }
    }, 600);
  };

  // Victory Handler
  const handleVictory = () => {
    setTurnState('CLEAR');
    soundManager.playStageClear();
    soundManager.startBGM('victory');

    const hpBonus = playerHp * 5;
    const totalEarned = stageData.clearPoints + hpBonus;

    setClearModalData({
      pointsEarned: stageData.clearPoints,
      hpBonus,
      totalEarned,
    });

    onStageCleared(stageData.stageNumber, totalEarned);
  };

  // Defeat Handler
  const handleDefeat = () => {
    setTurnState('DEFEAT');
    soundManager.playGameOver();
    setCombatLog(`체력이 모두 소진되었습니다. 다시 도전해 보세요!`);
  };

  // Retry Current Stage
  const handleRetry = () => {
    soundManager.playButtonClick();
    setPlayerHp(playerMaxHp);
    setEcoEnergy(50);
    setHasShield(false);
    setMonsterHp(stageData.monsterMaxHp);
    setTurnState('IDLE');
    setCombatLog(`다시 도전합니다! 이번에는 꼭 정화해 보세요.`);
    if (stageData.stageNumber >= 4) {
      soundManager.startBGM('boss');
    } else {
      soundManager.startBGM('adventure');
    }
  };

  // Next Stage Transition
  const handleNextStage = () => {
    soundManager.playButtonClick();
    if (stageData.stageNumber === 5) {
      onGoToEnding();
    } else {
      onSelectStage(stageData.stageNumber + 1);
    }
  };

  const playerHpPercent = Math.max(0, Math.min(100, (playerHp / playerMaxHp) * 100));
  const monsterHpPercent = Math.max(0, Math.min(100, (monsterHp / stageData.monsterMaxHp) * 100));

  return (
    <div id="stage-play-container" className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-4 flex flex-col gap-4">
      {/* 1 to 5 Stage Navigation Map */}
      <div className="bg-stone-900/95 border border-stone-800 p-3 rounded-2xl shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2 mb-2 text-xs font-bold text-stone-300">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <Leaf className="w-4 h-4" />
            기후 수호 모험 (1단계 ~ 5단계)
          </span>
          <span className="text-stone-400 font-mono">
            {clearedStages.length} / 5 단계 클리어
          </span>
        </div>

        {/* 5 Stage Step Buttons */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {STAGES_DATA.map((st) => {
            const isCurrent = st.stageNumber === stageData.stageNumber;
            const isCleared = clearedStages.includes(st.stageNumber);
            const isUnlocked = st.stageNumber === 1 || clearedStages.includes(st.stageNumber - 1) || isCleared;

            return (
              <button
                key={st.stageNumber}
                type="button"
                disabled={!isUnlocked}
                onClick={() => {
                  soundManager.playButtonClick();
                  onSelectStage(st.stageNumber);
                }}
                className={`py-2 px-1 rounded-xl text-center flex flex-col items-center justify-center transition-all duration-200 border text-[11px] sm:text-xs font-bold relative ${
                  isCurrent
                    ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-400/50 scale-[1.03] shadow-md'
                    : isCleared
                    ? 'bg-stone-800/90 text-emerald-300 border-emerald-800/60 hover:bg-stone-800'
                    : isUnlocked
                    ? 'bg-stone-800/60 text-stone-300 border-stone-700 hover:bg-stone-700'
                    : 'bg-stone-900/50 text-stone-600 border-stone-800/40 cursor-not-allowed opacity-60'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span>{st.monsterEmoji}</span>
                  <span className="truncate">{st.stageNumber}단계</span>
                  {isCleared && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                </div>
                <span className="text-[10px] text-stone-300 hidden sm:inline truncate max-w-[80px]">
                  {st.stageNumber === 5 ? '최종마왕' : st.monsterName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Battle Stage Arena */}
      <div className="relative rounded-3xl overflow-hidden border border-stone-700/80 shadow-2xl bg-stone-950 flex flex-col min-h-[460px]">
        {/* Background Image with Climate Mood Filter */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 opacity-35"
          style={{ backgroundImage: `url(${stageData.bgImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-stone-900/50" />

        {/* Floating damage text effect */}
        {floatingText && (
          <div
            key={floatingText.id}
            className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black text-2xl sm:text-3xl z-40 pointer-events-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] animate-bounce ${floatingText.color}`}
          >
            {floatingText.text}
          </div>
        )}

        {/* Stage Header Info Banner */}
        <div className="relative z-10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800/80 bg-stone-950/60 backdrop-blur-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold">
                {stageData.badge}
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white">{stageData.title}</h2>
            </div>
            <p className="text-xs text-stone-300 mt-1">{stageData.subtitle}</p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>클리어 보상: +{stageData.clearPoints.toLocaleString()}점</span>
            </div>
          </div>
        </div>

        {/* Battle Arena Duel Grid */}
        <div className="relative z-10 flex-1 p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-center">
          {/* LEFT: Player (Eco Knight) */}
          <div className="bg-stone-900/85 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-xl shadow-inner border border-emerald-400/50">
                  🛡️
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-sm">{student.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono">
                      에코 나이트
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-medium">수호자 보호막 가동 중</span>
                </div>
              </div>

              {hasShield && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-xs font-bold animate-pulse">
                  <Shield className="w-3.5 h-3.5" />
                  <span>방어막 활성!</span>
                </div>
              )}
            </div>

            {/* Player HP Bar */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1 text-rose-400">
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  체력 (HP)
                </span>
                <span className="font-mono text-stone-200">
                  {playerHp} / {playerMaxHp}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-stone-800 overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    playerHpPercent > 50
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                      : playerHpPercent > 25
                      ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                      : 'bg-gradient-to-r from-rose-600 to-rose-400 animate-pulse'
                  }`}
                  style={{ width: `${playerHpPercent}%` }}
                />
              </div>
            </div>

            {/* Player Eco Energy Bar */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1 text-cyan-300">
                  <Zap className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
                  에코 필살기 게이지
                </span>
                <span className="font-mono text-cyan-300">{ecoEnergy}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-stone-800 overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    ecoEnergy >= 100
                      ? 'bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 animate-pulse'
                      : 'bg-gradient-to-r from-blue-600 to-cyan-400'
                  }`}
                  style={{ width: `${ecoEnergy}%` }}
                />
              </div>
            </div>
          </div>

          {/* RIGHT: Monster / Boss */}
          <div className="bg-stone-900/85 border border-rose-500/40 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-stone-800 border border-stone-700 flex items-center justify-center text-3xl shadow-inner">
                  {stageData.monsterEmoji}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-white text-base">{stageData.monsterName}</span>
                    <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 text-[10px] font-bold">
                      {stageData.stageNumber}단계 보스
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-400">{stageData.topic}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-stone-400 block font-mono">기본 공격력</span>
                <span className="text-sm font-bold text-rose-400 font-mono">⚔️ {stageData.monsterAtk}</span>
              </div>
            </div>

            {/* Monster HP Bar */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1 text-rose-400">
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  오염도 (HP)
                </span>
                <span className="font-mono text-stone-200">
                  {monsterHp} / {stageData.monsterMaxHp}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-stone-800 overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-300"
                  style={{ width: `${monsterHpPercent}%` }}
                />
              </div>
            </div>

            {/* Environmental Education Fact Pill */}
            <div className="flex items-start gap-1.5 p-2 rounded-xl bg-stone-800/80 border border-stone-700/60 text-[11px] text-stone-300">
              <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>{stageData.fact}</span>
            </div>
          </div>
        </div>

        {/* Combat Status & Log Strip */}
        <div className="relative z-10 px-4 py-2 bg-stone-900/90 border-t border-stone-800 text-xs text-stone-200 flex items-center justify-between">
          <span className="truncate">{combatLog}</span>
          <span className="font-mono text-amber-400 shrink-0 font-bold ml-2">
            누적 점수: {score.toLocaleString()}점
          </span>
        </div>

        {/* 3 Intuitive Action Buttons */}
        <div className="relative z-10 p-3 sm:p-4 bg-stone-950 border-t border-stone-800 grid grid-cols-3 gap-2 sm:gap-3">
          {/* Action 1: Normal Cleanse Attack */}
          <button
            id="action-cleanse-attack"
            type="button"
            disabled={turnState !== 'IDLE'}
            onClick={handleAttack}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-b from-stone-800 to-stone-900 hover:from-stone-700 hover:to-stone-800 border border-stone-700 hover:border-cyan-400 text-white font-bold transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <div className="flex items-center gap-1 text-cyan-400 text-sm sm:text-base">
              <Swords className="w-5 h-5" />
              <span>정화 공격</span>
            </div>
            <span className="text-[10px] text-stone-400 mt-0.5">35~45 피해 / 게이지 +25%</span>
          </button>

          {/* Action 2: Eco Quiz & Shield */}
          <button
            id="action-quiz-shield"
            type="button"
            disabled={turnState !== 'IDLE'}
            onClick={handleOpenQuiz}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-b from-teal-900/80 to-emerald-950 hover:from-teal-800 hover:to-emerald-900 border border-teal-500/60 text-white font-bold transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <div className="flex items-center gap-1 text-emerald-300 text-sm sm:text-base">
              <HelpCircle className="w-5 h-5 text-emerald-400" />
              <span>에코 퀴즈 방어막</span>
            </div>
            <span className="text-[10px] text-emerald-300/80 mt-0.5">정답 시 공격 100% 무효화</span>
          </button>

          {/* Action 3: Eco Ultimate Skill */}
          <button
            id="action-eco-ultimate"
            type="button"
            disabled={turnState !== 'IDLE' || ecoEnergy < 100}
            onClick={handleEcoUltimate}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl border font-black transition-all duration-200 active:scale-95 shadow-md ${
              ecoEnergy >= 100
                ? 'bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 text-white border-emerald-300 shadow-emerald-500/30 animate-pulse'
                : 'bg-stone-900 text-stone-500 border-stone-800 cursor-not-allowed opacity-60'
            }`}
          >
            <div className="flex items-center gap-1 text-sm sm:text-base">
              <Zap className="w-5 h-5" />
              <span>대자연 필살기</span>
            </div>
            <span className="text-[10px] mt-0.5">
              {ecoEnergy >= 100 ? '강타 150 피해 + 체력 45 회복!' : `게이지 충전 필요 (${ecoEnergy}%)`}
            </span>
          </button>
        </div>
      </div>

      {/* QUIZ MODAL (Single-question 2-choice engaging quiz) */}
      {isQuizOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-stone-900 border border-emerald-500/50 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl text-stone-100 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <HelpCircle className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">에코 실천 퀴즈</h3>
                  <p className="text-xs text-emerald-400">{stageData.topic}</p>
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-stone-800 text-stone-400 font-mono">
                맞히면 방어막 활성화!
              </span>
            </div>

            {/* Question Text */}
            <div className="py-2">
              <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
                Q. {stageData.quizzes[activeQuizIndex]?.question}
              </p>
            </div>

            {/* 2 Big Choice Buttons */}
            <div className="flex flex-col gap-2.5">
              {stageData.quizzes[activeQuizIndex]?.options.map((option, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAnswerQuiz(idx)}
                  className="w-full text-left p-3.5 sm:p-4 rounded-2xl bg-stone-800 hover:bg-emerald-950/80 border border-stone-700 hover:border-emerald-500/60 text-stone-100 font-medium text-sm sm:text-base transition-all duration-150 active:scale-[0.98] flex items-center justify-between group"
                >
                  <span>{option}</span>
                  <span className="w-6 h-6 rounded-full bg-stone-700 group-hover:bg-emerald-600 flex items-center justify-center text-xs font-bold text-white shrink-0 ml-2">
                    {idx + 1}
                  </span>
                </button>
              ))}
            </div>

            {/* Instant Feedback Message */}
            {quizFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs font-bold animate-fadeIn ${
                  quizFeedback.isCorrect
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                    : 'bg-rose-950/80 border-rose-500 text-rose-200'
                }`}
              >
                {quizFeedback.text}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STAGE CLEAR MODAL */}
      {turnState === 'CLEAR' && clearModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fadeIn">
          <div className="bg-stone-900 border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center text-stone-100 flex flex-col gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 mx-auto flex items-center justify-center text-3xl shadow-lg animate-bounce">
              ⭐
            </div>

            <div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                STAGE CLEAR
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
                {stageData.stageNumber}단계 정화 완료!
              </h2>
              <p className="text-xs text-stone-300 mt-1">
                {stageData.monsterName}을(를) 물리치고 환경을 되살렸습니다.
              </p>
            </div>

            {/* Score Breakdown Card */}
            <div className="p-4 rounded-2xl bg-stone-800/90 border border-stone-700 text-left flex flex-col gap-2 text-xs font-medium">
              <div className="flex justify-between text-stone-300">
                <span>단계 클리어 기본 점수:</span>
                <span className="font-mono font-bold text-white">
                  +{clearModalData.pointsEarned.toLocaleString()}점
                </span>
              </div>
              <div className="flex justify-between text-stone-300">
                <span>남은 체력 보너스:</span>
                <span className="font-mono font-bold text-emerald-400">
                  +{clearModalData.hpBonus.toLocaleString()}점
                </span>
              </div>
              <div className="border-t border-stone-700 pt-2 flex justify-between text-sm font-bold text-amber-300">
                <span>획득한 총 점수:</span>
                <span className="font-mono text-base">
                  +{clearModalData.totalEarned.toLocaleString()}점
                </span>
              </div>
            </div>

            {/* Server Sync Note */}
            <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>실시간 점수가 학급 서버에 안전하게 저장되었습니다!</span>
            </div>

            {/* Next Stage or Final Ending Button */}
            <button
              id="next-stage-btn"
              type="button"
              onClick={handleNextStage}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-base shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98]"
            >
              {stageData.stageNumber === 5 ? (
                <>
                  <Trophy className="w-5 h-5" />
                  <span>최종 엔딩 & 명예의 전당 보기 ➔</span>
                </>
              ) : (
                <>
                  <span>다음 {stageData.stageNumber + 1}단계 도전하기</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* DEFEAT MODAL */}
      {turnState === 'DEFEAT' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fadeIn">
          <div className="bg-stone-900 border-2 border-rose-600 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center text-stone-100 flex flex-col gap-4">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500 mx-auto flex items-center justify-center text-3xl">
              💔
            </div>

            <div>
              <h2 className="text-2xl font-black text-white">체력이 다했습니다!</h2>
              <p className="text-xs text-stone-300 mt-1">
                오염의 힘이 강했습니다. 하지만 자연은 포기하지 않는 자에게 기회를 줍니다!
              </p>
            </div>

            <div className="p-3 rounded-xl bg-stone-800 border border-stone-700 text-xs text-emerald-300">
              💡 팁: [에코 퀴즈 방어막]을 맞히면 다음 공격을 100% 막아낼 수 있습니다!
            </div>

            <button
              id="retry-stage-btn"
              type="button"
              onClick={handleRetry}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base shadow-lg flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98]"
            >
              <RotateCcw className="w-5 h-5" />
              <span>체력 100% 회복하고 다시 도전!</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
