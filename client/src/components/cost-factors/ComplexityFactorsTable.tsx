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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ComplexityFactorsTableProps {
  title?: string;
  description?: string;
}

export function ComplexityFactorsTable({
  title = "Complexity Factors",
  description,
}: ComplexityFactorsTableProps) {
  const { factors, source, isLoading, error } = useCostFactorsByType("complexity");

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load complexity factors: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  // Generate category labels
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "STORIES":
        return "Number of Stories";
      case "FOUNDATION":
        return "Foundation Type";
      case "ROOF":
        return "Roof Type";
      case "HVAC":
        return "HVAC System";
      default:
        return category;
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-row justify-between items-center">
          <CardTitle>{title}</CardTitle>
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
        ) : factors ? (
          <Tabs defaultValue="STORIES">
            <TabsList className="grid grid-cols-4">
              {Object.keys(factors).map((category) => (
                <TabsTrigger key={category} value={category}>
                  {getCategoryLabel(category)}
                </TabsTrigger>
              ))}
            </TabsList>
            {Object.entries(factors).map(([category, values]) => (
              <TabsContent key={category} value={category}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Factor Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(values).map(([code, value]) => (
                      <TableRow key={code}>
                        <TableCell className="font-medium">{code}</TableCell>
                        <TableCell>{Number(value).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <p>No complexity factors available</p>
        )}
      </CardContent>
    </Card>
  );
}