import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifyAuth, verifyRole } from '../_shared/auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('MPESA STK Push function invoked');
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    if (req.method === 'POST') {
      const raw = await req.text();
      console.log('Received POST request, body length:', raw.length);
      let json: any = null;
      try {
        json = raw ? JSON.parse(raw) : null;
        console.log('Parsed JSON action:', json?.action);
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        json = null;
      }

      // Client-initiated actions require authentication
      if (json && typeof json === 'object' && 'action' in json) {
        console.log('Client-initiated action detected, verifying auth...');
        try {
          const { user, supabase: userSupabase } = await verifyAuth(req);
          console.log('Auth verified for user:', user.id);
          
          const hasPermission = await verifyRole(userSupabase, user.id, ['admin', 'treasurer', 'secretary', 'area_coordinator', 'general_coordinator']);
          console.log('Permission check result:', hasPermission);
          
          if (!hasPermission) {
            console.error('Insufficient permissions for user:', user.id);
            return new Response(
              JSON.stringify({ error: 'Insufficient permissions. Admin or Treasurer role required.' }),
              { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } catch (authError) {
          console.error('Authentication error:', authError);
          const errorMessage = authError instanceof Error ? authError.message : 'Authentication failed';
          return new Response(
            JSON.stringify({ success: false, error: errorMessage }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { action, ...data } = json;
        if (action === 'stk_push') {
          return await handleSTKPush(data, supabase);
        }
        if (action === 'callback') {
          return await handleSTKCallback(data, supabase);
        }
        return new Response(
          JSON.stringify({ error: 'Invalid action' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Safaricom STK callbacks don't require authentication (they come from M-Pesa)
      if (json && json.Body && json.Body.stkCallback) {
        return await handleSTKCallback(json, supabase);
      }

      console.warn('Unrecognized POST payload to mpesa-stk-push:', raw);
      return new Response(
        JSON.stringify({ message: 'Unrecognized payload' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in MPESA function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const status = errorMessage.includes('authorization') || errorMessage.includes('token') ? 401 : 500;
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleSTKPush(data: any, supabase: any) {
  const { memberId, amount, phoneNumber } = data;
  
  const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY')!;
  const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET')!;
  const passkey = Deno.env.get('MPESA_PASSKEY')!;
  const shortcode = Deno.env.get('MPESA_SHORTCODE') || '174379';
  
  try {
    if (!consumerKey || !consumerSecret || !passkey) {
      throw new Error('MPESA credentials not configured. Please set MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, and MPESA_PASSKEY environment variables.');
    }
    
    const auth = btoa(`${consumerKey}:${consumerSecret}`);
    console.log('Requesting OAuth token...');
    
    const tokenResponse = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`OAuth failed: ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    console.log('OAuth token obtained successfully');

    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    const password = btoa(`${shortcode}${passkey}${timestamp}`);

    const callbackUrl = `${supabaseUrl}/functions/v1/mpesa-stk-push`;

    const stkPushData = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: shortcode,
      PhoneNumber: phoneNumber,
      CallBackURL: callbackUrl,
      AccountReference: `TNS${memberId}`,
      TransactionDesc: 'TNS Contribution Payment'
    };

    console.log('Initiating STK Push...');
    
    const stkResponse = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(stkPushData)
    });

    const stkResult = await stkResponse.json();
    console.log('STK Push response:', stkResult);

    if (stkResult.ResponseCode === '0') {
      const { data: paymentData, error: paymentError } = await supabase
        .from('mpesa_payments')
        .insert({
          member_id: memberId,
          phone_number: phoneNumber,
          amount: amount,
          merchant_request_id: stkResult.MerchantRequestID,
          checkout_request_id: stkResult.CheckoutRequestID,
          status: 'pending'
        })
        .select()
        .single();

      if (paymentError) {
        console.error('Error saving payment:', paymentError);
        throw paymentError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'STK Push sent successfully',
          data: {
            merchantRequestId: stkResult.MerchantRequestID,
            checkoutRequestId: stkResult.CheckoutRequestID,
            paymentId: paymentData.id
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error(stkResult.ResponseDescription || 'STK Push failed');
    }

  } catch (error) {
    console.error('Error in handleSTKPush:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to initiate STK Push';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

async function handleSTKCallback(payload: any, supabase: any) {
  try {
    console.log('Processing STK Callback:', JSON.stringify(payload, null, 2));

    const stkCallback = payload.Body?.stkCallback || payload.stkCallback;
    
    if (!stkCallback) {
      console.error('Invalid callback structure');
      return new Response(
        JSON.stringify({ message: 'Invalid callback structure' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;
    
    const updateData: any = {
      result_code: ResultCode?.toString(),
      result_desc: ResultDesc,
      status: ResultCode === 0 ? 'completed' : 'failed'
    };

    if (ResultCode === 0 && stkCallback.CallbackMetadata?.Item) {
      const metadata = stkCallback.CallbackMetadata.Item;
      const mpesaReceiptNumber = metadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value;
      const transactionDate = metadata.find((item: any) => item.Name === 'TransactionDate')?.Value;

      if (mpesaReceiptNumber) {
        updateData.mpesa_receipt_number = mpesaReceiptNumber;
      }
      if (transactionDate) {
        updateData.transaction_date = new Date(transactionDate.toString()).toISOString();
      }
    }

    const { data: payment, error: updateError } = await supabase
      .from('mpesa_payments')
      .update(updateData)
      .eq('checkout_request_id', CheckoutRequestID)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating payment:', updateError);
      throw updateError;
    }

    if (ResultCode === 0 && payment) {
      const { error: contributionError } = await supabase
        .from('contributions')
        .insert({
          member_id: payment.member_id,
          amount: payment.amount,
          contribution_type: 'mpesa',
          contribution_date: new Date().toISOString().split('T')[0],
          status: 'confirmed'
        });

      if (contributionError) {
        console.error('Error creating contribution:', contributionError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Callback processed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in handleSTKCallback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Callback processing failed';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}
