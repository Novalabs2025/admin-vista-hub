
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Copy, Trash2, UserPlus, Mail } from 'lucide-react';
import AdminInvitationModal from './AdminInvitationModal';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminInvitationsTable() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: invitations, isLoading } = useQuery({
    queryKey: ['admin-invitations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const resendEmailMutation = useMutation({
    mutationFn: async (invitation: any) => {
      console.log('Resending email for invitation:', invitation.email);
      
      const emailResponse = await supabase.functions.invoke('send-invitation-email', {
        body: {
          email: invitation.email,
          role: invitation.role,
          invitationToken: invitation.invitation_token,
          inviterName: user?.user_metadata?.full_name || user?.email,
        },
      });

      console.log('Resend email response:', emailResponse);

      if (emailResponse.error) {
        console.error('Email resend error:', emailResponse.error);
        throw new Error(`Failed to send email: ${emailResponse.error.message}`);
      }

      return emailResponse;
    },
    onSuccess: () => {
      toast({
        title: 'Email sent',
        description: 'Invitation email has been sent successfully.',
      });
    },
    onError: (error: any) => {
      console.error('Resend email error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send email',
        variant: 'destructive',
      });
    },
  });

  const deleteInvitationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('admin_invitations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Invitation deleted',
        description: 'The invitation has been removed.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-invitations'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete invitation',
        variant: 'destructive',
      });
    },
  });

  const copyInvitationLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/accept-invitation?token=${token}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: 'Link copied',
      description: 'Invitation link has been copied to clipboard.',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Admin Invitations
            </CardTitle>
            <Button onClick={() => setShowInviteModal(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Admin
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading invitations...</div>
          ) : invitations && invitations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">
                      {invitation.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {invitation.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          invitation.accepted
                            ? 'default'
                            : isExpired(invitation.expires_at)
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {invitation.accepted
                          ? 'Accepted'
                          : isExpired(invitation.expires_at)
                          ? 'Expired'
                          : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(invitation.expires_at)}
                    </TableCell>
                    <TableCell>
                      {formatDate(invitation.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!invitation.accepted && !isExpired(invitation.expires_at) && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyInvitationLink(invitation.invitation_token)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => resendEmailMutation.mutate(invitation)}
                              disabled={resendEmailMutation.isPending}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteInvitationMutation.mutate(invitation.id)}
                          disabled={deleteInvitationMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No invitations found. Create your first admin invitation.
            </div>
          )}
        </CardContent>
      </Card>

      <AdminInvitationModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </>
  );
}
