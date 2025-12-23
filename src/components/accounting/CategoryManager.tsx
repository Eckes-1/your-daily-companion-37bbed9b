import { useState } from 'react';
import { Plus, Edit2, Trash2, Tag, X } from 'lucide-react';
import { useCategories, Category, IconStyle } from '@/hooks/useCategories';
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
import { CategoryIcon, CATEGORY_ICONS, ICON_STYLES } from './CategoryIcon';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#6b7280'];

export function CategoryManager({ isOpen, onClose }: CategoryManagerProps) {
  const { categories, addCategory, updateCategory, deleteCategory, loading } = useCategories();
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [isAdding, setIsAdding] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('package');
  const [newColor, setNewColor] = useState('#6366f1');
  const [newIconStyle, setNewIconStyle] = useState<IconStyle>('outline');

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
      icon_style: newIconStyle,
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
      icon_style: newIconStyle,
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
    setNewIconStyle(category.icon_style || 'outline');
    setIsAdding(false);
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditingCategory(null);
    resetForm();
  };

  const resetForm = () => {
    setNewName('');
    setNewIcon('package');
    setNewColor('#6366f1');
    setNewIconStyle('outline');
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingCategory(null);
    resetForm();
  };

  const renderCategoryList = (categoryList: Category[]) => (
    <div className="space-y-1.5">
      {categoryList.map((category) => (
        <div
          key={category.id}
          className="flex items-center justify-between p-2 rounded-lg bg-secondary/50"
        >
          <div className="flex items-center gap-2">
            <div 
              className="w-7 h-7 flex items-center justify-center rounded-lg"
              style={{ backgroundColor: category.color + '20' }}
            >
              <CategoryIcon icon={category.icon} color={category.color} size="sm" style={category.icon_style || 'outline'} />
            </div>
            <span className="font-medium text-foreground text-sm">{category.name}</span>
            {category.is_default && (
              <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                默认
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => startEdit(category)}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
            {!category.is_default && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => handleDelete(category)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderForm = () => (
    <div className="space-y-3 p-3 rounded-lg bg-secondary/30 border border-border">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-foreground text-sm">
          {editingCategory ? '编辑分类' : '添加分类'}
        </h4>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEdit}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
      
      <div className="space-y-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">名称</label>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="输入分类名称"
            className="h-8 text-sm"
          />
        </div>
        
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">图标</label>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {CATEGORY_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setNewIcon(icon)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                  newIcon === icon
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary'
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                <CategoryIcon icon={icon} size="sm" style={newIconStyle} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">风格</label>
          <div className="flex gap-2">
            {ICON_STYLES.map((style) => (
              <button
                key={style.value}
                type="button"
                onClick={() => setNewIconStyle(style.value)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  newIconStyle === style.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80 text-foreground'
                }`}
              >
                <CategoryIcon icon="heart" size="sm" style={style.value} color={newIconStyle === style.value ? undefined : newColor} />
                {style.label}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">颜色</label>
          <div className="flex flex-wrap gap-1.5">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setNewColor(color)}
                className={`w-6 h-6 rounded-full transition-all ${
                  newColor === color ? 'ring-2 ring-offset-1 ring-primary' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" className="flex-1 h-8" onClick={cancelEdit}>
          取消
        </Button>
        <Button size="sm" className="flex-1 h-8" onClick={editingCategory ? handleUpdate : handleAdd}>
          {editingCategory ? '保存' : '添加'}
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm max-h-[70vh] overflow-hidden flex flex-col p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Tag className="w-4 h-4" />
            分类管理
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'expense' | 'income')} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2 h-9">
            <TabsTrigger value="expense" className="text-sm">支出</TabsTrigger>
            <TabsTrigger value="income" className="text-sm">收入</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-y-auto mt-3 space-y-3">
            <TabsContent value="expense" className="m-0 space-y-3">
              {(isAdding || editingCategory) && activeTab === 'expense' ? (
                renderForm()
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 h-8"
                  onClick={startAdd}
                >
                  <Plus className="w-3.5 h-3.5" />
                  添加支出分类
                </Button>
              )}
              {renderCategoryList(expenseCategories)}
            </TabsContent>
            
            <TabsContent value="income" className="m-0 space-y-3">
              {(isAdding || editingCategory) && activeTab === 'income' ? (
                renderForm()
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 h-8"
                  onClick={startAdd}
                >
                  <Plus className="w-3.5 h-3.5" />
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
