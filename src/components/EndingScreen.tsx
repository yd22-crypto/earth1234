import React from 'react';
import { StudentProfile, ClimateState, PlayerStats } from '../types';
import { calculateEcoScore } from '../utils/studentStorage';
import { soundManager } from '../utils/audio';
import {
  Trophy,
  Sparkles,
  TreePine,
  Recycle,
  Apple,
  RotateCcw,
  CheckCircle2,
  Medal,
} from 'lucide-react';
import endingImg from '../assets/images/climate_ending_1787895413011.jpg';

interface EndingScreenProps {
  student: StudentProfile;
  stats: PlayerStats;
  climate: ClimateState;
  monstersDefeated: number;
  dungeonsCleared: number;
  onOpenLeaderboard: () => void;
  onRestart: () => void;
}

export const EndingScreen: React.FC<EndingScreenProps> = ({
  student,
  stats,
  climate,
  monstersDefeated,
  dungeonsCleared,
  onOpenLeaderboard,
  onRestart,
}) => {
  const { score, title } = calculateEcoScore({
    level: stats.level,
    monstersDefeated,
    dungeonsCleared,
    treesPlanted: climate.trees,
    wasteRecycled: climate.recycledCount,
    foodRemaining: climate.food,
    bossDefeated: true,
  });

  return (
    <div
      id="ending-screen-root"
      className="min-h-screen bg-stone-950 py-8 px-4 flex flex-col items-center justify-center"
    >
      <div className="w-full max-w-3xl bg-stone-900 border border-emerald-500/50 rounded-3xl overflow-hidden shadow-2xl">
        {/* Ending Illustration */}
        <div className="relative aspect-[21/9] sm:aspect-[24/9] w-full bg-black">
          <img
            src={endingImg}
            alt="회복된 에테리아의 신록"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-black/30" />

          <div className="absolute bottom-4 left-6 z-10">
            <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow">
              대단원 : 현실 세계로의 귀환
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-white mt-1 drop-shadow-md">
              에테리아의 기적, 그리고 새로운 시작
            </h1>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Story Narrative Box */}
          <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-700/40 text-sm text-stone-200 leading-relaxed font-medium space-y-2">
            <p>
              오염 마왕 카르보나스가 정화되어 검은 스모그가 걷히고, 대지에는 푸른 숲과 맑은 강물이 되살아났습니다!
            </p>
            <p>
              숲의 대정령 엘도라가 감사의 미소와 함께 현실로 향하는 차원의 문을 활짝 열어주었습니다.
            </p>
            <p className="text-emerald-300 italic">
              “용사여, 그대가 심은 나무와 수거한 쓰레기가 세상을 구했습니다. 현실 세계에서도 푸른 지구를 지키는 영웅이 되어주세요!”
            </p>
          </div>

          {/* Student Final Score Card */}
          <div className="p-6 rounded-2xl bg-stone-950 border border-stone-800 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Medal className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-bold text-stone-400">
                학생 관리코드: <span className="text-white font-mono">{student.studentCode}</span> ({student.name})
              </span>
            </div>

            <div className="text-xs text-stone-400 mt-2">최종 종합 에코 스코어</div>
            <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-emerald-400 to-teal-300 my-1 font-mono">
              {score.toLocaleString()} 점
            </div>

            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold mt-2">
              <Sparkles className="w-4 h-4" />
              <span>수여 칭호 : {title}</span>
            </div>

            {/* Score Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-stone-800 text-left text-xs">
              <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                <span className="text-stone-400 text-[10px]">퇴치 몬스터</span>
                <div className="font-bold text-white text-base mt-0.5">{monstersDefeated}마리</div>
              </div>
              <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                <span className="text-stone-400 text-[10px]">클리어 던전</span>
                <div className="font-bold text-cyan-400 text-base mt-0.5">{dungeonsCleared}개</div>
              </div>
              <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                <span className="text-stone-400 text-[10px]">심은 나무</span>
                <div className="font-bold text-emerald-400 text-base mt-0.5">{climate.trees}그루</div>
              </div>
              <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                <span className="text-stone-400 text-[10px]">업사이클 쓰레기</span>
                <div className="font-bold text-teal-400 text-base mt-0.5">{climate.recycledCount}개</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              id="ending-leaderboard-btn"
              type="button"
              onClick={onOpenLeaderboard}
              className="flex-1 py-3.5 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-stone-950 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-transform hover:scale-105"
            >
              <Trophy className="w-5 h-5" />
              <span>학급 명예의 전당 순위 보기</span>
            </button>

            <button
              id="ending-restart-btn"
              type="button"
              onClick={onRestart}
              className="py-3.5 px-6 rounded-xl font-bold text-sm bg-stone-800 hover:bg-stone-700 text-white border border-stone-700 flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>새로운 모험 시작</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
