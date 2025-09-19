import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, File, FileSpreadsheet, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Interfaces
interface MemberRegistration {
  id: string;
  first_name: string;
  last_name: string;
  tns_number: string;
  pending: string;
}

interface StaffRegistration {
  id: string;
  first_name: string;
  last_name: string;
  staff_role: string;
  pending: string;
}

interface MPESAPayment {
  id: string;
  amount: number;
  mpesa_receipt_number: string;
  status: string;
  created_at: string;
  membership_registrations?: {
    first_name: string;
    last_name: string;
    tns_number: string;
  };
}

interface Contribution {
  id: string;
  amount: number;
  created_at: string;
}

interface Disbursement {
  id: string;
  amount: number;
  created_at: string;
}

interface MonthlyExpense {
  id: string;
  expense_type: string;
  amount: number;
  created_at: string;
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

  // Treasurer filters
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
        if (
          staffUser.staff_role === "Admin" ||
          staffUser.staff_role === "Treasurer"
        ) {
          fetchData();
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
        fetchData();
      }
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/portal-login");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: memberData }, { data: staffData }, { data: paymentsData }] =
        await Promise.all([
          supabase.from("membership_registrations").select("*"),
          supabase.from("staff_registrations").select("*"),
          supabase
            .from("mpesa_payments")
            .select("*, membership_registrations(first_name,last_name,tns_number)"),
        ]);

      setAllMembers(memberData || []);
      setPendingMembers(memberData?.filter((m) => m.pending === "pending") || []);

      setAllStaff(staffData || []);
      setPendingStaff(staffData?.filter((s) => s.pending === "pending") || []);

      setMpesaPayments(paymentsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load portal data");
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

  // Export filtered payments
  const handleFilteredPaymentsExport = (format: "csv" | "excel" | "pdf") => {
    try {
      if (filteredPayments.length === 0) {
        toast.error("No payments to export with current filters");
        return;
      }

      toast.loading("Generating " + format.toUpperCase() + " export...");

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
        const totalAmount = filteredPayments.reduce(
          (sum, p) => sum + Number(p.amount),
          0
        );
        const statusTotals = filteredPayments.reduce((acc, p) => {
          if (!acc[p.status]) acc[p.status] = { count: 0, amount: 0 };
          acc[p.status].count += 1;
          acc[p.status].amount += Number(p.amount);
          return acc;
        }, {} as Record<string, { count: number; amount: number }>);

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
              staffUser
                ? staffUser.first_name + " " + staffUser.last_name
                : "Admin"
            }</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>

            <table>
              <thead>
                <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
              </thead>
              <tbody>
                ${rows
                  .map(
                    (r) => `<tr>${r.map((cell) => `<td>${cell}</td>`).join("")}</tr>`
                  )
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
      const extension =
        format === "excel" ? "xls" : format === "pdf" ? "html" : "csv";
      a.href = url;
      a.download = "filtered_payments_" + date + "." + extension;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Export downloaded!");
    } catch (error) {
      console.error("Filtered export error:", error);
      toast.error("Failed to export file");
    }
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
      <div className="max-w-6xl mx-auto">
        <Tabs defaultValue="treasurer">
          <TabsList>
            <TabsTrigger value="treasurer">Treasurer</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
          </TabsList>

          {/* Treasurer Tab */}
          <TabsContent value="treasurer">
            <Card>
              <CardHeader>
                <CardTitle>MPESA Payments</CardTitle>
                <CardDescription>All member contributions</CardDescription>
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
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
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
                  <Button
                    onClick={() => handleFilteredPaymentsExport("csv")}
                    variant="outline"
                    size="sm"
                  >
                    <File className="h-4 w-4 mr-2" /> Export CSV
                  </Button>
                  <Button
                    onClick={() => handleFilteredPaymentsExport("excel")}
                    variant="outline"
                    size="sm"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" /> Export Excel
                  </Button>
                  <Button
                    onClick={() => handleFilteredPaymentsExport("pdf")}
                    variant="outline"
                    size="sm"
                  >
                    <FileText className="h-4 w-4 mr-2" /> Export PDF
                  </Button>
                </div>

                {/* Payments Table */}
                {filteredPayments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No MPESA payments found
                  </div>
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
                          <TableCell>
                            {payment.membership_registrations?.tns_number || "N/A"}
                          </TableCell>
                          <TableCell>
                            KSH {payment.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {payment.mpesa_receipt_number || "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                payment.status === "completed"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(
                              payment.created_at
                            ).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>Members</CardTitle>
                <CardDescription>All registered members</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Total Members: {allMembers.length}</p>
                <p>Pending Members: {pendingMembers.length}</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Tab */}
          <TabsContent value="staff">
            <Card>
              <CardHeader>
                <CardTitle>Staff</CardTitle>
                <CardDescription>All registered staff</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Total Staff: {allStaff.length}</p>
                <p>Pending Staff: {pendingStaff.length}</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPortal;
