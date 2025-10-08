import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

// Define interfaces for different report types
export interface ContributionReportData {
  id: string;
  member_id: string;
  member_name: string;
  tns_number?: string;
  amount: number;
  contribution_date: string;
  contribution_type: string;
  status: string;
}

export interface DisbursementReportData {
  id: string;
  member_id: string;
  member_name: string;
  tns_number?: string;
  amount: number;
  disbursement_date: string;
  reason?: string;
  status: string;
}

export interface BalanceReportData {
  id: string;
  member_id: string;
  member_name: string;
  tns_number?: string;
  current_balance: number;
  total_contributions: number;
  total_disbursements: number;
  last_updated: string;
}

export interface ExpenseReportData {
  id: string;
  amount: number;
  expense_date: string;
  expense_category: string;
  description?: string;
  month_year: string;
}

export interface AuditTrailData {
  id: string;
  action: string;
  table_name: string;
  record_id: string;
  old_values?: any;
  new_values?: any;
  user_id?: string;
  user_email?: string;
  timestamp: string;
  ip_address?: string;
}

// Excel Export Functions
export class ReportGenerator {
  private static addLogo(worksheet: XLSX.WorkSheet) {
    // Add organization header
    worksheet['A1'] = { v: 'TEAM NO STRUGGLE WELFARE GROUP', t: 's' };
    worksheet['A2'] = { v: 'Financial Management System', t: 's' };
    worksheet['A3'] = { v: `Generated on: ${format(new Date(), 'PPpp')}`, t: 's' };
  }

  private static autoSizeColumns(worksheet: XLSX.WorkSheet, data: any[]) {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Z1');
    const columnWidths: any[] = [];
    
    for (let col = range.s.c; col <= range.e.c; col++) {
      let maxWidth = 10; // minimum width
      
      for (let row = range.s.r; row <= range.e.r; row++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        
        if (cell && cell.v) {
          const cellLength = cell.v.toString().length;
          maxWidth = Math.max(maxWidth, cellLength + 2);
        }
      }
      
      columnWidths[col] = { width: Math.min(maxWidth, 50) }; // cap at 50
    }
    
    worksheet['!cols'] = columnWidths;
  }

  // Contributions Report
  static generateContributionsExcel(data: ContributionReportData[], filters?: { startDate?: string; endDate?: string; memberName?: string }) {
    const workbook = XLSX.utils.book_new();
    
    // Prepare data for worksheet
    const worksheetData = [
      ['TEAM NO STRUGGLE WELFARE GROUP'],
      ['Contributions Report'],
      [`Generated on: ${format(new Date(), 'PPpp')}`],
      ...(filters?.startDate || filters?.endDate ? [[`Period: ${filters?.startDate || 'All'} to ${filters?.endDate || 'All'}`]] : []),
      [], // Empty row
      ['TNS Number', 'Member Name', 'Amount (KES)', 'Date', 'Type', 'Status'], // Headers
      ...data.map(item => [
        item.tns_number || 'N/A',
        item.member_name,
        item.amount,
        format(new Date(item.contribution_date), 'PP'),
        item.contribution_type,
        item.status
      ])
    ];
    
    // Add summary
    const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
    const uniqueMembers = new Set(data.map(item => item.member_id)).size;
    
    worksheetData.push(
      [], // Empty row
      ['SUMMARY'],
      ['Total Contributions:', totalAmount],
      ['Number of Contributors:', uniqueMembers],
      ['Average per Member:', uniqueMembers > 0 ? (totalAmount / uniqueMembers).toFixed(2) : 0],
      ['Total Records:', data.length]
    );
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    this.autoSizeColumns(worksheet, worksheetData);
    
    // Style the header rows
    worksheet['A1'].s = { font: { bold: true, sz: 16 } };
    worksheet['A2'].s = { font: { bold: true, sz: 14 } };
    worksheet['A6'].s = { font: { bold: true }, fill: { fgColor: { rgb: "D3D3D3" } } };
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contributions');
    return workbook;
  }

