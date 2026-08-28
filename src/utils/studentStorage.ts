import { StudentProfile, SavedGameState, PlayerStats, ClimateState } from '../types';

const STORAGE_KEY_PROFILES = 'climate_rpg_student_profiles_v2';
const STORAGE_KEY_CURRENT_CODE = 'climate_rpg_current_student_code_v2';

// Initial sample student records for demonstration in classroom
const INITIAL_DEMO_PROFILES: StudentProfile[] = [
  {
    studentCode: 'ECO-01',
    name: '김민지',
    className: '3학년 1반',
    highScore: 8850,
    currentScore: 8850,
    totalPlays: 4,
    monstersDefeated: 22,
    dungeonsCleared: 3,
    treesPlanted: 28,
    wasteRecycled: 46,
    bossDefeated: true,
    title: '👑 지구의 구원자',
    lastUpdated: Date.now() - 3600000 * 2,
  },
  {
    studentCode: 'ECO-02',
    name: '이도윤',
    className: '3학년 1반',
    highScore: 6720,
    currentScore: 6720,
    totalPlays: 3,
    monstersDefeated: 16,
    dungeonsCleared: 2,
    treesPlanted: 20,
    wasteRecycled: 32,
    bossDefeated: false,
    title: '🌲 숲의 정령 수호자',
    lastUpdated: Date.now() - 3600000 * 5,
  },
  {
    studentCode: 'ECO-03',
    name: '박서아',
    className: '3학년 1반',
    highScore: 5180,
    currentScore: 5180,
    totalPlays: 2,
    monstersDefeated: 12,
    dungeonsCleared: 1,
    treesPlanted: 14,
    wasteRecycled: 24,
    bossDefeated: false,
    title: '♻️ 자원순환 연금술사',
    lastUpdated: Date.now() - 3600000 * 9,
  },
  {
    studentCode: 'ECO-04',
    name: '최하준',
    className: '3학년 1반',
    highScore: 3450,
    currentScore: 3450,
    totalPlays: 2,
    monstersDefeated: 9,
    dungeonsCleared: 1,
    treesPlanted: 8,
    wasteRecycled: 16,
    bossDefeated: false,
    title: '🌱 견습 자연 파수꾼',
    lastUpdated: Date.now() - 3600000 * 14,
  },
];

export function getStoredProfiles(): Record<string, StudentProfile> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILES);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore error
  }

  // Seed with default profiles
  const initialMap: Record<string, StudentProfile> = {};
  INITIAL_DEMO_PROFILES.forEach((p) => {
    initialMap[p.studentCode] = p;
  });
  saveProfilesMap(initialMap);
  return initialMap;
}

export function saveProfilesMap(map: Record<string, StudentProfile>) {
  try {
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(map));
  } catch {
    // Ignore error
  }
}

export function getLastStudentCode(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_CURRENT_CODE) || '';
  } catch {
    return '';
  }
}

export function setLastStudentCode(code: string) {
  try {
    localStorage.setItem(STORAGE_KEY_CURRENT_CODE, code);
  } catch {
    // Ignore
  }
}

/**
 * Calculate student score and grant appropriate eco titles
 */
export function calculateEcoScore(stats: {
  level: number;
  monstersDefeated: number;
  dungeonsCleared: number;
  treesPlanted: number;
  wasteRecycled: number;
  foodRemaining: number;
  bossDefeated: boolean;
}): { score: number; title: string } {
  let score = 0;
  score += Math.max(1, stats.level) * 350;
  score += Math.max(0, stats.monstersDefeated) * 50;
  score += Math.max(0, stats.dungeonsCleared) * 600;
  score += Math.max(0, stats.treesPlanted) * 80;
  score += Math.max(0, stats.wasteRecycled) * 50;
  score += Math.min(Math.max(0, stats.foodRemaining), 25) * 30;

  if (stats.bossDefeated) {
    score += 2500;
  }

  let title = '🌱 새내기 에코 나이트';
  if (stats.bossDefeated) {
    title = '👑 지구의 구원자';
  } else if (score >= 6000 || stats.treesPlanted >= 20) {
    title = '🌲 숲의 정령 수호자';
  } else if (score >= 4000 || stats.wasteRecycled >= 20) {
    title = '♻️ 자원순환 연금술사';
  } else if (score >= 2000 || stats.dungeonsCleared >= 1) {
    title = '🛡️ 청정 용기사';
  }

  return { score, title };
}

// Synchronous local login
export function loginOrRegisterStudent(studentCode: string, name: string): StudentProfile {
  const cleanCode = studentCode.trim();
  const cleanName = name.trim() || '익명의 수호자';
  const profiles = getStoredProfiles();

  if (profiles[cleanCode]) {
    if (cleanName && cleanName !== '익명의 수호자') {
      profiles[cleanCode].name = cleanName;
    }
    profiles[cleanCode].totalPlays = (profiles[cleanCode].totalPlays || 1) + 1;
    profiles[cleanCode].lastUpdated = Date.now();
    saveProfilesMap(profiles);
    setLastStudentCode(cleanCode);
    return profiles[cleanCode];
  }

  const { score, title } = calculateEcoScore({
    level: 1,
    monstersDefeated: 0,
    dungeonsCleared: 0,
    treesPlanted: 2,
    wasteRecycled: 0,
    foodRemaining: 5,
    bossDefeated: false,
  });

  const newProfile: StudentProfile = {
    studentCode: cleanCode,
    name: cleanName,
    highScore: score,
    currentScore: score,
    totalPlays: 1,
    monstersDefeated: 0,
    dungeonsCleared: 0,
    treesPlanted: 2,
    wasteRecycled: 0,
    bossDefeated: false,
    title,
    lastUpdated: Date.now(),
  };

  profiles[cleanCode] = newProfile;
  saveProfilesMap(profiles);
  setLastStudentCode(cleanCode);
  return newProfile;
}

