import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import {
  Check,
  Clock,
  Edit,
  MessageCircle,
  Reply,
  Trash,
  X,
} from 'lucide-react';

interface Comment {
  id: number;
  content: string;
  userId: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  isResolved: boolean;
  isEdited: boolean;
  parentCommentId: number | null;
  user?: {
    id: number;
    username: string;
    name: string | null;
  };
  replies?: Comment[];
}

interface CommentsSectionProps {
  targetType: string;
  targetId: number;
  title?: string;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({
  targetType,
  targetId,
  title = 'Comments',
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Query keys
  const commentsQueryKey = [`/api/comments/${targetType}/${targetId}`];
  
  // Fetch comments
  const {
    data: commentsData = [],
    isLoading: isLoadingComments,
    refetch: refetchComments,
  } = useQuery({
    queryKey: commentsQueryKey,
    queryFn: async () => {
      const response = await apiRequest(`/api/comments/${targetType}/${targetId}`);
      return response as Comment[];
    },
    meta: {
      errorMessage: 'Failed to load comments',
    },
  });
  
  // Organize comments into threads
  const organizeComments = (flatComments: Comment[]): Comment[] => {
    const topLevelComments: Comment[] = [];
    const commentMap = new Map<number, Comment>();
    
    // First pass: create a map of all comments by id
    flatComments.forEach(comment => {
      // Clone comment to avoid mutating the original
      const commentCopy = { ...comment, replies: [] };
      commentMap.set(comment.id, commentCopy);
    });
    
    // Second pass: organize into hierarchy
    flatComments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id);
      if (!commentWithReplies) return;
      
      if (comment.parentCommentId === null) {
        topLevelComments.push(commentWithReplies);
      } else {
        const parent = commentMap.get(comment.parentCommentId);
        if (parent) {
          if (!parent.replies) {
            parent.replies = [];
          }
          parent.replies.push(commentWithReplies);
        }
      }
    });
    