  // Disbursements Report
  static generateDisbursementsExcel(data: DisbursementReportData[], filters?: { startDate?: string; endDate?: string; memberName?: string }) {
    const workbook = XLSX.utils.book_new();
    
    const worksheetData = [
      ['TEAM NO STRUGGLE WELFARE GROUP'],
      ['Disbursements Report'],
      [`Generated on: ${format(new Date(), 'PPpp')}`],
      ...(filters?.startDate || filters?.endDate ? [[`Period: ${filters?.startDate || 'All'} to ${filters?.endDate || 'All'}`]] : []),
      [],
      ['TNS Number', 'Member Name', 'Amount (KES)', 'Date', 'Reason', 'Status'],
      ...data.map(item => [
        item.tns_number || 'N/A',
        item.member_name,
        item.amount,
        format(new Date(item.disbursement_date), 'PP'),
        item.reason || 'N/A',
        item.status
      ])
    ];
    
    const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
    const uniqueMembers = new Set(data.map(item => item.member_id)).size;
    
    worksheetData.push(
      [],
      ['SUMMARY'],
      ['Total Disbursements:', totalAmount],
      ['Number of Recipients:', uniqueMembers],
      ['Average per Recipient:', uniqueMembers > 0 ? (totalAmount / uniqueMembers).toFixed(2) : 0],
      ['Total Records:', data.length]
    );
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    this.autoSizeColumns(worksheet, worksheetData);
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Disbursements');
    return workbook;
  }

  // Balance Report
  static generateBalancesExcel(data: BalanceReportData[]) {
    const workbook = XLSX.utils.book_new();
    
    const worksheetData = [
      ['TEAM NO STRUGGLE WELFARE GROUP'],
      ['Member Balances Report'],
      [`Generated on: ${format(new Date(), 'PPpp')}`],
      [],
      ['TNS Number', 'Member Name', 'Current Balance (KES)', 'Total Contributions (KES)', 'Total Disbursements (KES)', 'Last Updated'],
      ...data.map(item => [
        item.tns_number || 'N/A',
        item.member_name,
        item.current_balance,
        item.total_contributions,
        item.total_disbursements,
        format(new Date(item.last_updated), 'PPp')
      ])
    ];
    
    const totalBalance = data.reduce((sum, item) => sum + item.current_balance, 0);
    const totalContributions = data.reduce((sum, item) => sum + item.total_contributions, 0);
    const totalDisbursements = data.reduce((sum, item) => sum + item.total_disbursements, 0);
    const negativeBalances = data.filter(item => item.current_balance < 0).length;
    
    worksheetData.push(
      [],
      ['SUMMARY'],
      ['Total Current Balance:', totalBalance],
      ['Total All Contributions:', totalContributions],
      ['Total All Disbursements:', totalDisbursements],
      ['Members with Negative Balance:', negativeBalances],
      ['Total Members:', data.length]
    );
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    this.autoSizeColumns(worksheet, worksheetData);
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Balances');
    return workbook;
  }

  // Expenses Report
  static generateExpensesExcel(data: ExpenseReportData[], filters?: { startDate?: string; endDate?: string; category?: string }) {
    const workbook = XLSX.utils.book_new();
    
    const worksheetData = [
      ['TEAM NO STRUGGLE WELFARE GROUP'],
      ['Monthly Expenses Report'],
      [`Generated on: ${format(new Date(), 'PPpp')}`],
      ...(filters?.startDate || filters?.endDate ? [[`Period: ${filters?.startDate || 'All'} to ${filters?.endDate || 'All'}`]] : []),
      [],
      ['Amount (KES)', 'Date', 'Category', 'Description', 'Month-Year'],
      ...data.map(item => [
        item.amount,
        format(new Date(item.expense_date), 'PP'),
        item.expense_category,
        item.description || 'N/A',
        item.month_year
      ])
    ];
    
    const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
    const categories = new Set(data.map(item => item.expense_category));
    const monthlyBreakdown = data.reduce((acc, item) => {
      acc[item.month_year] = (acc[item.month_year] || 0) + item.amount;
      return acc;
    }, {} as Record<string, number>);
    
    worksheetData.push(
      [],
      ['SUMMARY'],
      ['Total Expenses:', totalAmount],
      ['Number of Categories:', categories.size],
      ['Average per Entry:', data.length > 0 ? (totalAmount / data.length).toFixed(2) : 0],
      ['Total Records:', data.length],
      [],
      ['MONTHLY BREAKDOWN'],
      ['Month-Year', 'Amount (KES)'],
      ...Object.entries(monthlyBreakdown).map(([month, amount]) => [month, amount])
    );
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    this.autoSizeColumns(worksheet, worksheetData);
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');
    return workbook;
  }

