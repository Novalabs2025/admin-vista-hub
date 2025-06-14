
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
import { View } from "lucide-react";
import PropertyDetailsModal from "./PropertyDetailsModal";

type Property = Tables<'properties'>;

interface PropertiesTableProps {
  properties: Property[];
}

const PropertiesTable = ({ properties }: PropertiesTableProps) => {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
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
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedProperty(property)}
                      >
                        <View className="h-4 w-4" />
                        <span className="sr-only">View Property</span>
                      </Button>
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
    </>
  );
};

export default PropertiesTable;
