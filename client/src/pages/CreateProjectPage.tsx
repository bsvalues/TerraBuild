import React from 'react';
import { useLocation } from 'wouter';
import { useCollaboration } from '@/contexts/CollaborationContext';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft } from 'lucide-react';

// Form schema
const projectFormSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'Project name must be at least 3 characters' })
    .max(100, { message: 'Project name must be less than 100 characters' }),
  description: z
    .string()
    .max(500, { message: 'Description must be less than 500 characters' })
    .optional(),
  isPublic: z.boolean().default(false),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

const CreateProjectPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { createProject, isCreatingProject } = useCollaboration();

  // Default values for the form
  const defaultValues: Partial<ProjectFormValues> = {
    name: '',
    description: '',
    isPublic: false,
  };

  // Initialize form
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  // Handle form submission
  const onSubmit = async (data: ProjectFormValues) => {
    try {
      const newProject = await createProject({
        name: data.name,
        description: data.description || null,
        isPublic: data.isPublic,
      });
      
      toast({
        title: 'Project created',
        description: 'Your project has been created successfully',
      });
      
      // Navigate to the new project page
      setLocation(`/shared-projects/${newProject.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to create project',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/shared-projects')}
          className="p-0 h-auto mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Projects
        </Button>
        
        <h1 className="text-3xl font-bold tracking-tight">Create a New Project</h1>
        <p className="text-muted-foreground mt-1">
          Create a project to collaborate with your team
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>
            Provide basic information about your project
          </CardDescription>
        </CardHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter project name" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Give your project a descriptive name
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter project description (optional)"
                        {...field}
                        rows={4}
                      />
                    </FormControl>
                    <FormDescription>
                      Describe what this project is about
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Make this project public</FormLabel>
                      <FormDescription>
                        Public projects can be viewed by anyone in your organization
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
            
            <CardFooter className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setLocation('/shared-projects')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreatingProject || !form.formState.isValid}
              >
                {isCreatingProject ? 'Creating...' : 'Create Project'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default CreateProjectPage;