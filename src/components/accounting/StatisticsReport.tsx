import { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { Transaction } from '@/hooks/useTransactions';
import { 
  format, 
  startOfWeek, 
  startOfMonth, 
  startOfYear, 
  endOfWeek, 
  endOfMonth, 
  endOfYear,
  subWeeks,
  subMonths,
  subYears,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  isWithinInterval,
  isSameDay,
  isSameWeek,
  isSameMonth
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Calendar, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StatisticsReportProps {
  transactions: Transaction[];
  isOpen: boolean;
  onClose: () => void;
}

type Period = 'week' | 'month' | 'year';

const CATEGORY_COLORS: Record<string, string> = {
  '餐饮': 'hsl(var(--chart-1))',
  '交通': 'hsl(var(--chart-2))',
  '购物': 'hsl(var(--chart-3))',
  '娱乐': 'hsl(var(--chart-4))',
  '住房': 'hsl(var(--chart-5))',
  '工资': 'hsl(142 76% 36%)',
  '投资': 'hsl(262 83% 58%)',
  '其他': 'hsl(var(--muted-foreground))',
};

const getColor = (category: string, index: number) => {
  return CATEGORY_COLORS[category] || `hsl(${(index * 45) % 360} 70% 50%)`;
};

export function StatisticsReport({ transactions, isOpen, onClose }: StatisticsReportProps) {
  const [period, setPeriod] = useState<Period>('month');
  const now = new Date();

  // Get date range based on period
  const dateRange = useMemo(() => {
    switch (period) {
      case 'week':
        return {
          start: startOfWeek(now, { locale: zhCN }),
          end: endOfWeek(now, { locale: zhCN }),
          label: '本周',
          prevStart: startOfWeek(subWeeks(now, 1), { locale: zhCN }),
          prevEnd: endOfWeek(subWeeks(now, 1), { locale: zhCN }),
        };
      case 'month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
          label: format(now, 'yyyy年M月', { locale: zhCN }),
          prevStart: startOfMonth(subMonths(now, 1)),
          prevEnd: endOfMonth(subMonths(now, 1)),
        };
      case 'year':
        return {
          start: startOfYear(now),
          end: endOfYear(now),
          label: format(now, 'yyyy年', { locale: zhCN }),
          prevStart: startOfYear(subYears(now, 1)),
          prevEnd: endOfYear(subYears(now, 1)),
        };
    }
  }, [period, now]);

  // Filter transactions for current and previous period
  const currentTransactions = useMemo(() => {
    return transactions.filter(t => 
      isWithinInterval(new Date(t.date), { start: dateRange.start, end: dateRange.end })
    );
  }, [transactions, dateRange]);

  const prevTransactions = useMemo(() => {
    return transactions.filter(t => 
      isWithinInterval(new Date(t.date), { start: dateRange.prevStart, end: dateRange.prevEnd })
    );
  }, [transactions, dateRange]);

  // Calculate totals
  const stats = useMemo(() => {
    const income = currentTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = currentTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const prevIncome = prevTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const prevExpense = prevTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    const incomeChange = prevIncome > 0 ? ((income - prevIncome) / prevIncome * 100) : 0;
    const expenseChange = prevExpense > 0 ? ((expense - prevExpense) / prevExpense * 100) : 0;

    return { income, expense, balance: income - expense, incomeChange, expenseChange, count: currentTransactions.length };
  }, [currentTransactions, prevTransactions]);

  // Generate trend data
  const trendData = useMemo(() => {
    let intervals: Date[];
    let formatStr: string;
    let groupFn: (date1: Date, date2: Date) => boolean;

    switch (period) {
      case 'week':
        intervals = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
        formatStr = 'E';
        groupFn = isSameDay;
        break;
      case 'month':
        intervals = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
        formatStr = 'd日';
        groupFn = isSameDay;
        break;
      case 'year':
        intervals = eachMonthOfInterval({ start: dateRange.start, end: dateRange.end });
        formatStr = 'M月';
        groupFn = isSameMonth;
        break;
    }

    return intervals.map(date => {
      const dayTransactions = currentTransactions.filter(t => groupFn(new Date(t.date), date));
      return {
        date: format(date, formatStr, { locale: zhCN }),
        income: dayTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: dayTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [period, dateRange, currentTransactions]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const expenseMap: Record<string, number> = {};
    const incomeMap: Record<string, number> = {};

    currentTransactions.forEach(t => {
      if (t.type === 'expense') {
        expenseMap[t.category] = (expenseMap[t.category] || 0) + t.amount;
      } else {
        incomeMap[t.category] = (incomeMap[t.category] || 0) + t.amount;
      }
    });

    return {
      expense: Object.entries(expenseMap)
        .map(([name, value], i) => ({ name, value, color: getColor(name, i), percent: stats.expense > 0 ? (value / stats.expense * 100) : 0 }))
        .sort((a, b) => b.value - a.value),
      income: Object.entries(incomeMap)
        .map(([name, value], i) => ({ name, value, color: getColor(name, i), percent: stats.income > 0 ? (value / stats.income * 100) : 0 }))
        .sort((a, b) => b.value - a.value),
    };
  }, [currentTransactions, stats]);

  // Daily average
  const dailyAverage = useMemo(() => {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
    return {
      income: stats.income / days,
      expense: stats.expense / days,
    };
  }, [stats, period]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center justify-between p-4">
          <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-lg">统计报表</h2>
          <div className="w-9" />
        </div>
        
        {/* Period Selector */}
        <div className="flex gap-2 px-4 pb-4">
          {(['week', 'month', 'year'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                period === p 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {p === 'week' ? '本周' : p === 'month' ? '本月' : '本年'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-6 pb-20">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              <span className="text-sm text-muted-foreground">收入</span>
            </div>
            <p className="text-xl font-bold text-accent">¥{stats.income.toFixed(2)}</p>
            {stats.incomeChange !== 0 && (
              <p className={cn('text-xs mt-1', stats.incomeChange > 0 ? 'text-accent' : 'text-destructive')}>
                {stats.incomeChange > 0 ? '↑' : '↓'} {Math.abs(stats.incomeChange).toFixed(1)}%
              </p>
            )}
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-destructive" />
              <span className="text-sm text-muted-foreground">支出</span>
            </div>
            <p className="text-xl font-bold text-destructive">¥{stats.expense.toFixed(2)}</p>
            {stats.expenseChange !== 0 && (
              <p className={cn('text-xs mt-1', stats.expenseChange > 0 ? 'text-destructive' : 'text-accent')}>
                {stats.expenseChange > 0 ? '↑' : '↓'} {Math.abs(stats.expenseChange).toFixed(1)}%
              </p>
            )}
          </div>
        </div>

        {/* Balance Card */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{dateRange.label}结余</p>
              <p className={cn('text-2xl font-bold', stats.balance >= 0 ? 'text-accent' : 'text-destructive')}>
                ¥{stats.balance.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">日均支出</p>
              <p className="text-sm font-medium text-foreground">¥{dailyAverage.expense.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="glass-card p-4">
          <h3 className="font-semibold text-foreground mb-4">收支趋势</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  interval={period === 'month' ? 4 : 0}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickFormatter={(v) => `¥${v}`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                  formatter={(value: number) => [`¥${value.toFixed(2)}`, '']}
                />
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  stroke="hsl(var(--accent))" 
                  fill="hsl(var(--accent) / 0.2)"
                  strokeWidth={2}
                  name="收入"
                />
                <Area 
                  type="monotone" 
                  dataKey="expense" 
                  stroke="hsl(var(--destructive))" 
                  fill="hsl(var(--destructive) / 0.2)"
                  strokeWidth={2}
                  name="支出"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent" />
              <span className="text-xs text-muted-foreground">收入</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span className="text-xs text-muted-foreground">支出</span>
            </div>
          </div>
        </div>

        {/* Expense Categories */}
        {categoryData.expense.length > 0 && (
          <div className="glass-card p-4">
            <h3 className="font-semibold text-foreground mb-4">支出分析</h3>
            <div className="flex gap-4">
              <div className="w-32 h-32 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData.expense}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={45}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.expense.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto max-h-32">
                {categoryData.expense.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-foreground">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-foreground">¥{item.value.toFixed(0)}</span>
                      <span className="text-xs text-muted-foreground ml-2">{item.percent.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Income Categories */}
        {categoryData.income.length > 0 && (
          <div className="glass-card p-4">
            <h3 className="font-semibold text-foreground mb-4">收入分析</h3>
            <div className="flex gap-4">
              <div className="w-32 h-32 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData.income}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={45}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.income.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto max-h-32">
                {categoryData.income.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-foreground">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-foreground">¥{item.value.toFixed(0)}</span>
                      <span className="text-xs text-muted-foreground ml-2">{item.percent.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Statistics Summary */}
        <div className="glass-card p-4">
          <h3 className="font-semibold text-foreground mb-4">统计摘要</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">记账笔数</span>
              <span className="text-sm font-medium text-foreground">{stats.count} 笔</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">日均收入</span>
              <span className="text-sm font-medium text-accent">¥{dailyAverage.income.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">日均支出</span>
              <span className="text-sm font-medium text-destructive">¥{dailyAverage.expense.toFixed(2)}</span>
            </div>
            {categoryData.expense[0] && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">最大支出类别</span>
                <span className="text-sm font-medium text-foreground">{categoryData.expense[0].name}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
