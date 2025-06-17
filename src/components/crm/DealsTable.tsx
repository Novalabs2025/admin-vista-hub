
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, TrendingUp, Calendar, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDeals, Deal } from '@/hooks/useDeals';
import { format } from 'date-fns';

export default function DealsTable() {
  const { deals, isLoading, updateDeal } = useDeals();

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'lead': return 'bg-gray-100 text-gray-800';
      case 'qualified': return 'bg-blue-100 text-blue-800';
      case 'proposal': return 'bg-yellow-100 text-yellow-800';
      case 'negotiation': return 'bg-orange-100 text-orange-800';
      case 'closed_won': return 'bg-green-100 text-green-800';
      case 'closed_lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStageUpdate = async (deal: Deal, newStage: string) => {
    const updateData: any = { stage: newStage };
    
    if (newStage === 'closed_won' || newStage === 'closed_lost') {
      updateData.actual_close_date = new Date().toISOString().split('T')[0];
      updateData.probability = newStage === 'closed_won' ? 100 : 0;
    }

    await updateDeal.mutateAsync({
      id: deal.id,
      ...updateData
    });
  };

  if (isLoading) {
    return <div className="p-4">Loading deals...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Deals Pipeline</h2>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-lg text-green-600">
              {deals?.filter(d => d.stage === 'closed_won').length || 0}
            </div>
            <div className="text-gray-500">Won</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg text-blue-600">
              {deals?.filter(d => !['closed_won', 'closed_lost'].includes(d.stage)).length || 0}
            </div>
            <div className="text-gray-500">Active</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg text-green-600">
              ₦{deals?.filter(d => d.stage === 'closed_won').reduce((sum, d) => sum + (d.deal_value || 0), 0).toLocaleString() || 0}
            </div>
            <div className="text-gray-500">Revenue</div>
          </div>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Seeker</TableHead>
              <TableHead>Deal Value</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Probability</TableHead>
              <TableHead>Expected Close</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deals?.map((deal) => (
              <TableRow key={deal.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{deal.seeker_name}</div>
                    <div className="text-sm text-gray-500">{deal.seeker_phone || deal.seeker_email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-medium">
                      {deal.deal_value ? `₦${deal.deal_value.toLocaleString()}` : 'Not set'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={deal.stage}
                    onValueChange={(value) => handleStageUpdate(deal, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                      <SelectItem value="closed_won">Closed Won</SelectItem>
                      <SelectItem value="closed_lost">Closed Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span>{deal.probability || 0}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  {deal.expected_close_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{format(new Date(deal.expected_close_date), 'MMM dd, yyyy')}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{deal.source || 'Unknown'}</Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Edit Deal</DropdownMenuItem>
                      <DropdownMenuItem>Add Note</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {(!deals || deals.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No deals found. Complete appointments to start generating deals.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
