
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

type FetchedAgent = {
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

interface AgentDetailsModalProps {
  agent: FetchedAgent | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (variables: { agentId: string; status: 'Approved' | 'Pending' | 'Rejected' }) => void;
}

const statusVariantMap = {
  verified: "default",
  pending: "secondary",
  missing: "destructive",
} as const;

const statusColorMap: { [key: string]: string } = {
    verified: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    missing: 'bg-red-100 text-red-800',
}

const AgentDetailsModal = ({ agent, isOpen, onClose, onUpdateStatus }: AgentDetailsModalProps) => {
  if (!agent) return null;

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const DocumentRow = ({ label, status, url }: { label: string; status: 'verified' | 'missing' | 'pending', url: string | null }) => (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <Badge variant={statusVariantMap[status]} className={statusColorMap[status]}>
            {capitalize(status)}
        </Badge>
        {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">View</a>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{agent.businessName}</DialogTitle>
          <DialogDescription>
            Contact: {agent.contactName}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Phone</p>
            <p className="text-sm text-muted-foreground">{agent.phone}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Location</p>
            <p className="text-sm text-muted-foreground">{agent.location}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Location Focus</p>
            <p className="text-sm text-muted-foreground">{agent.locationFocus}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Status</p>
            <Badge variant={agent.status === 'Approved' ? 'default' : agent.status === 'Pending' ? 'secondary' : 'destructive'}
                   className={agent.status === 'Approved' ? 'bg-green-100 text-green-800' : agent.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
              {agent.status}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Documents</p>
            <div className="space-y-2">
              <DocumentRow label="CAC Certificate" status={agent.documents.cacCert} url={agent.documentUrls.cacCert} />
              <DocumentRow label="ID Card" status={agent.documents.idCard} url={agent.documentUrls.idCard} />
              <DocumentRow label="Business License" status={agent.documents.businessLicense} url={agent.documentUrls.businessLicense} />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-start">
            <Button onClick={() => onUpdateStatus({ agentId: agent.id, status: 'Approved' })} variant="default" className="bg-green-600 hover:bg-green-700">Approve</Button>
            <Button onClick={() => onUpdateStatus({ agentId: agent.id, status: 'Rejected' })} variant="destructive">Reject</Button>
            <Button onClick={() => onUpdateStatus({ agentId: agent.id, status: 'Pending' })} variant="secondary">Set to Pending</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AgentDetailsModal;
