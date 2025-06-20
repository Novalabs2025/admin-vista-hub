
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, ZoomIn, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PropertyImageGalleryProps {
  images: string[];
  propertyAddress: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function PropertyImageGallery({
  images,
  propertyAddress,
  isOpen,
  onClose
}: PropertyImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleImageError = (index: number) => {
    setImageError(prev => ({ ...prev, [index]: true }));
  };

  if (!images.length) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Property Images</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <ImageIcon className="h-16 w-16 mb-4" />
            <p className="text-lg font-medium">No images available</p>
            <p className="text-sm">This property doesn't have any images uploaded.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <span>Property Images - {propertyAddress}</span>
            <Badge variant="secondary">
              {currentIndex + 1} of {images.length}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative flex-1 min-h-[60vh]">
          {/* Main Image */}
          <div className="relative h-[60vh] bg-black flex items-center justify-center">
            {imageError[currentIndex] ? (
              <div className="flex flex-col items-center gap-2 text-white">
                <ImageIcon className="h-16 w-16" />
                <p>Failed to load image</p>
              </div>
            ) : (
              <img
                src={images[currentIndex]}
                alt={`Property image ${currentIndex + 1}`}
                className="max-w-full max-h-full object-contain"
                onError={() => handleImageError(currentIndex)}
              />
            )}
            
            {/* Navigation buttons */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
          
          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="p-4 bg-gray-50 border-t">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <div
                    key={index}
                    className={`relative flex-shrink-0 cursor-pointer rounded overflow-hidden border-2 transition-all ${
                      index === currentIndex 
                        ? 'border-blue-500 scale-105' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setCurrentIndex(index)}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-16 h-16 object-cover"
                      onError={() => handleImageError(index)}
                    />
                    {imageError[index] && (
                      <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
