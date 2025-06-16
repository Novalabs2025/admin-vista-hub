
import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  FileText, 
  TrendingUp, 
  Users,
  Building,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

type FetchedAgent = {
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

interface AgentDetailsModalProps {
  agent: FetchedAgent | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (variables: { agentId: string; status: 'Approved' | 'Pending' | 'Rejected' }) => void;
  isUpdating?: boolean;
}

const statusVariantMap = {
  verified: "default",
  pending: "secondary",
  missing: "destructive",
} as const;

const statusColorMap: { [key: string]: string } = {
    verified: 'bg-green-100 text-green-800 border-green-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    missing: 'bg-red-100 text-red-800 border-red-200',
}

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'verified':
            return <CheckCircle className="h-4 w-4" />;
        case 'pending':
            return <Clock className="h-4 w-4" />;
        case 'missing':
            return <XCircle className="h-4 w-4" />;
        default:
            return null;
    }
};

const AgentDetailsModal = ({ agent, isOpen, onClose, onUpdateStatus, isUpdating = false }: AgentDetailsModalProps) => {
  if (!agent) return null;

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const DocumentRow = ({ label, status, url, icon }: { 
    label: string; 
    status: 'verified' | 'missing' | 'pending';
    url: string | null;
    icon: React.ReactNode;
  }) => (
    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={statusVariantMap[status]} className={statusColorMap[status]}>
          <span className="flex items-center gap-1">
            {getStatusIcon(status)}
            {capitalize(status)}
          </span>
        </Badge>
        {url && (
          <Button asChild variant="ghost" size="sm">
            <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
              <ExternalLink className="h-4 w-4" />
              View
            </a>
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            {agent.businessName}
          </DialogTitle>
          <DialogDescription>
            Comprehensive agent profile and verification details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Agent Status */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Agent Status</h3>
            <Badge 
              variant={agent.status === 'Approved' ? 'default' : agent.status === 'Pending' ? 'secondary' : 'destructive'}
              className={`text-base px-3 py-1 ${
                agent.status === 'Approved' ? 'bg-green-100 text-green-800 border-green-200' : 
                agent.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 
                'bg-red-100 text-red-800 border-red-200'
              }`}>
              {agent.status}
            </Badge>
          </div>

          <Separator />

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Contact Name</p>
                      <p className="font-medium">{agent.contactName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{agent.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Account Type</p>
                      <Badge variant="outline">{capitalize(agent.accountType)}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{agent.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Focus Area</p>
                      <p className="font-medium">{agent.locationFocus}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Joined</p>
                      <p className="font-medium">{formatDate(agent.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Performance Metrics */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Performance Overview</h3>
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Building className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold">{agent.propertiesCount}</p>
                  <p className="text-sm text-muted-foreground">Properties</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold">{agent.leadsCount}</p>
                  <p className="text-sm text-muted-foreground">Leads</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-2xl font-bold">₦{agent.totalRevenue.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Documents Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Verification
            </h3>
            <div className="space-y-3">
              <DocumentRow 
                label="CAC Certificate" 
                status={agent.documents.cacCert} 
                url={agent.documentUrls.cacCert}
                icon={<FileText className="h-4 w-4" />}
              />
              <DocumentRow 
                label="ID Card" 
                status={agent.documents.idCard} 
                url={agent.documentUrls.idCard}
                icon={<User className="h-4 w-4" />}
              />
              <DocumentRow 
                label="Business License" 
                status={agent.documents.businessLicense} 
                url={agent.documentUrls.businessLicense}
                icon={<Building className="h-4 w-4" />}
              />
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{formatDate(agent.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated:</span>
                <span>{formatDate(agent.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between pt-6">
          <Button variant="outline" onClick={onClose} disabled={isUpdating}>
            Close
          </Button>
          <div className="flex gap-2">
            {agent.status !== 'Approved' && (
              <Button 
                onClick={() => onUpdateStatus({ agentId: agent.id, status: 'Approved' })} 
                className="bg-green-600 hover:bg-green-700"
                disabled={isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Approve'}
              </Button>
            )}
            {agent.status !== 'Rejected' && (
              <Button 
                onClick={() => onUpdateStatus({ agentId: agent.id, status: 'Rejected' })} 
                variant="destructive"
                disabled={isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Reject'}
              </Button>
            )}
            {agent.status !== 'Pending' && (
              <Button 
                onClick={() => onUpdateStatus({ agentId: agent.id, status: 'Pending' })} 
                variant="secondary"
                disabled={isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Set to Pending'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AgentDetailsModal;
