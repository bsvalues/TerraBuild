import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { FileUpload, insertFileUploadSchema } from '@shared/schema';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';

// Extended schema with validation
const fileUploadSchema = insertFileUploadSchema.extend({
  filename: z.string().min(1, "File name is required"),
  fileType: z.string().min(1, "File type is required"),
  fileSize: z.number().min(1, "File size is required"),
  status: z.string().min(1, "Status is required"),
  processedItems: z.number().default(0),
  totalItems: z.number().nullable().default(null),
  errorCount: z.number().default(0),
  errors: z.any().default([])
});

// UseFileUploads hook for file upload CRUD operations
export function useFileUploads() {
  // Get all file uploads
  const getAll = useQuery<FileUpload[]>({ 
    queryKey: ['/api/file-uploads']
  });

  // Get a single file upload by ID
  const getById = (id: number) => useQuery<FileUpload>({ 
    queryKey: ['/api/file-uploads', id],
    enabled: !!id
  });

  // Create a new file upload
  const create = useMutation({
    mutationFn: async (data: z.infer<typeof fileUploadSchema>) => {
      const validatedData = fileUploadSchema.parse(data);
      return apiRequest('/api/file-uploads', {
        method: 'POST',
        data: validatedData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/file-uploads'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating file upload',
        description: error.message || 'Failed to create file upload record',
        variant: 'destructive'
      });
    }
  });

  // Update file upload status
  const updateStatus = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      processedItems, 
      totalItems, 
      errors 
    }: { 
      id: number; 
      status: string; 
      processedItems?: number; 
      totalItems?: number; 
      errors?: any[] 
    }) => {
      return apiRequest(`/api/file-uploads/${id}/status`, {
        method: 'PATCH',
        data: { status, processedItems, totalItems, errors }
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/file-uploads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/file-uploads', variables.id] });
      
      toast({
        title: 'Status updated',
        description: `File status updated to ${variables.status}`
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating status',
        description: error.message || 'Failed to update file status',
        variant: 'destructive'
      });
    }
  });

  // Delete a file upload
  const remove = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/file-uploads/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/file-uploads'] });
      
      toast({
        title: 'File deleted',
        description: 'File upload record has been deleted'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting file',
        description: error.message || 'Failed to delete file upload record',
        variant: 'destructive'
      });
    }
  });

  // Import Excel file data to cost matrix
  const importExcel = useMutation({
    mutationFn: async (fileId: number) => {
      return apiRequest(`/api/cost-matrix/import-excel/${fileId}`, {
        method: 'POST'
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/cost-matrix'] });
      
      const imported = data?.imported || 0;
      const updated = data?.updated || 0;
      
      toast({
        title: 'Import successful',
        description: `Imported ${imported} entries, updated ${updated} entries`
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Import failed',
        description: error.message || 'Failed to import Excel data',
        variant: 'destructive'
      });
    }
  });

  // Import property data from CSV files
  const importPropertyData = useMutation({
    mutationFn: async (files: { 
      propertiesFile?: number; 
      improvementsFile: number; 
      improvementDetailsFile: number; 
      improvementItemsFile: number; 
      landDetailsFile: number;
      batchSize?: number;
    }) => {
      return apiRequest('/api/properties/import', {
        method: 'POST',
        data: files
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      
      const properties = data?.properties?.success || 0;
      const improvements = data?.improvements?.success || 0;
      const improvementDetails = data?.improvementDetails?.success || 0;
      const improvementItems = data?.improvementItems?.success || 0;
      const landDetails = data?.landDetails?.success || 0;
      
      toast({
        title: 'Property data import successful',
        description: `Imported ${properties} properties, ${improvements} improvements, ${improvementDetails} details, ${improvementItems} items, and ${landDetails} land details`
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Property data import failed',
        description: error.message || 'Failed to import property data',
        variant: 'destructive'
      });
    }
  });

  return {
    getAll,
    getById,
    create,
    updateStatus,
    remove,
    importExcel,
    importPropertyData
  };
}