
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tables } from "@/integrations/supabase/types";
import { DollarSign, Home, Bed, Bath, Square, ShieldCheck, ShieldX, Hourglass, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

type Property = Tables<'properties'>;

interface PropertyDetailsModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
}

const PropertyDetailsModal = ({ property, isOpen, onClose }: PropertyDetailsModalProps) => {
  if (!property) return null;

  const images = Array.isArray(property.image_urls) ? property.image_urls : [];
  const statusHistory = Array.isArray(property.status_history) ? property.status_history : [];

  const getStatusIcon = () => {
    switch (property.status) {
      case 'approved':
        return <ShieldCheck className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <ShieldX className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Hourglass className="h-4 w-4 text-yellow-500" />;
      case 'rented':
        return <Home className="h-4 w-4 text-blue-500" />;
      case 'sold':
        return <Home className="h-4 w-4 text-purple-500" />;
      case 'leased':
        return <Home className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const formatStatusHistoryDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{property.address}</DialogTitle>
          <DialogDescription>
            {property.city}, {property.state} {property.zip_code}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Status:</span>
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
                            : property.status === "rented"
                            ? "bg-blue-100 text-blue-800"
                            : property.status === "sold"
                            ? "bg-purple-100 text-purple-800"
                            : property.status === "leased"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-red-100 text-red-800"
                        }
                >
                  {getStatusIcon()}
                  <span className="ml-1">{property.status}</span>
                </Badge>
              </div>
            {property.status === 'rejected' && property.rejection_reason && (
              <p className="text-sm text-red-600">
                <span className="font-semibold">Reason:</span> {property.rejection_reason}
              </p>
            )}
          </div>

          {images.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((imgUrl, index) => (
                typeof imgUrl === 'string' ? (
                  <div key={index} className="aspect-w-1 aspect-h-1">
                    <img
                      src={imgUrl}
                      alt={`Property image ${index + 1}`}
                      className="rounded-md object-cover w-full h-full"
                    />
                  </div>
                ) : null
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No images available for this property.</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>
                <span className="font-semibold">Price:</span> ₦{property.price.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-muted-foreground" />
              <span>
                <span className="font-semibold">Type:</span> {property.property_type}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Bed className="h-4 w-4 text-muted-foreground" />
              <span>
                <span className="font-semibold">Bedrooms:</span> {property.bedrooms}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Bath className="h-4 w-4 text-muted-foreground" />
              <span>
                <span className="font-semibold">Bathrooms:</span> {property.bathrooms}
              </span>
            </div>
            {property.area && (
              <div className="flex items-center gap-2">
                <Square className="h-4 w-4 text-muted-foreground" />
                <span>
                  <span className="font-semibold">Area:</span> {property.area} sqft
                </span>
              </div>
            )}
             <div className="flex items-center gap-2">
                <span className="font-semibold">Listing:</span> <Badge variant="secondary">{property.listing_type}</Badge>
              </div>
          </div>
          
          {property.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{property.description}</p>
            </div>
          )}

          {statusHistory.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Status History
                </h3>
                <div className="space-y-3">
                  {statusHistory.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-sm">
                          <span className="font-medium capitalize">{entry.from_status}</span>
                          <span className="mx-2">→</span>
                          <span className="font-medium capitalize">{entry.to_status}</span>
                        </div>
                        {entry.reason && (
                          <div className="text-xs text-muted-foreground">
                            {entry.reason}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatStatusHistoryDate(entry.changed_at)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyDetailsModal;
