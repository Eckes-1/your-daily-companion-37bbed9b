import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Transaction } from '@/hooks/useTransactions';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface ExportDataProps {
  transactions: Transaction[];
  dateRange?: { from: Date; to: Date };
}

export function ExportData({ transactions, dateRange }: ExportDataProps) {
  const formatTransactionForExport = (t: Transaction) => ({
    日期: format(new Date(t.date), 'yyyy-MM-dd'),
    类型: t.type === 'income' ? '收入' : '支出',
    分类: t.category,
    金额: t.amount,
    描述: t.description || '',
    图片链接: t.image_url || '',
  });

  const exportToCSV = () => {
    if (transactions.length === 0) {
      toast.error('没有数据可导出');
      return;
    }

    const data = transactions.map(formatTransactionForExport);
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(h => {
          const value = row[h as keyof typeof row];
          // Escape quotes and wrap in quotes if contains comma
          const strValue = String(value);
          if (strValue.includes(',') || strValue.includes('"')) {
            return `"${strValue.replace(/"/g, '""')}"`;
          }
          return strValue;
        }).join(',')
      ),
    ].join('\n');

    // Add BOM for UTF-8 encoding
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

    const data = transactions.map(formatTransactionForExport);
    const headers = Object.keys(data[0]);
    
    // Create Excel XML format
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlContent += '<?mso-application progid="Excel.Sheet"?>\n';
    xmlContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
    xmlContent += '  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
    xmlContent += '  <Worksheet ss:Name="记账数据">\n';
    xmlContent += '    <Table>\n';
    
    // Headers
    xmlContent += '      <Row>\n';
    headers.forEach(h => {
      xmlContent += `        <Cell><Data ss:Type="String">${h}</Data></Cell>\n`;
    });
    xmlContent += '      </Row>\n';
    
    // Data rows
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
    xmlContent += '  </Worksheet>\n';
    xmlContent += '</Workbook>';

    const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' });
    downloadFile(blob, `记账数据_${format(new Date(), 'yyyyMMdd')}.xls`);
    toast.success('Excel导出成功');
  };

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          导出
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV} className="gap-2">
          <FileText className="w-4 h-4" />
          导出为 CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel} className="gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          导出为 Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
