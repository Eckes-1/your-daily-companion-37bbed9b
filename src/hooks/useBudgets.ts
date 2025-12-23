import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { startOfMonth, format } from 'date-fns';

export interface Budget {
  id: string;
  month: string;
  amount: number;
}

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchBudgets();
    } else {
      setBudgets([]);
      setLoading(false);
    }
  }, [user]);

  const fetchBudgets = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('month', { ascending: false });
      
      if (error) throw error;
      setBudgets(data || []);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      toast.error('获取预算失败');
    } finally {
      setLoading(false);
    }
  };

  const setBudget = async (month: Date, amount: number) => {
    if (!user) return;
    
    const monthStr = format(startOfMonth(month), 'yyyy-MM-dd');
    
    try {
      // Check if budget exists for this month
      const existing = budgets.find(b => b.month === monthStr);
      
      if (existing) {
        const { error } = await supabase
          .from('budgets')
          .update({ amount })
          .eq('id', existing.id);
        
        if (error) throw error;
        
        setBudgets(prev => prev.map(b => 
          b.id === existing.id ? { ...b, amount } : b
        ));
      } else {
        const { data, error } = await supabase
          .from('budgets')
          .insert({
            user_id: user.id,
            month: monthStr,
            amount,
          })
          .select()
          .single();
        
        if (error) throw error;
        
        if (data) {
          setBudgets(prev => [data, ...prev]);
        }
      }
      
      toast.success('预算设置成功');
    } catch (error) {
      console.error('Error setting budget:', error);
      toast.error('设置预算失败');
    }
  };

  const getCurrentMonthBudget = () => {
    const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    return budgets.find(b => b.month === currentMonth);
  };

  return {
    budgets,
    loading,
    setBudget,
    getCurrentMonthBudget,
  };
}
