use axum::{
    extract::{Query, State},
    response::Json,
    routing::get,
    Router,
};
use serde::Deserialize;
use sqlx::PgPool;
use crate::auth::AuthenticatedUser;
use crate::models::{AppError, SummaryReport, RegionSummary, PropertyTypeSummary};

#[derive(Deserialize)]
pub struct ReportQuery {
    pub region: Option<String>,
    pub imp_type: Option<String>,
    pub year_from: Option<i32>,
    pub year_to: Option<i32>,
}

pub fn routes() -> Router<PgPool> {
    Router::new()
        .route("/api/report/summary", get(get_summary_report))
        .route("/api/report/regional", get(get_regional_report))
        .route("/api/report/trends", get(get_trends_report))
        .route("/api/report/valuations", get(get_valuation_report))
}

async fn get_summary_report(
    Query(params): Query<ReportQuery>,
    State(pool): State<PgPool>,
    _user: AuthenticatedUser,
) -> Result<Json<SummaryReport>, AppError> {
    // Build WHERE clause based on filters
    let mut where_conditions = Vec::new();
    let mut bind_values: Vec<Box<dyn sqlx::Encode<'_, sqlx::Postgres> + Send + 'static>> = Vec::new();
    let mut bind_count = 0;

    if let Some(region) = &params.region {
        bind_count += 1;
        where_conditions.push(format!("p.region = ${}", bind_count));
        bind_values.push(Box::new(region.clone()));
    }

    if let Some(imp_type) = &params.imp_type {
        bind_count += 1;
        where_conditions.push(format!("p.imp_type = ${}", bind_count));
        bind_values.push(Box::new(imp_type.clone()));
    }

    if let Some(year_from) = params.year_from {
        bind_count += 1;
        where_conditions.push(format!("p.year_built >= ${}", bind_count));
        bind_values.push(Box::new(year_from));
    }

    if let Some(year_to) = params.year_to {
        bind_count += 1;
        where_conditions.push(format!("p.year_built <= ${}", bind_count));
        bind_values.push(Box::new(year_to));
    }

    let where_clause = if where_conditions.is_empty() {
        String::new()
    } else {
        format!(" AND {}", where_conditions.join(" AND "))
    };

    // Get total properties and average value
    let summary_query = format!(
        "SELECT 
            COUNT(*) as total_properties,
            COALESCE(AVG(v.final_value), 0) as avg_value
         FROM property p
         LEFT JOIN LATERAL (
             SELECT final_value FROM valuation 
             WHERE parcel_id = p.id 
             ORDER BY created_at DESC LIMIT 1
         ) v ON true
         WHERE p.imp_type IS NOT NULL{}",
        where_clause
    );

    let summary_row = sqlx::query(&summary_query)
        .fetch_one(&pool)
        .await?;

    let total_properties: i64 = summary_row.get("total_properties");
    let avg_value: f64 = summary_row.get("avg_value");

    // Get value distribution
    let distribution_query = format!(
        "SELECT 
            CASE 
                WHEN v.final_value < 100000 THEN 'Under $100k'
                WHEN v.final_value < 200000 THEN '$100k-$200k'
                WHEN v.final_value < 300000 THEN '$200k-$300k'
                WHEN v.final_value < 400000 THEN '$300k-$400k'
                WHEN v.final_value < 500000 THEN '$400k-$500k'
                ELSE '$500k+'
            END as value_range,
            COUNT(*) as count
         FROM property p
         LEFT JOIN LATERAL (
             SELECT final_value FROM valuation 
             WHERE parcel_id = p.id 
             ORDER BY created_at DESC LIMIT 1
         ) v ON true
         WHERE p.imp_type IS NOT NULL AND v.final_value IS NOT NULL{}
         GROUP BY value_range
         ORDER BY MIN(v.final_value)",
        where_clause
    );

    let distribution_rows = sqlx::query(&distribution_query)
        .fetch_all(&pool)
        .await?;

    let value_distribution: Vec<(String, i64)> = distribution_rows
        .into_iter()
        .map(|row| (row.get("value_range"), row.get("count")))
        .collect();

    // Get regional summaries
    let regional_query = format!(
        "SELECT 
            p.region,
            COUNT(*) as count,
            COALESCE(AVG(v.final_value), 0) as avg_value,
            COALESCE(SUM(v.final_value), 0) as total_value
         FROM property p
         LEFT JOIN LATERAL (
             SELECT final_value FROM valuation 
             WHERE parcel_id = p.id 
             ORDER BY created_at DESC LIMIT 1
         ) v ON true
         WHERE p.region IS NOT NULL{}
         GROUP BY p.region
         ORDER BY p.region",
        where_clause
    );

    let regional_rows = sqlx::query(&regional_query)
        .fetch_all(&pool)
        .await?;

    let by_region: Vec<RegionSummary> = regional_rows
        .into_iter()
        .map(|row| RegionSummary {
            region: row.get("region"),
            count: row.get("count"),
            avg_value: row.get("avg_value"),
            total_value: row.get("total_value"),
        })
        .collect();

    // Get property type summaries
    let property_type_query = format!(
        "SELECT 
            p.imp_type,
            COUNT(*) as count,
            COALESCE(AVG(v.final_value), 0) as avg_value,
            COALESCE(AVG(p.sqft), 0) as avg_sqft
         FROM property p
         LEFT JOIN LATERAL (
             SELECT final_value FROM valuation 
             WHERE parcel_id = p.id 
             ORDER BY created_at DESC LIMIT 1
         ) v ON true
         WHERE p.imp_type IS NOT NULL{}
         GROUP BY p.imp_type
         ORDER BY p.imp_type",
        where_clause
    );

    let property_type_rows = sqlx::query(&property_type_query)
        .fetch_all(&pool)
        .await?;

    let by_property_type: Vec<PropertyTypeSummary> = property_type_rows
        .into_iter()
        .map(|row| PropertyTypeSummary {
            imp_type: row.get("imp_type"),
            count: row.get("count"),
            avg_value: row.get("avg_value"),
            avg_sqft: row.get("avg_sqft"),
        })
        .collect();

    Ok(Json(SummaryReport {
        total_properties,
        avg_value,
        value_distribution,
        by_region,
        by_property_type,
    }))
}

