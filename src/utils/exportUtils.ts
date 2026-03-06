import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

// ─── Interfaces ────────────────────────────────────────────────────
export interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  tns_number?: string;
  maturity_status: string;
  days_to_maturity?: number;
  profile_picture_url?: string;
  address: string;
  zip_code: string;
  alternative_phone?: string;
  id_number?: string;
  sex?: string;
  marital_status?: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  membership_type: string;
  registration_status: string;
  payment_status: string;
  registration_date?: string;
  probation_end_date?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MemberBalance {
  current_balance: number;
  total_contributions: number;
  total_disbursements: number;
}

export interface Contribution {
  amount: number;
  contribution_date: string;
  contribution_type: string;
}

export interface ExportOptions {
  format: 'pdf' | 'excel';
  includeFinancialData: boolean;
  includeContributions: boolean;
  includeSummary: boolean;
  filterByArea?: string;
  customFileName?: string;
  reportTitle?: string;
}

export interface ExportData {
  members: Member[];
  balances: Record<string, MemberBalance>;
  contributions: Record<string, Contribution[]>;
  coordinatorName: string;
  assignedArea: string;
  exportDate: string;
}

// ─── Brand Colors ──────────────────────────────────────────────────
const BRAND = {
  primary: [15, 76, 117] as [number, number, number],
  secondary: [22, 160, 133] as [number, number, number],
  accent: [243, 156, 18] as [number, number, number],
  dark: [44, 62, 80] as [number, number, number],
  muted: [149, 165, 166] as [number, number, number],
  light: [236, 240, 241] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  altRow: [245, 248, 250] as [number, number, number],
};

// ─── Helpers ───────────────────────────────────────────────────────
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);
};

const formatDate = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'MMM dd, yyyy');
  } catch {
    return dateString;
  }
};

function addBrandedHeader(doc: jsPDF, title: string, subtitle?: string): number {
  const pageWidth = doc.internal.pageSize.width;

  doc.setFillColor(...BRAND.primary);
  doc.rect(0, 0, pageWidth, 4, 'F');

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND.primary);
  doc.text('ITUMBU WELFARE GROUP', pageWidth / 2, 20, { align: 'center' });

  doc.setDrawColor(...BRAND.secondary);
  doc.setLineWidth(0.5);
  doc.line(40, 25, pageWidth - 40, 25);

  doc.setFontSize(14);
  doc.setTextColor(...BRAND.dark);
  doc.text(title, pageWidth / 2, 34, { align: 'center' });

  let y = 40;
  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BRAND.muted);
    doc.text(subtitle, pageWidth / 2, y, { align: 'center' });
    y += 6;
  }

  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  doc.text(`Generated: ${format(new Date(), 'MMMM dd, yyyy • HH:mm')}`, pageWidth / 2, y, { align: 'center' });
  y += 4;

  doc.setDrawColor(...BRAND.light);
  doc.setLineWidth(0.3);
  doc.line(14, y, pageWidth - 14, y);

  doc.setTextColor(0, 0, 0);
  return y + 6;
}

