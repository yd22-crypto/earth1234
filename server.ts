import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'students.json');

// Interface matching our app's student profile
interface StudentProfileData {
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
  savedGameState?: any;
}

const DEFAULT_DEMO_STUDENTS: StudentProfileData[] = [
  {
    studentCode: 'ECO-01',
    name: '김민지',
    className: '3학년 1반',
    highScore: 8850,
    currentScore: 8850,
    totalPlays: 4,
    currentStage: 5,
    stagesCleared: [1, 2, 3, 4, 5],
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
    currentStage: 4,
    stagesCleared: [1, 2, 3],
    monstersDefeated: 16,
    dungeonsCleared: 2,
    treesPlanted: 20,
    wasteRecycled: 32,
    bossDefeated: false,
    title: '🌊 바다의 수호 기사',
    lastUpdated: Date.now() - 3600000 * 5,
  },
  {
    studentCode: 'ECO-03',
    name: '박서아',
    className: '3학년 1반',
    highScore: 5180,
    currentScore: 5180,
    totalPlays: 2,
    currentStage: 3,
    stagesCleared: [1, 2],
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
    currentStage: 2,
    stagesCleared: [1],
    monstersDefeated: 9,
    dungeonsCleared: 1,
    treesPlanted: 8,
    wasteRecycled: 16,
    bossDefeated: false,
    title: '🌲 맑은공기 파수꾼',
    lastUpdated: Date.now() - 3600000 * 14,
  },
];

// In-memory cache for ultra-fast and reliable cross-request state
let memoryStudentsMap: Record<string, StudentProfileData> | null = null;

// Helper functions for reading/writing persistent data
function readStudentsMap(): Record<string, StudentProfileData> {
  if (memoryStudentsMap && Object.keys(memoryStudentsMap).length > 0) {
    return memoryStudentsMap;
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      const initialMap: Record<string, StudentProfileData> = {};
      DEFAULT_DEMO_STUDENTS.forEach((s) => {
        initialMap[s.studentCode] = s;
      });
      fs.writeFileSync(DATA_FILE, JSON.stringify(initialMap, null, 2), 'utf-8');
      memoryStudentsMap = initialMap;
      return initialMap;
    }
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    memoryStudentsMap = parsed || {};
    return memoryStudentsMap;
  } catch (err) {
    console.error('Error reading students file:', err);
    memoryStudentsMap = {};
    return memoryStudentsMap;
  }
}

