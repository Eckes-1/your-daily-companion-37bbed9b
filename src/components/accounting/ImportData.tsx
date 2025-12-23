import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import * as XLSX from 'xlsx';

interface ImportedTransaction {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface ImportDataProps {
  onImportComplete: () => void;
}

// Template data
const TEMPLATE_DATA = [
  { '日期': '2024-01-15', '类型': '支出', '金额': 35.5, '分类': '餐饮', '备注': '午餐' },
  { '日期': '2024-01-15', '类型': '支出', '金额': 200, '分类': '交通', '备注': '打车' },
  { '日期': '2024-01-16', '类型': '收入', '金额': 8000, '分类': '工资', '备注': '1月工资' },
  { '日期': '2024-01-17', '类型': '支出', '金额': 66.8, '分类': '购物', '备注': '日用品' },
];

export function ImportData({ onImportComplete }: ImportDataProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState<ImportedTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Download template functions
  const downloadCSVTemplate = () => {
    const headers = ['日期', '类型', '金额', '分类', '备注'];
    const rows = TEMPLATE_DATA.map(row => 
      [row['日期'], row['类型'], row['金额'], row['分类'], row['备注']].join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '账单导入模板.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    
    toast({ title: '模板下载成功', description: 'CSV模板已下载' });
  };

  const downloadExcelTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet(TEMPLATE_DATA);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '账单数据');
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 12 }, // 日期
      { wch: 8 },  // 类型
      { wch: 10 }, // 金额
      { wch: 10 }, // 分类
      { wch: 20 }, // 备注
    ];
    
    XLSX.writeFile(workbook, '账单导入模板.xlsx');
    
    toast({ title: '模板下载成功', description: 'Excel模板已下载' });
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const parseDate = (value: any): string => {
    if (!value) return new Date().toISOString().split('T')[0];
    
    // Handle Excel serial date number
    if (typeof value === 'number') {
      try {
        const excelDate = XLSX.SSF.parse_date_code(value);
        if (excelDate) {
          const date = new Date(excelDate.y, excelDate.m - 1, excelDate.d);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        }
      } catch {
        // Fall through to string parsing
      }
    }
    
    // Handle Date object
    if (value instanceof Date) {
      if (!isNaN(value.getTime())) {
        return value.toISOString().split('T')[0];
      }
    }
    
    const str = String(value).trim();
    
    // Try different date formats
    const formats = [
      { regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, order: ['y', 'm', 'd'] },
      { regex: /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/, order: ['y', 'm', 'd'] },
      { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, order: ['m', 'd', 'y'] },
      { regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/, order: ['d', 'm', 'y'] },
    ];
    
    for (const { regex, order } of formats) {
      const match = str.match(regex);
      if (match) {
        const parts: Record<string, number> = {};
        order.forEach((key, idx) => {
          parts[key] = parseInt(match[idx + 1]);
        });
        const date = new Date(parts.y, parts.m - 1, parts.d);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
    }
    
    // Try native Date parsing
    try {
      const parsed = new Date(str);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
    } catch {
      // Return default date
    }
    
    return new Date().toISOString().split('T')[0];
  };

  const mapToTransaction = (row: Record<string, any>, headers: string[]): ImportedTransaction | null => {
    const findKey = (possibleNames: string[]) => {
      return headers.find(h => 
        possibleNames.some(name => h.toLowerCase().includes(name.toLowerCase()))
      );
    };

    const typeKey = findKey(['type', '类型', '收支']);
    const amountKey = findKey(['amount', '金额', '数额', '价格']);
    const categoryKey = findKey(['category', '分类', '类别']);
    const descKey = findKey(['description', '描述', '备注', '说明', 'memo', 'note']);
    const dateKey = findKey(['date', '日期', '时间', 'time']);

    if (!amountKey) return null;

    const typeValue = row[typeKey || '']?.toString().toLowerCase() || '';
    const type: 'income' | 'expense' = 
      ['income', '收入', '入账', 'in', '+'].includes(typeValue) ? 'income' : 'expense';

    const amountStr = row[amountKey]?.toString().replace(/[¥￥$,，]/g, '') || '0';
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return null;

    const category = row[categoryKey || '']?.toString() || '其他';
    const description = row[descKey || '']?.toString() || '';
    const date = parseDate(row[dateKey || '']);

    return { type, amount: Math.abs(amount), category, description, date };
  };

  const parseCSV = (content: string): ImportedTransaction[] => {
    const lines = content.trim().split(/\r?\n/);
    if (lines.length < 2) throw new Error('文件内容为空或格式不正确');
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const transactions: ImportedTransaction[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length < 2) continue;

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim().replace(/"/g, '') || '';
      });

      const transaction = mapToTransaction(row, headers);
      if (transaction) transactions.push(transaction);
    }

    return transactions;
  };

  const parseExcel = (buffer: ArrayBuffer): ImportedTransaction[] => {
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Get data as JSON with headers
    const data = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { raw: false, defval: '' });
    
    if (data.length === 0) throw new Error('Excel 文件为空');
    
    const headers = Object.keys(data[0] || {});
    const transactions: ImportedTransaction[] = [];
    
    for (const row of data) {
      const transaction = mapToTransaction(row, headers);
      if (transaction) transactions.push(transaction);
    }
    
    return transactions;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setPreview([]);
    setParsing(true);
    setFileName(file.name);

    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (!['csv', 'xls', 'xlsx'].includes(extension || '')) {
      setError('请选择 CSV 或 Excel (.xls, .xlsx) 文件');
      setParsing(false);
      return;
    }

    try {
      let transactions: ImportedTransaction[] = [];
      
      if (extension === 'csv') {
        const content = await file.text();
        transactions = parseCSV(content);
      } else {
        // Parse Excel files (.xls, .xlsx)
        const buffer = await file.arrayBuffer();
        transactions = parseExcel(buffer);
      }
      
      if (transactions.length === 0) {
        throw new Error('未能解析出有效的账单记录，请检查文件格式是否正确');
      }
      
      setPreview(transactions);
    } catch (err) {
      console.error('Parse error:', err);
      setError(err instanceof Error ? err.message : '文件解析失败，请确保文件格式正确');
    } finally {
      setParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImport = async () => {
    if (!user || preview.length === 0) return;

    setImporting(true);
    try {
      const transactionsToInsert = preview.map(t => ({
        user_id: user.id,
        type: t.type,
        amount: t.amount,
        category: t.category,
        description: t.description,
        date: t.date,
      }));

      const { error: insertError } = await supabase
        .from('transactions')
        .insert(transactionsToInsert);

      if (insertError) throw insertError;

      toast({ 
        title: '导入成功',
        description: `已导入 ${preview.length} 条账单记录`
      });
      
      setIsOpen(false);
      setPreview([]);
      onImportComplete();
    } catch (err) {
      console.error('Import error:', err);
      toast({
        title: '导入失败',
        description: '请检查数据格式后重试',
        variant: 'destructive'
      });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setPreview([]);
    setError(null);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-1"
      >
        <Upload className="w-4 h-4" />
        <span className="hidden sm:inline">导入</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              导入账单数据
            </DialogTitle>
            <DialogDescription>
              支持导入 CSV 和 Excel (.xls, .xlsx) 格式的历史账单数据
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* File Upload Area */}
            <div 
              className={`border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer ${parsing ? 'opacity-50 pointer-events-none' : ''}`}
              onClick={() => !parsing && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileSelect}
                className="hidden"
              />
              {parsing ? (
                <>
                  <Loader2 className="w-10 h-10 mx-auto text-primary mb-3 animate-spin" />
                  <p className="text-sm text-foreground font-medium">正在解析文件...</p>
                  <p className="text-xs text-muted-foreground mt-1">{fileName}</p>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-foreground font-medium">点击选择文件</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    支持 CSV、XLS、XLSX 格式
                  </p>
                </>
              )}
            </div>

            {/* Download Template */}
            <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
              <div className="text-sm">
                <p className="font-medium text-foreground">下载导入模板</p>
                <p className="text-xs text-muted-foreground">使用模板确保格式正确</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Download className="w-4 h-4" />
                    下载模板
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={downloadCSVTemplate}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    CSV 格式 (.csv)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadExcelTemplate}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Excel 格式 (.xlsx)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Format Guide */}
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <p className="font-medium mb-1">文件格式要求：</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>日期：2024-01-15 格式</li>
                <li>类型：收入 或 支出</li>
                <li>金额：数字金额</li>
                <li>分类：分类名称</li>
                <li>备注：可选</li>
              </ul>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Preview */}
            {preview.length > 0 && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center gap-2 text-accent text-sm mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  已解析 {preview.length} 条记录，预览前 5 条：
                </div>
                <div className="flex-1 overflow-auto space-y-2">
                  {preview.slice(0, 5).map((t, i) => (
                    <div 
                      key={i}
                      className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          t.type === 'income' 
                            ? 'bg-accent/20 text-accent' 
                            : 'bg-destructive/20 text-destructive'
                        }`}>
                          {t.type === 'income' ? '收入' : '支出'}
                        </span>
                        <span className="text-foreground">{t.category}</span>
                        <span className="text-muted-foreground truncate max-w-[100px]">
                          {t.description || '-'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">{t.date}</span>
                        <span className={`font-medium ${
                          t.type === 'income' ? 'text-accent' : 'text-destructive'
                        }`}>
                          {t.type === 'income' ? '+' : '-'}¥{t.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {preview.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center py-1">
                      ... 还有 {preview.length - 5} 条记录
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              取消
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={preview.length === 0 || importing}
              className="flex-1"
            >
              {importing ? '导入中...' : `确认导入 (${preview.length} 条)`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
