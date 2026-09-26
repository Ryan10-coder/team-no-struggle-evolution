import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Phone, DollarSign } from "lucide-react";

interface MPESAPaymentProps {
  memberId: string;
  memberName?: string;
}

const normalizeKenyanPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");

  if (!digits) return "";

  if (digits.startsWith("0") && digits.length === 10) {
    return `254${digits.slice(1)}`;
  }

  if (digits.startsWith("254") && digits.length === 12) {
    return digits;
  }

  if (digits.startsWith("7") && digits.length === 9) {
    return `254${digits}`;
  }

  return digits;
};

export const MPESAPayment = ({ memberId, memberName }: MPESAPaymentProps) => {
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    if (!amount || !phoneNumber) {
      toast.error("Please fill in all fields");
      return;
    }

    if (parseFloat(amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    const normalizedPhone = normalizeKenyanPhone(phoneNumber);

    if (!/^((2547\d{8})|(7\d{8})|(0[17]\d{8})|(\+2547\d{8}))$/.test(normalizedPhone)) {
      toast.error("Invalid phone number format. Use 0712345678 or +254712345678");
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
        body: {
          action: 'stk_push',
          memberId,
          amount: parseFloat(amount),
          phoneNumber: normalizedPhone
        }
      });

      if (error) {
        console.error('Edge function invocation error:', error);
        toast.error(`Payment failed: ${error.message}`);
        return;
      }

      if (data?.success) {
        toast.success("STK push sent! Please check your phone and enter your MPESA PIN.");
        setAmount("");
        setPhoneNumber("");
      } else {
        const errorMsg = data?.error || "Payment failed - unknown error";
        console.error('Payment failed:', errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : "Payment failed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <DollarSign className="h-5 w-5" />
          MPESA Payment
        </CardTitle>
        <CardDescription>
          {memberName ? `Make payment for ${memberName}` : 'Make your membership payment'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (KSH)</Label>
          <Input
            id="amount"
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isLoading}
            min="1"
            step="0.01"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label> 
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="phone"
              type="tel"
              placeholder="0712345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isLoading}
              className="pl-10"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Enter your Safaricom number (format: 0712345678)
          </p>
        </div>

        <Button 
          onClick={handlePayment} 
          className="w-full"
          disabled={isLoading || !amount || !phoneNumber}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending STK Push...
            </>
          ) : (
            'Pay via MPESA'
          )}
        </Button>

        <div className="text-center text-xs text-muted-foreground">
          <p>Paybill: 4148511</p>
          <p>You will receive an STK push notification on your phone</p>
        </div>
      </CardContent>
    </Card>
  );
};
