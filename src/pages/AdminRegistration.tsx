import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Shield } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const AdminRegistration = () => {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    idNumber: '',
    phone: '',
    areaOfResidence: '',
    password: '',
  });

  const roles = [
    { value: 'advisory', label: 'Advisory Committee' },
    { value: 'general-coordinator', label: 'General Coordinator' },
    { value: 'area-coordinator', label: 'Area Coordinator' },
    { value: 'secretary', label: 'Secretary' },
    { value: 'customer-service', label: 'Customer Service Personnel' },
    { value: 'organizing-secretary', label: 'Organizing Secretary' },
    { value: 'treasurer', label: 'Treasurer' },
    { value: 'auditor', label: 'Auditor' },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      toast({
        title: "Role Required",
        description: "Please select your role before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));

    toast({
      title: "Admin Registration Submitted!",
      description: "Your registration has been submitted for approval. You will be contacted within 24 hours.",
    });

    // Reset form
    setFormData({
      name: '',
      idNumber: '',
      phone: '',
      areaOfResidence: '',
      password: '',
    });
    setSelectedRole('');

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Admin Registration
              </h1>
              <p className="text-xl text-muted-foreground">
                Register for committee and administrative roles in Team No Struggle
              </p>
            </div>

            <Card className="shadow-medium border-border/50">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-gradient-primary rounded-full">
                    <Shield className="h-8 w-8 text-primary-foreground" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  Administrative Role Registration
                </CardTitle>
                <p className="text-muted-foreground">
                  Complete the form below to register for an administrative role
                </p>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-foreground font-medium">
                      Select Role *
                    </Label>
                    <Select onValueChange={setSelectedRole} value={selectedRole}>
                      <SelectTrigger className="border-border/50 focus:border-primary">
                        <SelectValue placeholder="Choose your administrative role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground font-medium">
                      Full Name *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter your full name"
                      required
                      className="border-border/50 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="idNumber" className="text-foreground font-medium">
                      ID Number *
                    </Label>
                    <Input
                      id="idNumber"
                      value={formData.idNumber}
                      onChange={(e) => handleInputChange('idNumber', e.target.value)}
                      placeholder="Enter your national ID number"
                      required
                      className="border-border/50 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground font-medium">
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter your phone number"
                      required
                      className="border-border/50 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="areaOfResidence" className="text-foreground font-medium">
                      Area of Residence *
                    </Label>
                    <Input
                      id="areaOfResidence"
                      value={formData.areaOfResidence}
                      onChange={(e) => handleInputChange('areaOfResidence', e.target.value)}
                      placeholder="Enter your area of residence"
                      required
                      className="border-border/50 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-foreground font-medium">
                      Password *
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Create a secure password"
                      required
                      className="border-border/50 focus:border-primary"
                    />
                  </div>

                  <div className="pt-6">
                    <Button
                      type="submit"
                      className="w-full py-6 text-lg bg-gradient-primary hover:opacity-90 transition-opacity"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Submitting Registration...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-5 w-5 mr-2" />
                          Submit Registration
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AdminRegistration;