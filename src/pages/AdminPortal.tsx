import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Users, UserCheck, UserX, Shield, Key, LogOut, File, FileSpreadsheet, FileText, BarChart3, PieChart, DollarSign, TrendingUp, Calculator } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { PieChart as RechartsPieChart, Pie, BarChart, Bar, XAxis, YAxis } from "recharts";
import { ManualPaymentEntry } from "@/components/ManualPaymentEntry";

interface MemberRegistration {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  membership_type: string;
  registration_status: string;
  payment_status: string;
  registration_date: string;
  tns_number?: string;
  profile_picture_url?: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  id_number?: string;
  alternative_phone?: string;
  sex?: string;
  marital_status?: string;
  maturity_status?: string;
  days_to_maturity?: number;
  probation_end_date?: string;
}

interface StaffRegistration {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  staff_role: string;
  assigned_area?: string;
  pending: string;
  created_at: string;
}

interface MPESAPayment {
  id: string;
  member_id: string;
  amount: number;
  phone_number: string;
  mpesa_receipt_number?: string;
  checkout_request_id?: string;
  transaction_date?: string;
  status: string;
  created_at: string;
  membership_registrations?: {
    first_name: string;
    last_name: string;
    tns_number?: string;
    email: string;
  } | null;
}

interface Contribution {
  id: string;
  member_id: string;
  amount: number;
  contribution_date: string;
  contribution_type: string;
  status: string;
}

interface Disbursement {
  id: string;
  member_id: string;
  amount: number;
  disbursement_date: string;
  reason?: string;
  status: string;
}

interface MonthlyExpense {
  id: string;
  amount: number;
  expense_date: string;
  expense_category: string;
  description?: string;
  month_year: string;
}

