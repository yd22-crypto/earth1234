// Advanced Sound and Background Music (BGM) Synthesizer using Web Audio API

export type BGMTheme = 'adventure' | 'boss' | 'victory';

type AudioListener = () => void;

class GameSoundManager {
  private ctx: AudioContext | null = null;
  private sfxEnabled: boolean = true;
  private bgmEnabled: boolean = true;
  private bgmPlaying: boolean = false;
  private currentTheme: BGMTheme = 'adventure';
  private bgmTimer: any = null;
  private stepIndex: number = 0;
  private listeners: Set<AudioListener> = new Set();

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public subscribe(listener: AudioListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public unlock() {
    const ctx = this.getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    if (this.bgmEnabled && !this.bgmPlaying) {
      this.startBGM(this.currentTheme);
    }
  }

  // --- BGM Engine ---

  public isBGMEnabled(): boolean {
    return this.bgmEnabled;
  }

  public isBGMPlaying(): boolean {
    return this.bgmPlaying;
  }

  public isSFXEnabled(): boolean {
    return this.sfxEnabled;
  }

  public toggleBGM(): boolean {
    this.bgmEnabled = !this.bgmEnabled;
    if (this.bgmEnabled) {
      this.startBGM(this.currentTheme);
    } else {
      this.stopBGM();
    }
    this.notify();
    return this.bgmEnabled;
  }

  public toggleSFX(): boolean {
    this.sfxEnabled = !this.sfxEnabled;
    this.notify();
    return this.sfxEnabled;
  }

  public setSoundEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
    this.notify();
  }

  public startBGM(theme: BGMTheme = 'adventure') {
    this.currentTheme = theme;
    if (!this.bgmEnabled) return;
    this.stopBGM();

    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.bgmPlaying = true;
    this.stepIndex = 0;

    const tempoMs = theme === 'boss' ? 120 : 150;
    this.bgmTimer = setInterval(() => {
      this.playBGMStep(theme);
    }, tempoMs);

    this.notify();
  }

