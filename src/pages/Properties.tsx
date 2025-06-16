import Header from "@/components/dashboard/Header";
import PropertiesTable from "@/components/properties/PropertiesTable";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Plus, Home, DollarSign, MapPin, Eye } from "lucide-react";
import { useState, useMemo } from "react";
import { useAgentNames } from "@/hooks/useAgentNames";

const fetchProperties = async () => {
  const { data, error } = await supabase.from("properties").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

const Properties = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  const { data: properties, isLoading, error } = useQuery({
    queryKey: ["properties"],
    queryFn: fetchProperties,
  });

  const { data: agentNames } = useAgentNames();

  const filteredAndSortedProperties = useMemo(() => {
    if (!properties) return [];

    let filtered = properties.filter((property) => {
      const matchesSearch = 
        property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.state.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || property.status === statusFilter;
      const matchesType = typeFilter === "all" || property.property_type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });

    // Sort properties
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "price-high":
          return Number(b.price) - Number(a.price);
        case "price-low":
          return Number(a.price) - Number(b.price);
        case "views":
          return b.views - a.views;
        default:
          return 0;
      }
    });

    return filtered;
  }, [properties, searchTerm, statusFilter, typeFilter, sortBy]);

  const stats = useMemo(() => {
    if (!properties) return { 
      total: 0, approved: 0, pending: 0, rejected: 0, rented: 0, sold: 0, leased: 0,
      totalValue: 0, avgPrice: 0, topAgents: []
    };
    
    const total = properties.length;
    const approved = properties.filter(p => p.status === "approved").length;
    const pending = properties.filter(p => p.status === "pending").length;
    const rejected = properties.filter(p => p.status === "rejected").length;
    const rented = properties.filter(p => p.status === "rented").length;
    const sold = properties.filter(p => p.status === "sold").length;
    const leased = properties.filter(p => p.status === "leased").length;
    const totalValue = properties.reduce((sum, p) => sum + Number(p.price), 0);
    const avgPrice = total > 0 ? totalValue / total : 0;

    // Calculate top agents by property count
    const agentCounts: Record<string, number> = {};
    properties.forEach(p => {
      if (p.agent_id) {
        agentCounts[p.agent_id] = (agentCounts[p.agent_id] || 0) + 1;
      }
    });

    const topAgents = Object.entries(agentCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([agentId, count]) => ({
        id: agentId,
        name: agentNames?.[agentId] || `Agent ${agentId.slice(0, 8)}`,
        count
      }));

    return { total, approved, pending, rejected, rented, sold, leased, totalValue, avgPrice, topAgents };
  }, [properties, agentNames]);

  return (
    <div className="flex flex-col flex-1 h-full">
      <Header />
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
            <p className="text-muted-foreground">
              Manage and monitor all property listings
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Property
          </Button>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="flex gap-1 mt-1">
                <Badge variant="secondary" className="text-xs">{stats.approved} active</Badge>
                <Badge variant="outline" className="text-xs">{stats.rented + stats.sold + stats.leased} sold/rented</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{(stats.totalValue / 1000000).toFixed(1)}M</div>
              <p className="text-xs text-muted-foreground">
                Avg: ₦{(stats.avgPrice / 1000000).toFixed(1)}M
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status Overview</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% active
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Pending:</span>
                  <span className="font-medium">{stats.pending}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Sold/Rented:</span>
                  <span className="font-medium">{stats.sold + stats.rented + stats.leased}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Agents</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {stats.topAgents.slice(0, 2).map((agent, index) => (
                  <div key={agent.id} className="flex justify-between text-sm">
                    <span className="truncate">{agent.name}</span>
                    <span className="font-medium">{agent.count}</span>
                  </div>
                ))}
                {stats.topAgents.length === 0 && (
                  <p className="text-xs text-muted-foreground">No agents yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by address, city, or state..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="rented">Rented</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="leased">Leased</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Apartment">Apartment</SelectItem>
                  <SelectItem value="House">House</SelectItem>
                  <SelectItem value="Condo">Condo</SelectItem>
                  <SelectItem value="Townhouse">Townhouse</SelectItem>
                  <SelectItem value="Land">Land</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="views">Most Viewed</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {filteredAndSortedProperties.length} of {stats.total} properties
                </span>
                {(searchTerm || statusFilter !== "all" || typeFilter !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setTypeFilter("all");
                      setSortBy("newest");
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Properties Table */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <div className="text-center text-red-500">
                <p className="font-medium">Error fetching properties</p>
                <p className="text-sm">{(error as Error).message}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <PropertiesTable properties={filteredAndSortedProperties} />
        )}
      </main>
    </div>
  );
};

export default Properties;
