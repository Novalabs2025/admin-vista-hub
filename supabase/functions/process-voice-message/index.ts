
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

    if (!mediaUrl) {
      throw new Error('No media URL provided');
    }

    // Download the audio file from Twilio
    const twilioAuth = btoa(`${Deno.env.get('TWILIO_ACCOUNT_SID')}:${Deno.env.get('TWILIO_AUTH_TOKEN')}`);
    
    const audioResponse = await fetch(mediaUrl, {
      headers: {
        'Authorization': `Basic ${twilioAuth}`
      }
    });

    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio from Twilio: ${audioResponse.status} ${audioResponse.statusText}`);
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    
    if (audioBuffer.byteLength === 0) {
      throw new Error('Empty audio file received');
    }

    console.log('Audio downloaded, size:', audioBuffer.byteLength);

    // Convert to binary for OpenAI
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
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
      const errorText = await transcriptionResponse.text();
      console.error('OpenAI transcription error:', errorText);
      throw new Error(`OpenAI transcription failed: ${transcriptionResponse.status} - ${errorText}`);
    }

    const transcriptionResult = await transcriptionResponse.json();
    const transcription = transcriptionResult.text;

    if (!transcription || transcription.trim() === '') {
      throw new Error('Empty transcription received');
    }

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

    // Get voice message details to find the agent
    const { data: voiceMessage, error: voiceError } = await supabase
      .from('whatsapp_voice_messages')
      .select('*')
      .eq('id', voiceMessageId)
      .single();

    if (voiceError || !voiceMessage) {
      throw new Error('Voice message not found');
    }

    // Generate intelligent response with property context
    const responseText = await generateContextualResponse(transcription, voiceMessage.agent_id);

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

    // Try to get voiceMessageId from request body for error handling
    let voiceMessageId = null;
    try {
      const body = await req.json();
      voiceMessageId = body.voiceMessageId;
    } catch (e) {
      console.error('Could not parse request body for error handling:', e);
    }

    // Update status to failed
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

async function generateContextualResponse(transcription: string, agentId: string | null): Promise<string> {
  console.log('Generating contextual response for transcription:', transcription);
  console.log('Agent ID:', agentId);

  try {
    // Parse the user's request to extract search criteria
    const searchCriteria = extractSearchCriteria(transcription);
    console.log('Extracted search criteria:', searchCriteria);

    // Build dynamic query based on search criteria
    let propertiesQuery = supabase
      .from('properties')
      .select(`
        id, address, city, state, price, property_type, bedrooms, bathrooms, 
        area, description, listing_type, status, landmark
      `)
      .eq('status', 'approved');

    // Apply location filters
    if (searchCriteria.location) {
      propertiesQuery = propertiesQuery.or(
        `city.ilike.%${searchCriteria.location}%,state.ilike.%${searchCriteria.location}%,address.ilike.%${searchCriteria.location}%`
      );
    }

    // Apply property type filter
    if (searchCriteria.propertyType) {
      propertiesQuery = propertiesQuery.ilike('property_type', `%${searchCriteria.propertyType}%`);
    }

    // Apply listing type filter (sale/rent)
    if (searchCriteria.listingType) {
      propertiesQuery = propertiesQuery.ilike('listing_type', `%${searchCriteria.listingType}%`);
    }

    // Apply price range filter
    if (searchCriteria.minPrice) {
      propertiesQuery = propertiesQuery.gte('price', searchCriteria.minPrice);
    }
    if (searchCriteria.maxPrice) {
      propertiesQuery = propertiesQuery.lte('price', searchCriteria.maxPrice);
    }

    // Apply bedroom filter
    if (searchCriteria.bedrooms) {
      propertiesQuery = propertiesQuery.gte('bedrooms', searchCriteria.bedrooms);
    }

    // If agent ID is provided, prioritize their properties but also include others
    if (agentId) {
      propertiesQuery = propertiesQuery.order('agent_id', { ascending: false });
    }

    const { data: properties, error: propertiesError } = await propertiesQuery
      .order('created_at', { ascending: false })
      .limit(10);

    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError);
      return 'I apologize, but I encountered an error while searching for properties. Please try again or contact our support team.';
    }

    console.log('Found properties:', properties?.length || 0);

    // Generate accurate response based on actual results
    return generateAccurateResponse(transcription, properties || [], searchCriteria);

  } catch (error) {
    console.error('Error in generateContextualResponse:', error);
    return 'I apologize, but I encountered an error while processing your request. Please try again or contact our support team.';
  }
}

function extractSearchCriteria(transcription: string) {
  const text = transcription.toLowerCase();
  
  // Extract location
  const locationKeywords = ['abuja', 'lagos', 'port harcourt', 'kano', 'ibadan', 'kaduna', 'jos', 'warri', 'benin', 'maiduguri', 'fct', 'karu', 'kubwa', 'gwarinpa', 'wuse', 'garki', 'utako', 'jabi'];
  let location = null;
  for (const loc of locationKeywords) {
    if (text.includes(loc)) {
      location = loc;
      break;
    }
  }
  
  // Extract property type
  const propertyTypes = ['land', 'house', 'apartment', 'duplex', 'bungalow', 'flat', 'office', 'shop', 'warehouse'];
  let propertyType = null;
  for (const type of propertyTypes) {
    if (text.includes(type)) {
      propertyType = type;
      break;
    }
  }
  
  // Extract listing type
  let listingType = null;
  if (text.includes('for sale') || text.includes('to buy') || text.includes('purchase')) {
    listingType = 'sale';
  } else if (text.includes('for rent') || text.includes('to rent') || text.includes('rental')) {
    listingType = 'rent';
  }
  
  // Extract price range (basic extraction)
  let minPrice = null;
  let maxPrice = null;
  const priceMatch = text.match(/(\d+(?:k|m|million|thousand))/g);
  if (priceMatch) {
    // Simple price extraction - can be enhanced
    const price = priceMatch[0];
    if (price.includes('k')) {
      minPrice = parseInt(price.replace('k', '')) * 1000;
    } else if (price.includes('m') || price.includes('million')) {
      minPrice = parseInt(price.replace(/m|million/, '')) * 1000000;
    }
  }
  
  // Extract bedrooms
  let bedrooms = null;
  const bedroomMatch = text.match(/(\d+)\s*(?:bed|bedroom)/);
  if (bedroomMatch) {
    bedrooms = parseInt(bedroomMatch[1]);
  }
  
  return {
    location,
    propertyType,
    listingType,
    minPrice,
    maxPrice,
    bedrooms
  };
}

function generateAccurateResponse(transcription: string, properties: any[], searchCriteria: any): string {
  const actualCount = properties.length;
  
  if (actualCount === 0) {
    return `I searched for ${searchCriteria.propertyType || 'properties'} in ${searchCriteria.location || 'your specified location'} ${searchCriteria.listingType ? 'for ' + searchCriteria.listingType : ''}, but I couldn't find any properties that match your criteria at the moment. You might want to try:\n\n1. Broadening your search area\n2. Adjusting your budget range\n3. Considering different property types\n\nWould you like me to search with different criteria?`;
  }
  
  let response = `Great! I found ${actualCount} ${searchCriteria.propertyType || 'property'}${actualCount > 1 ? 'ies' : ''} in ${searchCriteria.location || 'your area'} ${searchCriteria.listingType ? 'for ' + searchCriteria.listingType : ''}:\n\n`;
  
  properties.forEach((property, index) => {
    response += `${index + 1}. ${property.property_type.toUpperCase()} | FOR ${property.listing_type.toUpperCase()}\n`;
    response += `📍 ${property.address}, ${property.city}, ${property.state}\n`;
    response += `💰 ₦${Number(property.price).toLocaleString()}${property.listing_type === 'rent' ? '/year' : ''}\n`;
    
    if (property.bedrooms) {
      response += `🛏️ ${property.bedrooms} bed${property.bedrooms > 1 ? 's' : ''}`;
    }
    if (property.bathrooms) {
      response += ` 🚿 ${property.bathrooms} bath${property.bathrooms > 1 ? 's' : ''}`;
    }
    if (property.area) {
      response += ` 📐 ${property.area}m²`;
    }
    response += '\n';
    
    if (property.description) {
      response += `📝 ${property.description.substring(0, 100)}${property.description.length > 100 ? '...' : ''}\n`;
    }
    
    if (property.landmark) {
      response += `🗺️ Near ${property.landmark}\n`;
    }
    
    response += '\n';
  });
  
  response += `Would you like more details about any of these properties, or would you like me to help you contact an agent for viewings?`;
  
  return response;
}

async function generateAudioResponse(text: string): Promise<{ audioPath: string }> {
  try {
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
  } catch (error) {
    console.error('Error generating audio response:', error);
    // Return empty path if audio generation fails
    return { audioPath: '' };
  }
}
