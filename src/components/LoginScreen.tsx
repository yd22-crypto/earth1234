import React, { useState, useEffect } from 'react';
import { StudentProfile } from '../types';
import {
  loginStudentAsync,
  fetchLeaderboardFromServer,
  fetchStudentFromServer,
  getLastStudentCode,
  getStoredProfiles,
} from '../utils/studentStorage';
import {
  GraduationCap,
  Sparkles,
  Trophy,
  ArrowRight,
  ShieldAlert,
  TreePine,
  Recycle,
  Apple,
  RotateCcw,
  CheckCircle2,
  Server,
  Play,
  CloudCheck,
} from 'lucide-react';
import prologueImg from '../assets/images/climate_prologue_1787895354766.jpg';

interface LoginScreenProps {
  onLoginSuccess: (profile: StudentProfile, startFresh?: boolean) => void;
  onOpenLeaderboard: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onOpenLeaderboard,
}) => {
  const lastCode = getLastStudentCode();
  const [studentCode, setStudentCode] = useState(lastCode || '');
  const [studentName, setStudentName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [topStudents, setTopStudents] = useState<StudentProfile[]>([]);
  const [matchedProfile, setMatchedProfile] = useState<StudentProfile | null>(null);

  const quickCodes = ['현종', 'ECO-01', 'ECO-02', '301-15'];

  // Load server status & leaderboard on mount
  useEffect(() => {
    let isMounted = true;
    fetchLeaderboardFromServer()
      .then((list) => {
        if (!isMounted) return;
        setServerOnline(true);
        setTopStudents(list.slice(0, 3));
      })
      .catch(() => {
        if (!isMounted) return;
        setServerOnline(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Check if input code matches an existing student record (checks local cache + server directly for cross-link support)
  useEffect(() => {
    const clean = studentCode.trim();
    if (!clean) {
      setMatchedProfile(null);
      return;
    }
    const localMap = getStoredProfiles();
    if (localMap[clean]) {
      setMatchedProfile(localMap[clean]);
      if (!studentName && localMap[clean].name) {
        setStudentName(localMap[clean].name);
      }
    }

    // Direct server query to find profile even on a completely different computer or browser link
    let isCurrent = true;
    const timer = setTimeout(async () => {
      const serverProfile = await fetchStudentFromServer(clean);
      if (!isCurrent) return;
      if (serverProfile) {
        setMatchedProfile(serverProfile);
        if (!studentName && serverProfile.name) {
          setStudentName(serverProfile.name);
        }
      }
    }, 200);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [studentCode]);

  const handleSubmit = async (e: React.FormEvent, startFresh = false) => {
    e.preventDefault();
    const code = studentCode.trim();
    if (!code) {
      setErrorMsg('학생 관리코드를 입력해주세요 (예: ECO-01 또는 학번)');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);

    try {
      const profile = await loginStudentAsync(code, studentName);
      setIsLoading(false);
      onLoginSuccess(profile, startFresh);
    } catch (err) {
      setIsLoading(false);
      setErrorMsg('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const handleSelectQuickCode = (code: string) => {
    setStudentCode(code);
    const localMap = getStoredProfiles();
    if (localMap[code]?.name) {
      setStudentName(localMap[code].name);
    } else if (!studentName) {
      setStudentName('학생 ' + code);
    }
  };

  return (
    <div
      id="login-screen-root"
      className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-4 relative overflow-hidden"
    >
      {/* Background illustration with dark overlay */}
      <div className="absolute inset-0 z-0 opacity-25">
        <img
          src={prologueImg}
          alt="배경"
          className="w-full h-full object-cover blur-xs"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="relative z-10 w-full max-w-lg bg-stone-900/95 backdrop-blur-md rounded-3xl border border-stone-700 shadow-2xl p-6 sm:p-8 text-stone-100 space-y-5">
        {/* Top Header Badge & Server Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>서버 연동 기록 보관 중</span>
          </div>

          <button
            id="view-leaderboard-login-btn"
            type="button"
            onClick={onOpenLeaderboard}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>학급 명예의 전당</span>
          </button>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
            에코 나이트
          </h1>
          <p className="text-sm font-semibold text-emerald-400">
            기후의 수호자와 오염 마왕
          </p>
          <p className="text-xs text-stone-400 mt-2 leading-relaxed">
            관리코드를 입력하면 다른 컴퓨터나 링크로 접속해도<br />
            <strong>내 점수, 레벨, 식재한 나무, 수거 기록이 완벽히 보관</strong>됩니다!
          </p>
        </div>

        {/* Form */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
          <div>
            <label
              htmlFor="student-code-input"
              className="block text-xs font-bold text-stone-300 mb-1.5 flex items-center justify-between"
            >
              <span>학생 관리코드 (필수)</span>
              <span className="text-[11px] text-stone-400 font-normal">학번 또는 식별코드</span>
            </label>
            <input
              id="student-code-input"
              type="text"
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
              placeholder="예: ECO-01, 301-15, 홍길동"
              maxLength={20}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-stone-800 border border-stone-600 rounded-xl text-sm text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
            />
          </div>

          <div>
            <label
              htmlFor="student-name-input"
              className="block text-xs font-bold text-stone-300 mb-1.5 flex items-center justify-between"
            >
              <span>학생 이름 / 별명 (선택)</span>
              <span className="text-[11px] text-stone-400 font-normal">명예의 전당 표시용</span>
            </label>
            <input
              id="student-name-input"
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="예: 김민수, 바람의용사"
              maxLength={15}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-stone-800 border border-stone-600 rounded-xl text-sm text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Quick preset code buttons */}
          <div>
            <p className="text-[11px] text-stone-400 mb-1.5 font-medium">빠른 체험 코드:</p>
            <div className="flex flex-wrap gap-1.5">
              {quickCodes.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleSelectQuickCode(code)}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-colors"
                >
                  {code}
                </button>
              ))}
            </div>
          </div>

          {/* Existing Student Record Card Notice */}
          {matchedProfile && (
            <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/50 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  서버 연동 완료: 기존 기록 발견!
                </span>
                <span className="text-stone-100 font-mono font-bold text-sm bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/40">
                  {matchedProfile.highScore.toLocaleString()}점
                </span>
              </div>
              <div className="text-xs text-stone-300 flex items-center justify-between">
                <span className="text-stone-300">
                  진행 상황:{' '}
                  <strong className="text-emerald-400">
                    {matchedProfile.currentStage || 1}단계 도전
                  </strong>{' '}
                  ({matchedProfile.stagesCleared?.length || (matchedProfile.bossDefeated ? 5 : 0)}/5 완료)
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-semibold text-[11px]">
                  {matchedProfile.title}
                </span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Actions */}
          <div className="space-y-2">
            <button
              id="start-game-login-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-base bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            >
              {isLoading ? (
                <span>서버 기록 동기화 중...</span>
              ) : matchedProfile ? (
                <>
                  <Play className="w-5 h-5 fill-white" />
                  <span>기존 기록 이어서 모험 시작</span>
                </>
              ) : (
                <>
                  <span>이세계로 차원 이동</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {matchedProfile && (
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>이전 기록 무시하고 1레벨부터 새로 시작</span>
              </button>
            )}
          </div>
        </form>

        {/* Classroom Top 3 Preview */}
        {topStudents.length > 0 && (
          <div className="pt-4 border-t border-stone-800">
            <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
              <span className="font-bold flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                학급 실시간 TOP 랭킹
              </span>
              <button
                type="button"
                onClick={onOpenLeaderboard}
                className="text-amber-400 hover:underline text-[11px]"
              >
                전체보기
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              {topStudents.map((s, idx) => (
                <div
                  key={s.studentCode}
                  className="p-2 rounded-xl bg-stone-800/80 border border-stone-700/60"
                >
                  <div className="text-sm">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</div>
                  <div className="font-bold text-white truncate">{s.name}</div>
                  <div className="text-[10px] text-amber-400 font-mono font-bold mt-0.5">
                    {s.highScore.toLocaleString()}점
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
