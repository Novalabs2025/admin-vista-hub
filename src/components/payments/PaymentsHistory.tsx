
import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import InvoiceModal, { Payment } from './InvoiceModal';
import CreatePaymentModal from './CreatePaymentModal';

const PaymentsHistory = () => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [selectedPayment, setSelectedPayment] = React.useState<Payment | null>(null);
  const [isInvoiceModalOpen, setInvoiceModalOpen] = React.useState(false);
  const [isCreateModalOpen, setCreateModalOpen] = React.useState(false);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const channel = supabase
      .channel('realtime-payments-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
        },
        (payload) => {
          console.log('Payment change received!', payload);
          queryClient.invalidateQueries({ queryKey: ['payments'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: payments, isLoading, error } = useQuery<Payment[]>({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (paymentsError) throw new Error(paymentsError.message);
      if (!paymentsData) return [];

      const userIds = [...new Set(paymentsData.map(p => p.user_id))];
      if (userIds.length === 0) return [];

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profilesError) throw new Error(profilesError.message);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p.full_name]));

      return paymentsData.map(p => ({
        id: p.transaction_id,
        agent: profilesMap.get(p.user_id) || 'Unknown Agent',
        amount: p.amount,
        status: p.status,
        date: format(new Date(p.created_at), 'yyyy-MM-dd'),
        method: p.payment_method || 'N/A',
      }));
    },
  });

  const filteredPayments = payments?.filter(payment =>
      (payment.agent.toLowerCase().includes(searchTerm.toLowerCase()) ||
       payment.id.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === "All" || payment.status === statusFilter)
  ) || [];

  const handleViewInvoice = (payment: Payment) => {
    setSelectedPayment(payment);
    setInvoiceModalOpen(true);
  };

  const handlePaymentCreated = () => {
    setCreateModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ['payments'] });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payments</CardTitle>
              <CardDescription>A history of all payments processed.</CardDescription>
            </div>
            <Button onClick={() => setCreateModalOpen(true)}>Create Payment</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-4">
              <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                      type="search"
                      placeholder="Search by agent or ID..."
                      className="w-full rounded-lg bg-background pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="All">All Statuses</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Failed">Failed</SelectItem>
                  </SelectContent>
              </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-[110px] ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-red-500">
                    Error fetching payments: {error.message}
                  </TableCell>
                </TableRow>
              ) : filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.id}</TableCell>
                    <TableCell>{payment.agent}</TableCell>
                    <TableCell>${payment.amount.toFixed(2)}</TableCell>
                    <TableCell>{payment.date}</TableCell>
                    <TableCell>{payment.method}</TableCell>
                    <TableCell>
                      <Badge variant={payment.status === 'Paid' ? 'default' : payment.status === 'Pending' ? 'secondary' : 'destructive'}
                        className={payment.status === 'Paid' ? 'bg-green-100 text-green-800' : payment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleViewInvoice(payment)}>View Invoice</Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No payments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        payment={selectedPayment}
      />
      <CreatePaymentModal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handlePaymentCreated}
      />
    </>
  );
};

export default PaymentsHistory;