    return topLevelComments;
  };
  
  const threaded = organizeComments(commentsData);
  
  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async ({ content, parentCommentId }: { content: string; parentCommentId?: number | null }) => {
      const response = await apiRequest(`/api/comments/${targetType}/${targetId}`, {
        method: 'POST',
        body: JSON.stringify({
          content,
          parentCommentId,
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentsQueryKey });
      toast({
        title: 'Comment added',
        description: 'Your comment has been added successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to add comment',
        description: 'There was an error adding your comment.',
        variant: 'destructive',
      });
    },
  });
  
  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content, isResolved }: { commentId: number; content?: string; isResolved?: boolean }) => {
      const response = await apiRequest(`/api/comments/${commentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          content,
          isResolved,
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentsQueryKey });
      toast({
        title: 'Comment updated',
        description: 'The comment has been updated successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to update comment',
        description: 'There was an error updating the comment.',
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
      queryClient.invalidateQueries({ queryKey: commentsQueryKey });
      toast({
        title: 'Comment deleted',
        description: 'The comment has been deleted successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to delete comment',
        description: 'There was an error deleting the comment.',
        variant: 'destructive',
      });
    },
  });
  
  // Handle new comment submission
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      toast({
        title: 'Empty comment',
        description: 'Please enter a comment before submitting.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createCommentMutation.mutateAsync({ content: newComment });
      setNewComment('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle reply submission
  const handleSubmitReply = async (parentId: number) => {
    if (!replyContent.trim()) {
      toast({
        title: 'Empty reply',
        description: 'Please enter a reply before submitting.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createCommentMutation.mutateAsync({
        content: replyContent,
        parentCommentId: parentId,
      });
      setReplyContent('');
      setReplyingToId(null);
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle comment update
  const handleUpdateComment = async (commentId: number) => {
    if (!editedContent.trim()) {
      toast({
        title: 'Empty comment',
        description: 'Comment cannot be empty.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await updateCommentMutation.mutateAsync({
        commentId,
        content: editedContent,
      });
      setEditingCommentId(null);
      setEditedContent('');
    } catch (error) {
      console.error('Error updating comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle toggling comment resolution
  const handleToggleResolution = async (comment: Comment) => {
    try {
      await updateCommentMutation.mutateAsync({
        commentId: comment.id,
        isResolved: !comment.isResolved,
      });
    } catch (error) {
      console.error('Error toggling resolution:', error);
    }
  };
  
  // Handle comment deletion
  const handleDeleteComment = async (commentId: number) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this comment?');
    if (!confirmDelete) return;
    
    try {
      await deleteCommentMutation.mutateAsync(commentId);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };
  
  // Start editing a comment
  const startEditing = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditedContent(comment.content);
  };
  
  // Cancel editing
  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditedContent('');
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
  
  // Check if the current user can modify a comment (edit, delete)
  const canModifyComment = (comment: Comment) => {
    return user && comment.userId === user.id;
  };
  
  // Render a single comment
  const renderComment = (comment: Comment, isReply = false) => {
    const isEditing = editingCommentId === comment.id;
    const isReplying = replyingToId === comment.id;
    
    return (
      <Card key={comment.id} className={isReply ? 'ml-8 mt-2' : 'mb-4'}>
        <CardHeader className="p-4 pb-0 flex flex-row justify-between items-start">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {comment.user?.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">
                {comment.user?.username || `User ${comment.userId}`}
              </p>
              <p className="text-xs text-muted-foreground flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {comment.isEdited && <span className="mr-1">(edited)</span>}
                {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          </div>
          
          {comment.isResolved && (
            <div className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs flex items-center">
              <Check className="h-3 w-3 mr-1" />
              Resolved
            </div>
          )}
        </CardHeader>
        
        <CardContent className="p-4">
          {isEditing ? (
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="Edit your comment..."
              className="min-h-[80px]"
            />
          ) : (
            <p className="whitespace-pre-wrap">{comment.content}</p>
          )}
        </CardContent>
        
        <CardFooter className="p-4 pt-0 flex justify-between">
          <div className="flex gap-2">
            {!isReply && !isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startReplying(comment.id)}
                disabled={isSubmitting}
                className="h-8 px-2 text-xs"
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}
            
            {canModifyComment(comment) && !isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEditing(comment)}
                  disabled={isSubmitting}
                  className="h-8 px-2 text-xs"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteComment(comment.id)}
                  disabled={isSubmitting}
                  className="h-8 px-2 text-xs text-destructive"
                >
                  <Trash className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </>
            )}
          </div>
          
          <div className="flex gap-2">
            {isEditing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelEditing}
                  disabled={isSubmitting}
                  className="h-8 px-2 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
                
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleUpdateComment(comment.id)}
                  disabled={isSubmitting}
                  className="h-8 px-2 text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Save
                </Button>
              </>
            )}
            
            {!isEditing && (
              <Button
                variant={comment.isResolved ? "outline" : "ghost"}
                size="sm"
                onClick={() => handleToggleResolution(comment)}
                disabled={isSubmitting}
                className={`h-8 px-2 text-xs ${comment.isResolved ? "text-green-600" : ""}`}
              >
                {comment.isResolved ? (
                  <>
                    <X className="h-3 w-3 mr-1" />
                    Unresolve
                  </>
                ) : (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Resolve
                  </>
                )}
              </Button>
            )}
          </div>
        </CardFooter>
        
        {isReplying && (
          <div className="p-4 border-t">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="min-h-[80px] mb-2"
            />
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={cancelReplying}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              
              <Button
                variant="default"
                size="sm"
                onClick={() => handleSubmitReply(comment.id)}
                disabled={isSubmitting || !replyContent.trim()}
              >
                {isSubmitting ? "Submitting..." : "Reply"}
              </Button>
            </div>
          </div>
        )}
        
        {comment.replies && comment.replies.length > 0 && (
          <div className="px-4 pb-4">
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </Card>
    );
  };
  
  return (
    <div className="space-y-4">
      {isLoadingComments ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Skeleton className="h-8 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* New comment form */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <h3 className="text-sm font-medium flex items-center">
                <MessageCircle className="h-4 w-4 mr-2" />
                Add a comment
              </h3>
            </CardHeader>
            
            <CardContent className="p-4">
              <form onSubmit={handleSubmitComment}>
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write your comment here..."
                  className="min-h-[100px] mb-2"
                />
                
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !newComment.trim()}
                  >
                    {isSubmitting ? "Submitting..." : "Post Comment"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <Separator />
          
          {/* Comments list */}
          <div>
            <h3 className="text-lg font-medium mb-4">{threaded.length} Comments</h3>
            
            {threaded.length === 0 ? (
              <div className="text-center py-8 border rounded-lg">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-1">No comments yet</h3>
                <p className="text-muted-foreground">
                  Be the first to comment on this {targetType}.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {threaded.map((comment) => renderComment(comment))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CommentsSection;