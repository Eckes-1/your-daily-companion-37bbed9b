import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Wallet, TrendingUp, TrendingDown, Loader2, BarChart3, Search, X, ChevronDown } from 'lucide-react';
import { useTransactions, Transaction } from '@/hooks/useTransactions';
import { TransactionCard } from './TransactionCard';
import { AddTransaction } from './AddTransaction';
import { AccountingCharts } from './AccountingCharts';
import { TrendAnalysis } from './TrendAnalysis';
import { ImportData } from './ImportData';
import { BudgetManager } from './BudgetManager';
import { FilterPopover, DateRange } from './FilterPopover';
import { CategoryManager } from './CategoryManager';
import { ReminderSettings } from './ReminderSettings';
import { StatisticsReport } from './StatisticsReport';
import { BatchActions } from './BatchActions';
import { BackupManager } from './BackupManager';
import { UnifiedToolbarMenu } from './UnifiedToolbarMenu';
import { PDFExportDialog } from './PDFExportDialog';
import { OnboardingTutorial } from './OnboardingTutorial';
import { PullIndicator, LoadMoreIndicator } from '@/components/ui/PullToRefresh';
import { Input } from '@/components/ui/input';
import { isAfter, isBefore, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useExportData } from '@/hooks/useExportData';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { cn } from '@/lib/utils';