async fn get_regional_report(
    State(pool): State<PgPool>,
    _user: AuthenticatedUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let regional_data = sqlx::query!(
        "SELECT 
            p.region,
            COUNT(*) as property_count,
            COALESCE(AVG(v.final_value), 0) as avg_value,
            COALESCE(SUM(v.final_value), 0) as total_value,
            COALESCE(AVG(p.sqft), 0) as avg_sqft,
            COUNT(DISTINCT p.imp_type) as property_types
         FROM property p
         LEFT JOIN LATERAL (
             SELECT final_value FROM valuation 
             WHERE parcel_id = p.id 
             ORDER BY created_at DESC LIMIT 1
         ) v ON true
         WHERE p.region IS NOT NULL
         GROUP BY p.region
         ORDER BY total_value DESC"
    )
    .fetch_all(&pool)
    .await?;

    let regions: Vec<serde_json::Value> = regional_data
        .into_iter()
        .map(|row| serde_json::json!({
            "region": row.region,
            "property_count": row.property_count,
            "avg_value": row.avg_value,
            "total_value": row.total_value,
            "avg_sqft": row.avg_sqft,
            "property_types": row.property_types,
            "value_per_sqft": if row.avg_sqft.unwrap_or(0.0) > 0.0 {
                row.avg_value.unwrap_or(0.0) / row.avg_sqft.unwrap_or(1.0)
            } else {
                0.0
            }
        }))
        .collect();

    Ok(Json(serde_json::json!({
        "regions": regions,
        "generated_at": chrono::Utc::now()
    })))
}

