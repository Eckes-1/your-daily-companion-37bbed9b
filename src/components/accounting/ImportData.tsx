import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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

export function ImportData({ onImportComplete }: ImportDataProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<ImportedTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const parseCSV = (content: string): ImportedTransaction[] => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) throw new Error('文件内容为空或格式不正确');
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const transactions: ImportedTransaction[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length < 4) continue;

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim().replace(/"/g, '') || '';
      });

      const transaction = mapToTransaction(row, headers);
      if (transaction) transactions.push(transaction);
    }

    return transactions;
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

  const mapToTransaction = (row: Record<string, string>, headers: string[]): ImportedTransaction | null => {
    // Support multiple column name formats
    const typeKey = headers.find(h => ['type', '类型', '收支类型'].includes(h));
    const amountKey = headers.find(h => ['amount', '金额', '数额'].includes(h));
    const categoryKey = headers.find(h => ['category', '分类', '类别'].includes(h));
    const descKey = headers.find(h => ['description', '描述', '备注', '说明'].includes(h));
    const dateKey = headers.find(h => ['date', '日期', '时间'].includes(h));

    if (!amountKey || !typeKey) return null;

    const typeValue = row[typeKey]?.toLowerCase();
    const type: 'income' | 'expense' = 
      ['income', '收入', '入账'].includes(typeValue) ? 'income' : 'expense';

    const amount = parseFloat(row[amountKey]?.replace(/[¥￥,]/g, '') || '0');
    if (isNaN(amount) || amount <= 0) return null;

    const category = row[categoryKey || ''] || '其他';
    const description = row[descKey || ''] || '';
    const dateStr = row[dateKey || ''] || new Date().toISOString().split('T')[0];
    
    // Parse date
    let date: string;
    try {
      const parsed = new Date(dateStr);
      if (isNaN(parsed.getTime())) {
        date = new Date().toISOString().split('T')[0];
      } else {
        date = parsed.toISOString().split('T')[0];
      }
    } catch {
      date = new Date().toISOString().split('T')[0];
    }

    return { type, amount, category, description, date };
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setPreview([]);

    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (!['csv', 'xls', 'xlsx'].includes(extension || '')) {
      setError('请选择 CSV 或 Excel 文件');
      return;
    }

    try {
      if (extension === 'csv') {
        const content = await file.text();
        const transactions = parseCSV(content);
        if (transactions.length === 0) {
          throw new Error('未能解析出有效的账单记录');
        }
        setPreview(transactions);
      } else {
        // For Excel files, we'll parse as CSV-like format
        // In a real implementation, you'd use a library like xlsx
        setError('Excel 文件导入暂时仅支持 CSV 格式，请将 Excel 另存为 CSV 后导入');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '文件解析失败');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
              支持导入 CSV 格式的历史账单数据
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* File Upload Area */}
            <div 
              className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-foreground font-medium">点击选择文件</p>
              <p className="text-xs text-muted-foreground mt-1">
                支持 CSV 格式
              </p>
            </div>

            {/* Format Guide */}
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
              <p className="font-medium mb-1">CSV 文件格式要求：</p>
              <p>第一行为表头，需包含以下列：</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li>类型/type：收入 或 支出</li>
                <li>金额/amount：数字金额</li>
                <li>分类/category：分类名称</li>
                <li>备注/description：备注说明（可选）</li>
                <li>日期/date：日期（可选）</li>
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
