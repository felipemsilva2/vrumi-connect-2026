import { supabase } from '@/integrations/supabase/client';

/**
 * Notification Scheduler Service  
 * Simplified version - placeholders for future features
 */
export class NotificationSchedulerService {
  private static instance: NotificationSchedulerService;
  private intervalId: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): NotificationSchedulerService {
    if (!NotificationSchedulerService.instance) {
      NotificationSchedulerService.instance = new NotificationSchedulerService();
    }
    return NotificationSchedulerService.instance;
  }

  start(): void {
    if (this.intervalId) return;
    
    console.log('NotificationScheduler started');
    
    // Schedule daily cleanup
    this.intervalId = setInterval(() => {
      this.cleanupOldNotifications();
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('NotificationScheduler stopped');
    }
  }

  private async cleanupOldNotifications(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      await supabase
        .from('notifications')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString())
        .eq('read', true);
        
      console.log('Old notifications cleaned up');
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
    }
  }
}

export const notificationScheduler = NotificationSchedulerService.getInstance();
