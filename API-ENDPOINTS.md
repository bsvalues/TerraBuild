# Building Cost Building System (BCBS) API Documentation

This document provides documentation for the Building Cost Building System (BCBS) API endpoints.

## Authentication

Most endpoints require authentication. Add the appropriate authentication headers to your requests.

## Building Cost Calculation Endpoints

### Calculate Basic Building Cost

- **URL**: `/api/costs/calculate`
- **Method**: `POST`
- **Auth Required**: Yes
- **Description**: Calculates the basic cost for a building based on region, type, and square footage
- **Request Body**:
  ```json
  {
    "region": "RICHLAND",
    "buildingType": "RESIDENTIAL",
    "squareFootage": 2000,
    "complexityFactor": 1.1
  }
  ```
- **Response**:
  ```json
  {
    "region": "RICHLAND",
    "buildingType": "RESIDENTIAL",
    "squareFootage": 2000,
    "baseCost": "185.50",
    "regionFactor": "1.05",
    "complexityFactor": 1.1,
    "costPerSqft": 194.78,
    "totalCost": 389560
  }
  ```

### Calculate Building Cost with Materials Breakdown

- **URL**: `/api/costs/calculate-materials`
- **Method**: `POST`
- **Auth Required**: Yes
- **Description**: Calculates the building cost and provides a breakdown of material costs
- **Request Body**:
  ```json
  {
    "region": "RICHLAND",
    "buildingType": "RESIDENTIAL",
    "squareFootage": 2000,
    "complexityFactor": 1.1
  }
  ```
- **Response**:
  ```json
  {
    "region": "RICHLAND",
    "buildingType": "RESIDENTIAL",
    "squareFootage": 2000,
    "costPerSqft": 194.775,
    "totalCost": 389550,
    "baseCost": 185.5,
    "regionFactor": 1.05,
    "complexityFactor": 1,
    "materials": [
      {
        "id": 46,
        "materialTypeId": 16,
        "materialName": "Concrete",
        "materialCode": "CONCRETE",
        "percentage": 0.15,
        "costPerUnit": 25.5,
        "quantity": 3,
        "totalCost": 584.325
      },
      // Other materials...
    ]
  }
  ```

### Calculate Detailed Building Cost

- **URL**: `/api/building-cost/calculate`
- **Method**: `POST`
- **Auth Required**: Yes
- **Description**: Provides a detailed building cost calculation with adjustments for quality, complexity, and condition
- **Request Body**:
  ```json
  {
    "region": "RICHLAND",
    "buildingType": "RESIDENTIAL",
    "squareFootage": 2000,
    "complexityFactor": 1.1,
    "yearBuilt": 2020,
    "quality": "STANDARD"
  }
  ```
- **Response**:
  ```json
  {
    "region": "RICHLAND",
    "buildingType": "RESIDENTIAL",
    "squareFootage": 2000,
    "baseCost": 150,
    "adjustedCost": 165,
    "totalCost": 346500,
    "depreciationAdjustment": 1,
    "complexityFactor": 1.1,
    "conditionFactor": 1,
    "materialCosts": {
      "concrete": 51975,
      "framing": 69300,
      "roofing": 34650,
      "electrical": 41580,
      "plumbing": 34650,
      "finishes": 62370,
      "other": 51975
    }
  }
  ```

## Calculation History Endpoints

### Save Calculation History

- **URL**: `/api/calculation-history`
- **Method**: `POST`
- **Auth Required**: Yes
- **Description**: Saves a calculation to the user's history
- **Request Body**:
  ```json
  {
    "name": "My Calculation",
    "region": "RICHLAND",
    "buildingType": "RESIDENTIAL",
    "squareFootage": 2000,
    "baseCost": "185.50",
    "regionFactor": "1.05",
    "complexity": "Standard",
    "complexityFactor": "1.1",
    "costPerSqft": "194.78",
    "totalCost": "389560",
    "adjustedCost": "389560"
  }
  ```
- **Response**: The saved calculation history object

### Get Calculation History

- **URL**: `/api/calculation-history`
- **Method**: `GET`
- **Auth Required**: Yes
- **Description**: Retrieves the user's calculation history
- **Response**: An array of calculation history objects

## Cost Factors Endpoints

### Get All Cost Factors

- **URL**: `/api/cost-factors`
- **Method**: `GET`
- **Auth Required**: No
- **Description**: Retrieves all cost factors
- **Response**: An array of cost factor objects

### Get Cost Factor by Region and Building Type

- **URL**: `/api/cost-factors/:region/:buildingType`
- **Method**: `GET`
- **Auth Required**: No
- **Description**: Retrieves the cost factor for a specific region and building type
- **Response**: A cost factor object

### Create Cost Factor

- **URL**: `/api/cost-factors`
- **Method**: `POST`
- **Auth Required**: Yes
- **Description**: Creates a new cost factor
- **Request Body**:
  ```json
  {
    "region": "RICHLAND",
    "buildingType": "RESIDENTIAL",
    "baseCost": "185.50",
    "complexityFactor": "1.0",
    "regionFactor": "1.05"
  }
  ```
- **Response**: The created cost factor object

## Building Costs Endpoints

### Get All Building Costs

- **URL**: `/api/costs`
- **Method**: `GET`
- **Auth Required**: Yes
- **Description**: Retrieves all building costs
- **Response**: An array of building cost objects

### Get Building Cost

- **URL**: `/api/costs/:id`
- **Method**: `GET`
- **Auth Required**: Yes
- **Description**: Retrieves a specific building cost
- **Response**: A building cost object

### Create Building Cost

- **URL**: `/api/costs`
- **Method**: `POST`
- **Auth Required**: Yes
- **Description**: Creates a new building cost
- **Request Body**:
  ```json
  {
    "name": "My Building Cost",
    "region": "RICHLAND",
    "buildingType": "RESIDENTIAL",
    "squareFootage": 2000,
    "costPerSqft": "194.78",
    "totalCost": "389560"
  }
  ```
- **Response**: The created building cost object

### Update Building Cost

- **URL**: `/api/costs/:id`
- **Method**: `PATCH`
- **Auth Required**: Yes
- **Description**: Updates a building cost
- **Request Body**: Object with fields to update
- **Response**: The updated building cost object

### Delete Building Cost

- **URL**: `/api/costs/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **Description**: Deletes a building cost
- **Response**: Success message

## Building Cost Materials Endpoints

### Get Building Cost Materials

- **URL**: `/api/costs/:id/materials`
- **Method**: `GET`
- **Auth Required**: Yes
- **Description**: Retrieves the materials breakdown for a building cost
- **Response**: An array of building cost material objects

## Error Responses

All API endpoints will return appropriate error responses with the following structure:

```json
{
  "message": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

Common error codes:
- `VALIDATION_ERROR` - Invalid input data
- `DATABASE_ERROR` - Database operation failed
- `NOT_FOUND` - Resource not found
- `AUTHENTICATION_ERROR` - Authentication required
- `AUTHORIZATION_ERROR` - Not authorized
- `CALCULATION_ERROR` - Error in cost calculation
- `GENERAL_ERROR` - Unexpected error