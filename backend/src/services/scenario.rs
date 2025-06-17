use serde_json::{json, Value};
use crate::models::{AppError, Scenario};
use crate::services::valuation::{calculate_rcn, apply_depreciation};
use sqlx::PgPool;

/// Run a single scenario calculation
pub fn run_scenario_calculation(
    base_cost: f64,
    sqft: f64,
    market_factor: f64,
    location_factor: f64,
    percent_good: f64,
) -> Value {
    let rcn = calculate_rcn(base_cost, sqft, market_factor, location_factor);
    let final_value = apply_depreciation(rcn, percent_good);
    
    json!({
        "inputs": {
            "base_cost_per_sqft": base_cost,
            "sqft": sqft,
            "market_factor": market_factor,
            "location_factor": location_factor,
            "percent_good": percent_good
        },
        "calculations": {
            "rcn": rcn,
            "depreciation_applied": rcn - final_value,
            "final_value": final_value
        },
        "summary": {
            "cost_per_sqft": final_value / sqft,
            "total_value": final_value
        }
    })
}

/// Run multiple scenario variations
pub fn run_scenario_matrix(
    base_cost: f64,
    sqft: f64,
    market_factors: Vec<f64>,
    location_factors: Vec<f64>,
    percent_goods: Vec<f64>,
) -> Value {
    let mut scenarios = Vec::new();
    let mut scenario_id = 1;
    
    for market in &market_factors {
        for location in &location_factors {
            for percent_good in &percent_goods {
                let result = run_scenario_calculation(
                    base_cost,
                    sqft,
                    *market,
                    *location,
                    *percent_good,
                );
                
                scenarios.push(json!({
                    "scenario_id": scenario_id,
                    "parameters": {
                        "market_factor": market,
                        "location_factor": location,
                        "percent_good": percent_good
                    },
                    "result": result
                }));
                
                scenario_id += 1;
            }
        }
    }
    
    json!({
        "base_inputs": {
            "base_cost_per_sqft": base_cost,
            "sqft": sqft
        },
        "scenarios": scenarios,
        "summary": {
            "total_scenarios": scenarios.len(),
            "value_range": calculate_value_range(&scenarios)
        }
    })
}

/// Calculate value range from scenarios
fn calculate_value_range(scenarios: &[Value]) -> Value {
    let values: Vec<f64> = scenarios
        .iter()
        .filter_map(|s| s["result"]["calculations"]["final_value"].as_f64())
        .collect();
    
    if values.is_empty() {
        return json!({"min": 0, "max": 0, "avg": 0});
    }
    
    let min = values.iter().fold(f64::INFINITY, |a, &b| a.min(b));
    let max = values.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b));
    let avg = values.iter().sum::<f64>() / values.len() as f64;
    
    json!({
        "min": min,
        "max": max,
        "avg": avg,
        "variance": max - min
    })
}

/// Save scenario to database
pub async fn save_scenario(
    pool: &PgPool,
    name: &str,
    description: Option<&str>,
    parameters: Value,
    results: Option<Value>,
    created_by: Option<i32>,
) -> Result<Scenario, AppError> {
    let scenario = sqlx::query_as::<_, Scenario>(
        "INSERT INTO scenario (name, description, parameters, results, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *"
    )
    .bind(name)
    .bind(description)
    .bind(parameters)
    .bind(results)
    .bind(created_by)
    .fetch_one(pool)
    .await?;
    
    Ok(scenario)
}

/// Get scenario by ID
pub async fn get_scenario(pool: &PgPool, scenario_id: i32) -> Result<Scenario, AppError> {
    let scenario = sqlx::query_as::<_, Scenario>(
        "SELECT * FROM scenario WHERE id = $1"
    )
    .bind(scenario_id)
    .fetch_optional(pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Scenario {} not found", scenario_id)))?;
    
    Ok(scenario)
}

/// List scenarios with pagination
pub async fn list_scenarios(
    pool: &PgPool,
    limit: Option<i32>,
    offset: Option<i32>,
    created_by: Option<i32>,
) -> Result<Vec<Scenario>, AppError> {
    let limit = limit.unwrap_or(50);
    let offset = offset.unwrap_or(0);
    
    let mut query = "SELECT * FROM scenario WHERE 1=1".to_string();
    let mut params = Vec::new();
    
    if let Some(user_id) = created_by {
        query.push_str(" AND created_by = $1");
        params.push(user_id);
    }
    
    query.push_str(" ORDER BY created_at DESC LIMIT $");
    query.push_str(&(params.len() + 1).to_string());
    query.push_str(" OFFSET $");
    query.push_str(&(params.len() + 2).to_string());
    
    let mut sql_query = sqlx::query_as::<_, Scenario>(&query);
    
    for param in params {
        sql_query = sql_query.bind(param);
    }
    
    let scenarios = sql_query
        .bind(limit)
        .bind(offset)
        .fetch_all(pool)
        .await?;
    
    Ok(scenarios)
}

/// Delete scenario
pub async fn delete_scenario(
    pool: &PgPool,
    scenario_id: i32,
    user_id: i32,
    user_role: &str,
) -> Result<(), AppError> {
    // Check if user owns the scenario or is admin
    let scenario = get_scenario(pool, scenario_id).await?;
    
    if scenario.created_by != Some(user_id) && user_role != "admin" {
        return Err(AppError::Authorization(
            "You can only delete your own scenarios".to_string()
        ));
    }
    
    sqlx::query("DELETE FROM scenario WHERE id = $1")
        .bind(scenario_id)
        .execute(pool)
        .await?;
    
    Ok(())
}

/// Scenario comparison analysis
pub fn compare_scenarios(scenarios: Vec<Value>) -> Value {
    if scenarios.is_empty() {
        return json!({"error": "No scenarios to compare"});
    }
    
    let mut comparison = json!({
        "scenario_count": scenarios.len(),
        "comparisons": []
    });
    
    let mut values = Vec::new();
    let mut rcns = Vec::new();
    
    for (i, scenario) in scenarios.iter().enumerate() {
        if let (Some(final_value), Some(rcn)) = (
            scenario["calculations"]["final_value"].as_f64(),
            scenario["calculations"]["rcn"].as_f64(),
        ) {
            values.push(final_value);
            rcns.push(rcn);
            
            comparison["comparisons"].as_array_mut().unwrap().push(json!({
                "scenario_index": i,
                "final_value": final_value,
                "rcn": rcn,
                "value_to_rcn_ratio": final_value / rcn
            }));
        }
    }
    
    if !values.is_empty() {
        let min_value = values.iter().fold(f64::INFINITY, |a, &b| a.min(b));
        let max_value = values.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b));
        let avg_value = values.iter().sum::<f64>() / values.len() as f64;
        
        comparison["analysis"] = json!({
            "value_range": {
                "min": min_value,
                "max": max_value,
                "avg": avg_value,
                "spread": max_value - min_value,
                "spread_percentage": ((max_value - min_value) / avg_value) * 100.0
            },
            "best_scenario": values.iter().position(|&v| v == max_value).unwrap_or(0),
            "worst_scenario": values.iter().position(|&v| v == min_value).unwrap_or(0)
        });
    }
    
    comparison
}