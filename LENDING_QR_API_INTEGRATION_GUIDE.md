# Lending QR Scanner - API Integration Guide

Detailed API documentation for integrating the LendingQRScanner component with backend services.

---

## Table of Contents

1. [Overview](#overview)
2. [Base Setup](#base-setup)
3. [Borrow Workflow API](#borrow-workflow-api)
4. [Return Workflow API](#return-workflow-api)
5. [Error Codes & Handling](#error-codes--handling)
6. [Response Formats](#response-formats)
7. [Request Validation](#request-validation)
8. [Rate Limiting](#rate-limiting)
9. [Authentication](#authentication)
10. [Caching Strategy](#caching-strategy)
11. [Retry Logic](#retry-logic)
12. [Testing](#testing)

---

## Overview

The LendingQRScanner uses three main services to communicate with the backend:

1. **lendingService** - Borrow/return lending operations
2. **inventoryService** - Item lookup and availability
3. **traineeService** - Borrower information

All communication uses REST API with JSON payloads and standard HTTP status codes.

---

## Base Setup

### Service Configuration

```typescript
// Frontend/src/services/lendingService.ts

import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Environment Variables

```bash
# .env or .env.local

REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_API_TIMEOUT=10000
REACT_APP_MAX_RETRIES=3
REACT_APP_RETRY_DELAY=1000
```

---

## Borrow Workflow API

### 1. Load Trainees List

Called on component mount (borrow mode).

#### Request

```typescript
// GET /api/trainees

GET /api/trainees HTTP/1.1
Host: localhost:3000
Authorization: Bearer {token}
Content-Type: application/json
```

#### Implementation

```typescript
export const getTrainees = async (): Promise<Trainee[]> => {
  try {
    const response = await apiClient.get('/trainees');
    return response.data.data || [];
  } catch (error) {
    console.error('Failed to load trainees:', error);
    throw new Error('Unable to load trainees list');
  }
};
```

#### Success Response (200)

```json
{
  "success": true,
  "data": [
    {
      "id": "trainee-uuid-1",
      "name": "Maria Santos",
      "email": "maria@example.com",
      "phone": "09123456789",
      "status": "active",
      "created_at": "2026-01-15T10:00:00Z"
    },
    {
      "id": "trainee-uuid-2",
      "name": "Juan Dela Cruz",
      "email": "juan@example.com",
      "phone": "09987654321",
      "status": "active",
      "created_at": "2026-02-20T14:30:00Z"
    }
  ],
  "message": "Trainees loaded successfully"
}
```

#### Error Response (400)

```json
{
  "success": false,
  "error": "INVALID_REQUEST",
  "message": "Invalid request parameters",
  "details": {
    "errors": []
  }
}
```

#### Error Response (401)

```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Authentication required"
}
```

#### Error Response (500)

```json
{
  "success": false,
  "error": "SERVER_ERROR",
  "message": "Internal server error occurred"
}
```

---

### 2. Get Item Details

Called when QR code is scanned (borrow mode).

#### Request

```typescript
// GET /api/items/{itemId}

GET /api/items/item-uuid-12345 HTTP/1.1
Host: localhost:3000
Authorization: Bearer {token}
Content-Type: application/json
```

#### Implementation

```typescript
export const getInventoryItemById = async (
  itemId: string
): Promise<InventoryItem> => {
  try {
    if (!itemId || !/^[0-9a-f-]{36}$/.test(itemId)) {
      throw new Error('Invalid item ID format');
    }

    const response = await apiClient.get(`/items/${itemId}`);
    
    if (!response.data.data) {
      throw new Error('Item not found');
    }

    return response.data.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Item not found in database');
    }
    throw error;
  }
};
```

#### Success Response (200)

```json
{
  "success": true,
  "data": {
    "id": "item-uuid-12345",
    "name": "Laptop Dell XPS 13",
    "description": "High-performance laptop for development",
    "category": "Electronics",
    "serial_number": "DELL-XPS-001",
    "quantity": 5,
    "available_quantity": 3,
    "status": "available",
    "condition": "good",
    "location": "Storage Room A",
    "qr_code": "https://api.example.com/qr/item-uuid-12345",
    "created_at": "2026-01-10T08:00:00Z",
    "updated_at": "2026-09-08T14:30:00Z"
  },
  "message": "Item retrieved successfully"
}
```

#### Error Response (404)

```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Item not found",
  "code": "ITEM_NOT_FOUND"
}
```

#### Error Response (400 - Invalid UUID)

```json
{
  "success": false,
  "error": "INVALID_REQUEST",
  "message": "Invalid item ID format",
  "code": "INVALID_UUID"
}
```

---

### 3. Create Lending (Borrow)

Core operation: Create lending record and auto-generate borrowing slip.

#### Request

```typescript
// POST /api/lendings

POST /api/lendings HTTP/1.1
Host: localhost:3000
Authorization: Bearer {token}
Content-Type: application/json

{
  "item_id": "item-uuid-12345",
  "trainee_id": "trainee-uuid-1",
  "quantity": 1,
  "expected_return_date": "2026-09-15",
  "notes": "Handle with care, sensitive equipment"
}
```

#### Implementation

```typescript
interface CreateLendingRequest {
  item_id: string;
  trainee_id: string;
  quantity: number;
  expected_return_date: string;
  notes?: string;
}

export const createLending = async (
  data: CreateLendingRequest
): Promise<{
  lending: Lending;
  borrowing_slip: BorrowingSlip;
}> => {
  try {
    // Validate required fields
    if (!data.item_id || !data.trainee_id || !data.quantity || !data.expected_return_date) {
      throw new Error('Missing required fields');
    }

    // Validate quantity is positive
    if (data.quantity < 1) {
      throw new Error('Quantity must be at least 1');
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.expected_return_date)) {
      throw new Error('Invalid date format, use YYYY-MM-DD');
    }

    // Validate date is not in past
    const returnDate = new Date(data.expected_return_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (returnDate < today) {
      throw new Error('Return date cannot be in the past');
    }

    const response = await apiClient.post('/lendings', {
      item_id: data.item_id,
      trainee_id: data.trainee_id,
      quantity: data.quantity,
      expected_return_date: data.expected_return_date,
      notes: data.notes || null,
    });

    return response.data.data;
  } catch (error) {
    if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Validation failed');
    }
    if (error.response?.status === 409) {
      throw new Error('Item quantity conflict - item may have been borrowed');
    }
    throw error;
  }
};
```

#### Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "lending": {
      "id": "lending-uuid-1",
      "item_id": "item-uuid-12345",
      "item": {
        "id": "item-uuid-12345",
        "name": "Laptop Dell XPS 13",
        "serial_number": "DELL-XPS-001"
      },
      "trainee_id": "trainee-uuid-1",
      "trainee": {
        "id": "trainee-uuid-1",
        "name": "Maria Santos",
        "email": "maria@example.com",
        "phone": "09123456789"
      },
      "quantity": 1,
      "status": "active",
      "borrowed_at": "2026-09-08T15:30:00Z",
      "expected_return_date": "2026-09-15",
      "actual_return_date": null,
      "notes": "Handle with care, sensitive equipment",
      "created_by": "staff-uuid-1",
      "updated_at": "2026-09-08T15:30:00Z"
    },
    "borrowing_slip": {
      "id": "slip-uuid-1",
      "slip_number": "SLIP-20260908-001",
      "lending_id": "lending-uuid-1",
      "trainee_name": "Maria Santos",
      "item_name": "Laptop Dell XPS 13",
      "quantity": 1,
      "borrow_date": "2026-09-08",
      "return_date": "2026-09-15",
      "status": "active",
      "qr_code": "https://api.example.com/qr/slip-uuid-1",
      "created_at": "2026-09-08T15:30:00Z"
    }
  },
  "message": "Lending created successfully"
}
```

#### Error Response (400 - Validation Error)

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid request data",
  "code": "INVALID_QUANTITY",
  "details": {
    "field": "quantity",
    "message": "Quantity cannot exceed available inventory"
  }
}
```

#### Error Response (404 - Item Not Found)

```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Item or trainee not found",
  "code": "ITEM_OR_TRAINEE_NOT_FOUND"
}
```

#### Error Response (409 - Conflict)

```json
{
  "success": false,
  "error": "CONFLICT",
  "message": "Item quantity conflict",
  "code": "INSUFFICIENT_QUANTITY",
  "details": {
    "requested": 2,
    "available": 1
  }
}
```

#### Error Response (422 - Unprocessable Entity)

```json
{
  "success": false,
  "error": "UNPROCESSABLE_ENTITY",
  "message": "Invalid return date",
  "code": "INVALID_RETURN_DATE",
  "details": {
    "reason": "Return date cannot be in the past"
  }
}
```

---

## Return Workflow API

### 1. Get Lending Details

Called when lending slip QR is scanned (return mode).

#### Request

```typescript
// GET /api/lendings/{lendingId}

GET /api/lendings/lending-uuid-1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer {token}
Content-Type: application/json
```

#### Implementation

```typescript
export const getLendingById = async (
  lendingId: string
): Promise<Lending> => {
  try {
    if (!lendingId || !/^[0-9a-f-]{36}$/.test(lendingId)) {
      throw new Error('Invalid lending ID format');
    }

    const response = await apiClient.get(`/lendings/${lendingId}`);
    
    if (!response.data.data) {
      throw new Error('Lending not found');
    }

    // Check if already returned
    if (response.data.data.status === 'returned') {
      console.warn('Lending already marked as returned');
    }

    return response.data.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Lending record not found');
    }
    throw error;
  }
};
```

#### Success Response (200)

```json
{
  "success": true,
  "data": {
    "id": "lending-uuid-1",
    "item_id": "item-uuid-12345",
    "item": {
      "id": "item-uuid-12345",
      "name": "Laptop Dell XPS 13",
      "serial_number": "DELL-XPS-001"
    },
    "trainee_id": "trainee-uuid-1",
    "trainee": {
      "id": "trainee-uuid-1",
      "name": "Maria Santos",
      "email": "maria@example.com"
    },
    "quantity": 1,
    "status": "active",
    "borrowed_at": "2026-09-08T15:30:00Z",
    "expected_return_date": "2026-09-15",
    "actual_return_date": null,
    "notes": "Handle with care",
    "overdue": false,
    "days_overdue": 0,
    "created_by": "staff-uuid-1",
    "updated_at": "2026-09-08T15:30:00Z"
  },
  "message": "Lending retrieved successfully"
}
```

#### Error Response (404)

```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Lending not found",
  "code": "LENDING_NOT_FOUND"
}
```

---

### 2. Mark Item as Returned

Core operation: Update lending status and inventory.

#### Request

```typescript
// POST /api/lendings/{lendingId}/return

POST /api/lendings/lending-uuid-1/return HTTP/1.1
Host: localhost:3000
Authorization: Bearer {token}
Content-Type: application/json

{
  "notes": "Item returned in good condition, no damage"
}
```

#### Implementation

```typescript
interface ReturnItemRequest {
  notes?: string;
}

export const returnItem = async (
  lendingId: string,
  data: ReturnItemRequest = {}
): Promise<Lending> => {
  try {
    if (!lendingId || !/^[0-9a-f-]{36}$/.test(lendingId)) {
      throw new Error('Invalid lending ID format');
    }

    const response = await apiClient.post(
      `/lendings/${lendingId}/return`,
      {
        notes: data.notes || null,
        returned_at: new Date().toISOString(),
      }
    );

    return response.data.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Lending not found');
    }
    if (error.response?.status === 409) {
      throw new Error('Lending already returned');
    }
    if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Failed to return item');
    }
    throw error;
  }
};
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "lending-uuid-1",
    "item_id": "item-uuid-12345",
    "item": {
      "id": "item-uuid-12345",
      "name": "Laptop Dell XPS 13",
      "serial_number": "DELL-XPS-001"
    },
    "trainee_id": "trainee-uuid-1",
    "trainee": {
      "id": "trainee-uuid-1",
      "name": "Maria Santos"
    },
    "quantity": 1,
    "status": "returned",
    "borrowed_at": "2026-09-08T15:30:00Z",
    "expected_return_date": "2026-09-15",
    "actual_return_date": "2026-09-14T10:00:00Z",
    "returned_by": "staff-uuid-2",
    "notes": "Item returned in good condition, no damage",
    "updated_at": "2026-09-14T10:00:00Z"
  },
  "message": "Item returned successfully"
}
```

#### Error Response (404)

```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Lending not found",
  "code": "LENDING_NOT_FOUND"
}
```

#### Error Response (409 - Already Returned)

```json
{
  "success": false,
  "error": "CONFLICT",
  "message": "Item already returned",
  "code": "ALREADY_RETURNED",
  "details": {
    "returned_at": "2026-09-13T14:00:00Z",
    "returned_by": "staff-uuid-1"
  }
}
```

#### Error Response (400 - Invalid State)

```json
{
  "success": false,
  "error": "INVALID_STATE",
  "message": "Cannot return item in current state",
  "code": "INVALID_LENDING_STATUS"
}
```

---

## Error Codes & Handling

### Complete Error Code Reference

| Code | Status | Meaning | Retry? | User Message |
|------|--------|---------|--------|--------------|
| INVALID_REQUEST | 400 | Malformed request | No | "Invalid request parameters" |
| VALIDATION_ERROR | 400 | Field validation failed | No | Field-specific error |
| INVALID_QUANTITY | 400 | Quantity out of range | No | "Invalid quantity" |
| INVALID_UUID | 400 | UUID format invalid | No | "Invalid QR code format" |
| INVALID_RETURN_DATE | 422 | Date in past | No | "Date must be in future" |
| UNAUTHORIZED | 401 | Auth token missing/invalid | Yes | "Authentication required" |
| FORBIDDEN | 403 | User lacks permission | No | "You don't have permission" |
| NOT_FOUND | 404 | Resource not found | No | "Item/Lending not found" |
| ITEM_NOT_FOUND | 404 | Item doesn't exist | No | "Item not found" |
| LENDING_NOT_FOUND | 404 | Lending doesn't exist | No | "Lending not found" |
| CONFLICT | 409 | State conflict | No | "Item already borrowed" |
| INSUFFICIENT_QUANTITY | 409 | Not enough inventory | No | "Insufficient quantity" |
| ALREADY_RETURNED | 409 | Already returned | No | "Already returned" |
| SERVER_ERROR | 500 | Backend error | Yes | "Server error, please retry" |
| DATABASE_ERROR | 500 | DB operation failed | Yes | "Database error, please retry" |
| TIMEOUT | 504 | Request timeout | Yes | "Request timeout, retry" |

### Error Handling in Component

```typescript
const handleError = (error: any) => {
  if (axios.isAxiosError(error)) {
    const code = error.response?.data?.code;
    const message = error.response?.data?.message;

    switch (code) {
      case 'ITEM_NOT_FOUND':
        toast.error('Item not found. QR code may be outdated.');
        return;
      
      case 'LENDING_NOT_FOUND':
        toast.error('Lending record not found.');
        return;
      
      case 'ALREADY_RETURNED':
        toast.error('This item was already returned on ' + formatDate(error.response?.data?.details?.returned_at));
        return;
      
      case 'INSUFFICIENT_QUANTITY':
        toast.error(`Not enough inventory. Available: ${error.response?.data?.details?.available}`);
        return;
      
      case 'INVALID_QUANTITY':
        toast.error('Please enter a valid quantity.');
        return;
      
      case 'UNAUTHORIZED':
        // Redirect to login
        window.location.href = '/login';
        return;
      
      case 'SERVER_ERROR':
      case 'DATABASE_ERROR':
      case 'TIMEOUT':
        // Offer retry
        toast.error(message, {
          action: {
            label: 'Retry',
            onClick: retryLastOperation,
          },
        });
        return;
      
      default:
        toast.error(message || 'An error occurred');
    }
  } else {
    toast.error('Network error. Check your connection.');
  }
};
```

---

## Response Formats

### Standard Success Response

```typescript
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message: string;
  timestamp?: string;
}
```

Example:
```json
{
  "success": true,
  "data": { /* actual data */ },
  "message": "Operation successful",
  "timestamp": "2026-09-08T15:30:00Z"
}
```

### Standard Error Response

```typescript
interface ApiErrorResponse {
  success: false;
  error: string;      // Error type
  message: string;    // User-friendly message
  code?: string;      // Error code for handling
  details?: any;      // Additional error details
  timestamp?: string;
}
```

Example:
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Quantity exceeds available inventory",
  "code": "INSUFFICIENT_QUANTITY",
  "details": {
    "requested": 5,
    "available": 2,
    "field": "quantity"
  },
  "timestamp": "2026-09-08T15:30:00Z"
}
```

