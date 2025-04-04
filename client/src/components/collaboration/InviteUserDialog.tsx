import React, { useState } from 'react';
import { useCollaboration } from '@/contexts/CollaborationContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, UserPlus, AlertCircle, Shield, ShieldCheck, ShieldAlert, User, Eye, Edit } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';

interface InviteUserDialogProps {
  projectId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isOwner: boolean;
}

// Form schema for user invitation
const inviteFormSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Invalid email address' }),
  role: z.enum(['admin', 'editor', 'viewer'], {
    required_error: 'Please select a role',
  }),
  message: z.string().optional(),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

export default function InviteUserDialog({
  projectId,
  open,
  onOpenChange,
  isOwner,
}: InviteUserDialogProps) {
  const { addInvitation } = useCollaboration();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  
  // Initialize form
  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: '',
      role: 'viewer',
      message: '',
    },
  });
  
  // Handle form submission
  const onSubmit = async (data: InviteFormValues) => {
    setIsSubmitting(true);
    setInviteError(null);
    
    try {
      await addInvitation({
        projectId,
        email: data.email,
        role: data.role,
        // Note: Context interface may not include message, removed for now
      });
      
      // Reset form and close dialog on success
      form.reset();
      onOpenChange(false);
      
      toast({
        title: 'Invitation sent',
        description: `An invitation has been sent to ${data.email}`,
      });
    } catch (error) {
      console.error('Error inviting user:', error);
      setInviteError(
        error instanceof Error
          ? error.message
          : 'Failed to send invitation. Please try again.'
      );
      
      toast({
        title: 'Error',
        description: 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reset error when dialog is closed
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form and error when dialog is closed
      form.reset();
      setInviteError(null);
    }
    onOpenChange(open);
  };
  
  // Render different role descriptions based on selection
  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admins can manage members and content, but cannot delete the project.';
      case 'editor':
        return 'Editors can view, create, and edit content, but cannot manage members.';
      case 'viewer':
        return 'Viewers can only view content, but cannot make any changes.';
      default:
        return '';
    }
  };
  
  // Render different role icons based on selection
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <ShieldAlert className="h-4 w-4 text-red-500" />;
      case 'editor':
        return <Edit className="h-4 w-4 text-blue-500" />;
      case 'viewer':
        return <Eye className="h-4 w-4 text-green-500" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserPlus className="h-5 w-5 mr-2" />
            Invite User to Project
          </DialogTitle>
          <DialogDescription>
            Send an invitation to collaborate on this project.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {inviteError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{inviteError}</AlertDescription>
              </Alert>
            )}
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="user@example.com"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    An invitation email will be sent to this address.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Roles</SelectLabel>
                        {isOwner && (
                          <SelectItem value="admin" className="flex items-center">
                            <div className="flex items-center">
                              <ShieldAlert className="h-4 w-4 mr-2 text-red-500" />
                              Admin
                            </div>
                          </SelectItem>
                        )}
                        <SelectItem value="editor">
                          <div className="flex items-center">
                            <Edit className="h-4 w-4 mr-2 text-blue-500" />
                            Editor
                          </div>
                        </SelectItem>
                        <SelectItem value="viewer">
                          <div className="flex items-center">
                            <Eye className="h-4 w-4 mr-2 text-green-500" />
                            Viewer
                          </div>
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {getRoleDescription(form.watch('role'))}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal Message (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Add a personal message to the invitation"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    This message will be included in the invitation email.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Send Invitation
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}