import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Sticky {
  id: string;
  content: string;
  color: 'yellow' | 'pink' | 'blue' | 'green';
  created_at: string;
}

export function useStickies() {
  const [stickies, setStickies] = useState<Sticky[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchStickies = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('stickies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStickies((data || []).map(s => ({
        ...s,
        color: s.color as Sticky['color']
      })));
    } catch (error) {
      console.error('Error fetching stickies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStickies();
  }, [user]);

  const addSticky = async (content: string, color: Sticky['color']) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('stickies')
        .insert({ user_id: user.id, content, color })
        .select()
        .single();

      if (error) throw error;
      setStickies([{
        ...data,
        color: data.color as Sticky['color']
      }, ...stickies]);
      toast({ title: '便签已添加' });
    } catch (error) {
      console.error('Error adding sticky:', error);
      toast({ title: '添加失败', variant: 'destructive' });
    }
  };

  const deleteSticky = async (id: string) => {
    try {
      const { error } = await supabase
        .from('stickies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setStickies(stickies.filter(s => s.id !== id));
      toast({ title: '便签已删除' });
    } catch (error) {
      console.error('Error deleting sticky:', error);
      toast({ title: '删除失败', variant: 'destructive' });
    }
  };

  return { stickies, loading, addSticky, deleteSticky, refetch: fetchStickies };
}
