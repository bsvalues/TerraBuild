use argon2::{self, Config};
use jsonwebtoken::{encode, decode, Header, Validation, EncodingKey, DecodingKey, Algorithm};
use serde::{Serialize, Deserialize};
use axum::{
    async_trait,
    extract::{FromRequestParts, State},
    http::{request::Parts, StatusCode},
};
use chrono::{Utc, Duration};
use crate::models::{AppError, User};
use sqlx::PgPool;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,      // subject (username)
    pub user_id: i32,
    pub role: String,
    pub exp: usize,       // expiry (as UTC timestamp)
}

const SECRET: &[u8] = b"your_super_secret_jwt_key_change_in_production";

pub fn hash_password(password: &str) -> Result<String, AppError> {
    let salt = b"terrabuild_salt_2024"; // In production, use random salt per user
    argon2::hash_encoded(password.as_bytes(), salt, &Config::default())
        .map_err(|e| AppError::Internal(format!("Password hashing failed: {}", e)))
}

pub fn verify_password(hash: &str, password: &str) -> bool {
    argon2::verify_encoded(hash, password.as_bytes()).unwrap_or(false)
}

pub fn generate_jwt(user_id: i32, username: &str, role: &str) -> Result<String, AppError> {
    let expiration = (Utc::now() + Duration::hours(24)).timestamp() as usize;
    let claims = Claims { 
        sub: username.to_string(), 
        user_id,
        role: role.to_string(), 
        exp: expiration 
    };
    
    encode(&Header::default(), &claims, &EncodingKey::from_secret(SECRET))
        .map_err(|e| AppError::Internal(format!("JWT generation failed: {}", e)))
}

pub fn verify_jwt(token: &str) -> Result<Claims, AppError> {
    let validation = Validation::new(Algorithm::HS256);
    decode::<Claims>(token, &DecodingKey::from_secret(SECRET), &validation)
        .map(|data| data.claims)
        .map_err(|e| AppError::Authentication(format!("Invalid token: {}", e)))
}

pub async fn authenticate_user(pool: &PgPool, username: &str, password: &str) -> Result<User, AppError> {
    let user = sqlx::query_as::<_, User>(
        "SELECT id, username, password_hash, role, created_at, updated_at FROM \"user\" WHERE username = $1"
    )
    .bind(username)
    .fetch_optional(pool)
    .await?
    .ok_or_else(|| AppError::Authentication("Invalid credentials".to_string()))?;

    if verify_password(&user.password_hash, password) {
        Ok(user)
    } else {
        Err(AppError::Authentication("Invalid credentials".to_string()))
    }
}

// Middleware for extracting authenticated user from JWT
#[derive(Clone)]
pub struct AuthenticatedUser {
    pub user_id: i32,
    pub username: String,
    pub role: String,
}

#[async_trait]
impl<S> FromRequestParts<S> for AuthenticatedUser
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get("Authorization")
            .and_then(|header| header.to_str().ok())
            .and_then(|header| header.strip_prefix("Bearer "))
            .ok_or_else(|| AppError::Authentication("Missing or invalid Authorization header".to_string()))?;

        let claims = verify_jwt(auth_header)?;
        
        Ok(AuthenticatedUser {
            user_id: claims.user_id,
            username: claims.sub,
            role: claims.role,
        })
    }
}

// Role-based access control
#[derive(Debug, Clone, PartialEq)]
pub enum Role {
    Admin,
    Assessor,
    Analyst,
    Viewer,
}

impl Role {
    pub fn from_str(role: &str) -> Result<Self, AppError> {
        match role.to_lowercase().as_str() {
            "admin" => Ok(Role::Admin),
            "assessor" => Ok(Role::Assessor),
            "analyst" => Ok(Role::Analyst),
            "viewer" => Ok(Role::Viewer),
            _ => Err(AppError::Validation(format!("Invalid role: {}", role))),
        }
    }
    
    pub fn can_access(&self, required_role: &Role) -> bool {
        match (self, required_role) {
            (Role::Admin, _) => true,
            (Role::Assessor, Role::Assessor | Role::Analyst | Role::Viewer) => true,
            (Role::Analyst, Role::Analyst | Role::Viewer) => true,
            (Role::Viewer, Role::Viewer) => true,
            _ => false,
        }
    }
}

pub struct RequireRole(pub Role);

#[async_trait]
impl<S> FromRequestParts<S> for RequireRole
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let user = AuthenticatedUser::from_request_parts(parts, state).await?;
        let user_role = Role::from_str(&user.role)?;
        
        // This is a placeholder - in actual usage, you'd specify the required role
        // For now, we'll just verify the user is authenticated
        Ok(RequireRole(user_role))
    }
}

// Specific role extractors
pub struct AdminOnly;
pub struct AssessorOrAbove;
pub struct AnalystOrAbove;

#[async_trait]
impl<S> FromRequestParts<S> for AdminOnly
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let user = AuthenticatedUser::from_request_parts(parts, state).await?;
        let user_role = Role::from_str(&user.role)?;
        
        if user_role.can_access(&Role::Admin) && user_role == Role::Admin {
            Ok(AdminOnly)
        } else {
            Err(AppError::Authorization("Admin access required".to_string()))
        }
    }
}

#[async_trait]
impl<S> FromRequestParts<S> for AssessorOrAbove
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let user = AuthenticatedUser::from_request_parts(parts, state).await?;
        let user_role = Role::from_str(&user.role)?;
        
        if matches!(user_role, Role::Admin | Role::Assessor) {
            Ok(AssessorOrAbove)
        } else {
            Err(AppError::Authorization("Assessor access or above required".to_string()))
        }
    }
}

#[async_trait]
impl<S> FromRequestParts<S> for AnalystOrAbove
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let user = AuthenticatedUser::from_request_parts(parts, state).await?;
        let user_role = Role::from_str(&user.role)?;
        
        if matches!(user_role, Role::Admin | Role::Assessor | Role::Analyst) {
            Ok(AnalystOrAbove)
        } else {
            Err(AppError::Authorization("Analyst access or above required".to_string()))
        }
    }
}