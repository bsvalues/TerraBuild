# TerraBuild API Reference

## Authentication

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

**Response**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "admin",
    "name": "Administrator",
    "role": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer {token}
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {token}
```

## Property Management

### Get Properties
```http
GET /api/properties
Authorization: Bearer {token}

Query Parameters:
- limit: number (default: 50)
- offset: number (default: 0)
- search: string
- region: string
- building_type: string
```

**Response**
```json
{
  "properties": [
    {
      "id": 1,
      "geo_id": "GEO-123456",
      "parcel_id": "PARCEL-789",
      "address": "123 Main St",
      "city": "Corvallis",
      "state": "OR",
      "zip_code": "97330",
      "square_feet": 2000,
      "year_built": 2010,
      "bedrooms": 3,
      "bathrooms": 2,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1500,
  "limit": 50,
  "offset": 0
}
```

### Get Property by ID
```http
GET /api/properties/{id}
Authorization: Bearer {token}
```

### Create Property
```http
POST /api/properties
Authorization: Bearer {token}
Content-Type: application/json

{
  "geo_id": "GEO-123456",
  "parcel_id": "PARCEL-789",
  "address": "123 Main St",
  "city": "Corvallis",
  "state": "OR",
  "zip_code": "97330",
  "square_feet": 2000,
  "year_built": 2010,
  "bedrooms": 3,
  "bathrooms": 2
}
```

### Update Property
```http
PUT /api/properties/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "address": "456 Oak Ave",
  "square_feet": 2200
}
```

### Delete Property
```http
DELETE /api/properties/{id}
Authorization: Bearer {token}
```

## Cost Matrix Management

### Get Cost Matrices
```http
GET /api/cost-matrices
Authorization: Bearer {token}

Query Parameters:
- region: string
- building_type: string
- limit: number
- offset: number
```

**Response**
```json
{
  "cost_matrices": [
    {
      "id": 1,
      "region": "Urban",
      "building_type": "SFR",
      "base_cost": 150.50,
      "quality_good": 1.25,
      "quality_average": 1.0,
      "quality_fair": 0.85,
      "condition_excellent": 1.15,
      "condition_good": 1.0,
      "condition_average": 0.9,
      "condition_fair": 0.8,
      "condition_poor": 0.7,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

### Create Cost Matrix
```http
POST /api/cost-matrices
Authorization: Bearer {token}
Content-Type: application/json

{
  "region": "Urban",
  "building_type": "SFR",
  "base_cost": 150.50,
  "quality_good": 1.25,
  "quality_average": 1.0,
  "quality_fair": 0.85,
  "condition_excellent": 1.15,
  "condition_good": 1.0,
  "condition_average": 0.9,
  "condition_fair": 0.8,
  "condition_poor": 0.7
}
```

### Bulk Import Cost Matrices
```http
POST /api/cost-matrices/import
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: Excel file containing cost matrix data
```

## Property Valuation

### Calculate Property Value
```http
POST /api/valuations/calculate
Authorization: Bearer {token}
Content-Type: application/json

{
  "property_id": 123,
  "building_type": "SFR",
  "region": "Urban",
  "square_feet": 2000,
  "year_built": 2010,
  "quality": "good",
  "condition": "average",
  "age_factor": 0.95,
  "local_multiplier": 1.05
}
```

**Response**
```json
{
  "valuation": {
    "property_id": 123,
    "base_cost": 150.50,
    "total_base_value": 301000,
    "quality_adjustment": 1.25,
    "condition_adjustment": 0.9,
    "age_adjustment": 0.95,
    "local_adjustment": 1.05,
    "final_value": 320850,
    "confidence_score": 0.92,
    "calculation_date": "2024-01-01T00:00:00Z",
    "methodology": "RCN",
    "factors_applied": [
      "quality_good",
      "condition_average",
      "age_depreciation",
      "local_multiplier"
    ]
  }
}
```

### Get Valuation History
```http
GET /api/valuations/history/{property_id}
Authorization: Bearer {token}

Query Parameters:
- start_date: ISO date string
- end_date: ISO date string
- limit: number
```

### Batch Calculate Valuations
```http
POST /api/valuations/batch
Authorization: Bearer {token}
Content-Type: application/json

{
  "properties": [
    {
      "property_id": 123,
      "building_type": "SFR",
      "region": "Urban",
      "square_feet": 2000,
      "year_built": 2010,
      "quality": "good",
      "condition": "average"
    }
  ]
}
```

## AI Agent Management

### Get Agent Status
```http
GET /api/agents/status
Authorization: Bearer {token}
```

**Response**
```json
{
  "agents": [
    {
      "id": "development-agent",
      "type": "development",
      "status": "active",
      "current_tasks": 3,
      "max_tasks": 10,
      "success_rate": 0.95,
      "avg_response_time": 2.5,
      "last_active": "2024-01-01T00:00:00Z"
    },
    {
      "id": "cost-analysis-agent",
      "type": "cost_analysis",
      "status": "active",
      "current_tasks": 1,
      "max_tasks": 5,
      "success_rate": 0.98,
      "avg_response_time": 1.8,
      "last_active": "2024-01-01T00:00:00Z"
    }
  ],
  "swarm_status": "healthy",
  "total_active_tasks": 15,
  "total_capacity": 50
}
```

### Submit Task to Agents
```http
POST /api/agents/tasks
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "property_valuation",
  "priority": "high",
  "payload": {
    "property_id": 123,
    "analysis_type": "comprehensive",
    "include_market_analysis": true
  },
  "timeout": 30000
}
```

**Response**
```json
{
  "task_id": "task-uuid-12345",
  "status": "queued",
  "assigned_agent": "cost-analysis-agent",
  "estimated_completion": "2024-01-01T00:05:00Z",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Get Task Status
```http
GET /api/agents/tasks/{task_id}
Authorization: Bearer {token}
```

**Response**
```json
{
  "task_id": "task-uuid-12345",
  "status": "completed",
  "assigned_agent": "cost-analysis-agent",
  "result": {
    "valuation": 320850,
    "confidence": 0.92,
    "analysis": "Property shows good construction quality with average maintenance..."
  },
  "created_at": "2024-01-01T00:00:00Z",
  "completed_at": "2024-01-01T00:04:32Z",
  "execution_time": 272000
}
```

### Get Agent Metrics
```http
GET /api/agents/metrics
Authorization: Bearer {token}

Query Parameters:
- agent_id: string (optional)
- start_date: ISO date string
- end_date: ISO date string
```

## File Management

### Upload File
```http
POST /api/files/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: File to upload
description: Optional description
```

**Response**
```json
{
  "file": {
    "id": 1,
    "filename": "cost_matrix_2024.xlsx",
    "original_name": "Cost Matrix 2024.xlsx",
    "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "size": 45678,
    "upload_path": "/uploads/2024/01/cost_matrix_2024.xlsx",
    "uploaded_at": "2024-01-01T00:00:00Z"
  }
}
```

### Get Files
```http
GET /api/files
Authorization: Bearer {token}

Query Parameters:
- limit: number
- offset: number
- type: string (e.g., "excel", "csv", "pdf")
```

### Download File
```http
GET /api/files/{id}/download
Authorization: Bearer {token}
```

### Delete File
```http
DELETE /api/files/{id}
Authorization: Bearer {token}
```

## Data Import/Export

### Import Property Data
```http
POST /api/import/properties
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: CSV file containing property data
mapping: JSON string defining field mappings
```

### Import Cost Matrix Data
```http
POST /api/import/cost-matrices
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: Excel file containing cost matrix data
region: Target region for import
```

### Export Properties
```http
POST /api/export/properties
Authorization: Bearer {token}
Content-Type: application/json

{
  "format": "csv",
  "filters": {
    "region": "Urban",
    "year_built_min": 2000
  },
  "fields": ["id", "address", "square_feet", "year_built"]
}
```

**Response**
```json
{
  "export_id": "export-uuid-12345",
  "status": "processing",
  "estimated_completion": "2024-01-01T00:05:00Z",
  "download_url": null
}
```

### Get Export Status
```http
GET /api/export/{export_id}
Authorization: Bearer {token}
```

## Search and Filtering

### Smart Search
```http
GET /api/search
Authorization: Bearer {token}

Query Parameters:
- q: Search query string
- type: "properties" | "cost_matrices" | "all"
- limit: number
- include_suggestions: boolean
```

**Response**
```json
{
  "results": [
    {
      "type": "property",
      "id": 123,
      "title": "123 Main St, Corvallis, OR",
      "description": "Single Family Residence, 2000 sq ft, built 2010",
      "score": 0.95,
      "highlight": "123 <em>Main</em> St, Corvallis, OR"
    }
  ],
  "suggestions": [
    "Main Street properties",
    "Corvallis residential",
    "Properties built 2010"
  ],
  "total": 1,
  "query_time": 0.045
}
```

### Advanced Filter
```http
POST /api/search/filter
Authorization: Bearer {token}
Content-Type: application/json

{
  "entity": "properties",
  "filters": [
    {
      "field": "square_feet",
      "operator": "between",
      "value": [1500, 2500]
    },
    {
      "field": "year_built",
      "operator": "gte",
      "value": 2000
    },
    {
      "field": "city",
      "operator": "in",
      "value": ["Corvallis", "Albany"]
    }
  ],
  "sort": [
    {"field": "square_feet", "direction": "desc"}
  ],
  "limit": 50,
  "offset": 0
}
```

## Analytics and Reporting

### Property Statistics
```http
GET /api/analytics/properties/stats
Authorization: Bearer {token}

Query Parameters:
- region: string (optional)
- building_type: string (optional)
- start_date: ISO date string
- end_date: ISO date string
```

**Response**
```json
{
  "total_properties": 15000,
  "avg_square_feet": 1850.5,
  "avg_year_built": 1995,
  "value_distribution": {
    "under_200k": 2500,
    "200k_400k": 8500,
    "400k_600k": 3000,
    "over_600k": 1000
  },
  "building_types": {
    "SFR": 12000,
    "Condo": 2000,
    "Townhouse": 800,
    "Multi-family": 200
  }
}
```

### Market Trends
```http
GET /api/analytics/market-trends
Authorization: Bearer {token}

Query Parameters:
- region: string
- period: "monthly" | "quarterly" | "yearly"
- start_date: ISO date string
- end_date: ISO date string
```

### Generate Report
```http
POST /api/reports/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "property_valuation",
  "format": "pdf",
  "filters": {
    "region": "Urban",
    "year_built_min": 2000
  },
  "include_charts": true,
  "include_summary": true
}
```

## System Management

### Health Check
```http
GET /api/health
```

**Response**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "database": "healthy",
    "ai_agents": "healthy",
    "file_storage": "healthy",
    "cache": "healthy"
  },
  "version": "1.0.0",
  "uptime": 86400
}
```

### System Metrics
```http
GET /api/metrics
Authorization: Bearer {token}
```

**Response**
```json
{
  "performance": {
    "avg_response_time": 156.7,
    "requests_per_minute": 45.2,
    "error_rate": 0.002
  },
  "resources": {
    "cpu_usage": 25.4,
    "memory_usage": 68.2,
    "disk_usage": 42.1
  },
  "database": {
    "connections": 15,
    "queries_per_second": 23.1,
    "cache_hit_rate": 0.94
  }
}
```

### Configuration
```http
GET /api/config
Authorization: Bearer {token}
```

```http
PUT /api/config
Authorization: Bearer {token}
Content-Type: application/json

{
  "ai_agents": {
    "max_concurrent_tasks": 50,
    "task_timeout": 30000
  },
  "valuation": {
    "default_region": "Urban",
    "confidence_threshold": 0.8
  }
}
```

## User Management

### Get Users
```http
GET /api/users
Authorization: Bearer {token}

Query Parameters:
- role: string (optional)
- active: boolean (optional)
- limit: number
- offset: number
```

### Create User
```http
POST /api/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "username": "assessor1",
  "password": "secure_password",
  "name": "John Assessor",
  "role": "assessor",
  "is_active": true
}
```

### Update User
```http
PUT /api/users/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Senior Assessor",
  "role": "senior_assessor"
}
```

### Delete User
```http
DELETE /api/users/{id}
Authorization: Bearer {token}
```

## Error Responses

All API endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Invalid input data",
  "details": {
    "field": "square_feet",
    "issue": "Must be a positive number"
  }
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions for this operation"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Property with ID 123 not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded",
  "retry_after": 60
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "request_id": "req-uuid-12345"
}
```

## Rate Limiting

API endpoints are rate limited to ensure system stability:

- **Authentication endpoints**: 5 requests per minute per IP
- **Data retrieval endpoints**: 1000 requests per hour per user
- **Data modification endpoints**: 100 requests per hour per user
- **File upload endpoints**: 10 requests per hour per user
- **Export endpoints**: 5 requests per hour per user

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination using limit and offset parameters:

```http
GET /api/properties?limit=50&offset=100
```

Response includes pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "total": 15000,
    "limit": 50,
    "offset": 100,
    "has_more": true,
    "next_offset": 150
  }
}
```

## Webhooks

Register webhooks to receive real-time notifications:

### Register Webhook
```http
POST /api/webhooks
Authorization: Bearer {token}
Content-Type: application/json

{
  "url": "https://your-server.com/webhook",
  "events": ["property.created", "valuation.completed"],
  "secret": "webhook_secret_key"
}
```

### Webhook Payload Example
```json
{
  "event": "valuation.completed",
  "data": {
    "property_id": 123,
    "valuation": 320850,
    "confidence": 0.92
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "webhook_id": "webhook-uuid-12345"
}
```

## SDK Examples

### JavaScript/Node.js
```javascript
const TerraBuildAPI = require('@terrabuild/api-client');

const client = new TerraBuildAPI({
  baseURL: 'https://api.terrabuild.county.gov',
  apiKey: 'your-api-key'
});

// Calculate property valuation
const valuation = await client.valuations.calculate({
  property_id: 123,
  building_type: 'SFR',
  region: 'Urban',
  square_feet: 2000,
  year_built: 2010,
  quality: 'good',
  condition: 'average'
});

console.log(`Property value: $${valuation.final_value}`);
```

### Python
```python
import terrabuild

client = terrabuild.Client(
    base_url='https://api.terrabuild.county.gov',
    api_key='your-api-key'
)

# Get properties
properties = client.properties.list(
    region='Urban',
    limit=50
)

for property in properties:
    print(f"{property.address}: {property.square_feet} sq ft")
```

### cURL Examples
```bash
# Login
curl -X POST https://api.terrabuild.county.gov/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get properties
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.terrabuild.county.gov/api/properties?limit=10

# Calculate valuation
curl -X POST https://api.terrabuild.county.gov/api/valuations/calculate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "property_id": 123,
    "building_type": "SFR",
    "region": "Urban",
    "square_feet": 2000,
    "year_built": 2010,
    "quality": "good",
    "condition": "average"
  }'
```