function writeStudentsMap(map: Record<string, StudentProfileData>): boolean {
  try {
    memoryStudentsMap = { ...map };
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(map, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing students file:', err);
    return false;
  }
}

function calculateScore(stats: {
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

async function startServer() {
  const app = express();

  // Middleware for parsing JSON
  app.use(express.json({ limit: '5mb' }));

  // Ensure data folder and file exist on startup
  readStudentsMap();

  // API 1: Health check
  app.get('/api/health', (req: Request, res: Response) => {
    const map = readStudentsMap();
    res.json({
      status: 'ok',
      timestamp: Date.now(),
      studentCount: Object.keys(map).length,
    });
  });

  // API 2: Leaderboard list (sorted by highScore desc)
  app.get('/api/leaderboard', (req: Request, res: Response) => {
    try {
      const map = readStudentsMap();
      const list = Object.values(map).sort((a, b) => b.highScore - a.highScore);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API 3: Get single student profile (handles URL encoded Korean student codes)
  app.get('/api/student/:studentCode', (req: Request, res: Response) => {
    try {
      const raw = req.params.studentCode || '';
      let code = raw.trim();
      try {
        code = decodeURIComponent(raw).trim();
      } catch {
        code = raw.trim();
      }
      const map = readStudentsMap();
      if (!code || !map[code]) {
        return res.status(404).json({ error: 'Student not found' });
      }
      res.json(map[code]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API 4: Student login or registration
  app.post('/api/student/login', (req: Request, res: Response) => {
    try {
      const { studentCode, name } = req.body;
      const cleanCode = (studentCode || '').trim();
      const cleanName = (name || '').trim() || '익명의 수호자';

      if (!cleanCode) {
        return res.status(400).json({ error: 'Student code is required' });
      }

      const map = readStudentsMap();
      let profile = map[cleanCode];

      if (profile) {
        // Existing student: update name if custom name provided, preserve currentStage & stagesCleared
        if (cleanName && cleanName !== '익명의 수호자') {
          profile.name = cleanName;
        }
        profile.currentStage = profile.currentStage || 1;
        profile.stagesCleared = profile.stagesCleared || [];
        profile.totalPlays = (profile.totalPlays || 1) + 1;
        profile.lastUpdated = Date.now();
      } else {
        // New student
        profile = {
          studentCode: cleanCode,
          name: cleanName,
          highScore: 0,
          currentScore: 0,
          totalPlays: 1,
          currentStage: 1,
          stagesCleared: [],
          monstersDefeated: 0,
          dungeonsCleared: 0,
          treesPlanted: 0,
          wasteRecycled: 0,
          bossDefeated: false,
          title: '🌱 초급 수호자',
          lastUpdated: Date.now(),
        };
      }

      map[cleanCode] = profile;
      writeStudentsMap(map);

      res.json({ success: true, profile });
    } catch (err: any) {
      console.error('Error logging in student:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // API 5: Save ongoing game progress and update cumulative score
  app.post('/api/student/save', (req: Request, res: Response) => {
    try {
      const {
        studentCode,
        name,
        score,
        currentScore,
        currentStage,
        stagesCleared,
        title,
        bossDefeated,
        stats,
        climate,
        monstersDefeated,
        dungeonsCleared,
        treesPlanted,
        wasteRecycled,
        clearedDungeonIds,
        craftedRecipeIds,
      } = req.body;

      const cleanCode = (studentCode || '').trim();
      if (!cleanCode) {
        return res.status(400).json({ error: 'Student code is required' });
      }

      const map = readStudentsMap();
      let profile = map[cleanCode];

      if (!profile) {
        profile = {
          studentCode: cleanCode,
          name: (name || '').trim() || '학생',
          highScore: 0,
          currentScore: 0,
          totalPlays: 1,
          currentStage: 1,
          stagesCleared: [],
          monstersDefeated: 0,
          dungeonsCleared: 0,
          treesPlanted: 0,
          wasteRecycled: 0,
          bossDefeated: false,
          title: '🌱 초급 수호자',
          lastUpdated: Date.now(),
        };
      }

      if (name && name.trim()) {
        profile.name = name.trim();
      }

      // Handle scores: ensure score never decreases
      const rawScore = score ?? currentScore;
      if (typeof rawScore === 'number' && !isNaN(rawScore)) {
        profile.currentScore = Math.max(profile.currentScore || 0, rawScore);
        profile.highScore = Math.max(profile.highScore || 0, rawScore);
      }

      // Handle current stage
      if (currentStage) {
        const parsedStage = Math.min(5, Math.max(1, Number(currentStage)));
        profile.currentStage = Math.max(profile.currentStage || 1, parsedStage);
      } else if (!profile.currentStage) {
        profile.currentStage = 1;
      }

      // Handle cleared stages list
      if (Array.isArray(stagesCleared)) {
        const existing = profile.stagesCleared || [];
        const merged = Array.from(new Set([...existing, ...stagesCleared])).sort((a, b) => a - b);
        profile.stagesCleared = merged;
      } else if (!profile.stagesCleared) {
        profile.stagesCleared = [];
      }

      // Boss defeated flag
      const isBossDefeated = Boolean(
        bossDefeated ||
        profile.bossDefeated ||
        profile.stagesCleared?.includes(5) ||
        (profile.currentStage && profile.currentStage >= 5 && profile.stagesCleared?.length === 5)
      );
      if (isBossDefeated) {
        profile.bossDefeated = true;
      }

      // Title determination based on stages completed
      if (title && title.trim()) {
        profile.title = title.trim();
      } else if (profile.bossDefeated || profile.stagesCleared?.includes(5)) {
        profile.title = '👑 지구의 구원자';
      } else if (profile.stagesCleared?.includes(4)) {
        profile.title = '🌊 바다의 수호 기사';
      } else if (profile.stagesCleared?.includes(3)) {
        profile.title = '♻️ 자원순환 연금술사';
      } else if (profile.stagesCleared?.includes(2)) {
        profile.title = '🌲 맑은공기 파수꾼';
      } else {
        profile.title = '🌱 초급 수호자';
      }

      if (typeof monstersDefeated === 'number') {
        profile.monstersDefeated = Math.max(profile.monstersDefeated || 0, monstersDefeated);
      }
      if (typeof dungeonsCleared === 'number') {
        profile.dungeonsCleared = Math.max(profile.dungeonsCleared || 0, dungeonsCleared);
      }
      if (typeof treesPlanted === 'number') {
        profile.treesPlanted = Math.max(profile.treesPlanted || 0, treesPlanted);
      }
      if (typeof wasteRecycled === 'number') {
        profile.wasteRecycled = Math.max(profile.wasteRecycled || 0, wasteRecycled);
      }

      // Save complete snapshot if available
      if (stats && climate) {
        profile.savedGameState = {
          stats,
          climate,
          monstersDefeated: profile.monstersDefeated,
          dungeonsCleared: profile.dungeonsCleared,
          clearedDungeonIds: clearedDungeonIds || [],
          craftedRecipeIds: craftedRecipeIds || [],
        };
      }

      profile.lastUpdated = Date.now();

      map[cleanCode] = profile;
      writeStudentsMap(map);

      // Compute rank
      const sorted = Object.values(map).sort((a, b) => b.highScore - a.highScore);
      const rank = sorted.findIndex((p) => p.studentCode === cleanCode) + 1;

      res.json({
        success: true,
        profile,
        rank,
        score: profile.highScore,
      });
    } catch (err: any) {
      console.error('Error saving student result:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // API 6: Reset students data (for teacher or fresh classroom session)
  app.post('/api/student/reset', (req: Request, res: Response) => {
    try {
      const initialMap: Record<string, StudentProfileData> = {};
      DEFAULT_DEMO_STUDENTS.forEach((s) => {
        initialMap[s.studentCode] = { ...s, lastUpdated: Date.now() };
      });
      writeStudentsMap(initialMap);
      res.json({ success: true, message: 'Reset completed successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development vs Static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[EcoKnight Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
