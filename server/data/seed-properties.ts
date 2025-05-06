import { db } from '../db';
import { properties } from '../../shared/schema';
import { sql } from 'drizzle-orm';

/**
 * Seed script to add sample properties to the database for testing 
 */
export async function seedProperties() {
  try {
    console.log('Seeding sample properties...');
    
    // Sample Benton County properties for testing
    const sampleProperties = [
      {
        parcelId: 'BC-10042-001',
        address: '123 Main Street',
        city: 'Kennewick',
        state: 'WA',
        zip: '99336',
        county: 'Benton',
        hoodCd: 'KEN001',
        latitude: 46.2087,
        longitude: -119.1360,
        landArea: 10500,
        landValue: 125000,
        totalValue: 325000,
        assessedValue: 320000,
        zoning: 'R1',
        yearBuilt: 1992,
        details: { bedrooms: 4, bathrooms: 2.5, garageSpaces: 2 }
      },
      {
        parcelId: 'BC-10158-042',
        address: '456 Oak Avenue',
        city: 'Richland',
        state: 'WA',
        zip: '99352',
        county: 'Benton',
        hoodCd: 'RIC003',
        latitude: 46.2826,
        longitude: -119.2917,
        landArea: 8750,
        landValue: 110000,
        totalValue: 290000,
        assessedValue: 285000,
        zoning: 'R1',
        yearBuilt: 1985,
        details: { bedrooms: 3, bathrooms: 2, garageSpaces: 2 }
      },
      {
        parcelId: 'BC-10236-105',
        address: '789 Pine Lane',
        city: 'Prosser',
        state: 'WA',
        zip: '99350',
        county: 'Benton',
        hoodCd: 'PRO002',
        latitude: 46.2070,
        longitude: -119.7689,
        landArea: 15000,
        landValue: 95000,
        totalValue: 275000,
        assessedValue: 270000,
        zoning: 'R2',
        yearBuilt: 1978,
        details: { bedrooms: 3, bathrooms: 1.5, garageSpaces: 1 }
      },
      {
        parcelId: 'BC-10369-026',
        address: '1001 Washington Street',
        city: 'Kennewick',
        state: 'WA',
        zip: '99336',
        county: 'Benton',
        hoodCd: 'KEN002',
        latitude: 46.2153,
        longitude: -119.1442,
        landArea: 7500,
        landValue: 105000,
        totalValue: 255000,
        assessedValue: 250000,
        zoning: 'R1',
        yearBuilt: 1975,
        details: { bedrooms: 3, bathrooms: 1, garageSpaces: 1 }
      },
      {
        parcelId: 'BC-10481-093',
        address: '234 Columbia Drive',
        city: 'Richland',
        state: 'WA',
        zip: '99352',
        county: 'Benton',
        hoodCd: 'RIC005',
        latitude: 46.2729,
        longitude: -119.2742,
        landArea: 9000,
        landValue: 115000,
        totalValue: 310000,
        assessedValue: 305000,
        zoning: 'R1',
        yearBuilt: 1995,
        details: { bedrooms: 4, bathrooms: 2, garageSpaces: 2 }
      },
      {
        parcelId: 'BC-10529-118',
        address: '567 River Road',
        city: 'Benton City',
        state: 'WA',
        zip: '99320',
        county: 'Benton',
        hoodCd: 'BEN001',
        latitude: 46.2632,
        longitude: -119.4915,
        landArea: 20000,
        landValue: 85000,
        totalValue: 225000,
        assessedValue: 220000,
        zoning: 'R2',
        yearBuilt: 1972,
        details: { bedrooms: 2, bathrooms: 1, garageSpaces: 1 }
      },
      {
        parcelId: 'BC-10675-034',
        address: '890 Vineyard Way',
        city: 'Prosser',
        state: 'WA',
        zip: '99350',
        county: 'Benton',
        hoodCd: 'PRO003',
        latitude: 46.2047,
        longitude: -119.7592,
        landArea: 25000,
        landValue: 100000,
        totalValue: 295000,
        assessedValue: 290000,
        zoning: 'R2',
        yearBuilt: 1983,
        details: { bedrooms: 3, bathrooms: 2, garageSpaces: 2 }
      },
      {
        parcelId: 'BC-10789-057',
        address: '1234 Valley View Drive',
        city: 'Kennewick',
        state: 'WA',
        zip: '99336',
        county: 'Benton',
        hoodCd: 'KEN004',
        latitude: 46.2110,
        longitude: -119.1510,
        landArea: 12000,
        landValue: 130000,
        totalValue: 340000,
        assessedValue: 335000,
        zoning: 'R1',
        yearBuilt: 2001,
        details: { bedrooms: 4, bathrooms: 2.5, garageSpaces: 3 }
      },
      {
        parcelId: 'BC-10842-071',
        address: '432 Sunset Boulevard',
        city: 'Richland',
        state: 'WA',
        zip: '99352',
        county: 'Benton',
        hoodCd: 'RIC007',
        latitude: 46.2875,
        longitude: -119.2845,
        landArea: 9500,
        landValue: 120000,
        totalValue: 315000,
        assessedValue: 310000,
        zoning: 'R1',
        yearBuilt: 1997,
        details: { bedrooms: 3, bathrooms: 2.5, garageSpaces: 2 }
      },
      {
        parcelId: 'BC-10923-089',
        address: '789 Orchard Lane',
        city: 'Benton City',
        state: 'WA',
        zip: '99320',
        county: 'Benton',
        hoodCd: 'BEN002',
        latitude: 46.2685,
        longitude: -119.4876,
        landArea: 30000,
        landValue: 90000,
        totalValue: 235000,
        assessedValue: 230000,
        zoning: 'R2',
        yearBuilt: 1968,
        details: { bedrooms: 3, bathrooms: 1, garageSpaces: 1 }
      }
    ];

    // Insert properties into the database
    const insertResult = await db.insert(properties).values(sampleProperties)
      .onConflictDoUpdate({
        target: properties.parcelId,
        set: {
          address: sql`EXCLUDED.address`,
          city: sql`EXCLUDED.city`,
          state: sql`EXCLUDED.state`,
          zip: sql`EXCLUDED.zip`,
          county: sql`EXCLUDED.county`,
          landArea: sql`EXCLUDED.land_area`,
          landValue: sql`EXCLUDED.land_value`,
          totalValue: sql`EXCLUDED.total_value`,
          assessedValue: sql`EXCLUDED.assessed_value`,
          zoning: sql`EXCLUDED.zoning`,
          yearBuilt: sql`EXCLUDED.year_built`,
          details: sql`EXCLUDED.details`,
          updatedAt: sql`now()`
        }
      });

    console.log('Successfully seeded sample properties');
    return { success: true, message: 'Sample properties seeded successfully' };
  } catch (error) {
    console.error('Error seeding properties:', error);
    return { success: false, message: 'Failed to seed properties', error };
  }
}