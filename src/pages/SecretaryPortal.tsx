import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Mail, 
  Users, 
  FileText, 
  Calendar, 
  Phone, 
  MessageSquare,
  Download,
  Search,
  Send,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { DocumentList } from "@/components/DocumentList";
import { CommunicationCenter } from "@/components/CommunicationCenter";
import { useCrossPortalSync } from "@/hooks/useCrossPortalSync";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  registration_status: string;
  tns_number?: string;
}

const SecretaryPortal = () => {
  const { staffUser, logout } = useStaffAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [contactSubmissions, setContactSubmissions] = useState<ContactSubmission[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  
  // Set up cross-portal synchronization for member data
  useCrossPortalSync({
    onRefreshRequired: (source: string, reason: string) => {
      console.log(`SecretaryPortal: Refreshing data due to: ${reason} (from: ${source})`);
      fetchData();
    },
    portalName: 'SecretaryPortal',
    autoRefresh: true
  });

  useEffect(() => {
    if (!staffUser) {
      navigate("/portal-login");
      return;
    }

    if (staffUser.staff_role !== "Secretary") {
      toast.error("Access denied. Secretary role required.");
      navigate("/dashboard");
      return;
    }

    fetchData();
  }, [staffUser, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // For now, we'll show a message about contact submissions since they require admin access
      // In a real implementation, you'd need appropriate RLS policies for secretaries
      
      // Fetch approved members for directory
      const { data: memberData, error: memberError } = await supabase
        .from('membership_registrations')
        .select('*')
        .eq('registration_status', 'approved')
        .order('first_name');

      if (memberError) {
        console.error('Error fetching members:', memberError);
        toast.error('Failed to load member directory');
      } else {
        setMembers(memberData || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load portal data');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    logout();
    navigate("/portal-login");
    toast.success("Signed out successfully");
  };

  const filteredMembers = members.filter(member =>
    `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.tns_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportMemberDirectory = async () => {
    try {
      const csvContent = [
        ['TNS Number', 'Name', 'Email', 'Phone', 'Location'].join(','),
        ...filteredMembers.map(member => [
          member.tns_number || '',
          `${member.first_name} ${member.last_name}`,
          member.email,
          member.phone,
          `${member.city}, ${member.state}`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'member-directory.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success("Member directory exported successfully");
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export directory");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Secretary Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Secretary Portal
            </h1>
            <p className="text-muted-foreground mt-2">
              Welcome, {staffUser?.first_name} {staffUser?.last_name}
            </p>
          </div>
        </div>

        <Tabs defaultValue="communications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="communications" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Communications
            </TabsTrigger>
            <TabsTrigger value="directory" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Member Directory
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          {/* Communications Tab */}
          <TabsContent value="communications" className="space-y-6">
            <CommunicationCenter />
          </TabsContent>

          {/* Member Directory Tab */}
          <TabsContent value="directory" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Member Directory</CardTitle>
                    <CardDescription>
                      Manage and view all approved members
                    </CardDescription>
                  </div>
                  <Button onClick={exportMemberDirectory} className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export Directory
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search members by name, email, or TNS number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>TNS Number</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <Badge variant="outline">{member.tns_number || 'Pending'}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {member.first_name} {member.last_name}
                          </TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell>{member.phone}</TableCell>
                          <TableCell>{member.city}, {member.state}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(`tel:${member.phone}`)}
                              >
                                <Phone className="h-4 w-4 mr-1" />
                                Call
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(`mailto:${member.email}`)}
                              >
                                <Mail className="h-4 w-4 mr-1" />
                                Email
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {filteredMembers.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No members found matching your search.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <DocumentList />
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Management</CardTitle>
                <CardDescription>
                  Coordinate and manage organizational events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Upcoming Events</h3>
                    <Button>
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Event
                    </Button>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="border-dashed">
                      <CardContent className="flex items-center justify-center p-6">
                        <div className="text-center">
                          <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <h4 className="font-semibold mb-1">Monthly Meeting</h4>
                          <p className="text-sm text-muted-foreground mb-2">Coming Soon</p>
                          <Badge variant="outline">Planned</Badge>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-dashed">
                      <CardContent className="flex items-center justify-center p-6">
                        <div className="text-center">
                          <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <h4 className="font-semibold mb-1">Member Training</h4>
                          <p className="text-sm text-muted-foreground mb-2">TBD</p>
                          <Badge variant="outline">Planned</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-4">
                      Event management system coming soon. Contact your administrator for event scheduling.
                    </p>
                    <Button variant="outline">
                      <Calendar className="h-4 w-4 mr-2" />
                      Request Event Feature
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Administrative Reports</CardTitle>
                <CardDescription>
                  Generate and download various reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Users className="h-8 w-8 text-chart-1" />
                        <div>
                          <h3 className="font-semibold">Member Directory Report</h3>
                          <p className="text-sm text-muted-foreground">Complete member listing</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={exportMemberDirectory}>
                        <Download className="h-4 w-4 mr-2" />
                        Download CSV
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Mail className="h-8 w-8 text-chart-2" />
                        <div>
                          <h3 className="font-semibold">Communication Log</h3>
                          <p className="text-sm text-muted-foreground">Inquiry and response history</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SecretaryPortal;
