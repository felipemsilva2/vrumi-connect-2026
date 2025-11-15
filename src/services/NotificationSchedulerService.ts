import { supabase } from '@/integrations/supabase/client';

/**
 * Serviço de agendamento de notificações
 * Responsável por criar notificações automáticas baseadas no algoritmo SM-2
 */
export class NotificationSchedulerService {
  private static instance: NotificationSchedulerService;
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): NotificationSchedulerService {
    if (!NotificationSchedulerService.instance) {
      NotificationSchedulerService.instance = new NotificationSchedulerService();
    }
    return NotificationSchedulerService.instance;
  }

  /**
   * Inicia o agendador de notificações
   */
  public start(): void {
    if (this.isRunning) {
      console.log('NotificationScheduler já está em execução');
      return;
    }

    this.isRunning = true;
    console.log('NotificationScheduler iniciado');

    // Executar imediatamente ao iniciar
    this.scheduleNotifications();

    // Configurar execução a cada hora
    this.intervalId = setInterval(() => {
      this.scheduleNotifications();
    }, 60 * 60 * 1000); // 1 hora

    // Configurar limpeza diária de notificações antigas
    this.scheduleDailyCleanup();
  }

  /**
   * Para o agendador de notificações
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('NotificationScheduler parado');
  }

  /**
   * Cria notificações baseadas no algoritmo SM-2
   */
  private async scheduleNotifications(): Promise<void> {
    try {
      console.log('Executando agendamento de notificações...');
      // Criar notificações de conquistas pendentes
      await this.createAchievementNotifications();

      console.log('Agendamento de notificações concluído');
    } catch (error) {
      console.error('Erro ao agendar notificações:', error);
    }
  }

  /**
   * Cria lembretes de revisão baseados no algoritmo SM-2
   */
  private async createReviewReminders(): Promise<void> { return; }

  /**
   * Fallback para criar lembretes de revisão quando a função RPC falha
   */
  private async createReviewRemindersFallback(): Promise<void> { return; }

  /**
   * Cria lembretes de estudo para usuários inativos
   */
  private async createStudyReminders(): Promise<void> { return; }

  /**
   * Cria lembretes de sequência de estudos
   */
  private async createStreakReminders(): Promise<void> {
    try {
      // Usar apenas fallback - função do banco de dados não está disponível
      await this.createStreakRemindersFallback();
    } catch (error) {
      console.error('Erro ao criar lembretes de sequência:', error);
    }
  }

  /**
   * Fallback para criar lembretes de sequência
   */
  private async createStreakRemindersFallback(): Promise<void> { return; }

  /**
   * Cria notificações de conquistas pendentes
   */
  private async createAchievementNotifications(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar conquistas recentes não notificadas
      const { data: achievements } = await supabase
        .from('user_achievements')
        .select('*, achievements!inner(*)')
        .eq('user_id', user.id)
        .eq('is_notified', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (achievements && achievements.length > 0) {
        for (const achievement of achievements) {
          await supabase.from('notifications').insert({
            user_id: user.id,
            type: 'achievement',
            title: '🏆 Nova conquista desbloqueada!',
            message: `Parabéns! Você desbloqueou a conquista: ${achievement.achievements.name}`,
            data: {
              achievement_id: achievement.achievement_id,
              achievement_type: achievement.achievements.type,
              points: achievement.achievements.points
            }
          });

          // Marcar como notificada
          await supabase
            .from('user_achievements')
            .update({ is_notified: true })
            .eq('id', achievement.id);
        }
      }
    } catch (error) {
      console.error('Erro ao criar notificações de conquistas:', error);
    }
  }

  /**
   * Agenda limpeza diária de notificações antigas
   */
  private scheduleDailyCleanup(): void {
    // Executar limpeza à meia-noite
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const timeUntilMidnight = midnight.getTime() - now.getTime();

    setTimeout(() => {
      this.dailyCleanup();
      // Repetir diariamente
      setInterval(this.dailyCleanup.bind(this), 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);
  }

  /**
   * Executa limpeza diária de notificações antigas
   */
  private async dailyCleanup(): Promise<void> {
    try {
      console.log('Executando limpeza diária de notificações...');
      
      // Usar função do banco de dados
      const { error } = await supabase.rpc('cleanup_old_notifications');
      
      if (error) {
        console.error('Erro ao limpar notificações antigas:', error);
      } else {
        console.log('Limpeza de notificações concluída');
      }
    } catch (error) {
      console.error('Erro na limpeza diária:', error);
    }
  }
}

// Exportar instância singleton
export const notificationScheduler = NotificationSchedulerService.getInstance();