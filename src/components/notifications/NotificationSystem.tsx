import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Bell, X, Clock, CheckCircle, BookOpen, Trophy, Flame, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { notificationSystemFallback } from '@/services/NotificationSystemFallback';

import { Tables } from '@/integrations/supabase/types';

type DBNotification = Tables<'notifications'>;

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  created_at: string;
  user_id: string;
}

const notificationIcons = {
  study_reminder: BookOpen,
  review_reminder: Clock,
  achievement: Trophy,
  study_streak: Flame,
  custom: Info
};

const notificationColors = {
  study_reminder: 'bg-blue-500',
  review_reminder: 'bg-purple-500',
  achievement: 'bg-yellow-500',
  study_streak: 'bg-orange-500',
  custom: 'bg-gray-500'
};

export default function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadNotifications();

    let subscription: any = null;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;
        if (userId && typeof (supabase as any).channel === 'function') {
          subscription = (supabase as any)
            .channel('notifications')
            .on('postgres_changes', {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${userId}`
            }, handleNewNotification)
            .subscribe();
        }
      } catch {}
    })();

    const interval = setInterval(checkForNewNotifications, 30000);

    return () => {
      if (subscription) subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const getCurrentUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || '';
  };

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Usar o sistema de fallback
      const notifications = await notificationSystemFallback.getNotifications();
      setNotifications(notifications);
      setUnreadCount(notifications.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewNotification = (payload: any) => {
    const newNotification = payload.new as Notification;
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Mostrar toast para nova notificação
    toast({
      title: newNotification.title,
      description: newNotification.message,
      duration: 5000,
      className: 'bg-white dark:bg-gray-800'
    });
  };

  const checkForNewNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Verificar se há notificações agendadas para agora
      let q: any = supabase.from('notifications').select('*');
      if (typeof q.eq === 'function') q = q.eq('user_id', user.id);
      if (typeof q.eq === 'function') q = q.eq('read', false);
      if (typeof q.order === 'function') q = q.order('created_at', { ascending: false });
      const { data } = await q;

      if (data && data.length > 0) {
        const mappedData: Notification[] = data.map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          data: (n.data || {}) as Record<string, any>,
          read: n.read || false,
          created_at: n.created_at || '',
          user_id: n.user_id
        }));
        
        setNotifications(prev => {
          const newNotifications = mappedData.filter(
            (newNotif) => !prev.some(existing => existing.id === newNotif.id)
          );
          return [...newNotifications, ...prev];
        });
        setUnreadCount(prev => prev + (mappedData.length));
      }
    } catch (error) {
      console.error('Erro ao verificar novas notificações:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // Usar o sistema de fallback
      await notificationSystemFallback.markAsRead(notificationId);
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      toast({
        title: 'Notificação marcada como lida',
        description: 'A notificação foi removida da lista.',
      });
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Simplesmente limpar todas as notificações localmente
      setNotifications([]);
      setUnreadCount(0);
      
      toast({
        title: 'Todas as notificações marcadas como lidas',
        description: 'Sua caixa de notificações foi limpa.',
      });
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Navegar para a página apropriada baseada no tipo de notificação
    switch (notification.type) {
      case 'study_reminder':
      case 'review_reminder':
        window.location.href = '/traffic-signs';
        break;
      case 'study_streak':
        window.location.href = '/dashboard';
        break;
      case 'achievement':
        window.location.href = '/traffic-signs-stats';
        break;
      default:
        break;
    }
    
    markAsRead(notification.id);
    setIsOpen(false);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Agora';
    if (diffInHours < 24) return `Há ${diffInHours}h`;
    return `Há ${Math.floor(diffInHours / 24)}d`;
  };

  return (
    <div className="relative">
      {/* Botão de Notificações */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Notificações"
      >
        <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Painel de Notificações */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Notificações
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    Marcar todas como lidas
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                Carregando notificações...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhuma notificação nova</p>
                <p className="text-sm mt-1">Você está em dia com seus estudos!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => {
                  const IconComponent = notificationIcons[notification.type];
                  const iconColor = notificationColors[notification.type];
                  
                  return (
                    <div
                      key={notification.id}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition-colors"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${iconColor} bg-opacity-10`}>
                          <IconComponent className={`h-4 w-4 ${iconColor.replace('bg-', 'text-')}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {notification.title}
                            </h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded opacity-50 hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3 text-gray-500" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