---

## Request Validation

### Client-Side Validation (Before API Call)

```typescript
const validateBorrowRequest = (data: CreateLendingRequest): string[] => {
  const errors: string[] = [];

  // Item validation
  if (!data.item_id) {
    errors.push('Please scan an item');
  } else if (!isValidUUID(data.item_id)) {
    errors.push('Invalid item QR code');
  }

  // Trainee validation
  if (!data.trainee_id) {
    errors.push('Please select a trainee');
  }

  // Quantity validation
  if (!data.quantity || data.quantity < 1) {
    errors.push('Quantity must be at least 1');
  }

  // Date validation
  if (!data.expected_return_date) {
    errors.push('Please set a return date');
  } else {
    const returnDate = new Date(data.expected_return_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (returnDate < today) {
      errors.push('Return date cannot be in the past');
    }
  }

  return errors;
};

// Usage in component
const handleCreateLending = async () => {
  const errors = validateBorrowRequest({
    item_id: scannedItem?.item.id,
    trainee_id: selectedTraineeId,
    quantity: parseInt(borrowQuantity),
    expected_return_date: borrowDueDate,
    notes: borrowNotes,
  });

  if (errors.length > 0) {
    errors.forEach(err => toast.error(err));
    return;
  }

  // Proceed with API call
  await createLending({ /* ... */ });
};
```

