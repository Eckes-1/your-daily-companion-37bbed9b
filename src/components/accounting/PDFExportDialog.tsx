import { useState, useMemo } from 'react';
import { FileText, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Transaction } from '@/hooks/useTransactions';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { toast } from 'sonner';

interface PDFExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
}

type RangeType = 'all' | 'thisMonth' | 'lastMonth' | 'custom';

let cachedChineseFontBase64: string | null = null;

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
};

const loadChinesePdfFontBase64 = async () => {
  if (cachedChineseFontBase64) return cachedChineseFontBase64;
  const url = `${import.meta.env.BASE_URL}fonts/NotoSansSC-Regular.ttf`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('中文字体加载失败');
  const buf = await res.arrayBuffer();
  cachedChineseFontBase64 = arrayBufferToBase64(buf);
  return cachedChineseFontBase64;
};

export function PDFExportDialog({ isOpen, onClose, transactions }: PDFExportDialogProps) {
  const [rangeType, setRangeType] = useState<RangeType>('all');
  const [customFrom, setCustomFrom] = useState<Date | undefined>(undefined);
  const [customTo, setCustomTo] = useState<Date | undefined>(undefined);
  const [exporting, setExporting] = useState(false);

  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const filteredTransactions = useMemo(() => {
    if (rangeType === 'all') return transactions;
    let from: Date, to: Date;
    if (rangeType === 'thisMonth') {
      from = thisMonthStart;
      to = thisMonthEnd;
    } else if (rangeType === 'lastMonth') {
      from = lastMonthStart;
      to = lastMonthEnd;
    } else {
      if (!customFrom || !customTo) return transactions;
      from = startOfDay(customFrom);
      to = endOfDay(customTo);
    }
    return transactions.filter(t => {
      const d = new Date(t.date);
      return isWithinInterval(d, { start: from, end: to });
    });
  }, [transactions, rangeType, customFrom, customTo, thisMonthStart, thisMonthEnd, lastMonthStart, lastMonthEnd]);

  const rangeLabel = useMemo(() => {
    if (rangeType === 'all') return '全部数据';
    if (rangeType === 'thisMonth') return `本月 (${format(thisMonthStart, 'yyyy-MM-dd')} ~ ${format(thisMonthEnd, 'yyyy-MM-dd')})`;
    if (rangeType === 'lastMonth') return `上月 (${format(lastMonthStart, 'yyyy-MM-dd')} ~ ${format(lastMonthEnd, 'yyyy-MM-dd')})`;
    if (customFrom && customTo) return `${format(customFrom, 'yyyy-MM-dd')} ~ ${format(customTo, 'yyyy-MM-dd')}`;
    return '请选择日期';
  }, [rangeType, customFrom, customTo, thisMonthStart, thisMonthEnd, lastMonthStart, lastMonthEnd]);

  const handleExport = async () => {
    if (filteredTransactions.length === 0) {
      toast.error('所选范围内没有数据');
      return;
    }
    setExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      const fontBase64 = await loadChinesePdfFontBase64();
      const FONT_FILE = 'NotoSansSC-Regular.ttf';
      const FONT_NAME = 'NotoSansSC';
      doc.addFileToVFS(FONT_FILE, fontBase64);
      doc.addFont(FONT_FILE, FONT_NAME, 'normal');
      doc.addFont(FONT_FILE, FONT_NAME, 'bold');
      doc.setFont(FONT_NAME, 'normal');

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // ========== 封面页 ==========
      doc.setFillColor(255, 107, 53);
      doc.rect(0, 0, pageWidth, 60, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.text('记账报表', pageWidth / 2, 35, { align: 'center' });

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text(`生成时间：${format(now, 'yyyy-MM-dd HH:mm')}`, pageWidth / 2, 75, { align: 'center' });
      doc.text(`数据范围：${rangeLabel}`, pageWidth / 2, 88, { align: 'center' });

      // 汇总数据
      const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const balance = totalIncome - totalExpense;

      const summaryY = 110;
      doc.setFontSize(14);
      doc.text('收支概览', pageWidth / 2, summaryY, { align: 'center' });

      doc.setFontSize(11);
      doc.text(`总收入：¥${totalIncome.toFixed(2)}`, 40, summaryY + 15);
      doc.text(`总支出：¥${totalExpense.toFixed(2)}`, 40, summaryY + 28);
      doc.text(`结余：¥${balance.toFixed(2)}`, 40, summaryY + 41);
      doc.text(`交易笔数：${filteredTransactions.length}`, 40, summaryY + 54);

      // ========== 分类饼图数据（文本模拟） ==========
      const categoryData: Record<string, number> = {};
      filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
        categoryData[t.category] = (categoryData[t.category] || 0) + t.amount;
      });
      const sortedCategories = Object.entries(categoryData).sort((a, b) => b[1] - a[1]);

      if (sortedCategories.length > 0) {
        doc.setFontSize(14);
        doc.text('支出分类占比', pageWidth / 2, summaryY + 75, { align: 'center' });

        doc.setFontSize(10);
        let catY = summaryY + 90;
        const colors = [[255, 107, 53], [52, 152, 219], [46, 204, 113], [155, 89, 182], [241, 196, 15], [149, 165, 166]];
        sortedCategories.slice(0, 6).forEach(([cat, amount], idx) => {
          const pct = ((amount / totalExpense) * 100).toFixed(1);
          const color = colors[idx % colors.length];
          doc.setFillColor(color[0], color[1], color[2]);
          doc.rect(40, catY - 4, 8, 8, 'F');
          doc.setTextColor(0, 0, 0);
          doc.text(`${cat}：¥${amount.toFixed(2)} (${pct}%)`, 52, catY + 2);
          catY += 14;
        });
      }

      // ========== 趋势图数据（文本模拟） ==========
      const monthlyData: Record<string, { income: number; expense: number }> = {};
      filteredTransactions.forEach(t => {
        const month = format(new Date(t.date), 'yyyy-MM');
        if (!monthlyData[month]) monthlyData[month] = { income: 0, expense: 0 };
        if (t.type === 'income') monthlyData[month].income += t.amount;
        else monthlyData[month].expense += t.amount;
      });
      const sortedMonths = Object.keys(monthlyData).sort();

      if (sortedMonths.length > 1) {
        doc.setFontSize(14);
        doc.text('月度收支趋势', pageWidth / 2, pageHeight - 70, { align: 'center' });

        doc.setFontSize(9);
        let trendY = pageHeight - 55;
        sortedMonths.slice(-6).forEach(month => {
          const d = monthlyData[month];
          doc.text(`${month}  收入：¥${d.income.toFixed(0)}  支出：¥${d.expense.toFixed(0)}`, 40, trendY);
          trendY += 10;
        });
      }

      // ========== 第二页：分类汇总表 ==========
      doc.addPage();
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.text('分类汇总', 14, 20);
      doc.setFontSize(10);
      doc.text(`数据范围：${rangeLabel}`, 14, 28);

      const categoryTableData = sortedCategories.map(([cat, amount]) => [
        cat,
        `¥${amount.toFixed(2)}`,
        `${((amount / totalExpense) * 100).toFixed(1)}%`,
      ]);

      autoTable(doc, {
        startY: 35,
        head: [['分类', '金额', '占比']],
        body: categoryTableData,
        theme: 'striped',
        headStyles: { fillColor: [255, 107, 53], font: FONT_NAME, fontStyle: 'bold' },
        styles: { font: FONT_NAME, fontStyle: 'normal', fontSize: 10 },
      });

      // ========== 第三页：明细表 ==========
      doc.addPage();
      doc.setFontSize(16);
      doc.text('交易明细', 14, 20);
      doc.setFontSize(10);
      doc.text(`数据范围：${rangeLabel}  |  共 ${filteredTransactions.length} 笔`, 14, 28);

      const detailData = filteredTransactions.map(t => [
        format(new Date(t.date), 'yyyy-MM-dd'),
        t.type === 'income' ? '收入' : '支出',
        t.category,
        `¥${t.amount.toFixed(2)}`,
        t.description || '-',
      ]);

      autoTable(doc, {
        startY: 35,
        head: [['日期', '类型', '分类', '金额', '备注']],
        body: detailData,
        theme: 'grid',
        headStyles: { fillColor: [100, 100, 100], font: FONT_NAME, fontStyle: 'bold' },
        styles: { font: FONT_NAME, fontStyle: 'normal', fontSize: 8 },
      });

      doc.save(`记账报表_${format(now, 'yyyyMMdd')}.pdf`);
      toast.success('PDF报表导出成功');
      onClose();
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error(error instanceof Error ? error.message : 'PDF导出失败');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            导出 PDF 报表
          </DialogTitle>
          <DialogDescription>
            选择导出范围，报表将包含封面、图表和明细
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-3">
            <Label>选择数据范围</Label>
            <RadioGroup value={rangeType} onValueChange={(v) => setRangeType(v as RangeType)} className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="font-normal cursor-pointer">全部数据</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="thisMonth" id="thisMonth" />
                <Label htmlFor="thisMonth" className="font-normal cursor-pointer">本月</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="lastMonth" id="lastMonth" />
                <Label htmlFor="lastMonth" className="font-normal cursor-pointer">上月</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="font-normal cursor-pointer">自定义日期</Label>
              </div>
            </RadioGroup>
          </div>

          {rangeType === 'custom' && (
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1 justify-start gap-1">
                    <Calendar className="w-4 h-4" />
                    {customFrom ? format(customFrom, 'yyyy-MM-dd') : '开始日期'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarPicker mode="single" selected={customFrom} onSelect={setCustomFrom} locale={zhCN} />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1 justify-start gap-1">
                    <Calendar className="w-4 h-4" />
                    {customTo ? format(customTo, 'yyyy-MM-dd') : '结束日期'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarPicker mode="single" selected={customTo} onSelect={setCustomTo} locale={zhCN} />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            <p>将导出 <strong>{filteredTransactions.length}</strong> 条记录</p>
            <p className="text-xs mt-1">范围：{rangeLabel}</p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleExport} disabled={exporting || filteredTransactions.length === 0}>
            {exporting ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />导出中...</> : '导出 PDF'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
