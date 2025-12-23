import { useState } from 'react';
import { Target, Settings, Check } from 'lucide-react';
import { useBudgets } from '@/hooks/useBudgets';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface BudgetManagerProps {
  totalExpense: number;
}

export function BudgetManager({ totalExpense }: BudgetManagerProps) {
  const { getCurrentMonthBudget, setBudget, loading } = useBudgets();
  const [isOpen, setIsOpen] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState('');

  const currentBudget = getCurrentMonthBudget();
  const budgetValue = currentBudget?.amount || 0;
  const progress = budgetValue > 0 ? Math.min((totalExpense / budgetValue) * 100, 100) : 0;
  const remaining = budgetValue - totalExpense;
  const isOverBudget = remaining < 0;

  const handleSetBudget = async () => {
    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    await setBudget(new Date(), amount);
    setIsOpen(false);
    setBudgetAmount('');
  };

  if (loading) return null;

  return (
    <div className="glass-card p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">
            {format(new Date(), 'M月', { locale: zhCN })}预算
          </h3>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>设置月度预算</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  {format(new Date(), 'yyyy年M月', { locale: zhCN })}预算金额
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="请输入预算金额"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleSetBudget} disabled={!budgetAmount}>
                    <Check className="w-4 h-4 mr-1" />
                    确定
                  </Button>
                </div>
              </div>
              {currentBudget && (
                <p className="text-sm text-muted-foreground">
                  当前预算: ¥{budgetValue.toFixed(2)}
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {budgetValue > 0 ? (
        <>
          <div className="mb-2">
            <Progress 
              value={progress} 
              className={`h-3 ${isOverBudget ? '[&>div]:bg-destructive' : '[&>div]:bg-primary'}`}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              已支出 ¥{totalExpense.toFixed(2)}
            </span>
            <span className={isOverBudget ? 'text-destructive font-medium' : 'text-muted-foreground'}>
              {isOverBudget ? '超支' : '剩余'} ¥{Math.abs(remaining).toFixed(2)}
            </span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground text-center">
            预算 ¥{budgetValue.toFixed(2)} · 使用 {progress.toFixed(0)}%
          </div>
        </>
      ) : (
        <div className="text-center py-2">
          <p className="text-sm text-muted-foreground mb-2">尚未设置本月预算</p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsOpen(true)}
          >
            设置预算
          </Button>
        </div>
      )}
    </div>
  );
}
