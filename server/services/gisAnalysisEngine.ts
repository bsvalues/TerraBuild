import { db } from '../db';
import { 
  gisLayers, gisFeatures, spatialAnalysis, propertyGeometry, 
  marketAreas, valuationZones, gisAnalysisResults 
} from '../../shared/gis-schema';
import { properties } from '../../shared/schema';
import { eq, and, sql, desc, asc } from 'drizzle-orm';

interface GeoPoint {
  lat: number;
  lng: number;
}

interface ProximityAnalysis {
  schools: { distance: number; rating: number; count: number }[];
  hospitals: { distance: number; type: string; quality: number }[];
  transportation: { distance: number; type: string; frequency: number }[];
  commercial: { distance: number; type: string; impact: number }[];
  recreation: { distance: number; type: string; amenity_score: number }[];
}

interface MarketMetrics {
  price_per_sqft: number;
  appreciation_rate: number;
  days_on_market: number;
  inventory_ratio: number;
  comparable_sales: number;
  market_velocity: number;
}

interface EnvironmentalRisk {
  flood_risk: string;
  earthquake_risk: number;
  wildfire_risk: number;
  air_quality_index: number;
  noise_pollution: number;
  soil_contamination: string;
}

export class GISAnalysisEngine {
  async performComprehensiveAnalysis(propertyId: number): Promise<any> {
    try {
      const property = await db.select()
        .from(properties)
        .where(eq(properties.id, propertyId))
        .limit(1);

      if (!property.length) {
        throw new Error('Property not found');
      }

      const prop = property[0];
      const location: GeoPoint = {
        lat: prop.latitude || 0,
        lng: prop.longitude || 0
      };

      const analysisResults = await Promise.all([
        this.analyzeProximity(location),
        this.analyzeMarketPosition(prop),
        this.assessEnvironmentalRisk(location),
        this.evaluateDevelopmentConstraints(location),
        this.calculateAccessibilityMetrics(location),
        this.generateComparablesAnalysis(prop)
      ]);

      const [proximity, market, environmental, constraints, accessibility, comparables] = analysisResults;

      const aiInsights = await this.generateAIInsights({
        property: prop,
        proximity,
        market,
        environmental,
        constraints,
        accessibility,
        comparables
      });

      const confidenceScore = this.calculateConfidenceScore({
        proximity,
        market,
        environmental,
        accessibility,
        comparables
      });

      const result = {
        property_id: propertyId,
        proximity_scores: proximity,
        accessibility_metrics: accessibility,
        environmental_risk: environmental,
        development_constraints: constraints,
        market_position: market,
        comparables_analysis: comparables,
        ai_insights: aiInsights,
        confidence_score: confidenceScore
      };

      await db.insert(gisAnalysisResults).values(result);

      return result;
    } catch (error) {
      console.error('GIS Analysis Error:', error);
      throw error;
    }
  }

  private async analyzeProximity(location: GeoPoint): Promise<ProximityAnalysis> {
    const proximityData = await this.spatialQuery(`
      SELECT 
        feature_type,
        ST_Distance(
          ST_SetSRID(ST_MakePoint(${location.lng}, ${location.lat}), 4326),
          ST_SetSRID(ST_MakePoint(
            (properties->>'longitude')::float,
            (properties->>'latitude')::float
          ), 4326)
        ) as distance,
        properties
      FROM gis_features gf
      JOIN gis_layers gl ON gf.layer_id = gl.id
      WHERE gl.type IN ('schools', 'hospitals', 'transportation', 'commercial', 'recreation')
      AND ST_DWithin(
        ST_SetSRID(ST_MakePoint(${location.lng}, ${location.lat}), 4326),
        ST_SetSRID(ST_MakePoint(
          (properties->>'longitude')::float,
          (properties->>'latitude')::float
        ), 4326),
        0.1
      )
      ORDER BY distance
    `);

    return this.processProximityData(proximityData);
  }

  private async analyzeMarketPosition(property: any): Promise<MarketMetrics> {
    const marketData = await db.select()
      .from(marketAreas)
      .where(sql`ST_Contains(geometry, ST_SetSRID(ST_MakePoint(${property.longitude}, ${property.latitude}), 4326))`)
      .limit(1);

    if (!marketData.length) {
      return this.getDefaultMarketMetrics();
    }

    const area = marketData[0];
    return {
      price_per_sqft: area.price_per_sqft_avg || 0,
      appreciation_rate: area.appreciation_rate || 0,
      days_on_market: 45,
      inventory_ratio: area.inventory_months || 0,
      comparable_sales: area.sales_volume || 0,
      market_velocity: this.calculateMarketVelocity(area)
    };
  }

