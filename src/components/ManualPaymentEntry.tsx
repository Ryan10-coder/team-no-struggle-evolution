import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, DollarSign } from "lucide-react";

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
    
    try {
      console.log('Recording manual payment:', {
        memberId: selectedMember,
        amount: parseFloat(amount),
        paymentType,
        paymentDate,
        referenceNumber
      });

      let edgeFunctionSuccess = false;
      
      // Try edge function first (with timeout)
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch("https://wfqgnshhlfuznabweofj.supabase.co/functions/v1/record-transaction", {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmcWduc2hobGZ1em5hYndlb2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNTE0MzgsImV4cCI6MjA3MDgyNzQzOH0.EsPr_ypf7B1PXTWmjS2ZGXDVBe7HeNHDWsvJcgQpkLA",
            'apikey': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmcWduc2hobGZ1em5hYndlb2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNTE0MzgsImV4cCI6MjA3MDgyNzQzOH0.EsPr_ypf7B1PXTWmjS2ZGXDVBe7HeNHDWsvJcgQpkLA"
          },
          body: JSON.stringify({
            action: 'manual_payment',
            memberId: selectedMember,
            amount: parseFloat(amount),
            paymentType,
            paymentDate,
            referenceNumber
          })
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            edgeFunctionSuccess = true;
            console.log('Edge function succeeded');
          }
        } else {
          console.log('Edge function returned error status:', response.status);
        }
      } catch (edgeError) {
        console.log('Edge function failed, using fallback:', edgeError.message);
        // Continue to fallback logic
      }
      
      if (!edgeFunctionSuccess) {
        console.log('Using direct database fallback');
        
        // Fallback: Direct database insert
        const { error: contributionError } = await supabase
          .from('contributions')
          .insert({
            member_id: selectedMember,
            amount: parseFloat(amount),
            contribution_date: paymentDate,
            contribution_type: paymentType,
            status: 'confirmed'
          });
          
        if (contributionError) {
          throw new Error(`Failed to record contribution: ${contributionError.message}`);
        }
        
        console.log('Contribution recorded successfully');
        
        // Best-effort MPESA audit record
        try {
          // Fetch member snapshot
          const { data: memberData } = await supabase
            .from('membership_registrations')
            .select('id, first_name, last_name, email, phone, tns_number, profile_picture_url, registration_status, payment_status, address, city, state, zip_code, id_number, emergency_contact_name, emergency_contact_phone, sex, marital_status')
            .eq('id', selectedMember)
            .single();

          const { error: mpesaError } = await supabase
            .from('mpesa_payments')
            .insert({
              member_id: selectedMember,
              amount: parseFloat(amount),
              phone_number: 'Manual Entry',
              mpesa_receipt_number: referenceNumber || 'Manual Entry',
              status: 'completed',
              result_code: '0',
              result_desc: 'Manual payment entry (fallback)',
              transaction_date: new Date(paymentDate).toISOString(),
              member_snapshot: memberData || null
            });
            
          if (mpesaError) {
            console.warn('MPESA audit record failed:', mpesaError.message);
            // Don't throw - this is non-critical
          } else {
            console.log('MPESA audit record created successfully');
          }
        } catch (auditError) {
          console.warn('MPESA audit failed:', auditError.message);
          // Don't throw - audit is non-critical
        }
      }

      toast.success("Payment recorded successfully!");
      
      // Reset form
      setAmount("");
      setSelectedMember("");
      setReferenceNumber("");
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentType(PAYMENT_TYPES.MONTHLY);
      
      if (onSuccess) onSuccess();
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
