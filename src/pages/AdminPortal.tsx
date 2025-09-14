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
import { Loader2, Users, UserCheck, UserX, Shield, Key, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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

const AdminPortal = () => {
  const { user } = useAuth();
  const { staffUser, logout: staffLogout } = useStaffAuth();
  const navigate = useNavigate();
  const [pendingMembers, setPendingMembers] = useState<MemberRegistration[]>([]);
  const [allMembers, setAllMembers] = useState<MemberRegistration[]>([]);
  const [pendingStaff, setPendingStaff] = useState<StaffRegistration[]>([]);
  const [allStaff, setAllStaff] = useState<StaffRegistration[]>([]);
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

      setPendingMembers(members || []);
      setAllMembers(allMembersData || []);
      setPendingStaff(staff || []);
      setAllStaff(allStaffData || []);
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
                {staffUser && ` • Logged in as: ${staffUser.first_name} ${staffUser.last_name} (${staffUser.staff_role})`}
                {user && !staffUser && ` • User: ${user.email}`}
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

        <Tabs defaultValue="pending-members" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
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
                                  alt={`${member.first_name} ${member.last_name}`}
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
                                alt={`${member.first_name} ${member.last_name}`}
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