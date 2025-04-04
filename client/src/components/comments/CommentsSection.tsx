import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import {
  MessageSquare,
  Reply,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  SendHorizontal,
  MessageSquareOff,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface Comment {
  id: number;
  content: string;
  userId: number;
  targetType: string;
  targetId: number;
  parentCommentId: number | null;
  isResolved: boolean;
  isEdited: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  user?: {
    id: number;
    username: string;
    name: string | null;
  };
  replies?: Comment[];
}

export interface CommentsSectionProps {
  targetType: string;
  targetId: number | string;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ targetType, targetId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  
  // Fetch comments
  const {
    data: comments = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['comments', targetType, targetId],
    queryFn: async () => {
      const response = await apiRequest(`/api/comments?targetType=${targetType}&targetId=${targetId}`);
      return response.json();
    },
    meta: {
      errorMessage: 'Failed to load comments',
    },
  });

  // Generate threaded comments structure
  const organizeComments = (flatComments: Comment[]): Comment[] => {
    const commentMap = new Map<number, Comment>();
    const rootComments: Comment[] = [];

    // First pass: create a map of all comments by ID
    flatComments.forEach(comment => {
      const commentCopy = { ...comment, replies: [] };
      commentMap.set(comment.id, commentCopy);
    });

    // Second pass: build the tree
    flatComments.forEach(comment => {
      if (comment.parentCommentId === null) {
        rootComments.push(commentMap.get(comment.id)!);
      } else {
        const parent = commentMap.get(comment.parentCommentId);
        if (parent && parent.replies) {
          parent.replies.push(commentMap.get(comment.id)!);
        }
      }
    });

    return rootComments;
  };

  const threadedComments = organizeComments(comments);

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (data: { content: string; targetType: string; targetId: number | string; parentCommentId: number | null }) => {
      const response = await apiRequest('/api/comments', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', targetType, targetId] });
      setNewComment('');
      setReplyingTo(null);
      setReplyContent('');
      
      toast({
        title: 'Comment added',
        description: 'Your comment has been added successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error adding comment',
        description: 'There was a problem adding your comment. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: number; content: string }) => {
      const response = await apiRequest(`/api/comments/${commentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ content }),
        headers: { 'Content-Type': 'application/json' },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', targetType, targetId] });
      setEditingComment(null);
      setEditContent('');
      
      toast({
        title: 'Comment updated',
        description: 'Your comment has been updated successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error updating comment',
        description: 'There was a problem updating your comment. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await apiRequest(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', targetType, targetId] });
      setDeleteDialogOpen(false);
      setCommentToDelete(null);
      
      toast({
        title: 'Comment deleted',
        description: 'Your comment has been deleted successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error deleting comment',
        description: 'There was a problem deleting your comment. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Toggle resolved status mutation
  const toggleResolvedMutation = useMutation({
    mutationFn: async ({ commentId, isResolved }: { commentId: number; isResolved: boolean }) => {
      const response = await apiRequest(`/api/comments/${commentId}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({ isResolved }),
        headers: { 'Content-Type': 'application/json' },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', targetType, targetId] });
      
      toast({
        title: 'Comment updated',
        description: 'The comment status has been updated successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error updating comment',
        description: 'There was a problem updating the comment status. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Add a new top-level comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      toast({
        title: 'Empty comment',
        description: 'Please enter some content for your comment.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await addCommentMutation.mutateAsync({
        content: newComment,
        targetType,
        targetId: Number(targetId),
        parentCommentId: null,
      });
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Add a reply to a comment
  const handleAddReply = async (parentCommentId: number) => {
    if (!replyContent.trim()) {
      toast({
        title: 'Empty reply',
        description: 'Please enter some content for your reply.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await addCommentMutation.mutateAsync({
        content: replyContent,
        targetType,
        targetId: Number(targetId),
        parentCommentId,
      });
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  // Update a comment
  const handleUpdateComment = async (commentId: number) => {
    if (!editContent.trim()) {
      toast({
        title: 'Empty comment',
        description: 'Please enter some content for your comment.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await updateCommentMutation.mutateAsync({
        commentId,
        content: editContent,
      });
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  // Delete a comment
  const handleDeleteComment = async () => {
    if (commentToDelete === null) return;
    
    try {
      await deleteCommentMutation.mutateAsync(commentToDelete);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  // Toggle resolved status
  const handleToggleResolved = async (commentId: number, currentStatus: boolean) => {
    try {
      await toggleResolvedMutation.mutateAsync({
        commentId,
        isResolved: !currentStatus,
      });
    } catch (error) {
      console.error('Error toggling resolved status:', error);
    }
  };

  // Set up editing state when a comment is selected for editing
  useEffect(() => {
    if (editingComment !== null) {
      const commentToEdit = comments.find((c: Comment) => c.id === editingComment);
      if (commentToEdit) {
        setEditContent(commentToEdit.content);
      }
    }
  }, [editingComment, comments]);

  // Render a comment and its replies recursively
  const renderComment = (comment: Comment, depth = 0) => {
    const isReplying = replyingTo === comment.id;
    const isEditing = editingComment === comment.id;
    const isResolvedClass = comment.isResolved ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20' : '';
    const isChildComment = comment.parentCommentId !== null;
    
    return (
      <div key={comment.id} className={`mb-4 ${depth > 0 ? 'ml-8' : ''}`}>
        <Card className={`${isResolvedClass} relative`}>
          {comment.isResolved && (
            <div className="absolute top-0 right-0 m-2">
              <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-100">
                Resolved
              </Badge>
            </div>
          )}
          
          <CardHeader className="pb-2 flex flex-row items-start justify-between">
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarFallback>
                  {comment.user?.username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{comment.user?.username || `User ${comment.userId}`}</div>
                <div className="text-xs text-muted-foreground flex items-center">
                  {comment.createdAt instanceof Date ? 
                    formatDistanceToNow(comment.createdAt, { addSuffix: true }) : 
                    formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  {comment.isEdited && <span className="ml-2">(edited)</span>}
                </div>
              </div>
            </div>
            
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="12" cy="5" r="1" />
                      <circle cx="12" cy="19" r="1" />
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setReplyingTo(comment.id)}>
                    <Reply className="mr-2 h-4 w-4" />
                    Reply
                  </DropdownMenuItem>
                  
                  {user.id === comment.userId && (
                    <>
                      <DropdownMenuItem onClick={() => setEditingComment(comment.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          setCommentToDelete(comment.id);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  <DropdownMenuItem 
                    onClick={() => handleToggleResolved(comment.id, comment.isResolved)}
                  >
                    {comment.isResolved ? (
                      <>
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Mark as Unresolved
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark as Resolved
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </CardHeader>
          
          <CardContent className="pb-3">
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Edit your comment..."
                  className="min-h-[100px]"
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingComment(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleUpdateComment(comment.id)}
                    disabled={!editContent.trim()}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="whitespace-pre-wrap break-words">{comment.content}</div>
            )}
          </CardContent>
          
          {isReplying && (
            <CardFooter className="border-t pt-3 flex flex-col">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="min-h-[80px] mb-2"
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="flex items-center"
                  onClick={() => handleAddReply(comment.id)}
                  disabled={!replyContent.trim()}
                >
                  <SendHorizontal className="mr-1 h-4 w-4" />
                  Reply
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
        
        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 pl-2 border-l-2 border-border">
            {comment.replies.map(reply => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="mb-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center">
                  <Skeleton className="h-8 w-8 rounded-full mr-2" />
                  <div>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16 mt-1" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-[80%]" />
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="comments-section">
      {/* New comment form */}
      <form onSubmit={handleAddComment} className="mb-6">
        <div className="space-y-2">
          <Textarea 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="min-h-[120px]"
          />
          <div className="flex justify-end">
            <Button 
              type="submit" 
              className="flex items-center"
              disabled={!newComment.trim()}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Add Comment
            </Button>
          </div>
        </div>
      </form>
      
      {/* Comments list */}
      {threadedComments.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquareOff className="h-12 w-12 mb-2 text-muted-foreground" />
            <CardDescription className="text-lg">No comments yet</CardDescription>
            <p className="text-sm text-muted-foreground mt-1">
              Be the first to add a comment to this project.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div>
          {threadedComments.map(comment => renderComment(comment))}
        </div>
      )}
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your comment. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteComment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CommentsSection;