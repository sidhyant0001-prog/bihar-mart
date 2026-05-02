import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListLeases } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/format";

export default function AdminLeases() {
  const { data: leases, isLoading } = useListLeases();

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Leases</h1>
        </div>
        <div className="bg-card rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Rent</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
              ) : leases?.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.tenant?.name || `Tenant #${l.tenantId}`}</TableCell>
                  <TableCell>{l.property?.name || `Property #${l.propertyId}`}</TableCell>
                  <TableCell>{formatINR(l.rentAmount)}</TableCell>
                  <TableCell>{new Date(l.startDate).toLocaleDateString()} to {l.endDate ? new Date(l.endDate).toLocaleDateString() : 'Indefinite'}</TableCell>
                  <TableCell>
                    <Badge variant={l.status === "active" ? "default" : "secondary"}>{l.status}</Badge>
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
