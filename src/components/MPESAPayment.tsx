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

  if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`;
  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("7") && digits.length === 9) return `254${digits}`;

  return "";
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

    const numericAmount = Number(amount);
    const normalizedPhone = normalizeKenyanPhone(phoneNumber);

    if (!Number.isInteger(numericAmount) || numericAmount <= 0) {
      toast.error("Enter a valid whole KES amount.");
      return;
    }

    if (!normalizedPhone) {
      toast.error("Invalid Safaricom number. Use 0712345678 or 254712345678.");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("mpesa-stk-push", {
        body: {
          action: "stk_push",
          memberId,
          amount: numericAmount,
          phoneNumber: normalizedPhone,
        },
      });

      if (error) {
        console.error("STK function invocation error:", error);
        toast.error(`Payment failed: ${error.message}`);
        return;
      }

      if (data?.success) {
        toast.success(
          data.message || "STK Push sent. Check the customer's phone for the M-PESA prompt.",
        );
        setAmount("");
        setPhoneNumber("");
      } else {
        console.error("STK Push failed:", data);
        toast.error(data?.error || "M-PESA STK Push failed.");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(
        error instanceof Error ? error.message : "Payment failed. Please try again.",
      );
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
          {memberName ? `Make payment for ${memberName}` : "Make your membership payment"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (KES)</Label>
          <Input
            id="amount"
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isLoading}
            min="1"
            step="1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Safaricom Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
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
            The M-PESA prompt will be sent to this Safaricom number.
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
              Sending M-PESA Prompt...
            </>
          ) : (
            "Send M-PESA Prompt"
          )}
        </Button>

        <div className="text-center text-xs text-muted-foreground">
          <p>Paybill: 4148511</p>
          <p>After sending, check the phone for the M-PESA PIN prompt.</p>
        </div>
      </CardContent>
    </Card>
  );
};
