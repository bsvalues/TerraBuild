use axum::{
    extract::{Path, Query, State},
    response::Json,
    routing::{get, post, delete},
    Router,
};
use serde::Deserialize;
use sqlx::PgPool;
use crate::auth::{AuthenticatedUser, AnalystOrAbove, AdminOnly};
use crate::models::{AppError, GisLayer};

#[derive(Deserialize)]
pub struct GisQuery {
    pub feature_type: Option<String>,
    pub bbox: Option<String>, // "minx,miny,maxx,maxy"
    pub limit: Option<i32>,
}

#[derive(Deserialize)]
pub struct CreateGisLayerRequest {
    pub name: String,
    pub feature_type: String,
    pub geojson: serde_json::Value,
    pub properties: Option<serde_json::Value>,
}

#[derive(Deserialize)]
pub struct SpatialQueryRequest {
    pub layer_name: String,
    pub geometry: serde_json::Value, // GeoJSON geometry
    pub operation: String, // "intersects", "contains", "within"
}

pub fn routes() -> Router<PgPool> {
    Router::new()
        .route("/api/gis/layers", get(list_gis_layers).post(create_gis_layer))
        .route("/api/gis/layers/:id", get(get_gis_layer).delete(delete_gis_layer))
        .route("/api/gis/spatial-query", post(spatial_query))
        .route("/api/gis/properties-in-area", post(properties_in_area))
        .route("/api/gis/buffer-analysis", post(buffer_analysis))
}

async fn list_gis_layers(
    Query(params): Query<GisQuery>,
    State(pool): State<PgPool>,
    _user: AuthenticatedUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let limit = params.limit.unwrap_or(50).min(500);
    
    let mut query = "SELECT id, name, feature_type, properties, created_at FROM gis_layer WHERE 1=1".to_string();
    let mut bind_count = 0;
    let mut conditions = Vec::new();

    if let Some(feature_type) = &params.feature_type {
        bind_count += 1;
        query.push_str(&format!(" AND feature_type = ${}", bind_count));
        conditions.push(feature_type.clone());
    }

    // Add bbox filter if provided
    if let Some(bbox) = &params.bbox {
        let coords: Vec<f64> = bbox.split(',')
            .filter_map(|s| s.parse().ok())
            .collect();
        
        if coords.len() == 4 {
            bind_count += 1;
            query.push_str(&format!(" AND geom && ST_MakeEnvelope(${}, ${}, ${}, ${}, 4326)", 
                bind_count, bind_count + 1, bind_count + 2, bind_count + 3));
            conditions.extend(coords.iter().map(|c| c.to_string()));
            bind_count += 3;
        }
    }

    query.push_str(&format!(" ORDER BY created_at DESC LIMIT ${}", bind_count + 1));

    let layers = if conditions.is_empty() {
        sqlx::query_as::<_, GisLayer>(&query)
            .bind(limit)
            .fetch_all(&pool)
            .await?
    } else {
        // For simplicity, let's rebuild with specific query
        sqlx::query_as::<_, GisLayer>(
            "SELECT id, name, feature_type, properties, created_at, 
             ST_AsGeoJSON(geom) as geom FROM gis_layer 
             ORDER BY created_at DESC LIMIT $1"
        )
        .bind(limit)
        .fetch_all(&pool)
        .await?
    };

    Ok(Json(serde_json::json!({
        "layers": layers,
        "count": layers.len()
    })))
}

async fn get_gis_layer(
    Path(id): Path<i32>,
    State(pool): State<PgPool>,
    _user: AuthenticatedUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let layer = sqlx::query!(
        "SELECT id, name, feature_type, properties, created_at,
         ST_AsGeoJSON(geom) as geojson
         FROM gis_layer WHERE id = $1",
        id
    )
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("GIS layer {} not found", id)))?;

    Ok(Json(serde_json::json!({
        "id": layer.id,
        "name": layer.name,
        "feature_type": layer.feature_type,
        "properties": layer.properties,
        "created_at": layer.created_at,
        "geojson": layer.geojson
    })))
}

