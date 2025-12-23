import { useState } from 'react';
import { Plus, Edit2, Trash2, Tag, X } from 'lucide-react';
import { useCategories, Category } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { toast } from 'sonner';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ICONS = ['🍜', '🚗', '🛒', '🎮', '🏠', '💊', '📚', '💰', '🎁', '📈', '💼', '✈️', '🎬', '☕', '🏋️', '💇', '🐕', '📱', '💡', '📦'];
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#6b7280'];

export function CategoryManager({ isOpen, onClose }: CategoryManagerProps) {
  const { categories, addCategory, updateCategory, deleteCategory, loading } = useCategories();
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [isAdding, setIsAdding] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('📦');
  const [newColor, setNewColor] = useState('#6366f1');

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  const handleAdd = async () => {
    if (!newName.trim()) {
      toast.error('请输入分类名称');
      return;
    }
    
    await addCategory({
      name: newName.trim(),
      type: activeTab,
      icon: newIcon,
      color: newColor,
    });
    
    resetForm();
    setIsAdding(false);
  };

  const handleUpdate = async () => {
    if (!editingCategory || !newName.trim()) return;
    
    await updateCategory(editingCategory.id, {
      name: newName.trim(),
      icon: newIcon,
      color: newColor,
    });
    
    resetForm();
    setEditingCategory(null);
  };

  const handleDelete = async (category: Category) => {
    if (category.is_default) {
      toast.error('默认分类不能删除');
      return;
    }
    await deleteCategory(category.id);
  };

  const startEdit = (category: Category) => {
    setEditingCategory(category);
    setNewName(category.name);
    setNewIcon(category.icon);
    setNewColor(category.color);
    setIsAdding(false);
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditingCategory(null);
    resetForm();
  };

  const resetForm = () => {
    setNewName('');
    setNewIcon('📦');
    setNewColor('#6366f1');
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingCategory(null);
    resetForm();
  };

  const renderCategoryList = (categoryList: Category[]) => (
    <div className="space-y-2">
      {categoryList.map((category) => (
        <div
          key={category.id}
          className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
        >
          <div className="flex items-center gap-3">
            <span 
              className="w-8 h-8 flex items-center justify-center rounded-lg text-lg"
              style={{ backgroundColor: category.color + '20' }}
            >
              {category.icon}
            </span>
            <span className="font-medium text-foreground">{category.name}</span>
            {category.is_default && (
              <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
                默认
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => startEdit(category)}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            {!category.is_default && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => handleDelete(category)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderForm = () => (
    <div className="space-y-4 p-4 rounded-lg bg-secondary/30 border border-border">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-foreground">
          {editingCategory ? '编辑分类' : '添加分类'}
        </h4>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cancelEdit}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">名称</label>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="输入分类名称"
          />
        </div>
        
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">图标</label>
          <div className="flex flex-wrap gap-2">
            {ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setNewIcon(icon)}
                className={`w-10 h-10 flex items-center justify-center rounded-lg text-lg transition-all ${
                  newIcon === icon
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary'
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">颜色</label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setNewColor(color)}
                className={`w-8 h-8 rounded-full transition-all ${
                  newColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1" onClick={cancelEdit}>
          取消
        </Button>
        <Button className="flex-1" onClick={editingCategory ? handleUpdate : handleAdd}>
          {editingCategory ? '保存' : '添加'}
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            分类管理
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'expense' | 'income')} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expense">支出分类</TabsTrigger>
            <TabsTrigger value="income">收入分类</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="expense" className="m-0 space-y-4">
              {(isAdding || editingCategory) && activeTab === 'expense' ? (
                renderForm()
              ) : (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={startAdd}
                >
                  <Plus className="w-4 h-4" />
                  添加支出分类
                </Button>
              )}
              {renderCategoryList(expenseCategories)}
            </TabsContent>
            
            <TabsContent value="income" className="m-0 space-y-4">
              {(isAdding || editingCategory) && activeTab === 'income' ? (
                renderForm()
              ) : (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={startAdd}
                >
                  <Plus className="w-4 h-4" />
                  添加收入分类
                </Button>
              )}
              {renderCategoryList(incomeCategories)}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
