import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Users, CheckCircle, Clock, XCircle } from 'lucide-react';
import AgentDetailsModal from './AgentDetailsModal';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export type FetchedAgent = {
  id: string;
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  location: string;
  locationFocus: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  accountType: string;
  createdAt: string;
  updatedAt: string;
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
  propertiesCount: number;
  leadsCount: number;
  totalRevenue: number;
};

const AgentManagementTable = () => {
    const [searchTerm, setSearchTerm] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState("All");
    const [accountTypeFilter, setAccountTypeFilter] = React.useState("All");
    const [selectedAgent, setSelectedAgent] = React.useState<FetchedAgent | null>(null);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: agents, isLoading, error } = useQuery({
      queryKey: ['allAgents'],
      queryFn: async (): Promise<FetchedAgent[]> => {
        console.log('Fetching agents data...');
        
        // Fetch agent verifications with proper joins
        const { data: verifications, error: verificationsError } = await supabase
          .from('agent_verifications')
          .select(`
            *,
            profiles:user_id (
              full_name,
              phone_number,
              location,
              location_focus
            )
          `);

        if (verificationsError) {
          console.error('Error fetching verifications:', verificationsError);
          throw new Error(verificationsError.message);
        }
        if (!verifications) return [];

        console.log('Verifications fetched:', verifications.length);

        // Get user IDs from verifications
        const userIds = verifications.map(v => v.user_id);
        if (userIds.length === 0) return [];

        // Fetch additional data for each agent
        const [propertiesResponse, leadsResponse, paymentsResponse] = await Promise.all([
          supabase
            .from('properties')
            .select('agent_id, id')
            .in('agent_id', userIds),
          supabase
            .from('leads')
            .select('agent_id, id')
            .in('agent_id', userIds),
          supabase
            .from('payments')
            .select('user_id, amount')
            .eq('status', 'Paid')
            .in('user_id', userIds)
        ]);

        // Process the data
        const propertiesByAgent = new Map();
        const leadsByAgent = new Map();
        const revenueByAgent = new Map();

        propertiesResponse.data?.forEach(prop => {
          const count = propertiesByAgent.get(prop.agent_id) || 0;
          propertiesByAgent.set(prop.agent_id, count + 1);
        });

        leadsResponse.data?.forEach(lead => {
          const count = leadsByAgent.get(lead.agent_id) || 0;
          leadsByAgent.set(lead.agent_id, count + 1);
        });

        paymentsResponse.data?.forEach(payment => {
          const total = revenueByAgent.get(payment.user_id) || 0;
          revenueByAgent.set(payment.user_id, total + Number(payment.amount || 0));
        });

        const statusMap = {
          approved: 'Approved',
          pending: 'Pending',
          rejected: 'Rejected',
        } as const;

        return verifications.map(verification => {
          const profile = verification.profiles as any;
          const statusKey = verification.status as keyof typeof statusMap;

          // Ensure all numeric values are properly defined
          const propertiesCount = Number(propertiesByAgent.get(verification.user_id) || 0);
          const leadsCount = Number(leadsByAgent.get(verification.user_id) || 0);
          const totalRevenue = Number(revenueByAgent.get(verification.user_id) || 0);

          return {
            id: verification.user_id,
            businessName: verification.business_name || profile?.full_name || 'N/A',
            contactName: profile?.full_name || 'N/A',
            phone: profile?.phone_number || 'N/A',
            email: 'N/A', // Not available in current schema
            location: verification.location || profile?.location || 'N/A',
            locationFocus: verification.location_focus || profile?.location_focus || 'N/A',
            status: statusMap[statusKey] || 'Pending',
            accountType: verification.account_type || 'individual',
            createdAt: verification.created_at,
            updatedAt: verification.updated_at,
            documents: {
              cacCert: verification.cac_document_url ? 'verified' : 'missing',
              idCard: verification.id_document_url ? 'verified' : 'missing',
              businessLicense: verification.license_document_url ? 'verified' : 'missing',
            },
            documentUrls: {
              cacCert: verification.cac_document_url ?? null,
              idCard: verification.id_document_url ?? null,
              businessLicense: verification.license_document_url ?? null,
            },
            propertiesCount,
            leadsCount,
            totalRevenue,
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
          queryClient.invalidateQueries({ queryKey: ['agentsForVerification'] });
          setSelectedAgent(null);
          toast({
            title: "Success",
            description: "Agent status updated successfully",
          });
      },
      onError: (error) => {
          console.error("Error updating agent status:", error);
          toast({
            title: "Error",
            description: "Failed to update agent status",
            variant: "destructive",
          });
      }
    });

    const filteredAgents = (agents || []).filter(agent => {
        const matchesSearch = agent.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             agent.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             agent.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "All" || agent.status === statusFilter;
        const matchesAccountType = accountTypeFilter === "All" || agent.accountType === accountTypeFilter;
        
        return matchesSearch && matchesStatus && matchesAccountType;
    });

    const stats = React.useMemo(() => {
        if (!agents) return { total: 0, approved: 0, pending: 0, rejected: 0 };
        
        return {
            total: agents.length,
            approved: agents.filter(a => a.status === 'Approved').length,
            pending: agents.filter(a => a.status === 'Pending').length,
            rejected: agents.filter(a => a.status === 'Rejected').length,
        };
    }, [agents]);

    if (error) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center text-red-600">
                        Error loading agents: {error.message}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <Users className="h-5 w-5 text-blue-600" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Agents</p>
                                    <p className="text-2xl font-bold">{stats.total}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Approved</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <Clock className="h-5 w-5 text-yellow-600" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Pending</p>
                                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <XCircle className="h-5 w-5 text-red-600" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Rejected</p>
                                    <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Table Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Agent Management
                        </CardTitle>
                        <CardDescription>
                            Comprehensive view and management of all agents in the system with detailed information and statistics.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Enhanced Filters */}
                        <div className="flex flex-col sm:flex-row gap-4 py-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="search"
                                  placeholder="Search by name, business, or location..."
                                  className="w-full rounded-lg bg-background pl-8"
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-[150px]">
                                        <Filter className="h-4 w-4 mr-2" />
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All Statuses</SelectItem>
                                        <SelectItem value="Approved">Approved</SelectItem>
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="Rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="Account Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All Types</SelectItem>
                                        <SelectItem value="individual">Individual</SelectItem>
                                        <SelectItem value="business">Business</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Results Summary */}
                        <div className="flex items-center justify-between py-2 border-b">
                            <p className="text-sm text-muted-foreground">
                                Showing {filteredAgents.length} of {agents?.length || 0} agents
                            </p>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Agent Details</TableHead>
                                    <TableHead>Contact Info</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Performance</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                  Array.from({ length: 5 }).map((_, index) => (
                                    <TableRow key={index}>
                                      <TableCell colSpan={6}>
                                        <Skeleton className="h-16 w-full" />
                                      </TableCell>
                                    </TableRow>
                                  ))
                                ) : (
                                  filteredAgents.map((agent) => (
                                      <TableRow key={agent.id} className="hover:bg-muted/50">
                                          <TableCell>
                                              <div className="space-y-1">
                                                  <p className="font-medium">{agent.businessName}</p>
                                                  <p className="text-sm text-muted-foreground">{agent.contactName}</p>
                                                  <Badge variant="outline" className="text-xs">
                                                      {agent.accountType}
                                                  </Badge>
                                              </div>
                                          </TableCell>
                                          <TableCell>
                                              <div className="space-y-1">
                                                  <p className="text-sm">{agent.phone}</p>
                                                  <p className="text-xs text-muted-foreground">{agent.email}</p>
                                              </div>
                                          </TableCell>
                                          <TableCell>
                                              <div className="space-y-1">
                                                  <p className="text-sm">{agent.location}</p>
                                                  <p className="text-xs text-muted-foreground">{agent.locationFocus}</p>
                                              </div>
                                          </TableCell>
                                          <TableCell>
                                              <div className="space-y-1">
                                                  <div className="flex gap-4 text-xs">
                                                      <span>{agent.propertiesCount} Properties</span>
                                                      <span>{agent.leadsCount} Leads</span>
                                                  </div>
                                                  <p className="text-xs text-muted-foreground">
                                                      Revenue: ₦{(agent.totalRevenue || 0).toLocaleString()}
                                                  </p>
                                              </div>
                                          </TableCell>
                                          <TableCell>
                                              <Badge 
                                                  variant={agent.status === 'Approved' ? 'default' : agent.status === 'Pending' ? 'secondary' : 'destructive'}
                                                  className={agent.status === 'Approved' ? 'bg-green-100 text-green-800 border-green-200' : agent.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-red-100 text-red-800 border-red-200'}>
                                                  {agent.status}
                                              </Badge>
                                          </TableCell>
                                          <TableCell className="text-right">
                                              <Button variant="outline" size="sm" onClick={() => setSelectedAgent(agent)}>
                                                  View Details
                                              </Button>
                                          </TableCell>
                                      </TableRow>
                                  ))
                                )}
                            </TableBody>
                        </Table>

                        {filteredAgents.length === 0 && !isLoading && (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">No agents found matching your criteria.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <AgentDetailsModal 
                agent={selectedAgent}
                isOpen={!!selectedAgent}
                onClose={() => setSelectedAgent(null)}
                onUpdateStatus={updateAgentStatusMutation.mutate}
                isUpdating={updateAgentStatusMutation.isPending}
            />
        </>
    );
};

export default AgentManagementTable;
