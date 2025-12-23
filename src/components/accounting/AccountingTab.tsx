import { useState, useMemo, useEffect } from 'react';
import { Plus, Wallet, TrendingUp, TrendingDown, Loader2, BarChart3, Tag, Bell, PieChart, Search, X, CheckSquare, Database } from 'lucide-react';
import { useTransactions, Transaction } from '@/hooks/useTransactions';
import { useTags } from '@/hooks/useTags';
import { TransactionCard } from './TransactionCard';
import { AddTransaction } from './AddTransaction';
import { AccountingCharts } from './AccountingCharts';
import { ExportData } from './ExportData';
import { ImportData } from './ImportData';
import { BudgetManager } from './BudgetManager';
import { DateFilter, DateRange } from './DateFilter';
import { CategoryManager } from './CategoryManager';
import { ReminderSettings } from './ReminderSettings';
import { StatisticsReport } from './StatisticsReport';
import { TagFilter } from './TagFilter';
import { BatchActions } from './BatchActions';
import { BackupManager } from './BackupManager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isAfter, isBefore, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function AccountingTab() {
  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction, refetch } = useTransactions();
  const [isAdding, setIsAdding] = useState(false);
  const [showCharts, setShowCharts] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showBackupManager, setShowBackupManager] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [transactionTagMap, setTransactionTagMap] = useState<Record<string, string[]>>({});
  const [editingTransaction, setEditingTransaction] = useState<(Transaction & { id: string }) | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch all transaction tags for filtering
  useEffect(() => {
    const fetchTransactionTags = async () => {
      const { data } = await supabase
        .from('transaction_tags')
        .select('transaction_id, tag_id');
      
      if (data) {
        const map: Record<string, string[]> = {};
        data.forEach(item => {
          if (!map[item.transaction_id]) {
            map[item.transaction_id] = [];
          }
          map[item.transaction_id].push(item.tag_id);
        });
        setTransactionTagMap(map);
      }
    };
    
    if (transactions.length > 0) {
      fetchTransactionTags();
    }
  }, [transactions]);

  const handleAdd = async (data: Omit<Transaction, 'id'>) => {
    await addTransaction(data);
  };

  const handleUpdate = async (id: string, data: Omit<Transaction, 'id'>) => {
    await updateTransaction(id, data);
  };

  const handleEdit = (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
      setEditingTransaction(transaction);
      setIsAdding(true);
    }
  };

  const handleCloseEditor = () => {
    setIsAdding(false);
    setEditingTransaction(null);
  };

  const toggleSelectMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedIds([]);
  };

  const toggleSelectTransaction = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    setSelectedIds(filteredTransactions.map(t => t.id));
  };

  const invertSelectFiltered = () => {
    const filteredIdSet = new Set(filteredTransactions.map(t => t.id));

    setSelectedIds(prev => {
      const prevSet = new Set(prev);
      const next: string[] = [];

      // 保留不在当前筛选结果中的已选项
      for (const id of prev) {
        if (!filteredIdSet.has(id)) next.push(id);
      }

      // 对当前筛选结果做“反选”
      for (const t of filteredTransactions) {
        if (!prevSet.has(t.id)) next.push(t.id);
      }

      return next;
    });
  };

  const handleBatchDelete = async () => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', selectedIds);
      
      if (error) throw error;
      toast({ title: `已删除 ${selectedIds.length} 条记录` });
      refetch();
    } catch (error) {
      console.error('Error batch deleting:', error);
      toast({ title: '删除失败', variant: 'destructive' });
      throw error;
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
    setSelectionMode(false);
  };

  // 过滤后的交易记录（日期 + 搜索 + 标签）
  const filteredTransactions = useMemo(() => {
    let result = transactions;
    
    // 日期筛选
    if (dateRange) {
      result = result.filter(t => {
        const date = new Date(t.date);
        return (
          isAfter(date, startOfDay(dateRange.from)) &&
          isBefore(date, endOfDay(dateRange.to))
        );
      });
    }
    
    // 关键词搜索
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(t => 
        t.description?.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        t.amount.toString().includes(query)
      );
    }
    
    // 标签筛选
    if (selectedTagIds.length > 0) {
      result = result.filter(t => {
        const tagIds = transactionTagMap[t.id] || [];
        return selectedTagIds.some(selectedId => tagIds.includes(selectedId));
      });
    }
    
    return result;
  }, [transactions, dateRange, searchQuery, selectedTagIds, transactionTagMap]);

  // 当月交易（用于预算计算）
  const currentMonthTransactions = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    return transactions.filter(t => {
      const date = new Date(t.date);
      return isAfter(date, startOfDay(monthStart)) && isBefore(date, endOfDay(monthEnd));
    });
  }, [transactions]);

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentMonthExpense = currentMonthTransactions
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
      {/* 搜索栏 */}
      <div className="px-4 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索账单（备注、分类、金额）"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 bg-muted border-0"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-background/50"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* 工具栏 */}
      <div className="px-4 mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <DateFilter 
            dateRange={dateRange} 
            onDateRangeChange={setDateRange} 
          />
          <TagFilter 
            selectedTagIds={selectedTagIds}
            onTagsChange={setSelectedTagIds}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={selectionMode ? "default" : "outline"}
            size="sm"
            onClick={toggleSelectMode}
            className="gap-1"
          >
            <CheckSquare className="w-4 h-4" />
            <span className="hidden sm:inline">批量</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCategoryManager(true)}
            className="gap-1"
          >
            <Tag className="w-4 h-4" />
            <span className="hidden sm:inline">分类</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReminderSettings(true)}
            className="gap-1"
          >
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">提醒</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStatistics(true)}
            className="gap-1"
          >
            <PieChart className="w-4 h-4" />
            <span className="hidden sm:inline">报表</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBackupManager(true)}
            className="gap-1"
          >
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">备份</span>
          </Button>
          <ImportData onImportComplete={refetch} />
          <ExportData transactions={filteredTransactions} />
        </div>
      </div>

      {/* 预算管理 */}
      <div className="px-4">
        <BudgetManager totalExpense={currentMonthExpense} />
      </div>

      {/* Summary Cards */}
      <div className="px-4 mb-6">
        <div className="glass-card p-5">
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">
              {dateRange ? '筛选期间结余' : '本月结余'}
            </p>
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
        {filteredTransactions.length > 0 && (
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
      {showCharts && <AccountingCharts transactions={filteredTransactions} />}

      {filteredTransactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {dateRange ? '该时间段暂无记录' : '暂无记录'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {dateRange ? '尝试调整筛选条件' : '点击右下角按钮开始记账'}
          </p>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          <h3 className="font-semibold text-foreground mb-3">
            {dateRange ? `筛选结果 (${filteredTransactions.length}条)` : '最近记录'}
          </h3>
          {filteredTransactions.map((transaction) => (
            <TransactionCard 
              key={transaction.id} 
              transaction={{
                ...transaction,
                date: new Date(transaction.date),
              }} 
              onDelete={deleteTransaction}
              onEdit={handleEdit}
              selectionMode={selectionMode}
              isSelected={selectedIds.includes(transaction.id)}
              onSelect={toggleSelectTransaction}
            />
          ))}
        </div>
      )}

      <button
        onClick={() => {
          setEditingTransaction(null);
          setIsAdding(true);
        }}
        className="fab"
      >
        <Plus className="w-6 h-6" />
      </button>

      {isAdding && (
        <AddTransaction
          onAdd={handleAdd}
          onClose={handleCloseEditor}
          editingTransaction={editingTransaction ? {
            ...editingTransaction,
            date: typeof editingTransaction.date === 'string' 
              ? editingTransaction.date 
              : new Date(editingTransaction.date).toISOString()
          } : undefined}
          onUpdate={handleUpdate}
        />
      )}

      {/* 分类管理弹窗 */}
      <CategoryManager 
        isOpen={showCategoryManager} 
        onClose={() => setShowCategoryManager(false)} 
      />

      {/* 提醒设置弹窗 */}
      <ReminderSettings 
        isOpen={showReminderSettings} 
        onClose={() => setShowReminderSettings(false)} 
      />

      {/* 统计报表 */}
      <StatisticsReport 
        transactions={transactions}
        isOpen={showStatistics} 
        onClose={() => setShowStatistics(false)} 
      />

      {/* 备份管理 */}
      <BackupManager
        isOpen={showBackupManager}
        onClose={() => setShowBackupManager(false)}
        onRestoreComplete={refetch}
      />

      {/* 批量操作栏 */}
      {selectionMode && (
        <BatchActions
          selectedIds={selectedIds}
          filteredCount={filteredTransactions.length}
          onClearSelection={handleClearSelection}
          onDelete={handleBatchDelete}
          onActionComplete={refetch}
          onSelectAll={selectAllFiltered}
          onInvertSelect={invertSelectFiltered}
        />
      )}
    </div>
  );
}
