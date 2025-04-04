import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Reply, Check, X, Edit2, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Comment {
  id: number;
  content: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  userId: number;
  username?: string;
  targetType: string;
  targetId: number;
  parentCommentId: number | null;
  isResolved: boolean;
  isEdited: boolean;
  replies?: Comment[];
}

interface CommentsSectionProps {
  targetType: string;
  targetId: number;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ targetType, targetId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch comments
  const {
    data: comments = [],
    isLoading,
    refetch: refetchComments
  } = useQuery({
    queryKey: ['/api/comments', targetType, targetId],
    queryFn: async () => {
      const response = await apiRequest(`/api/comments?targetType=${targetType}&targetId=${targetId}`);
      const data = await response.json();
      return organizeComments(data);
    },
    meta: {
      errorMessage: 'Failed to load comments'
    }
  });
  
  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (commentData: {
      content: string;
      targetType: string;
      targetId: number;
      parentCommentId?: number | null;
    }) => {
      const response = await apiRequest('/api/comments', {
        method: 'POST',
        body: JSON.stringify(commentData),
        headers: { 'Content-Type': 'application/json' }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/comments', targetType, targetId] });
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
    }
  });
  
  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: number; content: string }) => {
      const response = await apiRequest(`/api/comments/${commentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ content }),
        headers: { 'Content-Type': 'application/json' }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/comments', targetType, targetId] });
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
    }
  });
  
  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const response = await apiRequest(`/api/comments/${commentId}`, {
        method: 'DELETE'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/comments', targetType, targetId] });
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
    }
  });
  
  // Toggle resolved status mutation
  const toggleResolvedMutation = useMutation({
    mutationFn: async ({ commentId, isResolved }: { commentId: number; isResolved: boolean }) => {
      const response = await apiRequest(`/api/comments/${commentId}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({ isResolved }),
        headers: { 'Content-Type': 'application/json' }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/comments', targetType, targetId] });
      toast({
        title: 'Comment status updated',
        description: 'The comment status has been updated successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error updating status',
        description: 'There was a problem updating the comment status. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  // Organize comments into a tree structure with parent and child comments (replies)
  const organizeComments = (flatComments: Comment[]): Comment[] => {
    const commentMap: Record<number, Comment> = {};
    const rootComments: Comment[] = [];
    
    // First pass: Create a map of all comments by ID and initialize replies array
    flatComments.forEach(comment => {
      comment.replies = [];
      commentMap[comment.id] = comment;
    });
    
    // Second pass: Organize comments into a tree structure
    flatComments.forEach(comment => {
      if (comment.parentCommentId) {
        // This is a reply, add it to its parent's replies array
        if (commentMap[comment.parentCommentId]) {
          commentMap[comment.parentCommentId].replies!.push(comment);
        }
      } else {
        // This is a root comment
        rootComments.push(comment);
      }
    });
    
    return rootComments;
  };
  
  // Handle adding a new comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      await addCommentMutation.mutateAsync({
        content: newComment,
        targetType,
        targetId
      });
      setNewComment('');
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle adding a reply to a comment
  const handleAddReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || replyingToId === null) return;
    
    setIsSubmitting(true);
    try {
      await addCommentMutation.mutateAsync({
        content: replyContent,
        targetType,
        targetId,
        parentCommentId: replyingToId
      });
      setReplyContent('');
      setReplyingToId(null);
    } catch (error) {
      console.error("Error adding reply:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle updating a comment
  const handleUpdateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim() || editingCommentId === null) return;
    
    setIsSubmitting(true);
    try {
      await updateCommentMutation.mutateAsync({
        commentId: editingCommentId,
        content: editContent
      });
      setEditContent('');
      setEditingCommentId(null);
    } catch (error) {
      console.error("Error updating comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle deleting a comment
  const handleDeleteComment = async (commentId: number) => {
    setIsSubmitting(true);
    try {
      await deleteCommentMutation.mutateAsync(commentId);
    } catch (error) {
      console.error("Error deleting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle toggling resolved status
  const handleToggleResolved = async (commentId: number, currentStatus: boolean) => {
    try {
      await toggleResolvedMutation.mutateAsync({
        commentId,
        isResolved: !currentStatus
      });
    } catch (error) {
      console.error("Error toggling resolved status:", error);
    }
  };
  
  // Start editing a comment
  const startEditing = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };
  
  // Cancel editing
  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditContent('');
  };
  
  // Start replying to a comment
  const startReplying = (commentId: number) => {
    setReplyingToId(commentId);
    setReplyContent('');
  };
  
  // Cancel replying
  const cancelReplying = () => {
    setReplyingToId(null);
    setReplyContent('');
  };
  
  // Get user's initials for avatar fallback
  const getUserInitials = (username?: string): string => {
    if (!username) return 'U';
    return username
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Render a single comment
  const renderComment = (comment: Comment, isReply = false) => {
    const isEditing = editingCommentId === comment.id;
    const isReplying = replyingToId === comment.id;
    const canModify = user && user.id === comment.userId;
    
    return (
      <div key={comment.id} className={`mb-4 ${isReply ? 'ml-10' : ''}`}>
        <div className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{getUserInitials(comment.username)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {comment.username || 'User'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
                {comment.isEdited && (
                  <span className="text-xs text-muted-foreground">(edited)</span>
                )}
                {comment.isResolved && (
                  <Badge variant="outline" className="ml-2 text-xs bg-green-100 text-green-800 hover:bg-green-100">
                    <Check className="mr-1 h-3 w-3" />
                    Resolved
                  </Badge>
                )}
              </div>
              
              {/* Comment actions */}
              <div className="flex gap-1">
                {canModify && !isEditing && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => startEditing(comment)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this comment? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteComment(comment.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
                
                {!isReply && !isEditing && !isReplying && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => startReplying(comment.id)}
                  >
                    <Reply className="h-3 w-3" />
                  </Button>
                )}
                
                {canModify && !isEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleToggleResolved(comment.id, comment.isResolved)}
                  >
                    {comment.isResolved ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                  </Button>
                )}
              </div>
            </div>
            
            {isEditing ? (
              <form onSubmit={handleUpdateComment} className="mt-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[100px]"
                  placeholder="Edit your comment..."
                />
                <div className="flex justify-end gap-2 mt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={cancelEditing}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    size="sm"
                    disabled={isSubmitting || !editContent.trim()}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            ) : (
              <div className="mt-1 text-sm whitespace-pre-wrap">{comment.content}</div>
            )}
            
            {/* Reply form */}
            {isReplying && (
              <form onSubmit={handleAddReply} className="mt-3">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[100px]"
                  placeholder="Write your reply..."
                />
                <div className="flex justify-end gap-2 mt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={cancelReplying}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    size="sm"
                    disabled={isSubmitting || !replyContent.trim()}
                  >
                    Reply
                  </Button>
                </div>
              </form>
            )}
            
            {/* Render replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3">
                {comment.replies.map(reply => renderComment(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h3 className="text-lg font-medium">Comments</h3>
        <span className="text-sm text-muted-foreground">
          ({comments.length})
        </span>
      </div>
      
      <Separator />
      
      {/* Add new comment form */}
      <form onSubmit={handleAddComment} className="space-y-3">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[100px]"
          placeholder="Add a comment..."
        />
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isSubmitting || !newComment.trim()}
          >
            Add Comment
          </Button>
        </div>
      </form>
      
      <Separator />
      
      {/* Comment list */}
      {isLoading ? (
        <div className="flex flex-col gap-4 py-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="h-8 w-8 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No comments yet. Be the first to add a comment!</p>
        </div>
      ) : (
        <div className="space-y-4 py-4">
          {comments.map(comment => renderComment(comment))}
        </div>
      )}
    </div>
  );
};

export default CommentsSection;