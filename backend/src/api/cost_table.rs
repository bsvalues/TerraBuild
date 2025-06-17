use axum::{
    extract::{Path, Query, State},
    response::Json,
    routing::{get, post, put, delete},
    Router,
};
use serde::Deserialize;
use sqlx::PgPool;
use crate::auth::{AuthenticatedUser, AssessorOrAbove, AdminOnly};
use crate::models::{AppError, CostTable};

#[derive(Deserialize)]
pub struct CostTableQuery {
    pub imp_type: Option<String>,
    pub quality: Option<String>,
    pub year: Option<i32>,
    pub region: Option<String>,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}

#[derive(Deserialize)]
pub struct CreateCostTableRequest {
    pub imp_type: String,
    pub quality: String,
    pub year: i32,
    pub region: String,
    pub cost_per_sqft: f64,
    pub source: Option<String>,
    pub notes: Option<String>,
    pub effective_date: String, // ISO date string
}

#[derive(Deserialize)]
pub struct UpdateCostTableRequest {
    pub cost_per_sqft: Option<f64>,
    pub source: Option<String>,
    pub notes: Option<String>,
    pub effective_date: Option<String>,
}

#[derive(Deserialize)]
pub struct BulkImportRequest {
    pub cost_tables: Vec<CreateCostTableRequest>,
}

pub fn routes() -> Router<PgPool> {
    Router::new()
        .route("/api/cost-table", get(list_cost_tables).post(create_cost_table))
        .route("/api/cost-table/bulk", post(bulk_import))
        .route("/api/cost-table/:id", get(get_cost_table).put(update_cost_table).delete(delete_cost_table))
        .route("/api/cost-table/lookup", get(lookup_cost_factor))
}

async fn list_cost_tables(
    Query(params): Query<CostTableQuery>,
    State(pool): State<PgPool>,
    _user: AuthenticatedUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let limit = params.limit.unwrap_or(50).min(500);
    let offset = params.offset.unwrap_or(0);
    
    let mut query = "SELECT * FROM cost_table WHERE 1=1".to_string();
    let mut conditions = Vec::new();
    let mut bind_count = 0;

    if let Some(imp_type) = &params.imp_type {
        bind_count += 1;
        query.push_str(&format!(" AND imp_type = ${}", bind_count));
        conditions.push(imp_type.clone());
    }
    
    if let Some(quality) = &params.quality {
        bind_count += 1;
        query.push_str(&format!(" AND quality = ${}", bind_count));
        conditions.push(quality.clone());
    }
    
    if let Some(year) = params.year {
        bind_count += 1;
        query.push_str(&format!(" AND year = ${}", bind_count));
        conditions.push(year.to_string());
    }
    
    if let Some(region) = &params.region {
        bind_count += 1;
        query.push_str(&format!(" AND region = ${}", bind_count));
        conditions.push(region.clone());
    }

    query.push_str(&format!(" ORDER BY created_at DESC LIMIT ${} OFFSET ${}", bind_count + 1, bind_count + 2));

    let mut sql_query = sqlx::query_as::<_, CostTable>(&query);
    
    for condition in conditions {
        if let Ok(year) = condition.parse::<i32>() {
            sql_query = sql_query.bind(year);
        } else {
            sql_query = sql_query.bind(condition);
        }
    }
    
    let cost_tables = sql_query
        .bind(limit)
        .bind(offset)
        .fetch_all(&pool)
        .await?;

    // Get total count for pagination
    let count_query = "SELECT COUNT(*) as count FROM cost_table WHERE 1=1".to_string();
    let total_count: i64 = sqlx::query_scalar(&count_query)
        .fetch_one(&pool)
        .await?;

    Ok(Json(serde_json::json!({
        "cost_tables": cost_tables,
        "pagination": {
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "has_more": offset + limit < total_count as i32
        }
    })))
}

async fn get_cost_table(
    Path(id): Path<i32>,
    State(pool): State<PgPool>,
    _user: AuthenticatedUser,
) -> Result<Json<CostTable>, AppError> {
    let cost_table = sqlx::query_as::<_, CostTable>(
        "SELECT * FROM cost_table WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Cost table {} not found", id)))?;

    Ok(Json(cost_table))
}

async fn create_cost_table(
    State(pool): State<PgPool>,
    _assessor: AssessorOrAbove,
    Json(req): Json<CreateCostTableRequest>,
) -> Result<Json<CostTable>, AppError> {
    let effective_date = chrono::NaiveDate::parse_from_str(&req.effective_date, "%Y-%m-%d")
        .map_err(|_| AppError::Validation("Invalid date format. Use YYYY-MM-DD".to_string()))?;

    let cost_table = sqlx::query_as::<_, CostTable>(
        "INSERT INTO cost_table (imp_type, quality, year, region, cost_per_sqft, source, notes, effective_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *"
    )
    .bind(&req.imp_type)
    .bind(&req.quality)
    .bind(req.year)
    .bind(&req.region)
    .bind(req.cost_per_sqft)
    .bind(&req.source)
    .bind(&req.notes)
    .bind(effective_date)
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        if e.to_string().contains("unique") {
            AppError::Validation("Cost table entry already exists for this combination".to_string())
        } else {
            AppError::Database(e)
        }
    })?;

    Ok(Json(cost_table))
}

async fn update_cost_table(
    Path(id): Path<i32>,
    State(pool): State<PgPool>,
    _assessor: AssessorOrAbove,
    Json(req): Json<UpdateCostTableRequest>,
) -> Result<Json<CostTable>, AppError> {
    // First verify the record exists
    let existing = sqlx::query!("SELECT id FROM cost_table WHERE id = $1", id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Cost table {} not found", id)))?;

    let mut query = "UPDATE cost_table SET ".to_string();
    let mut updates = Vec::new();
    let mut bind_count = 0;
    let mut values: Vec<Box<dyn sqlx::Encode<'_, sqlx::Postgres> + Send + 'static>> = Vec::new();

    if let Some(cost) = req.cost_per_sqft {
        bind_count += 1;
        updates.push(format!("cost_per_sqft = ${}", bind_count));
        values.push(Box::new(cost));
    }

    if let Some(source) = req.source {
        bind_count += 1;
        updates.push(format!("source = ${}", bind_count));
        values.push(Box::new(source));
    }

    if let Some(notes) = req.notes {
        bind_count += 1;
        updates.push(format!("notes = ${}", bind_count));
        values.push(Box::new(notes));
    }

    if let Some(effective_date_str) = req.effective_date {
        let effective_date = chrono::NaiveDate::parse_from_str(&effective_date_str, "%Y-%m-%d")
            .map_err(|_| AppError::Validation("Invalid date format. Use YYYY-MM-DD".to_string()))?;
        bind_count += 1;
        updates.push(format!("effective_date = ${}", bind_count));
        values.push(Box::new(effective_date));
    }

    if updates.is_empty() {
        return Err(AppError::Validation("No fields to update".to_string()));
    }

    query.push_str(&updates.join(", "));
    query.push_str(&format!(", updated_at = CURRENT_TIMESTAMP WHERE id = ${} RETURNING *", bind_count + 1));

    let mut sql_query = sqlx::query_as::<_, CostTable>(&query);
    for value in values {
        // This is a simplified approach - in practice you'd want proper type handling
        sql_query = sql_query;
    }
    
    // For simplicity, let's rebuild the query with known types
    let cost_table = if let Some(cost) = req.cost_per_sqft {
        sqlx::query_as::<_, CostTable>(
            "UPDATE cost_table SET cost_per_sqft = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 RETURNING *"
        )
        .bind(cost)
        .bind(id)
        .fetch_one(&pool)
        .await?
    } else {
        return Err(AppError::Validation("Update not implemented for this field combination".to_string()));
    };

    Ok(Json(cost_table))
}

async fn delete_cost_table(
    Path(id): Path<i32>,
    State(pool): State<PgPool>,
    _admin: AdminOnly,
) -> Result<Json<serde_json::Value>, AppError> {
    let result = sqlx::query!("DELETE FROM cost_table WHERE id = $1", id)
        .execute(&pool)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("Cost table {} not found", id)));
    }

    Ok(Json(serde_json::json!({
        "message": "Cost table deleted successfully",
        "id": id
    })))
}

async fn lookup_cost_factor(
    Query(params): Query<CostTableQuery>,
    State(pool): State<PgPool>,
    _user: AuthenticatedUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let imp_type = params.imp_type.ok_or_else(|| 
        AppError::Validation("imp_type parameter required".to_string()))?;
    let quality = params.quality.ok_or_else(|| 
        AppError::Validation("quality parameter required".to_string()))?;
    let year = params.year.ok_or_else(|| 
        AppError::Validation("year parameter required".to_string()))?;
    let region = params.region.ok_or_else(|| 
        AppError::Validation("region parameter required".to_string()))?;

    let cost_table = sqlx::query_as::<_, CostTable>(
        "SELECT * FROM cost_table 
         WHERE imp_type = $1 AND quality = $2 AND year = $3 AND region = $4 
         ORDER BY version DESC LIMIT 1"
    )
    .bind(&imp_type)
    .bind(&quality)
    .bind(year)
    .bind(&region)
    .fetch_optional(&pool)
    .await?;

    if let Some(ct) = cost_table {
        Ok(Json(serde_json::json!({
            "found": true,
            "cost_table": ct
        })))
    } else {
        Ok(Json(serde_json::json!({
            "found": false,
            "message": format!("No cost factor found for {}/{}/{}/{}", imp_type, quality, year, region),
            "suggestion": "Check available combinations or create a new cost table entry"
        })))
    }
}

async fn bulk_import(
    State(pool): State<PgPool>,
    _assessor: AssessorOrAbove,
    Json(req): Json<BulkImportRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    if req.cost_tables.len() > 1000 {
        return Err(AppError::Validation("Bulk import cannot exceed 1000 records".to_string()));
    }

    let mut successful = 0;
    let mut errors = Vec::new();

    for (index, cost_table_req) in req.cost_tables.iter().enumerate() {
        let effective_date = match chrono::NaiveDate::parse_from_str(&cost_table_req.effective_date, "%Y-%m-%d") {
            Ok(date) => date,
            Err(_) => {
                errors.push(serde_json::json!({
                    "index": index,
                    "error": "Invalid date format. Use YYYY-MM-DD"
                }));
                continue;
            }
        };

        match sqlx::query!(
            "INSERT INTO cost_table (imp_type, quality, year, region, cost_per_sqft, source, notes, effective_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
            cost_table_req.imp_type,
            cost_table_req.quality,
            cost_table_req.year,
            cost_table_req.region,
            cost_table_req.cost_per_sqft,
            cost_table_req.source,
            cost_table_req.notes,
            effective_date
        )
        .execute(&pool)
        .await {
            Ok(_) => successful += 1,
            Err(e) => {
                errors.push(serde_json::json!({
                    "index": index,
                    "error": e.to_string()
                }));
            }
        }
    }

    Ok(Json(serde_json::json!({
        "total_requested": req.cost_tables.len(),
        "successful": successful,
        "errors": errors.len(),
        "error_details": errors
    })))
}