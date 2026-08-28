import React, { useState } from 'react';
import { PROLOGUE_SCENES } from '../data/gameContent';
import { soundManager } from '../utils/audio';
import { ChevronRight, FastForward, Sparkles, BookOpen } from 'lucide-react';

interface StoryPrologueProps {
  onComplete: () => void;
}

export const StoryPrologue: React.FC<StoryPrologueProps> = ({ onComplete }) => {
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const currentScene = PROLOGUE_SCENES[currentSceneIdx];

  const handleNext = () => {
    soundManager.playSkill();
    if (currentSceneIdx < PROLOGUE_SCENES.length - 1) {
      setCurrentSceneIdx((prev) => prev + 1);
    } else {
      soundManager.playVictory();
      onComplete();
    }
  };

  const handleSkip = () => {
    soundManager.playSkill();
    onComplete();
  };

  return (
    <div
      id="story-prologue-root"
      className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-4 sm:p-6 select-none"
    >
      <div className="w-full max-w-3xl bg-stone-900 rounded-3xl border border-stone-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Top bar with progress and skip */}
        <div className="px-5 py-3.5 bg-stone-900/90 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <BookOpen className="w-4 h-4" />
            <span>프롤로그: 이세계의 부름 ({currentSceneIdx + 1} / {PROLOGUE_SCENES.length})</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1 mr-2">
              {PROLOGUE_SCENES.map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-1.5 rounded-full transition-all duration-300 ${
                    i === currentSceneIdx
                      ? 'bg-emerald-400 w-8'
                      : i < currentSceneIdx
                      ? 'bg-emerald-700'
                      : 'bg-stone-800'
                  }`}
                />
              ))}
            </div>
            <button
              id="skip-prologue-btn"
              type="button"
              onClick={handleSkip}
              className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-stone-400 hover:text-white bg-stone-800 hover:bg-stone-700 transition-colors"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>스킵</span>
            </button>
          </div>
        </div>

        {/* Scene Image Frame */}
        <div className="relative aspect-video w-full bg-black overflow-hidden group">
          <img
            key={currentScene.id}
            src={currentScene.imageSrc}
            alt="스토리 씬"
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            referrerPolicy="no-referrer"
          />

          {/* Vignette & Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-black/30 pointer-events-none" />

          {/* Scene Badge */}
          <div className="absolute top-4 left-4 z-10">
            <span className="px-3 py-1 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-lg">
              {currentScene.badge}
            </span>
          </div>
        </div>

        {/* Dialogue Box */}
        <div className="p-6 sm:p-8 bg-stone-950 border-t border-stone-800 flex flex-col justify-between">
          <div>
            {/* Speaker Name Tag */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-stone-800 border border-stone-700 text-emerald-400 font-bold text-sm mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{currentScene.speaker}</span>
            </div>

            {/* Story Text */}
            <p className="text-base sm:text-lg text-stone-200 leading-relaxed min-h-[4.5rem] whitespace-pre-line font-medium">
              {currentScene.text}
            </p>
          </div>

          {/* Action Button */}
          <div className="mt-6 flex justify-end">
            <button
              id="next-prologue-btn"
              type="button"
              onClick={handleNext}
              className="px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <span>
                {currentSceneIdx === PROLOGUE_SCENES.length - 1 ? '에테리아 대륙 입장!' : '다음 이야기'}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
