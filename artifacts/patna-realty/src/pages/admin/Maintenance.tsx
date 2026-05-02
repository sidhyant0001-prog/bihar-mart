import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListMaintenanceRequests } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AdminMaintenance() {
  const { data: requests, isLoading } = useListMaintenanceRequests();

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Maintenance Requests</h1>
        </div>
        <div className="bg-card rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Property / Tenant</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
              ) : requests?.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.title}</TableCell>
                  <TableCell>{r.property?.name} <br/><span className="text-sm text-muted-foreground">{r.tenant?.name}</span></TableCell>
                  <TableCell className="capitalize">{r.category.replace('_', ' ')}</TableCell>
                  <TableCell>
                    <Badge variant={r.priority === "urgent" || r.priority === "high" ? "destructive" : "secondary"}>
                      {r.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.status === "resolved" || r.status === "closed" ? "default" : "secondary"}>
                      {r.status.replace('_', ' ')}
                    </Badge>
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
