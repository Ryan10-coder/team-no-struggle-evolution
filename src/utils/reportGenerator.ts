import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// ─── Data Interfaces ───────────────────────────────────────────────
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

// ─── Brand Colors ──────────────────────────────────────────────────
const BRAND = {
  primary: [15, 76, 117] as [number, number, number],     // Deep teal-blue
  secondary: [22, 160, 133] as [number, number, number],   // Emerald
  accent: [243, 156, 18] as [number, number, number],      // Warm amber
  danger: [192, 57, 43] as [number, number, number],       // Red
  dark: [44, 62, 80] as [number, number, number],           // Dark slate
  muted: [149, 165, 166] as [number, number, number],       // Muted gray
  light: [236, 240, 241] as [number, number, number],       // Light gray
  white: [255, 255, 255] as [number, number, number],
  altRow: [245, 248, 250] as [number, number, number],      // Subtle alternate
};

// ─── PDF Helpers ───────────────────────────────────────────────────
function addBrandedHeader(doc: jsPDF, title: string, subtitle?: string): number {
  const pageWidth = doc.internal.pageSize.width;

  // Top accent bar
  doc.setFillColor(...BRAND.primary);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Organization name
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND.primary);
  doc.text('ITUMBU WELFARE GROUP', pageWidth / 2, 22, { align: 'center' });

  // Thin separator line
  doc.setDrawColor(...BRAND.secondary);
  doc.setLineWidth(0.5);
  doc.line(40, 27, pageWidth - 40, 27);

  // Report title
  doc.setFontSize(16);
  doc.setTextColor(...BRAND.dark);
  doc.text(title, pageWidth / 2, 36, { align: 'center' });

  let y = 42;

  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BRAND.muted);
    doc.text(subtitle, pageWidth / 2, y, { align: 'center' });
    y += 6;
  }

  // Generated date
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  doc.text(`Generated: ${format(new Date(), 'MMMM dd, yyyy • HH:mm')}`, pageWidth / 2, y, { align: 'center' });
  y += 4;

  // Bottom accent line
  doc.setDrawColor(...BRAND.light);
  doc.setLineWidth(0.3);
  doc.line(14, y, pageWidth - 14, y);

  doc.setTextColor(0, 0, 0); // Reset
  return y + 6;
}

function addPageFooters(doc: jsPDF) {
  const totalPages = doc.internal.pages.length - 1;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer line
    doc.setDrawColor(...BRAND.light);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 18, pageWidth - 14, pageHeight - 18);

    // Left: confidentiality
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...BRAND.muted);
    doc.text('CONFIDENTIAL — Itumbu Welfare Group Financial System', 14, pageHeight - 12);

    // Right: page numbers
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 12, { align: 'right' });

    // Bottom accent bar
    doc.setFillColor(...BRAND.primary);
    doc.rect(0, pageHeight - 4, pageWidth, 4, 'F');
  }
  doc.setTextColor(0, 0, 0);
}

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  const pageWidth = doc.internal.pageSize.width;
  doc.setFillColor(...BRAND.primary);
  doc.roundedRect(14, y - 5, pageWidth - 28, 9, 1, 1, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND.white);
  doc.text(title, 18, y + 1);
  doc.setTextColor(0, 0, 0);
  return y + 10;
}

function addSummaryBox(doc: jsPDF, items: [string, string][], y: number, color: [number, number, number] = BRAND.secondary): number {
  const pageWidth = doc.internal.pageSize.width;
  const boxWidth = pageWidth - 28;
  const boxHeight = 8 + items.length * 7;

  // Light background fill
  doc.setFillColor(
    Math.min(255, color[0] + Math.round((255 - color[0]) * 0.9)),
    Math.min(255, color[1] + Math.round((255 - color[1]) * 0.9)),
    Math.min(255, color[2] + Math.round((255 - color[2]) * 0.9))
  );
  doc.roundedRect(14, y, boxWidth, boxHeight, 2, 2, 'F');

  doc.setDrawColor(...color);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, y, boxWidth, boxHeight, 2, 2, 'S');

  let itemY = y + 8;
  doc.setFontSize(9);

  items.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BRAND.dark);
    doc.text(label, 20, itemY);
    doc.setFont('helvetica', 'bold');
    doc.text(value, pageWidth - 20, itemY, { align: 'right' });
    itemY += 7;
  });

  doc.setTextColor(0, 0, 0);
  return y + boxHeight + 6;
}

function checkPageBreak(doc: jsPDF, y: number, needed: number = 40): number {
  if (y > doc.internal.pageSize.height - needed) {
    doc.addPage();
    return 20;
  }
  return y;
}

const tableTheme = {
  headStyles: {
    fillColor: BRAND.primary as [number, number, number],
    textColor: BRAND.white as [number, number, number],
    fontSize: 9,
    fontStyle: 'bold' as const,
    halign: 'left' as const,
    cellPadding: 3,
  },
  bodyStyles: {
    fontSize: 8,
    cellPadding: 2.5,
    textColor: BRAND.dark as [number, number, number],
  },
  alternateRowStyles: {
    fillColor: BRAND.altRow as [number, number, number],
  },
  styles: {
    lineColor: BRAND.light as [number, number, number],
    lineWidth: 0.2,
  },
  margin: { left: 14, right: 14 },
};

// ─── Excel Helpers ─────────────────────────────────────────────────
function autoSizeColumns(worksheet: XLSX.WorkSheet) {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Z1');
  const columnWidths: { width: number }[] = [];

  for (let col = range.s.c; col <= range.e.c; col++) {
    let maxWidth = 12;
    for (let row = range.s.r; row <= range.e.r; row++) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })];
      if (cell?.v) {
        maxWidth = Math.max(maxWidth, String(cell.v).length + 3);
      }
    }
    columnWidths[col] = { width: Math.min(maxWidth, 45) };
  }
  worksheet['!cols'] = columnWidths;
}

