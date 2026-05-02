import { useState, useMemo, useRef, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { useListProperties } from "@workspace/api-client-react";
import { formatINR } from "@/lib/format";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Grid3X3, Map, X, TrendingUp, Home, Store, Building2, ShoppingCart,
  ArrowRight, ChevronDown, SlidersHorizontal
} from "lucide-react";

type PropertyType = "flat" | "shop" | "grocery_store" | "market" | "";
type PropertyStatus = "available" | "occupied" | "for_sale" | "";
type PriceRange = "under10k" | "10kto20k" | "above20k" | "";

const STATUS_COLORS: Record<string, string> = {
  available: "bg-emerald-500 text-white",
  occupied: "bg-slate-500 text-white",
  for_sale: "bg-amber-500 text-white",
  under_maintenance: "bg-red-500 text-white",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  flat: <Home className="w-3.5 h-3.5" />,
  shop: <Store className="w-3.5 h-3.5" />,
  grocery_store: <ShoppingCart className="w-3.5 h-3.5" />,
  market: <Building2 className="w-3.5 h-3.5" />,
};

function StatBar({ total, occupied, avgRent, forSale, t }: {
  total: number; occupied: number; avgRent: number; forSale: number;
  t: ReturnType<typeof useLang>["t"];
}) {
  const occupiedPct = total > 0 ? Math.round((occupied / total) * 100) : 0;

  const stats = [
    { label: t.properties.stats.total, value: total, icon: <Building2 className="w-5 h-5" />, color: "text-blue-600" },
    { label: t.properties.stats.occupied, value: `${occupiedPct}%`, icon: <Home className="w-5 h-5" />, color: "text-emerald-600" },
    { label: t.properties.stats.avgRent, value: formatINR(avgRent), icon: <TrendingUp className="w-5 h-5" />, color: "text-primary" },
    { label: t.properties.stats.forSale, value: forSale, icon: <Store className="w-5 h-5" />, color: "text-amber-600" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      {stats.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.4 }}
          className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className={`${s.color} bg-current/10 rounded-xl p-2.5`} style={{ backgroundColor: "currentColor", opacity: 0.1 }}>
            <div className={s.color}>{s.icon}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="text-lg font-bold">{s.value}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function MapView({ properties, t }: { properties: ReturnType<typeof useListProperties>["data"]; t: ReturnType<typeof useLang>["t"] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || !properties) return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapRef.current) return;
      if (mapInstanceRef.current) return;

      const leaflet = L.default || L;
      (leaflet.Icon.Default as unknown as { mergeOptions: (opts: object) => void }).mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = leaflet.map(mapRef.current, { zoomControl: true });
      leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const center: [number, number] = [25.594095, 85.137566];
      map.setView(center, 14);

      const offsets: [number, number][] = [
        [0, 0], [0.002, 0.003], [-0.002, 0.002], [0.003, -0.002],
        [-0.001, -0.003], [0.001, 0.004], [-0.003, 0.001], [0.002, -0.004],
        [-0.002, -0.001], [0.004, 0.002],
      ];

      properties.forEach((p, i) => {
        const [latOff, lngOff] = offsets[i % offsets.length];
        const lat = center[0] + latOff;
        const lng = center[1] + lngOff;
        const marker = leaflet.marker([lat, lng]).addTo(map);
        const price = p.purpose === "sale" ? formatINR(p.salePriceINR) : `${formatINR(p.rentPrice)}/mo`;
        marker.bindPopup(
          `<div style="min-width:160px"><strong>${p.name}</strong><br/>${p.type} • ${price}<br/><a href="/properties/${p.id}" style="color:#c0603a;font-size:12px">View details →</a></div>`
        );
      });

      mapInstanceRef.current = map;
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [properties]);

  return (
    <div className="rounded-2xl overflow-hidden border border-border shadow-sm">
      <div className="bg-muted/40 px-4 py-3 flex items-center justify-between border-b">
        <div>
          <p className="font-semibold text-sm">{t.properties.mapTitle}</p>
          <p className="text-xs text-muted-foreground">{t.properties.mapNote}</p>
        </div>
        <Map className="w-5 h-5 text-muted-foreground" />
      </div>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} className="w-full" style={{ height: 500 }} />
    </div>
  );
}

