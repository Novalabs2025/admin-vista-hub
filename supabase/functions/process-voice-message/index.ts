
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

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { voiceMessageId, mediaUrl } = await req.json();
    console.log('Processing voice message:', voiceMessageId);

    // Download the audio file from Twilio
    const twilioAuth = btoa(`${Deno.env.get('TWILIO_ACCOUNT_SID')}:${Deno.env.get('TWILIO_AUTH_TOKEN')}`);
    
    const audioResponse = await fetch(mediaUrl, {
      headers: {
        'Authorization': `Basic ${twilioAuth}`
      }
    });

    if (!audioResponse.ok) {
      throw new Error('Failed to download audio from Twilio');
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    console.log('Audio downloaded, size:', audioBuffer.byteLength);

    // Convert to binary for OpenAI
    const binaryAudio = processBase64Chunks(audioBase64);
    
    // Transcribe using OpenAI Whisper
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/ogg' });
    formData.append('file', blob, 'audio.ogg');
    formData.append('model', 'whisper-1');

    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      throw new Error(`OpenAI transcription error: ${await transcriptionResponse.text()}`);
    }

    const transcriptionResult = await transcriptionResponse.json();
    const transcription = transcriptionResult.text;

    console.log('Transcription completed:', transcription);

    // Update voice message with transcription
    const { error: updateError } = await supabase
      .from('whatsapp_voice_messages')
      .update({
        transcription,
        transcription_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', voiceMessageId);

    if (updateError) {
      console.error('Error updating transcription:', updateError);
      throw updateError;
    }

    // Generate intelligent response based on transcription
    const responseText = await generateResponse(transcription);

    // Generate audio response
    const audioResponseData = await generateAudioResponse(responseText);

    // Update voice message with response
    const { error: responseUpdateError } = await supabase
      .from('whatsapp_voice_messages')
      .update({
        response_text: responseText,
        response_audio_path: audioResponseData.audioPath,
        updated_at: new Date().toISOString()
      })
      .eq('id', voiceMessageId);

    if (responseUpdateError) {
      console.error('Error updating response:', responseUpdateError);
      throw responseUpdateError;
    }

    // Send response back via WhatsApp
    EdgeRuntime.waitUntil(
      supabase.functions.invoke('send-whatsapp-voice-response', {
        body: { voiceMessageId, audioPath: audioResponseData.audioPath }
      })
    );

    return new Response(
      JSON.stringify({ success: true, transcription, responseText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Processing error:', error);

    // Update status to failed
    const { voiceMessageId } = await req.json();
    if (voiceMessageId) {
      await supabase
        .from('whatsapp_voice_messages')
        .update({
          transcription_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', voiceMessageId);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function generateResponse(transcription: string): Promise<string> {
  const prompt = `You are a helpful real estate assistant. A client sent this voice message: "${transcription}". 
  Provide a helpful, professional response about real estate services. Keep it concise and friendly.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
    }),
  });

  const result = await response.json();
  return result.choices[0]?.message?.content || 'Thank you for your message. Our team will get back to you soon.';
}

async function generateAudioResponse(text: string): Promise<{ audioPath: string }> {
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: 'alloy',
      response_format: 'mp3',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate audio response');
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  
  // In a real implementation, you'd save this to storage
  // For now, we'll return a placeholder path
  const audioPath = `audio_responses/${Date.now()}.mp3`;
  
  return { audioPath };
}
