import { useState } from "react";
import {
  Button,
} from "@/components/ui/button";
import {
  Input,
} from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Label,
} from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2,
  Phone,
  DollarSign,
} from "lucide-react";
import {
  FunctionsHttpError,
  FunctionsFetchError,
  FunctionsRelayError,
} from "@supabase/supabase-js";

interface MPESAPaymentProps {
  memberId: string;
  memberName?: string;
}

/**
 * Convert common Kenyan phone formats to 254XXXXXXXXX.
 *
 * Supported:
 * 0712345678
 * 0112345678
 * 254712345678
 * 254112345678
 * 712345678
 * 112345678
 */
const normalizeKenyanPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");

  // 07XXXXXXXX / 01XXXXXXXX
  if (
    (digits.startsWith("07") || digits.startsWith("01")) &&
    digits.length === 10
  ) {
    return `254${digits.slice(1)}`;
  }

  // 2547XXXXXXXX / 2541XXXXXXXX
  if (
    (digits.startsWith("2547") || digits.startsWith("2541")) &&
    digits.length === 12
  ) {
    return digits;
  }

  // 7XXXXXXXX / 1XXXXXXXX
  if (
    (digits.startsWith("7") || digits.startsWith("1")) &&
    digits.length === 9
  ) {
    return `254${digits}`;
  }

  return "";
};

/**
 * Safely extract the actual error returned by the Supabase Edge Function.
 */
const getEdgeFunctionErrorMessage = async (
  error: unknown,
): Promise<string> => {
  if (error instanceof FunctionsHttpError) {
    try {
      const responseBody = await error.context.json();

      console.error("M-PESA Edge Function response:", responseBody);

      if (typeof responseBody === "string") {
        return responseBody;
      }

      if (responseBody?.error) {
        if (typeof responseBody.error === "string") {
          return responseBody.error;
        }

        if (responseBody.error?.message) {
          return responseBody.error.message;
        }
      }

      if (responseBody?.message) {
        return responseBody.message;
      }

      if (responseBody?.details) {
        return responseBody.details;
      }

      if (responseBody?.error_description) {
        return responseBody.error_description;
      }

      return JSON.stringify(responseBody);
    } catch (parseError) {
      console.error(
        "Could not parse Edge Function error response:",
        parseError,
      );

      return error.message || "The M-PESA Edge Function returned an error.";
    }
  }

  if (error instanceof FunctionsRelayError) {
    console.error("Supabase Functions Relay Error:", error);
    return `Supabase relay error: ${error.message}`;
  }

  if (error instanceof FunctionsFetchError) {
    console.error("Supabase Functions Fetch Error:", error);
    return `Could not reach the M-PESA service: ${error.message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected M-PESA payment error occurred.";
};

export const MPESAPayment = ({
  memberId,
  memberName,
}: MPESAPaymentProps) => {
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    /*
     * Basic validation
     */
    if (!amount || !phoneNumber) {
      toast.error("Please fill in all fields.");
      return;
    }

    /*
     * Validate amount
     */
    const numericAmount = Number(amount);

    if (
      !Number.isInteger(numericAmount) ||
      numericAmount <= 0
    ) {
      toast.error("Enter a valid whole KES amount.");
      return;
    }

    /*
     * Normalize phone number
     */
    const normalizedPhone =
      normalizeKenyanPhone(phoneNumber);

    if (!normalizedPhone) {
      toast.error(
        "Invalid Safaricom number. Use 0712345678 or 254712345678.",
      );
      return;
    }

    /*
     * Prevent multiple requests
     */
    setIsLoading(true);

    try {
      console.log("Starting M-PESA STK Push:", {
        memberId,
        amount: numericAmount,
        phoneNumber: normalizedPhone,
      });

      /*
       * Call Supabase Edge Function
       */
      const { data, error } =
        await supabase.functions.invoke(
          "mpesa-stk-push",
          {
            body: {
              action: "stk_push",
              memberId,
              amount: numericAmount,
              phoneNumber: normalizedPhone,
            },
          },
        );

      /*
       * Handle Edge Function errors
       */
      if (error) {
        console.error(
          "M-PESA Edge Function invocation error:",
          error,
        );

        const detailedMessage =
          await getEdgeFunctionErrorMessage(error);

        console.error(
          "M-PESA detailed error:",
          detailedMessage,
        );

        toast.error(
          `M-PESA payment failed: ${detailedMessage}`,
        );

        return;
      }

      /*
       * Log successful function response
       */
      console.log(
        "M-PESA STK Push response:",
        data,
      );

      /*
       * Handle successful STK request
       */
      if (data?.success) {
        toast.success(
          data.message ||
            "M-PESA prompt sent. Check the customer's phone.",
        );

        /*
         * Clear form after successful request
         */
        setAmount("");
        setPhoneNumber("");

        return;
      }

      /*
       * Edge Function responded with 200
       * but reported that the STK request failed.
       */
      console.error(
        "M-PESA STK Push was not successful:",
        data,
      );

      const failureMessage =
        data?.error ||
        data?.message ||
        data?.details ||
        "M-PESA STK Push could not be initiated.";

      toast.error(
        `M-PESA payment failed: ${failureMessage}`,
      );
    } catch (error) {
      /*
       * Unexpected frontend/runtime error
       */
      console.error(
        "Unexpected M-PESA payment error:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Payment failed. Please try again.";

      toast.error(message);
    } finally {
      /*
       * Always re-enable the button
       */
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
          {memberName
            ? `Make payment for ${memberName}`
            : "Make your membership payment"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">
            Amount (KES)
          </Label>

          <Input
            id="amount"
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value)
            }
            disabled={isLoading}
            min="1"
            step="1"
            inputMode="numeric"
          />
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phone">
            Safaricom Phone Number
          </Label>

          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />

            <Input
              id="phone"
              type="tel"
              placeholder="0712345678"
              value={phoneNumber}
              onChange={(e) =>
                setPhoneNumber(e.target.value)
              }
              disabled={isLoading}
              className="pl-10"
              inputMode="tel"
              autoComplete="tel"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            The M-PESA prompt will be sent to this
            Safaricom number.
          </p>
        </div>

        {/* Payment Button */}
        <Button
          onClick={handlePayment}
          className="w-full"
          disabled={
            isLoading ||
            !amount ||
            !phoneNumber
          }
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

        {/* Payment Information */}
        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>
            Paybill: <strong>4148511</strong>
          </p>

          <p>
            After sending, check the phone for the
            M-PESA PIN prompt.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
