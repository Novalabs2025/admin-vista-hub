
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWhatsAppVoice } from '@/hooks/useWhatsAppVoice';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Phone, MessageSquare, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function WhatsAppVoiceManager() {
  const { voiceMessages, isLoading, markAsRead, retranscribe } = useWhatsAppVoice();

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
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          WhatsApp Voice Messages
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!voiceMessages || voiceMessages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No voice messages received yet</p>
            <p className="text-sm mt-2">Voice messages will appear here when clients send them via WhatsApp</p>
          </div>
        ) : (
          <div className="space-y-4">
            {voiceMessages.map((message) => (
              <div key={message.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">
                        {message.from_number?.replace('whatsapp:', '')}
                      </span>
                      <Badge className={getStatusColor(message.transcription_status || 'pending')}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(message.transcription_status || 'pending')}
                          {message.transcription_status || 'pending'}
                        </div>
                      </Badge>
                      {message.response_sent && (
                        <Badge variant="outline">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Response Sent
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-500 mb-2">
                      Received: {format(new Date(message.created_at), 'MMM dd, yyyy HH:mm')}
                    </p>

                    {message.media_content_type && (
                      <p className="text-sm text-gray-600 mb-2">
                        Audio Type: {message.media_content_type}
                      </p>
                    )}

                    {message.transcription && (
                      <div className="bg-gray-50 p-3 rounded-md mb-3">
                        <h4 className="font-medium text-sm mb-1">Transcription:</h4>
                        <p className="text-sm">{message.transcription}</p>
                      </div>
                    )}

                    {message.response_text && (
                      <div className="bg-blue-50 p-3 rounded-md">
                        <h4 className="font-medium text-sm mb-1">Response:</h4>
                        <p className="text-sm">{message.response_text}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {message.transcription_status === 'failed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => retranscribe(message.id)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Retry
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(message.id)}
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