  public stopBGM() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.bgmPlaying = false;
    this.notify();
  }

  private playBGMStep(theme: BGMTheme) {
    if (!this.bgmEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx || ctx.state !== 'running') return;

    const step = this.stepIndex % 16;
    this.stepIndex++;

    try {
      if (theme === 'adventure') {
        // Cheerful Nature/Quest Theme (C Major / G Major)
        // Melody: C5, E5, G5, A5, C6, G5, E5, D5 ...
        const melodyNotes = [
          523.25, 0, 659.25, 0, 783.99, 880.0, 1046.5, 0,
          783.99, 0, 659.25, 587.33, 523.25, 0, 659.25, 783.99,
        ];
        const bassNotes = [
          130.81, 130.81, 196.0, 196.0, 220.0, 220.0, 174.61, 174.61,
          130.81, 130.81, 196.0, 196.0, 220.0, 196.0, 174.61, 196.0,
        ];

        const mFreq = melodyNotes[step];
        if (mFreq > 0) {
          this.synthesizeNote(ctx, mFreq, 'triangle', 0.05, 0.12);
        }

        const bFreq = bassNotes[step];
        if (bFreq > 0 && step % 2 === 0) {
          this.synthesizeNote(ctx, bFreq, 'sine', 0.06, 0.18);
        }

        // Gentle percussive tick on beat 2 and 4
        if (step === 4 || step === 12) {
          this.synthesizePercussion(ctx, 0.02);
        }
      } else if (theme === 'boss') {
        // Dramatic Dark Boss Battle Theme (A minor, Driving pulse)
        const melodyNotes = [
          440.0, 440.0, 493.88, 523.25, 659.25, 523.25, 493.88, 440.0,
          392.0, 440.0, 523.25, 659.25, 698.46, 659.25, 587.33, 523.25,
        ];
        const bassNotes = [
          110.0, 110.0, 110.0, 110.0, 130.81, 130.81, 146.83, 146.83,
          110.0, 110.0, 123.47, 123.47, 130.81, 146.83, 164.81, 130.81,
        ];

        const mFreq = melodyNotes[step];
        this.synthesizeNote(ctx, mFreq, 'sawtooth', 0.04, 0.09);

        const bFreq = bassNotes[step];
        this.synthesizeNote(ctx, bFreq, 'triangle', 0.07, 0.12);

        // Hi-hat tick
        if (step % 2 === 1) {
          this.synthesizePercussion(ctx, 0.035);
        }
      } else if (theme === 'victory') {
        // Celebratory Fanfare Loop
        const melodyNotes = [
          523.25, 659.25, 783.99, 1046.5, 0, 1046.5, 880.0, 1046.5,
          0, 0, 783.99, 880.0, 1046.5, 0, 1174.66, 1318.51,
        ];
        const mFreq = melodyNotes[step];
        if (mFreq > 0) {
          this.synthesizeNote(ctx, mFreq, 'sine', 0.06, 0.14);
        }
        if (step === 0 || step === 8) {
          this.synthesizeNote(ctx, 261.63, 'triangle', 0.08, 0.3);
        }
      }
    } catch {
      // Audio safety
    }
  }

  private synthesizeNote(
    ctx: AudioContext,
    freq: number,
    type: OscillatorType,
    vol: number,
    duration: number
  ) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.02);
  }

  private synthesizePercussion(ctx: AudioContext, vol: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }

  // --- Sound Effects (SFX) ---

  /** Normal attack swing & hit sound */
  public playAttack() {
    if (!this.sfxEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch {
      // Audio safety
    }
  }

  /** Quiz Correct answer chime */
  public playQuizCorrect() {
    if (!this.sfxEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C-E-G-C high chime
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);

        gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.06);
        osc.stop(ctx.currentTime + idx * 0.06 + 0.32);
      });
    } catch {
      // Audio safety
    }
  }

  /** Quiz Wrong buzzer */
  public playQuizWrong() {
    if (!this.sfxEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      [220, 200].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

        gain.gain.setValueAtTime(0.14, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.12 + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.19);
      });
    } catch {
      // Audio safety
    }
  }

  /** Shield activated */
  public playShield() {
    if (!this.sfxEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(700, ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.16, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.26);
    } catch {
      // Audio safety
    }
  }

  /** Eco Ultimate Skill (Great nature roar/burst) */
  public playEcoSkill() {
    if (!this.sfxEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      [330, 440, 550, 660, 880, 1100].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05);
        osc.frequency.linearRampToValueAtTime(freq * 1.4, ctx.currentTime + i * 0.05 + 0.25);

        gain.gain.setValueAtTime(0.16, ctx.currentTime + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.05 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + i * 0.05);
        osc.stop(ctx.currentTime + i * 0.05 + 0.36);
      });
    } catch {
      // Audio safety
    }
  }

  /** Player hurt sound */
  public playHurt() {
    if (!this.sfxEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch {
      // Audio safety
    }
  }

  /** Monster hurt / impact */
  public playEnemyHurt() {
    if (!this.sfxEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.14);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio safety
    }
  }

  /** Victory / Stage Clear Fanfare */
  public playStageClear() {
    if (!this.sfxEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const melody = [
        { f: 523.25, t: 0, d: 0.12 },
        { f: 659.25, t: 0.12, d: 0.12 },
        { f: 783.99, t: 0.24, d: 0.14 },
        { f: 1046.5, t: 0.38, d: 0.45 },
      ];
      melody.forEach((m) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(m.f, ctx.currentTime + m.t);

        gain.gain.setValueAtTime(0.2, ctx.currentTime + m.t);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + m.t + m.d);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + m.t);
        osc.stop(ctx.currentTime + m.t + m.d);
      });
    } catch {
      // Audio safety
    }
  }

  /** Button click / UI tap */
  public playButtonClick() {
    if (!this.sfxEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch {
      // Audio safety
    }
  }

  /** Game Over sound */
  public playGameOver() {
    if (!this.sfxEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      [300, 260, 220, 180].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.18);

        gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.18 + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.18);
        osc.stop(ctx.currentTime + idx * 0.18 + 0.32);
      });
    } catch {
      // Audio safety
    }
  }

  // Backwards compatibility methods
  public playSkill() {
    this.playEcoSkill();
  }
  public playPlantTree() {
    this.playQuizCorrect();
  }
  public playRecycle() {
    this.playShield();
  }
  public playEatFood() {
    this.playQuizCorrect();
  }
  public playLevelUp() {
    this.playStageClear();
  }
  public playVictory() {
    this.playStageClear();
  }
}

export const soundManager = new GameSoundManager();
