import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Bell, Clock, BookOpen, Flame, Settings, Save, RefreshCw, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { SubscriptionGate } from "@/components/auth/SubscriptionGate";

interface NotificationSettings {
  study_reminders: boolean;
  review_reminders: boolean;
  achievement_notifications: boolean;
  streak_reminders: boolean;
  study_time_hour: number;
  review_time_hour: number;
  streak_reminder_hour: number;
  quiet_hours_start: number;
  quiet_hours_end: number;
  enable_quiet_hours: boolean;
}

export default function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({
    study_reminders: true,
    review_reminders: true,
    achievement_notifications: true,
    streak_reminders: true,
    study_time_hour: 9,
    review_time_hour: 19,
    streak_reminder_hour: 20,
    quiet_hours_start: 22,
    quiet_hours_end: 7,
    enable_quiet_hours: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Tentar carregar configurações do usuário
      const { data, error } = await supabase
        .from('user_preferences')
        .select('notification_settings')
        .eq('user_id', user.id)
        .single();

      if (data?.notification_settings) {
        setSettings(data.notification_settings as any);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Salvar configurações
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          notification_settings: settings as any,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      // Agendar notificações baseadas nas novas configurações
      await scheduleNotifications();

      toast({
        title: 'Configurações salvas!',
        description: 'Suas preferências de notificação foram atualizadas.',
        duration: 3000
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar suas configurações. Tente novamente.',
        variant: 'destructive',
        duration: 5000
      });
    } finally {
      setIsSaving(false);
    }
  };

  const scheduleNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Criar trabalhos agendados para notificações
      if (settings.study_reminders) {
        await createScheduledNotification(
          user.id,
          'study_reminder',
          '⏰ Hora de estudar!',
          'Você definiu este horário para estudar novas placas.',
          settings.study_time_hour
        );
      }

      if (settings.review_reminders) {
        await createScheduledNotification(
          user.id,
          'review_reminder',
          '📚 Hora de revisar!',
          'Você definiu este horário para revisar placas que já estudou.',
          settings.review_time_hour
        );
      }

      if (settings.streak_reminders) {
        await createScheduledNotification(
          user.id,
          'study_streak',
          '🔥 Lembrete de sequência!',
          'Não perca sua sequência de estudos. Estude um pouco hoje!',
          settings.streak_reminder_hour
        );
      }
    } catch (error) {
      console.error('Erro ao agendar notificações:', error);
    }
  };

  const createScheduledNotification = async (
    userId: string,
    type: string,
    title: string,
    message: string,
    hour: number
  ) => {
    const scheduledTime = new Date();
    scheduledTime.setHours(hour, 0, 0, 0);
    
    // Se o horário já passou hoje, agendar para amanhã
    if (scheduledTime < new Date()) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    // Verificar se está dentro do horário de silêncio
    if (settings.enable_quiet_hours && isInQuietHours(hour)) {
      return; // Não criar notificação durante horário de silêncio
    }

    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        scheduled_for: scheduledTime.toISOString(),
        data: {
          scheduled_type: 'user_defined',
          hour,
          created_by_settings: true
        }
      });

    if (error) {
      console.error(`Erro ao criar notificação agendada ${type}:`, error);
    }
  };

  const isInQuietHours = (hour: number) => {
    if (!settings.enable_quiet_hours) return false;
    
    if (settings.quiet_hours_start <= settings.quiet_hours_end) {
      return hour >= settings.quiet_hours_start && hour < settings.quiet_hours_end;
    } else {
      // Horário de silêncio que cruza a meia-noite
      return hour >= settings.quiet_hours_start || hour < settings.quiet_hours_end;
    }
  };

  const handleSettingChange = (key: keyof NotificationSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const testNotification = async (type: keyof typeof notificationIcons) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const testMessages = {
        study_reminder: 'Teste: Hora de estudar novas placas!',
        review_reminder: 'Teste: Hora de revisar placas que você já estudou!',
        achievement_notifications: 'Teste: Parabéns! Você conquistou uma nova medalha!',
        streak_reminders: 'Teste: Mantenha sua sequência de estudos!'
      };

      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type,
          title: `Teste: ${type.replace('_', ' ')}`,
          message: testMessages[type],
          data: { test_notification: true }
        });

      if (error) {
        throw error;
      }

      toast({
        title: 'Notificação de teste enviada!',
        description: 'Verifique sua lista de notificações.',
        duration: 3000
      });
    } catch (error) {
      console.error('Erro ao enviar notificação de teste:', error);
      toast({
        title: 'Erro ao enviar teste',
        description: 'Não foi possível enviar a notificação de teste.',
        variant: 'destructive',
        duration: 5000
      });
    }
  };

  const notificationIcons = {
    study_reminders: BookOpen,
    review_reminders: Clock,
    achievement_notifications: Trophy,
    streak_reminders: Flame
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <SubscriptionGate feature="Notificações">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Configurações de Notificações
          </h2>
        </div>
        <Button
          onClick={saveSettings}
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          {isSaving ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar
        </Button>
      </div>

      <div className="space-y-6">
        {/* Tipos de Notificações */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Tipos de Notificações
          </h3>
          <div className="space-y-4">
            {Object.entries(notificationIcons).map(([key, Icon]) => {
              const settingKey = key as keyof NotificationSettings;
              const labels = {
                study_reminders: 'Lembretes de Estudo',
                review_reminders: 'Lembretes de Revisão',
                achievement_notifications: 'Notificações de Conquistas',
                streak_reminders: 'Lembretes de Sequência'
              };
              
              return (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    <div>
                      <Label className="text-sm font-medium">
                        {labels[settingKey]}
                      </Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {key === 'study_reminders' && 'Notificações para estudar novas placas'}
                        {key === 'review_reminders' && 'Lembretes para revisar placas já estudadas'}
                        {key === 'achievement_notifications' && 'Alertas sobre novas conquistas'}
                        {key === 'streak_reminders' && 'Alertas para manter sua sequência de estudos'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={settings[settingKey] as boolean}
                      onCheckedChange={(checked) => handleSettingChange(settingKey, checked)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testNotification(settingKey as "study_reminders" | "review_reminders" | "achievement_notifications" | "streak_reminders")}
                      className="text-xs"
                    >
                      Testar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Horários dos Lembretes */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Horários dos Lembretes
          </h3>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Hora dos Lembretes de Estudo: {settings.study_time_hour}:00
              </Label>
              <Slider
                value={[settings.study_time_hour]}
                onValueChange={(value) => handleSettingChange('study_time_hour', value[0])}
                min={6}
                max={22}
                step={1}
                className="w-full"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Hora dos Lembretes de Revisão: {settings.review_time_hour}:00
              </Label>
              <Slider
                value={[settings.review_time_hour]}
                onValueChange={(value) => handleSettingChange('review_time_hour', value[0])}
                min={6}
                max={22}
                step={1}
                className="w-full"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Hora dos Lembretes de Sequência: {settings.streak_reminder_hour}:00
              </Label>
              <Slider
                value={[settings.streak_reminder_hour]}
                onValueChange={(value) => handleSettingChange('streak_reminder_hour', value[0])}
                min={18}
                max={23}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Horário de Silêncio */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Horário de Silêncio
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Ativar Horário de Silêncio
              </Label>
              <Switch
                checked={settings.enable_quiet_hours}
                onCheckedChange={(checked) => handleSettingChange('enable_quiet_hours', checked)}
              />
            </div>
            
            {settings.enable_quiet_hours && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Início: {settings.quiet_hours_start}:00
                  </Label>
                  <Slider
                    value={[settings.quiet_hours_start]}
                    onValueChange={(value) => handleSettingChange('quiet_hours_start', value[0])}
                    min={20}
                    max={23}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Fim: {settings.quiet_hours_end}:00
                  </Label>
                  <Slider
                    value={[settings.quiet_hours_end]}
                    onValueChange={(value) => handleSettingChange('quiet_hours_end', value[0])}
                    min={5}
                    max={8}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Dica:</strong> As notificações serão enviadas nos horários definidos acima, 
          respeitando o horário de silêncio. Você pode testar cada tipo de notificação 
          usando o botão "Testar" ao lado de cada opção.
        </p>
      </div>
    </div>
    </SubscriptionGate>
  );
}