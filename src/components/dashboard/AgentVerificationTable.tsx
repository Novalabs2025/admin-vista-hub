
import * as React from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

const AgentActions = ({ agent, onAction }: { agent: Agent; onAction: (agent: Agent) => void }) => {
    if (agent.status === 'Pending') {
        return (
            <div className="flex gap-2">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => onAction(agent)}>Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => onAction(agent)}>Reject</Button>
            </div>
        );
    }
    if (agent.status === 'Approved') {
        return <Button size="sm" variant="outline" onClick={() => onAction(agent)}><Eye size={14} className="mr-2"/> View</Button>;
    }
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onAction(agent)}>Re-evaluate</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction(agent)}>Archive</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
};

const AgentVerificationTable = () => {
  const [selectedAgent, setSelectedAgent] = React.useState<Agent | null>(null);

  return (
    <>
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
                      <AgentActions agent={agent} onAction={setSelectedAgent} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={!!selectedAgent} onOpenChange={(isOpen) => { if (!isOpen) setSelectedAgent(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agent Details</DialogTitle>
            <DialogDescription>
              Review the details for {selectedAgent?.businessName}.
            </DialogDescription>
          </DialogHeader>
          {selectedAgent && (
            <div className="space-y-4 py-2">
                <div className="grid grid-cols-3 items-center gap-x-4">
                  <span className="text-muted-foreground text-right">Business Name</span>
                  <span className="col-span-2 font-medium">{selectedAgent.businessName}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-x-4">
                  <span className="text-muted-foreground text-right">Contact Name</span>
                  <span className="col-span-2">{selectedAgent.contactName}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-x-4">
                  <span className="text-muted-foreground text-right">Phone</span>
                  <span className="col-span-2">{selectedAgent.phone}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-x-4">
                  <span className="text-muted-foreground text-right">Location</span>
                  <span className="col-span-2">{selectedAgent.location}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-x-4">
                  <span className="text-muted-foreground text-right">Focus</span>
                  <span className="col-span-2">{selectedAgent.locationFocus}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Documents Status</span>
                   <div className="flex flex-col gap-1.5 mt-2 pl-4 border-l-2 ml-4">
                      <DocumentDisplay name="CAC Cert" status={selectedAgent.documents.cacCert} />
                      <DocumentDisplay name="ID Card" status={selectedAgent.documents.idCard} />
                      <DocumentDisplay name="Business License" status={selectedAgent.documents.businessLicense} />
                  </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAgent(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AgentVerificationTable;
