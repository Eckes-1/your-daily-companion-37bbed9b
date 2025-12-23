import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, FileArchive, Loader2, FolderTree, Calendar } from 'lucide-react';
import { Transaction } from '@/hooks/useTransactions';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import JSZip from 'jszip';

interface ExportDataProps {
  transactions: Transaction[];
  dateRange?: { from: Date; to: Date };
}

export function ExportData({ transactions, dateRange }: ExportDataProps) {
  const [exporting, setExporting] = useState(false);

  const formatTransactionForExport = (t: Transaction, imageFileName?: string) => ({
    日期: format(new Date(t.date), 'yyyy-MM-dd'),
    类型: t.type === 'income' ? '收入' : '支出',
    分类: t.category,
    金额: t.amount,
    描述: t.description || '',
    图片: imageFileName || '',
  });

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateWorksheet = (data: ReturnType<typeof formatTransactionForExport>[]) => {
    const headers = Object.keys(data[0] || {});
    
    let xmlContent = '    <Table>\n';
    xmlContent += '      <Row>\n';
    headers.forEach(h => {
      xmlContent += `        <Cell><Data ss:Type="String">${h}</Data></Cell>\n`;
    });
    xmlContent += '      </Row>\n';
    
    data.forEach(row => {
      xmlContent += '      <Row>\n';
      headers.forEach(h => {
        const value = row[h as keyof typeof row];
        const type = typeof value === 'number' ? 'Number' : 'String';
        xmlContent += `        <Cell><Data ss:Type="${type}">${value}</Data></Cell>\n`;
      });
      xmlContent += '      </Row>\n';
    });
    
    xmlContent += '    </Table>\n';
    return xmlContent;
  };

  const exportToCSV = () => {
    if (transactions.length === 0) {
      toast.error('没有数据可导出');
      return;
    }

    const data = transactions.map(t => formatTransactionForExport(t));
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(h => {
          const value = row[h as keyof typeof row];
          const strValue = String(value);
          if (strValue.includes(',') || strValue.includes('"')) {
            return `"${strValue.replace(/"/g, '""')}"`;
          }
          return strValue;
        }).join(',')
      ),
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, `记账数据_${format(new Date(), 'yyyyMMdd')}.csv`);
    toast.success('CSV导出成功');
  };

  const exportToExcel = () => {
    if (transactions.length === 0) {
      toast.error('没有数据可导出');
      return;
    }

    const data = transactions.map(t => formatTransactionForExport(t));
    
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlContent += '<?mso-application progid="Excel.Sheet"?>\n';
    xmlContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
    xmlContent += '  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
    xmlContent += '  <Worksheet ss:Name="记账数据">\n';
    xmlContent += generateWorksheet(data);
    xmlContent += '  </Worksheet>\n';
    xmlContent += '</Workbook>';

    const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' });
    downloadFile(blob, `记账数据_${format(new Date(), 'yyyyMMdd')}.xls`);
    toast.success('Excel导出成功');
  };

  // 按分类分组导出多工作表
  const exportByCategoryExcel = () => {
    if (transactions.length === 0) {
      toast.error('没有数据可导出');
      return;
    }

    // 按分类分组
    const grouped: Record<string, Transaction[]> = {};
    transactions.forEach(t => {
      if (!grouped[t.category]) grouped[t.category] = [];
      grouped[t.category].push(t);
    });

    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlContent += '<?mso-application progid="Excel.Sheet"?>\n';
    xmlContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
    xmlContent += '  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';

    // 添加汇总表
    const summary = Object.entries(grouped).map(([category, items]) => ({
      分类: category,
      收入: items.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      支出: items.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      笔数: items.length,
    }));
    
    xmlContent += '  <Worksheet ss:Name="汇总">\n';
    xmlContent += '    <Table>\n';
    xmlContent += '      <Row>\n';
    xmlContent += '        <Cell><Data ss:Type="String">分类</Data></Cell>\n';
    xmlContent += '        <Cell><Data ss:Type="String">收入</Data></Cell>\n';
    xmlContent += '        <Cell><Data ss:Type="String">支出</Data></Cell>\n';
    xmlContent += '        <Cell><Data ss:Type="String">笔数</Data></Cell>\n';
    xmlContent += '      </Row>\n';
    summary.forEach(row => {
      xmlContent += '      <Row>\n';
      xmlContent += `        <Cell><Data ss:Type="String">${row.分类}</Data></Cell>\n`;
      xmlContent += `        <Cell><Data ss:Type="Number">${row.收入}</Data></Cell>\n`;
      xmlContent += `        <Cell><Data ss:Type="Number">${row.支出}</Data></Cell>\n`;
      xmlContent += `        <Cell><Data ss:Type="Number">${row.笔数}</Data></Cell>\n`;
      xmlContent += '      </Row>\n';
    });
    xmlContent += '    </Table>\n';
    xmlContent += '  </Worksheet>\n';

    // 每个分类一个工作表
    Object.entries(grouped).forEach(([category, items]) => {
      const data = items.map(t => formatTransactionForExport(t));
      // 工作表名称限制31字符，移除特殊字符
      const sheetName = category.replace(/[\\\/\?\*\[\]:]/g, '').slice(0, 31) || '未分类';
      xmlContent += `  <Worksheet ss:Name="${sheetName}">\n`;
      xmlContent += generateWorksheet(data);
      xmlContent += '  </Worksheet>\n';
    });

    xmlContent += '</Workbook>';

    const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' });
    downloadFile(blob, `记账数据_按分类_${format(new Date(), 'yyyyMMdd')}.xls`);
    toast.success(`导出成功 (${Object.keys(grouped).length} 个分类)`);
  };

  // 按月份分组导出多工作表
  const exportByMonthExcel = () => {
    if (transactions.length === 0) {
      toast.error('没有数据可导出');
      return;
    }

    // 按月份分组
    const grouped: Record<string, Transaction[]> = {};
    transactions.forEach(t => {
      const month = format(new Date(t.date), 'yyyy-MM');
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push(t);
    });

    // 按月份排序
    const sortedMonths = Object.keys(grouped).sort().reverse();

    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlContent += '<?mso-application progid="Excel.Sheet"?>\n';
    xmlContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
    xmlContent += '  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';

    // 添加汇总表
    const summary = sortedMonths.map(month => ({
      月份: month,
      收入: grouped[month].filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      支出: grouped[month].filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      结余: grouped[month].filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0) - 
            grouped[month].filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      笔数: grouped[month].length,
    }));
    
    xmlContent += '  <Worksheet ss:Name="汇总">\n';
    xmlContent += '    <Table>\n';
    xmlContent += '      <Row>\n';
    xmlContent += '        <Cell><Data ss:Type="String">月份</Data></Cell>\n';
    xmlContent += '        <Cell><Data ss:Type="String">收入</Data></Cell>\n';
    xmlContent += '        <Cell><Data ss:Type="String">支出</Data></Cell>\n';
    xmlContent += '        <Cell><Data ss:Type="String">结余</Data></Cell>\n';
    xmlContent += '        <Cell><Data ss:Type="String">笔数</Data></Cell>\n';
    xmlContent += '      </Row>\n';
    summary.forEach(row => {
      xmlContent += '      <Row>\n';
      xmlContent += `        <Cell><Data ss:Type="String">${row.月份}</Data></Cell>\n`;
      xmlContent += `        <Cell><Data ss:Type="Number">${row.收入}</Data></Cell>\n`;
      xmlContent += `        <Cell><Data ss:Type="Number">${row.支出}</Data></Cell>\n`;
      xmlContent += `        <Cell><Data ss:Type="Number">${row.结余}</Data></Cell>\n`;
      xmlContent += `        <Cell><Data ss:Type="Number">${row.笔数}</Data></Cell>\n`;
      xmlContent += '      </Row>\n';
    });
    xmlContent += '    </Table>\n';
    xmlContent += '  </Worksheet>\n';

    // 每个月份一个工作表
    sortedMonths.forEach(month => {
      const data = grouped[month].map(t => formatTransactionForExport(t));
      xmlContent += `  <Worksheet ss:Name="${month}">\n`;
      xmlContent += generateWorksheet(data);
      xmlContent += '  </Worksheet>\n';
    });

    xmlContent += '</Workbook>';

    const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' });
    downloadFile(blob, `记账数据_按月份_${format(new Date(), 'yyyyMMdd')}.xls`);
    toast.success(`导出成功 (${sortedMonths.length} 个月份)`);
  };

  // ZIP 导出：Excel + images/ 文件夹
  const exportToZip = async () => {
    if (transactions.length === 0) {
      toast.error('没有数据可导出');
      return;
    }

    setExporting(true);
    const zip = new JSZip();
    const imagesFolder = zip.folder('images');
    
    const imageMap: Record<string, string> = {};
    const transactionsWithImages = transactions.filter(t => t.image_url);
    
    for (let i = 0; i < transactionsWithImages.length; i++) {
      const t = transactionsWithImages[i];
      try {
        const response = await fetch(t.image_url!);
        if (response.ok) {
          const blob = await response.blob();
          const ext = t.image_url!.split('.').pop()?.split('?')[0] || 'jpg';
          const fileName = `${t.id}.${ext}`;
          imagesFolder?.file(fileName, blob);
          imageMap[t.id] = `images/${fileName}`;
        }
      } catch (error) {
        console.error('Failed to download image:', t.image_url, error);
      }
    }

    const data = transactions.map(t => formatTransactionForExport(t, imageMap[t.id]));
    
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlContent += '<?mso-application progid="Excel.Sheet"?>\n';
    xmlContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
    xmlContent += '  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
    xmlContent += '  <Worksheet ss:Name="记账数据">\n';
    xmlContent += generateWorksheet(data);
    xmlContent += '  </Worksheet>\n';
    xmlContent += '</Workbook>';

    zip.file('账单数据.xls', xmlContent);

    try {
      const content = await zip.generateAsync({ type: 'blob' });
      downloadFile(content, `记账数据_${format(new Date(), 'yyyyMMdd')}.zip`);
      toast.success(`ZIP导出成功 (含 ${Object.keys(imageMap).length} 张图片)`);
    } catch (error) {
      console.error('ZIP generation failed:', error);
      toast.error('导出失败');
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={exporting}>
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          导出
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={exportToCSV} className="gap-2">
          <FileText className="w-4 h-4" />
          导出为 CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel} className="gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          导出为 Excel
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportByCategoryExcel} className="gap-2">
          <FolderTree className="w-4 h-4" />
          按分类导出 (多表)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportByMonthExcel} className="gap-2">
          <Calendar className="w-4 h-4" />
          按月份导出 (多表)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportToZip} className="gap-2" disabled={exporting}>
          <FileArchive className="w-4 h-4" />
          导出为 ZIP (含图片)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
