/**
 * Excel Validator Type Definitions
 */

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  info: {
    sheets?: string[];
    rowCount?: number;
    detectedYear?: number;
    detectedTypes?: string[];
    detectedRegions?: string[];
  };
}

interface BatchValidationResult {
  isValid: boolean;
  totalFiles: number;
  validFiles: number;
  invalidFiles: number;
  details: Array<{
    file: string;
    isValid: boolean;
    errors: string[];
    warnings: string[];
    info: ValidationResult['info'];
  }>;
}

export function validateExcelFile(filePath: string, options?: {
  strictMode?: boolean;
  checkDataTypes?: boolean;
}): Promise<ValidationResult>;

export function validateBatchExcelFiles(filePaths: string[], options?: {
  strictMode?: boolean;
  checkDataTypes?: boolean;
}): Promise<BatchValidationResult>;