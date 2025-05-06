/**
 * Property model that matches the actual database structure
 * for use in the PropertySearch component and elsewhere
 */
export interface Property {
  id: number;
  prop_id?: number;
  geo_id?: string;
  hood_cd?: string;
  property_use_cd?: string;
  property_use_desc?: string;
  legal_desc?: string;
  legal_acreage?: number;
  appraised_val?: number;
  assessed_val?: number;
  market?: number;
  land_hstd_val?: number;
  land_non_hstd_val?: number;
  imprv_hstd_val?: number;
  imprv_non_hstd_val?: number;
  township_section?: string;
  township_code?: string;
  range_code?: string;
  tract_or_lot?: string;
  block?: string;
  image_path?: string;
  is_active?: boolean;
  updated_at?: string;
}

/**
 * Property view model for display in the UI
 * Transforms database model into a more user-friendly structure
 */
export interface PropertyViewModel {
  id: number;
  parcelId: string; // Use prop_id or geo_id depending on availability
  address: string;  // Use legal_desc
  city?: string;    // Not directly available, may need to derive from other fields
  state?: string;   // Not directly available, can default to "WA" for Benton County
  zip?: string;     // Not directly available
  county?: string;  // Not directly available, can default to "Benton"
  neighborhood?: string; // Use hood_cd
  landArea?: number; // Use legal_acreage
  landValue?: number; // Use land_hstd_val + land_non_hstd_val
  improvementValue?: number; // Use imprv_hstd_val + imprv_non_hstd_val
  totalValue?: number; // Use appraised_val or market
  assessedValue?: number; // Use assessed_val
  propertyType?: string; // Use property_use_desc
  useCode?: string;   // Use property_use_cd
  location?: {
    township?: string; // Use township_code
    range?: string;    // Use range_code
    section?: string;  // Use township_section
    lot?: string;      // Use tract_or_lot
    block?: string;    // Use block
  };
}

/**
 * Convert a database property model to a view model for display
 */
export function toPropertyViewModel(property: Property): PropertyViewModel {
  // Calculate total land value and improvement value
  const landValue = (property.land_hstd_val || 0) + (property.land_non_hstd_val || 0);
  const improvementValue = (property.imprv_hstd_val || 0) + (property.imprv_non_hstd_val || 0);
  
  // Create a default address from legal description or other fields
  const address = property.legal_desc || `Property #${property.prop_id || property.id}`;
  
  return {
    id: property.id,
    parcelId: property.geo_id || `BC-${property.prop_id || property.id}`,
    address,
    county: "Benton", // Default to Benton County
    state: "WA",      // Default to Washington state
    neighborhood: property.hood_cd,
    landArea: property.legal_acreage,
    landValue,
    improvementValue,
    totalValue: property.appraised_val || property.market,
    assessedValue: property.assessed_val,
    propertyType: property.property_use_desc,
    useCode: property.property_use_cd,
    location: {
      township: property.township_code,
      range: property.range_code,
      section: property.township_section,
      lot: property.tract_or_lot,
      block: property.block
    }
  };
}