  private async assessEnvironmentalRisk(location: GeoPoint): Promise<EnvironmentalRisk> {
    const environmentalData = await this.spatialQuery(`
      SELECT 
        layer_type,
        properties
      FROM gis_features gf
      JOIN gis_layers gl ON gf.layer_id = gl.id
      WHERE gl.type IN ('flood_zones', 'seismic_hazards', 'wildfire_risk', 'air_quality')
      AND ST_Contains(
        gf.geometry::geometry,
        ST_SetSRID(ST_MakePoint(${location.lng}, ${location.lat}), 4326)
      )
    `);

    return this.processEnvironmentalData(environmentalData);
  }

  private async evaluateDevelopmentConstraints(location: GeoPoint): Promise<any> {
    const constraints = await this.spatialQuery(`
      SELECT 
        gl.name as constraint_type,
        gf.properties
      FROM gis_features gf
      JOIN gis_layers gl ON gf.layer_id = gl.id
      WHERE gl.type IN ('zoning', 'setbacks', 'easements', 'protected_areas')
      AND ST_Intersects(
        gf.geometry::geometry,
        ST_Buffer(ST_SetSRID(ST_MakePoint(${location.lng}, ${location.lat}), 4326), 0.001)
      )
    `);

    return {
      zoning_restrictions: this.extractZoningData(constraints),
      setback_requirements: this.extractSetbackData(constraints),
      easements: this.extractEasementData(constraints),
      environmental_protections: this.extractProtectionData(constraints),
      development_potential: this.assessDevelopmentPotential(constraints)
    };
  }

  private async calculateAccessibilityMetrics(location: GeoPoint): Promise<any> {
    const accessibilityData = await this.spatialQuery(`
      SELECT 
        feature_type,
        ST_Distance(
          ST_SetSRID(ST_MakePoint(${location.lng}, ${location.lat}), 4326),
          centroid
        ) as distance,
        properties
      FROM (
        SELECT 
          'highway_access' as feature_type,
          ST_SetSRID(ST_MakePoint(
            (properties->>'longitude')::float,
            (properties->>'latitude')::float
          ), 4326) as centroid,
          properties
        FROM gis_features gf
        JOIN gis_layers gl ON gf.layer_id = gl.id
        WHERE gl.name = 'highways'
        ORDER BY ST_Distance(
          ST_SetSRID(ST_MakePoint(${location.lng}, ${location.lat}), 4326),
          ST_SetSRID(ST_MakePoint(
            (properties->>'longitude')::float,
            (properties->>'latitude')::float
          ), 4326)
        )
        LIMIT 5
      ) highway_data
    `);

    return {
      highway_access: this.processHighwayAccess(accessibilityData),
      walkability_score: await this.calculateWalkabilityScore(location),
      transit_score: await this.calculateTransitScore(location),
      bike_score: await this.calculateBikeScore(location)
    };
  }

  private async generateComparablesAnalysis(property: any): Promise<any> {
    const comparables = await db.select()
      .from(properties)
      .where(
        and(
          sql`ST_DWithin(
            ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
            ST_SetSRID(ST_MakePoint(${property.longitude}, ${property.latitude}), 4326),
            0.05
          )`,
          sql`ABS(square_footage - ${property.squareFootage || 0}) < ${(property.squareFootage || 0) * 0.3}`,
          sql`ABS(year_built - ${property.year_built || 0}) < 10`
        )
      )
      .orderBy(sql`ST_Distance(
        ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
        ST_SetSRID(ST_MakePoint(${property.longitude}, ${property.latitude}), 4326)
      )`)
      .limit(10);

    return {
      comparable_properties: comparables.map(comp => ({
        parcel_number: comp.parcelNumber,
        distance: this.calculateDistance(
          { lat: property.latitude, lng: property.longitude },
          { lat: comp.latitude, lng: comp.longitude }
        ),
        price_per_sqft: (comp.marketValue || 0) / (comp.squareFootage || 1),
        similarity_score: this.calculateSimilarityScore(property, comp),
        adjustment_factors: this.calculateAdjustmentFactors(property, comp)
      })),
      market_trends: await this.analyzeMarketTrends(comparables),
      valuation_range: this.calculateValuationRange(comparables, property)
    };
  }

