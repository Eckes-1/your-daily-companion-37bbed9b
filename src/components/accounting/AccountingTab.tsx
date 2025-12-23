import { useState } from 'react';
import { Plus, Wallet, TrendingUp, TrendingDown, Loader2, BarChart3 } from 'lucide-react';
import { useTransactions, Transaction } from '@/hooks/useTransactions';
import { TransactionCard } from './TransactionCard';
import { AddTransaction } from './AddTransaction';
import { AccountingCharts } from './AccountingCharts';

export function AccountingTab() {
  const { transactions, loading, addTransaction, deleteTransaction } = useTransactions();
  const [isAdding, setIsAdding] = useState(false);
  const [showCharts, setShowCharts] = useState(true);

  const handleAdd = async (data: Omit<Transaction, 'id'>) => {
    await addTransaction(data);
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
        
        {/* 图表切换按钮 */}
        {transactions.length > 0 && (
          <button
            onClick={() => setShowCharts(!showCharts)}
            className="w-full mt-4 flex items-center justify-center gap-2 py-2 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            {showCharts ? '隐藏统计图表' : '显示统计图表'}
          </button>
        )}
      </div>

      {/* 统计图表 */}
      {showCharts && <AccountingCharts transactions={transactions} />}

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
              transaction={{
                ...transaction,
                date: new Date(transaction.date),
              }} 
              onDelete={deleteTransaction}
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
