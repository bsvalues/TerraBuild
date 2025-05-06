/**
 * Seed script to add sample properties to the database for testing 
 */
import { db } from '../db';
import { logger } from '../utils/logger';

const sampleProperties = [
  {
    prop_id: 100001,
    geo_id: "BC-100001",
    legal_desc: "123 Main St, Kennewick, WA 99336",
    property_use_desc: "Single Family Residence",
    property_use_cd: "RES",
    hood_cd: "KEN-01",
    assessed_val: 250000,
    appraised_val: 275000,
    land_hstd_val: 80000,
    land_non_hstd_val: 0,
    imprv_hstd_val: 195000,
    imprv_non_hstd_val: 0,
    legal_acreage: 0.25,
    township_section: "SW-12",
    township_code: "8N",
    range_code: "29E",
    tract_or_lot: "Lot 5",
    block: "Block A",
    is_active: true
  },
  {
    prop_id: 100002,
    geo_id: "BC-100002",
    legal_desc: "456 Oak Ave, Richland, WA 99352",
    property_use_desc: "Commercial - Retail",
    property_use_cd: "COM",
    hood_cd: "RICH-05",
    assessed_val: 425000,
    appraised_val: 450000,
    land_hstd_val: 0,
    land_non_hstd_val: 150000,
    imprv_hstd_val: 0,
    imprv_non_hstd_val: 300000,
    legal_acreage: 0.75,
    township_section: "NE-24",
    township_code: "9N",
    range_code: "28E",
    tract_or_lot: "Lot 12",
    block: "Block C",
    is_active: true
  },
  {
    prop_id: 100003,
    geo_id: "BC-100003",
    legal_desc: "789 Vineyard Dr, Prosser, WA 99350",
    property_use_desc: "Agricultural - Vineyard",
    property_use_cd: "AG-V",
    hood_cd: "PROS-02",
    assessed_val: 850000,
    appraised_val: 900000,
    land_hstd_val: 0,
    land_non_hstd_val: 650000,
    imprv_hstd_val: 0,
    imprv_non_hstd_val: 250000,
    legal_acreage: 15.5,
    township_section: "SW-18",
    township_code: "7N",
    range_code: "25E",
    tract_or_lot: "Tract 3",
    block: "",
    is_active: true
  },
  {
    prop_id: 100004,
    geo_id: "BC-100004",
    legal_desc: "321 River Rd, Benton City, WA 99320",
    property_use_desc: "Multi-Family Residence",
    property_use_cd: "MFR",
    hood_cd: "BENT-03",
    assessed_val: 350000,
    appraised_val: 375000,
    land_hstd_val: 0,
    land_non_hstd_val: 100000,
    imprv_hstd_val: 0,
    imprv_non_hstd_val: 275000,
    legal_acreage: 0.5,
    township_section: "NW-30",
    township_code: "8N",
    range_code: "26E",
    tract_or_lot: "Lot 22",
    block: "Block F",
    is_active: true
  },
  {
    prop_id: 100005,
    geo_id: "BC-100005",
    legal_desc: "555 Industrial Way, Richland, WA 99352",
    property_use_desc: "Industrial - Manufacturing",
    property_use_cd: "IND-M",
    hood_cd: "RICH-08",
    assessed_val: 1200000,
    appraised_val: 1250000,
    land_hstd_val: 0,
    land_non_hstd_val: 350000,
    imprv_hstd_val: 0,
    imprv_non_hstd_val: 900000,
    legal_acreage: 3.2,
    township_section: "SE-05",
    township_code: "9N",
    range_code: "28E",
    tract_or_lot: "Lot 3",
    block: "Block A",
    is_active: true
  }
];

/**
 * Seed the database with sample properties
 */
export async function seedProperties() {
  try {
    logger.info('Checking for existing properties...');
    
    // Check if properties already exist to avoid duplicates
    const existingProperties = await db.query.properties.findMany({
      limit: 1
    });
    
    if (existingProperties.length > 0) {
      logger.info('Properties already exist, skipping seed');
      return { success: true, message: 'Properties already exist' };
    }
    
    logger.info('Seeding sample properties...');
    
    // Insert all sample properties
    for (const property of sampleProperties) {
      await db.insert(db.query.properties).values(property);
    }
    
    logger.info(`Successfully seeded ${sampleProperties.length} sample properties`);
    return { success: true, message: `Added ${sampleProperties.length} properties` };
  } catch (error) {
    logger.error('Failed to seed properties:', error);
    return { success: false, message: error.message || 'Failed to seed properties' };
  }
}