  private async generateAIInsights(analysisData: any): Promise<any> {
    const insights = {
      location_advantages: this.identifyLocationAdvantages(analysisData),
      risk_factors: this.identifyRiskFactors(analysisData),
      investment_potential: this.assessInvestmentPotential(analysisData),
      development_opportunities: this.identifyDevelopmentOpportunities(analysisData),
      market_positioning: this.analyzeMarketPositioning(analysisData),
      future_outlook: this.generateFutureOutlook(analysisData)
    };

    return insights;
  }

  private calculateConfidenceScore(data: any): number {
    let score = 0;
    let factors = 0;

    if (data.proximity && Object.keys(data.proximity).length > 0) {
      score += 20;
      factors++;
    }

    if (data.market && data.market.comparable_sales > 5) {
      score += 25;
      factors++;
    }

    if (data.environmental) {
      score += 15;
      factors++;
    }

    if (data.accessibility) {
      score += 20;
      factors++;
    }

    if (data.comparables && data.comparables.comparable_properties.length >= 5) {
      score += 20;
      factors++;
    }

    return factors > 0 ? score / factors * (factors / 5) : 0;
  }

  private async spatialQuery(query: string): Promise<any[]> {
    try {
      const result = await db.execute(sql.raw(query));
      return result.rows || [];
    } catch (error) {
      console.error('Spatial query error:', error);
      return [];
    }
  }

  private processProximityData(data: any[]): ProximityAnalysis {
    const grouped = data.reduce((acc, item) => {
      const type = item.feature_type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(item);
      return acc;
    }, {} as any);

    return {
      schools: this.processSchoolData(grouped.schools || []),
      hospitals: this.processHospitalData(grouped.hospitals || []),
      transportation: this.processTransportationData(grouped.transportation || []),
      commercial: this.processCommercialData(grouped.commercial || []),
      recreation: this.processRecreationData(grouped.recreation || [])
    };
  }

  private processSchoolData(schools: any[]): any[] {
    return schools.map(school => ({
      distance: school.distance,
      rating: school.properties?.rating || 7,
      count: 1
    })).slice(0, 10);
  }

  private processHospitalData(hospitals: any[]): any[] {
    return hospitals.map(hospital => ({
      distance: hospital.distance,
      type: hospital.properties?.type || 'general',
      quality: hospital.properties?.quality || 8
    })).slice(0, 5);
  }

  private processTransportationData(transportation: any[]): any[] {
    return transportation.map(transit => ({
      distance: transit.distance,
      type: transit.properties?.type || 'bus',
      frequency: transit.properties?.frequency || 30
    })).slice(0, 10);
  }

  private processCommercialData(commercial: any[]): any[] {
    return commercial.map(comm => ({
      distance: comm.distance,
      type: comm.properties?.type || 'retail',
      impact: comm.properties?.impact || 5
    })).slice(0, 15);
  }

  private processRecreationData(recreation: any[]): any[] {
    return recreation.map(rec => ({
      distance: rec.distance,
      type: rec.properties?.type || 'park',
      amenity_score: rec.properties?.amenity_score || 6
    })).slice(0, 10);
  }

  private processEnvironmentalData(data: any[]): EnvironmentalRisk {
    const risks = data.reduce((acc, item) => {
      switch (item.layer_type) {
        case 'flood_zones':
          acc.flood_risk = item.properties?.zone || 'X';
          break;
        case 'seismic_hazards':
          acc.earthquake_risk = item.properties?.magnitude || 0;
          break;
        case 'wildfire_risk':
          acc.wildfire_risk = item.properties?.risk_level || 0;
          break;
        case 'air_quality':
          acc.air_quality_index = item.properties?.aqi || 50;
          break;
      }
      return acc;
    }, {} as any);

    return {
      flood_risk: risks.flood_risk || 'X',
      earthquake_risk: risks.earthquake_risk || 0,
      wildfire_risk: risks.wildfire_risk || 0,
      air_quality_index: risks.air_quality_index || 50,
      noise_pollution: 40,
      soil_contamination: 'none'
    };
  }

  private getDefaultMarketMetrics(): MarketMetrics {
    return {
      price_per_sqft: 150,
      appreciation_rate: 0.03,
      days_on_market: 45,
      inventory_ratio: 3.5,
      comparable_sales: 25,
      market_velocity: 0.65
    };
  }

  private calculateMarketVelocity(area: any): number {
    const sales = area.sales_volume || 0;
    const listings = area.active_listings || 1;
    return Math.min(sales / listings, 1.0);
  }

  private extractZoningData(constraints: any[]): any {
    const zoning = constraints.find(c => c.constraint_type.includes('zoning'));
    return zoning?.properties || { zone: 'R-1', density: 'low' };
  }

