
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TimeEntry, Project } from '../types';
import { formatDuration, formatCurrency } from '../utils';

// Helper to convert ArrayBuffer to Base64 for jsPDF font embedding
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Helper to detect and handle RTL text for basic PDF rendering
// Note: This is a simplified approach to ensure words appear in correct sequence
const processRtlText = (text: string): string => {
  const rtlRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  if (!rtlRegex.test(text)) return text;
  
  // For standard jsPDF, sometimes reversing words is needed for simple RTL
  // However, with proper font support, we primarily need to ensure the font is set.
  // In many cases, we might need to reverse if the viewer doesn't support RTL metadata.
  return text; 
};

export const exportToPdf = async (entries: TimeEntry[], projects: Project[], preferredCurrency: 'USD' | 'IRT' = 'USD', reportName: string = 'Tempo Report') => {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  }) as any;

  // Load Vazirmatn Font for Unicode support
  try {
    const fontUrl = 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/ttf/Vazirmatn-Regular.ttf';
    const response = await fetch(fontUrl);
    const fontBuffer = await response.arrayBuffer();
    const fontBase64 = arrayBufferToBase64(fontBuffer);
    
    doc.addFileToVFS('Vazirmatn.ttf', fontBase64);
    doc.addFont('Vazirmatn.ttf', 'Vazirmatn', 'normal');
    doc.setFont('Vazirmatn');
  } catch (error) {
    console.error('Failed to load Vazirmatn font for PDF, falling back to standard font.', error);
    doc.setFont('helvetica');
  }

  doc.setProperties({
    title: reportName,
    subject: 'Time Tracking Summary',
    author: 'Tempo App',
    creator: 'Tempo Minimalist Tracker',
  });
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(40);
  doc.text(processRtlText('Tempo Time Report'), 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
  
  const isGenericReport = reportName === 'All History' || reportName === 'Selected Entries' || reportName === 'Tempo Report';
  let currentY = 35;
  
  if (!isGenericReport) {
    doc.text(processRtlText(`Project: ${reportName}`), 14, currentY);
    currentY += 10;
  } else {
    currentY += 5; 
  }
  
  const totalMs = entries.reduce((acc, curr) => acc + ((curr.endTime || curr.startTime) - curr.startTime), 0);
  const totalsByCurrency = entries.reduce((acc, curr) => {
    if (!curr.isBillable || !curr.endTime) return acc;
    const project = projects.find(p => p.id === curr.projectId);
    const currency = project?.currency || preferredCurrency;
    const amount = ((curr.endTime - curr.startTime) / 3600000) * curr.hourlyRate;
    acc[currency] = (acc[currency] || 0) + amount;
    return acc;
  }, {} as Record<string, number>);
  
  doc.setFontSize(12);
  doc.setTextColor(40);
  doc.text(processRtlText(`Total Duration: ${formatDuration(totalMs)}`), 14, currentY);
  currentY += 7;

  const currencies = Object.keys(totalsByCurrency);
  if (currencies.length > 0) {
    currencies.forEach(curr => {
      doc.text(processRtlText(`Total Billable (${curr}): ${formatCurrency(totalsByCurrency[curr], curr as 'USD' | 'IRT')}`), 14, currentY);
      currentY += 7;
    });
  } else {
    doc.text(processRtlText(`Total Billable: ${formatCurrency(0, preferredCurrency)}`), 14, currentY);
    currentY += 7;
  }
  
  const tableRows = entries.map(entry => {
    const project = projects.find(p => p.id === entry.projectId);
    const durationMs = (entry.endTime || entry.startTime) - entry.startTime;
    const itemCurrency = project?.currency || preferredCurrency;
    const amount = entry.isBillable ? formatCurrency((durationMs / 3600000) * entry.hourlyRate, itemCurrency) : '-';
    
    const fromStr = new Date(entry.startTime).toLocaleString([], {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const toStr = entry.endTime ? new Date(entry.endTime).toLocaleString([], {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : '...';
    
    return [
      `${fromStr} - ${toStr}`,
      processRtlText(entry.description || 'No description'),
      processRtlText(project?.name || '-'),
      formatDuration(durationMs),
      processRtlText(amount)
    ];
  });
  
  autoTable(doc, {
    startY: currentY + 3,
    head: [['Date & Time', 'Description', 'Project', 'Duration', 'Amount']],
    body: tableRows,
    theme: 'striped',
    styles: { 
      fontSize: 9, 
      font: doc.getFontList().Vazirmatn ? 'Vazirmatn' : 'helvetica',
      cellPadding: 4,
      valign: 'middle'
    },
    headStyles: { 
      fillColor: [59, 130, 246],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 45 },
      4: { halign: 'right' }
    }
  });
  
  doc.save(`tempo-report-${new Date().toISOString().split('T')[0]}.pdf`);
};
