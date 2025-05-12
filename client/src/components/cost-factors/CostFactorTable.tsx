import { useCostFactorsByType } from '@/hooks/use-cost-factors.tsx';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CostFactorTableProps {
  buildingType: string;
  title?: string;
  caption?: string;
  showQualityGradeColumn?: boolean;
}

/**
 * Table component for displaying cost factors for a specific building type
 */
export default function CostFactorTable({
  buildingType,
  title = 'Cost Factors',
  caption = 'Cost factors for the selected building type',
  showQualityGradeColumn = true,
}: CostFactorTableProps) {
  const { factors, isLoading, error } = useCostFactorsByType(buildingType);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load cost factors'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableCaption>{caption}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead colSpan={4} className="text-center text-lg font-bold">
              {title}
            </TableHead>
          </TableRow>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Name</TableHead>
            {showQualityGradeColumn && <TableHead>Quality Grade</TableHead>}
            <TableHead className="text-right">Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={`loading-row-${index}`}>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                {showQualityGradeColumn && (
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                )}
                <TableCell className="text-right">
                  <Skeleton className="h-4 w-16 ml-auto" />
                </TableCell>
              </TableRow>
            ))
          ) : factors && factors.length > 0 ? (
            // Actual data
            factors.map((factor, index) => (
              <TableRow key={`factor-${factor.id}-${index}`}>
                <TableCell className="font-medium">{factor.category}</TableCell>
                <TableCell>{factor.name}</TableCell>
                {showQualityGradeColumn && <TableCell>{factor.qualityGrade}</TableCell>}
                <TableCell className="text-right">
                  {typeof factor.value === 'number'
                    ? factor.value.toFixed(2)
                    : factor.value?.toString() || 'N/A'}
                </TableCell>
              </TableRow>
            ))
          ) : (
            // No data
            <TableRow>
              <TableCell
                colSpan={showQualityGradeColumn ? 4 : 3}
                className="text-center text-muted-foreground py-6"
              >
                No cost factors available for this building type
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}