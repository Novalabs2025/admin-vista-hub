
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { CheckCircle2, XCircle, Hourglass, Eye, MoreVertical, Search } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

export type FetchedAgent = {
  id: string; // user_id from db
  businessName: string;
  contactName: string;
  phone: string;
  location: string;
  locationFocus: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  documents: {
    cacCert: { status: 'verified' | 'missing' | 'pending'; url: string | null };
    idCard: { status: 'verified' | 'missing' | 'pending'; url: string | null };
    businessLicense: { status: 'verified' | 'missing' | 'pending'; url: string | null };
  };
};

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

const DocumentLink = ({ name, url, status }: { name: string, url: string | null, status: string }) => (
    <div className="flex justify-between items-center py-1">
        <span className="text-sm text-gray-700">{name}</span>
        {url ? (
            <Button asChild variant="link" size="sm" className="p-0 h-auto">
                <a href={url} target="_blank" rel="noopener noreferrer">
                    View Document
                </a>
            </Button>
        ) : (
            <Badge variant="outline" className="text-xs">{status}</Badge>
        )}
    </div>
);

const AgentActions = ({ agent, onAction }: { 
    agent: FetchedAgent; 
    onAction: (agent: FetchedAgent) => void;
}) => {
    if (agent.status === 'Pending') {
        return (
            <Button size="sm" variant="outline" onClick={() => onAction(agent)}><Eye size={14} className="mr-2"/> Review</Button>
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
  const [selectedAgent, setSelectedAgent] = React.useState<FetchedAgent | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: agents, isLoading } = useQuery({
    queryKey: ['agentsForVerification'],
    queryFn: async (): Promise<FetchedAgent[]> => {
      const { data: verifications, error: verificationsError } = await supabase
        .from('agent_verifications')
        .select('*');

      if (verificationsError) throw new Error(verificationsError.message);
      if (!verifications) return [];

      const userIds = verifications.map(v => v.user_id);
      if (userIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);
      
      if (profilesError) throw new Error(profilesError.message);
      
      const profilesById = new Map(profiles?.map(p => [p.id, p]));

      const statusMap = {
        approved: 'Approved',
        pending: 'Pending',
        rejected: 'Rejected',
      } as const;

      return verifications.map(verification => {
        const profile = profilesById.get(verification.user_id);
        const statusKey = verification.status as keyof typeof statusMap;

        return {
          id: verification.user_id,
          businessName: profile?.full_name || 'N/A',
          contactName: profile?.full_name || 'N/A',
          phone: profile?.phone_number || 'N/A',
          location: profile?.location || 'N/A',
          locationFocus: profile?.location_focus || 'N/A',
          status: statusMap[statusKey] || 'Pending',
          documents: {
            cacCert: { status: 'missing', url: null },
            idCard: { 
                status: verification.id_document_url ? 'verified' : 'missing', 
                url: verification.id_document_url
            },
            businessLicense: { 
                status: verification.license_document_url ? 'verified' : 'missing',
                url: verification.license_document_url
            },
          },
        };
      });
    }
  });

  const updateAgentStatusMutation = useMutation({
    mutationFn: async ({ agentId, status }: { agentId: string, status: 'approved' | 'rejected' | 'pending' }) => {
      const { error } = await supabase
        .from('agent_verifications')
        .update({ status })
        .eq('user_id', agentId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentsForVerification'] });
      queryClient.invalidateQueries({ queryKey: ['allAgents'] });
      toast({
        title: "Agent status updated",
        description: "The agent's status has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleApproveAgent = (agent: FetchedAgent) => {
    updateAgentStatusMutation.mutate({ agentId: agent.id, status: 'approved' });
  };

  const handleRejectAgent = (agent: FetchedAgent) => {
    updateAgentStatusMutation.mutate({ agentId: agent.id, status: 'rejected' });
  };

  const handleSetToPending = (agent: FetchedAgent) => {
    updateAgentStatusMutation.mutate({ agentId: agent.id, status: 'pending' });
  };

  const filteredAgents = (agents || []).filter(agent =>
    agent.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.contactName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Agent Verification Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center py-4">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search agents by name..."
                  className="w-full rounded-lg bg-background pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>
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
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                filteredAgents.map((agent) => (
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
                            <DocumentDisplay name="CAC Cert" status={agent.documents.cacCert.status} />
                            <DocumentDisplay name="ID Card" status={agent.documents.idCard.status} />
                            <DocumentDisplay name="Business License" status={agent.documents.businessLicense.status} />
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant={agent.status === 'Approved' ? 'default' : agent.status === 'Pending' ? 'secondary' : 'destructive'} 
                               className={agent.status === 'Approved' ? 'bg-green-100 text-green-800 border-green-200' : agent.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-red-100 text-red-800 border-red-200'}>
                            {agent.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <AgentActions 
                            agent={agent} 
                            onAction={setSelectedAgent}
                        />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={!!selectedAgent} onOpenChange={(isOpen) => { if (!isOpen) setSelectedAgent(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Agent Details: {selectedAgent?.businessName}</DialogTitle>
            <DialogDescription>
              Review the agent's details and documents before taking action.
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
                  <span className="text-sm font-medium text-muted-foreground">Documents</span>
                   <div className="flex flex-col gap-1 mt-2 pl-4 border-l-2 ml-4">
                      <DocumentLink name="CAC Cert" url={selectedAgent.documents.cacCert.url} status={selectedAgent.documents.cacCert.status} />
                      <DocumentLink name="ID Card" url={selectedAgent.documents.idCard.url} status={selectedAgent.documents.idCard.status} />
                      <DocumentLink name="Business License" url={selectedAgent.documents.businessLicense.url} status={selectedAgent.documents.businessLicense.status} />
                  </div>
              </div>
            </div>
          )}
          <DialogFooter className="sm:justify-between pt-4">
            <Button variant="outline" onClick={() => setSelectedAgent(null)}>Close</Button>
            {selectedAgent && (
              <div className="flex gap-2">
                {selectedAgent.status !== 'Approved' && 
                  <Button className="bg-green-600 hover:bg-green-700" onClick={() => { handleApproveAgent(selectedAgent); setSelectedAgent(null); }}>Approve</Button>}
                {selectedAgent.status !== 'Rejected' && 
                  <Button variant="destructive" onClick={() => { handleRejectAgent(selectedAgent); setSelectedAgent(null); }}>Reject</Button>}
                {selectedAgent.status !== 'Pending' && 
                  <Button variant="secondary" onClick={() => { handleSetToPending(selectedAgent); setSelectedAgent(null); }}>Set to Pending</Button>}
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AgentVerificationTable;
