import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyAuth, verifyRole } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

const normalizeKenyanPhone = (phone: string) => {
  const digits = String(phone ?? "").replace(/\D/g, "");

  if (digits.startsWith("0") && digits.length === 10) {
    return `254${digits.slice(1)}`;
  }

  if (digits.startsWith("254") && digits.length === 12) {
    return digits;
  }

  if (digits.startsWith("7") && digits.length === 9) {
    return `254${digits}`;
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

  return `${get("year")}${get("month")}${get("day")}${get("hour")}${get("minute")}${get("second")}`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json();
    const { action, memberId, amount, phoneNumber } = body ?? {};

    if (action !== "stk_push") {
      return jsonResponse({ success: false, error: "Invalid action" }, 400);
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
          error: "Insufficient permissions. Admin or Treasurer role required.",
        },
        403,
      );
    }

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
          error: "Invalid Safaricom phone number. Use 0712345678 or 254712345678.",
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
            "M-PESA credentials are not fully configured. Existing Supabase secrets are required.",
        },
        500,
      );
    }

    const baseUrl =
      environment === "sandbox"
        ? "https://sandbox.safaricom.co.ke"
        : "https://api.safaricom.co.ke";

    const callbackUrl =
      Deno.env.get("MPESA_CALLBACK_URL") ||
      `${supabaseUrl}/functions/v1/payment-callback`;

    if (!callbackUrl.startsWith("https://")) {
      return jsonResponse(
        {
          success: false,
          error: "M-PESA callback URL must use HTTPS.",
        },
        500,
      );
    }

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

    let tokenData: any = {};
    try {
      tokenData = JSON.parse(tokenText);
    } catch {
      console.error("Invalid Daraja OAuth response:", tokenText);
    }

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Daraja OAuth failed:", tokenResponse.status, tokenText);

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

    const timestamp = darajaTimestamp();
    const password = btoa(`${shortcode}${passkey}${timestamp}`);

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

    let stkResult: any = {};
    try {
      stkResult = JSON.parse(stkText);
    } catch {
      console.error("Invalid Daraja STK response:", stkText);
    }

    console.log("Daraja STK response:", stkResponse.status, stkResult);

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
            responseDescription: stkResult.ResponseDescription ?? null,
            requestId: stkResult.requestId ?? null,
          },
        },
        502,
      );
    }

    const { data: paymentData, error: paymentError } =
      await createClient(supabaseUrl, serviceRoleKey)
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
      console.error("Could not save pending M-PESA payment:", paymentError);

      return jsonResponse(
        {
          success: false,
          error:
            "STK Push was accepted by M-PESA, but the pending payment could not be saved.",
          checkoutRequestId: stkResult.CheckoutRequestID ?? null,
        },
        500,
      );
    }

    return jsonResponse({
      success: true,
      message:
        "STK Push sent successfully. Check the customer's phone for the M-PESA prompt.",
      data: {
        merchantRequestId: stkResult.MerchantRequestID ?? null,
        checkoutRequestId: stkResult.CheckoutRequestID ?? null,
        customerMessage:
          stkResult.CustomerMessage ||
          "Check your phone for the M-PESA prompt.",
        paymentId: paymentData.id,
      },
    });
  } catch (error) {
    console.error("M-PESA STK Push error:", error);

    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      500,
    );
  }
});
