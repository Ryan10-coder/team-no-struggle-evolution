import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    if (req.method === 'POST') {
      const { action, ...data } = await req.json();
      
      if (action === 'stk_push') {
        return await handleSTKPush(data, supabase);
      } else if (action === 'callback') {
        return await handleSTKCallback(data, supabase);
      } else {
        return new Response(
          JSON.stringify({ error: 'Invalid action' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in MPESA function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleSTKPush(data: any, supabase: any) {
  const { memberId, amount, phoneNumber } = data;
  
  const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY')!;
  const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET')!;
  const passkey = Deno.env.get('MPESA_PASSKEY')!;
  const shortcode = '4148511';
  
  try {
    // Get OAuth token
    const auth = btoa(`${consumerKey}:${consumerSecret}`);
    const tokenResponse = await fetch('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    if (!accessToken) {
      throw new Error('Failed to get access token');
    }
    
    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    
    // Generate password
    const password = btoa(`${shortcode}${passkey}${timestamp}`);
    
    // Format phone number
    const formattedPhone = phoneNumber.startsWith('0') ? 
      `254${phoneNumber.slice(1)}` : 
      phoneNumber.startsWith('254') ? phoneNumber : `254${phoneNumber}`;
    
    // STK Push request
    const stkPushData = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: parseFloat(amount),
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-stk-push`,
      AccountReference: `TNS${memberId}`,
      TransactionDesc: "Membership Payment"
    };
    
    const stkResponse = await fetch('https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(stkPushData)
    });
    
    const stkResult = await stkResponse.json();
    
    if (stkResult.ResponseCode === '0') {
      // Save payment record to database
      const { error: dbError } = await supabase
        .from('mpesa_payments')
        .insert({
          member_id: memberId,
          amount: parseFloat(amount),
          phone_number: formattedPhone,
          checkout_request_id: stkResult.CheckoutRequestID,
          merchant_request_id: stkResult.MerchantRequestID,
          status: 'pending'
        });
      
      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to save payment record');
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'STK push sent successfully',
          checkoutRequestId: stkResult.CheckoutRequestID
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error(stkResult.errorMessage || 'STK push failed');
    }
    
  } catch (error) {
    console.error('STK Push error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'STK push failed' 
      }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleSTKCallback(callbackData: any, supabase: any) {
  try {
    console.log('STK Callback received:', JSON.stringify(callbackData, null, 2));
    
    const { Body } = callbackData;
    const { stkCallback } = Body;
    
    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const merchantRequestId = stkCallback.MerchantRequestID;
    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;
    
    let updateData: any = {
      result_code: resultCode.toString(),
      result_desc: resultDesc,
      status: resultCode === 0 ? 'completed' : 'failed'
    };
    
    // If payment was successful, extract additional data
    if (resultCode === 0 && stkCallback.CallbackMetadata) {
      const metadata = stkCallback.CallbackMetadata.Item;
      
      const receiptNumber = metadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value;
      const transactionDate = metadata.find((item: any) => item.Name === 'TransactionDate')?.Value;
      
      if (receiptNumber) {
        updateData.mpesa_receipt_number = receiptNumber;
      }
      
      if (transactionDate) {
        // Convert MPESA date format (20240916143022) to ISO date
        const dateStr = transactionDate.toString();
        const formattedDate = `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}T${dateStr.slice(8,10)}:${dateStr.slice(10,12)}:${dateStr.slice(12,14)}`;
        updateData.transaction_date = new Date(formattedDate).toISOString();
      }
    }
    
    // Update the payment record
    const { error } = await supabase
      .from('mpesa_payments')
      .update(updateData)
      .eq('checkout_request_id', checkoutRequestId);
    
    if (error) {
      console.error('Database update error:', error);
    }
    
    // If payment was successful, also add to contributions table
    if (resultCode === 0) {
      const { data: paymentData } = await supabase
        .from('mpesa_payments')
        .select('member_id, amount')
        .eq('checkout_request_id', checkoutRequestId)
        .single();
      
      if (paymentData) {
        // Add to contributions table
        const { error: contributionError } = await supabase
          .from('contributions')
          .insert({
            member_id: paymentData.member_id,
            amount: paymentData.amount,
            contribution_type: 'mpesa',
            status: 'confirmed'
          });
        
        if (contributionError) {
          console.error('Contribution insert error:', contributionError);
        }
      }
    }
    
    return new Response(
      JSON.stringify({ message: 'Callback processed successfully' }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Callback processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Callback processing failed' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
