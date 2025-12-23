import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, Download, FileArchive } from 'lucide-react';
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
import JSZip from 'jszip';

interface ImportedTransaction {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  image_url?: string;
  _imageFile?: File; // 临时持有 ZIP 中的图片文件
}

interface ImportDataProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

const TEMPLATE_DATA = [
  { '日期': '2024-01-15', '类型': '支出', '金额': 35.5, '分类': '餐饮', '备注': '午餐', '图片': '' },
  { '日期': '2024-01-15', '类型': '支出', '金额': 200, '分类': '交通', '备注': '打车', '图片': 'images/example.jpg' },
  { '日期': '2024-01-16', '类型': '收入', '金额': 8000, '分类': '工资', '备注': '1月工资', '图片': '' },
];

export function ImportData({ isOpen, onClose, onImportComplete }: ImportDataProps) {
  const [importing, setImporting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState<ImportedTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

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
    
    worksheet['!cols'] = [
      { wch: 12 },
      { wch: 8 },
      { wch: 10 },
      { wch: 10 },
      { wch: 20 },
      { wch: 25 },
    ];
    
    XLSX.writeFile(workbook, '账单导入模板.xlsx');
    toast({ title: '模板下载成功', description: 'Excel模板已下载' });
  };

  const parseDate = (value: any): string => {
    if (!value) return new Date().toISOString().split('T')[0];
    
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
        // Fall through
      }
    }
    
    if (value instanceof Date) {
      if (!isNaN(value.getTime())) {
        return value.toISOString().split('T')[0];
      }
    }
    
    const str = String(value).trim();
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
    
    try {
      const parsed = new Date(str);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
    } catch {
      // Return default
    }
    
    return new Date().toISOString().split('T')[0];
  };

  const mapToTransaction = (
    row: Record<string, any>, 
    headers: string[],
    imageFiles: Map<string, File>
  ): ImportedTransaction | null => {
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
    const imageKey = findKey(['image', 'image_url', '图片', '图片链接', '凭证', 'receipt']);

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
    
    // 处理图片字段
    const imagePath = row[imageKey || '']?.toString().trim() || '';
    let imageFile: File | undefined;
    
    if (imagePath && !imagePath.startsWith('http')) {
      // 尝试从 ZIP 中查找图片
      const normalizedPath = imagePath.replace(/\\/g, '/');
      imageFile = imageFiles.get(normalizedPath) || imageFiles.get(normalizedPath.replace('images/', ''));
    }

    return { 
      type, 
      amount: Math.abs(amount), 
      category, 
      description, 
      date,
      image_url: imagePath.startsWith('http') ? imagePath : undefined,
      _imageFile: imageFile,
    };
  };

  const parseExcel = (buffer: ArrayBuffer, imageFiles: Map<string, File>): ImportedTransaction[] => {
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    const data = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { raw: false, defval: '' });
    
    if (data.length === 0) throw new Error('Excel 文件为空');
    
    const headers = Object.keys(data[0] || {});
    const transactions: ImportedTransaction[] = [];
    
    for (const row of data) {
      const transaction = mapToTransaction(row, headers, imageFiles);
      if (transaction) transactions.push(transaction);
    }
    
    return transactions;
  };

  const parseCSV = (content: string, imageFiles: Map<string, File>): ImportedTransaction[] => {
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

      const transaction = mapToTransaction(row, headers, imageFiles);
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setPreview([]);
    setParsing(true);
    setFileName(file.name);

    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (!['csv', 'xls', 'xlsx', 'zip'].includes(extension || '')) {
      setError('请选择 CSV、Excel 或 ZIP 文件');
      setParsing(false);
      return;
    }

    try {
      let transactions: ImportedTransaction[] = [];
      const imageFiles = new Map<string, File>();
      
      if (extension === 'zip') {
        // 解析 ZIP 文件
        const zip = await JSZip.loadAsync(file);
        
        // 提取图片文件
        const imagePromises: Promise<void>[] = [];
        zip.forEach((relativePath, zipEntry) => {
          if (!zipEntry.dir && relativePath.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            imagePromises.push(
              zipEntry.async('blob').then(blob => {
                const fileName = relativePath.split('/').pop()!;
                const imageFile = new File([blob], fileName, { type: blob.type });
                imageFiles.set(relativePath, imageFile);
                imageFiles.set(fileName, imageFile); // 同时用文件名做 key
              })
            );
          }
        });
        await Promise.all(imagePromises);
        
        // 查找 Excel 或 CSV 文件
        let dataFile: JSZip.JSZipObject | null = null;
        let dataFileType: 'excel' | 'csv' | null = null;
        
        zip.forEach((relativePath, zipEntry) => {
          if (!zipEntry.dir) {
            const ext = relativePath.split('.').pop()?.toLowerCase();
            if (ext === 'xlsx' || ext === 'xls') {
              dataFile = zipEntry;
              dataFileType = 'excel';
            } else if (ext === 'csv' && !dataFile) {
              dataFile = zipEntry;
              dataFileType = 'csv';
            }
          }
        });
        
        if (!dataFile || !dataFileType) {
          throw new Error('ZIP 文件中未找到 Excel 或 CSV 数据文件');
        }
        
        if (dataFileType === 'excel') {
          const buffer = await dataFile.async('arraybuffer');
          transactions = parseExcel(buffer, imageFiles);
        } else {
          const content = await dataFile.async('string');
          transactions = parseCSV(content, imageFiles);
        }
      } else if (extension === 'csv') {
        const content = await file.text();
        transactions = parseCSV(content, imageFiles);
      } else {
        const buffer = await file.arrayBuffer();
        transactions = parseExcel(buffer, imageFiles);
      }
      
      if (transactions.length === 0) {
        throw new Error('未能解析出有效的账单记录');
      }
      
      setPreview(transactions);
    } catch (err) {
      console.error('Parse error:', err);
      setError(err instanceof Error ? err.message : '文件解析失败');
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
    let uploadedCount = 0;
    
    try {
      const transactionsToInsert: any[] = [];
      
      for (const t of preview) {
        let imageUrl = t.image_url || null;
        
        // 如果有本地图片文件，上传到 storage
        if (t._imageFile) {
          const fileName = `${user.id}/${Date.now()}_${t._imageFile.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('receipts')
            .upload(fileName, t._imageFile);
          
          if (!uploadError && uploadData) {
            const { data: urlData } = supabase.storage
              .from('receipts')
              .getPublicUrl(uploadData.path);
            imageUrl = urlData.publicUrl;
            uploadedCount++;
          }
        }
        
        transactionsToInsert.push({
          user_id: user.id,
          type: t.type,
          amount: t.amount,
          category: t.category,
          description: t.description,
          date: t.date,
          image_url: imageUrl,
        });
      }

      const { error: insertError } = await supabase
        .from('transactions')
        .insert(transactionsToInsert);

      if (insertError) throw insertError;

      toast({ 
        title: '导入成功',
        description: `已导入 ${preview.length} 条记录${uploadedCount > 0 ? `，上传 ${uploadedCount} 张图片` : ''}`
      });
      
      setPreview([]);
      onClose();
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
    setPreview([]);
    setError(null);
    onClose();
  };

  const imagesCount = preview.filter(t => t._imageFile).length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              导入账单数据
            </DialogTitle>
            <DialogDescription>
              支持 CSV、Excel 或 ZIP (含图片) 格式
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
                accept=".csv,.xls,.xlsx,.zip"
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
                    支持 CSV、Excel、ZIP (含图片)
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
                    CSV 格式
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadExcelTemplate}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Excel 格式
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Format Guide */}
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <p className="font-medium mb-1">ZIP 导入说明：</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>ZIP 包含 Excel/CSV 文件 + images/ 图片文件夹</li>
                <li>Excel 中"图片"列填相对路径如 images/xxx.jpg</li>
                <li>导入时自动上传图片并关联账单</li>
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
                  已解析 {preview.length} 条记录
                  {imagesCount > 0 && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <FileArchive className="w-3 h-3" />
                      {imagesCount} 张图片
                    </span>
                  )}
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
                        {t._imageFile && <FileArchive className="w-3 h-3 text-muted-foreground" />}
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
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={importing}
            >
              取消
            </Button>
            <Button
              onClick={handleImport}
              className="flex-1"
              disabled={preview.length === 0 || importing}
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  导入中...
                </>
              ) : (
                `确认导入 (${preview.length}条)`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
  );
}
