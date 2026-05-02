import { AdminLayout } from "@/components/layout/AdminLayout";
import { useGetCollectionReport } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/format";

export default function AdminCollectionReport() {
  const { data: report, isLoading } = useGetCollectionReport();

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Collection Report</h1>
        </div>
        {isLoading || !report ? (
          <div>Loading...</div>
        ) : (
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Expected</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{formatINR(report.totalExpected)}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Collected</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-primary">{formatINR(report.totalCollected)}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Collection Rate</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{(report.collectionRate * 100).toFixed(1)}%</div></CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader><CardTitle>Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.breakdown?.map((b, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b pb-2 last:border-0">
                      <span className="font-medium">{b.label}</span>
                      <div className="text-right">
                        <div>{formatINR(b.collected)}</div>
                        <div className="text-sm text-muted-foreground">of {formatINR(b.expected)} expected</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
