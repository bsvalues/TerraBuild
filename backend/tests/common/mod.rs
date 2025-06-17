use axum::Router;
use sqlx::{PgPool, postgres::PgPoolOptions};
use std::env;
use serde_json::json;

// Test helper functions
pub async fn create_test_app() -> Router {
    let pool = create_test_db_pool().await;
    
    // Import the main app creation logic
    use terrabuild_backend::*;
    
    Router::new()
        .route("/", axum::routing::get(health_check))
        .route("/health", axum::routing::get(health_check))
        .merge(api::auth::routes())
        .merge(api::valuation::routes())
        .merge(api::cost_table::routes())
        .merge(api::scenario::routes())
        .merge(api::report::routes())
        .merge(api::batch::routes())
        .merge(api::gis::routes())
        .with_state(pool)
}

pub async fn create_test_db_pool() -> PgPool {
    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://postgres:password@localhost:5432/terrabuild_test".to_string());
    
    PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to create test database pool")
}

pub async fn get_admin_token() -> String {
    use terrabuild_backend::auth::generate_jwt;
    generate_jwt(1, "admin", "admin").unwrap()
}

pub async fn create_test_property(pool: &PgPool) -> i32 {
    let property = sqlx::query!(
        "INSERT INTO property (parcel_id, address, imp_type, quality, year_built, sqft, region)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id",
        "TEST-001",
        "123 Test Street",
        "RESIDENTIAL",
        "Average",
        2010,
        1800.0,
        "North"
    )
    .fetch_one(pool)
    .await
    .expect("Failed to create test property");
    
    property.id
}

async fn health_check() -> axum::Json<serde_json::Value> {
    axum::Json(json!({
        "status": "healthy",
        "service": "TerraBuild Test",
        "timestamp": chrono::Utc::now()
    }))
}