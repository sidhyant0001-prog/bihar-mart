import { useState, useRef, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  useListProperties,
  useCreateProperty,
  useUpdateProperty,
  useDeleteProperty,
  getListPropertiesQueryKey,
} from "@workspace/api-client-react";
import type { Property, CreatePropertyBody } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatINR } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Pencil, Trash2, Image as ImageIcon, Upload, X, Home,
  Store, ShoppingCart, Building2, CheckCircle2, Loader2,
} from "lucide-react";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  flat: <Home className="w-4 h-4" />,
  shop: <Store className="w-4 h-4" />,
  grocery_store: <ShoppingCart className="w-4 h-4" />,
  market: <Building2 className="w-4 h-4" />,
};

const STATUS_COLORS: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-800 border-emerald-200",
  occupied: "bg-slate-100 text-slate-700 border-slate-200",
  for_sale: "bg-amber-100 text-amber-800 border-amber-200",
  under_maintenance: "bg-red-100 text-red-700 border-red-200",
};

type PropertyStatus = "available" | "occupied" | "for_sale";
type PropertyType = "flat" | "shop" | "grocery_store" | "market";
type PropertyPurpose = "rent" | "sale" | "both";

interface FormData {
  name: string;
  type: PropertyType;
  bhk: string;
  floor: string;
  sizeSqft: string;
  blockOrSector: string;
  address: string;
  locality: string;
  landmark: string;
  rentPrice: string;
  salePriceINR: string;
  rentPeriod: string;
  purpose: PropertyPurpose;
  status: PropertyStatus;
  description: string;
  photos: string[];
  businessType: string;
  amenities: string;
}

const defaultForm: FormData = {
  name: "", type: "flat", bhk: "", floor: "", sizeSqft: "", blockOrSector: "",
  address: "Patna Complex, Gandhi Maidan", locality: "Gandhi Maidan",
  landmark: "", rentPrice: "", salePriceINR: "", rentPeriod: "monthly",
  purpose: "rent", status: "available", description: "", photos: [],
  businessType: "", amenities: "",
};

function propertyToForm(p: Property): FormData {
  return {
    name: p.name,
    type: p.type as PropertyType,
    bhk: p.bhk != null ? String(p.bhk) : "",
    floor: p.floor != null ? String(p.floor) : "",
    sizeSqft: String(p.sizeSqft),
    blockOrSector: p.blockOrSector ?? "",
    address: p.address,
    locality: p.locality,
    landmark: p.landmark ?? "",
    rentPrice: p.rentPrice != null ? String(p.rentPrice) : "",
    salePriceINR: p.salePriceINR != null ? String(p.salePriceINR) : "",
    rentPeriod: p.rentPeriod ?? "monthly",
    purpose: p.purpose as PropertyPurpose,
    status: p.status as PropertyStatus,
    description: p.description ?? "",
    photos: p.photos ?? [],
    businessType: p.businessType ?? "",
    amenities: (p.amenities ?? []).join(", "),
  };
}

function formToBody(f: FormData): CreatePropertyBody {
  return {
    name: f.name,
    type: f.type,
    bhk: f.bhk ? Number(f.bhk) : null,
    floor: f.floor ? Number(f.floor) : null,
    sizeSqft: Number(f.sizeSqft),
    blockOrSector: f.blockOrSector || null,
    address: f.address,
    locality: f.locality,
    landmark: f.landmark || null,
    rentPrice: f.rentPrice ? Number(f.rentPrice) : null,
    salePriceINR: f.salePriceINR ? Number(f.salePriceINR) : null,
    rentPeriod: (f.rentPeriod || null) as CreatePropertyBody["rentPeriod"],
    purpose: f.purpose,
    status: f.status,
    description: f.description || null,
    photos: f.photos,
    businessType: f.businessType || null,
    amenities: f.amenities ? f.amenities.split(",").map(s => s.trim()).filter(Boolean) : [],
  };
}

