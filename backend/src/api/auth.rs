use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
    routing::{post, get},
    Router,
};
use sqlx::PgPool;
use crate::auth::{authenticate_user, generate_jwt, hash_password, AuthenticatedUser, AdminOnly};
use crate::models::{LoginRequest, LoginResponse, CreateUserRequest, AppError, User};

pub fn routes() -> Router<PgPool> {
    Router::new()
        .route("/api/auth/login", post(login))
        .route("/api/auth/register", post(register))
        .route("/api/auth/me", get(get_current_user))
        .route("/api/auth/users", get(list_users))
}

async fn login(
    State(pool): State<PgPool>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, AppError> {
    let user = authenticate_user(&pool, &req.username, &req.password).await?;
    let token = generate_jwt(user.id, &user.username, &user.role)?;
    
    Ok(Json(LoginResponse {
        token,
        user_id: user.id,
        username: user.username,
        role: user.role,
    }))
}

async fn register(
    State(pool): State<PgPool>,
    _admin: AdminOnly,
    Json(req): Json<CreateUserRequest>,
) -> Result<Json<LoginResponse>, AppError> {
    // Validate role
    if !matches!(req.role.as_str(), "admin" | "assessor" | "analyst" | "viewer") {
        return Err(AppError::Validation("Invalid role".to_string()));
    }
    
    let password_hash = hash_password(&req.password)?;
    
    let user = sqlx::query_as::<_, User>(
        "INSERT INTO \"user\" (username, password_hash, role) 
         VALUES ($1, $2, $3) 
         RETURNING id, username, password_hash, role, created_at, updated_at"
    )
    .bind(&req.username)
    .bind(&password_hash)
    .bind(&req.role)
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        if e.to_string().contains("unique") {
            AppError::Validation("Username already exists".to_string())
        } else {
            AppError::Database(e)
        }
    })?;
    
    let token = generate_jwt(user.id, &user.username, &user.role)?;
    
    Ok(Json(LoginResponse {
        token,
        user_id: user.id,
        username: user.username,
        role: user.role,
    }))
}

async fn get_current_user(
    user: AuthenticatedUser,
) -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "user_id": user.user_id,
        "username": user.username,
        "role": user.role
    }))
}

async fn list_users(
    State(pool): State<PgPool>,
    _admin: AdminOnly,
) -> Result<Json<Vec<serde_json::Value>>, AppError> {
    let users = sqlx::query!(
        "SELECT id, username, role, created_at FROM \"user\" ORDER BY created_at DESC"
    )
    .fetch_all(&pool)
    .await?;
    
    let user_list: Vec<serde_json::Value> = users
        .into_iter()
        .map(|u| serde_json::json!({
            "id": u.id,
            "username": u.username,
            "role": u.role,
            "created_at": u.created_at
        }))
        .collect();
    
    Ok(Json(user_list))
}