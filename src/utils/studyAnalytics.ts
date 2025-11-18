interface StudyAnalyticsEvent {
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
  userAgent?: string;
  url?: string;
}

export class StudyAnalytics {
  private static instance: StudyAnalytics;
  private events: StudyAnalyticsEvent[] = [];
  private sessionId: string;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeSession();
  }

  static getInstance(): StudyAnalytics {
    if (!StudyAnalytics.instance) {
      StudyAnalytics.instance = new StudyAnalytics();
    }
    return StudyAnalytics.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeSession() {
    // Registrar início da sessão
    this.trackEvent('session', 'start', 'study_session_started');
    
    // Limpar eventos antigos ao iniciar nova sessão
    this.events = [];
  }

  trackEvent(
    category: string,
    action: string,
    label?: string,
    value?: number
  ): void {
    const event: StudyAnalyticsEvent = {
      event: 'study_interaction',
      category,
      action,
      label,
      value,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.events.push(event);
    
    // Log para debug (remover em produção)
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', event);
    }

    // Enviar para backend se disponível
    this.sendToBackend(event);
  }

  trackStudyModeSelection(mode: string, signsCount: number, category?: string): void {
    this.trackEvent('study_mode', 'selected', mode, signsCount);
    
    if (category) {
      this.trackEvent('study_category', 'selected', category, signsCount);
    }
  }

  trackModalInteraction(action: 'opened' | 'closed', modalType: string): void {
    this.trackEvent('modal', action, modalType);
  }

  trackButtonInteraction(buttonType: string, action: 'hover' | 'click'): void {
    this.trackEvent('button', action, buttonType);
  }

  trackStudyCompletion(mode: string, correctAnswers: number, totalQuestions: number, timeSpent?: number): void {
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    
    this.trackEvent('study_completion', 'completed', mode, accuracy);
    
    if (timeSpent) {
      this.trackEvent('study_time', 'spent', mode, timeSpent);
    }
  }

  getSessionEvents(): StudyAnalyticsEvent[] {
    return [...this.events];
  }

  getSessionSummary(): {
    totalEvents: number;
    studyModeSelections: Record<string, number>;
    modalInteractions: Record<string, number>;
    buttonInteractions: Record<string, number>;
    sessionDuration: number;
  } {
    const firstEvent = this.events[0];
    const lastEvent = this.events[this.events.length - 1];
    
    const studyModeSelections = this.events
      .filter(e => e.category === 'study_mode')
      .reduce((acc, e) => {
        acc[e.label || 'unknown'] = (acc[e.label || 'unknown'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const modalInteractions = this.events
      .filter(e => e.category === 'modal')
      .reduce((acc, e) => {
        const key = `${e.action}_${e.label}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const buttonInteractions = this.events
      .filter(e => e.category === 'button')
      .reduce((acc, e) => {
        const key = `${e.action}_${e.label}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      totalEvents: this.events.length,
      studyModeSelections,
      modalInteractions,
      buttonInteractions,
      sessionDuration: firstEvent && lastEvent ? lastEvent.timestamp - firstEvent.timestamp : 0
    };
  }

  private async sendToBackend(event: StudyAnalyticsEvent): Promise<void> {
    try {
      // Tentar enviar para o Supabase se disponível
      if (typeof window !== 'undefined' && (window as any).supabase) {
        await (window as any).supabase
          .from('analytics_events')
          .insert({
            session_id: this.sessionId,
            event_type: event.event,
            category: event.category,
            action: event.action,
            label: event.label,
            value: event.value,
            timestamp: new Date(event.timestamp).toISOString(),
            user_agent: event.userAgent,
            url: event.url
          });
      }
    } catch (error) {
      // Silenciosamente falhar - não deve quebrar a aplicação
      console.warn('Failed to send analytics event to backend:', error);
    }
  }

  // Método utilitário para tracking de performance
  trackPerformance(metric: string, value: number): void {
    this.trackEvent('performance', metric, undefined, value);
  }
}

// Exportar instância singleton
export const analytics = StudyAnalytics.getInstance();

// Hook React para facilitar uso
export const useStudyAnalytics = () => {
  return analytics;
};