export function AccountingTab() {
  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction, refetch } = useTransactions();
  const [isAdding, setIsAdding] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [hasSeenChartHint, setHasSeenChartHint] = useState(() => localStorage.getItem('hasSeenChartHint') === 'true');
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showBackupManager, setShowBackupManager] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showPDFExport, setShowPDFExport] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [transactionTagMap, setTransactionTagMap] = useState<Record<string, string[]>>({});
  const [editingTransaction, setEditingTransaction] = useState<(Transaction & { id: string }) | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(() => localStorage.getItem('hasCompletedOnboarding') !== 'true');
  const { toast } = useToast();

  // 过滤后的交易记录
  const filteredTransactions = useMemo(() => {
    let result = transactions;
    if (dateRange) {
      result = result.filter(t => {
        const date = new Date(t.date);
        return isAfter(date, startOfDay(dateRange.from)) && isBefore(date, endOfDay(dateRange.to));
      });
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(t => 
        t.description?.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        t.amount.toString().includes(query)
      );
    }
    if (selectedTagIds.length > 0) {
      result = result.filter(t => {
        const tagIds = transactionTagMap[t.id] || [];
        return selectedTagIds.some(selectedId => tagIds.includes(selectedId));
      });
    }
    return result;
  }, [transactions, dateRange, searchQuery, selectedTagIds, transactionTagMap]);

  const { exporting, exportToCSV, exportToExcel, exportByCategoryExcel, exportByMonthExcel, exportToZip, exportToPDF } = useExportData({ transactions: filteredTransactions });

  // 下拉刷新
  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);
  const { containerRef, pullDistance, isRefreshing } = usePullToRefresh({ onRefresh: handleRefresh });

  // 无限滚动
  const { displayedItems, hasMore, isLoadingMore, loadMoreRef } = useInfiniteScroll({ items: filteredTransactions, pageSize: 20 });

  useEffect(() => {
    const fetchTransactionTags = async () => {
      const { data } = await supabase.from('transaction_tags').select('transaction_id, tag_id');
      if (data) {
        const map: Record<string, string[]> = {};
        data.forEach(item => {
          if (!map[item.transaction_id]) map[item.transaction_id] = [];
          map[item.transaction_id].push(item.tag_id);
        });
        setTransactionTagMap(map);
      }
    };
    if (transactions.length > 0) fetchTransactionTags();
  }, [transactions]);

  const handleAdd = async (data: Omit<Transaction, 'id'>) => { await addTransaction(data); };
  const handleUpdate = async (id: string, data: Omit<Transaction, 'id'>) => { await updateTransaction(id, data); };
  const handleEdit = (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) { setEditingTransaction(transaction); setIsAdding(true); }
  };
  const handleCloseEditor = () => { setIsAdding(false); setEditingTransaction(null); };
  const toggleSelectMode = () => { setSelectionMode(!selectionMode); setSelectedIds([]); };
  const toggleSelectTransaction = (id: string) => { setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); };
  const selectAllFiltered = () => { setSelectedIds(filteredTransactions.map(t => t.id)); };
  const invertSelectFiltered = () => {
    const filteredIdSet = new Set(filteredTransactions.map(t => t.id));
    setSelectedIds(prev => {
      const prevSet = new Set(prev);
      const next: string[] = [];
      for (const id of prev) if (!filteredIdSet.has(id)) next.push(id);
      for (const t of filteredTransactions) if (!prevSet.has(t.id)) next.push(t.id);
      return next;
    });
  };
  const handleBatchDelete = async () => {
    try {
      const { error } = await supabase.from('transactions').delete().in('id', selectedIds);
      if (error) throw error;
      toast({ title: `已删除 ${selectedIds.length} 条记录` });
      refetch();
    } catch (error) {
      toast({ title: '删除失败', variant: 'destructive' });
      throw error;
    }
  };
  const handleClearSelection = () => { setSelectedIds([]); setSelectionMode(false); };

  const currentMonthTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      const date = new Date(t.date);
      return isAfter(date, startOfDay(startOfMonth(now))) && isBefore(date, endOfDay(endOfMonth(now)));
    });
  }, [transactions]);

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const currentMonthExpense = currentMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div ref={containerRef} className="pb-20 h-full overflow-auto">
      <PullIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />
      
      <div className="px-4 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="搜索账单（备注、分类、金额）" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-9 bg-muted border-0" />
          {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-background/50"><X className="w-4 h-4 text-muted-foreground" /></button>}
        </div>
      </div>

      {/* 精简工具栏 */}
      <div className="px-4 mb-4 flex items-center justify-between gap-2">
        <FilterPopover dateRange={dateRange} onDateRangeChange={setDateRange} selectedTagIds={selectedTagIds} onTagsChange={setSelectedTagIds} />
        <UnifiedToolbarMenu
          onOpenCategoryManager={() => setShowCategoryManager(true)}
          onOpenReminderSettings={() => setShowReminderSettings(true)}
          onOpenStatistics={() => setShowStatistics(true)}
          onOpenBackupManager={() => setShowBackupManager(true)}
          onToggleSelectMode={toggleSelectMode}
          selectionMode={selectionMode}
          onImport={() => setShowImport(true)}
          onExportCSV={exportToCSV}
          onExportExcel={exportToExcel}
          onExportByCategory={exportByCategoryExcel}
          onExportByMonth={exportByMonthExcel}
          onExportZip={exportToZip}
          onExportPDF={() => setShowPDFExport(true)}
          exporting={exporting}
        />
      </div>

      <div className="px-4"><BudgetManager totalExpense={currentMonthExpense} /></div>

      <div className="px-4 mb-6">
        <div className="glass-card p-5">
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">{dateRange ? '筛选期间结余' : '本月结余'}</p>
            <p className="text-3xl font-bold text-foreground mt-1">¥{balance.toFixed(2)}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-income"><TrendingUp className="w-5 h-5 text-accent" /><div><p className="text-xs text-muted-foreground">收入</p><p className="font-semibold text-accent">¥{totalIncome.toFixed(2)}</p></div></div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-expense"><TrendingDown className="w-5 h-5 text-destructive" /><div><p className="text-xs text-muted-foreground">支出</p><p className="font-semibold text-destructive">¥{totalExpense.toFixed(2)}</p></div></div>
          </div>
        </div>
        {filteredTransactions.length > 0 && (
          <div className="relative mt-4">
            <button 
              onClick={() => {
                setShowCharts(!showCharts);
                if (!hasSeenChartHint) {
                  setHasSeenChartHint(true);
                  localStorage.setItem('hasSeenChartHint', 'true');
                }
              }} 
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-primary hover:text-primary/80 transition-colors bg-primary/5 rounded-lg hover:bg-primary/10"
            >
              <BarChart3 className="w-4 h-4" />
              {showCharts ? '隐藏统计图表' : '查看统计图表'}
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform duration-300",
                showCharts && "rotate-180"
              )} />
            </button>
            {!hasSeenChartHint && !showCharts && (
              <div className="absolute -top-1 -right-1 flex items-center gap-1 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-medium rounded-full animate-pulse">
                点击查看
              </div>
            )}
          </div>
        )}
      </div>

      {/* Charts with animation */}
      <div 
        className={cn(
          "grid transition-all duration-300 ease-out",
          showCharts ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 mb-4">
            <TrendAnalysis transactions={filteredTransactions} />
          </div>
          <AccountingCharts transactions={filteredTransactions} />
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4"><Wallet className="w-8 h-8 text-primary" /></div>
          <h3 className="text-lg font-semibold text-foreground">{dateRange ? '该时间段暂无记录' : '暂无记录'}</h3>
          <p className="text-sm text-muted-foreground mt-1">{dateRange ? '尝试调整筛选条件' : '点击右下角按钮开始记账'}</p>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          <h3 className="font-semibold text-foreground mb-3">{dateRange ? `筛选结果 (${filteredTransactions.length}条)` : '最近记录'}</h3>
          {displayedItems.map((transaction) => <TransactionCard key={transaction.id} transaction={{ ...transaction, date: new Date(transaction.date) }} onDelete={deleteTransaction} onEdit={handleEdit} selectionMode={selectionMode} isSelected={selectedIds.includes(transaction.id)} onSelect={toggleSelectTransaction} />)}
          <div ref={loadMoreRef}>
            <LoadMoreIndicator isLoading={isLoadingMore} hasMore={hasMore} />
          </div>
        </div>
      )}

      <button onClick={() => { setEditingTransaction(null); setIsAdding(true); }} className="fab"><Plus className="w-6 h-6" /></button>

      {isAdding && <AddTransaction onAdd={handleAdd} onClose={handleCloseEditor} editingTransaction={editingTransaction ? { ...editingTransaction, date: typeof editingTransaction.date === 'string' ? editingTransaction.date : new Date(editingTransaction.date).toISOString() } : undefined} onUpdate={handleUpdate} />}
      
      <CategoryManager isOpen={showCategoryManager} onClose={() => setShowCategoryManager(false)} />
      <ReminderSettings isOpen={showReminderSettings} onClose={() => setShowReminderSettings(false)} />
      <StatisticsReport transactions={transactions} isOpen={showStatistics} onClose={() => setShowStatistics(false)} />
      <BackupManager isOpen={showBackupManager} onClose={() => setShowBackupManager(false)} onRestoreComplete={refetch} />
      <ImportData isOpen={showImport} onClose={() => setShowImport(false)} onImportComplete={refetch} />
      <PDFExportDialog isOpen={showPDFExport} onClose={() => setShowPDFExport(false)} transactions={transactions} />
      {selectionMode && <BatchActions selectedIds={selectedIds} filteredCount={filteredTransactions.length} onClearSelection={handleClearSelection} onDelete={handleBatchDelete} onActionComplete={refetch} onSelectAll={selectAllFiltered} onInvertSelect={invertSelectFiltered} />}
      
      {/* Onboarding Tutorial */}
      {showOnboarding && <OnboardingTutorial onComplete={() => setShowOnboarding(false)} />}
    </div>
  );
}
