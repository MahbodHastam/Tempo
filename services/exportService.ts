import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TimeEntry, Project } from '../types';
import { formatDuration, formatCurrency } from '../utils';

export const exportToPdf = (entries: TimeEntry[], projects: Project[], preferredCurrency: 'USD' | 'IRT' = 'USD', reportName: string = 'Tempo Report') => {
  const doc = new jsPDF() as any;
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(40);
  doc.text('Tempo Time Report', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
  doc.text(`Project Filter: ${reportName}`, 14, 35);
  
  // Summary Data
  const totalMs = entries.reduce((acc, curr) => acc + ((curr.endTime || curr.startTime) - curr.startTime), 0);
  const totalBilled = entries.reduce((acc, curr) => 
    curr.isBillable && curr.endTime ? acc + ((curr.endTime - curr.startTime) / 3600000) * curr.hourlyRate : acc, 0
  );
  
  doc.setFontSize(12);
  doc.setTextColor(40);
  doc.text(`Total Duration: ${formatDuration(totalMs)}`, 14, 45);
  doc.text(`Total Billable: ${formatCurrency(totalBilled, preferredCurrency)}`, 14, 52);
  
  // Table Data
  const tableRows = entries.map(entry => {
    const project = projects.find(p => p.id === entry.projectId);
    const durationMs = (entry.endTime || entry.startTime) - entry.startTime;
    const amount = entry.isBillable ? formatCurrency((durationMs / 3600000) * entry.hourlyRate, preferredCurrency) : '-';
    
    // Formatting "From" date and time
    const fromStr = new Date(entry.startTime).toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Formatting "To" date and time
    const toStr = entry.endTime ? new Date(entry.endTime).toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'Running...';
    
    // Multi-line cell content with subheadings
    const dateTimeCell = `From: ${fromStr}\nTo: ${toStr}`;
    
    return [
      dateTimeCell,
      entry.description || 'No description',
      project?.name || 'No Project',
      formatDuration(durationMs),
      amount
    ];
  });
  
  // Use autoTable function directly
  autoTable(doc, {
    startY: 60,
    head: [['Date & Time', 'Description', 'Project', 'Duration', 'Amount']],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { 
      fontSize: 9, 
      cellPadding: 3,
      valign: 'middle' // Vertically center content since date cells are now taller
    },
    columnStyles: {
      0: { cellWidth: 50 }, // Give more room to the date column for subheadings
    }
  });
  
  doc.save(`tempo-report-${new Date().toISOString().split('T')[0]}.pdf`);
};