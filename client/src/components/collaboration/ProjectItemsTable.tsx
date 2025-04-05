import React, { useState } from 'react';
import { useCollaboration } from '@/contexts/CollaborationContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import {
  FolderOpen,
  MoreHorizontal,
  Trash2,
  ExternalLink,
  Calculator,
  FileText,
  BarChart,
  PieChart,
  LayoutGrid,
  CheckCircle,
  Loader2,
  Link,
  FilePieChart,
  FileBarChart,
  FileSpreadsheet,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ProjectItemsTableProps {
  // Required props
  projectId: number;
  // Optional props with defaults
  items?: any[]; // Project items array
  isLoading?: boolean;
  currentUserRole?: string;
  // Direct prop for permissions
  canManageItems?: boolean;
}

export default function ProjectItemsTable({
  projectId,
  items = [],
  isLoading = false,
  currentUserRole = 'viewer',
  canManageItems: propCanManageItems,
}: ProjectItemsTableProps) {
  const {
    removeProjectItem,
  } = useCollaboration();
  
  // Use the items prop instead of context projectItems
  
  const [itemToRemove, setItemToRemove] = useState<{id: number, type: string, name: string} | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Check if current user can manage items - use provided prop or calculate from role
  const canManageItems = propCanManageItems !== undefined 
    ? propCanManageItems 
    : ['admin', 'owner', 'editor'].includes(currentUserRole);
  
  // Remove an item
  const handleRemoveItem = (itemId: number, itemType: string, itemName: string) => {
    setItemToRemove({ id: itemId, type: itemType, name: itemName });
    setShowRemoveConfirm(true);
  };
  
  const confirmRemoveItem = async () => {
    if (!itemToRemove) return;
    
    setIsProcessing(true);
    try {
      await removeProjectItem(projectId, itemToRemove.type, itemToRemove.id);
      setShowRemoveConfirm(false);
      setItemToRemove(null);
      
      toast({
        title: 'Item removed',
        description: `${itemToRemove.name} has been removed from the project`,
      });
      
      // No refreshItems function, so we'll rely on the mutation cache invalidation
    } catch (error) {
      console.error('Error removing item:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove item from project',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Helper function to get item type badge and icon
  const getItemTypeBadge = (type: string) => {
    switch (type) {
      case 'calculation':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
            <Calculator className="h-3 w-3 mr-1" />
            Calculation
          </Badge>
        );
      case 'cost_matrix':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
            <FileSpreadsheet className="h-3 w-3 mr-1" />
            Cost Matrix
          </Badge>
        );
      case 'report':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
            <FileText className="h-3 w-3 mr-1" />
            Report
          </Badge>
        );
      case 'what_if_scenario':
        return (
          <Badge variant="outline" className="bg-violet-50 text-violet-600 border-violet-200">
            <FilePieChart className="h-3 w-3 mr-1" />
            What-If Scenario
          </Badge>
        );
      case 'chart':
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">
            <BarChart className="h-3 w-3 mr-1" />
            Chart
          </Badge>
        );
      case 'visualization':
        return (
          <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200">
            <FilePieChart className="h-3 w-3 mr-1" />
            Visualization
          </Badge>
        );
      case 'dashboard':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
            <LayoutGrid className="h-3 w-3 mr-1" />
            Dashboard
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <FileText className="h-3 w-3 mr-1" />
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Badge>
        );
    }
  };
  
  // Helper to get item name
  const getItemName = (item: any) => {
    return item.details?.name || `${item.itemType.charAt(0).toUpperCase() + item.itemType.slice(1)} ${item.itemId}`;
  };
  
  // Helper to get user display name
  const getUserDisplayName = (user: any) => {
    return user?.name || user?.username || 'Unknown User';
  };
  
  // Get initials for avatar
  const getInitials = (name: string): string => {
    if (!name) return '?';
    
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };
  
  // Navigation to item based on type
  const navigateToItem = (type: string, id: number) => {
    let url = '';
    switch (type) {
      case 'calculation':
        url = `/calculations/${id}`;
        break;
      case 'cost_matrix':
        url = `/cost-matrices/${id}`;
        break;
      case 'report':
        url = `/reports/${id}`;
        break;
      case 'what_if_scenario':
        url = `/what-if-scenarios/${id}`;
        break;
      case 'chart':
      case 'visualization':
        url = `/visualizations/${id}`;
        break;
      case 'dashboard':
        url = `/dashboards/${id}`;
        break;
      default:
        url = `/projects/${projectId}`;
    }
    
    window.location.href = url;
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <FolderOpen className="h-5 w-5 mr-2" />
          Shared Items
        </CardTitle>
        <CardDescription>
          {items.length} item{items.length !== 1 ? 's' : ''} shared in this project
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center border rounded-lg p-8">
            <div className="mx-auto rounded-full bg-muted w-12 h-12 flex items-center justify-center mb-3">
              <FolderOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No shared items</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              {canManageItems
                ? "Share calculations, matrices, and reports with this project."
                : "No items have been shared with this project yet."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Added By</TableHead>
                <TableHead>Added On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: any) => {
                const itemName = getItemName(item);
                return (
                  <TableRow key={`${item.itemType}-${item.itemId}`}>
                    <TableCell className="font-medium">{itemName}</TableCell>
                    <TableCell>{getItemTypeBadge(item.itemType)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>{getInitials(item.user?.name || '')}</AvatarFallback>
                          {item.user?.name && (
                            <AvatarImage
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                item.user.name
                              )}&background=random`}
                              alt={item.user.name}
                            />
                          )}
                        </Avatar>
                        <span className="text-sm">
                          {getUserDisplayName(item.user)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.addedAt ? format(new Date(item.addedAt), "MMM d, yyyy") : 'Unknown'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuItem onClick={() => navigateToItem(item.itemType, item.itemId)}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open
                          </DropdownMenuItem>
                          
                          {canManageItems && (
                            <>
                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem
                                onClick={() => handleRemoveItem(item.itemId, item.itemType, itemName)}
                                className="text-destructive focus:text-destructive"
                                disabled={isProcessing}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove from Project
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        
        {/* Remove Item Confirmation Dialog */}
        <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Item</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove "{itemToRemove?.name || 'this item'}" from the project? 
                This will only remove the connection; the item itself won't be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmRemoveItem}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  "Remove Item"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}