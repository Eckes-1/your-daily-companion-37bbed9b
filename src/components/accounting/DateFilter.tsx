import { useState } from 'react';
import { Calendar, X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateFilterProps {
  dateRange: DateRange | null;
  onDateRangeChange: (range: DateRange | null) => void;
}

export function DateFilter({ dateRange, onDateRangeChange }: DateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const presets = [
    { 
      label: '本月', 
      range: { from: startOfMonth(new Date()), to: new Date() } 
    },
    { 
      label: '上月', 
      range: { 
        from: startOfMonth(subMonths(new Date(), 1)), 
        to: endOfMonth(subMonths(new Date(), 1)) 
      } 
    },
    { 
      label: '近3个月', 
      range: { from: startOfMonth(subMonths(new Date(), 2)), to: new Date() } 
    },
    { 
      label: '近6个月', 
      range: { from: startOfMonth(subMonths(new Date(), 5)), to: new Date() } 
    },
  ];

  const handlePreset = (range: DateRange) => {
    onDateRangeChange(range);
    setIsOpen(false);
  };

  const handleClear = () => {
    onDateRangeChange(null);
    setIsOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={dateRange ? 'default' : 'outline'}
            size="sm"
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            {dateRange ? (
              <span className="text-xs">
                {format(dateRange.from, 'M/d', { locale: zhCN })} - {format(dateRange.to, 'M/d', { locale: zhCN })}
              </span>
            ) : (
              '筛选'
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="end">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreset(preset.range)}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            
            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground mb-2">自定义日期范围</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <div>
                  <p className="text-xs mb-1">开始日期</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Calendar className="w-4 h-4 mr-2" />
                        {dateRange?.from 
                          ? format(dateRange.from, 'yyyy/MM/dd', { locale: zhCN })
                          : '选择日期'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateRange?.from}
                        onSelect={(date) => {
                          if (date) {
                            onDateRangeChange({
                              from: date,
                              to: dateRange?.to || new Date(),
                            });
                          }
                        }}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <p className="text-xs mb-1">结束日期</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Calendar className="w-4 h-4 mr-2" />
                        {dateRange?.to 
                          ? format(dateRange.to, 'yyyy/MM/dd', { locale: zhCN })
                          : '选择日期'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateRange?.to}
                        onSelect={(date) => {
                          if (date) {
                            onDateRangeChange({
                              from: dateRange?.from || startOfMonth(new Date()),
                              to: date,
                            });
                          }
                        }}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {dateRange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="w-full gap-2 text-muted-foreground"
              >
                <X className="w-4 h-4" />
                清除筛选
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {dateRange && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleClear}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
