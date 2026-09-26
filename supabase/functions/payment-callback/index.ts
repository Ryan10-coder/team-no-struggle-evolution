import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { ResultCode: 1, ResultDesc: "Method not allowed" },
      405,
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Supabase service configuration is missing.");
    return jsonResponse(
      { ResultCode: 0, ResultDesc: "Accepted" },
      200,
    );
  }

  try {
    const payload = await req.json();
    const callback = payload?.Body?.stkCallback;

    if (!callback) {
      console.error("Invalid STK callback payload:", payload);
      return jsonResponse(
        { ResultCode: 0, ResultDesc: "Accepted" },
        200,
      );
    }

    const checkoutRequestId = callback.CheckoutRequestID;
    const merchantRequestId = callback.MerchantRequestID;
    const resultCode = Number(callback.ResultCode ?? -1);
    const resultDesc = callback.ResultDesc ?? "";

    if (!checkoutRequestId) {
      console.error("STK callback has no CheckoutRequestID.");
      return jsonResponse(
        { ResultCode: 0, ResultDesc: "Accepted" },
        200,
      );
    }

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
    );

    const { data: payment, error: paymentLookupError } =
      await supabase
        .from("mpesa_payments")
        .select("*")
        .eq("checkout_request_id", checkoutRequestId)
        .maybeSingle();

    if (paymentLookupError) {
      console.error(
        "Payment lookup failed:",
        paymentLookupError,
      );
      return jsonResponse(
        { ResultCode: 0, ResultDesc: "Accepted" },
        200,
      );
    }

    if (!payment) {
      console.error(
        "No pending payment found for checkout request:",
        checkoutRequestId,
      );
      return jsonResponse(
        { ResultCode: 0, ResultDesc: "Accepted" },
        200,
      );
    }

    // Safaricom can retry callbacks. Do not create a second contribution
    // when the payment has already been completed.
    if (payment.status === "completed") {
      return jsonResponse(
        { ResultCode: 0, ResultDesc: "Accepted" },
        200,
      );
    }

    if (resultCode !== 0) {
      const { error: failedUpdateError } =
        await supabase
          .from("mpesa_payments")
          .update({
            status: "failed",
            merchant_request_id:
              merchantRequestId ?? payment.merchant_request_id,
            result_code: resultCode,
            result_desc: resultDesc,
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.id);

      if (failedUpdateError) {
        console.error(
          "Failed to update failed payment:",
          failedUpdateError,
        );
      }

      return jsonResponse(
        { ResultCode: 0, ResultDesc: "Accepted" },
        200,
      );
    }

    const metadata = Array.isArray(callback.CallbackMetadata?.Item)
      ? callback.CallbackMetadata.Item
      : [];

    const getMetadataValue = (name: string) =>
      metadata.find((item: any) => item?.Name === name)?.Value ?? null;

    const mpesaReceiptNumber =
      getMetadataValue("MpesaReceiptNumber");
    const transactionDateValue =
      getMetadataValue("TransactionDate");

    const transactionDate =
      transactionDateValue !== null
        ? String(transactionDateValue)
        : null;

    const { error: completedUpdateError } =
      await supabase
        .from("mpesa_payments")
        .update({
          status: "completed",
          merchant_request_id:
            merchantRequestId ?? payment.merchant_request_id,
          result_code: resultCode,
          result_desc: resultDesc,
          mpesa_receipt_number:
            mpesaReceiptNumber
              ? String(mpesaReceiptNumber)
              : null,
          transaction_date: transactionDate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

    if (completedUpdateError) {
      console.error(
        "Failed to mark M-PESA payment completed:",
        completedUpdateError,
      );
      return jsonResponse(
        { ResultCode: 0, ResultDesc: "Accepted" },
        200,
      );
    }

    // Create the contribution once, after the payment is confirmed.
    const { data: existingContribution, error: contributionLookupError } =
      await supabase
        .from("contributions")
        .select("id")
        .eq("member_id", payment.member_id)
        .eq("amount", payment.amount)
        .eq("contribution_type", "mpesa")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (contributionLookupError) {
      console.error(
        "Contribution lookup failed:",
        contributionLookupError,
      );
    }

    if (!existingContribution) {
      const { error: contributionError } =
        await supabase
          .from("contributions")
          .insert({
            member_id: payment.member_id,
            amount: payment.amount,
            contribution_type: "mpesa",
            contribution_date: new Date().toISOString(),
            status: "completed",
          });

      if (contributionError) {
        console.error(
          "Payment completed but contribution creation failed:",
          contributionError,
        );
      }
    }

    console.log(
      "M-PESA payment completed:",
      {
        paymentId: payment.id,
        checkoutRequestId,
        receipt: mpesaReceiptNumber,
        amount: payment.amount,
        memberId: payment.member_id,
      },
    );

    return jsonResponse(
      { ResultCode: 0, ResultDesc: "Accepted" },
      200,
    );
  } catch (error) {
    console.error(
      "M-PESA callback error:",
      error,
    );

    // Acknowledge the callback so Safaricom does not repeatedly
    // retry a notification because of an internal application error.
    return jsonResponse(
      { ResultCode: 0, ResultDesc: "Accepted" },
      200,
    );
  }
});
