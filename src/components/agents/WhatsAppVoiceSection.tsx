
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWhatsAppVoice } from '@/hooks/useWhatsAppVoice';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Phone, MessageSquare, Clock, CheckCircle, XCircle, RefreshCw, Play, Mic } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppVoiceSectionProps {
  agentId?: string;
}

export default function WhatsAppVoiceSection({ agentId }: WhatsAppVoiceSectionProps) {
  const { voiceMessages, isLoading, markAsRead, retranscribe } = useWhatsAppVoice();
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const { toast } = useToast();

  // Filter messages for specific agent if agentId is provided
  const filteredMessages = agentId 
    ? voiceMessages?.filter(msg => msg.agent_id === agentId) 
    : voiceMessages;

  const handlePlayAudio = async (messageId: string, mediaUrl: string | null) => {
    if (!mediaUrl) {
      toast({
        title: "No Audio Available",
        description: "Audio file not found for this message",
        variant: "destructive",
      });
      return;
    }

    if (playingAudio === messageId) {
      setPlayingAudio(null);
      return;
    }

    setPlayingAudio(messageId);
    // In a real implementation, you'd play the audio here
    setTimeout(() => setPlayingAudio(null), 3000); // Mock audio duration
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            WhatsApp Voice Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          WhatsApp Voice Messages
          {filteredMessages && filteredMessages.length > 0 && (
            <Badge variant="secondary">{filteredMessages.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!filteredMessages || filteredMessages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No voice messages</p>
            <p className="text-sm mt-2">
              {agentId ? "This agent hasn't received any voice messages yet" : "No voice messages received"}
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredMessages.map((message) => (
              <div key={message.id} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm">
                        {message.from_number?.replace('whatsapp:', '')}
                      </span>
                      <Badge className={`${getStatusColor(message.transcription_status || 'pending')} text-xs`}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(message.transcription_status || 'pending')}
                          {message.transcription_status || 'pending'}
                        </div>
                      </Badge>
                      {message.response_sent && (
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Responded
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-2">
                      {format(new Date(message.created_at), 'MMM dd, HH:mm')}
                    </p>

                    {message.transcription && (
                      <div className="bg-white p-3 rounded-md mb-2 border">
                        <h4 className="font-medium text-xs mb-1">Transcription:</h4>
                        <p className="text-sm">{message.transcription}</p>
                      </div>
                    )}

                    {message.response_text && (
                      <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                        <h4 className="font-medium text-xs mb-1">Response:</h4>
                        <p className="text-sm">{message.response_text}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {message.media_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePlayAudio(message.id, message.media_url)}
                        className="h-8 w-8 p-0"
                      >
                        {playingAudio === message.id ? (
                          <Mic className="h-3 w-3" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                    
                    {message.transcription_status === 'failed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => retranscribe(message.id)}
                        className="h-8 px-2"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(message.id)}
                      className="h-8 px-2 text-xs"
                    >
                      Mark Read
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
