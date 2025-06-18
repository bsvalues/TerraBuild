import fs from 'fs';
import path from 'path';

export interface CostFactors {
  version: string;
  source: string;
  year: number;
  lastUpdated: string;
  regionFactors: Record<string, number>;
  qualityFactors: Record<string, number>;
  conditionFactors: Record<string, number>;
  baseRates: Record<string, number>;
  complexityFactors: {
    STORIES: Record<string, number>;
    FOUNDATION: Record<string, number>;
    ROOF: Record<string, number>;
    HVAC: Record<string, number>;
  };
  agingFactors: Record<string, number>;
}

export class CostFactorTables {
  private tables: Record<string, CostFactors> = {};
  private sources: string[] = [];
  private dataDir: string = path.join(process.cwd(), 'data');

  constructor() {
    this.loadAllSources();
    console.log('CostFactorTables initialized from source: Benton County Building Cost Standards');
  }

  private loadAllSources() {
    try {
      // Default to Benton County data if nothing else is available
      const bentonCountyData: CostFactors = {
        version: '1.0.0',
        source: 'bentonCounty',
        year: 2025,
        lastUpdated: '2025-01-01',
        regionFactors: {
          'R1': 1.05,
          'R2': 1.00,
          'R3': 0.95,
          'R4': 0.90,
          'R5': 0.85,
        },
        qualityFactors: {
          'AAA': 1.25,
          'AA': 1.15,
          'A': 1.10,
          'B': 1.00,
          'C': 0.90,
          'D': 0.80,
        },
        conditionFactors: {
          'EX': 1.10,
          'VG': 1.05,
          'GD': 1.00,
          'AV': 0.90,
          'FR': 0.80,
          'PR': 0.70,
        },
        baseRates: {
          'SFR': 285.00,
          'MFR': 260.00,
          'COM': 320.00,
          'IND': 180.00,
          'AGR': 120.00,
        },
        complexityFactors: {
          STORIES: {
            '1': 1.0,
            '1.5': 1.05,
            '2': 1.10,
            '2.5': 1.15,
            '3': 1.20,
          },
          FOUNDATION: {
            'SLAB': 1.0,
            'CRAWL': 1.05,
            'BASEMENT': 1.25,
          },
          ROOF: {
            'ASPHALT': 1.0,
            'METAL': 1.15,
            'TILE': 1.20,
            'SLATE': 1.35,
          },
          HVAC: {
            'NONE': 0.85,
            'BASIC': 1.0,
            'CENTRAL': 1.15,
            'ZONED': 1.25,
          },
        },
        agingFactors: {
          '0': 1.00,
          '5': 0.98,
          '10': 0.95,
          '15': 0.92,
          '20': 0.89,
          '25': 0.85,
          '30': 0.80,
          '40': 0.75,
          '50': 0.70,
        },
      };

      // Add default Benton County data
      this.tables['bentonCounty'] = bentonCountyData;
      this.sources.push('bentonCounty');

      // Look for JSON files in the data directory
      if (fs.existsSync(this.dataDir)) {
        const files = fs.readdirSync(this.dataDir);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        for (const file of jsonFiles) {
          try {
            const filePath = path.join(this.dataDir, file);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(fileContent);
            
            if (data.source && !this.sources.includes(data.source)) {
              this.tables[data.source] = data;
              this.sources.push(data.source);
            }
          } catch (error) {
            console.error(`Error loading cost factor data from ${file}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error initializing cost factor tables:', error);
      throw new Error('Failed to initialize cost factor tables');
    }
  }

  public getAvailableSources(): string[] {
    return [...this.sources];
  }

  public getAllFactors(source: string): CostFactors {
    if (!this.tables[source]) {
      throw new Error(`Cost factor source '${source}' not found`);
    }
    return { ...this.tables[source] };
  }

  public getFactorsByType(source: string, factorType: string): Record<string, number> | Record<string, Record<string, number>> {
    if (!this.tables[source]) {
      throw new Error(`Cost factor source '${source}' not found`);
    }

    const factors = this.tables[source];
    
    switch(factorType.toLowerCase()) {
      case 'region':
        return { ...factors.regionFactors };
      case 'quality':
        return { ...factors.qualityFactors };
      case 'condition':
        return { ...factors.conditionFactors };
      case 'baserate':
        return { ...factors.baseRates };
      case 'complexity':
        return { ...factors.complexityFactors };
      case 'age':
        return { ...factors.agingFactors };
      default:
        throw new Error(`Factor type '${factorType}' not found`);
    }
  }

  public getFactorValue(source: string, factorType: string, code: string): number | null {
    try {
      if (!this.tables[source]) {
        throw new Error(`Cost factor source '${source}' not found`);
      }

      const factors = this.tables[source];
      
      // Handle nested complexity factors
      if (factorType.toLowerCase() === 'complexity') {
        // The code format for complexity is expected to be CATEGORY.CODE (e.g., STORIES.2)
        const [category, subCode] = code.split('.');
        
        if (!category || !subCode || !factors.complexityFactors[category]) {
          return null;
        }
        
        return factors.complexityFactors[category][subCode] || null;
      }
      
      // Handle other factor types
      switch(factorType.toLowerCase()) {
        case 'region':
          return factors.regionFactors[code] || null;
        case 'quality':
          return factors.qualityFactors[code] || null;
        case 'condition':
          return factors.conditionFactors[code] || null;
        case 'baserate':
          return factors.baseRates[code] || null;
        case 'age':
          return factors.agingFactors[code] || null;
        default:
          return null;
      }
    } catch (error) {
      console.error(`Error getting factor value for ${factorType}/${code}:`, error);
      return null;
    }
  }
}