function addPageFooters(doc: jsPDF) {
  const totalPages = doc.internal.pages.length - 1;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...BRAND.light);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 16, pageWidth - 14, pageHeight - 16);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...BRAND.muted);
    doc.text('CONFIDENTIAL — Itumbu Welfare Group Financial System', 14, pageHeight - 10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
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

const tableTheme = {
  headStyles: {
    fillColor: BRAND.primary as [number, number, number],
    textColor: BRAND.white as [number, number, number],
    fontSize: 8,
    fontStyle: 'bold' as const,
    halign: 'left' as const,
    cellPadding: 2.5,
  },
  bodyStyles: {
    fontSize: 7,
    cellPadding: 2,
    textColor: BRAND.dark as [number, number, number],
  },
  alternateRowStyles: {
    fillColor: BRAND.altRow as [number, number, number],
  },
  styles: {
    lineColor: BRAND.light as [number, number, number],
    lineWidth: 0.2,
  },
};

// ─── PDF Report ────────────────────────────────────────────────────
export const generatePDFReport = (data: ExportData, options: ExportOptions): void => {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const margin = 14;

  const title = options.reportTitle || 'Members Report';
  const subtitle = `Coordinator: ${data.coordinatorName} • Area: ${data.assignedArea}`;
  let y = addBrandedHeader(doc, title, subtitle);

  // Summary
  if (options.includeSummary) {
    const totalContributions = data.members.reduce((sum, m) =>
      sum + (data.balances[m.id]?.total_contributions || 0), 0);
    const averageContribution = data.members.length > 0 ? totalContributions / data.members.length : 0;
    const approvedMembers = data.members.filter(m => m.registration_status === 'approved').length;
    const matureMembers = data.members.filter(m => m.maturity_status === 'mature').length;
    const paidMembers = data.members.filter(m => m.payment_status === 'paid').length;

    y = addSectionTitle(doc, 'SUMMARY STATISTICS', y);

    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Value']],
      body: [
        ['Total Members', data.members.length.toString()],
        ['Approved Members', approvedMembers.toString()],
        ['Mature Members', matureMembers.toString()],
        ['Paid Members', paidMembers.toString()],
        ['Total Contributions', formatCurrency(totalContributions)],
        ['Average Contribution', formatCurrency(averageContribution)],
      ],
      ...tableTheme,
      headStyles: { ...tableTheme.headStyles, fillColor: BRAND.secondary },
      margin: { left: margin, right: margin },
      columnStyles: { 0: { fontStyle: 'bold' as const, cellWidth: 60 } },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Members Table
  if (y > doc.internal.pageSize.height - 60) {
    doc.addPage();
    y = 20;
  }

  y = addSectionTitle(doc, 'MEMBERS LIST', y);

  const memberHeaders = ['#', 'TNS #', 'Name', 'Location', 'Phone', 'Status', 'Maturity', 'Payment'];
  if (options.includeFinancialData) memberHeaders.push('Balance', 'Total Contributions');

  const memberTableData = data.members.map((member, i) => {
    const balance = data.balances[member.id];
    const row = [
      (i + 1).toString(),
      member.tns_number || 'N/A',
      `${member.first_name} ${member.last_name}`,
      `${member.city}, ${member.state}`,
      member.phone,
      member.registration_status,
      member.maturity_status,
      member.payment_status,
    ];
    if (options.includeFinancialData && balance) {
      row.push(formatCurrency(balance.current_balance), formatCurrency(balance.total_contributions));
    }
    return row;
  });

  autoTable(doc, {
    startY: y,
    head: [memberHeaders],
    body: memberTableData,
    ...tableTheme,
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { halign: 'center' as const, cellWidth: 10 },
      1: { halign: 'center' as const, cellWidth: 18 },
      2: { cellWidth: 35 },
    },
  });

  // Area-wise Summary
  if (!options.filterByArea || options.filterByArea === 'all') {
    const areaStats = new Map<string, {
      members: number; totalContributions: number; approvedMembers: number;
    }>();

    data.members.forEach(member => {
      const area = `${member.city}, ${member.state}`;
      const balance = data.balances[member.id];
      if (!areaStats.has(area)) areaStats.set(area, { members: 0, totalContributions: 0, approvedMembers: 0 });
      const stats = areaStats.get(area)!;
      stats.members++;
      stats.totalContributions += balance?.total_contributions || 0;
      if (member.registration_status === 'approved') stats.approvedMembers++;
    });

    if (areaStats.size > 1) {
      doc.addPage();
      let ay = 20;
      ay = addSectionTitle(doc, 'AREA-WISE SUMMARY', ay);

      autoTable(doc, {
        startY: ay,
        head: [['Area', 'Members', 'Approved', 'Total Contributions', 'Avg Contribution']],
        body: Array.from(areaStats.entries()).map(([area, stats]) => [
          area, stats.members.toString(), stats.approvedMembers.toString(),
          formatCurrency(stats.totalContributions),
          formatCurrency(stats.members > 0 ? stats.totalContributions / stats.members : 0),
        ]),
        ...tableTheme,
        headStyles: { ...tableTheme.headStyles, fillColor: BRAND.secondary },
        margin: { left: margin, right: margin },
      });
    }
  }

  addPageFooters(doc);

  const fileName = options.customFileName ||
    `TNS_Members_Report_${data.assignedArea.replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
};

// ─── Excel Report ──────────────────────────────────────────────────
export const generateExcelReport = (data: ExportData, options: ExportOptions): void => {
  const workbook = XLSX.utils.book_new();

  // Summary Sheet
  if (options.includeSummary) {
    const totalContributions = data.members.reduce((sum, m) =>
      sum + (data.balances[m.id]?.total_contributions || 0), 0);
    const averageContribution = data.members.length > 0 ? totalContributions / data.members.length : 0;
    const approvedMembers = data.members.filter(m => m.registration_status === 'approved').length;
    const matureMembers = data.members.filter(m => m.maturity_status === 'mature').length;
    const paidMembers = data.members.filter(m => m.payment_status === 'paid').length;

    const summaryData = [
      ['ITUMBU WELFARE GROUP'],
      [options.reportTitle || 'Members Report'],
      [''],
      ['Report Details', ''],
      ['Coordinator', data.coordinatorName],
      ['Area', data.assignedArea],
      ['Generated', data.exportDate],
      ['Filter Applied', options.filterByArea && options.filterByArea !== 'all' ? options.filterByArea : 'None'],
      [''],
      ['Summary Statistics', ''],
      ['Total Members', data.members.length],
      ['Approved Members', approvedMembers],
      ['Pending Members', data.members.length - approvedMembers],
      ['Mature Members', matureMembers],
      ['Paid Members', paidMembers],
      ['Total Contributions (KES)', totalContributions],
      ['Average Contribution (KES)', Math.round(averageContribution)],
      [''],
      [`Report generated by Itumbu Welfare Financial System on ${format(new Date(), 'PPpp')}`],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ width: 28 }, { width: 22 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  }

  // Members Sheet
  const memberHeaders = [
    'TNS Number', 'First Name', 'Last Name', 'Email', 'Phone', 'Alternative Phone',
    'City', 'State', 'Address', 'Zip Code', 'ID Number', 'Sex', 'Marital Status',
    'Emergency Contact Name', 'Emergency Contact Phone', 'Membership Type',
    'Registration Status', 'Payment Status', 'Maturity Status', 'Days to Maturity',
    'Registration Date',
    ...(options.includeFinancialData ? ['Current Balance (KES)', 'Total Contributions (KES)', 'Total Disbursements (KES)'] : []),
  ];

  const memberRows = data.members.map(member => {
    const balance = data.balances[member.id];
    const row: (string | number)[] = [
      member.tns_number || '', member.first_name, member.last_name, member.email,
      member.phone, member.alternative_phone || '', member.city, member.state,
      member.address, member.zip_code, member.id_number || '', member.sex || '',
      member.marital_status || '', member.emergency_contact_name, member.emergency_contact_phone,
      member.membership_type, member.registration_status, member.payment_status,
      member.maturity_status, member.days_to_maturity?.toString() || '',
      member.registration_date ? formatDate(member.registration_date) : '',
    ];
    if (options.includeFinancialData && balance) {
      row.push(balance.current_balance, balance.total_contributions, balance.total_disbursements);
    }
    return row;
  });

  const memberData = [
    ['ITUMBU WELFARE GROUP — Members Data'],
    [`Generated: ${format(new Date(), 'PPpp')}`],
    [],
    memberHeaders,
    ...memberRows,
  ];

  const memberSheet = XLSX.utils.aoa_to_sheet(memberData);
  const colWidths = memberHeaders.map(h => ({ width: Math.max(h.length + 2, 14) }));
  memberSheet['!cols'] = colWidths;
  XLSX.utils.book_append_sheet(workbook, memberSheet, 'Members');

  // Contributions Sheet
  if (options.includeContributions && Object.keys(data.contributions).length > 0) {
    const contribData: (string | number)[][] = [
      ['ITUMBU WELFARE GROUP — Contributions'],
      [`Generated: ${format(new Date(), 'PPpp')}`],
      [],
      ['TNS Number', 'Member Name', 'Contribution Date', 'Amount (KES)', 'Contribution Type'],
    ];
    data.members.forEach(member => {
      (data.contributions[member.id] || []).forEach(c => {
        contribData.push([
          member.tns_number || '', `${member.first_name} ${member.last_name}`,
          formatDate(c.contribution_date), c.amount, c.contribution_type,
        ]);
      });
    });
    const contribSheet = XLSX.utils.aoa_to_sheet(contribData);
    contribSheet['!cols'] = [{ width: 15 }, { width: 25 }, { width: 15 }, { width: 15 }, { width: 15 }];
    XLSX.utils.book_append_sheet(workbook, contribSheet, 'Contributions');
  }

  // Area Summary Sheet
  if (!options.filterByArea || options.filterByArea === 'all') {
    const areaStats = new Map<string, {
      members: number; totalContributions: number; approvedMembers: number;
      matureMembers: number; paidMembers: number; averageContribution: number;
    }>();

    data.members.forEach(member => {
      const area = `${member.city}, ${member.state}`;
      const balance = data.balances[member.id];
      if (!areaStats.has(area)) {
        areaStats.set(area, { members: 0, totalContributions: 0, averageContribution: 0, approvedMembers: 0, matureMembers: 0, paidMembers: 0 });
      }
      const stats = areaStats.get(area)!;
      stats.members++;
      stats.totalContributions += balance?.total_contributions || 0;
      if (member.registration_status === 'approved') stats.approvedMembers++;
      if (member.maturity_status === 'mature') stats.matureMembers++;
      if (member.payment_status === 'paid') stats.paidMembers++;
    });

    areaStats.forEach(stats => {
      stats.averageContribution = stats.members > 0 ? stats.totalContributions / stats.members : 0;
    });

    const areaData: (string | number)[][] = [
      ['ITUMBU WELFARE GROUP — Area Summary'],
      [`Generated: ${format(new Date(), 'PPpp')}`],
      [],
      ['Area', 'Total Members', 'Approved', 'Mature', 'Paid', 'Total Contributions (KES)', 'Average Contribution (KES)'],
    ];

    Array.from(areaStats.entries()).forEach(([area, stats]) => {
      areaData.push([area, stats.members, stats.approvedMembers, stats.matureMembers, stats.paidMembers, Math.round(stats.totalContributions), Math.round(stats.averageContribution)]);
    });

    const areaSheet = XLSX.utils.aoa_to_sheet(areaData);
    areaSheet['!cols'] = [{ width: 22 }, { width: 14 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 22 }, { width: 22 }];
    XLSX.utils.book_append_sheet(workbook, areaSheet, 'Area Summary');
  }

  const fileName = options.customFileName ||
    `TNS_Members_Report_${data.assignedArea.replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

// ─── Main Export Function ──────────────────────────────────────────
export const exportMembersData = (
  members: Member[],
  balances: Record<string, MemberBalance>,
  contributions: Record<string, Contribution[]>,
  coordinatorName: string,
  assignedArea: string,
  options: ExportOptions
): void => {
  const exportData: ExportData = {
    members, balances, contributions, coordinatorName, assignedArea,
    exportDate: format(new Date(), 'MMMM dd, yyyy HH:mm'),
  };
  if (options.format === 'pdf') {
    generatePDFReport(exportData, options);
  } else {
    generateExcelReport(exportData, options);
  }
};
