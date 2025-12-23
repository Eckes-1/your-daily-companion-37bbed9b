import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  image_url?: string;
  tags?: Tag[];
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
        amount: Number(t.amount),
        image_url: t.image_url || undefined
      })));
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();

    // Subscribe to realtime changes for multi-device sync
    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newTransaction = payload.new as any;
            setTransactions(prev => {
              // Avoid duplicates
              if (prev.some(t => t.id === newTransaction.id)) return prev;
              return [{
                ...newTransaction,
                type: newTransaction.type as 'income' | 'expense',
                amount: Number(newTransaction.amount),
                image_url: newTransaction.image_url || undefined
              }, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as any;
            setTransactions(prev => prev.map(t => 
              t.id === updated.id 
                ? { ...t, ...updated, type: updated.type as 'income' | 'expense', amount: Number(updated.amount), image_url: updated.image_url || undefined }
                : t
            ));
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as any;
            setTransactions(prev => prev.filter(t => t.id !== deleted.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
          date: data.date,
          image_url: data.image_url
        })
        .select()
        .single();

      if (error) throw error;
      
      // Save tags if provided
      if (data.tags && data.tags.length > 0 && newData) {
        for (const tag of data.tags) {
          await supabase
            .from('transaction_tags')
            .insert({ transaction_id: newData.id, tag_id: tag.id })
            .select();
        }
      }
      
      setTransactions([{
        ...newData,
        type: newData.type as 'income' | 'expense',
        amount: Number(newData.amount),
        image_url: newData.image_url || undefined
      }, ...transactions]);
      toast({ title: '记录已保存' });
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({ title: '保存失败', variant: 'destructive' });
    }
  };

  const updateTransaction = async (id: string, data: Omit<Transaction, 'id'>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          type: data.type,
          amount: data.amount,
          category: data.category,
          description: data.description,
          image_url: data.image_url
        })
        .eq('id', id);

      if (error) throw error;
      setTransactions(transactions.map(t => 
        t.id === id 
          ? { ...t, ...data, image_url: data.image_url || undefined } 
          : t
      ));
      toast({ title: '记录已更新' });
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({ title: '更新失败', variant: 'destructive' });
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

  return { transactions, loading, addTransaction, updateTransaction, deleteTransaction, refetch: fetchTransactions };
}
