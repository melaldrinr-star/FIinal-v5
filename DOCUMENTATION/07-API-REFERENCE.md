# API Reference Documentation
## BMDC 1.1 - Complete API Endpoints

**Document Purpose:** Complete reference for all REST API endpoints with request/response formats

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication Endpoints](#authentication-endpoints)
3. [Trainee Management](#trainee-management)
4. [Program Management](#program-management)
5. [Enrollment Management](#enrollment-management)
6. [Attendance Management](#attendance-management)
7. [Certificate Management](#certificate-management)
8. [Inventory Management](#inventory-management)
9. [Admin Operations](#admin-operations)
10. [Error Handling](#error-handling)

---

## API Overview

### Base URL
```
Development:  http://localhost:3003/api
Production:   https://your-domain/api
```

### Authentication

All endpoints (except public ones) require JWT token in header:
```
Authorization: Bearer <access_token>
```

### Content Type

All requests and responses use:
```
Content-Type: application/json
```

### Rate Limiting

API has rate limits to prevent abuse:
- Login endpoint: 5 requests per 15 minutes per IP
- General endpoints: 100 requests per minute per user
- Bulk operations: 10 requests per minute

### Response Format

**Success Response** (status 200-201):
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully"
}
```

**Paginated Response** (status 200):
```json
{
  "success": true,
  "data": [
    // Array of items
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "totalPages": 8
  }
}
```

**Error Response** (status 4xx or 5xx):
```json
{
  "success": false,
  "error": "Descriptive error message",
  "code": "ERROR_CODE"
}
```

---

## Authentication Endpoints

### POST /api/auth/login

**Purpose**: User login with credentials

**Request**:
```json
{
  "email": "john@example.com",
  "password": "MyTraining123"
}
```

**Response (Single Tenant)** - Status 200:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "opaque_token_hash_xyz",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "role": "trainee",
      "tenantId": "a1b2c3d4-e5f6-41d4-a716-446655440000",
      "tenantName": "LGU Manila"
    }
  }
}
```

**Response (Multi-Tenant)** - Status 200:
```json
{
  "success": true,
  "data": {
    "requires_tenant_selection": true,
    "selection_token": "temp_token_abc123xyz",
    "tenants": [
      {
        "id": "a1b2c3d4-e5f6-41d4-a716-446655440000",
        "name": "LGU Manila",
        "is_primary": true
      },
      {
        "id": "b2c3d4e5-f6a7-41d4-a716-446655440001",
        "name": "Training Org A",
        "is_primary": false
      }
    ]
  }
}
```

**Error Response** - Status 401:
```json
{
  "success": false,
  "error": "Invalid email or password",
  "code": "INVALID_CREDENTIALS"
}
```

---

### POST /api/auth/select-tenant

**Purpose**: Select tenant for multi-tenant users

**Request**:
```json
{
  "selection_token": "temp_token_abc123xyz",
  "tenant_id": "a1b2c3d4-e5f6-41d4-a716-446655440000"
}
```

**Response** - Status 200:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "opaque_token_hash_xyz",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "role": "trainee",
      "tenantId": "a1b2c3d4-e5f6-41d4-a716-446655440000",
      "tenantName": "LGU Manila"
    }
  }
}
```

---

### POST /api/auth/logout

**Purpose**: End user session and revoke tokens

**Request Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**: (empty)
```json
{}
```

**Response** - Status 200:
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

---

### POST /api/auth/refresh

**Purpose**: Get new access token using refresh token

**Request**:
```json
{
  "refreshToken": "opaque_token_hash_xyz"
}
```

**Response** - Status 200:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "opaque_token_hash_new"
  }
}
```

---

### POST /api/auth/forgot-password

**Purpose**: Request password reset

**Request**:
```json
{
  "email": "john@example.com"
}
```

**Response** - Status 200:
```json
{
  "success": true,
  "message": "Password reset link sent to your email"
}
```

---

### POST /api/auth/reset-password

**Purpose**: Reset password with token

**Request**:
```json
{
  "token": "reset_token_from_email",
  "password": "NewTraining456"
}
```

**Response** - Status 200:
```json
{
  "success": true,
  "message": "Password reset successfully. Please log in with your new password."
}
```

---

### POST /api/auth/change-password

**Purpose**: Change password (when logged in)

**Request Headers**:
```
Authorization: Bearer <access_token>
```

**Request**:
```json
{
  "currentPassword": "OldTraining123",
  "newPassword": "NewTraining456"
}
```

**Response** - Status 200:
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

### GET /api/auth/me

**Purpose**: Get current authenticated user info

**Request Headers**:
```
Authorization: Bearer <access_token>
```

**Response** - Status 200:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "username": "john_doe",
    "role": "trainee",
    "tenantId": "a1b2c3d4-e5f6-41d4-a716-446655440000",
    "created_at": "2024-09-14T14:23:00Z",
    "updated_at": "2024-09-20T10:15:00Z"
  }
}
```

---

## Trainee Management

### GET /api/trainees

**Purpose**: List all trainees (paginated)

**Query Parameters**:
```
?page=1&limit=20&search=john&status=active&program_id=abc123
```

**Request Headers**:
```
Authorization: Bearer <access_token>
```

**Allowed Roles**: local_admin, staff_*

**Response** - Status 200:
```json
{
  "success": true,
  "data": [
    {
      "id": "trainee-123",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone": "+63-917-123-4567",
      "status": "active",
      "sex": "Male",
      "birth_date": "1995-05-15",
      "province": "NCR",
      "municipality": "Manila",
      "classification": "Unemployed",
      "employment_status": "Unemployed",
      "photo_path": "/photos/trainee-123.jpg",
      "created_at": "2024-09-14T14:23:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 324,
    "totalPages": 17
  }
}
```

---

### POST /api/trainees

**Purpose**: Create new trainee

**Request Headers**:
```
Authorization: Bearer <access_token>
```

**Allowed Roles**: local_admin

**Request**:
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+63-917-123-4567",
  "sex": "Male",
  "birth_date": "1995-05-15",
  "birth_place": "Manila",
  "civil_status": "Single",
  "province": "NCR",
  "municipality": "Manila",
  "barangay": "Malate",
  "street": "123 Taft Ave",
  "educational_attainment": "High School",
  "course": null,
  "year_graduated": "2012",
  "classification": "Unemployed",
  "employment_status": "Unemployed",
  "disability": null
}
```

**Response** - Status 201:
```json
{
  "success": true,
  "data": {
    "id": "trainee-123",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "status": "active",
    "created_at": "2024-09-20T10:30:00Z"
  },
  "message": "Trainee created successfully"
}
```

---

### GET /api/trainees/:id

**Purpose**: Get specific trainee details

**Request Headers**:
```
Authorization: Bearer <access_token>
```

**Response** - Status 200:
```json
{
  "success": true,
  "data": {
    "id": "trainee-123",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "+63-917-123-4567",
    "sex": "Male",
    "birth_date": "1995-05-15",
    "status": "active",
    "province": "NCR",
    "municipality": "Manila",
    "barangay": "Malate",
    "street": "123 Taft Ave",
    "educational_attainment": "High School",
    "employment_status": "Unemployed",
    "classification": "Unemployed",
    "photo_path": "/photos/trainee-123.jpg",
    "enrollments": [
      {
        "id": "enrollment-1",
        "program_id": "program-1",
        "program_name": "Electrical Installation",
        "enrollment_date": "2024-09-14",
        "status": "active",
        "attendance_rate": "87%"
      }
    ],
    "created_at": "2024-09-14T14:23:00Z",
    "updated_at": "2024-09-20T10:15:00Z"
  }
}
```

---

### PUT /api/trainees/:id

**Purpose**: Update trainee information

**Request Headers**:
```
Authorization: Bearer <access_token>
```

**Allowed Roles**: local_admin, trainee (self only)

**Request** (partial update):
```json
{
  "phone": "+63-917-999-8888",
  "street": "456 New Avenue",
  "barangay": "Sta. Ana"
}
```

**Response** - Status 200:
```json
{
  "success": true,
  "data": {
    "id": "trainee-123",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+63-917-999-8888",
    "street": "456 New Avenue",
    "updated_at": "2024-09-20T11:00:00Z"
  },
  "message": "Trainee updated successfully"
}
```

---

## Program Management

### GET /api/programs

**Purpose**: List all programs

**Query Parameters**:
```
?page=1&limit=20&status=active&tenant_id=xyz
```

**Response** - Status 200:
```json
{
  "success": true,
  "data": [
    {
      "id": "program-1",
      "name": "Electrical Installation",
      "description": "Training in electrical installation...",
      "start_date": "2024-10-01",
      "end_date": "2024-11-30",
      "duration_weeks": 4,
      "status": "active",
      "max_trainees": 100,
      "current_enrollment": 89,
      "instructor": "Mr. Jose Santos",
      "type_of_funding": "Government",
      "image_path": "/images/program-1.jpg",
      "created_at": "2024-09-01T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "totalPages": 1
  }
}
```

---

### POST /api/programs

**Purpose**: Create new training program

**Request Headers**:
```
Authorization: Bearer <access_token>
```

**Allowed Roles**: local_admin

**Request**:
```json
{
  "name": "Electrical Installation",
  "description": "Training in electrical installation techniques...",
  "start_date": "2024-10-01",
  "end_date": "2024-11-30",
  "duration_weeks": 4,
  "max_trainees": 100,
  "instructor": "Mr. Jose Santos",
  "type_of_funding": "Government"
}
```

**Response** - Status 201:
```json
{
  "success": true,
  "data": {
    "id": "program-1",
    "name": "Electrical Installation",
    "status": "upcoming",
    "created_at": "2024-09-20T11:30:00Z"
  },
  "message": "Program created successfully"
}
```

---

### PUT /api/programs/:id

**Purpose**: Update program details

**Request Headers**:
```
Authorization: Bearer <access_token>
```

**Allowed Roles**: local_admin

**Request**:
```json
{
  "description": "Updated description",
  "max_trainees": 120
}
```

**Response** - Status 200:
```json
{
  "success": true,
  "data": {
    "id": "program-1",
    "name": "Electrical Installation",
    "max_trainees": 120,
    "updated_at": "2024-09-20T11:45:00Z"
  },
  "message": "Program updated successfully"
}
```

---

## Enrollment Management

### GET /api/enrollments

**Purpose**: List enrollments

**Query Parameters**:
```
?program_id=prog-1&trainee_id=train-1&status=active&page=1
```

**Response** - Status 200:
```json
{
  "success": true,
  "data": [
    {
      "id": "enrollment-1",
      "trainee_id": "trainee-123",
      "trainee_name": "John Doe",
      "program_id": "program-1",
      "program_name": "Electrical Installation",
      "enrollment_date": "2024-09-14",
      "completion_date": null,
      "status": "active",
      "source": "direct",
      "attendance_rate": "87%"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 89,
    "totalPages": 5
  }
}
```

---

### POST /api/enrollments

**Purpose**: Enroll trainee in program

**Request Headers**:
```
Authorization: Bearer <access_token>
```

**Allowed Roles**: local_admin

**Request**:
```json
{
  "trainee_id": "trainee-123",
  "program_id": "program-1",
  "enrollment_date": "2024-10-01"
}
```

**Response** - Status 201:
```json
{
  "success": true,
  "data": {
    "id": "enrollment-1",
    "trainee_id": "trainee-123",
    "program_id": "program-1",
    "status": "enrolled",
    "enrollment_date": "2024-10-01"
  }
}
```

---

## Attendance Management

### GET /api/attendance

**Purpose**: List attendance records

**Query Parameters**:
```
?program_id=prog-1&trainee_id=train-1&date_from=2024-09-01&date_to=2024-09-30
```

**Response** - Status 200:
```json
{
  "success": true,
  "data": [
    {
      "id": "attendance-1",
      "trainee_id": "trainee-123",
      "trainee_name": "John Doe",
      "program_id": "program-1",
      "attendance_date": "2024-09-20",
      "morning_present": true,
      "morning_time_in": "08:45",
      "morning_time_out": "12:00",
      "afternoon_present": true,
      "afternoon_time_in": "13:00",
      "afternoon_time_out": "17:00",
      "status": "present",
      "morning_photo_path": "/photos/attendance-1-morning.jpg",
      "afternoon_photo_path": "/photos/attendance-1-afternoon.jpg"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 234,
    "totalPages": 12
  }
}
```

---

### POST /api/attendance

**Purpose**: Mark trainee attendance

**Request Headers**:
```
Authorization: Bearer <access_token>
```

**Allowed Roles**: trainee, staff_training_coordinator

**Request**:
```json
{
  "trainee_id": "trainee-123",
  "program_id": "program-1",
  "attendance_date": "2024-09-20",
  "morning_present": true,
  "morning_time_in": "08:45",
  "morning_time_out": "12:00",
  "morning_photo_path": "/photos/attendance-1-morning.jpg",
  "afternoon_present": true,
  "afternoon_time_in": "13:00",
  "afternoon_time_out": "17:00",
  "afternoon_photo_path": "/photos/attendance-1-afternoon.jpg"
}
```

**Response** - Status 201:
```json
{
  "success": true,
  "data": {
    "id": "attendance-1",
    "trainee_id": "trainee-123",
    "attendance_date": "2024-09-20",
    "status": "present",
    "created_at": "2024-09-20T09:00:00Z"
  },
  "message": "Attendance marked successfully"
}
```

---

## Certificate Management

### GET /api/certificates

**Purpose**: List certificates

**Query Parameters**:
```
?trainee_id=train-1&program_id=prog-1&page=1
```

**Response** - Status 200:
```json
{
  "success": true,
  "data": [
    {
      "id": "cert-1",
      "trainee_id": "trainee-123",
      "trainee_name": "John Doe",
      "program_id": "program-1",
      "program_name": "Electrical Installation",
      "certificate_number": "CERT-2024-001234",
      "issue_date": "2024-10-31",
      "file_path": "/certificates/cert-1.pdf",
      "verification_url": "https://system-url/verify/abc123xyz"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### POST /api/certificates

**Purpose**: Generate certificates for program completion

**Request Headers**:
```
Authorization: Bearer <access_token>
```

**Allowed Roles**: staff_training_coordinator

**Request**:
```json
{
  "program_id": "program-1",
  "trainee_ids": ["trainee-123", "trainee-456"],
  "signatory_name": "Director Jose Santos",
  "signatory_title": "Training Director"
}
```

**Response** - Status 201:
```json
{
  "success": true,
  "data": {
    "generated_count": 2,
    "failed_count": 0,
    "certificates": [
      {
        "id": "cert-1",
        "trainee_id": "trainee-123",
        "certificate_number": "CERT-2024-001234",
        "status": "generated"
      }
    ]
  },
  "message": "2 certificates generated successfully"
}
```

---

## Inventory Management

### GET /api/items

**Purpose**: List inventory items

**Query Parameters**:
```
?category=tools&status=in_stock&search=drill&page=1
```

**Response** - Status 200:
```json
{
  "success": true,
  "data": [
    {
      "id": "item-1",
      "name": "Drill Kit",
      "description": "Electric drill with accessories",
      "category": "Tools",
      "unit": "Sets",
      "quantity": 5,
      "available_quantity": 3,
      "minimum_quantity": 2,
      "location": "Tool Storage",
      "condition": "Good",
      "status": "in_stock",
      "qr_code": "ITEM-001",
      "image_path": "/images/item-1.jpg"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 287,
    "totalPages": 15
  }
}
```

---

### POST /api/items

**Purpose**: Create new inventory item

**Request Headers**:
```
Authorization: Bearer <access_token>
```

**Allowed Roles**: staff_inventory_manager

**Request**:
```json
{
  "name": "Drill Kit",
  "description": "Electric drill with accessories",
  "category": "Tools",
  "unit": "Sets",
  "quantity": 5,
  "minimum_quantity": 2,
  "location": "Tool Storage",
  "condition": "Good",
  "purchase_date": "2023-06-15"
}
```

**Response** - Status 201:
```json
{
  "success": true,
  "data": {
    "id": "item-1",
    "name": "Drill Kit",
    "qr_code": "ITEM-001",
    "created_at": "2024-09-20T12:00:00Z"
  },
  "message": "Item created successfully"
}
```

---

### GET /api/lendings

**Purpose**: List borrowing/lending records

**Query Parameters**:
```
?status=active&item_id=item-1&overdue=true
```

**Response** - Status 200:
```json
{
  "success": true,
  "data": [
    {
      "id": "lending-1",
      "item_id": "item-1",
      "item_name": "Drill Kit",
      "borrower_name": "John Doe",
      "borrower_contact": "+63-917-123-4567",
      "quantity": 1,
      "lent_date": "2024-09-18",
      "expected_return_date": "2024-09-22",
      "actual_return_date": null,
      "status": "active",
      "days_overdue": null
    }
  ]
}
```

---

### POST /api/lendings

**Purpose**: Record item lending

**Request Headers**:
```
Authorization: Bearer <access_token>
```

**Allowed Roles**: staff_inventory_manager

**Request**:
```json
{
  "item_id": "item-1",
  "borrower_name": "John Doe",
  "borrower_contact": "+63-917-123-4567",
  "quantity": 1,
  "lent_date": "2024-09-18",
  "expected_return_date": "2024-09-22"
}
```

**Response** - Status 201:
```json
{
  "success": true,
  "data": {
    "id": "lending-1",
    "item_id": "item-1",
    "status": "active",
    "created_at": "2024-09-18T10:00:00Z"
  }
}
```

---

## Admin Operations

### GET /api/admin/accounts

**Purpose**: List user accounts (admin only)

**Request Headers**:
```
Authorization: Bearer <access_token>
```

**Allowed Roles**: local_admin, super_admin

**Query Parameters**:
```
?role=staff_training_coordinator&status=active&page=1
```

**Response** - Status 200:
```json
{
  "success": true,
  "data": [
    {
      "id": "user-1",
      "email": "coordinator@example.com",
      "username": "coord_user",
      "role": "staff_training_coordinator",
      "status": "active",
      "created_at": "2024-09-15T10:00:00Z",
      "last_login": "2024-09-20T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### POST /api/admin/accounts

**Purpose**: Create new user account

**Request Headers**:
```
Authorization: Bearer <access_token>
```

**Allowed Roles**: local_admin, super_admin

**Request**:
```json
{
  "email": "coordinator@example.com",
  "username": "coord_user",
  "password": "StrongPass123",
  "role": "staff_training_coordinator",
  "first_name": "Maria",
  "last_name": "Santos"
}
```

**Response** - Status 201:
```json
{
  "success": true,
  "data": {
    "id": "user-1",
    "email": "coordinator@example.com",
    "role": "staff_training_coordinator",
    "created_at": "2024-09-20T13:00:00Z"
  },
  "message": "Account created successfully. Credentials sent to email."
}
```

---

### GET /api/admin/audit-logs

**Purpose**: Get system activity logs

**Request Headers**:
```
Authorization: Bearer <access_token>
```

**Allowed Roles**: local_admin, super_admin

**Query Parameters**:
```
?user_id=user-1&action=CREATE&date_from=2024-09-01&page=1
```

**Response** - Status 200:
```json
{
  "success": true,
  "data": [
    {
      "id": "log-1",
      "user_id": "user-1",
      "user_email": "admin@example.com",
      "action": "CREATE",
      "entity_type": "TRAINEE",
      "entity_id": "trainee-123",
      "entity_name": "John Doe",
      "details": "New trainee profile created",
      "ip_address": "192.168.1.100",
      "created_at": "2024-09-20T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1245,
    "totalPages": 63
  }
}
```

---

## Error Handling

### Common Error Codes

| Status | Code | Meaning |
|--------|------|---------|
| 400 | INVALID_INPUT | Request validation failed |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource already exists |
| 422 | UNPROCESSABLE | Data validation error |
| 429 | TOO_MANY_REQUESTS | Rate limit exceeded |
| 500 | INTERNAL_ERROR | Server error |

### Error Response Example

**Status 400 - Validation Error**:
```json
{
  "success": false,
  "error": "Validation failed",
  "code": "INVALID_INPUT",
  "details": {
    "email": "Email must be a valid format",
    "password": "Password must be at least 8 characters"
  }
}
```

**Status 401 - Authentication Error**:
```json
{
  "success": false,
  "error": "Unauthorized: Invalid or expired token",
  "code": "UNAUTHORIZED"
}
```

**Status 403 - Authorization Error**:
```json
{
  "success": false,
  "error": "Forbidden: Insufficient permissions",
  "code": "FORBIDDEN"
}
```

**Status 404 - Not Found**:
```json
{
  "success": false,
  "error": "Trainee not found",
  "code": "NOT_FOUND"
}
```

---

**Last Updated:** September 2026  
**Documentation Version:** 1.0  
**Topic:** API Reference

[← Back to Main Documentation](./README.md)
