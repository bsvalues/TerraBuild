use axum::{
    extract::{Path, State, Multipart},
    response::Json,
    routing::{get, post},
    Router,
};
use sqlx::PgPool;
use crate::auth::{AuthenticatedUser, AssessorOrAbove};
use crate::models::{AppError, BatchUpload, BatchUploadRequest, BatchUploadResponse};
use std::collections::HashMap;

pub fn routes() -> Router<PgPool> {
    Router::new()
        .route("/api/batch/upload", post(upload_batch_file))
        .route("/api/batch/status/:id", get(get_batch_status))
        .route("/api/batch/history", get(get_batch_history))
}

async fn upload_batch_file(
    State(pool): State<PgPool>,
    user: AuthenticatedUser,
    _assessor: AssessorOrAbove,
    mut multipart: Multipart,
) -> Result<Json<BatchUploadResponse>, AppError> {
    let mut filename = String::new();
    let mut file_content = Vec::new();
    let mut file_type = String::new();

    while let Some(field) = multipart.next_field().await.map_err(|e| 
        AppError::Validation(format!("Multipart error: {}", e)))? {
        
        let field_name = field.name().unwrap_or("").to_string();
        
        match field_name.as_str() {
            "file" => {
                filename = field.file_name().unwrap_or("unknown").to_string();
                file_content = field.bytes().await.map_err(|e| 
                    AppError::Validation(format!("File read error: {}", e)))?.to_vec();
                
                // Determine file type from extension
                if filename.ends_with(".csv") {
                    file_type = "csv".to_string();
                } else if filename.ends_with(".xlsx") || filename.ends_with(".xls") {
                    file_type = "excel".to_string();
                } else {
                    return Err(AppError::Validation("Unsupported file type. Use CSV or Excel".to_string()));
                }
            }
            _ => {
                // Skip other fields
            }
        }
    }

    if filename.is_empty() || file_content.is_empty() {
        return Err(AppError::Validation("No file uploaded".to_string()));
    }

    // Create batch upload record
    let batch_upload = sqlx::query_as::<_, BatchUpload>(
        "INSERT INTO batch_upload (filename, file_type, status, created_by)
         VALUES ($1, $2, 'processing', $3)
         RETURNING *"
    )
    .bind(&filename)
    .bind(&file_type)
    .bind(user.user_id)
    .fetch_one(&pool)
    .await?;

    // Process the file based on type
    tokio::spawn(async move {
        let result = match file_type.as_str() {
            "csv" => process_csv_file(pool.clone(), batch_upload.id, file_content).await,
            "excel" => process_excel_file(pool.clone(), batch_upload.id, file_content).await,
            _ => Err(AppError::Validation("Unsupported file type".to_string())),
        };

        // Update batch upload status
        let status = if result.is_ok() { "completed" } else { "failed" };
        let error_log = if let Err(ref e) = result {
            Some(e.to_string())
        } else {
            None
        };

        let _ = sqlx::query!(
            "UPDATE batch_upload 
             SET status = $1, error_log = $2, completed_at = CURRENT_TIMESTAMP
             WHERE id = $3",
            status,
            error_log,
            batch_upload.id
        )
        .execute(&pool)
        .await;
    });

    Ok(Json(BatchUploadResponse {
        upload_id: batch_upload.id,
        status: "processing".to_string(),
        message: "File upload started. Check status for progress.".to_string(),
    }))
}

async fn process_csv_file(
    pool: PgPool,
    batch_id: i32,
    file_content: Vec<u8>,
) -> Result<(), AppError> {
    let content = String::from_utf8(file_content)
        .map_err(|e| AppError::Validation(format!("Invalid UTF-8 content: {}", e)))?;

    let mut reader = csv::Reader::from_reader(content.as_bytes());
    let headers = reader.headers()
        .map_err(|e| AppError::Validation(format!("CSV header error: {}", e)))?
        .clone();

    let mut total_records = 0;
    let mut processed_records = 0;
    let mut error_records = 0;
    let mut errors = Vec::new();

    for (row_num, result) in reader.records().enumerate() {
        total_records += 1;
        
        match result {
            Ok(record) => {
                match process_csv_record(&pool, &headers, &record).await {
                    Ok(_) => processed_records += 1,
                    Err(e) => {
                        error_records += 1;
                        errors.push(format!("Row {}: {}", row_num + 2, e));
                    }
                }
            }
            Err(e) => {
                error_records += 1;
                errors.push(format!("Row {}: CSV parsing error: {}", row_num + 2, e));
            }
        }

        // Update progress every 100 records
        if total_records % 100 == 0 {
            let _ = sqlx::query!(
                "UPDATE batch_upload 
                 SET total_records = $1, processed_records = $2, error_records = $3
                 WHERE id = $4",
                total_records,
                processed_records,
                error_records,
                batch_id
            )
            .execute(&pool)
            .await;
        }
    }

    // Final update
    let error_log = if errors.is_empty() {
        None
    } else {
        Some(errors.join("\n"))
    };

    sqlx::query!(
        "UPDATE batch_upload 
         SET total_records = $1, processed_records = $2, error_records = $3, error_log = $4
         WHERE id = $5",
        total_records,
        processed_records,
        error_records,
        error_log,
        batch_id
    )
    .execute(&pool)
    .await?;

    Ok(())
}