function createExcelHeader(title: string, filters?: { startDate?: string; endDate?: string }): (string | number)[][] {
  const rows: (string | number)[][] = [
    ['ITUMBU WELFARE GROUP'],
    [title],
    [`Generated: ${format(new Date(), 'MMMM dd, yyyy • HH:mm')}`],
  ];
  if (filters?.startDate || filters?.endDate) {
    rows.push([`Period: ${filters.startDate || 'All'} to ${filters.endDate || 'All'}`]);
  }
  rows.push([]); // spacer
  return rows;
}

function addExcelSummary(rows: (string | number)[][], items: [string, string | number][]) {
  rows.push([]);
  rows.push(['SUMMARY']);
  items.forEach(([label, value]) => rows.push([label, value]));
  rows.push([]);
  rows.push([`Report generated by Itumbu Welfare Financial System on ${format(new Date(), 'PPpp')}`]);
}

// ─── Report Generator Class ───────────────────────────────────────
export class ReportGenerator {

  // ═══ EXCEL REPORTS ═══════════════════════════════════════════════

  static generateContributionsExcel(data: ContributionReportData[], filters?: { startDate?: string; endDate?: string; memberName?: string }) {
    const workbook = XLSX.utils.book_new();
    const rows = createExcelHeader('Contributions Report', filters);

    rows.push(['TNS Number', 'Member Name', 'Amount (KES)', 'Date', 'Type', 'Status']);
    data.forEach(item => rows.push([
      item.tns_number || 'N/A',
      item.member_name,
      item.amount,
      format(new Date(item.contribution_date), 'PP'),
      item.contribution_type,
      item.status,
    ]));

    const totalAmount = data.reduce((s, i) => s + i.amount, 0);
    const uniqueMembers = new Set(data.map(i => i.member_id)).size;

    addExcelSummary(rows, [
      ['Total Contributions (KES)', totalAmount],
      ['Number of Contributors', uniqueMembers],
      ['Average per Member (KES)', uniqueMembers > 0 ? Math.round(totalAmount / uniqueMembers) : 0],
      ['Total Records', data.length],
    ]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    autoSizeColumns(ws);
    XLSX.utils.book_append_sheet(workbook, ws, 'Contributions');
    return workbook;
  }

  static generateDisbursementsExcel(data: DisbursementReportData[], filters?: { startDate?: string; endDate?: string; memberName?: string }) {
    const workbook = XLSX.utils.book_new();
    const rows = createExcelHeader('Disbursements Report', filters);

    rows.push(['TNS Number', 'Member Name', 'Amount (KES)', 'Date', 'Reason', 'Status']);
    data.forEach(item => rows.push([
      item.tns_number || 'N/A',
      item.member_name,
      item.amount,
      format(new Date(item.disbursement_date), 'PP'),
      item.reason || 'N/A',
      item.status,
    ]));

    const totalAmount = data.reduce((s, i) => s + i.amount, 0);
    const uniqueMembers = new Set(data.map(i => i.member_id)).size;

    addExcelSummary(rows, [
      ['Total Disbursements (KES)', totalAmount],
      ['Number of Recipients', uniqueMembers],
      ['Average per Recipient (KES)', uniqueMembers > 0 ? Math.round(totalAmount / uniqueMembers) : 0],
      ['Total Records', data.length],
    ]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    autoSizeColumns(ws);
    XLSX.utils.book_append_sheet(workbook, ws, 'Disbursements');
    return workbook;
  }

  static generateBalancesExcel(data: BalanceReportData[]) {
    const workbook = XLSX.utils.book_new();
    const rows = createExcelHeader('Member Balances Report');

    rows.push(['TNS Number', 'Member Name', 'Current Balance (KES)', 'Total Contributions (KES)', 'Total Disbursements (KES)', 'Last Updated']);
    data.forEach(item => rows.push([
      item.tns_number || 'N/A',
      item.member_name,
      item.current_balance,
      item.total_contributions,
      item.total_disbursements,
      format(new Date(item.last_updated), 'PPp'),
    ]));

    addExcelSummary(rows, [
      ['Total Current Balance (KES)', data.reduce((s, i) => s + i.current_balance, 0)],
      ['Total All Contributions (KES)', data.reduce((s, i) => s + i.total_contributions, 0)],
      ['Total All Disbursements (KES)', data.reduce((s, i) => s + i.total_disbursements, 0)],
      ['Members with Negative Balance', data.filter(i => i.current_balance < 0).length],
      ['Total Members', data.length],
    ]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    autoSizeColumns(ws);
    XLSX.utils.book_append_sheet(workbook, ws, 'Balances');
    return workbook;
  }

  static generateExpensesExcel(data: ExpenseReportData[], filters?: { startDate?: string; endDate?: string; category?: string }) {
    const workbook = XLSX.utils.book_new();
    const rows = createExcelHeader('Monthly Expenses Report', filters);

    rows.push(['Amount (KES)', 'Date', 'Category', 'Description', 'Month-Year']);
    data.forEach(item => rows.push([
      item.amount,
      format(new Date(item.expense_date), 'PP'),
      item.expense_category,
      item.description || 'N/A',
      item.month_year,
    ]));

    const totalAmount = data.reduce((s, i) => s + i.amount, 0);
    const monthlyBreakdown = data.reduce((acc, i) => {
      acc[i.month_year] = (acc[i.month_year] || 0) + i.amount;
      return acc;
    }, {} as Record<string, number>);

    addExcelSummary(rows, [
      ['Total Expenses (KES)', totalAmount],
      ['Number of Categories', new Set(data.map(i => i.expense_category)).size],
      ['Average per Entry (KES)', data.length > 0 ? Math.round(totalAmount / data.length) : 0],
      ['Total Records', data.length],
    ]);

    rows.push([]);
    rows.push(['MONTHLY BREAKDOWN']);
    rows.push(['Month-Year', 'Amount (KES)']);
    Object.entries(monthlyBreakdown).forEach(([month, amount]) => rows.push([month, amount]));

    const ws = XLSX.utils.aoa_to_sheet(rows);
    autoSizeColumns(ws);
    XLSX.utils.book_append_sheet(workbook, ws, 'Expenses');
    return workbook;
  }

  static generateAuditTrailExcel(data: AuditTrailData[], filters?: { startDate?: string; endDate?: string; action?: string }) {
    const workbook = XLSX.utils.book_new();
    const rows = createExcelHeader('Audit Trail Report', filters);

    rows.push(['Timestamp', 'Action', 'Table', 'Record ID', 'User', 'IP Address']);
    data.forEach(item => rows.push([
      format(new Date(item.timestamp), 'PPp'),
      item.action,
      item.table_name,
      item.record_id,
      item.user_email || 'System',
      item.ip_address || 'N/A',
    ]));

    addExcelSummary(rows, [
      ['Total Audit Records', data.length],
      ['Unique Actions', new Set(data.map(i => i.action)).size],
      ['Tables Affected', new Set(data.map(i => i.table_name)).size],
      ['Active Users', new Set(data.map(i => i.user_email).filter(Boolean)).size],
    ]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    autoSizeColumns(ws);
    XLSX.utils.book_append_sheet(workbook, ws, 'Audit Trail');
    return workbook;
  }

  static downloadExcel(workbook: XLSX.WorkBook, filename: string) {
    XLSX.writeFile(workbook, `${filename}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  }

  // ═══ PDF REPORTS ═════════════════════════════════════════════════

  static generateContributionsPDF(data: ContributionReportData[], filters?: { startDate?: string; endDate?: string }) {
    const doc = new jsPDF();
    const periodText = (filters?.startDate || filters?.endDate)
      ? `Period: ${filters?.startDate || 'All'} — ${filters?.endDate || 'All'}`
      : undefined;
    let y = addBrandedHeader(doc, 'CONTRIBUTIONS REPORT', periodText);

    // Summary
    const totalAmount = data.reduce((s, i) => s + i.amount, 0);
    const uniqueMembers = new Set(data.map(i => i.member_id)).size;

    y = addSummaryBox(doc, [
      ['Total Contributions', `KES ${totalAmount.toLocaleString()}`],
      ['Number of Contributors', uniqueMembers.toString()],
      ['Average per Member', `KES ${uniqueMembers > 0 ? Math.round(totalAmount / uniqueMembers).toLocaleString() : '0'}`],
      ['Total Transactions', data.length.toString()],
    ], y, BRAND.secondary);

    // Table
    y = addSectionTitle(doc, 'CONTRIBUTION DETAILS', y);

    autoTable(doc, {
      startY: y,
      head: [['#', 'TNS Number', 'Member Name', 'Amount (KES)', 'Date', 'Type', 'Status']],
      body: data.map((item, i) => [
        (i + 1).toString(),
        item.tns_number || 'N/A',
        item.member_name,
        `KES ${item.amount.toLocaleString()}`,
        format(new Date(item.contribution_date), 'PP'),
        item.contribution_type,
        item.status.toUpperCase(),
      ]),
      ...tableTheme,
    });

    addPageFooters(doc);
    return doc;
  }

  static generateDisbursementsPDF(data: DisbursementReportData[], filters?: { startDate?: string; endDate?: string }) {
    const doc = new jsPDF();
    const periodText = (filters?.startDate || filters?.endDate)
      ? `Period: ${filters?.startDate || 'All'} — ${filters?.endDate || 'All'}`
      : undefined;
    let y = addBrandedHeader(doc, 'DISBURSEMENTS REPORT', periodText);

    const totalAmount = data.reduce((s, i) => s + i.amount, 0);
    const uniqueMembers = new Set(data.map(i => i.member_id)).size;

    y = addSummaryBox(doc, [
      ['Total Disbursements', `KES ${totalAmount.toLocaleString()}`],
      ['Number of Recipients', uniqueMembers.toString()],
      ['Average per Recipient', `KES ${uniqueMembers > 0 ? Math.round(totalAmount / uniqueMembers).toLocaleString() : '0'}`],
      ['Total Records', data.length.toString()],
    ], y, BRAND.accent);

    y = addSectionTitle(doc, 'DISBURSEMENT DETAILS', y);

    autoTable(doc, {
      startY: y,
      head: [['#', 'TNS Number', 'Member Name', 'Amount (KES)', 'Date', 'Reason', 'Status']],
      body: data.map((item, i) => [
        (i + 1).toString(),
        item.tns_number || 'N/A',
        item.member_name,
        `KES ${item.amount.toLocaleString()}`,
        format(new Date(item.disbursement_date), 'PP'),
        item.reason || 'N/A',
        item.status.toUpperCase(),
      ]),
      ...tableTheme,
      headStyles: { ...tableTheme.headStyles, fillColor: BRAND.accent },
    });

    addPageFooters(doc);
    return doc;
  }

  static generateBalancesPDF(data: BalanceReportData[]) {
    const doc = new jsPDF();
    let y = addBrandedHeader(doc, 'MEMBER BALANCES REPORT');

    const totalBalance = data.reduce((s, i) => s + i.current_balance, 0);
    const totalContributions = data.reduce((s, i) => s + i.total_contributions, 0);
    const totalDisbursements = data.reduce((s, i) => s + i.total_disbursements, 0);
    const negativeBalances = data.filter(i => i.current_balance < 0).length;

    y = addSummaryBox(doc, [
      ['Total Current Balance', `KES ${totalBalance.toLocaleString()}`],
      ['Total Contributions', `KES ${totalContributions.toLocaleString()}`],
      ['Total Disbursements', `KES ${totalDisbursements.toLocaleString()}`],
      ['Members with Negative Balance', negativeBalances.toString()],
      ['Total Members', data.length.toString()],
    ], y);

    y = addSectionTitle(doc, 'BALANCE DETAILS', y);

    autoTable(doc, {
      startY: y,
      head: [['#', 'TNS Number', 'Member Name', 'Balance (KES)', 'Contributions (KES)', 'Disbursements (KES)', 'Last Updated']],
      body: data.map((item, i) => [
        (i + 1).toString(),
        item.tns_number || 'N/A',
        item.member_name,
        `KES ${item.current_balance.toLocaleString()}`,
        `KES ${item.total_contributions.toLocaleString()}`,
        `KES ${item.total_disbursements.toLocaleString()}`,
        format(new Date(item.last_updated), 'PP'),
      ]),
      ...tableTheme,
    });

    addPageFooters(doc);
    return doc;
  }

  static downloadPDF(doc: jsPDF, filename: string) {
    doc.save(`${filename}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  }

  // Expenses Report PDF
  static generateExpensesPDF(data: any[], options: { startDate?: string; endDate?: string } = {}) {
    const doc = new jsPDF();
    const periodText = (options.startDate || options.endDate)
      ? `Period: ${options.startDate || 'Start'} — ${options.endDate || 'Present'}`
      : undefined;
    let y = addBrandedHeader(doc, 'EXPENSE AUDIT REPORT', periodText);

    const totalAmount = data.reduce((s, e) => s + e.amount, 0);
    const approvedCount = data.filter(e => e.approved_by).length;
    const pendingAmount = data.filter(e => !e.approved_by).reduce((s, e) => s + e.amount, 0);

    y = addSummaryBox(doc, [
      ['Total Expenses', `KES ${totalAmount.toLocaleString()}`],
      ['Total Records', data.length.toString()],
      ['Approved', `${approvedCount} (${data.length > 0 ? ((approvedCount / data.length) * 100).toFixed(1) : 0}%)`],
      ['Pending Amount', `KES ${pendingAmount.toLocaleString()}`],
    ], y, BRAND.danger);

    // Category breakdown
    const categoryTotals = data.reduce((acc, e) => {
      acc[e.expense_category] = (acc[e.expense_category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    y = addSectionTitle(doc, 'CATEGORY BREAKDOWN', y);

    autoTable(doc, {
      startY: y,
      head: [['Category', 'Total Amount (KES)', '% of Total']],
      body: Object.entries(categoryTotals).map(([cat, amt]) => [
        cat,
        `KES ${(amt as number).toLocaleString()}`,
        `${totalAmount > 0 ? ((amt as number) / totalAmount * 100).toFixed(1) : 0}%`,
      ]),
      ...tableTheme,
      headStyles: { ...tableTheme.headStyles, fillColor: BRAND.danger },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
    y = checkPageBreak(doc, y, 60);
    y = addSectionTitle(doc, 'EXPENSE DETAILS', y);

    autoTable(doc, {
      startY: y,
      head: [['#', 'Description', 'Amount (KES)', 'Category', 'Date', 'Status']],
      body: data.map((e, i) => [
        (i + 1).toString(),
        e.description || 'N/A',
        `KES ${e.amount.toLocaleString()}`,
        e.expense_category,
        format(new Date(e.expense_date), 'PP'),
        e.approved_by ? 'Approved' : 'Pending',
      ]),
      ...tableTheme,
      headStyles: { ...tableTheme.headStyles, fillColor: BRAND.danger },
    });

    addPageFooters(doc);
    return doc;
  }

  // Anomalies PDF
  static generateAnomaliesPDF(anomalies: any[], metrics: any) {
    const doc = new jsPDF();
    let y = addBrandedHeader(doc, 'AUDIT ANOMALIES REPORT', `Risk: ${metrics.riskScore}% • Compliance: ${metrics.complianceScore}%`);

    const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
    const warningCount = anomalies.filter(a => a.severity === 'warning').length;
    const infoCount = anomalies.filter(a => a.severity === 'info').length;

    y = addSummaryBox(doc, [
      ['Total Anomalies', anomalies.length.toString()],
      ['Critical', criticalCount.toString()],
      ['Warning', warningCount.toString()],
      ['Info', infoCount.toString()],
      ['Net Position', `KES ${metrics.netPosition.toLocaleString()}`],
    ], y, criticalCount > 0 ? BRAND.danger : BRAND.accent);

    y = addSectionTitle(doc, 'FINANCIAL HEALTH', y);

    const disbursementRatio = ((metrics.totalDisbursements / metrics.totalContributions) * 100).toFixed(1);
    const expenseRatio = ((metrics.totalExpenses / metrics.totalContributions) * 100).toFixed(1);

    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Value', 'Assessment']],
      body: [
        ['Disbursement Ratio', `${disbursementRatio}%`, Number(disbursementRatio) > 80 ? '⚠ HIGH' : '✓ Normal'],
        ['Expense Ratio', `${expenseRatio}%`, Number(expenseRatio) > 10 ? '⚠ HIGH' : '✓ Normal'],
        ['Discrepancies', metrics.discrepanciesFound.toString(), metrics.discrepanciesFound > 0 ? '⚠ REVIEW' : '✓ None'],
      ],
      ...tableTheme,
      headStyles: { ...tableTheme.headStyles, fillColor: BRAND.accent },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
    y = checkPageBreak(doc, y);
    y = addSectionTitle(doc, 'DETECTED ANOMALIES', y);

    autoTable(doc, {
      startY: y,
      head: [['#', 'Type', 'Severity', 'Description', 'Recommendation']],
      body: anomalies.map((a, i) => [
        (i + 1).toString(),
        a.type,
        a.severity?.toUpperCase(),
        a.description || 'N/A',
        a.recommendation || 'N/A',
      ]),
      ...tableTheme,
      headStyles: { ...tableTheme.headStyles, fillColor: BRAND.danger },
      columnStyles: { 3: { cellWidth: 50 }, 4: { cellWidth: 50 } },
    });

    addPageFooters(doc);
    return doc;
  }

  // Dashboard PDF
  static generateDashboardPDF(metrics: any, trends: any[], risks: any[]) {
    const doc = new jsPDF();
    let y = addBrandedHeader(doc, 'AUDIT DASHBOARD REPORT');

    y = addSummaryBox(doc, [
      ['Total Contributions', `KES ${metrics.totalContributions.toLocaleString()}`],
      ['Total Disbursements', `KES ${metrics.totalDisbursements.toLocaleString()}`],
      ['Total Expenses', `KES ${metrics.totalExpenses.toLocaleString()}`],
      ['Net Position', `KES ${metrics.netPosition.toLocaleString()}`],
      ['Risk Score', `${metrics.riskScore}%`],
      ['Compliance Score', `${metrics.complianceScore}%`],
    ], y);

    if (trends.length > 0) {
      y = addSectionTitle(doc, 'MONTHLY TRENDS', y);
      autoTable(doc, {
        startY: y,
        head: [['Month', 'Contributions', 'Disbursements', 'Expenses', 'Net']],
        body: trends.map(t => [
          t.month,
          `KES ${t.contributions.toLocaleString()}`,
          `KES ${t.disbursements.toLocaleString()}`,
          `KES ${t.expenses.toLocaleString()}`,
          `KES ${t.net.toLocaleString()}`,
        ]),
        ...tableTheme,
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    if (risks.length > 0) {
      y = checkPageBreak(doc, y);
      y = addSectionTitle(doc, 'RISK AREAS', y);
      autoTable(doc, {
        startY: y,
        head: [['Risk Type', 'Impact', 'Description', 'Recommendation']],
        body: risks.map(r => [r.type, r.impact, r.description || 'N/A', r.recommendation || 'N/A']),
        ...tableTheme,
        headStyles: { ...tableTheme.headStyles, fillColor: BRAND.danger },
      });
    }

    addPageFooters(doc);
    return doc;
  }

  // Audit Trail PDF
  static generateAuditTrailPDF(data: AuditTrailData[], filters?: { startDate?: string; endDate?: string; action?: string }) {
    const doc = new jsPDF();
    const periodText = (filters?.startDate || filters?.endDate)
      ? `Period: ${filters?.startDate || 'Start'} — ${filters?.endDate || 'Present'}`
      : undefined;
    let y = addBrandedHeader(doc, 'AUDIT TRAIL REPORT', periodText);

    const actionCounts: Record<string, number> = {};
    data.forEach(i => { actionCounts[i.action] = (actionCounts[i.action] || 0) + 1; });

    y = addSummaryBox(doc, [
      ['Total Records', data.length.toString()],
      ['Unique Actions', new Set(data.map(i => i.action)).size.toString()],
      ['Tables Affected', new Set(data.map(i => i.table_name)).size.toString()],
      ['Active Users', new Set(data.map(i => i.user_email).filter(Boolean)).size.toString()],
    ], y, BRAND.dark);

    // Action breakdown
    y = addSectionTitle(doc, 'ACTION BREAKDOWN', y);
    autoTable(doc, {
      startY: y,
      head: [['Action', 'Count', '% of Total']],
      body: Object.entries(actionCounts).sort((a, b) => b[1] - a[1]).map(([action, count]) => [
        action, count.toString(), `${(count / data.length * 100).toFixed(1)}%`,
      ]),
      ...tableTheme,
      headStyles: { ...tableTheme.headStyles, fillColor: BRAND.dark },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
    y = checkPageBreak(doc, y);
    y = addSectionTitle(doc, 'AUDIT LOG ENTRIES', y);

    autoTable(doc, {
      startY: y,
      head: [['#', 'Timestamp', 'Action', 'Table', 'User', 'IP Address']],
      body: data.map((item, i) => [
        (i + 1).toString(),
        format(new Date(item.timestamp), 'MM/dd/yyyy HH:mm'),
        item.action,
        item.table_name,
        item.user_email || 'System',
        item.ip_address || 'N/A',
      ]),
      ...tableTheme,
      headStyles: { ...tableTheme.headStyles, fillColor: BRAND.dark },
    });

    addPageFooters(doc);
    return doc;
  }

  // Financial Summary PDF
  static generateFinancialSummaryPDF(data: {
    contributions: ContributionReportData[];
    disbursements: DisbursementReportData[];
    balances: BalanceReportData[];
    expenses: ExpenseReportData[];
    period: { startDate?: string; endDate?: string };
  }) {
    const doc = new jsPDF();
    const periodText = (data.period.startDate || data.period.endDate)
      ? `Period: ${data.period.startDate || 'All'} — ${data.period.endDate || 'All'}`
      : undefined;
    let y = addBrandedHeader(doc, 'COMPREHENSIVE FINANCIAL SUMMARY', periodText);

    const totalContributions = data.contributions.reduce((s, c) => s + c.amount, 0);
    const totalDisbursements = data.disbursements.reduce((s, d) => s + d.amount, 0);
    const totalExpenses = data.expenses.reduce((s, e) => s + e.amount, 0);
    const netPosition = totalContributions - totalDisbursements - totalExpenses;
    const totalBalance = data.balances.reduce((s, b) => s + b.current_balance, 0);
    const negativeBalances = data.balances.filter(b => b.current_balance < 0).length;
    const activeMembers = new Set(data.contributions.map(c => c.member_id)).size;
    const disbursementRatio = totalContributions > 0 ? (totalDisbursements / totalContributions * 100) : 0;
    const expenseRatio = totalContributions > 0 ? (totalExpenses / totalContributions * 100) : 0;
    const participationRate = data.balances.length > 0 ? (activeMembers / data.balances.length * 100) : 0;

    // Executive Summary
    y = addSummaryBox(doc, [
      ['Total Contributions', `KES ${totalContributions.toLocaleString()}`],
      ['Total Disbursements', `KES ${totalDisbursements.toLocaleString()}`],
      ['Total Expenses', `KES ${totalExpenses.toLocaleString()}`],
      ['Net Financial Position', `KES ${netPosition.toLocaleString()}`],
      ['Total Member Balances', `KES ${totalBalance.toLocaleString()}`],
      ['Active Members', activeMembers.toString()],
    ], y);

    // Health Indicators
    y = addSectionTitle(doc, 'FINANCIAL HEALTH INDICATORS', y);

    let riskScore = 100;
    if (disbursementRatio > 80) riskScore -= 20;
    if (expenseRatio > 10) riskScore -= 15;
    if (negativeBalances > data.balances.length * 0.1) riskScore -= 25;
    if (participationRate < 70) riskScore -= 20;

    let riskLevel = 'Low';
    if (riskScore < 50) riskLevel = 'High';
    else if (riskScore < 70) riskLevel = 'Medium';

    autoTable(doc, {
      startY: y,
      head: [['Indicator', 'Value', 'Status']],
      body: [
        ['Disbursement Ratio', `${disbursementRatio.toFixed(1)}%`, disbursementRatio > 80 ? '⚠ HIGH' : '✓ Normal'],
        ['Expense Ratio', `${expenseRatio.toFixed(1)}%`, expenseRatio > 10 ? '⚠ HIGH' : '✓ Normal'],
        ['Participation Rate', `${participationRate.toFixed(1)}%`, participationRate < 70 ? '⚠ LOW' : '✓ Good'],
        ['Negative Balances', negativeBalances.toString(), negativeBalances > 0 ? '⚠ REVIEW' : '✓ None'],
        ['Overall Risk Score', `${riskScore}/100`, riskLevel],
      ],
      ...tableTheme,
      headStyles: { ...tableTheme.headStyles, fillColor: BRAND.secondary },
    });

    // Recommendations
    y = (doc as any).lastAutoTable.finalY + 8;
    y = checkPageBreak(doc, y);
    y = addSectionTitle(doc, 'RECOMMENDATIONS', y);

    const recommendations: string[] = [];
    if (disbursementRatio > 80) recommendations.push('Monitor high disbursement ratio — consider tighter controls');
    if (expenseRatio > 10) recommendations.push('Review and optimize operating expenses');
    if (negativeBalances > 0) recommendations.push('Address negative member balances urgently');
    if (participationRate < 80) recommendations.push('Implement strategies to improve member participation');
    if (recommendations.length === 0) recommendations.push('All indicators healthy — continue current practices');

    autoTable(doc, {
      startY: y,
      head: [['#', 'Recommendation']],
      body: recommendations.map((r, i) => [(i + 1).toString(), r]),
      ...tableTheme,
      headStyles: { ...tableTheme.headStyles, fillColor: BRAND.secondary },
    });

    addPageFooters(doc);
    return doc;
  }

  // Member Activity PDF
  static generateMemberActivityPDF(data: {
    contributions: ContributionReportData[];
    disbursements: DisbursementReportData[];
    balances: BalanceReportData[];
    period: { startDate?: string; endDate?: string };
  }) {
    const doc = new jsPDF();
    let y = addBrandedHeader(doc, 'MEMBER ACTIVITY REPORT');

    const activeMembers = new Set(data.contributions.map(c => c.member_id)).size;
    const totalMembers = data.balances.length;
    const avgContribution = data.contributions.length > 0
      ? data.contributions.reduce((s, c) => s + c.amount, 0) / data.contributions.length : 0;

    y = addSummaryBox(doc, [
      ['Total Registered Members', totalMembers.toString()],
      ['Active Contributors', activeMembers.toString()],
      ['Participation Rate', `${totalMembers > 0 ? (activeMembers / totalMembers * 100).toFixed(1) : 0}%`],
      ['Avg Contribution per Transaction', `KES ${Math.round(avgContribution).toLocaleString()}`],
    ], y);

    // Top contributors
    const contributorActivity = new Map<string, { contributions: number; amount: number }>();
    data.contributions.forEach(c => {
      const cur = contributorActivity.get(c.member_name) || { contributions: 0, amount: 0 };
      contributorActivity.set(c.member_name, { contributions: cur.contributions + 1, amount: cur.amount + c.amount });
    });

    const topContributors = Array.from(contributorActivity.entries())
      .sort((a, b) => b[1].amount - a[1].amount).slice(0, 10);

    y = addSectionTitle(doc, 'TOP CONTRIBUTORS', y);

    autoTable(doc, {
      startY: y,
      head: [['Rank', 'Member Name', 'Total Amount (KES)', 'Transactions']],
      body: topContributors.map(([name, stats], i) => [
        (i + 1).toString(), name, `KES ${stats.amount.toLocaleString()}`, stats.contributions.toString(),
      ]),
      ...tableTheme,
    });

    addPageFooters(doc);
    return doc;
  }

  // Compliance PDF
  static generateCompliancePDF(data: {
    contributions: ContributionReportData[];
    disbursements: DisbursementReportData[];
    auditTrail: AuditTrailData[];
    period: { startDate?: string; endDate?: string };
  }) {
    const doc = new jsPDF();
    let y = addBrandedHeader(doc, 'COMPLIANCE AUDIT REPORT');

    const confirmedContributions = data.contributions.filter(c => c.status === 'confirmed').length;
    const approvedDisbursements = data.disbursements.filter(d => d.status === 'approved').length;
    const pendingContributions = data.contributions.filter(c => c.status === 'pending').length;
    const pendingDisbursements = data.disbursements.filter(d => d.status === 'pending').length;

    const complianceScore = (
      (data.contributions.length > 0 ? confirmedContributions / data.contributions.length * 25 : 25) +
      (data.disbursements.length > 0 ? approvedDisbursements / data.disbursements.length * 25 : 25) +
      (data.auditTrail.length > 0 ? 25 : 0) + 25
    );

    y = addSummaryBox(doc, [
      ['Overall Compliance Score', `${complianceScore.toFixed(0)}/100`],
      ['Confirmed Contributions', `${confirmedContributions}/${data.contributions.length}`],
      ['Approved Disbursements', `${approvedDisbursements}/${data.disbursements.length}`],
      ['Audit Trail Records', data.auditTrail.length.toString()],
    ], y, complianceScore >= 80 ? BRAND.secondary : BRAND.danger);

    y = addSectionTitle(doc, 'COMPLIANCE ASSESSMENT', y);

    autoTable(doc, {
      startY: y,
      head: [['Area', 'Status', 'Score', 'Notes']],
      body: [
        ['Contribution Verification', confirmedContributions === data.contributions.length ? 'PASS' : 'REVIEW', `${data.contributions.length > 0 ? (confirmedContributions / data.contributions.length * 100).toFixed(0) : 100}%`, `${pendingContributions} pending`],
        ['Disbursement Approval', approvedDisbursements === data.disbursements.length ? 'PASS' : 'REVIEW', `${data.disbursements.length > 0 ? (approvedDisbursements / data.disbursements.length * 100).toFixed(0) : 100}%`, `${pendingDisbursements} pending`],
        ['Audit Logging', data.auditTrail.length > 0 ? 'PASS' : 'FAIL', data.auditTrail.length > 0 ? '100%' : '0%', `${data.auditTrail.length} records`],
      ],
      ...tableTheme,
      headStyles: { ...tableTheme.headStyles, fillColor: BRAND.secondary },
    });

    addPageFooters(doc);
    return doc;
  }

  // Risk Assessment PDF
  static generateRiskAssessmentPDF(data: {
    contributions: ContributionReportData[];
    disbursements: DisbursementReportData[];
    balances: BalanceReportData[];
    expenses: ExpenseReportData[];
    period: { startDate?: string; endDate?: string };
  }) {
    const doc = new jsPDF();
    let y = addBrandedHeader(doc, 'RISK ASSESSMENT REPORT');

    const totalContributions = data.contributions.reduce((s, c) => s + c.amount, 0);
    const totalDisbursements = data.disbursements.reduce((s, d) => s + d.amount, 0);
    const totalExpenses = data.expenses.reduce((s, e) => s + e.amount, 0);
    const negativeBalances = data.balances.filter(b => b.current_balance < 0);

    const riskFactors = {
      financialRatio: totalContributions > 0 ? (totalDisbursements + totalExpenses) / totalContributions : 0,
      negativeBalanceRatio: data.balances.length > 0 ? negativeBalances.length / data.balances.length : 0,
      largeTransactions: data.disbursements.filter(d => d.amount > 50000).length,
      pendingItems: data.contributions.filter(c => c.status === 'pending').length + data.disbursements.filter(d => d.status === 'pending').length,
    };

    let riskScore = 0;
    if (riskFactors.financialRatio > 0.9) riskScore += 30;
    else if (riskFactors.financialRatio > 0.7) riskScore += 15;
    if (riskFactors.negativeBalanceRatio > 0.2) riskScore += 25;
    else if (riskFactors.negativeBalanceRatio > 0.1) riskScore += 10;
    if (riskFactors.largeTransactions > 5) riskScore += 20;
    if (riskFactors.pendingItems > 10) riskScore += 15;

    let riskLevel = 'LOW';
    let riskColor = BRAND.secondary;
    if (riskScore > 60) { riskLevel = 'HIGH'; riskColor = BRAND.danger; }
    else if (riskScore > 30) { riskLevel = 'MEDIUM'; riskColor = BRAND.accent; }

    y = addSummaryBox(doc, [
      ['Risk Score', `${riskScore}/100 — ${riskLevel}`],
      ['Financial Outflow Ratio', `${(riskFactors.financialRatio * 100).toFixed(1)}%`],
      ['Negative Balance Rate', `${(riskFactors.negativeBalanceRatio * 100).toFixed(1)}%`],
      ['Large Transactions (>50K)', riskFactors.largeTransactions.toString()],
      ['Pending Items', riskFactors.pendingItems.toString()],
    ], y, riskColor);

    y = addSectionTitle(doc, 'RISK ANALYSIS', y);

    autoTable(doc, {
      startY: y,
      head: [['Risk Factor', 'Value', 'Threshold', 'Status']],
      body: [
        ['Financial Outflow', `${(riskFactors.financialRatio * 100).toFixed(1)}%`, '< 90%', riskFactors.financialRatio > 0.9 ? '⚠ EXCEEDED' : '✓ OK'],
        ['Negative Balances', `${(riskFactors.negativeBalanceRatio * 100).toFixed(1)}%`, '< 20%', riskFactors.negativeBalanceRatio > 0.2 ? '⚠ EXCEEDED' : '✓ OK'],
        ['Large Transactions', riskFactors.largeTransactions.toString(), '< 5', riskFactors.largeTransactions > 5 ? '⚠ EXCEEDED' : '✓ OK'],
        ['Pending Items', riskFactors.pendingItems.toString(), '< 10', riskFactors.pendingItems > 10 ? '⚠ EXCEEDED' : '✓ OK'],
      ],
      ...tableTheme,
      headStyles: { ...tableTheme.headStyles, fillColor: riskColor },
    });

    // Recommendations
    y = (doc as any).lastAutoTable.finalY + 8;
    y = checkPageBreak(doc, y);
    y = addSectionTitle(doc, 'RISK MITIGATION RECOMMENDATIONS', y);

    const recommendations: string[] = [];
    if (riskFactors.financialRatio > 0.8) recommendations.push('Monitor cash flow closely and reduce unnecessary outflows');
    if (riskFactors.negativeBalanceRatio > 0.1) recommendations.push('Address negative member balances through recovery program');
    if (riskFactors.largeTransactions > 3) recommendations.push('Implement additional approval layers for large transactions');
    if (riskFactors.pendingItems > 5) recommendations.push('Clear pending items promptly to maintain compliance');
    if (recommendations.length === 0) recommendations.push('Continue monitoring current risk levels — no immediate action required');

    autoTable(doc, {
      startY: y,
      head: [['#', 'Recommendation']],
      body: recommendations.map((r, i) => [(i + 1).toString(), r]),
      ...tableTheme,
      headStyles: { ...tableTheme.headStyles, fillColor: riskColor },
    });

    addPageFooters(doc);
    return doc;
  }

  // Treasury Summary PDF
  static generateTreasurySummaryPDF(data: {
    contributions: ContributionReportData[];
    disbursements: DisbursementReportData[];
    balances: BalanceReportData[];
    expenses: ExpenseReportData[];
    period: { startDate?: string; endDate?: string };
  }) {
    const doc = new jsPDF();
    let y = addBrandedHeader(doc, 'TREASURY SUMMARY REPORT', 'Prepared for: Treasurer Review');

    const totalContributions = data.contributions.reduce((s, c) => s + c.amount, 0);
    const totalDisbursements = data.disbursements.reduce((s, d) => s + d.amount, 0);
    const totalExpenses = data.expenses.reduce((s, e) => s + e.amount, 0);
    const netCashFlow = totalContributions - totalDisbursements - totalExpenses;
    const totalMemberBalances = data.balances.reduce((s, b) => s + b.current_balance, 0);

    y = addSummaryBox(doc, [
      ['Total Contributions Received', `KES ${totalContributions.toLocaleString()}`],
      ['Total Disbursements Made', `KES ${totalDisbursements.toLocaleString()}`],
      ['Total Operating Expenses', `KES ${totalExpenses.toLocaleString()}`],
      ['Net Cash Flow', `KES ${netCashFlow.toLocaleString()}`],
      ['Total Member Account Balances', `KES ${totalMemberBalances.toLocaleString()}`],
    ], y, netCashFlow >= 0 ? BRAND.secondary : BRAND.danger);

    // KPIs
    const disbursementRatio = totalContributions > 0 ? (totalDisbursements / totalContributions * 100) : 0;
    const expenseRatio = totalContributions > 0 ? (totalExpenses / totalContributions * 100) : 0;
    const activeMembers = new Set(data.contributions.map(c => c.member_id)).size;
    const avgContribution = activeMembers > 0 ? totalContributions / activeMembers : 0;

    y = addSectionTitle(doc, 'KEY PERFORMANCE INDICATORS', y);

    autoTable(doc, {
      startY: y,
      head: [['Indicator', 'Value', 'Benchmark', 'Status']],
      body: [
        ['Disbursement Ratio', `${disbursementRatio.toFixed(1)}%`, '< 80%', disbursementRatio > 80 ? '⚠ HIGH' : '✓ Healthy'],
        ['Expense Ratio', `${expenseRatio.toFixed(1)}%`, '< 10%', expenseRatio > 10 ? '⚠ HIGH' : '✓ Healthy'],
        ['Active Members', activeMembers.toString(), '-', '-'],
        ['Avg Contribution per Member', `KES ${Math.round(avgContribution).toLocaleString()}`, '-', '-'],
        ['Member Balances Total', `KES ${totalMemberBalances.toLocaleString()}`, '-', totalMemberBalances >= 0 ? '✓ Positive' : '⚠ Negative'],
      ],
      ...tableTheme,
      headStyles: { ...tableTheme.headStyles, fillColor: BRAND.secondary },
    });

    addPageFooters(doc);
    return doc;
  }
}
