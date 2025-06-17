use axum::{
    extract::{Path, Query, State},
    response::Json,
    routing::{get, post},
    Router,
};
use serde::Deserialize;
use sqlx::PgPool;
use crate::auth::{AuthenticatedUser, AnalystOrAbove};
use crate::models::{AppError, ValuationRequest, Valuation};
use crate::services::valuation::{
    calculate_valuation_with_db, 
    save_valuation, 
    get_valuation_history,
    batch_valuate_properties
};

#[derive(Deserialize)]
pub struct ValuationQuery {
    pub limit: Option<i32>,
}

#[derive(Deserialize)]
pub struct BatchValuationRequest {
    pub property_ids: Vec<i32>,
}

pub fn routes() -> Router<PgPool> {
    Router::new()
        .route("/api/valuation/:parcel_id", get(get_valuation))
        .route("/api/valuation/:parcel_id/history", get(get_valuation_history_endpoint))
        .route("/api/valuation", post(create_valuation))
        .route("/api/valuation/batch", post(batch_valuation))
}

async fn get_valuation(
    Path(parcel_id): Path<i32>,
    State(pool): State<PgPool>,
    _user: AuthenticatedUser,
) -> Result<Json<serde_json::Value>, AppError> {
    // Get the most recent valuation for this parcel
    let valuation = sqlx::query_as::<_, Valuation>(
        "SELECT * FROM valuation WHERE parcel_id = $1 ORDER BY created_at DESC LIMIT 1"
    )
    .bind(parcel_id)
    .fetch_optional(&pool)
    .await?;

    if let Some(val) = valuation {
        Ok(Json(serde_json::json!({
            "valuation": val,
            "status": "found"
        })))
    } else {
        // If no existing valuation, try to calculate one
        let property = sqlx::query!(
            "SELECT id, parcel_id, imp_type, quality, sqft, year_built, region 
             FROM property WHERE id = $1",
            parcel_id
        )
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Property {} not found", parcel_id)))?;

        if let (Some(imp_type), Some(quality), Some(sqft), Some(year_built), Some(region)) = 
            (property.imp_type, property.quality, property.sqft, property.year_built, property.region) {
            
            let calculation = calculate_valuation_with_db(
                &pool,
                parcel_id,
                &imp_type,
                &quality,
                sqft,
                year_built,
                &region,
                None,
                None,
            ).await?;

            Ok(Json(serde_json::json!({
                "calculation": calculation,
                "status": "calculated",
                "note": "This is a fresh calculation. Use POST to save it."
            })))
        } else {
            Err(AppError::Validation("Property missing required data for valuation".to_string()))
        }
    }
}

async fn get_valuation_history_endpoint(
    Path(parcel_id): Path<i32>,
    Query(params): Query<ValuationQuery>,
    State(pool): State<PgPool>,
    _user: AuthenticatedUser,
) -> Result<Json<Vec<Valuation>>, AppError> {
    let history = get_valuation_history(&pool, parcel_id, params.limit).await?;
    Ok(Json(history))
}

async fn create_valuation(
    State(pool): State<PgPool>,
    user: AuthenticatedUser,
    _analyst: AnalystOrAbove,
    Json(req): Json<ValuationRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Verify the property exists
    let property = sqlx::query!(
        "SELECT id FROM property WHERE id = $1",
        req.parcel_id
    )
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Property {} not found", req.parcel_id)))?;

    // Calculate the valuation
    let calculation = calculate_valuation_with_db(
        &pool,
        req.parcel_id,
        &req.imp_type,
        &req.quality,
        req.sqft,
        req.year_built,
        &req.region,
        None,
        None,
    ).await?;

    // Extract values for saving
    let calc_details = &calculation["calculation_details"];
    let rcn = calc_details["rcn"].as_f64().unwrap_or(0.0);
    let percent_good = calc_details["percent_good"].as_f64().unwrap_or(0.0);
    let final_value = calc_details["final_value"].as_f64().unwrap_or(0.0);

    // Save the valuation
    let saved_valuation = save_valuation(
        &pool,
        req.parcel_id,
        &req.imp_type,
        &req.quality,
        req.sqft,
        req.year_built,
        &req.region,
        rcn,
        percent_good,
        final_value,
        calculation.clone(),
        Some(user.user_id),
    ).await?;

    Ok(Json(serde_json::json!({
        "valuation": saved_valuation,
        "calculation": calculation,
        "status": "saved"
    })))
}

async fn batch_valuation(
    State(pool): State<PgPool>,
    user: AuthenticatedUser,
    _analyst: AnalystOrAbove,
    Json(req): Json<BatchValuationRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    if req.property_ids.len() > 1000 {
        return Err(AppError::Validation("Batch size cannot exceed 1000 properties".to_string()));
    }

    let results = batch_valuate_properties(&pool, req.property_ids, Some(user.user_id)).await?;
    
    let success_count = results.iter()
        .filter(|r| r["status"] == "success")
        .count();
    
    let error_count = results.len() - success_count;

    Ok(Json(serde_json::json!({
        "results": results,
        "summary": {
            "total_requested": results.len(),
            "successful": success_count,
            "errors": error_count
        }
    })))
}