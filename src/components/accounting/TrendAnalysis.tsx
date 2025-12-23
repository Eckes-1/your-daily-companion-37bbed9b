import { useMemo, useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Line,
  ComposedChart,
  ReferenceLine,
  ReferenceDot,
} from 'recharts';
import { Transaction } from '@/hooks/useTransactions';
import { format, startOfMonth, subMonths, isAfter, isBefore, addMonths, startOfWeek, subWeeks, eachDayOfInterval, startOfDay, endOfDay, subDays, subYears } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, Activity, BarChart2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface TrendAnalysisProps {
  transactions: Transaction[];
}

type ViewMode = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface TrendDataPoint {
  date: string;
  income: number;
  expense: number;
  balance: number;
  incomeMA?: number;
  expenseMA?: number;
  balanceMA?: number;
}

export function TrendAnalysis({ transactions }: TrendAnalysisProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [showMA, setShowMA] = useState(false);
  const [showBalance, setShowBalance] = useState(false);

  // 计算移动平均
  const calculateMA = (data: TrendDataPoint[], key: 'income' | 'expense' | 'balance', period: number) => {
    return data.map((item, idx) => {
      if (idx < period - 1) return undefined;
      let sum = 0;
      for (let i = 0; i < period; i++) {
        sum += data[idx - i][key];
      }
      return sum / period;
    });
  };

  // 计算趋势数据
  const trendData = useMemo(() => {
    const now = new Date();
    let data: TrendDataPoint[] = [];
    
    if (viewMode === 'daily') {
      // 最近14天
      const days = eachDayOfInterval({ start: subDays(now, 13), end: now });
      
      days.forEach(day => {
        const dayTransactions = transactions.filter(t => {
          const date = new Date(t.date);
          return isAfter(date, startOfDay(day)) && isBefore(date, endOfDay(day));
        });
        
        const income = dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        
        data.push({
          date: format(day, 'M/d', { locale: zhCN }),
          income,
          expense,
          balance: income - expense,
        });
      });
    } else if (viewMode === 'weekly') {
      // 最近4周，每天一个数据点
      const startDate = startOfWeek(subWeeks(now, 3), { weekStartsOn: 1 });
      const days = eachDayOfInterval({ start: startDate, end: now });
      
      days.forEach(day => {
        const dayTransactions = transactions.filter(t => {
          const date = new Date(t.date);
          return isAfter(date, startOfDay(day)) && isBefore(date, endOfDay(day));
        });
        
        const income = dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        
        data.push({
          date: format(day, 'MM/dd', { locale: zhCN }),
          income,
          expense,
          balance: income - expense,
        });
      });
    } else if (viewMode === 'monthly') {
      // 最近6个月
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthEnd = addMonths(monthStart, 1);
        
        const monthTransactions = transactions.filter(t => {
          const date = new Date(t.date);
          return isAfter(date, subMonths(monthStart, 0.1)) && isBefore(date, monthEnd);
        });
        
        const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        
        data.push({
          date: format(monthStart, 'M月', { locale: zhCN }),
          income,
          expense,
          balance: income - expense,
        });
      }
    } else {
      // 年度视图 - 最近12个月
      for (let i = 11; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthEnd = addMonths(monthStart, 1);
        
        const monthTransactions = transactions.filter(t => {
          const date = new Date(t.date);
          return isAfter(date, subMonths(monthStart, 0.1)) && isBefore(date, monthEnd);
        });
        
        const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        
        data.push({
          date: format(monthStart, 'yy/MM', { locale: zhCN }),
          income,
          expense,
          balance: income - expense,
        });
      }
    }

    // 计算移动平均（3期）
    if (showMA && data.length >= 3) {
      const incomeMA = calculateMA(data, 'income', 3);
      const expenseMA = calculateMA(data, 'expense', 3);
      const balanceMA = calculateMA(data, 'balance', 3);
      
      data = data.map((item, idx) => ({
        ...item,
        incomeMA: incomeMA[idx],
        expenseMA: expenseMA[idx],
        balanceMA: balanceMA[idx],
      }));
    }
    
    return data;
  }, [transactions, viewMode, showMA]);

  // 计算环比和同比
  const comparisons = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastYearSameMonthStart = startOfMonth(subYears(now, 1));

    const getMonthData = (monthStart: Date) => {
      const monthEnd = addMonths(monthStart, 1);
      const monthTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return isAfter(date, subMonths(monthStart, 0.1)) && isBefore(date, monthEnd);
      });
      return {
        income: monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        expense: monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
      };
    };

    const current = getMonthData(currentMonthStart);
    const lastMonth = getMonthData(lastMonthStart);
    const lastYearSame = getMonthData(lastYearSameMonthStart);

    const calcChange = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    return {
      // 环比（与上月比）
      momIncome: calcChange(current.income, lastMonth.income),
      momExpense: calcChange(current.expense, lastMonth.expense),
      // 同比（与去年同月比）
      yoyIncome: calcChange(current.income, lastYearSame.income),
      yoyExpense: calcChange(current.expense, lastYearSame.expense),
    };
  }, [transactions]);

  // 找出最高和最低点
  const extremePoints = useMemo(() => {
    if (trendData.length < 2) return { maxExpense: null, minExpense: null };
    
    let maxIdx = 0, minIdx = 0;
    trendData.forEach((item, idx) => {
      if (item.expense > trendData[maxIdx].expense) maxIdx = idx;
      if (item.expense < trendData[minIdx].expense && item.expense > 0) minIdx = idx;
    });
    
    return {
      maxExpense: { idx: maxIdx, value: trendData[maxIdx].expense, date: trendData[maxIdx].date },
      minExpense: trendData[minIdx].expense > 0 ? { idx: minIdx, value: trendData[minIdx].expense, date: trendData[minIdx].date } : null,
    };
  }, [trendData]);

  const getTrendIcon = (change: number) => {
    if (change > 5) return <TrendingUp className="w-3 h-3 text-accent" />;
    if (change < -5) return <TrendingDown className="w-3 h-3 text-destructive" />;
    return <Minus className="w-3 h-3 text-muted-foreground" />;
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
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground text-sm">收支趋势分析</h3>
        <div className="flex gap-0.5">
          {(['daily', 'weekly', 'monthly', 'yearly'] as ViewMode[]).map(mode => (
            <Button
              key={mode}
              variant={viewMode === mode ? 'default' : 'ghost'}
              size="sm"
              className="h-6 px-2 text-[10px]"
              onClick={() => setViewMode(mode)}
            >
              {mode === 'daily' ? '日' : mode === 'weekly' ? '周' : mode === 'monthly' ? '月' : '年'}
            </Button>
          ))}
        </div>
      </div>

      {/* 环比同比指标 */}
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        <div className="p-1.5 rounded-lg bg-accent/10 text-center">
          <p className="text-[9px] text-muted-foreground mb-0.5">收入环比</p>
          <div className="flex items-center justify-center gap-0.5">
            {getTrendIcon(comparisons.momIncome)}
            <span className="text-[10px] font-semibold text-accent">{formatChange(comparisons.momIncome)}</span>
          </div>
        </div>
        <div className="p-1.5 rounded-lg bg-destructive/10 text-center">
          <p className="text-[9px] text-muted-foreground mb-0.5">支出环比</p>
          <div className="flex items-center justify-center gap-0.5">
            {getTrendIcon(-comparisons.momExpense)}
            <span className="text-[10px] font-semibold text-destructive">{formatChange(comparisons.momExpense)}</span>
          </div>
        </div>
        <div className="p-1.5 rounded-lg bg-accent/10 text-center">
          <p className="text-[9px] text-muted-foreground mb-0.5">收入同比</p>
          <div className="flex items-center justify-center gap-0.5">
            {getTrendIcon(comparisons.yoyIncome)}
            <span className="text-[10px] font-semibold text-accent">{formatChange(comparisons.yoyIncome)}</span>
          </div>
        </div>
        <div className="p-1.5 rounded-lg bg-destructive/10 text-center">
          <p className="text-[9px] text-muted-foreground mb-0.5">支出同比</p>
          <div className="flex items-center justify-center gap-0.5">
            {getTrendIcon(-comparisons.yoyExpense)}
            <span className="text-[10px] font-semibold text-destructive">{formatChange(comparisons.yoyExpense)}</span>
          </div>
        </div>
      </div>

      {/* 图表控制 */}
      <div className="flex items-center gap-4 mb-2">
        <div className="flex items-center gap-1.5">
          <Switch id="show-ma" checked={showMA} onCheckedChange={setShowMA} className="scale-75" />
          <Label htmlFor="show-ma" className="text-[10px] text-muted-foreground cursor-pointer">移动平均</Label>
        </div>
        <div className="flex items-center gap-1.5">
          <Switch id="show-balance" checked={showBalance} onCheckedChange={setShowBalance} className="scale-75" />
          <Label htmlFor="show-balance" className="text-[10px] text-muted-foreground cursor-pointer">净结余</Label>
        </div>
      </div>

      {/* 趋势图表 */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
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
              fontSize={9}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={9}
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
                fontSize: '11px',
              }}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  income: '收入',
                  expense: '支出',
                  balance: '结余',
                  incomeMA: '收入MA',
                  expenseMA: '支出MA',
                  balanceMA: '结余MA',
                };
                return [`¥${value.toFixed(2)}`, labels[name] || name];
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
            
            {showBalance && (
              <Line 
                type="monotone" 
                dataKey="balance" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
                name="balance"
              />
            )}
            
            {showMA && (
              <>
                <Line 
                  type="monotone" 
                  dataKey="incomeMA" 
                  stroke="hsl(var(--accent))" 
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  name="incomeMA"
                />
                <Line 
                  type="monotone" 
                  dataKey="expenseMA" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  name="expenseMA"
                />
              </>
            )}

            {/* 最高支出点标记 */}
            {extremePoints.maxExpense && (
              <ReferenceDot
                x={extremePoints.maxExpense.date}
                y={extremePoints.maxExpense.value}
                r={4}
                fill="hsl(var(--destructive))"
                stroke="hsl(var(--background))"
                strokeWidth={2}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 图例 */}
      <div className="flex justify-center gap-4 mt-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-accent" />
          <span className="text-[10px] text-muted-foreground">收入</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
          <span className="text-[10px] text-muted-foreground">支出</span>
        </div>
        {showBalance && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-0.5 bg-primary" />
            <span className="text-[10px] text-muted-foreground">净结余</span>
          </div>
        )}
        {showMA && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-0.5 border-t border-dashed border-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">移动平均</span>
          </div>
        )}
      </div>

      {/* 极值提示 */}
      {extremePoints.maxExpense && (
        <div className="mt-2 text-center">
          <p className="text-[10px] text-muted-foreground">
            最高支出: <span className="text-destructive font-medium">{extremePoints.maxExpense.date}</span> ¥{extremePoints.maxExpense.value.toFixed(0)}
          </p>
        </div>
      )}
    </div>
  );
}
