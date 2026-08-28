import React, { useState, useEffect } from 'react';
import { GameScreen, StudentProfile } from './types';
import { soundManager } from './utils/audio';
import { saveStudentProgressAsync } from './utils/studentStorage';

import { LoginScreen } from './components/LoginScreen';
import { StoryPrologue } from './components/StoryPrologue';
import { HeaderNav } from './components/HeaderNav';
import { StagePlayView } from './components/StagePlayView';
import { EndingScreen } from './components/EndingScreen';
import { LeaderboardModal } from './components/LeaderboardModal';

export default function App() {
  // Navigation Screen State
  const [screen, setScreen] = useState<GameScreen>('LOGIN');

  // Student Profile
  const [student, setStudent] = useState<StudentProfile | null>(null);

  // 1 to 5 Stage Progression
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [clearedStages, setClearedStages] = useState<number[]>([]);
  const [score, setScore] = useState<number>(0);

  // Leaderboard modal toggle
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);

  // Unlock audio on any initial user touch/click
  useEffect(() => {
    const handleFirstInteraction = () => {
      soundManager.unlock();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  // Login Success Handler
  const handleLoginSuccess = (profile: StudentProfile, startFresh = false) => {
    setStudent(profile);
    soundManager.unlock();
    soundManager.playButtonClick();

    if (!startFresh && (profile.currentStage || profile.highScore > 0)) {
      const stage = Math.min(5, Math.max(1, profile.currentStage || 1));
      const savedScore = profile.currentScore ?? profile.highScore ?? 0;
      const cleared = profile.stagesCleared || (profile.bossDefeated ? [1, 2, 3, 4, 5] : []);

      setCurrentStage(stage);
      setClearedStages(cleared);
      setScore(savedScore);
      setScreen('STAGE_PLAY');
      soundManager.startBGM(stage >= 4 ? 'boss' : 'adventure');
    } else {
      setCurrentStage(1);
      setClearedStages([]);
      setScore(0);
      setScreen('STORY_PROLOGUE');
      soundManager.startBGM('adventure');
    }
  };

  // Story Prologue Complete -> Start 1st Stage
  const handlePrologueComplete = () => {
    setCurrentStage(1);
    setScreen('STAGE_PLAY');
    soundManager.startBGM('adventure');
  };

  // When a stage is cleared
  const handleStageCleared = (stageNum: number, stageScore: number) => {
    const nextScore = score + stageScore;
    setScore(nextScore);

    const nextCleared = clearedStages.includes(stageNum)
      ? clearedStages
      : [...clearedStages, stageNum].sort((a, b) => a - b);
    setClearedStages(nextCleared);

    const isBossCleared = stageNum === 5;
    const nextStageTarget = stageNum < 5 ? stageNum + 1 : 5;

    // Determine eco title by stages completed
    let newTitle = student?.title || '🌱 초급 수호자';
    if (stageNum === 1) newTitle = '🌱 초급 수호자';
    if (stageNum === 2) newTitle = '🌲 맑은공기 파수꾼';
    if (stageNum === 3) newTitle = '♻️ 자원순환 연금술사';
    if (stageNum === 4) newTitle = '🌊 바다의 수호 기사';
    if (stageNum === 5) newTitle = '👑 지구의 구원자';

    // Persist to server backend & local storage
    if (student) {
      saveStudentProgressAsync({
        studentCode: student.studentCode,
        name: student.name,
        score: nextScore,
        currentStage: nextStageTarget,
        stagesCleared: nextCleared,
        bossDefeated: isBossCleared || student.bossDefeated,
      }).then(({ profile }) => {
        if (profile) {
          setStudent((prev) => (prev ? { ...prev, ...profile, title: newTitle } : profile));
        }
      });
    }
  };

  // Select a stage directly (e.g. from stage bar)
  const handleSelectStage = (stageNum: number) => {
    setCurrentStage(stageNum);
    setScreen('STAGE_PLAY');
    if (stageNum >= 4) {
      soundManager.startBGM('boss');
    } else {
      soundManager.startBGM('adventure');
    }
  };

  // Go to Grand Ending
  const handleGoToEnding = () => {
    setScreen('ENDING');
  };

  // Restart from Stage 1
  const handleRestartAdventure = () => {
    soundManager.playButtonClick();
    setCurrentStage(1);
    setClearedStages([]);
    setScore(0);
    setScreen('STAGE_PLAY');
    soundManager.startBGM('adventure');
  };

  // Logout / Switch Student
  const handleLogout = () => {
    soundManager.stopBGM();
    setStudent(null);
    setScreen('LOGIN');
  };

  // Render Login Screen
  if (screen === 'LOGIN' || !student) {
    return (
      <div className="font-sans antialiased text-stone-100 min-h-screen bg-stone-950">
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
        />
        {showLeaderboard && (
          <LeaderboardModal
            currentStudentCode={student?.studentCode}
            onClose={() => setShowLeaderboard(false)}
          />
        )}
      </div>
    );
  }

  // Render Story Prologue
  if (screen === 'STORY_PROLOGUE') {
    return (
      <div className="font-sans antialiased text-stone-100 min-h-screen bg-stone-950">
        <StoryPrologue onComplete={handlePrologueComplete} />
      </div>
    );
  }

  // Render Ending Screen
  if (screen === 'ENDING') {
    return (
      <div className="font-sans antialiased text-stone-100 min-h-screen bg-stone-950">
        <EndingScreen
          student={student}
          score={score}
          clearedStages={clearedStages}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
          onRestart={handleRestartAdventure}
        />
        {showLeaderboard && (
          <LeaderboardModal
            currentStudentCode={student.studentCode}
            onClose={() => setShowLeaderboard(false)}
          />
        )}
      </div>
    );
  }

  // Main 1-to-5 Stage Play Screen
  return (
    <div className="font-sans antialiased text-stone-100 min-h-screen bg-stone-950 flex flex-col">
      {/* Top Header: Student badge, Stage status, Score, Audio Controls, Leaderboard */}
      <HeaderNav
        student={student}
        score={score}
        currentStage={currentStage}
        clearedStages={clearedStages}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        onSelectStage={handleSelectStage}
        onLogout={handleLogout}
      />

      {/* Main 1 to 5 Stage Arena */}
      <main className="flex-1 flex flex-col justify-center py-4 sm:py-6">
        <StagePlayView
          student={student}
          currentStageNumber={currentStage}
          score={score}
          clearedStages={clearedStages}
          onStageCleared={handleStageCleared}
          onSelectStage={handleSelectStage}
          onGoToEnding={handleGoToEnding}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
        />
      </main>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <LeaderboardModal
          currentStudentCode={student.studentCode}
          onClose={() => setShowLeaderboard(false)}
        />
      )}
    </div>
  );
}
