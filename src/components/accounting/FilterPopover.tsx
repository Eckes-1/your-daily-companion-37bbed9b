import { useState } from 'react';
import { Filter, Calendar, Tag as TagIcon, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useTags, Tag } from '@/hooks/useTags';
import { Badge } from '@/components/ui/badge';

export interface DateRange {
  from: Date;
  to: Date;
}

interface FilterPopoverProps {
  dateRange: DateRange | null;
  onDateRangeChange: (range: DateRange | null) => void;
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
}

export function FilterPopover({
  dateRange,
  onDateRangeChange,
  selectedTagIds,
  onTagsChange,
}: FilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { tags } = useTags();

  const presets = [
    { label: '本月', range: { from: startOfMonth(new Date()), to: new Date() } },
    { label: '上月', range: { from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) } },
    { label: '近3月', range: { from: startOfMonth(subMonths(new Date(), 2)), to: new Date() } },
  ];

  const handlePreset = (range: DateRange) => {
    onDateRangeChange(range);
  };

  const clearAll = () => {
    onDateRangeChange(null);
    onTagsChange([]);
    setIsOpen(false);
  };

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTagIds, tagId]);
    }
  };

  const activeFiltersCount = (dateRange ? 1 : 0) + (selectedTagIds.length > 0 ? 1 : 0);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={activeFiltersCount > 0 ? 'default' : 'outline'}
          size="sm"
          className="gap-1.5 h-8"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>筛选</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] bg-primary-foreground/20">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-4">
          {/* 日期筛选 */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">日期范围</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  variant={dateRange?.from.getTime() === preset.range.from.getTime() ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePreset(preset.range)}
                  className="h-7 text-xs px-2"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            {dateRange && (
              <div className="flex items-center justify-between text-xs bg-muted rounded-md px-2 py-1.5">
                <span className="text-muted-foreground">
                  {format(dateRange.from, 'M/d', { locale: zhCN })} - {format(dateRange.to, 'M/d', { locale: zhCN })}
                </span>
                <button onClick={() => onDateRangeChange(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            
            {/* 自定义日期 */}
            <div className="flex gap-2 mt-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1 h-7 text-[10px] justify-start">
                    {dateRange?.from ? format(dateRange.from, 'MM/dd') : '开始'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateRange?.from}
                    onSelect={(date) => {
                      if (date) {
                        onDateRangeChange({ from: date, to: dateRange?.to || new Date() });
                      }
                    }}
                    className="p-2 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground self-center text-xs">-</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1 h-7 text-[10px] justify-start">
                    {dateRange?.to ? format(dateRange.to, 'MM/dd') : '结束'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateRange?.to}
                    onSelect={(date) => {
                      if (date) {
                        onDateRangeChange({ from: dateRange?.from || startOfMonth(new Date()), to: date });
                      }
                    }}
                    className="p-2 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* 标签筛选 */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <TagIcon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">标签</span>
              {selectedTagIds.length > 0 && (
                <span className="text-[10px] text-muted-foreground">({selectedTagIds.length})</span>
              )}
            </div>
            {tags.length === 0 ? (
              <p className="text-xs text-muted-foreground">暂无标签</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all',
                      selectedTagIds.includes(tag.id)
                        ? 'ring-2 ring-primary ring-offset-1'
                        : 'opacity-60 hover:opacity-100'
                    )}
                    style={{ backgroundColor: tag.color, color: 'white' }}
                  >
                    {tag.name}
                    {selectedTagIds.includes(tag.id) && <X className="w-2.5 h-2.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 清除按钮 */}
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="w-full h-7 text-xs text-muted-foreground">
              <X className="w-3 h-3 mr-1" />
              清除所有筛选
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
