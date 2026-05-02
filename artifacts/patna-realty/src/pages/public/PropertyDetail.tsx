import { useState } from "react";
import { useParams } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { useGetProperty, useCreateInquiry } from "@workspace/api-client-react";
import { formatINR } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/lib/i18n";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-800 border-emerald-200",
  occupied: "bg-slate-100 text-slate-700 border-slate-200",
  for_sale: "bg-amber-100 text-amber-800 border-amber-200",
  under_maintenance: "bg-red-100 text-red-700 border-red-200",
};

export default function PropertyDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { data: property, isLoading } = useGetProperty(id, { query: { enabled: !!id } });
  const { t } = useLang();
  const D = t.detail;
  const { toast } = useToast();
  const inquiryMutation = useCreateInquiry();

  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  const handleInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    inquiryMutation.mutate(
      { data: { propertyId: id, ...form } },
      {
        onSuccess: () => {
          toast({ title: "Inquiry sent successfully!" });
          setForm({ name: "", email: "", phone: "", message: "" });
        },
        onError: (err) => toast({ title: "Failed to send", description: err.message, variant: "destructive" }),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 p-8 text-center text-muted-foreground">{D.loading}</main>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 p-8 text-center text-muted-foreground">{D.notFound}</main>
      </div>
    );
  }

  const statusLabel = t.status[property.status as keyof typeof t.status] ?? property.status.replace("_", " ");
  const typeLabel = t.types[property.type as keyof typeof t.types] ?? property.type;

  return (
    <div className="min-h-screen bg-[#f8f6f3] flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <div className="aspect-video bg-muted rounded-2xl overflow-hidden mb-3 shadow-sm">
              {property.photos?.[0] ? (
                <img src={property.photos[0]} alt={property.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">{D.noImage}</div>
              )}
            </div>
            {property.photos && property.photos.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {property.photos.slice(1).map((photo, i) => (
                  <div key={i} className="aspect-square bg-muted rounded-xl overflow-hidden">
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-1">{property.name}</h1>
                <p className="text-muted-foreground text-sm">{property.address}, {property.locality}</p>
              </div>
              <Badge className={`text-sm px-3 py-1 border ${STATUS_COLORS[property.status] || ""}`} variant="outline">
                {statusLabel}
              </Badge>
            </div>

            <div className="text-3xl font-bold text-primary mb-6">
              {(property.purpose === "rent" || property.purpose === "both") && (
                <div>{formatINR(property.rentPrice)}<span className="text-lg text-muted-foreground font-normal">/{property.rentPeriod || "mo"}</span></div>
              )}
              {(property.purpose === "sale" || property.purpose === "both") && (
                <div>{formatINR(property.salePriceINR)}<span className="text-lg text-muted-foreground font-normal"> ({D.sale})</span></div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label: D.type, value: typeLabel },
                { label: D.size, value: `${property.sizeSqft} sq.ft.` },
                ...(property.bhk ? [{ label: D.bhk, value: `${property.bhk} BHK` }] : []),
                { label: D.floor, value: property.floor ? String(property.floor) : D.ground },
              ].map((item, i) => (
                <div key={i} className="p-3 bg-white rounded-xl border border-border">
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className="font-semibold capitalize mt-0.5">{item.value}</div>
                </div>
              ))}
            </div>

            {property.amenities && property.amenities.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {property.amenities.map((a: string, i: number) => (
                  <span key={i} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">{a}</span>
                ))}
              </div>
            )}

            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">{D.description}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                {property.description || D.noDesc}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-border p-5">
              <h3 className="font-semibold text-base mb-1">{D.inquiryTitle}</h3>
              <p className="text-xs text-muted-foreground mb-4">{D.inquirySubtitle}</p>
              <form onSubmit={handleInquiry} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder={D.yourName}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="rounded-xl"
                  />
                  <Input
                    placeholder={D.yourPhone}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <Input
                  type="email"
                  placeholder={D.yourEmail}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="rounded-xl"
                />
                <textarea
                  placeholder={D.messagePlaceholder}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <Button type="submit" className="w-full rounded-xl" disabled={inquiryMutation.isPending}>
                  {inquiryMutation.isPending ? D.sending : D.send}
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
