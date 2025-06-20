
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Download, FileText, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DocumentViewerProps {
  name: string;
  url: string | null;
  status: 'verified' | 'missing' | 'pending';
}

export default function DocumentViewer({ name, url, status }: DocumentViewerProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const getStatusColor = () => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'missing':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  if (!url) {
    return (
      <div className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600">{name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor()}>
            {status}
          </Badge>
          <span className="text-xs text-gray-500">Not uploaded</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium">{name}</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge className={getStatusColor()}>
          {status}
        </Badge>
        <div className="flex gap-1">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 px-2">
                <Eye className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {name}
                </DialogTitle>
              </DialogHeader>
              <div className="flex justify-center items-center min-h-[400px] bg-gray-50 rounded-lg relative">
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Skeleton className="w-full h-full" />
                  </div>
                )}
                {imageError ? (
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <AlertCircle className="h-12 w-12" />
                    <p>Failed to load document</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(url, '_blank')}
                    >
                      Open in new tab
                    </Button>
                  </div>
                ) : (
                  <img
                    src={url}
                    alt={name}
                    className="max-w-full max-h-[70vh] object-contain rounded"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    style={{ display: imageLoading ? 'none' : 'block' }}
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2"
            onClick={() => window.open(url, '_blank')}
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
