import { useState, useEffect } from 'react';
import { Trash2, Tag, FolderEdit, X } from 'lucide-react';
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
import { useCategories } from '@/hooks/useCategories';
import { useTags } from '@/hooks/useTags';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

interface BatchActionsProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onDelete: () => Promise<void>;
  onActionComplete: () => void;
}

export function BatchActions({ 
  selectedIds, 
  onClearSelection, 
  onDelete,
  onActionComplete 
}: BatchActionsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
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

  if (selectedIds.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 bg-primary text-primary-foreground rounded-full shadow-lg px-4 py-3 flex items-center gap-3 animate-fade-in">
        <span className="text-sm font-medium">已选 {selectedIds.length} 项</span>
        
        <div className="h-4 w-px bg-primary-foreground/30" />
        
        <Button
          variant="ghost"
          size="sm"
          className="text-primary-foreground hover:bg-primary-foreground/20 gap-1"
          onClick={() => setShowCategoryDialog(true)}
        >
          <FolderEdit className="w-4 h-4" />
          <span className="hidden sm:inline">分类</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="text-primary-foreground hover:bg-primary-foreground/20 gap-1"
          onClick={() => setShowTagDialog(true)}
        >
          <Tag className="w-4 h-4" />
          <span className="hidden sm:inline">标签</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="text-primary-foreground hover:bg-primary-foreground/20 gap-1"
          onClick={() => setShowDeleteConfirm(true)}
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">删除</span>
        </Button>
        
        <div className="h-4 w-px bg-primary-foreground/30" />
        
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/20 w-8 h-8"
          onClick={onClearSelection}
        >
          <X className="w-4 h-4" />
        </Button>
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
    </>
  );
}
