use serde_json::json;
use crate::models::{AppError, Valuation, CostTable, DepreciationSchedule};
use sqlx::PgPool;

/// Calculates RCN (Replacement Cost New)
pub fn calculate_rcn(base_cost: f64, sqft: f64, market_factor: f64, location_factor: f64) -> f64 {
    base_cost * sqft * market_factor * location_factor
}

/// Applies depreciation schedule to RCN
pub fn apply_depreciation(rcn: f64, percent_good: f64) -> f64 {
    rcn * percent_good
}

/// Gets cost factor from database
pub async fn get_cost_factor(
    pool: &PgPool, 
    imp_type: &str, 
    quality: &str, 
    year: i32, 
    region: &str
) -> Result<CostTable, AppError> {
    sqlx::query_as::<_, CostTable>(
        "SELECT * FROM cost_table 
         WHERE imp_type = $1 AND quality = $2 AND year = $3 AND region = $4 
         ORDER BY version DESC LIMIT 1"
    )
    .bind(imp_type)
    .bind(quality)
    .bind(year)
    .bind(region)
    .fetch_optional(pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!(
        "Cost factor not found for {}/{}/{}/{}", imp_type, quality, year, region
    )))
}

/// Gets depreciation factor from database
pub async fn get_depreciation_factor(
    pool: &PgPool,
    schedule_type: &str,
    effective_age: i32
) -> Result<f64, AppError> {
    // Find the closest age match (equal or next higher age)
    let depreciation = sqlx::query_as::<_, DepreciationSchedule>(
        "SELECT * FROM depreciation_schedule 
         WHERE schedule_type = $1 AND effective_age >= $2 
         ORDER BY effective_age ASC LIMIT 1"
    )
    .bind(schedule_type)
    .bind(effective_age)
    .fetch_optional(pool)
    .await?;

    if let Some(dep) = depreciation {
        Ok(dep.percent_good)
    } else {
        // If no higher age found, get the highest available
        let fallback = sqlx::query_as::<_, DepreciationSchedule>(
            "SELECT * FROM depreciation_schedule 
             WHERE schedule_type = $1 
             ORDER BY effective_age DESC LIMIT 1"
        )
        .bind(schedule_type)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!(
            "Depreciation schedule not found for {}", schedule_type
        )))?;
        
        Ok(fallback.percent_good)
    }
}

/// Full valuation logic with database lookups
pub async fn calculate_valuation_with_db(
    pool: &PgPool,
    parcel_id: i32,
    imp_type: &str,
    quality: &str,
    sqft: f64,
    year_built: i32,
    region: &str,
    market_factor: Option<f64>,
    location_factor: Option<f64>,
) -> Result<serde_json::Value, AppError> {
    let current_year = chrono::Utc::now().year();
    let effective_age = (current_year - year_built).max(0) as i32;
    
    // Get cost factor from database
    let cost_table = get_cost_factor(pool, imp_type, quality, current_year, region).await?;
    
    // Get depreciation factor
    let percent_good = get_depreciation_factor(pool, imp_type, effective_age).await?;
    
    // Apply default factors if not provided
    let market = market_factor.unwrap_or(1.05); // 5% market adjustment
    let location = location_factor.unwrap_or(1.02); // 2% location adjustment
    
    // Calculate values
    let rcn = calculate_rcn(cost_table.cost_per_sqft, sqft, market, location);
    let final_value = apply_depreciation(rcn, percent_good);
    
    Ok(json!({
        "parcel_id": parcel_id,
        "calculation_details": {
            "base_cost_per_sqft": cost_table.cost_per_sqft,
            "sqft": sqft,
            "market_factor": market,
            "location_factor": location,
            "effective_age": effective_age,
            "percent_good": percent_good,
            "rcn": rcn,
            "final_value": final_value
        },
        "cost_source": {
            "source": cost_table.source,
            "version": cost_table.version,
            "effective_date": cost_table.effective_date
        },
        "summary": {
            "imp_type": imp_type,
            "quality": quality,
            "year_built": year_built,
            "region": region,
            "final_value": final_value
        }
    }))
}

