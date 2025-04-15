/**
 * StepGuidancePanel Component
 * 
 * Provides step-specific guidance, tips, and explanations for the Cost Estimation Wizard.
 * This panel appears alongside each step of the wizard to guide users through the estimation process.
 */

import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Building, 
  FileText, 
  HelpCircle, 
  Info as InfoIcon, 
  Lightbulb, 
  Ruler, 
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  BarChart
} from 'lucide-react';

// Wizard step enum (must match the one in CostEstimationWizard)
enum WizardStep {
  WELCOME = 0,
  BUILDING_TYPE = 1,
  BUILDING_SIZE = 2,
  QUALITY = 3,
  CONDITION = 4,
  LOCATION = 5,
  CONSTRUCTION = 6,
  DETAILS = 7,
  RESULTS = 8,
  SAVE = 9,
}

// Guidance content for each step
const STEP_GUIDANCE = {
  [WizardStep.WELCOME]: {
    title: 'Welcome to the Cost Estimation Wizard',
    icon: <InfoIcon className="h-5 w-5 text-primary" />,
    description: 'This wizard will guide you through creating a detailed building cost estimate step by step.',
    tips: [
      'Take your time to enter accurate information for the best results',
      'Hover over fields to see helpful tooltips with additional information',
      'All estimates are based on current construction cost data for your region'
    ],
    callout: 'This tool provides estimates for assessment purposes and shouldn\'t replace detailed contractor quotes for construction projects.'
  },
  [WizardStep.BUILDING_TYPE]: {
    title: 'Selecting Building Type',
    icon: <Building className="h-5 w-5 text-primary" />,
    description: 'The building type significantly impacts the base cost of construction.',
    tips: [
      'Choose the category that best matches your building\'s primary use',
      'Mixed-use buildings should use the predominant type',
      'Commercial buildings typically cost more than residential per square foot'
    ],
    callout: 'Different building types have different structural requirements, materials, and finishing standards that affect costs.'
  },
  [WizardStep.BUILDING_SIZE]: {
    title: 'Building Size & Configuration',
    icon: <Ruler className="h-5 w-5 text-primary" />,
    description: 'Accurate size information is critical for a precise cost estimate.',
    tips: [
      'Square footage should include all heated and cooled areas',
      'Multi-story buildings generally cost less per square foot than single-story',
      'Basements typically cost less per square foot than above-grade space'
    ],
    callout: 'The total building volume and complexity impact the cost - larger buildings often have economies of scale.'
  },
  [WizardStep.QUALITY]: {
    title: 'Construction Quality',
    icon: <Sparkles className="h-5 w-5 text-primary" />,
    description: 'Quality level reflects the overall grade of materials and finishes used.',
    tips: [
      'Standard quality is typical for most residential construction',
      'Higher quality levels include premium fixtures, materials, and craftsmanship',
      'Quality impacts both initial cost and long-term durability'
    ],
    callout: 'The quality level can significantly multiply the base cost - luxury construction can cost more than twice as much as economy grade.'
  },
  [WizardStep.CONDITION]: {
    title: 'Building Condition',
    icon: <CheckCircle className="h-5 w-5 text-primary" />,
    description: 'Condition affects replacement cost value for existing buildings.',
    tips: [
      'For new construction, select "Excellent"',
      'Consider systems (HVAC, electrical, plumbing) when assessing condition',
      'Poor condition indicates multiple major systems need replacement'
    ],
    callout: 'Building condition is primarily used for existing structures and helps calculate depreciated value.'
  },
  [WizardStep.LOCATION]: {
    title: 'Geographic Location',
    icon: <Eye className="h-5 w-5 text-primary" />,
    description: 'Construction costs vary significantly by region due to labor, material costs, and local regulations.',
    tips: [
      'Urban areas typically have higher construction costs than rural areas',
      'Remote locations may have higher costs due to material transportation',
      'Year built affects depreciation calculations for existing buildings'
    ],
    callout: 'Regional cost factors can vary by as much as 20% even within the same county.'
  },
  [WizardStep.CONSTRUCTION]: {
    title: 'Construction Details',
    icon: <FileText className="h-5 w-5 text-primary" />,
    description: 'Specific building components significantly impact overall cost.',
    tips: [
      'Roofing material choice can impact both initial cost and longevity',
      'Exterior finishing is a major cost factor in most buildings',
      'HVAC systems vary greatly in cost and energy efficiency'
    ],
    callout: 'Premium components like slate roofing or stone exterior can increase specific system costs by 30-50%.'
  },
  [WizardStep.DETAILS]: {
    title: 'Additional Features',
    icon: <Lightbulb className="h-5 w-5 text-primary" />,
    description: 'Special features and project complexity affect the final estimate.',
    tips: [
      'More bathrooms increase plumbing and fixture costs',
      'Fireplaces add significant cost due to chimneys and fireboxes',
      'Project complexity considers unusual shapes, details, and challenges'
    ],
    callout: 'The complexity slider helps account for unique architectural features not captured in other inputs.'
  },
  [WizardStep.RESULTS]: {
    title: 'Results Analysis',
    icon: <BarChart className="h-5 w-5 text-primary" />,
    description: 'Your estimate is broken down by major building components.',
    tips: [
      'Review the component breakdown to understand cost drivers',
      'The confidence level indicates the reliability of the estimate',
      'Compare with previous estimates to track cost changes'
    ],
    callout: 'This estimate represents typical costs for similar buildings and may vary based on specific design decisions and market conditions.'
  },
  [WizardStep.SAVE]: {
    title: 'Save Your Estimate',
    icon: <Clock className="h-5 w-5 text-primary" />,
    description: 'Save your work for future reference and analysis.',
    tips: [
      'Add a descriptive project name for easy identification',
      'Include notes about specific assumptions or considerations',
      'Saved estimates can be exported or used in property records'
    ],
    callout: 'Saved estimates will be available in your project history and can be referenced for future comparisons.'
  },
};

// Component props
interface StepGuidancePanelProps {
  currentStep: WizardStep;
}

/**
 * Step Guidance Panel Component
 */
const StepGuidancePanel: React.FC<StepGuidancePanelProps> = ({ currentStep }) => {
  const guidance = STEP_GUIDANCE[currentStep];
  
  return (
    <Card className="bg-muted/50 border-dashed h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          {guidance.icon}
          <CardTitle className="text-lg">{guidance.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <p className="text-sm text-muted-foreground">
          {guidance.description}
        </p>
        
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Helpful Tips
          </h4>
          <ul className="space-y-1.5">
            {guidance.tips.map((tip, index) => (
              <li key={index} className="text-xs flex gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="bg-accent/50 p-3 rounded-md border border-accent flex gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs">{guidance.callout}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StepGuidancePanel;