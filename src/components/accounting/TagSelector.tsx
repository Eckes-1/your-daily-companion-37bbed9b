import { useState, useEffect } from 'react';
import { X, Plus, Tag as TagIcon, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTags, Tag } from '@/hooks/useTags';
import { cn } from '@/lib/utils';

interface TagSelectorProps {
  transactionId?: string;
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
}

const TAG_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', 
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#ec4899'
];

export function TagSelector({ transactionId, selectedTags, onTagsChange }: TagSelectorProps) {
  const { tags, addTag, addTagToTransaction, removeTagFromTransaction } = useTags();
  const [showPicker, setShowPicker] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6366f1');

  const isSelected = (tagId: string) => selectedTags.some(t => t.id === tagId);

  const handleToggleTag = async (tag: Tag) => {
    if (isSelected(tag.id)) {
      // Remove tag
      if (transactionId) {
        await removeTagFromTransaction(transactionId, tag.id);
      }
      onTagsChange(selectedTags.filter(t => t.id !== tag.id));
    } else {
      // Add tag
      if (transactionId) {
        await addTagToTransaction(transactionId, tag.id);
      }
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    
    const newTag = await addTag(newTagName.trim(), newTagColor);
    if (newTag) {
      onTagsChange([...selectedTags, newTag]);
      if (transactionId) {
        await addTagToTransaction(transactionId, newTag.id);
      }
      setNewTagName('');
      setShowPicker(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Selected Tags Display */}
      <div className="flex flex-wrap gap-1.5">
        {selectedTags.map(tag => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: tag.color }}
          >
            {tag.name}
            <button
              onClick={() => handleToggleTag(tag)}
              className="hover:bg-white/20 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80"
        >
          <Plus className="w-3 h-3" />
          添加标签
        </button>
      </div>

      {/* Tag Picker */}
      {showPicker && (
        <div className="p-3 bg-muted rounded-xl space-y-3">
          {/* Existing Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => handleToggleTag(tag)}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all',
                    isSelected(tag.id) 
                      ? 'ring-2 ring-primary ring-offset-1' 
                      : 'opacity-70 hover:opacity-100'
                  )}
                  style={{ 
                    backgroundColor: tag.color, 
                    color: 'white' 
                  }}
                >
                  {tag.name}
                  {isSelected(tag.id) && <Check className="w-3 h-3" />}
                </button>
              ))}
            </div>
          )}

          {/* Create New Tag */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">创建新标签</p>
            <div className="flex gap-2">
              <Input
                placeholder="标签名称"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="flex-1 h-8 text-sm"
                maxLength={20}
              />
              <Button
                size="sm"
                onClick={handleCreateTag}
                disabled={!newTagName.trim()}
                className="h-8"
              >
                创建
              </Button>
            </div>
            <div className="flex gap-1.5">
              {TAG_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setNewTagColor(color)}
                  className={cn(
                    'w-5 h-5 rounded-full transition-all',
                    newTagColor === color && 'ring-2 ring-primary ring-offset-1'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