/// Save valuation to database
pub async fn save_valuation(
    pool: &PgPool,
    parcel_id: i32,
    imp_type: &str,
    quality: &str,
    sqft: f64,
    year_built: i32,
    region: &str,
    rcn: f64,
    percent_good: f64,
    final_value: f64,
    calculation_chain: serde_json::Value,
    created_by: Option<i32>,
) -> Result<Valuation, AppError> {
    let valuation = sqlx::query_as::<_, Valuation>(
        "INSERT INTO valuation 
         (parcel_id, imp_type, quality, sqft, year_built, region, rcn, percent_good, final_value, calculation_chain, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *"
    )
    .bind(parcel_id)
    .bind(imp_type)
    .bind(quality)
    .bind(sqft)
    .bind(year_built)
    .bind(region)
    .bind(rcn)
    .bind(percent_good)
    .bind(final_value)
    .bind(calculation_chain)
    .bind(created_by)
    .fetch_one(pool)
    .await?;
    
    Ok(valuation)
}

/// Get valuation history for a parcel
pub async fn get_valuation_history(
    pool: &PgPool,
    parcel_id: i32,
    limit: Option<i32>
) -> Result<Vec<Valuation>, AppError> {
    let limit = limit.unwrap_or(10);
    
    let valuations = sqlx::query_as::<_, Valuation>(
        "SELECT * FROM valuation 
         WHERE parcel_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2"
    )
    .bind(parcel_id)
    .bind(limit)
    .fetch_all(pool)
    .await?;
    
    Ok(valuations)
}

/// Batch valuation for multiple properties
pub async fn batch_valuate_properties(
    pool: &PgPool,
    property_ids: Vec<i32>,
    created_by: Option<i32>
) -> Result<Vec<serde_json::Value>, AppError> {
    let mut results = Vec::new();
    
    for property_id in property_ids {
        // Get property details
        let property = sqlx::query!(
            "SELECT parcel_id, imp_type, quality, sqft, year_built, region 
             FROM property WHERE id = $1",
            property_id
        )
        .fetch_optional(pool)
        .await?;
        
        if let Some(prop) = property {
            if let (Some(imp_type), Some(quality), Some(sqft), Some(year_built), Some(region)) = 
                (prop.imp_type, prop.quality, prop.sqft, prop.year_built, prop.region) {
                
                match calculate_valuation_with_db(
                    pool,
                    property_id,
                    &imp_type,
                    &quality,
                    sqft,
                    year_built,
                    &region,
                    None,
                    None,
                ).await {
                    Ok(valuation_result) => {
                        // Extract values for saving
                        if let (Some(rcn), Some(percent_good), Some(final_value)) = (
                            valuation_result["calculation_details"]["rcn"].as_f64(),
                            valuation_result["calculation_details"]["percent_good"].as_f64(),
                            valuation_result["calculation_details"]["final_value"].as_f64(),
                        ) {
                            let _ = save_valuation(
                                pool,
                                property_id,
                                &imp_type,
                                &quality,
                                sqft,
                                year_built,
                                &region,
                                rcn,
                                percent_good,
                                final_value,
                                valuation_result.clone(),
                                created_by,
                            ).await;
                        }
                        
                        results.push(json!({
                            "property_id": property_id,
                            "status": "success",
                            "valuation": valuation_result
                        }));
                    }
                    Err(e) => {
                        results.push(json!({
                            "property_id": property_id,
                            "status": "error",
                            "error": e.to_string()
                        }));
                    }
                }
            } else {
                results.push(json!({
                    "property_id": property_id,
                    "status": "error",
                    "error": "Missing required property data"
                }));
            }
        } else {
            results.push(json!({
                "property_id": property_id,
                "status": "error",
                "error": "Property not found"
            }));
        }
    }
    
    Ok(results)
}