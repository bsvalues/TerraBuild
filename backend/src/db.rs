use sqlx::{PgPool, postgres::PgPoolOptions};
use std::env;
use crate::models::AppError;

pub async fn create_pool() -> Result<PgPool, AppError> {
    let database_url = env::var("DATABASE_URL")
        .map_err(|_| AppError::Internal("DATABASE_URL environment variable not set".to_string()))?;
    
    let pool = PgPoolOptions::new()
        .max_connections(20)
        .min_connections(5)
        .acquire_timeout(std::time::Duration::from_secs(30))
        .connect(&database_url)
        .await
        .map_err(|e| AppError::Database(e))?;
    
    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .map_err(|e| AppError::Internal(format!("Migration failed: {}", e)))?;
    
    Ok(pool)
}