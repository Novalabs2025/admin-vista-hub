
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Eye } from "lucide-react";
import { checkImageDuplicates, generateImageHash, DuplicateImage } from "@/utils/imageDuplicateDetection";

interface ImageDuplicateCheckerProps {
  imageFiles: File[];
  agentId: string;
  onDuplicatesFound: (duplicates: DuplicateImage[]) => void;
}

const ImageDuplicateChecker = ({ imageFiles, agentId, onDuplicatesFound }: ImageDuplicateCheckerProps) => {
  const [duplicates, setDuplicates] = useState<DuplicateImage[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const checkForDuplicates = async () => {
      if (!imageFiles.length || !agentId) return;

      setIsChecking(true);
      const allDuplicates: DuplicateImage[] = [];

      try {
        for (const file of imageFiles) {
          const hash = await generateImageHash(file);
          const fileDuplicates = await checkImageDuplicates(hash, agentId);
          allDuplicates.push(...fileDuplicates);
        }

        setDuplicates(allDuplicates);
        onDuplicatesFound(allDuplicates);
      } catch (error) {
        console.error('Error checking for duplicates:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkForDuplicates();
  }, [imageFiles, agentId, onDuplicatesFound]);

  if (isChecking) {
    return (
      <Alert>
        <Eye className="h-4 w-4" />
        <AlertDescription>
          Checking for duplicate images...
        </AlertDescription>
      </Alert>
    );
  }

  if (duplicates.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <div className="font-medium">
            Potential duplicate images detected ({duplicates.length})
          </div>
          <div className="text-sm">
            Some of your images may have been used by other agents. Please review:
          </div>
          <div className="flex flex-wrap gap-2">
            {duplicates.map((duplicate, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                Property ID: {duplicate.property_id.slice(0, 8)}...
              </Badge>
            ))}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default ImageDuplicateChecker;
