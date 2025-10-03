import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { 
  Download, 
  FileText, 
  PieChart, 
  BarChart3, 
  Calendar as CalendarIcon,
  Filter,
  Printer,
  Mail,
  Share,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'financial' | 'member' | 'compliance' | 'custom';
  includes: string[];
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'custom';
  lastGenerated?: string;
  icon: any;
}

interface GeneratedReport {
  id: string;
  name: string;
  type: string;
  generatedDate: string;
  generatedBy: string;
  status: 'generating' | 'completed' | 'failed';
  fileSize?: string;
  downloadUrl?: string;
  summary: {
    totalRecords: number;
    dateRange: string;
    keyFindings: string[];
  };
}

export const AuditReports = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState("templates");
  const [selectedReportTypes, setSelectedReportTypes] = useState<string[]>([]);

  const reportTemplates: ReportTemplate[] = [
    {
      id: "financial-summary",
      name: "Financial Summary Report",
      description: "Comprehensive overview of all financial activities including contributions, disbursements, and balances",
      type: "financial",
      includes: ["Contributions", "Disbursements", "Member Balances", "Monthly Expenses", "Budget Analysis"],
      frequency: "monthly",
      lastGenerated: "2024-01-20",
      icon: PieChart
    },
    {
      id: "member-activity",
      name: "Member Activity Report",
      description: "Detailed analysis of member participation, contributions, and account status",
      type: "member",
      includes: ["Member Registration", "Contribution History", "Disbursement History", "Account Status"],
      frequency: "monthly",
      lastGenerated: "2024-01-19",
      icon: BarChart3
    },
    {
      id: "compliance-audit",
      name: "Compliance Audit Report",
      description: "Regulatory compliance check including documentation, approvals, and audit trail",
      type: "compliance",
      includes: ["Approval Workflows", "Documentation", "Regulatory Compliance", "Risk Assessment"],
      frequency: "quarterly",
      lastGenerated: "2024-01-01",
      icon: CheckCircle
    },
    {
      id: "risk-assessment",
      name: "Risk Assessment Report",
      description: "Analysis of potential risks including discrepancies, unusual patterns, and compliance issues",
      type: "compliance",
      includes: ["Balance Discrepancies", "Unusual Transactions", "Compliance Violations", "Risk Metrics"],
      frequency: "weekly",
      lastGenerated: "2024-01-18",
      icon: AlertTriangle
    },
    {
      id: "treasurer-summary",
      name: "Treasurer Summary",
      description: "Executive summary for treasurer review including key metrics and recommendations",
      type: "financial",
      includes: ["Key Metrics", "Trends", "Recommendations", "Action Items"],
      frequency: "monthly",
      lastGenerated: "2024-01-15",
      icon: TrendingUp
    },
    {
      id: "custom-report",
      name: "Custom Report",
      description: "Build your own report with selected data points and date ranges",
      type: "custom",
      includes: [],
      frequency: "custom",
      icon: FileText
    }
  ];

  // Mock generated reports data
  useEffect(() => {
    const mockReports: GeneratedReport[] = [
      {
        id: "1",
        name: "Financial Summary - January 2024",
        type: "financial-summary",
        generatedDate: "2024-01-20T10:30:00Z",
        generatedBy: "Auditor",
        status: "completed",
        fileSize: "2.3 MB",
        downloadUrl: "report_001.pdf",
        summary: {
          totalRecords: 1247,
          dateRange: "Jan 1 - Jan 31, 2024",
          keyFindings: [
            "Total contributions: KES 2,450,000",
            "Total disbursements: KES 890,000",
            "2 balance discrepancies identified",
            "Compliance rate: 95%"
          ]
        }
      },
      {
        id: "2",
        name: "Member Activity - January 2024",
        type: "member-activity",
        generatedDate: "2024-01-19T14:15:00Z",
        generatedBy: "Auditor",
        status: "completed",
        fileSize: "1.8 MB",
        downloadUrl: "report_002.pdf",
        summary: {
          totalRecords: 856,
          dateRange: "Jan 1 - Jan 31, 2024",
          keyFindings: [
            "145 active members",
            "Average contribution: KES 16,897",
            "98% participation rate",
            "3 new member registrations"
          ]
        }
      },
      {
        id: "3",
        name: "Risk Assessment - Weekly",
        type: "risk-assessment",
        generatedDate: "2024-01-18T09:00:00Z",
        generatedBy: "System",
        status: "completed",
        fileSize: "756 KB",
        downloadUrl: "report_003.pdf",
        summary: {
          totalRecords: 234,
          dateRange: "Jan 12 - Jan 18, 2024",
          keyFindings: [
            "Low risk level detected",
            "1 minor discrepancy found",
            "All approvals documented",
            "No compliance violations"
          ]
        }
      }
    ];
    
    setGeneratedReports(mockReports);
  }, []);

  const handleGenerateReport = async () => {
    if (!selectedTemplate) return;
    
    setLoading(true);
    
    // Simulate report generation
    setTimeout(() => {
      const template = reportTemplates.find(t => t.id === selectedTemplate);
      if (template) {
        const newReport: GeneratedReport = {
          id: `${Date.now()}`,
          name: `${template.name} - ${format(new Date(), 'MMMM yyyy')}`,
          type: template.id,
          generatedDate: new Date().toISOString(),
          generatedBy: "Current User",
          status: "completed",
          fileSize: "1.2 MB",
          downloadUrl: `report_${Date.now()}.pdf`,
          summary: {
            totalRecords: Math.floor(Math.random() * 1000) + 500,
            dateRange: dateRange.from && dateRange.to 
              ? `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd, yyyy')}`
              : "Last 30 days",
            keyFindings: [
              "Report generated successfully",
              "All data validated",
              "No critical issues found",
              "Ready for review"
            ]
          }
        };
        
        setGeneratedReports(prev => [newReport, ...prev]);
      }
      setLoading(false);
    }, 2000);
  };

  const handleDownloadReport = (reportId: string) => {
    console.log(`Downloading report: ${reportId}`);
    // Implementation would trigger actual download
  };

  const handleEmailReport = (reportId: string) => {
    console.log(`Emailing report: ${reportId}`);
    // Implementation would open email dialog or send automatically
  };

  const handleShareReport = (reportId: string) => {
    console.log(`Sharing report: ${reportId}`);
    // Implementation would generate shareable link
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      generating: { color: "bg-blue-500", text: "Generating" },
      completed: { color: "bg-green-500", text: "Completed" },
      failed: { color: "bg-red-500", text: "Failed" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  const getTypeColor = (type: string) => {
    const colors = {
      financial: "bg-blue-100 text-blue-800",
      member: "bg-green-100 text-green-800",
      compliance: "bg-orange-100 text-orange-800",
      custom: "bg-purple-100 text-purple-800"
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const quickDateRanges = [
    { label: "Last 7 days", range: { from: subDays(new Date(), 6), to: new Date() } },
    { label: "Last 30 days", range: { from: subDays(new Date(), 29), to: new Date() } },
    { label: "This month", range: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) } },
    { label: "Last month", range: { from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) } },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Audit Reports</h2>
          <p className="text-muted-foreground">Generate comprehensive reports for financial auditing and compliance</p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="templates">Report Templates</TabsTrigger>
          <TabsTrigger value="generated">Generated Reports ({generatedReports.length})</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates" className="space-y-6">
          {/* Report Generation Section */}
          <Card>
            <CardHeader>
              <CardTitle>Generate New Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Template Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportTemplates.map((template) => {
                  const Icon = template.icon;
                  return (
                    <Card 
                      key={template.id}
                      className={cn(
                        "cursor-pointer transition-all duration-200 hover:shadow-md",
                        selectedTemplate === template.id ? "ring-2 ring-primary" : ""
                      )}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <Icon className="w-8 h-8 text-primary mt-1" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm">{template.name}</h3>
                            <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                            <div className="flex items-center justify-between mt-3">
                              <Badge className={getTypeColor(template.type)}>
                                {template.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {template.frequency}
                              </span>
                            </div>
                            {template.lastGenerated && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Last: {format(new Date(template.lastGenerated), 'MMM dd, yyyy')}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Date Range Selection */}
              {selectedTemplate && (
                <div className="space-y-4">
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-3">Date Range</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {quickDateRanges.map((quick) => (
                        <Button
                          key={quick.label}
                          variant="outline"
                          size="sm"
                          onClick={() => setDateRange(quick.range)}
                        >
                          {quick.label}
                        </Button>
                      ))}
                    </div>
                    <div className="flex gap-4">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-40">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.from ? format(dateRange.from, 'MMM dd, yyyy') : 'From date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dateRange.from}
                            onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-40">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.to ? format(dateRange.to, 'MMM dd, yyyy') : 'To date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dateRange.to}
                            onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleGenerateReport}
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                      {loading ? 'Generating...' : 'Generate Report'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="generated" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generated Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {generatedReports.map((report) => (
                  <div key={report.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{report.name}</h3>
                          {getStatusBadge(report.status)}
                          <Badge variant="outline">{report.fileSize}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Generated: {format(new Date(report.generatedDate), 'MMM dd, yyyy HH:mm')} by {report.generatedBy}</p>
                          <p>Records: {report.summary.totalRecords.toLocaleString()} | Range: {report.summary.dateRange}</p>
                        </div>
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">Key Findings:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {report.summary.keyFindings.map((finding, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                {finding}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {report.status === 'completed' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDownloadReport(report.id)}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEmailReport(report.id)}
                            >
                              <Mail className="w-3 h-3 mr-1" />
                              Email
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleShareReport(report.id)}
                            >
                              <Share className="w-3 h-3 mr-1" />
                              Share
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {generatedReports.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No reports generated yet.</p>
                    <p className="text-sm">Go to Report Templates to generate your first report.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="scheduled" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Scheduled reports feature coming soon.</p>
                <p className="text-sm">Set up automatic report generation on custom schedules.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
