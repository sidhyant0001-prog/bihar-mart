import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListProperties } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/format";

export default function AdminProperties() {
  const { data: properties, isLoading } = useListProperties();

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Properties</h1>
        </div>
        <div className="bg-card rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Rent/Sale</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
              ) : properties?.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="capitalize">{p.type} {p.bhk ? `(${p.bhk} BHK)` : ''}</TableCell>
                  <TableCell>
                    {p.purpose === "rent" || p.purpose === "both" ? formatINR(p.rentPrice) + "/mo " : ""}
                    {p.purpose === "sale" || p.purpose === "both" ? formatINR(p.salePriceINR) : ""}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.status === "available" ? "default" : "secondary"}>{p.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