  // Audit Trail Report
  static generateAuditTrailExcel(data: AuditTrailData[], filters?: { startDate?: string; endDate?: string; action?: string }) {
    const workbook = XLSX.utils.book_new();
    
    const worksheetData = [
      ['TEAM NO STRUGGLE WELFARE GROUP'],
      ['Audit Trail Report'],
      [`Generated on: ${format(new Date(), 'PPpp')}`],
      ...(filters?.startDate || filters?.endDate ? [[`Period: ${filters?.startDate || 'All'} to ${filters?.endDate || 'All'}`]] : []),
      [],
      ['Timestamp', 'Action', 'Table', 'Record ID', 'User', 'IP Address'],
      ...data.map(item => [
        format(new Date(item.timestamp), 'PPp'),
        item.action,
        item.table_name,
        item.record_id,
        item.user_email || 'System',
        item.ip_address || 'N/A'
      ])
    ];
    
    const uniqueActions = new Set(data.map(item => item.action));
    const uniqueTables = new Set(data.map(item => item.table_name));
    const uniqueUsers = new Set(data.map(item => item.user_email).filter(Boolean));
    
    worksheetData.push(
      [],
      ['SUMMARY'],
      ['Total Audit Records:', data.length.toString()],
      ['Unique Actions:', uniqueActions.size.toString()],
      ['Tables Affected:', uniqueTables.size.toString()],
      ['Active Users:', uniqueUsers.size.toString()]
    );
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    this.autoSizeColumns(worksheet, worksheetData);
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Trail');
    return workbook;
  }

  // Download Excel file
  static downloadExcel(workbook: XLSX.WorkBook, filename: string) {
    XLSX.writeFile(workbook, `${filename}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  }

  // PDF Generation Functions
  static generateContributionsPDF(data: ContributionReportData[], filters?: { startDate?: string; endDate?: string }) {
    const doc = new jsPDF();
    let yPosition = 20;
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('TEAM NO STRUGGLE WELFARE GROUP', 105, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(16);
    doc.text('Contributions Report', 105, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, 105, yPosition, { align: 'center' });
    yPosition += 15;
    
    if (filters?.startDate || filters?.endDate) {
      doc.text(`Period: ${filters?.startDate || 'All'} to ${filters?.endDate || 'All'}`, 105, yPosition, { align: 'center' });
      yPosition += 15;
    }
    
    // Table headers
    doc.setFont('helvetica', 'bold');
    doc.text('TNS#', 10, yPosition);
    doc.text('Member Name', 30, yPosition);
    doc.text('Amount', 100, yPosition);
    doc.text('Date', 130, yPosition);
    doc.text('Type', 160, yPosition);
    doc.text('Status', 185, yPosition);
    yPosition += 7;
    
    // Draw line under headers
    doc.line(10, yPosition, 200, yPosition);
    yPosition += 5;
    
    // Data rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    data.forEach((item, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(item.tns_number || 'N/A', 10, yPosition);
      doc.text(item.member_name.substring(0, 25), 30, yPosition);
      doc.text(`KES ${item.amount.toLocaleString()}`, 100, yPosition);
      doc.text(format(new Date(item.contribution_date), 'PP'), 130, yPosition);
      doc.text(item.contribution_type.substring(0, 10), 160, yPosition);
      doc.text(item.status, 185, yPosition);
      yPosition += 6;
    });
    
    // Summary
    yPosition += 10;
    doc.line(10, yPosition, 200, yPosition);
    yPosition += 10;
    
    const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
    const uniqueMembers = new Set(data.map(item => item.member_id)).size;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('SUMMARY', 10, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Contributions: KES ${totalAmount.toLocaleString()}`, 10, yPosition);
    yPosition += 6;
    doc.text(`Number of Contributors: ${uniqueMembers}`, 10, yPosition);
    yPosition += 6;
    doc.text(`Total Records: ${data.length}`, 10, yPosition);
    
    return doc;
  }

