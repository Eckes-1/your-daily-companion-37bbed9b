import { Transaction } from '@/types';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TransactionCardProps {
  transaction: Transaction;
  onDelete: (id: string) => void;
}

const categoryIcons: Record<string, string> = {
  food: '🍜',
  transport: '🚗',
  shopping: '🛍️',
  entertainment: '🎮',
  salary: '💰',
  investment: '📈',
  gift: '🎁',
  other: '📝',
};

export function TransactionCard({ transaction, onDelete }: TransactionCardProps) {
  return (
    <div 
      className={cn(
        'glass-card p-4 animate-fade-in group',
        transaction.type === 'expense' ? 'border-l-4 border-l-destructive/50' : 'border-l-4 border-l-accent/50'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">
            {categoryIcons[transaction.category] || categoryIcons.other}
          </span>
          <div>
            <p className="font-medium text-foreground">
              {transaction.description || transaction.category}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(transaction.date), 'MM月dd日', { locale: zhCN })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={cn(
            'font-bold text-lg',
            transaction.type === 'expense' ? 'text-destructive' : 'text-accent'
          )}>
            {transaction.type === 'expense' ? '-' : '+'}¥{transaction.amount.toFixed(2)}
          </span>
          <button
            onClick={() => onDelete(transaction.id)}
            className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
