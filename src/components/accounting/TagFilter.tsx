import { useState } from 'react';
import { Tag as TagIcon, X, ChevronDown } from 'lucide-react';
import { useTags, Tag } from '@/hooks/useTags';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface TagFilterProps {
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
}

export function TagFilter({ selectedTagIds, onTagsChange }: TagFilterProps) {
  const { tags } = useTags();
  const [open, setOpen] = useState(false);

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTagIds, tagId]);
    }
  };

  const clearAll = () => {
    onTagsChange([]);
    setOpen(false);
  };

  const selectedTags = tags.filter(t => selectedTagIds.includes(t.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'gap-1 h-8',
            selectedTagIds.length > 0 && 'bg-primary/10 border-primary text-primary'
          )}
        >
          <TagIcon className="w-3.5 h-3.5" />
          {selectedTagIds.length > 0 ? (
            <span className="flex items-center gap-1">
              <span className="hidden sm:inline">标签</span>
              <span className="bg-primary text-primary-foreground text-xs px-1.5 rounded-full">
                {selectedTagIds.length}
              </span>
            </span>
          ) : (
            <span className="hidden sm:inline">标签</span>
          )}
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">按标签筛选</p>
            {selectedTagIds.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                清除全部
              </button>
            )}
          </div>

          {tags.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">暂无标签</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {tags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all',
                    selectedTagIds.includes(tag.id)
                      ? 'ring-2 ring-primary ring-offset-1'
                      : 'opacity-60 hover:opacity-100'
                  )}
                  style={{ backgroundColor: tag.color, color: 'white' }}
                >
                  {tag.name}
                  {selectedTagIds.includes(tag.id) && (
                    <X className="w-3 h-3" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Selected tags summary */}
          {selectedTags.length > 0 && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1.5">已选择:</p>
              <div className="flex flex-wrap gap-1">
                {selectedTags.map(tag => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
