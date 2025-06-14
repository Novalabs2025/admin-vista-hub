
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const payments = [
  { id: 'PAY-001', agent: 'Agent One', amount: 49.99, status: 'Paid', date: '2025-06-10' },
  { id: 'PAY-002', agent: 'Agent Two', amount: 49.99, status: 'Paid', date: '2025-06-09' },
  { id: 'PAY-003', agent: 'Agent Three', amount: 29.99, status: 'Pending', date: '2025-06-09' },
  { id: 'PAY-004', agent: 'Agent Four', amount: 99.00, status: 'Failed', date: '2025-06-08' },
];

const PaymentsHistory = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payments</CardTitle>
        <CardDescription>A history of all payments processed.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">{payment.id}</TableCell>
                <TableCell>{payment.agent}</TableCell>
                <TableCell>${payment.amount.toFixed(2)}</TableCell>
                <TableCell>{payment.date}</TableCell>
                <TableCell>
                  <Badge variant={payment.status === 'Paid' ? 'default' : payment.status === 'Pending' ? 'secondary' : 'destructive'}
                    className={payment.status === 'Paid' ? 'bg-green-100 text-green-800' : payment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                    {payment.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PaymentsHistory;
