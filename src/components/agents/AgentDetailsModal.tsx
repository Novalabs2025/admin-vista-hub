
import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Agent } from "@/data/mockData";

interface AgentDetailsModalProps {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
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

const AgentDetailsModal = ({ agent, isOpen, onClose }: AgentDetailsModalProps) => {
  if (!agent) return null;

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

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
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">CAC Certificate</p>
                    <Badge variant={statusVariantMap[agent.documents.cacCert]} className={statusColorMap[agent.documents.cacCert]}>
                        {capitalize(agent.documents.cacCert)}
                    </Badge>
                </div>
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">ID Card</p>
                    <Badge variant={statusVariantMap[agent.documents.idCard]} className={statusColorMap[agent.documents.idCard]}>
                        {capitalize(agent.documents.idCard)}
                    </Badge>
                </div>
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Business License</p>
                    <Badge variant={statusVariantMap[agent.documents.businessLicense]} className={statusColorMap[agent.documents.businessLicense]}>
                        {capitalize(agent.documents.businessLicense)}
                    </Badge>
                </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AgentDetailsModal;
