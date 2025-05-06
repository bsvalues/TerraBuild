import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { CalendarIcon, InfoIcon, LucideWand2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { StoryType, useGenerateStory, useStoryTypes } from '@/hooks/useStorytellingAPI';
import { Skeleton } from '@/components/ui/skeleton';

// Define the form schema using zod
const formSchema = z.object({
  storyType: z.nativeEnum(StoryType),
  buildingTypes: z.array(z.string()).optional(),
  regions: z.array(z.string()).optional(),
  propertyIds: z.array(z.number()).optional(),
  timeframe: z.object({
    start: z.date(),
    end: z.date()
  }).optional(),
  customPrompt: z.string().optional(),
  includeCharts: z.boolean().default(true),
  includeTables: z.boolean().default(true)
});

interface AIStorytellerFormProps {
  onStoryGenerated: (story: any) => void;
}

export function AIStorytellerForm({ onStoryGenerated }: AIStorytellerFormProps) {
  const { data: storyTypes, isLoading: isLoadingTypes } = useStoryTypes();
  const { mutate: generateStory, isPending: isGenerating, error } = useGenerateStory();
  
  const [fromDate, setFromDate] = useState<Date>(new Date(new Date().getFullYear() - 1, 0, 1));
  const [toDate, setToDate] = useState<Date>(new Date());
  
  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      storyType: StoryType.COST_TRENDS,
      buildingTypes: [],
      regions: [],
      propertyIds: [],
      customPrompt: '',
      includeCharts: true,
      includeTables: true
    }
  });
  
  // Submit handler
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Add timeframe if it's not already set
    if (!values.timeframe && fromDate && toDate) {
      values.timeframe = {
        start: fromDate,
        end: toDate
      };
    }
    
    // Call the mutation to generate the story
    generateStory(values, {
      onSuccess: (data) => {
        if (data.success && data.story) {
          onStoryGenerated(data.story);
        }
      }
    });
  }
  
  // Watch the form values to show/hide fields conditionally
  const watchedStoryType = form.watch('storyType');
  
  // Determine if custom prompt should be shown
  const showCustomPrompt = watchedStoryType === StoryType.CUSTOM;
  
  // Get the description for the selected story type
  const selectedTypeInfo = storyTypes?.find(type => type.type === watchedStoryType);
  
  return (
    <Card className="shadow-md border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LucideWand2 className="h-5 w-5 text-[#29B7D3]" />
          Generate Infrastructure Story
        </CardTitle>
        <CardDescription>
          Use AI to generate insights and narratives about your infrastructure data
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : 'Failed to generate story. Please try again.'}
            </AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Story Type Selection */}
            <FormField
              control={form.control}
              name="storyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Story Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoadingTypes || isGenerating}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a story type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingTypes ? (
                        <div className="p-2">
                          <Skeleton className="h-5 w-full mb-2" />
                          <Skeleton className="h-5 w-full mb-2" />
                          <Skeleton className="h-5 w-full" />
                        </div>
                      ) : (
                        storyTypes?.map((type) => (
                          <SelectItem key={type.type} value={type.type}>
                            {type.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {selectedTypeInfo && (
                    <div className="text-sm text-gray-500 mt-1">
                      {selectedTypeInfo.description}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Building Types (for several story types) */}
            {(watchedStoryType === StoryType.BUILDING_TYPE_ANALYSIS || 
              watchedStoryType === StoryType.COST_TRENDS ||
              watchedStoryType === StoryType.REGIONAL_COMPARISON) && (
              <FormField
                control={form.control}
                name="buildingTypes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Building Types (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter building types separated by commas" 
                        onChange={(e) => {
                          const values = e.target.value.split(',').map(v => v.trim()).filter(Boolean);
                          field.onChange(values);
                        }}
                        disabled={isGenerating}
                      />
                    </FormControl>
                    <div className="text-sm text-gray-500 mt-1">
                      Leave empty to analyze all building types
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* Regions (for several story types) */}
            {(watchedStoryType === StoryType.REGIONAL_COMPARISON || 
              watchedStoryType === StoryType.COST_TRENDS ||
              watchedStoryType === StoryType.BUILDING_TYPE_ANALYSIS) && (
              <FormField
                control={form.control}
                name="regions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Regions (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter regions separated by commas" 
                        onChange={(e) => {
                          const values = e.target.value.split(',').map(v => v.trim()).filter(Boolean);
                          field.onChange(values);
                        }}
                        disabled={isGenerating}
                      />
                    </FormControl>
                    <div className="text-sm text-gray-500 mt-1">
                      Leave empty to analyze all regions
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* Property IDs (for property-specific story types) */}
            {(watchedStoryType === StoryType.PROPERTY_INSIGHTS || 
              watchedStoryType === StoryType.IMPROVEMENT_ANALYSIS) && (
              <FormField
                control={form.control}
                name="propertyIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property IDs</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter property IDs separated by commas" 
                        onChange={(e) => {
                          const values = e.target.value
                            .split(',')
                            .map(v => parseInt(v.trim()))
                            .filter(v => !isNaN(v));
                          field.onChange(values);
                        }}
                        disabled={isGenerating}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* Time Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FormLabel>From Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !fromDate && "text-muted-foreground"
                      )}
                      disabled={isGenerating}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fromDate ? format(fromDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={fromDate}
                      onSelect={(date) => date && setFromDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <FormLabel>To Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !toDate && "text-muted-foreground"
                      )}
                      disabled={isGenerating}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {toDate ? format(toDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={toDate}
                      onSelect={(date) => date && setToDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            {/* Custom Prompt for Custom story type */}
            {showCustomPrompt && (
              <FormField
                control={form.control}
                name="customPrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Prompt</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter your custom prompt to guide the AI..." 
                        className="min-h-32"
                        {...field}
                        disabled={isGenerating}
                      />
                    </FormControl>
                    <div className="text-sm text-gray-500 mt-1">
                      Provide specific instructions about what aspects of the infrastructure data you want to analyze
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* Include visualization options */}
            <div className="space-y-4">
              <Separator />
              <h3 className="text-sm font-medium">Visualization Options</h3>
              
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="includeCharts"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Include Charts</FormLabel>
                        <div className="text-sm text-gray-500">
                          Generate relevant charts to visualize the data
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isGenerating}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="includeTables"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Include Tables</FormLabel>
                        <div className="text-sm text-gray-500">
                          Include detailed data tables in the generated story
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isGenerating}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {watchedStoryType === StoryType.COST_TRENDS && (
              <Alert variant="default" className="bg-blue-50 border-blue-200">
                <InfoIcon className="h-4 w-4 text-blue-500" />
                <AlertTitle>Analysis Insight</AlertTitle>
                <AlertDescription>
                  This analysis will focus on identifying patterns and trends in building costs over time, 
                  highlighting significant changes, and providing context for observed variations.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-gray-500">
                Powered by Anthropic Claude AI
              </div>
              <Badge variant="outline" className="bg-[#e6eef2] text-[#243E4D] border-none">
                AI-Generated Content
              </Badge>
            </div>
          </form>
        </Form>
      </CardContent>
      
      <CardFooter className="bg-slate-50 border-t rounded-b-lg">
        <Button 
          type="submit" 
          className="w-full"
          onClick={form.handleSubmit(onSubmit)}
          disabled={isGenerating}
        >
          {isGenerating ? "Generating Story..." : "Generate Story"}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default AIStorytellerForm;