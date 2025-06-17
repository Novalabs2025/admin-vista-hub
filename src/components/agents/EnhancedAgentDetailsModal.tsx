
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { FetchedAgent } from "./AgentManagementTable";
import WhatsAppVoiceSection from "./WhatsAppVoiceSection";
import { 
  User, 
  MapPin, 
  Phone, 
  Building, 
  Calendar, 
  DollarSign, 
  Home, 
  Users, 
  MessageSquare,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";

interface EnhancedAgentDetailsModalProps {
  agent: FetchedAgent | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (data: { agentId: string; status: 'Approved' | 'Pending' | 'Rejected' }) => void;
  isUpdating: boolean;
}

export default function EnhancedAgentDetailsModal({
  agent,
  isOpen,
  onClose,
  onUpdateStatus,
  isUpdating
}: EnhancedAgentDetailsModalProps) {
  if (!agent) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'Rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getDocumentStatus = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'missing':
        return <Badge variant="destructive">Missing</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {agent.businessName}
          </DialogTitle>
          <DialogDescription>
            Comprehensive agent details and management
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="communications">Communications</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Contact Name:</span>
                    <span className="text-sm font-medium">{agent.contactName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Phone:</span>
                    <span className="text-sm font-medium">{agent.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Account Type:</span>
                    <Badge variant="outline">{agent.accountType}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(agent.status)}
                      <Badge variant={agent.status === 'Approved' ? 'default' : agent.status === 'Pending' ? 'secondary' : 'destructive'}>
                        {agent.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Location:</span>
                    <span className="text-sm font-medium">{agent.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Focus Area:</span>
                    <span className="text-sm font-medium">{agent.locationFocus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Joined:</span>
                    <span className="text-sm font-medium">
                      {format(new Date(agent.createdAt), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => onUpdateStatus({ agentId: agent.id, status: 'Approved' })}
                disabled={isUpdating || agent.status === 'Approved'}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                onClick={() => onUpdateStatus({ agentId: agent.id, status: 'Rejected' })}
                disabled={isUpdating || agent.status === 'Rejected'}
                variant="destructive"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
              <Button
                onClick={() => onUpdateStatus({ agentId: agent.id, status: 'Pending' })}
                disabled={isUpdating || agent.status === 'Pending'}
                variant="secondary"
              >
                <Clock className="h-4 w-4 mr-1" />
                Set Pending
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Document Verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>CAC Certificate:</span>
                  {getDocumentStatus(agent.documents.cacCert)}
                </div>
                <div className="flex justify-between items-center">
                  <span>ID Card:</span>
                  {getDocumentStatus(agent.documents.idCard)}
                </div>
                <div className="flex justify-between items-center">
                  <span>Business License:</span>
                  {getDocumentStatus(agent.documents.businessLicense)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Home className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Properties</p>
                      <p className="text-2xl font-bold">{agent.propertiesCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Leads</p>
                      <p className="text-2xl font-bold">{agent.leadsCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                      <p className="text-2xl font-bold">₦{agent.totalRevenue.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="communications" className="space-y-4">
            <WhatsAppVoiceSection agentId={agent.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
