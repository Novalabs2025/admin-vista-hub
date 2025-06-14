
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tables } from "@/integrations/supabase/types";
import { DollarSign, Home, Bed, Bath, Square } from "lucide-react";

type Property = Tables<'properties'>;

interface PropertyDetailsModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
}

const PropertyDetailsModal = ({ property, isOpen, onClose }: PropertyDetailsModalProps) => {
  if (!property) return null;

  const images = Array.isArray(property.image_urls) ? property.image_urls : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{property.address}</DialogTitle>
          <DialogDescription>
            {property.city}, {property.state} {property.zip_code}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
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
                <span className="font-semibold">Price:</span> ${property.price.toLocaleString()}
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyDetailsModal;