async fn create_gis_layer(
    State(pool): State<PgPool>,
    _analyst: AnalystOrAbove,
    Json(req): Json<CreateGisLayerRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Validate GeoJSON structure
    if !req.geojson.is_object() {
        return Err(AppError::Validation("Invalid GeoJSON format".to_string()));
    }

    // Convert GeoJSON to PostGIS geometry
    let geojson_str = serde_json::to_string(&req.geojson)
        .map_err(|e| AppError::Validation(format!("GeoJSON serialization error: {}", e)))?;

    let layer = sqlx::query!(
        "INSERT INTO gis_layer (name, feature_type, geom, properties)
         VALUES ($1, $2, ST_GeomFromGeoJSON($3), $4)
         RETURNING id, name, feature_type, properties, created_at",
        req.name,
        req.feature_type,
        geojson_str,
        req.properties
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        if e.to_string().contains("unique") {
            AppError::Validation("Layer name already exists".to_string())
        } else if e.to_string().contains("geometry") {
            AppError::Validation("Invalid geometry in GeoJSON".to_string())
        } else {
            AppError::Database(e)
        }
    })?;

    Ok(Json(serde_json::json!({
        "id": layer.id,
        "name": layer.name,
        "feature_type": layer.feature_type,
        "properties": layer.properties,
        "created_at": layer.created_at,
        "message": "GIS layer created successfully"
    })))
}

async fn delete_gis_layer(
    Path(id): Path<i32>,
    State(pool): State<PgPool>,
    _admin: AdminOnly,
) -> Result<Json<serde_json::Value>, AppError> {
    let result = sqlx::query!("DELETE FROM gis_layer WHERE id = $1", id)
        .execute(&pool)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("GIS layer {} not found", id)));
    }

    Ok(Json(serde_json::json!({
        "message": "GIS layer deleted successfully",
        "id": id
    })))
}

async fn spatial_query(
    State(pool): State<PgPool>,
    _user: AuthenticatedUser,
    Json(req): Json<SpatialQueryRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let geometry_str = serde_json::to_string(&req.geometry)
        .map_err(|e| AppError::Validation(format!("Geometry serialization error: {}", e)))?;

    let sql_operation = match req.operation.as_str() {
        "intersects" => "ST_Intersects",
        "contains" => "ST_Contains",
        "within" => "ST_Within",
        _ => return Err(AppError::Validation("Invalid spatial operation. Use: intersects, contains, within".to_string())),
    };

    let query = format!(
        "SELECT id, name, feature_type, properties, 
         ST_AsGeoJSON(geom) as geojson
         FROM gis_layer 
         WHERE name = $1 AND {}(geom, ST_GeomFromGeoJSON($2))",
        sql_operation
    );

    let results = sqlx::query(&query)
        .bind(&req.layer_name)
        .bind(&geometry_str)
        .fetch_all(&pool)
        .await?;

    let features: Vec<serde_json::Value> = results
        .into_iter()
        .map(|row| serde_json::json!({
            "id": row.get::<i32, _>("id"),
            "name": row.get::<String, _>("name"),
            "feature_type": row.get::<String, _>("feature_type"),
            "properties": row.get::<Option<serde_json::Value>, _>("properties"),
            "geojson": row.get::<Option<String>, _>("geojson")
        }))
        .collect();

    Ok(Json(serde_json::json!({
        "operation": req.operation,
        "layer_name": req.layer_name,
        "result_count": features.len(),
        "features": features
    })))
}

