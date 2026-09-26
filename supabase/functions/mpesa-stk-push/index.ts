import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (
  body: unknown,
  status = 200,
) => {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    },
  );
};

/**
 * Convert Kenyan phone numbers to 254XXXXXXXXX.
 */
function normalizeKenyanPhone(
  phone: string,
): string {
  const digits = String(phone ?? "").replace(
    /\D/g,
    "",
  );

  if (
    digits.startsWith("0") &&
    digits.length === 10
  ) {
    return `254${digits.slice(1)}`;
  }

  if (
    digits.startsWith("254") &&
    digits.length === 12
  ) {
    return digits;
  }

  if (
    digits.startsWith("7") &&
    digits.length === 9
  ) {
    return `254${digits}`;
  }

  return "";
}

/**
 * Generate Daraja timestamp in Nairobi time.
 *
 * Format:
 * YYYYMMDDHHmmss
 */
function getTimestamp(): string {
  const parts = new Intl.DateTimeFormat(
    "en-GB",
    {
      timeZone: "Africa/Nairobi",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    },
  ).formatToParts(new Date());

  const get = (type: string) =>
    parts.find(
      (part) => part.type === type,
    )?.value ?? "";

  return (
    get("year") +
    get("month") +
    get("day") +
    get("hour") +
    get("minute") +
    get("second")
  );
}

