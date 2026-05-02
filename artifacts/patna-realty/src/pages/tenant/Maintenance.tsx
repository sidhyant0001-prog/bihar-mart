import { TenantLayout } from "@/components/layout/TenantLayout";
import { useListMaintenanceRequests, useCreateMaintenanceRequest, getListMaintenanceRequestsQueryKey } from "@workspace/api-client-react";
import { getSession } from "@/lib/auth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function TenantMaintenance() {
  const session = getSession();
  const tenantId = session?.user?.id;
  // In a real app we'd need propertyId from the user's lease. For now we use a mock/first property id.
  const { data: requests, isLoading } = useListMaintenanceRequests({ tenantId }, { query: { enabled: !!tenantId } });
  
  return (
    <TenantLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Maintenance Requests</h1>
          <NewRequestDialog tenantId={tenantId!} />
        </div>
        <div className="bg-card rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
              ) : requests?.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="font-medium">{r.title}</div>
                    <div className="text-sm text-muted-foreground truncate max-w-[200px]">{r.description}</div>
                  </TableCell>
                  <TableCell className="capitalize">{r.category.replace('_', ' ')}</TableCell>
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
    </TenantLayout>
  );
}

function NewRequestDialog({ tenantId }: { tenantId: number }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<any>("other");
  const [priority, setPriority] = useState<any>("medium");
  
  const createRequest = useCreateMaintenanceRequest();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!title || !description) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    createRequest.mutate(
      { data: { tenantId, propertyId: 1, title, description, category, priority } }, // Using dummy propertyId 1
      {
        onSuccess: () => {
          toast({ title: "Request submitted" });
          queryClient.invalidateQueries({ queryKey: getListMaintenanceRequestsQueryKey({ tenantId }) });
          setOpen(false);
          setTitle("");
          setDescription("");
        },
        onError: (err) => {
          toast({ title: "Failed to submit request", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New Request</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Maintenance Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief summary of the issue" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="carpentry">Carpentry</SelectItem>
                <SelectItem value="cleaning">Cleaning</SelectItem>
                <SelectItem value="pest_control">Pest Control</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Priority</label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide details..." rows={4} />
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={createRequest.isPending}>
            {createRequest.isPending ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
