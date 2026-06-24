import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function WeightSummaryCards({
  tareWeight,
  grossWeight,
  netWeight,
  weightUnit,
}: {
  tareWeight: number | null;
  grossWeight: number | null;
  netWeight: number | null;
  weightUnit: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Tare Weight</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {tareWeight != null ? tareWeight : '--'} {weightUnit}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Gross Weight</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {grossWeight != null ? grossWeight : '--'} {weightUnit}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Net Weight</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {netWeight != null ? netWeight : '--'} {weightUnit}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
