
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import crypto from 'https://deno.land/std@0.177.0/node/crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    
    const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecret) {
        console.error('PAYSTACK_SECRET_KEY is not set in environment variables.');
        return new Response('Internal Server Error: Missing Paystack secret', { status: 500 });
    }
    
    const signature = req.headers.get('x-paystack-signature');
    const body = await req.text();

    const hash = crypto.createHmac('sha512', paystackSecret).update(body).digest('hex');

    if (hash !== signature) {
      console.warn('Invalid Paystack signature');
      return new Response('Invalid signature', { status: 401 })
    }

    const payload = JSON.parse(body);

    if (payload.event === 'charge.success') {
      const { reference, amount } = payload.data;
      
      const { data: payment, error: paymentError } = await supabaseClient
        .from('payments')
        .select('id, user_id, amount, status')
        .eq('transaction_id', reference)
        .maybeSingle();

      if (paymentError) {
        console.error(`Supabase error fetching payment with reference ${reference}:`, paymentError);
        return new Response('Internal server error', { status: 500 });
      }

      if (!payment) {
          console.warn(`Payment with reference ${reference} not found. Acknowledging to prevent retries.`);
          return new Response(JSON.stringify({ received: true, message: "Payment not found in our system, but webhook acknowledged." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
      }

      if (payment.status === 'Paid') {
        console.log(`Payment with reference ${reference} already marked as 'Paid'. Skipping update.`);
        return new Response(JSON.stringify({ received: true, message: "Payment already processed." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
      }

      const { error: updateError } = await supabaseClient
        .from('payments')
        .update({ status: 'Paid' })
        .eq('transaction_id', reference);

      if (updateError) {
        console.error('Failed to update payment status:', updateError);
        return new Response('Failed to update payment', { status: 500 });
      }
      
      console.log(`Payment ${reference} status updated to Paid.`);

      const { error: notificationError } = await supabaseClient
        .from('notifications')
        .insert({
            title: 'Payment Successful',
            description: `Your payment of NGN ${(amount / 100).toFixed(2)} was successful.`,
            type: 'payment_success',
            user_id: payment.user_id
        });

      if (notificationError) {
        console.error('Failed to create notification:', notificationError);
      } else {
        console.log(`Notification created for successful payment ${reference}.`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(`Webhook Error: ${error.message}`, { status: 400 })
  }
})

