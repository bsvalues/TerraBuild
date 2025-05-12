import { useCostFactorsByType } from "@/hooks/use-cost-factors";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface CostFactorTableProps {
  factorType: string;
  title?: string;
  description?: string;
}

export function CostFactorTable({
  factorType,
  title,
  description,
}: CostFactorTableProps) {
  const { factors, source, isLoading, error } = useCostFactorsByType(factorType);

  // Clean up factor type name for display
  const formatFactorType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const displayTitle = title || `${formatFactorType(factorType)} Factors`;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load {factorType} factors: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-row justify-between items-center">
          <CardTitle>{displayTitle}</CardTitle>
          {source && (
            <Badge variant="outline" className="ml-2">
              {source}
            </Badge>
          )}
        </div>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Factor Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {factors &&
                Object.entries(factors).map(([code, value]) => (
                  <TableRow key={code}>
                    <TableCell className="font-medium">{code}</TableCell>
                    <TableCell>{value.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}