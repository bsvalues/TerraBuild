import React, { useState } from "react";
import { useUsers } from "@/hooks/use-users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge-custom";
import { Loader2, MoreHorizontal, Check, X } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { User, insertUserSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Extended schema for the create user form
const createUserSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

// Filter bar component
const UserFilterBar = ({ filterText, setFilterText }: { filterText: string, setFilterText: (value: string) => void }) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-2">
        <Input 
          placeholder="Filter users..." 
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-64"
        />
      </div>
      <Button id="add-user-trigger" variant="default">
        <i className="ri-user-add-line mr-2"></i>
        Add User
      </Button>
    </div>
  );
};

// Create user form component
const CreateUserForm = ({ onClose }: { onClose: () => void }) => {
  const { toast } = useToast();
  const { createUserMutation } = useUsers();
  
  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      name: "",
      role: "user",
      isActive: true
    },
  });

  function onSubmit(values: CreateUserFormValues) {
    // Remove confirmPassword before sending to the API
    const { confirmPassword, ...userData } = values;
    
    createUserMutation.mutate(userData, {
      onSuccess: () => {
        toast({
          title: "User created",
          description: `User ${values.username} has been created successfully.`,
        });
        onClose();
        form.reset();
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to create user",
          variant: "destructive",
        });
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="john.doe" {...field} />
              </FormControl>
              <FormDescription>
                This will be used for login
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormDescription>
                Full name of the user
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="user">Standard User</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Access level and permissions
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Active Status
                </FormLabel>
                <FormDescription>
                  Enable or disable user account
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createUserMutation.isPending}
          >
            {createUserMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create User
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

// Main user management component
export default function UserManagement() {
  const [filterText, setFilterText] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const { users, isLoading, error, updateUserMutation, deleteUserMutation } = useUsers();
  const { toast } = useToast();

  // Filter users based on search text
  const filteredUsers = users?.filter(user => {
    const searchText = filterText.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchText) ||
      (user.name && user.name.toLowerCase().includes(searchText)) ||
      user.role.toLowerCase().includes(searchText)
    );
  });

  const handleToggleStatus = (user: User) => {
    updateUserMutation.mutate(
      { id: user.id, isActive: !user.isActive },
      {
        onSuccess: () => {
          toast({
            title: "Status updated",
            description: `User ${user.username} has been ${!user.isActive ? "activated" : "deactivated"}.`,
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message || "Failed to update user status",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleUpdateRole = (user: User, newRole: string) => {
    updateUserMutation.mutate(
      { id: user.id, role: newRole },
      {
        onSuccess: () => {
          toast({
            title: "Role updated",
            description: `${user.username}'s role has been updated to ${newRole}.`,
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message || "Failed to update user role",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleDeleteUser = (user: User) => {
    if (window.confirm(`Are you sure you want to delete user ${user.username}? This action cannot be undone.`)) {
      deleteUserMutation.mutate(user.id, {
        onSuccess: () => {
          toast({
            title: "User deleted",
            description: `User ${user.username} has been permanently deleted.`,
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message || "Failed to delete user",
            variant: "destructive",
          });
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800">
        <p className="font-medium">Error loading users</p>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogTrigger asChild>
          <span className="hidden">Add User</span>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with specific roles and permissions.
            </DialogDescription>
          </DialogHeader>
          <CreateUserForm onClose={() => setIsAddUserOpen(false)} />
        </DialogContent>
      </Dialog>

      <UserFilterBar filterText={filterText} setFilterText={setFilterText} />
      
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers && filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-medium">{user.username}</div>
                      {user.name && <div className="text-sm text-neutral-500">{user.name}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      user.role === "admin" ? "default" : 
                      user.role === "manager" ? "outline" : "secondary"
                    }>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.isActive ? (
                      <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-200">
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200">
                        <X className="h-3.5 w-3.5 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(user)}
                          disabled={updateUserMutation.isPending}
                        >
                          {user.isActive ? "Deactivate" : "Activate"} User
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUpdateRole(user, "admin")}
                          disabled={user.role === "admin" || updateUserMutation.isPending}
                        >
                          Change to Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUpdateRole(user, "manager")}
                          disabled={user.role === "manager" || updateUserMutation.isPending}
                        >
                          Change to Manager
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUpdateRole(user, "user")}
                          disabled={user.role === "user" || updateUserMutation.isPending}
                        >
                          Change to User
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteUser(user)}
                          disabled={deleteUserMutation.isPending}
                          className="text-red-600 focus:text-red-600"
                        >
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  {filterText ? (
                    <div className="text-neutral-500">
                      No users found matching "{filterText}"
                    </div>
                  ) : (
                    <div className="text-neutral-500">
                      No users available. Click "Add User" to create one.
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}