import { useState } from 'react';
import { Plus, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { Transaction } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { TransactionCard } from './TransactionCard';
import { AddTransaction } from './AddTransaction';

export function AccountingTab() {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = (data: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...data,
      id: crypto.randomUUID(),
    };
    setTransactions([newTransaction, ...transactions]);
  };

  const handleDelete = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  return (
    <div className="pb-20">
      {/* Summary Cards */}
      <div className="px-4 mb-6">
        <div className="glass-card p-5">
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">本月结余</p>
            <p className="text-3xl font-bold text-foreground mt-1">
              ¥{balance.toFixed(2)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-income">
              <TrendingUp className="w-5 h-5 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">收入</p>
                <p className="font-semibold text-accent">¥{totalIncome.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-expense">
              <TrendingDown className="w-5 h-5 text-destructive" />
              <div>
                <p className="text-xs text-muted-foreground">支出</p>
                <p className="font-semibold text-destructive">¥{totalExpense.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">暂无记录</h3>
          <p className="text-sm text-muted-foreground mt-1">
            点击右下角按钮开始记账
          </p>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          <h3 className="font-semibold text-foreground mb-3">最近记录</h3>
          {transactions.map((transaction) => (
            <TransactionCard 
              key={transaction.id} 
              transaction={transaction} 
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <button
        onClick={() => setIsAdding(true)}
        className="fab"
      >
        <Plus className="w-6 h-6" />
      </button>

      {isAdding && (
        <AddTransaction
          onAdd={handleAdd}
          onClose={() => setIsAdding(false)}
        />
      )}
    </div>
  );
}
