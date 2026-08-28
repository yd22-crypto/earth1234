export type GameScreen =
  | 'LOGIN'
  | 'STORY_PROLOGUE'
  | 'STAGE_PLAY'
  | 'ENDING'
  | 'LEADERBOARD';

export interface StageQuiz {
  id: string;
  question: string;
  options: [string, string];
  correctIndex: number;
  explanation: string;
}

export interface StageData {
  stageNumber: number; // 1 to 5
  title: string;
  subtitle: string;
  topic: string;
  monsterName: string;
  monsterEmoji: string;
  monsterMaxHp: number;
  monsterAtk: number;
  bgImage: string;
  badge: string;
  clearPoints: number;
  fact: string;
  quizzes: StageQuiz[];
}

export interface SavedGameState {
  currentStage: number;
  score: number;
  hp: number;
  maxHp: number;
  ecoEnergy: number;
  stagesCleared: number[];
  stats?: PlayerStats;
  climate?: ClimateState;
  monstersDefeated?: number;
  dungeonsCleared?: number;
  clearedDungeonIds?: string[];
  craftedRecipeIds?: string[];
}

export interface StudentProfile {
  studentCode: string;
  name: string;
  className?: string;
  highScore: number;
  currentScore?: number;
  totalPlays: number;
  currentStage?: number;
  stagesCleared?: number[];
  monstersDefeated: number;
  dungeonsCleared: number;
  treesPlanted: number;
  wasteRecycled: number;
  bossDefeated: boolean;
  title: string;
  lastUpdated: number;
  savedGameState?: SavedGameState;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  level: number;
  exp: number;
  maxExp: number;
  atk: number;
  def: number;
  gold: number;
}

export interface ClimateState {
  trees: number;          // 심은 나무 수 (산소 농도 및 방어막 증가)
  waste: number;          // 수거한 쓰레기 (업사이클링 재료)
  recycledCount: number;  // 업사이클링한 총 쓰레기
  food: number;           // 보유 식량 (체력 회복 및 탐험 스태미나)
  maxFood: number;
  treeSaplings: number;   // 보유 중인 심을 수 있는 묘목
  airPurity: number;      // 대기 정화도 (0~100%)
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  foodCost: number;
  cooldown: number;
  powerMultiplier: number;
  healPercent?: number;
  effectName: string;
}

export interface Monster {
  id: string;
  name: string;
  category: 'village' | 'dungeon' | 'final';
  emoji: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  expReward: number;
  goldReward: number;
  wasteDrop: number;      // 획득하는 쓰레기
  saplingDrop: number;    // 획득하는 묘목
  foodDrop: number;       // 획득하는 식량
  description: string;
  climateFact: string;    // 환경 교육 상식
  specialSkillName?: string;
}

export interface Dungeon {
  id: string;
  name: string;
  subtitle: string;
  recommendedLevel: number;
  requiredFood: number;
  boss: Monster;
  rewardText: string;
  cleared: boolean;
  unlocked: boolean;
  bgTheme: string;
}

export interface UpcycleRecipe {
  id: string;
  title: string;
  description: string;
  requiredWaste: number;
  requiredGold: number;
  statBonus: {
    atk?: number;
    def?: number;
    maxHp?: number;
    saplings?: number;
    food?: number;
  };
  crafted: boolean;
  icon: string;
}

export interface CombatLog {
  id: string;
  text: string;
  type: 'player' | 'enemy' | 'system' | 'heal' | 'eco';
}

export interface StoryScene {
  id: number;
  speaker: string;
  text: string;
  imageSrc: string;
  badge: string;
}
