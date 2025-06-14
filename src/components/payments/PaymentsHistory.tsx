
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import InvoiceModal, { Payment } from './InvoiceModal';

const payments: Payment[] = [
  { id: 'PAY-001', agent: 'Agent One', amount: 49.99, status: 'Paid', date: '2025-06-10', method: 'Credit Card' },
  { id: 'PAY-002', agent: 'Agent Two', amount: 49.99, status: 'Paid', date: '2025-06-09', method: 'Bank Transfer' },
  { id: 'PAY-003', agent: 'Agent Three', amount: 29.99, status: 'Pending', date: '2025-06-09', method: 'Credit Card' },
  { id: 'PAY-004', agent: 'Agent Four', amount: 99.00, status: 'Failed', date: '2025-06-08', method: 'Credit Card' },
  { id: 'PAY-005', agent: 'Musa Properties Ltd', amount: 75.50, status: 'Paid', date: '2025-06-07', method: 'Bank Transfer' },
  { id: 'PAY-006', agent: 'Golden Homes Estate', amount: 120.00, status: 'Pending', date: '2025-06-06', method: 'Credit Card' },
];

const PaymentsHistory = () => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [selectedPayment, setSelectedPayment] = React.useState<Payment | null>(null);
  const [isInvoiceModalOpen, setInvoiceModalOpen] = React.useState(false);


  const filteredPayments = payments.filter(payment =>
      (payment.agent.toLowerCase().includes(searchTerm.toLowerCase()) ||
       payment.id.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === "All" || payment.status === statusFilter)
  );

  const handleViewInvoice = (payment: Payment) => {
    setSelectedPayment(payment);
    setInvoiceModalOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>A history of all payments processed.</CardDescription>
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
              {filteredPayments.map((payment) => (
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        payment={selectedPayment}
      />
    </>
  );
};

export default PaymentsHistory;