const AdminPortal = () => {
  const { user } = useAuth();
  const { staffUser, logout: staffLogout } = useStaffAuth();
  const navigate = useNavigate();

  const [pendingMembers, setPendingMembers] = useState<MemberRegistration[]>([]);
  const [allMembers, setAllMembers] = useState<MemberRegistration[]>([]);
  const [pendingStaff, setPendingStaff] = useState<StaffRegistration[]>([]);
  const [allStaff, setAllStaff] = useState<StaffRegistration[]>([]);
  const [mpesaPayments, setMpesaPayments] = useState<MPESAPayment[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<StaffRegistration | null>(null);
  const [portalPassword, setPortalPassword] = useState("");
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  // 🔎 Treasurer filters
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (!user && !staffUser) {
      navigate("/portal-login");
      return;
    }
    checkAdminAccess();
  }, [user, staffUser, navigate]);

  const checkAdminAccess = async () => {
    try {
      if (staffUser) {
        if (staffUser.staff_role === "Admin" || staffUser.staff_role === "Treasurer") {
          fetchPendingRegistrations();
          return;
        } else {
          toast.error("Access denied. Admin or Treasurer privileges required.");
          navigate("/portal-login");
          return;
        }
      }
      if (user) {
        const { data: staffData, error } = await supabase
          .from("staff_registrations")
          .select("*")
          .eq("user_id", user.id)
          .eq("staff_role", "Admin")
          .eq("pending", "approved")
          .single();

        if (error) {
          toast.error("Access denied. Admin privileges required.");
          navigate("/dashboard");
          return;
        }
        fetchPendingRegistrations();
      }
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate(staffUser ? "/portal-login" : "/dashboard");
    }
  };

  const fetchPendingRegistrations = async () => {
    setLoading(true);
    try {
      // Fetching members, staff, payments, etc. (same as before)
      // ...
    } catch (error) {
      console.error("Error fetching registrations:", error);
      toast.error("Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  // Treasurer filtered payments
  const filteredPayments = mpesaPayments.filter((payment) => {
    const memberName = `${payment.membership_registrations?.first_name || ""} ${payment.membership_registrations?.last_name || ""}`.toLowerCase();
    const tns = (payment.membership_registrations?.tns_number || "").toLowerCase();
    const receipt = (payment.mpesa_receipt_number || "").toLowerCase();
    const statusMatch = statusFilter ? payment.status === statusFilter : true;
    const searchMatch =
      memberName.includes(searchQuery.toLowerCase()) ||
      tns.includes(searchQuery.toLowerCase()) ||
      receipt.includes(searchQuery.toLowerCase());
    const paymentDate = new Date(payment.created_at);
    const startMatch = startDate ? paymentDate >= new Date(startDate) : true;
    const endMatch = endDate ? paymentDate <= new Date(endDate) : true;
    return statusMatch && searchMatch && startMatch && endMatch;
  });

  // 🔧 Export filtered payments
  const handleFilteredPaymentsExport = (format: "csv" | "excel" | "pdf") => {
    try {
      if (filteredPayments.length === 0) {
        toast.error("No payments to export with current filters");
        return;
      }

      toast.loading("Generating filtered " + format.toUpperCase() + " export...");

      const headers = ["Member", "TNS Number", "Amount", "Receipt", "Status", "Date"];
      const rows = filteredPayments.map((payment) => [
        `${payment.membership_registrations?.first_name || ""} ${payment.membership_registrations?.last_name || ""}`,
        payment.membership_registrations?.tns_number || "N/A",
        payment.amount,
        payment.mpesa_receipt_number || "N/A",
        payment.status,
        new Date(payment.created_at).toLocaleDateString(),
      ]);

      let content = "";
      if (format === "csv" || format === "excel") {
        content = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      } else if (format === "pdf") {
        const totalAmount = filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        const statusTotals = filteredPayments.reduce((acc, p) => {
          if (!acc[p.status]) acc[p.status] = { count: 0, amount: 0 };
          acc[p.status].count += 1;
          acc[p.status].amount += Number(p.amount);
          return acc;
        }, {} as Record<string, { count: number; amount: number }>);

        // Generate chart image with QuickChart
        const chartData = {
          labels: ["Completed", "Pending", "Failed"],
          datasets: [
            {
              data: [
                statusTotals["completed"]?.count || 0,
                statusTotals["pending"]?.count || 0,
                statusTotals["failed"]?.count || 0,
              ],
              backgroundColor: ["#4CAF50", "#FFC107", "#F44336"],
            },
          ],
        };
        const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(
          JSON.stringify({
            type: "pie",
            data: chartData,
            options: { plugins: { legend: { position: "bottom" } } },
          })
        )}`;
        const chartImgTag = `<img src="${chartUrl}" alt="Status Chart" style="max-width:400px; display:block; margin:20px auto;" />`;

        content = `
          <html>
          <head>
            <meta charset="utf-8" />
            <title>Filtered MPESA Payments Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { text-align: center; color: #333; }
              p { font-size: 14px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ccc; padding: 8px; font-size: 13px; text-align: left; }
              th { background-color: #f4f4f4; }
              tfoot td { font-weight: bold; }
              .summary { margin-top: 30px; }
              .summary h2 { font-size: 18px; margin-bottom: 10px; text-align: center; }
              .summary table { width: 60%; margin: 0 auto; border-collapse: collapse; }
              .summary th, .summary td { border: 1px solid #ccc; padding: 6px; font-size: 13px; }
              .summary th { background-color: #f9f9f9; text-align: left; }
            </style>
          </head>
          <body>
            <h1>Team No Struggle - MPESA Payments Report</h1>
            <p><strong>Generated by:</strong> ${
              staffUser ? staffUser.first_name + " " + staffUser.last_name : "Admin"
            }</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>

            <table>
              <thead>
                <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
              </thead>
              <tbody>
                ${rows
                  .map((r) => `<tr>${r.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
                  .join("")}
              </tbody>
              <tfoot>
                <tr><td colspan="2">Total Transactions</td><td colspan="4">${
                  filteredPayments.length
                }</td></tr>
                <tr><td colspan="2">Total Amount</td><td colspan="4">KES ${totalAmount.toLocaleString()}</td></tr>
              </tfoot>
            </table>

            <div class="summary">
              <h2>Status Distribution Chart</h2>
              ${chartImgTag}
            </div>

            <div class="summary">
              <h2>Breakdown by Status</h2>
              <table>
                <thead>
                  <tr><th>Status</th><th>Count</th><th>Total Amount (KES)</th></tr>
                </thead>
                <tbody>
                  <tr><td>Completed</td><td>${statusTotals["completed"]?.count || 0}</td><td>${statusTotals["completed"]?.amount.toLocaleString() || 0}</td></tr>
                  <tr><td>Pending</td><td>${statusTotals["pending"]?.count || 0}</td><td>${statusTotals["pending"]?.amount.toLocaleString() || 0}</td></tr>
                  <tr><td>Failed</td><td>${statusTotals["failed"]?.count || 0}</td><td>${statusTotals["failed"]?.amount.toLocaleString() || 0}</td></tr>
                </tbody>
              </table>
            </div>
          </body>
          </html>
        `;
      }

      const blob = new Blob([content], {
        type: format === "pdf" ? "text/html" : "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().split("T")[0];
      const extension = format === "excel" ? "xls" : format === "pdf" ? "html" : "csv";
      a.href = url;
      a.download = "filtered_payments_" + date + "." + extension;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Filtered " + format.toUpperCase() + " export downloaded!");
    } catch (error) {
      console.error("Filtered export error:", error);
      toast.error("Failed to export filtered " + format.toUpperCase() + " file");
    }
  };

  // ... (keep rest of component logic unchanged, e.g. approve/reject member/staff, treasurer summary, charts, etc.)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* ... other Tabs ... */}

        {/* Treasurer Tab */}
        <TabsContent value="treasurer">
          <div className="grid gap-6">
            {/* ... summary cards ... */}

            {/* MPESA Payments with filters + export */}
            <Card>
              <CardHeader>
                <CardTitle>MPESA Payments</CardTitle>
                <CardDescription>All MPESA payment transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-4">
                  <Input
                    type="text"
                    placeholder="Search by member, TNS, or receipt..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border rounded px-2 py-1"
                  >
                    <option value="">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                {/* Export buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button onClick={() => handleFilteredPaymentsExport("csv")} variant="outline" size="sm">
                    <File className="h-4 w-4 mr-2" /> Export CSV
                  </Button>
                  <Button onClick={() => handleFilteredPaymentsExport("excel")} variant="outline" size="sm">
                    <FileSpreadsheet className="h-4 w-4 mr-2" /> Export Excel
                  </Button>
                  <Button onClick={() => handleFilteredPaymentsExport("pdf")} variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" /> Export PDF
                  </Button>
                </div>

                {/* Payments Table */}
                {filteredPayments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No MPESA payments found</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>TNS Number</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Receipt</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.slice(0, 10).map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {payment.membership_registrations?.first_name}{" "}
                            {payment.membership_registrations?.last_name}
                          </TableCell>
                          <TableCell>{payment.membership_registrations?.tns_number || "N/A"}</TableCell>
                          <TableCell>KSH {payment.amount.toLocaleString()}</TableCell>
                          <TableCell>{payment.mpesa_receipt_number || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant={payment.status === "completed" ? "default" : "secondary"}>
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </div>
    </div>
  );
};

export default AdminPortal;
