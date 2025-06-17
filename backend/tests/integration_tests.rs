use axum::body::Body;
use axum::http::{Request, StatusCode};
use serde_json::json;
use sqlx::PgPool;
use std::collections::HashMap;
use tower::ServiceExt;

mod common;
use common::*;

#[tokio::test]
async fn test_health_check() {
    let app = create_test_app().await;
    
    let response = app
        .oneshot(Request::builder().uri("/health").body(Body::empty()).unwrap())
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn test_authentication_flow() {
    let app = create_test_app().await;
    
    // Test login with admin user
    let login_request = json!({
        "username": "admin",
        "password": "admin123"
    });

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/auth/login")
                .header("content-type", "application/json")
                .body(Body::from(serde_json::to_vec(&login_request).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    
    let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
    let auth_response: serde_json::Value = serde_json::from_slice(&body).unwrap();
    
    assert!(auth_response["token"].is_string());
    assert_eq!(auth_response["username"], "admin");
    assert_eq!(auth_response["role"], "admin");
}

#[tokio::test]
async fn test_cost_table_operations() {
    let app = create_test_app().await;
    let token = get_admin_token().await;
    
    // Create a new cost table entry
    let cost_table_request = json!({
        "imp_type": "RESIDENTIAL",
        "quality": "Test Quality",
        "year": 2024,
        "region": "Test Region",
        "cost_per_sqft": 250.00,
        "source": "Test Source",
        "effective_date": "2024-01-01"
    });

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/cost-table")
                .header("content-type", "application/json")
                .header("authorization", format!("Bearer {}", token))
                .body(Body::from(serde_json::to_vec(&cost_table_request).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    
    let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
    let created_entry: serde_json::Value = serde_json::from_slice(&body).unwrap();
    
    assert_eq!(created_entry["imp_type"], "RESIDENTIAL");
    assert_eq!(created_entry["cost_per_sqft"], 250.0);
}

#[tokio::test]
async fn test_valuation_calculation() {
    let app = create_test_app().await;
    let token = get_admin_token().await;
    
    // First create a property
    let pool = create_test_db_pool().await;
    let property_id = create_test_property(&pool).await;
    
    // Test valuation calculation
    let valuation_request = json!({
        "parcel_id": property_id,
        "imp_type": "RESIDENTIAL",
        "quality": "Average",
        "sqft": 1800.0,
        "year_built": 2010,
        "region": "North"
    });

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/valuation")
                .header("content-type", "application/json")
                .header("authorization", format!("Bearer {}", token))
                .body(Body::from(serde_json::to_vec(&valuation_request).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    
    let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
    let valuation_result: serde_json::Value = serde_json::from_slice(&body).unwrap();
    
    assert!(valuation_result["valuation"]["final_value"].is_number());
    assert!(valuation_result["calculation"]["calculation_details"]["rcn"].is_number());
}

#[tokio::test]
async fn test_scenario_creation() {
    let app = create_test_app().await;
    let token = get_admin_token().await;
    
    let scenario_request = json!({
        "name": "Test Scenario",
        "description": "Testing scenario functionality",
        "base_cost": 200.0,
        "sqft": 2000.0,
        "market_factor": 1.05,
        "location_factor": 1.02,
        "percent_good": 0.85
    });

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/scenario")
                .header("content-type", "application/json")
                .header("authorization", format!("Bearer {}", token))
                .body(Body::from(serde_json::to_vec(&scenario_request).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    
    let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
    let scenario_result: serde_json::Value = serde_json::from_slice(&body).unwrap();
    
    assert_eq!(scenario_result["scenario"]["name"], "Test Scenario");
    assert!(scenario_result["calculation"]["calculations"]["final_value"].is_number());
}

#[tokio::test]
async fn test_authorization_enforcement() {
    let app = create_test_app().await;
    
    // Test accessing protected endpoint without token
    let response = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/cost-table")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_batch_processing() {
    let app = create_test_app().await;
    let token = get_admin_token().await;
    
    // Test batch valuation
    let batch_request = json!({
        "property_ids": [1, 2, 3]
    });

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/valuation/batch")
                .header("content-type", "application/json")
                .header("authorization", format!("Bearer {}", token))
                .body(Body::from(serde_json::to_vec(&batch_request).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();

    // Should return 200 even if properties don't exist (graceful handling)
    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn test_reports_generation() {
    let app = create_test_app().await;
    let token = get_admin_token().await;
    
    let response = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/report/summary")
                .header("authorization", format!("Bearer {}", token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    
    let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
    let report: serde_json::Value = serde_json::from_slice(&body).unwrap();
    
    assert!(report["total_properties"].is_number());
    assert!(report["value_distribution"].is_array());
}