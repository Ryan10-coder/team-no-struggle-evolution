import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, ArrowLeft, DollarSign, Users, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuditSummary {
  totalMembers: number;
  totalContributions: number;
  totalDisbursements: number;
  monthlyExpenses: number;
  netPosition: number;
}

interface MonthlyData {
  month: string;
  members: number;
  contributions: number;
  disbursements: number;
  expenses: number;
}

const AuditorPortal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    fetchAuditData();
  }, [user, navigate]);

  const fetchAuditData = async () => {
    try {
      // Verify auditor role
      const { data: staffData, error: staffError } = await supabase
        .from("staff_registrations")
        .select("staff_role")
        .eq("user_id", user?.id)
        .eq("staff_role", "Auditor")
        .eq("pending", "approved")
        .single();

      if (staffError || !staffData) {
        toast.error("Access denied. You are not an approved auditor.");
        navigate("/dashboard");
        return;
      }

      // Fetch total members
      const { data: membersData } = await supabase
        .from("membership_registrations")
        .select("id", { count: "exact" })
        .eq("registration_status", "approved");

      // Fetch financial summary
      const { data: balancesData } = await supabase
        .from("member_balances")
        .select("total_contributions, total_disbursements, current_balance");

      // Fetch monthly expenses
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const { data: expensesData } = await supabase
        .from("monthly_expenses")
        .select("amount")
        .eq("month_year", currentMonth);

      // Calculate summary
      const totalContributions = balancesData?.reduce((sum, b) => sum + b.total_contributions, 0) || 0;
      const totalDisbursements = balancesData?.reduce((sum, b) => sum + b.total_disbursements, 0) || 0;
      const monthlyExpenses = expensesData?.reduce((sum, e) => sum + e.amount, 0) || 0;

      setSummary({
        totalMembers: membersData?.length || 0,
        totalContributions,
        totalDisbursements,
        monthlyExpenses,
        netPosition: totalContributions - totalDisbursements - monthlyExpenses
      });

      // Fetch monthly trend data
      await fetchMonthlyTrends();

    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while fetching audit data");
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyTrends = async () => {
    try {
      // Get last 12 months data
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        months.push(date.toISOString().slice(0, 7)); // YYYY-MM
      }

      const monthlyTrends: MonthlyData[] = [];

      for (const month of months) {
        // Get contributions for the month
        const { data: contributionsData } = await supabase
          .from("contributions")
          .select("amount")
          .gte("contribution_date", `${month}-01`)
          .lt("contribution_date", `${month}-32`);

        // Get disbursements for the month
        const { data: disbursementsData } = await supabase
          .from("disbursements")
          .select("amount")
          .gte("disbursement_date", `${month}-01`)
          .lt("disbursement_date", `${month}-32`);

        // Get expenses for the month
        const { data: expensesData } = await supabase
          .from("monthly_expenses")
          .select("amount")
          .eq("month_year", month);

        // Get member count at end of month
        const { data: membersData } = await supabase
          .from("membership_registrations")
          .select("id", { count: "exact" })
          .lte("registration_date", `${month}-31`)
          .eq("registration_status", "approved");

        monthlyTrends.push({
          month: new Date(month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          members: membersData?.length || 0,
          contributions: contributionsData?.reduce((sum, c) => sum + c.amount, 0) || 0,
          disbursements: disbursementsData?.reduce((sum, d) => sum + d.amount, 0) || 0,
          expenses: expensesData?.reduce((sum, e) => sum + e.amount, 0) || 0
        });
      }

      setMonthlyData(monthlyTrends);
    } catch (error) {
      console.error("Error fetching monthly trends:", error);
    }
  };

  const exportAuditReport = async () => {
    try {
      const response = await supabase.functions.invoke('export-audit-report', {
        body: {
          summary,
          monthlyData,
          generatedBy: user?.email,
          generatedAt: new Date().toISOString()
        }
      });

      if (response.error) {
        toast.error("Error generating audit report");
        return;
      }

      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TNS_Audit_Report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Audit report downloaded successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Error exporting audit report");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Auditor Portal</h1>
              <p className="text-muted-foreground">Financial oversight and reporting</p>
            </div>
          </div>
          <Button onClick={exportAuditReport} className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export Audit Report</span>
          </Button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalMembers}</div>
                <p className="text-xs text-muted-foreground">Active members</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Contributions</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary.totalContributions)}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Disbursements</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary.totalDisbursements)}</div>
                <p className="text-xs text-muted-foreground">Paid out</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary.monthlyExpenses)}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Position</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${summary.netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.netPosition)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.netPosition >= 0 ? 'Surplus' : 'Deficit'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Monthly Trends Table */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Financial Trends</CardTitle>
            <CardDescription>12-month historical overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Contributions</TableHead>
                    <TableHead>Disbursements</TableHead>
                    <TableHead>Expenses</TableHead>
                    <TableHead>Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData.map((data, index) => {
                    const net = data.contributions - data.disbursements - data.expenses;
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{data.month}</TableCell>
                        <TableCell>{data.members}</TableCell>
                        <TableCell className="text-green-600">
                          {formatCurrency(data.contributions)}
                        </TableCell>
                        <TableCell className="text-red-600">
                          {formatCurrency(data.disbursements)}
                        </TableCell>
                        <TableCell className="text-orange-600">
                          {formatCurrency(data.expenses)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={net >= 0 ? "default" : "destructive"}>
                            {formatCurrency(net)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuditorPortal;