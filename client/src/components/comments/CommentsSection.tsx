import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Send,
  MoreVertical,
  Edit,
  Trash2,
  Reply,
  CheckCircle2,
  XCircle,
  MessageSquareOff,
  Loader2,
  ReplyAll,
  PencilLine,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
  targetType: string;
  targetId: number;
  parentCommentId: number | null;
  isResolved: boolean;
  isEdited: boolean;
  user?: {
    id: number;
    name: string | null;
    username: string;
  };
  replies?: Comment[];
}

interface CommentsSectionProps {
  targetType: string;
  targetId: number;
  canComment: boolean;
  maxHeight?: string;
}

export default function CommentsSection({
  targetType,
  targetId,
  canComment,
  maxHeight = '500px',
}: CommentsSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // For editing comments
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  
  // For deleting comments
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // For replies
  const [replyToId, setReplyToId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  
  // For resolving comments
  const [isResolvingComment, setIsResolvingComment] = useState(false);
  
  // Helper function to organize comments into threads
  const organizeCommentsIntoThreads = (commentList: Comment[]) => {
    const threads: Comment[] = [];
    const commentMap = new Map<number, Comment>();
    
    // First pass: create a map of all comments by their ID
    commentList.forEach(comment => {
      const commentCopy = { ...comment, replies: [] };
      commentMap.set(comment.id, commentCopy);
    });
    
    // Second pass: organize into threads
    commentList.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id);
      if (!commentWithReplies) return;
      
      if (comment.parentCommentId === null) {
        threads.push(commentWithReplies);
      } else {
        const parentComment = commentMap.get(comment.parentCommentId);
        if (parentComment && parentComment.replies) {
          parentComment.replies.push(commentWithReplies);
        }
      }
    });
    
    // Sort threads by created date (newest first for parent comments)
    threads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Sort replies by created date (oldest first for replies)
    threads.forEach(thread => {
      if (thread.replies) {
        thread.replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
    });
    
    return threads;
  };
  
  // Fetch comments
  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/comments/${targetType}/${targetId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      
      const data = await response.json();
      const organizedComments = organizeCommentsIntoThreads(data);
      setComments(organizedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load comments',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add a new comment
  const addComment = async () => {
    if (!user || !newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/comments/${targetType}/${targetId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment,
          parentCommentId: null,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add comment');
      }
      
      setNewComment('');
      fetchComments(); // Refresh comments
      
      toast({
        title: 'Comment added',
        description: 'Your comment has been added successfully',
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Add a reply
  const addReply = async () => {
    if (!user || !replyContent.trim() || replyToId === null) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/comments/${targetType}/${targetId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyContent,
          parentCommentId: replyToId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add reply');
      }
      
      setReplyContent('');
      setReplyToId(null);
      fetchComments(); // Refresh comments
      
      toast({
        title: 'Reply added',
        description: 'Your reply has been added successfully',
      });
    } catch (error) {
      console.error('Error adding reply:', error);
      toast({
        title: 'Error',
        description: 'Failed to add reply',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Edit a comment
  const startEditingComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };
  
  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditContent('');
  };
  
  const saveEditedComment = async (commentId: number) => {
    if (!editContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editContent,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update comment');
      }
      
      setEditingCommentId(null);
      setEditContent('');
      fetchComments(); // Refresh comments
      
      toast({
        title: 'Comment updated',
        description: 'Your comment has been updated successfully',
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to update comment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Delete a comment
  const confirmDeleteComment = (commentId: number) => {
    setCommentToDelete(commentId);
    setShowDeleteConfirm(true);
  };
  
  const deleteComment = async () => {
    if (commentToDelete === null) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/comments/${commentToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }
      
      setShowDeleteConfirm(false);
      setCommentToDelete(null);
      fetchComments(); // Refresh comments
      
      toast({
        title: 'Comment deleted',
        description: 'Comment has been deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete comment',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Toggle comment resolution
  const toggleCommentResolution = async (commentId: number, currentStatus: boolean) => {
    setIsResolvingComment(true);
    try {
      const response = await fetch(`/api/comments/${commentId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isResolved: !currentStatus,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update comment resolution status');
      }
      
      fetchComments(); // Refresh comments
      
      toast({
        title: !currentStatus ? 'Comment resolved' : 'Comment reopened',
        description: !currentStatus 
          ? 'The comment has been marked as resolved' 
          : 'The comment has been reopened',
      });
    } catch (error) {
      console.error('Error updating comment resolution:', error);
      toast({
        title: 'Error',
        description: 'Failed to update comment resolution status',
        variant: 'destructive',
      });
    } finally {
      setIsResolvingComment(false);
    }
  };
  
  // Load comments on mount
  useEffect(() => {
    fetchComments();
  }, [targetType, targetId]);
  
  // Focus on reply input when replying
  useEffect(() => {
    if (replyToId !== null && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [replyToId]);
  
  // Get initials for avatar
  const getInitials = (name?: string | null): string => {
    if (!name) return '?';
    
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };
  
  // Render a comment with its replies
  const renderComment = (comment: Comment, isReply = false) => {
    const isEditing = editingCommentId === comment.id;
    const isCurrentUser = user && comment.userId === user.id;
    const hasReplies = comment.replies && comment.replies.length > 0;
    
    return (
      <div 
        key={comment.id} 
        className={cn(
          "comment group mt-4 first:mt-0", 
          isReply && "ml-8 border-l-2 border-muted pl-4",
          comment.isResolved && "opacity-60"
        )}
      >
        <div className="flex gap-3">
          {/* Avatar */}
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
          
          {/* Comment content */}
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center">
              <div className="flex items-center gap-2">
                <div className="font-semibold text-sm">
                  {comment.user?.name || comment.user?.username || `User ${comment.userId}`}
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </span>
                {comment.isEdited && (
                  <span className="text-xs text-muted-foreground italic">(edited)</span>
                )}
                {comment.isResolved && (
                  <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Resolved
                  </Badge>
                )}
              </div>
              
              {/* Actions menu */}
              <div className="ml-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">More options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[160px]">
                    <DropdownMenuItem onClick={() => setReplyToId(comment.id)}>
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </DropdownMenuItem>
                    
                    {isCurrentUser && (
                      <>
                        <DropdownMenuItem onClick={() => startEditingComment(comment)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => confirmDeleteComment(comment.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={() => toggleCommentResolution(comment.id, comment.isResolved)}>
                      {comment.isResolved ? (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Reopen
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Resolve
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* Comment text content */}
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[80px]"
                  placeholder="Edit your comment..."
                />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={cancelEditing}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => saveEditedComment(comment.id)}
                    disabled={isSubmitting || !editContent.trim()}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <PencilLine className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm leading-relaxed">
                {comment.content.split('\n').map((line, index) => (
                  <React.Fragment key={index}>
                    {line}
                    {index < comment.content.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
            )}
            
            {/* Reply button */}
            {!isEditing && !isReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setReplyToId(comment.id)}
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}
            
            {/* Reply input area */}
            {replyToId === comment.id && (
              <div className="mt-3 flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{user ? getInitials(user.name) : '?'}</AvatarFallback>
                  {user?.name && (
                    <AvatarImage
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                        user.name
                      )}&background=random`}
                      alt={user.name}
                    />
                  )}
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea
                    ref={replyInputRef}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    className="min-h-[80px]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setReplyToId(null);
                        setReplyContent('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={addReply}
                      disabled={isSubmitting || !replyContent.trim()}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Replying...
                        </>
                      ) : (
                        <>
                          <ReplyAll className="mr-2 h-4 w-4" />
                          Reply
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Render replies */}
        {hasReplies && (
          <div className="replies mt-2">
            {comment.replies!.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Comments
        </CardTitle>
        <CardDescription>
          {comments.length} comment{comments.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      
      <CardContent className={`space-y-4 ${maxHeight ? `overflow-y-auto max-h-[${maxHeight}]` : ''}`}>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto rounded-full bg-muted w-12 h-12 flex items-center justify-center mb-3">
              <MessageSquareOff className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No comments yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Be the first to share your thoughts.
            </p>
          </div>
        ) : (
          <div className="space-y-6 divide-y">
            {comments.map((comment) => renderComment(comment))}
          </div>
        )}
      </CardContent>
      
      {canComment && user && (
        <>
          <Separator />
          <CardFooter className="pt-4">
            <div className="flex gap-3 w-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                {user.name && (
                  <AvatarImage
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user.name
                    )}&background=random`}
                    alt={user.name}
                  />
                )}
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="min-h-[80px]"
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={addComment}
                    disabled={isSubmitting || !newComment.trim()}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Post Comment
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardFooter>
        </>
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteComment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
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
    </Card>
  );
}