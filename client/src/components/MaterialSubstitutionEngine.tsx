/**
 * Material Substitution Engine Component
 * 
 * This component provides intelligent material substitution recommendations to optimize
 * costs while maintaining quality. It uses a combination of AI and rule-based approaches
 * to identify cost-saving opportunities.
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Info, Check, X, Leaf, DollarSign, RefreshCw, FileBarChart } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

// Types for material recommendation
export interface MaterialSubstitution {
  id: string;
  originalMaterial: string;
  suggestedAlternative: string;
  potentialSavings: number;
  qualityImpact: 'none' | 'minor' | 'moderate' | 'significant';
  sustainabilityScore: number; // 0-100
  costReductionPercentage: number;
  availabilityScore: number; // 0-100
  reasonForRecommendation: string;
  regionalAvailability: string[];
  advantages: string[];
  disadvantages: string[];
  applicationNotes: string;
  isApproved?: boolean;
  isRejected?: boolean;
}

// Props for the component
interface MaterialSubstitutionEngineProps {
  buildingType: string;
  region: string;
  quality: string;
  currentMaterials: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    category?: string;
  }>;
  onRecommendationsGenerated?: (recommendations: MaterialSubstitution[]) => void;
  onSubstitutionApplied?: (
    originalMaterialId: string,
    alternativeMaterial: { name: string; unitPrice: number }
  ) => void;
}

// Quality impact colors
const qualityImpactColors = {
  'none': 'bg-green-100 text-green-800',
  'minor': 'bg-blue-100 text-blue-800',
  'moderate': 'bg-amber-100 text-amber-800',
  'significant': 'bg-red-100 text-red-800'
};

// Main component
export function MaterialSubstitutionEngine({
  buildingType,
  region,
  quality,
  currentMaterials,
  onRecommendationsGenerated,
  onSubstitutionApplied
}: MaterialSubstitutionEngineProps) {
  const [optimizationPreferences, setOptimizationPreferences] = useState({
    prioritizeCost: true,
    prioritizeSustainability: false,
    prioritizeAvailability: false,
    qualityThreshold: 'moderate',
    maximumQualityImpact: 1, // 0=none, 1=minor, 2=moderate
  });
  
  const [recommendations, setRecommendations] = useState<MaterialSubstitution[]>([]);
  const [filteredRecommendations, setFilteredRecommendations] = useState<MaterialSubstitution[]>([]);
  const [activeTab, setActiveTab] = useState('recommendations');
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<{
    totalOriginalCost: number;
    totalOptimizedCost: number;
    savingsAmount: number;
    savingsPercentage: number;
    numberOfRecommendations: number;
    averageSustainabilityScore: number;
  } | null>(null);
  
  // API key status check
  const { data: apiKeyStatus } = useQuery({
    queryKey: ['/api/settings/OPENAI_API_KEY_STATUS'],
    retry: false,
    staleTime: 60 * 60 * 1000, // 1 hour
  }) as { data?: { value: string } };
  
  // Fetch material alternatives from the backend
  const generateRecommendations = async () => {
    if (currentMaterials.length === 0) return;
    
    setLoadingRecommendations(true);
    
    try {
      // Using the mock API endpoint for now - would be a real API call in production
      // const result = await apiRequest<{ recommendations: MaterialSubstitution[] }>('/api/materials/substitution-recommendations', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     buildingType,
      //     region,
      //     quality,
      //     materials: currentMaterials,
      //     preferences: optimizationPreferences
      //   })
      // });
      
      // Mock implementation until API is fully implemented
      const mockRecommendations = generateMockRecommendations();
      setRecommendations(mockRecommendations);
      
      // Calculate optimization metrics
      const totalOriginalCost = currentMaterials.reduce((sum, material) => 
        sum + (material.quantity * material.unitPrice), 0);
      
      const optimizedMaterials = [...currentMaterials];
      mockRecommendations.forEach(rec => {
        const originalMaterial = currentMaterials.find(m => m.name === rec.originalMaterial);
        if (originalMaterial) {
          const originalCost = originalMaterial.quantity * originalMaterial.unitPrice;
          const newUnitPrice = originalMaterial.unitPrice * (1 - (rec.costReductionPercentage / 100));
          const newCost = originalMaterial.quantity * newUnitPrice;
          // Update for calculations but don't modify the original
          const idx = optimizedMaterials.findIndex(m => m.name === rec.originalMaterial);
          if (idx !== -1) {
            optimizedMaterials[idx] = { 
              ...optimizedMaterials[idx], 
              unitPrice: newUnitPrice 
            };
          }
        }
      });
      
      const totalOptimizedCost = optimizedMaterials.reduce((sum, material) => 
        sum + (material.quantity * material.unitPrice), 0);
      
      const savingsAmount = totalOriginalCost - totalOptimizedCost;
      const savingsPercentage = totalOriginalCost > 0 ? (savingsAmount / totalOriginalCost) * 100 : 0;
      
      setOptimizationResults({
        totalOriginalCost,
        totalOptimizedCost,
        savingsAmount,
        savingsPercentage,
        numberOfRecommendations: mockRecommendations.length,
        averageSustainabilityScore: mockRecommendations.reduce((sum, rec) => sum + rec.sustainabilityScore, 0) / mockRecommendations.length
      });
      
      if (onRecommendationsGenerated) {
        onRecommendationsGenerated(mockRecommendations);
      }
    } catch (error) {
      console.error('Error generating material recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };
  
  // Filters recommendations based on preferences
  useEffect(() => {
    if (recommendations.length === 0) return;
    
    // Map quality impact to numeric value for comparison
    const qualityImpactValue = {
      'none': 0,
      'minor': 1,
      'moderate': 2,
      'significant': 3
    };
    
    // Filter based on current preferences
    let filtered = recommendations.filter(rec => {
      // Filter by quality impact threshold
      if (qualityImpactValue[rec.qualityImpact] > optimizationPreferences.maximumQualityImpact) {
        return false;
      }
      
      // Additional filters based on priorities could be applied here
      return true;
    });
    
    // Sort based on priorities
    if (optimizationPreferences.prioritizeCost) {
      filtered.sort((a, b) => b.potentialSavings - a.potentialSavings);
    } else if (optimizationPreferences.prioritizeSustainability) {
      filtered.sort((a, b) => b.sustainabilityScore - a.sustainabilityScore);
    } else if (optimizationPreferences.prioritizeAvailability) {
      filtered.sort((a, b) => b.availabilityScore - a.availabilityScore);
    }
    
    setFilteredRecommendations(filtered);
  }, [recommendations, optimizationPreferences]);
  
  // Handle applying a substitution
  const applySubstitution = (recommendation: MaterialSubstitution) => {
    const originalMaterial = currentMaterials.find(m => m.name === recommendation.originalMaterial);
    
    if (originalMaterial && onSubstitutionApplied) {
      // Calculate new unit price based on cost reduction percentage
      const newUnitPrice = originalMaterial.unitPrice * (1 - (recommendation.costReductionPercentage / 100));
      
      onSubstitutionApplied(originalMaterial.id, {
        name: recommendation.suggestedAlternative,
        unitPrice: newUnitPrice
      });
      
      // Mark as approved in the UI
      setRecommendations(prev => 
        prev.map(rec => 
          rec.id === recommendation.id 
            ? { ...rec, isApproved: true, isRejected: false } 
            : rec
        )
      );
    }
  };
  
  // Handle rejecting a substitution
  const rejectSubstitution = (recommendation: MaterialSubstitution) => {
    setRecommendations(prev => 
      prev.map(rec => 
        rec.id === recommendation.id 
          ? { ...rec, isRejected: true, isApproved: false } 
          : rec
      )
    );
  };
  
  // Generate mock recommendations for demo purposes
  // This would be replaced by real API calls in production
  const generateMockRecommendations = (): MaterialSubstitution[] => {
    const materialAlternatives: Record<string, Omit<MaterialSubstitution, 'id' | 'originalMaterial'>> = {
      'Concrete': {
        suggestedAlternative: 'High-Performance Concrete with Fly Ash',
        potentialSavings: calculateSavings('Concrete', 12),
        qualityImpact: 'none',
        sustainabilityScore: 85,
        costReductionPercentage: 12,
        availabilityScore: 90,
        reasonForRecommendation: 'Reduced cement content while maintaining strength',
        regionalAvailability: ['All regions'],
        advantages: [
          'Lower carbon footprint', 
          'Increased durability', 
          'Reduced cracking'
        ],
        disadvantages: [
          'Slightly longer curing time', 
          'May require different finishing techniques'
        ],
        applicationNotes: 'Best for foundations and structural elements'
      },
      'Structural Steel': {
        suggestedAlternative: 'High-Strength Low-Alloy Steel (HSLA)',
        potentialSavings: calculateSavings('Structural Steel', 15),
        qualityImpact: 'none',
        sustainabilityScore: 75,
        costReductionPercentage: 15,
        availabilityScore: 85,
        reasonForRecommendation: 'Reduced material quantities while maintaining strength',
        regionalAvailability: ['West', 'Northeast', 'Midwest'],
        advantages: [
          'Higher strength-to-weight ratio', 
          'Reduced overall weight',
          'Good weldability'
        ],
        disadvantages: [
          'May require specialized fabrication',
          'Limited supplier options in some regions'
        ],
        applicationNotes: 'Ideal for main structural framing'
      },
      'Lumber': {
        suggestedAlternative: 'Engineered Wood Products (LVL/LSL)',
        potentialSavings: calculateSavings('Lumber', 10),
        qualityImpact: 'minor',
        sustainabilityScore: 80,
        costReductionPercentage: 10,
        availabilityScore: 95,
        reasonForRecommendation: 'More efficient use of wood fiber with better performance',
        regionalAvailability: ['All regions'],
        advantages: [
          'Greater dimensional stability',
          'Reduced waste',
          'Longer spans possible'
        ],
        disadvantages: [
          'May require different fastening methods',
          'Slightly higher upfront cost offset by reduced quantity needed'
        ],
        applicationNotes: 'Excellent for load-bearing applications and longer spans'
      },
      'Drywall': {
        suggestedAlternative: 'Lightweight Gypsum Panels',
        potentialSavings: calculateSavings('Drywall', 8),
        qualityImpact: 'none',
        sustainabilityScore: 70,
        costReductionPercentage: 8,
        availabilityScore: 90,
        reasonForRecommendation: 'Easier installation with less material',
        regionalAvailability: ['All regions'],
        advantages: [
          'Reduced weight for easier handling',
          'Less breakage during installation',
          'Faster installation time'
        ],
        disadvantages: [
          'Slightly less sound attenuation',
          'May not be suitable for high-abuse areas'
        ],
        applicationNotes: 'Best for walls and ceilings in standard commercial applications'
      },
      'HVAC': {
        suggestedAlternative: 'High-Efficiency VRF System',
        potentialSavings: calculateSavings('HVAC', 20),
        qualityImpact: 'minor',
        sustainabilityScore: 90,
        costReductionPercentage: 20,
        availabilityScore: 75,
        reasonForRecommendation: 'Lower operational costs offset higher initial investment',
        regionalAvailability: ['West', 'Northeast', 'South'],
        advantages: [
          'Significant energy savings',
          'Zone-based control',
          'Reduced ductwork requirements'
        ],
        disadvantages: [
          'Higher initial cost',
          'May require specialized installation',
          'More complex maintenance'
        ],
        applicationNotes: 'Ideal for buildings with varied occupancy patterns or multiple zones'
      },
      'Roofing': {
        suggestedAlternative: 'TPO with Enhanced Insulation',
        potentialSavings: calculateSavings('Roofing', 15),
        qualityImpact: 'none',
        sustainabilityScore: 85,
        costReductionPercentage: 15,
        availabilityScore: 85,
        reasonForRecommendation: 'Better energy performance with longer service life',
        regionalAvailability: ['All regions'],
        advantages: [
          'Enhanced energy efficiency',
          'Excellent UV resistance',
          'Reduced thermal bridging'
        ],
        disadvantages: [
          'Requires skilled installation',
          'Slightly higher material cost offset by energy savings'
        ],
        applicationNotes: 'Excellent for flat or low-slope roofs in all climate zones'
      },
      'Insulation': {
        suggestedAlternative: 'Mineral Wool Batts',
        potentialSavings: calculateSavings('Insulation', 12),
        qualityImpact: 'minor',
        sustainabilityScore: 88,
        costReductionPercentage: 12,
        availabilityScore: 80,
        reasonForRecommendation: 'Better thermal and acoustic performance with fire resistance',
        regionalAvailability: ['Northeast', 'Midwest', 'West'],
        advantages: [
          'Excellent fire resistance',
          'Superior sound attenuation',
          'Better moisture handling'
        ],
        disadvantages: [
          'Slightly higher material cost',
          'Requires proper PPE during installation'
        ],
        applicationNotes: 'Ideal for exterior walls and between floors'
      },
      'Flooring': {
        suggestedAlternative: 'Luxury Vinyl Tile (Commercial Grade)',
        potentialSavings: calculateSavings('Flooring', 18),
        qualityImpact: 'minor',
        sustainabilityScore: 75,
        costReductionPercentage: 18,
        availabilityScore: 95,
        reasonForRecommendation: 'Lower installation cost with excellent durability',
        regionalAvailability: ['All regions'],
        advantages: [
          'Lower installation cost',
          'Excellent durability',
          'Easier maintenance'
        ],
        disadvantages: [
          'Different aesthetic than traditional materials',
          'May have slight acoustic differences'
        ],
        applicationNotes: 'Best for high-traffic commercial areas'
      }
    };
    
    // Create recommendations based on current materials
    return currentMaterials
      .filter(material => material.name in materialAlternatives)
      .map(material => ({
        id: `rec-${material.id}`,
        originalMaterial: material.name,
        ...materialAlternatives[material.name]
      }));
  };
  
  // Helper to calculate potential savings amount
  function calculateSavings(materialName: string, percentReduction: number): number {
    const material = currentMaterials.find(m => m.name === materialName);
    if (!material) return 0;
    
    const originalCost = material.quantity * material.unitPrice;
    return originalCost * (percentReduction / 100);
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-[#f5fcfd]">
          <CardTitle className="text-lg text-[#243E4D] flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-[#3CAB36]" />
            Material Substitution Engine
          </CardTitle>
          <CardDescription>
            Intelligently optimize your material choices to reduce costs while maintaining quality
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-5">
          {!apiKeyStatus?.value && (
            <Alert className="mb-4 bg-amber-50">
              <Info className="h-5 w-5" />
              <AlertTitle>API Key Required</AlertTitle>
              <AlertDescription>
                The Material Substitution Engine works best with AI assistance. 
                Configure an OpenAI API key in settings for enhanced recommendations.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Optimization Preferences</h3>
              <div className="space-y-3 border rounded-md p-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="cost-priority">Prioritize Cost Savings</Label>
                    <p className="text-xs text-gray-500">Emphasize maximum cost reduction</p>
                  </div>
                  <Switch
                    id="cost-priority"
                    checked={optimizationPreferences.prioritizeCost}
                    onCheckedChange={(checked) => setOptimizationPreferences(prev => ({
                      ...prev, 
                      prioritizeCost: checked,
                      prioritizeSustainability: checked ? false : prev.prioritizeSustainability,
                      prioritizeAvailability: checked ? false : prev.prioritizeAvailability
                    }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sustainability-priority">Prioritize Sustainability</Label>
                    <p className="text-xs text-gray-500">Emphasize eco-friendly alternatives</p>
                  </div>
                  <Switch
                    id="sustainability-priority"
                    checked={optimizationPreferences.prioritizeSustainability}
                    onCheckedChange={(checked) => setOptimizationPreferences(prev => ({
                      ...prev, 
                      prioritizeSustainability: checked,
                      prioritizeCost: checked ? false : prev.prioritizeCost,
                      prioritizeAvailability: checked ? false : prev.prioritizeAvailability
                    }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="availability-priority">Prioritize Availability</Label>
                    <p className="text-xs text-gray-500">Emphasize readily available materials</p>
                  </div>
                  <Switch
                    id="availability-priority"
                    checked={optimizationPreferences.prioritizeAvailability}
                    onCheckedChange={(checked) => setOptimizationPreferences(prev => ({
                      ...prev, 
                      prioritizeAvailability: checked,
                      prioritizeCost: checked ? false : prev.prioritizeCost,
                      prioritizeSustainability: checked ? false : prev.prioritizeSustainability
                    }))}
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="quality-impact">Maximum Quality Impact</Label>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                      {['None', 'Minor', 'Moderate'][optimizationPreferences.maximumQualityImpact]}
                    </span>
                  </div>
                  <Slider
                    id="quality-impact"
                    min={0}
                    max={2}
                    step={1}
                    value={[optimizationPreferences.maximumQualityImpact]}
                    onValueChange={(value) => setOptimizationPreferences(prev => ({
                      ...prev,
                      maximumQualityImpact: value[0]
                    }))}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Strict</span>
                    <span>Balanced</span>
                    <span>Flexible</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Current Materials Summary</h3>
              <div className="border rounded-md p-3">
                <div className="text-sm mb-3">
                  <div className="flex justify-between mb-1">
                    <span>Total Materials:</span>
                    <span className="font-medium">{currentMaterials.length}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Total Material Cost:</span>
                    <span className="font-medium">${currentMaterials.reduce((sum, m) => sum + (m.quantity * m.unitPrice), 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Building Type:</span>
                    <span className="font-medium">{buildingType}</span>
                  </div>
                </div>
                
                <Separator className="my-3" />
                
                <Button 
                  onClick={generateRecommendations} 
                  disabled={loadingRecommendations || currentMaterials.length === 0}
                  className="w-full bg-[#3CAB36] hover:bg-[#359e30] text-white"
                >
                  {loadingRecommendations 
                    ? "Analyzing Materials..." 
                    : "Generate Optimization Recommendations"}
                </Button>
              </div>
              
              {optimizationResults && (
                <div className="mt-3 border rounded-md p-3 bg-[#f5fcfd]">
                  <h4 className="text-xs font-medium text-[#243E4D] mb-2">Optimization Potential</h4>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>Cost Savings:</span>
                      <span className="font-medium text-[#3CAB36]">
                        ${optimizationResults.savingsAmount.toLocaleString()} ({optimizationResults.savingsPercentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Recommendations:</span>
                      <span className="font-medium">{optimizationResults.numberOfRecommendations}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Avg. Sustainability:</span>
                      <div className="flex items-center gap-2">
                        <Progress value={optimizationResults.averageSustainabilityScore} className="w-20 h-2" />
                        <span className="font-medium">{optimizationResults.averageSustainabilityScore.toFixed(0)}/100</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {recommendations.length > 0 && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                <TabsTrigger value="details">Materials Detail</TabsTrigger>
              </TabsList>
              
              <TabsContent value="recommendations" className="pt-4">
                <div className="space-y-4">
                  {filteredRecommendations.length > 0 ? (
                    filteredRecommendations.map(recommendation => (
                      <Card key={recommendation.id} className={`
                        border-l-4 
                        ${recommendation.isApproved ? 'border-l-green-500 bg-green-50' : ''} 
                        ${recommendation.isRejected ? 'border-l-red-300 bg-gray-50' : ''}
                        ${!recommendation.isApproved && !recommendation.isRejected ? 'border-l-[#29B7D3]' : ''}
                      `}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-base">{recommendation.suggestedAlternative}</CardTitle>
                              <CardDescription>Alternative for {recommendation.originalMaterial}</CardDescription>
                            </div>
                            <Badge className={qualityImpactColors[recommendation.qualityImpact]}>
                              {recommendation.qualityImpact.charAt(0).toUpperCase() + recommendation.qualityImpact.slice(1)} Quality Impact
                            </Badge>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pb-3">
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Potential Savings:</span>
                                <span className="text-sm font-medium text-[#3CAB36]">${recommendation.potentialSavings.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Cost Reduction:</span>
                                <span className="text-sm font-medium">{recommendation.costReductionPercentage}%</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Sustainability:</span>
                                <div className="flex items-center gap-1">
                                  <Progress value={recommendation.sustainabilityScore} className="w-16 h-2" />
                                  <span className="text-sm">{recommendation.sustainabilityScore}/100</span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Availability:</span>
                                <div className="flex items-center gap-1">
                                  <Progress value={recommendation.availabilityScore} className="w-16 h-2" />
                                  <span className="text-sm">{recommendation.availabilityScore}/100</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-700 mt-2">{recommendation.reasonForRecommendation}</p>
                        </CardContent>
                        
                        <CardFooter className="flex justify-between pt-0">
                          <div className="text-sm text-gray-500">
                            Available in: {recommendation.regionalAvailability.join(', ')}
                          </div>
                          <div className="flex gap-2">
                            {!recommendation.isApproved && !recommendation.isRejected && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-red-200 text-red-600 hover:bg-red-50"
                                  onClick={() => rejectSubstitution(recommendation)}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                                <Button 
                                  size="sm"
                                  className="bg-[#3CAB36] hover:bg-[#359e30] text-white"
                                  onClick={() => applySubstitution(recommendation)}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Apply
                                </Button>
                              </>
                            )}
                            {recommendation.isApproved && (
                              <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200">
                                <Check className="h-3 w-3 mr-1" />
                                Applied
                              </Badge>
                            )}
                            {recommendation.isRejected && (
                              <Badge variant="outline" className="border-red-200 text-red-600">
                                <X className="h-3 w-3 mr-1" />
                                Rejected
                              </Badge>
                            )}
                          </div>
                        </CardFooter>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-10 border rounded-md">
                      <FileBarChart className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                      <h3 className="text-lg font-medium text-gray-500 mb-1">No Recommendations Available</h3>
                      <p className="text-sm text-gray-400 max-w-md mx-auto">
                        {recommendations.length > 0 
                          ? "No recommendations match your current preferences. Try adjusting your optimization settings."
                          : "Click 'Generate Optimization Recommendations' to analyze your materials."}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="details" className="pt-4">
                {filteredRecommendations.length > 0 ? (
                  <div className="space-y-6">
                    {filteredRecommendations.map(recommendation => (
                      <Card key={`detail-${recommendation.id}`}>
                        <CardHeader>
                          <CardTitle className="text-base">{recommendation.suggestedAlternative}</CardTitle>
                          <CardDescription>Detailed specification and comparison</CardDescription>
                        </CardHeader>
                        
                        <CardContent>
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="text-sm font-medium mb-2 flex items-center">
                                <DollarSign className="h-4 w-4 text-[#3CAB36] mr-1" />
                                Cost Analysis
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Original Material:</span>
                                  <span className="font-medium">{recommendation.originalMaterial}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Alternative Material:</span>
                                  <span className="font-medium">{recommendation.suggestedAlternative}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                  <span>Cost Reduction:</span>
                                  <span className="font-medium">{recommendation.costReductionPercentage}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Potential Savings:</span>
                                  <span className="font-medium text-[#3CAB36]">${recommendation.potentialSavings.toLocaleString()}</span>
                                </div>
                              </div>
                              
                              <h4 className="text-sm font-medium mt-4 mb-2 flex items-center">
                                <Leaf className="h-4 w-4 text-green-600 mr-1" />
                                Sustainability & Quality
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                  <span>Sustainability Score:</span>
                                  <div className="flex items-center gap-1">
                                    <Progress value={recommendation.sustainabilityScore} className="w-20 h-2" />
                                    <span>{recommendation.sustainabilityScore}/100</span>
                                  </div>
                                </div>
                                <div className="flex justify-between">
                                  <span>Quality Impact:</span>
                                  <Badge className={qualityImpactColors[recommendation.qualityImpact]}>
                                    {recommendation.qualityImpact.charAt(0).toUpperCase() + recommendation.qualityImpact.slice(1)}
                                  </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Regional Availability:</span>
                                  <span>{recommendation.regionalAvailability.join(', ')}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-medium mb-2">Pros & Cons</h4>
                              <div className="space-y-3">
                                <div>
                                  <h5 className="text-xs text-green-600 mb-1 font-medium">Advantages</h5>
                                  <ul className="list-disc list-inside text-sm space-y-1">
                                    {recommendation.advantages.map((adv, i) => (
                                      <li key={`adv-${i}`} className="text-gray-700">{adv}</li>
                                    ))}
                                  </ul>
                                </div>
                                
                                <div>
                                  <h5 className="text-xs text-amber-600 mb-1 font-medium">Considerations</h5>
                                  <ul className="list-disc list-inside text-sm space-y-1">
                                    {recommendation.disadvantages.map((dis, i) => (
                                      <li key={`dis-${i}`} className="text-gray-700">{dis}</li>
                                    ))}
                                  </ul>
                                </div>
                                
                                <div>
                                  <h5 className="text-xs text-blue-600 mb-1 font-medium">Application Notes</h5>
                                  <p className="text-sm text-gray-700">{recommendation.applicationNotes}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                        
                        <CardFooter className="border-t flex justify-end pt-3">
                          <div className="flex gap-2">
                            {!recommendation.isApproved && !recommendation.isRejected && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-red-200 text-red-600 hover:bg-red-50"
                                  onClick={() => rejectSubstitution(recommendation)}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                                <Button 
                                  size="sm"
                                  className="bg-[#3CAB36] hover:bg-[#359e30] text-white"
                                  onClick={() => applySubstitution(recommendation)}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Apply
                                </Button>
                              </>
                            )}
                            {recommendation.isApproved && (
                              <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200">
                                <Check className="h-3 w-3 mr-1" />
                                Applied
                              </Badge>
                            )}
                            {recommendation.isRejected && (
                              <Badge variant="outline" className="border-red-200 text-red-600">
                                <X className="h-3 w-3 mr-1" />
                                Rejected
                              </Badge>
                            )}
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 border rounded-md">
                    <FileBarChart className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-500 mb-1">No Material Details Available</h3>
                    <p className="text-sm text-gray-400 max-w-md mx-auto">
                      Generate recommendations first to view detailed material information.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}