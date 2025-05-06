import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfrastructureLifecycleStoryTeller } from './InfrastructureLifecycleStoryTeller';
import AIStorytellerForm from './AIStorytellerForm';
import StoryDisplay from './StoryDisplay';
import { StoryInsight } from '@/hooks/useStorytellingAPI';
import { Building, Brain, AlertTriangle } from 'lucide-react';

export function EnhancedStoryTeller() {
  const [generatedStory, setGeneratedStory] = useState<StoryInsight | null>(null);
  const [hasAnthropicKey, setHasAnthropicKey] = useState<boolean | null>(null);
  
  // Check if Anthropic API key is available
  React.useEffect(() => {
    async function checkApiKey() {
      try {
        const response = await fetch('/api/settings/ANTHROPIC_API_KEY_STATUS');
        const data = await response.json();
        setHasAnthropicKey(data.value === 'available');
      } catch (error) {
        console.error('Error checking API key status:', error);
        setHasAnthropicKey(false);
      }
    }
    
    checkApiKey();
  }, []);
  
  const handleStoryGenerated = (story: StoryInsight) => {
    setGeneratedStory(story);
  };
  
  return (
    <div className="container mx-auto py-4">
      <Tabs defaultValue="lifecycle" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-6">
          <TabsTrigger value="lifecycle" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span>Lifecycle Visualization</span>
          </TabsTrigger>
          <TabsTrigger value="ai-storyteller" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span>AI Storyteller</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="lifecycle" className="mt-0">
          <InfrastructureLifecycleStoryTeller />
        </TabsContent>
        
        <TabsContent value="ai-storyteller" className="mt-0">
          {hasAnthropicKey === false && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Anthropic API key is not configured. The AI storyteller functionality requires a valid API key to work.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <AIStorytellerForm onStoryGenerated={handleStoryGenerated} />
            </div>
            
            <div>
              {generatedStory ? (
                <StoryDisplay story={generatedStory} />
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border border-dashed p-8">
                  <div className="text-center max-w-md">
                    <Brain className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Generate Your First AI Story</h3>
                    <p className="text-gray-500">
                      Use the form to create an AI-generated narrative about your infrastructure data.
                      Select a story type and customize your request to get detailed insights.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EnhancedStoryTeller;