import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";

const leadCreditSchema = z.object({
  agentId: z.string({ required_error: "Please select an agent." }).uuid(),
  leadCredits: z.coerce.number().int().min(0, "Credits must be a non-negative number."),
});

type Profile = {
  id: string;
  full_name: string | null;
  lead_credits: number;
}

const Settings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof leadCreditSchema>>({
    resolver: zodResolver(leadCreditSchema),
    defaultValues: {
      agentId: undefined,
      leadCredits: 0,
    },
  });

  const { data: agents, isLoading: isLoadingAgents } = useQuery<Profile[]>({
    queryKey: ['all-agents'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name, lead_credits');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const onSubmit = async (values: z.infer<typeof leadCreditSchema>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ lead_credits: values.leadCredits })
        .eq('id', values.agentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Agent's lead credits have been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['all-agents'] });
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error updating credits",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const selectedAgentId = form.watch('agentId');

  useEffect(() => {
    if (selectedAgentId && agents) {
      const selectedAgent = agents.find(agent => agent.id === selectedAgentId);
      if (selectedAgent) {
        form.setValue('leadCredits', selectedAgent.lead_credits);
      }
    }
  }, [selectedAgentId, agents, form]);

  return (
    <main className="flex-1 p-4 md:p-6">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Admin Profile</CardTitle>
            <CardDescription>
              Update your personal information. This is a mock-up and data is not saved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="full-name">Full Name</Label>
                <Input id="full-name" placeholder="Enter your full name" defaultValue="Admin User" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" defaultValue="admin@settlesmart.ai" readOnly />
              </div>
            </form>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button>Save Changes</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Change your password. This is a mock-up.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
            </form>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button>Update Password</Button>
          </CardFooter>
        </Card>

        <Card>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader>
                <CardTitle>Manage Lead Credits</CardTitle>
                <CardDescription>
                  View and update lead credits for individual agents.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="agentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agent</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingAgents}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an agent" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingAgents ? (
                            <SelectItem value="loading" disabled>Loading agents...</SelectItem>
                          ) : (
                            agents?.map(agent => (
                              <SelectItem key={agent.id} value={agent.id}>
                                {agent.full_name || 'Unnamed Agent'} ({agent.lead_credits} credits)
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="leadCredits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead Credits</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter lead credits" 
                          {...field} 
                          disabled={!selectedAgentId || form.formState.isSubmitting} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button type="submit" disabled={!selectedAgentId || form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Credits
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </main>
  );
};

export default Settings;
