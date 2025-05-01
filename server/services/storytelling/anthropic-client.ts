import Anthropic from '@anthropic-ai/sdk';

/**
 * Get the Anthropic client instance
 * @returns Anthropic client
 * @throws Error if ANTHROPIC_API_KEY is not set
 */
export function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }
  
  return new Anthropic({
    apiKey,
  });
}

/**
 * Generate a narrative based on infrastructure data
 * @param prompt Prompt for the storytelling model
 * @param systemPrompt System context to guide the model
 * @returns Generated narrative text
 */
export async function generateNarrative(
  prompt: string,
  systemPrompt: string
): Promise<string> {
  try {
    const anthropic = getAnthropicClient();
    
    // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });
    
    // Extract the response content
    if (response.content && response.content.length > 0) {
      // Use a more type-safe approach with type checking
      const firstContent = response.content[0];
      
      if ('text' in firstContent) {
        return firstContent.text;
      }
    }
    
    return 'No narrative generated. Please try with a different request.';
  } catch (error: unknown) {
    console.error('Error generating narrative with Anthropic:', error);
    throw new Error(`Failed to generate narrative: ${error instanceof Error ? error.message : String(error)}`);
  }
}