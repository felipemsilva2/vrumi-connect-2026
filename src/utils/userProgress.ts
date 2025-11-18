export interface UserProgress {
  studiedSigns: Set<string>;
  masteredSigns: Set<string>;
  studySessions: StudySession[];
  lastStudied: Record<string, number>;
  totalStudyTime: number;
  streak: number;
  lastStudyDate: string | null;
}

export interface StudySession {
  signId: string;
  timestamp: number;
  correct: boolean;
  timeSpent: number;
}

class UserProgressTracker {
  private static instance: UserProgressTracker;
  private progress: UserProgress;
  private readonly STORAGE_KEY = 'vrumi_user_progress';

  private constructor() {
    this.progress = this.loadProgress();
  }

  static getInstance(): UserProgressTracker {
    if (!UserProgressTracker.instance) {
      UserProgressTracker.instance = new UserProgressTracker();
    }
    return UserProgressTracker.instance;
  }

  private loadProgress(): UserProgress {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          studiedSigns: new Set(parsed.studiedSigns || []),
          masteredSigns: new Set(parsed.masteredSigns || [])
        };
      }
    } catch (error) {
      console.warn('Erro ao carregar progresso:', error);
    }

    return {
      studiedSigns: new Set(),
      masteredSigns: new Set(),
      studySessions: [],
      lastStudied: {},
      totalStudyTime: 0,
      streak: 0,
      lastStudyDate: null
    };
  }

  private saveProgress(): void {
    try {
      const dataToSave = {
        ...this.progress,
        studiedSigns: Array.from(this.progress.studiedSigns),
        masteredSigns: Array.from(this.progress.masteredSigns)
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.warn('Erro ao salvar progresso:', error);
    }
  }

  markAsStudied(signId: string, correct: boolean = true, timeSpent: number = 0): void {
    this.progress.studiedSigns.add(signId);
    
    const session: StudySession = {
      signId,
      timestamp: Date.now(),
      correct,
      timeSpent
    };
    
    this.progress.studySessions.push(session);
    this.progress.lastStudied[signId] = Date.now();
    this.progress.totalStudyTime += timeSpent;

    if (correct) {
      const sessionsForSign = this.progress.studySessions.filter(s => s.signId === signId && s.correct);
      if (sessionsForSign.length >= 3) {
        this.progress.masteredSigns.add(signId);
      }
    }

    this.updateStreak();
    this.saveProgress();
  }

  private updateStreak(): void {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (this.progress.lastStudyDate === today) {
      return;
    }
    
    if (this.progress.lastStudyDate === yesterday) {
      this.progress.streak++;
    } else {
      this.progress.streak = 1;
    }
    
    this.progress.lastStudyDate = today;
  }

  getProgress(): UserProgress {
    return { ...this.progress };
  }

  getSignProgress(signId: string): {
    studied: boolean;
    mastered: boolean;
    lastStudied: number | null;
    studyCount: number;
    accuracy: number;
  } {
    const sessions = this.progress.studySessions.filter(s => s.signId === signId);
    const correctSessions = sessions.filter(s => s.correct);
    
    return {
      studied: this.progress.studiedSigns.has(signId),
      mastered: this.progress.masteredSigns.has(signId),
      lastStudied: this.progress.lastStudied[signId] || null,
      studyCount: sessions.length,
      accuracy: sessions.length > 0 ? (correctSessions.length / sessions.length) * 100 : 0
    };
  }

  getOverallStats(): {
    totalStudied: number;
    totalMastered: number;
    studyStreak: number;
    totalStudyTime: number;
    overallAccuracy: number;
  } {
    const totalSessions = this.progress.studySessions.length;
    const correctSessions = this.progress.studySessions.filter(s => s.correct).length;
    
    return {
      totalStudied: this.progress.studiedSigns.size,
      totalMastered: this.progress.masteredSigns.size,
      studyStreak: this.progress.streak,
      totalStudyTime: this.progress.totalStudyTime,
      overallAccuracy: totalSessions > 0 ? (correctSessions.length / totalSessions) * 100 : 0
    };
  }

  resetProgress(): void {
    this.progress = {
      studiedSigns: new Set(),
      masteredSigns: new Set(),
      studySessions: [],
      lastStudied: {},
      totalStudyTime: 0,
      streak: 0,
      lastStudyDate: null
    };
    this.saveProgress();
  }
}

export const userProgress = UserProgressTracker.getInstance();