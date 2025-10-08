import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, DollarSign } from "lucide-react";
import { useStaffAuth } from "@/hooks/useStaffAuth";

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  tns_number: string;
  email: string;
}

// Define allowed payment types as constants for consistency
const PAYMENT_TYPES = {
  MONTHLY: 'monthly_contribution',
  CASES: 'cases',
  PROJECTS: 'projects', 
  REGISTRATION: 'registration',
  OTHERS: 'others'
} as const;

const PAYMENT_TYPE_LABELS = {
  [PAYMENT_TYPES.MONTHLY]: 'Monthly contribution',
  [PAYMENT_TYPES.CASES]: 'Cases',
  [PAYMENT_TYPES.PROJECTS]: 'Projects',
  [PAYMENT_TYPES.REGISTRATION]: 'Registration',
  [PAYMENT_TYPES.OTHERS]: 'Others'
} as const;

export const ManualPaymentEntry = ({ onSuccess }: { onSuccess?: () => void }) => {
  const { staffUser } = useStaffAuth();
  
  // Test authentication and permissions function
  const testAuth = async () => {
    console.log('=== Testing Authentication ===');
    console.log('Staff user from context:', staffUser);
    
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Auth user:', {
      id: user?.id,
      email: user?.email,
      aud: user?.aud,
      role: user?.role
    });
    
    // Test RLS by trying to read contributions
    const { data: contribData, error: contribError } = await supabase
      .from('contributions')
      .select('count')
      .limit(1);
    
    console.log('Can read contributions:', !contribError, contribError?.message);
    
    // Test RLS by trying to read mpesa_payments
    const { data: mpesaData, error: mpesaError } = await supabase
      .from('mpesa_payments')
      .select('count')
      .limit(1);
    
    console.log('Can read mpesa_payments:', !mpesaError, mpesaError?.message);
    
    // Test if we can insert to contributions
    console.log('Testing contribution insert permissions...');
    const testInsert = {
      member_id: '00000000-0000-0000-0000-000000000000', // Fake UUID for test
      amount: 1000,
      contribution_date: new Date().toISOString().split('T')[0],
      contribution_type: 'monthly_contribution',
      status: 'confirmed'
    };
    
    const { data: insertTest, error: insertError } = await supabase
      .from('contributions')
      .insert(testInsert)
      .select();
    
    console.log('Insert test result:', insertTest, 'Error:', insertError?.message);
    
    if (insertTest) {
      // Clean up test record
      await supabase.from('contributions').delete().eq('id', insertTest[0].id);
      console.log('Test record cleaned up');
    }
    
    console.log('=== End Authentication Test ===');
  };
  const [amount, setAmount] = useState("");
  const [selectedMember, setSelectedMember] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [paymentType, setPaymentType] = useState<string>(PAYMENT_TYPES.MONTHLY);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from('membership_registrations')
        .select('id, first_name, last_name, tns_number, email')
        .eq('registration_status', 'approved')
        .order('first_name');

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error("Failed to fetch members");
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMember || !amount || !paymentDate || !paymentType) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (parseFloat(amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    // Validate payment type is one of the allowed types
    const allowedPaymentTypes = Object.values(PAYMENT_TYPES);
    if (!allowedPaymentTypes.includes(paymentType as any)) {
      toast.error("Invalid payment type selected");
      return;
    }

    setIsLoading(true);
    
    // Debug: Check staff authentication
    console.log('Staff user from context:', staffUser);
    
    if (!staffUser) {
      toast.error('Staff authentication required. Please log in through staff portal.');
      setIsLoading(false);
      return;
    }
    
    if (!['Admin', 'Treasurer', 'Auditor'].includes(staffUser.staff_role)) {
      toast.error(`Insufficient permissions. Your role: ${staffUser.staff_role}. Required: Admin/Treasurer/Auditor.`);
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('Recording manual payment:', {
        memberId: selectedMember,
        amount: parseFloat(amount),
        paymentType,
        paymentDate,
        referenceNumber
      });

      // Use direct database insert for reliability
      console.log('Inserting contribution directly to database...');
      
      const contributionData = {
        member_id: selectedMember,
        amount: parseFloat(amount),
        contribution_date: paymentDate,
        contribution_type: paymentType,
        status: 'confirmed'
      };
      
      console.log('Contribution data:', contributionData);
      
      const { data: contributionResult, error: contributionError } = await supabase
        .from('contributions')
        .insert(contributionData)
        .select()
        .single();
        
      if (contributionError) {
        console.error('Contribution insertion failed:', contributionError);
        throw new Error(`Failed to record contribution: ${contributionError.message}`);
      }
      
      console.log('Contribution recorded successfully:', contributionResult);
      
      // Create MPESA audit record
      console.log('Creating MPESA audit record...');
      
      try {
        // Fetch member snapshot
        const { data: memberData, error: memberError } = await supabase
          .from('membership_registrations')
          .select('id, first_name, last_name, email, phone, tns_number, profile_picture_url, registration_status, payment_status, address, city, state, zip_code, id_number, emergency_contact_name, emergency_contact_phone, sex, marital_status')
          .eq('id', selectedMember)
          .single();
        
        if (memberError) {
          console.warn('Failed to fetch member data:', memberError);
        }
        
        const mpesaData = {
          member_id: selectedMember,
          amount: parseFloat(amount),
          phone_number: 'Manual Entry',
          mpesa_receipt_number: referenceNumber || 'Manual Entry',
          status: 'completed',
          result_code: '0',
          result_desc: 'Manual payment entry',
          transaction_date: new Date(paymentDate).toISOString(),
          member_snapshot: memberData || null
        };
        
        console.log('MPESA audit data:', mpesaData);

        const { data: mpesaResult, error: mpesaError } = await supabase
          .from('mpesa_payments')
          .insert(mpesaData)
          .select()
          .single();
          
        if (mpesaError) {
          console.warn('MPESA audit record failed:', mpesaError);
          // Don't throw - this is non-critical but log the error
        } else {
          console.log('MPESA audit record created successfully:', mpesaResult);
        }
      } catch (auditError) {
        console.warn('MPESA audit failed with exception:', auditError);
        // Don't throw - audit is non-critical
      }

      toast.success("Payment recorded successfully!", {
        description: `Amount: KES ${parseFloat(amount).toLocaleString()}`,
        duration: 5000
      });
      
      // Reset form
      setAmount("");
      setSelectedMember("");
      setReferenceNumber("");
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentType(PAYMENT_TYPES.MONTHLY);
      
      if (onSuccess) {
        console.log('Calling onSuccess callback to refresh data...');
        onSuccess();
      }
    } catch (error: any) {
      console.error('Payment entry error:', error);
      let errorMessage = "Failed to record payment";
      
      if (error.message) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = "Network error - please check your connection and try again";
        } else if (error.message.includes('timeout')) {
          errorMessage = "Request timed out - please try again";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage, {
        description: "If the problem persists, please contact support",
        duration: 6000
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Plus className="h-5 w-5" />
          Manual Payment Entry
        </CardTitle>
        <CardDescription>
          Record paybill or cash payments manually
          <br />
          <span className="text-xs font-medium text-green-600 dark:text-green-400">
            Restricted to: Monthly contribution • Cases • Projects • Registration • Others
          </span>
          <br />
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={testAuth}
            className="mt-2 text-xs"
          >
            Test Auth (Debug)
          </Button>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="member">Select Member</Label>
            <Select value={selectedMember} onValueChange={setSelectedMember} onOpenChange={(open) => {
              if (open && members.length === 0) fetchMembers();
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a member" />
              </SelectTrigger>
              <SelectContent>
                {loadingMembers ? (
                  <SelectItem value="loading" disabled>Loading members...</SelectItem>
                ) : (
                  members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.tns_number} - {member.first_name} {member.last_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (KSH)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="1"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentType">Payment Type *</Label>
            <Select value={paymentType} onValueChange={(value: string) => setPaymentType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_TYPES).map(([key, value]) => (
                  <SelectItem key={value} value={value}>
                    {PAYMENT_TYPE_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Only these payment types are allowed for manual entry
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentDate">Payment Date</Label>
            <Input
              id="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Reference Number (Optional)</Label>
            <Input
              id="reference"
              type="text"
              placeholder="MPESA receipt or reference"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
            />
          </div>

          <Button 
            type="submit"
            className="w-full"
            disabled={isLoading || !selectedMember || !amount}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recording Payment...
              </>
            ) : (
              <>
                <DollarSign className="mr-2 h-4 w-4" />
                Record Payment
              </>
            )}
          </Button>
        </form>

        <div className="mt-4 text-center text-xs text-muted-foreground">
          <p>Paybill: 4148511</p>
          <p>Use this form to record manual payments made via paybill or cash</p>
        </div>
      </CardContent>
    </Card>
  );
};
