import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, UserCheck, UserX, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface MemberRegistration {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  membership_type: string;
  registration_status: string;
  registration_date: string;
  tns_number?: string;
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

const AdminPortal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingMembers, setPendingMembers] = useState<MemberRegistration[]>([]);
  const [allMembers, setAllMembers] = useState<MemberRegistration[]>([]);
  const [pendingStaff, setPendingStaff] = useState<StaffRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    checkAdminAccess();
  }, [user, navigate]);

  const checkAdminAccess = async () => {
    try {
      const { data: staffData, error } = await supabase
        .from("staff_registrations")
        .select("*")
        .eq("user_id", user?.id)
        .eq("staff_role", "Admin")
        .eq("pending", "approved")
        .single();

      if (error) {
        toast.error("Access denied. Admin privileges required.");
        navigate("/dashboard");
        return;
      }

      fetchPendingRegistrations();
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/dashboard");
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

      setPendingMembers(members || []);
      setAllMembers(allMembersData || []);
      setPendingStaff(staff || []);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      toast.error("Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  const approveMember = async (memberId: string) => {
    try {
      // Generate TNS number
      const tnsNumber = `TNS${Date.now().toString().slice(-6)}`;
      
      const { error } = await supabase
        .from("membership_registrations")
        .update({ 
          registration_status: "approved",
          tns_number: tnsNumber,
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

  const approveStaff = async (staffId: string) => {
    try {
      const { error } = await supabase
        .from("staff_registrations")
        .update({ pending: "approved" })
        .eq("id", staffId);

      if (error) throw error;

      toast.success("Staff member approved successfully!");
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
              <p className="text-muted-foreground">Manage member and staff approvals</p>
            </div>
          </div>
          <Button onClick={() => navigate("/dashboard")} variant="outline">
            Back to Dashboard
          </Button>
        </div>

        <Tabs defaultValue="pending-members" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending-members" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Pending Members ({pendingMembers.length})</span>
            </TabsTrigger>
            <TabsTrigger value="all-members" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>All Members ({allMembers.length})</span>
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Pending Staff ({pendingStaff.length})</span>
            </TabsTrigger>
          </TabsList>

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
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Membership Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">
                            {member.first_name} {member.last_name}
                          </TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell>{member.phone}</TableCell>
                          <TableCell>{member.city}, {member.state}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{member.membership_type}</Badge>
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
                <CardTitle>All Members</CardTitle>
                <CardDescription>
                  View all registered members and their status
                </CardDescription>
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
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Membership Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>TNS Number</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">
                            {member.first_name} {member.last_name}
                          </TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell>{member.phone}</TableCell>
                          <TableCell>{member.city}, {member.state}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{member.membership_type}</Badge>
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
                          <TableCell>{member.tns_number || "Not assigned"}</TableCell>
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

          <TabsContent value="staff">
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
                                onClick={() => approveStaff(staff.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <UserCheck className="h-4 w-4 mr-1" />
                                Approve
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
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPortal;