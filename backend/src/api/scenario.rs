use axum::{
    extract::{Path, Query, State},
    response::Json,
    routing::{get, post, delete},
    Router,
};
use serde::Deserialize;
use sqlx::PgPool;
use crate::auth::{AuthenticatedUser, AnalystOrAbove};
use crate::models::{AppError, ScenarioRequest, Scenario};
use crate::services::scenario::{
    run_scenario_calculation, 
    run_scenario_matrix, 
    save_scenario, 
    get_scenario,
    list_scenarios,
    delete_scenario,
    compare_scenarios
};

#[derive(Deserialize)]
pub struct ScenarioQuery {
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}

#[derive(Deserialize)]
pub struct MatrixScenarioRequest {
    pub name: String,
    pub description: Option<String>,
    pub base_cost: f64,
    pub sqft: f64,
    pub market_factors: Vec<f64>,
    pub location_factors: Vec<f64>,
    pub percent_goods: Vec<f64>,
}

#[derive(Deserialize)]
pub struct CompareRequest {
    pub scenario_ids: Vec<i32>,
}

pub fn routes() -> Router<PgPool> {
    Router::new()
        .route("/api/scenario", get(list_scenarios_endpoint).post(create_scenario))
        .route("/api/scenario/matrix", post(create_matrix_scenario))
        .route("/api/scenario/compare", post(compare_scenarios_endpoint))
        .route("/api/scenario/:id", get(get_scenario_endpoint).delete(delete_scenario_endpoint))
}

async fn create_scenario(
    State(pool): State<PgPool>,
    user: AuthenticatedUser,
    _analyst: AnalystOrAbove,
    Json(req): Json<ScenarioRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Run the scenario calculation
    let result = run_scenario_calculation(
        req.base_cost,
        req.sqft,
        req.market_factor,
        req.location_factor,
        req.percent_good,
    );

    // Prepare parameters for storage
    let parameters = serde_json::json!({
        "base_cost": req.base_cost,
        "sqft": req.sqft,
        "market_factor": req.market_factor,
        "location_factor": req.location_factor,
        "percent_good": req.percent_good
    });

    // Save scenario to database
    let scenario = save_scenario(
        &pool,
        &req.name,
        req.description.as_deref(),
        parameters,
        Some(result.clone()),
        Some(user.user_id),
    ).await?;

    Ok(Json(serde_json::json!({
        "scenario": scenario,
        "calculation": result
    })))
}

async fn create_matrix_scenario(
    State(pool): State<PgPool>,
    user: AuthenticatedUser,
    _analyst: AnalystOrAbove,
    Json(req): Json<MatrixScenarioRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Validate matrix size
    let total_scenarios = req.market_factors.len() * req.location_factors.len() * req.percent_goods.len();
    if total_scenarios > 100 {
        return Err(AppError::Validation("Matrix scenario cannot exceed 100 combinations".to_string()));
    }

    // Run matrix calculation
    let result = run_scenario_matrix(
        req.base_cost,
        req.sqft,
        req.market_factors.clone(),
        req.location_factors.clone(),
        req.percent_goods.clone(),
    );

    // Prepare parameters for storage
    let parameters = serde_json::json!({
        "base_cost": req.base_cost,
        "sqft": req.sqft,
        "market_factors": req.market_factors,
        "location_factors": req.location_factors,
        "percent_goods": req.percent_goods,
        "scenario_type": "matrix"
    });

    // Save scenario to database
    let scenario = save_scenario(
        &pool,
        &req.name,
        req.description.as_deref(),
        parameters,
        Some(result.clone()),
        Some(user.user_id),
    ).await?;

    Ok(Json(serde_json::json!({
        "scenario": scenario,
        "matrix_result": result
    })))
}

async fn get_scenario_endpoint(
    Path(id): Path<i32>,
    State(pool): State<PgPool>,
    _user: AuthenticatedUser,
) -> Result<Json<Scenario>, AppError> {
    let scenario = get_scenario(&pool, id).await?;
    Ok(Json(scenario))
}

async fn list_scenarios_endpoint(
    Query(params): Query<ScenarioQuery>,
    State(pool): State<PgPool>,
    user: AuthenticatedUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let scenarios = list_scenarios(
        &pool,
        params.limit,
        params.offset,
        Some(user.user_id),
    ).await?;

    // Get total count
    let total_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM scenario WHERE created_by = $1"
    )
    .bind(user.user_id)
    .fetch_one(&pool)
    .await?;

    Ok(Json(serde_json::json!({
        "scenarios": scenarios,
        "pagination": {
            "total": total_count,
            "limit": params.limit.unwrap_or(50),
            "offset": params.offset.unwrap_or(0)
        }
    })))
}

async fn delete_scenario_endpoint(
    Path(id): Path<i32>,
    State(pool): State<PgPool>,
    user: AuthenticatedUser,
) -> Result<Json<serde_json::Value>, AppError> {
    delete_scenario(&pool, id, user.user_id, &user.role).await?;
    
    Ok(Json(serde_json::json!({
        "message": "Scenario deleted successfully",
        "scenario_id": id
    })))
}

async fn compare_scenarios_endpoint(
    State(pool): State<PgPool>,
    user: AuthenticatedUser,
    Json(req): Json<CompareRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    if req.scenario_ids.len() > 10 {
        return Err(AppError::Validation("Cannot compare more than 10 scenarios at once".to_string()));
    }

    let mut scenario_results = Vec::new();
    
    for scenario_id in req.scenario_ids {
        let scenario = get_scenario(&pool, scenario_id).await?;
        
        // Verify user has access to this scenario
        if scenario.created_by != Some(user.user_id) && user.role != "admin" {
            return Err(AppError::Authorization(
                format!("You don't have access to scenario {}", scenario_id)
            ));
        }
        
        if let Some(results) = scenario.results {
            scenario_results.push(serde_json::json!({
                "scenario_id": scenario_id,
                "name": scenario.name,
                "results": results
            }));
        }
    }

    if scenario_results.is_empty() {
        return Err(AppError::Validation("No valid scenario results found for comparison".to_string()));
    }

    // Extract calculation results for comparison
    let calculations: Vec<serde_json::Value> = scenario_results
        .iter()
        .filter_map(|s| s["results"]["calculations"].clone().into())
        .collect();

    let comparison = compare_scenarios(calculations);

    Ok(Json(serde_json::json!({
        "scenarios": scenario_results,
        "comparison": comparison
    })))
}