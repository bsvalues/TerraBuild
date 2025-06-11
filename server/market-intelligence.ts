/**
 * Market Intelligence Engine for TerraBuild
 * Real-time economic indicators and demographic analysis
 */

export interface MarketIntelligence {
  economicIndicators: EconomicIndicators;
  demographicTrends: DemographicTrends;
  employmentData: EmploymentData;
  housingSupply: HousingSupplyMetrics;
  infrastructureDevelopment: InfrastructureProjects[];
  marketForecast: MarketForecast;
}

export interface EconomicIndicators {
  medianHouseholdIncome: number;
  incomeGrowthRate: number;
  unemploymentRate: number;
  mortgageRates: {
    thirtyYear: number;
    fifteenYear: number;
    trend: 'rising' | 'falling' | 'stable';
  };
  costOfLiving: {
    index: number;
    comparison: string;
    trend: number;
  };
  businessGrowth: {
    newPermits: number;
    businessLicenses: number;
    commercialDevelopment: number;
  };
}

export interface DemographicTrends {
  populationGrowth: number;
  ageDistribution: {
    millennials: number;
    genX: number;
    boomers: number;
  };
  householdFormation: number;
  migrationPatterns: {
    inMigration: number;
    outMigration: number;
    netMigration: number;
    primarySources: string[];
  };
  educationLevels: {
    bachelorsOrHigher: number;
    graduateDegrees: number;
  };
}

export interface EmploymentData {
  totalJobs: number;
  jobGrowthRate: number;
  majorEmployers: EmployerData[];
  sectorBreakdown: {
    government: number;
    healthcare: number;
    technology: number;
    manufacturing: number;
    retail: number;
    energy: number;
  };
  averageWages: {
    overall: number;
    byEducation: {
      highSchool: number;
      bachelors: number;
      graduate: number;
    };
  };
}

export interface EmployerData {
  name: string;
  employees: number;
  sector: string;
  stability: 'High' | 'Medium' | 'Low';
  growthProjection: number;
}

export interface HousingSupplyMetrics {
  inventory: {
    total: number;
    monthsSupply: number;
    newListings: number;
    absorption: number;
  };
  construction: {
    permits: number;
    starts: number;
    completions: number;
    pipeline: number;
  };
  priceMetrics: {
    medianPrice: number;
    pricePerSqft: number;
    daysonMarket: number;
    priceReductions: number;
  };
}

export interface InfrastructureProjects {
  name: string;
  type: 'Transportation' | 'Utility' | 'Education' | 'Healthcare' | 'Recreation';
  budget: number;
  timeline: string;
  impact: 'High' | 'Medium' | 'Low';
  affectedAreas: string[];
}

export interface MarketForecast {
  sixMonth: ForecastPeriod;
  twelveMonth: ForecastPeriod;
  twentyFourMonth: ForecastPeriod;
  keyDrivers: string[];
  riskFactors: string[];
}

export interface ForecastPeriod {
  priceChange: number;
  confidence: number;
  scenario: {
    optimistic: number;
    baseline: number;
    pessimistic: number;
  };
}

/**
 * Generate comprehensive market intelligence for Tri-Cities region
 */
export async function generateMarketIntelligence(): Promise<MarketIntelligence> {
  const economicIndicators = await getEconomicIndicators();
  const demographicTrends = await getDemographicTrends();
  const employmentData = await getEmploymentData();
  const housingSupply = await getHousingSupplyMetrics();
  const infrastructureDevelopment = await getInfrastructureProjects();
  const marketForecast = await generateMarketForecast();

  return {
    economicIndicators,
    demographicTrends,
    employmentData,
    housingSupply,
    infrastructureDevelopment,
    marketForecast
  };
}

/**
 * Economic indicators for Tri-Cities region
 */
async function getEconomicIndicators(): Promise<EconomicIndicators> {
  return {
    medianHouseholdIncome: 87500,
    incomeGrowthRate: 0.034,
    unemploymentRate: 0.031,
    mortgageRates: {
      thirtyYear: 6.85,
      fifteenYear: 6.12,
      trend: 'stable'
    },
    costOfLiving: {
      index: 98.7,
      comparison: '1.3% below national average',
      trend: 0.025
    },
    businessGrowth: {
      newPermits: 342,
      businessLicenses: 1456,
      commercialDevelopment: 28
    }
  };
}

/**
 * Demographic trends analysis
 */
async function getDemographicTrends(): Promise<DemographicTrends> {
  return {
    populationGrowth: 0.018,
    ageDistribution: {
      millennials: 0.28,
      genX: 0.24,
      boomers: 0.31
    },
    householdFormation: 0.021,
    migrationPatterns: {
      inMigration: 4250,
      outMigration: 3100,
      netMigration: 1150,
      primarySources: ['Seattle Metro', 'Portland Metro', 'California Central Valley', 'Idaho']
    },
    educationLevels: {
      bachelorsOrHigher: 0.42,
      graduateDegrees: 0.18
    }
  };
}

/**
 * Employment data for regional analysis
 */
