
import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';

export interface Payment {
  id: string;
  agent: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Failed';
  date: string;
  method: string;
}

interface InvoiceModalProps {
  payment: Payment | null;
  isOpen: boolean;
  onClose: () => void;
}

const InvoiceModal = ({ payment, isOpen, onClose }: InvoiceModalProps) => {
  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invoice #{payment.id}</DialogTitle>
          <DialogDescription>
            Date: {payment.date}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium">Billed to</h4>
            <p className="text-sm text-muted-foreground">{payment.agent}</p>
          </div>
          <div className="border-t pt-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Amount</p>
                <p className="text-sm text-muted-foreground">${payment.amount.toFixed(2)}</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-sm font-medium">Payment Method</p>
                <p className="text-sm text-muted-foreground">{payment.method}</p>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center pt-4 border-t">
             <p className="text-sm font-medium">Status</p>
             <Badge variant={payment.status === 'Paid' ? 'default' : payment.status === 'Pending' ? 'secondary' : 'destructive'}
                    className={payment.status === 'Paid' ? 'bg-green-100 text-green-800' : payment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                {payment.status}
              </Badge>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button onClick={handlePrint}>Print Invoice</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceModal;