async fn get_trends_report(
    State(pool): State<PgPool>,
    _user: AuthenticatedUser,
) -> Result<Json<serde_json::Value>, AppError> {
    // Valuation trends over time
    let valuation_trends = sqlx::query!(
        "SELECT 
            DATE_TRUNC('month', created_at) as month,
            COUNT(*) as valuation_count,
            AVG(final_value) as avg_value,
            AVG(percent_good) as avg_condition
         FROM valuation
         WHERE created_at >= NOW() - INTERVAL '12 months'
         GROUP BY DATE_TRUNC('month', created_at)
         ORDER BY month"
    )
    .fetch_all(&pool)
    .await?;

    let monthly_trends: Vec<serde_json::Value> = valuation_trends
        .into_iter()
        .map(|row| serde_json::json!({
            "month": row.month,
            "valuation_count": row.valuation_count,
            "avg_value": row.avg_value,
            "avg_condition": row.avg_condition
        }))
        .collect();

    // Property age distribution impact on values
    let age_impact = sqlx::query!(
        "SELECT 
            CASE 
                WHEN (EXTRACT(YEAR FROM NOW()) - p.year_built) < 10 THEN 'New (0-10 years)'
                WHEN (EXTRACT(YEAR FROM NOW()) - p.year_built) < 20 THEN 'Recent (10-20 years)'
                WHEN (EXTRACT(YEAR FROM NOW()) - p.year_built) < 40 THEN 'Mature (20-40 years)'
                ELSE 'Older (40+ years)'
            END as age_group,
            COUNT(*) as property_count,
            AVG(v.final_value) as avg_value,
            AVG(v.percent_good) as avg_condition
         FROM property p
         LEFT JOIN LATERAL (
             SELECT final_value, percent_good FROM valuation 
             WHERE parcel_id = p.id 
             ORDER BY created_at DESC LIMIT 1
         ) v ON true
         WHERE p.year_built IS NOT NULL AND v.final_value IS NOT NULL
         GROUP BY age_group
         ORDER BY MIN(EXTRACT(YEAR FROM NOW()) - p.year_built)"
    )
    .fetch_all(&pool)
    .await?;

    let age_distribution: Vec<serde_json::Value> = age_impact
        .into_iter()
        .map(|row| serde_json::json!({
            "age_group": row.age_group,
            "property_count": row.property_count,
            "avg_value": row.avg_value,
            "avg_condition": row.avg_condition
        }))
        .collect();

    Ok(Json(serde_json::json!({
        "monthly_trends": monthly_trends,
        "age_distribution": age_distribution,
        "generated_at": chrono::Utc::now()
    })))
}

async fn get_valuation_report(
    Query(params): Query<ReportQuery>,
    State(pool): State<PgPool>,
    _user: AuthenticatedUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let mut where_conditions = vec!["v.created_at >= NOW() - INTERVAL '30 days'".to_string()];
    
    if let Some(region) = &params.region {
        where_conditions.push(format!("v.region = '{}'", region));
    }
    
    if let Some(imp_type) = &params.imp_type {
        where_conditions.push(format!("v.imp_type = '{}'", imp_type));
    }

    let where_clause = where_conditions.join(" AND ");

    let recent_valuations = sqlx::query(&format!(
        "SELECT 
            v.imp_type,
            v.region,
            COUNT(*) as valuation_count,
            AVG(v.final_value) as avg_value,
            MIN(v.final_value) as min_value,
            MAX(v.final_value) as max_value,
            AVG(v.rcn) as avg_rcn,
            AVG(v.percent_good) as avg_condition
         FROM valuation v
         WHERE {}
         GROUP BY v.imp_type, v.region
         ORDER BY valuation_count DESC",
        where_clause
    ))
    .fetch_all(&pool)
    .await?;

    let valuation_summary: Vec<serde_json::Value> = recent_valuations
        .into_iter()
        .map(|row| serde_json::json!({
            "imp_type": row.get::<String, _>("imp_type"),
            "region": row.get::<String, _>("region"),
            "valuation_count": row.get::<i64, _>("valuation_count"),
            "avg_value": row.get::<f64, _>("avg_value"),
            "min_value": row.get::<f64, _>("min_value"),
            "max_value": row.get::<f64, _>("max_value"),
            "avg_rcn": row.get::<f64, _>("avg_rcn"),
            "avg_condition": row.get::<f64, _>("avg_condition")
        }))
        .collect();

    // Get most active users
    let active_users = sqlx::query!(
        "SELECT 
            u.username,
            u.role,
            COUNT(v.id) as valuations_created
         FROM \"user\" u
         JOIN valuation v ON u.id = v.created_by
         WHERE v.created_at >= NOW() - INTERVAL '30 days'
         GROUP BY u.id, u.username, u.role
         ORDER BY valuations_created DESC
         LIMIT 10"
    )
    .fetch_all(&pool)
    .await?;

    let user_activity: Vec<serde_json::Value> = active_users
        .into_iter()
        .map(|row| serde_json::json!({
            "username": row.username,
            "role": row.role,
            "valuations_created": row.valuations_created
        }))
        .collect();

    Ok(Json(serde_json::json!({
        "valuation_summary": valuation_summary,
        "user_activity": user_activity,
        "period": "Last 30 days",
        "generated_at": chrono::Utc::now()
    })))
}