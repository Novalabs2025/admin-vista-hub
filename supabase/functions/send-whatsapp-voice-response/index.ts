
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { voiceMessageId, audioPath } = await req.json();
    console.log('Sending WhatsApp voice response for:', voiceMessageId);

    // Get the original voice message
    const { data: voiceMessage, error } = await supabase
      .from('whatsapp_voice_messages')
      .select('*')
      .eq('id', voiceMessageId)
      .single();

    if (error || !voiceMessage) {
      throw new Error('Voice message not found');
    }

    // For demo purposes, send a text response instead of audio
    // In production, you'd upload the audio to a public URL and send that
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${Deno.env.get('TWILIO_ACCOUNT_SID')}/Messages.json`;
    const twilioAuth = btoa(`${Deno.env.get('TWILIO_ACCOUNT_SID')}:${Deno.env.get('TWILIO_AUTH_TOKEN')}`);

    const body = new URLSearchParams({
      From: voiceMessage.to_number,
      To: voiceMessage.from_number,
      Body: voiceMessage.response_text || 'Thank you for your voice message. Our team will respond soon.',
    });

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${twilioAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Twilio error: ${error}`);
    }

    // Mark response as sent
    const { error: updateError } = await supabase
      .from('whatsapp_voice_messages')
      .update({
        response_sent: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', voiceMessageId);

    if (updateError) {
      console.error('Error marking response as sent:', updateError);
    }

    console.log('Response sent successfully');

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Send response error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
