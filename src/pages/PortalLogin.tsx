import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Shield, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const PortalLogin = () => {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handlePortalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please login first");
      navigate("/auth");
      return;
    }

    if (!selectedRole || !password) {
      toast.error("Please select a role and enter password");
      return;
    }

    setIsLoading(true);

    try {
      // Verify user has the selected role and is approved
      const { data: staffData, error: staffError } = await supabase
        .from("staff_registrations")
        .select("staff_role, pending, portal_password")
        .eq("user_id", user.id)
        .eq("staff_role", selectedRole)
        .single();

      if (staffError || !staffData) {
        toast.error(`You are not registered as ${selectedRole}`);
        setIsLoading(false);
        return;
      }

      if (staffData.pending !== "approved") {
        toast.error(`Your ${selectedRole} role is still pending approval`);
        setIsLoading(false);
        return;
      }

      // Check password against the assigned portal password
      if (!staffData.portal_password) {
        toast.error("No portal password assigned. Contact your administrator.");
        setIsLoading(false);
        return;
      }

      if (password !== staffData.portal_password) {
        toast.error("Incorrect portal password");
        setIsLoading(false);
        return;
      }

      // Success - redirect to appropriate portal
      toast.success(`Welcome to ${selectedRole} Portal`);
      
      switch (selectedRole) {
        case "Admin":
          navigate("/admin");
          break;
        case "Coordinator":
          navigate("/coordinator");
          break;
        case "Auditor":
          navigate("/auditor");
          break;
        case "Treasurer":
          navigate("/admin"); // Treasurers use admin portal
          break;
        default:
          navigate("/dashboard");
      }

    } catch (error) {
      console.error("Portal login error:", error);
      toast.error("An error occurred during portal login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl">Portal Access</CardTitle>
            <CardDescription>
              Select your role and enter the portal password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePortalLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Select Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Coordinator">Coordinator</SelectItem>
                    <SelectItem value="Auditor">Auditor</SelectItem>
                    <SelectItem value="Treasurer">Treasurer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Portal Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter portal password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !selectedRole || !password}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accessing Portal...
                  </>
                ) : (
                  "Access Portal"
                )}
              </Button>
            </form>

            <div className="mt-4 text-center space-y-2">
              <Button 
                variant="outline" 
                onClick={() => navigate("/dashboard")}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
              
              <div className="text-sm text-muted-foreground">
                Contact your administrator for portal passwords
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PortalLogin;