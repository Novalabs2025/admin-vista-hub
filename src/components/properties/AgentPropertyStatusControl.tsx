
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, Home, DollarSign, Key } from "lucide-react";

type PropertyStatus = "pending" | "approved" | "rejected" | "rented" | "sold" | "leased";

interface AgentPropertyStatusControlProps {
  propertyId: string;
  currentStatus: string;
  agentId: string;
}

const AgentPropertyStatusControl = ({ 
  propertyId, 
  currentStatus, 
  agentId 
}: AgentPropertyStatusControlProps) => {
  const [statusChangeProperty, setStatusChangeProperty] = useState<{
    id: string;
    newStatus: PropertyStatus;
  } | null>(null);
  const [statusChangeReason, setStatusChangeReason] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updatePropertyStatusMutation = useMutation({
    mutationFn: async ({
      propertyId,
      status,
      reason,
    }: {
      propertyId: string;
      status: PropertyStatus;
      reason: string;
    }) => {
      const { error } = await supabase
        .from("properties")
        .update({ 
          status,
          status_change_reason: reason
        })
        .eq("id", propertyId)
        .eq("agent_id", agentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      toast({
        title: "Property status updated successfully",
        description: "The property status has been updated.",
      });
      setStatusChangeProperty(null);
      setStatusChangeReason("");
    },
    onError: (error) => {
      toast({
        title: "Failed to update property status",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (newStatus: PropertyStatus) => {
    setStatusChangeProperty({ id: propertyId, newStatus });
  };

  const handleConfirmStatusChange = () => {
    if (!statusChangeProperty) return;
    
    updatePropertyStatusMutation.mutate({
      propertyId: statusChangeProperty.id,
      status: statusChangeProperty.newStatus,
      reason: statusChangeReason,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: "bg-green-100 text-green-800",
      rented: "bg-blue-100 text-blue-800",
      sold: "bg-purple-100 text-purple-800",
      leased: "bg-orange-100 text-orange-800"
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'rented':
        return <Key className="h-4 w-4" />;
      case 'sold':
        return <DollarSign className="h-4 w-4" />;
      case 'leased':
        return <Home className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const canChangeStatus = currentStatus === 'approved';

  return (
    <>
      <div className="flex items-center gap-2">
        {getStatusBadge(currentStatus)}
        
        {canChangeStatus && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                Update Status
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => handleStatusChange('rented')}
                className="text-blue-600"
              >
                <Key className="mr-2 h-4 w-4" />
                Mark as Rented
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleStatusChange('sold')}
                className="text-purple-600"
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Mark as Sold
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleStatusChange('leased')}
                className="text-orange-600"
              >
                <Home className="mr-2 h-4 w-4" />
                Mark as Leased
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <AlertDialog 
        open={!!statusChangeProperty} 
        onOpenChange={() => setStatusChangeProperty(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Mark Property as {statusChangeProperty?.newStatus}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for this status change. This will help track the property's history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason for Status Change</label>
            <Textarea
              placeholder={`e.g., Property ${statusChangeProperty?.newStatus} to client on [date], transaction completed...`}
              value={statusChangeReason}
              onChange={(e) => setStatusChangeReason(e.target.value)}
              className="w-full"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setStatusChangeProperty(null);
              setStatusChangeReason("");
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmStatusChange} 
              disabled={!statusChangeReason.trim()}
              className={
                statusChangeProperty?.newStatus === 'sold' 
                  ? "bg-purple-600 hover:bg-purple-700"
                  : statusChangeProperty?.newStatus === 'rented'
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-orange-600 hover:bg-orange-700"
              }
            >
              {getStatusIcon(statusChangeProperty?.newStatus || '')}
              <span className="ml-2">
                Mark as {statusChangeProperty?.newStatus}
              </span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AgentPropertyStatusControl;