  static generateDisbursementsPDF(data: DisbursementReportData[], filters?: { startDate?: string; endDate?: string }) {
    const doc = new jsPDF();
    let yPosition = 20;
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('TEAM NO STRUGGLE WELFARE GROUP', 105, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(16);
    doc.text('Disbursements Report', 105, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, 105, yPosition, { align: 'center' });
    yPosition += 15;
    
    if (filters?.startDate || filters?.endDate) {
      doc.text(`Period: ${filters?.startDate || 'All'} to ${filters?.endDate || 'All'}`, 105, yPosition, { align: 'center' });
      yPosition += 15;
    }
    
    // Table headers
    doc.setFont('helvetica', 'bold');
    doc.text('TNS#', 10, yPosition);
    doc.text('Member Name', 30, yPosition);
    doc.text('Amount', 90, yPosition);
    doc.text('Date', 120, yPosition);
    doc.text('Reason', 150, yPosition);
    doc.text('Status', 185, yPosition);
    yPosition += 7;
    
    doc.line(10, yPosition, 200, yPosition);
    yPosition += 5;
    
    // Data rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    data.forEach((item, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(item.tns_number || 'N/A', 10, yPosition);
      doc.text(item.member_name.substring(0, 20), 30, yPosition);
      doc.text(`KES ${item.amount.toLocaleString()}`, 90, yPosition);
      doc.text(format(new Date(item.disbursement_date), 'PP'), 120, yPosition);
      doc.text((item.reason || 'N/A').substring(0, 15), 150, yPosition);
      doc.text(item.status, 185, yPosition);
      yPosition += 6;
    });
    
    // Summary
    yPosition += 10;
    doc.line(10, yPosition, 200, yPosition);
    yPosition += 10;
    
    const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
    const uniqueMembers = new Set(data.map(item => item.member_id)).size;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('SUMMARY', 10, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Disbursements: KES ${totalAmount.toLocaleString()}`, 10, yPosition);
    yPosition += 6;
    doc.text(`Number of Recipients: ${uniqueMembers}`, 10, yPosition);
    yPosition += 6;
    doc.text(`Total Records: ${data.length}`, 10, yPosition);
    
    return doc;
  }

  static generateBalancesPDF(data: BalanceReportData[]) {
    const doc = new jsPDF();
    let yPosition = 20;
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('TEAM NO STRUGGLE WELFARE GROUP', 105, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(16);
    doc.text('Member Balances Report', 105, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, 105, yPosition, { align: 'center' });
    yPosition += 15;
    
    // Table headers
    doc.setFont('helvetica', 'bold');
    doc.text('TNS#', 10, yPosition);
    doc.text('Member Name', 30, yPosition);
    doc.text('Balance', 80, yPosition);
    doc.text('Contributions', 110, yPosition);
    doc.text('Disbursements', 150, yPosition);
    yPosition += 7;
    
    doc.line(10, yPosition, 200, yPosition);
    yPosition += 5;
    
    // Data rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    data.forEach((item, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(item.tns_number || 'N/A', 10, yPosition);
      doc.text(item.member_name.substring(0, 20), 30, yPosition);
      doc.text(`${item.current_balance.toLocaleString()}`, 80, yPosition);
      doc.text(`${item.total_contributions.toLocaleString()}`, 110, yPosition);
      doc.text(`${item.total_disbursements.toLocaleString()}`, 150, yPosition);
      yPosition += 6;
    });
    
    // Summary
    yPosition += 10;
    doc.line(10, yPosition, 200, yPosition);
    yPosition += 10;
    
    const totalBalance = data.reduce((sum, item) => sum + item.current_balance, 0);
    const totalContributions = data.reduce((sum, item) => sum + item.total_contributions, 0);
    const totalDisbursements = data.reduce((sum, item) => sum + item.total_disbursements, 0);
    const negativeBalances = data.filter(item => item.current_balance < 0).length;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('SUMMARY', 10, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Balance: KES ${totalBalance.toLocaleString()}`, 10, yPosition);
    yPosition += 6;
    doc.text(`Total Contributions: KES ${totalContributions.toLocaleString()}`, 10, yPosition);
    yPosition += 6;
    doc.text(`Total Disbursements: KES ${totalDisbursements.toLocaleString()}`, 10, yPosition);
    yPosition += 6;
    doc.text(`Members with Negative Balance: ${negativeBalances}`, 10, yPosition);
    
    return doc;
  }

  // Download PDF file
  static downloadPDF(doc: jsPDF, filename: string) {
    doc.save(`${filename}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  }
}
