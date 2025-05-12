import { useRatingTable } from '@/hooks/use-cost-factors';
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

interface ComplexityFactorsTableProps {
  category: string;
  title?: string;
  caption?: string;
}

/**
 * Table component for displaying complexity factors (stories, foundation, etc.)
 */
export default function ComplexityFactorsTable({
  category,
  title = 'Complexity Factors',
  caption = 'Adjustment factors based on building complexity',
}: ComplexityFactorsTableProps) {
  const { table: ratingTable, isLoading, error } = useRatingTable(category);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load complexity factors'}
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
            <TableHead colSpan={2} className="text-center text-lg font-bold">
              {title}
            </TableHead>
          </TableRow>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Factor</TableHead>
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
                <TableCell className="text-right">
                  <Skeleton className="h-4 w-16 ml-auto" />
                </TableCell>
              </TableRow>
            ))
          ) : ratingTable && ratingTable.values ? (
            // Actual data
            Object.entries(ratingTable.values).map(([key, value], index) => (
              <TableRow key={`${category}-factor-${index}`}>
                <TableCell className="font-medium">{key}</TableCell>
                <TableCell className="text-right">
                  {typeof value === 'number' ? value.toFixed(2) : String(value)}
                </TableCell>
              </TableRow>
            ))
          ) : (
            // No data
            <TableRow>
              <TableCell
                colSpan={2}
                className="text-center text-muted-foreground py-6"
              >
                No {category.toLowerCase()} factors available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}