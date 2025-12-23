import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  is_default: boolean;
}

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: '餐饮', icon: '🍜', color: '#ef4444' },
  { name: '交通', icon: '🚗', color: '#f97316' },
  { name: '购物', icon: '🛒', color: '#eab308' },
  { name: '娱乐', icon: '🎮', color: '#22c55e' },
  { name: '住房', icon: '🏠', color: '#3b82f6' },
  { name: '医疗', icon: '💊', color: '#ec4899' },
  { name: '教育', icon: '📚', color: '#8b5cf6' },
  { name: '其他', icon: '📦', color: '#6b7280' },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: '工资', icon: '💰', color: '#22c55e' },
  { name: '奖金', icon: '🎁', color: '#10b981' },
  { name: '投资', icon: '📈', color: '#6366f1' },
  { name: '兼职', icon: '💼', color: '#f59e0b' },
  { name: '其他', icon: '📦', color: '#6b7280' },
];

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCategories();
    } else {
      setCategories([]);
      setLoading(false);
    }
  }, [user]);

  const fetchCategories = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // If no categories, create defaults
      if (!data || data.length === 0) {
        await initializeDefaultCategories();
      } else {
        setCategories(data as Category[]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('获取分类失败');
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultCategories = async () => {
    if (!user) return;
    
    const expenseCategories = DEFAULT_EXPENSE_CATEGORIES.map(c => ({
      user_id: user.id,
      name: c.name,
      type: 'expense' as const,
      icon: c.icon,
      color: c.color,
      is_default: true,
    }));

    const incomeCategories = DEFAULT_INCOME_CATEGORIES.map(c => ({
      user_id: user.id,
      name: c.name,
      type: 'income' as const,
      icon: c.icon,
      color: c.color,
      is_default: true,
    }));

    const allCategories = [...expenseCategories, ...incomeCategories];

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert(allCategories)
        .select();
      
      if (error) throw error;
      setCategories(data as Category[]);
    } catch (error) {
      console.error('Error creating default categories:', error);
    }
  };

  const addCategory = async (category: { name: string; type: 'income' | 'expense'; icon: string; color: string }) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          ...category,
          is_default: false,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        setCategories(prev => [...prev, data as Category]);
        toast.success('分类添加成功');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('添加分类失败');
    }
  };

  const updateCategory = async (id: string, updates: { name?: string; icon?: string; color?: string }) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      
      setCategories(prev => prev.map(c => 
        c.id === id ? { ...c, ...updates } : c
      ));
      toast.success('分类更新成功');
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('更新分类失败');
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success('分类删除成功');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('删除分类失败');
    }
  };

  const getExpenseCategories = () => categories.filter(c => c.type === 'expense');
  const getIncomeCategories = () => categories.filter(c => c.type === 'income');

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    getExpenseCategories,
    getIncomeCategories,
  };
}
