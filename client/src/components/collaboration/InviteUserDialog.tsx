import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useCollaboration } from '@/contexts/CollaborationContext';
import { apiRequest } from '@/lib/queryClient';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { UserPlus } from 'lucide-react';

// Define the form input schema
const formInputSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(['viewer', 'editor', 'admin'], {
    required_error: 'Please select a role for the user',
  }),
});

// Define the schema that will be used after submission (with transformation)
const inviteFormSchema = formInputSchema.transform((data) => ({
  userId: parseInt(data.userId, 10),
  role: data.role
}));

// For the form itself, we need the input types
type FormInputValues = z.infer<typeof formInputSchema>;
// For the submission handler, we need the transformed types
type InviteFormValues = z.infer<typeof inviteFormSchema>;

interface InviteUserDialogProps {
  projectId: number;
  buttonLabel?: string;
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

const InviteUserDialog: React.FC<InviteUserDialogProps> = ({
  projectId,
  buttonLabel = 'Invite User',
  buttonVariant = 'default',
  buttonSize = 'default',
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<FormInputValues>({
    resolver: zodResolver(formInputSchema),
    defaultValues: {
      userId: '',
      role: 'viewer',
    },
  });

  const onSubmit = (formData: FormInputValues) => {
    setIsLoading(true);

    // Apply the transformation
    const transformedData = {
      userId: parseInt(formData.userId, 10),
      role: formData.role
    };
    
    // Check if the userId is valid after transformation
    if (isNaN(transformedData.userId)) {
      toast({
        title: 'Invalid User ID',
        description: 'Please enter a valid numeric user ID',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }
    
    try {
      // Send the invitation with the user ID
      apiRequest(`/api/shared-projects/${projectId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformedData),
      }).then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.message || 'Failed to send invitation');
          });
        }
        
        toast({
          title: 'Invitation sent',
          description: `An invitation has been sent to user ID: ${transformedData.userId}`,
        });
        
        form.reset();
        setOpen(false);
      }).catch(error => {
        console.error('Error sending invitation:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to send invitation',
          variant: 'destructive',
        });
      }).finally(() => {
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error processing invitation:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process invitation',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} size={buttonSize} className={className}>
          <UserPlus className="h-4 w-4 mr-2" />
          {buttonLabel}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite a User</DialogTitle>
          <DialogDescription>
            Send an invitation to collaborate on this project.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={(e) => {
            e.preventDefault();
            // Trigger form validation
            form.trigger().then(isValid => {
              if (isValid) {
                const formData = form.getValues();
                onSubmit(formData);
              }
            });
          }} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter user ID"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the ID of the user you want to invite.
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
                  <FormLabel>Role</FormLabel>
                  <Select
                    disabled={isLoading}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose what level of access the user will have to the project.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteUserDialog;