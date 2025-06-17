mod models;
mod auth;
mod api;
mod services;
mod db;

use axum::{
    Router,
    routing::get,
    response::Json,
    http::{StatusCode, Method},
};
use tower::ServiceBuilder;
use tower_http::cors::{CorsLayer, Any};
use sqlx::PgPool;
use std::env;
use tracing_subscriber;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    tracing_subscriber::init();
    
    // Load environment variables
    dotenv::dotenv().ok();
    
    // Create database pool
    let pool = db::create_pool().await?;
    
    // Setup CORS
    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers(Any)
        .allow_origin(Any);
    
    // Build application router
    let app = Router::new()
        .route("/", get(health_check))
        .route("/health", get(health_check))
        .merge(api::auth::routes())
        .merge(api::valuation::routes())
        .merge(api::cost_table::routes())
        .merge(api::scenario::routes())
        .merge(api::report::routes())
        .merge(api::batch::routes())
        .merge(api::gis::routes())
        .layer(
            ServiceBuilder::new()
                .layer(cors)
                .into_inner(),
        )
        .with_state(pool);
    
    // Start server
    let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let addr = format!("0.0.0.0:{}", port);
    
    println!("🚀 TerraBuild Rust Backend starting on {}", addr);
    println!("📊 Endpoints available:");
    println!("  • Authentication: /api/auth/*");
    println!("  • Valuations: /api/valuation/*");
    println!("  • Cost Tables: /api/cost-table/*");
    println!("  • Scenarios: /api/scenario/*");
    println!("  • Reports: /api/report/*");
    println!("  • Batch Processing: /api/batch/*");
    println!("  • GIS Operations: /api/gis/*");
    
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;
    
    Ok(())
}

async fn health_check() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "healthy",
        "service": "TerraBuild Rust Backend",
        "version": "1.0.0",
        "timestamp": chrono::Utc::now()
    }))
}