// Synchronous local update
export function updateStudentResult(
  studentCode: string,
  gameStats: {
    level: number;
    monstersDefeated: number;
    dungeonsCleared: number;
    treesPlanted: number;
    wasteRecycled: number;
    foodRemaining: number;
    bossDefeated: boolean;
  }
): StudentProfile {
  const profiles = getStoredProfiles();
  const profile = profiles[studentCode] || {
    studentCode,
    name: '학생',
    highScore: 0,
    currentScore: 0,
    totalPlays: 1,
    monstersDefeated: 0,
    dungeonsCleared: 0,
    treesPlanted: 0,
    wasteRecycled: 0,
    bossDefeated: false,
    title: '🌱 새내기 에코 나이트',
    lastUpdated: Date.now(),
  };

  const { score, title } = calculateEcoScore(gameStats);

  profile.currentScore = score;
  profile.highScore = Math.max(profile.highScore, score);
  profile.monstersDefeated = Math.max(profile.monstersDefeated, gameStats.monstersDefeated);
  profile.dungeonsCleared = Math.max(profile.dungeonsCleared, gameStats.dungeonsCleared);
  profile.treesPlanted = Math.max(profile.treesPlanted, gameStats.treesPlanted);
  profile.wasteRecycled = Math.max(profile.wasteRecycled, gameStats.wasteRecycled);
  if (gameStats.bossDefeated) {
    profile.bossDefeated = true;
  }
  profile.title = title;
  profile.lastUpdated = Date.now();

  profiles[studentCode] = profile;
  saveProfilesMap(profiles);
  return profile;
}

export function getLeaderboardList(): StudentProfile[] {
  const profiles = getStoredProfiles();
  return Object.values(profiles).sort((a, b) => b.highScore - a.highScore);
}

// ----------------------------------------------------
// FULL-STACK SERVER API INTEGRATION (Cross-link persistence)
// ----------------------------------------------------

export async function fetchLeaderboardFromServer(): Promise<StudentProfile[]> {
  try {
    const res = await fetch('/api/leaderboard', { cache: 'no-store' });
    if (res.ok) {
      const list: StudentProfile[] = await res.json();
      if (Array.isArray(list) && list.length > 0) {
        // Cache to local storage
        const map: Record<string, StudentProfile> = {};
        list.forEach((p) => {
          map[p.studentCode] = p;
        });
        saveProfilesMap(map);
        return list;
      }
    }
  } catch (err) {
    console.warn('Leaderboard server fetch failed, using local storage:', err);
  }
  return getLeaderboardList();
}

export async function loginStudentAsync(
  studentCode: string,
  name: string
): Promise<StudentProfile> {
  const localProfile = loginOrRegisterStudent(studentCode, name);

  try {
    const res = await fetch('/api/student/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentCode, name }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.profile) {
        const serverProfile: StudentProfile = data.profile;
        const profiles = getStoredProfiles();
        profiles[serverProfile.studentCode] = serverProfile;
        saveProfilesMap(profiles);
        setLastStudentCode(serverProfile.studentCode);
        return serverProfile;
      }
    }
  } catch (err) {
    console.warn('Server login failed, proceeding with local profile:', err);
  }

  return localProfile;
}

export interface SaveStudentPayload {
  studentCode: string;
  name: string;
  score?: number;
  currentStage?: number;
  stagesCleared?: number[];
  stats?: PlayerStats;
  climate?: ClimateState;
  monstersDefeated?: number;
  dungeonsCleared?: number;
  clearedDungeonIds?: string[];
  craftedRecipeIds?: string[];
  bossDefeated?: boolean;
}

export async function saveStudentProgressAsync(
  payload: SaveStudentPayload
): Promise<{ profile: StudentProfile; rank?: number; score?: number }> {
  // 1. Immediately update local state for zero latency
  const profiles = getStoredProfiles();
  let localProfile = profiles[payload.studentCode];

  if (!localProfile) {
    localProfile = loginOrRegisterStudent(payload.studentCode, payload.name);
  }

  if (typeof payload.score === 'number') {
    localProfile.currentScore = Math.max(localProfile.currentScore || 0, payload.score);
    localProfile.highScore = Math.max(localProfile.highScore || 0, payload.score);
  }
  if (payload.currentStage) {
    localProfile.currentStage = Math.max(localProfile.currentStage || 1, payload.currentStage);
  }
  if (payload.stagesCleared) {
    localProfile.stagesCleared = payload.stagesCleared;
  }
  if (payload.bossDefeated) {
    localProfile.bossDefeated = true;
    localProfile.title = '👑 지구의 구원자';
  }
  localProfile.lastUpdated = Date.now();
  profiles[payload.studentCode] = localProfile;
  saveProfilesMap(profiles);

  // 2. Persist to server backend across devices/links
  try {
    const res = await fetch('/api/student/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.profile) {
        const serverProfile: StudentProfile = data.profile;
        profiles[serverProfile.studentCode] = serverProfile;
        saveProfilesMap(profiles);
        return {
          profile: serverProfile,
          rank: data.rank,
          score: data.score,
        };
      }
    }
  } catch (err) {
    console.warn('Server save failed, using local result:', err);
  }

  return { profile: localProfile };
}

export async function resetAllStudentDataAsync(): Promise<void> {
  try {
    await fetch('/api/student/reset', { method: 'POST' });
  } catch (err) {
    console.warn('Server reset failed:', err);
  }
  localStorage.removeItem(STORAGE_KEY_PROFILES);
  localStorage.removeItem(STORAGE_KEY_CURRENT_CODE);
}

export function resetAllStudentData() {
  resetAllStudentDataAsync();
}
