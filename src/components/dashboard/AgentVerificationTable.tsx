
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { agents, Agent } from "@/data/mockData";
import { CheckCircle2, XCircle, Hourglass, Eye, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const DocumentDisplay = ({ name, status }: { name: string; status: 'verified' | 'missing' | 'pending' }) => {
    let icon, colorClass;
    if (status === 'verified') {
        icon = <CheckCircle2 size={16} />;
        colorClass = 'text-green-600';
    } else if (status === 'pending') {
        icon = <Hourglass size={16} />;
        colorClass = 'text-yellow-600';
    } else { // missing
        icon = <XCircle size={16} />;
        colorClass = 'text-red-600';
    }
    return <div className={`flex items-center gap-2 text-sm ${colorClass}`}>
        {icon}
        <span className="text-gray-700">{name}</span>
    </div>
}

const AgentActions = ({ status }: { status: Agent['status'] }) => {
    if (status === 'Pending') {
        return (
            <div className="flex gap-2">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">Approve</Button>
                <Button size="sm" variant="destructive">Reject</Button>
            </div>
        );
    }
    if (status === 'Approved') {
        return <Button size="sm" variant="outline"><Eye size={14} className="mr-2"/> View</Button>;
    }
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Re-evaluate</DropdownMenuItem>
          <DropdownMenuItem>Archive</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
};

const AgentVerificationTable = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Verification Queue</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business Details</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((agent) => (
              <TableRow key={agent.id}>
                <TableCell>
                  <div className="font-medium">{agent.businessName}</div>
                  <div className="text-sm text-muted-foreground">{agent.contactName}</div>
                  <div className="text-sm text-muted-foreground">{agent.phone}</div>
                </TableCell>
                <TableCell>
                    <div>{agent.location}</div>
                    <div className="text-sm text-muted-foreground">{agent.locationFocus}</div>
                </TableCell>
                <TableCell>
                    <div className="flex flex-col gap-1.5">
                        <DocumentDisplay name="CAC Cert" status={agent.documents.cacCert} />
                        <DocumentDisplay name="ID Card" status={agent.documents.idCard} />
                        <DocumentDisplay name="Business License" status={agent.documents.businessLicense} />
                    </div>
                </TableCell>
                <TableCell>
                    <Badge variant={agent.status === 'Approved' ? 'default' : agent.status === 'Pending' ? 'secondary' : 'destructive'} 
                           className={agent.status === 'Approved' ? 'bg-green-100 text-green-800 border-green-200' : agent.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-red-100 text-red-800 border-red-200'}>
                        {agent.status}
                    </Badge>
                </TableCell>
                <TableCell className="text-right">
                    <AgentActions status={agent.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AgentVerificationTable;
