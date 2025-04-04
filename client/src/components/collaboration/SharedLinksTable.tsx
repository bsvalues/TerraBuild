import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Copy, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import SharedLinkDialog from './SharedLinkDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

interface SharedLink {
  id: number;
  projectId: number;
  token: string;
  createdAt: string;
  expiresAt: string | null;
  accessLevel: string;
  createdBy: number;
  description: string | null;
}

interface SharedLinksTableProps {
  projectId: number;
  isAdmin: boolean;
}

const SharedLinksTable: React.FC<SharedLinksTableProps> = ({ projectId, isAdmin }) => {
  const { toast } = useToast();
  
  const { data: links, isLoading } = useQuery<SharedLink[]>({
    queryKey: [`/api/shared-projects/${projectId}/links`],
    queryFn: async () => {
      const response = await apiRequest(`/api/shared-projects/${projectId}/links`);
      return response.json();
    },
  });

  const deleteSharedLink = useMutation({
    mutationFn: async (linkId: number) => {
      await apiRequest(`/api/shared-projects/${projectId}/links/${linkId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/shared-projects/${projectId}/links`] });
      toast({
        title: 'Success',
        description: 'Shared link deleted successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete shared link.',
        variant: 'destructive',
      });
    },
  });

  const copyLinkToClipboard = (token: string) => {
    const linkUrl = `${window.location.origin}/shared-link/${token}`;
    navigator.clipboard.writeText(linkUrl);
    toast({
      title: 'Link copied',
      description: 'Shared link has been copied to clipboard.',
    });
  };
  
  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl">Shared Links</CardTitle>
        {isAdmin && <SharedLinkDialog projectId={projectId} />}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">Loading shared links...</div>
        ) : links && links.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Access Level</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link: SharedLink) => (
                  <TableRow key={link.id} className={isExpired(link.expiresAt) ? 'opacity-50' : ''}>
                    <TableCell>
                      <Badge variant={
                        link.accessLevel === 'admin' ? 'danger' :
                        link.accessLevel === 'edit' ? 'outline' : 'default'
                      }>
                        {link.accessLevel.charAt(0).toUpperCase() + link.accessLevel.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(link.createdAt), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      {link.expiresAt 
                        ? isExpired(link.expiresAt)
                          ? <span className="text-red-500">Expired</span>
                          : format(new Date(link.expiresAt), 'MMM d, yyyy')
                        : 'Never'}
                    </TableCell>
                    <TableCell>{link.description || '-'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copyLinkToClipboard(link.token)}
                        title="Copy link"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      
                      {isAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-red-500 hover:text-red-700"
                              title="Delete link"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Shared Link</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this shared link? Anyone using this link will no longer be able to access the project.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteSharedLink.mutate(link.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            No shared links created yet.
            {isAdmin && (
              <p className="mt-2">
                Create a shared link to allow others to access this project without requiring a user account.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SharedLinksTable;