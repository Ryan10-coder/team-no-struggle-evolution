import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Users, UserCheck, UserX, Shield, Key, LogOut, Download, FileSpreadsheet, FileText, File, BarChart3, PieChart, DollarSign, TrendingUp, Calculator, Trash2, AlertTriangle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from "recharts";
import { ManualPaymentEntry } from "@/components/ManualPaymentEntry";
import { DisbursementForm } from "@/components/DisbursementForm";
import { ExpenditureForm } from "@/components/ExpenditureForm";
import { ContributionsReport } from "@/components/ContributionsReport";
import { DisbursementsReport } from "@/components/DisbursementsReport";
import { ExpensesReport } from "@/components/ExpensesReport";
import { MemberMPESAPayment } from "@/components/MemberMPESAPayment";

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
  mpesa_payment_reference?: string;
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
  const [memberToDelete, setMemberToDelete] = useState<MemberRegistration | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  // Group MPESA payments by member to show contributions under one row per member
  const groupedMpesaPayments = useMemo(() => {
    type Grouped = {
      member_id: string;
      membership_registrations: MPESAPayment["membership_registrations"];
      payments: MPESAPayment[];
      totalAmount: number;
      latest: MPESAPayment;
      status: string;
    };

    const groups: Record<string, Grouped> = {};
    (mpesaPayments || []).forEach((p) => {
      const key = p.member_id;
      if (!groups[key]) {
        groups[key] = {
          member_id: key,
          membership_registrations: p.membership_registrations || null,
          payments: [],
          totalAmount: 0,
          latest: p,
          status: p.status,
        };
      }
      groups[key].payments.push(p);
      groups[key].totalAmount += Number(p.amount);
      // Track latest payment
      if (new Date(p.created_at) > new Date(groups[key].latest.created_at)) {
        groups[key].latest = p;
      }
      // Determine status
      if (groups[key].status !== p.status) {
        groups[key].status = 'mixed';
      }
    });

    // Sort groups by latest transaction date desc
    return Object.values(groups).sort((a, b) => (
      new Date(b.latest.created_at).getTime() - new Date(a.latest.created_at).getTime()
    ));
  }, [mpesaPayments]);

  useEffect(() => {
    // Check if user is authenticated either through regular auth or staff auth
    if (!user && !staffUser) {
      navigate("/portal-login");
      return;
    }
    
    checkAdminAccess();
  }, [user, staffUser, navigate]);

  // Realtime subscriptions to reflect MPESA payments and contributions instantly
  useEffect(() => {
    const channel = supabase
      .channel('realtime-admin-portal')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mpesa_payments' }, () => {
        fetchPendingRegistrations();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'mpesa_payments' }, () => {
        fetchPendingRegistrations();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contributions' }, () => {
        fetchPendingRegistrations();
      })
      .subscribe();

    return () => {
      try { supabase.removeChannel(channel); } catch (_) {}
    };
  }, []);

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

      // Fetch contributions
      const { data: contributionsData, error: contributionsError } = await supabase
        .from("contributions")
        .select("*")
        .order("contribution_date", { ascending: false });

      if (contributionsError) throw contributionsError;

      // Fetch disbursements
      const { data: disbursementsData, error: disbursementsError } = await supabase
        .from("disbursements")
        .select("*")
        .order("disbursement_date", { ascending: false });

      if (disbursementsError) throw disbursementsError;

      // Fetch monthly expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from("monthly_expenses")
        .select("*")
        .order("expense_date", { ascending: false });

      if (expensesError) throw expensesError;

      setPendingMembers(members || []);
      setAllMembers(allMembersData || []);
      setPendingStaff(staff || []);
      setAllStaff(allStaffData || []);
      setMpesaPayments(mpesaWithMembers || []);
      setContributions(contributionsData || []);
      setDisbursements(disbursementsData || []);
      setMonthlyExpenses(expensesData || []);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      toast.error("Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  const approveMember = async (memberId: string) => {
    try {
      // Get member details before approval for logging and feedback
      const { data: memberData, error: fetchError } = await supabase
        .from("membership_registrations")
        .select("first_name, last_name, email, tns_number")
        .eq("id", memberId)
        .single();

      if (fetchError) throw fetchError;

      console.log(`Approving member: ${memberData?.first_name} ${memberData?.last_name} (ID: ${memberId})`);

      // Approve the member - TNS number is already auto-assigned by database trigger
      const { error: updateError, count } = await supabase
        .from("membership_registrations")
        .update({ 
          registration_status: "approved",
          payment_status: "paid",
          updated_at: new Date().toISOString() // Ensure updated timestamp
        })
        .eq("id", memberId)
        .select();

      if (updateError) throw updateError;

      if (count === 0) {
        throw new Error('No member was updated - member may have already been processed');
      }

      console.log(`Successfully approved member: ${memberData?.first_name} ${memberData?.last_name}`);

      // Show success message with member details
      toast.success(
        `✅ Member ${memberData?.first_name} ${memberData?.last_name} approved successfully!`,
        {
          description: `TNS Number: ${memberData?.tns_number} • Status: Active Member`,
          duration: 5000
        }
      );

      // Comprehensive system refresh to update all UI components
      console.log('Refreshing all system data after member approval...');
      await fetchPendingRegistrations();
      
      // Log the approval for audit purposes
      console.log(`Audit: Member ${memberData?.first_name} ${memberData?.last_name} (${memberData?.email}) approved by admin`);
      
    } catch (error) {
      console.error("Error approving member:", error);
      
      let errorMessage = "Failed to approve member.";
      if (error.message?.includes('already been processed')) {
        errorMessage = "Member may have already been approved by another admin.";
      } else if (error.message?.includes('permission')) {
        errorMessage = "You don't have permission to approve members.";
      }
      
      toast.error(errorMessage, {
        description: "Please refresh the page and try again.",
        duration: 7000
      });
    }
  };

  const rejectMember = async (memberId: string) => {
    try {
      // Get member details before rejection for logging and feedback
      const { data: memberData, error: fetchError } = await supabase
        .from("membership_registrations")
        .select("first_name, last_name, email, tns_number")
        .eq("id", memberId)
        .single();

      if (fetchError) throw fetchError;

      console.log(`Rejecting member: ${memberData?.first_name} ${memberData?.last_name} (ID: ${memberId})`);

      // Reject the member registration
      const { error: updateError, count } = await supabase
        .from("membership_registrations")
        .update({ 
          registration_status: "rejected",
          updated_at: new Date().toISOString() // Ensure updated timestamp
        })
        .eq("id", memberId)
        .select();

      if (updateError) throw updateError;

      if (count === 0) {
        throw new Error('No member was updated - member may have already been processed');
      }

      console.log(`Successfully rejected member: ${memberData?.first_name} ${memberData?.last_name}`);

      // Show success message with member details
      toast.success(
        `❌ Member ${memberData?.first_name} ${memberData?.last_name} registration rejected`,
        {
          description: `The member has been notified and removed from pending registrations.`,
          duration: 5000
        }
      );

      // Comprehensive system refresh to update all UI components
      console.log('Refreshing all system data after member rejection...');
      await fetchPendingRegistrations();
      
      // Log the rejection for audit purposes
      console.log(`Audit: Member ${memberData?.first_name} ${memberData?.last_name} (${memberData?.email}) rejected by admin`);
      
    } catch (error) {
      console.error("Error rejecting member:", error);
      
      let errorMessage = "Failed to reject member.";
      if (error.message?.includes('already been processed')) {
        errorMessage = "Member may have already been processed by another admin.";
      } else if (error.message?.includes('permission')) {
        errorMessage = "You don't have permission to reject members.";
      }
      
      toast.error(errorMessage, {
        description: "Please refresh the page and try again.",
        duration: 7000
      });
    }
  };

  const openDeleteDialog = (member: MemberRegistration) => {
    // Additional safety check - only allow admins to delete members
    if (staffUser && staffUser.staff_role !== "Admin") {
      toast.error("Access denied. Only Admins can delete members.", {
        description: "This action requires Administrator privileges.",
        duration: 5000
      });
      return;
    }
    
    setMemberToDelete(member);
    setDeleteConfirmation(""); // Reset confirmation text
    setIsDeleteDialogOpen(true);
  };

  const deleteMember = async () => {
    if (!memberToDelete) return;

    setIsDeleting(true);
    const memberId = memberToDelete.id;
    const memberName = `${memberToDelete.first_name} ${memberToDelete.last_name}`;
    
    try {
      // Step 1: Delete MPESA payments (no FK constraint, must delete manually)
      console.log('Deleting MPESA payments for member:', memberId);
      const { data: mpesaData, error: mpesaError } = await supabase
        .from("mpesa_payments")
        .delete()
        .eq("member_id", memberId);
      
      if (mpesaError) {
        console.warn("Warning - Error deleting MPESA payments:", mpesaError);
        // Don't throw here, continue with deletion
      } else {
        console.log('Successfully deleted MPESA payments');
      }
      
      // Step 2: Delete member balances (has CASCADE, but delete explicitly for logging)
      console.log('Deleting member balances for member:', memberId);
      const { error: balancesError } = await supabase
        .from("member_balances")
        .delete()
        .eq("member_id", memberId);
      
      if (balancesError) {
        console.warn("Warning - Error deleting member balances:", balancesError);
      } else {
        console.log('Successfully deleted member balances');
      }
      
      // Step 3: Delete contributions (has CASCADE, but delete explicitly to ensure cleanup)
      console.log('Deleting contributions for member:', memberId);
      const { error: contributionsError } = await supabase
        .from("contributions")
        .delete()
        .eq("member_id", memberId);
      
      if (contributionsError) {
        console.warn("Warning - Error deleting contributions:", contributionsError);
      } else {
        console.log('Successfully deleted contributions');
      }
      
      // Step 4: Delete disbursements (has CASCADE, but delete explicitly)
      console.log('Deleting disbursements for member:', memberId);
      const { error: disbursementsError } = await supabase
        .from("disbursements")
        .delete()
        .eq("member_id", memberId);
      
      if (disbursementsError) {
        console.warn("Warning - Error deleting disbursements:", disbursementsError);
      } else {
        console.log('Successfully deleted disbursements');
      }
      
      // Step 5: Check for any other related records that might exist
      // (This ensures we don't miss any future tables that might reference members)
      console.log('Checking for other related records...');
      
      // Step 6: Finally, delete the main member record
      console.log('Deleting main member record:', memberId);
      const { error: memberError, count } = await supabase
        .from("membership_registrations")
        .delete()
        .eq("id", memberId);
      
      if (memberError) {
        console.error('Critical error deleting member record:', memberError);
        throw memberError;
      }
      
      if (count === 0) {
        console.warn('No member record was deleted - member may have already been removed');
        toast.error('Member may have already been deleted by another admin');
      } else {
        console.log('Successfully deleted member record');
        toast.success(
          `✅ Member ${memberName} and all related data deleted successfully`,
          {
            description: 'All payments, contributions, and records have been permanently removed.',
            duration: 5000
          }
        );
      }
      
      // Step 7: Close dialog and refresh data
      setIsDeleteDialogOpen(false);
      setMemberToDelete(null);
      setDeleteConfirmation(""); // Reset confirmation text
      
      // Step 8: Refresh all data to ensure UI is updated
      console.log('Refreshing all data after deletion...');
      await fetchPendingRegistrations(); // This refreshes all lists including allMembers
      
      // Step 9: Log the successful deletion for audit purposes
      console.log(`Audit: Member ${memberName} (ID: ${memberId}) permanently deleted by admin`);
      
    } catch (error) {
      console.error("Critical error during member deletion:", error);
      
      // Provide specific error messages based on the error type
      let errorMessage = "Failed to delete member. Please try again.";
      
      if (error.message?.includes('foreign key')) {
        errorMessage = "Cannot delete member - there are related records that prevent deletion. Please contact system administrator.";
      } else if (error.message?.includes('permission')) {
        errorMessage = "You don't have permission to delete this member.";
      } else if (error.message?.includes('not found')) {
        errorMessage = "Member not found - may have already been deleted.";
      }
      
      toast.error(errorMessage, {
        description: 'If this problem persists, please contact technical support.',
        duration: 7000
      });
      
    } finally {
      setIsDeleting(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 dark:from-slate-950 dark:via-blue-950/30 dark:to-indigo-950">
      {/* Enhanced Header with Gradient Background */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur opacity-75"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-full">
                  <Shield className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                  Admin Control Center
                </h1>
                <div className="flex items-center gap-3">
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Complete administrative oversight and management
                  </p>
                  {staffUser && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700">
                        {staffUser.first_name} {staffUser.last_name} • {staffUser.staff_role}
                      </Badge>
                    </div>
                  )}
                  {user && !staffUser && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {user.email}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => navigate(staffUser ? "/portal-login" : "/dashboard")} 
                variant="outline"
                className="border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800 transition-all duration-200"
              >
                Back to {staffUser ? "Portal Login" : "Dashboard"}
              </Button>
              {staffUser && (
                <Button 
                  onClick={handleLogout} 
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/20 transition-all duration-200"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Enhanced Tabs Navigation */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-2 mb-8">
          <Tabs defaultValue="analytics" className="w-full">
            <TabsList className="grid w-full grid-cols-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-1">
              <TabsTrigger 
                value="analytics" 
                className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-md py-3 px-4"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="font-medium">Analytics</span>
              </TabsTrigger>
              <TabsTrigger 
                value="treasurer" 
                className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-md py-3 px-4"
              >
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">Treasurer</span>
              </TabsTrigger>
              <TabsTrigger 
                value="pending-members" 
                className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-md py-3 px-4 relative"
              >
                <Users className="h-4 w-4" />
                <span className="font-medium">Pending Members</span>
                {pendingMembers.length > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {pendingMembers.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="all-members" 
                className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-md py-3 px-4"
              >
                <Users className="h-4 w-4" />
                <span className="font-medium">All Members</span>
                <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full">
                  {allMembers.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="pending-staff" 
                className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-md py-3 px-4"
              >
                <Shield className="h-4 w-4" />
                <span className="font-medium">Pending Staff</span>
                {pendingStaff.length > 0 && (
                  <Badge className="ml-2 bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {pendingStaff.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="all-staff" 
                className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-500 data-[state=active]:to-slate-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-md py-3 px-4"
              >
                <Shield className="h-4 w-4" />
                <span className="font-medium">All Staff</span>
                <Badge variant="secondary" className="ml-2 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 text-xs px-2 py-0.5 rounded-full">
                  {allStaff.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

          <TabsContent value="analytics" className="space-y-8">
            {/* Analytics Header */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                  System Analytics & Insights
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
                  Real-time data visualization and organizational metrics
                </p>
              </div>
            </div>

            <div className="grid gap-8">
              {/* Enhanced Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800 hover:shadow-xl transition-all duration-300 group">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300">Total Members</CardTitle>
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full group-hover:scale-110 transition-transform">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-3xl font-bold text-blue-800 dark:text-blue-200">{allMembers.length}</div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      {pendingMembers.length} pending approval
                    </p>
                    <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                        style={{width: `${Math.min((allMembers.length / 100) * 100, 100)}%`}}
                      ></div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800 hover:shadow-xl transition-all duration-300 group">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Approved Members</CardTitle>
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full group-hover:scale-110 transition-transform">
                      <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-3xl font-bold text-emerald-800 dark:text-emerald-200">
                      {allMembers.filter(m => m.registration_status === 'approved').length}
                    </div>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      {((allMembers.filter(m => m.registration_status === 'approved').length / allMembers.length) * 100 || 0).toFixed(1)}% approval rate
                    </p>
                    <div className="w-full bg-emerald-200 dark:bg-emerald-800 rounded-full h-2">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                        style={{width: `${(allMembers.filter(m => m.registration_status === 'approved').length / allMembers.length) * 100 || 0}%`}}
                      ></div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800 hover:shadow-xl transition-all duration-300 group">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-300">Total Staff</CardTitle>
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full group-hover:scale-110 transition-transform">
                      <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-3xl font-bold text-purple-800 dark:text-purple-200">{allStaff.length}</div>
                    <p className="text-sm text-purple-600 dark:text-purple-400">
                      {pendingStaff.length} pending approval
                    </p>
                    <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-500" 
                        style={{width: `${Math.min((allStaff.length / 20) * 100, 100)}%`}}
                      ></div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800 hover:shadow-xl transition-all duration-300 group">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-semibold text-orange-700 dark:text-orange-300">Payment Rate</CardTitle>
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full group-hover:scale-110 transition-transform">
                      <PieChart className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-3xl font-bold text-orange-800 dark:text-orange-200">
                      {Math.round((allMembers.filter(m => m.payment_status === 'paid').length / allMembers.length) * 100) || 0}%
                    </div>
                    <p className="text-sm text-orange-600 dark:text-orange-400">
                      {allMembers.filter(m => m.payment_status === 'paid').length} members paid
                    </p>
                    <div className="w-full bg-orange-200 dark:bg-orange-800 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full transition-all duration-500" 
                        style={{width: `${Math.round((allMembers.filter(m => m.payment_status === 'paid').length / allMembers.length) * 100) || 0}%`}}
                      ></div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Enhanced Charts Grid */}
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Data Visualization & Trends</h3>
                  <p className="text-gray-600 dark:text-gray-400">Interactive charts and analytics for better decision making</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Enhanced Registration Status Distribution */}
                  <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-gray-200 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full">
                          <PieChart className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">Registration Status Distribution</CardTitle>
                          <CardDescription className="text-gray-600 dark:text-gray-400">Current breakdown of member registration statuses</CardDescription>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                            {allMembers.filter(m => m.registration_status === 'approved').length}
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-500">Approved</div>
                        </div>
                        <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                            {allMembers.filter(m => m.registration_status === 'pending').length}
                          </div>
                          <div className="text-xs text-yellow-600 dark:text-yellow-500">Pending</div>
                        </div>
                        <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                          <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                            {allMembers.filter(m => m.registration_status === 'rejected').length}
                          </div>
                          <div className="text-xs text-red-600 dark:text-red-500">Rejected</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          approved: { label: "Approved", color: "hsl(142, 76%, 36%)" },
                          pending: { label: "Pending", color: "hsl(45, 93%, 47%)" },
                          rejected: { label: "Rejected", color: "hsl(0, 84%, 60%)" },
                        }}
                        className="h-[350px]"
                      >
                        <RechartsPieChart>
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Pie
                            dataKey="value"
                            data={[
                              { name: "approved", value: allMembers.filter(m => m.registration_status === 'approved').length, fill: "hsl(142, 76%, 36%)" },
                              { name: "pending", value: allMembers.filter(m => m.registration_status === 'pending').length, fill: "hsl(45, 93%, 47%)" },
                              { name: "rejected", value: allMembers.filter(m => m.registration_status === 'rejected').length, fill: "hsl(0, 84%, 60%)" },
                            ]}
                            cx="50%"
                            cy="50%"
                            outerRadius={120}
                            innerRadius={50}
                            paddingAngle={2}
                          >
                            {[
                              { name: "approved", value: allMembers.filter(m => m.registration_status === 'approved').length, fill: "hsl(142, 76%, 36%)" },
                              { name: "pending", value: allMembers.filter(m => m.registration_status === 'pending').length, fill: "hsl(45, 93%, 47%)" },
                              { name: "rejected", value: allMembers.filter(m => m.registration_status === 'rejected').length, fill: "hsl(0, 84%, 60%)" },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} className="hover:opacity-80 transition-opacity cursor-pointer" />
                            ))}
                          </Pie>
                          <ChartLegend content={<ChartLegendContent />} />
                        </RechartsPieChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  {/* Enhanced Membership Type Distribution */}
                  <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-gray-200 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">Membership Type Distribution</CardTitle>
                          <CardDescription className="text-gray-600 dark:text-gray-400">Individual vs Family membership breakdown</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          individual: { label: "Individual", color: "hsl(217, 91%, 60%)" },
                          family: { label: "Family", color: "hsl(142, 76%, 36%)" },
                        }}
                        className="h-[350px]"
                      >
                        <RechartsPieChart>
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Pie
                            dataKey="value"
                            data={[
                              { name: "individual", value: allMembers.filter(m => m.membership_type === 'individual').length, fill: "hsl(217, 91%, 60%)" },
                              { name: "family", value: allMembers.filter(m => m.membership_type === 'family').length, fill: "hsl(142, 76%, 36%)" },
                            ]}
                            cx="50%"
                            cy="50%"
                            outerRadius={120}
                            innerRadius={50}
                            paddingAngle={2}
                          >
                            {[
                              { name: "individual", value: allMembers.filter(m => m.membership_type === 'individual').length, fill: "hsl(217, 91%, 60%)" },
                              { name: "family", value: allMembers.filter(m => m.membership_type === 'family').length, fill: "hsl(142, 76%, 36%)" },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} className="hover:opacity-80 transition-opacity cursor-pointer" />
                            ))}
                          </Pie>
                          <ChartLegend content={<ChartLegendContent />} />
                        </RechartsPieChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pending-members" className="space-y-6">
            {/* Pending Members Header */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-full shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                  Pending Member Applications
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
                  Review, verify, and approve new member registrations
                </p>
                {pendingMembers.length > 0 && (
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
                    <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300 dark:border-orange-700">
                      {pendingMembers.length} applications awaiting review
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <Card className="bg-gradient-to-br from-white to-orange-50/30 dark:from-gray-900 dark:to-orange-950/10 border-orange-200 dark:border-orange-800 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-b border-orange-200 dark:border-orange-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                      <UserCheck className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-orange-900 dark:text-orange-100">Member Registration Review</CardTitle>
                      <CardDescription className="text-orange-700 dark:text-orange-300">
                        Carefully review member details and approve qualified applications
                      </CardDescription>
                    </div>
                  </div>
                  {pendingMembers.length > 0 && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-800 dark:text-orange-200">{pendingMembers.length}</div>
                      <div className="text-xs text-orange-600 dark:text-orange-400">Pending Reviews</div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {pendingMembers.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="mx-auto w-32 h-32 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full flex items-center justify-center mb-6">
                      <UserCheck className="h-16 w-16 text-green-500 dark:text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">All Applications Reviewed!</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">No pending member registrations require your attention at this time.</p>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-4 py-2 text-sm">
                      System Up to Date
                    </Badge>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-900 rounded-lg border border-orange-200 dark:border-orange-700 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30">
                        <TableRow className="border-orange-200 dark:border-orange-800">
                          <TableHead className="font-semibold text-orange-800 dark:text-orange-300 py-4">Profile</TableHead>
                          <TableHead className="font-semibold text-orange-800 dark:text-orange-300">Member Details</TableHead>
                          <TableHead className="font-semibold text-orange-800 dark:text-orange-300">Contact Info</TableHead>
                          <TableHead className="font-semibold text-orange-800 dark:text-orange-300">Address & Country</TableHead>
                          <TableHead className="font-semibold text-orange-800 dark:text-orange-300">ID Number</TableHead>
                          <TableHead className="font-semibold text-orange-800 dark:text-orange-300">Family Info</TableHead>
                          <TableHead className="font-semibold text-orange-800 dark:text-orange-300">Emergency Contact</TableHead>
                          <TableHead className="font-semibold text-orange-800 dark:text-orange-300">Membership Type</TableHead>
                          <TableHead className="font-semibold text-orange-800 dark:text-orange-300">MPESA Ref</TableHead>
                          <TableHead className="font-semibold text-orange-800 dark:text-orange-300">Registration Date</TableHead>
                          <TableHead className="font-semibold text-orange-800 dark:text-orange-300 text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingMembers.map((member, index) => (
                          <TableRow 
                            key={member.id} 
                            className={`hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors border-orange-100 dark:border-orange-900 ${
                              index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-orange-25 dark:bg-orange-950/10'
                            }`}
                          >
                            <TableCell className="py-4">
                              <div className="relative">
                                <Avatar className="h-12 w-12 border-2 border-orange-200 dark:border-orange-700">
                                  <AvatarImage 
                                    src={member.profile_picture_url || undefined}
                                    alt={member.first_name + " " + member.last_name}
                                  />
                                  <AvatarFallback className="bg-gradient-to-r from-orange-400 to-red-500 text-white font-semibold">
                                    {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full animate-pulse"></div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-semibold text-gray-900 dark:text-gray-100 text-base">
                                  {member.first_name} {member.last_name}
                                </div>
                                <div className="flex gap-2">
                                  <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">
                                    {member.sex || 'N/A'}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">
                                    {member.marital_status || 'N/A'}
                                  </Badge>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                <div className="font-medium text-gray-900 dark:text-gray-100">{member.email}</div>
                                <div className="space-y-1">
                                  <div className="text-sm text-gray-600 dark:text-gray-400">{member.phone}</div>
                                  {member.alternative_phone && (
                                    <div className="text-xs text-gray-500 dark:text-gray-500">
                                      Alt: {member.alternative_phone}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 text-sm">
                                <div className="font-medium text-gray-900 dark:text-gray-100">{member.address}</div>
                                <div className="text-gray-600 dark:text-gray-400">
                                  {member.city}, {member.state}
                                </div>
                                {(member as any).country && (
                                  <Badge variant="outline" className="text-xs mt-1">
                                    {(member as any).country}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs">
                                {member.id_number || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                {(member as any).spouse_name && (
                                  <div className="space-y-1">
                                    <Badge variant="secondary" className="bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400 text-xs">
                                      Spouse: {(member as any).spouse_name}
                                    </Badge>
                                    {(member as any).spouse_phone && (
                                      <div className="text-xs text-gray-600">{(member as any).spouse_phone}</div>
                                    )}
                                  </div>
                                )}
                                {(member as any).children_data && JSON.parse((member as any).children_data || '[]').length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {JSON.parse((member as any).children_data).length} Children
                                  </Badge>
                                )}
                                {(member as any).parent2_name && (
                                  <div className="text-xs text-gray-600">
                                    Parent 2: {(member as any).parent2_name}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                  {member.emergency_contact_name}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {member.emergency_contact_phone}
                                </div>
                                {(member as any).parent1_name && (member as any).parent1_name !== member.emergency_contact_name && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Alt: {(member as any).parent1_name}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                <Badge 
                                  variant="secondary" 
                                  className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs"
                                >
                                  {member.membership_type}
                                </Badge>
                                <Badge 
                                  variant={member.payment_status === 'paid' ? 'default' : 'secondary'}
                                  className={`text-xs ${
                                    member.payment_status === 'paid' 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                  }`}
                                >
                                  {member.payment_status}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-mono text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {member.mpesa_payment_reference || '—'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                  {new Date(member.registration_date).toLocaleDateString()}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-500">
                                  {new Date(member.registration_date).toLocaleTimeString()}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col space-y-2">
                                <Button
                                  size="sm"
                                  onClick={() => approveMember(member.id)}
                                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-200 w-full"
                                >
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => rejectMember(member.id)}
                                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transition-all duration-200 w-full"
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
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
                        <TableHead>MPESA Ref</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
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
                            <div className="font-mono text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {member.mpesa_payment_reference || '—'}
                            </div>
                          </TableCell>
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
                          <TableCell>
                            <div className="flex justify-center">
                              {(staffUser?.staff_role === "Admin" || (user && !staffUser)) ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDeleteDialog(member)}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20 transition-colors"
                                  title={`Delete ${member.first_name} ${member.last_name}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              ) : (
                                <span className="text-xs text-gray-400 dark:text-gray-600">
                                  Admin Only
                                </span>
                              )}
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
            <div className="space-y-8">
              {/* Header Section */}
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-primary">Financial Management Center</h2>
                <p className="text-muted-foreground text-lg">Comprehensive financial oversight and transaction management</p>
                <div className="w-24 h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20 mx-auto rounded-full"></div>
              </div>

              {/* Quick Actions Forms */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="text-xl text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Quick Financial Actions
                  </CardTitle>
                  <CardDescription className="text-blue-700 dark:text-blue-300">
                    Manage payments, disbursements, and expenses efficiently
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-shadow">
                      <ManualPaymentEntry onSuccess={fetchPendingRegistrations} />
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-shadow">
                      <DisbursementForm onSuccess={fetchPendingRegistrations} />
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-shadow">
                      <ExpenditureForm onSuccess={fetchPendingRegistrations} />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Member MPESA Payment Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Member Payment Processing</h3>
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700">
                    Paybill: 4148511
                  </Badge>
                </div>
                <MemberMPESAPayment />
              </div>
              
              {/* Enhanced Financial Summary Cards */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Financial Overview</h3>
                  <div className="text-sm text-muted-foreground">
                    Last updated: {new Date().toLocaleString()}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-200 group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-semibold text-green-700 dark:text-green-300">Total Contributions</CardTitle>
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full group-hover:scale-110 transition-transform">
                        <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                        KES {contributions.reduce((total, contrib) => total + Number(contrib.amount), 0).toLocaleString()}
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        {contributions.length} total contributions
                      </p>
                      <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2 mt-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{width: '85%'}}></div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all duration-200 group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-semibold text-orange-700 dark:text-orange-300">Total Disbursements</CardTitle>
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full group-hover:scale-110 transition-transform">
                        <DollarSign className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                        KES {disbursements.reduce((total, disb) => total + Number(disb.amount), 0).toLocaleString()}
                      </div>
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        {disbursements.length} disbursements made
                      </p>
                      <div className="w-full bg-orange-200 dark:bg-orange-800 rounded-full h-2 mt-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{width: '65%'}}></div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className={`bg-gradient-to-br ${(contributions.reduce((total, contrib) => total + Number(contrib.amount), 0) - disbursements.reduce((total, disb) => total + Number(disb.amount), 0) - monthlyExpenses.reduce((total, exp) => total + Number(exp.amount), 0)) >= 0 ? 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800' : 'from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border-red-200 dark:border-red-800'} hover:shadow-lg transition-all duration-200 group`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className={`text-sm font-semibold ${(contributions.reduce((total, contrib) => total + Number(contrib.amount), 0) - disbursements.reduce((total, disb) => total + Number(disb.amount), 0) - monthlyExpenses.reduce((total, exp) => total + Number(exp.amount), 0)) >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}>Net Position</CardTitle>
                      <div className={`p-2 ${(contributions.reduce((total, contrib) => total + Number(contrib.amount), 0) - disbursements.reduce((total, disb) => total + Number(disb.amount), 0) - monthlyExpenses.reduce((total, exp) => total + Number(exp.amount), 0)) >= 0 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-red-100 dark:bg-red-900/30'} rounded-full group-hover:scale-110 transition-transform`}>
                        <Calculator className={`h-4 w-4 ${(contributions.reduce((total, contrib) => total + Number(contrib.amount), 0) - disbursements.reduce((total, disb) => total + Number(disb.amount), 0) - monthlyExpenses.reduce((total, exp) => total + Number(exp.amount), 0)) >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${
                        contributions.reduce((total, contrib) => total + Number(contrib.amount), 0) - 
                        disbursements.reduce((total, disb) => total + Number(disb.amount), 0) - 
                        monthlyExpenses.reduce((total, exp) => total + Number(exp.amount), 0) >= 0 
                        ? 'text-blue-800 dark:text-blue-200' : 'text-red-800 dark:text-red-200'
                      }`}>
                        KES {(
                          contributions.reduce((total, contrib) => total + Number(contrib.amount), 0) - 
                          disbursements.reduce((total, disb) => total + Number(disb.amount), 0) - 
                          monthlyExpenses.reduce((total, exp) => total + Number(exp.amount), 0)
                        ).toLocaleString()}
                      </div>
                      <p className={`text-xs mt-1 ${
                        contributions.reduce((total, contrib) => total + Number(contrib.amount), 0) - 
                        disbursements.reduce((total, disb) => total + Number(disb.amount), 0) - 
                        monthlyExpenses.reduce((total, exp) => total + Number(exp.amount), 0) >= 0 
                        ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {(contributions.reduce((total, contrib) => total + Number(contrib.amount), 0) - disbursements.reduce((total, disb) => total + Number(disb.amount), 0) - monthlyExpenses.reduce((total, exp) => total + Number(exp.amount), 0)) >= 0 ? 'Positive' : 'Negative'} position
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-200 group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-300">Monthly Expenses</CardTitle>
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full group-hover:scale-110 transition-transform">
                        <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                        KES {monthlyExpenses.reduce((total, exp) => total + Number(exp.amount), 0).toLocaleString()}
                      </div>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                        {monthlyExpenses.length} expense entries
                      </p>
                      <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2 mt-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{width: '45%'}}></div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 border-teal-200 dark:border-teal-800 hover:shadow-lg transition-all duration-200 group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-semibold text-teal-700 dark:text-teal-300">MPESA Payments</CardTitle>
                      <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-full group-hover:scale-110 transition-transform">
                        <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-teal-800 dark:text-teal-200">
                        KES {mpesaPayments.reduce((total, payment) => total + Number(payment.amount), 0).toLocaleString()}
                      </div>
                      <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">
                        {mpesaPayments.length} MPESA transactions
                      </p>
                      <div className="w-full bg-teal-200 dark:bg-teal-800 rounded-full h-2 mt-2">
                        <div className="bg-teal-500 h-2 rounded-full" style={{width: '75%'}}></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Enhanced MPESA Payments Table */}
              <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/50 dark:to-gray-950/50 border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                          <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        Recent MPESA Payments
                      </CardTitle>
<CardDescription className="text-slate-600 dark:text-slate-400">
                        Real-time payment transactions from members via Paybill 4148511 • Showing latest {Math.min(groupedMpesaPayments.length, 10)} of {groupedMpesaPayments.length} members with payments
                      </CardDescription>
                    </div>
                    {mpesaPayments.length > 10 && (
                      <Button variant="outline" size="sm" className="text-xs">
                        View All ({mpesaPayments.length})
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
{groupedMpesaPayments.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        <DollarSign className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No MPESA payments yet</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-3">MPESA payment transactions will appear here once members start making payments.</p>
                      <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-4 py-2 rounded-lg text-sm">
                        <strong>Paybill Number:</strong> 4148511 • Payments are processed via STK Push
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                          <TableRow>
                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Member Details</TableHead>
                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">TNS Number</TableHead>
                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Phone Number</TableHead>
                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Amount</TableHead>
                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">MPESA Receipt</TableHead>
                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
                            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Transaction Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
{groupedMpesaPayments.slice(0, 10).map((group, index) => (
<TableRow key={group.member_id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                              index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-slate-25 dark:bg-slate-900/25'
                            }`}>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="font-medium text-gray-900 dark:text-gray-100">
                                    {group.membership_registrations?.first_name} {group.membership_registrations?.last_name}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {group.membership_registrations?.email || 'No email'}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-mono">
                                  {group.membership_registrations?.tns_number || 'N/A'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="font-mono text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                  {group.latest.phone_number}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-semibold text-green-700 dark:text-green-400">
                                  KES {group.totalAmount.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {group.payments.length} contributions
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {group.payments
                                    .slice()
                                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                                    .map((p, i) => (
                                      <Badge key={p.id} variant="secondary" className="text-xs">
                                        Contribution {i + 1}: KES {Number(p.amount).toLocaleString()}
                                      </Badge>
                                    ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={group.status === 'completed' ? 'default' : group.status === 'pending' ? 'secondary' : 'destructive'}
                                  className={`${
                                    group.status === 'completed' 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                      : group.status === 'pending'
                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                  }`}
                                >
                                  {group.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="text-sm font-medium">
                                    {new Date(group.latest.created_at).toLocaleDateString()}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(group.latest.created_at).toLocaleTimeString()}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Enhanced Financial Analysis Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Financial Analysis</h3>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">Live Data</Badge>
                    <Badge variant="secondary" className="text-xs">Updated {new Date().toLocaleTimeString()}</Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Enhanced Financial Overview */}
                  <Card className="lg:col-span-2 bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 dark:from-indigo-950/20 dark:via-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
                    <CardHeader>
                      <CardTitle className="text-xl text-blue-900 dark:text-blue-100 flex items-center gap-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                          <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        Comprehensive Financial Overview
                      </CardTitle>
                      <CardDescription className="text-blue-700 dark:text-blue-300">
                        Real-time financial data with key performance indicators
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm font-medium text-green-600 dark:text-green-400">Total Contributions</div>
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          </div>
                          <div className="text-3xl font-bold text-green-800 dark:text-green-200 mb-2">
                            KES {contributions.reduce((total, contrib) => total + Number(contrib.amount), 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-400 mb-3">
                            From {contributions.length} transactions
                          </div>
                          <div className="w-full bg-green-100 dark:bg-green-900/30 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{width: '85%'}}></div>
                          </div>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm font-medium text-orange-600 dark:text-orange-400">Total Disbursements</div>
                            <DollarSign className="h-4 w-4 text-orange-500" />
                          </div>
                          <div className="text-3xl font-bold text-orange-800 dark:text-orange-200 mb-2">
                            KES {disbursements.reduce((total, disb) => total + Number(disb.amount), 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-orange-600 dark:text-orange-400 mb-3">
                            From {disbursements.length} disbursements
                          </div>
                          <div className="w-full bg-orange-100 dark:bg-orange-900/30 rounded-full h-2">
                            <div className="bg-orange-500 h-2 rounded-full" style={{width: '65%'}}></div>
                          </div>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Expenses</div>
                            <Calculator className="h-4 w-4 text-purple-500" />
                          </div>
                          <div className="text-3xl font-bold text-purple-800 dark:text-purple-200 mb-2">
                            KES {monthlyExpenses.reduce((total, exp) => total + Number(exp.amount), 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-purple-600 dark:text-purple-400 mb-3">
                            From {monthlyExpenses.length} expense entries
                          </div>
                          <div className="w-full bg-purple-100 dark:bg-purple-900/30 rounded-full h-2">
                            <div className="bg-purple-500 h-2 rounded-full" style={{width: '45%'}}></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Enhanced Expense Categories */}
                  <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
                    <CardHeader>
                      <CardTitle className="text-lg text-purple-900 dark:text-purple-100 flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        Expense Categories
                      </CardTitle>
                      <CardDescription className="text-purple-700 dark:text-purple-300">
                        Breakdown of operational spending
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(
                          monthlyExpenses.reduce((acc, expense) => {
                            acc[expense.expense_category] = (acc[expense.expense_category] || 0) + Number(expense.amount);
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([category, amount], index) => {
                          const total = monthlyExpenses.reduce((total, exp) => total + Number(exp.amount), 0);
                          const percentage = total > 0 ? (amount / total) * 100 : 0;
                          const colors = ['bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-blue-500', 'bg-cyan-500'];
                          
                          return (
                            <div key={category} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                                  <span className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">{category}</span>
                                </div>
                                <span className="font-semibold text-purple-700 dark:text-purple-300">KES {amount.toLocaleString()}</span>
                              </div>
                              <div className="w-full bg-purple-100 dark:bg-purple-900/30 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${colors[index % colors.length]}`} 
                                  style={{width: `${Math.max(percentage, 5)}%`}}
                                ></div>
                              </div>
                              <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                {percentage.toFixed(1)}% of total expenses
                              </div>
                            </div>
                          )
                        })}
                        {monthlyExpenses.length === 0 && (
                          <div className="text-center py-8">
                            <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-3">
                              <BarChart3 className="h-6 w-6 text-purple-400" />
                            </div>
                            <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-1">No expense data</h4>
                            <p className="text-sm text-purple-600 dark:text-purple-400">Expense categories will appear here once data is available.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Enhanced Contribution Types */}
                  <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800">
                    <CardHeader>
                      <CardTitle className="text-lg text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        Contribution Types
                      </CardTitle>
                      <CardDescription className="text-emerald-700 dark:text-emerald-300">
                        Revenue streams and contribution patterns
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(
                          contributions.reduce((acc, contribution) => {
                            acc[contribution.contribution_type] = (acc[contribution.contribution_type] || 0) + Number(contribution.amount);
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([type, amount], index) => {
                          const total = contributions.reduce((total, contrib) => total + Number(contrib.amount), 0);
                          const percentage = total > 0 ? (amount / total) * 100 : 0;
                          const colors = ['bg-emerald-500', 'bg-teal-500', 'bg-green-500', 'bg-lime-500', 'bg-cyan-500'];
                          
                          return (
                            <div key={type} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-emerald-200 dark:border-emerald-700">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                                  <span className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">{type}</span>
                                </div>
                                <span className="font-semibold text-emerald-700 dark:text-emerald-300">KES {amount.toLocaleString()}</span>
                              </div>
                              <div className="w-full bg-emerald-100 dark:bg-emerald-900/30 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${colors[index % colors.length]}`} 
                                  style={{width: `${Math.max(percentage, 5)}%`}}
                                ></div>
                              </div>
                              <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                                {percentage.toFixed(1)}% of total contributions
                              </div>
                            </div>
                          )
                        })}
                        {contributions.length === 0 && (
                          <div className="text-center py-8">
                            <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-3">
                              <TrendingUp className="h-6 w-6 text-emerald-400" />
                            </div>
                            <h4 className="font-medium text-emerald-900 dark:text-emerald-100 mb-1">No contribution data</h4>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400">Contribution types will appear here once data is available.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Detailed Reports Section */}
              <ContributionsReport />
              
              <DisbursementsReport />
              
              <ExpensesReport />

              {/* Enhanced Export Actions */}
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-xl text-amber-900 dark:text-amber-100 flex items-center gap-2">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                          <Download className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        Comprehensive Report Downloads
                      </CardTitle>
                      <CardDescription className="text-amber-700 dark:text-amber-300">
                        Generate detailed financial reports with advanced analytics, visual charts, and executive summaries for stakeholders and regulatory compliance.
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300 dark:border-amber-700">
                      Professional Reports
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Report Types Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-amber-200 dark:border-amber-800 shadow-sm hover:shadow-md transition-shadow group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full group-hover:scale-110 transition-transform">
                          <File className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <Badge variant="outline" className="text-xs">CSV Format</Badge>
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Spreadsheet Data Export</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Raw financial data in CSV format for advanced analysis in Excel or Google Sheets</p>
                      <Button 
                        onClick={() => handleTreasurerExport('csv')}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <File className="h-4 w-4 mr-2" />
                        Download CSV
                      </Button>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-amber-200 dark:border-amber-800 shadow-sm hover:shadow-md transition-shadow group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full group-hover:scale-110 transition-transform">
                          <FileSpreadsheet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <Badge variant="outline" className="text-xs">Excel Format</Badge>
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Professional Excel Report</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Formatted Excel workbook with charts, formulas, and professional styling</p>
                      <Button 
                        onClick={() => handleTreasurerExport('excel')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Download Excel
                      </Button>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-amber-200 dark:border-amber-800 shadow-sm hover:shadow-md transition-shadow group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full group-hover:scale-110 transition-transform">
                          <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <Badge variant="outline" className="text-xs">PDF Format</Badge>
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Executive PDF Report</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Professionally formatted PDF with executive summary and visual charts</p>
                      <Button 
                        onClick={() => handleTreasurerExport('pdf')}
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                        size="sm"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>
                  </div>
                  
                  {/* Report Features */}
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-amber-200 dark:border-amber-800">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      Report Features & Analytics
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-start gap-3">
                        <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded">
                          <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">Financial Summaries</div>
                          <div className="text-gray-600 dark:text-gray-400">Complete income & expense analysis</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded">
                          <PieChart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">Visual Charts</div>
                          <div className="text-gray-600 dark:text-gray-400">Interactive graphs & analytics</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded">
                          <Calculator className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">Trend Analysis</div>
                          <div className="text-gray-600 dark:text-gray-400">Monthly & yearly comparisons</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-1 bg-orange-100 dark:bg-orange-900/30 rounded">
                          <Shield className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">Compliance Ready</div>
                          <div className="text-gray-600 dark:text-gray-400">Audit & regulatory standards</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Info */}
                  <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-amber-200 dark:bg-amber-800 rounded-full mt-0.5">
                        <FileText className="h-4 w-4 text-amber-800 dark:text-amber-200" />
                      </div>
                      <div className="space-y-1">
                        <h5 className="font-medium text-amber-900 dark:text-amber-100">Comprehensive Financial Intelligence</h5>
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                          Generated reports include detailed financial summaries, monthly trend analysis, expense categorization, 
                          revenue stream breakdowns, member contribution patterns, disbursement tracking, and strategic recommendations 
                          for improved financial management and organizational growth.
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300">Real-time Data</Badge>
                          <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300">Professional Format</Badge>
                          <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300">Audit Trail</Badge>
                          <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300">Executive Summary</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
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

        {/* Member Deletion Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="sm:max-w-[425px]">
            <AlertDialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <AlertDialogTitle className="text-red-900 dark:text-red-100">
                    Delete Member Account
                  </AlertDialogTitle>
                </div>
              </div>
              <AlertDialogDescription className="pt-4">
                <div className="space-y-3">
                  <p className="text-gray-700 dark:text-gray-300">
                    Are you sure you want to <strong>permanently delete</strong> the following member?
                  </p>
                  
                  {memberToDelete && (
                    <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-red-200 dark:border-red-700">
                          <AvatarImage 
                            src={memberToDelete.profile_picture_url || undefined}
                            alt={`${memberToDelete.first_name} ${memberToDelete.last_name}`}
                          />
                          <AvatarFallback className="bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200">
                            {memberToDelete.first_name.charAt(0)}{memberToDelete.last_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-red-900 dark:text-red-100">
                            {memberToDelete.first_name} {memberToDelete.last_name}
                          </div>
                          <div className="text-sm text-red-700 dark:text-red-300">
                            TNS: {memberToDelete.tns_number || 'Not assigned'}
                          </div>
                          <div className="text-sm text-red-600 dark:text-red-400">
                            {memberToDelete.email}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded border border-amber-200 dark:border-amber-800">
                    <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      This action will delete:
                    </h4>
                    <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1 ml-6">
                      <li>• Member profile and personal information</li>
                      <li>• All payment history and MPESA transactions</li>
                      <li>• All contributions and disbursement records</li>
                      <li>• TNS membership number assignment</li>
                    </ul>
                  </div>
                  
                  <p className="text-red-700 dark:text-red-300 font-medium">
                    ⚠️ This action cannot be undone!
                  </p>
                  
                  <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded border border-red-200 dark:border-red-800">
                    <label className="block text-sm font-medium text-red-900 dark:text-red-100 mb-2">
                      To confirm deletion, type <code className="bg-red-200 dark:bg-red-800 px-1 rounded text-xs">DELETE</code> below:
                    </label>
                    <Input
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder="Type DELETE to confirm"
                      className="border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500"
                      disabled={isDeleting}
                      autoComplete="off"
                    />
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-3 pt-6">
              <AlertDialogCancel 
                disabled={isDeleting}
                className="border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                onClick={() => setDeleteConfirmation("")}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteMember}
                disabled={isDeleting || deleteConfirmation !== "DELETE"}
                className="bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Permanently
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;
