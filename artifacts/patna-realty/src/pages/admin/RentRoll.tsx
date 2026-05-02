import { AdminLayout } from "@/components/layout/AdminLayout";
import { useGetRentRoll } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/format";

export default function AdminRentRoll() {
  const { data: rentRoll, isLoading } = useGetRentRoll();

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Rent Roll</h1>
        </div>
        <div className="bg-card rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Rent</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center">Loading...</TableCell></TableRow>
              ) : rentRoll?.map((entry, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{entry.tenantName}</TableCell>
                  <TableCell>{entry.propertyName}</TableCell>
                  <TableCell>{formatINR(entry.rentAmount)}</TableCell>
                  <TableCell>{new Date(entry.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={entry.status === "paid" ? "default" : entry.status === "overdue" ? "destructive" : "secondary"}>
                      {entry.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatINR(entry.balance || 0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
