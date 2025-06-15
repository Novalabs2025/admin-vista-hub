
import { useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { View, MoreHorizontal, Check, X } from "lucide-react";
import PropertyDetailsModal from "./PropertyDetailsModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
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
import { Input } from "@/components/ui/input";

type Property = Tables<'properties'>;

interface PropertiesTableProps {
  properties: Property[];
}

const PropertiesTable = ({ properties }: PropertiesTableProps) => {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [rejectionProperty, setRejectionProperty] = useState<Property | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updatePropertyStatusMutation = useMutation({
    mutationFn: async ({
      propertyId,
      status,
      rejection_reason,
    }: {
      propertyId: string;
      status: "approved" | "rejected";
      rejection_reason?: string;
    }) => {
      const { error } = await supabase
        .from("properties")
        .update({ status, rejection_reason: rejection_reason || null })
        .eq("id", propertyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      toast({
        title: "Property status updated.",
      });
      setRejectionProperty(null);
      setRejectionReason("");
    },
    onError: (error) => {
      toast({
        title: "Error updating property status.",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const handleApprove = (propertyId: string) => {
    updatePropertyStatusMutation.mutate({ propertyId, status: "approved" });
  };

  const handleConfirmReject = () => {
    if (!rejectionProperty) return;
    updatePropertyStatusMutation.mutate({
      propertyId: rejectionProperty.id,
      status: "rejected",
      rejection_reason: rejectionReason,
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Address</TableHead>
                <TableHead>City</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Bedrooms</TableHead>
                <TableHead>Bathrooms</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">
                    No properties found.
                  </TableCell>
                </TableRow>
              ) : (
                properties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">{property.address}</TableCell>
                    <TableCell>{property.city}</TableCell>
                    <TableCell>{property.state}</TableCell>
                    <TableCell>${property.price.toLocaleString()}</TableCell>
                    <TableCell>{property.property_type}</TableCell>
                    <TableCell className="text-center">{property.bedrooms}</TableCell>
                    <TableCell className="text-center">{property.bathrooms}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          property.status === "approved"
                            ? "default"
                            : property.status === "pending"
                            ? "secondary"
                            : "destructive"
                        }
                        className={
                          property.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : property.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {property.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedProperty(property)}>
                            <View className="mr-2 h-4 w-4" />
                            <span>View Details</span>
                          </DropdownMenuItem>
                          {property.status === "pending" && (
                            <>
                              <DropdownMenuItem onClick={() => handleApprove(property.id)}>
                                <Check className="mr-2 h-4 w-4" />
                                <span>Approve</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setRejectionProperty(property)}>
                                <X className="mr-2 h-4 w-4" />
                                <span>Reject</span>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <PropertyDetailsModal
        property={selectedProperty}
        isOpen={!!selectedProperty}
        onClose={() => setSelectedProperty(null)}
      />
      <AlertDialog open={!!rejectionProperty} onOpenChange={() => setRejectionProperty(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Property</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this property listing. This will be visible to
              the agent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            placeholder="Rejection reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectionProperty(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReject} disabled={!rejectionReason}>
              Confirm Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PropertiesTable;
