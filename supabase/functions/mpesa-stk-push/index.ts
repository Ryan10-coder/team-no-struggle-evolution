import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyAuth, verifyRole } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const jsonResponse = (body: unknown, status = 200) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
};

const normalizeKenyanPhone = (phone: string) => {
  const digits = String(phone ?? "").replace(/\D/g, "");

  if (digits.startsWith("0") && digits.length === 10) {
    return `254${digits.slice(1)}`;
  }

  if (digits.startsWith("7") && digits.length === 9) {
    return `254${digits}`;
  }

  if (digits.startsWith("254") && digits.length === 12) {
    return digits;
  }

  return "";
};

const darajaTimestamp = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}${get("month")}${get("day")}${get("hour")}${get(
    "minute",
  )}${get("second")}`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      {
        success: false,
        error: "Method not allowed",
      },
      405,
    );
  }

  try {
    const body = await req.json();
    const { action } = body ?? {};

    if (action !== "stk_push") {
      return jsonResponse(
        {
          success: false,
          error: "Invalid action",
        },
        400,
      );
    }

    const { user, supabase: userSupabase } = await verifyAuth(req);

    const hasPermission = await verifyRole(
      userSupabase,
      user.id,
      [
        "admin",
        "treasurer",
        "secretary",
        "area_coordinator",
        "general_coordinator",
      ],
    );

    if (!hasPermission) {
      return jsonResponse(
        {
          success: false,
          error:
            "Insufficient permissions. Admin or Treasurer role required.",
        },
        403,
      );
    }

    return await handleSTKPush(
      body,
      createClient(supabaseUrl, supabaseServiceKey),
    );
  } catch (error) {
    console.error("M-PESA STK Push error:", error);

    return jsonResponse(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Internal server error",
      },
      500,
    );
  }
});

async function handleSTKPush(data: any, supabase: any) {
  const { memberId, amount, phoneNumber } = data;

  if (!memberId || amount === undefined || !phoneNumber) {
    return jsonResponse(
      {
        success: false,
        error: "Member, amount and phone number are required.",
      },
      400,
    );
  }

  const numericAmount = Number(amount);

  if (!Number.isInteger(numericAmount) || numericAmount <= 0) {
    return jsonResponse(
      {
        success: false,
        error: "Amount must be a positive whole number in KES.",
      },
      400,
    );
  }

  const msisdn = normalizeKenyanPhone(phoneNumber);

  if (!msisdn) {
    return jsonResponse(
      {
        success: false,
        error:
          "Invalid Safaricom phone number. Use 0712345678 or 254712345678.",
      },
      400,
    );
  }

  const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY");
  const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET");
  const passkey = Deno.env.get("MPESA_PASSKEY");
  const shortcode = Deno.env.get("MPESA_SHORTCODE");

  const environment = (
    Deno.env.get("MPESA_ENVIRONMENT") || "production"
  ).toLowerCase();

  if (!consumerKey || !consumerSecret || !passkey || !shortcode) {
    return jsonResponse(
      {
        success: false,
        error:
          "M-PESA credentials are not fully configured. Set MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_PASSKEY and MPESA_SHORTCODE.",
      },
      500,
    );
  }

  const baseUrl =
    environment === "sandbox"
      ? "https://sandbox.safaricom.co.ke"
      : "https://api.safaricom.co.ke";

  try {
    /*
     * STEP 1:
     * Generate Daraja OAuth access token.
     */
    const auth = btoa(`${consumerKey}:${consumerSecret}`);

    const tokenResponse = await fetch(
      `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      },
    );

    const tokenText = await tokenResponse.text();

    let tokenData: any;

    try {
      tokenData = JSON.parse(tokenText);
    } catch {
      tokenData = {};
    }

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error(
        "Daraja OAuth failed:",
        tokenResponse.status,
        tokenText,
      );

      return jsonResponse(
        {
          success: false,
          error:
            tokenData.errorMessage ||
            tokenData.error_description ||
            `M-PESA authentication failed (HTTP ${tokenResponse.status}).`,
        },
        502,
      );
    }

    /*
     * STEP 2:
     * Generate timestamp and password.
     */
    const timestamp = darajaTimestamp();

    const password = btoa(
      `${shortcode}${passkey}${timestamp}`,
    );

    /*
     * STEP 3:
     * Callback URL.
     *
     * MPESA_CALLBACK_URL is preferred so production can use a
     * specifically registered HTTPS callback URL.
     *
     * The fallback is also safe because this path does not contain
     * the restricted "mpesa" keyword.
     */
    const callbackUrl =
      Deno.env.get("MPESA_CALLBACK_URL") ||
      `${supabaseUrl}/functions/v1/payment-callback`;

    if (!callbackUrl.startsWith("https://")) {
      return jsonResponse(
        {
          success: false,
          error:
            "M-PESA callback URL must use HTTPS in production.",
        },
        500,
      );
    }

    /*
     * STEP 4:
     * Build STK Push request.
     */
    const stkPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: numericAmount,
      PartyA: msisdn,
      PartyB: shortcode,
      PhoneNumber: msisdn,
      CallBackURL: callbackUrl,
      AccountReference: `TNS-${String(memberId).slice(0, 20)}`,
      TransactionDesc: "TNS Contribution Payment",
    };

    console.log("Sending STK Push:", {
      environment,
      shortcode,
      phone: `${msisdn.slice(0, 6)}******`,
      amount: numericAmount,
      callbackUrl,
    });

    /*
     * STEP 5:
     * Send the actual M-PESA Express prompt.
     */
    const stkResponse = await fetch(
      `${baseUrl}/mpesa/stkpush/v1/processrequest`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(stkPayload),
      },
    );

    const stkText = await stkResponse.text();

    let stkResult: any;

    try {
      stkResult = JSON.parse(stkText);
    } catch {
      stkResult = {};
    }

    console.log(
      "Daraja STK response:",
      stkResponse.status,
      stkResult,
    );

    /*
     * Daraja normally returns ResponseCode "0" when the request
     * has been accepted for processing.
     */
    if (!stkResponse.ok || stkResult.ResponseCode !== "0") {
      const errorMessage =
        stkResult.errorMessage ||
        stkResult.ResponseDescription ||
        stkResult.errorCode ||
        `STK Push request failed (HTTP ${stkResponse.status}).`;

      return jsonResponse(
        {
          success: false,
          error: errorMessage,
          daraja: {
            responseCode: stkResult.ResponseCode ?? null,
            responseDescription:
              stkResult.ResponseDescription ?? null,
            requestId: stkResult.requestId ?? null,
          },
        },
        502,
      );
    }

    /*
     * STEP 6:
     * Save the transaction as pending.
     *
     * Do this immediately after Daraja accepts the STK request.
     */
    const {
      data: paymentData,
      error: paymentError,
    } = await supabase
      .from("mpesa_payments")
      .insert({
        member_id: memberId,
        phone_number: msisdn,
        amount: numericAmount,
        merchant_request_id: stkResult.MerchantRequestID,
        checkout_request_id: stkResult.CheckoutRequestID,
        status: "pending",
      })
      .select()
      .single();

    if (paymentError) {
      console.error(
        "Could not save pending M-PESA payment:",
        paymentError,
      );

      return jsonResponse(
        {
          success: false,
          error:
            "STK Push was accepted by M-PESA, but the pending payment could not be saved. Check the M-PESA transaction before retrying.",
          checkoutRequestId:
            stkResult.CheckoutRequestID ?? null,
        },
        500,
      );
    }

    /*
     * STEP 7:
     * Return success to the admin portal.
     */
    return jsonResponse({
      success: true,
      message:
        "STK Push sent successfully. Check the customer's phone for the M-PESA prompt.",
      data: {
        merchantRequestId:
          stkResult.MerchantRequestID ?? null,
        checkoutRequestId:
          stkResult.CheckoutRequestID ?? null,
        customerMessage:
          stkResult.CustomerMessage ||
          "Check your phone for the M-PESA prompt.",
        paymentId: paymentData.id,
      },
    });
  } catch (error) {
    console.error("STK Push request error:", error);

    return jsonResponse(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to initiate STK Push.",
      },
      502,
    );
  }
}
