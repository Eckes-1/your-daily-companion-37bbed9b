import { useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Transaction } from '@/hooks/useTransactions';
import { format, startOfMonth, subMonths, isAfter, isBefore, addMonths } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface AccountingChartsProps {
  transactions: Transaction[];
}

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

export function AccountingCharts({ transactions }: AccountingChartsProps) {
  // 计算月度趋势数据（最近6个月）
  const monthlyData = useMemo(() => {
    const months: { month: string; income: number; expense: number }[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = startOfMonth(subMonths(now, i - 1));
      const monthLabel = format(monthStart, 'M月', { locale: zhCN });
      
      const monthTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return isAfter(date, subMonths(monthStart, 0.1)) && isBefore(date, addMonths(monthStart, 1));
      });
      
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      months.push({ month: monthLabel, income, expense });
    }
    
    return months;
  }, [transactions]);

  // 计算支出分类占比
  const expenseCategoryData = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
      });
    
    return Object.entries(categoryMap)
      .map(([name, value], index) => ({
        name,
        value,
        color: getColor(name, index),
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // 计算收入分类占比
  const incomeCategoryData = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    
    transactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
      });
    
    return Object.entries(categoryMap)
      .map(([name, value], index) => ({
        name,
        value,
        color: getColor(name, index),
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const hasData = transactions.length > 0;

  if (!hasData) {
    return null;
  }

  return (
    <div className="px-4 space-y-6 mb-6">
      {/* 月度趋势图 */}
      <div className="glass-card p-4">
        <h3 className="font-semibold text-foreground mb-4">月度收支趋势</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `¥${value}`}
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
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="hsl(var(--accent))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--accent))' }}
                name="收入"
              />
              <Line 
                type="monotone" 
                dataKey="expense" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--destructive))' }}
                name="支出"
              />
            </LineChart>
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

      {/* 分类占比饼图 */}
      <div className="grid grid-cols-1 gap-4">
        {expenseCategoryData.length > 0 && (
          <div className="glass-card p-4">
            <h3 className="font-semibold text-foreground mb-4">支出分类占比</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {expenseCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))',
                    }}
                    formatter={(value: number) => [`¥${value.toFixed(2)}`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {expenseCategoryData.map((item, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <div 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {incomeCategoryData.length > 0 && (
          <div className="glass-card p-4">
            <h3 className="font-semibold text-foreground mb-4">收入分类占比</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {incomeCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))',
                    }}
                    formatter={(value: number) => [`¥${value.toFixed(2)}`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {incomeCategoryData.map((item, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <div 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
