import React, { useState, useEffect } from 'react';
import { useCollaboration } from '@/contexts/CollaborationContext';
import { useAuth } from '@/contexts/auth-context';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import {
  MessageSquare,
  Send,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  CornerDownRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface CommentSectionProps {
  targetType: string;
  targetId: number;
  currentUserId: number;
}

export default function CommentSection({
  targetType,
  targetId,
  currentUserId,
}: CommentSectionProps) {
  const { user } = useAuth();
  const {
    comments,
    isCommentsLoading,
    createComment,
    updateComment,
    deleteComment,
    resolveComment,
    refreshComments,
  } = useCollaboration();

  // State for comment actions
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deletingComment, setDeletingComment] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize comments
  useEffect(() => {
    if (targetType && targetId) {
      refreshComments(targetType, targetId);
    }
  }, [targetType, targetId, refreshComments]);

  // Submit new comment
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      await createComment({
        content: newComment,
        targetType,
        targetId,
        parentCommentId: null,
      });
      
      setNewComment('');
      toast({
        title: 'Comment added',
        description: 'Your comment has been added successfully.',
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add comment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Submit reply
  const handleSubmitReply = async () => {
    if (!replyingTo || !replyContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      await createComment({
        content: replyContent,
        targetType,
        targetId,
        parentCommentId: replyingTo,
      });
      
      setReplyingTo(null);
      setReplyContent('');
      toast({
        title: 'Reply added',
        description: 'Your reply has been added successfully.',
      });
    } catch (error) {
      console.error('Error adding reply:', error);
      toast({
        title: 'Error',
        description: 'Failed to add reply. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Submit edited comment
  const handleSubmitEdit = async () => {
    if (!editingComment || !editContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      await updateComment({
        id: editingComment,
        content: editContent,
      });
      
      setEditingComment(null);
      setEditContent('');
      toast({
        title: 'Comment updated',
        description: 'Your comment has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to update comment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Delete comment
  const handleDeleteComment = async () => {
    if (!deletingComment) return;
    
    setIsSubmitting(true);
    try {
      await deleteComment(deletingComment);
      
      setDeletingComment(null);
      toast({
        title: 'Comment deleted',
        description: 'Your comment has been deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete comment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Toggle comment resolution
  const handleToggleResolution = async (commentId: number, isResolved: boolean) => {
    try {
      await resolveComment(commentId, !isResolved);
      
      toast({
        title: isResolved ? 'Comment reopened' : 'Comment resolved',
        description: isResolved 
          ? 'The comment has been marked as unresolved.' 
          : 'The comment has been marked as resolved.',
      });
    } catch (error) {
      console.error('Error toggling comment resolution:', error);
      toast({
        title: 'Error',
        description: 'Failed to update comment status. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Helper to get initials for avatar
  const getInitials = (name: string | null | undefined): string => {
    if (!name) return '?';
    
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };
  
  // Render comment tree
  const renderComments = (parentId: number | null = null) => {
    const filteredComments = comments.filter(comment => comment.parentCommentId === parentId);
    
    if (filteredComments.length === 0 && parentId === null) {
      return (
        <div className="text-center py-8">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
          <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
        </div>
      );
    }
    
    return filteredComments.map(comment => (
      <div key={comment.id} className={`mb-6 ${comment.isResolved ? 'opacity-70' : ''}`}>
        <div className="flex gap-3 mb-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{getInitials(comment.user?.name)}</AvatarFallback>
            {comment.user?.name && (
              <AvatarImage
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  comment.user.name
                )}&background=random`}
                alt={comment.user.name}
              />
            )}
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {comment.user?.name || comment.user?.username || `User ${comment.userId}`}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
                {comment.isEdited && (
                  <span className="text-xs text-muted-foreground italic">(edited)</span>
                )}
                {comment.isResolved && (
                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-600 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Resolved
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                {(currentUserId === comment.userId || user?.role === 'admin') && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {currentUserId === comment.userId && (
                        <DropdownMenuItem 
                          onClick={() => {
                            setEditingComment(comment.id);
                            setEditContent(comment.content);
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem 
                        onClick={() => handleToggleResolution(comment.id, comment.isResolved)}
                      >
                        {comment.isResolved ? (
                          <>
                            <XCircle className="h-4 w-4 mr-2" />
                            Reopen
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Resolve
                          </>
                        )}
                      </DropdownMenuItem>
                      
                      {(currentUserId === comment.userId || user?.role === 'admin') && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setDeletingComment(comment.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
            
            {/* Comment content */}
            {editingComment === comment.id ? (
              <div className="mt-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[100px]"
                  placeholder="Edit your comment..."
                />
                <div className="flex justify-end gap-2 mt-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setEditingComment(null);
                      setEditContent('');
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSubmitEdit}
                    disabled={!editContent.trim() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-1 text-sm whitespace-pre-wrap">{comment.content}</div>
            )}
            
            {/* Reply button */}
            {!editingComment && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-7 px-2 text-xs"
                onClick={() => {
                  setReplyingTo(comment.id);
                  setReplyContent('');
                }}
              >
                <CornerDownRight className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}
            
            {/* Reply form */}
            {replyingTo === comment.id && (
              <div className="mt-2 pl-4 border-l-2 border-muted">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[80px] text-sm"
                  placeholder="Write a reply..."
                />
                <div className="flex justify-end gap-2 mt-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContent('');
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSubmitReply}
                    disabled={!replyContent.trim() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Replying...
                      </>
                    ) : (
                      'Reply'
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Nested replies */}
            {!comment.isResolved && (
              <div className="ml-4 mt-4 pl-4 border-l border-muted">
                {renderComments(comment.id)}
              </div>
            )}
          </div>
        </div>
      </div>
    ));
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Comments
        </CardTitle>
        <CardDescription>
          Discuss and collaborate on this project
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* New comment input */}
        <div className="mb-6">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px]"
            placeholder="Add a comment..."
          />
          <div className="flex justify-end mt-2">
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Post Comment
                </>
              )}
            </Button>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        {/* Comments list */}
        {isCommentsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {renderComments()}
          </div>
        )}
        
        {/* Delete confirmation dialog */}
        <AlertDialog 
          open={!!deletingComment} 
          onOpenChange={(open) => !open && setDeletingComment(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Comment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this comment? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteComment}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}