# Hexea 3D Viewer API Documentation

## Overview

This API provides comprehensive functionality for a scalable 3D model viewing platform. It supports model management, collaboration, analytics, and advanced features for future growth.

## Base URL

```
Production: https://api.hexea.io/v1
Development: http://localhost:3000/api
```

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## Core Endpoints

### Authentication

#### POST `/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

#### POST `/auth/login`
Login and receive authentication token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "data": {
    "user": { /* User object */ },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "success": true
}
```

---

### Model Management

#### POST `/models/upload`
Upload a new 3D model.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: The 3D model file (STL, FBX, OBJ, GLTF, GLB)
- `metadata`: JSON string containing:
  ```json
  {
    "name": "My Model",
    "description": "Optional description",
    "tags": ["mechanical", "prototype"],
    "isPublic": false
  }
  ```

#### GET `/models`
Retrieve user's models with pagination and filtering.

**Query Parameters:**
- `page` (default: 1)
- `pageSize` (default: 20)
- `tags` (comma-separated)
- `search` (search in name/description)

#### GET `/models/:modelId`
Get detailed information about a specific model.

#### PATCH `/models/:modelId`
Update model metadata.

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "New description",
  "tags": ["tag1", "tag2"],
  "isPublic": true
}
```

#### DELETE `/models/:modelId`
Delete a model permanently.

#### GET `/models/:modelId/download`
Download the original model file.

---

### Saved Views

#### POST `/views`
Save a camera view for a model.

**Request Body:**
```json
{
  "modelId": "model-123",
  "name": "Front View",
  "description": "Front perspective of the model",
  "camera": {
    "position": [0, 2, 5],
    "target": [0, 0, 0],
    "fov": 75
  },
  "modelState": {
    "color": "#6366f1",
    "wireframe": false
  }
}
```

#### GET `/views?modelId=<modelId>`
Get all saved views for a model.

#### DELETE `/views/:viewId`
Delete a saved view.

---

### Annotations & Measurements

#### POST `/annotations`
Create a new annotation or measurement.

**Request Body:**
```json
{
  "modelId": "model-123",
  "type": "measurement",
  "position": [1.5, 2.3, 0.8],
  "content": "Critical dimension",
  "metadata": {
    "distance": 12.45,
    "points": [[0, 0, 0], [12.45, 0, 0]]
  }
}
```

#### GET `/annotations?modelId=<modelId>`
Get all annotations for a model.

#### PATCH `/annotations/:annotationId`
Update an annotation.

#### DELETE `/annotations/:annotationId`
Delete an annotation.

---

### Projects & Collaboration

#### POST `/projects`
Create a new project.

**Request Body:**
```json
{
  "name": "Product Design 2024",
  "description": "New product line models",
  "models": ["model-123", "model-456"],
  "collaborators": [],
  "tags": ["product", "2024"],
  "isPublic": false
}
```

#### GET `/projects`
Get user's projects with pagination.

#### GET `/projects/:projectId`
Get detailed project information.

#### POST `/projects/:projectId/collaborators`
Add a collaborator to a project.

**Request Body:**
```json
{
  "userId": "user-456",
  "role": "editor"
}
```

Roles: `owner`, `editor`, `viewer`

#### DELETE `/projects/:projectId/collaborators/:userId`
Remove a collaborator.

---

### Export & Conversion

#### POST `/export`
Request a model export in a specific format.

**Request Body:**
```json
{
  "modelId": "model-123",
  "format": "obj",
  "options": {
    "quality": "high",
    "scale": 1.0,
    "includeTextures": true
  }
}
```

Supported formats: `stl`, `fbx`, `obj`, `gltf`, `glb`, `png`, `jpg`, `pdf`

#### POST `/conversions`
Convert a model to a different format.

**Request Body:**
```json
{
  "modelId": "model-123",
  "toFormat": "gltf"
}
```

**Response:**
```json
{
  "data": {
    "id": "job-789",
    "status": "processing",
    "progress": 0
  },
  "success": true
}
```

#### GET `/conversions/:jobId`
Check conversion job status.

---

### Analytics

#### GET `/analytics/models/:modelId`
Get analytics for a specific model.

**Query Parameters:**
- `startDate` (ISO 8601)
- `endDate` (ISO 8601)

**Response:**
```json
{
  "data": {
    "modelId": "model-123",
    "views": 1543,
    "downloads": 87,
    "shares": 12,
    "averageViewDuration": 142.5,
    "uniqueVisitors": 432,
    "topReferrers": [
      { "source": "google.com", "count": 234 },
      { "source": "direct", "count": 198 }
    ]
  },
  "success": true
}
```

#### POST `/analytics/track`
Track custom events.

**Request Body:**
```json
{
  "event": "model_view",
  "modelId": "model-123",
  "metadata": {
    "referrer": "https://example.com"
  }
}
```

---

### Comments

#### POST `/comments`
Add a comment to a model.

**Request Body:**
```json
{
  "modelId": "model-123",
  "content": "Great work on this design!",
  "parentId": "comment-456"  // Optional, for threaded comments
}
```

#### GET `/comments?modelId=<modelId>`
Get all comments for a model.

#### POST `/comments/:commentId/reactions`
Add a reaction to a comment.

**Request Body:**
```json
{
  "emoji": "👍"
}
```

#### DELETE `/comments/:commentId`
Delete a comment.

---

### Search

#### GET `/search?query=<searchTerm>`
Search for models across the platform.

**Query Parameters:**
- `query` (required): Search term
- `fileType`: Comma-separated file types (e.g., "stl,fbx")
- `tags`: Comma-separated tags
- `minVertices`: Minimum vertex count
- `maxVertices`: Maximum vertex count

---

### Webhooks

#### POST `/webhooks`
Create a webhook for events.

**Request Body:**
```json
{
  "url": "https://your-app.com/webhook",
  "events": ["model.uploaded", "model.deleted", "comment.created"]
}
```

Available events:
- `model.uploaded`
- `model.updated`
- `model.deleted`
- `comment.created`
- `annotation.created`
- `project.updated`

#### GET `/webhooks`
List all webhooks.

#### DELETE `/webhooks/:webhookId`
Delete a webhook.

---

## Response Format

### Success Response
```json
{
  "data": { /* response data */ },
  "success": true,
  "message": "Operation successful",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Response
```json
{
  "error": "ValidationError",
  "message": "Invalid model format",
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00Z",
  "details": {
    "field": "fileType",
    "expectedFormats": ["stl", "fbx", "obj"]
  }
}
```

## Rate Limiting

- **Free tier**: 100 requests per hour
- **Pro tier**: 1,000 requests per hour
- **Enterprise**: Custom limits

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1673785200
```

## Best Practices

1. **Caching**: Cache model data and thumbnails locally
2. **Batch Operations**: Use project endpoints to manage multiple models
3. **Webhooks**: Use webhooks for real-time updates instead of polling
4. **Progressive Loading**: Load model metadata before fetching full files
5. **Error Handling**: Always check the `success` field in responses

## Future Enhancements

- **Real-time Collaboration**: WebSocket support for live editing
- **AI Features**: Auto-tagging, quality analysis, and optimization suggestions
- **Version Control**: Track model iterations and changes
- **Marketplace**: Buy/sell 3D models
- **AR/VR Support**: Preview models in augmented/virtual reality
- **Advanced Analytics**: Heatmaps, user behavior tracking
- **CDN Integration**: Faster global model delivery
- **Model Optimization**: Automatic LOD generation and compression
