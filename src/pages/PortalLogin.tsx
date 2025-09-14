import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Shield, ArrowLeft } from "lucide-react";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { toast } from "sonner";

const PortalLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login, isLoading, staffUser } = useStaffAuth();

  const handlePortalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }

    const result = await login(email, password);
    
    if (result.success) {
      const stored = localStorage.getItem('staff_user');
      const staff = staffUser || (stored ? JSON.parse(stored) : null);
      const role = staff?.staff_role;
      let target = "/admin";
      if (role === "Secretary") target = "/secretary";
      else if (role === "Auditor") target = "/auditor";
      else if (role === "Area Coordinator" || role === "General Coordinator") target = "/coordinator";
      toast.success(`Welcome to ${role || 'Staff'} Portal`);
      navigate(target);
    } else {
      toast.error(result.error || "Login failed");
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
            <CardTitle className="text-2xl">Staff Portal Login</CardTitle>
            <CardDescription>
              Enter your staff email and portal password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePortalLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Staff Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your staff email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
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
                disabled={isLoading || !email || !password}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login to Portal"
                )}
              </Button>
            </form>

            <div className="mt-4 text-center space-y-2">
              <Button 
                variant="outline" 
                onClick={() => navigate("/")}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
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