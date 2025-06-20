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
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  Check, 
  X, 
  MoreHorizontal, 
  MapPin, 
  Calendar, 
  TrendingUp,
  Images,
  RotateCcw
} from "lucide-react";
import PropertyDetailsModal from "./PropertyDetailsModal";
import PropertyImageGallery from "./PropertyImageGallery";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface EnhancedPropertiesTableProps {
  properties: Property[];
}

export default function EnhancedPropertiesTable({ properties }: EnhancedPropertiesTableProps) {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [imageGalleryProperty, setImageGalleryProperty] = useState<Property | null>(null);
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
      console.log('Updating property status:', { propertyId, status, rejection_reason, status_change_reason });
      
      const updateData: any = { 
        status, 
        updated_at: new Date().toISOString()
      };
      
      if (rejection_reason) {
        updateData.rejection_reason = rejection_reason;
      }
      
      if (status_change_reason) {
        updateData.status_change_reason = status_change_reason;
      }
      
      const { data, error } = await supabase
        .from("properties")
        .update(updateData)
        .eq("id", propertyId)
        .select()
        .single();
        
      if (error) {
        console.error('Property update error:', error);
        throw error;
      }
      
      console.log('Property updated successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Property status update successful:', data);
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      toast({
        title: "Success",
        description: `Property ${data.status} successfully.`,
      });
      setRejectionProperty(null);
      setReactivateProperty(null);
      setRejectionReason("");
      setReactivationReason("");
    },
    onError: (error) => {
      console.error('Property status update failed:', error);
      toast({
        title: "Error",
        description: "Failed to update property status: " + (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const handleApprove = async (propertyId: string) => {
    console.log('Approving property:', propertyId);
    try {
      await updatePropertyStatusMutation.mutateAsync({ 
        propertyId, 
        status: "approved",
        status_change_reason: "Property approved by admin"
      });
    } catch (error) {
      console.error('Failed to approve property:', error);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectionProperty) return;
    console.log('Rejecting property:', rejectionProperty.id);
    try {
      await updatePropertyStatusMutation.mutateAsync({
        propertyId: rejectionProperty.id,
        status: "rejected",
        rejection_reason: rejectionReason,
        status_change_reason: `Property rejected: ${rejectionReason}`
      });
    } catch (error) {
      console.error('Failed to reject property:', error);
    }
  };

  const handleConfirmReactivate = async () => {
    if (!reactivateProperty) return;
    console.log('Reactivating property:', reactivateProperty.id);
    try {
      await updatePropertyStatusMutation.mutateAsync({
        propertyId: reactivateProperty.id,
        status: "approved",
        status_change_reason: `Property reactivated by admin: ${reactivationReason}`
      });
    } catch (error) {
      console.error('Failed to reactivate property:', error);
    }
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
      <Badge variant="outline" className={variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
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

  const getPropertyImages = (property: Property): string[] => {
    if (!property.image_urls) return [];
    if (Array.isArray(property.image_urls)) {
      return property.image_urls.filter((url): url is string => typeof url === 'string');
    }
    return [];
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Properties Management
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[280px]">Property Details</TableHead>
                  <TableHead className="w-[200px]">Location</TableHead>
                  <TableHead className="text-right w-[120px]">Price</TableHead>
                  <TableHead className="w-[150px]">Features</TableHead>
                  <TableHead className="text-center w-[80px]">Images</TableHead>
                  <TableHead className="text-center w-[80px]">Views</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead className="text-right w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <MapPin className="h-16 w-16 text-gray-300" />
                        <p className="text-lg font-medium text-gray-500">No properties found</p>
                        <p className="text-sm text-gray-400">Properties will appear here once submitted by agents</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  properties.map((property) => {
                    const images = getPropertyImages(property);
                    return (
                      <TableRow key={property.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="space-y-1 max-w-[260px]">
                            <div className="font-medium text-sm leading-tight truncate" title={property.address}>
                              {property.address}
                            </div>
                            <div className="flex gap-1 text-xs">
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                {property.property_type}
                              </Badge>
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                {property.listing_type}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-1 max-w-[180px]">
                            <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate" title={`${property.city}, ${property.state}`}>
                              {property.city}, {property.state}
                            </span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-right">
                          <div className="font-semibold text-sm">₦{property.price.toLocaleString()}</div>
                          {property.area && (
                            <div className="text-xs text-muted-foreground">
                              ₦{Math.round(Number(property.price) / property.area).toLocaleString()}/sqft
                            </div>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {property.bedrooms && (
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                {property.bedrooms}bed
                              </Badge>
                            )}
                            {property.bathrooms && (
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                {property.bathrooms}bath
                              </Badge>
                            )}
                            {property.area && (
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                {property.area}sqft
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          {images.length > 0 ? (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => setImageGalleryProperty(property)}
                            >
                              <Images className="h-4 w-4 text-blue-600" />
                              <span className="sr-only">View {images.length} images</span>
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-400">No images</span>
                          )}
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
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {images.length > 0 && (
                                <DropdownMenuItem onClick={() => setImageGalleryProperty(property)}>
                                  <Images className="mr-2 h-4 w-4" />
                                  View Images ({images.length})
                                </DropdownMenuItem>
                              )}
                              {property.status === "pending" && (
                                <>
                                  <DropdownMenuItem 
                                    onClick={() => handleApprove(property.id)}
                                    className="text-green-600 focus:text-green-600"
                                    disabled={updatePropertyStatusMutation.isPending}
                                  >
                                    <Check className="mr-2 h-4 w-4" />
                                    {updatePropertyStatusMutation.isPending ? 'Approving...' : 'Approve'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => setRejectionProperty(property)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              {canReactivate(property.status) && (
                                <DropdownMenuItem 
                                  onClick={() => setReactivateProperty(property)}
                                  className="text-blue-600 focus:text-blue-600"
                                >
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Make Available
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Property Details Modal */}
      <PropertyDetailsModal
        property={selectedProperty}
        isOpen={!!selectedProperty}
        onClose={() => setSelectedProperty(null)}
      />

      {/* Image Gallery Modal */}
      <PropertyImageGallery
        images={imageGalleryProperty ? getPropertyImages(imageGalleryProperty) : []}
        propertyAddress={imageGalleryProperty?.address || ''}
        isOpen={!!imageGalleryProperty}
        onClose={() => setImageGalleryProperty(null)}
      />

      {/* Rejection Dialog */}
      <AlertDialog open={!!rejectionProperty} onOpenChange={() => setRejectionProperty(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Property Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a clear reason for rejecting this property listing. This feedback will help the agent improve future submissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Rejection Reason</label>
              <Input
                placeholder="e.g., Incomplete documentation, unclear images..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-1"
              />
            </div>
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
              disabled={!rejectionReason.trim() || updatePropertyStatusMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {updatePropertyStatusMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reactivation Dialog */}
      <AlertDialog open={!!reactivateProperty} onOpenChange={() => setReactivateProperty(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Make Property Available Again</AlertDialogTitle>
            <AlertDialogDescription>
              This will change the property status from "{reactivateProperty?.status}" back to "approved". Please provide a reason for this change.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Reason for Reactivation</label>
              <Textarea
                placeholder="e.g., Agent requested reactivation due to cancelled transaction..."
                value={reactivationReason}
                onChange={(e) => setReactivationReason(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
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
              disabled={!reactivationReason.trim() || updatePropertyStatusMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updatePropertyStatusMutation.isPending ? 'Reactivating...' : 'Make Available'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
