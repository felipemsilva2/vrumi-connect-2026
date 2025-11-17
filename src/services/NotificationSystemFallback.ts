import { supabase } from '@/integrations/supabase/client';

export class NotificationSystemFallback {
  private static instance: NotificationSystemFallback;
  private userId: string | null = null;

  private constructor() {}

  static getInstance(): NotificationSystemFallback {
    if (!NotificationSystemFallback.instance) {
      NotificationSystemFallback.instance = new NotificationSystemFallback();
    }
    return NotificationSystemFallback.instance;
  }

  async initialize(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      this.userId = user?.id || null;
    } catch (error) {
      console.error('Erro ao inicializar sistema de notificações:', error);
    }
  }

  async getNotifications() {
    if (!this.userId) {
      await this.initialize();
      if (!this.userId) return [];
    }

    // Use local storage fallback
    const raw = localStorage.getItem(`notifications:${this.userId}`);
    return raw ? JSON.parse(raw) : [];
  }

  async createNotification(title: string, message: string, type: string = 'general') {
    if (!this.userId) {
      await this.initialize();
      if (!this.userId) return null;
    }

    // Tentar criar no banco primeiro
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: this.userId,
        type,
        title,
        message,
        is_read: false,
        created_at: new Date().toISOString()
      });

      if (!error) {
        return;
      }
    } catch (error) {
      console.warn('Tabela notifications não disponível, usando fallback local');
    }

    const raw = localStorage.getItem(`notifications:${this.userId}`);
    const list = raw ? JSON.parse(raw) : [];
    const item = { id: Math.random().toString(36).slice(2), user_id: this.userId, type, title, message, is_read: false, created_at: new Date().toISOString() };
    localStorage.setItem(`notifications:${this.userId}`, JSON.stringify([item, ...list]));
  }

  async markAsRead(notificationId: string) {
    if (!this.userId) return;

    // Tentar atualizar no banco primeiro
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', this.userId);

      if (!error) {
        return;
      }
    } catch (error) {
      console.warn('Tabela notifications não disponível, usando fallback local');
    }

    const raw = localStorage.getItem(`notifications:${this.userId}`);
    const list = raw ? JSON.parse(raw) : [];
    const updated = list.map((n: any) => n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n);
    localStorage.setItem(`notifications:${this.userId}`, JSON.stringify(updated));
  }

  getUnreadCount(): number {
    if (!this.userId) return 0;
    const raw = localStorage.getItem(`notifications:${this.userId}`);
    const list = raw ? JSON.parse(raw) : [];
    return list.filter((n: any) => !n.is_read).length;
  }
}

export const notificationSystemFallback = NotificationSystemFallback.getInstance();