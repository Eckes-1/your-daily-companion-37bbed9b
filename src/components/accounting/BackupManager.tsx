import { useState, useEffect } from 'react';
import { CloudUpload, CloudDownload, Trash2, Loader2, Clock, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Backup {
  id: string;
  name: string;
  created_at: string;
  data: {
    transactions: any[];
    categories: any[];
    tags: any[];
    transaction_tags: any[];
  };
}

interface BackupManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreComplete: () => void;
}

export function BackupManager({ isOpen, onClose, onRestoreComplete }: BackupManagerProps) {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [backupName, setBackupName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Backup | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<Backup | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && user) {
      fetchBackups();
    }
  }, [isOpen, user]);

  const fetchBackups = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('backups')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setBackups((data || []).map(b => ({
        ...b,
        data: b.data as Backup['data'],
      })));
    } catch (error) {
      console.error('Error fetching backups:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    if (!user || !backupName.trim()) return;
    
    setCreating(true);
    try {
      // 获取所有用户数据
      const [transRes, catRes, tagRes, ttRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', user.id),
        supabase.from('categories').select('*').eq('user_id', user.id),
        supabase.from('tags').select('*').eq('user_id', user.id),
        supabase.from('transaction_tags').select('*'),
      ]);

      const backupData = {
        transactions: transRes.data || [],
        categories: catRes.data || [],
        tags: tagRes.data || [],
        transaction_tags: ttRes.data?.filter(tt => 
          transRes.data?.some(t => t.id === tt.transaction_id)
        ) || [],
      };

      const { error } = await supabase.from('backups').insert({
        user_id: user.id,
        name: backupName.trim(),
        data: backupData,
      });

      if (error) throw error;

      toast({ title: '备份创建成功' });
      setBackupName('');
      fetchBackups();
    } catch (error) {
      console.error('Error creating backup:', error);
      toast({ title: '备份失败', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const restoreBackup = async () => {
    if (!user || !restoreTarget) return;

    setRestoring(true);
    try {
      const { data: backup } = restoreTarget;
      
      // 删除现有数据
      await supabase.from('transaction_tags').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('transactions').delete().eq('user_id', user.id);
      await supabase.from('categories').delete().eq('user_id', user.id);
      await supabase.from('tags').delete().eq('user_id', user.id);

      // 恢复数据（保持原ID）
      if (backup.categories.length > 0) {
        await supabase.from('categories').insert(backup.categories);
      }
      if (backup.tags.length > 0) {
        await supabase.from('tags').insert(backup.tags);
      }
      if (backup.transactions.length > 0) {
        await supabase.from('transactions').insert(backup.transactions);
      }
      if (backup.transaction_tags.length > 0) {
        await supabase.from('transaction_tags').insert(backup.transaction_tags);
      }

      toast({ title: '数据恢复成功' });
      setRestoreTarget(null);
      onRestoreComplete();
      onClose();
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast({ title: '恢复失败', variant: 'destructive' });
    } finally {
      setRestoring(false);
    }
  };

  const deleteBackup = async () => {
    if (!deleteTarget) return;

    try {
      const { error } = await supabase
        .from('backups')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;

      toast({ title: '备份已删除' });
      setDeleteTarget(null);
      fetchBackups();
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast({ title: '删除失败', variant: 'destructive' });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              云端备份管理
            </DialogTitle>
            <DialogDescription>
              备份和恢复您的账单数据
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* 创建备份 */}
            <div className="flex gap-2">
              <Input
                placeholder="输入备份名称"
                value={backupName}
                onChange={(e) => setBackupName(e.target.value)}
                disabled={creating}
              />
              <Button
                onClick={createBackup}
                disabled={!backupName.trim() || creating}
                className="gap-1 shrink-0"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CloudUpload className="w-4 h-4" />
                )}
                备份
              </Button>
            </div>

            {/* 备份列表 */}
            <div className="flex-1 overflow-auto space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : backups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  暂无备份记录
                </div>
              ) : (
                backups.map(backup => (
                  <div
                    key={backup.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{backup.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {format(new Date(backup.created_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                        <span>·</span>
                        <span>{backup.data.transactions.length} 条账单</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setRestoreTarget(backup)}
                      >
                        <CloudDownload className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(backup)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              备份包含：账单记录、分类、标签及其关联关系
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除备份</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除备份"{deleteTarget?.name}"吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteBackup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 恢复确认 */}
      <AlertDialog open={!!restoreTarget} onOpenChange={() => setRestoreTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认恢复数据</AlertDialogTitle>
            <AlertDialogDescription>
              恢复将覆盖当前所有数据（账单、分类、标签）。建议先创建当前数据的备份。确定要继续吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={restoreBackup}
              disabled={restoring}
            >
              {restoring ? '恢复中...' : '确认恢复'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