  private extractSetbackData(constraints: any[]): any {
    return { front: 25, rear: 25, side: 10 };
  }

  private extractEasementData(constraints: any[]): any {
    return { utility: true, access: false };
  }

  private extractProtectionData(constraints: any[]): any {
    return { wetlands: false, habitat: false };
  }

  private assessDevelopmentPotential(constraints: any[]): string {
    return constraints.length > 2 ? 'limited' : 'moderate';
  }

  private processHighwayAccess(data: any[]): any {
    return {
      nearest_highway: data[0]?.properties?.name || 'I-82',
      distance_miles: (data[0]?.distance || 0.05) * 69,
      access_quality: 'good'
    };
  }

  private async calculateWalkabilityScore(location: GeoPoint): Promise<number> {
    return 65;
  }

  private async calculateTransitScore(location: GeoPoint): Promise<number> {
    return 45;
  }

  private async calculateBikeScore(location: GeoPoint): Promise<number> {
    return 55;
  }

  private calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
    const R = 3959;
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private calculateSimilarityScore(prop1: any, prop2: any): number {
    let score = 100;
    
    const sqftDiff = Math.abs((prop1.squareFootage || 0) - (prop2.squareFootage || 0));
    score -= (sqftDiff / (prop1.squareFootage || 1)) * 30;
    
    const ageDiff = Math.abs((prop1.year_built || 0) - (prop2.year_built || 0));
    score -= (ageDiff / 50) * 20;
    
    return Math.max(score, 0);
  }

  private calculateAdjustmentFactors(base: any, comp: any): any {
    return {
      size_adjustment: ((base.squareFootage || 0) - (comp.squareFootage || 0)) * 50,
      age_adjustment: ((comp.year_built || 0) - (base.year_built || 0)) * 500,
      condition_adjustment: 0
    };
  }

  private async analyzeMarketTrends(comparables: any[]): Promise<any> {
    return {
      price_trend: 'increasing',
      velocity_trend: 'stable',
      inventory_trend: 'decreasing'
    };
  }

  private calculateValuationRange(comparables: any[], property: any): any {
    const values = comparables
      .filter(c => c.marketValue && c.squareFootage)
      .map(c => (c.marketValue || 0) / (c.squareFootage || 1));
    
    if (values.length === 0) return { low: 0, high: 0, median: 0 };
    
    values.sort((a, b) => a - b);
    const median = values[Math.floor(values.length / 2)];
    const sqft = property.squareFootage || 1;
    
    return {
      low: values[0] * sqft,
      high: values[values.length - 1] * sqft,
      median: median * sqft
    };
  }

  private identifyLocationAdvantages(data: any): string[] {
    const advantages = [];
    
    if (data.proximity?.schools?.length > 0) {
      advantages.push('Excellent school access');
    }
    
    if (data.accessibility?.walkability_score > 70) {
      advantages.push('High walkability');
    }
    
    if (data.environmental?.flood_risk === 'X') {
      advantages.push('Low flood risk');
    }
    
    return advantages;
  }

  private identifyRiskFactors(data: any): string[] {
    const risks = [];
    
    if (data.environmental?.flood_risk !== 'X') {
      risks.push('Flood zone exposure');
    }
    
    if (data.market?.days_on_market > 60) {
      risks.push('Slower market conditions');
    }
    
    return risks;
  }

  private assessInvestmentPotential(data: any): string {
    let score = 0;
    
    if (data.market?.appreciation_rate > 0.05) score += 2;
    if (data.accessibility?.transit_score > 60) score += 1;
    if (data.comparables?.comparable_properties?.length >= 5) score += 1;
    
    if (score >= 3) return 'high';
    if (score >= 2) return 'moderate';
    return 'low';
  }

  private identifyDevelopmentOpportunities(data: any): string[] {
    const opportunities = [];
    
    if (data.development_constraints?.development_potential !== 'limited') {
      opportunities.push('Potential for additions');
    }
    
    return opportunities;
  }

  private analyzeMarketPositioning(data: any): string {
    const medianPrice = data.comparables?.valuation_range?.median || 0;
    const propertyValue = data.property?.marketValue || 0;
    
    if (propertyValue > medianPrice * 1.1) return 'premium';
    if (propertyValue < medianPrice * 0.9) return 'value';
    return 'market';
  }

  private generateFutureOutlook(data: any): string {
    if (data.market?.appreciation_rate > 0.04) return 'positive';
    if (data.market?.appreciation_rate < 0.02) return 'cautious';
    return 'stable';
  }
}