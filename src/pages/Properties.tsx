
import Header from "@/components/dashboard/Header";
import PropertiesTable from "@/components/properties/PropertiesTable";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

const fetchProperties = async () => {
  const { data, error } = await supabase.from("properties").select("*");
  if (error) throw new Error(error.message);
  return data;
};

const Properties = () => {
  const { data: properties, isLoading, error } = useQuery({
    queryKey: ["properties"],
    queryFn: fetchProperties,
  });

  return (
    <div className="flex flex-col flex-1 h-full">
      <Header />
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <div className="text-red-500">Error fetching properties: {(error as Error).message}</div>
        ) : (
          <PropertiesTable properties={properties || []} />
        )}
      </main>
    </div>
  );
};

export default Properties;
