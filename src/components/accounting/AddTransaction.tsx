import { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { Transaction } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface AddTransactionProps {
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
  onClose: () => void;
}

const categories = [
  { id: 'food', label: '餐饮', icon: '🍜' },
  { id: 'transport', label: '交通', icon: '🚗' },
  { id: 'shopping', label: '购物', icon: '🛍️' },
  { id: 'entertainment', label: '娱乐', icon: '🎮' },
  { id: 'salary', label: '工资', icon: '💰' },
  { id: 'investment', label: '投资', icon: '📈' },
  { id: 'gift', label: '礼金', icon: '🎁' },
  { id: 'other', label: '其他', icon: '📝' },
];

export function AddTransaction({ onAdd, onClose }: AddTransactionProps) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    onAdd({
      type,
      amount: parseFloat(amount),
      category,
      description,
      date: new Date(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl shadow-elevated animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
          <h2 className="font-semibold text-foreground">记一笔</h2>
          <Button size="sm" onClick={handleSubmit}>
            保存
          </Button>
        </div>

        <div className="p-4 space-y-6">
          {/* Type Toggle */}
          <div className="flex gap-2 p-1 bg-muted rounded-xl">
            <button
              onClick={() => setType('expense')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all',
                type === 'expense' 
                  ? 'bg-destructive text-destructive-foreground shadow-soft' 
                  : 'text-muted-foreground'
              )}
            >
              <Minus className="w-4 h-4" />
              支出
            </button>
            <button
              onClick={() => setType('income')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all',
                type === 'income' 
                  ? 'bg-accent text-accent-foreground shadow-soft' 
                  : 'text-muted-foreground'
              )}
            >
              <Plus className="w-4 h-4" />
              收入
            </button>
          </div>

          {/* Amount Input */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <span className="text-3xl font-bold text-foreground">¥</span>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-4xl font-bold text-center border-0 bg-transparent w-48 focus-visible:ring-0"
              />
            </div>
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-4 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={cn(
                  'flex flex-col items-center gap-1 p-3 rounded-xl transition-all',
                  category === cat.id 
                    ? 'bg-primary/10 border-2 border-primary' 
                    : 'bg-muted border-2 border-transparent'
                )}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs font-medium text-foreground">{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Description */}
          <Input
            placeholder="备注（可选）"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-muted border-0"
          />
        </div>
      </div>
    </div>
  );
}
