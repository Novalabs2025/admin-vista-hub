
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from 'lucide-react';

const paymentSchema = z.object({
  agentId: z.string({ required_error: "Please select an agent." }).uuid(),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0."),
  paymentMethod: z.string().min(2, "Payment method is too short.").max(50).optional().or(z.literal('')),
  status: z.enum(['Paid', 'Pending', 'Failed']),
});

type Profile = {
  id: string;
  full_name: string | null;
}

interface CreatePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreatePaymentModal: React.FC<CreatePaymentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      agentId: undefined,
      amount: 0,
      paymentMethod: '',
      status: 'Pending',
    },
  });

  const { data: agents, isLoading: isLoadingAgents } = useQuery<Profile[]>({
    queryKey: ['agents-for-payment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name');
      if (error) {
        throw new Error(error.message);
      }
      return data || [];
    },
    enabled: isOpen, // Only fetch when the modal is open
  });

  const onSubmit = async (values: z.infer<typeof paymentSchema>) => {
    try {
      const transaction_id = `PAY-${Date.now()}`;
      const { error } = await supabase.from('payments').insert({
        transaction_id,
        user_id: values.agentId,
        amount: values.amount,
        payment_method: values.paymentMethod || 'N/A',
        status: values.status,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Payment created successfully.",
      });
      onSuccess();
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error creating payment",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  const handleClose = () => {
    form.reset();
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Payment</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new payment record.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : (
                        agents?.map(agent => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.full_name || 'Unnamed Agent'}
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
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (₦)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 50000.00" {...field} step="0.01" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Bank Transfer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Payment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePaymentModal;
