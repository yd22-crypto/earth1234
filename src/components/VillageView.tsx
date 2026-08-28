import React from 'react';
import { ClimateState, PlayerStats, StudentProfile } from '../types';
import { soundManager } from '../utils/audio';
import {
  Swords,
  Castle,
  Recycle,
  TreePine,
  Skull,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  Info,
} from 'lucide-react';
import villageImg from '../assets/images/climate_village_1787895371126.jpg';

interface VillageViewProps {
  student: StudentProfile;
  stats: PlayerStats;
  climate: ClimateState;
  hasDungeonUnlocked: boolean;
  onGoHunt: () => void;
  onGoDungeon: () => void;
  onGoUpcycle: () => void;
  onGoTreeGarden: () => void;
  onGoFinalBoss: () => void;
}

export const VillageView: React.FC<VillageViewProps> = ({
  student,
  stats,
  climate,
  hasDungeonUnlocked,
  onGoHunt,
  onGoDungeon,
  onGoUpcycle,
  onGoTreeGarden,
  onGoFinalBoss,
}) => {
  // Climate impact calculations
  const bossWeakenPercent = Math.min(80, climate.trees * 4 + climate.recycledCount * 2);
  const isReadyForBoss = stats.level >= 6 && climate.trees >= 10;

  return (
    <div id="village-view-root" className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Hero Banner with Village Illustration */}
      <div className="relative rounded-3xl overflow-hidden border border-stone-800 bg-stone-900 shadow-xl">
        <div className="aspect-[21/9] sm:aspect-[24/8] w-full relative">
          <img
            src={villageImg}
            alt="에테리아 그린빌리지"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

          {/* Banner text overlay */}
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-10">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-xs font-bold w-fit mb-1.5 shadow">
              <Sparkles className="w-3.5 h-3.5" />
              <span>에테리아 정화 기지</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-white drop-shadow">
              그린빌리지 마을 광장
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 max-w-lg mt-1 font-medium">
              오염 마귀들을 소탕하여 실력을 키우고, 쓰레기를 재활용하여 친환경 장비를 만드세요.
            </p>
          </div>
        </div>
      </div>

      {/* Climate Core Variable Status Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. 나무 & 산소 지표 */}
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-emerald-800/40 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <TreePine className="w-4 h-4" />
              대기 정화도 & 산림
            </span>
            <span className="text-xs font-mono font-bold text-emerald-300">
              {climate.airPurity}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden mb-3">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${climate.airPurity}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs text-stone-400">
            <span>심은 나무: <strong className="text-emerald-300">{climate.trees}</strong>그루</span>
            <span>보유 묘목: <strong className="text-emerald-400">{climate.treeSaplings}</strong>개</span>
          </div>
          <button
            type="button"
            onClick={onGoTreeGarden}
            className="mt-3 w-full py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/50 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
          >
            <span>나무 심으러 가기</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2. 쓰레기 & 업사이클링 지표 */}
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-cyan-800/40 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
              <Recycle className="w-4 h-4" />
              쓰레기 수거 & 재활용
            </span>
            <span className="text-xs font-mono font-bold text-cyan-300">
              {climate.waste}개 보유
            </span>
          </div>
          <p className="text-xs text-stone-300 mb-2 leading-relaxed">
            사냥으로 모은 쓰레기로 공격력과 방어력을 높여주는 친환경 장비를 만드세요.
          </p>
          <div className="flex justify-between items-center text-xs text-stone-400">
            <span>누적 재활용: <strong className="text-cyan-300">{climate.recycledCount}</strong>개</span>
          </div>
          <button
            type="button"
            onClick={onGoUpcycle}
            className="mt-3 w-full py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/50 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
          >
            <span>업사이클링 공방 이동</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3. 기후 마왕 약화 지표 */}
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-amber-800/40 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              마왕 탄소실드 약화율
            </span>
            <span className="text-xs font-mono font-bold text-amber-300">
              {bossWeakenPercent}% 약화
            </span>
          </div>
          <p className="text-xs text-stone-300 mb-2 leading-relaxed">
            나무를 많이 심고 환경을 정화할수록 최종 보스의 탄소 보호막이 약해집니다!
          </p>
          <div className="text-[11px] text-stone-400">
            {bossWeakenPercent >= 50 ? (
              <span className="text-emerald-400 font-bold">✨ 마왕 공략에 충분한 정화율 달성!</span>
            ) : (
              <span className="text-amber-400">⚠️ 나무를 더 심어 오염을 정화해야 안전합니다.</span>
            )}
          </div>
          <div className="mt-3 h-8 flex items-center text-xs text-stone-500 font-medium">
            나무 1그루당 +4% 약화 보너스
          </div>
        </div>
      </div>

      {/* Main Adventure Hub Activities */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider">
          임무 및 모험 활동
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Action 1: 초보 마을 사냥 (쉬운 몬스터 상대) */}
          <div
            id="village-hunt-card"
            onClick={() => {
              soundManager.playSkill();
              onGoHunt();
            }}
            className="group cursor-pointer p-5 rounded-2xl bg-stone-900 border border-stone-800 hover:border-emerald-500/60 hover:bg-stone-850 transition-all duration-200 shadow-md flex items-center gap-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-600/40 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
              ⚔️
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                  마을 주변 오염 몬스터 소탕
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                  Lv.1~4 파밍
                </span>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">
                비닐 슬라임, 매연 고블린, 폐타이어 골렘을 물리쳐 레벨업하고 쓰레기와 묘목 씨앗을 수거합니다.
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-stone-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          </div>

          {/* Action 2: 기후 이상 출몰 던전 탐험 */}
          <div
            id="village-dungeon-card"
            onClick={() => {
              soundManager.playSkill();
              onGoDungeon();
            }}
            className="group cursor-pointer p-5 rounded-2xl bg-stone-900 border border-stone-800 hover:border-cyan-500/60 hover:bg-stone-850 transition-all duration-200 shadow-md flex items-center gap-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-600/40 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
              🏰
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                  기후 이상 출몰 던전
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400">
                  특별 보스전
                </span>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">
                산성비 동굴, 미세플라스틱 해저 균열 등 강력한 던전 보스를 격파하고 전설 보상을 획득하세요.
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-stone-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
          </div>

          {/* Action 3: 업사이클링 공방 */}
          <div
            id="village-upcycle-card"
            onClick={() => {
              soundManager.playRecycle();
              onGoUpcycle();
            }}
            className="group cursor-pointer p-5 rounded-2xl bg-stone-900 border border-stone-800 hover:border-teal-500/60 hover:bg-stone-850 transition-all duration-200 shadow-md flex items-center gap-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-teal-950/80 border border-teal-600/40 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
              ♻️
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-base font-bold text-white group-hover:text-teal-300 transition-colors">
                  친환경 업사이클링 공방
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-400">
                  장비 제작
                </span>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">
                수거한 쓰레기를 분리수거하여 재생 무기, 알루미늄 방패, 바이오 비료를 제작합니다.
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-stone-500 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
          </div>

          {/* Action 4: 대정령의 묘목 동산 */}
          <div
            id="village-garden-card"
            onClick={() => {
              soundManager.playPlantTree();
              onGoTreeGarden();
            }}
            className="group cursor-pointer p-5 rounded-2xl bg-stone-900 border border-stone-800 hover:border-emerald-500/60 hover:bg-stone-850 transition-all duration-200 shadow-md flex items-center gap-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-600/40 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
              🌲
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                  대정령의 묘목 동산
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                  나무 심기
                </span>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">
                보유한 묘목을 심어 숲을 재건하고 산소를 회복시킵니다. (대기 정화도 상승)
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-stone-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          </div>
        </div>

        {/* Action 5: 최종 마왕 보스전 배너 */}
        <div
          id="village-final-boss-card"
          onClick={() => {
            soundManager.playHurt();
            onGoFinalBoss();
          }}
          className={`cursor-pointer p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4 ${
            isReadyForBoss
              ? 'bg-gradient-to-r from-rose-950/90 via-stone-900 to-purple-950/90 border-rose-600/60 hover:border-rose-500 shadow-xl'
              : 'bg-stone-900/90 border-stone-800 hover:border-stone-700'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-950 border border-rose-600/50 flex items-center justify-center text-3xl shrink-0 shadow">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  최종 결전 구역
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">
                  권장 Lv.7+
                </span>
              </div>
              <h4 className="text-lg font-black text-white">
                암흑 마왕성 : 기후 마왕 카르보나스 토벌
              </h4>
              <p className="text-xs text-stone-400 mt-1 max-w-md">
                대재앙의 근원인 탄소 마왕을 처치하고 에테리아를 구원하세요. 처치 시 현실 세계로 귀환합니다!
              </p>
            </div>
          </div>

          <button
            type="button"
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white shadow-lg shadow-rose-900/40 flex items-center justify-center gap-2 shrink-0 transition-transform hover:scale-105 active:scale-95"
          >
            <span>마왕성 돌입</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
