import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListInquiries } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AdminInquiries() {
  const { data: inquiries, isLoading } = useListInquiries();

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Inquiries</h1>
        </div>
        <div className="bg-card rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
              ) : inquiries?.map(i => (
                <TableRow key={i.id}>
                  <TableCell>{new Date(i.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{i.property?.name || `Property #${i.propertyId}`}</TableCell>
                  <TableCell>
                    <div>{i.name}</div>
                    <div className="text-sm text-muted-foreground">{i.email} • {i.phone}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={i.status === "new" ? "secondary" : "default"}>{i.status}</Badge>
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
