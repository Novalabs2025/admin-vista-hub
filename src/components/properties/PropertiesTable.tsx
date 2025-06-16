
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
import { View, MoreHorizontal, Check, X, Eye, Calendar, MapPin, TrendingUp, RotateCcw } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";

type Property = Tables<'properties'>;

interface PropertiesTableProps {
  properties: Property[];
}

const PropertiesTable = ({ properties }: PropertiesTableProps) => {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [rejectionProperty, setRejectionProperty] = useState<Property | null>(null);
  const [reactivateProperty, setReactivateProperty] = useState<Property | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [reactivationReason, setReactivationReason] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updatePropertyStatusMutation = useMutation({
    mutationFn: async ({
      propertyId,
      status,
      rejection_reason,
      status_change_reason,
    }: {
      propertyId: string;
      status: "approved" | "rejected" | "rented" | "sold" | "leased";
      rejection_reason?: string;
      status_change_reason?: string;
    }) => {
      const { error } = await supabase
        .from("properties")
        .update({ 
          status, 
          rejection_reason: rejection_reason || null,
          status_change_reason: status_change_reason || null
        })
        .eq("id", propertyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      toast({
        title: "Property status updated successfully.",
        description: "The property status has been updated.",
      });
      setRejectionProperty(null);
      setReactivateProperty(null);
      setRejectionReason("");
      setReactivationReason("");
    },
    onError: (error) => {
      toast({
        title: "Failed to update property status.",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const handleApprove = (propertyId: string) => {
    updatePropertyStatusMutation.mutate({ 
      propertyId, 
      status: "approved",
      status_change_reason: "Property approved by admin"
    });
  };

  const handleConfirmReject = () => {
    if (!rejectionProperty) return;
    updatePropertyStatusMutation.mutate({
      propertyId: rejectionProperty.id,
      status: "rejected",
      rejection_reason: rejectionReason,
      status_change_reason: `Property rejected: ${rejectionReason}`
    });
  };

  const handleConfirmReactivate = () => {
    if (!reactivateProperty) return;
    updatePropertyStatusMutation.mutate({
      propertyId: reactivateProperty.id,
      status: "approved",
      status_change_reason: `Property reactivated by admin: ${reactivationReason}`
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: "bg-green-100 text-green-800 border-green-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200", 
      rejected: "bg-red-100 text-red-800 border-red-200",
      rented: "bg-blue-100 text-blue-800 border-blue-200",
      sold: "bg-purple-100 text-purple-800 border-purple-200",
      leased: "bg-orange-100 text-orange-800 border-orange-200"
    };

    return (
      <Badge 
        variant="outline" 
        className={variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const canReactivate = (status: string) => {
    return ['rented', 'sold', 'leased'].includes(status);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Properties Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[250px]">Property Details</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Type & Features</TableHead>
                  <TableHead className="text-center">Views</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Listed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <MapPin className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-lg font-medium">No properties found</p>
                        <p className="text-sm text-muted-foreground">
                          Try adjusting your filters or add a new property
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  properties.map((property) => (
                    <TableRow key={property.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm leading-tight">{property.address}</div>
                          <div className="text-xs text-muted-foreground">
                            {property.property_type} • {property.listing_type}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{property.city}, {property.state}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="font-semibold">₦{property.price.toLocaleString()}</div>
                        {property.area && (
                          <div className="text-xs text-muted-foreground">
                            ₦{Math.round(Number(property.price) / property.area).toLocaleString()}/sqft
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex gap-2 text-xs">
                            {property.bedrooms && (
                              <span className="bg-muted px-2 py-1 rounded">{property.bedrooms} bed</span>
                            )}
                            {property.bathrooms && (
                              <span className="bg-muted px-2 py-1 rounded">{property.bathrooms} bath</span>
                            )}
                          </div>
                          {property.area && (
                            <div className="text-xs text-muted-foreground">{property.area} sqft</div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Eye className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-medium">{property.views}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {getStatusBadge(property.status)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{formatDate(property.created_at)}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setSelectedProperty(property)}>
                              <View className="mr-2 h-4 w-4" />
                              <span>View Details</span>
                            </DropdownMenuItem>
                            {property.status === "pending" && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => handleApprove(property.id)}
                                  className="text-green-600 focus:text-green-600"
                                >
                                  <Check className="mr-2 h-4 w-4" />
                                  <span>Approve</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => setRejectionProperty(property)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  <span>Reject</span>
                                </DropdownMenuItem>
                              </>
                            )}
                            {canReactivate(property.status) && (
                              <DropdownMenuItem 
                                onClick={() => setReactivateProperty(property)}
                                className="text-blue-600 focus:text-blue-600"
                              >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                <span>Make Available</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
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
            <AlertDialogTitle>Reject Property Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a clear reason for rejecting this property listing. This feedback will be 
              shared with the agent to help them improve future submissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Rejection Reason</label>
            <Input
              placeholder="e.g., Incomplete documentation, unclear images, pricing issues..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setRejectionProperty(null);
              setRejectionReason("");
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmReject} 
              disabled={!rejectionReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirm Rejection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!reactivateProperty} onOpenChange={() => setReactivateProperty(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Make Property Available Again</AlertDialogTitle>
            <AlertDialogDescription>
              This will change the property status from "{reactivateProperty?.status}" back to "approved", 
              making it available for viewing and inquiries again. Please provide a reason for this change.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason for Reactivation</label>
            <Textarea
              placeholder="e.g., Agent requested reactivation due to cancelled transaction, property back on market..."
              value={reactivationReason}
              onChange={(e) => setReactivationReason(e.target.value)}
              className="w-full"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setReactivateProperty(null);
              setReactivationReason("");
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmReactivate} 
              disabled={!reactivationReason.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Make Available
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PropertiesTable;
