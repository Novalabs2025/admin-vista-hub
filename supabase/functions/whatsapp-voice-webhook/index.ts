
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
    console.log('Received WhatsApp webhook');
    
    const formData = await req.formData();
    const messageSid = formData.get('MessageSid')?.toString();
    const from = formData.get('From')?.toString();
    const to = formData.get('To')?.toString();
    const mediaUrl = formData.get('MediaUrl0')?.toString();
    const mediaContentType = formData.get('MediaContentType0')?.toString();
    const numMedia = formData.get('NumMedia')?.toString();

    console.log('Webhook data:', { messageSid, from, to, mediaUrl, mediaContentType, numMedia });

    // Only process voice messages
    if (numMedia && parseInt(numMedia) > 0 && mediaContentType?.includes('audio')) {
      console.log('Processing voice message');

      // Find agent by phone number (assuming agents have WhatsApp numbers in their profiles)
      const { data: agent } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone_number', to?.replace('whatsapp:', ''))
        .single();

      // Store the voice message record
      const { data: voiceMessage, error } = await supabase
        .from('whatsapp_voice_messages')
        .insert({
          message_sid: messageSid,
          from_number: from,
          to_number: to,
          media_url: mediaUrl,
          media_content_type: mediaContentType,
          agent_id: agent?.id,
          transcription_status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing voice message:', error);
        throw error;
      }

      console.log('Voice message stored:', voiceMessage.id);

      // Trigger transcription process
      if (mediaUrl) {
        EdgeRuntime.waitUntil(
          supabase.functions.invoke('process-voice-message', {
            body: { voiceMessageId: voiceMessage.id, mediaUrl }
          })
        );
      }
    }

    return new Response('OK', { 
      status: 200,
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
