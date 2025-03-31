/**
 * Batch Importer Type Definitions
 */

interface ImportOptions {
  strictMode?: boolean;
  checkDataTypes?: boolean;
  detectDuplicates?: boolean;
  useTransaction?: boolean;
  standardizeData?: boolean;
}

interface FileDetail {
  file: string;
  status: 'processed' | 'failed' | 'skipped';
  phase?: 'validation' | 'processing' | 'transaction';
  success?: boolean;
  errors?: string[];
  reason?: 'duplicate';
  duplicateOf?: string;
  importResult?: {
    matricesInserted: number;
    detailsInserted: number;
  };
  matrices?: number;
  details?: number;
  year?: number;
  types?: string[];
  regions?: string[];
}

interface BatchImportResult {
  success: boolean;
  totalFiles: number;
  processed: number;
  failed: number;
  skipped: number;
  details: FileDetail[];
  startTime: number;
  endTime: number | null;
  elapsedTimeMs: number | null;
  rollback?: boolean;
}

export function processBatchImport(
  filePaths: string[],
  options?: ImportOptions
): Promise<BatchImportResult>;