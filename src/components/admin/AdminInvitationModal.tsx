
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Mail } from 'lucide-react';

const invitationSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['admin', 'super_admin'], {
    required_error: 'Please select a role',
  }),
});

type InvitationFormData = z.infer<typeof invitationSchema>;

interface AdminInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminInvitationModal({ isOpen, onClose }: AdminInvitationModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<InvitationFormData>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      email: '',
      role: 'admin',
    },
  });

  const createInvitationMutation = useMutation({
    mutationFn: async (data: InvitationFormData) => {
      // Create the invitation record
      const { data: result, error } = await supabase
        .from('admin_invitations')
        .insert({
          email: data.email,
          role: data.role,
          invited_by: user?.id!,
        })
        .select()
        .single();

      if (error) throw error;

      // Send the invitation email
      const emailResponse = await supabase.functions.invoke('send-invitation-email', {
        body: {
          email: data.email,
          role: data.role,
          invitationToken: result.invitation_token,
          inviterName: user?.user_metadata?.full_name || user?.email,
        },
      });

      if (emailResponse.error) {
        console.error('Email sending error:', emailResponse.error);
        // Don't throw here - invitation is created, just email failed
        toast({
          title: 'Invitation created',
          description: 'Invitation created but email failed to send. You can copy the link manually.',
          variant: 'destructive',
        });
      }

      return result;
    },
    onSuccess: (result) => {
      toast({
        title: 'Invitation sent successfully',
        description: 'Admin invitation has been created and email sent.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-invitations'] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create invitation',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: InvitationFormData) => {
    createInvitationMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite New Admin
          </DialogTitle>
          <DialogDescription>
            Send an invitation email to create a new admin account. The invitation will expire in 7 days.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="admin@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createInvitationMutation.isPending}
              >
                {createInvitationMutation.isPending ? 'Sending Invitation...' : 'Send Invitation'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