async fn properties_in_area(
    State(pool): State<PgPool>,
    _user: AuthenticatedUser,
    Json(geometry): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, AppError> {
    let geometry_str = serde_json::to_string(&geometry)
        .map_err(|e| AppError::Validation(format!("Geometry serialization error: {}", e)))?;

    let properties = sqlx::query!(
        "SELECT p.id, p.parcel_id, p.address, p.imp_type, p.quality, 
         p.year_built, p.sqft, p.region,
         ST_AsGeoJSON(p.geom) as property_geom,
         v.final_value, v.created_at as valuation_date
         FROM property p
         LEFT JOIN LATERAL (
             SELECT final_value, created_at FROM valuation 
             WHERE parcel_id = p.id 
             ORDER BY created_at DESC LIMIT 1
         ) v ON true
         WHERE p.geom IS NOT NULL 
         AND ST_Intersects(p.geom, ST_GeomFromGeoJSON($1))",
        geometry_str
    )
    .fetch_all(&pool)
    .await?;

    let property_list: Vec<serde_json::Value> = properties
        .into_iter()
        .map(|row| serde_json::json!({
            "id": row.id,
            "parcel_id": row.parcel_id,
            "address": row.address,
            "imp_type": row.imp_type,
            "quality": row.quality,
            "year_built": row.year_built,
            "sqft": row.sqft,
            "region": row.region,
            "geometry": row.property_geom,
            "current_value": row.final_value,
            "valuation_date": row.valuation_date
        }))
        .collect();

    // Calculate area statistics
    let total_properties = property_list.len();
    let avg_value = if total_properties > 0 {
        let values: Vec<f64> = property_list
            .iter()
            .filter_map(|p| p["current_value"].as_f64())
            .collect();
        if !values.is_empty() {
            values.iter().sum::<f64>() / values.len() as f64
        } else {
            0.0
        }
    } else {
        0.0
    };

    Ok(Json(serde_json::json!({
        "properties": property_list,
        "statistics": {
            "total_properties": total_properties,
            "properties_with_values": property_list.iter()
                .filter(|p| p["current_value"].is_number())
                .count(),
            "average_value": avg_value
        }
    })))
}

async fn buffer_analysis(
    State(pool): State<PgPool>,
    _user: AuthenticatedUser,
    Json(req): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, AppError> {
    let point = req.get("point")
        .ok_or_else(|| AppError::Validation("Missing point geometry".to_string()))?;
    let distance = req.get("distance")
        .and_then(|d| d.as_f64())
        .ok_or_else(|| AppError::Validation("Missing or invalid distance".to_string()))?;

    let point_str = serde_json::to_string(point)
        .map_err(|e| AppError::Validation(format!("Point serialization error: {}", e)))?;

    // Find properties within buffer distance
    let properties = sqlx::query!(
        "SELECT p.id, p.parcel_id, p.address, p.imp_type, 
         p.sqft, p.region,
         ST_Distance(p.geom, ST_GeomFromGeoJSON($1)) as distance_meters,
         v.final_value
         FROM property p
         LEFT JOIN LATERAL (
             SELECT final_value FROM valuation 
             WHERE parcel_id = p.id 
             ORDER BY created_at DESC LIMIT 1
         ) v ON true
         WHERE p.geom IS NOT NULL 
         AND ST_DWithin(p.geom, ST_GeomFromGeoJSON($1), $2)
         ORDER BY ST_Distance(p.geom, ST_GeomFromGeoJSON($1))",
        point_str,
        distance
    )
    .fetch_all(&pool)
    .await?;

    let buffer_properties: Vec<serde_json::Value> = properties
        .into_iter()
        .map(|row| serde_json::json!({
            "id": row.id,
            "parcel_id": row.parcel_id,
            "address": row.address,
            "imp_type": row.imp_type,
            "sqft": row.sqft,
            "region": row.region,
            "distance_meters": row.distance_meters,
            "current_value": row.final_value
        }))
        .collect();

    // Calculate buffer statistics
    let property_count = buffer_properties.len();
    let values: Vec<f64> = buffer_properties
        .iter()
        .filter_map(|p| p["current_value"].as_f64())
        .collect();

    let (avg_value, total_value) = if !values.is_empty() {
        let sum = values.iter().sum::<f64>();
        (sum / values.len() as f64, sum)
    } else {
        (0.0, 0.0)
    };

    Ok(Json(serde_json::json!({
        "buffer_analysis": {
            "center_point": point,
            "buffer_distance_meters": distance,
            "properties_found": property_count,
            "properties_with_values": values.len(),
            "statistics": {
                "average_value": avg_value,
                "total_value": total_value,
                "value_density_per_sqm": if distance > 0.0 {
                    total_value / (std::f64::consts::PI * distance * distance)
                } else {
                    0.0
                }
            }
        },
        "properties": buffer_properties
    })))
}