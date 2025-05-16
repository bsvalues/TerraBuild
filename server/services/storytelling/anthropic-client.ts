/**
 * Anthropic Client for Storytelling Service
 * 
 * This module provides an interface to generate narratives using Anthropic's Claude model.
 */

// Mock implementation that doesn't require API keys
export async function generateNarrative(prompt: string, systemPrompt: string): Promise<string> {
  console.log('Generating narrative with prompt:', prompt);
  console.log('System prompt:', systemPrompt);
  
  // For development/testing, return a predefined narrative
  // In production, this would call the Anthropic API
  return `
# Benton County Building Cost Analysis

## Executive Summary
This analysis examines the building costs across Benton County, Washington. The data shows several key patterns in construction costs that can inform planning and assessment decisions.

## Key Findings
- Construction costs have increased by an average of 7.2% annually over the past three years
- The Richland area shows the highest average cost per square foot at $215
- Commercial construction costs are approximately 15% higher than residential costs
- Newer building techniques show potential for 5-10% cost reductions

## Recommendations
1. Update assessment models to reflect regional variations
2. Consider adjustment factors for specialty construction types
3. Implement regular cost matrix updates on a quarterly basis

This narrative is based on the Benton County Cost Matrix data with high confidence.
`;
}