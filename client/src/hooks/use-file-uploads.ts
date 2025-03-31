import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import type { FileUpload } from "@shared/schema";

/**
 * Hook for interacting with the file uploads API
 */
export function useFileUploads() {
  // Get all file uploads
  const getAll = useQuery({
    queryKey: ["/api/file-uploads"],
  });

  // Get file upload by ID
  const getById = (id: number) => {
    return useQuery({
      queryKey: ["/api/file-uploads", id],
      enabled: !!id,
    });
  };

  // Create file upload record
  const create = useMutation({
    mutationFn: async (data: Omit<FileUpload, "id" | "createdAt" | "updatedAt" | "uploadedBy">) => {
      return apiRequest("POST", "/api/file-uploads", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/file-uploads"] });
      toast({
        title: "File upload created",
        description: "The file upload record has been successfully created.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to create file upload record.",
        variant: "destructive",
      });
    },
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
      errors?: string[] 
    }) => {
      return apiRequest("PATCH", `/api/file-uploads/${id}/status`, { 
        status, 
        processedItems, 
        totalItems, 
        errors 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/file-uploads"] });
    },
    onError: (error: any) => {
      toast({
        title: "Status update failed",
        description: error.message || "Failed to update file upload status.",
        variant: "destructive",
      });
    },
  });

  // Delete file upload
  const remove = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/file-uploads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/file-uploads"] });
      toast({
        title: "File upload deleted",
        description: "The file upload has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete file upload.",
        variant: "destructive",
      });
    },
  });

  // Import excel cost matrix
  const importExcelMatrix = useMutation({
    mutationFn: async (fileId: number) => {
      const response = await apiRequest("POST", `/api/cost-matrix/import-excel/${fileId}`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-matrix"] });
      queryClient.invalidateQueries({ queryKey: ["/api/file-uploads"] });
      toast({
        title: "Excel import successful",
        description: `Imported ${data.imported} entries, updated ${data.updated} entries.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Excel import failed",
        description: error.message || "Failed to import cost matrix from Excel.",
        variant: "destructive",
      });
    },
  });

  return {
    getAll,
    getById,
    create,
    updateStatus,
    remove,
    importExcelMatrix,
  };
}