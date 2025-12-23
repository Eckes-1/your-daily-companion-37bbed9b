import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Reminder {
  id: string;
  frequency: 'daily' | 'weekly';
  time: string;
  day_of_week: number | null;
  enabled: boolean;
}

export function useReminders() {
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchReminder();
    } else {
      setReminder(null);
      setLoading(false);
    }
  }, [user]);

  const fetchReminder = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      setReminder(data as Reminder | null);
    } catch (error) {
      console.error('Error fetching reminder:', error);
    } finally {
      setLoading(false);
    }
  };

  const setReminderSettings = async (settings: { 
    frequency: 'daily' | 'weekly'; 
    time: string; 
    day_of_week?: number;
    enabled: boolean;
  }) => {
    if (!user) return;
    
    try {
      if (reminder) {
        const { error } = await supabase
          .from('reminders')
          .update({
            frequency: settings.frequency,
            time: settings.time,
            day_of_week: settings.day_of_week ?? null,
            enabled: settings.enabled,
          })
          .eq('id', reminder.id);
        
        if (error) throw error;
        
        setReminder(prev => prev ? { ...prev, ...settings } : null);
      } else {
        const { data, error } = await supabase
          .from('reminders')
          .insert({
            user_id: user.id,
            frequency: settings.frequency,
            time: settings.time,
            day_of_week: settings.day_of_week ?? null,
            enabled: settings.enabled,
          })
          .select()
          .single();
        
        if (error) throw error;
        setReminder(data as Reminder);
      }
      
      toast.success('提醒设置已保存');
    } catch (error) {
      console.error('Error setting reminder:', error);
      toast.error('保存提醒设置失败');
    }
  };

  const deleteReminder = async () => {
    if (!reminder) return;
    
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', reminder.id);
      
      if (error) throw error;
      
      setReminder(null);
      toast.success('提醒已删除');
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast.error('删除提醒失败');
    }
  };

  return {
    reminder,
    loading,
    setReminderSettings,
    deleteReminder,
  };
}
