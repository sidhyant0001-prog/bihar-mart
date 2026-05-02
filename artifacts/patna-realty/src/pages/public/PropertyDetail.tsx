import { useParams } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { useGetProperty } from "@workspace/api-client-react";
import { formatINR } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export default function PropertyDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { data: property, isLoading } = useGetProperty(id, { query: { enabled: !!id } });

  if (isLoading) {
    return <div className="min-h-screen bg-background flex flex-col"><Navbar /><main className="flex-1 p-8 text-center">Loading...</main></div>;
  }

  if (!property) {
    return <div className="min-h-screen bg-background flex flex-col"><Navbar /><main className="flex-1 p-8 text-center">Property not found.</main></div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <div className="aspect-video bg-muted rounded-xl overflow-hidden mb-4">
              {property.photos?.[0] ? (
                <img src={property.photos[0]} alt={property.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image Available</div>
              )}
            </div>
            {property.photos && property.photos.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {property.photos.slice(1).map((photo, i) => (
                  <div key={i} className="aspect-square bg-muted rounded-md overflow-hidden">
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{property.name}</h1>
                <p className="text-muted-foreground">{property.address}, {property.locality}</p>
              </div>
              <Badge className="text-lg px-3 py-1" variant={property.status === "available" ? "default" : "secondary"}>
                {property.status.replace('_', ' ')}
              </Badge>
            </div>

            <div className="text-3xl font-bold text-primary mb-8">
              {property.purpose === "rent" || property.purpose === "both" ? (
                <div>{formatINR(property.rentPrice)}<span className="text-lg text-muted-foreground font-normal">/{property.rentPeriod || 'mo'}</span></div>
              ) : null}
              {property.purpose === "sale" || property.purpose === "both" ? (
                <div>{formatINR(property.salePriceINR)}<span className="text-lg text-muted-foreground font-normal"> (Sale)</span></div>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Type</div>
                <div className="font-medium capitalize">{property.type}</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Size</div>
                <div className="font-medium">{property.sizeSqft} sq.ft.</div>
              </div>
              {property.bhk && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">BHK</div>
                  <div className="font-medium">{property.bhk} BHK</div>
                </div>
              )}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Floor</div>
                <div className="font-medium">{property.floor || 'Ground'}</div>
              </div>
            </div>

            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-line">{property.description || "No description provided."}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
