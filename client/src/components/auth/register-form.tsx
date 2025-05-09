import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional().or(z.literal('')),
});

type RegisterValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
  onLoginClick?: () => void;
}

export default function RegisterForm({ onSuccess, onLoginClick }: RegisterFormProps) {
  const { registerMutation } = useAuth();
  
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      password: '',
      email: '',
      fullName: '',
    },
  });

  const onSubmit = (values: RegisterValues) => {
    registerMutation.mutate(values, {
      onSuccess: () => {
        if (onSuccess) onSuccess();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-blue-200">Username</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Choose a username" 
                  {...field} 
                  className="bg-blue-950/50 border-blue-800 text-blue-100 focus-visible:ring-cyan-500 focus-visible:border-cyan-500"
                />
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-blue-200">Full Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter your full name" 
                  {...field} 
                  className="bg-blue-950/50 border-blue-800 text-blue-100 focus-visible:ring-cyan-500 focus-visible:border-cyan-500"
                />
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-blue-200">Email</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="Enter your email" 
                  {...field} 
                  className="bg-blue-950/50 border-blue-800 text-blue-100 focus-visible:ring-cyan-500 focus-visible:border-cyan-500"
                />
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-blue-200">Password</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder="Create a password" 
                  {...field} 
                  className="bg-blue-950/50 border-blue-800 text-blue-100 focus-visible:ring-cyan-500 focus-visible:border-cyan-500"
                />
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />
        
        <div className="flex flex-col space-y-4 pt-2">
          <Button 
            type="submit" 
            disabled={registerMutation.isPending}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 border-0"
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
          
          <div className="text-center">
            <Button 
              variant="link" 
              type="button" 
              onClick={onLoginClick}
              className="text-cyan-400 hover:text-cyan-300"
            >
              Already have an account? Sign in
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}