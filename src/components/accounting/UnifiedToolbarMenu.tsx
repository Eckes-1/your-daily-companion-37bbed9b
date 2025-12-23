import { Tag, Bell, PieChart, Database, Upload, Download, CheckSquare, FileText, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { Transaction } from '@/hooks/useTransactions';

interface UnifiedToolbarMenuProps {
  onOpenCategoryManager: () => void;
  onOpenReminderSettings: () => void;
  onOpenStatistics: () => void;
  onOpenBackupManager: () => void;
  onToggleSelectMode: () => void;
  selectionMode: boolean;
  // Import
  onImport: () => void;
  // Export functions
  onExportCSV: () => void;
  onExportExcel: () => void;
  onExportByCategory: () => void;
  onExportByMonth: () => void;
  onExportZip: () => void;
  onExportPDF: () => void;
  exporting?: boolean;
}

export function UnifiedToolbarMenu({
  onOpenCategoryManager,
  onOpenReminderSettings,
  onOpenStatistics,
  onOpenBackupManager,
  onToggleSelectMode,
  selectionMode,
  onImport,
  onExportCSV,
  onExportExcel,
  onExportByCategory,
  onExportByMonth,
  onExportZip,
  onExportPDF,
  exporting,
}: UnifiedToolbarMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 h-8">
          <MoreHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">更多</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 bg-popover">
        {/* 批量操作 */}
        <DropdownMenuItem onClick={onToggleSelectMode} className="gap-2">
          <CheckSquare className="w-4 h-4" />
          {selectionMode ? '退出批量' : '批量操作'}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* 导入 */}
        <DropdownMenuItem onClick={onImport} className="gap-2">
          <Upload className="w-4 h-4" />
          导入数据
        </DropdownMenuItem>

        {/* 导出子菜单 */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2">
            <Download className="w-4 h-4" />
            导出数据
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="bg-popover">
            <DropdownMenuItem onClick={onExportCSV} disabled={exporting}>
              导出 CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportExcel} disabled={exporting}>
              导出 Excel
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onExportByCategory} disabled={exporting}>
              按分类导出
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportByMonth} disabled={exporting}>
              按月份导出
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onExportZip} disabled={exporting}>
              导出 ZIP (含图片)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportPDF} disabled={exporting} className="gap-2">
              <FileText className="w-4 h-4" />
              导出 PDF 报表
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* 管理功能 */}
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
