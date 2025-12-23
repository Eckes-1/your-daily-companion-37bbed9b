import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTransactions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions((data || []).map(t => ({
        ...t,
        type: t.type as 'income' | 'expense',
        amount: Number(t.amount)
      })));
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const addTransaction = async (data: Omit<Transaction, 'id'>) => {
    if (!user) return;

    try {
      const { data: newData, error } = await supabase
        .from('transactions')
        .insert({ 
          user_id: user.id, 
          type: data.type,
          amount: data.amount,
          category: data.category,
          description: data.description,
          date: data.date
        })
        .select()
        .single();

      if (error) throw error;
      setTransactions([{
        ...newData,
        type: newData.type as 'income' | 'expense',
        amount: Number(newData.amount)
      }, ...transactions]);
      toast({ title: '记录已保存' });
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({ title: '保存失败', variant: 'destructive' });
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTransactions(transactions.filter(t => t.id !== id));
      toast({ title: '记录已删除' });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({ title: '删除失败', variant: 'destructive' });
    }
  };

  return { transactions, loading, addTransaction, deleteTransaction, refetch: fetchTransactions };
}
