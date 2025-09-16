import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Users, UserCheck, UserX, Shield, Key, LogOut, Download, FileSpreadsheet, FileText, File, BarChart3, PieChart, DollarSign, TrendingUp, Calculator } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from "recharts";

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

const AdminPortal = () => {
  const { user } = useAuth();
  const { staffUser, logout: staffLogout } = useStaffAuth();
  const navigate = useNavigate();
  const [pendingMembers, setPendingMembers] = useState<MemberRegistration[]>([]);
  const [allMembers, setAllMembers] = useState<MemberRegistration[]>([]);
  const [pendingStaff, setPendingStaff] = useState<StaffRegistration[]>([]);
  const [allStaff, setAllStaff] = useState<StaffRegistration[]>([]);
  const [mpesaPayments, setMpesaPayments] = useState<MPESAPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<StaffRegistration | null>(null);
  const [portalPassword, setPortalPassword] = useState("");
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  useEffect(() => {
    // Check if user is authenticated either through regular auth or staff auth
    if (!user && !staffUser) {
      navigate("/portal-login");
      return;
    }
    
    checkAdminAccess();
  }, [user, staffUser, navigate]);

  const checkAdminAccess = async () => {
    try {
      // If logged in via staff auth, check if they have admin/treasurer role
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

      // If logged in via regular auth, check if they have admin role
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
      // Fetch pending member registrations
      const { data: members, error: membersError } = await supabase
        .from("membership_registrations")
        .select("*")
        .eq("registration_status", "pending")
        .order("created_at", { ascending: false });

      if (membersError) throw membersError;

      // Fetch all member registrations
      const { data: allMembersData, error: allMembersError } = await supabase
        .from("membership_registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (allMembersError) throw allMembersError;

      // Fetch pending staff registrations
      const { data: staff, error: staffError } = await supabase
        .from("staff_registrations")
        .select("*")
        .in("pending", ["", "pending"])
        .order("created_at", { ascending: false });

      if (staffError) throw staffError;

      // Fetch all staff registrations
      const { data: allStaffData, error: allStaffError } = await supabase
        .from("staff_registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (allStaffError) throw allStaffError;

      // Fetch MPESA payments
      const { data: mpesaData, error: mpesaError } = await supabase
        .from("mpesa_payments")
        .select("*")
        .order("created_at", { ascending: false });

      if (mpesaError) throw mpesaError;

      // Fetch member details for MPESA payments
      const mpesaWithMembers = await Promise.all(
        (mpesaData || []).map(async (payment) => {
          const { data: memberData } = await supabase
            .from("membership_registrations")
            .select("first_name, last_name, tns_number, email")
            .eq("id", payment.member_id)
            .single();

          return {
            ...payment,
            membership_registrations: memberData || null
          };
        })
      );

      setPendingMembers(members || []);
      setAllMembers(allMembersData || []);
      setPendingStaff(staff || []);
      setAllStaff(allStaffData || []);
      setMpesaPayments(mpesaWithMembers || []);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      toast.error("Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  const approveMember = async (memberId: string) => {
    try {
      // Just approve the member - TNS number is already auto-assigned
      const { error } = await supabase
        .from("membership_registrations")
        .update({ 
          registration_status: "approved",
          payment_status: "paid"
        })
        .eq("id", memberId);

      if (error) throw error;

      toast.success("Member approved successfully!");
      fetchPendingRegistrations();
    } catch (error) {
      console.error("Error approving member:", error);
      toast.error("Failed to approve member");
    }
  };

  const rejectMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("membership_registrations")
        .update({ registration_status: "rejected" })
        .eq("id", memberId);

      if (error) throw error;

      toast.success("Member registration rejected");
      fetchPendingRegistrations();
    } catch (error) {
      console.error("Error rejecting member:", error);
      toast.error("Failed to reject member");
    }
  };

  const openPasswordDialog = (staff: StaffRegistration) => {
    setSelectedStaff(staff);
    setPortalPassword("");
    setIsPasswordDialogOpen(true);
  };

  const approveStaffWithPassword = async () => {
    if (!selectedStaff || !portalPassword.trim()) {
      toast.error("Please enter a portal password");
      return;
    }

    try {
      const { error } = await supabase
        .from("staff_registrations")
        .update({ 
          pending: "approved",
          portal_password: portalPassword.trim()
        })
        .eq("id", selectedStaff.id);

      if (error) throw error;

      toast.success("Staff member approved with portal password!");
      setIsPasswordDialogOpen(false);
      setSelectedStaff(null);
      setPortalPassword("");
      fetchPendingRegistrations();
    } catch (error) {
      console.error("Error approving staff:", error);
      toast.error("Failed to approve staff member");
    }
  };

  const rejectStaff = async (staffId: string) => {
    try {
      const { error } = await supabase
        .from("staff_registrations")
        .update({ pending: "rejected" })
        .eq("id", staffId);

      if (error) throw error;

      toast.success("Staff registration rejected");
      fetchPendingRegistrations();
    } catch (error) {
      console.error("Error rejecting staff:", error);
      toast.error("Failed to reject staff member");
    }
  };

  const handleLogout = () => {
    if (staffUser) {
      staffLogout();
      toast.success("Logged out successfully");
      navigate("/portal-login");
    } else {
      navigate("/dashboard");
    }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      toast.loading("Generating " + format.toUpperCase() + " export...");
      
      // Call the edge function directly with the format parameter
      const response = await fetch("https://wfqgnshhlfuznabweofj.supabase.co/functions/v1/export-members?format=" + format, {
        method: 'GET',
        headers: {
          'Authorization': "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmcWduc2hobGZ1em5hYndlb2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNTE0MzgsImV4cCI6MjA3MDgyNzQzOH0.EsPr_ypf7B1PXTWmjS2ZGXDVBe7HeNHDWsvJcgQpkLA",
          'apikey': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmcWduc2hobGZ1em5hYndlb2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNTE0MzgsImV4cCI6MjA3MDgyNzQzOH0.EsPr_ypf7B1PXTWmjS2ZGXDVBe7HeNHDWsvJcgQpkLA"
        }
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const date = new Date().toISOString().split('T')[0];
      const extension = format === 'excel' ? 'xls' : format === 'pdf' ? 'html' : 'csv';
      a.download = "members_export_" + date + "." + extension;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(format.toUpperCase() + " export downloaded successfully!");
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export " + format.toUpperCase() + " file");
    }
  };

  const handleTreasurerExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      toast.loading("Generating treasurer " + format.toUpperCase() + " report...");
      
      // Generate sample financial data for the report
      const financialSummary = {
        totalMembers: allMembers.length,
        totalContributions: 2450000,
        totalDisbursements: 1850000,
        monthlyExpenses: 125000,
        netPosition: 600000,
        avgMonthlyContribution: 2450000 / 6,
        avgDisbursement: 1850000 / 12,
        contributionGrowth: 15.2,
        expenseRatio: 5.1,
        liquidityRatio: 4.8
      };

      const monthlyData = [
        { month: "January 2024", members: 85, contributions: 180000, disbursements: 120000, expenses: 15000, growth: 8.5 },
        { month: "February 2024", members: 92, contributions: 210000, disbursements: 150000, expenses: 15000, growth: 16.7 },
        { month: "March 2024", members: 89, contributions: 190000, disbursements: 140000, expenses: 15000, growth: -9.5 },
        { month: "April 2024", members: 105, contributions: 250000, disbursements: 180000, expenses: 15000, growth: 31.6 },
        { month: "May 2024", members: 118, contributions: 280000, disbursements: 200000, expenses: 15000, growth: 12.0 },
        { month: "June 2024", members: 125, contributions: 320000, disbursements: 250000, expenses: 15000, growth: 14.3 }
      ];

      // Call the treasurer report edge function
      const response = await fetch('https://wfqgnshhlfuznabweofj.supabase.co/functions/v1/export-treasurer-report', {
        method: 'POST',
        headers: {
          'Authorization': "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmcWduc2hobGZ1em5hYndlb2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNTE0MzgsImV4cCI6MjA3MDgyNzQzOH0.EsPr_ypf7B1PXTWmjS2ZGXDVBe7HeNHDWsvJcgQpkLA",
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmcWduc2hobGZ1em5hYndlb2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNTE0MzgsImV4cCI6MjA3MDgyNzQzOH0.EsPr_ypf7B1PXTWmjS2ZGXDVBe7HeNHDWsvJcgQpkLA',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          summary: financialSummary,
          monthlyData: monthlyData,
          generatedBy: staffUser ? staffUser.first_name + " " + staffUser.last_name : 'Admin',
          generatedAt: new Date().toISOString()
        })
      });

      if (!response.ok) throw new Error('Treasurer report export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const date = new Date().toISOString().split('T')[0];
      a.download = "TNS_Treasurer_Report_" + date + ".csv";
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Treasurer " + format.toUpperCase() + " report downloaded successfully!");
    } catch (error) {
      console.error('Treasurer export error:', error);
      toast.error("Failed to export treasurer " + format.toUpperCase() + " report");
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Admin Portal</h1>
              <p className="text-muted-foreground">
                Manage member and staff approvals 
                {staffUser && " • Logged in as: " + staffUser.first_name + " " + staffUser.last_name + " (" + staffUser.staff_role + ")"}
                {user && !staffUser && " • User: " + user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={() => navigate(staffUser ? "/portal-login" : "/dashboard")} variant="outline">
              Back to {staffUser ? "Portal Login" : "Dashboard"}
            </Button>
            {staffUser && (
              <Button onClick={handleLogout} variant="outline">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="treasurer" className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Treasurer</span>
            </TabsTrigger>
            <TabsTrigger value="mpesa-payments" className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>MPESA ({mpesaPayments.length})</span>
            </TabsTrigger>
            <TabsTrigger value="pending-members" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Pending Members ({pendingMembers.length})</span>
            </TabsTrigger>
            <TabsTrigger value="all-members" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>All Members ({allMembers.length})</span>
            </TabsTrigger>
            <TabsTrigger value="pending-staff" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Pending Staff ({pendingStaff.length})</span>
            </TabsTrigger>
            <TabsTrigger value="all-staff" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>All Staff ({allStaff.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <div className="grid gap-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{allMembers.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {pendingMembers.length} pending approval
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Approved Members</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {allMembers.filter(m => m.registration_status === 'approved').length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{allStaff.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {pendingStaff.length} pending approval
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Payment Rate</CardTitle>
                    <PieChart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round((allMembers.filter(m => m.payment_status === 'paid').length / allMembers.length) * 100) || 0}%
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Registration Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Registration Status Distribution</CardTitle>
                    <CardDescription>Breakdown of member registration statuses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        approved: { label: "Approved", color: "hsl(var(--chart-7))" },
                        pending: { label: "Pending", color: "hsl(var(--chart-3))" },
                        rejected: { label: "Rejected", color: "hsl(var(--chart-9))" },
                      }}
                      className="h-[300px]"
                    >
                      <RechartsPieChart>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Pie
                          dataKey="value"
                          data={[
                            { name: "approved", value: allMembers.filter(m => m.registration_status === 'approved').length, fill: "hsl(var(--chart-7))" },
                            { name: "pending", value: allMembers.filter(m => m.registration_status === 'pending').length, fill: "hsl(var(--chart-3))" },
                            { name: "rejected", value: allMembers.filter(m => m.registration_status === 'rejected').length, fill: "hsl(var(--chart-9))" },
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                          innerRadius={20}
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                      </RechartsPieChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Membership Type Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Membership Type Distribution</CardTitle>
                    <CardDescription>Distribution by membership types</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        individual: { label: "Individual", color: "hsl(var(--chart-1))" },
                        family: { label: "Family", color: "hsl(var(--chart-5))" },
                      }}
                      className="h-[300px]"
                    >
                      <RechartsPieChart>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Pie
                          dataKey="value"
                          data={[
                            { name: "individual", value: allMembers.filter(m => m.membership_type === 'individual').length, fill: "hsl(var(--chart-1))" },
                            { name: "family", value: allMembers.filter(m => m.membership_type === 'family').length, fill: "hsl(var(--chart-5))" },
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                          innerRadius={20}
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                      </RechartsPieChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Payment Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Status Distribution</CardTitle>
                    <CardDescription>Payment completion rates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        paid: { label: "Paid", color: "hsl(var(--chart-7))" },
                        pending: { label: "Pending", color: "hsl(var(--chart-4))" },
                        failed: { label: "Failed", color: "hsl(var(--chart-9))" },
                      }}
                      className="h-[300px]"
                    >
                      <RechartsPieChart>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Pie
                          dataKey="value"
                          data={[
                            { name: "paid", value: allMembers.filter(m => m.payment_status === 'paid').length, fill: "hsl(var(--chart-7))" },
                            { name: "pending", value: allMembers.filter(m => m.payment_status === 'pending').length, fill: "hsl(var(--chart-4))" },
                            { name: "failed", value: allMembers.filter(m => m.payment_status === 'failed').length, fill: "hsl(var(--chart-9))" },
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                          innerRadius={20}
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                      </RechartsPieChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Members by State */}
                <Card>
                  <CardHeader>
                    <CardTitle>Members by State</CardTitle>
                    <CardDescription>Geographic distribution of members</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        count: { label: "Members", color: "hsl(var(--chart-6))" },
                      }}
                      className="h-[300px]"
                    >
                      <BarChart
                        data={Object.entries(
                          allMembers.reduce((acc, member) => {
                            acc[member.state] = (acc[member.state] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        )
                        .map(([state, count]) => ({ state, count }))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 10)}
                      >
                        <XAxis dataKey="state" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" fill="hsl(var(--chart-6))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Maturity Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Member Maturity Status</CardTitle>
                    <CardDescription>Distribution of member maturity levels</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        probation: { label: "Probation", color: "hsl(var(--chart-4))" },
                        mature: { label: "Mature", color: "hsl(var(--chart-8))" },
                      }}
                      className="h-[300px]"
                    >
                      <RechartsPieChart>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Pie
                          dataKey="value"
                          data={[
                            { name: "probation", value: allMembers.filter(m => m.maturity_status === 'probation').length, fill: "hsl(var(--chart-4))" },
                            { name: "mature", value: allMembers.filter(m => m.maturity_status === 'mature').length, fill: "hsl(var(--chart-8))" },
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                          innerRadius={20}
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                      </RechartsPieChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Staff Role Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Staff Role Distribution</CardTitle>
                    <CardDescription>Breakdown of staff by roles</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        count: { label: "Staff Count", color: "hsl(var(--chart-2))" },
                      }}
                      className="h-[300px]"
                    >
                      <BarChart
                        data={Object.entries(
                          allStaff.reduce((acc, staff) => {
                            acc[staff.staff_role] = (acc[staff.staff_role] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([role, count]) => ({ role, count }))}
                      >
                        <XAxis dataKey="role" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mpesa-payments">
            <Card>
              <CardHeader>
                <CardTitle>MPESA Payments</CardTitle>
                <CardDescription>All MPESA payment transactions from members</CardDescription>
              </CardHeader>
              <CardContent>
                {mpesaPayments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No MPESA payments found</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Receipt</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mpesaPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {payment.membership_registrations?.first_name} {payment.membership_registrations?.last_name}
                          </TableCell>
                          <TableCell>KSH {payment.amount.toLocaleString()}</TableCell>
                          <TableCell>{payment.mpesa_receipt_number || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
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
          </TabsContent>

          <TabsContent value="pending-members">
            <Card>
              <CardHeader>
                <CardTitle>Pending Member Registrations</CardTitle>
                <CardDescription>
                  Review and approve member applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingMembers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending member registrations
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Profile</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone/Alt Phone</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>ID Number</TableHead>
                        <TableHead>Emergency Contact</TableHead>
                        <TableHead>Personal Info</TableHead>
                        <TableHead>Membership</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                      <TableBody>
                        {pendingMembers.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell>
                              <Avatar className="h-10 w-10">
                                <AvatarImage 
                                  src={member.profile_picture_url || undefined}
                                  alt={member.first_name + " " + member.last_name}
                                />
                                <AvatarFallback>
                                  {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            </TableCell>
                            <TableCell className="font-medium">
                              <div>{member.first_name} {member.last_name}</div>
                              <div className="text-sm text-muted-foreground">{member.sex || 'N/A'}, {member.marital_status || 'N/A'}</div>
                            </TableCell>
                            <TableCell>{member.email}</TableCell>
                            <TableCell>
                              <div>{member.phone}</div>
                              {member.alternative_phone && (
                                <div className="text-sm text-muted-foreground">Alt: {member.alternative_phone}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{member.address}</div>
                                <div>{member.city}, {member.state} {member.zip_code}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {member.id_number || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">{member.emergency_contact_name}</div>
                                <div className="text-muted-foreground">{member.emergency_contact_phone}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>Sex: {member.sex || 'N/A'}</div>
                                <div>Status: {member.marital_status || 'N/A'}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <Badge variant="outline">{member.membership_type}</Badge>
                                <div className="text-sm">
                                  <Badge variant={member.payment_status === 'paid' ? 'default' : 'secondary'}>
                                    {member.payment_status}
                                  </Badge>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(member.registration_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => approveMember(member.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <UserCheck className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => rejectMember(member.id)}
                                >
                                  <UserX className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all-members">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Members</CardTitle>
                    <CardDescription>
                      View all registered members and their status
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => handleExport('csv')}
                      variant="outline"
                      size="sm"
                    >
                      <File className="h-4 w-4 mr-2" />
                      CSV
                    </Button>
                    <Button
                      onClick={() => handleExport('excel')}
                      variant="outline"
                      size="sm"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Excel
                    </Button>
                    <Button
                      onClick={() => handleExport('pdf')}
                      variant="outline"
                      size="sm"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {allMembers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No members registered yet
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Profile</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone/Alt Phone</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>ID Number</TableHead>
                        <TableHead>Emergency Contact</TableHead>
                        <TableHead>Membership</TableHead>
                        <TableHead>Maturity Status</TableHead>
                        <TableHead>TNS Number</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <Avatar className="h-10 w-10">
                              <AvatarImage 
                                src={member.profile_picture_url || undefined}
                                alt={member.first_name + " " + member.last_name}
                              />
                              <AvatarFallback>
                                {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div>{member.first_name} {member.last_name}</div>
                            <div className="text-sm text-muted-foreground">{member.sex || 'N/A'}, {member.marital_status || 'N/A'}</div>
                          </TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell>
                            <div>{member.phone}</div>
                            {member.alternative_phone && (
                              <div className="text-sm text-muted-foreground">Alt: {member.alternative_phone}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{member.address}</div>
                              <div>{member.city}, {member.state} {member.zip_code}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {member.id_number || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{member.emergency_contact_name}</div>
                              <div className="text-muted-foreground">{member.emergency_contact_phone}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge variant="outline">{member.membership_type}</Badge>
                              <div className="text-sm">
                                <Badge variant={member.payment_status === 'paid' ? 'default' : 'secondary'}>
                                  {member.payment_status}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge variant={member.maturity_status === 'mature' ? 'default' : 'secondary'}>
                                {member.maturity_status || 'probation'}
                              </Badge>
                              {member.days_to_maturity !== undefined && member.days_to_maturity > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  {member.days_to_maturity} days left
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{member.tns_number || "Not assigned"}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                member.registration_status === 'approved' ? 'default' :
                                member.registration_status === 'pending' ? 'secondary' : 'destructive'
                              }
                            >
                              {member.registration_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(member.registration_date).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending-staff">
            <Card>
              <CardHeader>
                <CardTitle>Pending Staff Registrations</CardTitle>
                <CardDescription>
                  Review and approve staff applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingStaff.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending staff registrations
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Assigned Area</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingStaff.map((staff) => (
                        <TableRow key={staff.id}>
                          <TableCell className="font-medium">
                            {staff.first_name} {staff.last_name}
                          </TableCell>
                          <TableCell>{staff.email}</TableCell>
                          <TableCell>{staff.phone}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{staff.staff_role}</Badge>
                          </TableCell>
                          <TableCell>{staff.assigned_area || "N/A"}</TableCell>
                          <TableCell>
                            {new Date(staff.created_at).toLocaleDateString()}
                          </TableCell>
                           <TableCell>
                             <div className="flex space-x-2">
                               <Button
                                 size="sm"
                                 onClick={() => openPasswordDialog(staff)}
                                 className="bg-green-600 hover:bg-green-700"
                               >
                                 <Key className="h-4 w-4 mr-1" />
                                 Approve & Set Password
                               </Button>
                               <Button
                                 size="sm"
                                 variant="destructive"
                                 onClick={() => rejectStaff(staff.id)}
                               >
                                 <UserX className="h-4 w-4 mr-1" />
                                 Reject
                               </Button>
                             </div>
                           </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all-staff">
            <Card>
              <CardHeader>
                <CardTitle>All Staff</CardTitle>
                <CardDescription>
                  View all registered staff and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allStaff.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No staff registered yet
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Assigned Area</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allStaff.map((staff) => (
                        <TableRow key={staff.id}>
                          <TableCell className="font-medium">
                            {staff.first_name} {staff.last_name}
                          </TableCell>
                          <TableCell>{staff.email}</TableCell>
                          <TableCell>{staff.phone}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{staff.staff_role}</Badge>
                          </TableCell>
                          <TableCell>{staff.assigned_area || "N/A"}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                staff.pending === 'approved' ? 'default' :
                                staff.pending === 'pending' || staff.pending === '' ? 'secondary' : 'destructive'
                              }
                            >
                              {staff.pending || 'pending'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(staff.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="treasurer">
            <div className="grid gap-6">
              {/* Financial Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Contributions</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">KES 2,450,000</div>
                    <p className="text-xs text-muted-foreground">
                      +12% from last month
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Disbursements</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">KES 1,850,000</div>
                    <p className="text-xs text-muted-foreground">
                      +8% from last month
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Position</CardTitle>
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">KES 600,000</div>
                    <p className="text-xs text-muted-foreground">
                      Positive balance
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">KES 125,000</div>
                    <p className="text-xs text-muted-foreground">
                      Operating costs
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">15.2%</div>
                    <p className="text-xs text-muted-foreground">
                      Annual growth
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Financial Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Financial Trends */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Monthly Financial Trends</CardTitle>
                    <CardDescription>Contributions, disbursements, and net position over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        contributions: { label: "Contributions", color: "hsl(var(--chart-2))" },
                        disbursements: { label: "Disbursements", color: "hsl(var(--chart-5))" },
                        netPosition: { label: "Net Position", color: "hsl(var(--chart-7))" },
                      }}
                      className="h-[400px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[
                          { month: "Jan", contributions: 180000, disbursements: 120000, netPosition: 60000 },
                          { month: "Feb", contributions: 210000, disbursements: 150000, netPosition: 60000 },
                          { month: "Mar", contributions: 190000, disbursements: 140000, netPosition: 50000 },
                          { month: "Apr", contributions: 250000, disbursements: 180000, netPosition: 70000 },
                          { month: "May", contributions: 280000, disbursements: 200000, netPosition: 80000 },
                          { month: "Jun", contributions: 320000, disbursements: 250000, netPosition: 70000 },
                        ]}>
                          <XAxis dataKey="month" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ChartLegend content={<ChartLegendContent />} />
                          <Line type="monotone" dataKey="contributions" stroke="hsl(var(--chart-2))" strokeWidth={3} />
                          <Line type="monotone" dataKey="disbursements" stroke="hsl(var(--chart-5))" strokeWidth={3} />
                          <Line type="monotone" dataKey="netPosition" stroke="hsl(var(--chart-7))" strokeWidth={3} />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Expense Categories */}
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Expense Categories</CardTitle>
                    <CardDescription>Breakdown of operating expenses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        administrative: { label: "Administrative", color: "hsl(var(--chart-1))" },
                        operational: { label: "Operational", color: "hsl(var(--chart-4))" },
                        marketing: { label: "Marketing", color: "hsl(var(--chart-6))" },
                        other: { label: "Other", color: "hsl(var(--chart-8))" },
                      }}
                      className="h-[300px]"
                    >
                      <RechartsPieChart>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Pie
                          dataKey="value"
                          data={[
                            { name: "administrative", value: 45000, fill: "hsl(var(--chart-1))" },
                            { name: "operational", value: 35000, fill: "hsl(var(--chart-4))" },
                            { name: "marketing", value: 25000, fill: "hsl(var(--chart-6))" },
                            { name: "other", value: 20000, fill: "hsl(var(--chart-8))" },
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={30}
                          label
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                      </RechartsPieChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Cash Flow Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle>Cash Flow Analysis</CardTitle>
                    <CardDescription>Monthly cash inflow vs outflow</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        inflow: { label: "Inflow", color: "hsl(var(--chart-7))" },
                        outflow: { label: "Outflow", color: "hsl(var(--chart-9))" },
                      }}
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { month: "Jan", inflow: 180000, outflow: 135000 },
                          { month: "Feb", inflow: 210000, outflow: 165000 },
                          { month: "Mar", inflow: 190000, outflow: 155000 },
                          { month: "Apr", inflow: 250000, outflow: 195000 },
                          { month: "May", inflow: 280000, outflow: 215000 },
                          { month: "Jun", inflow: 320000, outflow: 265000 },
                        ]}>
                          <XAxis dataKey="month" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ChartLegend content={<ChartLegendContent />} />
                          <Bar dataKey="inflow" fill="hsl(var(--chart-7))" radius={4} />
                          <Bar dataKey="outflow" fill="hsl(var(--chart-9))" radius={4} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Export Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Treasurer Report Downloads</CardTitle>
                  <CardDescription>
                    Generate detailed financial reports for analysis and record keeping
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => handleTreasurerExport('csv')}
                      className="flex items-center space-x-2"
                    >
                      <File className="h-4 w-4" />
                      <span>Download CSV Report</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleTreasurerExport('excel')}
                      className="flex items-center space-x-2"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>Download Excel Report</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleTreasurerExport('pdf')}
                      className="flex items-center space-x-2"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Download PDF Report</span>
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    Reports include financial summaries, monthly trends, expense analysis, and recommendations for financial management.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Password Assignment Dialog */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Portal Password</DialogTitle>
              <DialogDescription>
                Set a portal password for {selectedStaff?.first_name} {selectedStaff?.last_name} ({selectedStaff?.staff_role})
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="portal-password">Portal Password</Label>
                <Input
                  id="portal-password"
                  type="password"
                  placeholder="Enter a secure password"
                  value={portalPassword}
                  onChange={(e) => setPortalPassword(e.target.value)}
                  autoFocus
                />
                <p className="text-sm text-muted-foreground">
                  This password will be used to access their role-specific portal
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={approveStaffWithPassword} disabled={!portalPassword.trim()}>
                <UserCheck className="h-4 w-4 mr-2" />
                Approve & Assign Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminPortal;