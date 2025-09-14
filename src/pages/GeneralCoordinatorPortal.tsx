import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, Users, MapPin, CheckCircle, XCircle, Clock, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AreaCoordinator {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  assigned_area: string;
  pending: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  task_type: string;
  status: string;
  priority: string;
  submitted_by: string;
  assigned_area: string;
  created_at: string;
  submitted_to_role: string;
}

interface AreaStatistics {
  area: string;
  totalMembers: number;
  matureMembers: number;
  totalContributions: number;
  coordinator?: AreaCoordinator;
}

const GeneralCoordinatorPortal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [coordinators, setCoordinators] = useState<AreaCoordinator[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [areaStats, setAreaStats] = useState<AreaStatistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    fetchGeneralCoordinatorData();
  }, [user, navigate]);

  const fetchGeneralCoordinatorData = async () => {
    try {
      // Verify General Coordinator role
      const { data: staffData, error: staffError } = await supabase
        .from("staff_registrations")
        .select("staff_role")
        .eq("user_id", user?.id)
        .eq("staff_role", "General Coordinator")
        .eq("pending", "approved")
        .single();

      if (staffError || !staffData) {
        toast.error("Access denied. You are not an approved General Coordinator.");
        navigate("/dashboard");
        return;
      }

      await Promise.all([
        fetchAreaCoordinators(),
        fetchTasks(),
        fetchAreaStatistics()
      ]);
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while fetching data");
    } finally {
      setLoading(false);
    }
  };

  const fetchAreaCoordinators = async () => {
    const { data, error } = await supabase
      .from("staff_registrations")
      .select("*")
      .eq("staff_role", "Area Coordinator")
      .order("assigned_area");

    if (!error && data) {
      setCoordinators(data);
    }
  };

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("submitted_to_role", "General Coordinator")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTasks(data);
    }
  };

  const fetchAreaStatistics = async () => {
    try {
      // Get all unique areas
      const { data: areasData } = await supabase
        .from("membership_registrations")
        .select("city, state")
        .eq("registration_status", "approved");

      if (!areasData) return;

      const uniqueAreas = Array.from(
        new Set(areasData.map(m => `${m.city}, ${m.state}`))
      );

      const stats: AreaStatistics[] = [];

      for (const area of uniqueAreas) {
        const [city, state] = area.split(', ');
        
        // Get member statistics for this area
        const { data: membersData } = await supabase
          .from("membership_registrations")
          .select("*")
          .eq("city", city)
          .eq("state", state)
          .eq("registration_status", "approved");

        // Get contributions for this area
        const { data: contributionsData } = await supabase
          .from("contributions")
          .select("amount")
          .in("member_id", membersData?.map(m => m.id) || []);

        // Get coordinator for this area
        const coordinator = coordinators.find(c => c.assigned_area === area);

        stats.push({
          area,
          totalMembers: membersData?.length || 0,
          matureMembers: membersData?.filter(m => m.maturity_status === 'mature').length || 0,
          totalContributions: contributionsData?.reduce((sum, c) => sum + c.amount, 0) || 0,
          coordinator: coordinator
        });
      }

      setAreaStats(stats.sort((a, b) => a.area.localeCompare(b.area)));
    } catch (error) {
      console.error("Error fetching area statistics:", error);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (error) {
        toast.error("Error updating task status");
        return;
      }

      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));

      toast.success("Task status updated successfully");
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Error updating task status");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const filteredCoordinators = coordinators.filter(coordinator =>
    `${coordinator.first_name} ${coordinator.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coordinator.assigned_area?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.assigned_area?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case "in_progress":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
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
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">General Coordinator Portal</h1>
              <p className="text-muted-foreground">Oversee area coordinators and manage operations</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="coordinators">Area Coordinators</TabsTrigger>
            <TabsTrigger value="tasks">Tasks & Approvals</TabsTrigger>
            <TabsTrigger value="areas">Area Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Areas</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{areaStats.length}</div>
                  <p className="text-xs text-muted-foreground">Active areas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Area Coordinators</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {coordinators.filter(c => c.pending === 'approved').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Approved coordinators</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {tasks.filter(t => t.status === 'pending').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Awaiting review</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {areaStats.reduce((sum, area) => sum + area.totalMembers, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Across all areas</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="coordinators" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search coordinators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Area Coordinators</CardTitle>
                <CardDescription>Manage and oversee area coordinators</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Assigned Area</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCoordinators.map((coordinator) => (
                      <TableRow key={coordinator.id}>
                        <TableCell className="font-medium">
                          {coordinator.first_name} {coordinator.last_name}
                        </TableCell>
                        <TableCell>{coordinator.email}</TableCell>
                        <TableCell>{coordinator.phone}</TableCell>
                        <TableCell>{coordinator.assigned_area}</TableCell>
                        <TableCell>
                          <Badge variant={coordinator.pending === 'approved' ? 'default' : 'secondary'}>
                            {coordinator.pending}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Tasks & Approvals</CardTitle>
                <CardDescription>Review and manage tasks submitted by coordinators</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{task.title}</p>
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>{task.task_type}</TableCell>
                        <TableCell>{task.assigned_area}</TableCell>
                        <TableCell>
                          <Badge variant={task.priority === 'high' ? 'destructive' : 'outline'}>
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(task.status)}</TableCell>
                        <TableCell>{new Date(task.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {task.status === 'pending' && (
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                onClick={() => updateTaskStatus(task.id, 'completed')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateTaskStatus(task.id, 'rejected')}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="areas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Area Statistics</CardTitle>
                <CardDescription>Performance and membership data by area</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Area</TableHead>
                      <TableHead>Coordinator</TableHead>
                      <TableHead>Total Members</TableHead>
                      <TableHead>Mature Members</TableHead>
                      <TableHead>Total Contributions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {areaStats.map((area) => (
                      <TableRow key={area.area}>
                        <TableCell className="font-medium">{area.area}</TableCell>
                        <TableCell>
                          {area.coordinator ? (
                            <div>
                              <p>{area.coordinator.first_name} {area.coordinator.last_name}</p>
                              <p className="text-sm text-muted-foreground">{area.coordinator.email}</p>
                            </div>
                          ) : (
                            <Badge variant="outline">No Coordinator</Badge>
                          )}
                        </TableCell>
                        <TableCell>{area.totalMembers}</TableCell>
                        <TableCell>{area.matureMembers}</TableCell>
                        <TableCell>{formatCurrency(area.totalContributions)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GeneralCoordinatorPortal;