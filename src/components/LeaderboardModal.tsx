import React, { useState, useEffect } from 'react';
import { StudentProfile } from '../types';
import {
  fetchLeaderboardFromServer,
  getLeaderboardList,
  resetAllStudentDataAsync,
} from '../utils/studentStorage';
import {
  Trophy,
  X,
  Medal,
  TreePine,
  Recycle,
  Sparkles,
  Search,
  RotateCcw,
  RefreshCw,
  Server,
  Users,
} from 'lucide-react';

interface LeaderboardModalProps {
  currentStudentCode?: string;
  onClose: () => void;
  onSelectStudent?: (profile: StudentProfile) => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  currentStudentCode,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [profiles, setProfiles] = useState<StudentProfile[]>(getLeaderboardList());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>('방금 전');

  const loadLeaderboard = async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchLeaderboardFromServer();
      setProfiles(data);
      setLastRefreshedTime(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const filtered = profiles.filter(
    (p) =>
      p.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleResetData = async () => {
    if (
      window.confirm(
        '모든 학생 점수 데이터를 초기화하시겠습니까? (교사용 기능: 모든 기기에서 초기화됩니다)'
      )
    ) {
      setIsRefreshing(true);
      await resetAllStudentDataAsync();
      await loadLeaderboard();
      setIsRefreshing(false);
    }
  };

  return (
    <div
      id="leaderboard-modal-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="w-full max-w-2xl bg-stone-900 border border-stone-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-stone-900 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">학급 명예의 전당</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  클라우드 DB 동기화
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                모든 컴퓨터와 링크에서 동기화되는 학생별 누적 에코 스코어
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="refresh-leaderboard-btn"
              type="button"
              onClick={loadLeaderboard}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors flex items-center gap-1 text-xs font-semibold"
              title="새로고침"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">새로고침</span>
            </button>

            <button
              id="close-leaderboard-modal-btn"
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar & Actions */}
        <div className="p-4 bg-stone-950/60 border-b border-stone-800 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="학생 관리코드 또는 이름 검색..."
              className="w-full pl-9 pr-4 py-2 bg-stone-900 border border-stone-700 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-400">
            <span className="hidden md:flex items-center gap-1 font-mono">
              <Users className="w-3.5 h-3.5 text-stone-500" />
              참여 {profiles.length}명
            </span>

            <button
              type="button"
              onClick={handleResetData}
              title="데이터 초기화 (교사용)"
              className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-300 flex items-center gap-1 border border-stone-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">데이터 초기화</span>
            </button>
          </div>
        </div>

        {/* Leaderboard Table / Cards */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-2.5 flex-1">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-stone-500 text-xs">
              검색된 학생 데이터가 없습니다.
            </div>
          ) : (
            filtered.map((profile, idx) => {
              const isCurrent = currentStudentCode === profile.studentCode;
              const rank = idx + 1;

              return (
                <div
                  key={profile.studentCode}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-amber-950/40 border-amber-500/80 shadow-lg'
                      : rank === 1
                      ? 'bg-stone-850 border-amber-600/40'
                      : 'bg-stone-900 border-stone-800'
                  }`}
                >
                  {/* Left: Rank & Student info */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 flex items-center justify-center font-black text-sm">
                      {rank === 1 ? (
                        <span className="text-xl">🥇</span>
                      ) : rank === 2 ? (
                        <span className="text-xl">🥈</span>
                      ) : rank === 3 ? (
                        <span className="text-xl">🥉</span>
                      ) : (
                        <span className="text-stone-400 font-mono">{rank}</span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{profile.name}</span>
                        <span className="font-mono text-xs text-stone-400 px-1.5 py-0.5 rounded bg-stone-800">
                          {profile.studentCode}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            나
                          </span>
                        )}
                        {profile.bossDefeated || profile.stagesCleared?.includes(5) ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-500/50">
                            👑 5단계 정복
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                            {profile.currentStage ? `${profile.currentStage}단계 도전 중` : '1단계 도전'}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-emerald-400 font-medium mt-0.5">
                        {profile.title}
                      </div>
                    </div>
                  </div>

                  {/* Right: Score & Stage Progress */}
                  <div className="flex items-center gap-3 text-right">
                    <div className="hidden sm:flex flex-col items-end text-xs text-stone-400">
                      <span className="text-[11px] text-stone-400">
                        클리어: <strong className="text-emerald-400 font-mono">{profile.stagesCleared?.length || (profile.bossDefeated ? 5 : 0)}/5</strong>
                      </span>
                    </div>

                    <div>
                      <div className="text-stone-400 text-[10px]">최고 점수</div>
                      <div className="text-base font-black text-amber-300 font-mono">
                        {profile.highScore.toLocaleString()}점
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-400">
          <span>최근 서버 동기화: {lastRefreshedTime}</span>
          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            모든 기기와 링크에서 점수와 단계 기록이 서버에 영구 보관됩니다
          </span>
        </div>
      </div>
    </div>
  );
};
