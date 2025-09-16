import { useState, useEffect } from "react";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, Search, ArrowLeft, Users, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Member {
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
  // Additional fields for comprehensive member data
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

interface MemberBalance {
  current_balance: number;
  total_contributions: number;
  total_disbursements: number;
}

interface Contribution {
  amount: number;
  contribution_date: string;
  contribution_type: string;
}

const CoordinatorPortal = () => {
  const { staffUser } = useStaffAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [memberBalances, setMemberBalances] = useState<Record<string, MemberBalance>>({});
  const [contributions, setContributions] = useState<Record<string, Contribution[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [assignedArea, setAssignedArea] = useState("");

  useEffect(() => {
    if (!staffUser) {
      navigate("/portal-login");
      return;
    }

    fetchCoordinatorData();
  }, [staffUser, navigate]);

  useEffect(() => {
    const filtered = members.filter(member =>
      member.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.tns_number && member.tns_number.includes(searchTerm))
    );
    setFilteredMembers(filtered);
  }, [searchTerm, members]);

  const fetchCoordinatorData = async () => {
    try {
      if (!staffUser || staffUser.staff_role !== "Area Coordinator") {
        toast.error("Access denied. You are not an approved area coordinator.");
        navigate("/portal-login");
        return;
      }

      if (!staffUser.assigned_area) {
        toast.error("No assigned area found. Contact your administrator.");
        return;
      }

      setAssignedArea(staffUser.assigned_area);

      // Parse the assigned area - handle both "City, State" and just "City" formats
      const areaParts = staffUser.assigned_area.includes(',') 
        ? staffUser.assigned_area.split(', ')
        : [staffUser.assigned_area, ''];

      const city = areaParts[0].trim();
      const state = areaParts[1] ? areaParts[1].trim() : '';

      // Fetch ALL members in coordinator's area (both approved and pending for comprehensive view)
      let query = supabase
        .from("membership_registrations")
        .select(`
          *,
          id,
          user_id,
          created_at,
          updated_at,
          registration_date,
          probation_end_date,
          days_to_maturity,
          first_name,
          last_name,
          email,
          phone,
          address,
          city,
          state,
          zip_code,
          emergency_contact_name,
          emergency_contact_phone,
          membership_type,
          payment_status,
          registration_status,
          id_number,
          alternative_phone,
          sex,
          marital_status,
          profile_picture_url,
          maturity_status,
          tns_number
        `)
        .eq("city", city)
        .in("registration_status", ["approved", "pending"]);

      // Add state filter if it exists
      if (state) {
        query = query.eq("state", state);
      }

      const { data: membersData, error: membersError } = await query;

      if (membersError) {
        toast.error("Error fetching members data");
        return;
      }

      setMembers(membersData || []);

      // Fetch member balances and contributions for each member
      if (membersData && membersData.length > 0) {
        await fetchMemberFinancialData(membersData.map(m => m.id));
      }

    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while fetching data");
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberFinancialData = async (memberIds: string[]) => {
    try {
      // Fetch balances
      const { data: balancesData } = await supabase
        .from("member_balances")
        .select("*")
        .in("member_id", memberIds);

      const balancesMap: Record<string, MemberBalance> = {};
      balancesData?.forEach(balance => {
        balancesMap[balance.member_id] = {
          current_balance: balance.current_balance,
          total_contributions: balance.total_contributions,
          total_disbursements: balance.total_disbursements
        };
      });
      setMemberBalances(balancesMap);

      // Fetch contributions
      const { data: contributionsData } = await supabase
        .from("contributions")
        .select("member_id, amount, contribution_date, contribution_type")
        .in("member_id", memberIds)
        .order("contribution_date", { ascending: false });

      const contributionsMap: Record<string, Contribution[]> = {};
      contributionsData?.forEach(contribution => {
        if (!contributionsMap[contribution.member_id]) {
          contributionsMap[contribution.member_id] = [];
        }
        contributionsMap[contribution.member_id].push({
          amount: contribution.amount,
          contribution_date: contribution.contribution_date,
          contribution_type: contribution.contribution_type
        });
      });
      setContributions(contributionsMap);

    } catch (error) {
      console.error("Error fetching financial data:", error);
    }
  };

  const exportToExcel = async () => {
    try {
      const response = await supabase.functions.invoke('export-excel', {
        body: {
          members: filteredMembers,
          contributions: contributions,
          balances: memberBalances,
          area: assignedArea
        }
      });

      if (response.error) {
        toast.error("Error generating Excel file");
        return;
      }

      // Create download link
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${assignedArea}_members_contributions_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Excel file downloaded successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Error exporting data");
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

  const totalMembers = members.length;
  const totalContributions = Object.values(memberBalances).reduce(
    (sum, balance) => sum + balance.total_contributions, 0
  );

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => navigate("/portal-login")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Portal
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Area Coordinator Portal</h1>
              <p className="text-muted-foreground">Managing: {assignedArea}</p>
            </div>
          </div>
          <Button onClick={exportToExcel} className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export Excel</span>
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMembers}</div>
              <p className="text-xs text-muted-foreground">In your area</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contributions</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalContributions)}</div>
              <p className="text-xs text-muted-foreground">From all members</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Contribution</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalMembers > 0 ? totalContributions / totalMembers : 0)}
              </div>
              <p className="text-xs text-muted-foreground">Per member</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Member Search & Filter</CardTitle>
            <CardDescription>Search by name, email, or TNS number</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Members Table */}
        <Card>
          <CardHeader>
            <CardTitle>Members in {assignedArea}</CardTitle>
            <CardDescription>
              {filteredMembers.length} of {totalMembers} members shown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                 <TableHeader>
                  <TableRow>
                    <TableHead>Photo</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>TNS Number</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Alt Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>ID Number</TableHead>
                    <TableHead>Sex</TableHead>
                    <TableHead>Marital Status</TableHead>
                    <TableHead>Emergency Contact</TableHead>
                    <TableHead>Membership Type</TableHead>
                    <TableHead>Registration Status</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Maturity Status</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Total Contributions</TableHead>
                    <TableHead>Days to Maturity</TableHead>
                    <TableHead>Registration Date</TableHead>
                  </TableRow>
                </TableHeader>
                 <TableBody>
                   {filteredMembers.map((member) => (
                     <TableRow key={member.id}>
                       <TableCell>
                         {member.profile_picture_url ? (
                           <img 
                             src={member.profile_picture_url} 
                             alt={`${member.first_name} ${member.last_name}`}
                             className="w-10 h-10 rounded-full object-cover"
                           />
                         ) : (
                           <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                             <span className="text-sm font-medium">
                               {member.first_name[0]}{member.last_name[0]}
                             </span>
                           </div>
                         )}
                       </TableCell>
                       <TableCell className="font-medium">
                         {member.first_name} {member.last_name}
                       </TableCell>
                       <TableCell>{member.tns_number || "N/A"}</TableCell>
                       <TableCell>{member.email}</TableCell>
                       <TableCell>{member.phone}</TableCell>
                       <TableCell>{member.alternative_phone || "N/A"}</TableCell>
                       <TableCell>
                         <div className="max-w-xs truncate" title={`${member.address}, ${member.city}, ${member.state} ${member.zip_code}`}>
                           {member.address ? `${member.address}, ${member.city}, ${member.state} ${member.zip_code}` : "N/A"}
                         </div>
                       </TableCell>
                       <TableCell>{member.id_number || "N/A"}</TableCell>
                       <TableCell>{member.sex || "N/A"}</TableCell>
                       <TableCell>{member.marital_status || "N/A"}</TableCell>
                       <TableCell>
                         <div className="max-w-xs">
                           <div className="font-medium">{member.emergency_contact_name || "N/A"}</div>
                           <div className="text-sm text-muted-foreground">{member.emergency_contact_phone || ""}</div>
                         </div>
                       </TableCell>
                       <TableCell>{member.membership_type}</TableCell>
                       <TableCell>
                         <Badge 
                           variant={member.registration_status === 'approved' ? 'default' : 'secondary'}
                         >
                           {member.registration_status}
                         </Badge>
                       </TableCell>
                       <TableCell>
                         <Badge 
                           variant={member.payment_status === 'paid' ? 'default' : 'destructive'}
                         >
                           {member.payment_status}
                         </Badge>
                       </TableCell>
                       <TableCell>
                         <Badge 
                           variant={member.maturity_status === 'mature' ? 'default' : 'secondary'}
                         >
                           {member.maturity_status}
                         </Badge>
                       </TableCell>
                       <TableCell>
                         {formatCurrency(memberBalances[member.id]?.current_balance || 0)}
                       </TableCell>
                       <TableCell>
                         {formatCurrency(memberBalances[member.id]?.total_contributions || 0)}
                       </TableCell>
                       <TableCell>
                         {member.maturity_status === 'probation' 
                           ? `${member.days_to_maturity || 0} days`
                           : "Mature"
                         }
                       </TableCell>
                       <TableCell>
                         {member.registration_date ? new Date(member.registration_date).toLocaleDateString() : "N/A"}
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CoordinatorPortal;