import { Navbar } from "@/components/layout/Navbar";
import { useListProperties } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/format";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function Properties() {
  const { data: properties, isLoading } = useListProperties();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Available Properties</h1>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse h-64 bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties?.map((property) => (
              <Link key={property.id} href={`/properties/${property.id}`}>
                <Card className="hover-elevate cursor-pointer overflow-hidden transition-all">
                  <div className="h-48 bg-muted relative">
                    {property.photos?.[0] ? (
                      <img src={property.photos[0]} alt={property.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant={property.status === "available" ? "default" : "secondary"}>
                        {property.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-start">
                      <span>{property.name}</span>
                      <span className="text-primary font-bold">
                        {property.purpose === "rent" ? `${formatINR(property.rentPrice)}/mo` : formatINR(property.salePriceINR)}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p className="capitalize">{property.type} {property.bhk ? `• ${property.bhk} BHK` : ''}</p>
                      <p>{property.sizeSqft} sq.ft. • Floor {property.floor || 'G'}</p>
                      <p className="truncate">{property.locality}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
