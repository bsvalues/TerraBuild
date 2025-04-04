import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Plus } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { addDays } from 'date-fns';

// Form schema for creating a shared link
const formSchema = z.object({
  accessLevel: z.enum(['view', 'edit', 'admin'], {
    required_error: 'Please select an access level.',
  }),
  description: z.string().optional(),
  expiresAt: z.date().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SharedLinkDialogProps {
  projectId: number;
}

const SharedLinkDialog: React.FC<SharedLinkDialogProps> = ({ projectId }) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accessLevel: 'view',
      description: '',
      expiresAt: addDays(new Date(), 30),
    },
  });

  const createSharedLink = useMutation({
    mutationFn: async (values: FormValues) => {
      await apiRequest(`/api/shared-projects/${projectId}/links`, {
        method: 'POST',
        body: JSON.stringify(values),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/shared-projects/${projectId}/links`] });
      toast({
        title: 'Success',
        description: 'Shared link created successfully.',
      });
      setOpen(false);
      form.reset({
        accessLevel: 'view',
        description: '',
        expiresAt: addDays(new Date(), 30),
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create shared link.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    createSharedLink.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Create Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Shared Link</DialogTitle>
          <DialogDescription>
            Create a shareable link to give others access to this project without requiring a user account.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="accessLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Level</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an access level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="view">View only</SelectItem>
                      <SelectItem value="edit">Edit</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Controls what actions the link user can perform.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="e.g., 'For client review', 'For contractor access'" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Add a note to remember what this link is for.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expires (Optional)</FormLabel>
                  <FormControl>
                    <DatePicker 
                      date={field.value || undefined} 
                      setDate={(date: Date | undefined) => field.onChange(date)}
                    />
                  </FormControl>
                  <FormDescription>
                    Link will stop working after this date. Leave blank for no expiration.
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
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createSharedLink.isPending}
              >
                {createSharedLink.isPending ? 'Creating...' : 'Create Link'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SharedLinkDialog;