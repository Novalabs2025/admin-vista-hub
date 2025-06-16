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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, Clock, Eye, Search, Filter, Users, FileText, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const DocumentDisplay = ({ name, status }: { name: string; status: 'verified' | 'missing' | 'pending' }) => {
  let icon, colorClass, bgClass;
  if (status === 'verified') {
    icon = <CheckCircle2 size={16} />;
    colorClass = 'text-green-600';
    bgClass = 'bg-green-50';
  } else if (status === 'pending') {
    icon = <Clock size={16} />;
    colorClass = 'text-yellow-600';
    bgClass = 'bg-yellow-50';
  } else {
    icon = <XCircle size={16} />;
    colorClass = 'text-red-600';
    bgClass = 'bg-red-50';
  }
  
  return (
    <div className={`flex items-center gap-2 text-sm p-2 rounded-md ${colorClass} ${bgClass}`}>
      {icon}
      <span className="font-medium">{name}</span>
      <Badge variant="outline" className="text-xs ml-auto">
        {status}
      </Badge>
    </div>
  );
};

const DocumentLink = ({ name, url, status }: { name: string, url: string | null, status: string }) => (
  <div className="flex justify-between items-center py-2 px-3 bg-muted/30 rounded-lg">
    <div className="flex items-center gap-2">
      <FileText className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium">{name}</span>
    </div>
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="text-xs">
        {status}
      </Badge>
      {url ? (
        <Button asChild variant="ghost" size="sm" className="h-8 px-2">
          <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            View
          </a>
        </Button>
      ) : (
        <span className="text-xs text-muted-foreground px-2">No file</span>
      )}
    </div>
  </div>
);

