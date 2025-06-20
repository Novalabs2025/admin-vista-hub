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
import { CheckCircle2, XCircle, Clock, Eye, Search, Filter, Users, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import DocumentViewer from "@/components/agents/DocumentViewer";
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
import { FetchedAgent } from "@/components/dashboard/AgentVerificationTable";

const EnhancedAgentVerificationTable = () => {
  const [selectedAgent, setSelectedAgent] = React.useState<FetchedAgent | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [accountTypeFilter, setAccountTypeFilter] = React.useState("All");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: agents, isLoading, error, refetch } = useQuery({
    queryKey: ['agentsForVerification'],
    queryFn: async (): Promise<FetchedAgent[]> => {
      // ... keep existing code (fetch logic remains the same)
      console.log('Fetching agents for verification...');
      
      const { data: verifications, error: verificationsError } = await supabase
        .from('agent_verifications')
        .select('*');

      if (verificationsError) {
        console.error('Error fetching verifications:', verificationsError);
        throw new Error(verificationsError.message);
      }
      if (!verifications) return [];

      const userIds = verifications.map(v => v.user_id);
      if (userIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw new Error(profilesError.message);
      }

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

      const propertiesByAgent = new Map();
      const leadsByAgent = new Map();
      const revenueByAgent = new Map();
      const profilesMap = new Map();

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

        const propertiesCount = Number(propertiesByAgent.get(verification.user_id) || 0);
        const leadsCount = Number(leadsByAgent.get(verification.user_id) || 0);
        const totalRevenue = Number(revenueByAgent.get(verification.user_id) || 0);

        return {
          id: verification.user_id,
          businessName: verification.business_name || profile?.full_name || 'N/A',
          contactName: profile?.full_name || 'N/A',
          phone: profile?.phone_number || 'N/A',
          email: 'N/A',
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

  const handleUpdateStatus = (agentId: string, status: 'approved' | 'rejected' | 'pending') => {
    updateAgentStatusMutation.mutate({ agentId, status });
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
      <div className="space-y-4 md:space-y-6">
        {/* Enhanced Stats Cards - Responsive Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 md:h-5 w-4 md:w-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground">Total Agents</p>
                  <p className="text-lg md:text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 md:h-5 w-4 md:w-5 text-yellow-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground">Pending</p>
                  <p className="text-lg md:text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 md:h-5 w-4 md:w-5 text-green-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground">Approved</p>
                  <p className="text-lg md:text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 md:h-5 w-4 md:w-5 text-red-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground">Rejected</p>
                  <p className="text-lg md:text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Verification Queue Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <FileText className="h-5 w-5" />
                  Agent Verification Queue
                </CardTitle>
                <CardDescription className="text-sm">
                  Review and manage agent verification requests
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Responsive Filters */}
            <div className="space-y-4 mb-6">
              <div className="relative">
                <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name, business, or location..."
                  className="w-full rounded-lg bg-background pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[150px]">
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
                  <SelectTrigger className="w-full sm:w-[150px]">
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
            <div className="flex items-center justify-between py-2 border-b mb-4">
              <p className="text-sm text-muted-foreground">
                Showing {filteredAgents.length} of {agents?.length || 0} agents
              </p>
            </div>

            {/* Responsive Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="min-w-[200px]">Agent Details</TableHead>
                    <TableHead className="min-w-[150px] hidden md:table-cell">Contact & Location</TableHead>
                    <TableHead className="min-w-[120px] hidden lg:table-cell">Performance</TableHead>
                    <TableHead className="min-w-[100px]">Documents</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
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
                            <p className="font-medium text-sm">{agent.businessName}</p>
                            <p className="text-xs text-muted-foreground">{agent.contactName}</p>
                            <div className="flex flex-wrap gap-1">
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                {agent.accountType}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(agent.createdAt)}
                              </span>
                            </div>
                            {/* Show contact info on mobile */}
                            <div className="md:hidden space-y-1">
                              <p className="text-xs">{agent.phone}</p>
                              <p className="text-xs text-muted-foreground">{agent.location}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="space-y-1">
                            <p className="text-sm">{agent.phone}</p>
                            <p className="text-sm">{agent.location}</p>
                            <p className="text-xs text-muted-foreground">{agent.locationFocus}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="space-y-1">
                            <div className="flex gap-2 text-xs">
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
                            className={`text-xs ${agent.status === 'Approved' ? 'bg-green-100 text-green-800 border-green-200' : agent.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                            {agent.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setSelectedAgent(agent)}
                            className="h-8 px-2"
                          >
                            <Eye size={14} className="mr-1"/>
                            <span className="hidden sm:inline">Review</span>
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Responsive Modal */}
      <Dialog open={!!selectedAgent} onOpenChange={(isOpen) => { if (!isOpen) setSelectedAgent(null); }}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0">
          <DialogHeader className="p-4 md:p-6">
            <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
              <FileText className="h-5 w-5" />
              Agent Verification: {selectedAgent?.businessName}
            </DialogTitle>
            <DialogDescription>
              Review the agent's details, documents, and performance metrics
            </DialogDescription>
          </DialogHeader>
          
          {selectedAgent && (
            <div className="px-4 md:px-6 pb-4 md:pb-6 space-y-6">
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

              {/* Basic Information - Responsive Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* Performance Metrics - Responsive Grid */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">Performance Overview</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{selectedAgent.propertiesCount}</p>
                    <p className="text-xs text-muted-foreground">Properties</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{selectedAgent.leadsCount}</p>
                    <p className="text-xs text-muted-foreground">Leads</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">₦{(selectedAgent.totalRevenue || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </div>
              </div>

              {/* Documents Section with Enhanced Viewer */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">Document Verification</p>
                <div className="space-y-3">
                  <DocumentViewer 
                    name="CAC Certificate" 
                    url={selectedAgent.documentUrls.cacCert} 
                    status={selectedAgent.documents.cacCert} 
                  />
                  <DocumentViewer 
                    name="ID Card" 
                    url={selectedAgent.documentUrls.idCard} 
                    status={selectedAgent.documents.idCard} 
                  />
                  <DocumentViewer 
                    name="Business License" 
                    url={selectedAgent.documentUrls.businessLicense} 
                    status={selectedAgent.documents.businessLicense} 
                  />
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2 p-4 md:p-6 border-t">
            <Button 
              variant="outline" 
              onClick={() => setSelectedAgent(null)} 
              disabled={updateAgentStatusMutation.isPending}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
            {selectedAgent && (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {selectedAgent.status !== 'Approved' && (
                  <Button 
                    onClick={() => handleUpdateStatus(selectedAgent.id, 'approved')} 
                    className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                    disabled={updateAgentStatusMutation.isPending}
                  >
                    {updateAgentStatusMutation.isPending ? 'Updating...' : 'Approve'}
                  </Button>
                )}
                {selectedAgent.status !== 'Rejected' && (
                  <Button 
                    onClick={() => handleUpdateStatus(selectedAgent.id, 'rejected')} 
                    variant="destructive"
                    disabled={updateAgentStatusMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {updateAgentStatusMutation.isPending ? 'Updating...' : 'Reject'}
                  </Button>
                )}
                {selectedAgent.status !== 'Pending' && (
                  <Button 
                    onClick={() => handleUpdateStatus(selectedAgent.id, 'pending')} 
                    variant="secondary"
                    disabled={updateAgentStatusMutation.isPending}
                    className="w-full sm:w-auto"
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

export default EnhancedAgentVerificationTable;