Deno.serve(async (req) => {
  /*
   * CORS
   */
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  /*
   * Only POST is allowed.
   */
  if (req.method !== "POST") {
    return jsonResponse(
      {
        success: false,
        error: "Only POST requests are allowed.",
      },
      405,
    );
  }

  try {
    /*
     * Read request body.
     */
    const body = await req.json();

    const {
      amount,
      phoneNumber,
    } = body;

    /*
     * Validate amount.
     */
    const numericAmount = Number(amount);

    if (
      !Number.isInteger(numericAmount) ||
      numericAmount <= 0
    ) {
      return jsonResponse(
        {
          success: false,
          error:
            "Amount must be a positive whole number.",
        },
        400,
      );
    }

    /*
     * Validate phone.
     */
    const phone =
      normalizeKenyanPhone(phoneNumber);

    if (!phone) {
      return jsonResponse(
        {
          success: false,
          error:
            "Invalid Kenyan phone number. Use 0712345678 or 254712345678.",
        },
        400,
      );
    }

    /*
     * M-PESA credentials.
     *
     * These MUST be configured as Supabase
     * Edge Function secrets.
     */
    const consumerKey =
      Deno.env.get(
        "MPESA_CONSUMER_KEY",
      );

    const consumerSecret =
      Deno.env.get(
        "MPESA_CONSUMER_SECRET",
      );

    const passkey =
      Deno.env.get(
        "MPESA_PASSKEY",
      );

    const shortcode =
      Deno.env.get(
        "MPESA_SHORTCODE",
      );

    /*
     * For actual phone testing, use production.
     *
     * Set:
     * MPESA_ENVIRONMENT=production
     *
     * Sandbox is for Daraja testing/simulation.
     */
    const environment = (
      Deno.env.get(
        "MPESA_ENVIRONMENT",
      ) || "production"
    ).toLowerCase();

    if (
      !consumerKey ||
      !consumerSecret ||
      !passkey ||
      !shortcode
    ) {
      return jsonResponse(
        {
          success: false,
          error:
            "M-PESA configuration is incomplete. Required secrets: MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_PASSKEY and MPESA_SHORTCODE.",
        },
        500,
      );
    }

    /*
     * Select Daraja environment.
     */
    const baseUrl =
      environment === "sandbox"
        ? "https://sandbox.safaricom.co.ke"
        : "https://api.safaricom.co.ke";

    /*
     * Callback URL.
     *
     * Set MPESA_CALLBACK_URL in Supabase secrets.
     *
     * Example:
     * https://YOUR-PROJECT.supabase.co/functions/v1/payment-callback
     */
    const callbackUrl =
      Deno.env.get(
        "MPESA_CALLBACK_URL",
      );

    if (!callbackUrl) {
      return jsonResponse(
        {
          success: false,
          error:
            "MPESA_CALLBACK_URL is not configured.",
        },
        500,
      );
    }

    if (
      !callbackUrl.startsWith("https://")
    ) {
      return jsonResponse(
        {
          success: false,
          error:
            "MPESA_CALLBACK_URL must use HTTPS.",
        },
        500,
      );
    }

    /*
     * ==========================================
     * STEP 1: GET DARAJA ACCESS TOKEN
     * ==========================================
     */

    const credentials =
      btoa(
        `${consumerKey}:${consumerSecret}`,
      );

    const tokenResponse =
      await fetch(
        `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          method: "GET",
          headers: {
            Authorization:
              `Basic ${credentials}`,
          },
        },
      );

    const tokenText =
      await tokenResponse.text();

    let tokenData: any = {};

    try {
      tokenData =
        JSON.parse(tokenText);
    } catch {
      console.error(
        "Invalid OAuth response:",
        tokenText,
      );
    }

    if (
      !tokenResponse.ok ||
      !tokenData.access_token
    ) {
      console.error(
        "Daraja OAuth error:",
        {
          status:
            tokenResponse.status,
          response:
            tokenText,
        },
      );

      return jsonResponse(
        {
          success: false,
          error:
            tokenData.errorMessage ||
            tokenData.error_description ||
            `Could not obtain M-PESA access token. HTTP ${tokenResponse.status}`,
        },
        502,
      );
    }

    /*
     * ==========================================
     * STEP 2: CREATE PASSWORD
     * ==========================================
     */

    const timestamp =
      getTimestamp();

    const password =
      btoa(
        `${shortcode}${passkey}${timestamp}`,
      );

    /*
     * ==========================================
     * STEP 3: CREATE STK REQUEST
     * ==========================================
     */

    const stkPayload = {
      BusinessShortCode:
        shortcode,

      Password:
        password,

      Timestamp:
        timestamp,

      TransactionType:
        "CustomerPayBillOnline",

      Amount:
        numericAmount,

      PartyA:
        phone,

      PartyB:
        shortcode,

      PhoneNumber:
        phone,

      CallBackURL:
        callbackUrl,

      AccountReference:
        "TNS",

      TransactionDesc:
        "TNS Contribution",
    };

    console.log(
      "Sending M-PESA STK Push:",
      {
        environment,
        shortcode,
        amount:
          numericAmount,
        phone:
          `${phone.substring(
            0,
            6,
          )}******`,
        callbackUrl,
      },
    );

    /*
     * ==========================================
     * STEP 4: SEND STK PUSH TO SAFARICOM
     * ==========================================
     */

    const stkResponse =
      await fetch(
        `${baseUrl}/mpesa/stkpush/v1/processrequest`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${tokenData.access_token}`,

            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(
              stkPayload,
            ),
        },
      );

    const stkText =
      await stkResponse.text();

    let stkData: any = {};

    try {
      stkData =
        JSON.parse(stkText);
    } catch {
      console.error(
        "Invalid STK response:",
        stkText,
      );
    }

    console.log(
      "Daraja STK response:",
      {
        status:
          stkResponse.status,
        response:
          stkData,
      },
    );

    /*
     * ==========================================
     * STEP 5: CHECK SAFARICOM RESPONSE
     * ==========================================
     */

    if (
      !stkResponse.ok
    ) {
      return jsonResponse(
        {
          success: false,
          error:
            stkData.errorMessage ||
            stkData.ResponseDescription ||
            `M-PESA STK request failed. HTTP ${stkResponse.status}`,
          daraja:
            stkData,
        },
        502,
      );
    }

    /*
     * Daraja ResponseCode "0" means
     * the STK request was accepted.
     */
    if (
      stkData.ResponseCode !==
      "0"
    ) {
      return jsonResponse(
        {
          success: false,

          error:
            stkData.ResponseDescription ||
            stkData.errorMessage ||
            "M-PESA did not accept the STK Push.",

          daraja:
            stkData,
        },
        400,
      );
    }

    /*
     * ==========================================
     * SUCCESS
     * ==========================================
     *
     * At this point Safaricom has accepted
     * the STK Push request.
     *
     * The customer should receive the
     * M-PESA prompt on the phone.
     */

    return jsonResponse(
      {
        success: true,

        message:
          "M-PESA STK Push sent successfully. Check the phone for the M-PESA prompt.",

        merchantRequestId:
          stkData.MerchantRequestID ||
          null,

        checkoutRequestId:
          stkData.CheckoutRequestID ||
          null,

        customerMessage:
          stkData.CustomerMessage ||
          "Check your phone for the M-PESA prompt.",

        phone:
          phone,
      },
      200,
    );
  } catch (error) {
    console.error(
      "M-PESA STK Push exception:",
      error,
    );

    return jsonResponse(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unexpected M-PESA error.",
      },
      500,
    );
  }
});
