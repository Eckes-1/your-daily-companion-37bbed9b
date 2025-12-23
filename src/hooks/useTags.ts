import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTags = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [user]);

  const addTag = async (name: string, color: string = '#6366f1') => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('tags')
        .insert({ user_id: user.id, name: name.trim(), color })
        .select()
        .single();

      if (error) throw error;
      setTags([...tags, data]);
      return data;
    } catch (error: any) {
      if (error.code === '23505') {
        toast({ title: '标签已存在', variant: 'destructive' });
      } else {
        console.error('Error adding tag:', error);
        toast({ title: '添加失败', variant: 'destructive' });
      }
      return null;
    }
  };

  const deleteTag = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTags(tags.filter(t => t.id !== id));
      toast({ title: '标签已删除' });
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast({ title: '删除失败', variant: 'destructive' });
    }
  };

  const updateTag = async (id: string, name: string, color: string) => {
    try {
      const { error } = await supabase
        .from('tags')
        .update({ name: name.trim(), color })
        .eq('id', id);

      if (error) throw error;
      setTags(tags.map(t => t.id === id ? { ...t, name, color } : t));
    } catch (error) {
      console.error('Error updating tag:', error);
      toast({ title: '更新失败', variant: 'destructive' });
    }
  };

  // Get tags for a specific transaction
  const getTransactionTags = async (transactionId: string): Promise<Tag[]> => {
    try {
      const { data, error } = await supabase
        .from('transaction_tags')
        .select('tag_id, tags(id, name, color)')
        .eq('transaction_id', transactionId);

      if (error) throw error;
      return (data || []).map((item: any) => item.tags).filter(Boolean);
    } catch (error) {
      console.error('Error fetching transaction tags:', error);
      return [];
    }
  };

  // Add tag to transaction
  const addTagToTransaction = async (transactionId: string, tagId: string) => {
    try {
      const { error } = await supabase
        .from('transaction_tags')
        .insert({ transaction_id: transactionId, tag_id: tagId });

      if (error && error.code !== '23505') throw error; // Ignore duplicate
    } catch (error) {
      console.error('Error adding tag to transaction:', error);
    }
  };

  // Remove tag from transaction
  const removeTagFromTransaction = async (transactionId: string, tagId: string) => {
    try {
      const { error } = await supabase
        .from('transaction_tags')
        .delete()
        .eq('transaction_id', transactionId)
        .eq('tag_id', tagId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing tag from transaction:', error);
    }
  };

  return {
    tags,
    loading,
    addTag,
    deleteTag,
    updateTag,
    getTransactionTags,
    addTagToTransaction,
    removeTagFromTransaction,
    refetch: fetchTags
  };
}
