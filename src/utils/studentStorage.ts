import { StudentProfile, SavedGameState, PlayerStats, ClimateState } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from 'firebase/firestore';

const STORAGE_KEY_PROFILES = 'climate_rpg_student_profiles_v2';
const STORAGE_KEY_CURRENT_CODE = 'climate_rpg_current_student_code_v2';

export function getStudentDocId(code: string): string {
  return code.trim().replace(/\//g, '-').replace(/\s+/g, '_') || 'student_guest';
}

// Initial sample student records for demonstration in classroom and cross-link seeding
const INITIAL_DEMO_PROFILES: StudentProfile[] = [
  {
    studentCode: '현종',
    name: '현종',
    highScore: 3400,
    currentScore: 3400,
    currentStage: 3,
    stagesCleared: [1, 2],
    totalPlays: 6,
    monstersDefeated: 0,
    dungeonsCleared: 0,
    treesPlanted: 2,
    wasteRecycled: 0,
    bossDefeated: false,
    title: '♻️ 자원순환 연금술사',
    lastUpdated: Date.now(),
  },
  {
    studentCode: 'ECO-01',
    name: '김민지',
    className: '3학년 1반',
    highScore: 8850,
    currentScore: 8850,
    currentStage: 1,
    stagesCleared: [],
    totalPlays: 5,
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
    currentStage: 1,
    stagesCleared: [],
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
    currentStage: 1,
    stagesCleared: [],
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
    currentStage: 1,
    stagesCleared: [],
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
    currentStage: 1,
    stagesCleared: [],
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
    currentStage: 1,
    stagesCleared: [],
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
// FIREBASE FIRESTORE CLOUD INTEGRATION (Cross-URL / Cross-Device)
// ----------------------------------------------------

/**
 * Fetch a student from Firebase Firestore
 */
export async function fetchStudentFromFirestore(studentCode: string): Promise<StudentProfile | null> {
  const cleanCode = studentCode.trim();
  if (!cleanCode) return null;
  const docId = getStudentDocId(cleanCode);
  const docPath = `students/${docId}`;

  try {
    const snap = await getDoc(doc(db, 'students', docId));
    if (snap.exists()) {
      const data = snap.data() as StudentProfile;
      return {
        ...data,
        studentCode: data.studentCode || cleanCode,
        currentStage: data.currentStage ?? 1,
        stagesCleared: data.stagesCleared ?? [],
        highScore: data.highScore ?? 0,
        currentScore: data.currentScore ?? 0,
      };
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permission')) {
      handleFirestoreError(error, OperationType.GET, docPath);
    } else {
      console.warn('Firestore fetch student note:', error);
    }
  }
  return null;
}

/**
 * Save student profile to Firebase Firestore
 */
export async function saveStudentToFirestore(profile: StudentProfile): Promise<boolean> {
  const cleanCode = profile.studentCode?.trim();
  if (!cleanCode) return false;
  const docId = getStudentDocId(cleanCode);
  const docPath = `students/${docId}`;

  try {
    const cleanPayload: StudentProfile = {
      studentCode: cleanCode,
      name: profile.name?.trim() || '익명의 수호자',
      className: profile.className || '',
      highScore: Number(profile.highScore) || 0,
      currentScore: Number(profile.currentScore) || 0,
      currentStage: Number(profile.currentStage) || 1,
      stagesCleared: Array.isArray(profile.stagesCleared) ? profile.stagesCleared : [],
      totalPlays: Number(profile.totalPlays) || 1,
      title: String(profile.title || '🌱 새내기 에코 나이트'),
      monstersDefeated: Number(profile.monstersDefeated) || 0,
      dungeonsCleared: Number(profile.dungeonsCleared) || 0,
      treesPlanted: Number(profile.treesPlanted) || 0,
      wasteRecycled: Number(profile.wasteRecycled) || 0,
      bossDefeated: Boolean(profile.bossDefeated),
      lastUpdated: Number(profile.lastUpdated) || Date.now(),
    };

    await setDoc(doc(db, 'students', docId), cleanPayload, { merge: true });
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('permission')) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    } else {
      console.warn('Firestore save student note:', error);
    }
    return false;
  }
}

/**
 * Fetch all students from Firestore for class leaderboard
 */
export async function fetchLeaderboardFromFirestore(): Promise<StudentProfile[]> {
  const collectionPath = 'students';
  try {
    const snap = await getDocs(collection(db, collectionPath));
    const list: StudentProfile[] = [];
    snap.forEach((d) => {
      list.push(d.data() as StudentProfile);
    });

    if (list.length > 0) {
      list.sort((a, b) => b.highScore - a.highScore);
      return list;
    } else {
      // First-time setup: seed demo students and '현종' to Firestore
      for (const demo of INITIAL_DEMO_PROFILES) {
        await saveStudentToFirestore(demo);
      }
      return [...INITIAL_DEMO_PROFILES].sort((a, b) => b.highScore - a.highScore);
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permission')) {
      handleFirestoreError(error, OperationType.LIST, collectionPath);
    } else {
      console.warn('Firestore fetch leaderboard note:', error);
    }
  }
  return [];
}

/**
 * Unified fetch across Firestore, Express server, and Local Cache
 */
export async function fetchLeaderboardFromServer(): Promise<StudentProfile[]> {
  // 1. Primary: Cloud Firestore (accessible from any URL, shared link, device)
  try {
    const cloudList = await fetchLeaderboardFromFirestore();
    if (cloudList.length > 0) {
      const map: Record<string, StudentProfile> = {};
      cloudList.forEach((p) => {
        map[p.studentCode] = p;
      });
      saveProfilesMap(map);
      return cloudList;
    }
  } catch (err) {
    console.warn('Firestore leaderboard error, trying Express fallback:', err);
  }

  // 2. Secondary: Express container API
  try {
    const res = await fetch('/api/leaderboard', { cache: 'no-store' });
    if (res.ok) {
      const list: StudentProfile[] = await res.json();
      if (Array.isArray(list) && list.length > 0) {
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

/**
 * Direct lookup of a student's profile by code across Firestore, Express, and LocalStorage
 */
export async function fetchStudentFromServer(
  studentCode: string
): Promise<StudentProfile | null> {
  const cleanCode = studentCode.trim();
  if (!cleanCode) return null;

  // 1. Primary: Cloud Firestore (instant lookup across any URL, mobile, or Chromebook)
  try {
    const cloudProfile = await fetchStudentFromFirestore(cleanCode);
    if (cloudProfile) {
      const profiles = getStoredProfiles();
      profiles[cloudProfile.studentCode] = cloudProfile;
      saveProfilesMap(profiles);
      return cloudProfile;
    }
  } catch (err) {
    console.warn('Firestore student lookup note:', err);
  }

  // 2. Secondary: Express backend API
  try {
    const res = await fetch(`/api/student/${encodeURIComponent(cleanCode)}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const profile: StudentProfile = await res.json();
      if (profile && profile.studentCode) {
        const profiles = getStoredProfiles();
        profiles[profile.studentCode] = profile;
        saveProfilesMap(profiles);
        // Sync to Firestore for other URLs
        saveStudentToFirestore(profile);
        return profile;
      }
    }
  } catch (err) {
    console.warn('Student server fetch failed, fallback to local:', err);
  }

  const localMap = getStoredProfiles();
  return localMap[cleanCode] || null;
}

export async function loginStudentAsync(
  studentCode: string,
  name: string
): Promise<StudentProfile> {
  const cleanCode = studentCode.trim();
  const cleanName = name.trim() || '익명의 수호자';

  // 1. Check Cloud Firestore first (works across shared link, different URLs, new devices)
  try {
    const cloudProfile = await fetchStudentFromFirestore(cleanCode);
    if (cloudProfile) {
      const updatedCloud: StudentProfile = {
        ...cloudProfile,
        name: cleanName !== '익명의 수호자' ? cleanName : cloudProfile.name,
        totalPlays: (cloudProfile.totalPlays || 1) + 1,
        lastUpdated: Date.now(),
      };
      await saveStudentToFirestore(updatedCloud);

      const profiles = getStoredProfiles();
      profiles[updatedCloud.studentCode] = updatedCloud;
      saveProfilesMap(profiles);
      setLastStudentCode(updatedCloud.studentCode);

      // Background sync to Express server
      fetch('/api/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentCode: cleanCode, name: updatedCloud.name }),
      }).catch(() => {});

      return updatedCloud;
    }
  } catch (err) {
    console.warn('Cloud login check fallback:', err);
  }

  // 2. Check local profile or create new
  const localProfile = loginOrRegisterStudent(cleanCode, cleanName);

  // Save new student to Cloud Firestore immediately
  saveStudentToFirestore(localProfile).catch(() => {});

  // Background sync to Express server
  fetch('/api/student/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentCode: cleanCode, name: localProfile.name }),
  }).catch(() => {});

  return localProfile;
}

export interface SaveStudentPayload {
  studentCode: string;
  name: string;
  score?: number;
  currentStage?: number;
  stagesCleared?: number[];
  title?: string;
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
): Promise<{ profile: StudentProfile; rank?: number; score?: number; savedToServer: boolean }> {
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
    const existing = localProfile.stagesCleared || [];
    localProfile.stagesCleared = Array.from(new Set([...existing, ...payload.stagesCleared])).sort((a, b) => a - b);
  }
  if (payload.title) {
    localProfile.title = payload.title;
  }
  if (payload.bossDefeated) {
    localProfile.bossDefeated = true;
    localProfile.title = '👑 지구의 구원자';
  }
  localProfile.lastUpdated = Date.now();
  profiles[payload.studentCode] = localProfile;
  saveProfilesMap(profiles);

  // 2. Persist to Cloud Firestore (cross-link / cross-device)
  let cloudSuccess = false;
  try {
    cloudSuccess = await saveStudentToFirestore(localProfile);
  } catch (err) {
    console.warn('Firestore progress save failed:', err);
  }

  // 3. Also persist to Express container backend
  let serverSuccess = false;
  let serverRank: number | undefined;
  try {
    const res = await fetch('/api/student/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      serverSuccess = true;
      serverRank = data.rank;
    }
  } catch (err) {
    console.warn('Express server save failed:', err);
  }

  return {
    profile: localProfile,
    rank: serverRank,
    score: localProfile.highScore,
    savedToServer: cloudSuccess || serverSuccess,
  };
}

export async function resetAllStudentDataAsync(): Promise<void> {
  // 1. Reset Cloud Firestore records
  try {
    const snap = await getDocs(collection(db, 'students'));
    for (const d of snap.docs) {
      await setDoc(
        doc(db, 'students', d.id),
        {
          highScore: 0,
          currentScore: 0,
          currentStage: 1,
          stagesCleared: [],
          lastUpdated: Date.now(),
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn('Firestore reset warning:', err);
  }

  // 2. Reset Express server records
  try {
    await fetch('/api/student/reset', { method: 'POST' });
  } catch (err) {
    console.warn('Express reset warning:', err);
  }

  // 3. Reset local storage
  localStorage.removeItem(STORAGE_KEY_PROFILES);
  localStorage.removeItem(STORAGE_KEY_CURRENT_CODE);
}

export function resetAllStudentData() {
  resetAllStudentDataAsync();
}
