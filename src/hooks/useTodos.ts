import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTodos = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodos((data || []).map(t => ({
        ...t,
        priority: t.priority as Todo['priority']
      })));
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, [user]);

  const addTodo = async (title: string, priority: Todo['priority']) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('todos')
        .insert({ user_id: user.id, title, priority })
        .select()
        .single();

      if (error) throw error;
      setTodos([{
        ...data,
        priority: data.priority as Todo['priority']
      }, ...todos]);
      toast({ title: '待办已添加' });
    } catch (error) {
      console.error('Error adding todo:', error);
      toast({ title: '添加失败', variant: 'destructive' });
    }
  };

  const toggleTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !todo.completed })
        .eq('id', id);

      if (error) throw error;
      setTodos(todos.map(t => 
        t.id === id ? { ...t, completed: !t.completed } : t
      ));
    } catch (error) {
      console.error('Error toggling todo:', error);
      toast({ title: '操作失败', variant: 'destructive' });
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTodos(todos.filter(t => t.id !== id));
      toast({ title: '待办已删除' });
    } catch (error) {
      console.error('Error deleting todo:', error);
      toast({ title: '删除失败', variant: 'destructive' });
    }
  };

  return { todos, loading, addTodo, toggleTodo, deleteTodo, refetch: fetchTodos };
}