const AgentVerificationTable = () => {
  const [selectedAgent, setSelectedAgent] = React.useState<FetchedAgent | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [accountTypeFilter, setAccountTypeFilter] = React.useState("All");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: agents, isLoading, error } = useQuery({
    queryKey: ['agentsForVerification'],
    queryFn: async (): Promise<FetchedAgent[]> => {
      console.log('Fetching agents for verification...');
      
      // Fetch agent verifications
      const { data: verifications, error: verificationsError } = await supabase
        .from('agent_verifications')
        .select('*');

      if (verificationsError) {
        console.error('Error fetching verifications:', verificationsError);
        throw new Error(verificationsError.message);
      }
      if (!verifications) return [];

      console.log('Verifications fetched:', verifications.length);

      // Get user IDs from verifications
      const userIds = verifications.map(v => v.user_id);
      if (userIds.length === 0) return [];

      // Fetch profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw new Error(profilesError.message);
      }

      // Fetch additional data for enhanced verification view
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

      // Process the additional data
      const propertiesByAgent = new Map();
      const leadsByAgent = new Map();
      const revenueByAgent = new Map();
      const profilesMap = new Map();

      // Create profiles map for easy lookup
      profiles?.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

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
        const profile = profilesMap.get(verification.user_id);
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
      setSelectedAgent(null);
      toast({
        title: "Success",
        description: "Agent status updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to update agent status: " + error.message,
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

  const filteredAgents = (agents || []).filter(agent => {
    const matchesSearch = agent.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || agent.status === statusFilter;
    const matchesAccountType = accountTypeFilter === "All" || agent.accountType === accountTypeFilter;
    
    return matchesSearch && matchesStatus && matchesAccountType;
  });

  const stats = React.useMemo(() => {
    if (!agents) return { total: 0, pending: 0, approved: 0, rejected: 0 };
    
    return {
      total: agents.length,
      pending: agents.filter(a => a.status === 'Pending').length,
      approved: agents.filter(a => a.status === 'Approved').length,
      rejected: agents.filter(a => a.status === 'Rejected').length,
    };
  }, [agents]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600 flex items-center justify-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Error loading agents: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Enhanced Stats Cards */}
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
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
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
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Verification Queue Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Agent Verification Queue
            </CardTitle>
            <CardDescription>
              Review and manage agent verification requests with comprehensive document validation and approval workflow.
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
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
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
                  <TableHead>Contact & Location</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Documents</TableHead>
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
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {agent.accountType}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(agent.createdAt)}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">{agent.phone}</p>
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
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            {agent.documents.cacCert === 'verified' ? (
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                            ) : agent.documents.cacCert === 'pending' ? (
                              <Clock className="h-3 w-3 text-yellow-600" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-600" />
                            )}
                            <span className="text-xs">CAC</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {agent.documents.idCard === 'verified' ? (
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                            ) : agent.documents.idCard === 'pending' ? (
                              <Clock className="h-3 w-3 text-yellow-600" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-600" />
                            )}
                            <span className="text-xs">ID</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {agent.documents.businessLicense === 'verified' ? (
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                            ) : agent.documents.businessLicense === 'pending' ? (
                              <Clock className="h-3 w-3 text-yellow-600" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-600" />
                            )}
                            <span className="text-xs">License</span>
                          </div>
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
                          <Eye size={14} className="mr-2"/>
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {filteredAgents.length === 0 && !isLoading && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No agents found matching your criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Modal */}
      <Dialog open={!!selectedAgent} onOpenChange={(isOpen) => { if (!isOpen) setSelectedAgent(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Agent Verification: {selectedAgent?.businessName}
            </DialogTitle>
            <DialogDescription>
              Review the agent's details, documents, and performance metrics before making a decision.
            </DialogDescription>
          </DialogHeader>
          {selectedAgent && (
            <div className="space-y-6 py-4">
              {/* Agent Status */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">Current Status</p>
                  <p className="text-sm text-muted-foreground">
                    Submitted on {formatDate(selectedAgent.createdAt)}
                  </p>
                </div>
                <Badge 
                  variant={selectedAgent.status === 'Approved' ? 'default' : selectedAgent.status === 'Pending' ? 'secondary' : 'destructive'}
                  className={`text-base px-3 py-1 ${
                    selectedAgent.status === 'Approved' ? 'bg-green-100 text-green-800 border-green-200' : 
                    selectedAgent.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 
                    'bg-red-100 text-red-800 border-red-200'
                  }`}>
                  {selectedAgent.status}
                </Badge>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Business Name</p>
                    <p className="font-medium">{selectedAgent.businessName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Contact Name</p>
                    <p>{selectedAgent.contactName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p>{selectedAgent.phone}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Location</p>
                    <p>{selectedAgent.location}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Focus Area</p>
                    <p>{selectedAgent.locationFocus}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Account Type</p>
                    <Badge variant="outline">{selectedAgent.accountType}</Badge>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">Performance Overview</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{selectedAgent.propertiesCount}</p>
                    <p className="text-xs text-muted-foreground">Properties</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{selectedAgent.leadsCount}</p>
                    <p className="text-xs text-muted-foreground">Leads</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">₦{(selectedAgent.totalRevenue || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">Document Verification</p>
                <div className="space-y-3">
                  <DocumentLink 
                    name="CAC Certificate" 
                    url={selectedAgent.documentUrls.cacCert} 
                    status={selectedAgent.documents.cacCert} 
                  />
                  <DocumentLink 
                    name="ID Card" 
                    url={selectedAgent.documentUrls.idCard} 
                    status={selectedAgent.documents.idCard} 
                  />
                  <DocumentLink 
                    name="Business License" 
                    url={selectedAgent.documentUrls.businessLicense} 
                    status={selectedAgent.documents.businessLicense} 
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:justify-between pt-6">
            <Button variant="outline" onClick={() => setSelectedAgent(null)} disabled={updateAgentStatusMutation.isPending}>
              Close
            </Button>
            {selectedAgent && (
              <div className="flex gap-2">
                {selectedAgent.status !== 'Approved' && (
                  <Button 
                    onClick={() => handleApproveAgent(selectedAgent)} 
                    className="bg-green-600 hover:bg-green-700"
                    disabled={updateAgentStatusMutation.isPending}
                  >
                    {updateAgentStatusMutation.isPending ? 'Updating...' : 'Approve'}
                  </Button>
                )}
                {selectedAgent.status !== 'Rejected' && (
                  <Button 
                    onClick={() => handleRejectAgent(selectedAgent)} 
                    variant="destructive"
                    disabled={updateAgentStatusMutation.isPending}
                  >
                    {updateAgentStatusMutation.isPending ? 'Updating...' : 'Reject'}
                  </Button>
                )}
                {selectedAgent.status !== 'Pending' && (
                  <Button 
                    onClick={() => handleSetToPending(selectedAgent)} 
                    variant="secondary"
                    disabled={updateAgentStatusMutation.isPending}
                  >
                    {updateAgentStatusMutation.isPending ? 'Updating...' : 'Set to Pending'}
                  </Button>
                )}
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AgentVerificationTable;
