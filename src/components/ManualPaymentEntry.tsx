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

export const ManualPaymentEntry = () => {
  const [amount, setAmount] = useState("");
  const [selectedMember, setSelectedMember] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [paymentType, setPaymentType] = useState("monthly");
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
    
    if (!selectedMember || !amount || !paymentDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (parseFloat(amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    setIsLoading(true);
    
    try {
      // Add to contributions table
      const { error: contributionError } = await supabase
        .from('contributions')
        .insert({
          member_id: selectedMember,
          amount: parseFloat(amount),
          contribution_date: paymentDate,
          contribution_type: paymentType,
          status: 'confirmed'
        });

      if (contributionError) throw contributionError;

      // Also add to MPESA payments table for record keeping
      const { error: mpesaError } = await supabase
        .from('mpesa_payments')
        .insert({
          member_id: selectedMember,
          amount: parseFloat(amount),
          phone_number: 'Manual Entry',
          mpesa_receipt_number: referenceNumber || 'Manual Entry',
          status: 'completed',
          result_code: '0',
          result_desc: 'Manual payment entry',
          transaction_date: new Date(paymentDate).toISOString()
        });

      if (mpesaError) throw mpesaError;

      toast.success("Payment recorded successfully!");
      
      // Reset form
      setAmount("");
      setSelectedMember("");
      setReferenceNumber("");
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentType("monthly");
    } catch (error) {
      console.error('Payment entry error:', error);
      toast.error("Failed to record payment");
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
            <Label htmlFor="paymentType">Payment Type</Label>
            <Select value={paymentType} onValueChange={setPaymentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly Contribution</SelectItem>
                <SelectItem value="registration">Registration Fee</SelectItem>
                <SelectItem value="penalty">Penalty Payment</SelectItem>
                <SelectItem value="loan_repayment">Loan Repayment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
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
