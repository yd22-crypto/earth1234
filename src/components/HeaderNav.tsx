import React, { useState, useEffect } from 'react';
import { StudentProfile } from '../types';
import { soundManager } from '../utils/audio';
import {
  Volume2,
  VolumeX,
  Music,
  Trophy,
  Sparkles,
  UserCheck,
  LogOut,
} from 'lucide-react';

interface HeaderNavProps {
  student: StudentProfile;
  score: number;
  currentStage: number;
  clearedStages: number[];
  onOpenLeaderboard: () => void;
  onSelectStage: (stageNum: number) => void;
  onLogout: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  student,
  score,
  currentStage,
  clearedStages,
  onOpenLeaderboard,
  onSelectStage,
  onLogout,
}) => {
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(soundManager.isBGMEnabled());
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(soundManager.isSFXEnabled());

  useEffect(() => {
    const unsubscribe = soundManager.subscribe(() => {
      setBgmEnabled(soundManager.isBGMEnabled());
      setSfxEnabled(soundManager.isSFXEnabled());
    });
    return unsubscribe;
  }, []);

  const handleToggleBgm = () => {
    const next = soundManager.toggleBGM();
    setBgmEnabled(next);
  };

  const handleToggleSfx = () => {
    const next = soundManager.toggleSFX();
    setSfxEnabled(next);
  };

  return (
    <header
      id="game-header-nav"
      className="bg-stone-900 border-b border-stone-800 text-stone-100 sticky top-0 z-30 shadow-md backdrop-blur-md"
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Left: Student Identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
            <UserCheck className="w-4 h-4" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-sm">{student.name}</span>
              <span className="px-1.5 py-0.5 rounded bg-stone-800 border border-stone-700 text-stone-400 font-mono text-[10px]">
                {student.studentCode}
              </span>
              <span className="text-[11px] text-emerald-400 font-medium hidden md:inline">
                {student.title}
              </span>
            </div>
            <span className="text-[10px] text-stone-400">
              현재 도전: <strong className="text-emerald-400">{currentStage}단계</strong> (클리어 {clearedStages.length}/5)
            </span>
          </div>
        </div>

        {/* Right: Live Score, Audio Toggles & Leaderboard */}
        <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
          {/* Live Eco Score Badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono font-bold"
            title="실시간 누적 점수"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{score.toLocaleString()}점</span>
          </div>

          {/* Server Sync Indicator */}
          <div
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[11px]"
            title="모든 기기와 링크에서 데이터가 안전하게 서버에 보관됩니다"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>서버 보관</span>
          </div>

          {/* Audio Controls */}
          <div className="flex items-center gap-1 bg-stone-800/80 p-1 rounded-xl border border-stone-700">
            {/* BGM Toggle */}
            <button
              id="header-bgm-btn"
              type="button"
              onClick={handleToggleBgm}
              className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-all text-xs font-medium ${
                bgmEnabled
                  ? 'bg-emerald-600/30 border border-emerald-500/50 text-emerald-300'
                  : 'text-stone-500 hover:text-stone-300'
              }`}
              title={bgmEnabled ? '배경음악 (BGM) 끄기' : '배경음악 (BGM) 켜기'}
            >
              <Music className={`w-3.5 h-3.5 ${bgmEnabled ? 'text-emerald-400 animate-pulse' : 'text-stone-500'}`} />
              <span className="text-[11px]">BGM</span>
            </button>

            {/* SFX Toggle */}
            <button
              id="header-sfx-btn"
              type="button"
              onClick={handleToggleSfx}
              className={`p-1 rounded-lg transition-colors ${
                sfxEnabled ? 'text-emerald-400' : 'text-stone-500'
              }`}
              title={sfxEnabled ? '효과음 (SFX) 끄기' : '효과음 (SFX) 켜기'}
            >
              {sfxEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          {/* Leaderboard Button */}
          <button
            id="header-leaderboard-btn"
            type="button"
            onClick={() => {
              soundManager.playButtonClick();
              onOpenLeaderboard();
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold transition-all active:scale-95"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">명예의 전당</span>
          </button>

          {/* Exit / Logout */}
          <button
            id="header-logout-btn"
            type="button"
            onClick={() => {
              soundManager.playButtonClick();
              onLogout();
            }}
            className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-colors"
            title="다른 학생으로 변경"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
