
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Building2, CheckCircle, XCircle } from 'lucide-react';

const acceptInvitationSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AcceptInvitationFormData = z.infer<typeof acceptInvitationSchema>;

export default function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('token');

  const form = useForm<AcceptInvitationFormData>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: {
      fullName: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    const validateInvitation = async () => {
      if (!token) {
        setError('Invalid invitation link');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('admin_invitations')
          .select('*')
          .eq('invitation_token', token)
          .eq('accepted', false)
          .single();

        if (error || !data) {
          setError('Invitation not found or already used');
          setLoading(false);
          return;
        }

        if (new Date(data.expires_at) < new Date()) {
          setError('This invitation has expired');
          setLoading(false);
          return;
        }

        setInvitation(data);
      } catch (err) {
        setError('Failed to validate invitation');
      } finally {
        setLoading(false);
      }
    };

    validateInvitation();
  }, [token]);

  const onSubmit = async (data: AcceptInvitationFormData) => {
    if (!invitation) return;

    try {
      // Create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Assign the role to the user
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: invitation.role,
          });

        if (roleError) throw roleError;

        // Mark invitation as accepted
        const { error: updateError } = await supabase
          .from('admin_invitations')
          .update({ accepted: true })
          .eq('id', invitation.id);

        if (updateError) throw updateError;

        toast({
          title: 'Account created successfully',
          description: 'Please check your email to verify your account.',
        });

        navigate('/auth');
      }
    } catch (error: any) {
      toast({
        title: 'Error creating account',
        description: error.message || 'Failed to create account',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-primary h-10 w-10 rounded-lg flex items-center justify-center">
            <Building2 className="text-primary-foreground" />
          </div>
          <span className="font-semibold text-2xl">SettleSmart AI</span>
        </div>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="flex items-center gap-2 mb-8">
        <div className="bg-primary h-10 w-10 rounded-lg flex items-center justify-center">
          <Building2 className="text-primary-foreground" />
        </div>
        <span className="font-semibold text-2xl">SettleSmart AI</span>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle>Accept Admin Invitation</CardTitle>
          <CardDescription>
            You've been invited to join as a{' '}
            <strong>{invitation?.role === 'super_admin' ? 'Super Admin' : 'Admin'}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input value={invitation?.email || ''} disabled />
              </div>

              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
