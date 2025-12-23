import { useState, useEffect } from 'react';
import { Bell, Clock, Calendar } from 'lucide-react';
import { useReminders } from '@/hooks/useReminders';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface ReminderSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: '周日' },
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
];

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return [
    { value: `${hour}:00`, label: `${hour}:00` },
    { value: `${hour}:30`, label: `${hour}:30` },
  ];
}).flat();

export function ReminderSettings({ isOpen, onClose }: ReminderSettingsProps) {
  const { reminder, setReminderSettings, loading } = useReminders();
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [time, setTime] = useState('20:00');
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [enabled, setEnabled] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (reminder) {
      setFrequency(reminder.frequency);
      setTime(reminder.time);
      setDayOfWeek(reminder.day_of_week ?? 0);
      setEnabled(reminder.enabled);
    }
  }, [reminder]);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('您的浏览器不支持通知功能');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission === 'granted') {
      toast.success('通知权限已开启');
      return true;
    } else {
      toast.error('请允许通知权限以接收提醒');
      return false;
    }
  };

  const handleSave = async () => {
    // Request permission if enabling
    if (enabled && notificationPermission !== 'granted') {
      const granted = await requestNotificationPermission();
      if (!granted) return;
    }

    await setReminderSettings({
      frequency,
      time,
      day_of_week: frequency === 'weekly' ? dayOfWeek : undefined,
      enabled,
    });

    // Schedule local notification check
    if (enabled) {
      scheduleReminderCheck();
    }

    onClose();
  };

  const scheduleReminderCheck = () => {
    // Store reminder in localStorage for service worker or periodic check
    const reminderData = {
      frequency,
      time,
      dayOfWeek: frequency === 'weekly' ? dayOfWeek : null,
      enabled,
      lastChecked: new Date().toISOString(),
    };
    localStorage.setItem('accountingReminder', JSON.stringify(reminderData));
  };

  const testNotification = () => {
    if (notificationPermission !== 'granted') {
      requestNotificationPermission();
      return;
    }

    new Notification('记账提醒', {
      body: '别忘了记录今天的收支情况！',
      icon: '/favicon.ico',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            记账提醒设置
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">开启提醒</p>
              <p className="text-sm text-muted-foreground">定时提醒您记账</p>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          {enabled && (
            <>
              {/* Notification Permission */}
              {notificationPermission !== 'granted' && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm text-amber-600 dark:text-amber-400 mb-2">
                    需要通知权限才能发送提醒
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={requestNotificationPermission}
                  >
                    授权通知
                  </Button>
                </div>
              )}

              {/* Frequency */}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  提醒频率
                </label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as 'daily' | 'weekly')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">每天</SelectItem>
                    <SelectItem value="weekly">每周</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Day of Week (for weekly) */}
              {frequency === 'weekly' && (
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    选择星期
                  </label>
                  <Select value={String(dayOfWeek)} onValueChange={(v) => setDayOfWeek(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day.value} value={String(day.value)}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Time */}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  提醒时间
                </label>
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    {TIME_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Test Notification */}
              <Button
                variant="outline"
                className="w-full"
                onClick={testNotification}
              >
                <Bell className="w-4 h-4 mr-2" />
                测试通知
              </Button>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            取消
          </Button>
          <Button className="flex-1" onClick={handleSave}>
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
