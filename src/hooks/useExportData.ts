import { useState } from 'react';
import { Transaction } from '@/hooks/useTransactions';
import { format } from 'date-fns';
import { toast } from 'sonner';
import JSZip from 'jszip';

interface UseExportDataProps {
  transactions: Transaction[];
}

export function useExportData({ transactions }: UseExportDataProps) {
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
    let xmlContent = '    <Table>\n      <Row>\n';
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
      ...data.map(row => headers.map(h => {
        const value = String(row[h as keyof typeof row]);
        if (value.includes(',') || value.includes('"')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(','))
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, `记账数据_${format(new Date(), 'yyyyMMdd')}.csv`);
    toast.success('CSV导出成功');
  };

  const exportToExcel = () => {
    if (transactions.length === 0) {
      toast.error('没有数据可导出');
      return;
    }
    const data = transactions.map(t => formatTransactionForExport(t));
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<?mso-application progid="Excel.Sheet"?>\n';
    xmlContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
    xmlContent += '  <Worksheet ss:Name="记账数据">\n' + generateWorksheet(data) + '  </Worksheet>\n</Workbook>';
    const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' });
    downloadFile(blob, `记账数据_${format(new Date(), 'yyyyMMdd')}.xls`);
    toast.success('Excel导出成功');
  };

  const exportByCategoryExcel = () => {
    if (transactions.length === 0) {
      toast.error('没有数据可导出');
      return;
    }
    const grouped: Record<string, Transaction[]> = {};
    transactions.forEach(t => {
      if (!grouped[t.category]) grouped[t.category] = [];
      grouped[t.category].push(t);
    });

    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<?mso-application progid="Excel.Sheet"?>\n';
    xmlContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';

    // Summary
    const summary = Object.entries(grouped).map(([category, items]) => ({
      分类: category,
      收入: items.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      支出: items.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      笔数: items.length,
    }));
    xmlContent += '  <Worksheet ss:Name="汇总">\n    <Table>\n      <Row>\n';
    ['分类', '收入', '支出', '笔数'].forEach(h => xmlContent += `        <Cell><Data ss:Type="String">${h}</Data></Cell>\n`);
    xmlContent += '      </Row>\n';
    summary.forEach(row => {
      xmlContent += '      <Row>\n';
      xmlContent += `        <Cell><Data ss:Type="String">${row.分类}</Data></Cell>\n`;
      xmlContent += `        <Cell><Data ss:Type="Number">${row.收入}</Data></Cell>\n`;
      xmlContent += `        <Cell><Data ss:Type="Number">${row.支出}</Data></Cell>\n`;
      xmlContent += `        <Cell><Data ss:Type="Number">${row.笔数}</Data></Cell>\n`;
      xmlContent += '      </Row>\n';
    });
    xmlContent += '    </Table>\n  </Worksheet>\n';

    Object.entries(grouped).forEach(([category, items]) => {
      const data = items.map(t => formatTransactionForExport(t));
      const sheetName = category.replace(/[\\\/\?\*\[\]:]/g, '').slice(0, 31) || '未分类';
      xmlContent += `  <Worksheet ss:Name="${sheetName}">\n` + generateWorksheet(data) + '  </Worksheet>\n';
    });
    xmlContent += '</Workbook>';
    const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' });
    downloadFile(blob, `记账数据_按分类_${format(new Date(), 'yyyyMMdd')}.xls`);
    toast.success(`导出成功 (${Object.keys(grouped).length} 个分类)`);
  };

  const exportByMonthExcel = () => {
    if (transactions.length === 0) {
      toast.error('没有数据可导出');
      return;
    }
    const grouped: Record<string, Transaction[]> = {};
    transactions.forEach(t => {
      const month = format(new Date(t.date), 'yyyy-MM');
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push(t);
    });
    const sortedMonths = Object.keys(grouped).sort().reverse();

    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<?mso-application progid="Excel.Sheet"?>\n';
    xmlContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';

    const summary = sortedMonths.map(month => ({
      月份: month,
      收入: grouped[month].filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      支出: grouped[month].filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      笔数: grouped[month].length,
    }));
    xmlContent += '  <Worksheet ss:Name="汇总">\n    <Table>\n      <Row>\n';
    ['月份', '收入', '支出', '笔数'].forEach(h => xmlContent += `        <Cell><Data ss:Type="String">${h}</Data></Cell>\n`);
    xmlContent += '      </Row>\n';
    summary.forEach(row => {
      xmlContent += '      <Row>\n';
      xmlContent += `        <Cell><Data ss:Type="String">${row.月份}</Data></Cell>\n`;
      xmlContent += `        <Cell><Data ss:Type="Number">${row.收入}</Data></Cell>\n`;
      xmlContent += `        <Cell><Data ss:Type="Number">${row.支出}</Data></Cell>\n`;
      xmlContent += `        <Cell><Data ss:Type="Number">${row.笔数}</Data></Cell>\n`;
      xmlContent += '      </Row>\n';
    });
    xmlContent += '    </Table>\n  </Worksheet>\n';

    sortedMonths.forEach(month => {
      const data = grouped[month].map(t => formatTransactionForExport(t));
      xmlContent += `  <Worksheet ss:Name="${month}">\n` + generateWorksheet(data) + '  </Worksheet>\n';
    });
    xmlContent += '</Workbook>';
    const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' });
    downloadFile(blob, `记账数据_按月份_${format(new Date(), 'yyyyMMdd')}.xls`);
    toast.success(`导出成功 (${sortedMonths.length} 个月份)`);
  };

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

    for (const t of transactionsWithImages) {
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
        console.error('Failed to download image:', error);
      }
    }

    const data = transactions.map(t => formatTransactionForExport(t, imageMap[t.id]));
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<?mso-application progid="Excel.Sheet"?>\n';
    xmlContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
    xmlContent += '  <Worksheet ss:Name="记账数据">\n' + generateWorksheet(data) + '  </Worksheet>\n</Workbook>';
    zip.file('账单数据.xls', xmlContent);

    try {
      const content = await zip.generateAsync({ type: 'blob' });
      downloadFile(content, `记账数据_${format(new Date(), 'yyyyMMdd')}.zip`);
      toast.success(`ZIP导出成功 (含 ${Object.keys(imageMap).length} 张图片)`);
    } catch (error) {
      toast.error('导出失败');
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = async () => {
    if (transactions.length === 0) {
      toast.error('没有数据可导出');
      return;
    }
    setExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();

      // 尝试加载中文字体
      let fontLoaded = false;
      try {
        const fontUrl = 'https://cdn.jsdelivr.net/npm/source-han-sans-sc@1.0.0/SourceHanSansSC-Regular.otf';
        const fontResponse = await fetch(fontUrl);
        if (fontResponse.ok) {
          const fontBuffer = await fontResponse.arrayBuffer();
          const fontBase64 = btoa(
            new Uint8Array(fontBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          doc.addFileToVFS('SourceHanSansSC.otf', fontBase64);
          doc.addFont('SourceHanSansSC.otf', 'SourceHanSansSC', 'normal');
          doc.setFont('SourceHanSansSC');
          fontLoaded = true;
        }
      } catch (fontError) {
        console.warn('Font loading failed, using fallback', fontError);
      }

      // 计算汇总
      const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const balance = totalIncome - totalExpense;

      // 使用英文或中文文本（取决于字体加载状态）
      const labels = fontLoaded ? {
        title: '记账报表',
        generated: '生成时间',
        summary: '收支汇总',
        income: '总收入',
        expense: '总支出',
        balance: '结余',
        count: '交易笔数',
        categoryHeaders: ['分类', '收入', '支出', '笔数'],
        detailHeaders: ['日期', '类型', '分类', '金额', '备注'],
        incomeType: '收入',
        expenseType: '支出',
      } : {
        title: 'Transaction Report',
        generated: 'Generated',
        summary: 'Summary',
        income: 'Income',
        expense: 'Expense',
        balance: 'Balance',
        count: 'Transactions',
        categoryHeaders: ['Category', 'Income', 'Expense', 'Count'],
        detailHeaders: ['Date', 'Type', 'Category', 'Amount', 'Note'],
        incomeType: 'Income',
        expenseType: 'Expense',
      };

      // 标题
      doc.setFontSize(18);
      doc.text(labels.title, 14, 20);
      doc.setFontSize(10);
      doc.text(`${labels.generated}: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 14, 28);

      // 汇总
      doc.setFontSize(12);
      doc.text(labels.summary, 14, 40);
      doc.setFontSize(10);
      doc.text(`${labels.income}: ${totalIncome.toFixed(2)}`, 14, 48);
      doc.text(`${labels.expense}: ${totalExpense.toFixed(2)}`, 14, 54);
      doc.text(`${labels.balance}: ${balance.toFixed(2)}`, 14, 60);
      doc.text(`${labels.count}: ${transactions.length}`, 14, 66);

      // 分类汇总
      const categoryData: Record<string, { income: number; expense: number; count: number }> = {};
      transactions.forEach(t => {
        if (!categoryData[t.category]) {
          categoryData[t.category] = { income: 0, expense: 0, count: 0 };
        }
        if (t.type === 'income') {
          categoryData[t.category].income += t.amount;
        } else {
          categoryData[t.category].expense += t.amount;
        }
        categoryData[t.category].count++;
      });

      const categoryTableData = Object.entries(categoryData).map(([cat, data]) => [
        fontLoaded ? cat : (cat || 'Other'),
        data.income.toFixed(2),
        data.expense.toFixed(2),
        data.count.toString(),
      ]);

      const tableStyles = fontLoaded 
        ? { font: 'SourceHanSansSC', fontStyle: 'normal' as const }
        : {};

      autoTable(doc, {
        startY: 75,
        head: [labels.categoryHeaders],
        body: categoryTableData,
        theme: 'striped',
        headStyles: { fillColor: [255, 107, 53], ...tableStyles },
        styles: { fontSize: 10, ...tableStyles },
      });

      // 明细表
      const detailData = transactions.map(t => [
        format(new Date(t.date), 'yyyy-MM-dd'),
        t.type === 'income' ? labels.incomeType : labels.expenseType,
        fontLoaded ? t.category : (t.category || 'Other'),
        t.amount.toFixed(2),
        fontLoaded ? (t.description || '-') : (t.description?.replace(/[^\x00-\x7F]/g, '') || '-'),
      ]);

      const finalY = (doc as any).lastAutoTable?.finalY || 120;
      autoTable(doc, {
        startY: finalY + 10,
        head: [labels.detailHeaders],
        body: detailData,
        theme: 'grid',
        headStyles: { fillColor: [100, 100, 100], ...tableStyles },
        styles: { fontSize: 8, ...tableStyles },
      });

      doc.save(`Report_${format(new Date(), 'yyyyMMdd')}.pdf`);
      toast.success(fontLoaded ? 'PDF报表导出成功' : 'PDF exported (English fallback)');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('PDF导出失败');
    } finally {
      setExporting(false);
    }
  };

  return {
    exporting,
    exportToCSV,
    exportToExcel,
    exportByCategoryExcel,
    exportByMonthExcel,
    exportToZip,
    exportToPDF,
  };
}
