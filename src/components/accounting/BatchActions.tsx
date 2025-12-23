import { useState } from 'react';
import { Trash2, Tag, FolderEdit, X, CheckCheck, ToggleLeft, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCategories } from '@/hooks/useCategories';
import { useTags } from '@/hooks/useTags';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface BatchActionsProps {
  selectedIds: string[];
  filteredCount: number;
  onClearSelection: () => void;
  onDelete: () => Promise<void>;
  onActionComplete: () => void;
  onSelectAll: () => void;
  onInvertSelect: () => void;
}

export function BatchActions({ 
  selectedIds,
  filteredCount,
  onClearSelection, 
  onDelete,
  onActionComplete,
  onSelectAll,
  onInvertSelect,
}: BatchActionsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [showDateDialog, setShowDateDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { getExpenseCategories, getIncomeCategories } = useCategories();
  const { tags, addTagToTransaction, removeTagFromTransaction, getTransactionTags } = useTags();
  const { toast } = useToast();

  const allCategories = [...getExpenseCategories(), ...getIncomeCategories()];

  const handleBatchDelete = async () => {
    setIsProcessing(true);
    try {
      await onDelete();
      setShowDeleteConfirm(false);
      onClearSelection();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchUpdateCategory = async () => {
    if (!selectedCategory) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ category: selectedCategory })
        .in('id', selectedIds);

      if (error) throw error;
      
      toast({ title: `已更新 ${selectedIds.length} 条记录的分类` });
      setShowCategoryDialog(false);
      setSelectedCategory('');
      onClearSelection();
      onActionComplete();
    } catch (error) {
      console.error('Error updating categories:', error);
      toast({ title: '更新失败', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchSetTags = async () => {
    setIsProcessing(true);
    try {
      // For each selected transaction, set the selected tags
      for (const transactionId of selectedIds) {
        // Get current tags
        const currentTags = await getTransactionTags(transactionId);
        const currentTagIds = currentTags.map(t => t.id);
        
        // Remove tags that are not selected
        for (const tagId of currentTagIds) {
          if (!selectedTagIds.includes(tagId)) {
            await removeTagFromTransaction(transactionId, tagId);
          }
        }
        
        // Add new tags
        for (const tagId of selectedTagIds) {
          if (!currentTagIds.includes(tagId)) {
            await addTagToTransaction(transactionId, tagId);
          }
        }
      }
      
      toast({ title: `已更新 ${selectedIds.length} 条记录的标签` });
      setShowTagDialog(false);
      setSelectedTagIds([]);
      onClearSelection();
      onActionComplete();
    } catch (error) {
      console.error('Error updating tags:', error);
      toast({ title: '更新标签失败', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleBatchUpdateDate = async () => {
    if (!selectedDate) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ date: selectedDate.toISOString() })
        .in('id', selectedIds);

      if (error) throw error;
      
      toast({ title: `已更新 ${selectedIds.length} 条记录的日期` });
      setShowDateDialog(false);
      setSelectedDate(undefined);
      onClearSelection();
      onActionComplete();
    } catch (error) {
      console.error('Error updating dates:', error);
      toast({ title: '更新失败', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Compact floating action bar */}
      <div className="fixed bottom-24 left-4 right-4 z-40 animate-slide-up">
        <div className="bg-card border border-border rounded-2xl shadow-elevated p-3">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                已选 <span className="text-primary font-bold">{selectedIds.length}</span> 项
              </span>
              <span className="text-xs text-muted-foreground">/ {filteredCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onSelectAll}
                className="text-xs text-primary hover:text-primary/80 px-2 py-1 rounded-md hover:bg-primary/10 transition-colors"
              >
                全选
              </button>
              <button
                onClick={onInvertSelect}
                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors"
              >
                反选
              </button>
              <button
                onClick={onClearSelection}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCategoryDialog(true)}
              disabled={selectedIds.length === 0}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              <FolderEdit className="w-4 h-4" />
              分类
            </button>
            
            <button
              onClick={() => setShowTagDialog(true)}
              disabled={selectedIds.length === 0}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              <Tag className="w-4 h-4" />
              标签
            </button>

            <button
              onClick={() => setShowDateDialog(true)}
              disabled={selectedIds.length === 0}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              <CalendarDays className="w-4 h-4" />
              日期
            </button>
            
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={selectedIds.length === 0}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除选中的 {selectedIds.length} 条记录吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBatchDelete}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批量修改分类</DialogTitle>
            <DialogDescription>
              将选中的 {selectedIds.length} 条记录修改为同一分类
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                {allCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.name}>
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowCategoryDialog(false)}
              className="flex-1"
              disabled={isProcessing}
            >
              取消
            </Button>
            <Button 
              onClick={handleBatchUpdateCategory}
              className="flex-1"
              disabled={!selectedCategory || isProcessing}
            >
              {isProcessing ? '更新中...' : '确认修改'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tag Dialog */}
      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批量设置标签</DialogTitle>
            <DialogDescription>
              为选中的 {selectedIds.length} 条记录设置标签
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                暂无标签，请先创建标签
              </p>
            ) : (
              <div className="space-y-2">
                {tags.map(tag => (
                  <div
                    key={tag.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                    onClick={() => toggleTag(tag.id)}
                  >
                    <Checkbox 
                      checked={selectedTagIds.includes(tag.id)}
                      onCheckedChange={() => toggleTag(tag.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={selectedTagIds.includes(tag.id) ? `取消标签：${tag.name}` : `选择标签：${tag.name}`}
                    />
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-sm">{tag.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowTagDialog(false)}
              className="flex-1"
              disabled={isProcessing}
            >
              取消
            </Button>
            <Button 
              onClick={handleBatchSetTags}
              className="flex-1"
              disabled={isProcessing}
            >
              {isProcessing ? '更新中...' : '确认设置'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Date Dialog */}
      <Dialog open={showDateDialog} onOpenChange={setShowDateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批量修改日期</DialogTitle>
            <DialogDescription>
              将选中的 {selectedIds.length} 条记录修改为同一日期
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={zhCN}
              className="rounded-md border"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowDateDialog(false)}
              className="flex-1"
              disabled={isProcessing}
            >
              取消
            </Button>
            <Button 
              onClick={handleBatchUpdateDate}
              className="flex-1"
              disabled={!selectedDate || isProcessing}
            >
              {isProcessing ? '更新中...' : selectedDate ? `修改为 ${format(selectedDate, 'yyyy-MM-dd')}` : '选择日期'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
