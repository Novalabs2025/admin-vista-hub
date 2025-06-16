
import { supabase } from "@/integrations/supabase/client";

export interface DuplicateImage {
  property_id: string;
  agent_id: string;
  image_hash: string;
  similarity_score: number;
  created_at: string;
}

export const generateImageHash = async (imageFile: File): Promise<string> => {
  const arrayBuffer = await imageFile.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const checkImageDuplicates = async (
  imageHash: string,
  agentId: string,
  similarityThreshold: number = 0.95
): Promise<DuplicateImage[]> => {
  const { data, error } = await supabase.rpc('detect_image_duplicates', {
    p_image_hash: imageHash,
    p_agent_id: agentId,
    p_similarity_threshold: similarityThreshold
  });

  if (error) {
    console.error('Error checking duplicates:', error);
    return [];
  }

  return data || [];
};

export const storeImageHash = async (
  propertyId: string,
  agentId: string,
  imageHash: string,
  imageUrl: string,
  fileSize: number
) => {
  const { error } = await supabase
    .from('property_image_hashes')
    .insert({
      property_id: propertyId,
      agent_id: agentId,
      image_hash: imageHash,
      image_url: imageUrl,
      hash_algorithm: 'sha256',
      file_size: fileSize,
      similarity_score: 1.0
    });

  if (error) {
    console.error('Error storing image hash:', error);
    throw error;
  }
};
