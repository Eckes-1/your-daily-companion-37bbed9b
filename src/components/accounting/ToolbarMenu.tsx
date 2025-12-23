import { Tag, Bell, PieChart, Database, Settings, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ToolbarMenuProps {
  onOpenCategoryManager: () => void;
  onOpenReminderSettings: () => void;
  onOpenStatistics: () => void;
  onOpenBackupManager: () => void;
}

export function ToolbarMenu({
  onOpenCategoryManager,
  onOpenReminderSettings,
  onOpenStatistics,
  onOpenBackupManager,
}: ToolbarMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <MoreHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">更多</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={onOpenCategoryManager} className="gap-2">
          <Tag className="w-4 h-4" />
          分类管理
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onOpenReminderSettings} className="gap-2">
          <Bell className="w-4 h-4" />
          记账提醒
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onOpenStatistics} className="gap-2">
          <PieChart className="w-4 h-4" />
          统计报表
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onOpenBackupManager} className="gap-2">
          <Database className="w-4 h-4" />
          云端备份
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
