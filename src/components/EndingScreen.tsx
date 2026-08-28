import React, { useEffect } from 'react';
import { StudentProfile } from '../types';
import { soundManager } from '../utils/audio';
import {
  Trophy,
  Sparkles,
  RotateCcw,
  Medal,
  CheckCircle2,
  Leaf,
  Globe2,
} from 'lucide-react';
import endingImg from '../assets/images/climate_ending_1787895413011.jpg';

interface EndingScreenProps {
  student: StudentProfile;
  score: number;
  clearedStages: number[];
  onOpenLeaderboard: () => void;
  onRestart: () => void;
}

export const EndingScreen: React.FC<EndingScreenProps> = ({
  student,
  score,
  clearedStages,
  onOpenLeaderboard,
  onRestart,
}) => {
  useEffect(() => {
    soundManager.startBGM('victory');
    soundManager.playStageClear();
  }, []);

  const stageBadges = [
    { num: 1, name: '플라스틱 정화', badge: '🌱 초급 수호자' },
    { num: 2, name: '스모그 정화', badge: '🌲 맑은공기 파수꾼' },
    { num: 3, name: '자원 업사이클링', badge: '♻️ 자원순환 연금술사' },
    { num: 4, name: '해양 생태 보호', badge: '🌊 바다의 수호 기사' },
    { num: 5, name: '오염 마왕 토벌', badge: '👑 지구의 구원자' },
  ];

  return (
    <div
      id="ending-screen-root"
      className="min-h-screen bg-stone-950 py-8 px-4 flex flex-col items-center justify-center animate-fadeIn"
    >
      <div className="w-full max-w-3xl bg-stone-900 border-2 border-emerald-500/50 rounded-3xl overflow-hidden shadow-2xl">
        {/* Grand Ending Illustration */}
        <div className="relative aspect-[21/9] sm:aspect-[24/9] w-full bg-black">
          <img
            src={endingImg}
            alt="되살아난 푸른 지구와 자연"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-black/30" />

          <div className="absolute bottom-4 left-6 z-10">
            <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow">
              🏆 1단계 ~ 5단계 올클리어 달성!
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-white mt-1 drop-shadow-md">
              푸른 지구의 기적, 새로운 시작
            </h1>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Narrative Summary */}
          <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-700/40 text-sm text-stone-200 leading-relaxed font-medium space-y-2">
            <p className="flex items-center gap-2 text-emerald-400 font-bold text-base">
              <Globe2 className="w-5 h-5" />
              <span>축하합니다! 지구 온난화와 환경 파괴를 막아냈습니다!</span>
            </p>
            <p>
              플라스틱 분리배출, 나무 심기, 자원 업사이클링, 해양 보호, 그리고 최후의 탄소 중립 결전까지!
              5개의 모든 단계를 훌륭하게 완수하여 지구의 푸른 하늘과 생태계를 되찾았습니다.
            </p>
            <p className="text-emerald-300 italic text-xs">
              “용사여, 게임 속에서 보여준 환경 실천의 지혜를 현실의 교실과 가정에서도 꼭 실천해 주세요!”
            </p>
          </div>

          {/* Student Score Report Card */}
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
              <span>최고 칭호 : 👑 지구의 구원자</span>
            </div>

            {/* 5 Stages Cleared Checklist Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-5 pt-5 border-t border-stone-800 text-left text-xs">
              {stageBadges.map((badge) => (
                <div
                  key={badge.num}
                  className="p-2.5 rounded-xl bg-stone-900 border border-emerald-800/60 flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold">
                    <span>{badge.num}단계</span>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span className="text-white font-bold text-[11px] truncate">{badge.name}</span>
                  <span className="text-[10px] text-stone-400 truncate">{badge.badge}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              id="ending-leaderboard-btn"
              type="button"
              onClick={() => {
                soundManager.playButtonClick();
                onOpenLeaderboard();
              }}
              className="flex-1 py-3.5 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-stone-950 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95"
            >
              <Trophy className="w-5 h-5" />
              <span>학급 명예의 전당 순위 보기</span>
            </button>

            <button
              id="ending-restart-btn"
              type="button"
              onClick={() => {
                soundManager.playButtonClick();
                onRestart();
              }}
              className="py-3.5 px-6 rounded-xl font-bold text-sm bg-stone-800 hover:bg-stone-700 text-white border border-stone-700 flex items-center justify-center gap-2 transition-colors active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>1단계부터 다시 도전하기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
