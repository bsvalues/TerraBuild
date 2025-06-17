use serde::{Deserialize, Serialize};
use chrono::{DateTime, NaiveDate, Utc};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Property {
    pub id: i32,
    pub parcel_id: String,
    pub address: String,
    pub owner: Option<String>,
    pub imp_type: Option<String>,
    pub quality: Option<String>,
    pub year_built: Option<i32>,
    pub sqft: Option<f64>,
    pub region: Option<String>,
    pub geom: Option<String>, // WKT format
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct CostTable {
    pub id: i32,
    pub imp_type: String,
    pub quality: String,
    pub year: i32,
    pub region: String,
    pub cost_per_sqft: f64,
    pub source: Option<String>,
    pub notes: Option<String>,
    pub version: i32,
    pub effective_date: NaiveDate,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct DepreciationSchedule {
    pub id: i32,
    pub schedule_type: String,
    pub effective_age: i32,
    pub percent_good: f64,
    pub source: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct User {
    pub id: i32,
    pub username: String,
    pub password_hash: String,
    pub role: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Valuation {
    pub id: i32,
    pub parcel_id: i32,
    pub imp_type: String,
    pub quality: String,
    pub sqft: f64,
    pub year_built: i32,
    pub region: String,
    pub rcn: f64,
    pub percent_good: f64,
    pub final_value: f64,
    pub calculation_chain: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub created_by: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct GisLayer {
    pub id: i32,
    pub name: String,
    pub feature_type: String,
    pub geom: Option<String>, // GeoJSON format
    pub properties: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Scenario {
    pub id: i32,
    pub name: String,
    pub description: Option<String>,
    pub parameters: serde_json::Value,
    pub results: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub created_by: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct BatchUpload {
    pub id: i32,
    pub filename: String,
    pub file_type: String,
    pub status: String,
    pub total_records: Option<i32>,
    pub processed_records: i32,
    pub error_records: i32,
    pub error_log: Option<String>,
    pub created_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
    pub created_by: Option<i32>,
}

// Request/Response DTOs
#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub user_id: i32,
    pub username: String,
    pub role: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateUserRequest {
    pub username: String,
    pub password: String,
    pub role: String,
}

#[derive(Debug, Deserialize)]
pub struct ValuationRequest {
    pub parcel_id: i32,
    pub imp_type: String,
    pub quality: String,
    pub sqft: f64,
    pub year_built: i32,
    pub region: String,
}

#[derive(Debug, Deserialize)]
pub struct ScenarioRequest {
    pub name: String,
    pub description: Option<String>,
    pub base_cost: f64,
    pub sqft: f64,
    pub market_factor: f64,
    pub location_factor: f64,
    pub percent_good: f64,
}

#[derive(Debug, Deserialize)]
pub struct BatchUploadRequest {
    pub filename: String,
    pub file_type: String,
}

#[derive(Debug, Serialize)]
pub struct BatchUploadResponse {
    pub upload_id: i32,
    pub status: String,
    pub message: String,
}

#[derive(Debug, Serialize)]
pub struct SummaryReport {
    pub total_properties: i64,
    pub avg_value: f64,
    pub value_distribution: Vec<(String, i64)>,
    pub by_region: Vec<RegionSummary>,
    pub by_property_type: Vec<PropertyTypeSummary>,
}

#[derive(Debug, Serialize)]
pub struct RegionSummary {
    pub region: String,
    pub count: i64,
    pub avg_value: f64,
    pub total_value: f64,
}

#[derive(Debug, Serialize)]
pub struct PropertyTypeSummary {
    pub imp_type: String,
    pub count: i64,
    pub avg_value: f64,
    pub avg_sqft: f64,
}

// Error types
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    
    #[error("Authentication error: {0}")]
    Authentication(String),
    
    #[error("Authorization error: {0}")]
    Authorization(String),
    
    #[error("Validation error: {0}")]
    Validation(String),
    
    #[error("Not found: {0}")]
    NotFound(String),
    
    #[error("Internal server error: {0}")]
    Internal(String),
}

impl axum::response::IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        use axum::http::StatusCode;
        use axum::Json;
        
        let (status, error_message) = match &self {
            AppError::Database(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error"),
            AppError::Authentication(_) => (StatusCode::UNAUTHORIZED, "Authentication failed"),
            AppError::Authorization(_) => (StatusCode::FORBIDDEN, "Access denied"),
            AppError::Validation(_) => (StatusCode::BAD_REQUEST, "Validation error"),
            AppError::NotFound(_) => (StatusCode::NOT_FOUND, "Resource not found"),
            AppError::Internal(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error"),
        };
        
        let body = Json(serde_json::json!({
            "error": error_message,
            "message": self.to_string()
        }));
        
        (status, body).into_response()
    }
}