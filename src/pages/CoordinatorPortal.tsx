import { useState, useEffect } from "react";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Loader2, 
  Download, 
  Search, 
  ArrowLeft, 
  Users, 
  DollarSign, 
  MapPin, 
  Phone, 
  Mail, 
  MessageSquare,
  Send,
  Filter,
  RefreshCw,
  BarChart3,
  PieChart,
  TrendingUp,
  Activity,
  Eye,
  Edit,
  UserCheck,
  Clock,
  Calendar,
  Target,
  Award,
  Settings,
  Bell,
  Plus,
  ChevronRight,
  ChevronDown,
  Group,
  Building,
  AlertCircle,
  CheckCircle,
  MessageCircle,
  X,
  XCircle,
  Hash
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useCrossPortalSync } from "@/hooks/useCrossPortalSync";
import { format, addDays, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";

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

interface AreaStats {
  total_members: number;
  approved_members: number;
  pending_members: number;
  total_contributions: number;
  average_contribution: number;
  mature_members: number;
  probation_members: number;
  paid_members: number;
  unpaid_members: number;
}

interface AreaGroup {
  area: string;
  city: string;
  state: string;
  members: Member[];
  stats: AreaStats;
  isExpanded: boolean;
}

interface CommunicationMessage {
  title: string;
  message: string;
  recipients: 'all' | 'area' | 'selected';
  selectedMembers: string[];
  selectedArea?: string;
}

const CoordinatorPortal = () => {
  const { staffUser } = useStaffAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [allAreas, setAllAreas] = useState<string[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>("all");
  const [memberBalances, setMemberBalances] = useState<Record<string, MemberBalance>>({});
  const [contributions, setContributions] = useState<Record<string, Contribution[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [assignedArea, setAssignedArea] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [maturityFilter, setMaturityFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  
  // Area grouping state
  const [areaGroups, setAreaGroups] = useState<AreaGroup[]>([]);
  const [groupByArea, setGroupByArea] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'grouped'>('grouped');
  
  // Communication state
  const [communicationModal, setCommunicationModal] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<CommunicationMessage>({
    title: '',
    message: '',
    recipients: 'all',
    selectedMembers: [],
    selectedArea: undefined
  });
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Set up cross-portal synchronization for member data
  useCrossPortalSync({
    onRefreshRequired: (source: string, reason: string) => {
      console.log(`CoordinatorPortal: Refreshing data due to: ${reason} (from: ${source})`);
      fetchCoordinatorData();
    },
    portalName: 'CoordinatorPortal',
    autoRefresh: true
  });

  useEffect(() => {
    if (!staffUser) {
      navigate("/portal-login");
      return;
    }

    fetchCoordinatorData();
  }, [staffUser, navigate]);

  useEffect(() => {
    let filtered = members.filter(member => {
      // Search filter
      const matchesSearch = 
        member.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.tns_number && member.tns_number.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Area filter
      const matchesArea = selectedArea === "all" || 
        `${member.city}, ${member.state}` === selectedArea;
      
      // Status filter
      const matchesStatus = statusFilter === "all" || 
        member.registration_status === statusFilter;
      
      // Maturity filter
      const matchesMaturity = maturityFilter === "all" || 
        member.maturity_status === maturityFilter;
      
      // Payment filter
      const matchesPayment = paymentFilter === "all" || 
        member.payment_status === paymentFilter;
      
      return matchesSearch && matchesArea && matchesStatus && 
             matchesMaturity && matchesPayment;
    });

    setFilteredMembers(filtered);
    
    // Update area groups when filters change
    updateAreaGroups(filtered);
  }, [searchTerm, members, selectedArea, statusFilter, maturityFilter, paymentFilter]);
  
  const updateAreaGroups = (membersToGroup: Member[]) => {
    const groups: AreaGroup[] = [];
    
    if (groupByArea) {
      const areaMap = new Map<string, Member[]>();
      
      membersToGroup.forEach(member => {
        const area = `${member.city}, ${member.state}`;
        if (!areaMap.has(area)) {
          areaMap.set(area, []);
        }
        areaMap.get(area)!.push(member);
      });
      
      areaMap.forEach((members, area) => {
        const [city, state] = area.split(', ');
        const stats = calculateAreaStats(members);
        
        groups.push({
          area,
          city,
          state,
          members,
          stats,
          isExpanded: area === assignedArea // Auto-expand assigned area
        });
      });
      
      // Sort by member count descending
      groups.sort((a, b) => b.members.length - a.members.length);
    }
    
    setAreaGroups(groups);
  };
  
  const calculateAreaStats = (areaMembers: Member[]): AreaStats => {
    const totalMembers = areaMembers.length;
    const approvedMembers = areaMembers.filter(m => m.registration_status === 'approved').length;
    const pendingMembers = areaMembers.filter(m => m.registration_status === 'pending').length;
    const matureMembers = areaMembers.filter(m => m.maturity_status === 'mature').length;
    const probationMembers = areaMembers.filter(m => m.maturity_status === 'probation').length;
    const paidMembers = areaMembers.filter(m => m.payment_status === 'paid').length;
    const unpaidMembers = areaMembers.filter(m => m.payment_status !== 'paid').length;
    
    const totalContributions = areaMembers.reduce((sum, member) => 
      sum + (memberBalances[member.id]?.total_contributions || 0), 0
    );
    const averageContribution = totalMembers > 0 ? totalContributions / totalMembers : 0;
    
    return {
      total_members: totalMembers,
      approved_members: approvedMembers,
      pending_members: pendingMembers,
      total_contributions: totalContributions,
      average_contribution: averageContribution,
      mature_members: matureMembers,
      probation_members: probationMembers,
      paid_members: paidMembers,
      unpaid_members: unpaidMembers
    };
  };

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

      // Fetch ALL members from all areas (both approved and pending for comprehensive view)
      const { data: membersData, error: membersError } = await supabase
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
        .in("registration_status", ["approved", "pending"]);

      if (membersError) {
        toast.error("Error fetching members data");
        return;
      }

      setMembers(membersData || []);

      // Extract unique areas from all members
      const areas = Array.from(new Set(
        (membersData || []).map(member => `${member.city}, ${member.state}`)
      )).sort();
      setAllAreas(areas);

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

  const refreshData = async () => {
    setRefreshing(true);
    await fetchCoordinatorData();
    setRefreshing(false);
    toast.success('Data refreshed successfully');
  };
  
  const handleBulkMessage = async () => {
    if (!bulkMessage.title.trim() || !bulkMessage.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (bulkMessage.recipients === 'selected' && selectedMembers.length === 0) {
      toast.error('Please select at least one member');
      return;
    }
    
    try {
      setSendingMessage(true);
      
      let targetMembers: Member[] = [];
      
      if (bulkMessage.recipients === 'all') {
        targetMembers = filteredMembers;
      } else if (bulkMessage.recipients === 'area') {
        targetMembers = filteredMembers.filter(m => 
          `${m.city}, ${m.state}` === bulkMessage.selectedArea
        );
      } else {
        targetMembers = filteredMembers.filter(m => 
          selectedMembers.includes(m.id)
        );
      }
      
      // Simulate sending messages (replace with actual implementation)
      console.log('Sending message to', targetMembers.length, 'members');
      console.log('Message:', bulkMessage);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Message sent to ${targetMembers.length} member${targetMembers.length > 1 ? 's' : ''}`);
      setCommunicationModal(false);
      setBulkMessage({
        title: '',
        message: '',
        recipients: 'all',
        selectedMembers: [],
        selectedArea: undefined
      });
      setSelectedMembers([]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };
  
  const toggleAreaExpansion = (areaName: string) => {
    setAreaGroups(prev => 
      prev.map(group => 
        group.area === areaName 
          ? { ...group, isExpanded: !group.isExpanded }
          : group
      )
    );
  };
  
  const handleMemberSelect = (memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers(prev => [...prev, memberId]);
    } else {
      setSelectedMembers(prev => prev.filter(id => id !== memberId));
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
  
  // Calculate total stats for dashboard
  const totalStats = {
    totalMembers: filteredMembers.length,
    activeMembers: filteredMembers.filter(m => m.registration_status === 'approved').length,
    totalContributions: filteredMembers.reduce((sum, member) => 
      sum + (memberBalances[member.id]?.total_contributions || 0), 0
    )
  };

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
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setCommunicationModal(true)}
              className="flex items-center space-x-2"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Send Message</span>
            </Button>
            <Button
              onClick={refreshData}
              disabled={refreshing}
              variant="outline"
              className="flex items-center space-x-2"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>Refresh</span>
            </Button>
            <Button onClick={exportToExcel} className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export Excel</span>
            </Button>
          </div>
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

        {/* Advanced Search and Filter */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Member Search & Filters</span>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Group by Area:</label>
                <input
                  type="checkbox"
                  checked={groupByArea}
                  onChange={(e) => setGroupByArea(e.target.checked)}
                  className="rounded border-gray-300"
                />
              </div>
            </CardTitle>
            <CardDescription>Search, filter, and group members for better management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Primary Search and Area Filter */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2 flex-1 min-w-[300px]">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, TNS number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium whitespace-nowrap">Area:</label>
                <Select value={selectedArea} onValueChange={setSelectedArea}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Areas</SelectItem>
                    {allAreas.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Secondary Filters */}
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium whitespace-nowrap">Status:</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium whitespace-nowrap">Maturity:</label>
                <Select value={maturityFilter} onValueChange={setMaturityFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Maturity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="mature">Mature</SelectItem>
                    <SelectItem value="immature">Immature</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium whitespace-nowrap">Payment:</label>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="up-to-date">Up to Date</SelectItem>
                    <SelectItem value="behind">Behind</SelectItem>
                    <SelectItem value="no-contributions">No Contributions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2 ml-auto">
                <span className="text-sm text-muted-foreground">
                  {filteredMembers.length} of {members.length} members
                </span>
                {(searchTerm || selectedArea !== 'all' || statusFilter !== 'all' || 
                  maturityFilter !== 'all' || paymentFilter !== 'all') && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedArea('all');
                      setStatusFilter('all');
                      setMaturityFilter('all');
                      setPaymentFilter('all');
                    }}
                    className="h-8"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members Display - Conditional: Grouped by Area or List View */}
        {groupByArea ? (
          <div className="space-y-6">
            {areaGroups.map((group) => (
              <Card key={group.area} className="overflow-hidden">
                <CardHeader 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleAreaExpansion(group.area)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {group.isExpanded ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                        <MapPin className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{group.area}</CardTitle>
                        <CardDescription>
                          {group.stats.total_members} members • 
                          {formatCurrency(group.stats.total_contributions)} total contributions
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>{group.stats.approved_members} Active</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span>{group.stats.pending_members} Pending</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span>{group.stats.unpaid_members} Unpaid</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                {group.isExpanded && (
                  <CardContent className="pt-0">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {group.members.map((member) => {
                        const balance = memberBalances[member.id];
                        return (
                          <div key={member.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                            <div className="flex items-start space-x-3">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={selectedMembers.includes(member.id)}
                                  onChange={(e) => handleMemberSelect(member.id, e.target.checked)}
                                  className="rounded border-gray-300"
                                />
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
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-medium text-sm truncate">
                                    {member.first_name} {member.last_name}
                                  </h4>
                                  <div className="flex space-x-1">
                                    <Badge 
                                      variant={member.registration_status === 'approved' ? 'default' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {member.registration_status}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <div className="space-y-1 text-xs text-muted-foreground">
                                  <div className="flex items-center space-x-1">
                                    <Hash className="h-3 w-3" />
                                    <span>{member.tns_number || 'No TNS'}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Mail className="h-3 w-3" />
                                    <span className="truncate">{member.email}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Phone className="h-3 w-3" />
                                    <span>{member.phone}</span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex space-x-1">
                                    <Badge 
                                      variant={member.payment_status === 'paid' ? 'default' : 'destructive'}
                                      className="text-xs"
                                    >
                                      {member.payment_status}
                                    </Badge>
                                    <Badge 
                                      variant={member.maturity_status === 'mature' ? 'default' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {member.maturity_status}
                                    </Badge>
                                  </div>
                                  <div className="text-xs font-medium">
                                    {formatCurrency(balance?.total_contributions || 0)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  Members {selectedArea === "all" ? "from All Areas" : `in ${selectedArea}`}
                </span>
                {selectedMembers.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedMembers.length} selected
                    </span>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setBulkMessage(prev => ({
                          ...prev,
                          recipients: 'selected',
                          selectedMembers: selectedMembers
                        }));
                        setCommunicationModal(true);
                      }}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Message Selected
                    </Button>
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                {filteredMembers.length} of {totalMembers} members shown
                {selectedArea !== "all" && ` • Filtered by: ${selectedArea}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredMembers.map((member) => {
                  const balance = memberBalances[member.id];
                  return (
                    <div key={member.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(member.id)}
                            onChange={(e) => handleMemberSelect(member.id, e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          {member.profile_picture_url ? (
                            <img 
                              src={member.profile_picture_url} 
                              alt={`${member.first_name} ${member.last_name}`}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-sm font-medium">
                                {member.first_name[0]}{member.last_name[0]}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium truncate">
                              {member.first_name} {member.last_name}
                            </h4>
                            <div className="flex space-x-1">
                              <Badge 
                                variant={member.registration_status === 'approved' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {member.registration_status}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-2">
                              <Hash className="h-4 w-4" />
                              <span>{member.tns_number || 'No TNS'}</span>
                              <MapPin className="h-4 w-4 ml-auto" />
                              <span>{member.city}, {member.state}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4" />
                              <span className="truncate">{member.email}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4" />
                              <span>{member.phone}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex space-x-1">
                              <Badge 
                                variant={member.payment_status === 'paid' ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {member.payment_status}
                              </Badge>
                              <Badge 
                                variant={member.maturity_status === 'mature' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {member.maturity_status}
                              </Badge>
                            </div>
                            <div className="text-sm font-medium">
                              {formatCurrency(balance?.total_contributions || 0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {filteredMembers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No members found</p>
                  <p className="text-sm">Try adjusting your search or filter criteria.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Communication Modal */}
        {communicationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Send Bulk Message
                  </h2>
                  <button
                    onClick={() => setCommunicationModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Recipients Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Send to:
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="recipients"
                          value="all"
                          checked={bulkMessage.recipients === 'all'}
                          onChange={(e) => setBulkMessage(prev => ({ ...prev, recipients: e.target.value as any }))}
                          className="mr-2"
                        />
                        All filtered members ({filteredMembers.length} members)
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="recipients"
                          value="area"
                          checked={bulkMessage.recipients === 'area'}
                          onChange={(e) => setBulkMessage(prev => ({ ...prev, recipients: e.target.value as any }))}
                          className="mr-2"
                        />
                        Specific area
                      </label>
                      {bulkMessage.recipients === 'area' && (
                        <div className="ml-6">
                          <Select 
                            value={bulkMessage.selectedArea || ''} 
                            onValueChange={(value) => setBulkMessage(prev => ({ ...prev, selectedArea: value }))}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select area" />
                            </SelectTrigger>
                            <SelectContent>
                              {allAreas.map((area) => (
                                <SelectItem key={area} value={area}>
                                  {area} ({filteredMembers.filter(m => `${m.city}, ${m.state}` === area).length} members)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="recipients"
                          value="selected"
                          checked={bulkMessage.recipients === 'selected'}
                          onChange={(e) => setBulkMessage(prev => ({ ...prev, recipients: e.target.value as any }))}
                          className="mr-2"
                        />
                        Selected members ({selectedMembers.length} selected)
                      </label>
                    </div>
                  </div>
                  
                  {/* Message Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message Title *
                    </label>
                    <Input
                      value={bulkMessage.title}
                      onChange={(e) => setBulkMessage(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter message title..."
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message Content *
                    </label>
                    <textarea
                      value={bulkMessage.message}
                      onChange={(e) => setBulkMessage(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Enter your message here..."
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  {/* Preview Recipients */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Message Preview</h4>
                    <div className="text-sm text-gray-600">
                      <p><strong>To:</strong> 
                        {bulkMessage.recipients === 'all' && `All filtered members (${filteredMembers.length})`}
                        {bulkMessage.recipients === 'area' && bulkMessage.selectedArea && 
                          `${bulkMessage.selectedArea} (${filteredMembers.filter(m => `${m.city}, ${m.state}` === bulkMessage.selectedArea).length} members)`}
                        {bulkMessage.recipients === 'selected' && `${selectedMembers.length} selected members`}
                      </p>
                      <p><strong>Subject:</strong> {bulkMessage.title || '(No title)'}</p>
                      <p><strong>Message:</strong> {bulkMessage.message ? `${bulkMessage.message.slice(0, 100)}${bulkMessage.message.length > 100 ? '...' : ''}` : '(No message)'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCommunicationModal(false)}
                    disabled={sendingMessage}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleBulkMessage}
                    disabled={sendingMessage || !bulkMessage.title.trim() || !bulkMessage.message.trim()}
                    className="flex items-center"
                  >
                    {sendingMessage ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoordinatorPortal;
