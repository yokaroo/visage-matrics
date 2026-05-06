# VISAGE METRICS - API Documentation

**Base URL:** `http://localhost:5000`

---

## Table of Contents

1. [Authentication API](#authentication-api)
2. [Inference API](#inference-api)
3. [Analytics API](#analytics-api)
4. [Model API](#model-api)
5. [Error Codes](#error-codes)

---

## Authentication API

### Register User

**Endpoint:** `POST /api/auth/register`

**Request:**

```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "name": "John Doe"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "email": "user@example.com"
}
```

**Errors:**

- 400: Missing required fields
- 409: Email already registered

---

### Login

**Endpoint:** `POST /api/auth/login`

**Request:**

```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

**Errors:**

- 400: Missing email or password
- 401: Invalid credentials

---

### Logout

**Endpoint:** `POST /api/auth/logout`

**Response (200):**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### Get User Profile

**Endpoint:** `GET /api/auth/profile`

**Response (200):**

```json
{
  "success": true,
  "user": {
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

**Errors:**

- 401: Not authenticated
- 404: User not found

---

### Verify Authentication

**Endpoint:** `GET /api/auth/verify`

**Response (200 - Authenticated):**

```json
{
  "authenticated": true,
  "user_id": "user@example.com",
  "user_name": "John Doe",
  "user_role": "user"
}
```

**Response (401 - Not Authenticated):**

```json
{
  "authenticated": false
}
```

---

### Change Password

**Endpoint:** `POST /api/auth/change-password`

**Request:**

```json
{
  "old_password": "current_password",
  "new_password": "new_password",
  "confirm_password": "new_password"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Errors:**

- 400: Missing fields or passwords don't match
- 401: Incorrect old password or not authenticated

---

## Inference API

### Health Check

**Endpoint:** `GET /api/health`

**Response (200):**

```json
{
  "status": "healthy",
  "model_loaded": true,
  "timestamp": "2026-05-06T08:43:00"
}
```

---

### Model Status

**Endpoint:** `GET /api/model/status`

**Response (200):**

```json
{
  "status": "loaded",
  "model_name": "Visage Hybrid Baseline",
  "input_shape": [96, 96, 3],
  "available_models": [
    "visage_hybrid_baseline.keras",
    "visage_baseline_bs32.keras"
  ]
}
```

---

### Load Specific Model

**Endpoint:** `POST /api/model/load/<model_name>`

**Parameters:**

- `model_name`: Name of the model file (e.g., "visage_hybrid_baseline.keras")

**Response (200):**

```json
{
  "success": true,
  "message": "Model visage_hybrid_baseline.keras loaded successfully",
  "model_name": "visage_hybrid_baseline.keras"
}
```

**Errors:**

- 404: Model not found
- 503: Model loading failed

---

### Single Image Inference

**Endpoint:** `POST /api/inference/predict`

**Request:** multipart form with file

```
file: <image_file>
```

**Response (200):**

```json
{
  "success": true,
  "filename": "test_image.jpg",
  "predictions": [[0.23]],
  "timestamp": "2026-05-06T08:43:00",
  "model_info": {
    "name": "Visage Hybrid Baseline",
    "input_shape": [96, 96, 3]
  }
}
```

**Errors:**

- 400: No file provided or file type not allowed
- 503: Model not loaded

---

### Base64 Image Inference

**Endpoint:** `POST /api/inference/predict-base64`

**Request:**

```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response (200):**

```json
{
  "success": true,
  "predictions": [[0.23]],
  "timestamp": "2026-05-06T08:43:00",
  "model_info": {
    "name": "Visage Hybrid Baseline",
    "input_shape": [96, 96, 3]
  }
}
```

---

### Batch Prediction

**Endpoint:** `POST /api/inference/batch-predict`

**Request:** multipart form with multiple files

```
files: <image_file_1>
files: <image_file_2>
files: <image_file_3>
```

**Response (200):**

```json
{
  "success": true,
  "results": [
    {
      "success": true,
      "filename": "image1.jpg",
      "predictions": [[0.23]]
    },
    {
      "success": true,
      "filename": "image2.jpg",
      "predictions": [[0.78]]
    }
  ],
  "total": 2,
  "timestamp": "2026-05-06T08:43:00"
}
```

---

## Analytics API

### Get Today Analytics

**Endpoint:** `GET /api/analytics/today`

**Response (200):**

```json
{
  "success": true,
  "date": "2026-05-06",
  "user_id": "user@example.com",
  "total_detections": 0,
  "fatigue_count": 0,
  "normal_count": 0,
  "accuracy_score": 0.0,
  "timeline": []
}
```

---

### Get 7 Days Analytics

**Endpoint:** `GET /api/analytics/7days`

**Response (200):**

```json
{
  "success": true,
  "period": {
    "start": "2026-04-29",
    "end": "2026-05-06"
  },
  "user_id": "user@example.com",
  "total_detections": 0,
  "average_fatigue_ratio": 0.0,
  "daily_data": [
    {
      "date": "2026-04-29",
      "detections": 0,
      "fatigue_ratio": 0.0
    }
  ],
  "trend": "stable"
}
```

---

### Get 30 Days Analytics

**Endpoint:** `GET /api/analytics/30days`

**Response (200):**

```json
{
  "success": true,
  "period": {
    "start": "2026-04-06",
    "end": "2026-05-06"
  },
  "user_id": "user@example.com",
  "total_detections": 0,
  "average_fatigue_ratio": 0.0,
  "peak_day": null,
  "daily_data": [...],
  "trend": "stable"
}
```

---

### Get Analytics Summary

**Endpoint:** `GET /api/analytics/summary`

**Response (200):**

```json
{
  "success": true,
  "user_id": "user@example.com",
  "overall_stats": {
    "total_detections": 0,
    "total_sessions": 0,
    "average_session_duration": 0,
    "total_fatigue_time": 0,
    "avg_fatigue_ratio": 0.0
  },
  "recent_activity": {
    "last_detection": null,
    "last_session": null
  },
  "health_score": 0.0
}
```

---

### Save Detection Record

**Endpoint:** `POST /api/analytics/save-detection`

**Request:**

```json
{
  "detection_type": "fatigue",
  "confidence": 0.85,
  "metadata": {
    "device": "webcam",
    "lighting": "bright"
  }
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Detection saved successfully"
}
```

---

### Export Analytics

**Endpoint:** `GET /api/analytics/export/<period>`

**Parameters:**

- `period`: 'today', '7days', or '30days'

**Response (200):**

```json
{
  "success": true,
  "message": "Analytics export for 7days is ready",
  "download_url": "/api/analytics/download/7days"
}
```

---

### Get Health Report

**Endpoint:** `GET /api/analytics/health-report`

**Response (200):**

```json
{
  "success": true,
  "user_id": "user@example.com",
  "overall_health": "good",
  "health_score": 85,
  "recommendations": [
    "Maintain regular eye rest schedule",
    "Take short breaks every hour",
    "Ensure adequate lighting"
  ],
  "key_metrics": {
    "avg_daily_fatigue_time": "2h 15m",
    "peak_fatigue_time": "14:00-16:00",
    "improvement_trend": "positive"
  }
}
```

---

## Error Codes

### 400 - Bad Request

Missing required fields or invalid format

**Response:**

```json
{
  "error": "Missing required fields"
}
```

---

### 401 - Unauthorized

Authentication failed or token expired

**Response:**

```json
{
  "error": "Invalid email or password"
}
```

---

### 404 - Not Found

Resource not found

**Response:**

```json
{
  "error": "User not found"
}
```

---

### 409 - Conflict

Resource already exists

**Response:**

```json
{
  "error": "Email already registered"
}
```

---

### 413 - Request Entity Too Large

File is too large (max 50MB)

**Response:**

```json
{
  "error": "File too large. Maximum size is 50MB"
}
```

---

### 500 - Internal Server Error

Server error occurred

**Response:**

```json
{
  "error": "Internal server error"
}
```

---

### 503 - Service Unavailable

Model not loaded or service temporarily unavailable

**Response:**

```json
{
  "error": "Model not loaded"
}
```

---

## Common Headers

### Request Headers

```
Content-Type: application/json
Authorization: Bearer <token> (if using JWT)
```

### Response Headers

```
Content-Type: application/json
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
```

---

## Rate Limiting

Currently no rate limiting is implemented. Recommended to add:

- 100 requests per minute for normal endpoints
- 10 requests per minute for inference endpoints

---

## Best Practices

1. **Authentication**
   - Always store tokens securely
   - Never expose tokens in logs or debug output
   - Implement token expiration

2. **File Uploads**
   - Validate file type before upload
   - Scan files for malware
   - Store files securely outside web root

3. **Error Handling**
   - Always check success flag in response
   - Log error messages for debugging
   - Don't expose sensitive information in errors

4. **Performance**
   - Use batch endpoints for multiple predictions
   - Cache model predictions when possible
   - Implement async processing for long operations

---

**API Version:** 1.0  
**Last Updated:** 6 Mei 2026