function PropertyCard({ property, index, t }: {
  property: NonNullable<ReturnType<typeof useListProperties>["data"]>[0];
  index: number;
  t: ReturnType<typeof useLang>["t"];
}) {
  const P = t.properties.card;
  const isLarge = index % 5 === 0;

  const price = useMemo(() => {
    if (property.purpose === "sale") return formatINR(property.salePriceINR);
    if (property.purpose === "both") return `${formatINR(property.rentPrice)}${P.perMonth}`;
    return `${formatINR(property.rentPrice)}${P.perMonth}`;
  }, [property, P.perMonth]);

  const statusLabel = t.status[property.status as keyof typeof t.status] ?? property.status.replace("_", " ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      className={`group relative bg-white rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer ${isLarge ? "md:col-span-2 md:row-span-2" : ""}`}
    >
      <Link href={`/properties/${property.id}`}>
        <div className={`relative overflow-hidden bg-muted ${isLarge ? "h-72 md:h-80" : "h-52"}`}>
          {property.photos?.[0] ? (
            <img
              src={property.photos[0]}
              alt={property.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-muted to-muted/50">
              {TYPE_ICONS[property.type]}
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm ${STATUS_COLORS[property.status] || "bg-gray-500 text-white"}`}>
              {statusLabel}
            </span>
            {property.status === "available" && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/90 text-white backdrop-blur-sm">
                ✦ Featured
              </span>
            )}
          </div>

          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white font-bold text-lg leading-tight drop-shadow">{property.name}</p>
                <p className="text-white/80 text-xs mt-0.5 flex items-center gap-1">
                  {TYPE_ICONS[property.type]}
                  <span className="capitalize">{t.types[property.type as keyof typeof t.types] ?? property.type}</span>
                  {property.bhk && <span>• {property.bhk} {P.bhk}</span>}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-base drop-shadow">{price}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span>{property.sizeSqft} {P.sqft}</span>
            <span>•</span>
            <span>{P.floor} {property.floor ?? "G"}</span>
            {property.locality && (
              <>
                <span>•</span>
                <span className="truncate max-w-[100px]">{property.locality}</span>
              </>
            )}
          </div>
          <span className="text-primary text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
            {P.viewDetails} <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export default function Properties() {
  const { data: properties, isLoading } = useListProperties();
  const { t } = useLang();
  const F = t.properties.filters;

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<PropertyType>("");
  const [statusFilter, setStatusFilter] = useState<PropertyStatus>("");
  const [priceFilter, setPriceFilter] = useState<PriceRange>("");
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    if (!properties) return [];
    return properties.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
        !p.locality?.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter && p.type !== typeFilter) return false;
      if (statusFilter) {
        if (statusFilter === "for_sale" && p.purpose !== "sale") return false;
        if (statusFilter === "available" && p.status !== "available") return false;
        if (statusFilter === "occupied" && p.status !== "occupied") return false;
      }
      if (priceFilter) {
        const rent = p.rentPrice ?? 0;
        if (priceFilter === "under10k" && rent >= 10000) return false;
        if (priceFilter === "10kto20k" && (rent < 10000 || rent > 20000)) return false;
        if (priceFilter === "above20k" && rent <= 20000) return false;
      }
      return true;
    });
  }, [properties, search, typeFilter, statusFilter, priceFilter]);

  const stats = useMemo(() => {
    if (!properties) return { total: 0, occupied: 0, avgRent: 0, forSale: 0 };
    const rents = properties.filter((p) => p.rentPrice).map((p) => p.rentPrice!);
    return {
      total: properties.length,
      occupied: properties.filter((p) => p.status === "occupied").length,
      avgRent: rents.length ? Math.round(rents.reduce((a, b) => a + b, 0) / rents.length) : 0,
      forSale: properties.filter((p) => p.purpose === "sale" || p.purpose === "both").length,
    };
  }, [properties]);

  const hasFilters = search || typeFilter || statusFilter || priceFilter;

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("");
    setStatusFilter("");
    setPriceFilter("");
  };

  const typeOptions: { value: PropertyType; label: string }[] = [
    { value: "", label: F.allTypes },
    { value: "flat", label: F.flat },
    { value: "shop", label: F.shop },
    { value: "grocery_store", label: F.grocery },
    { value: "market", label: F.market },
  ];

  const statusOptions: { value: PropertyStatus; label: string }[] = [
    { value: "", label: F.allStatus },
    { value: "available", label: F.available },
    { value: "occupied", label: F.occupied },
    { value: "for_sale", label: F.forSale },
  ];

  const priceOptions: { value: PriceRange; label: string }[] = [
    { value: "", label: F.allPrices },
    { value: "under10k", label: F.under10k },
    { value: "10kto20k", label: F.range10to20k },
    { value: "above20k", label: F.above20k },
  ];

  return (
    <div className="min-h-screen bg-[#f8f6f3] flex flex-col">
      <Navbar />

      <div className="bg-white border-b border-border sticky top-16 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9 h-9 rounded-full bg-muted/40 border-0 focus-visible:ring-1"
                placeholder={F.search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 text-sm px-3 h-9 rounded-full border transition-colors ${showFilters ? "bg-primary text-white border-primary" : "bg-white border-border hover:bg-muted"}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {hasFilters && <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>

            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 h-9">
                <X className="w-3.5 h-3.5" /> {F.clearFilters}
              </button>
            )}

            <div className="ml-auto flex bg-muted rounded-full p-1 gap-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all ${viewMode === "grid" ? "bg-white shadow text-foreground font-medium" : "text-muted-foreground"}`}
              >
                <Grid3X3 className="w-3.5 h-3.5" /> {F.gridView}
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all ${viewMode === "map" ? "bg-white shadow text-foreground font-medium" : "text-muted-foreground"}`}
              >
                <Map className="w-3.5 h-3.5" /> {F.mapView}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 pt-3 pb-1">
                  <div className="flex gap-1.5 flex-wrap">
                    {typeOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setTypeFilter(opt.value)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${typeFilter === opt.value ? "bg-primary text-white border-primary" : "bg-white border-border hover:border-primary/50"}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="w-px bg-border self-stretch mx-1" />
                  <div className="flex gap-1.5 flex-wrap">
                    {statusOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setStatusFilter(opt.value)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${statusFilter === opt.value ? "bg-primary text-white border-primary" : "bg-white border-border hover:border-primary/50"}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="w-px bg-border self-stretch mx-1" />
                  <div className="flex gap-1.5 flex-wrap">
                    {priceOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setPriceFilter(opt.value)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${priceFilter === opt.value ? "bg-primary text-white border-primary" : "bg-white border-border hover:border-primary/50"}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold">{t.properties.title}</h1>
          <p className="text-muted-foreground mt-1">{t.properties.subtitle}</p>
        </motion.div>

        {!isLoading && properties && (
          <StatBar {...stats} t={t} />
        )}

        {viewMode === "map" ? (
          <AnimatePresence>
            <motion.div
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <MapView properties={filtered} t={t} />
            </motion.div>
          </AnimatePresence>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key="grid">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="animate-pulse bg-white rounded-2xl h-72 border border-border" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 text-muted-foreground"
                >
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-lg font-medium">{t.properties.noResults}</p>
                  {hasFilters && (
                    <button onClick={clearFilters} className="mt-3 text-primary text-sm underline">
                      {F.clearFilters}
                    </button>
                  )}
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-auto">
                  {filtered.map((p, i) => (
                    <PropertyCard key={p.id} property={p} index={i} t={t} />
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