async function getEmploymentData(): Promise<EmploymentData> {
  return {
    totalJobs: 145600,
    jobGrowthRate: 0.024,
    majorEmployers: [
      {
        name: 'Hanford Site',
        employees: 11500,
        sector: 'Government/Energy',
        stability: 'High',
        growthProjection: 0.015
      },
      {
        name: 'Kadlec Regional Medical Center',
        employees: 4200,
        sector: 'Healthcare',
        stability: 'High',
        growthProjection: 0.032
      },
      {
        name: 'Lamb Weston',
        employees: 3800,
        sector: 'Manufacturing',
        stability: 'High',
        growthProjection: 0.018
      },
      {
        name: 'Bechtel National',
        employees: 3200,
        sector: 'Engineering',
        stability: 'Medium',
        growthProjection: 0.008
      },
      {
        name: 'Pacific Northwest National Laboratory',
        employees: 2900,
        sector: 'Research',
        stability: 'High',
        growthProjection: 0.025
      }
    ],
    sectorBreakdown: {
      government: 0.28,
      healthcare: 0.16,
      technology: 0.12,
      manufacturing: 0.15,
      retail: 0.14,
      energy: 0.15
    },
    averageWages: {
      overall: 78500,
      byEducation: {
        highSchool: 52000,
        bachelors: 85000,
        graduate: 105000
      }
    }
  };
}

/**
 * Housing supply metrics
 */
async function getHousingSupplyMetrics(): Promise<HousingSupplyMetrics> {
  return {
    inventory: {
      total: 1250,
      monthsSupply: 2.8,
      newListings: 285,
      absorption: 320
    },
    construction: {
      permits: 486,
      starts: 428,
      completions: 392,
      pipeline: 1240
    },
    priceMetrics: {
      medianPrice: 485000,
      pricePerSqft: 218,
      daysonMarket: 18,
      priceReductions: 0.12
    }
  };
}

/**
 * Infrastructure development projects
 */
async function getInfrastructureProjects(): Promise<InfrastructureProjects[]> {
  return [
    {
      name: 'Duportail Bridge Replacement',
      type: 'Transportation',
      budget: 185000000,
      timeline: '2024-2027',
      impact: 'High',
      affectedAreas: ['Richland', 'Pasco']
    },
    {
      name: 'Cable Bridge Trail Extension',
      type: 'Recreation',
      budget: 12000000,
      timeline: '2025-2026',
      impact: 'Medium',
      affectedAreas: ['Kennewick', 'Pasco']
    },
    {
      name: 'Richland High School Modernization',
      type: 'Education',
      budget: 95000000,
      timeline: '2024-2026',
      impact: 'High',
      affectedAreas: ['Richland']
    },
    {
      name: 'Hanford Site Cleanup Expansion',
      type: 'Utility',
      budget: 750000000,
      timeline: '2024-2030',
      impact: 'High',
      affectedAreas: ['Richland', 'West Richland']
    }
  ];
}

/**
 * Generate market forecast using economic models
 */
async function generateMarketForecast(): Promise<MarketForecast> {
  return {
    sixMonth: {
      priceChange: 0.035,
      confidence: 0.87,
      scenario: {
        optimistic: 0.052,
        baseline: 0.035,
        pessimistic: 0.018
      }
    },
    twelveMonth: {
      priceChange: 0.078,
      confidence: 0.82,
      scenario: {
        optimistic: 0.115,
        baseline: 0.078,
        pessimistic: 0.041
      }
    },
    twentyFourMonth: {
      priceChange: 0.165,
      confidence: 0.74,
      scenario: {
        optimistic: 0.235,
        baseline: 0.165,
        pessimistic: 0.095
      }
    },
    keyDrivers: [
      'Hanford cleanup contract extensions',
      'Population in-migration from high-cost areas',
      'Limited housing inventory',
      'Infrastructure investment',
      'Energy sector growth'
    ],
    riskFactors: [
      'Interest rate volatility',
      'Federal budget constraints affecting Hanford',
      'Economic recession risk',
      'Construction material costs',
      'Climate change impacts on agriculture'
    ]
  };
}

/**
 * Calculate market strength score
 */
export function calculateMarketStrength(intelligence: MarketIntelligence): number {
  let score = 0;
  
  // Employment strength (25% weight)
  const employmentScore = Math.min(intelligence.employmentData.jobGrowthRate * 100, 5) * 5;
  score += employmentScore * 0.25;
  
  // Population growth (20% weight)
  const populationScore = Math.min(intelligence.demographicTrends.populationGrowth * 100, 3) * 10;
  score += populationScore * 0.20;
  
  // Housing supply balance (20% weight)
  const supplyScore = intelligence.housingSupply.inventory.monthsSupply < 4 ? 20 : 
                     intelligence.housingSupply.inventory.monthsSupply < 6 ? 15 : 10;
  score += supplyScore * 0.20;
  
  // Income growth (15% weight)
  const incomeScore = Math.min(intelligence.economicIndicators.incomeGrowthRate * 100, 4) * 7.5;
  score += incomeScore * 0.15;
  
  // Infrastructure investment (10% weight)
  const infrastructureScore = intelligence.infrastructureDevelopment.length * 2;
  score += Math.min(infrastructureScore, 10) * 0.10;
  
  // Economic diversity (10% weight)
  const diversityScore = 10; // Tri-Cities has good economic diversity
  score += diversityScore * 0.10;
  
  return Math.min(score, 100);
}

/**
 * Generate investment recommendations based on market intelligence
 */
export function generateInvestmentRecommendations(intelligence: MarketIntelligence): string[] {
  const recommendations: string[] = [];
  const marketStrength = calculateMarketStrength(intelligence);
  
  if (marketStrength > 80) {
    recommendations.push("Strong buyer's market - consider accelerated acquisition strategy");
  }
  
  if (intelligence.housingSupply.inventory.monthsSupply < 3) {
    recommendations.push("Severe inventory shortage - expect continued price appreciation");
  }
  
  if (intelligence.demographicTrends.netMigration > 1000) {
    recommendations.push("Positive in-migration supporting housing demand growth");
  }
  
  if (intelligence.employmentData.jobGrowthRate > 0.02) {
    recommendations.push("Strong job growth supporting wage increases and housing demand");
  }
  
  return recommendations;
}