### Server-Side Validation (Backend Responsibility)

```
1. Validate all required fields present
2. Validate UUID formats
3. Verify item exists and available quantity >= requested
4. Verify trainee exists and is active
5. Verify user has permission to create lending
6. Verify return date is not in past
7. Verify no duplicate lending in progress
8. Check business rules (max items per trainee, etc)
```

---

## Rate Limiting

### Backend Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1694188200
```

### Handling Rate Limits

```typescript
import axios from 'axios';

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const resetTime = parseInt(error.response.headers['x-ratelimit-reset']);
      
      const waitSeconds = retryAfter || Math.ceil((resetTime - Date.now()) / 1000);
      
      toast.error(`Rate limited. Please wait ${waitSeconds} seconds before retrying.`);
      
      // Store retry time
      sessionStorage.setItem('apiRetryAfter', String(resetTime));
    }
    return Promise.reject(error);
  }
);
```

### Client-Side Rate Limit Prevention

```typescript
// Debounce QR detection (minimum 2 second cooldown)
const cooldownRef = useRef(false);

const handleQRDetected = async (qrData: string) => {
  if (cooldownRef.current) return;
  
  cooldownRef.current = true;
  setTimeout(() => {
    cooldownRef.current = false;
  }, 2000);

  // Process QR
  await processQR(qrData);
};
```

---

## Authentication

### Bearer Token Format

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Management

```typescript
// Store token after login
const login = (token: string) => {
  localStorage.setItem('authToken', token);
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// Clear token on logout
const logout = () => {
  localStorage.removeItem('authToken');
  delete apiClient.defaults.headers.common['Authorization'];
};

// Refresh token on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const newToken = await refreshAuthToken();
        localStorage.setItem('authToken', newToken);
        
        // Retry original request
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return apiClient.request(error.config);
      } catch (refreshError) {
        // Redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

---

## Caching Strategy

### In-Memory Cache for Trainees

```typescript
let traineesCache: Trainee[] | null = null;
let traineesCacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getTrainees = async (forceRefresh = false): Promise<Trainee[]> => {
  const now = Date.now();
  
  // Return cached if fresh and not forced refresh
  if (!forceRefresh && traineesCache && (now - traineesCacheTime) < CACHE_DURATION) {
    return traineesCache;
  }

  const response = await apiClient.get('/trainees');
  traineesCache = response.data.data;
  traineesCacheTime = now;
  
  return traineesCache;
};
```

### No Caching for Item Lookups

Item availability can change rapidly, so each scan queries fresh data:

```typescript
export const getInventoryItemById = async (itemId: string): Promise<InventoryItem> => {
  // Always fetch fresh - no caching
  const response = await apiClient.get(`/items/${itemId}`);
  return response.data.data;
};
```

---

## Retry Logic

### Exponential Backoff Retry

```typescript
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,  // 1 second
  maxDelay: 10000,  // 10 seconds
};

export const withRetry = async <T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> => {
  const { maxRetries, baseDelay, maxDelay } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on 4xx errors (except 408, 429)
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status && status >= 400 && status < 500) {
          if (status !== 408 && status !== 429) {
            throw error; // Don't retry
          }
        }
      }

      // Retry with exponential backoff
      if (attempt < maxRetries) {
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt),
          maxDelay
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

// Usage
const response = await withRetry(
  () => apiClient.get(`/items/${itemId}`),
  { maxRetries: 3 }
);
```

---

## Testing

### Unit Tests for Services

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as lendingService from '../lendingService';
import apiClient from '../apiClient';

vi.mock('../apiClient');

describe('lendingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createLending', () => {
    it('should create lending successfully', async () => {
      const mockResponse = {
        data: {
          lending: { id: 'lending-1' },
          borrowing_slip: { slip_number: 'SLIP-001' },
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await lendingService.createLending({
        item_id: 'item-1',
        trainee_id: 'trainee-1',
        quantity: 1,
        expected_return_date: '2026-09-15',
      });

      expect(result).toEqual(mockResponse.data);
      expect(apiClient.post).toHaveBeenCalledWith('/lendings', expect.any(Object));
    });

    it('should throw on validation error', async () => {
      const error = new Error('Validation failed');
      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(
        lendingService.createLending({
          item_id: 'item-1',
          trainee_id: 'trainee-1',
          quantity: 0, // Invalid
          expected_return_date: '2026-09-15',
        })
      ).rejects.toThrow();
    });
  });

  describe('returnItem', () => {
    it('should mark item as returned', async () => {
      const mockResponse = {
        data: {
          id: 'lending-1',
          status: 'returned',
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await lendingService.returnItem('lending-1', {
        notes: 'Returned in good condition',
      });

      expect(result.status).toBe('returned');
    });
  });

  describe('getInventoryItemById', () => {
    it('should fetch item details', async () => {
      const mockItem = {
        id: 'item-1',
        name: 'Laptop',
        available_quantity: 3,
      };

      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: mockItem },
      });

      const result = await lendingService.getInventoryItemById('item-1');

      expect(result).toEqual(mockItem);
    });

    it('should throw on invalid UUID', async () => {
      await expect(
        lendingService.getInventoryItemById('invalid-uuid')
      ).rejects.toThrow();
    });
  });
});
```

### Integration Tests

```typescript
describe('Lending QR Scanner - API Integration', () => {
  it('should complete borrow workflow', async () => {
    // 1. Get trainees
    const trainees = await getTrainees();
    expect(trainees.length).toBeGreaterThan(0);

    // 2. Get item
    const item = await getInventoryItemById('item-uuid-1');
    expect(item.available_quantity).toBeGreaterThan(0);

    // 3. Create lending
    const { lending, borrowing_slip } = await createLending({
      item_id: item.id,
      trainee_id: trainees[0].id,
      quantity: 1,
      expected_return_date: '2026-09-15',
    });

    expect(lending.status).toBe('active');
    expect(borrowing_slip.slip_number).toBeDefined();
  });

  it('should complete return workflow', async () => {
    // 1. Get lending
    const lending = await getLendingById('lending-uuid-1');
    expect(lending.status).toBe('active');

    // 2. Return item
    const updated = await returnItem(lending.id, {
      notes: 'Returned in good condition',
    });

    expect(updated.status).toBe('returned');
    expect(updated.actual_return_date).toBeDefined();
  });
});
```

---

## Summary

**Key Points:**

1. **Three main services** - Lending, Inventory, Trainee
2. **RESTful API** - Standard HTTP methods and status codes
3. **Comprehensive error codes** - Handle all edge cases
4. **Client validation** - Fast user feedback
5. **Server validation** - Data integrity
6. **Caching strategy** - Cache trainees, not items
7. **Retry logic** - Exponential backoff for transient failures
8. **Testing coverage** - Unit and integration tests

**Always:**
- Validate input before API calls
- Handle errors gracefully
- Show user-friendly messages
- Implement retry logic
- Cache when appropriate
- Test thoroughly
