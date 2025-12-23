import { useMemo, useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Transaction } from '@/hooks/useTransactions';
import { format, startOfMonth, subMonths, isAfter, isBefore, addMonths, startOfWeek, subWeeks, addWeeks, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendAnalysisProps {
  transactions: Transaction[];
}

type ViewMode = 'weekly' | 'monthly' | 'yearly';

export function TrendAnalysis({ transactions }: TrendAnalysisProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');

  // 计算趋势数据
  const trendData = useMemo(() => {
    const now = new Date();
    
    if (viewMode === 'weekly') {
      // 最近4周，每天一个数据点
      const data: { date: string; income: number; expense: number; balance: number }[] = [];
      const startDate = startOfWeek(subWeeks(now, 3), { weekStartsOn: 1 });
      const endDate = now;
      
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      
      days.forEach(day => {
        const dayTransactions = transactions.filter(t => {
          const date = new Date(t.date);
          return isAfter(date, startOfDay(day)) && isBefore(date, endOfDay(day));
        });
        
        const income = dayTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const expense = dayTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        
        data.push({
          date: format(day, 'MM/dd', { locale: zhCN }),
          income,
          expense,
          balance: income - expense,
        });
      });
      
      return data;
    } else if (viewMode === 'monthly') {
      // 最近6个月
      const data: { date: string; income: number; expense: number; balance: number }[] = [];
      
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthEnd = addMonths(monthStart, 1);
        const monthLabel = format(monthStart, 'M月', { locale: zhCN });
        
        const monthTransactions = transactions.filter(t => {
          const date = new Date(t.date);
          return isAfter(date, subMonths(monthStart, 0.1)) && isBefore(date, monthEnd);
        });
        
        const income = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const expense = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        
        data.push({
          date: monthLabel,
          income,
          expense,
          balance: income - expense,
        });
      }
      
      return data;
    } else {
      // 年度视图 - 最近12个月
      const data: { date: string; income: number; expense: number; balance: number }[] = [];
      
      for (let i = 11; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthEnd = addMonths(monthStart, 1);
        const monthLabel = format(monthStart, 'yy/MM', { locale: zhCN });
        
        const monthTransactions = transactions.filter(t => {
          const date = new Date(t.date);
          return isAfter(date, subMonths(monthStart, 0.1)) && isBefore(date, monthEnd);
        });
        
        const income = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const expense = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        
        data.push({
          date: monthLabel,
          income,
          expense,
          balance: income - expense,
        });
      }
      
      return data;
    }
  }, [transactions, viewMode]);

  // 计算趋势指标
  const trendIndicators = useMemo(() => {
    if (trendData.length < 2) {
      return { incomeChange: 0, expenseChange: 0, balanceChange: 0 };
    }
    
    const recent = trendData.slice(-2);
    const prev = recent[0];
    const curr = recent[1];
    
    const calcChange = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };
    
    return {
      incomeChange: calcChange(curr.income, prev.income),
      expenseChange: calcChange(curr.expense, prev.expense),
      balanceChange: calcChange(curr.balance, prev.balance),
    };
  }, [trendData]);

  const getTrendIcon = (change: number) => {
    if (change > 5) return <TrendingUp className="w-4 h-4 text-accent" />;
    if (change < -5) return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  if (transactions.length === 0) {
    return null;
  }

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">收支趋势分析</h3>
        <div className="flex gap-1">
          <Button
            variant={viewMode === 'weekly' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setViewMode('weekly')}
          >
            周
          </Button>
          <Button
            variant={viewMode === 'monthly' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setViewMode('monthly')}
          >
            月
          </Button>
          <Button
            variant={viewMode === 'yearly' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setViewMode('yearly')}
          >
            年
          </Button>
        </div>
      </div>

      {/* 趋势指标 */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="p-2 rounded-lg bg-accent/10 text-center">
          <div className="flex items-center justify-center gap-1">
            <span className="text-xs text-muted-foreground">收入变化</span>
            {getTrendIcon(trendIndicators.incomeChange)}
          </div>
          <p className="text-sm font-semibold text-accent">
            {formatChange(trendIndicators.incomeChange)}
          </p>
        </div>
        <div className="p-2 rounded-lg bg-destructive/10 text-center">
          <div className="flex items-center justify-center gap-1">
            <span className="text-xs text-muted-foreground">支出变化</span>
            {getTrendIcon(-trendIndicators.expenseChange)}
          </div>
          <p className="text-sm font-semibold text-destructive">
            {formatChange(trendIndicators.expenseChange)}
          </p>
        </div>
        <div className="p-2 rounded-lg bg-primary/10 text-center">
          <div className="flex items-center justify-center gap-1">
            <span className="text-xs text-muted-foreground">结余变化</span>
            {getTrendIcon(trendIndicators.balanceChange)}
          </div>
          <p className="text-sm font-semibold text-primary">
            {formatChange(trendIndicators.balanceChange)}
          </p>
        </div>
      </div>

      {/* 趋势图表 */}
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickFormatter={(value) => `¥${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
                fontSize: '12px',
              }}
              formatter={(value: number, name: string) => {
                const label = name === 'income' ? '收入' : name === 'expense' ? '支出' : '结余';
                return [`¥${value.toFixed(2)}`, label];
              }}
            />
            <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
            <Area 
              type="monotone" 
              dataKey="income" 
              stroke="hsl(var(--accent))" 
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorIncome)"
              name="income"
            />
            <Area 
              type="monotone" 
              dataKey="expense" 
              stroke="hsl(var(--destructive))" 
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorExpense)"
              name="expense"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-center gap-6 mt-3">
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
  );
}
