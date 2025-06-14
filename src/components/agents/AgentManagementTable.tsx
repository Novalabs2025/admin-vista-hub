
import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from 'lucide-react';
import AgentDetailsModal from './AgentDetailsModal';
import { Skeleton } from "@/components/ui/skeleton";

export type FetchedAgent = {
  id: string;
  businessName: string;
  contactName: string;
  phone: string;
  location: string;
  locationFocus: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  documents: {
    cacCert: 'verified' | 'missing' | 'pending';
    idCard: 'verified' | 'missing' | 'pending';
    businessLicense: 'verified' | 'missing' | 'pending';
  };
  documentUrls: {
    cacCert: string | null;
    idCard: string | null;
    businessLicense: string | null;
  };
};

const AgentManagementTable = () => {
    const [searchTerm, setSearchTerm] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState("All");
    const [selectedAgent, setSelectedAgent] = React.useState<FetchedAgent | null>(null);
    const queryClient = useQueryClient();

    const { data: agents, isLoading } = useQuery({
      queryKey: ['allAgents'],
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
          // We cast to any to access a column that might not be in the generated types yet.
          const castedVerification = verification as any;

          return {
            id: verification.user_id,
            businessName: profile?.full_name || 'N/A',
            contactName: profile?.full_name || 'N/A',
            phone: profile?.phone_number || 'N/A',
            location: profile?.location || 'N/A',
            locationFocus: profile?.location_focus || 'N/A',
            status: statusMap[statusKey] || 'Pending',
            documents: {
              cacCert: castedVerification.cac_document_url ? 'verified' : 'missing',
              idCard: verification.id_document_url ? 'verified' : 'missing',
              businessLicense: verification.license_document_url ? 'verified' : 'missing',
            },
            documentUrls: {
              cacCert: castedVerification.cac_document_url ?? null,
              idCard: verification.id_document_url ?? null,
              businessLicense: verification.license_document_url ?? null,
            }
          };
        });
      }
    });

    const updateAgentStatusMutation = useMutation({
      mutationFn: async ({ agentId, status }: { agentId: string, status: 'Approved' | 'Pending' | 'Rejected' }) => {
          const { error } = await supabase
              .from('agent_verifications')
              .update({ status: status.toLowerCase() as 'approved' | 'pending' | 'rejected' })
              .eq('user_id', agentId);
  
          if (error) {
              throw new Error(error.message);
          }
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['allAgents'] });
          setSelectedAgent(null);
      },
      onError: (error) => {
          console.error("Error updating agent status:", error);
      }
    });

    const filteredAgents = (agents || []).filter(agent =>
        (agent.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.contactName.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (statusFilter === "All" || agent.status === statusFilter)
    );

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Agent Management</CardTitle>
                    <CardDescription>View, manage, and search for all agents in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between py-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="search"
                              placeholder="Search agents..."
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
                                <SelectItem value="Approved">Approved</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Business Name</TableHead>
                                <TableHead>Contact Name</TableHead>
                                <TableHead>Location</TableHead>
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
                                      <TableCell className="font-medium">{agent.businessName}</TableCell>
                                      <TableCell>{agent.contactName}</TableCell>
                                      <TableCell>{agent.location}</TableCell>
                                      <TableCell>
                                          <Badge variant={agent.status === 'Approved' ? 'default' : agent.status === 'Pending' ? 'secondary' : 'destructive'}
                                                 className={agent.status === 'Approved' ? 'bg-green-100 text-green-800' : agent.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                                              {agent.status}
                                          </Badge>
                                      </TableCell>
                                      <TableCell className="text-right">
                                          <Button variant="outline" size="sm" onClick={() => setSelectedAgent(agent)}>View Details</Button>
                                      </TableCell>
                                  </TableRow>
                              ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <AgentDetailsModal 
                agent={selectedAgent}
                isOpen={!!selectedAgent}
                onClose={() => setSelectedAgent(null)}
                onUpdateStatus={updateAgentStatusMutation.mutate}
            />
        </>
    );
};

export default AgentManagementTable;