function ImageUploader({ photos, onChange }: {
  photos: string[];
  onChange: (photos: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    setUploading(true);
    setUploadProgress(fileArray.map(f => f.name));

    const uploaded: string[] = [];
    for (const file of fileArray) {
      try {
        const meta = await fetch("/api/storage/uploads/request-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
        });
        if (!meta.ok) throw new Error("Failed to get upload URL");
        const { uploadURL, objectPath } = await meta.json();

        const put = await fetch(uploadURL, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!put.ok) throw new Error("Upload to storage failed");

        const servingPath = objectPath.startsWith("/objects/")
          ? `/api/storage${objectPath}`
          : objectPath;
        uploaded.push(servingPath);
      } catch (err) {
        toast({ title: `Failed to upload ${file.name}`, variant: "destructive" });
      }
    }

    setUploading(false);
    setUploadProgress([]);
    if (uploaded.length > 0) onChange([...photos, ...uploaded]);
  }, [photos, onChange, toast]);

  const removePhoto = (idx: number) => {
    onChange(photos.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {photos.map((url, i) => (
          <div key={i} className="relative group aspect-video bg-muted rounded-lg overflow-hidden border">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
            {i === 0 && (
              <span className="absolute bottom-1 left-1 text-xs bg-primary text-white px-1.5 py-0.5 rounded">
                Main
              </span>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="aspect-video border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-colors text-muted-foreground hover:text-primary disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Upload className="w-5 h-5" />
              <span className="text-xs">Upload</span>
            </>
          )}
        </button>
      </div>

      {uploading && uploadProgress.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Uploading: {uploadProgress.join(", ")}
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or paste URL</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="https://example.com/image.jpg"
          className="h-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const val = (e.target as HTMLInputElement).value.trim();
              if (val) { onChange([...photos, val]); (e.target as HTMLInputElement).value = ""; }
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={(e) => {
            const input = (e.currentTarget.previousSibling as HTMLInputElement);
            const val = input.value.trim();
            if (val) { onChange([...photos, val]); input.value = ""; }
          }}
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
    </div>
  );
}

function PropertyFormModal({
  open, onClose, editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: Property | null;
}) {
  const [form, setForm] = useState<FormData>(editing ? propertyToForm(editing) : defaultForm);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateProperty();
  const updateMutation = useUpdateProperty();

  const set = (key: keyof FormData, value: string | string[]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListPropertiesQueryKey() });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.sizeSqft || !form.address) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    const body = formToBody(form);
    if (editing) {
      updateMutation.mutate({ propertyId: editing.id, data: body }, {
        onSuccess: () => { toast({ title: "Property updated" }); invalidate(); onClose(); },
        onError: (err) => toast({ title: "Update failed", description: err.message, variant: "destructive" }),
      });
    } else {
      createMutation.mutate({ data: body }, {
        onSuccess: () => { toast({ title: "Property created" }); invalidate(); onClose(); },
        onError: (err) => toast({ title: "Create failed", description: err.message, variant: "destructive" }),
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const F = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {editing ? "Edit Property" : "Add New Property"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-5 py-2">
          <div className="grid grid-cols-2 gap-4">
            <F label="Property Name" required>
              <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Flat A-101" />
            </F>
            <F label="Type" required>
              <Select value={form.type} onValueChange={v => set("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat">🏠 Flat</SelectItem>
                  <SelectItem value="shop">🏪 Shop</SelectItem>
                  <SelectItem value="grocery_store">🛒 Grocery Store</SelectItem>
                  <SelectItem value="market">🏢 Market</SelectItem>
                </SelectContent>
              </Select>
            </F>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {form.type === "flat" && (
              <F label="BHK">
                <Select value={form.bhk || "__none__"} onValueChange={v => set("bhk", v === "__none__" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">—</SelectItem>
                    <SelectItem value="1">1 BHK</SelectItem>
                    <SelectItem value="2">2 BHK</SelectItem>
                    <SelectItem value="3">3 BHK</SelectItem>
                    <SelectItem value="4">4 BHK</SelectItem>
                    <SelectItem value="5">5 BHK</SelectItem>
                  </SelectContent>
                </Select>
              </F>
            )}
            <F label="Floor">
              <Input type="number" value={form.floor} onChange={e => set("floor", e.target.value)} placeholder="0=Ground" />
            </F>
            <F label="Area (sq ft)" required>
              <Input type="number" value={form.sizeSqft} onChange={e => set("sizeSqft", e.target.value)} placeholder="950" />
            </F>
            <F label="Block/Sector">
              <Input value={form.blockOrSector} onChange={e => set("blockOrSector", e.target.value)} placeholder="Block A" />
            </F>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <F label="Address" required>
              <Input value={form.address} onChange={e => set("address", e.target.value)} />
            </F>
            <F label="Locality" required>
              <Input value={form.locality} onChange={e => set("locality", e.target.value)} placeholder="Gandhi Maidan" />
            </F>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <F label="Purpose" required>
              <Select value={form.purpose} onValueChange={v => set("purpose", v as PropertyPurpose)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rent">For Rent</SelectItem>
                  <SelectItem value="sale">For Sale</SelectItem>
                  <SelectItem value="both">Rent & Sale</SelectItem>
                </SelectContent>
              </Select>
            </F>
            <F label="Status" required>
              <Select value={form.status} onValueChange={v => set("status", v as PropertyStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="for_sale">For Sale</SelectItem>
                </SelectContent>
              </Select>
            </F>
            {(form.purpose === "rent" || form.purpose === "both") && (
              <F label="Rent Period">
                <Select value={form.rentPeriod} onValueChange={v => set("rentPeriod", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </F>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {(form.purpose === "rent" || form.purpose === "both") && (
              <F label="Rent Price (₹)">
                <Input type="number" value={form.rentPrice} onChange={e => set("rentPrice", e.target.value)} placeholder="12000" />
              </F>
            )}
            {(form.purpose === "sale" || form.purpose === "both") && (
              <F label="Sale Price (₹)">
                <Input type="number" value={form.salePriceINR} onChange={e => set("salePriceINR", e.target.value)} placeholder="4500000" />
              </F>
            )}
          </div>

          <F label="Description">
            <textarea
              value={form.description}
              onChange={e => set("description", e.target.value)}
              rows={3}
              placeholder="Describe the property..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </F>

          <F label="Amenities (comma-separated)">
            <Input
              value={form.amenities}
              onChange={e => set("amenities", e.target.value)}
              placeholder="Parking, Lift, Water Supply, Security"
            />
          </F>

          {(form.type === "shop" || form.type === "grocery_store" || form.type === "market") && (
            <F label="Business Type">
              <Input value={form.businessType} onChange={e => set("businessType", e.target.value)} placeholder="Retail, Grocery, etc." />
            </F>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4" /> Property Images
            </Label>
            <ImageUploader photos={form.photos} onChange={photos => set("photos", photos)} />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending} className="min-w-24">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? "Save Changes" : "Add Property"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({ property, onClose }: { property: Property | null; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteProperty();

  const onConfirm = () => {
    if (!property) return;
    deleteMutation.mutate({ propertyId: property.id }, {
      onSuccess: () => {
        toast({ title: "Property deleted" });
        queryClient.invalidateQueries({ queryKey: getListPropertiesQueryKey() });
        onClose();
      },
      onError: (err) => toast({ title: "Delete failed", description: err.message, variant: "destructive" }),
    });
  };

  return (
    <AlertDialog open={!!property} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Property</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{property?.name}</strong>? This action cannot be undone and will remove all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function QuickStatusSelect({ property }: { property: Property }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateMutation = useUpdateProperty();
  const [saving, setSaving] = useState(false);

  const onChange = (status: string) => {
    setSaving(true);
    const body = formToBody(propertyToForm(property));
    updateMutation.mutate(
      { propertyId: property.id, data: { ...body, status: status as PropertyStatus } },
      {
        onSuccess: () => {
          toast({ title: `Status updated to "${status.replace("_", " ")}"` });
          queryClient.invalidateQueries({ queryKey: getListPropertiesQueryKey() });
          setSaving(false);
        },
        onError: (err) => {
          toast({ title: "Failed to update status", description: err.message, variant: "destructive" });
          setSaving(false);
        },
      }
    );
  };

  return (
    <Select value={property.status} onValueChange={onChange} disabled={saving}>
      <SelectTrigger className="h-7 text-xs border-0 bg-transparent p-0 focus:ring-0 w-auto gap-1">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[property.status] || "bg-gray-100"}`}>
          {saving ? <Loader2 className="w-3 h-3 animate-spin inline" /> : property.status.replace("_", " ")}
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="available">
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />Available</span>
        </SelectItem>
        <SelectItem value="occupied">
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />Occupied</span>
        </SelectItem>
        <SelectItem value="for_sale">
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />For Sale</span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

function PropertyCard({
  property,
  onEdit,
  onDelete,
}: {
  property: Property;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const price = property.purpose === "sale"
    ? formatINR(property.salePriceINR)
    : `${formatINR(property.rentPrice)}/mo`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="h-44 bg-muted relative overflow-hidden">
        {property.photos?.[0] ? (
          <img src={property.photos[0]} alt={property.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2 bg-gradient-to-br from-muted to-muted/60">
            <ImageIcon className="w-8 h-8 opacity-30" />
            <span className="text-xs opacity-50">No image</span>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <QuickStatusSelect property={property} />
        </div>
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={onEdit}
            className="bg-white/90 hover:bg-white text-slate-700 rounded-lg p-1.5 shadow-sm transition-colors"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="bg-white/90 hover:bg-red-50 hover:text-red-600 text-slate-700 rounded-lg p-1.5 shadow-sm transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="font-semibold text-sm leading-tight">{property.name}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              {TYPE_ICONS[property.type]}
              <span className="capitalize">{property.type.replace("_", " ")}</span>
              {property.bhk && <span>• {property.bhk} BHK</span>}
            </p>
          </div>
          <p className="text-primary font-bold text-sm shrink-0">{price}</p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap mt-2 pt-2 border-t border-border/50">
          <span>{property.sizeSqft} sq.ft.</span>
          <span>•</span>
          <span>Floor {property.floor ?? "G"}</span>
          {property.blockOrSector && (
            <>
              <span>•</span>
              <span>{property.blockOrSector}</span>
            </>
          )}
        </div>

        {property.photos && property.photos.length > 1 && (
          <div className="flex gap-1 mt-2">
            {property.photos.slice(1, 4).map((url, i) => (
              <div key={i} className="w-10 h-10 rounded-md overflow-hidden border">
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            {property.photos.length > 4 && (
              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground border">
                +{property.photos.length - 4}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function AdminProperties() {
  const { data: properties, isLoading } = useListProperties();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [deleting, setDeleting] = useState<Property | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = (properties ?? []).filter(p => {
    if (typeFilter !== "all" && p.type !== typeFilter) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  });

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (p: Property) => { setEditing(p); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); setEditing(null); };

  const stats = {
    total: properties?.length ?? 0,
    available: properties?.filter(p => p.status === "available").length ?? 0,
    occupied: properties?.filter(p => p.status === "occupied").length ?? 0,
    forSale: properties?.filter(p => p.purpose === "sale" || p.purpose === "both").length ?? 0,
  };

  return (
    <AdminLayout>
      <div className="p-6 pb-20">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Properties</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your property listings</p>
          </div>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="w-4 h-4" /> Add Property
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total", value: stats.total, color: "text-blue-600" },
            { label: "Available", value: stats.available, color: "text-emerald-600" },
            { label: "Occupied", value: stats.occupied, color: "text-slate-600" },
            { label: "For Sale", value: stats.forSale, color: "text-amber-600" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border p-3 text-center shadow-sm">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-5 flex-wrap">
          <span className="text-sm text-muted-foreground self-center mr-1">Filter:</span>
          {["all", "flat", "shop", "grocery_store", "market"].map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all capitalize ${typeFilter === t ? "bg-primary text-white border-primary" : "bg-white border-border hover:border-primary/50"}`}
            >
              {t === "all" ? "All Types" : t.replace("_", " ")}
            </button>
          ))}
          <div className="w-px bg-border self-stretch" />
          {["all", "available", "occupied", "for_sale"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all capitalize ${statusFilter === s ? "bg-primary text-white border-primary" : "bg-white border-border hover:border-primary/50"}`}
            >
              {s === "all" ? "All Status" : s.replace("_", " ")}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="animate-pulse bg-white rounded-2xl h-72 border" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No properties found</p>
            <Button onClick={openAdd} variant="outline" className="mt-4 gap-2">
              <Plus className="w-4 h-4" /> Add your first property
            </Button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(p => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  onEdit={() => openEdit(p)}
                  onDelete={() => setDeleting(p)}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      <button
        onClick={openAdd}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all flex items-center justify-center z-50"
        title="Add Property"
      >
        <Plus className="w-6 h-6" />
      </button>

      <PropertyFormModal open={formOpen} onClose={closeForm} editing={editing} />
      <DeleteDialog property={deleting} onClose={() => setDeleting(null)} />
    </AdminLayout>
  );
}
