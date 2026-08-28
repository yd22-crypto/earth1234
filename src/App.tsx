/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  GameScreen,
  StudentProfile,
  PlayerStats,
  ClimateState,
  Monster,
  Dungeon,
  UpcycleRecipe,
} from './types';
import {
  DUNGEONS,
  FINAL_BOSS,
  UPCYCLE_RECIPES,
} from './data/gameContent';
import { soundManager } from './utils/audio';
import {
  getStoredProfiles,
  updateStudentResult,
  calculateEcoScore,
  saveStudentProgressAsync,
} from './utils/studentStorage';

import { LoginScreen } from './components/LoginScreen';
import { StoryPrologue } from './components/StoryPrologue';
import { HeaderNav } from './components/HeaderNav';
import { VillageView } from './components/VillageView';
import { VillageHuntSelect } from './components/VillageHuntSelect';
import { BattleArena } from './components/BattleArena';
import { TreeGarden } from './components/TreeGarden';
import { UpcycleWorkshop } from './components/UpcycleWorkshop';
import { DungeonSelect } from './components/DungeonSelect';
import { EndingScreen } from './components/EndingScreen';
import { LeaderboardModal } from './components/LeaderboardModal';

export default function App() {
  // Navigation screen
  const [screen, setScreen] = useState<GameScreen>('LOGIN');

  // Student Profile
  const [student, setStudent] = useState<StudentProfile | null>(null);

  // Audio mute toggle
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Leaderboard modal toggle
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Player RPG Stats
  const [stats, setStats] = useState<PlayerStats>({
    hp: 100,
    maxHp: 100,
    level: 1,
    exp: 0,
    maxExp: 50,
    atk: 14,
    def: 5,
    gold: 40,
  });

  // 3 Core Climate Variables + Sub-resources
  const [climate, setClimate] = useState<ClimateState>({
    trees: 2,
    waste: 4,
    recycledCount: 0,
    food: 5,
    maxFood: 25,
    treeSaplings: 3,
    airPurity: 18,
  });

  // Cumulative game performance for this session
  const [sessionMonstersDefeated, setSessionMonstersDefeated] = useState(0);
  const [sessionDungeonsCleared, setSessionDungeonsCleared] = useState(0);

  // Dungeons and Upcycle recipes states
  const [dungeons, setDungeons] = useState<Dungeon[]>(DUNGEONS);
  const [recipes, setRecipes] = useState<UpcycleRecipe[]>(UPCYCLE_RECIPES);

  // Active monster for battle
  const [activeMonster, setActiveMonster] = useState<Monster | null>(null);

  // Sound toggle handler
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setSoundEnabled(next);
  };

  // Helper to persist student progress to server and local cache
  const persistProgress = (override?: {
    stats?: PlayerStats;
    climate?: ClimateState;
    monstersDefeated?: number;
    dungeonsCleared?: number;
    bossDefeated?: boolean;
    dungeonsList?: Dungeon[];
    recipesList?: UpcycleRecipe[];
  }) => {
    if (!student) return;

    const currentStats = override?.stats ?? stats;
    const currentClimate = override?.climate ?? climate;
    const currentMonsters = override?.monstersDefeated ?? sessionMonstersDefeated;
    const currentDungeons = override?.dungeonsCleared ?? sessionDungeonsCleared;
    const isBossDefeated = Boolean(override?.bossDefeated || student.bossDefeated);
    const activeDungeons = override?.dungeonsList ?? dungeons;
    const activeRecipes = override?.recipesList ?? recipes;

    const clearedDungeonIds = activeDungeons.filter((d) => d.cleared).map((d) => d.boss.id);
    const craftedRecipeIds = activeRecipes.filter((r) => r.crafted).map((r) => r.id);

    saveStudentProgressAsync({
      studentCode: student.studentCode,
      name: student.name,
      stats: currentStats,
      climate: currentClimate,
      monstersDefeated: currentMonsters,
      dungeonsCleared: currentDungeons,
      clearedDungeonIds,
      craftedRecipeIds,
      bossDefeated: isBossDefeated,
    }).then(({ profile }) => {
      setStudent((prev) => (prev ? { ...prev, ...profile } : profile));
    });
  };

  // Student Login Success
  const handleLoginSuccess = (profile: StudentProfile, startFresh = false) => {
    setStudent(profile);
    soundManager.unlock();
    soundManager.playSkill();

    if (!startFresh && profile.savedGameState) {
      const saved = profile.savedGameState;
      if (saved.stats) setStats(saved.stats);
      if (saved.climate) setClimate(saved.climate);
      if (typeof saved.monstersDefeated === 'number') {
        setSessionMonstersDefeated(saved.monstersDefeated);
      }
      if (typeof saved.dungeonsCleared === 'number') {
        setSessionDungeonsCleared(saved.dungeonsCleared);
      }
      if (saved.clearedDungeonIds && Array.isArray(saved.clearedDungeonIds)) {
        setDungeons((prev) =>
          prev.map((d) => ({
            ...d,
            cleared: saved.clearedDungeonIds.includes(d.boss.id),
          }))
        );
      }
      if (saved.craftedRecipeIds && Array.isArray(saved.craftedRecipeIds)) {
        setRecipes((prev) =>
          prev.map((r) => ({
            ...r,
            crafted: saved.craftedRecipeIds.includes(r.id),
          }))
        );
      }
      setScreen('VILLAGE');
    } else {
      setScreen('STORY_PROLOGUE');
    }
  };

  // Prologue Completed -> Go to Village Hub
  const handlePrologueComplete = () => {
    setScreen('VILLAGE');
  };

  // Quick Eat Food from Header
  const handleQuickEatFood = () => {
    if (climate.food <= 0 || stats.hp >= stats.maxHp) return;
    soundManager.playEatFood();
    const nextFood = climate.food - 1;
    const nextHp = Math.min(stats.maxHp, stats.hp + 35);
    const nextStats = { ...stats, hp: nextHp };
    const nextClimate = { ...climate, food: nextFood };
    setClimate(nextClimate);
    setStats(nextStats);
    persistProgress({ stats: nextStats, climate: nextClimate });
  };

  // Start Hunting Village Monster
  const handleSelectVillageMonster = (monster: Monster) => {
    setActiveMonster(monster);
    setScreen('BATTLE');
  };

  // Enter Emergent Dungeon Boss
  const handleEnterDungeon = (dungeon: Dungeon) => {
    if (climate.food < dungeon.requiredFood) return;
    // Deduct entry food
    const nextFood = climate.food - dungeon.requiredFood;
    const nextClimate = { ...climate, food: nextFood };
    setClimate(nextClimate);
    persistProgress({ climate: nextClimate });
    setActiveMonster(dungeon.boss);
    setScreen('BATTLE');
  };

  // Enter Final Boss
  const handleEnterFinalBoss = () => {
    setActiveMonster(FINAL_BOSS);
    setScreen('BATTLE');
  };

  // Plant Trees in Garden
  const handlePlantTree = (amount: number) => {
    if (climate.treeSaplings <= 0) return;
    const toPlant = Math.min(climate.treeSaplings, amount);

    const nextTrees = climate.trees + toPlant;
    const nextSaplings = climate.treeSaplings - toPlant;
    const nextPurity = Math.min(
      100,
      Math.round(10 + nextTrees * 3.5 + climate.recycledCount * 2)
    );

    const nextClimate: ClimateState = {
      ...climate,
      trees: nextTrees,
      treeSaplings: nextSaplings,
      airPurity: nextPurity,
    };

    setClimate(nextClimate);
    persistProgress({ climate: nextClimate });
  };

  // Upcycle Crafting
  const handleCraftRecipe = (recipeId: string) => {
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe || recipe.crafted) return;

    if (climate.waste < recipe.requiredWaste || stats.gold < recipe.requiredGold) return;

    // Deduct resources
    const nextWaste = climate.waste - recipe.requiredWaste;
    const nextGold = stats.gold - recipe.requiredGold;
    const nextRecycledCount = climate.recycledCount + recipe.requiredWaste;
    const nextPurity = Math.min(
      100,
      Math.round(10 + climate.trees * 3.5 + nextRecycledCount * 2)
    );

    // Apply Stat bonus
    let nextAtk = stats.atk;
    let nextDef = stats.def;
    let nextMaxHp = stats.maxHp;
    let nextHp = stats.hp;
    let nextSaplings = climate.treeSaplings;

    if (recipe.statBonus.atk) nextAtk += recipe.statBonus.atk;
    if (recipe.statBonus.def) nextDef += recipe.statBonus.def;
    if (recipe.statBonus.maxHp) {
      nextMaxHp += recipe.statBonus.maxHp;
      nextHp += recipe.statBonus.maxHp;
    }
    if (recipe.statBonus.saplings) nextSaplings += recipe.statBonus.saplings;

    const nextStats: PlayerStats = {
      ...stats,
      atk: nextAtk,
      def: nextDef,
      maxHp: nextMaxHp,
      hp: nextHp,
      gold: nextGold,
    };

    const nextClimate: ClimateState = {
      ...climate,
      waste: nextWaste,
      recycledCount: nextRecycledCount,
      treeSaplings: nextSaplings,
      airPurity: nextPurity,
    };

    const nextRecipes = recipes.map((r) => (r.id === recipeId ? { ...r, crafted: true } : r));

    setStats(nextStats);
    setClimate(nextClimate);
    setRecipes(nextRecipes);

    persistProgress({
      stats: nextStats,
      climate: nextClimate,
      recipesList: nextRecipes,
    });
  };

  // Battle Victory Callback
  const handleBattleVictory = (rewards: {
    exp: number;
    gold: number;
    waste: number;
    saplings: number;
    food: number;
    monsterId: string;
    category: 'village' | 'dungeon' | 'final';
  }) => {
    // 1. Check if final boss
    if (rewards.category === 'final') {
      const finalMonsters = sessionMonstersDefeated + 1;
      setSessionMonstersDefeated(finalMonsters);
      persistProgress({
        monstersDefeated: finalMonsters,
        bossDefeated: true,
      });
      setScreen('ENDING');
      return;
    }

    // 2. Normal / Dungeon victory handling
    const newMonstersDefeated = sessionMonstersDefeated + 1;
    let newDungeonsCleared = sessionDungeonsCleared;
    let updatedDungeons = dungeons;

    if (rewards.category === 'dungeon') {
      newDungeonsCleared += 1;
      setSessionDungeonsCleared(newDungeonsCleared);

      // Mark dungeon as cleared
      updatedDungeons = dungeons.map((d) =>
        d.boss.id === rewards.monsterId ? { ...d, cleared: true } : d
      );
      setDungeons(updatedDungeons);
    }
    setSessionMonstersDefeated(newMonstersDefeated);

    // EXP & Level Up calculation
    let nextExp = stats.exp + rewards.exp;
    let nextLevel = stats.level;
    let nextMaxExp = stats.maxExp;
    let nextAtk = stats.atk;
    let nextDef = stats.def;
    let nextMaxHp = stats.maxHp;
    let nextHp = stats.hp;

    while (nextExp >= nextMaxExp) {
      nextExp -= nextMaxExp;
      nextLevel += 1;
      nextMaxExp = Math.round(nextMaxExp * 1.5);
      nextAtk += 4;
      nextDef += 2;
      nextMaxHp += 20;
      nextHp = nextMaxHp; // Fully heal on level up
      soundManager.playLevelUp();
    }

    const nextGold = stats.gold + rewards.gold;
    const nextWaste = climate.waste + rewards.waste;
    const nextSaplings = climate.treeSaplings + rewards.saplings;
    const nextFood = Math.min(climate.maxFood, climate.food + rewards.food);

    const nextStats: PlayerStats = {
      ...stats,
      exp: nextExp,
      level: nextLevel,
      maxExp: nextMaxExp,
      atk: nextAtk,
      def: nextDef,
      maxHp: nextMaxHp,
      hp: nextHp,
      gold: nextGold,
    };

    const nextClimate: ClimateState = {
      ...climate,
      waste: nextWaste,
      treeSaplings: nextSaplings,
      food: nextFood,
    };

    setStats(nextStats);
    setClimate(nextClimate);

    persistProgress({
      stats: nextStats,
      climate: nextClimate,
      monstersDefeated: newMonstersDefeated,
      dungeonsCleared: newDungeonsCleared,
      dungeonsList: updatedDungeons,
    });

    // Return to village or dungeon list
    if (rewards.category === 'dungeon') {
      setScreen('DUNGEON_SELECT');
    } else {
      setScreen('HUNT');
    }
  };

  // Player faint handler
  const handlePlayerFaint = () => {
    // Revive with 30% HP in village
    setStats((prev) => ({
      ...prev,
      hp: Math.max(25, Math.floor(prev.maxHp * 0.3)),
    }));
    setScreen('VILLAGE');
  };

  // Flee battle
  const handleFleeBattle = () => {
    setScreen('VILLAGE');
  };

  // Restart game after ending
  const handleRestartAdventure = () => {
    setStats({
      hp: 100,
      maxHp: 100,
      level: 1,
      exp: 0,
      maxExp: 50,
      atk: 14,
      def: 5,
      gold: 40,
    });
    setClimate({
      trees: 2,
      waste: 4,
      recycledCount: 0,
      food: 5,
      maxFood: 25,
      treeSaplings: 3,
      airPurity: 18,
    });
    setSessionMonstersDefeated(0);
    setSessionDungeonsCleared(0);
    setDungeons(DUNGEONS);
    setRecipes(UPCYCLE_RECIPES);
    setScreen('VILLAGE');
  };

  // Render Login Screen if not logged in
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
          stats={stats}
          climate={climate}
          monstersDefeated={sessionMonstersDefeated}
          dungeonsCleared={sessionDungeonsCleared}
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

  // Main Gameplay Wrapper with persistent Header
  return (
    <div className="font-sans antialiased text-stone-100 min-h-screen bg-stone-950 flex flex-col">
      {/* Top Status & Climate Variables Header */}
      <HeaderNav
        student={student}
        stats={stats}
        climate={climate}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        onQuickEatFood={handleQuickEatFood}
        onGoToVillage={() => setScreen('VILLAGE')}
      />

      {/* Main Screen Content */}
      <main className="flex-1 pb-10">
        {screen === 'VILLAGE' && (
          <VillageView
            student={student}
            stats={stats}
            climate={climate}
            hasDungeonUnlocked={true}
            onGoHunt={() => setScreen('HUNT')}
            onGoDungeon={() => setScreen('DUNGEON_SELECT')}
            onGoUpcycle={() => setScreen('UPCYCLE_WORKSHOP')}
            onGoTreeGarden={() => setScreen('TREE_GARDEN')}
            onGoFinalBoss={handleEnterFinalBoss}
          />
        )}

        {screen === 'HUNT' && (
          <VillageHuntSelect
            stats={stats}
            onSelectMonster={handleSelectVillageMonster}
            onBack={() => setScreen('VILLAGE')}
          />
        )}

        {screen === 'BATTLE' && activeMonster && (
          <BattleArena
            monster={activeMonster}
            stats={stats}
            climate={climate}
            onVictory={handleBattleVictory}
            onPlayerFaint={handlePlayerFaint}
            onFlee={handleFleeBattle}
            onUpdateStats={setStats}
            onUpdateClimate={setClimate}
          />
        )}

        {screen === 'TREE_GARDEN' && (
          <TreeGarden
            climate={climate}
            stats={stats}
            onPlantTree={handlePlantTree}
            onBack={() => setScreen('VILLAGE')}
          />
        )}

        {screen === 'UPCYCLE_WORKSHOP' && (
          <UpcycleWorkshop
            climate={climate}
            stats={stats}
            recipes={recipes}
            onCraftRecipe={handleCraftRecipe}
            onBack={() => setScreen('VILLAGE')}
          />
        )}

        {screen === 'DUNGEON_SELECT' && (
          <DungeonSelect
            dungeons={dungeons}
            stats={stats}
            climate={climate}
            onEnterDungeon={handleEnterDungeon}
            onBack={() => setScreen('VILLAGE')}
          />
        )}
      </main>

      {/* Classroom Leaderboard Modal */}
      {showLeaderboard && (
        <LeaderboardModal
          currentStudentCode={student.studentCode}
          onClose={() => setShowLeaderboard(false)}
        />
      )}
    </div>
  );
}
