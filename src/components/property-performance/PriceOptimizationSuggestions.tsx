
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const PriceOptimizationSuggestions = () => {
  const { data: optimizationData, isLoading } = useQuery({
    queryKey: ["priceOptimization"],
    queryFn: async () => {
      const [properties, suggestions, marketData] = await Promise.all([
        supabase
          .from("properties")
          .select(`
            *,
            property_performance (*)
          `)
          .eq("status", "approved"),
        supabase
          .from("price_suggestions")
          .select("*")
          .eq("is_active", true),
        supabase
          .from("market_data")
          .select("*")
      ]);

      if (properties.error) throw properties.error;
      if (suggestions.error) throw suggestions.error;
      if (marketData.error) throw marketData.error;

      // Combine data and generate insights
      const propertyInsights = properties.data?.map(property => {
        const suggestion = suggestions.data?.find(s => s.property_id === property.id);
        const performance = property.property_performance?.[0];
        const marketMatch = marketData.data?.find(
          market => market.location.toLowerCase().includes(`${property.city}, ${property.state}`.toLowerCase())
        );

        // Calculate optimization score
        const currentPrice = Number(property.price);
        const suggestedPrice = suggestion?.suggested_price || currentPrice;
        const marketPrice = marketMatch?.avg_price || currentPrice;
        
        const priceVsMarket = ((currentPrice - marketPrice) / marketPrice) * 100;
        const views = performance?.total_views || 0;
        const inquiries = performance?.inquiry_count || 0;
        const conversionRate = views > 0 ? (inquiries / views) * 100 : 0;

        // Generate recommendation
        let recommendation = "Optimally Priced";
        let action = "maintain";
        let confidence = 85;
        
        if (priceVsMarket > 15 && conversionRate < 2) {
          recommendation = "Consider Price Reduction";
          action = "reduce";
          confidence = Math.max(60, 100 - Math.abs(priceVsMarket));
        } else if (priceVsMarket < -10 && conversionRate > 5) {
          recommendation = "Potential for Price Increase";
          action = "increase";
          confidence = Math.min(90, 70 + conversionRate * 2);
        } else if (views < 50) {
          recommendation = "Improve Marketing";
          action = "market";
          confidence = 75;
        }

        return {
          ...property,
          suggestion,
          performance,
          marketMatch,
          currentPrice,
          suggestedPrice,
          marketPrice,
          priceVsMarket,
          conversionRate,
          recommendation,
          action,
          confidence,
          daysOnMarket: Math.floor((new Date().getTime() - new Date(property.created_at).getTime()) / (1000 * 60 * 60 * 24)),
          expectedDaysToSell: suggestion?.expected_days_to_sell || null
        };
      }) || [];

      return propertyInsights;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "reduce":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "increase":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "market":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "reduce":
        return "destructive";
      case "increase":
        return "default";
      case "market":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {optimizationData?.map((property) => (
          <Card key={property.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{property.address}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {property.city}, {property.state} • {property.property_type}
                  </p>
                </div>
                <Badge variant={getActionColor(property.action) as any}>
                  {getActionIcon(property.action)}
                  <span className="ml-1">{property.recommendation}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Pricing Analysis</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Current Price:</span>
                        <span className="font-medium">₦{property.currentPrice.toLocaleString()}</span>
                      </div>
                      {property.suggestedPrice !== property.currentPrice && (
                        <div className="flex justify-between text-sm">
                          <span>Suggested Price:</span>
                          <span className="font-medium text-primary">₦{property.suggestedPrice.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span>Market Average:</span>
                        <span className="font-medium">₦{property.marketPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>vs Market:</span>
                        <span className={`font-medium ${property.priceVsMarket > 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {property.priceVsMarket > 0 ? '+' : ''}{property.priceVsMarket.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Performance Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Views:</span>
                        <span className="font-medium">{property.performance?.total_views || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Inquiries:</span>
                        <span className="font-medium">{property.performance?.inquiry_count || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Conversion Rate:</span>
                        <span className="font-medium">{property.conversionRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Days on Market:</span>
                        <span className="font-medium">{property.daysOnMarket}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Optimization Score</h4>
                    <div className="space-y-2">
                      <Progress value={property.confidence} className="w-full" />
                      <div className="flex justify-between text-sm">
                        <span>Confidence:</span>
                        <span className="font-medium">{property.confidence}%</span>
                      </div>
                      {property.expectedDaysToSell && (
                        <div className="flex justify-between text-sm">
                          <span>Est. Days to Sell:</span>
                          <span className="font-medium">{property.expectedDaysToSell} days</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Button size="sm" className="w-full">
                      Apply Suggestion
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </div>
                </div>
              </div>

              {property.suggestion?.reasoning && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <h5 className="font-medium text-sm mb-1">AI Reasoning:</h5>
                  <p className="text-sm text-muted-foreground">
                    {JSON.stringify(property.suggestion.reasoning)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {optimizationData?.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No properties available for optimization analysis.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PriceOptimizationSuggestions;
