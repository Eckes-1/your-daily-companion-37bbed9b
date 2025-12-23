import { Trash2, Edit2, Image } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface TransactionDisplay {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: Date;
  image_url?: string;
}

interface TransactionCardProps {
  transaction: TransactionDisplay;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
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

export function TransactionCard({ transaction, onDelete, onEdit }: TransactionCardProps) {
  const [showImage, setShowImage] = useState(false);

  return (
    <>
      <div 
        className={cn(
          'glass-card p-4 animate-fade-in group',
          transaction.type === 'expense' ? 'border-l-4 border-l-destructive/50' : 'border-l-4 border-l-accent/50'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-2xl shrink-0">
              {categoryIcons[transaction.category] || categoryIcons.other}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground truncate">
                {transaction.description || transaction.category}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {format(new Date(transaction.date), 'MM月dd日', { locale: zhCN })}
                </p>
                {transaction.image_url && (
                  <button
                    onClick={() => setShowImage(true)}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
                  >
                    <Image className="w-3 h-3" />
                    <span>查看凭证</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            <span className={cn(
              'font-bold text-lg',
              transaction.type === 'expense' ? 'text-destructive' : 'text-accent'
            )}>
              {transaction.type === 'expense' ? '-' : '+'}¥{transaction.amount.toFixed(2)}
            </span>
            <button
              onClick={() => onEdit(transaction.id)}
              className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(transaction.id)}
              className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImage && transaction.image_url && (
        <div 
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowImage(false)}
        >
          <div className="relative max-w-lg w-full">
            <img 
              src={transaction.image_url} 
              alt="Receipt" 
              className="w-full rounded-xl shadow-elevated"
            />
            <button
              onClick={() => setShowImage(false)}
              className="absolute top-2 right-2 p-2 bg-background/80 rounded-full text-foreground"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