async fn process_csv_record(
    pool: &PgPool,
    headers: &csv::StringRecord,
    record: &csv::StringRecord,
) -> Result<(), AppError> {
    // Convert CSV record to HashMap for easier field access
    let mut data: HashMap<String, String> = HashMap::new();
    for (i, header) in headers.iter().enumerate() {
        if let Some(value) = record.get(i) {
            data.insert(header.to_lowercase().replace(" ", "_"), value.to_string());
        }
    }

    // Determine record type based on available fields
    if data.contains_key("parcel_id") && data.contains_key("address") {
        // Property record
        process_property_record(pool, &data).await
    } else if data.contains_key("imp_type") && data.contains_key("cost_per_sqft") {
        // Cost table record
        process_cost_table_record(pool, &data).await
    } else {
        Err(AppError::Validation("Unknown record type or missing required fields".to_string()))
    }
}

async fn process_property_record(
    pool: &PgPool,
    data: &HashMap<String, String>,
) -> Result<(), AppError> {
    let parcel_id = data.get("parcel_id")
        .ok_or_else(|| AppError::Validation("Missing parcel_id".to_string()))?;
    let address = data.get("address")
        .ok_or_else(|| AppError::Validation("Missing address".to_string()))?;

    let year_built = data.get("year_built")
        .and_then(|s| s.parse::<i32>().ok());
    let sqft = data.get("sqft")
        .and_then(|s| s.parse::<f64>().ok());

    sqlx::query!(
        "INSERT INTO property (parcel_id, address, owner, imp_type, quality, year_built, sqft, region)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (parcel_id) DO UPDATE SET
         address = EXCLUDED.address,
         owner = EXCLUDED.owner,
         imp_type = EXCLUDED.imp_type,
         quality = EXCLUDED.quality,
         year_built = EXCLUDED.year_built,
         sqft = EXCLUDED.sqft,
         region = EXCLUDED.region,
         updated_at = CURRENT_TIMESTAMP",
        parcel_id,
        address,
        data.get("owner"),
        data.get("imp_type"),
        data.get("quality"),
        year_built,
        sqft,
        data.get("region")
    )
    .execute(pool)
    .await?;

    Ok(())
}

async fn process_cost_table_record(
    pool: &PgPool,
    data: &HashMap<String, String>,
) -> Result<(), AppError> {
    let imp_type = data.get("imp_type")
        .ok_or_else(|| AppError::Validation("Missing imp_type".to_string()))?;
    let quality = data.get("quality")
        .ok_or_else(|| AppError::Validation("Missing quality".to_string()))?;
    let year = data.get("year")
        .ok_or_else(|| AppError::Validation("Missing year".to_string()))?
        .parse::<i32>()
        .map_err(|_| AppError::Validation("Invalid year format".to_string()))?;
    let region = data.get("region")
        .ok_or_else(|| AppError::Validation("Missing region".to_string()))?;
    let cost_per_sqft = data.get("cost_per_sqft")
        .ok_or_else(|| AppError::Validation("Missing cost_per_sqft".to_string()))?
        .parse::<f64>()
        .map_err(|_| AppError::Validation("Invalid cost_per_sqft format".to_string()))?;

    let effective_date = data.get("effective_date")
        .map(|s| chrono::NaiveDate::parse_from_str(s, "%Y-%m-%d"))
        .transpose()
        .map_err(|_| AppError::Validation("Invalid effective_date format. Use YYYY-MM-DD".to_string()))?
        .unwrap_or_else(|| chrono::Utc::now().date_naive());

    sqlx::query!(
        "INSERT INTO cost_table (imp_type, quality, year, region, cost_per_sqft, source, notes, effective_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (imp_type, quality, year, region, version) DO UPDATE SET
         cost_per_sqft = EXCLUDED.cost_per_sqft,
         source = EXCLUDED.source,
         notes = EXCLUDED.notes,
         effective_date = EXCLUDED.effective_date",
        imp_type,
        quality,
        year,
        region,
        cost_per_sqft,
        data.get("source"),
        data.get("notes"),
        effective_date
    )
    .execute(pool)
    .await?;

    Ok(())
}

async fn process_excel_file(
    _pool: PgPool,
    _batch_id: i32,
    _file_content: Vec<u8>,
) -> Result<(), AppError> {
    // Excel processing would require additional dependencies like calamine
    // For now, return an error suggesting CSV format
    Err(AppError::Validation("Excel processing not yet implemented. Please use CSV format.".to_string()))
}

async fn get_batch_status(
    Path(id): Path<i32>,
    State(pool): State<PgPool>,
    user: AuthenticatedUser,
) -> Result<Json<BatchUpload>, AppError> {
    let batch_upload = sqlx::query_as::<_, BatchUpload>(
        "SELECT * FROM batch_upload WHERE id = $1 AND created_by = $2"
    )
    .bind(id)
    .bind(user.user_id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Batch upload {} not found", id)))?;

    Ok(Json(batch_upload))
}

async fn get_batch_history(
    State(pool): State<PgPool>,
    user: AuthenticatedUser,
) -> Result<Json<Vec<BatchUpload>>, AppError> {
    let batch_uploads = sqlx::query_as::<_, BatchUpload>(
        "SELECT * FROM batch_upload 
         WHERE created_by = $1 
         ORDER BY created_at DESC 
         LIMIT 50"
    )
    .bind(user.user_id)
    .fetch_all(&pool)
    .await?;

    Ok(Json(batch_uploads))
}