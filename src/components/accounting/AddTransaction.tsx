import { useState, useEffect } from 'react';
import { X, Plus, Minus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useCategories } from '@/hooks/useCategories';
import { useTags, Tag } from '@/hooks/useTags';
import { ReceiptScanner } from './ReceiptScanner';
import { TagSelector } from './TagSelector';

interface TransactionData {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  image_url?: string;
  tags?: Tag[];
}

interface AddTransactionProps {
  onAdd: (transaction: TransactionData) => void;
  onClose: () => void;
  editingTransaction?: TransactionData & { id: string };
  onUpdate?: (id: string, transaction: TransactionData) => void;
}

export function AddTransaction({ onAdd, onClose, editingTransaction, onUpdate }: AddTransactionProps) {
  const { getExpenseCategories, getIncomeCategories, loading } = useCategories();
  const { getTransactionTags, addTagToTransaction } = useTags();
  const [type, setType] = useState<'expense' | 'income'>(editingTransaction?.type || 'expense');
  const [amount, setAmount] = useState(editingTransaction?.amount?.toString() || '');
  const [category, setCategory] = useState(editingTransaction?.category || '');
  const [description, setDescription] = useState(editingTransaction?.description || '');
  const [imageUrl, setImageUrl] = useState<string | null>(editingTransaction?.image_url || null);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  // Load existing tags when editing
  useEffect(() => {
    if (editingTransaction?.id) {
      getTransactionTags(editingTransaction.id).then(setSelectedTags);
    }
  }, [editingTransaction?.id]);

  const expenseCategories = getExpenseCategories();
  const incomeCategories = getIncomeCategories();
  const currentCategories = type === 'expense' ? expenseCategories : incomeCategories;

  const isEditing = !!editingTransaction;

  // Set default category when type changes or categories load
  useEffect(() => {
    if (currentCategories.length > 0 && !category) {
      setCategory(currentCategories[0].name);
    }
  }, [currentCategories, type]);

  // Update category when editing and categories are loaded
  useEffect(() => {
    if (editingTransaction?.category && currentCategories.length > 0) {
      setCategory(editingTransaction.category);
    }
  }, [editingTransaction, currentCategories]);

  const handleTypeChange = (newType: 'expense' | 'income') => {
    setType(newType);
    const cats = newType === 'expense' ? expenseCategories : incomeCategories;
    if (cats.length > 0) {
      setCategory(cats[0].name);
    }
  };

  const handleScanComplete = (result: { amount: number; type: 'income' | 'expense'; category: string; description: string; imageUrl: string }) => {
    setAmount(result.amount.toString());
    setType(result.type);
    setCategory(result.category);
    setDescription(result.description);
    setImageUrl(result.imageUrl);
  };

  const getCategoryNames = () => ({
    expense: expenseCategories.map(c => c.name),
    income: incomeCategories.map(c => c.name)
  });

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    const transactionData: TransactionData = {
      type,
      amount: parseFloat(amount),
      category: category || '其他',
      description,
      date: editingTransaction?.date || new Date().toISOString(),
      image_url: imageUrl || undefined,
      tags: selectedTags,
    };

    if (isEditing && onUpdate) {
      onUpdate(editingTransaction.id, transactionData);
    } else {
      onAdd(transactionData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl shadow-elevated animate-slide-up max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-card z-10">
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
          <h2 className="font-semibold text-foreground text-sm">{isEditing ? '编辑账单' : '记一笔'}</h2>
          <Button size="sm" onClick={handleSubmit} className="h-8 px-4 text-sm">
            {isEditing ? '更新' : '保存'}
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Receipt Scanner */}
          <ReceiptScanner 
            onScanComplete={handleScanComplete} 
            categories={getCategoryNames()} 
            existingImageUrl={imageUrl || undefined}
            onImageChange={setImageUrl}
          />
          
          {/* Type Toggle */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <button
              onClick={() => handleTypeChange('expense')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md font-medium text-sm transition-all',
                type === 'expense' 
                  ? 'bg-destructive text-destructive-foreground shadow-soft' 
                  : 'text-muted-foreground'
              )}
            >
              <Minus className="w-3.5 h-3.5" />
              支出
            </button>
            <button
              onClick={() => handleTypeChange('income')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md font-medium text-sm transition-all',
                type === 'income' 
                  ? 'bg-accent text-accent-foreground shadow-soft' 
                  : 'text-muted-foreground'
              )}
            >
              <Plus className="w-3.5 h-3.5" />
              收入
            </button>
          </div>

          {/* Amount Input */}
          <div className="text-center py-2">
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl font-bold text-foreground">¥</span>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-3xl font-bold text-center border-0 bg-transparent w-40 focus-visible:ring-0 h-10"
              />
            </div>
          </div>

          {/* Category Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto">
              {currentCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.name)}
                  className={cn(
                    'flex flex-col items-center gap-0.5 p-2 rounded-lg transition-all',
                    category === cat.name 
                      ? 'bg-primary/10 border-2 border-primary' 
                      : 'bg-muted/50 border-2 border-transparent'
                  )}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-[11px] font-medium text-foreground truncate w-full text-center">{cat.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Description */}
          <Input
            placeholder="备注（可选）"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-muted border-0 h-9 text-sm"
          />

          {/* Tags */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">标签</p>
            <TagSelector
              transactionId={editingTransaction?.id}
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
